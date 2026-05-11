CREATE TABLE IF NOT EXISTS public.message_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_row_id UUID,           -- FK-ish to public.messages.id (nullable for dedup-suppressed)
  event TEXT NOT NULL,           -- inbox.inserted | inbox.deduped | notify.enqueued | notify.failed | confirm.enqueued | confirm.failed | retry.notify | retry.confirm
  message_id TEXT,               -- email message id (notify-<uuid>, confirm-<uuid>, …)
  recipient_email TEXT,
  status TEXT NOT NULL DEFAULT 'info' CHECK (status IN ('info','success','warn','error')),
  error_message TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_audit_log_row_id ON public.message_audit_log(message_row_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_message_id ON public.message_audit_log(message_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_created_at ON public.message_audit_log(created_at DESC);

ALTER TABLE public.message_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read message audit" ON public.message_audit_log;
CREATE POLICY "Admins read message audit"
ON public.message_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete message audit" ON public.message_audit_log;
CREATE POLICY "Admins delete message audit"
ON public.message_audit_log
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role writes audit rows (server functions use supabaseAdmin).
DROP POLICY IF EXISTS "Service role inserts message audit" ON public.message_audit_log;
CREATE POLICY "Service role inserts message audit"
ON public.message_audit_log
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');
