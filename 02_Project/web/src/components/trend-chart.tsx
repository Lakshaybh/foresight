// Minimal SVG line chart — no charting library, just a polyline over a
// fixed viewBox. Built for the small number of points this product
// actually has (days/weeks of uploaded snapshots), not for large datasets.

export function TrendChart({
  points,
  color = "var(--accent)",
  unit = "",
}: {
  points: { label: string; value: number }[];
  color?: string;
  unit?: string;
}) {
  if (points.length < 2) {
    return (
      <p className="py-6 text-center text-xs text-[var(--bone-dim)]">
        Need at least two data points over time to show a trend — upload another snapshot on a later date.
      </p>
    );
  }

  const width = 600;
  const height = 160;
  const padding = 28;
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
    return { x, y, ...p };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--line)" strokeWidth="1" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3" fill={color} />
      ))}
      {coords.map((c, i) =>
        i === 0 || i === coords.length - 1 ? (
          <text key={`label-${i}`} x={c.x} y={height - 8} fontSize="10" fill="var(--bone-dim)" textAnchor={i === 0 ? "start" : "end"}>
            {c.label}
          </text>
        ) : null
      )}
      <text x={padding} y={16} fontSize="10" fill="var(--bone-dim)">
        {max.toFixed(1)}{unit}
      </text>
      <text x={padding} y={height - padding - 4} fontSize="10" fill="var(--bone-dim)">
        {min.toFixed(1)}{unit}
      </text>
    </svg>
  );
}
