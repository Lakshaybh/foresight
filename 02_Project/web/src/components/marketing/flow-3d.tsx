"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const NODES = [
  { n: "01", title: "Connect", body: "Upload the spreadsheet you already have.", color: "var(--teal)" },
  { n: "02", title: "Detect", body: "Watch for a supplier quietly slipping.", color: "var(--teal)" },
  { n: "03", title: "Forecast", body: "Turn that drift into a stockout date.", color: "var(--amber)" },
  { n: "04", title: "Decide", body: "Match it to one clear recommended action.", color: "var(--amber)" },
  { n: "05", title: "You approve", body: "Nothing moves without a person saying yes.", color: "var(--orange)" },
  { n: "06", title: "Track outcome", body: "See whether the call actually paid off.", color: "var(--orange)" },
];

export function Flow3D() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const tilt = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const wrap = wrapRef.current;
    const group = groupRef.current;
    if (!wrap || !group) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (!prefersReduced) {
        gsap.fromTo(
          group,
          { rotateY: -34, rotateX: 14, opacity: 0 },
          {
            rotateY: -18,
            rotateX: 8,
            opacity: 1,
            duration: 1.4,
            ease: "power3.out",
            scrollTrigger: { trigger: wrap, start: "top 80%" },
          }
        );
      } else {
        gsap.set(group, { rotateY: -18, rotateX: 8, opacity: 1 });
      }

      const cards = group.querySelectorAll("[data-node]");
      gsap.fromTo(
        cards,
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: wrap, start: "top 70%" },
        }
      );
    }, wrap);

    if (prefersReduced) return () => ctx.revert();

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      tilt.current = { x: py * 10, y: px * 14 };
      gsap.to(group, {
        rotateX: 8 - tilt.current.x,
        rotateY: -18 + tilt.current.y,
        duration: 0.6,
        ease: "power2.out",
      });
    };
    const onLeave = () => {
      gsap.to(group, { rotateX: 8, rotateY: -18, duration: 0.8, ease: "power3.out" });
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto max-w-4xl py-10"
      style={{ perspective: "1600px" }}
    >
      <div
        ref={groupRef}
        className="relative mx-auto"
        style={{
          transformStyle: "preserve-3d",
          width: "min(100%, 620px)",
          height: `${NODES.length * 96 + 80}px`,
        }}
      >
        {/* connecting spine */}
        <svg
          className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2"
          style={{ transform: "translateZ(-10px)" }}
          viewBox={`0 0 8 ${NODES.length * 96 + 80}`}
          preserveAspectRatio="none"
        >
          <line
            x1="4"
            y1="20"
            x2="4"
            y2={NODES.length * 96 + 40}
            stroke="var(--line)"
            strokeWidth="2"
            strokeDasharray="4 6"
          />
        </svg>

        {NODES.map((node, i) => {
          const depth = i * 26;
          const xOffset = i % 2 === 0 ? -120 : 120;
          return (
            <div
              key={node.n}
              data-node
              className="absolute left-1/2 flex w-[280px] -translate-x-1/2 items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--void-2)]/90 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur"
              style={{
                top: `${i * 96}px`,
                transform: `translateX(${xOffset}px) translateZ(${depth}px)`,
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold text-[var(--void)]"
                style={{ backgroundColor: node.color }}
              >
                {node.n}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--bone)]">{node.title}</p>
                <p className="text-xs text-[var(--bone-dim)]">{node.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
