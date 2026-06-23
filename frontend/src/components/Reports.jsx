import React, { useState, useEffect } from "react";
import { FileText, Download, FileDown, Calendar, BarChart2, Receipt, TrendingDown, Trash2 } from "lucide-react";

const CATEGORY_COLORS = {
  "Food & Dining":    { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  "Accommodation":   { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  "Shopping":        { bg: "#fdf2f8", text: "#9d174d", border: "#fbcfe8" },
  "Transportation":  { bg: "#eef2ff", text: "#4338ca", border: "#c7d2fe" },
  "Bills & Utilities":{ bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
  "Healthcare":      { bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
  "Entertainment":   { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" },
  "Travel":          { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
  "Education":       { bg: "#ecfeff", text: "#0e7490", border: "#a5f3fc" },
  "Groceries":       { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Other":           { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
};

const GRADIENT_BAR = [
  "linear-gradient(90deg, #6366f1, #8b5cf6)",
  "linear-gradient(90deg, #10b981, #059669)",
  "linear-gradient(90deg, #f59e0b, #d97706)",
  "linear-gradient(90deg, #ec4899, #db2777)",
  "linear-gradient(90deg, #06b6d4, #0891b2)",
  "linear-gradient(90deg, #8b5cf6, #7c3aed)",
];

export default function Reports() {
  const [month, setMonth] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  useEffect(() => {
    fetchExpenses();
    const handleExpenseChange = () => setTimeout(fetchExpenses, 500);
    window.addEventListener('expenseAdded', handleExpenseChange);
    window.addEventListener('expenseDeleted', handleExpenseChange);
    return () => {
      window.removeEventListener('expenseAdded', handleExpenseChange);
      window.removeEventListener('expenseDeleted', handleExpenseChange);
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/expenses/${id}`, { method: 'DELETE' });
      if (response.ok) {
        window.dispatchEvent(new CustomEvent('expenseDeleted', { detail: { id } }));
      } else {
        alert("Failed to delete expense.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  useEffect(() => {
    if (month) {
      const filtered = expenses.filter(e => {
        const d = new Date(e.date);
        const sel = new Date(month + "-01");
        return d.getFullYear() === sel.getFullYear() && d.getMonth() === sel.getMonth();
      });
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses(expenses);
    }
  }, [month, expenses]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/expenses?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setFilteredExpenses(data.expenses || []);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const totalAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const avgAmount = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;

  const categoryBreakdown = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const downloadCSV = () => {
    if (!filteredExpenses.length) return;
    const headers = ["Date", "Vendor", "Category", "Amount", "Currency"];
    const csvContent = [headers.join(","), ...filteredExpenses.map(e =>
      [e.date, `"${e.vendor || "Unknown"}"`, e.category, e.amount, e.currency || "INR"].join(",")
    )].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_${month || "all"}.csv`;
    link.click();
  };

  const downloadPDF = () => {
    if (!filteredExpenses.length) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>Expense Report</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 32px; color: #1e293b; }
        h1 { color: #4f46e5; font-size: 22px; margin-bottom: 4px; }
        p.sub { color: #64748b; font-size: 13px; margin-bottom: 20px; }
        .stats { display: flex; gap: 16px; margin-bottom: 24px; }
        .stat { background: #f8fafc; border-radius: 12px; padding: 16px 20px; min-width: 120px; }
        .stat label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat p { font-size: 20px; font-weight: 700; color: #1e293b; margin: 4px 0 0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .badge { padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #eef2ff; color: #4f46e5; }
        .amount { color: #059669; font-weight: 600; }
      </style></head><body>
        <h1>TripSpend — Expense Report</h1>
        <p class="sub">Period: ${month ? new Date(month + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" }) : "All Time"}</p>
        <div class="stats">
          <div class="stat"><label>Transactions</label><p>${filteredExpenses.length}</p></div>
          <div class="stat"><label>Total Spent</label><p>₹${totalAmount.toFixed(2)}</p></div>
          <div class="stat"><label>Average</label><p>₹${avgAmount.toFixed(2)}</p></div>
        </div>
        <table>
          <thead><tr><th>Date</th><th>Vendor</th><th>Category</th><th>Amount</th></tr></thead>
          <tbody>
            ${filteredExpenses.map(e => `
              <tr><td>${new Date(e.date).toLocaleDateString("en-IN")}</td>
              <td>${e.vendor || "Unknown"}</td>
              <td><span class="badge">${e.category}</span></td>
              <td class="amount">₹${e.amount.toFixed(2)}</td></tr>
            `).join("")}
          </tbody>
        </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const maxCatAmt = sortedCategories[0]?.[1] || 1;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}
            >
              <BarChart2 size={17} className="text-white" />
            </div>
            Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-11">Analyze and export your expense data</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm rounded-xl outline-none input-glow"
              style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#475569" }}
            />
          </div>
          <button
            onClick={downloadCSV}
            disabled={loading || !filteredExpenses.length}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
          >
            <Download size={13} />
            CSV
          </button>
          <button
            onClick={downloadPDF}
            disabled={loading || !filteredExpenses.length}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}
          >
            <FileDown size={13} />
            PDF
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Transactions", value: filteredExpenses.length, icon: Receipt, grad: "linear-gradient(135deg, #6366f1, #8b5cf6)", glow: "rgba(99,102,241,0.3)" },
          { label: "Total Spent", value: `₹${totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: TrendingDown, grad: "linear-gradient(135deg, #10b981, #059669)", glow: "rgba(16,185,129,0.3)" },
          { label: "Avg per Expense", value: `₹${avgAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: FileText, grad: "linear-gradient(135deg, #f59e0b, #d97706)", glow: "rgba(245,158,11,0.3)" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-4 p-5 rounded-2xl"
              style={{ background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.grad, boxShadow: `0 4px 12px ${s.glow}` }}
              >
                <Icon size={17} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Breakdown */}
      {sortedCategories.length > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{ background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
        >
          <h2 className="text-sm font-semibold text-slate-700 mb-5">Spending by Category</h2>
          <div className="space-y-3">
            {sortedCategories.slice(0, 8).map(([cat, amt], i) => {
              const pct = totalAmount > 0 ? ((amt / totalAmount) * 100).toFixed(1) : 0;
              const barWidth = totalAmount > 0 ? ((amt / maxCatAmt) * 100).toFixed(1) : 0;
              const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS["Other"];
              return (
                <div key={cat} className="flex items-center gap-4">
                  <div className="w-28 flex-shrink-0">
                    <span
                      className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold truncate max-w-full"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                    >
                      {cat}
                    </span>
                  </div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%`, background: GRADIENT_BAR[i % GRADIENT_BAR.length] }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs w-36 justify-end flex-shrink-0">
                    <span className="font-semibold text-slate-700">₹{amt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                    <span className="text-slate-400">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense Ledger */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #f8fafc" }}
        >
          <h2 className="text-sm font-semibold text-slate-700">
            Expense Ledger
            {month && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                — {new Date(month + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" })}
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-400">{filteredExpenses.length} record{filteredExpenses.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={36} className="mx-auto mb-3 opacity-20" style={{ color: "#94a3b8" }} />
            <p className="text-sm text-slate-400">No expenses for this period</p>
            <p className="text-xs text-slate-300 mt-1">Try selecting a different month</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {["Date", "Paid By", "Category", "Amount", ""].map((h, i) => (
                    <th key={i} className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(expense => {
                  const colors = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS["Other"];
                  return (
                    <tr
                      key={expense.id}
                      className="transition-colors group"
                      style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td className="px-6 py-3.5 text-xs" style={{ color: "#94a3b8" }}>
                        {new Date(expense.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-3.5 text-slate-800 font-medium">{expense.paidBy || "Self"}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold"
                          style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                        >
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold" style={{ color: "#059669" }}>
                        ₹{expense.amount.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
