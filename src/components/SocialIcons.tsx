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

export function SocialIcons({ links, size = 18, variant = "chip", className }: Props) {
  const reduce = useReducedMotion();
  const items = ORDER.filter(({ key }) => {
    const v = links?.[key];
    return typeof v === "string" && v.trim().length > 0;
  });
  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      {items.map(({ key, label, Icon }) => (
        <motion.a
          key={key}
          href={links![key]!}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          title={label}
          whileHover={reduce ? undefined : { y: -3, scale: 1.08 }}
          whileTap={reduce ? undefined : { scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 20 }}
          className={
            variant === "chip"
              ? "group relative w-11 h-11 grid place-items-center rounded-2xl bg-white/[0.04] border border-white/10 text-foreground/85 hover:text-primary-foreground hover:bg-gradient-gold hover:border-transparent hover:shadow-glow transition-all"
              : "w-9 h-9 grid place-items-center rounded-full text-muted-foreground hover:text-primary transition-colors"
          }
        >
          <Icon size={size} />
          {variant === "chip" && (
            <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-background/95 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-foreground/90 opacity-0 group-hover:opacity-100 transition-opacity">
              {label}
            </span>
          )}
        </motion.a>
      ))}
    </div>
  );
}
