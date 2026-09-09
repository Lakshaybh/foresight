"use client";

import { useEffect, useRef } from "react";

type RevealOptions = {
  y?: number;
  duration?: number;
  stagger?: number;
};

// IntersectionObserver-driven fade/rise-in. Deliberately not gsap
// ScrollTrigger: ScrollTrigger calculates each trigger's start position
// once on mount, and on a page with web fonts and images still loading,
// later sections can settle taller than they were when the trigger was
// calculated — which silently strands elements at opacity 0 forever (their
// trigger point ends up already "passed"). An observer re-evaluates
// against real, current layout every time, so it can't drift like that.
export function useScrollReveal<T extends HTMLElement>(options: RevealOptions = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (targets.length === 0) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      targets.forEach((t) => {
        t.style.opacity = "1";
        t.style.transform = "none";
      });
      return;
    }

    const y = options.y ?? 32;
    const duration = options.duration ?? 0.9;
    const stagger = options.stagger ?? 0.08;

    targets.forEach((t, i) => {
      const x = Number(t.dataset.revealX ?? 0);
      t.style.opacity = "0";
      t.style.transform = `translate(${x}px, ${y}px)`;
      t.style.transition = `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${i * stagger}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${i * stagger}s`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            targets.forEach((t) => {
              t.style.opacity = "1";
              t.style.transform = "translate(0, 0)";
            });
            observer.disconnect();
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -15% 0px" }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [options.y, options.duration, options.stagger]);

  return ref;
}

export function isLowEndDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 8;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const smallViewport = window.innerWidth < 768;
  return cores <= 4 || mem <= 4 || smallViewport;
}
