// src/app/partners/preview/[token]/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import PreviewClient from './PreviewClient'

interface PreviewPageProps {
  params: Promise<{ token: string }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { token } = await params
  
  return <PreviewClient token={token} />
}