import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our auth system
export interface User {
  id: string
  email?: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
    provider?: string
  }
}

export interface AuthError {
  message: string
  status?: number
}