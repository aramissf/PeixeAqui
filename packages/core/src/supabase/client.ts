import { createClient } from '@supabase/supabase-js'
import type { Database } from '@peixeaqui/types'

const supabaseUrl =
  process.env['EXPO_PUBLIC_SUPABASE_URL'] ??
  process.env['NEXT_PUBLIC_SUPABASE_URL'] ??
  'https://placeholder.supabase.co'

const supabaseAnonKey =
  process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ??
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ??
  'placeholder'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type SupabaseClient = typeof supabase
