// src/app/lib/supabaseAdmin.ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    // Service role should not create/persist user sessions
    autoRefreshToken: false,
    persistSession: false,
  },
});
