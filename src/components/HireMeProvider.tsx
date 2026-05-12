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

  // Lock body scroll while popup is open WITHOUT jumping the page.
  // Using `overflow:hidden` on <body> alone is fine, but some browsers/themes
  // also need the scroll position preserved so the page doesn't visually shift
  // when the modal opens from the footer (bottom of a long page).
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" as ScrollBehavior });
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
