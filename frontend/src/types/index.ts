// ─────────────────────────────────────────────────────────────
// Primitives & Enums
// ─────────────────────────────────────────────────────────────

export type Platform =
  | 'google'
  | 'yelp'
  | 'tripadvisor'
  | 'opentable'
  | 'doordash'
  | 'ubereats'
  | 'grubhub'
  | 'apple_maps';

export type StarRating = 1 | 2 | 3 | 4 | 5;

export type SentimentType = 'positive' | 'neutral' | 'negative' | 'mixed';

export type ResponseStatus =
  | 'pending'
  | 'draft'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived';

export type EditActionType =
  | 'tone_adjust'
  | 'length_shorten'
  | 'length_expand'
  | 'add_offer'
  | 'remove_offer'
  | 'rephrase'
  | 'regenerate'
  | 'manual_edit'
  | 'translate'
  | 'add_signature'
  | 'remove_signature';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type UserRole = 'owner' | 'manager' | 'staff' | 'viewer';

export type ToneType =
  | 'professional'
  | 'friendly'
  | 'formal'
  | 'casual'
  | 'empathetic';

export type TagCategory =
  | 'food'
  | 'service'
  | 'ambiance'
  | 'value'
  | 'experience'
  | 'cleanliness'
  | 'wait_time'
  | 'custom';

export type DiscountType = 'percentage' | 'fixed' | 'freebie' | 'upgrade';

export type SortField = 'date' | 'rating' | 'sentiment' | 'platform' | 'location';
export type SortOrder = 'asc' | 'desc';

// ─────────────────────────────────────────────────────────────
// Auth & Users
// ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  brand_id: string | null;
  location_ids: string[];
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  email_new_review: boolean;
  email_response_approved: boolean;
  email_weekly_digest: boolean;
  in_app_all: boolean;
}

// ─────────────────────────────────────────────────────────────
// Brand & Locations
// ─────────────────────────────────────────────────────────────

export interface BrandSettings {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_logo_url: string | null;

  tone: ToneType;
  response_language: string;
  max_response_length: number;
  min_response_length: number;

  include_manager_name: boolean;
  manager_name: string | null;
  signature: string | null;

  offer_enabled: boolean;
  offer_threshold: StarRating;
  offer_templates: OfferTemplate[];

  auto_respond_positive: boolean;
  auto_respond_threshold: StarRating;

  custom_instructions: string | null;
  avoid_phrases: string[];
  must_include_phrases: string[];

  platforms: Platform[];
  created_at: string;
  updated_at: string;
}

export interface OfferTemplate {
  id: string;
  title: string;
  description: string;
  discount_type: DiscountType;
  discount_value: string;
  valid_days: number;
  redemption_code: string | null;
  is_default: boolean;
  active: boolean;
}

export interface Location {
  id: string;
  brand_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
  timezone: string;
  platform_connections: PlatformConnection[];
  manager_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformConnection {
  platform: Platform;
  platform_location_id: string;
  listing_name: string;
  is_connected: boolean;
  last_sync_at: string | null;
  total_reviews: number;
  average_rating: number;
}

// ─────────────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  platform: Platform;
  platform_review_id: string;

  location_id: string;
  location_name: string;
  brand_id: string;

  reviewer_name: string;
  reviewer_avatar_url: string | null;
  reviewer_profile_url: string | null;
  reviewer_review_count: number | null;

  rating: StarRating;
  review_text: string;
  review_date: string;

  sentiment: SentimentType;
  sentiment_score: number;
  tags: Tag[];
  keywords: string[];

  has_response: boolean;
  response_id: string | null;
  owner_response_text: string | null;

  is_flagged: boolean;
  flag_reason: string | null;
  is_starred: boolean;

  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Responses & Versions
// ─────────────────────────────────────────────────────────────

export interface Response {
  id: string;
  review_id: string;
  brand_id: string;
  location_id: string;

  current_version_id: string | null;
  versions: ResponseVersion[];

  status: ResponseStatus;
  offer_included: boolean;
  offer_template_id: string | null;

  published_at: string | null;
  published_by: string | null;
  approved_at: string | null;
  approved_by: string | null;

  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ResponseVersion {
  id: string;
  response_id: string;
  content: string;
  version_number: number;

  generated_by: 'ai' | 'human';
  ai_model: string | null;
  ai_prompt_tokens: number | null;
  ai_completion_tokens: number | null;

  edit_actions: EditAction[];
  word_count: number;
  char_count: number;
  reading_time_seconds: number;

  tone_used: ToneType | null;
  offer_included: boolean;

  created_by: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Tags
// ─────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  label: string;
  color: string;
  category: TagCategory;
  sentiment: SentimentType;
  icon: string | null;
}

// ─────────────────────────────────────────────────────────────
// Edit Actions (version history trail)
// ─────────────────────────────────────────────────────────────

export interface EditAction {
  id: string;
  type: EditActionType;
  label: string;
  previous_content: string | null;
  metadata: Record<string, string | number | boolean>;
  timestamp: string;
  applied_by: 'ai' | 'human';
}

// ─────────────────────────────────────────────────────────────
// Toast Notifications
// ─────────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

// ─────────────────────────────────────────────────────────────
// Filters & Search
// ─────────────────────────────────────────────────────────────

export interface FilterState {
  platform: Platform | 'all';
  rating: StarRating | 'all';
  sentiment: SentimentType | 'all';
  status: ResponseStatus | 'all';
  tags: string[];
  location_id: string | 'all';
  date_range: DateRange;
  search: string;
  sort_by: SortField;
  sort_order: SortOrder;
  has_response: boolean | null;
  is_flagged: boolean | null;
  is_starred: boolean | null;
}

export interface DateRange {
  start: string | null;
  end: string | null;
  preset: DateRangePreset | null;
}

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'custom';

// ─────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────

export interface Analytics {
  brand_id: string;
  location_id: string | null;
  period_start: string;
  period_end: string;

  total_reviews: number;
  average_rating: number;
  response_rate: number;
  average_response_time_hours: number;

  sentiment_breakdown: SentimentBreakdown;
  rating_breakdown: RatingBreakdown;
  platform_breakdown: PlatformBreakdown[];
  top_tags: TagCount[];
  trend: RatingTrendPoint[];
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
}

export interface RatingBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface PlatformBreakdown {
  platform: Platform;
  total_reviews: number;
  average_rating: number;
  response_rate: number;
}

export interface TagCount {
  tag: Tag;
  count: number;
  sentiment: SentimentType;
}

export interface RatingTrendPoint {
  date: string;
  average_rating: number;
  review_count: number;
}

// ─────────────────────────────────────────────────────────────
// API Payloads
// ─────────────────────────────────────────────────────────────

export interface GenerateResponsePayload {
  review_id: string;
  review_text: string;
  reviewer_name: string;
  rating: StarRating;
  platform: Platform;
  location_name: string;
  brand_settings: Pick<
    BrandSettings,
    | 'brand_name'
    | 'tone'
    | 'max_response_length'
    | 'min_response_length'
    | 'include_manager_name'
    | 'manager_name'
    | 'signature'
    | 'custom_instructions'
    | 'avoid_phrases'
    | 'must_include_phrases'
  >;
  include_offer: boolean;
  offer_template: OfferTemplate | null;
  previous_response: string | null;
  edit_instruction: string | null;
}

export interface GenerateResponseResult {
  content: string;
  word_count: number;
  char_count: number;
  tokens_used: number;
  model: string;
}

// ─────────────────────────────────────────────────────────────
// UI State helpers
// ─────────────────────────────────────────────────────────────

export interface PaginationState {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}
