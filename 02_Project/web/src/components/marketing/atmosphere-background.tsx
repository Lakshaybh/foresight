"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { isLowEndDevice } from "@/lib/use-scroll-reveal";

const AtmosphereField = dynamic(() => import("./atmosphere-field"), { ssr: false });

export function AtmosphereBackground() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || isLowEndDevice()) return;
    setEnabled(true);
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="fixed inset-0 z-0">
      <AtmosphereField />
    </div>
  );
}
