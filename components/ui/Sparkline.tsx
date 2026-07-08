// Dependency-free SVG sparkline (smoothed area chart).
// Inherits its color from `currentColor`, so wrap it in a text-* class.

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}

/** Build a smoothed path through the points using quadratic midpoint curves. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    d += ` Q ${prev.x} ${prev.y}, ${midX} ${(prev.y + curr.y) / 2}`;
    d += ` T ${curr.x} ${curr.y}`;
  }
  return d;
}

export default function Sparkline({
  data,
  width = 96,
  height = 28,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const pad = strokeWidth;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((value, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (value - min) / range) * (height - pad * 2),
  }));

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const gradientId = `spark-${data.join('-').slice(0, 24)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" className="spark-area" />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="spark-line"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={strokeWidth + 0.5}
        fill="currentColor"
        className="spark-dot"
      />
    </svg>
  );
}
