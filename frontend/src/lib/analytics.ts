import type { DBReview, DBResponse } from './supabase';

// ── Types ──────────────────────────────────────────────────────

export interface DatePoint { date: string; count: number }
export interface TagCount  { tag: string;  count: number }
export interface RatingTrend {
  current:   number;
  previous:  number;
  delta:     number;
  direction: 'up' | 'down' | 'same';
}
export interface TimeSaved { hours: number; minutes: number; formatted: string }

// ── Helpers ────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

// ── Public API ─────────────────────────────────────────────────

/**
 * What percentage of reviews have an associated posted response.
 */
export function computeResponseRate(
  reviews: DBReview[],
  responses: DBResponse[],
): number {
  if (reviews.length === 0) return 0;
  const respondedIds = new Set(
    responses.filter(r => r.is_active).map(r => r.review_id),
  );
  const posted = reviews.filter(r => r.status === 'posted' || respondedIds.has(r.id));
  return Math.round((posted.length / reviews.length) * 100);
}

/**
 * Estimate time saved based on 8-min average per manual response.
 */
export function computeTimeSaved(responseCount: number): TimeSaved {
  const totalMins = responseCount * 8;
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  const formatted =
    hours > 0 ? `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min` : `${minutes} min`;
  return { hours, minutes, formatted };
}

/**
 * Compare avg rating for the last `days` vs the prior `days` period.
 */
export function computeRatingTrend(reviews: DBReview[], days: number): RatingTrend {
  const now    = Date.now();
  const msDay  = 86_400_000;
  const cutoff = now - days * msDay;
  const prev   = now - 2 * days * msDay;

  const inWindow = (ts: string, from: number, to: number) => {
    const t = new Date(ts).getTime();
    return t >= from && t < to;
  };

  const current = reviews.filter(r => inWindow(r.review_date, cutoff, now));
  const previous = reviews.filter(r => inWindow(r.review_date, prev, cutoff));

  const avg = (arr: DBReview[]) =>
    arr.length ? arr.reduce((s, r) => s + r.rating, 0) / arr.length : 0;

  const cAvg = avg(current);
  const pAvg = avg(previous);
  const delta = Math.round((cAvg - pAvg) * 10) / 10;

  return {
    current:   Math.round(cAvg * 10) / 10,
    previous:  Math.round(pAvg * 10) / 10,
    delta,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same',
  };
}

/**
 * Bucket items by date (using a date field), returning one entry per day
 * for the last `days` days, filling gaps with 0.
 */
export function groupByDate(
  items: Array<Record<string, unknown>>,
  dateField: string,
  days: number,
): DatePoint[] {
  const cutoff = daysAgo(days);
  const counts: Record<string, number> = {};

  for (const item of items) {
    const raw = item[dateField];
    if (typeof raw !== 'string') continue;
    const d = startOfDay(new Date(raw));
    if (d < cutoff) continue;
    const key = toISODate(d);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const result: DatePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = toISODate(d);
    result.push({ date: key, count: counts[key] ?? 0 });
  }
  return result;
}

/**
 * Extract top N complaint or praise tags from reviews.
 */
export function extractTopTags(
  reviews: DBReview[],
  type: 'complaints' | 'praises',
  limit: number,
): TagCount[] {
  const counts: Record<string, number> = {};
  for (const r of reviews) {
    for (const tag of r.tags[type] ?? []) {
      const key = tag.toLowerCase().trim();
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Rating distribution: count of reviews per star (1–5).
 */
export function computeRatingDistribution(reviews: DBReview[]): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) dist[r.rating]++;
  }
  return dist;
}

/**
 * Per-platform stats: review count, response rate, avg rating.
 */
export function computePlatformStats(
  reviews: DBReview[],
  responses: DBResponse[],
): Array<{ platform: string; reviewCount: number; responseRate: number; avgRating: number }> {
  const byPlatform: Record<string, DBReview[]> = {};
  for (const r of reviews) {
    (byPlatform[r.platform] ??= []).push(r);
  }
  const respondedIds = new Set(responses.filter(r => r.is_active).map(r => r.review_id));

  return Object.entries(byPlatform).map(([platform, pReviews]) => {
    const responded = pReviews.filter(r => r.status === 'posted' || respondedIds.has(r.id)).length;
    const avgRating = Math.round(
      (pReviews.reduce((s, r) => s + r.rating, 0) / pReviews.length) * 10,
    ) / 10;
    return {
      platform,
      reviewCount:  pReviews.length,
      responseRate: Math.round((responded / pReviews.length) * 100),
      avgRating,
    };
  });
}

/**
 * Average hours between review_date and response posted_at for posted responses.
 */
export function computeAvgResponseTime(
  reviews: DBReview[],
  responses: DBResponse[],
): number {
  const reviewMap = new Map(reviews.map(r => [r.id, r]));
  let totalMs = 0;
  let count   = 0;

  for (const res of responses) {
    if (!res.posted_at) continue;
    const review = reviewMap.get(res.review_id);
    if (!review) continue;
    const diff = new Date(res.posted_at).getTime() - new Date(review.review_date).getTime();
    if (diff > 0) { totalMs += diff; count++; }
  }

  if (count === 0) return 0;
  return Math.round(totalMs / count / 3_600_000); // hours
}
