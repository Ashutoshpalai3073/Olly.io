# Olly — Deployment Checklist

Use this checklist for every production deployment. Check off each item before promoting to production.

---

## Pre-deployment

### Environment & secrets
- [ ] `GROQ_API_KEY` set in Vercel project (Production environment)
- [ ] `SUPABASE_URL` set in Vercel project
- [ ] `SUPABASE_ANON_KEY` set in Vercel project
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in Vercel project
- [ ] `VITE_SUPABASE_URL` set in Vercel project (build-time, same as `SUPABASE_URL`)
- [ ] `VITE_SUPABASE_ANON_KEY` set in Vercel project (build-time)
- [ ] `VITE_USE_MOCK_DATA` is **NOT** set to `true` in Production (only in dev)
- [ ] No `.env` or `.env.local` files committed to git (`git status` clean)

### Database
- [ ] Supabase migration `001_initial.sql` has been run against the production database
- [ ] RLS policies verified: users can only read/write their own `user_id` rows
- [ ] `profiles`, `reviews`, `responses` tables exist with correct schemas
- [ ] Service role key is from Production project, not local/staging

### Code
- [ ] TypeScript compiles with no errors: `cd frontend && npm run typecheck`
- [ ] Production build succeeds: `cd frontend && npm run build`
- [ ] No `console.log` statements left in API handlers
- [ ] No hardcoded API keys, credentials, or internal URLs in frontend code
- [ ] `IS_DEV_MODE` banner is hidden in production (requires `VITE_SUPABASE_URL` to be set)

### Dependencies
- [ ] `frontend/package.json` — no packages pinned to a known-vulnerable version
- [ ] `package.json` (root) — Vercel CLI version is current

---

## Deployment

### Vercel
- [ ] Deploy via `npx vercel --prod` or merge to `main` with CI auto-deploy enabled
- [ ] Build logs reviewed — no warnings about missing env vars
- [ ] Output directory confirmed as `frontend/dist`
- [ ] Serverless functions show as `nodejs20.x` in Vercel dashboard

### DNS / domain (first deploy only)
- [ ] Custom domain added in Vercel → Domains
- [ ] SSL certificate issued (auto via Let's Encrypt)
- [ ] `www` redirect configured (www → apex or vice versa)

---

## Post-deployment smoke tests

Run these manually against the production URL after every deploy:

### Auth flow
- [ ] `/login` loads — OTP email field visible
- [ ] Enter a real email → OTP email arrives within 60 seconds
- [ ] Enter OTP → redirected to `/dashboard` (or `/setup` for new users)
- [ ] Refresh on `/dashboard` → stays authenticated (session persisted)
- [ ] Sign out → redirected to `/login`, session cleared

### Brand setup (new user)
- [ ] `/setup` renders all 4 steps
- [ ] Brand name + platform selection persists to Supabase (`profiles` table)
- [ ] Brand voice analysis calls `/api/analyze-voice` — response arrives within 10s
- [ ] Completing setup redirects to `/dashboard`

### Review queue
- [ ] `/queue` loads reviews from Supabase (`/api/reviews`)
- [ ] Filtering by platform, rating, status works
- [ ] Clicking a review navigates to `/editor/:reviewId`

### Response editor (critical path)
- [ ] Editor loads review content and any existing response draft
- [ ] "Generate" button calls `/api/generate` — SSE stream starts within 3s
- [ ] Streamed text appears token-by-token in the editor textarea
- [ ] Stream completes; "Generate" button re-enables
- [ ] Text selection → SelectionToolbar appears with edit options
- [ ] Quick chip ("Make it shorter") fires `/api/edit` — edited text replaces selection
- [ ] Freeform prompt box → "Apply" fires `/api/apply-prompt` — full response updated
- [ ] Undo / Cmd+Z reverts to previous version
- [ ] "Approve & post" marks response `is_active: true` and sets `posted_at`
- [ ] Edit history panel shows version list with diffs

### Analytics
- [ ] `/analytics` loads charts — no blank panels
- [ ] Date range selector (7 / 30 / 90 / 365 days) updates data

### Settings
- [ ] `/settings` loads current brand profile
- [ ] Saving changes calls `/api/brand-settings` PATCH — success toast shown
- [ ] Brand voice analysis button calls `/api/analyze-voice`

### API edge cases
- [ ] `POST /api/generate` with missing `reviewId` → 400 Bad Request
- [ ] Any `/api/*` with missing or invalid `Authorization` header → 401 Unauthorized
- [ ] `GET /api/reviews/:id` with non-existent ID → 404 Not Found
- [ ] `POST /api/generate` while Groq is down → 503 (confirm error toast shown in UI)

---

## Rollback plan

If the deployment causes regressions:

1. In Vercel dashboard → Deployments → select last known-good deployment → **Promote to Production**
2. If a database migration was the cause: revert via Supabase SQL editor (migrations are additive — dropping a column requires a manual `ALTER TABLE`)
3. Alert via Slack/email if the rollback takes > 15 minutes

---

## Performance targets

Verify with Lighthouse or Chrome DevTools after deploy:

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5 s |
| FID / INP | < 200 ms |
| CLS | < 0.1 |
| JS bundle (main chunk) | < 200 KB gzip |
| Time to first SSE token | < 3 s |

---

## Monitoring

- Vercel Functions logs: check for unhandled errors in `/api/generate` within 30 min of deploy
- Supabase dashboard: confirm no spike in DB errors or RLS policy violations
- Groq console: confirm request volume and latency are within expected range
