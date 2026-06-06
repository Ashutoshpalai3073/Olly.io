# Olly — AI Review Response Assistant

Olly helps restaurants respond to customer reviews automatically using AI. It reads reviews from Google, Zomato, Swiggy, and TripAdvisor, generates on-brand responses using Groq LLM, and lets you review, edit, and post them — all from one dashboard.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                           │
│                                                                 │
│  React 18 + Vite · Zustand stores · Framer Motion · React Router│
│                                                                 │
│  /pages          /components       /hooks          /lib         │
│  Dashboard       AppShell          useAnalytics    api.ts       │
│  Analytics       LineChart         useAuth         streaming.ts │
│  Settings        DonutChart        useAutoSave     analytics.ts │
│  ResponseEditor  CommandPalette    useKeyboard…    diff.ts      │
│  ReviewQueue     SelectionToolbar  useCountUp      errors.ts    │
│  Login           FreeformPrompt                                 │
│  BrandSetup      StreamingText                                  │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ fetch / SSE (text/event-stream)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Serverless Functions                   │
│                         /api/*.ts                               │
│                                                                 │
│  /api/generate          → Groq Llama-3 (streaming)             │
│  /api/edit              → Groq Llama-3 (streaming)             │
│  /api/apply-prompt      → Groq Llama-3 (streaming)             │
│  /api/analyze-voice     → Groq Llama-3                         │
│  /api/reviews           → Supabase (CRUD)                      │
│  /api/responses         → Supabase (CRUD)                      │
│  /api/brand-settings    → Supabase (CRUD)                      │
│                                                                 │
└──────────────┬───────────────────────────┬──────────────────────┘
               │                           │
               ▼                           ▼
     ┌─────────────────┐         ┌──────────────────┐
     │   Groq Cloud    │         │    Supabase       │
     │  (LLM API)      │         │  PostgreSQL + RLS │
     │  llama-3-*      │         │  Auth · Profiles  │
     │                 │         │  Reviews · Resp.  │
     └─────────────────┘         └──────────────────┘
```

---

## Quick start

### Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

### 1. Clone

```bash
git clone https://github.com/your-org/olly.git
cd olly
```

### 2. Install dependencies

```bash
# Root (Vercel CLI + any shared deps)
npm install

# Frontend
cd frontend && npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase `anon` public key |
| `GROQ_API_KEY` | Groq API key (server-side only) |
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` (used by serverless functions) |
| `SUPABASE_ANON_KEY` | Same as `VITE_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` key (server-side, never expose) |
| `VITE_USE_MOCK_DATA` | Set `true` to use mock data without Supabase (dev only) |

### 4. Set up Supabase

Run the SQL migration in `supabase/migrations/` against your project:

```bash
# Using Supabase CLI
supabase db push
```

Or paste the contents of `supabase/migrations/001_initial.sql` into the SQL editor in your Supabase dashboard.

### 5. Run locally

```bash
# In project root — runs frontend + API functions together
npx vercel dev
```

Or run frontend alone (mock data mode):

```bash
cd frontend
echo "VITE_USE_MOCK_DATA=true" >> .env.local
npm run dev
```

---

## Development

```bash
# Frontend dev server (Vite, port 5173)
cd frontend && npm run dev

# Type check
cd frontend && npm run typecheck

# Build
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview
```

### Mock data mode

Set `VITE_USE_MOCK_DATA=true` in `frontend/.env.local`. This loads 15 pre-built reviews across 3 brands (Pasta & More, The Royal Table, Burger Rush) with 8 responses and full edit history. No Supabase connection required.

---

## API endpoints

All endpoints are serverless functions under `/api/`. They accept JSON bodies and return JSON.

### `POST /api/generate`
Generate a response for a review using streaming SSE.

**Body:**
```json
{
  "reviewId": "string",
  "review": { "reviewText": "...", "reviewerName": "...", "rating": 4, "platform": "google", "locationName": "..." },
  "brandSettings": { "brandName": "...", "brandVoice": "...", "brandRules": ["..."], "toneFormality": 50, "toneWarmth": 60, "toneVerbosity": 45, "offerTemplate": "...", "contactInfo": "..." },
  "includeOffer": false
}
```
**Response:** `text/event-stream` — streams text chunks, ends with `data: [DONE]`

### `POST /api/edit`
Edit a selected passage within a response.

**Body:** `{ selectedText, fullContent, instruction, review, brandSettings }`

**Response:** `{ editedText, fullContent }`

### `POST /api/apply-prompt`
Apply a freeform instruction to the full response (streaming).

**Body:** `{ content, prompt, review, brandSettings }`

**Response:** `text/event-stream`

### `POST /api/analyze-voice`
Analyse sample responses to extract brand voice traits.

**Body:** `{ sampleResponses: string[], brandName: string }`

**Response:** `{ detectedTone, characteristics, suggestedRules, toneFormality, toneWarmth, toneVerbosity }`

### `GET /api/reviews`
List reviews with filtering and pagination.

**Query params:** `platform`, `rating`, `status`, `search`, `page`, `perPage`, `sortBy`, `sortOrder`

### `GET /api/reviews/:id` · `PATCH /api/reviews/:id`
Get or update a single review.

### `GET /api/responses?reviewId=` · `POST /api/responses`
List or create responses for a review.

### `GET /api/brand-settings` · `PATCH /api/brand-settings`
Get or update the brand profile.

---

## Design system

All design tokens live in `frontend/src/styles/globals.css` as CSS custom properties.

| Token | Purpose |
|---|---|
| `--bg-primary` | Page background |
| `--bg-elevated` | Cards, modals |
| `--bg-surface` | Sidebar, panels |
| `--bg-active` | Hover / selected states |
| `--accent-primary` | Orange `#FF6B35` — primary CTA |
| `--accent-muted` | Accent background (tinted) |
| `--text-primary / secondary / tertiary` | Text hierarchy |
| `--border-subtle / default / strong` | Border hierarchy |
| `--radius-sm / md / lg / xl` | Corner radii |
| `--shadow-sm / md / lg / elevated / modal` | Shadow scale |
| `--transition-fast / base` | Animation durations |

### Component inventory

```
ui/
  Avatar · Badge · Button · Card · Chip · CommandPalette
  EmptyState · Input · Modal · PlatformBadge · Sheet
  Shimmer · Slider · Spinner · StarRating · Tabs
  Textarea · Toast · ToastContainer · Toggle · Tooltip

layout/
  AppShell · ProtectedRoute

charts/
  BarChart · DonutChart · LineChart

editor/
  ConfirmSheet · FreeformPromptBox · QuickChips
  ResponseEditorBox · SelectionToolbar · StreamingText

review/
  ReviewRow

offer/
  RecoveryOfferWidget

history/
  EditHistoryPanel
```

---

## Deployment

### One-command Vercel deploy

```bash
npx vercel --prod
```

### Environment variables in Vercel dashboard

In your Vercel project → Settings → Environment Variables, add:

| Name | Environment |
|---|---|
| `GROQ_API_KEY` | Production, Preview |
| `SUPABASE_URL` | Production, Preview |
| `SUPABASE_ANON_KEY` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview |
| `VITE_SUPABASE_URL` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview |

> `VITE_*` variables are embedded at build time by Vite. The non-prefixed versions are used by serverless API functions at runtime.

### vercel.json summary

- `buildCommand`: builds the Vite SPA
- `outputDirectory`: `frontend/dist`
- `functions`: all `/api/*.ts` files run as Node 20 serverless functions
- `rewrites`: SPA fallback — any path not starting with `/api/` serves `index.html`
- `headers`: CORS headers on `/api/*`, long-cache on `/assets/*`

### Supabase Row Level Security

All tables have RLS enabled. Policies ensure users can only read/write their own data (matched by `user_id = auth.uid()`). The service role key bypasses RLS for admin operations in serverless functions.

---

## License

MIT
