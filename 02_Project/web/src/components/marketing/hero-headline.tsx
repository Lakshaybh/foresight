"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "cn";

export function HeroHeadline({
  children,
  className,
  delay = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, filter: "blur(12px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, delay, ease: "power3.out" }
      );
    });
    return () => ctx.revert();
  }, [delay]);

  return (
    <h1 ref={ref} className={cn(className)}>
      {children}
    </h1>
  );
}
