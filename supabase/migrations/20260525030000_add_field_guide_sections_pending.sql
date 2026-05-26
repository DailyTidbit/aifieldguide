CREATE TABLE IF NOT EXISTS field_guide_sections_pending (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES field_guide_sections(id) ON DELETE CASCADE,
  section_name text NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX fgs_pending_active_idx
  ON field_guide_sections_pending(section_id, field_name)
  WHERE NOT approved;

ALTER TABLE field_guide_sections_pending ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no_public_access" ON field_guide_sections_pending FOR ALL USING (false);
