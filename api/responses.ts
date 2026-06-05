import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, verifyJwt, getUserProfile } from './_lib/supabase';
import { handleCors } from './_lib/cors';

async function handleGet(req: VercelRequest, res: VercelResponse, brandId: string) {
  const { review_id } = req.query as Record<string, string>;

  if (!review_id) {
    return res.status(400).json({ error: 'Missing required query param: review_id' });
  }

  const admin = getSupabaseAdmin();

  const { data: responses, error: respError } = await admin
    .from('responses')
    .select(`
      *,
      versions:response_versions(*)
    `)
    .eq('review_id', review_id)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (respError) {
    return res.status(500).json({ error: respError.message });
  }

  return res.status(200).json({ data: responses ?? [] });
}

async function handlePost(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  brandId: string
) {
  const body = req.body as Record<string, unknown>;

  if (!body.review_id || !body.content) {
    return res.status(400).json({ error: 'Missing required fields: review_id, content' });
  }

  const content = String(body.content);
  const wordCount = content.trim().split(/\s+/).length;
  const charCount = content.length;
  const readingTimeSecs = Math.ceil(wordCount / 3);

  const admin = getSupabaseAdmin();

  const { data: existing } = await admin
    .from('responses')
    .select('id, current_version_id')
    .eq('review_id', body.review_id)
    .eq('brand_id', brandId)
    .maybeSingle();

  let responseId: string;

  if (existing) {
    responseId = existing.id;
  } else {
    const { data: newResp, error: createRespErr } = await admin
      .from('responses')
      .insert({
        review_id: body.review_id,
        brand_id: brandId,
        location_id: body.location_id ?? null,
        status: 'draft',
        offer_included: body.offer_included ?? false,
        offer_template_id: body.offer_template_id ?? null,
        created_by: userId,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (createRespErr || !newResp) {
      return res.status(500).json({ error: createRespErr?.message ?? 'Failed to create response' });
    }

    responseId = newResp.id;
  }

  const { data: lastVersion } = await admin
    .from('response_versions')
    .select('version_number')
    .eq('response_id', responseId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersionNumber = (lastVersion?.version_number ?? 0) + 1;

  const { data: version, error: versionError } = await admin
    .from('response_versions')
    .insert({
      response_id: responseId,
      content,
      version_number: nextVersionNumber,
      generated_by: body.generated_by ?? 'ai',
      ai_model: body.ai_model ?? null,
      ai_prompt_tokens: body.ai_prompt_tokens ?? null,
      ai_completion_tokens: body.ai_completion_tokens ?? null,
      edit_actions: body.edit_actions ?? [],
      word_count: wordCount,
      char_count: charCount,
      reading_time_seconds: readingTimeSecs,
      tone_used: body.tone_used ?? null,
      offer_included: body.offer_included ?? false,
      created_by: userId,
    })
    .select()
    .single();

  if (versionError || !version) {
    return res.status(500).json({ error: versionError?.message ?? 'Failed to create version' });
  }

  const { error: updateRespError } = await admin
    .from('responses')
    .update({
      current_version_id: version.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', responseId);

  if (updateRespError) {
    return res.status(500).json({ error: updateRespError.message });
  }

  await admin
    .from('reviews')
    .update({ has_response: true, response_id: responseId, updated_at: new Date().toISOString() })
    .eq('id', body.review_id)
    .eq('brand_id', brandId);

  return res.status(201).json({
    data: {
      response_id: responseId,
      version,
    },
  });
}

async function handlePatch(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  brandId: string
) {
  const body = req.body as Record<string, unknown>;

  if (!body.id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  const admin = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await admin
    .from('responses')
    .select('id, status')
    .eq('id', body.id)
    .eq('brand_id', brandId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Response not found or access denied' });
  }

  const allowedStatusTransitions: Record<string, string[]> = {
    draft: ['approved', 'rejected', 'archived'],
    approved: ['published', 'rejected', 'archived'],
    rejected: ['draft'],
    published: ['archived'],
    archived: [],
    pending: ['draft', 'rejected'],
  };

  if (body.status) {
    const current = existing.status as string;
    const allowed = allowedStatusTransitions[current] ?? [];
    if (!allowed.includes(String(body.status))) {
      return res.status(400).json({
        error: `Invalid status transition from '${current}' to '${body.status}'`,
      });
    }
  }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const allowedFields = ['status', 'current_version_id', 'offer_included', 'offer_template_id'];
  for (const field of allowedFields) {
    if (field in body) updatePayload[field] = body[field];
  }

  if (body.status === 'published') {
    updatePayload.published_at = new Date().toISOString();
    updatePayload.published_by = userId;
  }
  if (body.status === 'approved') {
    updatePayload.approved_at = new Date().toISOString();
    updatePayload.approved_by = userId;
  }

  const { data, error: updateError } = await admin
    .from('responses')
    .update(updatePayload)
    .eq('id', body.id)
    .select(`*, versions:response_versions(*)`)
    .single();

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  if (body.content && body.current_version_id) {
    const content = String(body.content);
    const wordCount = content.trim().split(/\s+/).length;

    await admin
      .from('response_versions')
      .update({
        content,
        word_count: wordCount,
        char_count: content.length,
        reading_time_seconds: Math.ceil(wordCount / 3),
      })
      .eq('id', body.current_version_id)
      .eq('response_id', body.id);
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
      return await handleGet(req, res, profile.brand_id);
    }
    if (req.method === 'POST') {
      return await handlePost(req, res, user.id, profile.brand_id);
    }
    if (req.method === 'PATCH') {
      return await handlePatch(req, res, user.id, profile.brand_id);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}
