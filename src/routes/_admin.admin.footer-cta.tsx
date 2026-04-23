import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage, AdminCard, FormRow } from "@/components/admin/AdminPage";
import { useFooterCta, FOOTER_CTA_DEFAULTS, type FooterCta } from "@/hooks/useFooterCta";

export const Route = createFileRoute("/_admin/admin/footer-cta")({
  component: FooterCtaAdmin,
});

function FooterCtaAdmin() {
  const { data, isLoading } = useFooterCta();
  const qc = useQueryClient();
  const [form, setForm] = useState<FooterCta>(FOOTER_CTA_DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  function set<K extends keyof FooterCta>(key: K, value: FooterCta[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.id) {
      toast.error("Settings row missing");
      return;
    }
    setSaving(true);
    const { id, ...rest } = form;
    const { error } = await supabase.from("footer_cta").update(rest).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Footer CTA updated");
    qc.invalidateQueries({ queryKey: ["footer_cta"] });
  }

  function reset() {
    setForm({ ...FOOTER_CTA_DEFAULTS, id: form.id });
  }

  return (
    <AdminPage
      title="Footer CTA"
      description='Edit the "Start a project" callout shown at the bottom of every page.'
      actions={
        <>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-sm"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={save}
            disabled={saving || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <AdminCard title="Visibility">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          Show this CTA in the footer
        </label>
      </AdminCard>

      <AdminCard title="Text">
        <div className="space-y-4">
          <FormRow label="Eyebrow (small uppercase tag)">
            <input
              value={form.eyebrow}
              onChange={(e) => set("eyebrow", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
            />
          </FormRow>
          <FormRow label="Headline">
            <input
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
            />
          </FormRow>
          <FormRow label="Subtext">
            <input
              value={form.subtext}
              onChange={(e) => set("subtext", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
            />
          </FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Primary button">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormRow label="Button label">
            <input
              value={form.primary_label}
              onChange={(e) => set("primary_label", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
            />
          </FormRow>
          <FormRow label="Link / URL" hint="Internal route like /contact, or full URL.">
            <input
              value={form.primary_url}
              onChange={(e) => set("primary_url", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
            />
          </FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Quick contact buttons">
        <p className="text-xs text-muted-foreground mb-4">
          The Email / WhatsApp / Call buttons use the contact info from <strong>Contact info</strong>.
          Edit them there if needed.
        </p>
        <div className="space-y-3">
          {(
            [
              { key: "email", label: "Email button" },
              { key: "whatsapp", label: "WhatsApp button" },
              { key: "call", label: "Call button" },
            ] as const
          ).map((row) => {
            const showKey = `show_${row.key}` as const;
            const labelKey = `${row.key}_label` as const;
            return (
              <div
                key={row.key}
                className="grid grid-cols-1 md:grid-cols-[180px_1fr_2fr] gap-3 items-center"
              >
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={form[showKey] as boolean}
                    onChange={(e) => set(showKey, e.target.checked as never)}
                  />
                  {row.label}
                </label>
                <span className="text-xs text-muted-foreground">Button label</span>
                <input
                  value={form[labelKey] as string}
                  onChange={(e) => set(labelKey, e.target.value as never)}
                  className="px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>
            );
          })}
        </div>
      </AdminCard>
    </AdminPage>
  );
}
