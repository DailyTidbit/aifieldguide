// src/app/lib/supabaseClient.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';
// import type { Database } from '@/app/types' // if you generated types, you can add them

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// If you have DB types, you can do:
// export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
export const supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Back-compat aliases so existing imports don’t break
export const supabase = supabaseClient;
export default supabaseClient;
