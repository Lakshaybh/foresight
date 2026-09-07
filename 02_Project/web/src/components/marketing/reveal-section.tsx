"use client";

import { useScrollReveal } from "@/lib/use-scroll-reveal";

export function RevealSection({
  children,
  className,
  y,
  stagger,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  stagger?: number;
}) {
  const ref = useScrollReveal<HTMLDivElement>({ y, stagger });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
