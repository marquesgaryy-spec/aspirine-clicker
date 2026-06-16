import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

export interface WorldSave {
  pseudo: string
  world_data: unknown
  updated_at?: string
}

export async function loadWorld(pseudo: string): Promise<unknown | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('worlds')
    .select('world_data')
    .eq('pseudo', pseudo.toLowerCase())
    .single()
  if (error || !data) return null
  return data.world_data
}

export async function saveWorld(pseudo: string, worldData: unknown): Promise<void> {
  if (!supabase) return
  await supabase.from('worlds').upsert({
    pseudo: pseudo.toLowerCase(),
    world_data: worldData,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'pseudo' })
}
