import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mail, Phone, MessageCircle, Sparkles, Send, Loader2, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { submitMessage } from "@/server/messages.functions";
import { useContactSettings } from "@/hooks/useContent";
import { Footer } from "@/components/Footer";

const projectTypes = [
  "Brand Identity",
  "Logo Design",
  "Packaging",
  "Print / Editorial",
  "Invitation Suite",
  "Social Templates",
  "Other",
];

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

function nextWeekdays(count: number) {
  const out: { iso: string; label: string }[] = [];
  const d = new Date();
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    out.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    });
  }
  return out;
}

export function ContactPage() {
  const days = useMemo(() => nextWeekdays(7), []);

  // Read ?service= from the route. Strict:false so the same component can
  // also render under other routes (e.g. embedded previews) without crashing.
  const search = useSearch({ strict: false }) as { service?: string } | undefined;
  const incomingService = (search?.service ?? "").trim();

  const contact = useContactSettings() as {
    data:
      | {
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          address: string | null;
        }
      | null;
  };

  // Resolve the initial project type. If the URL specifies a service that
  // matches one of our known types (case-insensitive), pre-select it.
  // Otherwise fall back to the first option, but if it's a brand-new value
  // (e.g. "Web Design" coming from a future service), we accept it as-is.
  const initialProjectType = useMemo(() => {
    if (!incomingService) return projectTypes[0];
    const match = projectTypes.find(
      (p) => p.toLowerCase() === incomingService.toLowerCase(),
    );
    return match ?? incomingService;
  }, [incomingService]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState(initialProjectType);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const send = useServerFn(submitMessage);

  // If the user lands on the page and a service is specified, scroll to the
  // form and focus the name input so the next action is obvious.
  useEffect(() => {
    if (!incomingService) return;
    setProjectType(initialProjectType);
    const t = window.setTimeout(() => {
      document.getElementById("contact-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      window.setTimeout(() => {
        document.getElementById("contact-name-input")?.focus();
      }, 500);
    }, 80);
    return () => window.clearTimeout(t);
  }, [incomingService, initialProjectType]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in your name, email and message.");
      return;
    }
    setSending(true);
    const subjectLine =
      [projectType, subject.trim()].filter(Boolean).join(" — ") || projectType;
    const scheduleNote =
      day && slot ? `\n\nPreferred call slot: ${day} at ${slot}` : "";
    try {
      await send({
        data: {
          name: name.trim(),
          email: email.trim(),
          subject: subjectLine,
          message: message.trim() + scheduleNote,
        },
      });
      setSending(false);
    } catch (err: any) {
      setSending(false);
      toast.error(err?.message || "Could not send message.");
      return;
    }
    toast.success("Inquiry sent — I'll reply within 24 hours.");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setDay(null);
    setSlot(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative px-5 sm:px-6 md:px-10 pt-10 sm:pt-14 md:pt-20 pb-8 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[820px] h-[520px] rounded-full blur-[140px] opacity-40"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 60%, transparent), transparent)",
          }}
        />
        <div className="relative max-w-[1100px] mx-auto text-center">
          <motion.button
            type="button"
            onClick={() => {
              const el = document.getElementById("contact-form");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
              setTimeout(() => {
                document.getElementById("contact-name-input")?.focus();
              }, 600);
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-[11px] font-bold uppercase tracking-[0.25em] text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Start a project
          </motion.button>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05 }}
            className="font-black tracking-tight leading-[1.02] mt-5"
            style={{ fontSize: "clamp(34px, 6.4vw, 78px)" }}
          >
            Let's design something{" "}
            <span className="font-serif-display italic font-medium text-primary">
              remarkable.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-muted-foreground mt-5 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            Share a brief and pick a time that suits you. I'll confirm the call and reply with
            first thoughts within 24 hours.
          </motion.p>
        </div>
      </section>

      {/* FORM + SIDE INFO */}
      <section className="px-5 sm:px-6 md:px-10 pb-16">
        <div className="max-w-[1180px] mx-auto grid lg:grid-cols-[1fr_360px] gap-6">
          <motion.form
            id="contact-form"
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl border border-border bg-card p-6 sm:p-8 md:p-10 space-y-6 scroll-mt-24"
            style={{ background: "var(--gradient-card)" }}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your name">
                <input
                  id="contact-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input"
                  placeholder="Write your name here"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                  placeholder="you@email.com"
                />
              </Field>
            </div>

            <Field label="Project type">
              <div className="flex flex-wrap gap-2">
                {projectTypes.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setProjectType(p)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                      projectType === p
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card/60 text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Subject" hint="Optional">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input"
                placeholder="A short headline for your project"
              />
            </Field>

            <Field label="Tell me about your project">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="input min-h-[140px] resize-y"
                placeholder="What are you building? Goals, timeline, references…"
              />
            </Field>

            {/* Scheduler */}
            <div className="rounded-2xl border border-border bg-background/40 p-5 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">
                <Calendar className="w-3.5 h-3.5" /> Schedule a call
                <span className="text-muted-foreground font-medium normal-case tracking-normal">
                  · Optional — pick a slot and I'll confirm by email.
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-2">
                Next 7 weekdays
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {days.map((d) => (
                  <button
                    type="button"
                    key={d.iso}
                    onClick={() => setDay(d.label)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      day === d.label
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Time slot
              </p>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setSlot(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      slot === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              By submitting you agree to be contacted about this inquiry. Your details are never
              shared.
            </p>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm font-bold hover:opacity-90 transition-opacity shadow-glow disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send inquiry
            </button>
          </motion.form>

          {/* Side info */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-4">
                Direct contact
              </p>
              <ul className="space-y-3 text-sm">
                {contact.data?.email && (
                  <li>
                    <a
                      href={`mailto:${contact.data.email}`}
                      className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="truncate">{contact.data.email}</span>
                    </a>
                  </li>
                )}
                {contact.data?.phone && (
                  <li>
                    <a
                      href={`tel:${contact.data.phone}`}
                      className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="w-4 h-4 text-primary" />
                      <span>{contact.data.phone}</span>
                    </a>
                  </li>
                )}
                {contact.data?.whatsapp && (
                  <li>
                    <a
                      href={`https://wa.me/${contact.data.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <span>WhatsApp</span>
                    </a>
                  </li>
                )}
                {!contact.data?.email && !contact.data?.phone && !contact.data?.whatsapp && (
                  <li className="text-xs text-muted-foreground">
                    Add direct contact details from the admin panel.
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
                Response time
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I reply to inquiries within 24 hours on weekdays. Calls happen Monday – Friday in
                the slots you can pick from the form.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
                What happens next
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-4">
                <li>I read your brief and reply within 24 hours.</li>
                <li>If a call slot was picked, I confirm it by email.</li>
                <li>We align scope, timeline and a small first thinking deck.</li>
              </ol>
            </div>
          </motion.aside>
        </div>
      </section>

      <Footer />

      <style>{`
        .input {
          width: 100%;
          background: color-mix(in oklab, var(--background) 80%, transparent);
          border: 1px solid var(--border);
          color: var(--foreground);
          padding: 0.7rem 0.95rem;
          border-radius: 0.85rem;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 200ms, box-shadow 200ms, background-color 200ms;
        }
        .input::placeholder { color: color-mix(in oklab, var(--muted-foreground) 80%, transparent); }
        .input:focus {
          border-color: color-mix(in oklab, var(--primary) 55%, var(--border));
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 20%, transparent);
          background: color-mix(in oklab, var(--background) 92%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
