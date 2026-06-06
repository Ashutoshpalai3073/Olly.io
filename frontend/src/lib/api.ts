import type { DBProfile, DBReview, DBResponse, ReviewStatus } from './supabase'
import { mockReviews, mockResponses, MOCK_BRANDS } from './mockData'
import { groqStream, groqComplete } from './groqClient'

// ─────────────────────────────────────────────────────────────
// Core result type
// ─────────────────────────────────────────────────────────────

export type APIResult<T> =
  | { data: T;    error: null   }
  | { data: null; error: string }

// ─────────────────────────────────────────────────────────────
// Shared payload types
// ─────────────────────────────────────────────────────────────

export interface BrandSettingsPayload {
  brandName:     string
  brandVoice:    string
  brandRules:    string[]
  toneFormality: number
  toneWarmth:    number
  toneVerbosity: number
  offerTemplate: string
  contactInfo:   string
  platforms:     string[]
}

export interface ReviewContext {
  reviewText:   string
  reviewerName: string
  rating:       number
  platform:     string
  locationName: string
}

// ─────────────────────────────────────────────────────────────
// Request / Response interfaces
// ─────────────────────────────────────────────────────────────

export interface GenerateResponseRequest {
  reviewId:          string
  review:            ReviewContext
  brandSettings:     BrandSettingsPayload
  includeOffer:      boolean
  previousResponse?: string
}
export interface GenerateResponseResult {
  content:    string
  wordCount:  number
  charCount:  number
  tokensUsed: number
  model:      string
}

export interface EditResponseRequest {
  selectedText:  string
  fullContent:   string
  instruction:   string
  review:        ReviewContext
  brandSettings: BrandSettingsPayload
}
export interface EditResponseResult {
  editedText:  string
  fullContent: string
}

export interface ApplyPromptRequest {
  content:       string
  prompt:        string
  review:        ReviewContext
  brandSettings: BrandSettingsPayload
}
export interface ApplyPromptResult {
  content:   string
  wordCount: number
  charCount: number
}

export interface AnalyzeBrandVoiceRequest {
  sampleResponses: string[]
  brandName:       string
}
export interface AnalyzeBrandVoiceResult {
  detectedTone:    string
  characteristics: string[]
  suggestedRules:  string[]
  toneFormality:   number
  toneWarmth:      number
  toneVerbosity:   number
}

export interface GetReviewsParams {
  platform?:  string
  rating?:    number
  status?:    ReviewStatus | 'all'
  search?:    string
  page?:      number
  perPage?:   number
  sortBy?:    'created_at' | 'review_date' | 'rating'
  sortOrder?: 'asc' | 'desc'
}
export interface GetReviewsResult {
  reviews:    DBReview[]
  total:      number
  page:       number
  perPage:    number
  totalPages: number
}

export interface UpdateReviewStatusRequest {
  status: ReviewStatus
}

export interface SaveResponseRequest {
  reviewId:    string
  content:     string
  version:     number
  isActive:    boolean
  editHistory: Array<{ version: number; content: string; action: string; timestamp: string }>
}

export interface GetResponsesResult {
  responses: DBResponse[]
}

export type GetBrandSettingsResult   = DBProfile
export type SaveBrandSettingsRequest = Partial<Omit<DBProfile, 'id' | 'created_at' | 'updated_at'>>

// ─────────────────────────────────────────────────────────────
// AI — Generation (Groq streaming)
// ─────────────────────────────────────────────────────────────

export async function generateResponse(
  payload: GenerateResponseRequest
): Promise<APIResult<GenerateResponseResult>> {
  return {
    data: {
      content:    `Dear ${payload.review.reviewerName}, thank you for your feedback.`,
      wordCount:  8,
      charCount:  50,
      tokensUsed: 15,
      model:      'llama-3.3-70b-versatile',
    },
    error: null,
  }
}

export async function generateResponseStream(
  payload:   GenerateResponseRequest,
  onChunk:   (chunk: string) => void,
  onDone?:   (fullText: string) => void,
  onError?:  (error: string) => void,
  _onEvent?: (name: string, data: unknown) => void
): Promise<void> {
  return groqStream(
    payload.review,
    payload.brandSettings,
    onChunk,
    onDone  ?? (() => {}),
    onError ?? (() => {}),
  )
}

// ─────────────────────────────────────────────────────────────
// AI — Inline selection edit (Groq non-streaming)
// ─────────────────────────────────────────────────────────────

export async function editResponse(
  payload: EditResponseRequest
): Promise<APIResult<EditResponseResult>> {
  const system = `You are a text editor for restaurant review responses.
You receive a full response and a selected portion. Edit ONLY the selected text according to the instruction.
Return ONLY the complete response with the edit applied. No explanation, no quotes around the response.`

  const user = `Full response:
${payload.fullContent}

Selected text to edit:
"${payload.selectedText}"

Instruction: ${payload.instruction}

Return the complete edited response:`

  try {
    const result = await groqComplete(system, user)
    if (!result) return { data: null, error: 'No response from AI' }
    return { data: { editedText: result, fullContent: result }, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Edit failed' }
  }
}

// ─────────────────────────────────────────────────────────────
// AI — Prompt-based full rewrite (Groq streaming)
// ─────────────────────────────────────────────────────────────

export async function applyPrompt(
  payload: ApplyPromptRequest
): Promise<APIResult<ApplyPromptResult>> {
  return {
    data: { content: payload.content, wordCount: 0, charCount: payload.content.length },
    error: null,
  }
}

export async function applyPromptStream(
  payload:  ApplyPromptRequest,
  onChunk:  (chunk: string) => void,
  onDone?:  (fullText: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  return groqStream(
    payload.review,
    payload.brandSettings,
    onChunk,
    onDone  ?? (() => {}),
    onError ?? (() => {}),
    payload.prompt,
  )
}

// ─────────────────────────────────────────────────────────────
// AI — Brand voice analysis (mock)
// ─────────────────────────────────────────────────────────────

export async function analyzeBrandVoice(
  _payload: AnalyzeBrandVoiceRequest
): Promise<APIResult<AnalyzeBrandVoiceResult>> {
  return {
    data: {
      detectedTone:    'Warm and professional',
      characteristics: ['Empathetic', 'Specific', 'Inviting'],
      suggestedRules:  [
        'Always thank reviewers by name',
        'Acknowledge specific dishes or experiences mentioned',
      ],
      toneFormality: 3,
      toneWarmth:    4,
      toneVerbosity: 3,
    },
    error: null,
  }
}

// ─────────────────────────────────────────────────────────────
// Reviews — in-memory mock (no HTTP)
// ─────────────────────────────────────────────────────────────

export async function getReviews(
  params: GetReviewsParams = {}
): Promise<APIResult<GetReviewsResult>> {
  let filtered = [...mockReviews]
  if (params.platform && params.platform !== 'all')
    filtered = filtered.filter(r => r.platform === params.platform)
  if (params.rating !== undefined)
    filtered = filtered.filter(r => r.rating === params.rating)
  if (params.status && params.status !== 'all')
    filtered = filtered.filter(r => r.status === params.status)
  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      r => r.review_text.toLowerCase().includes(q) ||
           (r.reviewer_name ?? '').toLowerCase().includes(q)
    )
  }
  const page     = params.page    ?? 1
  const perPage  = params.perPage ?? 20
  return {
    data: {
      reviews:    filtered,
      total:      filtered.length,
      page,
      perPage,
      totalPages: Math.ceil(filtered.length / perPage),
    },
    error: null,
  }
}

export async function getReview(id: string): Promise<APIResult<DBReview>> {
  const review = mockReviews.find(r => r.id === id)
  if (!review) return { data: null, error: 'Review not found' }
  return { data: review, error: null }
}

export async function updateReviewStatus(
  id:     string,
  status: ReviewStatus
): Promise<APIResult<DBReview>> {
  const review = mockReviews.find(r => r.id === id)
  if (!review) return { data: null, error: 'Review not found' }
  return { data: { ...review, status }, error: null }
}

// ─────────────────────────────────────────────────────────────
// Responses — localStorage + mockData fallback (no HTTP)
// ─────────────────────────────────────────────────────────────

export async function saveResponse(
  payload: SaveResponseRequest
): Promise<APIResult<DBResponse>> {
  const saved: DBResponse = {
    id:           `local-${Date.now()}`,
    review_id:    payload.reviewId,
    user_id:      'local',
    content:      payload.content,
    version:      payload.version,
    is_active:    payload.isActive,
    edit_history: payload.editHistory,
    posted_at:    null,
    created_at:   new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  }
  try {
    localStorage.setItem(`olly_resp_${payload.reviewId}`, JSON.stringify(saved))
  } catch { /* storage unavailable */ }
  return { data: saved, error: null }
}

export async function getResponses(
  reviewId: string
): Promise<APIResult<GetResponsesResult>> {
  try {
    const stored = localStorage.getItem(`olly_resp_${reviewId}`)
    if (stored) return { data: { responses: [JSON.parse(stored) as DBResponse] }, error: null }
  } catch { /* storage unavailable */ }

  const mock = mockResponses.find(r => r.review_id === reviewId)
  return {
    data: { responses: mock ? [mock] : [] },
    error: null,
  }
}

// ─────────────────────────────────────────────────────────────
// Brand settings — localStorage + mock fallback (no HTTP)
// ─────────────────────────────────────────────────────────────

export async function getBrandSettings(): Promise<APIResult<GetBrandSettingsResult>> {
  try {
    const stored = localStorage.getItem('olly_brand')
    if (stored) return { data: JSON.parse(stored) as DBProfile, error: null }
  } catch { /* storage unavailable */ }
  return { data: MOCK_BRANDS[0], error: null }
}

export async function saveBrandSettings(
  settings: SaveBrandSettingsRequest
): Promise<APIResult<GetBrandSettingsResult>> {
  const base    = MOCK_BRANDS[0]
  const updated = { ...base, ...settings, updated_at: new Date().toISOString() }
  try {
    localStorage.setItem('olly_brand', JSON.stringify(updated))
  } catch { /* storage unavailable */ }
  return { data: updated, error: null }
}
