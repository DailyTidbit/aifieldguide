

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."enforce_intro_month_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  intro_start date := current_date;
  intro_end   date := current_date + 30;
  existing int;
begin
  -- Only enforce when setting a slot to booked
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') and NEW.status = 'booked' and NEW.sponsor_company_id is not null then
    if NEW.slot_date between intro_start and intro_end then
      select count(*) into existing
      from public.sponsor_slots
      where sponsor_company_id = NEW.sponsor_company_id
        and status = 'booked'
        and slot_date between intro_start and intro_end
        and id <> coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

      if existing >= 1 then
        raise exception 'Limit: only 1 sponsored day per company in the intro month window.';
      end if;
    end if;
  end if;
  return NEW;
end; $$;


ALTER FUNCTION "public"."enforce_intro_month_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_username"("email" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Extract username from email (part before @)
  base_username := split_part(email, '@', 1);
  
  -- Remove any non-alphanumeric characters and convert to lowercase
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure minimum length
  IF length(base_username) < 3 THEN
    base_username := 'user' || base_username;
  END IF;
  
  final_username := base_username;
  
  -- Check if username exists and increment if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    final_username := base_username || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_username;
END;
$$;


ALTER FUNCTION "public"."generate_username"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate username from email
  new_username := split_part(NEW.email, '@', 1);
  new_username := lower(regexp_replace(new_username, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure minimum length
  IF length(new_username) < 3 THEN
    new_username := 'user' || new_username;
  END IF;
  
  -- Make username unique
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    new_username := split_part(NEW.email, '@', 1) || counter;
    counter := counter + 1;
  END LOOP;

  -- Insert profile
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    new_username,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- don't fail user creation if profile creation fails
    RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_prompt_usage"("prompt_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE background_prompts 
  SET usage_count = COALESCE(usage_count, 0) + 1,
      updated_at = NOW()
  WHERE id = prompt_id;
END;
$$;


ALTER FUNCTION "public"."increment_prompt_usage"("prompt_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_action"("p_admin_user_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "uuid", "p_details" "jsonb" DEFAULT NULL::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id, 
    action, 
    target_type, 
    target_id, 
    details, 
    ip_address, 
    user_agent
  ) VALUES (
    p_admin_user_id, 
    p_action, 
    p_target_type, 
    p_target_id, 
    p_details, 
    p_ip_address, 
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;


ALTER FUNCTION "public"."log_admin_action"("p_admin_user_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update posts
  set likes_count = (
    select count(*) from likes where post_id = new.post_id
  )
  where id = new.post_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."update_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_and_use_preview_token"("token_hash_param" "text", "intent_param" "text" DEFAULT 'preview'::"text") RETURNS TABLE("company_id" "uuid", "expires_at" timestamp with time zone, "use_count" integer, "max_uses" integer, "intent" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Atomically increment use_count and return token data
  UPDATE partner_preview_tokens
  SET 
    use_count = use_count + 1,
    last_used_at = NOW()
  WHERE 
    token_hash = token_hash_param
    AND intent = intent_param
    AND expires_at > NOW()
    AND use_count < max_uses
  RETURNING 
    partner_preview_tokens.company_id,
    partner_preview_tokens.expires_at,
    partner_preview_tokens.use_count,
    partner_preview_tokens.max_uses,
    partner_preview_tokens.intent
  INTO 
    validate_and_use_preview_token.company_id,
    validate_and_use_preview_token.expires_at,
    validate_and_use_preview_token.use_count,
    validate_and_use_preview_token.max_uses,
    validate_and_use_preview_token.intent;

  -- Return the result if found
  IF FOUND THEN
    RETURN NEXT;
  END IF;
END;
$$;


ALTER FUNCTION "public"."validate_and_use_preview_token"("token_hash_param" "text", "intent_param" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ad_creatives" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "headline" "text",
    "body" "text",
    "image_url" "text",
    "cta_label" "text",
    "cta_url" "text"
);


ALTER TABLE "public"."ad_creatives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "product_id" "uuid",
    "stripe_session_id" "text",
    "stripe_payment_status" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "start_date" "date",
    "end_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."ad_orders" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."ad_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "name" "text",
    "description" "text",
    "price_cents" integer,
    "duration_days" integer,
    "active" boolean DEFAULT true
);


ALTER TABLE "public"."ad_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "details" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "is_active" boolean DEFAULT true,
    "last_login_at" timestamp with time zone,
    CONSTRAINT "admin_users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_tools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "company" "text",
    "description" "text",
    "use_cases" "text",
    "login_required" boolean,
    "free_tier" boolean,
    "paid_tier" boolean,
    "website" "text",
    "access_notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "detailed_description" "text",
    "company_id" "uuid",
    "is_public" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."ai_tools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "tidbit_number" integer,
    "session_id" "text",
    "user_agent" "text",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_analytics_events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."analytics_summary" AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "date",
    "event_type",
    "count"(*) AS "event_count",
    "count"(DISTINCT "user_id") AS "unique_users",
    "count"(DISTINCT "session_id") AS "unique_sessions",
    "avg"(
        CASE
            WHEN (("event_data" ->> 'time_spent_seconds'::"text") IS NOT NULL) THEN (("event_data" ->> 'time_spent_seconds'::"text"))::integer
            ELSE NULL::integer
        END) AS "avg_time_spent"
   FROM "public"."user_analytics_events"
  WHERE ("created_at" >= (CURRENT_DATE - '30 days'::interval))
  GROUP BY ("date_trunc"('day'::"text", "created_at")), "event_type"
  ORDER BY ("date_trunc"('day'::"text", "created_at")) DESC, ("count"(*)) DESC;


ALTER VIEW "public"."analytics_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."background_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_text" "text" NOT NULL,
    "api_prompt" "text" NOT NULL,
    "category" "text",
    "is_active" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."background_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "comments_content_check" CHECK ((("length"("content") > 0) AND ("length"("content") <= 1000)))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "website" "text",
    "domain" "text",
    "status" "text" DEFAULT 'unverified'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "domains" "text"[] DEFAULT '{}'::"text"[],
    "created_by" "uuid",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."companies" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_member_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "title" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company_member_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_profiles" (
    "company_id" "uuid" NOT NULL,
    "support_email" "text",
    "billing_email" "text",
    "marketing_email" "text",
    "logo_url" "text",
    "brand_colors" "jsonb",
    "socials" "jsonb",
    "address" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_users" (
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "invited_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "company_users_role_check" CHECK (("role" = ANY (ARRAY['company_admin'::"text", 'company_editor'::"text", 'company_viewer'::"text"])))
);

ALTER TABLE ONLY "public"."company_users" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_guide_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_number" integer NOT NULL,
    "section_name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "intro" "text",
    "use_cases" "text",
    "summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text",
    "how_they_work" "text",
    "what_you_can_do" "text",
    "better_results" "text",
    "strengths" "text",
    "limitations" "text",
    "pro_tips" "text",
    "published" boolean DEFAULT true
);


ALTER TABLE "public"."field_guide_sections" OWNER TO "postgres";


COMMENT ON TABLE "public"."field_guide_sections" IS 'This is a duplicate of field_guide_sections';



CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "post_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid",
    "company_id" "uuid",
    "proposed" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone
);


ALTER TABLE "public"."listing_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid",
    "sender_role" "text" NOT NULL,
    "body" "text" NOT NULL,
    "attachments" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "partner_messages_sender_role_check" CHECK (("sender_role" = ANY (ARRAY['company'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."partner_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "company_name" "text" NOT NULL,
    "company_website" "text",
    "tool_name" "text" NOT NULL,
    "tool_description" "text" NOT NULL,
    "role" "text" DEFAULT 'company_admin'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "reviewer_notes" "text",
    CONSTRAINT "partner_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."partner_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_security_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "company_id" "uuid",
    "event_type" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "success" boolean,
    "reason" "text",
    CONSTRAINT "partner_security_logs_event_type_check" CHECK (("event_type" = ANY (ARRAY['success'::"text", 'domain_rejected'::"text", 'rate_limited'::"text", 'suspicious'::"text"])))
);

ALTER TABLE ONLY "public"."partner_security_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_security_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "subject" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_message_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."partner_threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."placement_metrics_daily" (
    "id" bigint NOT NULL,
    "company_id" "uuid",
    "ad_order_id" "uuid",
    "date" "date" NOT NULL,
    "impressions" integer DEFAULT 0,
    "clicks" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."placement_metrics_daily" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."placement_metrics_daily_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."placement_metrics_daily_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."placement_metrics_daily_id_seq" OWNED BY "public"."placement_metrics_daily"."id";



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "content" "text",
    "before_text" "text",
    "after_text" "text",
    "media_url" "text",
    "tidbit" integer NOT NULL,
    "likes_count" integer DEFAULT 0,
    "comments_enabled" boolean DEFAULT true,
    "is_pinned" boolean DEFAULT false,
    "is_private" boolean DEFAULT false
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "website" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "username_format" CHECK (("username" ~ '^[a-zA-Z0-9_]+$'::"text")),
    CONSTRAINT "username_length" CHECK ((("char_length"("username") >= 3) AND ("char_length"("username") <= 30)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identifier" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "requests_count" integer DEFAULT 1,
    "window_start" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sponsor_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slot_id" "uuid",
    "company_id" "uuid",
    "stripe_session_id" "text",
    "stripe_payment_intent" "text",
    "amount_cents" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."sponsor_orders" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsor_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sponsor_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slot_date" "date" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "price_cents" integer DEFAULT 100 NOT NULL,
    "held_until" timestamp with time zone,
    "sponsor_company_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sponsor_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tidbit_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tidbit_day" integer NOT NULL,
    "step_number" integer NOT NULL,
    "icon" "text",
    "title" "text",
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tidbit_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tidbits" (
    "id" integer NOT NULL,
    "day_number" integer NOT NULL,
    "title" "text",
    "hero_heading" "text",
    "walkthrough_intro" "text",
    "what_is_ai" "text",
    "what_you_need" "text",
    "tutor_intro" "text",
    "video_url" "text",
    "image_url" "text",
    "bitboard_url" "text",
    "chatbot_embed" "text",
    "extra" "jsonb",
    "created_at" timestamp without time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "status" "text" DEFAULT 'published'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "difficulty_level" integer DEFAULT 1,
    "estimated_time" integer DEFAULT 5,
    "seo_description" "text",
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "explore_more" "text",
    "tutor_placeholder" "text",
    "tutor_prefill" "text",
    "default_ai_provider" "text",
    CONSTRAINT "tidbits_difficulty_level_check" CHECK ((("difficulty_level" >= 1) AND ("difficulty_level" <= 5))),
    CONSTRAINT "tidbits_estimated_time_check" CHECK (("estimated_time" > 0)),
    CONSTRAINT "tidbits_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"]))),
    CONSTRAINT "valid_ai_provider" CHECK ((("default_ai_provider" IS NULL) OR ("default_ai_provider" = ANY (ARRAY['openai'::"text", 'anthropic'::"text", 'google'::"text", 'perplexity'::"text", 'mistral'::"text", 'cohere'::"text", 'together'::"text"]))))
);


ALTER TABLE "public"."tidbits" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tidbits"."status" IS 'Content status: draft, published, or archived';



COMMENT ON COLUMN "public"."tidbits"."tags" IS 'Array of tags for categorization (e.g., {"writing", "productivity", "creative"})';



COMMENT ON COLUMN "public"."tidbits"."difficulty_level" IS 'Difficulty from 1 (beginner) to 5 (advanced)';



COMMENT ON COLUMN "public"."tidbits"."estimated_time" IS 'Estimated completion time in minutes';



COMMENT ON COLUMN "public"."tidbits"."seo_description" IS 'Meta description for SEO (150-160 characters recommended)';



COMMENT ON COLUMN "public"."tidbits"."updated_at" IS 'Automatically updated timestamp when row is modified';



COMMENT ON COLUMN "public"."tidbits"."tutor_placeholder" IS 'Custom placeholder text for the TidbitTutor input field';



COMMENT ON COLUMN "public"."tidbits"."tutor_prefill" IS 'Pre-filled template text in the input box that users can edit';



COMMENT ON COLUMN "public"."tidbits"."default_ai_provider" IS 'Default AI provider for this tidbit (openai, anthropic, google, perplexity, mistral, cohere, together)';



CREATE SEQUENCE IF NOT EXISTS "public"."tidbits_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tidbits_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tidbits_id_seq" OWNED BY "public"."tidbits"."id";



CREATE TABLE IF NOT EXISTS "public"."tool_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tool_id" "uuid",
    "detailed_description" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."tool_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tool_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "tool_id" "uuid",
    "display_name" "text",
    "model_name" "text",
    "summary" "text",
    "use_cases" "text",
    "pricing" "jsonb",
    "login_requirements" "text",
    "features" "jsonb",
    "website_url" "text",
    "logo_url" "text",
    "screenshots" "jsonb",
    "is_published" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tool_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tidbit_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tidbit_number" integer NOT NULL,
    "viewed_at" timestamp with time zone,
    "tutor_used_at" timestamp with time zone,
    "posted_at" timestamp with time zone,
    "bitboard_post_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_tidbit_progress" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_my_companies" AS
 SELECT "user_id",
    "company_id"
   FROM "public"."company_users" "cu"
  WHERE ("user_id" = "auth"."uid"());


ALTER VIEW "public"."v_my_companies" OWNER TO "postgres";


ALTER TABLE ONLY "public"."placement_metrics_daily" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."placement_metrics_daily_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tidbits" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tidbits_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ad_creatives"
    ADD CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_orders"
    ADD CONSTRAINT "ad_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_products"
    ADD CONSTRAINT "ad_products_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."ad_products"
    ADD CONSTRAINT "ad_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_tools"
    ADD CONSTRAINT "ai_tools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."background_prompts"
    ADD CONSTRAINT "background_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_domain_key" UNIQUE ("domain");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_member_profiles"
    ADD CONSTRAINT "company_member_profiles_company_id_user_id_key" UNIQUE ("company_id", "user_id");



ALTER TABLE ONLY "public"."company_member_profiles"
    ADD CONSTRAINT "company_member_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_profiles"
    ADD CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("company_id");



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_pkey" PRIMARY KEY ("user_id", "company_id");



ALTER TABLE ONLY "public"."field_guide_sections"
    ADD CONSTRAINT "field_guide_sections_duplicate2_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_guide_sections"
    ADD CONSTRAINT "field_guide_sections_duplicate2_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_post_id_key" UNIQUE ("user_id", "post_id");



ALTER TABLE ONLY "public"."listing_changes"
    ADD CONSTRAINT "listing_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_messages"
    ADD CONSTRAINT "partner_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_requests"
    ADD CONSTRAINT "partner_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_security_logs"
    ADD CONSTRAINT "partner_security_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_threads"
    ADD CONSTRAINT "partner_threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."placement_metrics_daily"
    ADD CONSTRAINT "placement_metrics_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_identifier_endpoint_key" UNIQUE ("identifier", "endpoint");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsor_orders"
    ADD CONSTRAINT "sponsor_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsor_slots"
    ADD CONSTRAINT "sponsor_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsor_slots"
    ADD CONSTRAINT "sponsor_slots_slot_date_key" UNIQUE ("slot_date");



ALTER TABLE ONLY "public"."tidbit_steps"
    ADD CONSTRAINT "tidbit_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tidbits"
    ADD CONSTRAINT "tidbits_day_number_key" UNIQUE ("day_number");



ALTER TABLE ONLY "public"."tidbits"
    ADD CONSTRAINT "tidbits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tool_details"
    ADD CONSTRAINT "tool_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tool_listings"
    ADD CONSTRAINT "tool_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_analytics_events"
    ADD CONSTRAINT "user_analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tidbit_progress"
    ADD CONSTRAINT "user_tidbit_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tidbit_progress"
    ADD CONSTRAINT "user_tidbit_progress_user_id_tidbit_number_key" UNIQUE ("user_id", "tidbit_number");



CREATE INDEX "comments_created_at_idx" ON "public"."comments" USING "btree" ("created_at");



CREATE INDEX "comments_post_id_idx" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "comments_user_id_idx" ON "public"."comments" USING "btree" ("user_id");



CREATE UNIQUE INDEX "field_guide_sections_duplicate2_slug_idx" ON "public"."field_guide_sections" USING "btree" ("slug");



CREATE INDEX "idx_admin_audit_log_action" ON "public"."admin_audit_log" USING "btree" ("action");



CREATE INDEX "idx_admin_audit_log_admin_user" ON "public"."admin_audit_log" USING "btree" ("admin_user_id");



CREATE INDEX "idx_admin_audit_log_created_at" ON "public"."admin_audit_log" USING "btree" ("created_at");



CREATE UNIQUE INDEX "idx_admin_users_user_id" ON "public"."admin_users" USING "btree" ("user_id");



CREATE INDEX "idx_ai_tools_company_id" ON "public"."ai_tools" USING "btree" ("company_id");



CREATE INDEX "idx_cmp_company" ON "public"."company_member_profiles" USING "btree" ("company_id");



CREATE INDEX "idx_cmp_user" ON "public"."company_member_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_company_profiles_company_id" ON "public"."company_profiles" USING "btree" ("company_id");



CREATE INDEX "idx_company_users_company_id" ON "public"."company_users" USING "btree" ("company_id");



CREATE INDEX "idx_company_users_user_id" ON "public"."company_users" USING "btree" ("user_id");



CREATE INDEX "idx_likes_post_id" ON "public"."likes" USING "btree" ("post_id");



CREATE INDEX "idx_likes_user_id" ON "public"."likes" USING "btree" ("user_id");



CREATE INDEX "idx_partner_requests_created_at" ON "public"."partner_requests" USING "btree" ("created_at");



CREATE INDEX "idx_partner_requests_email" ON "public"."partner_requests" USING "btree" ("email");



CREATE INDEX "idx_partner_requests_status" ON "public"."partner_requests" USING "btree" ("status");



CREATE INDEX "idx_partner_security_logs_event_type" ON "public"."partner_security_logs" USING "btree" ("event_type");



CREATE INDEX "idx_partner_security_logs_timestamp" ON "public"."partner_security_logs" USING "btree" ("timestamp");



CREATE INDEX "idx_partner_security_logs_user_company" ON "public"."partner_security_logs" USING "btree" ("user_id", "company_id");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_privacy" ON "public"."posts" USING "btree" ("is_private", "user_id");



CREATE INDEX "idx_posts_tidbit" ON "public"."posts" USING "btree" ("tidbit");



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at");



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "idx_rate_limits_identifier" ON "public"."rate_limits" USING "btree" ("identifier");



CREATE INDEX "idx_rate_limits_window_start" ON "public"."rate_limits" USING "btree" ("window_start");



CREATE INDEX "idx_tidbits_day_number" ON "public"."tidbits" USING "btree" ("day_number");



CREATE INDEX "idx_tidbits_difficulty" ON "public"."tidbits" USING "btree" ("difficulty_level");



CREATE INDEX "idx_tidbits_status" ON "public"."tidbits" USING "btree" ("status");



CREATE INDEX "idx_tidbits_tags" ON "public"."tidbits" USING "gin" ("tags");



CREATE INDEX "idx_user_analytics_events_created_at" ON "public"."user_analytics_events" USING "btree" ("created_at");



CREATE INDEX "idx_user_analytics_events_event_type" ON "public"."user_analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_user_analytics_events_session_id" ON "public"."user_analytics_events" USING "btree" ("session_id");



CREATE INDEX "idx_user_analytics_events_tidbit_number" ON "public"."user_analytics_events" USING "btree" ("tidbit_number");



CREATE INDEX "idx_user_analytics_events_user_id" ON "public"."user_analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_user_tidbit_progress_completed" ON "public"."user_tidbit_progress" USING "btree" ("user_id") WHERE (("viewed_at" IS NOT NULL) AND ("tutor_used_at" IS NOT NULL) AND ("posted_at" IS NOT NULL));



CREATE INDEX "idx_user_tidbit_progress_tidbit_number" ON "public"."user_tidbit_progress" USING "btree" ("tidbit_number");



CREATE INDEX "idx_user_tidbit_progress_user_id" ON "public"."user_tidbit_progress" USING "btree" ("user_id");



CREATE INDEX "likes_post_id_idx" ON "public"."likes" USING "btree" ("post_id");



CREATE INDEX "likes_user_post_idx" ON "public"."likes" USING "btree" ("user_id", "post_id");



CREATE INDEX "posts_created_at_desc_idx" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "posts_created_at_idx" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "posts_is_private_idx" ON "public"."posts" USING "btree" ("is_private");



CREATE INDEX "posts_public_created_idx" ON "public"."posts" USING "btree" ("is_private", "created_at" DESC);



CREATE INDEX "posts_user_id_idx" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "profiles_id_idx" ON "public"."profiles" USING "btree" ("id");



CREATE INDEX "sponsor_slots_slot_date_idx" ON "public"."sponsor_slots" USING "btree" ("slot_date");



CREATE UNIQUE INDEX "ux_companies_domain" ON "public"."companies" USING "btree" ("lower"("domain")) WHERE ("domain" IS NOT NULL);



CREATE UNIQUE INDEX "ux_intro_one_slot_per_company" ON "public"."sponsor_slots" USING "btree" ("sponsor_company_id") WHERE (("status" = 'booked'::"text") AND ("slot_date" >= '2025-09-01'::"date") AND ("slot_date" <= '2025-09-30'::"date"));



CREATE OR REPLACE TRIGGER "trg_cmp_set_updated_at" BEFORE UPDATE ON "public"."company_member_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_enforce_intro_month_limit" BEFORE INSERT OR UPDATE ON "public"."sponsor_slots" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_intro_month_limit"();



CREATE OR REPLACE TRIGGER "update_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_company_users_updated_at" BEFORE UPDATE ON "public"."company_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_likes_after_delete" AFTER DELETE ON "public"."likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_likes_count"();



CREATE OR REPLACE TRIGGER "update_likes_after_insert" AFTER INSERT ON "public"."likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_likes_count"();



CREATE OR REPLACE TRIGGER "update_tidbits_updated_at" BEFORE UPDATE ON "public"."tidbits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tool_details_updated_at" BEFORE UPDATE ON "public"."tool_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_tidbit_progress_updated_at" BEFORE UPDATE ON "public"."user_tidbit_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."ad_creatives"
    ADD CONSTRAINT "ad_creatives_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."ad_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ad_orders"
    ADD CONSTRAINT "ad_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ad_orders"
    ADD CONSTRAINT "ad_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."ad_products"("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_tools"
    ADD CONSTRAINT "ai_tools_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_member_profiles"
    ADD CONSTRAINT "company_member_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_member_profiles"
    ADD CONSTRAINT "company_member_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_profiles"
    ADD CONSTRAINT "company_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_profiles"
    ADD CONSTRAINT "fk_company_profiles_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "fk_company_users_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_changes"
    ADD CONSTRAINT "listing_changes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_changes"
    ADD CONSTRAINT "listing_changes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."listing_changes"
    ADD CONSTRAINT "listing_changes_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."tool_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_messages"
    ADD CONSTRAINT "partner_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."partner_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_security_logs"
    ADD CONSTRAINT "partner_security_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_security_logs"
    ADD CONSTRAINT "partner_security_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_threads"
    ADD CONSTRAINT "partner_threads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsor_orders"
    ADD CONSTRAINT "sponsor_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsor_orders"
    ADD CONSTRAINT "sponsor_orders_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."sponsor_slots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsor_slots"
    ADD CONSTRAINT "sponsor_slots_sponsor_company_id_fkey" FOREIGN KEY ("sponsor_company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."tool_details"
    ADD CONSTRAINT "tool_details_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "public"."ai_tools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_listings"
    ADD CONSTRAINT "tool_listings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_analytics_events"
    ADD CONSTRAINT "user_analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tidbit_progress"
    ADD CONSTRAINT "user_tidbit_progress_bitboard_post_id_fkey" FOREIGN KEY ("bitboard_post_id") REFERENCES "public"."posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_tidbit_progress"
    ADD CONSTRAINT "user_tidbit_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can manage tidbits" ON "public"."tidbits" USING (true);



CREATE POLICY "Admin only access to partner requests" ON "public"."partner_requests" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can read audit log" ON "public"."admin_audit_log" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Allow anonymous analytics events" ON "public"."user_analytics_events" FOR INSERT WITH CHECK (("user_id" IS NULL));



CREATE POLICY "Allow authenticated insert on tool_details" ON "public"."tool_details" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated update on tool_details" ON "public"."tool_details" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow inserts for logged-in users" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow public read access on tool_details" ON "public"."tool_details" FOR SELECT USING (true);



CREATE POLICY "Allow reads for logged-in users" ON "public"."posts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anon can read comments on public posts" ON "public"."comments" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "comments"."post_id") AND (COALESCE("p"."is_private", false) = false)))));



CREATE POLICY "Anon can read public posts" ON "public"."posts" FOR SELECT TO "anon" USING ((COALESCE("is_private", false) = false));



CREATE POLICY "Anon can read public profiles" ON "public"."profiles" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."user_id" = "profiles"."id") AND (COALESCE("p"."is_private", false) = false)))));



CREATE POLICY "Comments are viewable by everyone" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Everyone can view tidbits" ON "public"."tidbits" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can read active prompts" ON "public"."background_prompts" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can read posts" ON "public"."posts" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can create likes" ON "public"."likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own likes" ON "public"."likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."comments" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own posts" ON "public"."posts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own progress" ON "public"."user_tidbit_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own analytics events" ON "public"."user_analytics_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own comments" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own progress" ON "public"."user_tidbit_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view likes" ON "public"."likes" FOR SELECT USING (true);



CREATE POLICY "Users can view own progress" ON "public"."user_tidbit_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own analytics events" ON "public"."user_analytics_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users see their company membership" ON "public"."company_users" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ad_creatives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ad_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ad_orders_insert_own" ON "public"."ad_orders" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "ad_orders_select_own" ON "public"."ad_orders" FOR SELECT USING (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "ad_orders_update_own" ON "public"."ad_orders" FOR UPDATE USING (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"())))) WITH CHECK (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ad_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ad_products readable" ON "public"."ad_products" FOR SELECT USING (true);



CREATE POLICY "admin all on ad_creatives" ON "public"."ad_creatives" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "admin all on ad_orders" ON "public"."ad_orders" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "admin all on ad_products" ON "public"."ad_products" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "admin all on companies" ON "public"."companies" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "admin all on company_users" ON "public"."company_users" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "admin all on listing_changes" ON "public"."listing_changes" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "admin all on metrics" ON "public"."placement_metrics_daily" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "admin all on partner_messages" ON "public"."partner_messages" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "admin all on partner_threads" ON "public"."partner_threads" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "admin all on sponsor_orders" ON "public"."sponsor_orders" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



CREATE POLICY "admin all on sponsor_slots" ON "public"."sponsor_slots" USING ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text")) WITH CHECK ((COALESCE(("auth"."jwt"() ->> 'role'::"text"), ''::"text") = 'admin'::"text"));



ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_tools" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_tools_authenticated_access" ON "public"."ai_tools" FOR SELECT TO "authenticated" USING ((("is_public" = true) OR ("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"())))));



CREATE POLICY "ai_tools_public_access" ON "public"."ai_tools" FOR SELECT TO "anon" USING (("is_public" = true));



ALTER TABLE "public"."background_prompts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cmp_select_company_members" ON "public"."company_member_profiles" FOR SELECT USING (("company_id" IN ( SELECT "cu"."company_id"
   FROM "public"."company_users" "cu"
  WHERE ("cu"."user_id" = "auth"."uid"()))));



CREATE POLICY "cmp_update_self" ON "public"."company_member_profiles" FOR UPDATE USING ((("user_id" = "auth"."uid"()) AND ("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))))) WITH CHECK ((("user_id" = "auth"."uid"()) AND ("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_select_own" ON "public"."companies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "companies"."id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company can propose changes via listing_changes only" ON "public"."tool_listings" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "company can read own listing" ON "public"."tool_listings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "tool_listings"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company insert own ad_creatives" ON "public"."ad_creatives" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."ad_orders" "o"
     JOIN "public"."company_users" "cu" ON (("cu"."company_id" = "o"."company_id")))
  WHERE (("o"."id" = "ad_creatives"."order_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company insert own ad_orders" ON "public"."ad_orders" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "ad_orders"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company insert own listing_changes" ON "public"."listing_changes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "listing_changes"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company insert own partner_messages" ON "public"."partner_messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."partner_threads" "t"
     JOIN "public"."company_users" "cu" ON (("cu"."company_id" = "t"."company_id")))
  WHERE (("t"."id" = "partner_messages"."thread_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company insert own partner_threads" ON "public"."partner_threads" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "partner_threads"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company insert own sponsor_orders" ON "public"."sponsor_orders" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "sponsor_orders"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company read own metrics" ON "public"."placement_metrics_daily" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "placement_metrics_daily"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company select own ad_creatives" ON "public"."ad_creatives" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."ad_orders" "o"
     JOIN "public"."company_users" "cu" ON (("cu"."company_id" = "o"."company_id")))
  WHERE (("o"."id" = "ad_creatives"."order_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company select own ad_orders" ON "public"."ad_orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "ad_orders"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company select own listing_changes" ON "public"."listing_changes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "listing_changes"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company select own partner_messages" ON "public"."partner_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."partner_threads" "t"
     JOIN "public"."company_users" "cu" ON (("cu"."company_id" = "t"."company_id")))
  WHERE (("t"."id" = "partner_messages"."thread_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company select own partner_threads" ON "public"."partner_threads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "partner_threads"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company select own sponsor_orders" ON "public"."sponsor_orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "sponsor_orders"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company users can insert company_profiles" ON "public"."company_profiles" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "company_profiles"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company users can read company_profiles" ON "public"."company_profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "company_profiles"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company users can update company_profiles" ON "public"."company_profiles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "company_profiles"."company_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "company users read own company" ON "public"."companies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."company_users" "cu"
  WHERE (("cu"."company_id" = "companies"."id") AND ("cu"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."company_member_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company_profiles_select_own" ON "public"."company_profiles" FOR SELECT USING (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."company_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company_users_select_own" ON "public"."company_users" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_changes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "listing_changes_select_own" ON "public"."listing_changes" FOR SELECT USING (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."partner_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_security_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_threads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partner_threads_select_own" ON "public"."partner_threads" FOR SELECT USING (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."placement_metrics_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsor_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sponsor_orders_insert_own" ON "public"."sponsor_orders" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "sponsor_orders_select_own" ON "public"."sponsor_orders" FOR SELECT USING (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "sponsor_orders_update_own" ON "public"."sponsor_orders" FOR UPDATE USING (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"())))) WITH CHECK (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."sponsor_slots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sponsor_slots_insert_own" ON "public"."sponsor_slots" FOR INSERT WITH CHECK (("sponsor_company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "sponsor_slots_select_own" ON "public"."sponsor_slots" FOR SELECT USING (("sponsor_company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "sponsor_slots_update_own" ON "public"."sponsor_slots" FOR UPDATE USING (("sponsor_company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"())))) WITH CHECK (("sponsor_company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."tool_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tool_listings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tool_listings_select_own" ON "public"."tool_listings" FOR SELECT USING (("company_id" IN ( SELECT "company_users"."company_id"
   FROM "public"."company_users"
  WHERE ("company_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "user read own membership" ON "public"."company_users" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tidbit_progress" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."enforce_intro_month_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_intro_month_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_intro_month_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_username"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_username"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_username"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_prompt_usage"("prompt_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_prompt_usage"("prompt_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_prompt_usage"("prompt_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_user_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_user_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_user_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "uuid", "p_details" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_and_use_preview_token"("token_hash_param" "text", "intent_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_and_use_preview_token"("token_hash_param" "text", "intent_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_and_use_preview_token"("token_hash_param" "text", "intent_param" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."ad_creatives" TO "authenticated";
GRANT ALL ON TABLE "public"."ad_creatives" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,MAINTAIN,UPDATE ON TABLE "public"."ad_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."ad_orders" TO "service_role";



GRANT ALL ON TABLE "public"."ad_products" TO "authenticated";
GRANT ALL ON TABLE "public"."ad_products" TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,MAINTAIN,UPDATE ON TABLE "public"."ai_tools" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_tools" TO "service_role";
GRANT SELECT ON TABLE "public"."ai_tools" TO "anon";



GRANT ALL ON TABLE "public"."user_analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."user_analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."user_analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_summary" TO "anon";
GRANT ALL ON TABLE "public"."analytics_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_summary" TO "service_role";



GRANT ALL ON TABLE "public"."background_prompts" TO "anon";
GRANT ALL ON TABLE "public"."background_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."background_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,MAINTAIN,UPDATE ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."company_member_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."company_member_profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,MAINTAIN,UPDATE ON TABLE "public"."company_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."company_profiles" TO "service_role";



GRANT SELECT,REFERENCES,MAINTAIN ON TABLE "public"."company_users" TO "authenticated";
GRANT ALL ON TABLE "public"."company_users" TO "service_role";



GRANT ALL ON TABLE "public"."field_guide_sections" TO "anon";
GRANT ALL ON TABLE "public"."field_guide_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."field_guide_sections" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,MAINTAIN,UPDATE ON TABLE "public"."listing_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_changes" TO "service_role";



GRANT ALL ON TABLE "public"."partner_messages" TO "anon";
GRANT ALL ON TABLE "public"."partner_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_messages" TO "service_role";



GRANT ALL ON TABLE "public"."partner_requests" TO "service_role";



GRANT ALL ON TABLE "public"."partner_security_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,MAINTAIN,UPDATE ON TABLE "public"."partner_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_threads" TO "service_role";



GRANT ALL ON TABLE "public"."placement_metrics_daily" TO "anon";
GRANT ALL ON TABLE "public"."placement_metrics_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."placement_metrics_daily" TO "service_role";



GRANT ALL ON SEQUENCE "public"."placement_metrics_daily_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."placement_metrics_daily_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."placement_metrics_daily_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,MAINTAIN,UPDATE ON TABLE "public"."sponsor_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsor_orders" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,MAINTAIN,UPDATE ON TABLE "public"."sponsor_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsor_slots" TO "service_role";



GRANT ALL ON TABLE "public"."tidbit_steps" TO "anon";
GRANT ALL ON TABLE "public"."tidbit_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."tidbit_steps" TO "service_role";



GRANT ALL ON TABLE "public"."tidbits" TO "anon";
GRANT ALL ON TABLE "public"."tidbits" TO "authenticated";
GRANT ALL ON TABLE "public"."tidbits" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tidbits_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tidbits_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tidbits_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tool_details" TO "anon";
GRANT ALL ON TABLE "public"."tool_details" TO "authenticated";
GRANT ALL ON TABLE "public"."tool_details" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,MAINTAIN,UPDATE ON TABLE "public"."tool_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."tool_listings" TO "service_role";



GRANT ALL ON TABLE "public"."user_tidbit_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_tidbit_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tidbit_progress" TO "service_role";



GRANT ALL ON TABLE "public"."v_my_companies" TO "anon";
GRANT ALL ON TABLE "public"."v_my_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_companies" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
