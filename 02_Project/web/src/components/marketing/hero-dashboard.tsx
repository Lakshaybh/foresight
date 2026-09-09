"use client";

import { useEffect, useState } from "react";

// A compact, self-animating "product dashboard" visual for the hero's right
// side — not real data, an illustrative preview of what the product shows,
// clearly labeled as such (matches ProductPreview's convention elsewhere).
const POINTS = [22, 26, 24, 30, 28, 35, 33, 42, 47, 44, 52, 60];
const W = 320;
const H = 120;

function pathFor(points: number[]) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const stepX = W / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = i * stepX;
    const y = H - ((v - min) / (max - min)) * (H - 16) - 8;
    return [x, y] as const;
  });
  // Smoothed through a Catmull-Rom-ish quadratic pass so the trend reads as
  // one continuous curve (for the flowing animation) rather than a jagged
  // polyline — a moving light only looks like it's "flowing" on a curve.
  let line = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)} `;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x0, y0] = coords[i];
    const [x1, y1] = coords[i + 1];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    line += `Q ${x0.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)} `;
  }
  const last = coords[coords.length - 1];
  line += `T ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  return { line, area };
}

export function HeroDashboard() {
  const [drawn, setDrawn] = useState(false);
  const { line, area } = pathFor(POINTS);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* ambient glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 20%, var(--accent-wash), transparent), radial-gradient(50% 50% at 80% 80%, var(--teal-wash), transparent)",
        }}
      />

      <div
        data-reveal
        className="rounded-[1.75rem] bg-[var(--bone)]/[0.04] p-1.5 ring-1 ring-[var(--line)] shadow-[0_0_70px_-15px_var(--accent-dim)] animate-[float_6s_ease-in-out_infinite]"
      >
        <div className="rounded-[calc(1.75rem-0.375rem)] bg-[var(--void-2)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-[var(--line)]">
          {/* header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--teal)] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--teal)]" />
              </span>
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--bone-dim)]">
                Live signal
              </span>
            </div>
            <span className="rounded-full bg-[var(--orange)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--orange)]">
              Drifting
            </span>
          </div>

          {/* stat */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-2xl font-semibold text-[var(--bone)]">
                +3.2<span className="text-sm font-normal text-[var(--bone-dim)]"> days</span>
              </p>
              <p className="text-[11px] text-[var(--bone-dim)]">Supplier lead time, 12-week trend</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-semibold text-[var(--accent)]">92%</p>
              <p className="text-[10px] text-[var(--bone-dim)]">confidence</p>
            </div>
          </div>

          {/* animated chart */}
          <div className="mt-4">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full overflow-visible">
              <defs>
                <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
                <filter id="hero-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path d={area} fill="url(#hero-area)" opacity={drawn ? 1 : 0} style={{ transition: "opacity 0.8s ease 0.4s" }} />

              {/* dim static curve — the actual trend */}
              <path d={line} fill="none" stroke="var(--bone)" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" />

              {/* bright light that flows along the same curve, forever */}
              {drawn && (
                <path
                  d={line}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#hero-glow)"
                  pathLength={100}
                  strokeDasharray="18 82"
                  className="hero-flow-line"
                />
              )}
            </svg>
          </div>

          {/* footer row — a status readout, not an actionable control */}
          <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
            <p className="text-[11px] text-[var(--bone-dim)]">Cedar Sourcing Ltd. · SKU-2291</p>
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--bone-dim)]">
              <span className="text-[var(--bone)]">Suggested:</span> Reorder now
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-[var(--bone-dim)]">
        Illustrative preview — not live data.
      </p>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes hero-flow {
          to { stroke-dashoffset: -200; }
        }
        .hero-flow-line {
          animation: hero-flow 3.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
