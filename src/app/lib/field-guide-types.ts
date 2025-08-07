// src/app/lib/field-guide-types.ts

export interface FieldGuideSection {
  id: string
  section_number: number
  section_name: string
  slug: string
  intro?: string
  summary?: string
  use_cases?: string
  created_at?: string
  updated_at?: string
}

export interface AITool {
  id: string
  name: string
  company?: string
  category: string
  description: string
  detailed_description?: string  // NEW: Added detailed_description field
  use_cases?: string
  access_notes?: string
  website?: string
  free_tier: boolean
  login_required: boolean
  created_at?: string
  updated_at?: string
}

// REMOVED: ToolDetail interface since detailed_description is now in AITool
// export interface ToolDetail {
//   id: string
//   tool_id: string
//   detailed_description: string
//   created_at?: string
//   updated_at?: string
// }