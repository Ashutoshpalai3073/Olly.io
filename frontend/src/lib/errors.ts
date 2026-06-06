// ── AppError ──────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean = false,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ── API response parser ────────────────────────────────────────

export function handleApiError(response: Response, bodyText?: string): AppError {
  const status = response.status;
  let message = `HTTP ${status}`;

  try {
    if (bodyText) {
      const json = JSON.parse(bodyText) as Record<string, unknown>;
      message = (json.error as string) ?? (json.message as string) ?? message;
    }
  } catch { /* body wasn't JSON */ }

  if (status === 429) {
    return new AppError('RATE_LIMIT', message || 'Too many requests', true, status);
  }
  if (status >= 500) {
    return new AppError('SERVER_ERROR', message || 'Server error', true, status);
  }
  if (status === 401 || status === 403) {
    return new AppError('AUTH_ERROR', message || 'Not authorised', false, status);
  }
  if (status === 404) {
    return new AppError('NOT_FOUND', message || 'Not found', false, status);
  }
  return new AppError('API_ERROR', message, false, status);
}

// ── Error predicates ───────────────────────────────────────────

export function isRateLimitError(err: unknown): boolean {
  return err instanceof AppError && err.code === 'RATE_LIMIT';
}

export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes('Failed to fetch') ||
    err.message.includes('NetworkError') ||
    err.message.includes('network')
  );
}

export function isRetryable(err: unknown): boolean {
  if (err instanceof AppError) return err.retryable;
  if (isNetworkError(err)) return true;
  return false;
}

// ── Exponential back-off ───────────────────────────────────────

export function getRetryDelay(attempt: number): number {
  // 1s → 2s → 4s, capped at 8s
  return Math.min(1000 * Math.pow(2, attempt), 8000);
}

// ── Rate-limit countdown parser ────────────────────────────────

export function parseRetryAfter(response: Response): number {
  const header = response.headers.get('Retry-After');
  if (!header) return 5;
  const n = Number(header);
  return Number.isFinite(n) ? n : 5;
}

// ── User-facing message ────────────────────────────────────────

export function toUserMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error)    return err.message;
  return 'An unexpected error occurred';
}
