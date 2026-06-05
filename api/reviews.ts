import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, verifyJwt, getUserProfile } from './_lib/supabase';
import { handleCors } from './_lib/cors';

interface ReviewFilters {
  page?: number;
  per_page?: number;
  platform?: string;
  rating?: number;
  sentiment?: string;
  status?: string;
  location_id?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  has_response?: boolean | null;
  is_flagged?: boolean | null;
  is_starred?: boolean | null;
  date_start?: string;
  date_end?: string;
}

function parseBool(value: unknown): boolean | null {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return null;
}

async function handleGet(req: VercelRequest, res: VercelResponse, brandId: string, locationIds: string[]) {
  const q = req.query as Record<string, string>;

  const filters: ReviewFilters = {
    page: Math.max(1, parseInt(q.page ?? '1', 10)),
    per_page: Math.min(100, Math.max(1, parseInt(q.per_page ?? '20', 10))),
    platform: q.platform,
    rating: q.rating ? parseInt(q.rating, 10) : undefined,
    sentiment: q.sentiment,
    status: q.status,
    location_id: q.location_id,
    search: q.search,
    sort_by: q.sort_by ?? 'review_date',
    sort_order: (q.sort_order as 'asc' | 'desc') ?? 'desc',
    has_response: parseBool(q.has_response),
    is_flagged: parseBool(q.is_flagged),
    is_starred: parseBool(q.is_starred),
    date_start: q.date_start,
    date_end: q.date_end,
  };

  const page = filters.page!;
  const perPage = filters.per_page!;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const admin = getSupabaseAdmin();
  let query = admin
    .from('reviews')
    .select('*, tags(*)', { count: 'exact' })
    .eq('brand_id', brandId);

  if (filters.location_id && filters.location_id !== 'all') {
    if (!locationIds.includes(filters.location_id)) {
      return res.status(403).json({ error: 'Access denied to this location' });
    }
    query = query.eq('location_id', filters.location_id);
  } else if (locationIds.length > 0) {
    query = query.in('location_id', locationIds);
  }

  if (filters.platform && filters.platform !== 'all') {
    query = query.eq('platform', filters.platform);
  }
  if (filters.rating != null && !isNaN(filters.rating)) {
    query = query.eq('rating', filters.rating);
  }
  if (filters.sentiment && filters.sentiment !== 'all') {
    query = query.eq('sentiment', filters.sentiment);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.has_response != null) {
    query = query.eq('has_response', filters.has_response);
  }
  if (filters.is_flagged != null) {
    query = query.eq('is_flagged', filters.is_flagged);
  }
  if (filters.is_starred != null) {
    query = query.eq('is_starred', filters.is_starred);
  }
  if (filters.date_start) {
    query = query.gte('review_date', filters.date_start);
  }
  if (filters.date_end) {
    query = query.lte('review_date', filters.date_end);
  }
  if (filters.search) {
    query = query.ilike('review_text', `%${filters.search}%`);
  }

  const sortColumn = ['review_date', 'rating', 'created_at'].includes(filters.sort_by ?? '')
    ? filters.sort_by!
    : 'review_date';
  query = query.order(sortColumn, { ascending: filters.sort_order === 'asc' });

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return res.status(200).json({
    data,
    pagination: {
      page,
      per_page: perPage,
      total: count ?? 0,
      total_pages: totalPages,
    },
  });
}

async function handlePost(req: VercelRequest, res: VercelResponse, userId: string, brandId: string) {
  const body = req.body as Record<string, unknown>;

  if (!body.platform || !body.review_text || !body.rating || !body.location_id) {
    return res.status(400).json({ error: 'Missing required fields: platform, review_text, rating, location_id' });
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('reviews')
    .insert({
      ...body,
      brand_id: brandId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ data });
}

async function handlePatch(req: VercelRequest, res: VercelResponse, brandId: string) {
  const body = req.body as Record<string, unknown>;

  if (!body.id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  const allowedFields = ['status', 'is_flagged', 'flag_reason', 'is_starred', 'owner_response_text', 'has_response', 'response_id'];
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const field of allowedFields) {
    if (field in body) {
      updatePayload[field] = body[field];
    }
  }

  if (Object.keys(updatePayload).length === 1) {
    return res.status(400).json({ error: 'No updatable fields provided' });
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('reviews')
    .update(updatePayload)
    .eq('id', body.id)
    .eq('brand_id', brandId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Review not found or access denied' });
    }
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (!['GET', 'POST', 'PATCH'].includes(req.method ?? '')) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await verifyJwt(req.headers.authorization);
  if (authError || !user) {
    return res.status(401).json({ error: authError ?? 'Unauthorized' });
  }

  const { profile, error: profileError } = await getUserProfile(user.id);
  if (profileError || !profile) {
    return res.status(403).json({ error: 'Profile not found. Please complete setup.' });
  }
  if (!profile.brand_id) {
    return res.status(403).json({ error: 'No brand associated with this account' });
  }

  try {
    if (req.method === 'GET') {
      return await handleGet(req, res, profile.brand_id, profile.location_ids ?? []);
    }
    if (req.method === 'POST') {
      return await handlePost(req, res, user.id, profile.brand_id);
    }
    if (req.method === 'PATCH') {
      return await handlePatch(req, res, profile.brand_id);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}
