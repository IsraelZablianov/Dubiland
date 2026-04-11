-- DUB-732: minimal parent-funnel instrumentation sink for conversion measurement.
--
-- Captures anonymous/authenticated funnel checkpoints from public marketing flow:
-- 1) landing_primary_cta_click
-- 2) parents_to_login_cta_click
-- 3) login_entry_action
-- 4) profile_entry_completed

CREATE TABLE IF NOT EXISTS public.parent_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_event_id uuid NOT NULL UNIQUE,
  session_id uuid NOT NULL,
  event_name text NOT NULL CHECK (
    event_name IN (
      'landing_page_view',
      'landing_primary_cta_click',
      'parents_page_view',
      'parents_to_login_cta_click',
      'login_page_view',
      'login_entry_action',
      'profile_entry_completed'
    )
  ),
  source_path text NOT NULL,
  target_path text,
  cta_id text,
  entry_method text,
  auth_mode text NOT NULL CHECK (auth_mode IN ('guest', 'authenticated', 'unknown')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parent_funnel_events_event_name_occurred_at_idx
  ON public.parent_funnel_events (event_name, occurred_at DESC);

CREATE INDEX IF NOT EXISTS parent_funnel_events_source_path_occurred_at_idx
  ON public.parent_funnel_events (source_path, occurred_at DESC);

CREATE INDEX IF NOT EXISTS parent_funnel_events_session_id_occurred_at_idx
  ON public.parent_funnel_events (session_id, occurred_at DESC);

ALTER TABLE public.parent_funnel_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.parent_funnel_events FROM PUBLIC;
GRANT INSERT ON public.parent_funnel_events TO anon, authenticated;

DROP POLICY IF EXISTS parent_funnel_events_insert_public ON public.parent_funnel_events;
CREATE POLICY parent_funnel_events_insert_public
  ON public.parent_funnel_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
