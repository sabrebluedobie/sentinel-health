function TinyLineChart({ data, xKey, yKey, width = 640, height = 160, yMax }) {
  const pad = 24;
  if (!data?.length) return <div className="text-sm text-gray-500">No data yet.</div>;

  const xs = data.map(d => new Date(d[xKey]).getTime());
  const ys = data.map(d => Number(d[yKey]) || 0);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = 0, maxY = yMax ?? Math.max(10, Math.ceil(Math.max(...ys) * 1.2));

  const pts = xs.map((xv, i) => {
    const px = pad + ((xv - minX) / (maxX - minX || 1)) * (width - 2 * pad);
    const py = height - pad - ((ys[i] - minY) / (maxY - minY || 1)) * (height - 2 * pad);
    return `${px},${py}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} />
    </svg>
  );
}
