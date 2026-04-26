import { useState, type ReactElement } from "react";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { useContactSettings } from "@/hooks/useContent";
import { SectionHeader } from "../SectionHeader";
import { Reveal, Stagger, StaggerItem } from "../motion/Reveal";
import { SocialIcons, type SocialMap } from "../SocialIcons";
import { useServerFn } from "@tanstack/react-start";
import { submitMessage } from "@/server/messages.functions";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email").max(320),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

const inputCls =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:-translate-y-0.5 focus:shadow-glow";

export function ContactSection() {
  const { data: contact } = useContactSettings();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const reduce = useReducedMotion();
  const send = useServerFn(submitMessage);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("Could not send message. Please try again.");
      return;
    }
    toast.success("Message sent. I'll be in touch soon.");
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  const social = (contact?.social_links as SocialMap | undefined) ?? {};
  const waNumber = contact?.whatsapp?.replace(/[^\d]/g, "");
  const waHref = social.whatsapp || (waNumber ? `https://wa.me/${waNumber}` : null);

  // Inline WhatsApp brand glyph for premium feel
  const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.11 4.91A10.05 10.05 0 0 0 12.04 2C6.5 2 2 6.5 2 12.04c0 1.77.46 3.49 1.34 5.01L2 22l5.07-1.33a10.04 10.04 0 0 0 4.97 1.27h.01c5.54 0 10.04-4.5 10.04-10.04 0-2.68-1.04-5.2-2.98-7.09Zm-7.07 15.42h-.01a8.36 8.36 0 0 1-4.26-1.17l-.31-.18-3.01.79.8-2.93-.2-.3a8.34 8.34 0 0 1-1.28-4.5c0-4.61 3.75-8.36 8.36-8.36 2.23 0 4.33.87 5.91 2.45a8.31 8.31 0 0 1 2.45 5.92c0 4.61-3.75 8.36-8.45 8.28Zm4.58-6.27c-.25-.13-1.49-.74-1.72-.82-.23-.08-.4-.13-.56.13-.16.25-.64.82-.78.99-.14.16-.29.18-.54.06-.25-.13-1.06-.39-2.02-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.13-.56-1.34-.77-1.84-.2-.48-.41-.41-.56-.42l-.48-.01a.92.92 0 0 0-.66.31c-.23.25-.86.84-.86 2.05s.88 2.39 1 2.55c.13.16 1.74 2.66 4.22 3.73.59.25 1.05.4 1.41.51.59.19 1.13.16 1.55.1.47-.07 1.49-.61 1.7-1.2.21-.59.21-1.1.14-1.2-.06-.11-.23-.17-.48-.3Z"/>
    </svg>
  );

  type Row = { key: string; label: string; value: string; href?: string; Icon: (p: { size?: number }) => ReactElement };
  const rows: Row[] = [];
  if (contact?.email) rows.push({ key: "email", label: "Email", value: contact.email, href: `mailto:${contact.email}`, Icon: (p) => <Mail size={p.size ?? 16} /> });
  if (contact?.phone) rows.push({ key: "phone", label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}`, Icon: (p) => <Phone size={p.size ?? 16} /> });
  if (contact?.address) rows.push({ key: "loc", label: "Location", value: contact.address, Icon: (p) => <MapPin size={p.size ?? 16} /> });

  return (
    <section id="contact" className="pt-24">
      <SectionHeader label="Contact" title="Let's connect." />
      <div className="grid md:grid-cols-[1.25fr_0.75fr] gap-4 mb-5">
        <Reveal as="article" className="bg-gradient-card border border-white/5 rounded-[22px] p-8 shadow-soft transition-shadow hover:shadow-card">
          <h3 className="font-bold text-base mb-4">Get in touch</h3>
          <Stagger className="grid gap-3" stagger={0.07}>
            {rows.map(({ key, label, value, href, Icon }) => {
              const Inner = (
                <div className="flex items-center gap-3 w-full">
                  <span className="w-9 h-9 grid place-items-center rounded-xl bg-white/[0.05] border border-white/10 text-primary shrink-0">
                    <Icon size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </div>
                    <div className="text-sm font-semibold text-foreground truncate">{value}</div>
                  </div>
                </div>
              );
              return (
                <StaggerItem key={key} y={10}>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="block p-3 rounded-2xl border border-transparent hover:border-primary/25 hover:bg-white/[0.03] transition-all"
                    >
                      {Inner}
                    </a>
                  ) : (
                    <div className="p-3 rounded-2xl">{Inner}</div>
                  )}
                </StaggerItem>
              );
            })}
          </Stagger>
        </Reveal>
        <Reveal
          as="article"
          className="bg-gradient-card border border-white/5 rounded-[22px] p-8 shadow-soft transition-shadow hover:shadow-card"
          delay={0.12}
        >
          <h3 className="font-bold text-base mb-2">Find me online</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Connect on socials — quick replies on WhatsApp and Telegram.
          </p>
          <SocialIcons links={{ ...social, whatsapp: waHref ?? social.whatsapp }} variant="chip" />
        </Reveal>
      </div>

      <Reveal as="div" y={36}>
        <form
          onSubmit={submit}
          className="bg-gradient-card border border-white/5 rounded-[22px] p-8 space-y-3 shadow-soft transition-shadow hover:shadow-card"
        >
          <h3 className="font-bold text-base mb-1">Send a message</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <input required placeholder="Your name" value={form.name} onChange={set("name")} className={inputCls} />
            <input required type="email" placeholder="Email" value={form.email} onChange={set("email")} className={inputCls} />
          </div>
          <input placeholder="Subject" value={form.subject} onChange={set("subject")} className={inputCls} />
          <textarea required placeholder="Your message" rows={5} value={form.message} onChange={set("message")} className={`${inputCls} resize-none`} />
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={reduce || loading ? undefined : { y: -3, scale: 1.03 }}
            whileTap={reduce || loading ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="bg-gradient-gold text-primary-foreground px-7 py-3.5 rounded-full text-sm font-bold hover:shadow-glow disabled:opacity-60 transition-shadow"
          >
            {loading ? "Sending…" : "Send message"}
          </motion.button>
        </form>
      </Reveal>
    </section>
  );
}
