"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getCurrentMonth, getMonthName, formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  { key: "rent", label: "Flat Rent", icon: "🏠" },
  { key: "gas", label: "Gas Bill", icon: "🔥" },
  { key: "water", label: "Water Bill", icon: "💧" },
  { key: "maid", label: "Home Maid", icon: "🧹" },
  { key: "wifi", label: "WiFi / Internet", icon: "📶" },
  { key: "electricity", label: "Electricity", icon: "⚡" },
];

export default function FlatExpensesPage() {
  const [expenses, setExpenses] = useState({});
  const [members, setMembers] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, membersRes] = await Promise.all([
        fetch(`/api/flat-expenses?month=${month}`),
        fetch("/api/members"),
      ]);
      const expData = await expRes.json();
      const membersData = await membersRes.json();

      setMembers(Array.isArray(membersData) ? membersData : []);

      // Build map
      const map = {};
      CATEGORIES.forEach((c) => (map[c.key] = 0));
      if (Array.isArray(expData)) {
        expData.forEach((e) => {
          map[e.category] = Number(e.amount) || 0;
        });
      }
      setExpenses(map);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [month]);

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
    setSaving(true);
    setSaveMsg("");
    try {
      for (const [category, amount] of Object.entries(expenses)) {
        await fetch("/api/flat-expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month, category, amount }),
        });
      }
      setSaveMsg("✅ Saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg("❌ Error");
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
          <h1 className="text-2xl font-bold gradient-text">
            🏢 Flat Expenses
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {getMonthName(month)} — Rent, Bills & Utilities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input input-bordered input-sm bg-base-200 border-slate-700 text-sm"
          />
          <button
            onClick={saveAll}
            disabled={saving}
            className="btn btn-primary btn-sm gap-1"
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "💾"
            )}{" "}
            Save
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className="mb-4 text-sm font-medium text-center animate-fade-in">
          {saveMsg}
        </div>
      )}

      {/* Expense Categories */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 stagger-children">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="glass-card p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  {cat.label}
                </h3>
                <p className="text-[10px] text-slate-500">
                  Per person: {formatCurrency((expenses[cat.key] || 0) / memberCount)}
                </p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                ৳
              </span>
              <input
                type="number"
                value={expenses[cat.key] || ""}
                onChange={(e) => handleChange(cat.key, e.target.value)}
                placeholder="0"
                className="input input-bordered w-full bg-base-100/50 border-slate-700 focus:border-sky-500 text-sm pl-8"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6 animate-fade-in-up">
        <div className="glass-card p-5 text-center bg-gradient-to-br from-pink-500/10 to-rose-500/5 border-pink-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Total Expenses
          </p>
          <p className="text-3xl font-bold text-pink-400 mt-2">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="glass-card p-5 text-center bg-gradient-to-br from-sky-500/10 to-cyan-500/5 border-sky-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Members
          </p>
          <p className="text-3xl font-bold text-sky-400 mt-2">{memberCount}</p>
        </div>
        <div className="glass-card p-5 text-center bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20">
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Per Person
          </p>
          <p className="text-3xl font-bold text-purple-400 mt-2">
            {formatCurrency(perPerson)}
          </p>
        </div>
      </div>

      {/* Individual Breakdown Table */}
      <div className="glass-card overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span>👥</span> Individual Share
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                {CATEGORIES.map((c) => (
                  <th key={c.key} className="text-right text-[10px]">
                    {c.icon} {c.label}
                  </th>
                ))}
                <th className="text-right !text-purple-300">Total</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-white">{m.name}</span>
                    </div>
                  </td>
                  {CATEGORIES.map((c) => (
                    <td
                      key={c.key}
                      className="text-right text-sm text-slate-300"
                    >
                      {formatCurrency((expenses[c.key] || 0) / memberCount)}
                    </td>
                  ))}
                  <td className="text-right font-bold text-purple-400 text-sm">
                    {formatCurrency(perPerson)}
                  </td>
                </tr>
              ))}
              <tr className="bg-purple-500/10 font-bold">
                <td className="text-purple-300">TOTAL</td>
                {CATEGORIES.map((c) => (
                  <td
                    key={c.key}
                    className="text-right text-purple-300 text-sm"
                  >
                    {formatCurrency(expenses[c.key] || 0)}
                  </td>
                ))}
                <td className="text-right text-purple-300 text-lg">
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
