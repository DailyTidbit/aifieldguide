import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-6" role="img" aria-label="Compass">🧭</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3 font-serif">Page Not Found</h1>
        <p className="text-gray-600 text-lg mb-2">
          This page doesn&apos;t exist.
        </p>
        <p className="text-gray-600 mb-8">
          Try browsing the AI Field Guide instead.
        </p>
        <Link
          href="/field-guide"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#60A875' }}
        >
          <span>Browse the Field Guide</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
