import { useEffect, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mail, X, Send as SendIcon } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useContactSettings } from "@/hooks/useContent";
import { useServerFn } from "@tanstack/react-start";
import { submitMessage } from "@/lib/fns/messages.functions";
import { SocialIcons, type SocialMap } from "./SocialIcons";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email").max(320),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

const inputCls =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:-translate-y-0.5 focus:shadow-glow";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedService?: string | null;
}

const WhatsAppIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M19.11 4.91A10.05 10.05 0 0 0 12.04 2C6.5 2 2 6.5 2 12.04c0 1.77.46 3.49 1.34 5.01L2 22l5.07-1.33a10.04 10.04 0 0 0 4.97 1.27h.01c5.54 0 10.04-4.5 10.04-10.04 0-2.68-1.04-5.2-2.98-7.09Zm-7.07 15.42h-.01a8.36 8.36 0 0 1-4.26-1.17l-.31-.18-3.01.79.8-2.93-.2-.3a8.34 8.34 0 0 1-1.28-4.5c0-4.61 3.75-8.36 8.36-8.36 2.23 0 4.33.87 5.91 2.45a8.31 8.31 0 0 1 2.45 5.92c0 4.61-3.75 8.36-8.45 8.28Zm4.58-6.27c-.25-.13-1.49-.74-1.72-.82-.23-.08-.4-.13-.56.13-.16.25-.64.82-.78.99-.14.16-.29.18-.54.06-.25-.13-1.06-.39-2.02-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.13-.56-1.34-.77-1.84-.2-.48-.41-.41-.56-.42l-.48-.01a.92.92 0 0 0-.66.31c-.23.25-.86.84-.86 2.05s.88 2.39 1 2.55c.13.16 1.74 2.66 4.22 3.73.59.25 1.05.4 1.41.51.59.19 1.13.16 1.55.1.47-.07 1.49-.61 1.7-1.2.21-.59.21-1.1.14-1.2-.06-.11-.23-.17-.48-.3Z" />
  </svg>
);

export function HireMeModal({ open, onClose, preselectedService }: Props) {
  const reduce = useReducedMotion();
  const { data: contact } = useContactSettings();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const send = useServerFn(submitMessage);

  // When opened with a preselected service, prefill the message body so the
  // user only needs to add their brief details.
  useEffect(() => {
    if (open && preselectedService) {
      setForm((f) => {
        const tag = `Service: ${preselectedService}\n\n`;
        if (f.message.includes(`Service: ${preselectedService}`)) return f;
        return { ...f, message: tag + (f.message || "") };
      });
    }
  }, [open, preselectedService]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const social = (contact?.social_links as SocialMap | undefined) ?? {};
  const waNumber = contact?.whatsapp?.replace(/[^\d]/g, "");
  const waHref = social.whatsapp || (waNumber ? `https://wa.me/${waNumber}` : null);

  type Quick = { key: string; label: string; value: string; href: string; Icon: (p: { size?: number }) => ReactElement };
  const quick: Quick[] = [];
  if (contact?.email)
    quick.push({
      key: "email",
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
      Icon: (p) => <Mail size={p.size ?? 14} />,
    });
  if (waHref)
    quick.push({
      key: "wa",
      label: "WhatsApp",
      value: contact?.whatsapp || "Chat on WhatsApp",
      href: waHref,
      Icon: (p) => <WhatsAppIcon size={p.size ?? 14} />,
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await send({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          subject: "Hire Me — request from popup",
          message: parsed.data.message,
        },
      });
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      toast.error(err?.message || "Could not send message. Please try again.");
      return;
    }
    toast.success("Message sent. I'll be in touch soon.");
    setForm({ name: "", email: "", message: "" });
    onClose();
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="hireme-overlay"
          className="fixed inset-x-0 top-[var(--hireme-vv-top,0px)] z-[100] flex items-end justify-center sm:items-center sm:p-6 h-[var(--hireme-vv-height,100dvh)] overflow-hidden overscroll-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="hireme-title"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            onClick={onClose}
          />

          {/* Panel — bottom sheet on mobile, centered card on ≥sm */}
          <motion.div
            className="relative w-full sm:max-w-[560px] max-h-[min(88dvh,calc(var(--hireme-vv-height,100dvh)-1rem))] sm:max-h-[min(90vh,calc(var(--hireme-vv-height,100dvh)-3rem))] overflow-y-auto overscroll-contain bg-gradient-card border border-white/10 rounded-t-[28px] sm:rounded-[28px] shadow-card p-6 sm:p-8 pb-[max(5.5rem,env(safe-area-inset-bottom))] sm:pb-8 [scrollbar-gutter:stable]"
            initial={{ opacity: 0, y: reduce ? 0 : 28, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 28, scale: 1 }}
            transition={{ duration: 0.32, ease }}
          >
            {/* Glow accent */}
            <div
              aria-hidden
              className="absolute -top-24 -right-24 w-[320px] h-[320px] rounded-full pointer-events-none opacity-50"
              style={{
                background:
                  "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 55%, transparent), transparent 70%)",
                filter: "blur(70px)",
              }}
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <span className="block text-[0.65rem] font-bold tracking-[0.2em] uppercase text-primary mb-1.5">
                    Let's work together
                  </span>
                  <h2
                    id="hireme-title"
                    className="font-serif-display italic text-[28px] sm:text-[34px] leading-[1.05] text-foreground"
                  >
                    Hire Me
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[380px]">
                    Tell me about your project — logo, banner, poster, or web visuals. I'll reply within 24 hours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="shrink-0 w-10 h-10 grid place-items-center rounded-full bg-white/[0.05] border border-white/10 text-foreground/85 hover:text-primary-foreground hover:bg-gradient-gold hover:border-transparent hover:shadow-glow transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Quick contacts */}
              {quick.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
                  {quick.map(({ key, label, value, href, Icon }) => (
                    <a
                      key={key}
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-primary/40 hover:bg-white/[0.06] transition-all"
                    >
                      <span className="w-9 h-9 grid place-items-center rounded-xl bg-white/[0.05] border border-white/10 text-primary shrink-0 group-hover:bg-gradient-gold group-hover:text-primary-foreground group-hover:border-transparent transition-all">
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
                          {label}
                        </div>
                        <div className="text-sm font-semibold text-foreground truncate">{value}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Socials */}
              {Object.keys(social).length > 0 && (
                <div className="mb-5">
                  <div className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Or find me on
                  </div>
                  <SocialIcons links={social} variant="chip" />
                </div>
              )}

              {/* Form */}
              <form onSubmit={submit} className="space-y-2.5">
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <input
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={set("name")}
                    className={inputCls}
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={set("email")}
                    className={inputCls}
                  />
                </div>
                <textarea
                  required
                  placeholder="Tell me about your project…"
                  rows={4}
                  value={form.message}
                  onChange={set("message")}
                  className={`${inputCls} resize-none`}
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={reduce || loading ? undefined : { y: -3, scale: 1.02 }}
                  whileTap={reduce || loading ? undefined : { scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-gold text-primary-foreground px-7 py-3.5 rounded-full text-sm font-bold hover:shadow-glow disabled:opacity-60 transition-shadow"
                >
                  <SendIcon size={15} />
                  {loading ? "Sending…" : "Send message"}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document === "undefined" ? null : createPortal(modal, document.body);
}
