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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={closeLoginModal}
      />

      {/* Modal Card - Mobile Keyboard Friendly */}
      <div className="relative glass-card !border-sky-500/30 p-5 sm:p-7 w-full max-w-md my-auto max-h-[90dvh] overflow-y-auto overscroll-contain animate-scale-in shadow-2xl">
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition text-sm"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-sky-500/20">
            <span className="text-xl">🔐</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Manager &amp; Admin Login</h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Sign in as Super Admin or Assigned Sub-Manager
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider mb-1 block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-sky-500 text-xs sm:text-sm text-white"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">
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
              className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-sky-500 text-xs sm:text-sm text-white"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full shadow-lg shadow-sky-500/20 text-xs sm:text-sm font-semibold mt-2"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
