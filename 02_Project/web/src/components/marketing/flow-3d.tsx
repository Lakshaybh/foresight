"use client";

import { useEffect, useMemo, useRef } from "react";
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

const WIDTH = 760;
const CENTER = 380;
const AMP = 230;
const ROW = 150;
const TOP_PAD = 70;

// A real 2x3 rectangle instead of a zigzag: top row runs left-to-right
// (Connect, Detect, Forecast), then drops down and runs back right-to-left
// on the bottom row (Decide, You approve, Track outcome) — a clean
// boustrophedon traversal so the connecting line never has to cross itself.
const COL_X = [CENTER - AMP, CENTER, CENTER + AMP];
const ROW_Y = [TOP_PAD, TOP_PAD + ROW];
const ROWS: number[][] = [[0, 1, 2], [3, 4, 5]];

const NODE_POSITIONS: Record<number, { x: number; y: number }> = {
  0: { x: COL_X[0], y: ROW_Y[0] },
  1: { x: COL_X[1], y: ROW_Y[0] },
  2: { x: COL_X[2], y: ROW_Y[0] },
  3: { x: COL_X[2], y: ROW_Y[1] },
  4: { x: COL_X[1], y: ROW_Y[1] },
  5: { x: COL_X[0], y: ROW_Y[1] },
};

function nodePoint(i: number) {
  return NODE_POSITIONS[i];
}

function nodeDepth(i: number) {
  const rowIndex = ROWS.findIndex((row) => row.includes(i));
  return rowIndex * 60;
}

// Smooth S-curve through every node center — a curved snake, not a
// straight dashed line, so the pipeline reads as one continuous motion
// rather than a checklist.
function buildSpinePath(): string {
  const pts = NODES.map((_, i) => nodePoint(i));
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const midY = (prev.y + cur.y) / 2;
    d += ` C ${prev.x},${midY} ${cur.x},${midY} ${cur.x},${cur.y}`;
  }
  return d;
}

// The loop-back: outcome tracking (the last node, bottom-left) feeds back
// into detection (node 2, top-center) — true to how the product actually
// works. Routed up the LEFT side, since the main flow already uses the
// right side to drop from the top row to the bottom row — keeps the two
// paths from crossing.
function buildLoopBackPath(): string {
  const last = nodePoint(NODES.length - 1);
  const detect = nodePoint(1);
  const outX = COL_X[0] - 90;
  const topY = TOP_PAD - 40;
  return `M ${last.x - 15},${last.y - 15} C ${outX},${last.y} ${outX},${topY} ${outX},${topY} C ${outX},${topY} ${detect.x - 40},${topY} ${detect.x - 20},${detect.y - 30}`;
}

export function Flow3D() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);

  const spineD = useMemo(buildSpinePath, []);
  const loopD = useMemo(buildLoopBackPath, []);
  const height = TOP_PAD * 2 + (ROWS.length - 1) * ROW;

  useEffect(() => {
    const wrap = wrapRef.current;
    const group = groupRef.current;
    if (!wrap || !group) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (!prefersReduced) {
        gsap.fromTo(
          group,
          { rotateY: -18, rotateX: 10, opacity: 0 },
          {
            rotateY: 0,
            rotateX: 0,
            opacity: 1,
            duration: 1.4,
            ease: "power3.out",
            scrollTrigger: { trigger: wrap, start: "top 80%" },
          }
        );
      } else {
        gsap.set(group, { rotateY: 0, rotateX: 0, opacity: 1 });
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

      const spine = group.querySelector<SVGPathElement>("[data-spine]");
      if (spine) {
        const len = spine.getTotalLength();
        gsap.fromTo(
          spine,
          { strokeDasharray: len, strokeDashoffset: len },
          {
            strokeDashoffset: 0,
            duration: 1.6,
            ease: "power2.inOut",
            scrollTrigger: { trigger: wrap, start: "top 70%" },
          }
        );
      }

      const loop = group.querySelector<SVGPathElement>("[data-loop]");
      if (loop) {
        const len = loop.getTotalLength();
        gsap.fromTo(
          loop,
          { strokeDasharray: len, strokeDashoffset: len },
          {
            strokeDashoffset: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: wrap, start: "top 40%" },
          }
        );
      }
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto flex max-w-4xl justify-center overflow-x-auto py-10"
      style={{ perspective: "1600px" }}
    >
      <div
        ref={groupRef}
        className="relative shrink-0"
        style={{ transformStyle: "preserve-3d", width: `${WIDTH}px`, height: `${height}px` }}
      >
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          style={{ transform: "translateZ(150px)" }}
          viewBox={`0 0 ${WIDTH} ${height}`}
        >
          <defs>
            <linearGradient id="spineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--teal)" />
              <stop offset="50%" stopColor="var(--amber)" />
              <stop offset="100%" stopColor="var(--orange)" />
            </linearGradient>
            <marker id="loopArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="var(--orange)" />
            </marker>
          </defs>

          <path d={spineD} data-spine fill="none" stroke="url(#spineGradient)" strokeWidth="2.5" strokeLinecap="round" />

          <path
            d={loopD}
            data-loop
            fill="none"
            stroke="url(#spineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.9}
            markerEnd="url(#loopArrow)"
          />
          <text
            x={COL_X[0] - 90}
            y={TOP_PAD - 40}
            textAnchor="middle"
            className="fill-[var(--bone-dim)]"
            fontFamily="var(--font-plex-mono)"
            fontSize="10"
            letterSpacing="0.05em"
          >
            feeds back in
          </text>
        </svg>

        {/* traveling signal pulse along the spine */}
        <div
          className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-[var(--teal)] shadow-[0_0_14px_3px_var(--teal)]"
          style={{
            offsetPath: `path("${spineD}")`,
            offsetRotate: "0deg",
            transform: "translateZ(150px)",
            animation: "flow-pulse 5s linear infinite",
          }}
        />

        {NODES.map((node, i) => {
          const p = nodePoint(i);
          const depth = nodeDepth(i);
          return (
            <div
              key={node.n}
              data-node
              className="absolute flex w-[200px] -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--void-2)]/90 p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                transform: `translate(-50%, -50%) translateZ(${depth}px)`,
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

      <style>{`
        @keyframes flow-pulse {
          0% { offset-distance: 0%; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
