import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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

const signUpSchema = z.object({
  email: z.string().trim().email("Invalid email").max(320),
  password: z.string().min(6, "At least 6 characters").max(72),
  displayName: z.string().trim().min(1, "Name required").max(80).optional(),
});

const resetSchema = z.object({
  email: z.string().trim().email("Invalid email").max(320),
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/admin" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "signin") {
      const parsed = signInSchema.safeParse({ email, password });
      if (!parsed.success) return toast.error(parsed.error.issues[0].message);
      setLoading(true);
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) return toast.error(error);
      toast.success("Welcome back");
      navigate({ to: "/admin" });
      return;
    }

    if (mode === "signup") {
      const parsed = signUpSchema.safeParse({ email, password, displayName });
      if (!parsed.success) return toast.error(parsed.error.issues[0].message);
      setLoading(true);
      const { error } = await signUp(email, password, displayName);
      setLoading(false);
      if (error) return toast.error(error);
      toast.success("Account created. You can sign in now.");
      setMode("signin");
      return;
    }

    if (mode === "forgot") {
      const parsed = resetSchema.safeParse({ email });
      if (!parsed.success) return toast.error(parsed.error.issues[0].message);
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Password reset link sent. Check your email.");
      setMode("signin");
    }
  }

  const title =
    mode === "signin" ? "Admin sign in" : mode === "signup" ? "Create account" : "Reset password";
  const subtitle =
    mode === "signin"
      ? "Access your admin panel."
      : mode === "signup"
        ? "Signups are temporarily open. The first user becomes admin."
        : "Enter your email and we'll send you a reset link.";

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-[24px] p-8 md:p-10 shadow-lg">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to site</Link>
        <h1 className="text-2xl md:text-3xl font-black mt-4 mb-1">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}

          {mode === "signin" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </button>
        </form>

        <div className="mt-5 text-xs text-muted-foreground text-center space-y-1">
          {mode === "signin" && (
            <p>
              Need an account?{" "}
              <button type="button" onClick={() => setMode("signup")} className="text-foreground font-medium hover:underline">
                Sign up
              </button>
            </p>
          )}
          {(mode === "signup" || mode === "forgot") && (
            <p>
              <button type="button" onClick={() => setMode("signin")} className="text-foreground font-medium hover:underline">
                ← Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
