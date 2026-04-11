# DUB-732 — Parent Funnel Instrumentation (Minimal v1)

## Event Sink

- Table: `public.parent_funnel_events`
- Migration: `supabase/migrations/00036_parent_funnel_events.sql`
- Client tracker: `packages/web/src/lib/parentFunnelInstrumentation.ts`
- Flush trigger on route changes: `packages/web/src/App.tsx`

## Event Contract (v1)

Shared columns on every event row:

- `client_event_id` (uuid) — idempotency key per emitted client event
- `session_id` (uuid) — stable per-tab session id
- `event_name` (text)
- `source_path` (text)
- `target_path` (text nullable)
- `cta_id` (text nullable)
- `entry_method` (text nullable)
- `auth_mode` (`guest | authenticated | unknown`)
- `metadata` (jsonb)
- `occurred_at` (timestamptz)

Event names and fire points:

1. `landing_page_view`
- Fires on `/` mount.
- File: `packages/web/src/pages/Landing.tsx`
- Purpose: denominator for landing CTA CTR.

2. `landing_primary_cta_click`
- Fires on landing primary CTA clicks (hero + footer variants).
- File: `packages/web/src/pages/Landing.tsx`
- `cta_id`: `hero_primary | footer_primary`

3. `parents_page_view`
- Fires on `/parents` and `/parents/faq` mount.
- Files: `packages/web/src/pages/Parents.tsx`, `packages/web/src/pages/ParentsFaq.tsx`
- `cta_id`: `faq_surface` only on `/parents/faq` mount marker.

4. `parents_to_login_cta_click`
- Fires when `/parents*` surfaces send users to `/login`.
- Files:
  - `packages/web/src/components/layout/PublicHeader.tsx` (`cta_id`: `header_login | header_try_free`)
  - `packages/web/src/pages/ParentsFaq.tsx` (`cta_id`: `parents_faq_primary`)

5. `login_page_view`
- Fires on `/login` mount.
- File: `packages/web/src/pages/Login.tsx`
- Purpose: denominator for login -> profiles conversion.

6. `login_entry_action`
- Fires on entry action attempts from `/login`.
- File: `packages/web/src/pages/Login.tsx`
- `entry_method`: `guest_continue | google_sign_in | email_sign_in | email_sign_up`
- `auth_mode`: `guest` for guest flow, `authenticated` for hosted auth flows.

7. `profile_entry_completed`
- Fires when user confirms profile entry from `/profiles` and continues to app routes.
- File: `packages/web/src/pages/ProfilePicker.tsx`
- `entry_method`: `guest_profile_continue | authenticated_profile_continue`
- `auth_mode`: `guest | authenticated`
- `metadata.selectedProfileType`: `guest | demo_profile | hosted_child`

## Baseline vs Post Readout SQL Template

```sql
-- Replace time windows before running.
WITH windows AS (
  SELECT
    'baseline'::text AS window_name,
    TIMESTAMPTZ '2026-04-11 00:00:00+00' AS start_at,
    TIMESTAMPTZ '2026-04-14 00:00:00+00' AS end_at
  UNION ALL
  SELECT
    'post'::text,
    TIMESTAMPTZ '2026-04-14 00:00:00+00',
    TIMESTAMPTZ '2026-04-21 00:00:00+00'
),
windowed AS (
  SELECT
    w.window_name,
    e.*
  FROM windows w
  JOIN parent_funnel_events e
    ON e.occurred_at >= w.start_at
   AND e.occurred_at < w.end_at
),
aggregates AS (
  SELECT
    window_name,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'landing_page_view') AS landing_sessions,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'landing_primary_cta_click') AS landing_primary_cta_sessions,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'parents_page_view') AS parents_sessions,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'parents_to_login_cta_click') AS parents_to_login_sessions,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'login_page_view') AS login_sessions,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'profile_entry_completed') AS profile_entry_sessions,
    COUNT(DISTINCT session_id) FILTER (
      WHERE event_name = 'login_entry_action' AND auth_mode = 'guest'
    ) AS guest_login_sessions,
    COUNT(DISTINCT session_id) FILTER (
      WHERE event_name = 'login_entry_action' AND auth_mode = 'authenticated'
    ) AS auth_login_sessions
  FROM windowed
  GROUP BY window_name
)
SELECT
  window_name,
  landing_sessions,
  landing_primary_cta_sessions,
  ROUND(landing_primary_cta_sessions::numeric / NULLIF(landing_sessions, 0), 4) AS landing_primary_cta_ctr,
  parents_sessions,
  parents_to_login_sessions,
  ROUND(parents_to_login_sessions::numeric / NULLIF(parents_sessions, 0), 4) AS parents_to_login_rate,
  login_sessions,
  profile_entry_sessions,
  ROUND(profile_entry_sessions::numeric / NULLIF(login_sessions, 0), 4) AS login_to_profiles_rate,
  guest_login_sessions,
  auth_login_sessions,
  ROUND(guest_login_sessions::numeric / NULLIF(guest_login_sessions + auth_login_sessions, 0), 4) AS guest_share,
  ROUND(auth_login_sessions::numeric / NULLIF(guest_login_sessions + auth_login_sessions, 0), 4) AS auth_share
FROM aggregates
ORDER BY CASE WHEN window_name = 'baseline' THEN 1 ELSE 2 END;
```

Metric definitions:

- `landing_primary_cta_ctr = landing_primary_cta_sessions / landing_sessions`
- `parents_to_login_rate = parents_to_login_sessions / parents_sessions`
- `login_to_profiles_rate = profile_entry_sessions / login_sessions`
- `guest_vs_auth_mix = guest_share vs auth_share` from `login_entry_action`

## Staging Verification Query

```sql
SELECT
  event_name,
  source_path,
  target_path,
  cta_id,
  entry_method,
  auth_mode,
  occurred_at
FROM parent_funnel_events
ORDER BY occurred_at DESC
LIMIT 100;
```
