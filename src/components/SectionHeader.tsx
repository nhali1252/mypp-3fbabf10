import { motion, useReducedMotion } from "framer-motion";

export function SectionHeader({ label, title }: { label: string; title: string }) {
  const reduce = useReducedMotion();
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <motion.div
      className="mb-8"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } },
      }}
    >
      <motion.span
        className="block text-[0.7rem] font-bold tracking-[0.13em] uppercase text-muted-foreground mb-3.5"
        variants={{
          hidden: { opacity: 0, y: reduce ? 0 : 14 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
        }}
      >
        {label}
      </motion.span>
      <motion.h2
        className="font-extrabold tracking-[-0.04em] leading-[1.04] text-foreground"
        style={{ fontSize: "clamp(1.9rem, 3.6vw, 3.1rem)" }}
        variants={{
          hidden: { opacity: 0, y: reduce ? 0 : 24 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease } },
        }}
      >
        {title}
      </motion.h2>
    </motion.div>
  );
}
