// Character limits enforced by each review platform's public API / UI.
// Keep in sync with PLATFORM_CHAR_LIMITS in api/_lib/groq.ts.
export const PLATFORM_LIMITS: Record<string, number> = {
  google:      4096,
  tripadvisor: 2200,
  zomato:      2000,
  swiggy:      1500,
}

const DEFAULT_LIMIT = 2000

function limitFor(platform: string): number {
  return PLATFORM_LIMITS[platform.toLowerCase()] ?? DEFAULT_LIMIT
}

export function isOverLimit(platform: string, text: string): boolean {
  return text.length > limitFor(platform)
}

export function getOverageAmount(platform: string, text: string): number {
  return Math.max(0, text.length - limitFor(platform))
}

export function getCharCount(platform: string, text: string): { count: number; limit: number; remaining: number; over: boolean } {
  const limit = limitFor(platform)
  const count = text.length
  return { count, limit, remaining: limit - count, over: count > limit }
}

export function truncateToLimit(platform: string, text: string): string {
  const limit = limitFor(platform)
  if (text.length <= limit) return text
  return text.slice(0, limit - 3) + '...'
}
