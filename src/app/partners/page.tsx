export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 space-y-8">
      <h1 className="text-4xl font-semibold">Partner Hub</h1>
      <p className="text-neutral-600 max-w-2xl">Keep your listing accurate, talk to us directly, and see where your brand appears across Daily Tidbit.</p>
      <div className="flex gap-3">
        <a href="/auth" className="rounded-full border px-4 py-2 text-sm">Sign in</a>
        <a href="/partners/dashboard" className="rounded-full border px-4 py-2 text-sm">Go to dashboard</a>
      </div>
      <section className="pt-8 border-t">
        <h2 className="text-xl font-semibold mb-2">More ways to participate</h2>
        <div className="rounded-2xl border bg-neutral-50 p-4 inline-block">
          <div className="text-sm">Psst… $1 intro: Sponsor a Daily Tidbit (1 day per company).</div>
          <a className="underline underline-offset-4 text-sm" href="/partners/ads">Learn more →</a>
        </div>
      </section>
    </main>
  )
}
