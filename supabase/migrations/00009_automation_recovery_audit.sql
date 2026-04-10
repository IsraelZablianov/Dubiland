-- Board-privileged watchdog recovery gateway audit (DUB-142).
-- Spec: docs/architecture/2026-04-10-watchdog-authz-remediation.md
-- Runtime: Edge Function `automation-recovery-gateway` (service_role only).
--
-- Rollback (manual — dev/staging only):
--   DROP TABLE IF EXISTS public.automation_recovery_actions;

CREATE TABLE public.automation_recovery_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by_agent_id UUID NOT NULL,
  target_agent_id UUID NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  idempotency_key UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('allowed', 'denied')),
  decision_reason TEXT,
  invoked_run_id TEXT,
  paperclip_resume_status INT,
  paperclip_invoke_status INT,
  request_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT automation_recovery_actions_idempotency_key_key UNIQUE (idempotency_key)
);

CREATE INDEX automation_recovery_actions_target_created_idx
  ON public.automation_recovery_actions (target_agent_id, created_at DESC);

CREATE INDEX automation_recovery_actions_created_idx
  ON public.automation_recovery_actions (created_at DESC);

COMMENT ON TABLE public.automation_recovery_actions IS
  'Audit log for automation recovery gateway (watchdog → Paperclip resume/invoke). No direct client access.';

ALTER TABLE public.automation_recovery_actions ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE policies for anon/authenticated — only service_role (bypasses RLS) via Edge Function.

REVOKE ALL ON TABLE public.automation_recovery_actions FROM PUBLIC;
REVOKE ALL ON TABLE public.automation_recovery_actions FROM anon;
REVOKE ALL ON TABLE public.automation_recovery_actions FROM authenticated;
GRANT ALL ON TABLE public.automation_recovery_actions TO service_role;
