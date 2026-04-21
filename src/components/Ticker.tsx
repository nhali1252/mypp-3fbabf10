import { useTickerItems } from "@/hooks/useContent";
import { motion, useReducedMotion } from "framer-motion";

export function Ticker() {
  const { data: items = [] } = useTickerItems();
  const loop = [...items, ...items];
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="ticker-wrap relative z-[2] mx-3 md:mx-7 bg-gradient-card border-t border-white/5 rounded-b-[26px] overflow-hidden py-[18px] mb-14 shadow-soft"
    >
      <div className="ticker-track flex whitespace-nowrap">
        {loop.map((it: { id: string; text: string }, i: number) => (
          <div key={`${it.id}-${i}`} className="flex items-center group">
            <span className="text-[0.78rem] font-semibold tracking-[0.09em] uppercase text-muted-foreground px-7 transition-colors hover:text-foreground">
              {it.text}
            </span>
            <span className="text-primary">●</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
