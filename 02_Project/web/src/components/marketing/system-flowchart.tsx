"use client";

import { useEffect, useState } from "react";

// Icon-forward flowchart: four nodes, minimal text, connecting lines that
// light up and a small pulse traveling node to node as the active stage
// advances. Less reading, more motion.

function IconDetect() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.2 15.2 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconExplain() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M4 5h16M4 11h16M4 17h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconRecommend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function IconTrack() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M4 18 9 11 14 15 20 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 6H20v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STAGES = [
  { label: "Detect", Icon: IconDetect },
  { label: "Explain", Icon: IconExplain },
  { label: "Recommend", Icon: IconRecommend },
  { label: "Track", Icon: IconTrack },
];

export function SystemFlowchart() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 1900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex items-start">
        {STAGES.map((s, i) => {
          const isActive = i === active;
          const isDone = i < active;
          const lineLit = i < active;
          return (
            <div key={s.label} className="flex flex-1 items-center last:flex-initial">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {isActive && (
                    <span
                      className="absolute inset-0 animate-ping rounded-full"
                      style={{ backgroundColor: "var(--accent)", opacity: 0.35 }}
                    />
                  )}
                  <span
                    className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-500"
                    style={{
                      borderColor: isActive || isDone ? "var(--accent)" : "var(--line)",
                      backgroundColor: isActive ? "var(--accent)" : "var(--void-2)",
                      color: isActive ? "var(--void)" : isDone ? "var(--accent)" : "var(--bone-dim)",
                      transform: isActive ? "scale(1.08)" : "scale(1)",
                    }}
                  >
                    <s.Icon />
                  </span>
                </div>
                <p
                  className="text-xs font-semibold transition-colors duration-500"
                  style={{ color: isActive ? "var(--accent)" : "var(--bone-dim)" }}
                >
                  {s.label}
                </p>
              </div>

              {i < STAGES.length - 1 && (
                <div className="relative mx-1 -mt-6 h-px flex-1 overflow-hidden">
                  <div
                    className="absolute inset-0 transition-colors duration-500"
                    style={{ backgroundColor: lineLit ? "var(--accent)" : "var(--line)" }}
                  />
                  {i === active - 1 && (
                    <span
                      className="flow-pulse absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .flow-pulse {
          animation: flow-pulse 0.6s ease-out;
        }
        @keyframes flow-pulse {
          from { left: 0%; opacity: 1; }
          to { left: 100%; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
