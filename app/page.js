"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import StatsCard from "@/components/StatsCard";
import AddMemberModal from "@/components/AddMemberModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getCurrentMonth, getMonthName, formatCurrency } from "@/lib/utils";

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
    desc: "Overall calculation",
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
    desc: "Manage everything",
    color: "from-slate-500/10 to-gray-500/5 border-slate-500/20",
  },
];

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const currentMonth = getCurrentMonth();

  async function fetchData() {
    try {
      const [membersRes, summaryRes] = await Promise.all([
        fetch("/api/members"),
        fetch(`/api/summary?month=${currentMonth}`),
      ]);
      const membersData = await membersRes.json();
      const summaryData = await summaryRes.json();
      setMembers(Array.isArray(membersData) ? membersData : []);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleAddMember(data) {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) fetchData();
  }

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold gradient-text mb-2">Dashboard</h1>
        <p className="text-slate-400 text-sm">
          {getMonthName(currentMonth)} — {members.length} Active Members
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
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
          sub="This month"
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
          sub="Per meal"
          color="green"
        />
      </div>

      {/* Members Section + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Members List */}
        <div className="lg:col-span-1 glass-card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span>👥</span> Members
            </h2>
            <button
              onClick={() => setShowAddMember(true)}
              className="btn btn-primary btn-xs gap-1"
            >
              <span>+</span> Add
            </button>
          </div>
          {members.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No members yet. Add your first member!
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {members.map((m, i) => (
                <div
                  key={m._id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-base-100/40 hover:bg-base-100/60 transition-all"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {m.name}
                    </p>
                    {m.phone && (
                      <p className="text-xs text-slate-500">{m.phone}</p>
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>🚀</span> Quick Navigation
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`glass-card p-4 bg-gradient-to-br ${link.color} border group block`}
              >
                <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform duration-200">
                  {link.icon}
                </span>
                <h3 className="font-semibold text-white text-sm mb-0.5">
                  {link.title}
                </h3>
                <p className="text-xs text-slate-400">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Meal Overview */}
      {summary && summary.members && summary.members.length > 0 && (
        <div className="glass-card p-5 animate-fade-in-up">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>💹</span> Meal Overview
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-base-100/40 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Cost</p>
              <p className="text-lg font-bold text-pink-400">
                {formatCurrency(summary.totalCost)}
              </p>
            </div>
            <div className="bg-base-100/40 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Meals</p>
              <p className="text-lg font-bold text-purple-400">
                {summary.grandTotalMeals}
              </p>
            </div>
            <div className="bg-base-100/40 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Meal Rate</p>
              <p className="text-lg font-bold text-sky-400">
                {formatCurrency(summary.mealRate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={handleAddMember}
      />
    </div>
  );
}
