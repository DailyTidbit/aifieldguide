CREATE TABLE IF NOT EXISTS ai_tools_pending (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES ai_tools(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  approved boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX ai_tools_pending_active_idx
  ON ai_tools_pending(tool_id, field_name)
  WHERE NOT approved;

ALTER TABLE ai_tools_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no_public_access" ON ai_tools_pending
  FOR ALL USING (false);
