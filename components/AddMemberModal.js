"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AddMemberModal({ onAdd, isOpen, onClose }) {
  const { canManageMembersAndMeals, openLoginModal } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    if (!canManageMembersAndMeals) {
      setError("Only Admin and Super Admin can add members.");
      openLoginModal();
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onAdd({ name: name.trim(), phone: phone.trim() });
      setName("");
      setPhone("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add member");
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card - Responsive and Mobile Keyboard Friendly */}
      <div className="relative glass-card !border-sky-500/30 p-5 sm:p-6 w-full max-w-sm my-auto max-h-[90dvh] overflow-y-auto overscroll-contain animate-scale-in shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700/60">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>👤</span> Add New Member
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider mb-1 block">
              Member Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tanvir, Rakib"
              className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-sky-500 text-xs sm:text-sm text-white"
              autoCapitalize="words"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider mb-1 block">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 017XXXXXXXX"
              className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-sky-500 text-xs sm:text-sm text-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm flex-1 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn btn-primary btn-sm flex-1 text-xs font-semibold shadow-md shadow-sky-500/20"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Add Member"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
