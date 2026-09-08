// Ambient "constellation network" background — a sparse field of nodes
// connected by thin lines that softly drift and re-fade over time, echoing
// the product's "connected signals" story. Brand palette (pink/purple);
// a few nodes carry the severity accent colors (teal/amber/orange) as a
// quiet nod to what the network is actually watching.
// Pure SVG + CSS: no canvas, no JS animation loop, cheap to render.

type Node = { x: number; y: number; r: number; color: string; dur: number; delay: number };
type Edge = { a: number; b: number; dur: number; delay: number };

const NODES: Node[] = [
  { x: 8, y: 14, r: 2.2, color: "var(--accent-2)", dur: 7, delay: 0 },
  { x: 18, y: 32, r: 1.6, color: "var(--accent)", dur: 8.5, delay: 0.6 },
  { x: 14, y: 55, r: 2.6, color: "var(--accent-2)", dur: 6.5, delay: 1.2 },
  { x: 26, y: 72, r: 1.8, color: "var(--accent)", dur: 9, delay: 0.2 },
  { x: 6, y: 78, r: 1.4, color: "var(--accent-2)", dur: 7.5, delay: 1.8 },
  { x: 34, y: 12, r: 1.6, color: "var(--accent)", dur: 8, delay: 0.9 },
  { x: 40, y: 38, r: 2.4, color: "var(--accent-2)", dur: 6, delay: 0.3 },
  { x: 36, y: 60, r: 1.5, color: "var(--teal)", dur: 9.5, delay: 1.4 },
  { x: 48, y: 82, r: 2, color: "var(--accent)", dur: 7, delay: 0.7 },
  { x: 54, y: 22, r: 1.8, color: "var(--accent-2)", dur: 8, delay: 1.6 },
  { x: 60, y: 46, r: 2.6, color: "var(--accent)", dur: 6.5, delay: 0.1 },
  { x: 58, y: 68, r: 1.6, color: "var(--accent-2)", dur: 9, delay: 1.1 },
  { x: 68, y: 10, r: 1.4, color: "var(--amber)", dur: 7.5, delay: 0.5 },
  { x: 72, y: 30, r: 2.2, color: "var(--accent)", dur: 8.5, delay: 1.9 },
  { x: 76, y: 54, r: 1.8, color: "var(--accent-2)", dur: 6, delay: 0.4 },
  { x: 70, y: 76, r: 2, color: "var(--accent)", dur: 9.5, delay: 1.3 },
  { x: 84, y: 18, r: 1.6, color: "var(--accent-2)", dur: 7, delay: 0.8 },
  { x: 90, y: 40, r: 2.4, color: "var(--accent)", dur: 8, delay: 0.2 },
  { x: 86, y: 64, r: 1.5, color: "var(--orange)", dur: 6.5, delay: 1.5 },
  { x: 92, y: 84, r: 1.8, color: "var(--accent-2)", dur: 9, delay: 0.6 },
  { x: 24, y: 90, r: 1.4, color: "var(--accent)", dur: 7.5, delay: 1.0 },
  { x: 46, y: 6, r: 1.6, color: "var(--accent-2)", dur: 8.5, delay: 1.7 },
  { x: 64, y: 92, r: 1.4, color: "var(--accent)", dur: 6, delay: 0.3 },
  { x: 4, y: 44, r: 1.6, color: "var(--accent-2)", dur: 9, delay: 1.2 },
];

const EDGES: Edge[] = [
  { a: 0, b: 1, dur: 5, delay: 0 },
  { a: 1, b: 2, dur: 6, delay: 1 },
  { a: 2, b: 3, dur: 5.5, delay: 0.4 },
  { a: 3, b: 4, dur: 4.5, delay: 1.6 },
  { a: 1, b: 5, dur: 6.5, delay: 0.8 },
  { a: 5, b: 6, dur: 5, delay: 0.2 },
  { a: 6, b: 7, dur: 5.5, delay: 1.4 },
  { a: 7, b: 8, dur: 6, delay: 0.6 },
  { a: 6, b: 9, dur: 4.5, delay: 1.0 },
  { a: 9, b: 10, dur: 5.5, delay: 0.3 },
  { a: 10, b: 11, dur: 6.5, delay: 1.8 },
  { a: 10, b: 13, dur: 5, delay: 0.5 },
  { a: 13, b: 12, dur: 6, delay: 1.2 },
  { a: 13, b: 14, dur: 4.5, delay: 0.9 },
  { a: 14, b: 15, dur: 5.5, delay: 0.1 },
  { a: 14, b: 17, dur: 6, delay: 1.5 },
  { a: 17, b: 16, dur: 5, delay: 0.7 },
  { a: 17, b: 18, dur: 6.5, delay: 0.3 },
  { a: 18, b: 19, dur: 4.5, delay: 1.3 },
  { a: 3, b: 20, dur: 5.5, delay: 0.9 },
  { a: 9, b: 21, dur: 6, delay: 0.4 },
  { a: 15, b: 22, dur: 5, delay: 1.1 },
  { a: 0, b: 23, dur: 6.5, delay: 0.6 },
  { a: 2, b: 23, dur: 5.5, delay: 1.7 },
];

const GRADIENT_COLORS = ["accent-2", "accent", "teal", "amber", "orange"] as const;

export function AbstractBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--void)]">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          {GRADIENT_COLORS.map((c) => (
            <radialGradient key={c} id={`node-grad-${c}`}>
              <stop offset="0%" stopColor={`var(--${c})`} stopOpacity="0.55" />
              <stop offset="35%" stopColor={`var(--${c})`} stopOpacity="0.28" />
              <stop offset="100%" stopColor={`var(--${c})`} stopOpacity="0" />
            </radialGradient>
          ))}
          <filter id="node-blur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        <g strokeWidth="0.04" fill="none">
          {EDGES.map((e, i) => {
            const a = NODES[e.a];
            const b = NODES[e.b];
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--accent-2)"
                className="const-edge"
                style={{ animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s` }}
              />
            );
          })}
        </g>

        <g filter="url(#node-blur)">
          {NODES.map((n, i) => {
            const colorKey = n.color.match(/--([a-z0-9-]+)/)?.[1] ?? "accent-2";
            return (
              <circle
                key={i}
                cx={n.x}
                cy={n.y}
                r={n.r * 2.6}
                fill={`url(#node-grad-${colorKey})`}
                className={`const-node const-node-${i % 3}`}
                style={{ animationDuration: `${n.dur}s`, animationDelay: `${n.delay}s` }}
              />
            );
          })}
        </g>
      </svg>

      <style>{`
        .const-node {
          opacity: 0.45;
          transform-box: fill-box;
          transform-origin: center;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .const-node-0 { animation-name: node-drift-a; }
        .const-node-1 { animation-name: node-drift-b; }
        .const-node-2 { animation-name: node-drift-c; }
        .const-edge {
          opacity: 0.05;
          animation-name: edge-fade;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes node-drift-a {
          0%, 100% { opacity: 0.35; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.65; transform: scale(1.25) translate(2px, -2.5px); }
        }
        @keyframes node-drift-b {
          0%, 100% { opacity: 0.3; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.6; transform: scale(1.2) translate(-2.5px, 2px); }
        }
        @keyframes node-drift-c {
          0%, 100% { opacity: 0.38; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.68; transform: scale(1.3) translate(1.5px, 2.5px); }
        }
        @keyframes edge-fade {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.16; }
        }
        @media (prefers-reduced-motion: reduce) {
          .const-node, .const-edge { animation: none !important; opacity: 0.35 !important; }
        }
      `}</style>
    </div>
  );
}
