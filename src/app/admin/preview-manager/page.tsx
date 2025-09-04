// src/app/admin/preview-manager/page.tsx - Server component wrapper
import type { Metadata } from 'next'
import PreviewManagerClient from './PreviewManagerClient'

export const metadata: Metadata = {
  title: 'Preview Manager | Admin | Daily Tidbit',
  description: 'Manage preview tokens for partner portals',
}

// ✅ CRITICAL: Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function PreviewManagerPage() {
  return <PreviewManagerClient />
}