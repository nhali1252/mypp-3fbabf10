import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminPage, AdminCard, FormRow } from "@/components/admin/AdminPage";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { PageKeySelector, usePageKey } from "@/components/admin/PageKeySelector";
import { Save, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CloudflareSecretsChecklist } from "@/components/admin/CloudflareSecretsChecklist";

const HOMEPAGE_SECTION_KEYS: { key: string; label: string; hint?: string }[] = [
  { key: "hero", label: "Hero / launcher headline" },
  { key: "launcher_cards", label: "Launcher cards grid" },
  { key: "about", label: "About section (Basic page)" },
  { key: "skills", label: "Skills section (About page)" },
  { key: "reviews", label: "Reviews / testimonials block" },
  { key: "footer_cta", label: "Footer CTA block" },
];

function isValidImageUrl(v: string): boolean {
  if (!v) return false;
  const s = v.trim();
  if (s.startsWith("data:image/")) return true;
  if (s.startsWith("/")) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/_admin/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const qc = useQueryClient();
  const [pageKey, setPageKey] = usePageKey();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings", pageKey],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("site_settings")
        .select("*")
        .eq("page_key", pageKey)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(data || {}); }, [data]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function save() {
    const siteName = (form.site_name || "").trim();
    if (!siteName) {
      toast.error("Site name cannot be empty");
      return;
    }
    const logo = (form.logo_url || "").trim();
    if (logo && !isValidImageUrl(logo)) {
      toast.error("Logo must be a valid image URL (http/https) or an uploaded image");
      return;
    }
    setSaving(true);
    try {
      const welcomeMs = Math.max(0, Math.min(5000, Number(form.welcome_animation_ms ?? 600) || 0));
      const motionPref = ["on", "off", "auto"].includes(form.default_motion_pref)
        ? form.default_motion_pref
        : "auto";
      const sectionVisibility =
        form.section_visibility && typeof form.section_visibility === "object"
          ? form.section_visibility
          : {};
      const payload: any = {
        site_title: form.site_title || "Portfolio",
        logo_url: logo || null,
        favicon_url: form.favicon_url,
        theme_primary: form.theme_primary, footer_text: form.footer_text,
        site_name: form.site_name, primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        hero_title: form.hero_title, hero_subtitle: form.hero_subtitle,
        welcome_animation_ms: welcomeMs,
        default_motion_pref: motionPref,
        section_visibility: sectionVisibility,
        reactions_enabled: form.reactions_enabled !== false,
        page_key: pageKey,
      };
      if (data?.id) {
        const { error } = await (supabase as any).from("site_settings").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("site_settings").insert(payload);
        if (error) throw error;
      }
      toast.success(`Site settings saved (Page ${pageKey})`);
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["public-site-settings"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (isLoading) return <div className="p-6">Loading…</div>;

  return (
    <AdminPage
      title="Site settings"
      description="Global identity used across the site. Each page version (B / F) can have its own brand identity."
      actions={
        <div className="flex items-center gap-3 flex-wrap">
          <PageKeySelector value={pageKey} onChange={setPageKey} />
          <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1.5" />{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      }
    >
      <AdminCard title="Identity">
        <div className="grid gap-4">
          <FormRow label="Site title (browser tab + meta)"><Input value={form.site_title || ""} onChange={(e) => set("site_title", e.target.value)} /></FormRow>
          <FormRow label="Site name (display brand name)">
            <Input
              value={form.site_name || ""}
              onChange={(e) => set("site_name", e.target.value)}
              placeholder="e.g. Ali Nur Hasan"
              required
              aria-invalid={!(form.site_name || "").trim()}
            />
            {!(form.site_name || "").trim() && (
              <p className="text-xs text-destructive mt-1">Site name is required.</p>
            )}
          </FormRow>
          <FormRow label="Logo" hint="Upload an image or paste a public image URL (http/https).">
            <div className="space-y-2">
              <MediaPicker value={form.logo_url} onChange={(u: string | null) => set("logo_url", u)} folder="profile" label="Logo" />
              {form.logo_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set("logo_url", null)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove logo
                </Button>
              )}
            </div>
          </FormRow>
          <FormRow label="Favicon (browser tab icon)" hint="Upload a square PNG/SVG (32×32 or larger). Shown in the browser tab next to the title.">
            <div className="space-y-2">
              <MediaPicker value={form.favicon_url} onChange={(u: string | null) => set("favicon_url", u)} folder="profile" label="Favicon" />
              {form.favicon_url && (
                <div className="flex items-center gap-2">
                  <img src={form.favicon_url} alt="favicon preview" className="w-6 h-6 rounded-md border border-white/10 object-contain bg-background" />
                  <Button type="button" variant="outline" size="sm" onClick={() => set("favicon_url", null)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove favicon
                  </Button>
                </div>
              )}
            </div>
          </FormRow>
          <FormRow label="Footer text"><Textarea rows={2} value={form.footer_text || ""} onChange={(e) => set("footer_text", e.target.value)} /></FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Branding colors">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormRow label="Brand primary color (hex)"><Input value={form.theme_primary || ""} onChange={(e) => set("theme_primary", e.target.value)} placeholder="#D9FF3D" /></FormRow>
          <FormRow label="Primary color (taxi CMS)"><Input value={form.primary_color || ""} onChange={(e) => set("primary_color", e.target.value)} placeholder="#B89B6F" /></FormRow>
          <FormRow label="Secondary color (taxi CMS)"><Input value={form.secondary_color || ""} onChange={(e) => set("secondary_color", e.target.value)} placeholder="#1B1C1F" /></FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Homepage behavior">
        <div className="grid gap-4">
          <FormRow
            label="Welcome animation duration (ms)"
            hint="How long the hero entrance fade/slide plays. 0 disables it. Range 0–5000."
          >
            <Input
              type="number"
              min={0}
              max={5000}
              step={50}
              value={form.welcome_animation_ms ?? 600}
              onChange={(e) => set("welcome_animation_ms", Number(e.target.value))}
            />
          </FormRow>
          <FormRow
            label="Default motion preference"
            hint="What new visitors see before they choose. Users can still override via the Motion toggle."
          >
            <select
              value={form.default_motion_pref ?? "auto"}
              onChange={(e) => set("default_motion_pref", e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="auto">Auto (follow OS)</option>
              <option value="on">On (always animate)</option>
              <option value="off">Off (reduce motion)</option>
            </select>
          </FormRow>
          <FormRow
            label="Homepage section visibility"
            hint="Toggle which sections render on the public site. Off = hidden for everyone."
          >
            <div className="grid sm:grid-cols-2 gap-2">
              {HOMEPAGE_SECTION_KEYS.map((s) => {
                const map =
                  form.section_visibility && typeof form.section_visibility === "object"
                    ? form.section_visibility
                    : {};
                const visible = map[s.key] !== false;
                return (
                  <label
                    key={s.key}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/40 px-3 py-2 text-sm"
                  >
                    <span>{s.label}</span>
                    <Switch
                      checked={visible}
                      onCheckedChange={(v) =>
                        set("section_visibility", { ...map, [s.key]: v })
                      }
                    />
                  </label>
                );
              })}
            </div>
          </FormRow>
          <FormRow
            label="Reactions on feed & portfolio"
            hint="When off, visitors cannot react to items. Existing reaction counts stay in the database."
          >
            <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/40 px-3 py-2 text-sm">
              <span>Allow reactions</span>
              <Switch
                checked={form.reactions_enabled !== false}
                onCheckedChange={(v) => set("reactions_enabled", v)}
              />
            </label>
          </FormRow>
        </div>
      </AdminCard>

      <AdminCard title="Services hero (used on /services page)">
        <div className="grid gap-4">
          <FormRow label="Hero title"><Input value={form.hero_title || ""} onChange={(e) => set("hero_title", e.target.value)} placeholder="Premium Taxi & Service Bookings" /></FormRow>
          <FormRow label="Hero subtitle"><Textarea rows={2} value={form.hero_subtitle || ""} onChange={(e) => set("hero_subtitle", e.target.value)} placeholder="Reliable rides, on-demand services, transparent pricing." /></FormRow>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
