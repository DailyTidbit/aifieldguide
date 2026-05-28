-- One row per arbiter execution
CREATE TABLE IF NOT EXISTS arbiter_runs (
  id                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz   DEFAULT now() NOT NULL,
  dry_run             bool          NOT NULL DEFAULT false,
  tool_filter         text,
  total_processed     int           NOT NULL DEFAULT 0,
  approved_count      int           NOT NULL DEFAULT 0,
  rejected_count      int           NOT NULL DEFAULT 0,
  manual_count        int           NOT NULL DEFAULT 0,
  error_count         int           NOT NULL DEFAULT 0,
  duration_ms         int           NOT NULL DEFAULT 0,
  estimated_cost_usd  numeric(10,6) NOT NULL DEFAULT 0,
  input_tokens        int           NOT NULL DEFAULT 0,
  output_tokens       int           NOT NULL DEFAULT 0,
  cache_read_tokens   int           NOT NULL DEFAULT 0,
  cache_write_tokens  int           NOT NULL DEFAULT 0
);

ALTER TABLE arbiter_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to arbiter_runs"
  ON arbiter_runs FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS arbiter_runs_created_at_idx
  ON arbiter_runs (created_at DESC);

-- One row per field decision within a run
CREATE TABLE IF NOT EXISTS arbiter_logs (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id          uuid        NOT NULL REFERENCES arbiter_runs(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now() NOT NULL,
  tool_name       text        NOT NULL,
  field_name      text        NOT NULL,
  decision        text        NOT NULL CHECK (decision IN ('approve', 'reject', 'manual')),
  confidence      text        NOT NULL CHECK (confidence IN ('high', 'low')),
  reason          text        NOT NULL DEFAULT '',
  previous_value  text,
  proposed_value  text,
  applied         bool        NOT NULL DEFAULT false
);

ALTER TABLE arbiter_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to arbiter_logs"
  ON arbiter_logs FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS arbiter_logs_run_id_idx
  ON arbiter_logs (run_id);
CREATE INDEX IF NOT EXISTS arbiter_logs_tool_field_idx
  ON arbiter_logs (tool_name, field_name);
