"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MobileNavContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const value = useMemo(
    () => ({ open, setOpen, toggle }),
    [open, toggle]
  );
  return (
    <MobileNavContext.Provider value={value}>
      {children}
    </MobileNavContext.Provider>
  );
}

/** Dentro do dashboard; fora do provider devolve null. */
export function useOptionalMobileNav() {
  return useContext(MobileNavContext);
}
