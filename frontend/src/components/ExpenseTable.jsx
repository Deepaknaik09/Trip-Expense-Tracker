import React, { useState, useEffect } from "react";
import { Search, RefreshCw, SlidersHorizontal, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateInfo } from '../utils/dateUtils';

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

export default function ExpenseTable() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [date, setDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All Categories') params.append('category', category);
      if (date) params.append('start_date', date);
      params.append('_t', Date.now());
      const response = await fetch(`http://localhost:5000/api/expenses?${params}`);
      const data = await response.json();
      if (data.success) {
        setExpenses(data.expenses);
      } else {
        setError('Failed to fetch expenses');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

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
    fetchExpenses();
    const handleExpenseChange = () => setTimeout(fetchExpenses, 500);
    window.addEventListener('expenseAdded', handleExpenseChange);
    window.addEventListener('expenseDeleted', handleExpenseChange);
    return () => {
      window.removeEventListener('expenseAdded', handleExpenseChange);
      window.removeEventListener('expenseDeleted', handleExpenseChange);
    };
  }, []);

  const filtered = expenses.filter(e =>
    (!search || e.vendor?.toLowerCase().includes(search.toLowerCase())) &&
    (!category || category === 'All Categories' || e.category === category) &&
    (!date || e.date === date)
  );

  const categories = ['All Categories', ...new Set(expenses.map(e => e.category).filter(Boolean))];
  const hasFilters = search || category !== 'All Categories' || date;

  const clearFilters = () => {
    setSearch("");
    setCategory("All Categories");
    setDate("");
  };

  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="flex justify-between items-center px-6 py-4"
        style={{ borderBottom: "1px solid #f8fafc" }}
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Expense History</h3>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs transition-colors" style={{ color: "#ef4444" }}>
              <X size={12} /> Clear filters
            </button>
          )}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showFilters ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          >
            <SlidersHorizontal size={13} />
            Filters
            {hasFilters && <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />}
          </button>
          <button onClick={fetchExpenses} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all" title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-36">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-8 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  placeholder="Search vendor…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
              </div>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input
                type="date"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
              <button onClick={fetchExpenses} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              {["Paid By", "Amount", "Category", "Date", ""].map((h, i) => (
                <th key={i} className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Loading expenses…</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-rose-500 text-sm mb-2">{error}</p>
                  <button onClick={fetchExpenses} className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition">
                    Retry
                  </button>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                  {expenses.length === 0 ? 'No expenses yet. Add your first one!' : 'No expenses match your filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((expense) => {
                const catColor = CATEGORY_COLORS[expense.category] || "bg-slate-100 text-slate-600";
                const dateInfo = formatDateInfo(expense.date);
                return (
                  <tr
                    key={expense.id}
                    className="transition-colors group"
                    style={{ borderBottom: "1px solid #f8fafc" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-medium text-slate-800">
                        {expense.paidBy || "Self"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-emerald-600">
                        ₹{expense.amount?.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${catColor}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-sm ${dateInfo.isToday ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}>
                        {dateInfo.formatted}
                      </span>
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
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-50 text-xs text-slate-400 text-center">
          Showing {filtered.length} of {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
        </div>
      )}
    </motion.div>
  );
}
