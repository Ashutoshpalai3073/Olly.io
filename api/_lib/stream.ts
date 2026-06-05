import type { VercelResponse } from '@vercel/node';

type GroqChunk = {
  choices: Array<{
    delta: {
      content?: string | null;
    };
  }>;
};

export function initSse(res: VercelResponse): void {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

export function sseChunk(res: VercelResponse, data: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function sseEvent(
  res: VercelResponse,
  event: string,
  data: Record<string, unknown>
): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function sseDone(res: VercelResponse): void {
  res.write('event: done\ndata: {}\n\n');
  res.end();
}

export function sseError(res: VercelResponse, message: string, code?: number): void {
  res.write(`event: error\ndata: ${JSON.stringify({ error: message, code })}\n\n`);
  res.end();
}

export async function streamGroqToSse(
  res: VercelResponse,
  stream: AsyncIterable<GroqChunk>
): Promise<string> {
  let fullText = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      fullText += delta;
      sseChunk(res, { content: delta });
    }
  }

  return fullText;
}

export function emitTextAsChunks(
  res: VercelResponse,
  text: string,
  wordsPerChunk = 6
): void {
  const words = text.split(' ');
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const slice = words.slice(i, i + wordsPerChunk);
    const chunk = slice.join(' ') + (i + wordsPerChunk < words.length ? ' ' : '');
    sseChunk(res, { content: chunk });
  }
}

export function handleGroqError(
  err: unknown,
  res: VercelResponse,
  streaming: boolean
): void {
  const error = err as {
    status?: number;
    message?: string;
    headers?: { get?: (k: string) => string | null };
  };

  const message = error.message ?? 'AI service error';
  const status = error.status ?? 500;

  if (status === 429) {
    const retryAfter = parseInt(error.headers?.get?.('retry-after') ?? '60', 10);
    if (streaming) {
      sseError(res, 'Rate limit exceeded. Please try again later.', 429);
    } else {
      res.status(429).json({ error: 'Rate limit exceeded', retryAfter });
    }
    return;
  }

  if (streaming) {
    sseError(res, message, status);
  } else {
    res.status(status < 400 || status > 599 ? 500 : status).json({ error: message });
  }
}
