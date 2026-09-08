"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function IconDocument() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M5 2h7l3 3v13H5V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 9h4M8 12h4M8 15h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M2.5 6.5 10 2.5l7.5 4v7L10 17.5l-7.5-4v-7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2.5 6.5 10 10.5l7.5-4M10 10.5V17.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M2 5h9v8H2V5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M11 8h4l2.5 2.5V13H11V8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="5.5" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="14" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

const SOURCES = [
  { label: "Order history", Icon: IconDocument },
  { label: "Inventory levels", Icon: IconBox },
  { label: "Supplier records", Icon: IconTruck },
  { label: "Your spreadsheet", Icon: IconGrid },
];
const OUTPUTS = [
  { label: "Reorder now", color: "var(--teal)" },
  { label: "Escalate supplier", color: "var(--amber)" },
  { label: "Track outcome", color: "var(--orange)" },
];
// One y-center per card, as a % of its column's height — used so each
// converging line ends exactly at its own card, not a shared curve.
const SOURCE_Y = [13, 38, 63, 88];
const OUTPUT_Y = [17, 50, 83];

const DOT_COLOR: Record<string, string> = {
  teal: "var(--teal)",
  amber: "var(--amber)",
  orange: "var(--orange)",
};

const SIGNAL_DOTS = [
  { x: 6, y: 8, c: "teal" }, { x: 22, y: 4, c: "amber" }, { x: 40, y: 10, c: "teal" },
  { x: 58, y: 5, c: "teal" }, { x: 76, y: 12, c: "orange" }, { x: 92, y: 6, c: "teal" },
  { x: 14, y: 22, c: "teal" }, { x: 32, y: 26, c: "teal" }, { x: 50, y: 20, c: "amber" },
  { x: 68, y: 24, c: "teal" }, { x: 86, y: 20, c: "teal" }, { x: 4, y: 38, c: "orange" },
  { x: 24, y: 42, c: "teal" }, { x: 44, y: 36, c: "teal" }, { x: 62, y: 40, c: "amber" },
  { x: 80, y: 36, c: "teal" }, { x: 96, y: 42, c: "teal" }, { x: 10, y: 56, c: "teal" },
  { x: 30, y: 58, c: "amber" }, { x: 48, y: 54, c: "teal" }, { x: 66, y: 58, c: "teal" },
  { x: 84, y: 54, c: "orange" }, { x: 18, y: 70, c: "teal" }, { x: 36, y: 74, c: "teal" },
  { x: 54, y: 70, c: "amber" }, { x: 72, y: 74, c: "teal" }, { x: 90, y: 70, c: "teal" },
  { x: 8, y: 86, c: "amber" }, { x: 28, y: 90, c: "teal" }, { x: 46, y: 86, c: "orange" },
  { x: 64, y: 90, c: "teal" }, { x: 82, y: 86, c: "teal" }, { x: 96, y: 92, c: "teal" },
];

const MESH_NODES = [
  { x: 6, y: 14, c: "teal", r: 1.3 }, { x: 26, y: 8, c: "teal", r: 1.3 }, { x: 47, y: 16, c: "amber", r: 1.6 },
  { x: 68, y: 9, c: "teal", r: 1.3 }, { x: 90, y: 18, c: "amber", r: 1.3 }, { x: 15, y: 30, c: "teal", r: 1.3 },
  { x: 36, y: 33, c: "amber", r: 1.8 }, { x: 57, y: 28, c: "teal", r: 1.3 }, { x: 78, y: 34, c: "orange", r: 1.6 },
  { x: 4, y: 48, c: "amber", r: 1.3 }, { x: 25, y: 50, c: "teal", r: 1.3 }, { x: 46, y: 46, c: "orange", r: 2 },
  { x: 66, y: 50, c: "amber", r: 1.6 }, { x: 88, y: 54, c: "orange", r: 1.3 }, { x: 13, y: 66, c: "teal", r: 1.3 },
  { x: 34, y: 69, c: "orange", r: 1.6 }, { x: 55, y: 64, c: "teal", r: 1.3 }, { x: 76, y: 70, c: "orange", r: 1.3 },
  { x: 22, y: 86, c: "teal", r: 1.3 }, { x: 44, y: 89, c: "orange", r: 1.6 }, { x: 65, y: 84, c: "orange", r: 1.3 },
  { x: 85, y: 88, c: "orange", r: 1.3 },
];
const MESH_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 7], [3, 8],
  [5, 6], [6, 7], [7, 8], [5, 9], [6, 10], [7, 11], [8, 12], [8, 13],
  [9, 10], [10, 11], [11, 12], [12, 13], [9, 14], [10, 15], [11, 16],
  [12, 17], [14, 15], [15, 16], [16, 17], [14, 18], [15, 19], [16, 19],
  [17, 20], [18, 19], [19, 20], [2, 6], [6, 11], [11, 16], [16, 19],
];

function SourceCard({ label, Icon }: { label: string; Icon: () => React.ReactElement }) {
  return (
    <div
      data-reveal
      className="flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--void-2)]/90 py-2 pl-2 pr-4"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
        <Icon />
      </span>
      <span className="text-xs font-medium text-[var(--bone)]">{label}</span>
    </div>
  );
}
function OutputCard({ label, color }: { label: string; color: string }) {
  return (
    <div
      data-reveal
      className="flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--void-2)]/90 py-2 pl-2 pr-4"
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
      <span className="text-xs font-medium text-[var(--bone)]">{label}</span>
    </div>
  );
}

// One glowing thread per card, all converging to a single point (the
// pill's edge) — not a shared generic curve. `ys` are each card's own
// vertical center as a % of the column height. Input side is a clean,
// uniform grey (undifferentiated raw data); output side uses each card's
// own severity color, since by then the data has been resolved into
// specific, differently-important things.
function ConvergeLines({ ys, flip = false, colors }: { ys: number[]; flip?: boolean; colors: string[] }) {
  const side = flip ? "r" : "l";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
      <defs>
        <filter id={`glow-${side}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {ys.map((y, i) => {
        const d = flip ? `M 0,50 C 45,50 55,${y} 100,${y}` : `M 0,${y} C 45,${y} 55,50 100,50`;
        return (
          <path
            key={i}
            data-converge-line
            d={d}
            fill="none"
            stroke={colors[i]}
            strokeWidth="0.6"
            strokeDasharray="3 2.5"
            opacity={0}
            filter={`url(#glow-${side})`}
            style={{ animation: `flow-dash 1.4s linear infinite${flip ? " reverse" : ""}` }}
          />
        );
      })}
    </svg>
  );
}

export function DataConverge() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const reveal = wrap.querySelectorAll("[data-reveal]");
      const dots = wrap.querySelectorAll("[data-signal-dot]");
      const meshEls = wrap.querySelectorAll("[data-mesh]");
      const lines = wrap.querySelectorAll("[data-converge-line]");

      if (prefersReduced) {
        gsap.set([reveal, dots, meshEls], { opacity: 1 });
        gsap.set(lines, { opacity: 0.85 });
        return;
      }

      gsap.fromTo(reveal, { opacity: 0, y: 16 }, {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: "power2.out",
        scrollTrigger: { trigger: wrap, start: "top 75%" },
      });
      gsap.fromTo(dots, { opacity: 0, scale: 0 }, {
        opacity: 0.9, scale: 1, duration: 0.5, stagger: 0.015, ease: "back.out(2)",
        scrollTrigger: { trigger: wrap, start: "top 70%" },
      });
      gsap.fromTo(meshEls, { opacity: 0 }, {
        opacity: 1, duration: 0.6, stagger: 0.02, ease: "power1.out",
        scrollTrigger: { trigger: wrap, start: "top 65%" },
      });
      gsap.fromTo(lines, { opacity: 0 }, {
        opacity: 0.85, duration: 0.9, stagger: 0.1, ease: "power1.out",
        scrollTrigger: { trigger: wrap, start: "top 70%" },
      });
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className="relative flex justify-center overflow-x-auto px-2 py-6">
      {/* soft background blooms, matching the reference's depth cue */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(35% 60% at 15% 40%, color-mix(in oklch, var(--accent-2), transparent 88%), transparent), radial-gradient(35% 60% at 85% 60%, color-mix(in oklch, var(--accent), transparent 90%), transparent)",
        }}
      />

      <div className="flex items-center gap-3">
        {/* Sources */}
        <div className="flex w-[175px] shrink-0 flex-col gap-2.5">
          <p data-reveal className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">
            Your data
          </p>
          {SOURCES.map((s) => (
            <SourceCard key={s.label} {...s} />
          ))}
        </div>

        <div className="h-[220px] w-14 shrink-0">
          <ConvergeLines
            ys={SOURCE_Y}
            colors={["var(--bone-dim)", "var(--bone-dim)", "var(--bone-dim)", "var(--bone-dim)"]}
          />
        </div>

        {/* Signals + mesh share one box so the pill sits at their true midpoint */}
        <div className="relative flex h-[300px] w-[520px] shrink-0 items-center justify-center">
          <p className="absolute -top-6 left-0 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">
            Raw signals
          </p>
          <p className="absolute -top-6 right-0 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">
            Resolved
          </p>

          <div className="absolute left-0 top-0 h-full w-[260px]">
            {SIGNAL_DOTS.map((d, i) => {
              const size = 3 + (i % 3) * 1.5; // varied sizes, not a uniform grid
              const duration = 2.8 + (i % 4) * 0.6;
              const delay = (i * 0.37) % 3;
              return (
                <span
                  key={i}
                  data-signal-dot
                  className="absolute rounded-full opacity-0"
                  style={{
                    left: `${d.x}%`, top: `${d.y}%`,
                    width: `${size}px`, height: `${size}px`,
                    backgroundColor: DOT_COLOR[d.c],
                    boxShadow: `0 0 ${4 + size}px ${DOT_COLOR[d.c]}`,
                    animation: `signal-flicker ${duration}s ease-in-out ${delay}s infinite`,
                  }}
                />
              );
            })}
          </div>

          <div className="absolute right-0 top-0 h-full w-[260px]">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
              {MESH_EDGES.map(([a, b], i) => {
                const na = MESH_NODES[a];
                const nb = MESH_NODES[b];
                return (
                  <line key={i} data-mesh x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                    stroke={DOT_COLOR[na.c]} strokeWidth="0.35" opacity={0} />
                );
              })}
              {MESH_NODES.map((n, i) => (
                <circle key={i} data-mesh cx={n.x} cy={n.y} r={n.r} fill={DOT_COLOR[n.c]} opacity={0} />
              ))}
            </svg>
          </div>

          <div
            data-reveal
            className="relative z-10 w-[240px] rounded-2xl border border-[var(--accent)]/30 bg-[var(--void-2)] px-6 py-6 text-center shadow-[0_0_70px_-8px_var(--accent-dim)]"
          >
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]">
              <span className="h-3 w-3 rounded-full bg-[var(--void)]" />
            </div>
            <p className="mt-3 text-lg font-semibold text-[var(--bone)]">Foresight</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--bone-dim)]">
              Decision engine
            </p>
          </div>
        </div>

        <div className="h-[180px] w-14 shrink-0">
          <ConvergeLines
            ys={OUTPUT_Y}
            flip
            colors={OUTPUTS.map((o) => o.color)}
          />
        </div>

        {/* Outputs */}
        <div className="flex w-[175px] shrink-0 flex-col gap-2.5">
          <p data-reveal className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">
            Your dashboard
          </p>
          {OUTPUTS.map((o) => (
            <OutputCard key={o.label} {...o} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes flow-dash {
          to { stroke-dashoffset: -5.5; }
        }
        @keyframes signal-flicker {
          0%, 100% { opacity: 0.35; transform: scale(0.85) translateY(0); }
          50% { opacity: 1; transform: scale(1.15) translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
