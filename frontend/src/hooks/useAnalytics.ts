import { useMemo } from 'react';
import { useReviewStore, useAuthStore } from '../store';
import { MOCK_REVIEWS, MOCK_RESPONSES, USE_MOCK_DATA } from '../lib/mockData';
import {
  computeResponseRate,
  computeTimeSaved,
  computeRatingTrend,
  computeRatingDistribution,
  computePlatformStats,
  computeAvgResponseTime,
  groupByDate,
  extractTopTags,
} from '../lib/analytics';
import type { DBReview, DBResponse } from '../lib/supabase';

export type DateRange = 7 | 30 | 90 | 365;

export interface AnalyticsResult {
  reviews:          DBReview[];
  responses:        DBResponse[];
  totalReviews:     number;
  totalResponses:   number;
  responseRate:     number;
  avgResponseTime:  number;
  timeSaved:        ReturnType<typeof computeTimeSaved>;
  positiveSentiment: number;
  ratingTrend:      ReturnType<typeof computeRatingTrend>;
  ratingDist:       Record<number, number>;
  platformStats:    ReturnType<typeof computePlatformStats>;
  reviewsOverTime:  { date: string; count: number }[];
  responsesOverTime: { date: string; count: number }[];
  topComplaints:    { tag: string; count: number }[];
  topPraises:       { tag: string; count: number }[];
}

export function useAnalytics(range: DateRange = 30): AnalyticsResult {
  const storeReviews = useReviewStore(s => s.reviews);
  const profile      = useAuthStore(s => s.profile);

  return useMemo(() => {
    // In mock mode, use all mock data; otherwise use what the store loaded.
    const allReviews: DBReview[]   = USE_MOCK_DATA ? MOCK_REVIEWS   : storeReviews;
    const allResponses: DBResponse[] = USE_MOCK_DATA ? MOCK_RESPONSES : [];

    // Filter by the active profile so we don't mix brands in mock mode.
    const userId = profile?.id;
    const reviews  = userId ? allReviews.filter(r => r.user_id === userId)  : allReviews;
    const responses = userId ? allResponses.filter(r => r.user_id === userId) : allResponses;

    // Date window
    const cutoff = Date.now() - range * 86_400_000;
    const inRange = (ts: string) => new Date(ts).getTime() >= cutoff;

    const windowReviews  = reviews.filter(r => inRange(r.review_date));
    const windowResponses = responses.filter(r => r.posted_at && inRange(r.posted_at));

    const totalReviews   = windowReviews.length;
    const totalResponses = windowResponses.length;

    const responseRate    = computeResponseRate(windowReviews, windowResponses);
    const timeSaved       = computeTimeSaved(totalResponses);
    const avgResponseTime = computeAvgResponseTime(windowReviews, windowResponses);

    const positive = windowReviews.filter(r => r.rating >= 4).length;
    const positiveSentiment = totalReviews > 0 ? Math.round((positive / totalReviews) * 100) : 0;

    const ratingTrend = computeRatingTrend(reviews, range);
    const ratingDist  = computeRatingDistribution(windowReviews);
    const platformStats = computePlatformStats(reviews, responses);

    const reviewsOverTime   = groupByDate(windowReviews  as unknown as Array<Record<string, unknown>>, 'review_date', range);
    const responsesOverTime = groupByDate(windowResponses as unknown as Array<Record<string, unknown>>, 'posted_at',   range);

    const topComplaints = extractTopTags(reviews, 'complaints', 8);
    const topPraises    = extractTopTags(reviews, 'praises',    8);

    return {
      reviews, responses,
      totalReviews, totalResponses,
      responseRate, avgResponseTime, timeSaved, positiveSentiment,
      ratingTrend, ratingDist, platformStats,
      reviewsOverTime, responsesOverTime,
      topComplaints, topPraises,
    };
  }, [storeReviews, profile, range]);
}
