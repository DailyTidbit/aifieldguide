-- Audit runs: one row per triggered audit session
CREATE TABLE IF NOT EXISTS audit_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',       -- running | completed | partial | failed
  discover_status text NOT NULL DEFAULT 'pending', -- pending | running | completed | failed
  tools_status text NOT NULL DEFAULT 'pending',
  categories_status text NOT NULL DEFAULT 'pending',
  error text
);

-- Suggested new tools to add to the directory
CREATE TABLE IF NOT EXISTS audit_new_tools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_run_id uuid REFERENCES audit_runs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  tool_name text NOT NULL,
  website text,
  description text,
  suggested_category text,
  reason text,
  source_urls text[] DEFAULT '{}',
  funding_info text,
  status text NOT NULL DEFAULT 'pending',       -- pending | added | dismissed
  added_tool_id uuid REFERENCES ai_tools(id) ON DELETE SET NULL
);

-- Audit flags on existing tools
CREATE TABLE IF NOT EXISTS audit_tool_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_run_id uuid REFERENCES audit_runs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  tool_id uuid REFERENCES ai_tools(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  current_website text,
  flag text NOT NULL,                           -- keep | update | remove
  reason text,
  suggested_changes jsonb,
  status text NOT NULL DEFAULT 'pending'        -- pending | actioned | dismissed
);

-- Category structure suggestions
CREATE TABLE IF NOT EXISTS audit_category_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_run_id uuid REFERENCES audit_runs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  suggestion_type text NOT NULL,                -- merge | split | new | rename
  current_categories text[] DEFAULT '{}',
  suggested_category text,
  affected_tools text[] DEFAULT '{}',
  reasoning text,
  status text NOT NULL DEFAULT 'pending'        -- pending | dismissed
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_new_tools_status ON audit_new_tools(status);
CREATE INDEX IF NOT EXISTS idx_audit_new_tools_run ON audit_new_tools(audit_run_id);
CREATE INDEX IF NOT EXISTS idx_audit_tool_flags_status ON audit_tool_flags(status);
CREATE INDEX IF NOT EXISTS idx_audit_tool_flags_flag ON audit_tool_flags(flag);
CREATE INDEX IF NOT EXISTS idx_audit_tool_flags_run ON audit_tool_flags(audit_run_id);
CREATE INDEX IF NOT EXISTS idx_audit_category_suggestions_status ON audit_category_suggestions(status);

-- RLS: service role only
ALTER TABLE audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_new_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_tool_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_category_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access" ON audit_runs FOR ALL USING (false);
CREATE POLICY "No public access" ON audit_new_tools FOR ALL USING (false);
CREATE POLICY "No public access" ON audit_tool_flags FOR ALL USING (false);
CREATE POLICY "No public access" ON audit_category_suggestions FOR ALL USING (false);
