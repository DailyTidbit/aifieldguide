ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS ip_address text;

CREATE INDEX IF NOT EXISTS contact_submissions_ip_created_idx
  ON contact_submissions (ip_address, created_at DESC);
