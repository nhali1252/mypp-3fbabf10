import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { HireMeModal } from "./HireMeModal";

interface HireMeCtx {
  open: boolean;
  openHireMe: () => void;
  closeHireMe: () => void;
}

const Ctx = createContext<HireMeCtx | null>(null);

export function HireMeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openHireMe = useCallback(() => setOpen(true), []);
  const closeHireMe = useCallback(() => setOpen(false), []);

  // Lock body scroll while popup is open for a polished, app-like feel.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <Ctx.Provider value={{ open, openHireMe, closeHireMe }}>
      {children}
      <HireMeModal open={open} onClose={closeHireMe} />
    </Ctx.Provider>
  );
}

export function useHireMe(): HireMeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe no-op fallback so SSR / out-of-tree usage never crashes.
    return {
      open: false,
      openHireMe: () => {},
      closeHireMe: () => {},
    };
  }
  return ctx;
}
