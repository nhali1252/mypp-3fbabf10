/**
 * Client-side function middleware: attaches the current Supabase access token
 * as a Bearer Authorization header so server functions using
 * `requireSupabaseAuth` can verify the user.
 */
import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        return next({ headers: { Authorization: `Bearer ${token}` } });
      }
    } catch {
      // ignore — server will reject as 401 if auth is required
    }
    return next();
  },
);
