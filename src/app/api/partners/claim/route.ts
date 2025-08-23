// src/app/api/partners/claim/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { companyId } = (await req.json()) as { companyId?: string };
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const emailDomain = user.email.toLowerCase().split('@')[1]?.replace(/^www\./, '');

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('id, name, domain, domains')
      .eq('id', companyId)
      .maybeSingle();

    if (error || !company) return NextResponse.json({ error: 'company not found' }, { status: 404 });

    const allowed = new Set<string>([
      ...(company.domains ?? []),
      ...(company.domain ? [company.domain] : []),
    ].map((d: string) => d.toLowerCase().replace(/^www\./, '')));

    const ok = Array.from(allowed).some(d => emailDomain === d || emailDomain.endsWith(`.${d}`));
    if (!ok) {
      return NextResponse.json({ ok: false, error: `email domain ${emailDomain} not allowed`, allowed: Array.from(allowed) }, { status: 403 });
    }

    // 1) Attach user to company (first => admin, else editor)
    const { count } = await supabaseAdmin
      .from('company_users')
      .select('*', { head: true, count: 'exact' })
      .eq('company_id', companyId);

    const role = (count ?? 0) === 0 ? 'company_admin' : 'company_editor';

    const { error: upErr } = await supabaseAdmin
      .from('company_users')
      .upsert({ user_id: user.id, company_id: companyId, role }, { onConflict: 'user_id,company_id' });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // 2) Ensure a minimal consumer profile exists (prevents "Profile not found" modal)
    const display =
      (user.user_metadata as any)?.full_name ||
      user.email.split('@')[0];
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: user.id, display_name: display }, { onConflict: 'id', ignoreDuplicates: false })
      .select()
      .maybeSingle();

    // 3) Ensure a company-wide profile row exists
    await supabaseAdmin
      .from('company_profiles')
      .upsert({ company_id: companyId }, { onConflict: 'company_id', ignoreDuplicates: true });

    // 4) Ensure a member business profile row exists
    await supabaseAdmin
      .from('company_member_profiles')
      .upsert(
        { user_id: user.id, company_id: companyId },
        { onConflict: 'user_id,company_id', ignoreDuplicates: true }
      );

    return NextResponse.json({ ok: true, role });
  } catch (e) {
    console.error('[partners/claim] error', e);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
