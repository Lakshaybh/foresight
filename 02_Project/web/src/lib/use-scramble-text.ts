"use client";

import { useEffect, useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Resolves a target string out of random characters, left to right — a
// "signal decoding" reveal instead of a plain fade. Fits a product about
// resolving noisy signals into a clear answer.
export function useScrambleText(text: string, { delay = 0, duration = 900 }: { delay?: number; duration?: number } = {}) {
  const ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.textContent = text;
      return;
    }

    let rafId = 0;
    let startTime = 0;
    const chars = text.split("");

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime - delay;
      if (elapsed < 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / duration);
      const revealedCount = Math.floor(progress * chars.length);

      el.textContent = chars
        .map((ch, i) => {
          if (ch === " " || ch === "." || ch === "'") return ch;
          if (i < revealedCount) return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.textContent = text;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [text, delay, duration]);

  return ref;
}
