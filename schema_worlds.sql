-- GaryWorld — table de sauvegarde des mondes par pseudo
-- Coller dans Supabase > SQL Editor > Run

CREATE TABLE IF NOT EXISTS public.worlds (
  pseudo       TEXT        PRIMARY KEY,
  world_data   JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "worlds_read"   ON public.worlds;
DROP POLICY IF EXISTS "worlds_insert" ON public.worlds;
DROP POLICY IF EXISTS "worlds_update" ON public.worlds;

CREATE POLICY "worlds_read"   ON public.worlds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "worlds_insert" ON public.worlds FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "worlds_update" ON public.worlds FOR UPDATE TO anon, authenticated USING (true);
