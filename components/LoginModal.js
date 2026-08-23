"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginModal() {
  const {
    isLoginModalOpen,
    closeLoginModal,
    login,
    register,
    authModalTab,
    setAuthModalTab,
  } = useAuth();

  // Sign In State
  const [signInUser, setSignInUser] = useState("");
  const [signInPass, setSignInPass] = useState("");
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState("");

  // Sign Up State
  const [signUpName, setSignUpName] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpUser, setSignUpUser] = useState("");
  const [signUpPass, setSignUpPass] = useState("");
  const [signUpConfirmPass, setSignUpConfirmPass] = useState("");
  const [signUpNotes, setSignUpNotes] = useState("");
  const [showSignUpPass, setShowSignUpPass] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState("");
  const [signUpSuccessMsg, setSignUpSuccessMsg] = useState("");

  // Reset errors on modal open / tab switch
  useEffect(() => {
    setSignInError("");
    setSignUpError("");
    setSignUpSuccessMsg("");
  }, [authModalTab, isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  async function handleSignIn(e) {
    e.preventDefault();
    if (!signInUser.trim() || !signInPass) {
      setSignInError("Please enter both username and password.");
      return;
    }

    setSignInLoading(true);
    setSignInError("");

    const res = await login(signInUser.trim(), signInPass);
    if (!res.success) {
      setSignInError(res.error || "Invalid username or password");
    } else {
      setSignInUser("");
      setSignInPass("");
    }
    setSignInLoading(false);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setSignUpError("");
    setSignUpSuccessMsg("");

    if (!signUpName.trim()) {
      setSignUpError("Please enter your full name.");
      return;
    }
    if (!signUpUser.trim() || signUpUser.trim().length < 3) {
      setSignUpError("Username must be at least 3 characters long.");
      return;
    }
    if (!signUpPass || signUpPass.length < 4) {
      setSignUpError("Password must be at least 4 characters long.");
      return;
    }
    if (signUpPass !== signUpConfirmPass) {
      setSignUpError("Passwords do not match. Please re-enter.");
      return;
    }

    setSignUpLoading(true);

    const res = await register({
      name: signUpName.trim(),
      username: signUpUser.trim(),
      phone: signUpPhone.trim(),
      password: signUpPass,
      notes: signUpNotes.trim(),
    });

    if (!res.success) {
      setSignUpError(res.error || "Failed to submit sign-up request.");
    } else {
      setSignUpSuccessMsg(
        res.message ||
          "🎉 Sign-up request submitted! Your request has been sent to Super Admin for approval. Once accepted, you can log in and add to the Bajar List."
      );
      setSignUpName("");
      setSignUpPhone("");
      setSignUpUser("");
      setSignUpPass("");
      setSignUpConfirmPass("");
      setSignUpNotes("");
    }
    setSignUpLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={closeLoginModal}
      />

      {/* Modal Card */}
      <div className="relative glass-card !border-sky-500/30 p-5 sm:p-7 w-full max-w-md my-auto max-h-[92dvh] overflow-y-auto overscroll-contain animate-scale-in shadow-2xl">
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition text-sm"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center p-1 rounded-xl bg-base-100/80 border border-slate-700/80 mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthModalTab("signin");
              setSignUpSuccessMsg("");
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authModalTab === "signin"
                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🔐</span> Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthModalTab("signup")}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authModalTab === "signup"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>✍️</span> Join Flat (Sign Up)
          </button>
        </div>

        {/* ================= TAB 1: SIGN IN ================= */}
        {authModalTab === "signin" && (
          <div>
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Welcome Back
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Sign in with Super Admin, Manager, or Approved Member account
              </p>
            </div>

            {/* Error Message */}
            {signInError && (
              <div className="mb-3.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-fade-in">
                <span className="text-base shrink-0">⚠️</span>
                <span className="leading-relaxed">{signInError}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider mb-1 block">
                  Username
                </label>
                <input
                  type="text"
                  value={signInUser}
                  onChange={(e) => setSignInUser(e.target.value)}
                  placeholder="e.g. asif or member username"
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
                    onClick={() => setShowSignInPass(!showSignInPass)}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    {showSignInPass ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showSignInPass ? "text" : "password"}
                  value={signInPass}
                  onChange={(e) => setSignInPass(e.target.value)}
                  placeholder="Enter your password"
                  className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-sky-500 text-xs sm:text-sm text-white"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={signInLoading}
                className="btn btn-primary w-full shadow-lg shadow-sky-500/20 text-xs sm:text-sm font-semibold mt-3"
              >
                {signInLoading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Sign In to Flat"
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-400">
                  New member of this bachelor flat?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthModalTab("signup")}
                    className="text-purple-400 hover:underline font-semibold"
                  >
                    Sign up &amp; request access
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 2: SIGN UP / JOIN FLAT ================= */}
        {authModalTab === "signup" && (
          <div>
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Join Bachelor Flat
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Register to become a flat member. Super Admin will approve your access to Bajar and meals.
              </p>
            </div>

            {/* Success Message Banner */}
            {signUpSuccessMsg ? (
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-500/30 text-center animate-scale-in">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="font-bold text-green-300 text-sm mb-1">
                  Request Sent to Super Admin!
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {signUpSuccessMsg}
                </p>
                <div className="p-2.5 rounded-lg bg-base-100/60 border border-slate-700/60 text-[11px] text-slate-400 mb-4">
                  💡 <span className="text-amber-300 font-semibold">What happens next:</span> Super Admin will review and accept your join request in the Admin Panel. Once approved, you will be able to log in and add to the Bajar list!
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalTab("signin")}
                  className="btn btn-sm btn-primary w-full text-xs font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div>
                {/* Error Message */}
                {signUpError && (
                  <div className="mb-3.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-fade-in">
                    <span className="text-base shrink-0">⚠️</span>
                    <span className="leading-relaxed">{signUpError}</span>
                  </div>
                )}

                {/* Sign Up Form */}
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider mb-1 block">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="e.g. Md. Tanvir Ahmed"
                      className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-purple-500 text-xs sm:text-sm text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider mb-1 block">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-purple-500 text-xs sm:text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider mb-1 block">
                        Login Username *
                      </label>
                      <input
                        type="text"
                        value={signUpUser}
                        onChange={(e) => setSignUpUser(e.target.value)}
                        placeholder="e.g. tanvir12"
                        className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-purple-500 text-xs sm:text-sm text-white"
                        autoCapitalize="none"
                        autoCorrect="off"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">
                          Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowSignUpPass(!showSignUpPass)}
                          className="text-[10px] text-purple-400 hover:underline"
                        >
                          {showSignUpPass ? "Hide" : "Show"}
                        </button>
                      </div>
                      <input
                        type={showSignUpPass ? "text" : "password"}
                        value={signUpPass}
                        onChange={(e) => setSignUpPass(e.target.value)}
                        placeholder="Min 4 characters"
                        className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-purple-500 text-xs sm:text-sm text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider mb-1 block">
                        Confirm Password *
                      </label>
                      <input
                        type={showSignUpPass ? "text" : "password"}
                        value={signUpConfirmPass}
                        onChange={(e) => setSignUpConfirmPass(e.target.value)}
                        placeholder="Re-enter password"
                        className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-purple-500 text-xs sm:text-sm text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Room / Flat Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={signUpNotes}
                      onChange={(e) => setSignUpNotes(e.target.value)}
                      placeholder="e.g. Master Bedroom / Bed 2"
                      className="input input-bordered input-sm w-full bg-base-100/70 border-slate-700 focus:border-purple-500 text-xs text-white"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={signUpLoading}
                      className="btn w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20 text-xs sm:text-sm font-semibold border-0"
                    >
                      {signUpLoading ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        "🚀 Submit Request to Super Admin"
                      )}
                    </button>
                  </div>

                  <div className="pt-1 text-center">
                    <p className="text-[11px] text-slate-400">
                      Already have an approved account?{" "}
                      <button
                        type="button"
                        onClick={() => setAuthModalTab("signin")}
                        className="text-sky-400 hover:underline font-semibold"
                      >
                        Sign In here
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
