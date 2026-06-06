import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import {
  generateResponseStream,
  editResponse,
  applyPromptStream,
  saveResponse,
  getReviews,
  updateReviewStatus,
  getResponses,
  saveBrandSettings,
} from '@/lib/api'
import {
  mockReviews,
  mockResponses,
  MOCK_RESPONSES_BY_REVIEW_ID,
  MOCK_BRANDS,
  USE_MOCK_DATA,
} from '@/lib/mockData'
import type {
  DBProfile,
  DBReview,
  DBResponse,
  ReviewStatus,
} from '@/lib/supabase'
import type {
  GenerateResponseRequest,
  EditResponseRequest,
  ApplyPromptRequest,
  GetReviewsParams,
  SaveBrandSettingsRequest,
} from '@/lib/api'
import type { Toast } from '@/types'
import type { User } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// authStore
// ─────────────────────────────────────────────────────────────

interface AuthState {
  user:       User | null
  profile:    DBProfile | null
  isLoading:  boolean

  initialize:    () => Promise<void>
  login:         (email: string, password: string) => Promise<{ error: string | null }>
  loginWithGoogle: () => Promise<{ error: string | null }>
  logout:        () => Promise<void>
  updateProfile: (updates: SaveBrandSettingsRequest) => Promise<{ error: string | null }>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user:      null,
  profile:   MOCK_BRANDS[0],  // immediately available — no async needed
  isLoading: false,

  initialize: async () => {
    // Already seeded with mock data; skip Supabase when not configured.
    if (USE_MOCK_DATA || !import.meta.env.VITE_SUPABASE_URL) {
      set({ profile: MOCK_BRANDS[0], isLoading: false })
      return
    }

    set({ isLoading: true })

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        set({ user: session.user, profile: profile ?? MOCK_BRANDS[0], isLoading: false })
      } else {
        set({ user: null, profile: MOCK_BRANDS[0], isLoading: false })
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          set({ user: session.user, profile: profile ?? MOCK_BRANDS[0] })
        } else {
          set({ user: null, profile: MOCK_BRANDS[0] })
        }
      })
    } catch {
      set({ profile: MOCK_BRANDS[0], isLoading: false })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    set({ isLoading: false })
    return { error: error?.message ?? null }
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error?.message ?? null }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  updateProfile: async (updates) => {
    const userId = get().user?.id ?? get().profile?.id
    if (!userId) return { error: 'Not authenticated' }

    const result = await saveBrandSettings(updates)
    if (result.error) return { error: result.error }

    set({ profile: result.data ?? null })
    return { error: null }
  },
}))

// ─────────────────────────────────────────────────────────────
// reviewStore
// ─────────────────────────────────────────────────────────────

interface ReviewFilters {
  platform:   string
  rating:     number | null
  status:     ReviewStatus | 'all'
  search:     string
  sortBy:     'created_at' | 'review_date' | 'rating'
  sortOrder:  'asc' | 'desc'
  page:       number
  perPage:    number
}

const DEFAULT_FILTERS: ReviewFilters = {
  platform:  'all',
  rating:    null,
  status:    'all',
  search:    '',
  sortBy:    'created_at',
  sortOrder: 'desc',
  page:      1,
  perPage:   20,
}

interface ReviewState {
  reviews:        DBReview[]
  currentReview:  DBReview | null
  filters:        ReviewFilters
  isLoading:      boolean
  total:          number
  totalPages:     number

  fetchReviews:        () => Promise<void>
  setCurrentReview:    (review: DBReview | null) => void
  updateReviewStatus:  (id: string, status: ReviewStatus) => Promise<void>
  setFilters:          (partial: Partial<ReviewFilters>) => void
  resetFilters:        () => void
}

export const useReviewStore = create<ReviewState>()(
  subscribeWithSelector((set, get) => ({
    reviews:       mockReviews,               // pre-seeded — visible on first render
    currentReview: null,
    filters:       DEFAULT_FILTERS,
    isLoading:     false,
    total:         mockReviews.length,
    totalPages:    1,

    fetchReviews: async () => {
      set({ isLoading: true })

      if (USE_MOCK_DATA) {
        const { platform, rating, status, search } = get().filters
        let filtered = [...mockReviews]

        if (platform !== 'all') {
          filtered = filtered.filter((r) => r.platform === platform)
        }
        if (rating !== null) {
          filtered = filtered.filter((r) => r.rating === rating)
        }
        if (status !== 'all') {
          filtered = filtered.filter((r) => r.status === status)
        }
        if (search.trim()) {
          const q = search.toLowerCase()
          filtered = filtered.filter(
            (r) =>
              r.review_text.toLowerCase().includes(q) ||
              (r.reviewer_name ?? '').toLowerCase().includes(q) ||
              (r.location_name ?? '').toLowerCase().includes(q)
          )
        }

        set({
          reviews:    filtered,
          total:      filtered.length,
          totalPages: Math.ceil(filtered.length / get().filters.perPage),
          isLoading:  false,
        })
        return
      }

      const { platform, rating, status, search, sortBy, sortOrder, page, perPage } = get().filters

      const params: GetReviewsParams = {
        sortBy,
        sortOrder,
        page,
        perPage,
      }
      if (platform !== 'all') params.platform = platform
      if (rating !== null)    params.rating   = rating
      if (status !== 'all')   params.status   = status as ReviewStatus
      if (search.trim())      params.search   = search

      const result = await getReviews(params)

      if (result.error) {
        useUIStore.getState().addToast({
          type:    'error',
          message: 'Failed to load reviews',
          description: result.error,
        })
        set({ isLoading: false })
        return
      }

      set({
        reviews:    result.data!.reviews,
        total:      result.data!.total,
        totalPages: result.data!.totalPages,
        isLoading:  false,
      })
    },

    setCurrentReview: (review) => {
      set({ currentReview: review })
    },

    updateReviewStatus: async (id, status) => {
      if (USE_MOCK_DATA) {
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
          currentReview:
            state.currentReview?.id === id
              ? { ...state.currentReview, status }
              : state.currentReview,
        }))
        return
      }

      const result = await updateReviewStatus(id, status)
      if (result.error) {
        useUIStore.getState().addToast({
          type:    'error',
          message: 'Failed to update status',
          description: result.error,
        })
        return
      }

      set((state) => ({
        reviews: state.reviews.map((r) =>
          r.id === id ? { ...r, status } : r
        ),
        currentReview:
          state.currentReview?.id === id
            ? { ...state.currentReview, status }
            : state.currentReview,
      }))
    },

    setFilters: (partial) => {
      set((state) => ({
        filters: { ...state.filters, ...partial, page: 1 },
      }))
    },

    resetFilters: () => {
      set({ filters: DEFAULT_FILTERS })
    },
  }))
)

// ─────────────────────────────────────────────────────────────
// responseStore
// ─────────────────────────────────────────────────────────────

const MAX_UNDO_DEPTH = 50

interface ResponseState {
  currentResponse: DBResponse | null
  versions:        DBResponse[]
  isGenerating:    boolean
  isEditing:       boolean
  isSaving:        boolean
  lastSaved:       Date | null
  undoStack:       string[]
  redoStack:       string[]

  loadForReview:   (reviewId: string) => Promise<void>
  generate:        (payload: GenerateResponseRequest) => Promise<void>
  editSelection:   (payload: EditResponseRequest) => Promise<void>
  applyPrompt:     (payload: ApplyPromptRequest) => Promise<void>
  setContent:      (content: string) => void
  saveVersion:     (reviewId: string, action?: string) => Promise<void>
  undo:            () => void
  redo:            () => void
  clearCurrent:    () => void
}

function pushUndo(undoStack: string[], content: string): string[] {
  const next = [...undoStack, content]
  return next.length > MAX_UNDO_DEPTH ? next.slice(-MAX_UNDO_DEPTH) : next
}

function makeBlankResponse(reviewId: string): DBResponse {
  return {
    id:           'pending',
    review_id:    reviewId,
    user_id:      '',
    content:      '',
    version:      1,
    is_active:    false,
    edit_history: [],
    posted_at:    null,
    created_at:   new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  }
}

export const useResponseStore = create<ResponseState>()((set, get) => ({
  currentResponse: null,
  versions:        mockResponses,
  isGenerating:    false,
  isEditing:       false,
  isSaving:        false,
  lastSaved:       null,
  undoStack:       [],
  redoStack:       [],

  loadForReview: async (reviewId) => {
    if (USE_MOCK_DATA) {
      const existing = MOCK_RESPONSES_BY_REVIEW_ID.get(reviewId)
      if (existing) {
        set({
          currentResponse: existing,
          versions:        [existing],
          undoStack:       [],
          redoStack:       [],
        })
      } else {
        set({ currentResponse: null, versions: [], undoStack: [], redoStack: [] })
      }
      return
    }

    const result = await getResponses(reviewId)
    if (result.error || !result.data || !result.data.responses.length) {
      set({ currentResponse: null, versions: [], undoStack: [], redoStack: [] })
      return
    }

    const active = result.data.responses.find((r) => r.is_active) ?? result.data.responses[0]
    set({
      currentResponse: active,
      versions:        result.data.responses,
      undoStack:       [],
      redoStack:       [],
    })
  },

  generate: async (payload) => {
    set({ isGenerating: true, undoStack: [], redoStack: [] })

    const blank = makeBlankResponse(payload.reviewId)
    set({ currentResponse: blank })

    let accumulated = ''

    await generateResponseStream(
      payload,
      (chunk) => {
        accumulated += chunk
        set((state) => ({
          currentResponse: state.currentResponse
            ? { ...state.currentResponse, content: accumulated }
            : { ...blank, content: accumulated },
        }))
      },
      (_fullText) => {
        set({ isGenerating: false })
      },
      (error) => {
        set({ isGenerating: false })
        useUIStore.getState().addToast({
          type:    'error',
          message: 'Generation failed',
          description: error,
        })
      },
      (eventName, data) => {
        if (eventName === 'warning') {
          const d = data as { type?: string; charCount?: number; limit?: number; platform?: string }
          if (d.type === 'over_limit') {
            useUIStore.getState().addToast({
              type:        'warning',
              message:     'Response may be too long',
              description: `${d.charCount} characters exceeds the ${d.platform ?? 'platform'} limit of ${d.limit}. Consider shortening.`,
              duration:    6000,
            })
          }
        }
      }
    )
  },

  editSelection: async (payload) => {
    const current = get().currentResponse
    if (!current) return

    set({ isEditing: true })

    const prevContent = current.content
    const result = await editResponse(payload)

    set({ isEditing: false })

    if (result.error) {
      useUIStore.getState().addToast({
        type:    'error',
        message: 'Edit failed',
        description: result.error,
      })
      return
    }

    set((state) => ({
      undoStack:       pushUndo(state.undoStack, prevContent),
      redoStack:       [],
      currentResponse: state.currentResponse
        ? { ...state.currentResponse, content: result.data!.fullContent }
        : null,
    }))
  },

  applyPrompt: async (payload) => {
    const current = get().currentResponse
    if (!current) return

    set({ isEditing: true })

    const prevContent = current.content

    set((state) => ({
      currentResponse: state.currentResponse
        ? { ...state.currentResponse, content: '' }
        : null,
    }))

    let accumulated = ''

    await applyPromptStream(
      payload,
      (chunk) => {
        accumulated += chunk
        set((state) => ({
          currentResponse: state.currentResponse
            ? { ...state.currentResponse, content: accumulated }
            : null,
        }))
      },
      (_fullText) => {
        set((state) => ({
          isEditing:  false,
          undoStack:  pushUndo(state.undoStack, prevContent),
          redoStack:  [],
        }))
      },
      (error) => {
        set((state) => ({
          isEditing:       false,
          currentResponse: state.currentResponse
            ? { ...state.currentResponse, content: prevContent }
            : null,
        }))
        useUIStore.getState().addToast({
          type:    'error',
          message: 'Could not apply prompt',
          description: error,
        })
      }
    )
  },

  setContent: (content) => {
    const current = get().currentResponse
    if (!current) return

    set((state) => ({
      undoStack:       pushUndo(state.undoStack, current.content),
      redoStack:       [],
      currentResponse: { ...current, content },
    }))
  },

  saveVersion: async (reviewId, action = 'Manual save') => {
    const current = get().currentResponse
    if (!current) return

    set({ isSaving: true })

    const nextVersion = current.version + (current.id === 'pending' ? 0 : 1)
    const newEntry = {
      version:   current.version,
      content:   current.content,
      action,
      timestamp: new Date().toISOString(),
    }

    const result = await saveResponse({
      reviewId,
      content:     current.content,
      version:     nextVersion,
      isActive:    true,
      editHistory: [...current.edit_history, newEntry],
    })

    if (result.error) {
      set({ isSaving: false })
      useUIStore.getState().addToast({
        type:    'error',
        message: 'Save failed',
        description: result.error,
      })
      return
    }

    const saved = result.data!
    set((state) => ({
      isSaving:        false,
      lastSaved:       new Date(),
      currentResponse: saved,
      versions:        [
        saved,
        ...state.versions.filter((v) => v.id !== saved.id),
      ],
    }))

    useUIStore.getState().addToast({
      type:     'success',
      message:  'Response saved',
      duration: 2000,
    })

    // Mark the associated review as drafted
    useReviewStore.getState().updateReviewStatus(reviewId, 'draft')
  },

  undo: () => {
    const { undoStack, currentResponse } = get()
    if (!undoStack.length || !currentResponse) return

    const prevContent = undoStack[undoStack.length - 1]

    set((state) => ({
      undoStack:       state.undoStack.slice(0, -1),
      redoStack:       [...state.redoStack, currentResponse.content],
      currentResponse: { ...currentResponse, content: prevContent },
    }))
  },

  redo: () => {
    const { redoStack, currentResponse } = get()
    if (!redoStack.length || !currentResponse) return

    const nextContent = redoStack[redoStack.length - 1]

    set((state) => ({
      redoStack:       state.redoStack.slice(0, -1),
      undoStack:       [...state.undoStack, currentResponse.content],
      currentResponse: { ...currentResponse, content: nextContent },
    }))
  },

  clearCurrent: () => {
    set({
      currentResponse: null,
      versions:        [],
      undoStack:       [],
      redoStack:       [],
      isGenerating:    false,
      isEditing:       false,
    })
  },
}))

// ─────────────────────────────────────────────────────────────
// uiStore
// ─────────────────────────────────────────────────────────────

interface UIState {
  toasts:      Toast[]
  sidebarOpen: boolean
  activePanel: 'reviews' | 'editor' | 'brand' | 'analytics'

  addToast:     (toast: Omit<Toast, 'id'>) => void
  removeToast:  (id: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActivePanel: (panel: UIState['activePanel']) => void
}

let toastCounter = 0

export const useUIStore = create<UIState>()((set, get) => ({
  toasts:      [],
  sidebarOpen: true,
  activePanel: 'reviews',

  addToast: (toast) => {
    const id       = `toast-${++toastCounter}-${Date.now()}`
    const duration = toast.duration ?? 4000
    const entry: Toast = { ...toast, id, duration }

    set((state) => ({ toasts: [...state.toasts, entry] }))

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
  },

  setActivePanel: (panel) => {
    set({ activePanel: panel })
  },
}))

// ─────────────────────────────────────────────────────────────
// Cross-store review selection sync
// Whenever currentReview changes, load its response automatically
// ─────────────────────────────────────────────────────────────

useReviewStore.subscribe(
  (state) => state.currentReview,
  (review, prevReview) => {
    if (review?.id === prevReview?.id) return

    if (review) {
      useResponseStore.getState().loadForReview(review.id)
    } else {
      useResponseStore.getState().clearCurrent()
    }
  }
)

// ─────────────────────────────────────────────────────────────
// seedMockData — call on app startup to guarantee every store
// has data before the first render paints to screen.
// ─────────────────────────────────────────────────────────────

export function seedMockData() {
  useAuthStore.setState({
    profile:   MOCK_BRANDS[0],
    user:      null,
    isLoading: false,
  })

  useReviewStore.setState({
    reviews:    mockReviews,
    total:      mockReviews.length,
    totalPages: 1,
    isLoading:  false,
  })
}
