"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import { getCurrentMonth, getMonthName, formatCurrency } from "@/lib/utils";

export default function SummaryPage() {
  const [summary, setSummary] = useState(null);
  const [flatExpenses, setFlatExpenses] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, flatRes] = await Promise.all([
        fetch(`/api/summary?month=${month}`),
        fetch(`/api/flat-expenses?month=${month}`),
      ]);
      const summaryData = await summaryRes.json();
      const flatData = await flatRes.json();
      setSummary(summaryData);
      setFlatExpenses(Array.isArray(flatData) ? flatData : []);
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

  const totalFlatExpenses = flatExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  const memberCount = summary.members?.length || 1;
  const perPersonFlat = totalFlatExpenses / memberCount;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            📊 Overall Summary
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {getMonthName(month)} — Complete financial breakdown
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatsCard
          icon="💸"
          label="Total Cost"
          value={formatCurrency(summary.totalCost)}
          sub="All bajar expenses"
          color="pink"
        />
        <StatsCard
          icon="💰"
          label="Collection"
          value={formatCurrency(summary.totalCollection)}
          sub="Total cash received"
          color="green"
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

      {/* Cash Balance */}
      <div
        className={`glass-card p-5 mb-6 text-center animate-fade-in-up ${
          summary.cashBalance >= 0
            ? "bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/20"
            : "bg-gradient-to-r from-red-500/10 to-rose-500/5 border-red-500/20"
        }`}
      >
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
          Cash Balance (Collection - Cost)
        </p>
        <p
          className={`text-3xl font-bold ${
            summary.cashBalance >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {summary.cashBalance >= 0 ? "+" : ""}
          {formatCurrency(summary.cashBalance)}
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
                <th className="text-right">Paid</th>
                <th className="text-right">Balance</th>
                <th className="text-center">Status</th>
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
                  <td className="text-right text-pink-400 text-sm">
                    {formatCurrency(m.mealCost)}
                  </td>
                  <td className="text-right text-green-400 text-sm">
                    {formatCurrency(m.totalPaid)}
                  </td>
                  <td
                    className={`text-right font-bold text-sm ${
                      m.balance >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {m.balance >= 0 ? "+" : ""}
                    {formatCurrency(m.balance)}
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge badge-sm ${
                        m.balance >= 0 ? "badge-positive" : "badge-negative"
                      }`}
                    >
                      {m.balance >= 0 ? "Advance" : "Due"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flat Expenses Summary (if any) */}
      {totalFlatExpenses > 0 && (
        <div className="glass-card overflow-hidden mb-6 animate-fade-in-up">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span>🏢</span> Flat Expenses Split
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Total: {formatCurrency(totalFlatExpenses)} ÷ {memberCount}{" "}
              members = {formatCurrency(perPersonFlat)} per person
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Per Person</th>
                </tr>
              </thead>
              <tbody>
                {flatExpenses.map((e) => (
                  <tr key={e._id}>
                    <td className="text-sm text-white capitalize">
                      {e.category}
                    </td>
                    <td className="text-right text-pink-400 text-sm">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="text-right text-slate-300 text-sm">
                      {formatCurrency(e.amount / memberCount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-pink-500/10 font-bold">
                  <td className="text-pink-300">TOTAL</td>
                  <td className="text-right text-pink-300">
                    {formatCurrency(totalFlatExpenses)}
                  </td>
                  <td className="text-right text-pink-300">
                    {formatCurrency(perPersonFlat)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grand Total Per Person */}
      {summary.members && summary.members.length > 0 && (
        <div className="glass-card p-5 animate-fade-in-up">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>🧮</span> Final Settlement (Meal + Flat)
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.members.map((m) => {
              const mealBalance = m.balance;
              const flatShare = perPersonFlat;
              const finalBalance = mealBalance - flatShare;
              return (
                <div
                  key={m.memberId}
                  className={`rounded-xl p-4 border ${
                    finalBalance >= 0
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-red-500/5 border-red-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-white text-sm">
                      {m.name}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Meal Cost:</span>
                      <span className="text-pink-400">
                        {formatCurrency(m.mealCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Flat Share:</span>
                      <span className="text-purple-400">
                        {formatCurrency(flatShare)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Due:</span>
                      <span className="text-white font-medium">
                        {formatCurrency(m.mealCost + flatShare)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Paid:</span>
                      <span className="text-green-400">
                        {formatCurrency(m.totalPaid)}
                      </span>
                    </div>
                    <div className="border-t border-slate-700/50 pt-1 mt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-medium">
                          Balance:
                        </span>
                        <span
                          className={`font-bold ${
                            finalBalance >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {finalBalance >= 0 ? "+" : ""}
                          {formatCurrency(finalBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
