/**
 * Global TanStack Start configuration.
 * Registers function middleware that runs for every createServerFn call.
 */
import { createStart } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-client-middleware";

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
}));
