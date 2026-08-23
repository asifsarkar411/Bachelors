"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import { getCurrentMonth, getMonthName, formatCurrency } from "@/lib/utils";

export default function SummaryPage() {
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/summary?month=${month}`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Calculating summary..." />;
  if (!summary)
    return (
      <div className="page-container text-center text-slate-500 py-20">
        No data available
      </div>
    );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            📊 Meal Summary
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {getMonthName(month)} — Meal rate & per-person breakdown
          </p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input input-bordered input-sm bg-base-200 border-slate-700 text-sm"
        />
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 stagger-children">
        <StatsCard
          icon="💸"
          label="Total Cost"
          value={formatCurrency(summary.totalCost)}
          sub="All bajar expenses"
          color="pink"
        />
        <StatsCard
          icon="🍽️"
          label="Total Meals"
          value={summary.grandTotalMeals}
          sub="All members combined"
          color="purple"
        />
        <StatsCard
          icon="📈"
          label="Meal Rate"
          value={formatCurrency(summary.mealRate)}
          sub="Cost per meal"
          color="sky"
        />
      </div>

      {/* Meal Rate Breakdown */}
      <div className="glass-card p-5 mb-6 text-center animate-fade-in-up bg-gradient-to-r from-sky-500/10 to-purple-500/10 border-sky-500/20">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
          Meal Rate Calculation
        </p>
        <p className="text-lg text-slate-300">
          <span className="text-pink-400 font-bold">
            {formatCurrency(summary.totalCost)}
          </span>
          <span className="text-slate-500 mx-2">÷</span>
          <span className="text-purple-400 font-bold">
            {summary.grandTotalMeals} meals
          </span>
          <span className="text-slate-500 mx-2">=</span>
          <span className="text-sky-400 font-bold text-2xl">
            {formatCurrency(summary.mealRate)}
          </span>
          <span className="text-slate-500 text-sm ml-1">per meal</span>
        </p>
      </div>

      {/* Per-Person Breakdown */}
      <div className="glass-card overflow-hidden mb-6 animate-fade-in-up">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span>👥</span> Per-Person Meal Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Meal Rate: {formatCurrency(summary.mealRate)} per meal
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="text-center">Total Meals</th>
                <th className="text-right">Meal Cost</th>
                <th className="text-right">Bajar Spent</th>
              </tr>
            </thead>
            <tbody>
              {summary.members?.map((m) => (
                <tr key={m.memberId}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white text-sm">
                        {m.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-center text-purple-300 font-semibold">
                    {m.totalMeals}
                  </td>
                  <td className="text-right text-pink-400 font-semibold text-sm">
                    {formatCurrency(m.mealCost)}
                  </td>
                  <td className="text-right text-green-400 text-sm">
                    {formatCurrency(m.totalBajar)}
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-sky-500/10 font-bold">
                <td className="text-sky-300">TOTAL</td>
                <td className="text-center text-purple-300">
                  {summary.grandTotalMeals}
                </td>
                <td className="text-right text-pink-300">
                  {formatCurrency(summary.totalCost)}
                </td>
                <td className="text-right text-green-300">
                  {formatCurrency(summary.totalCost)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-Person Cards */}
      {summary.members && summary.members.length > 0 && (
        <div className="animate-fade-in-up">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>🧮</span> Individual Meal Cost
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.members.map((m) => (
              <div
                key={m.memberId}
                className="glass-card p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-white text-sm">
                    {m.name}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Meals:</span>
                    <span className="text-purple-400 font-semibold">
                      {m.totalMeals}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Meal Rate:</span>
                    <span className="text-sky-400">
                      {formatCurrency(summary.mealRate)}
                    </span>
                  </div>
                  <div className="border-t border-slate-700/50 pt-1.5 mt-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium">
                        Meal Cost:
                      </span>
                      <span className="font-bold text-pink-400 text-sm">
                        {formatCurrency(m.mealCost)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
