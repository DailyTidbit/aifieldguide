// src/app/partners/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';

type CompanyProfile = {
  support_email?: string | null;
  billing_email?: string | null;
  marketing_email?: string | null;
  logo_url?: string | null;
  socials?: Record<string, string> | null;
};
type MemberProfile = {
  title?: string | null;
  phone?: string | null;
  timezone?: string | null;
  notify_new_messages?: boolean;
  notify_listing_changes?: boolean;
  billing_email?: string | null;
  marketing_email?: string | null;
};

export default function VendorSettings() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile>({});
  const [member, setMember]   = useState<MemberProfile>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);
      const res = await fetch('/api/partners/settings/profile');
      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || 'Unable to load settings');
      } else {
        setCompany(data.company || {});
        setMember(data.member || {});
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setMsg(null);
    const res = await fetch('/api/partners/settings/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, member }),
    });
    const data = await res.json();
    setMsg(res.ok ? 'Saved!' : (data?.error || 'Save failed'));
  }

  if (loading) return <main className="mx-auto max-w-3xl p-8">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-8">
      <h1 className="text-2xl font-semibold">Vendor Settings</h1>

      <section className="rounded-2xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Company profile</h2>
        <Field label="Support email" value={company.support_email ?? ''} onChange={(v)=>setCompany(s=>({...s, support_email:v}))} />
        <Field label="Billing email" value={company.billing_email ?? ''} onChange={(v)=>setCompany(s=>({...s, billing_email:v}))} />
        <Field label="Marketing email" value={company.marketing_email ?? ''} onChange={(v)=>setCompany(s=>({...s, marketing_email:v}))} />
        <Field label="Logo URL" value={company.logo_url ?? ''} onChange={(v)=>setCompany(s=>({...s, logo_url:v}))} />
      </section>

      <section className="rounded-2xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Your vendor profile</h2>
        <Field label="Title" value={member.title ?? ''} onChange={(v)=>setMember(s=>({...s, title:v}))} />
        <Field label="Phone" value={member.phone ?? ''} onChange={(v)=>setMember(s=>({...s, phone:v}))} />
        <Field label="Timezone" value={member.timezone ?? ''} onChange={(v)=>setMember(s=>({...s, timezone:v}))} />
        <Check label="Notify: new messages" checked={!!member.notify_new_messages} onChange={(v)=>setMember(s=>({...s, notify_new_messages:v}))} />
        <Check label="Notify: listing changes" checked={!!member.notify_listing_changes} onChange={(v)=>setMember(s=>({...s, notify_listing_changes:v}))} />
        <Field label="Billing email (you)" value={member.billing_email ?? ''} onChange={(v)=>setMember(s=>({...s, billing_email:v}))} />
        <Field label="Marketing email (you)" value={member.marketing_email ?? ''} onChange={(v)=>setMember(s=>({...s, marketing_email:v}))} />
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} className="rounded-full border px-4 py-2 text-sm hover:shadow">Save changes</button>
        {msg && <div className="text-sm">{msg}</div>}
      </div>
    </main>
  );
}

function Field({ label, value, onChange }:{label:string; value:string; onChange:(v:string)=>void}) {
  return (
    <label className="block">
      <div className="text-xs font-medium mb-1">{label}</div>
      <input className="w-full rounded-lg border px-3 py-2 text-sm" value={value} onChange={(e)=>onChange(e.target.value)} />
    </label>
  );
}
function Check({ label, checked, onChange }:{label:string; checked:boolean; onChange:(v:boolean)=>void}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
