import { getAccessToken } from './supabase'
import type {
  DBProfile,
  DBReview,
  DBResponse,
  ReviewStatus,
} from './supabase'

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
// Request / Response interfaces per function
// ─────────────────────────────────────────────────────────────

// generateResponse / generateResponseStream
export interface GenerateResponseRequest {
  reviewId:        string
  review:          ReviewContext
  brandSettings:   BrandSettingsPayload
  includeOffer:    boolean
  previousResponse?: string
}
export interface GenerateResponseResult {
  content:    string
  wordCount:  number
  charCount:  number
  tokensUsed: number
  model:      string
}

// editResponse
export interface EditResponseRequest {
  selectedText: string
  fullContent:  string
  instruction:  string
  review:       ReviewContext
  brandSettings: BrandSettingsPayload
}
export interface EditResponseResult {
  editedText:  string
  fullContent: string
}

// applyPrompt / applyPromptStream
export interface ApplyPromptRequest {
  content:      string
  prompt:       string
  review:       ReviewContext
  brandSettings: BrandSettingsPayload
}
export interface ApplyPromptResult {
  content:   string
  wordCount: number
  charCount: number
}

// analyzeBrandVoice
export interface AnalyzeBrandVoiceRequest {
  sampleResponses: string[]
  brandName:       string
}
export interface AnalyzeBrandVoiceResult {
  detectedTone:       string
  characteristics:    string[]
  suggestedRules:     string[]
  toneFormality:      number
  toneWarmth:         number
  toneVerbosity:      number
}

// getReviews
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

// updateReviewStatus
export interface UpdateReviewStatusRequest {
  status: ReviewStatus
}

// saveResponse
export interface SaveResponseRequest {
  reviewId:    string
  content:     string
  version:     number
  isActive:    boolean
  editHistory: Array<{ version: number; content: string; action: string; timestamp: string }>
}

// getResponses
export interface GetResponsesResult {
  responses: DBResponse[]
}

// getBrandSettings / saveBrandSettings
export type GetBrandSettingsResult  = DBProfile
export type SaveBrandSettingsRequest = Partial<Omit<DBProfile, 'id' | 'created_at' | 'updated_at'>>

// ─────────────────────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<APIResult<T>> {
  try {
    const token = await getAccessToken()

    const response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    })

    if (!response.ok) {
      let message = `HTTP ${response.status}`
      try {
        const body = await response.json()
        message = body.error ?? body.message ?? message
      } catch { /* response wasn't JSON */ }
      return { data: null, error: message }
    }

    const data = (await response.json()) as T
    return { data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    return { data: null, error: message }
  }
}

async function apiStream(
  path: string,
  body: Record<string, unknown>,
  onChunk: (chunk: string) => void,
  onDone?: (fullText: string) => void,
  onError?: (error: string) => void,
  onEvent?: (name: string, data: unknown) => void
): Promise<void> {
  let accumulated = ''

  try {
    const token = await getAccessToken()

    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok || !response.body) {
      let message = `HTTP ${response.status}`
      try {
        const errBody = await response.json()
        message = errBody.error ?? message
      } catch { /* not JSON */ }
      onError?.(message)
      return
    }

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // SSE messages are delimited by double-newline
      const messages = buffer.split(/\n\n/)
      buffer = messages.pop() ?? ''

      for (const msg of messages) {
        const lines = msg.split('\n')
        let eventName = 'message'
        let dataLine  = ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            dataLine = line.slice(5).trim()
          }
        }

        if (!dataLine || dataLine === '[DONE]') {
          if (dataLine === '[DONE]') { onDone?.(accumulated); return }
          continue
        }

        if (eventName === 'done') {
          onDone?.(accumulated)
          return
        }

        if (eventName === 'error') {
          try {
            const parsed = JSON.parse(dataLine) as { error?: string }
            onError?.(parsed.error ?? 'Stream error')
          } catch { onError?.('Stream error') }
          return
        }

        if (eventName === 'message' || eventName === 'chunk') {
          try {
            const parsed = JSON.parse(dataLine) as { content?: string; chunk?: string; text?: string }
            const text   = parsed.content ?? parsed.chunk ?? parsed.text ?? ''
            if (text) { accumulated += text; onChunk(text) }
          } catch { /* malformed */ }
        } else {
          // Named event (e.g. "tags", "warning", "metadata")
          try {
            onEvent?.(eventName, JSON.parse(dataLine))
          } catch {
            onEvent?.(eventName, dataLine)
          }
        }
      }
    }

    onDone?.(accumulated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stream interrupted'
    onError?.(message)
  }
}

// ─────────────────────────────────────────────────────────────
// AI — Generation
// ─────────────────────────────────────────────────────────────

export async function generateResponse(
  payload: GenerateResponseRequest
): Promise<APIResult<GenerateResponseResult>> {
  return apiFetch<GenerateResponseResult>('/api/generate', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
}

export async function generateResponseStream(
  payload:   GenerateResponseRequest,
  onChunk:   (chunk: string) => void,
  onDone?:   (fullText: string) => void,
  onError?:  (error: string) => void,
  onEvent?:  (name: string, data: unknown) => void
): Promise<void> {
  return apiStream(
    '/api/generate-stream',
    payload as unknown as Record<string, unknown>,
    onChunk,
    onDone,
    onError,
    onEvent
  )
}

// ─────────────────────────────────────────────────────────────
// AI — Inline selection edit
// ─────────────────────────────────────────────────────────────

export async function editResponse(
  payload: EditResponseRequest
): Promise<APIResult<EditResponseResult>> {
  return apiFetch<EditResponseResult>('/api/edit', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
}

// ─────────────────────────────────────────────────────────────
// AI — Prompt-based full rewrite
// ─────────────────────────────────────────────────────────────

export async function applyPrompt(
  payload: ApplyPromptRequest
): Promise<APIResult<ApplyPromptResult>> {
  return apiFetch<ApplyPromptResult>('/api/prompt', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
}

export async function applyPromptStream(
  payload:  ApplyPromptRequest,
  onChunk:  (chunk: string) => void,
  onDone?:  (fullText: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  return apiStream(
    '/api/prompt-stream',
    payload as unknown as Record<string, unknown>,
    onChunk,
    onDone,
    onError
  )
}

// ─────────────────────────────────────────────────────────────
// AI — Brand voice analysis
// ─────────────────────────────────────────────────────────────

export async function analyzeBrandVoice(
  payload: AnalyzeBrandVoiceRequest
): Promise<APIResult<AnalyzeBrandVoiceResult>> {
  return apiFetch<AnalyzeBrandVoiceResult>('/api/analyze-voice', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
}

// ─────────────────────────────────────────────────────────────
// Reviews CRUD
// ─────────────────────────────────────────────────────────────

export async function getReviews(
  params: GetReviewsParams = {}
): Promise<APIResult<GetReviewsResult>> {
  const qs = new URLSearchParams()
  if (params.platform  && params.platform  !== 'all') qs.set('platform', params.platform)
  if (params.rating    !== undefined)                  qs.set('rating',   String(params.rating))
  if (params.status    && params.status    !== 'all')  qs.set('status',   params.status)
  if (params.search)                                   qs.set('search',   params.search)
  if (params.page      !== undefined)                  qs.set('page',     String(params.page))
  if (params.perPage   !== undefined)                  qs.set('perPage',  String(params.perPage))
  if (params.sortBy)                                   qs.set('sortBy',   params.sortBy)
  if (params.sortOrder)                                qs.set('sortOrder',params.sortOrder)

  const query = qs.toString() ? `?${qs.toString()}` : ''
  return apiFetch<GetReviewsResult>(`/api/reviews${query}`)
}

export async function getReview(id: string): Promise<APIResult<DBReview>> {
  return apiFetch<DBReview>(`/api/reviews/${encodeURIComponent(id)}`)
}

export async function updateReviewStatus(
  id:      string,
  status:  ReviewStatus
): Promise<APIResult<DBReview>> {
  return apiFetch<DBReview>(`/api/reviews/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body:   JSON.stringify({ status } satisfies UpdateReviewStatusRequest),
  })
}

// ─────────────────────────────────────────────────────────────
// Responses CRUD
// ─────────────────────────────────────────────────────────────

export async function saveResponse(
  payload: SaveResponseRequest
): Promise<APIResult<DBResponse>> {
  return apiFetch<DBResponse>('/api/responses', {
    method: 'POST',
    body:   JSON.stringify(payload),
  })
}

export async function getResponses(
  reviewId: string
): Promise<APIResult<GetResponsesResult>> {
  return apiFetch<GetResponsesResult>(
    `/api/responses?reviewId=${encodeURIComponent(reviewId)}`
  )
}

// ─────────────────────────────────────────────────────────────
// Brand settings
// ─────────────────────────────────────────────────────────────

export async function getBrandSettings(): Promise<APIResult<GetBrandSettingsResult>> {
  return apiFetch<GetBrandSettingsResult>('/api/brand-settings')
}

export async function saveBrandSettings(
  settings: SaveBrandSettingsRequest
): Promise<APIResult<GetBrandSettingsResult>> {
  return apiFetch<GetBrandSettingsResult>('/api/brand-settings', {
    method: 'POST',
    body:   JSON.stringify(settings),
  })
}
