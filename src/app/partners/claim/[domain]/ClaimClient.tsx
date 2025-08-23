'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/app/lib/supabaseClient';

export default function ClaimClient(props: {
  isAuthed: boolean;
  companyId: string;
  companyName: string;
  requestedDomain: string;
  allowedDomains: string[];
}) {
  const { isAuthed, companyId, companyName, requestedDomain, allowedDomains } = props;

  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const triedAutoVerify = useRef(false);

  // Keep server view in sync with client auth & auto-verify once
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    // If a session already exists (from magic link), refresh SSR view
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) router.refresh();
    });

    // On SIGNED_IN, refresh SSR so isAuthed flips to true
    const { data } = supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.refresh();
    });
    subscription = data.subscription;

    return () => subscription?.unsubscribe();
  }, [router]);

  // Auto-verify when server now sees isAuthed = true
  useEffect(() => {
    if (!isAuthed || triedAutoVerify.current) return;
    triedAutoVerify.current = true;
    verify(); // fire and forget
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, companyId]);

  async function verify() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/partners/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMsg(data?.error || 'Verification failed. Try a different work email or request manual verification.');
        setBusy(false);
        return;
      }
      setMsg(`✅ Access granted. Role: ${data.role}. Redirecting…`);
      window.location.href = '/partners/dashboard';
    } catch (e: any) {
      setMsg(e?.message || 'Network error');
      setBusy(false);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/partners/claim/${requestedDomain}`;
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setMsg(error ? error.message : 'Check your email for a sign-in link.');
  }

  return (
    <main className="mx-auto max-w-2xl p-8 space-y-6">
      <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">Access your listing</div>
      <h1 className="text-2xl font-semibold">Access {companyName}</h1>
      <p className="text-sm text-neutral-600">
        Sign in with an <b>@{requestedDomain}</b> email to access your vendor dashboard.
      </p>

      <div className="rounded-xl border p-4 bg-white">
        <div className="text-sm font-medium mb-2">Accepted domains</div>
        <div className="flex flex-wrap gap-2">
          {allowedDomains.map((d) => (
            <span key={d} className="text-xs rounded-full border px-2 py-1">{d}</span>
          ))}
        </div>
      </div>

      {!isAuthed ? (
        <form onSubmit={sendMagicLink} className="space-y-3">
          <label className="block">
            <div className="text-xs font-medium mb-1">Work email (@{requestedDomain})</div>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              type="email"
              placeholder={`name@${requestedDomain}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button className="rounded-full border px-4 py-2 text-sm hover:shadow" type="submit">
            Email me a sign-in link
          </button>
          {msg && <div className="text-sm text-neutral-700">{msg}</div>}
        </form>
      ) : (
        <div className="space-y-2">
          <button
            onClick={verify}
            disabled={busy}
            className="rounded-full border px-4 py-2 text-sm hover:shadow disabled:opacity-60"
          >
            {busy ? 'Verifying…' : 'Verify & continue'}
          </button>
          {msg && <div className="text-sm text-neutral-700">{msg}</div>}
        </div>
      )}

      <div className="text-xs text-neutral-500">
        Don’t have an @{requestedDomain} email?{' '}
        <Link href="/partners/messages/new" className="underline underline-offset-4">Request manual verification</Link>.
      </div>
    </main>
  );
}
