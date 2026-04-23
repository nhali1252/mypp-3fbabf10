import { motion, useReducedMotion } from "framer-motion";
import { Linkedin, Facebook, Send, MessageCircle, Instagram, Github, Twitter } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SocialMap {
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  github?: string;
  twitter?: string;
  [k: string]: string | undefined;
}

const ORDER: Array<{ key: keyof SocialMap; label: string; Icon: LucideIcon }> = [
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "twitter", label: "X (Twitter)", Icon: Twitter },
  { key: "github", label: "GitHub", Icon: Github },
  { key: "telegram", label: "Telegram", Icon: Send },
  { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
];

interface Props {
  links?: SocialMap | null;
  size?: number;
  variant?: "chip" | "ghost";
  className?: string;
}

function normalizeUrl(key: string, raw: string): string {
  const v = raw.trim();
  if (!v) return v;
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  if (key === "whatsapp") {
    const digits = v.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}` : v;
  }
  if (key === "telegram") {
    const handle = v.replace(/^@/, "");
    return `https://t.me/${handle}`;
  }
  if (key === "email") return `mailto:${v}`;
  return `https://${v.replace(/^\/+/, "")}`;
}

export function SocialIcons({ links, size = 18, variant = "chip", className }: Props) {
  const reduce = useReducedMotion();
  const items = ORDER.filter(({ key }) => {
    const v = links?.[key];
    return typeof v === "string" && v.trim().length > 0;
  }).map(({ key, label, Icon }) => ({
    key,
    label,
    Icon,
    href: normalizeUrl(String(key), links![key]!),
  }));
  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      {items.map(({ key, label, Icon, href }, i) => (
        <motion.a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          initial={reduce ? false : { opacity: 0, y: 8, scale: 0.85 }}
          animate={
            reduce
              ? undefined
              : {
                  opacity: 1,
                  y: [0, -4, 0],
                  scale: 1,
                  transition: {
                    opacity: { duration: 0.4, delay: i * 0.06 },
                    scale: { type: "spring", stiffness: 380, damping: 18, delay: i * 0.06 },
                    y: {
                      duration: 3.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5 + i * 0.18,
                    },
                  },
                }
          }
          whileHover={
            reduce
              ? undefined
              : { y: -6, scale: 1.12, rotate: [0, -6, 6, -3, 0], transition: { rotate: { duration: 0.55 } } }
          }
          whileTap={reduce ? undefined : { scale: 0.92 }}
          className={
            variant === "chip"
              ? "group relative w-11 h-11 grid place-items-center rounded-2xl bg-white/[0.04] border border-white/10 text-foreground/85 overflow-hidden hover:text-primary-foreground hover:bg-gradient-gold hover:border-transparent hover:shadow-glow transition-[color,background,border-color,box-shadow] duration-300"
              : "group relative w-9 h-9 grid place-items-center rounded-full text-muted-foreground hover:text-primary transition-colors"
          }
        >
          {variant === "chip" && (
            <>
              {/* Shimmer sweep on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
              {/* Soft pulsing glow ring on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary/0 group-hover:ring-primary/40 group-hover:animate-pulse transition-all duration-300"
              />
            </>
          )}
          <motion.span
            className="relative z-10 grid place-items-center"
            whileHover={reduce ? undefined : { scale: 1.15 }}
            transition={{ type: "spring", stiffness: 420, damping: 14 }}
          >
            <Icon size={size} />
          </motion.span>
          {variant === "chip" && (
            <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-background/95 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-foreground/90 opacity-0 group-hover:opacity-100 group-hover:-bottom-8 transition-all duration-300">
              {label}
            </span>
          )}
        </motion.a>
      ))}
    </div>
  );
}
