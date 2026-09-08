// Icon-only animated sequence for the login page: the same 3-node chain
// draws in twice per loop — once in the "before" (orange) state, once in
// the "with Foresight" (accent/teal) state — with no text, just glyphs.
// Pure CSS keyframes sharing one 10s cycle so every element stays in sync.

function Truck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M2 6.5h11v9H2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13 10h4l3 3v2.5h-7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="6" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16.5" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function Warning() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M12 4L22 20H2L12 4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 10.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </svg>
  );
}

function BoxX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M3 7l9-4 9 4-9 4-9-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M3 7v10l9 4 9-4V7" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.5 13l5 4.5M14.5 13l-5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Radar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3" opacity="0.4" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

function ShieldCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8.5 12l2.5 2.5L15.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Line({ anim }: { anim: string }) {
  return (
    <span
      className="h-px flex-1 origin-left"
      style={{ background: "currentColor", animation: `${anim} 10s infinite ease` }}
    />
  );
}

function Node({ anim, color, children }: { anim: string; color: string; children: React.ReactNode }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        animation: `${anim} 10s infinite ease-out`,
      }}
    >
      {children}
    </span>
  );
}

export function LoginInfographic() {
  return (
    <div className="relative mx-auto mt-5 h-9 w-full max-w-xs">
      {/* Before: truck -> warning -> stockout (orange) */}
      <div
        className="absolute inset-0 flex items-center gap-1.5 text-[var(--bone-dim)]"
        style={{ animation: "scene-before 10s infinite ease-in-out" }}
      >
        <Node anim="pop-b1" color="var(--bone-dim)"><Truck /></Node>
        <Line anim="line-b1" />
        <Node anim="pop-b2" color="var(--orange)"><Warning /></Node>
        <Line anim="line-b2" />
        <Node anim="pop-b3" color="var(--orange)"><BoxX /></Node>
      </div>

      {/* After: truck -> detected -> resolved (accent / teal) */}
      <div
        className="absolute inset-0 flex items-center gap-1.5"
        style={{ animation: "scene-after 10s infinite ease-in-out" }}
      >
        <Node anim="pop-a1" color="var(--bone-dim)"><Truck /></Node>
        <Line anim="line-a1" />
        <Node anim="pop-a2" color="var(--accent)"><Radar /></Node>
        <Line anim="line-a2" />
        <Node anim="pop-a3" color="var(--teal)"><ShieldCheck /></Node>
      </div>

      <style>{`
        @keyframes scene-before {
          0%, 100% { opacity: 0; }
          3% { opacity: 1; }
          42% { opacity: 1; }
          47% { opacity: 0; }
        }
        @keyframes scene-after {
          0%, 50%, 100% { opacity: 0; }
          55% { opacity: 1; }
          92% { opacity: 1; }
          97% { opacity: 0; }
        }
        @keyframes pop-b1 { 0%, 3% { opacity: 0; transform: scale(.6); } 6%, 45% { opacity: 1; transform: scale(1); } 47%, 100% { opacity: 0; transform: scale(.6); } }
        @keyframes pop-b2 { 0%, 10% { opacity: 0; transform: scale(.6); } 13%, 45% { opacity: 1; transform: scale(1); } 47%, 100% { opacity: 0; transform: scale(.6); } }
        @keyframes pop-b3 { 0%, 20% { opacity: 0; transform: scale(.6); } 23%, 45% { opacity: 1; transform: scale(1); } 47%, 100% { opacity: 0; transform: scale(.6); } }
        @keyframes line-b1 { 0%, 5% { transform: scaleX(0); } 10%, 45% { transform: scaleX(1); } 47%, 100% { transform: scaleX(0); } }
        @keyframes line-b2 { 0%, 15% { transform: scaleX(0); } 20%, 45% { transform: scaleX(1); } 47%, 100% { transform: scaleX(0); } }

        @keyframes pop-a1 { 0%, 53% { opacity: 0; transform: scale(.6); } 56%, 92% { opacity: 1; transform: scale(1); } 95%, 100% { opacity: 0; transform: scale(.6); } }
        @keyframes pop-a2 { 0%, 60% { opacity: 0; transform: scale(.6); } 63%, 92% { opacity: 1; transform: scale(1); } 95%, 100% { opacity: 0; transform: scale(.6); } }
        @keyframes pop-a3 { 0%, 70% { opacity: 0; transform: scale(.6); } 73%, 92% { opacity: 1; transform: scale(1); } 95%, 100% { opacity: 0; transform: scale(.6); } }
        @keyframes line-a1 { 0%, 55% { transform: scaleX(0); } 60%, 92% { transform: scaleX(1); } 95%, 100% { transform: scaleX(0); } }
        @keyframes line-a2 { 0%, 65% { transform: scaleX(0); } 70%, 92% { transform: scaleX(1); } 95%, 100% { transform: scaleX(0); } }

        @media (prefers-reduced-motion: reduce) {
          .relative[style] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
