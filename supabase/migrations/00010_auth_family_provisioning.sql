-- DUB-292: Auto-provision public.families when a parent account is created in auth.users.
-- Ensures RLS chain auth.uid() → families → children works immediately after sign-up / OAuth.
--
-- Rollback (manual — dev/staging only):
--   DROP TRIGGER IF EXISTS trg_auth_user_provision_family ON auth.users;
--   DROP FUNCTION IF EXISTS public.dubiland_provision_family_for_new_user();
--   (Optional) DELETE FROM public.families WHERE email LIKE '%@auth.placeholder';

CREATE OR REPLACE FUNCTION public.dubiland_provision_family_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  v_email := COALESCE(
    NULLIF(trim(NEW.email), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'email'), '')
  );

  IF v_email IS NULL OR v_email = '' THEN
    v_email := NEW.id::text || '@auth.placeholder';
  END IF;

  INSERT INTO public.families (auth_user_id, email)
  VALUES (NEW.id, v_email)
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.dubiland_provision_family_for_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_auth_user_provision_family ON auth.users;
CREATE TRIGGER trg_auth_user_provision_family
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.dubiland_provision_family_for_new_user();

-- Backfill: existing auth users without a family row (idempotent).
INSERT INTO public.families (auth_user_id, email)
SELECT
  u.id,
  COALESCE(
    NULLIF(trim(u.email), ''),
    NULLIF(trim(u.raw_user_meta_data ->> 'email'), ''),
    u.id::text || '@auth.placeholder'
  )
FROM auth.users AS u
WHERE NOT EXISTS (
  SELECT 1 FROM public.families AS f WHERE f.auth_user_id = u.id
)
ON CONFLICT (auth_user_id) DO NOTHING;
