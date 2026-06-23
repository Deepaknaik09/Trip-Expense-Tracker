import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";

export default function LineChartCard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/analytics');
      const result = await response.json();
      if (result.success) {
        setData(result.monthlyData);
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

  const W = 200, H = 90, PAD = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const max = data.length > 0 ? Math.max(...data.map(d => d.amount), 1) : 1;

  const pts = data.map((d, i) => ({
    x: PAD.left + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2),
    y: PAD.top + chartH - (d.amount / max) * chartH,
    ...d,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");

  // Smooth path using bezier curves
  const smoothPath = pts.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C${cpX},${prev.y} ${cpX},${pt.y} ${pt.x},${pt.y}`;
  }, "");

  const fillPath = pts.length > 0
    ? `${smoothPath} L${pts[pts.length - 1].x},${H - PAD.bottom} L${pts[0].x},${H - PAD.bottom} Z`
    : "";

  return (
    <motion.div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={16} className="text-indigo-500" />
        <h2 className="text-sm font-semibold text-slate-700">Monthly Trend</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-24 text-rose-500">
          <p className="text-xs mb-2">{error}</p>
          <button onClick={fetchAnalytics} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">Retry</button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-slate-400 text-sm">No data yet</div>
      ) : (
        <>
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            className="overflow-visible"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
              const y = PAD.top + t * chartH;
              return (
                <line key={i} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                  stroke="#f1f5f9" strokeWidth="1" />
              );
            })}

            {/* Fill area */}
            {fillPath && <path d={fillPath} fill="url(#lineGrad)" />}

            {/* Smooth line */}
            {smoothPath && (
              <path d={smoothPath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Data points */}
            {pts.map((pt, i) => (
              <g key={i} onMouseEnter={() => setHoveredIdx(i)}>
                <circle cx={pt.x} cy={pt.y} r={hoveredIdx === i ? 5 : 3.5}
                  fill={hoveredIdx === i ? "#6366f1" : "white"}
                  stroke="#6366f1" strokeWidth="2"
                  className="cursor-pointer transition-all duration-150"
                />
                {/* Tooltip */}
                {hoveredIdx === i && (
                  <g>
                    <rect x={pt.x - 28} y={pt.y - 30} width="56" height="20" rx="5"
                      fill="#1e293b" />
                    <text x={pt.x} y={pt.y - 16} textAnchor="middle" fill="white" fontSize="8" fontWeight="600">
                      ₹{pt.amount >= 1000 ? `${(pt.amount / 1000).toFixed(1)}k` : pt.amount.toFixed(0)}
                    </text>
                  </g>
                )}
              </g>
            ))}

            {/* X-axis labels */}
            {pts.map((pt, i) => (
              <text key={i} x={pt.x} y={H - PAD.bottom + 14} textAnchor="middle" fill="#94a3b8" fontSize="7">
                {pt.month?.slice(0, 3)}
              </text>
            ))}
          </svg>
        </>
      )}
    </motion.div>
  );
}
