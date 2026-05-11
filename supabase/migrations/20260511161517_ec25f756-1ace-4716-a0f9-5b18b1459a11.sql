-- 1. Configurable max retries for the email queue dispatcher.
ALTER TABLE public.email_send_state
  ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 5
    CHECK (max_retries >= 1 AND max_retries <= 20);

-- Allow admins to read & update queue config from the dashboard.
DROP POLICY IF EXISTS "Admins read send state" ON public.email_send_state;
CREATE POLICY "Admins read send state"
ON public.email_send_state
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update send state" ON public.email_send_state;
CREATE POLICY "Admins update send state"
ON public.email_send_state
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Peek DLQ contents WITHOUT consuming messages (reads from underlying pgmq table).
CREATE OR REPLACE FUNCTION public.peek_dlq(dlq_name TEXT, lim INT DEFAULT 100)
RETURNS TABLE(msg_id BIGINT, enqueued_at TIMESTAMPTZ, read_ct INT, message JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT msg_id, enqueued_at, read_ct, message FROM pgmq.q_%I ORDER BY msg_id DESC LIMIT $1',
    dlq_name
  ) USING lim;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$$;

-- 3. Requeue a single DLQ message back into its source queue.
CREATE OR REPLACE FUNCTION public.requeue_from_dlq(
  dlq_name TEXT, target_queue TEXT, message_id BIGINT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  msg JSONB;
  new_id BIGINT;
BEGIN
  EXECUTE format('SELECT message FROM pgmq.q_%I WHERE msg_id = $1', dlq_name)
    INTO msg
    USING message_id;
  IF msg IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT pgmq.send(target_queue, msg) INTO new_id;
  PERFORM pgmq.delete(dlq_name, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  RETURN NULL;
END;
$$;

-- Lock down: only service_role may call queue RPCs (server fn uses supabaseAdmin).
REVOKE EXECUTE ON FUNCTION public.peek_dlq(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.peek_dlq(TEXT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.requeue_from_dlq(TEXT, TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.requeue_from_dlq(TEXT, TEXT, BIGINT) TO service_role;
