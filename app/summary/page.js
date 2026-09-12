"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import { getMonthName, formatCurrency } from "@/lib/utils";
import { useMonth } from "@/context/MonthContext";

export default function SummaryPage() {
  const { selectedMonth, setSelectedMonth } = useMonth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/summary?month=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data && !data.error ? data : null);
      } else {
        setSummary(null);
      }
    } catch (err) {
      console.error(err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Calculating monthly summary & settlement records..." />;
  if (!summary)
    return (
      <div className="page-container text-center text-slate-500 py-20">
        No summary data available for {getMonthName(selectedMonth)}.
      </div>
    );

  const membersWithReturn = summary.members?.filter((m) => m.returnAmount > 0) || [];
  const membersWithDue = summary.members?.filter((m) => m.dueAmount > 0) || [];
  const settledMembers = summary.members?.filter((m) => m.balance === 0) || [];

  return (
    <div className="page-container pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
            📊 Meal &amp; Cost Summary
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {getMonthName(selectedMonth)} — Meal rate, return refunds &amp; due balance records
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input input-bordered input-sm bg-base-200 border-slate-700 text-xs sm:text-sm font-bold text-sky-300 flex-1 sm:flex-none"
          />
        </div>
      </div>

      {/* Key Stats (5 Cards Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 stagger-children">
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
          value={`${summary.grandTotalMeals} meals`}
          sub="All members combined"
          color="purple"
        />
        <StatsCard
          icon="📈"
          label="Meal Rate"
          value={formatCurrency(summary.mealRate)}
          sub="Per meal cost"
          color="sky"
        />
        <StatsCard
          icon="🟢"
          label="Will Return"
          value={formatCurrency(summary.totalReturn || 0)}
          sub={`${membersWithReturn.length} member(s) get refund`}
          color="green"
        />
        <StatsCard
          icon="🔴"
          label="Have To Give"
          value={formatCurrency(summary.totalDue || 0)}
          sub={`${membersWithDue.length} member(s) have due`}
          color="red"
        />
      </div>

      {/* Meal Rate Breakdown formula */}
      <div className="glass-card p-4 sm:p-5 mb-6 text-center animate-fade-in-up bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-pink-500/10 border-sky-500/20">
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
          Meal Rate Calculation Formula
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-slate-300 text-sm sm:text-base">
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-pink-500/30">
            <span className="text-xs text-slate-400">Total Bajar:</span>
            <span className="text-pink-400 font-bold">{formatCurrency(summary.totalCost)}</span>
          </div>
          <span className="text-slate-500 font-bold text-lg">÷</span>
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-purple-500/30">
            <span className="text-xs text-slate-400">Total Meals:</span>
            <span className="text-purple-400 font-bold">{summary.grandTotalMeals} meals</span>
          </div>
          <span className="text-slate-500 font-bold text-lg">=</span>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-sky-500/40 shadow-md shadow-sky-500/10">
            <span className="text-xs text-slate-400">Meal Rate:</span>
            <span className="text-sky-400 font-bold text-lg sm:text-xl">
              {formatCurrency(summary.mealRate)}
            </span>
            <span className="text-slate-500 text-xs">/ meal</span>
          </div>
        </div>
      </div>

      {/* ================= NEW SETTLEMENT RECORD SECTION (RETURN VS DUE) ================= */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>⚖️</span> Final Settlement &amp; Balance Records (হিসাব-নিকাশ ও লেনদেন)
          </h2>
          <span className="text-xs text-slate-400 hidden sm:inline-block">
            {getMonthName(selectedMonth)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* SECTION 1: WILL GET RETURN (টাকা ফেরত পাবে) */}
          <div className="glass-card p-4 sm:p-5 border-green-500/30 bg-gradient-to-br from-green-950/20 via-slate-900/50 to-emerald-950/10 shadow-lg shadow-green-500/5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-green-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xl">🟢</span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-green-300">
                    Will Get Return (টাকা ফেরত পাবে)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Spent more on Bajar than their meal cost
                  </p>
                </div>
              </div>
              <span className="badge badge-sm bg-green-500/20 text-green-300 border-green-500/40 font-bold text-xs">
                Total: {formatCurrency(summary.totalReturn || 0)}
              </span>
            </div>

            {membersWithReturn.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No members are due a return for this month.
              </p>
            ) : (
              <div className="space-y-2.5">
                {membersWithReturn.map((m) => (
                  <div
                    key={m.memberId}
                    className="p-3 rounded-xl bg-base-100/70 border border-green-500/20 hover:border-green-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-white">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Bajar: <span className="text-green-400 font-semibold">{formatCurrency(m.totalBajar)}</span> | Meal Cost: <span className="text-pink-400 font-semibold">{formatCurrency(m.mealCost)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between self-end sm:self-auto bg-green-500/10 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg w-full sm:w-auto">
                      <span className="text-[10px] uppercase tracking-wider text-green-300 font-semibold sm:hidden">
                        Refund:
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-green-400">
                        +{formatCurrency(m.returnAmount)}
                      </span>
                      <span className="text-[10px] text-green-300/80 hidden sm:inline-block">
                        Flat will refund
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: HAVE TO GIVE / DUE (টাকা দিতে হবে) */}
          <div className="glass-card p-4 sm:p-5 border-rose-500/30 bg-gradient-to-br from-rose-950/20 via-slate-900/50 to-pink-950/10 shadow-lg shadow-rose-500/5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔴</span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-rose-300">
                    Have To Give (টাকা দিতে হবে)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Meal cost is greater than what they spent on Bajar
                  </p>
                </div>
              </div>
              <span className="badge badge-sm bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold text-xs">
                Total: {formatCurrency(summary.totalDue || 0)}
              </span>
            </div>

            {membersWithDue.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                All members have cleared their meal cost! No dues recorded.
              </p>
            ) : (
              <div className="space-y-2.5">
                {membersWithDue.map((m) => (
                  <div
                    key={m.memberId}
                    className="p-3 rounded-xl bg-base-100/70 border border-rose-500/20 hover:border-rose-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-white">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Meal Cost: <span className="text-pink-400 font-semibold">{formatCurrency(m.mealCost)}</span> | Bajar: <span className="text-green-400 font-semibold">{formatCurrency(m.totalBajar)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between self-end sm:self-auto bg-rose-500/10 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg w-full sm:w-auto">
                      <span className="text-[10px] uppercase tracking-wider text-rose-300 font-semibold sm:hidden">
                        Due:
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-rose-400">
                        -{formatCurrency(m.dueAmount)}
                      </span>
                      <span className="text-[10px] text-rose-300/80 hidden sm:inline-block">
                        Needs to pay flat
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settled Members notice if any */}
        {settledMembers.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-base-100/50 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <span>⚪</span>
            <span>
              <strong className="text-slate-300">Fully Settled (৳0):</strong>{" "}
              {settledMembers.map((m) => m.name).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Per-Person Detailed Breakdown Table */}
      <div className="glass-card overflow-hidden mb-8 animate-fade-in-up border-slate-800">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
              <span>👥</span> Complete Member Calculation &amp; Balance Table
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Meal Rate: <span className="text-sky-300 font-semibold">{formatCurrency(summary.mealRate)}</span> per meal
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Balance = Bajar Spent − Meal Cost
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="bg-slate-900/90">
                <th className="min-w-[130px]">Member</th>
                <th className="text-center min-w-[90px]">Total Meals</th>
                <th className="text-right min-w-[100px]">Meal Cost</th>
                <th className="text-right min-w-[100px]">Bajar Spent</th>
                <th className="text-right min-w-[110px]">Net Balance</th>
                <th className="text-center min-w-[130px]">Settlement Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.members?.map((m) => {
                const isReturn = m.returnAmount > 0;
                const isDue = m.dueAmount > 0;

                return (
                  <tr key={m.memberId} className="hover:bg-slate-800/40">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                            isReturn
                              ? "bg-gradient-to-br from-green-500 to-emerald-600"
                              : isDue
                              ? "bg-gradient-to-br from-rose-500 to-red-600"
                              : "bg-gradient-to-br from-sky-500 to-purple-500"
                          }`}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white text-xs sm:text-sm">
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-center text-purple-300 font-bold text-xs sm:text-sm">
                      {m.totalMeals}
                    </td>
                    <td className="text-right text-pink-400 font-semibold text-xs sm:text-sm">
                      {formatCurrency(m.mealCost)}
                    </td>
                    <td className="text-right text-green-400 font-semibold text-xs sm:text-sm">
                      {formatCurrency(m.totalBajar)}
                    </td>
                    <td className="text-right font-extrabold text-xs sm:text-sm">
                      {isReturn ? (
                        <span className="text-green-400">+{formatCurrency(m.returnAmount)}</span>
                      ) : isDue ? (
                        <span className="text-rose-400">-{formatCurrency(m.dueAmount)}</span>
                      ) : (
                        <span className="text-slate-400">৳0</span>
                      )}
                    </td>
                    <td className="text-center">
                      {isReturn ? (
                        <span className="badge badge-sm bg-green-500/20 text-green-300 border-green-500/40 text-[11px] font-bold py-1 px-2.5">
                          🟢 Return: {formatCurrency(m.returnAmount)}
                        </span>
                      ) : isDue ? (
                        <span className="badge badge-sm bg-rose-500/20 text-rose-300 border-rose-500/40 text-[11px] font-bold py-1 px-2.5">
                          🔴 Give: {formatCurrency(m.dueAmount)}
                        </span>
                      ) : (
                        <span className="badge badge-sm bg-slate-800 text-slate-400 border-slate-700 text-[11px]">
                          ⚪ Settled (৳0)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="bg-sky-500/15 font-extrabold border-t-2 border-sky-500/30">
                <td className="text-sky-300 text-xs sm:text-sm">TOTAL SUMMARY</td>
                <td className="text-center text-purple-300 text-xs sm:text-sm">
                  {summary.grandTotalMeals}
                </td>
                <td className="text-right text-pink-300 text-xs sm:text-sm">
                  {formatCurrency(summary.totalCost)}
                </td>
                <td className="text-right text-green-300 text-xs sm:text-sm">
                  {formatCurrency(summary.totalCost)}
                </td>
                <td className="text-right text-sky-300 text-xs sm:text-sm">
                  ৳0 (Balanced)
                </td>
                <td className="text-center text-xs text-slate-300">
                  <span className="text-green-400 font-bold">+{formatCurrency(summary.totalReturn || 0)}</span>
                  {" / "}
                  <span className="text-rose-400 font-bold">-{formatCurrency(summary.totalDue || 0)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Member Cards */}
      {summary.members && summary.members.length > 0 && (
        <div className="animate-fade-in-up">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
            <span>🧮</span> Individual Member Balance Cards
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {summary.members.map((m) => {
              const isReturn = m.returnAmount > 0;
              const isDue = m.dueAmount > 0;

              return (
                <div
                  key={m.memberId}
                  className={`glass-card p-4.5 border transition-all ${
                    isReturn
                      ? "border-green-500/30 bg-gradient-to-br from-green-950/20 via-slate-900/60 to-slate-900/80"
                      : isDue
                      ? "border-rose-500/30 bg-gradient-to-br from-rose-950/20 via-slate-900/60 to-slate-900/80"
                      : "border-slate-800 bg-base-100/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md ${
                          isReturn
                            ? "bg-gradient-to-br from-green-500 to-emerald-600"
                            : isDue
                            ? "bg-gradient-to-br from-rose-500 to-red-600"
                            : "bg-gradient-to-br from-sky-500 to-purple-500"
                        }`}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm block">
                          {m.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {m.totalMeals} meals × {formatCurrency(summary.mealRate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs bg-base-200/50 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Meal Cost:</span>
                      <span className="text-pink-400 font-semibold">
                        {formatCurrency(m.mealCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bajar Spent:</span>
                      <span className="text-green-400 font-semibold">
                        {formatCurrency(m.totalBajar)}
                      </span>
                    </div>
                  </div>

                  {/* Highlight Settlement Status Box */}
                  <div
                    className={`p-2.5 rounded-xl text-center border font-bold text-xs ${
                      isReturn
                        ? "bg-green-500/15 border-green-500/30 text-green-300"
                        : isDue
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                        : "bg-slate-800/60 border-slate-700 text-slate-300"
                    }`}
                  >
                    {isReturn ? (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider block text-green-400/80">
                          🟢 Will Get Return
                        </span>
                        <span className="text-base font-extrabold text-green-400">
                          +{formatCurrency(m.returnAmount)}
                        </span>
                      </div>
                    ) : isDue ? (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider block text-rose-400/80">
                          🔴 Has To Give
                        </span>
                        <span className="text-base font-extrabold text-rose-400">
                          -{formatCurrency(m.dueAmount)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider block text-slate-400">
                          ⚪ Settled
                        </span>
                        <span className="text-sm font-bold text-slate-300">
                          ৳0 (No balance)
                        </span>
                      </div>
                    )}
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
