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
  // Use overflow:hidden on <html> + scrollbar-gutter compensation. Avoid
  // position:fixed on <body> — it shrinks the document and can hide the
  // modal panel on mobile (especially with items-end bottom sheets).
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollbarW = window.innerWidth - html.clientWidth;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarW > 0) body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.paddingRight = prev.bodyPaddingRight;
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
