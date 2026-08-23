"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import StatsCard from "@/components/StatsCard";
import AddMemberModal from "@/components/AddMemberModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getMonthName, formatCurrency } from "@/lib/utils";
import { useMonth } from "@/context/MonthContext";
import { useAuth } from "@/context/AuthContext";

const quickLinks = [
  {
    href: "/meals",
    icon: "🍽️",
    title: "Meal Count",
    desc: "Track daily meals",
    color: "from-sky-500/10 to-cyan-500/5 border-sky-500/20",
  },
  {
    href: "/bajar",
    icon: "🛒",
    title: "Bajar List",
    desc: "Market expenses",
    color: "from-green-500/10 to-emerald-500/5 border-green-500/20",
  },
  {
    href: "/summary",
    icon: "📊",
    title: "Summary",
    desc: "Meal rate & costs",
    color: "from-purple-500/10 to-violet-500/5 border-purple-500/20",
  },
  {
    href: "/flat-expenses",
    icon: "🏢",
    title: "Flat Expenses",
    desc: "Rent, bills & utilities",
    color: "from-pink-500/10 to-rose-500/5 border-pink-500/20",
  },
  {
    href: "/admin",
    icon: "⚙️",
    title: "Admin Panel",
    desc: "Manage & assign roles",
    color: "from-slate-500/10 to-gray-500/5 border-slate-500/20",
  },
];

export default function Dashboard() {
  const { canManageMembersAndMeals, openLoginModal } = useAuth();
  const {
    selectedMonth,
    setSelectedMonth,
    prevMonth,
    nextMonth,
    resetToCurrentMonth,
    isCurrentMonth,
    historyList,
    refreshHistory,
  } = useMonth();

  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, summaryRes] = await Promise.all([
        fetch("/api/members"),
        fetch(`/api/summary?month=${selectedMonth}`),
      ]);
      const membersData = await membersRes.json();
      const summaryData = await summaryRes.json();
      setMembers(Array.isArray(membersData) ? membersData : []);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddMember(data) {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchData();
      refreshHistory();
    }
  }

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="page-container">
      {/* Header with Integrated Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Dashboard</h1>
            {!isCurrentMonth && (
              <span className="badge badge-sm bg-amber-500/20 text-amber-300 border-amber-500/40">
                Viewing Archive
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {getMonthName(selectedMonth)} — {members.length} Flat Members
          </p>
        </div>

        {/* Month Shift Controls */}
        <div className="flex items-center gap-2 bg-base-200/80 p-1.5 rounded-2xl border border-slate-700/80 shadow-md">
          <button
            onClick={prevMonth}
            className="btn btn-ghost btn-xs text-slate-300 hover:text-white px-2.5 h-8"
            title="Previous Month"
          >
            ◀ Prev Month
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input input-bordered input-xs bg-base-100/80 border-slate-700 text-xs font-bold text-sky-300 text-center h-8"
          />

          <button
            onClick={nextMonth}
            className="btn btn-ghost btn-xs text-slate-300 hover:text-white px-2.5 h-8"
            title="Next Month"
          >
            Next Month ▶
          </button>

          {!isCurrentMonth && (
            <button
              onClick={resetToCurrentMonth}
              className="btn btn-primary btn-xs text-[11px] h-8 px-2.5"
            >
              Current Month
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid for the Selected Month */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 stagger-children">
        <StatsCard
          icon="👥"
          label="Members"
          value={members.length}
          sub="Active members"
          color="sky"
        />
        <StatsCard
          icon="🍽️"
          label="Total Meals"
          value={summary?.grandTotalMeals || 0}
          sub={getMonthName(selectedMonth)}
          color="purple"
        />
        <StatsCard
          icon="💸"
          label="Total Cost"
          value={formatCurrency(summary?.totalCost || 0)}
          sub="Bajar expenses"
          color="pink"
        />
        <StatsCard
          icon="📈"
          label="Meal Rate"
          value={formatCurrency(summary?.mealRate || 0)}
          sub="Per meal cost"
          color="green"
        />
      </div>

      {/* Members Section + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Members List */}
        <div className="lg:col-span-1 glass-card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700/60">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
              <span>👥</span> Flat Members ({members.length})
            </h2>
            <button
              onClick={() => {
                if (!canManageMembersAndMeals) {
                  openLoginModal();
                } else {
                  setShowAddMember(true);
                }
              }}
              className="btn btn-primary btn-xs gap-1 font-semibold"
            >
              <span>+</span> Add
            </button>
          </div>

          {members.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No members added yet. Click &quot;+ Add&quot; to begin.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {members.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-base-100/40 hover:bg-base-100/60 transition-all border border-slate-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white truncate">
                      {m.name}
                    </p>
                    {m.phone && (
                      <p className="text-[11px] text-slate-400">{m.phone}</p>
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
            <span>🚀</span> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`glass-card p-4 bg-gradient-to-br ${link.color} border group block transition-all hover:scale-[1.02]`}
              >
                <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform duration-200">
                  {link.icon}
                </span>
                <h3 className="font-semibold text-white text-xs sm:text-sm mb-0.5">
                  {link.title}
                </h3>
                <p className="text-[11px] text-slate-400">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Month Meal Breakdown */}
      {summary && summary.members && summary.members.length > 0 && (
        <div className="glass-card p-5 mb-8 animate-fade-in-up border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700/60">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
              <span>📊</span> {getMonthName(selectedMonth)} Meal Overview
            </h2>
            <Link
              href="/summary"
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              Full Breakdown →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-base-100/50 rounded-xl p-3 text-center border border-slate-800">
              <p className="text-[11px] text-slate-400 mb-1">Total Bajar Cost</p>
              <p className="text-lg font-bold text-pink-400">
                {formatCurrency(summary.totalCost)}
              </p>
            </div>
            <div className="bg-base-100/50 rounded-xl p-3 text-center border border-slate-800">
              <p className="text-[11px] text-slate-400 mb-1">Total Meals</p>
              <p className="text-lg font-bold text-purple-400">
                {summary.grandTotalMeals} meals
              </p>
            </div>
            <div className="bg-base-100/50 rounded-xl p-3 text-center border border-slate-800">
              <p className="text-[11px] text-slate-400 mb-1">Meal Rate</p>
              <p className="text-lg font-bold text-sky-400">
                {formatCurrency(summary.mealRate)} / meal
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MONTH-WISE HISTORY & ARCHIVES SECTION */}
      <div className="glass-card p-5 animate-fade-in-up border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div>
              <h2 className="font-bold text-white text-base">
                Month-Wise History &amp; Records
              </h2>
              <p className="text-xs text-slate-400">
                Every month automatically resets — previous history is stored safely below
              </p>
            </div>
          </div>
          <button
            onClick={refreshHistory}
            className="btn btn-ghost btn-xs text-slate-300 border border-slate-700 self-start sm:self-auto"
          >
            🔄 Refresh Archive
          </button>
        </div>

        {historyList.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            No past month records found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {historyList.map((item) => {
              const isSelected = item.month === selectedMonth;
              return (
                <div
                  key={item.month}
                  className={`p-4 rounded-xl transition-all border ${
                    isSelected
                      ? "bg-sky-500/10 border-sky-500/40 shadow-lg shadow-sky-500/10"
                      : "bg-base-100/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">
                      {item.monthName}
                    </span>
                    {item.isCurrent ? (
                      <span className="badge badge-xs bg-green-500/20 text-green-300 border-green-500/40">
                        Current
                      </span>
                    ) : (
                      <span className="badge badge-xs bg-slate-800 text-slate-400 border-slate-700">
                        Archive
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Bajar:</span>
                      <span className="text-pink-400 font-semibold">
                        {formatCurrency(item.totalBajar)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Meals:</span>
                      <span className="text-purple-400 font-semibold">
                        {item.totalMeals}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Meal Rate:</span>
                      <span className="text-sky-400 font-semibold">
                        {formatCurrency(item.mealRate)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMonth(item.month)}
                    className={`btn btn-xs w-full ${
                      isSelected
                        ? "btn-primary text-white"
                        : "btn-ghost border border-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    {isSelected ? "✓ Currently Viewing" : "📂 View Month History"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={handleAddMember}
      />
    </div>
  );
}
