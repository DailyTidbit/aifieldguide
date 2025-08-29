// app/api/tidbits/route.ts  (keep your edge+cache headers)
import { createServerClient } from '@/app/lib/supabaseServer' // or your server client

export const runtime = 'edge';
export const preferredRegion = 'auto';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const perPage = Math.min(50, Number(searchParams.get('perPage') ?? 24));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = createServerClient(); // server-side client (no RLS leaks)

  // Only fields you render in list
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, created_at, user_id, content, media_url, tidbit, is_private')
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Batch profiles (avoid N+1)
  const userIds = [...new Set((posts ?? []).map(p => p.user_id).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds)
    : { data: [] as any[] };

  const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);
  const payload = (posts ?? []).map(p => ({
    ...p,
    username: profileMap.get(p.user_id || '')?.username ?? 'anonymous',
    user_avatar: profileMap.get(p.user_id || '')?.avatar_url ?? null,
  }));

  return new Response(JSON.stringify({ data: payload }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, s-maxage=120, stale-while-revalidate=600',
    },
  });
}
