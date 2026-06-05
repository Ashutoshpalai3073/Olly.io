import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// Database types (mirror the migration schema)
// ─────────────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'draft' | 'posted' | 'ignored'

export interface EditHistoryEntry {
  version: number
  content: string
  action: string
  timestamp: string
}

export interface ReviewTags {
  complaints: string[]
  praises: string[]
}

export interface DBProfile {
  id: string
  brand_name: string | null
  brand_voice: string | null
  brand_rules: string[]
  contact_info: string | null
  offer_template: string | null
  platforms: string[]
  tone_formality: number
  tone_warmth: number
  tone_verbosity: number
  created_at: string
  updated_at: string
}

export interface DBReview {
  id: string
  user_id: string
  platform: string
  reviewer_name: string | null
  rating: number
  review_text: string
  review_date: string
  location_name: string | null
  tags: ReviewTags
  status: ReviewStatus
  created_at: string
}

export interface DBResponse {
  id: string
  review_id: string
  user_id: string
  content: string
  version: number
  is_active: boolean
  edit_history: EditHistoryEntry[]
  posted_at: string | null
  created_at: string
  updated_at: string
}

export interface DBResponseTemplate {
  id: string
  user_id: string
  rating_min: number | null
  rating_max: number | null
  template_text: string | null
  usage_count: number
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// Supabase Database type map
// ─────────────────────────────────────────────────────────────

interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DBProfile
        Insert: Omit<DBProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<DBProfile, 'id' | 'created_at'>>
      }
      reviews: {
        Row: DBReview
        Insert: Omit<DBReview, 'id' | 'created_at'>
        Update: Partial<Omit<DBReview, 'id' | 'created_at' | 'user_id'>>
      }
      responses: {
        Row: DBResponse
        Insert: Omit<DBResponse, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DBResponse, 'id' | 'created_at' | 'user_id' | 'review_id'>>
      }
      response_templates: {
        Row: DBResponseTemplate
        Insert: Omit<DBResponseTemplate, 'id' | 'created_at' | 'usage_count'>
        Update: Partial<Omit<DBResponseTemplate, 'id' | 'created_at' | 'user_id'>>
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL    as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Olly] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\n' +
    'Copy .env.example → .env and fill in your project values.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    storageKey:         'olly-auth',
  },
  global: {
    headers: {
      'x-client-info': 'olly-web/1.0.0',
    },
  },
})

// ─────────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}
