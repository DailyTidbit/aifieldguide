// src/app/lib/field-guide-types.ts
export interface FieldGuideSection {
  id: string
  section_number: number
  section_name: string
  slug: string
  intro?: string
  use_cases?: string
  summary?: string
  created_at: string
  updated_at: string
}

export interface AITool {
  id: string
  name: string
  category: string
  company?: string
  description?: string
  use_cases?: string
  login_required: boolean
  free_tier: boolean
  paid_tier: boolean
  website?: string
  access_notes?: string
  created_at: string
}