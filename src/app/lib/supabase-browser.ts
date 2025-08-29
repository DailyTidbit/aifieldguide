// src/app/lib/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr'

let supabaseClientInstance: any | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseClientInstance
}

// For backwards compatibility with existing imports
export const supabaseClient = getSupabaseBrowserClient()
export default getSupabaseBrowserClient