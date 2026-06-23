import React, { useState, useEffect } from "react";
import UploadCard from "./UploadCard";
import ExpenseTable from "./ExpenseTable";
import PieChartCard from "./PieChartCard";
import LineChartCard from "./LineChartCard";
import BudgetProgressCard from "./BudgetProgressCard";
import { TrendingUp, Receipt, Wallet, Activity } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, count: 0, categories: 0 });

  useEffect(() => {
    fetchStats();
    const refresh = () => setTimeout(fetchStats, 600);
    window.addEventListener("expenseAdded", refresh);
    window.addEventListener("expenseDeleted", refresh);
    return () => {
      window.removeEventListener("expenseAdded", refresh);
      window.removeEventListener("expenseDeleted", refresh);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/expenses");
      const data = await res.json();
      if (data.success) {
        const expenses = data.expenses;
        const total = expenses.reduce((s, e) => s + e.amount, 0);
        const cats = new Set(expenses.map((e) => e.category)).size;
        setStats({ total, count: expenses.length, categories: cats });
      }
    } catch (_) {}
  };

  const statCards = [
    {
      label: "Total Spent",
      value: `₹${stats.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      icon: <Wallet size={20} />,
      color: "from-indigo-500 to-violet-600",
      lightBg: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      label: "Transactions",
      value: stats.count,
      icon: <Receipt size={20} />,
      color: "from-emerald-400 to-teal-500",
      lightBg: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "Categories",
      value: stats.categories,
      icon: <Activity size={20} />,
      color: "from-amber-400 to-orange-500",
      lightBg: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      label: "This Month",
      value: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }),
      icon: <TrendingUp size={20} />,
      color: "from-rose-400 to-pink-500",
      lightBg: "bg-rose-50",
      textColor: "text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm flex-shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{card.label}</p>
              <p className="text-lg font-bold text-slate-800 truncate">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card — takes 1 col */}
        <div className="lg:col-span-1">
          <UploadCard />
        </div>

        {/* Charts — take 2 cols */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <PieChartCard />
          <LineChartCard />
          <div className="sm:col-span-2">
            <BudgetProgressCard />
          </div>
        </div>
      </div>

      {/* Expense Table — full width */}
      <ExpenseTable />
    </div>
  );
}
