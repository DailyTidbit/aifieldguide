// app/components/RefreshButton.tsx
'use client'

export default function RefreshButton() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <button 
      onClick={handleRefresh}
      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      Refresh Page
    </button>
  )
}