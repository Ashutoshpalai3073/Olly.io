import { getAccessToken } from './supabase';

// ── Types ──────────────────────────────────────────────────────

export interface StreamCallbacks {
  onChunk:    (text: string) => void;
  onEvent?:   (name: string, data: unknown) => void;
  onComplete: (fullText: string) => void;
  onError:    (error: string) => void;
}

export interface StreamHandle {
  cancel: () => void;
}

const MAX_RETRIES = 3;

// ── Internal reader ────────────────────────────────────────────

async function readStream(
  body: ReadableStream<Uint8Array>,
  callbacks: StreamCallbacks,
  signal: AbortSignal,
): Promise<string> {
  const reader  = body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer      = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done || signal.aborted) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by double-newline
      const parts = buffer.split(/\n\n/);
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const lines = part.split('\n');
        let eventName = 'message';
        let data      = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            data = line.slice(5).trim();
          }
        }

        if (!data || data === '[DONE]') continue;

        if (eventName === 'message' || eventName === 'chunk') {
          // Plain text chunk — Groq streams raw text delta
          let text = data;
          try {
            const json = JSON.parse(data) as Record<string, unknown>;
            // Handle OpenAI-compatible chunk format
            const delta = (json as { choices?: Array<{ delta?: { content?: string } }> })
              .choices?.[0]?.delta?.content;
            if (delta !== undefined) text = delta;
          } catch { /* raw text chunk */ }

          accumulated += text;
          callbacks.onChunk(text);
        } else {
          // Named event (e.g. "tags", "metadata")
          try {
            callbacks.onEvent?.(eventName, JSON.parse(data));
          } catch {
            callbacks.onEvent?.(eventName, data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Establishes a POST-based SSE connection using fetch + ReadableStream.
 * Compatible with Vercel serverless streaming.
 * Retries up to MAX_RETRIES times with exponential back-off on network errors.
 */
export function createEventSource(
  url: string,
  body: Record<string, unknown>,
  callbacks: StreamCallbacks,
): StreamHandle {
  const controller = new AbortController();
  let cancelled    = false;

  const run = async (attempt: number) => {
    if (cancelled) return;

    try {
      const token = await getAccessToken();

      const response = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept:         'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:   JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const text = await response.text();
          const json = JSON.parse(text) as Record<string, unknown>;
          errMsg = (json.error as string) ?? errMsg;
        } catch { /* ignore */ }

        // Retry on 5xx or 429
        if ((response.status >= 500 || response.status === 429) && attempt < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const waitSec = retryAfter ? Number(retryAfter) : delay / 1000;
            callbacks.onError(`Olly is busy, retrying in ${Math.round(waitSec)}s…`);
            await new Promise(r => setTimeout(r, waitSec * 1000));
          } else {
            await new Promise(r => setTimeout(r, delay));
          }
          return run(attempt + 1);
        }

        callbacks.onError(errMsg);
        return;
      }

      if (!response.body) {
        callbacks.onError('No response body');
        return;
      }

      const fullText = await readStream(response.body, callbacks, controller.signal);
      if (!cancelled) callbacks.onComplete(fullText);

    } catch (err: unknown) {
      if (cancelled || (err instanceof Error && err.name === 'AbortError')) return;

      const msg = err instanceof Error ? err.message : 'Network error';

      if (attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise(r => setTimeout(r, delay));
        return run(attempt + 1);
      }

      callbacks.onError(msg);
    }
  };

  run(0);

  return {
    cancel: () => {
      cancelled = true;
      controller.abort();
    },
  };
}
