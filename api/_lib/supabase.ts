import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) throw new Error('Missing SUPABASE_URL env var');
    if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var');

    _adminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _adminClient;
}

export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
}

export async function verifyJwt(
  authHeader: string | undefined
): Promise<{ user: AuthenticatedUser; error: null } | { user: null; error: string }> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or malformed Authorization header' };
  }

  const token = authHeader.slice(7);
  const admin = getSupabaseAdmin();

  const { data, error } = await admin.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: error?.message ?? 'Invalid token' };
  }

  return {
    user: { id: data.user.id, email: data.user.email },
    error: null,
  };
}

export async function getUserProfile(userId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .select('id, user_id, role, brand_id, location_ids')
    .eq('user_id', userId)
    .single();

  if (error) return { profile: null, error: error.message };
  return { profile: data, error: null };
}
