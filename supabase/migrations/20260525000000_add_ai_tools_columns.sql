ALTER TABLE ai_tools
  ADD COLUMN IF NOT EXISTS last_verified timestamptz,
  ADD COLUMN IF NOT EXISTS pricing_page_url text,
  ADD COLUMN IF NOT EXISTS pricing_tiers text;
