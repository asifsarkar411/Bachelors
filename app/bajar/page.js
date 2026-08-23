"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getCurrentMonth, getMonthName, formatCurrency } from "@/lib/utils";

export default function BajarPage() {
  const [members, setMembers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [boughtBy, setBoughtBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, bajarRes] = await Promise.all([
        fetch("/api/members"),
        fetch(`/api/bajar?month=${month}`),
      ]);
      const membersData = await membersRes.json();
      const bajarData = await bajarRes.json();
      setMembers(Array.isArray(membersData) ? membersData : []);
      setEntries(Array.isArray(bajarData) ? bajarData : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description || !amount || !boughtBy) return;
    setSubmitting(true);
    try {
      const memberName = members.find((m) => m._id === boughtBy)?.name || "";
      await fetch("/api/bajar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description,
          amount,
          boughtBy,
          boughtByName: memberName,
        }),
      });
      setDescription("");
      setAmount("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/bajar?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  const totalAmount = entries.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  // Per-person spending summary
  const personSpending = {};
  entries.forEach((e) => {
    const name = e.boughtByName || "Unknown";
    personSpending[name] = (personSpending[name] || 0) + (Number(e.amount) || 0);
  });

  if (loading) return <LoadingSpinner text="Loading bajar list..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold gradient-text">🛒 Bajar List</h1>
          <p className="text-sm text-slate-400 mt-1">
            {getMonthName(month)} — Manage market expenses
          </p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input input-bordered input-sm bg-base-200 border-slate-700 text-sm"
        />
      </div>

      {/* Add Entry Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-card p-4 mb-6 animate-fade-in-up"
      >
        <h3 className="text-sm font-semibold text-white mb-3">
          ➕ Add New Entry
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input input-bordered input-sm bg-base-100/50 border-slate-700 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Description (e.g. Rice, Fish)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input input-bordered input-sm bg-base-100/50 border-slate-700 text-sm"
            required
          />
          <input
            type="number"
            placeholder="Amount (৳)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input input-bordered input-sm bg-base-100/50 border-slate-700 text-sm"
            required
          />
          <select
            value={boughtBy}
            onChange={(e) => setBoughtBy(e.target.value)}
            className="select select-bordered select-sm bg-base-100/50 border-slate-700 text-sm"
            required
          >
            <option value="">Who bought?</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-sm"
          >
            {submitting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Add Entry"
            )}
          </button>
        </div>
      </form>

      {/* Per-person spending summary */}
      {Object.keys(personSpending).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 stagger-children">
          {Object.entries(personSpending).map(([name, spent]) => (
            <div key={name} className="glass-card p-3 text-center">
              <p className="text-xs text-slate-400 truncate">{name}</p>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(spent)}
              </p>
              <p className="text-[10px] text-slate-500">spent on bajar</p>
            </div>
          ))}
        </div>
      )}

      {/* Entries Table */}
      <div className="glass-card overflow-hidden animate-fade-in-up">
        {entries.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            No bajar entries for this month
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Bought By</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry._id}>
                    <td className="text-slate-500 text-sm">{i + 1}</td>
                    <td className="text-sm whitespace-nowrap">
                      {new Date(entry.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="text-sm text-white">{entry.description}</td>
                    <td>
                      <span className="badge badge-sm bg-sky-500/15 text-sky-300 border-sky-500/30">
                        {entry.boughtByName || "N/A"}
                      </span>
                    </td>
                    <td className="text-right font-medium text-green-400 text-sm">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="btn btn-ghost btn-xs text-red-400 hover:text-red-300"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-green-500/10 font-bold">
                  <td colSpan={4} className="text-green-300">
                    TOTAL
                  </td>
                  <td className="text-right text-green-300 text-lg">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
