import { motion, useReducedMotion } from "framer-motion";
import { Linkedin, Facebook, Send, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SocialMap {
  linkedin?: string;
  facebook?: string;
  telegram?: string;
  whatsapp?: string;
  [k: string]: string | undefined;
}

const ORDER: Array<{ key: keyof SocialMap; label: string; Icon: LucideIcon }> = [
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { key: "facebook", label: "Facebook", Icon: Facebook },
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
    <div className={`flex flex-wrap gap-2.5 ${className ?? ""}`}>
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
              ? "w-10 h-10 grid place-items-center rounded-full bg-white/[0.05] border border-white/10 text-foreground/85 hover:text-primary-foreground hover:bg-gradient-gold hover:border-transparent hover:shadow-glow transition-all"
              : "w-9 h-9 grid place-items-center rounded-full text-muted-foreground hover:text-primary transition-colors"
          }
        >
          <Icon size={size} />
        </motion.a>
      ))}
    </div>
  );
}
