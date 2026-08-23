"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoginModalOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please fill in both fields");
      return;
    }

    setLoading(true);
    setError("");

    const res = await login(username.trim(), password);
    if (!res.success) {
      setError(res.error || "Invalid username or password");
    } else {
      setUsername("");
      setPassword("");
    }
    setLoading(false);
  }

  function handleFillSuperAdmin() {
    setUsername("asif");
    setPassword("Asif@123");
    setError("");
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={closeLoginModal}
      />

      {/* Modal Card */}
      <div className="relative glass-card !border-sky-500/30 p-6 sm:p-8 w-full max-w-md animate-scale-in shadow-2xl">
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/20">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-xl font-bold text-white">Manager & Admin Login</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in as Super Admin or Assigned Sub-Manager
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-300 font-medium uppercase tracking-wider mb-1 block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. asif"
              className="input input-bordered w-full bg-base-100/60 border-slate-700 focus:border-sky-500 text-sm text-white"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-300 font-medium uppercase tracking-wider block">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-sky-400 hover:underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input input-bordered w-full bg-base-100/60 border-slate-700 focus:border-sky-500 text-sm text-white"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full shadow-lg shadow-sky-500/20 text-sm mt-2"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Quick hint badge for Super Admin */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 mb-2">Super Admin Access:</p>
          <button
            type="button"
            onClick={handleFillSuperAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs hover:bg-sky-500/20 transition cursor-pointer"
          >
            <span>👑</span> Auto-Fill Super Admin (asif)
          </button>
        </div>
      </div>
    </div>
  );
}
