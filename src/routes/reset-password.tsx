import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Set new password — Admin" }] }),
});

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  // Supabase fires a PASSWORD_RECOVERY event after parsing the recovery token
  // from the URL hash. We only enable the form once that event has landed
  // (or once an existing session is detected) so the user isn't silently
  // logged in without resetting.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setRecoveryReady(true);
      }
    });
    // If the link was already consumed in this tab, getSession resolves true.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setRecoveryReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated — you're signed in");
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-[24px] p-8 md:p-10 shadow-lg">
        <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground">← Back to sign in</Link>
        <h1 className="text-2xl md:text-3xl font-black mt-4 mb-1">Set new password</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Choose a strong password. You'll be signed in automatically afterwards.
        </p>

        {!recoveryReady ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm">
            <p className="font-semibold mb-1">Verifying reset link…</p>
            <p className="text-muted-foreground">
              If this stays for more than a few seconds, the link may have expired.{" "}
              <Link to="/forgot-password" className="text-primary hover:underline">Request a new one</Link>.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              required
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
