-- ============================================================
-- ASPIRINE CLICKER — Supabase SQL Schema v3
-- Sauvegarde complète de la progression par pseudo
-- ============================================================
-- Instructions :
--   1. Ouvre Dashboard > SQL Editor
--   2. Colle tout ce fichier et clique Run
--   3. Si la table leaderboard existait déjà, les nouvelles
--      colonnes seront ajoutées sans perte de données (ALTER)
-- ============================================================

-- ── Table score mondial ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.global_score (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  score      BIGINT  NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.global_score (id, score)
  VALUES (1, 0)
  ON CONFLICT (id) DO NOTHING;

-- ── Table leaderboard (progression complète) ─────────────────
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo       TEXT        NOT NULL UNIQUE,
  token        TEXT        NOT NULL DEFAULT '',  -- token localStorage (session)
  code         TEXT        NOT NULL DEFAULT '',  -- code 4 chiffres
  clicks       BIGINT      NOT NULL DEFAULT 0,   -- total cachets produits
  spent        BIGINT      NOT NULL DEFAULT 0,   -- total cachets dépensés
  combos       BIGINT      NOT NULL DEFAULT 0,   -- nombre de dissolutions
  chaleur      SMALLINT    NOT NULL DEFAULT 0,   -- niveau Eau chaude (0-15)
  aides        SMALLINT    NOT NULL DEFAULT 0,   -- niveau Aide-soignant (0-25)
  labo         SMALLINT    NOT NULL DEFAULT 0,   -- niveau Labo R&D (0-10)
  catalyseur   SMALLINT    NOT NULL DEFAULT 0,   -- niveau Catalyseur (0-3)
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajouter les colonnes si la table existait déjà (migration safe)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leaderboard' AND column_name='spent') THEN
    ALTER TABLE public.leaderboard ADD COLUMN spent      BIGINT   NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leaderboard' AND column_name='combos') THEN
    ALTER TABLE public.leaderboard ADD COLUMN combos     BIGINT   NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leaderboard' AND column_name='chaleur') THEN
    ALTER TABLE public.leaderboard ADD COLUMN chaleur    SMALLINT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leaderboard' AND column_name='aides') THEN
    ALTER TABLE public.leaderboard ADD COLUMN aides      SMALLINT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leaderboard' AND column_name='labo') THEN
    ALTER TABLE public.leaderboard ADD COLUMN labo       SMALLINT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leaderboard' AND column_name='catalyseur') THEN
    ALTER TABLE public.leaderboard ADD COLUMN catalyseur SMALLINT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leaderboard' AND column_name='token') THEN
    ALTER TABLE public.leaderboard ADD COLUMN token TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leaderboard' AND column_name='code') THEN
    ALTER TABLE public.leaderboard ADD COLUMN code TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lb_clicks ON public.leaderboard (clicks DESC);

-- ── Fonction incrément score mondial ─────────────────────────
CREATE OR REPLACE FUNCTION public.increment_global_score(amount BIGINT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.global_score
    SET score = score + amount, updated_at = NOW()
    WHERE id = 1;
END;
$$;

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.global_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard  ENABLE ROW LEVEL SECURITY;

-- global_score
DROP POLICY IF EXISTS "anon_read_gs"   ON public.global_score;
DROP POLICY IF EXISTS "anon_update_gs" ON public.global_score;
CREATE POLICY "anon_read_gs"   ON public.global_score FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_update_gs" ON public.global_score FOR UPDATE TO anon, authenticated USING (true);

-- leaderboard
DROP POLICY IF EXISTS "anon_read_lb"   ON public.leaderboard;
DROP POLICY IF EXISTS "anon_insert_lb" ON public.leaderboard;
DROP POLICY IF EXISTS "anon_update_lb" ON public.leaderboard;
CREATE POLICY "anon_read_lb"   ON public.leaderboard FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_lb" ON public.leaderboard FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_lb" ON public.leaderboard FOR UPDATE TO anon, authenticated USING (true);

-- ── Realtime ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_score;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
