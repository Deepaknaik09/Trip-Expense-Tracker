import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const PALETTE = [
  { fill: "#6366f1", light: "#eef2ff" }, // indigo
  { fill: "#10b981", light: "#ecfdf5" }, // emerald
  { fill: "#f59e0b", light: "#fffbeb" }, // amber
  { fill: "#ef4444", light: "#fef2f2" }, // red
  { fill: "#8b5cf6", light: "#f5f3ff" }, // violet
  { fill: "#06b6d4", light: "#ecfeff" }, // cyan
  { fill: "#f97316", light: "#fff7ed" }, // orange
  { fill: "#ec4899", light: "#fdf2f8" }, // pink
  { fill: "#14b8a6", light: "#f0fdfa" }, // teal
  { fill: "#a855f7", light: "#faf5ff" }, // purple
];

function getPieSegments(data) {
  if (!data || data.length === 0) return [];
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let startAngle = -90; // start from top
  return data.map((d, index) => {
    const angle = (d.value / total) * 360;
    const segment = { ...d, startAngle, endAngle: startAngle + angle, ...PALETTE[index % PALETTE.length], percent: (d.value / total) * 100 };
    startAngle += angle;
    return segment;
  });
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const toRad = (deg) => (Math.PI * deg) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
}

export default function PieChartCard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/analytics');
      const result = await response.json();
      if (result.success) {
        setData(result.categoryData);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const handle = () => setTimeout(fetchAnalytics, 500);
    window.addEventListener('expenseAdded', handle);
    window.addEventListener('expenseDeleted', handle);
    return () => {
      window.removeEventListener('expenseAdded', handle);
      window.removeEventListener('expenseDeleted', handle);
    };
  }, []);

  const segments = getPieSegments(data);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-indigo-500" />
        <h2 className="text-sm font-semibold text-slate-700">Spending by Category</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-40 text-rose-500">
          <p className="text-xs mb-2">{error}</p>
          <button onClick={fetchAnalytics} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">Retry</button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
          <p className="text-sm">No expense data yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Donut Chart */}
          <div className="relative flex-shrink-0">
            <svg width={120} height={120} viewBox="0 0 120 120">
              {/* Donut segments */}
              {segments.map((seg, i) => (
                <path
                  key={i}
                  d={arcPath(60, 60, 48, seg.startAngle, seg.endAngle)}
                  fill={seg.fill}
                  opacity={hovered === null || hovered === i ? 1 : 0.35}
                  className="cursor-pointer transition-opacity duration-200"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
              {/* Donut hole */}
              <circle cx="60" cy="60" r="28" fill="white" />
              {/* Center text */}
              <text x="60" y="57" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="700">
                ₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
              </text>
              <text x="60" y="69" textAnchor="middle" fill="#94a3b8" fontSize="7">
                total
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2 min-w-0">
            {segments.slice(0, 5).map((seg, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg cursor-pointer transition-colors ${hovered === i ? 'bg-slate-50' : ''}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.fill }} />
                  <span className="text-xs text-slate-600 truncate">{seg.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 flex-shrink-0">{seg.percent.toFixed(0)}%</span>
              </div>
            ))}
            {segments.length > 5 && (
              <p className="text-xs text-slate-400 pl-2">+{segments.length - 5} more categories</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
