// src/app/api/partners/settings/profile/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET() {
  try {
    const jar = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(n: string) { return jar.get(n)?.value; },
          set(n: string, v: string, o: CookieOptions) { jar.set({ name: n, value: v, ...o }); },
          remove(n: string, o: CookieOptions) { jar.set({ name: n, value: '', ...o }); },
        },
      }
    );

    // Resolve active company via membership (choose first for now)
    const { data: me } = await supabase.auth.getUser();
    if (!me?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: memberships, error: mErr } = await supabase
      .from('company_users')
      .select('company_id, role')
      .eq('user_id', me.user.id)
      .limit(1);

    if (mErr || !memberships?.length) return NextResponse.json({ error: 'no company membership' }, { status: 404 });
    const companyId = memberships[0].company_id;

    const [{ data: company }, { data: member }] = await Promise.all([
      supabase.from('company_profiles').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('company_member_profiles').select('*').eq('company_id', companyId).eq('user_id', me.user.id).maybeSingle()
    ]);

    return NextResponse.json({ company, member });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { company?: any; member?: any };
    const jar = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(n: string) { return jar.get(n)?.value; },
          set(n: string, v: string, o: CookieOptions) { jar.set({ name: n, value: v, ...o }); },
          remove(n: string, o: CookieOptions) { jar.set({ name: n, value: '', ...o }); },
        },
      }
    );

    const { data: me } = await supabase.auth.getUser();
    if (!me?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: memberships } = await supabase
      .from('company_users')
      .select('company_id, role')
      .eq('user_id', me.user.id)
      .limit(1);

    if (!memberships?.length) return NextResponse.json({ error: 'no company membership' }, { status: 404 });
    const companyId = memberships[0].company_id;

    // Upserts rely on the RLS policies you added above
    if (body.company) {
      await supabase.from('company_profiles').upsert({ company_id: companyId, ...body.company }, { onConflict: 'company_id' });
    }
    if (body.member) {
      await supabase.from('company_member_profiles').upsert({ user_id: me.user.id, company_id: companyId, ...body.member }, { onConflict: 'user_id,company_id' });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
