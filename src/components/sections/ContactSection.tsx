import { useState } from "react";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { useContactSettings } from "@/hooks/useContent";
import { SectionHeader } from "../SectionHeader";
import { Reveal, Stagger, StaggerItem } from "../motion/Reveal";
import { SocialIcons, type SocialMap } from "../SocialIcons";
import { supabase } from "@/integrations/supabase/client";
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

  type Row = { key: string; label: string; value: string; href?: string; Icon: typeof Mail };
  const rows: Row[] = [];
  if (contact?.email) rows.push({ key: "email", label: "Email", value: contact.email, href: `mailto:${contact.email}`, Icon: Mail });
  if (contact?.phone) rows.push({ key: "phone", label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}`, Icon: Phone });
  if (waHref) rows.push({ key: "whatsapp", label: "WhatsApp", value: contact?.whatsapp || "Chat", href: waHref, Icon: MessageCircle });
  if (contact?.address) rows.push({ key: "loc", label: "Location", value: contact.address, Icon: MapPin });

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
          <SocialIcons links={social} variant="chip" />
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
