-- analytics_summary: internal analytics aggregate — no public access.
-- Revoke from both anon and authenticated; service role bypasses grants.
REVOKE SELECT ON analytics_summary FROM anon, authenticated;

-- v_my_companies: user-scoped view (already filters WHERE user_id = auth.uid()).
-- Revoke anon access and enable security_invoker so the view runs as the
-- calling role, which means RLS on the underlying company_users table is enforced.
REVOKE SELECT ON v_my_companies FROM anon;
ALTER VIEW v_my_companies SET (security_invoker = true);
