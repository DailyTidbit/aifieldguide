CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- No public access — only service role (admin) can read
CREATE POLICY "No public read on contact_submissions"
  ON contact_submissions FOR SELECT
  USING (false);

CREATE POLICY "No public update on contact_submissions"
  ON contact_submissions FOR UPDATE
  USING (false);

CREATE POLICY "No public delete on contact_submissions"
  ON contact_submissions FOR DELETE
  USING (false);

CREATE INDEX IF NOT EXISTS contact_submissions_status_idx ON contact_submissions (status);
CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx ON contact_submissions (created_at DESC);
