"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealOptions = {
  y?: number;
  duration?: number;
  stagger?: number;
  start?: string;
};

export function useScrollReveal<T extends HTMLElement>(options: RevealOptions = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = el.querySelectorAll("[data-reveal]");
    if (targets.length === 0) return;

    if (prefersReduced) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: options.y ?? 32 },
        {
          opacity: 1,
          y: 0,
          duration: options.duration ?? 1,
          stagger: options.stagger ?? 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: options.start ?? "top 75%",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [options.y, options.duration, options.stagger, options.start]);

  return ref;
}

export function isLowEndDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 8;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const smallViewport = window.innerWidth < 768;
  return cores <= 4 || mem <= 4 || smallViewport;
}
