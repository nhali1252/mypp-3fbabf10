import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Clock, Loader2, Send, CheckCircle2, ShieldCheck, Cpu, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { submitBooking } from "@/lib/fns/bookings.functions";
import { Footer } from "@/components/Footer";

const unlockServices = [
  "Xiaomi HyperOS Remote Token Bypass ($39)",
  "Fastboot Remote Assist ($19)",
  "Qualcomm 9008 EDL & MTK Unbrick ($49)",
  "Root & Play Integrity Suite ($29)",
  "Samsung Global Root & KnoxPatch ($35)",
  "Free Diagnostic Inquiry ($0)",
];

const brands = [
  "Xiaomi / Poco / Redmi",
  "Samsung (Global / Exynos / Snapdragon B)",
  "Google Pixel",
  "OnePlus",
  "Motorola",
  "Sony Xperia",
  "Nothing Phone",
  "Asus (ROG / Zenfone)",
  "Realme / Oppo",
  "Transsion (Infinix / Tecno)",
  "Other / Unsure",
];

const timeSlots = [
  "09:00 UTC", "11:00 UTC", "13:00 UTC", "15:00 UTC", "17:00 UTC", "19:00 UTC", "21:00 UTC",
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
      { title: "Book a Bootloader Unlock Session — FastbootDesk" },
      {
        name: "description",
        content:
          "Schedule a 1-on-1 remote bootloader unlocking, HyperOS token bypass, or Qualcomm EDL unbrick session with an experienced firmware engineer.",
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
  const [brand, setBrand] = useState(brands[0]);
  const [model, setModel] = useState("");
  const [service, setService] = useState(unlockServices[0]);
  const [day, setDay] = useState<string>(days[0]?.iso ?? "");
  const [slot, setSlot] = useState<string>(timeSlots[2]);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !model.trim() || !day) {
      toast.error("Please fill in your name, email, device model and pick a date.");
      return;
    }
    setSending(true);
    try {
      await send({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          service: `${service} [Brand: ${brand} | Model: ${model.trim()}]`,
          preferred_date: day,
          preferred_time: slot,
          notes: notes.trim(),
        },
      });
      setDone(true);
      toast.success("Session request received — our engineer will reach out to confirm your slot.");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not submit booking. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="container mx-auto max-w-2xl px-6 py-12 md:py-20">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary uppercase tracking-widest mb-3">
            <Cpu className="w-3.5 h-3.5" />
            1-on-1 Remote Engineering
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Schedule Remote Unlock Session
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect directly with an Android firmware engineer via AnyDesk or TeamViewer. No unlock, no charge.
          </p>
        </header>

        {done ? (
          <div className="rounded-2xl border border-border bg-card/80 p-8 text-center backdrop-blur-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-4" />
            <h2 className="text-xl font-bold">Session Request Confirmed!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We received your unlock request for <strong className="text-foreground">{brand} {model}</strong>. Check your inbox ({email}) for connection instructions and pre-session driver verification.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/projects"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:shadow-glow transition-all"
              >
                Browse Device Matrix
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-6 rounded-2xl border border-border bg-card/70 p-6 sm:p-8 backdrop-blur-md shadow-xl"
          >
            {/* BRAND & MODEL */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" /> Device Specifications
              </h3>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Device Manufacturer
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs outline-none focus:border-primary"
                >
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Exact Model & Variant (Required)
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Xiaomi 14 Ultra (24030PN60G) or Galaxy S24 Ultra (SM-S928B)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Service Package
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs outline-none focus:border-primary"
                >
                  {unlockServices.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DATE & TIME */}
            <div className="pt-4 border-t border-border space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Preferred Session Slot
              </h3>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Session Date
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {days.map((d) => (
                    <button
                      type="button"
                      key={d.iso}
                      onClick={() => setDay(d.iso)}
                      className={`p-2.5 rounded-xl text-center text-xs font-medium border transition-all ${
                        day === d.iso
                          ? "bg-primary text-primary-foreground border-primary shadow-glow font-bold"
                          : "bg-background border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Time Slot
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {timeSlots.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSlot(s)}
                      className={`p-2 rounded-xl text-center text-xs font-medium border transition-all ${
                        slot === s
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "bg-background border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CONTACT DETAILS */}
            <div className="pt-4 border-t border-border space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Contact & Remote Access
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Telegram Username or WhatsApp (For Instant Remote Coordination)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="@telegram_handle or +1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Symptoms / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your current status: e.g. Phone is working on HyperOS 1.0.8, need bootloader unlock to flash LineageOS. Or stuck in 9008 EDL mode."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-glow disabled:opacity-50 transition-all"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Request Remote Unlock Session
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Satisfaction Guarantee. Payment is only collected after successful unlock verification.</span>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
