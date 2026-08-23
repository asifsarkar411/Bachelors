"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getCurrentMonth, getMonthName, formatCurrency } from "@/lib/utils";

export default function CashPage() {
  const [members, setMembers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  // Form
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, cashRes] = await Promise.all([
        fetch("/api/members"),
        fetch(`/api/cash?month=${month}`),
      ]);
      const membersData = await membersRes.json();
      const cashData = await cashRes.json();
      setMembers(Array.isArray(membersData) ? membersData : []);
      setEntries(Array.isArray(cashData) ? cashData : []);
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
    if (!memberId || !amount) return;
    setSubmitting(true);
    try {
      const memberName =
        members.find((m) => m._id === memberId)?.name || "";
      await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          memberName,
          amount,
          date,
          note,
        }),
      });
      setAmount("");
      setNote("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/cash?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  const totalCollection = entries.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  // Per-person collection
  const personCollection = {};
  members.forEach((m) => {
    personCollection[m._id] = {
      name: m.name,
      total: 0,
    };
  });
  entries.forEach((e) => {
    if (personCollection[e.memberId]) {
      personCollection[e.memberId].total += Number(e.amount) || 0;
    }
  });

  if (loading) return <LoadingSpinner text="Loading cash collections..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            💰 Cash Collection
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {getMonthName(month)} — Track member contributions
          </p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input input-bordered input-sm bg-base-200 border-slate-700 text-sm"
        />
      </div>

      {/* Add Collection Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-card p-4 mb-6 animate-fade-in-up"
      >
        <h3 className="text-sm font-semibold text-white mb-3">
          ➕ Add Collection
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="select select-bordered select-sm bg-base-100/50 border-slate-700 text-sm"
            required
          >
            <option value="">Select Member</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount (৳)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input input-bordered input-sm bg-base-100/50 border-slate-700 text-sm"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input input-bordered input-sm bg-base-100/50 border-slate-700 text-sm"
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input input-bordered input-sm bg-base-100/50 border-slate-700 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-sm"
          >
            {submitting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Add"
            )}
          </button>
        </div>
      </form>

      {/* Per-Person Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 stagger-children">
        {Object.values(personCollection).map((p) => (
          <div key={p.name} className="glass-card p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold text-white mx-auto mb-2">
              {p.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs text-slate-400 truncate">{p.name}</p>
            <p className="text-xl font-bold text-amber-400 mt-1">
              {formatCurrency(p.total)}
            </p>
          </div>
        ))}
      </div>

      {/* Grand Total */}
      <div className="glass-card p-4 mb-6 text-center bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 animate-fade-in-up">
        <p className="text-xs text-slate-400 uppercase tracking-wider">
          Total Collection
        </p>
        <p className="text-3xl font-bold text-amber-400 mt-1">
          {formatCurrency(totalCollection)}
        </p>
      </div>

      {/* Entries Table */}
      <div className="glass-card overflow-hidden animate-fade-in-up">
        {entries.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            No cash entries for this month
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Note</th>
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
                    <td>
                      <span className="badge badge-sm bg-amber-500/15 text-amber-300 border-amber-500/30">
                        {entry.memberName || "N/A"}
                      </span>
                    </td>
                    <td className="text-sm text-slate-400">
                      {entry.note || "-"}
                    </td>
                    <td className="text-right font-medium text-amber-400 text-sm">
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
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
