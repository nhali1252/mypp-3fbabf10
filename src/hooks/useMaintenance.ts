import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MaintenanceState = {
  enabled: boolean;
  message: string;
};

const DEFAULT: MaintenanceState = { enabled: false, message: "" };

export function useMaintenance(): MaintenanceState {
  const { data } = useQuery({
    queryKey: ["public-maintenance"],
    queryFn: async (): Promise<MaintenanceState> => {
      const { data } = await (supabase as any)
        .from("site_settings")
        .select("maintenance_mode, maintenance_message")
        .eq("page_key", "B")
        .limit(1)
        .maybeSingle();
      if (!data) return DEFAULT;
      return {
        enabled: data.maintenance_mode === true,
        message:
          typeof data.maintenance_message === "string"
            ? data.maintenance_message
            : "",
      };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return data ?? DEFAULT;
}
