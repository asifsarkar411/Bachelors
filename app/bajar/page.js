"use client";
import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getMonthName, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useMonth } from "@/context/MonthContext";

export default function BajarPage() {
  const {
    user,
    isLoggedIn,
    isSuperAdmin,
    isAdminOrManager,
    canAddBajar,
    openLoginModal,
  } = useAuth();
  const { selectedMonth, setSelectedMonth } = useMonth();

  const [members, setMembers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [boughtBy, setBoughtBy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, bajarRes] = await Promise.allSettled([
        fetch("/api/members"),
        fetch(`/api/bajar?month=${selectedMonth}`),
      ]);

      if (membersRes.status === "fulfilled" && membersRes.value.ok) {
        const membersData = await membersRes.value.json();
        setMembers(Array.isArray(membersData) ? membersData : []);
      }

      if (bajarRes.status === "fulfilled" && bajarRes.value.ok) {
        const bajarData = await bajarRes.value.json();
        setEntries(Array.isArray(bajarData) ? bajarData : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pre-select boughtBy if current user is linked to a member
  useEffect(() => {
    if (user && members.length > 0 && !boughtBy) {
      const matching = members.find(
        (m) =>
          (user.memberId && m._id === user.memberId) ||
          (user.username && m.username === user.username) ||
          (user.name && m.name.toLowerCase() === user.name.toLowerCase())
      );
      if (matching) {
        setBoughtBy(matching._id);
      }
    }
  }, [user, members, boughtBy]);

  // Handle Add Bajar Entry (Only approved members, managers, and super admin)
  async function handleSubmit(e) {
    e.preventDefault();
    if (!canAddBajar) {
      openLoginModal("signin");
      return;
    }

    if (!description.trim() || !amount || !boughtBy) return;

    setSubmitting(true);
    setSubmitMsg("");
    try {
      const memberName = members.find((m) => m._id === boughtBy)?.name || "";
      const res = await fetch("/api/bajar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description: description.trim(),
          amount: Number(amount),
          boughtBy,
          boughtByName: memberName,
        }),
      });

      if (res.ok) {
        setDescription("");
        setAmount("");
        setSubmitMsg("✅ Bajar entry added successfully!");
        fetchData();
        setTimeout(() => setSubmitMsg(""), 3500);
      } else {
        const errData = await res.json();
        setSubmitMsg(`❌ ${errData.error || "Error adding entry"}`);
      }
    } catch (err) {
      setSubmitMsg("❌ Error adding entry");
      console.error(err);
    }
    setSubmitting(false);
  }

  async function handleDelete(id) {
    if (!canAddBajar) {
      alert("Only accepted flat members & admins can delete bajar entries.");
      return;
    }

    if (!confirm("Delete this bajar entry?")) return;
    try {
      await fetch(`/api/bajar?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
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

  if (loading) return <LoadingSpinner text="Loading bajar list records..." />;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
              🛒 Bajar List
            </h1>
            {canAddBajar ? (
              <span className="badge badge-sm bg-green-500/20 text-green-300 border-green-500/40 text-[10px] font-bold">
                ✓ Approved Access
              </span>
            ) : (
              <span className="badge badge-sm bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                🔒 Member Access Only
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {getMonthName(selectedMonth)} — Market &amp; grocery expense records
          </p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="input input-bordered input-sm bg-base-200 border-slate-700 text-xs sm:text-sm text-sky-300 font-bold"
        />
      </div>

      {submitMsg && (
        <div className="mb-4 p-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs sm:text-sm font-medium text-center animate-fade-in">
          {submitMsg}
        </div>
      )}

      {/* Access Gate: If user is an approved member / admin, render input form. Otherwise render locked prompt card */}
      {canAddBajar ? (
        <form
          onSubmit={handleSubmit}
          className="glass-card p-4 sm:p-5 mb-6 animate-fade-in-up border-slate-800 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-green-950/20"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
              <span>➕</span> Input New Bajar Entry
            </h3>
            <span className="text-[11px] text-green-400 font-medium">
              Posting as: {user?.name || user?.username}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 text-xs sm:text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Chicken, Rice, Oil"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 text-xs sm:text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Amount (৳)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 850"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 text-xs sm:text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Who bought?</label>
              <select
                value={boughtBy}
                onChange={(e) => setBoughtBy(e.target.value)}
                className="select select-bordered select-sm w-full bg-base-100/70 border-slate-700 text-xs sm:text-sm text-white"
                required
              >
                <option value="">Select Member</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-sm w-full text-xs sm:text-sm font-semibold shadow-md shadow-sky-500/20"
              >
                {submitting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Add Bajar Entry"
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="glass-card p-5 sm:p-6 mb-6 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/50 to-purple-500/10 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-2xl shadow-inner">
                🔒
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Add Bajar List Requires Flat Membership Approval
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
                  Only flat members accepted by the Super Admin can input market &amp; grocery expenses. If you are already a member or wish to join, please Sign In or Sign Up below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openLoginModal("signin")}
                className="btn btn-ghost btn-sm text-xs font-semibold border border-slate-700 text-slate-300 hover:text-white"
              >
                🔐 Sign In
              </button>
              <button
                onClick={() => openLoginModal("signup")}
                className="btn btn-primary btn-sm text-xs font-semibold bg-gradient-to-r from-sky-500 to-purple-600 border-0 shadow-md shadow-sky-500/20"
              >
                ✍️ Join Flat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Per-person spending summary */}
      {Object.keys(personSpending).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Individual Bajar Contribution ({getMonthName(selectedMonth)})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
            {Object.entries(personSpending).map(([name, spent]) => (
              <div key={name} className="glass-card p-3 text-center">
                <p className="text-xs text-slate-400 truncate">{name}</p>
                <p className="text-lg font-bold text-green-400 mt-0.5">
                  {formatCurrency(spent)}
                </p>
                <p className="text-[10px] text-slate-500">spent on bajar</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="glass-card overflow-hidden animate-fade-in-up border-slate-800">
        {entries.length === 0 ? (
          <p className="text-center text-slate-500 py-12 text-sm">
            No bajar entries recorded for {getMonthName(selectedMonth)}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Bought By</th>
                  <th className="text-right">Amount</th>
                  {canAddBajar && <th className="text-center w-16">Action</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry._id}>
                    <td className="text-slate-500 text-xs sm:text-sm">{i + 1}</td>
                    <td className="text-xs sm:text-sm whitespace-nowrap">
                      {new Date(entry.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="text-xs sm:text-sm text-white font-medium">
                      {entry.description}
                    </td>
                    <td>
                      <span className="badge badge-sm bg-sky-500/15 text-sky-300 border-sky-500/30 text-xs">
                        {entry.boughtByName || "N/A"}
                      </span>
                    </td>
                    <td className="text-right font-semibold text-green-400 text-xs sm:text-sm">
                      {formatCurrency(entry.amount)}
                    </td>
                    {canAddBajar && (
                      <td className="text-center">
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="btn btn-ghost btn-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          title="Delete entry"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-green-500/10 font-bold border-t-2 border-green-500/20">
                  <td colSpan={4} className="text-green-300 font-extrabold text-xs sm:text-sm">
                    TOTAL BAJAR COST
                  </td>
                  <td className="text-right text-green-300 text-base sm:text-lg font-extrabold">
                    {formatCurrency(totalAmount)}
                  </td>
                  {canAddBajar && <td></td>}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
