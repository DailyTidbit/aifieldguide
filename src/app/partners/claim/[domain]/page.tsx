export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import ClaimClient from './ClaimClient';

function normalizeDomain(d: string) {
  return decodeURIComponent(d).toLowerCase().replace(/^www\./, '');
}

export default async function Page({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const raw = normalizeDomain(domain);

  // Read current auth session on the server (so UI knows if user is signed in)
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

  // Find the company by primary domain or domains[]
  let { data: company } = await supabaseAdmin
    .from('companies')
    .select('id, name, domain, domains')
    .eq('domain', raw)
    .maybeSingle();

  if (!company) {
    const { data: fallback } = await supabaseAdmin
      .from('companies')
      .select('id, name, domain, domains')
      .contains('domains', [raw])
      .maybeSingle();
    company = fallback ?? null;
  }

  if (!company) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-semibold mb-2">Unknown company</h1>
        <p className="text-sm text-neutral-600">
          We couldn’t find a company for{' '}
          <code className="px-1 py-0.5 rounded bg-neutral-100">{raw}</code>.
          Double-check the link or{' '}
          <a className="underline" href="/partners/messages/new">request manual verification</a>.
        </p>
      </main>
    );
  }

  const allowedDomains = Array.from(
    new Set([...(company.domains ?? []), ...(company.domain ? [company.domain] : [])]
      .map((d: string) => d.toLowerCase().replace(/^www\./, '')))
  );

  return (
    <ClaimClient
      isAuthed={!!user}
      companyId={company.id}
      companyName={company.name}
      requestedDomain={raw}
      allowedDomains={allowedDomains}
    />
  );
}
