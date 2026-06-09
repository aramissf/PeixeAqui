import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@peixeaqui/types'

type Profile = Database['public']['Tables']['profiles']['Row']

type AuthStore = {
  user: User | null
  profile: Profile | null
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
}))
