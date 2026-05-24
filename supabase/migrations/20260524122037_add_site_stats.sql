-- Site-wide statistics table for the visitor counter
CREATE TABLE IF NOT EXISTS site_stats (
  key TEXT PRIMARY KEY,
  value BIGINT NOT NULL DEFAULT 0
);

-- Seed with a starting number so day-one visitors don't see 0000001
INSERT INTO site_stats (key, value) VALUES ('visit_count', 1000)
ON CONFLICT (key) DO NOTHING;

-- Row-level security: public read, public increment (it's just a counter)
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON site_stats
  FOR SELECT USING (true);

CREATE POLICY "public update" ON site_stats
  FOR UPDATE USING (true);

CREATE POLICY "public insert" ON site_stats
  FOR INSERT WITH CHECK (true);
