// The hero's one big background illustration: the whole physical story in
// one picture — a warehouse, a delivery truck on the road, and a shop —
// instead of a data-mockup card. Custom line-art, not a stock photo.
export function HeroScene() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1400 620"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[520px] w-full text-[var(--bone)] opacity-[0.1] sm:h-[600px]"
      fill="none"
      preserveAspectRatio="xMidYMax slice"
    >
      {/* road */}
      <path d="M20 520 H1380" stroke="currentColor" strokeWidth="3" />
      <path d="M20 520 H1380" stroke="currentColor" strokeWidth="3" strokeDasharray="14 14" opacity="0.5" />

      {/* warehouse, left */}
      <g>
        <path d="M40 380 L160 300 L280 380" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <rect x="40" y="380" width="240" height="140" stroke="currentColor" strokeWidth="3" />
        <rect x="70" y="420" width="55" height="70" stroke="currentColor" strokeWidth="2.3" />
        <rect x="145" y="420" width="55" height="70" stroke="currentColor" strokeWidth="2.3" />
        <rect x="220" y="430" width="45" height="60" stroke="currentColor" strokeWidth="2.3" />
        {/* pallet of boxes beside it */}
        <rect x="300" y="460" width="42" height="42" stroke="currentColor" strokeWidth="2.3" />
        <rect x="300" y="410" width="42" height="42" stroke="currentColor" strokeWidth="2.3" />
      </g>

      {/* truck, mid-route */}
      <g transform="translate(560,300)">
        <rect x="0" y="130" width="170" height="80" stroke="currentColor" strokeWidth="3" />
        <path d="M170 155 H235 L280 195 V210 H170 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="55" cy="220" r="18" stroke="currentColor" strokeWidth="3" />
        <circle cx="225" cy="220" r="18" stroke="currentColor" strokeWidth="3" />
        <path d="M25 150 H130" stroke="currentColor" strokeWidth="2" />
      </g>

      {/* shop, right */}
      <g>
        <path d="M1080 380 L1100 320 L1340 320 L1360 380" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <rect x="1080" y="380" width="280" height="140" stroke="currentColor" strokeWidth="3" />
        <rect x="1115" y="420" width="80" height="80" stroke="currentColor" strokeWidth="2.3" />
        <rect x="1220" y="440" width="60" height="60" stroke="currentColor" strokeWidth="2.3" />
        <rect x="1300" y="410" width="45" height="90" stroke="currentColor" strokeWidth="2.3" />
        <rect x="1160" y="330" width="140" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
      </g>
    </svg>
  );
}
