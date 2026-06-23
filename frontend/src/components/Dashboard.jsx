import React, { useState, useEffect } from "react";
import UploadCard from "./UploadCard";
import ExpenseTable from "./ExpenseTable";
import PieChartCard from "./PieChartCard";
import LineChartCard from "./LineChartCard";
import BudgetProgressCard from "./BudgetProgressCard";
import { TrendingUp, Receipt, Wallet, Activity, ArrowUpRight } from "lucide-react";

const statConfig = [
  {
    label: "Total Spent",
    key: "total",
    format: (v) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
    icon: Wallet,
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    glow: "rgba(99,102,241,0.35)",
    bg: "#eef2ff",
    iconColor: "#6366f1",
    change: "+12%",
    changeType: "up",
  },
  {
    label: "Transactions",
    key: "count",
    format: (v) => v,
    icon: Receipt,
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    glow: "rgba(16,185,129,0.3)",
    bg: "#ecfdf5",
    iconColor: "#10b981",
    change: "+5",
    changeType: "up",
  },
  {
    label: "Categories",
    key: "categories",
    format: (v) => v,
    icon: Activity,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    glow: "rgba(245,158,11,0.3)",
    bg: "#fffbeb",
    iconColor: "#f59e0b",
    change: "active",
    changeType: "neutral",
  },
  {
    label: "This Month",
    key: "month",
    format: () => new Date().toLocaleString("en-IN", { month: "short", year: "numeric" }),
    icon: TrendingUp,
    gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    glow: "rgba(236,72,153,0.3)",
    bg: "#fdf2f8",
    iconColor: "#ec4899",
    change: "current",
    changeType: "neutral",
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, count: 0, categories: 0, month: "" });

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
      const res = await fetch(`http://localhost:5000/api/expenses?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        const expenses = data.expenses;
        const total = expenses.reduce((s, e) => s + e.amount, 0);
        const cats = new Set(expenses.map((e) => e.category)).size;
        setStats({ total, count: expenses.length, categories: cats });
      }
    } catch (_) {}
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Welcome banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-7 py-6"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          boxShadow: "0 8px 32px rgba(79,70,229,0.25)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -right-8 -top-8 w-48 h-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #a5b4fc 0%, transparent 70%)" }}
        />
        <div
          className="absolute right-20 bottom-0 w-24 h-24 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #e879f9 0%, transparent 70%)" }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-indigo-300 text-sm font-medium mb-1">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h2 className="text-white text-2xl font-bold leading-tight">
              Your expense overview
            </h2>
            <p className="text-indigo-300 text-sm mt-1">
              {stats.count > 0
                ? `You have ${stats.count} transaction${stats.count !== 1 ? "s" : ""} recorded.`
                : "No expenses yet — start by uploading a receipt!"}
            </p>
          </div>
          <div className="hidden sm:block">
            <div
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 cursor-pointer transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <span>View Reports</span>
              <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statConfig.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3 card-hover"
              style={{
                background: "#fff",
                border: "1px solid #f1f5f9",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                style={{ background: card.gradient, boxShadow: `0 4px 14px ${card.glow}` }}
              >
                <Icon size={18} className="text-white" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  {card.label}
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {card.format(stats[card.key])}
                </p>
              </div>

              {/* Subtle corner accent */}
              <div
                className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-6"
                style={{ background: card.gradient }}
              />
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload card */}
        <div className="lg:col-span-1">
          <UploadCard />
        </div>
        {/* Charts */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <PieChartCard />
          <LineChartCard />
          <div className="sm:col-span-2">
            <BudgetProgressCard />
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <ExpenseTable />
    </div>
  );
}
