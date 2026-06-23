import React, { useState, useEffect } from "react";
import { FileText, Download, FileDown, Calendar, BarChart2, Receipt } from "lucide-react";

const CATEGORY_COLORS = {
  "Food & Dining": "bg-amber-100 text-amber-800",
  "Accommodation": "bg-blue-100 text-blue-800",
  "Shopping": "bg-pink-100 text-pink-800",
  "Transportation": "bg-indigo-100 text-indigo-800",
  "Bills & Utilities": "bg-violet-100 text-violet-800",
  "Healthcare": "bg-rose-100 text-rose-800",
  "Entertainment": "bg-teal-100 text-teal-800",
  "Travel": "bg-sky-100 text-sky-800",
  "Education": "bg-cyan-100 text-cyan-800",
  "Groceries": "bg-green-100 text-green-800",
  "Other": "bg-slate-100 text-slate-700",
};

export default function Reports() {
  const [month, setMonth] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  useEffect(() => { fetchExpenses(); }, []);

  useEffect(() => {
    if (month) {
      const filtered = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const selectedMonth = new Date(month + "-01");
        return expenseDate.getFullYear() === selectedMonth.getFullYear() &&
               expenseDate.getMonth() === selectedMonth.getMonth();
      });
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses(expenses);
    }
  }, [month, expenses]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/expenses");
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
        setFilteredExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgAmount = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;
  
  // Category breakdown
  const categoryBreakdown = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const downloadCSV = () => {
    if (filteredExpenses.length === 0) return;
    const headers = ["Date", "Vendor", "Category", "Amount", "Currency"];
    const csvContent = [
      headers.join(","),
      ...filteredExpenses.map(e => [
        e.date,
        `"${e.vendor || 'Unknown'}"`,
        e.category,
        e.amount,
        e.currency || 'INR'
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_${month || 'all'}.csv`;
    link.click();
  };

  const downloadPDF = () => {
    if (filteredExpenses.length === 0) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Expense Report - ${month || 'All Time'}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 32px; color: #1e293b; }
            h1 { color: #4f46e5; font-size: 22px; margin-bottom: 4px; }
            p.sub { color: #64748b; font-size: 13px; margin-bottom: 20px; }
            .stats { display: flex; gap: 16px; margin-bottom: 24px; }
            .stat { background: #f8fafc; border-radius: 12px; padding: 16px 20px; min-width: 120px; }
            .stat label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
            .stat p { font-size: 20px; font-weight: 700; color: #1e293b; margin: 4px 0 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
            td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            tr:hover td { background: #fafafa; }
            .badge { padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #eef2ff; color: #4f46e5; }
            .amount { color: #059669; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>TripSpend — Expense Report</h1>
          <p class="sub">Period: ${month ? new Date(month + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' }) : 'All Time'}</p>
          <div class="stats">
            <div class="stat"><label>Transactions</label><p>${filteredExpenses.length}</p></div>
            <div class="stat"><label>Total Spent</label><p>₹${totalAmount.toFixed(2)}</p></div>
            <div class="stat"><label>Average</label><p>₹${avgAmount.toFixed(2)}</p></div>
          </div>
          <table>
            <thead><tr><th>Date</th><th>Vendor</th><th>Category</th><th>Amount</th></tr></thead>
            <tbody>
              ${filteredExpenses.map(e => `
                <tr>
                  <td>${new Date(e.date).toLocaleDateString('en-IN')}</td>
                  <td>${e.vendor || 'Unknown'}</td>
                  <td><span class="badge">${e.category}</span></td>
                  <td class="amount">₹${e.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText size={22} className="text-indigo-500" />
            Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Analyze and export your expense data</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <button
            onClick={downloadCSV}
            disabled={loading || filteredExpenses.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={14} />
            CSV
          </button>
          <button
            onClick={downloadPDF}
            disabled={loading || filteredExpenses.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
          >
            <FileDown size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Transactions",
            value: filteredExpenses.length,
            icon: <Receipt size={18} />,
            color: "from-indigo-500 to-violet-600",
          },
          {
            label: "Total Spent",
            value: `₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            icon: <BarChart2 size={18} />,
            color: "from-emerald-400 to-teal-500",
          },
          {
            label: "Average per Expense",
            value: `₹${avgAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            icon: <FileText size={18} />,
            color: "from-amber-400 to-orange-500",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Spending by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const catColor = CATEGORY_COLORS[cat] || "bg-slate-100 text-slate-600";
                const pct = totalAmount > 0 ? ((amt / totalAmount) * 100).toFixed(0) : 0;
                return (
                  <div key={cat} className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg self-start ${catColor}`}>{cat}</span>
                    <p className="text-base font-bold text-slate-800 mt-1">₹{amt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-slate-400">{pct}% of total</p>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Expense Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-700">
            Expense Ledger {month && `— ${new Date(month + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`}
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No expenses for this period</p>
            <p className="text-xs mt-1">Try selecting a different month</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExpenses.map((expense) => {
                  const catColor = CATEGORY_COLORS[expense.category] || "bg-slate-100 text-slate-600";
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 text-slate-500 text-xs">
                        {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-800">{expense.vendor || 'Unknown'}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${catColor}`}>{expense.category}</span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-emerald-600">
                        ₹{expense.amount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
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
