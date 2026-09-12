"use client";

import { useScrambleText } from "@/lib/use-scramble-text";
import { cn } from "cn";

export function ScrambleLine({
  text,
  className,
  delay = 0,
  duration = 900,
}: {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const ref = useScrambleText(text, { delay, duration });
  return (
    <p ref={ref} className={cn(className)}>
      {text}
    </p>
  );
}
