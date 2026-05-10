import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { HireMeModal } from "./HireMeModal";

interface HireMeCtx {
  open: boolean;
  preselectedService: string | null;
  openHireMe: () => void;
  openHireMeForService: (service: string) => void;
  closeHireMe: () => void;
}

const Ctx = createContext<HireMeCtx | null>(null);

export function HireMeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<string | null>(null);

  const openHireMe = useCallback(() => {
    setPreselectedService(null);
    setOpen(true);
  }, []);
  const openHireMeForService = useCallback((service: string) => {
    setPreselectedService(service);
    setOpen(true);
  }, []);
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
    <Ctx.Provider value={{ open, preselectedService, openHireMe, openHireMeForService, closeHireMe }}>
      {children}
      <HireMeModal open={open} onClose={closeHireMe} preselectedService={preselectedService} />
    </Ctx.Provider>
  );
}

export function useHireMe(): HireMeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      open: false,
      preselectedService: null,
      openHireMe: () => {},
      openHireMeForService: () => {},
      closeHireMe: () => {},
    };
  }
  return ctx;
}
