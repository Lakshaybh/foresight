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

const WIDTH = 640;
const CENTER = 320;
const AMP = 150;
const ROW = 116;
const TOP_PAD = 60;

function nodePoint(i: number) {
  return { x: CENTER + (i % 2 === 0 ? -AMP : AMP), y: TOP_PAD + i * ROW };
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

// The loop-back: outcome tracking (last node) feeds back into detection
// (node 1) — true to how the product actually works, and gives the end of
// the flow somewhere to go instead of just stopping.
function buildLoopBackPath(): string {
  const last = nodePoint(NODES.length - 1);
  const detect = nodePoint(1);
  const outX = CENTER - AMP - 90;
  const midY = (last.y + detect.y) / 2;
  return `M ${last.x - 30},${last.y + 6} C ${outX},${last.y + 30} ${outX},${midY} ${outX},${midY} S ${outX},${detect.y - 10} ${detect.x - 34},${detect.y - 4}`;
}

export function Flow3D() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);

  const spineD = useMemo(buildSpinePath, []);
  const loopD = useMemo(buildLoopBackPath, []);
  const height = TOP_PAD * 2 + (NODES.length - 1) * ROW;

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

    if (prefersReduced) return () => ctx.revert();

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(group, {
        rotateX: 8 - py * 10,
        rotateY: -18 + px * 14,
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
      className="relative mx-auto max-w-4xl overflow-x-auto py-10"
      style={{ perspective: "1600px" }}
    >
      <div
        ref={groupRef}
        className="relative mx-auto"
        style={{ transformStyle: "preserve-3d", width: `${WIDTH}px`, height: `${height}px` }}
      >
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          style={{ transform: "translateZ(-10px)" }}
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
            stroke="var(--orange)"
            strokeWidth="1.75"
            strokeDasharray="1 6"
            strokeLinecap="round"
            opacity={0.85}
            markerEnd="url(#loopArrow)"
          />
          <text
            x={CENTER - AMP - 90}
            y={(nodePoint(NODES.length - 1).y + nodePoint(1).y) / 2}
            textAnchor="middle"
            className="fill-[var(--orange)]"
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
            animation: "flow-pulse 5s linear infinite",
          }}
        />

        {NODES.map((node, i) => {
          const p = nodePoint(i);
          const depth = i * 26;
          return (
            <div
              key={node.n}
              data-node
              className="absolute flex w-[260px] -translate-x-1/2 -translate-y-1/2 items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--void-2)]/90 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur"
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
