// Fixed, page-wide background motif for the homepage: a handful of gentle
// "shipping lane" arcs connecting small warehouse/port markers, rendered as
// ultra-thin single-tone linework at very low opacity — texture, not a
// focal illustration. Deliberately NOT a generic nodes-and-edges "network"
// diagram (the default AI/SaaS-marketing cliché) — the motif is literally
// goods moving between locations, which is what this product watches.

type Port = { x: number; y: number };
type Lane = { a: Port; b: Port; via: Port; dur: number; delay: number };

const PORTS: Port[] = [
  { x: 8, y: 22 }, { x: 26, y: 12 }, { x: 20, y: 62 }, { x: 42, y: 40 },
  { x: 58, y: 18 }, { x: 68, y: 58 }, { x: 84, y: 30 }, { x: 92, y: 72 },
  { x: 12, y: 86 }, { x: 50, y: 84 }, { x: 78, y: 90 },
];

const LANES: Lane[] = [
  { a: PORTS[0], b: PORTS[3], via: { x: 22, y: 32 }, dur: 9, delay: 0 },
  { a: PORTS[1], b: PORTS[4], via: { x: 44, y: 8 }, dur: 11, delay: 1.4 },
  { a: PORTS[3], b: PORTS[6], via: { x: 62, y: 34 }, dur: 10, delay: 0.6 },
  { a: PORTS[2], b: PORTS[9], via: { x: 32, y: 70 }, dur: 8.5, delay: 2.1 },
  { a: PORTS[5], b: PORTS[7], via: { x: 78, y: 68 }, dur: 9.5, delay: 0.9 },
  { a: PORTS[4], b: PORTS[6], via: { x: 76, y: 16 }, dur: 12, delay: 1.8 },
  { a: PORTS[8], b: PORTS[9], via: { x: 30, y: 92 }, dur: 10.5, delay: 0.3 },
  { a: PORTS[9], b: PORTS[10], via: { x: 64, y: 92 }, dur: 9, delay: 1.1 },
];

export function AbstractBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--void)]">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="var(--bone)" strokeOpacity="0.08" strokeWidth="0.14">
          {LANES.map((l, i) => (
            <path
              key={i}
              d={`M ${l.a.x} ${l.a.y} Q ${l.via.x} ${l.via.y} ${l.b.x} ${l.b.y}`}
              className="lane-draw"
              style={{ animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s` }}
            />
          ))}
        </g>
        <g stroke="var(--bone)" strokeOpacity="0.14" strokeWidth="0.3" fill="var(--void)">
          {PORTS.map((p, i) => (
            <rect key={i} x={p.x - 0.7} y={p.y - 0.7} width="1.4" height="1.4" className="port-pulse" style={{ animationDelay: `${(i * 0.6) % 4}s` }} />
          ))}
        </g>
      </svg>

      <style>{`
        .lane-draw {
          stroke-dasharray: 6 4;
          animation-name: lane-flow;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .port-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: port-breathe 5s ease-in-out infinite;
        }
        @keyframes lane-flow {
          to { stroke-dashoffset: -20; }
        }
        @keyframes port-breathe {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lane-draw, .port-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
