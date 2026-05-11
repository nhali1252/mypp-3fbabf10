import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Save, Eye, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AdminPage, AdminCard, FormRow } from "@/components/admin/AdminPage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  listEmailTemplateSettings,
  updateEmailTemplateSettings,
  previewEmailTemplate,
} from "@/server/email-template-settings.functions";

export const Route = createFileRoute("/_admin/admin/email-templates")({
  component: AdminEmailTemplates,
});

type FieldDef = {
  key: string;
  label: string;
  hint?: string;
  type?: "text" | "textarea" | "color";
};

const COMMON_FIELDS: FieldDef[] = [
  { key: "subject", label: "Subject line", hint: "Tokens: {{name}}, {{subject?}}" },
  { key: "preheader", label: "Preheader (inbox preview)", hint: "Tokens: {{name}}, {{subject}}" },
  { key: "heading", label: "Heading", hint: "Tokens: {{name}}" },
  { key: "eyebrow", label: "Eyebrow / kicker" },
  { key: "introText", label: "Intro paragraph", type: "textarea" },
  { key: "footerNote", label: "Footer note", type: "textarea", hint: "Tokens: {{email}}" },
];

const SIGNATURE_FIELDS: FieldDef[] = [
  { key: "signatureName", label: "Signature name" },
  { key: "signatureUrl", label: "Signature URL" },
  { key: "signatureUrlLabel", label: "Signature URL label" },
];

const COLOR_FIELDS: FieldDef[] = [
  { key: "accentColor", label: "Accent", type: "color" },
  { key: "textColor", label: "Text", type: "color" },
  { key: "mutedColor", label: "Muted text", type: "color" },
  { key: "bgColor", label: "Page background", type: "color" },
  { key: "containerBg", label: "Container background", type: "color" },
  { key: "cardBg", label: "Inner card background", type: "color" },
  { key: "borderColor", label: "Border", type: "color" },
];

function AdminEmailTemplates() {
  const qc = useQueryClient();
  const list = useServerFn(listEmailTemplateSettings);
  const update = useServerFn(updateEmailTemplateSettings);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: () => list(),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { template_key: string; settings: Record<string, string> }) =>
      update({ data: vars }),
    onSuccess: () => {
      toast.success("Template branding saved");
      qc.invalidateQueries({ queryKey: ["admin-email-templates"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  if (isLoading || !data) return <div className="p-6">Loading…</div>;

  return (
    <AdminPage
      title="Email template branding"
      description="Customise the wording, colours, and signature used by the contact confirmation and admin notification emails. Blank fields fall back to the built-in defaults."
    >
      <Tabs defaultValue={data[0]?.template_key} className="space-y-4">
        <TabsList>
          {data.map((t: any) => (
            <TabsTrigger key={t.template_key} value={t.template_key}>
              {t.displayName}
            </TabsTrigger>
          ))}
        </TabsList>
        {data.map((t: any) => (
          <TabsContent key={t.template_key} value={t.template_key}>
            <TemplateEditor
              templateKey={t.template_key}
              initial={t.settings ?? {}}
              onSave={(settings) => updateMut.mutate({ template_key: t.template_key, settings })}
              saving={updateMut.isPending}
            />
          </TabsContent>
        ))}
      </Tabs>
    </AdminPage>
  );
}

function TemplateEditor({
  templateKey,
  initial,
  onSave,
  saving,
}: {
  templateKey: string;
  initial: Record<string, string>;
  onSave: (s: Record<string, string>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>(initial);
  useEffect(() => setForm(initial), [initial, templateKey]);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const previewFn = useServerFn(previewEmailTemplate);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  async function refreshPreview() {
    setLoadingPreview(true);
    try {
      const res = await previewFn({ data: { template_key: templateKey as any, settings: form } });
      setPreviewHtml(res.html);
      setPreviewSubject(res.subject);
    } catch (e: any) {
      toast.error(e?.message ?? "Preview failed");
    } finally {
      setLoadingPreview(false);
    }
  }

  // Auto-load initial preview
  useEffect(() => { refreshPreview(); /* eslint-disable-next-line */ }, [templateKey]);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <AdminCard title="Copy & wording">
          {COMMON_FIELDS.map((f) => (
            <FormRow key={f.key} label={f.label} hint={f.hint}>
              {f.type === "textarea" ? (
                <Textarea
                  value={form[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  rows={3}
                />
              ) : (
                <Input
                  value={form[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </FormRow>
          ))}
        </AdminCard>

        <AdminCard title="Signature">
          {SIGNATURE_FIELDS.map((f) => (
            <FormRow key={f.key} label={f.label}>
              <Input value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
            </FormRow>
          ))}
        </AdminCard>

        <AdminCard title="Colours">
          <div className="grid sm:grid-cols-2 gap-3">
            {COLOR_FIELDS.map((f) => (
              <FormRow key={f.key} label={f.label}>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={form[f.key] || "#000000"}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="h-9 w-14 p-1"
                  />
                  <Input
                    value={form[f.key] ?? ""}
                    placeholder="default"
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </div>
              </FormRow>
            ))}
          </div>
        </AdminCard>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onSave(form)} disabled={saving}>
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button variant="secondary" onClick={refreshPreview} disabled={loadingPreview}>
            <Eye className="w-4 h-4 mr-1.5" />
            {loadingPreview ? "Rendering…" : "Refresh preview"}
          </Button>
          <Button variant="ghost" onClick={() => setForm({})}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset to defaults
          </Button>
        </div>
      </div>

      <AdminCard title="Live preview">
        <div className="text-xs text-muted-foreground mb-2 truncate">
          <span className="font-medium">Subject:</span> {previewSubject || "—"}
        </div>
        <iframe
          title="Email preview"
          srcDoc={previewHtml}
          className="w-full h-[640px] rounded-md border bg-white"
        />
      </AdminCard>
    </div>
  );
}
