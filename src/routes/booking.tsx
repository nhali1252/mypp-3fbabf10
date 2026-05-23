import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Clock, Loader2, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { submitBooking } from "@/server/bookings.functions";
import { Footer } from "@/components/Footer";

const services = [
  "Brand Identity",
  "Logo Design",
  "Packaging",
  "Print / Editorial",
  "Invitation Suite",
  "Social Templates",
  "Discovery call",
  "Other",
];

const timeSlots = [
  "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00",
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

export const Route = createFileRoute("/booking")({
  component: BookingPage,
  head: () => ({
    meta: [
      { title: "Book a project — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Reserve a slot to discuss your project with Ali Nur Hasan. Pick a date, share what you need, and get a confirmation email back.",
      },
    ],
  }),
});

function BookingPage() {
  const days = useMemo(() => nextWeekdays(10), []);
  const send = useServerFn(submitBooking);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(services[0]);
  const [day, setDay] = useState<string>(days[0]?.iso ?? "");
  const [slot, setSlot] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !day) {
      toast.error("Please fill in name, email and pick a date.");
      return;
    }
    setSending(true);
    try {
      await send({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          service,
          preferred_date: day,
          preferred_time: slot,
          notes: notes.trim(),
        },
      });
      setDone(true);
      toast.success("Booking received — check your inbox for the confirmation.");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not submit booking. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="container mx-auto max-w-2xl px-6 py-16 md:py-24">
        <header className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-3">
            Book a project
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
            Reserve a slot
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Pick a date, share what you need — I'll confirm within 24 hours.
          </p>
        </header>

        {done ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="text-2xl font-semibold mb-2">Booking received</h2>
            <p className="text-muted-foreground mb-6">
              I've got your request and sent a confirmation to <strong>{email}</strong>.
              You'll hear back from me within 24 hours.
            </p>
            <Link
              to="/"
              className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={200}
                  className="form-input"
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={320}
                  className="form-input"
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={60}
                  className="form-input"
                />
              </Field>
              <Field label="Service">
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="form-input"
                >
                  {services.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Preferred date" icon={<Calendar className="h-3.5 w-3.5" />} required>
              <div className="flex flex-wrap gap-2">
                {days.map((d) => (
                  <button
                    type="button"
                    key={d.iso}
                    onClick={() => setDay(d.iso)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      day === d.iso
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Preferred time (optional)" icon={<Clock className="h-3.5 w-3.5" />}>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setSlot(slot === t ? "" : t)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      slot === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Notes (optional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="Tell me a bit about the project, deadlines, references…"
                className="form-input resize-none"
              />
            </Field>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit booking
                </>
              )}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
        {required ? <span className="text-primary">*</span> : null}
      </span>
      {children}
    </label>
  );
}
