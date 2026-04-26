import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — Admin" }] }),
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(320),
  password: z.string().min(6, "At least 6 characters").max(72),
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/admin" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Welcome back");
    navigate({ to: "/admin" });
  }

  async function googleSignIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if ("redirected" in result && result.redirected) return; // navigating to Google
    if ("error" in result && result.error) {
      setLoading(false);
      const msg = result.error instanceof Error ? result.error.message : String(result.error);
      toast.error(msg || "Google sign-in failed");
      return;
    }
    setLoading(false);
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-[24px] p-8 md:p-10 shadow-lg">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to site</Link>
        <h1 className="text-2xl md:text-3xl font-black mt-4 mb-1">Sign in</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sign in to react and comment on the feed, or to access the admin panel.
        </p>

        <button
          type="button"
          onClick={googleSignIn}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2.5 bg-secondary hover:bg-secondary/80 border border-border px-7 py-3 rounded-full text-sm font-bold transition-all disabled:opacity-60"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or email <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Please wait…" : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-xs text-muted-foreground text-center">
          <p>Accounts are created by an administrator. Contact your admin if you forgot your password.</p>
        </div>
      </div>
    </div>
  );
}
