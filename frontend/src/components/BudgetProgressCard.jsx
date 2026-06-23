import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Target, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function BudgetProgressCard() {
  const [budget, setBudget] = useState(10000);
  const [spent, setSpent] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [showBudgetSetter, setShowBudgetSetter] = useState(false);
  const [newBudget, setNewBudget] = useState('10000');

  useEffect(() => {
    fetchExpenses();
    const handle = () => fetchExpenses();
    window.addEventListener('expenseAdded', handle);
    return () => window.removeEventListener('expenseAdded', handle);
  }, []);

  useEffect(() => {
    const savedBudget = localStorage.getItem('monthlyBudget');
    if (savedBudget && parseFloat(savedBudget) > 0) {
      const v = parseFloat(savedBudget);
      setBudget(v);
      setNewBudget(v.toString());
    }
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/expenses');
      if (response.ok) {
        const data = await response.json();
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyExpenses = data.expenses.filter(e => e.date.startsWith(currentMonth));
        const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
        setSpent(totalSpent);
        setExpenses(monthlyExpenses);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = budget - spent;
  const isOverBudget = spent > budget;

  const handleBudgetUpdate = () => {
    const budgetValue = Number(newBudget);
    if (budgetValue > 0) {
      setBudget(budgetValue);
      setShowBudgetSetter(false);
      localStorage.setItem('monthlyBudget', budgetValue.toString());
    }
  };

  const getBarColor = () => {
    if (isOverBudget) return 'bg-rose-500';
    if (percent > 80) return 'bg-amber-500';
    if (percent > 60) return 'bg-orange-400';
    return 'bg-emerald-500';
  };

  const getStatusConfig = () => {
    if (isOverBudget) return { icon: <AlertTriangle size={14} />, label: 'Over Budget!', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' };
    if (percent > 80) return { icon: <TrendingUp size={14} />, label: 'Approaching limit', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' };
    return { icon: <CheckCircle2 size={14} />, label: 'On track', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };
  };

  const status = getStatusConfig();

  return (
    <motion.div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Monthly Budget</h2>
          <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button
          onClick={() => { setNewBudget(budget.toString()); setShowBudgetSetter(b => !b); }}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all"
          title="Set Monthly Budget"
        >
          <Settings size={14} />
        </button>
      </div>

      {/* Budget Setter */}
      {showBudgetSetter && (
        <div className="mb-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
          <label className="block text-xs font-medium text-slate-600">Set Monthly Budget (₹)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter budget"
              min="1"
            />
            <button
              onClick={handleBudgetUpdate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Amounts */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <span className={`text-2xl font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}`}>
            ₹{spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-slate-400 ml-1">spent</span>
        </div>
        <span className="text-sm text-slate-500 font-medium">
          of ₹{budget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${getBarColor()}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400 font-medium">Remaining</p>
          <p className={`text-sm font-bold ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{Math.abs(remaining).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400 font-medium">Used</p>
          <p className="text-sm font-bold text-slate-700">{percent.toFixed(0)}%</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400 font-medium">Transactions</p>
          <p className="text-sm font-bold text-indigo-600">{expenses.length}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${status.color} ${status.bg}`}>
        {status.icon}
        <span>{status.label}</span>
        {isOverBudget && (
          <span className="ml-auto">Over by ₹{Math.abs(remaining).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        )}
      </div>
    </motion.div>
  );
}
