"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getCurrentMonth, getMonthName, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useMonth } from "@/context/MonthContext";

const CATEGORIES = [
  { key: "rent", label: "Flat Rent", icon: "🏠" },
  { key: "gas", label: "Gas Bill", icon: "🔥" },
  { key: "water", label: "Water Bill", icon: "💧" },
  { key: "maid", label: "Home Maid", icon: "🧹" },
  { key: "wifi", label: "WiFi / Internet", icon: "📶" },
  { key: "electricity", label: "Electricity", icon: "⚡" },
];

export default function FlatExpensesPage() {
  const { isLoggedIn, openLoginModal } = useAuth();
  const { selectedMonth, setSelectedMonth } = useMonth();

  const [expenses, setExpenses] = useState({});
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, membersRes] = await Promise.allSettled([
        fetch(`/api/flat-expenses?month=${selectedMonth}`),
        fetch("/api/members"),
      ]);

      if (membersRes.status === "fulfilled" && membersRes.value.ok) {
        const membersData = await membersRes.value.json();
        setMembers(Array.isArray(membersData) ? membersData : []);
      }

      // Build map
      const map = {};
      CATEGORIES.forEach((c) => (map[c.key] = 0));
      if (expRes.status === "fulfilled" && expRes.value.ok) {
        const expData = await expRes.value.json();
        if (Array.isArray(expData)) {
          expData.forEach((e) => {
            map[e.category] = Number(e.amount) || 0;
          });
        }
      }
      setExpenses(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleChange(category, value) {
    setExpenses((prev) => ({
      ...prev,
      [category]: Number(value) || 0,
    }));
  }

  async function saveAll() {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    setSaving(true);
    setSaveMsg("");
    try {
      for (const [category, amount] of Object.entries(expenses)) {
        await fetch("/api/flat-expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month: selectedMonth, category, amount }),
        });
      }
      setSaveMsg("✅ Flat expenses saved successfully!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg("❌ Error saving expenses");
      console.error(err);
    }
    setSaving(false);
  }

  const totalExpenses = Object.values(expenses).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );
  const memberCount = members.length || 1;
  const perPerson = totalExpenses / memberCount;

  if (loading) return <LoadingSpinner text="Loading flat expenses..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
            🏢 Flat Expenses &amp; Utilities
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {getMonthName(selectedMonth)} — Totally separate from meal calculations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input input-bordered input-sm bg-base-200 border-slate-700 text-xs sm:text-sm flex-1 sm:flex-none"
          />
          <button
            onClick={saveAll}
            disabled={saving}
            className="btn btn-primary btn-sm gap-1.5 shadow-md shadow-sky-500/20 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "💾"
            )}{" "}
            Save Expenses
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className="mb-4 p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs sm:text-sm font-medium text-center animate-fade-in">
          {saveMsg}
        </div>
      )}

      {/* Expense Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 stagger-children">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="glass-card p-4 sm:p-5 bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-800"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    {cat.label}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Per person: <span className="text-pink-300 font-medium">{formatCurrency((expenses[cat.key] || 0) / memberCount)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                ৳
              </span>
              <input
                type="number"
                value={expenses[cat.key] || ""}
                onChange={(e) => handleChange(cat.key, e.target.value)}
                placeholder="0"
                className="input input-bordered w-full bg-base-100/60 border-slate-700 focus:border-pink-500 text-sm pl-8 text-white font-medium"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fade-in-up">
        <div className="glass-card p-4 sm:p-5 text-center bg-gradient-to-br from-pink-500/10 to-rose-500/5 border-pink-500/20">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
            Total Flat Expenses
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-pink-400 mt-1">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="glass-card p-4 sm:p-5 text-center bg-gradient-to-br from-sky-500/10 to-cyan-500/5 border-sky-500/20">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
            Active Members
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-sky-400 mt-1">{memberCount}</p>
        </div>
        <div className="glass-card p-4 sm:p-5 text-center bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
            Equal Share Per Person
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-400 mt-1">
            {formatCurrency(perPerson)}
          </p>
        </div>
      </div>

      {/* Individual Breakdown Table */}
      <div className="glass-card overflow-hidden animate-fade-in-up border-slate-800">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
            <span>👥</span> Individual Share Breakdown
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {formatCurrency(totalExpenses)} divided equally among {memberCount} members
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                {CATEGORIES.map((c) => (
                  <th key={c.key} className="text-right text-[11px] whitespace-nowrap">
                    {c.icon} {c.label}
                  </th>
                ))}
                <th className="text-right !text-purple-300 font-bold whitespace-nowrap">Total Share</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs sm:text-sm text-white font-medium">{m.name}</span>
                    </div>
                  </td>
                  {CATEGORIES.map((c) => (
                    <td
                      key={c.key}
                      className="text-right text-xs sm:text-sm text-slate-300"
                    >
                      {formatCurrency((expenses[c.key] || 0) / memberCount)}
                    </td>
                  ))}
                  <td className="text-right font-bold text-purple-300 text-xs sm:text-sm">
                    {formatCurrency(perPerson)}
                  </td>
                </tr>
              ))}
              <tr className="bg-purple-500/15 font-bold border-t-2 border-purple-500/30">
                <td className="text-purple-300 font-extrabold text-xs sm:text-sm">TOTAL</td>
                {CATEGORIES.map((c) => (
                  <td
                    key={c.key}
                    className="text-right text-purple-300 text-xs sm:text-sm font-bold"
                  >
                    {formatCurrency(expenses[c.key] || 0)}
                  </td>
                ))}
                <td className="text-right text-purple-300 text-base sm:text-lg font-extrabold">
                  {formatCurrency(totalExpenses)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
