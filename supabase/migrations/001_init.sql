-- ─────────────────────────────────────────────────────────────
-- Olly — Initial Schema Migration
-- ─────────────────────────────────────────────────────────────

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id               uuid         REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  brand_name       text,
  brand_voice      text,
  brand_rules      jsonb        NOT NULL DEFAULT '[]'::jsonb,
  contact_info     text,
  offer_template   text,
  platforms        text[]       NOT NULL DEFAULT '{}'::text[],
  tone_formality   integer      NOT NULL DEFAULT 3 CHECK (tone_formality BETWEEN 1 AND 5),
  tone_warmth      integer      NOT NULL DEFAULT 4 CHECK (tone_warmth BETWEEN 1 AND 5),
  tone_verbosity   integer      NOT NULL DEFAULT 3 CHECK (tone_verbosity BETWEEN 1 AND 5),
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'One profile per auth user — stores brand voice and settings.';
COMMENT ON COLUMN public.profiles.tone_formality  IS '1 = very casual, 5 = very formal';
COMMENT ON COLUMN public.profiles.tone_warmth     IS '1 = cool/businesslike, 5 = warm/friendly';
COMMENT ON COLUMN public.profiles.tone_verbosity  IS '1 = terse, 5 = verbose';

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reviews (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform       text         NOT NULL,
  reviewer_name  text,
  rating         integer      CHECK (rating BETWEEN 1 AND 5),
  review_text    text         NOT NULL,
  review_date    timestamptz  NOT NULL DEFAULT now(),
  location_name  text,
  tags           jsonb        NOT NULL DEFAULT '{"complaints":[],"praises":[]}'::jsonb,
  status         text         NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'draft', 'posted', 'ignored')),
  created_at     timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reviews IS 'Imported or manually entered customer reviews.';
COMMENT ON COLUMN public.reviews.tags    IS '{"complaints": ["wait time"], "praises": ["ambiance"]}';
COMMENT ON COLUMN public.reviews.status  IS 'pending → draft → posted | ignored';

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.responses (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id     uuid         NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id       uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       text         NOT NULL,
  version       integer      NOT NULL DEFAULT 1,
  is_active     boolean      NOT NULL DEFAULT false,
  edit_history  jsonb        NOT NULL DEFAULT '[]'::jsonb,
  posted_at     timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.responses IS 'All generated/edited responses. Multiple rows per review (one per version).';
COMMENT ON COLUMN public.responses.is_active    IS 'Only one response per review should be active.';
COMMENT ON COLUMN public.responses.edit_history IS '[{version, content, action, timestamp}]';

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.response_templates (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating_min    integer      CHECK (rating_min BETWEEN 1 AND 5),
  rating_max    integer      CHECK (rating_max BETWEEN 1 AND 5),
  template_text text,
  usage_count   integer      NOT NULL DEFAULT 0,
  created_at    timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT chk_rating_range CHECK (
    rating_min IS NULL OR rating_max IS NULL OR rating_min <= rating_max
  )
);

COMMENT ON TABLE public.response_templates IS 'Reusable response starters scoped to rating ranges.';

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_templates ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── reviews ──────────────────────────────────────────────────
CREATE POLICY "reviews_select_own"
  ON public.reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_delete_own"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ── responses ────────────────────────────────────────────────
CREATE POLICY "responses_select_own"
  ON public.responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "responses_insert_own"
  ON public.responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "responses_update_own"
  ON public.responses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "responses_delete_own"
  ON public.responses FOR DELETE
  USING (auth.uid() = user_id);

-- ── response_templates ───────────────────────────────────────
CREATE POLICY "templates_select_own"
  ON public.response_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "templates_insert_own"
  ON public.response_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "templates_update_own"
  ON public.response_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "templates_delete_own"
  ON public.response_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

-- reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_id     ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status      ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_platform    ON public.reviews(platform);
CREATE INDEX IF NOT EXISTS idx_reviews_rating      ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at  ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_review_date ON public.reviews(review_date DESC);
-- composite for the common dashboard query
CREATE INDEX IF NOT EXISTS idx_reviews_user_status_date
  ON public.reviews(user_id, status, created_at DESC);

-- responses
CREATE INDEX IF NOT EXISTS idx_responses_review_id  ON public.responses(review_id);
CREATE INDEX IF NOT EXISTS idx_responses_user_id    ON public.responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_is_active  ON public.responses(is_active)
  WHERE is_active = true;

-- response_templates
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.response_templates(user_id);

-- ─────────────────────────────────────────────────────────────
-- Triggers — updated_at
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_responses_updated_at
  BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Trigger — auto-create profile on signup
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Trigger — keep only one active response per review
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_single_active_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.responses
    SET    is_active = false
    WHERE  review_id = NEW.review_id
      AND  id        != NEW.id
      AND  is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_single_active_response
  AFTER INSERT OR UPDATE OF is_active ON public.responses
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.enforce_single_active_response();
