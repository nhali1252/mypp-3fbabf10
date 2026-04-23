import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage, AdminCard, FormRow } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/welcome")({
  component: AdminWelcome,
});

type Hero = {
  id: string;
  eyebrow: string;
  headline_top: string;
  headline_bottom: string;
  intro: string;
};

function AdminWelcome() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin_launcher_hero"],
    queryFn: async (): Promise<Hero | null> => {
      const { data, error } = await (supabase as any)
        .from("launcher_hero")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Hero | null;
    },
  });

  const [form, setForm] = useState<Hero>({
    id: "",
    eyebrow: "",
    headline_top: "",
    headline_bottom: "",
    intro: "",
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        eyebrow: form.eyebrow,
        headline_top: form.headline_top,
        headline_bottom: form.headline_bottom,
        intro: form.intro,
      };
      if (form.id) {
        const { error } = await (supabase as any)
          .from("launcher_hero")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("launcher_hero").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Welcome page updated");
      qc.invalidateQueries({ queryKey: ["admin_launcher_hero"] });
      qc.invalidateQueries({ queryKey: ["launcher_hero"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });

  return (
    <AdminPage
      title="Welcome / Home page"
      description="Edit the hero text shown on the homepage launcher. Cards are managed from the Launcher cards page."
      actions={
        <Button onClick={() => save.mutate()} disabled={save.isPending || isLoading}>
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      }
    >
      <AdminCard title="Header content">
        <div className="grid gap-5">
          <FormRow label="Eyebrow tag" hint="Small uppercase label above the headline.">
            <Input
              value={form.eyebrow}
              onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
              placeholder="Portfolio · TasTaj"
            />
          </FormRow>
          <div className="grid gap-5 md:grid-cols-2">
            <FormRow label="Headline — line 1">
              <Input
                value={form.headline_top}
                onChange={(e) => setForm({ ...form, headline_top: e.target.value })}
                placeholder="Pick a page"
              />
            </FormRow>
            <FormRow label="Headline — line 2 (gradient)">
              <Input
                value={form.headline_bottom}
                onChange={(e) => setForm({ ...form, headline_bottom: e.target.value })}
                placeholder="to explore."
              />
            </FormRow>
          </div>
          <FormRow label="Intro paragraph">
            <Textarea
              rows={4}
              value={form.intro}
              onChange={(e) => setForm({ ...form, intro: e.target.value })}
              placeholder="A curated launcher…"
            />
          </FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Live preview" className="mt-6">
        <div className="rounded-2xl border border-border bg-background p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
            ✦ {form.eyebrow || "Eyebrow"}
          </div>
          <h1 className="font-black tracking-tight leading-[1.02]" style={{ fontSize: "clamp(28px, 4vw, 52px)" }}>
            {form.headline_top || "Headline line 1"} <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, var(--foreground) 0%, color-mix(in oklab, var(--primary) 80%, var(--foreground)) 60%, var(--primary) 100%)",
              }}
            >
              {form.headline_bottom || "Headline line 2"}
            </span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
            {form.intro || "Intro paragraph…"}
          </p>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
