"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

// Grid layout: cards sit in the odd columns/rows, arrows live only in the
// gap tracks between them (even columns/rows) — arrows can never overlap a
// card because they physically occupy a different grid track. Top row runs
// left-to-right, then drops down the right edge and the bottom row runs
// back right-to-left, so the path never has to cross itself.
const GRID_COLS = "minmax(160px,1fr) 40px minmax(160px,1fr) 40px minmax(160px,1fr)";

function ArrowRight({ color }: { color: string }) {
  return (
    <div data-arrow className="flex items-center justify-center opacity-0">
      <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
        <path d="M1 7H21M21 7L15 1M21 7L15 13" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
function ArrowLeft({ color }: { color: string }) {
  return (
    <div data-arrow className="flex items-center justify-center opacity-0">
      <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
        <path d="M23 7H3M3 7L9 1M3 7L9 13" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
function ArrowDown({ color }: { color: string }) {
  return (
    <div data-arrow className="flex items-center justify-center opacity-0">
      <svg width="14" height="28" viewBox="0 0 14 28" fill="none">
        <path d="M7 1V25M7 25L1 19M7 25L13 19" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Card({
  node,
  cardRef,
}: {
  node: (typeof NODES)[number];
  cardRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={cardRef}
      data-node
      className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--void-2)]/95 p-4 opacity-0 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.7)]"
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
}

export function Flow3D() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackCardRef = useRef<HTMLDivElement | null>(null);
  const detectCardRef = useRef<HTMLDivElement | null>(null);
  const [loopPath, setLoopPath] = useState<string | null>(null);

  // Measure real, rendered card positions rather than guessing pixel
  // coordinates — the loop-back path is only ever as correct as the
  // layout actually is, on any screen size.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const track = trackCardRef.current;
    const detect = detectCardRef.current;
    if (!container || !track || !detect) return;

    const measure = () => {
      const c = container.getBoundingClientRect();
      const t = track.getBoundingClientRect();
      const d = detect.getBoundingClientRect();

      const startX = t.left - c.left + 14;
      const startY = t.top - c.top + t.height / 2;
      const endX = d.left - c.left + d.width / 2;
      const endY = d.top - c.top;
      const outX = 34;
      const topY = Math.max(endY - 46, 10);

      setLoopPath(
        `M ${startX},${startY} C ${outX},${startY} ${outX},${topY} ${outX},${topY} C ${outX},${topY} ${endX - 26},${topY} ${endX},${endY - 6}`
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const container = containerRef.current;
    if (!wrap || !container) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const cards = container.querySelectorAll("[data-node]");
      const arrows = container.querySelectorAll("[data-arrow]");

      if (prefersReduced) {
        gsap.set(cards, { opacity: 1, y: 0 });
        gsap.set(arrows, { opacity: 1 });
        return;
      }

      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: wrap, start: "top 75%" },
        }
      );
      gsap.fromTo(
        arrows,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          stagger: 0.14,
          delay: 0.3,
          ease: "power1.out",
          scrollTrigger: { trigger: wrap, start: "top 75%" },
        }
      );

      const loop = container.querySelector<SVGPathElement>("[data-loop]");
      if (loop) {
        const len = loop.getTotalLength();
        gsap.fromTo(
          loop,
          { strokeDasharray: len, strokeDashoffset: len },
          {
            strokeDashoffset: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: wrap, start: "top 55%" },
          }
        );
      }
    }, wrap);

    return () => ctx.revert();
  }, [loopPath]);

  return (
    <div ref={wrapRef} className="mx-auto max-w-4xl overflow-x-auto py-10">
      <div ref={containerRef} className="relative mx-auto w-fit pl-14">
        <div
          className="grid items-center gap-y-11"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          {/* Row 1 */}
          <Card node={NODES[0]} />
          <ArrowRight color="var(--teal)" />
          <Card node={NODES[1]} cardRef={detectCardRef} />
          <ArrowRight color="var(--teal)" />
          <Card node={NODES[2]} />

          {/* connector row (down on the right edge) */}
          <div />
          <div />
          <div />
          <div />
          <div className="flex justify-center">
            <ArrowDown color="var(--amber)" />
          </div>

          {/* Row 2 (reversed reading order, right to left) */}
          <Card node={NODES[5]} cardRef={trackCardRef} />
          <ArrowLeft color="var(--orange)" />
          <Card node={NODES[4]} />
          <ArrowLeft color="var(--amber)" />
          <Card node={NODES[3]} />
        </div>

        {loopPath && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <marker id="loopArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 Z" fill="var(--teal)" />
              </marker>
              <linearGradient id="loopGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--orange)" />
                <stop offset="60%" stopColor="var(--amber)" />
                <stop offset="100%" stopColor="var(--teal)" />
              </linearGradient>
            </defs>
            <path
              d={loopPath}
              data-loop
              fill="none"
              stroke="url(#loopGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              markerEnd="url(#loopArrow)"
            />
            <text
              x="14"
              y={38}
              textAnchor="middle"
              transform="rotate(-90 14 38)"
              className="fill-[var(--bone-dim)]"
              fontFamily="var(--font-plex-mono)"
              fontSize="9"
              letterSpacing="0.05em"
            >
              feeds back in
            </text>
          </svg>
        )}
      </div>
    </div>
  );
}
