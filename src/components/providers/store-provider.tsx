"use client";

import { useEffect, useRef } from "react";
import { useSetupStore } from "@/lib/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
    }
  }, []);

  return <>{children}</>;
}