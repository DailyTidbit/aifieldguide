-- Enable RLS on tables that were missing it.
-- field_guide_sections needs a permissive SELECT policy because
-- the app reads it with the anon key via createServerClient().
-- All other tables below are legacy or internal — no public access needed.

-- ── field_guide_sections ──────────────────────────────────────────────────────
ALTER TABLE field_guide_sections ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read sections (same behavior as before RLS was added).
-- Writes are blocked for anon/authenticated roles; service role bypasses RLS.
CREATE POLICY "Public can read field guide sections"
  ON field_guide_sections FOR SELECT
  USING (true);

-- ── admin_users ───────────────────────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to admin_users"
  ON admin_users FOR ALL
  USING (false);

-- ── rate_limits ───────────────────────────────────────────────────────────────
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to rate_limits"
  ON rate_limits FOR ALL
  USING (false);

-- ── tidbits ───────────────────────────────────────────────────────────────────
ALTER TABLE tidbits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to tidbits"
  ON tidbits FOR ALL
  USING (false);

-- ── tidbit_steps ──────────────────────────────────────────────────────────────
ALTER TABLE tidbit_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to tidbit_steps"
  ON tidbit_steps FOR ALL
  USING (false);
