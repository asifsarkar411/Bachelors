"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMonth } from "@/context/MonthContext";
import { getMonthName } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/meals", label: "Meal Count", icon: "🍽️" },
  { href: "/bajar", label: "Bajar List", icon: "🛒" },
  { href: "/summary", label: "Summary", icon: "📊" },
  { href: "/flat-expenses", label: "Flat Expenses", icon: "🏢" },
  { href: "/admin", label: "Admin Panel", icon: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, isSuperAdmin, logout, openLoginModal } = useAuth();
  const {
    selectedMonth,
    setSelectedMonth,
    prevMonth,
    nextMonth,
    resetToCurrentMonth,
    isCurrentMonth,
  } = useMonth();

  function closeDrawer() {
    const drawer = document.getElementById("mobile-drawer");
    if (drawer) drawer.checked = false;
  }

  return (
    <>
      {/* Desktop & Mobile Navbar */}
      <nav className="sticky top-0 z-50 glass-card !rounded-none border-x-0 border-t-0 bg-slate-900/85 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <span className="text-2xl transform group-hover:scale-110 transition-transform">
                🍛
              </span>
              <div>
                <span className="font-bold text-base sm:text-lg gradient-text tracking-tight block leading-tight">
                  Bachelor Flat
                </span>
                <span className="text-[10px] text-slate-400 block sm:hidden font-medium">
                  Meal Manager
                </span>
              </div>
            </Link>

            {/* Middle: Month Quick Navigator (Desktop) */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-base-100/70 border border-slate-700/80 shadow-inner">
              <button
                onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Previous Month"
              >
                ‹
              </button>

              <div className="flex items-center gap-1 px-1">
                <span className="text-xs font-bold text-sky-300 whitespace-nowrap">
                  📅 {getMonthName(selectedMonth)}
                </span>
                {!isCurrentMonth && (
                  <span className="badge badge-xs bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                    Archive
                  </span>
                )}
              </div>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-5 h-5 opacity-0 absolute pointer-events-none"
                id="desktop-month-picker"
              />

              <label
                htmlFor="desktop-month-picker"
                className="btn btn-ghost btn-xs px-1 text-slate-400 hover:text-sky-300 cursor-pointer"
                title="Select Specific Month"
              >
                🗓️
              </label>

              <button
                onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Next Month"
              >
                ›
              </button>

              {!isCurrentMonth && (
                <button
                  onClick={resetToCurrentMonth}
                  className="btn btn-ghost btn-xs text-[10px] text-sky-400 hover:text-sky-300 px-1.5 ml-0.5"
                  title="Reset to Current Month"
                >
                  Today
                </button>
              )}
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden xl:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      isActive
                        ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10"
                        : "text-slate-300 hover:text-sky-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right: User Auth Info & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isLoggedIn ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Role Badge */}
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs">
                    {isSuperAdmin ? (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                        <span>👑</span> Super Admin
                      </span>
                    ) : user?.role === "admin" ? (
                      <span className="flex items-center gap-1 text-sky-400 font-semibold text-[11px]">
                        <span>⭐</span> Admin
                      </span>
                    ) : user?.role === "sub_manager" ? (
                      <span className="flex items-center gap-1 text-purple-400 font-semibold text-[11px]">
                        <span>⭐</span> Manager
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <span>👤</span> Flat Member
                      </span>
                    )}
                    <span className="text-slate-400 text-[11px] font-mono border-l border-slate-700 pl-1.5">
                      @{user?.username}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="btn btn-ghost btn-sm text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 px-2.5"
                    title="Logout"
                  >
                    <span className="hidden sm:inline">Sign Out</span>
                    <span className="sm:hidden">🚪</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Sign In Button */}
                  <button
                    onClick={() => openLoginModal("signin")}
                    className="btn btn-ghost btn-sm text-xs font-semibold px-2.5 sm:px-3 text-slate-300 hover:text-white border border-slate-700/80 hover:bg-slate-800 flex items-center gap-1"
                  >
                    <span>🔐</span>
                    <span>Sign In</span>
                  </button>

                  {/* Sign Up / Join Flat Button */}
                  <button
                    onClick={() => openLoginModal("signup")}
                    className="btn btn-primary btn-sm text-xs font-semibold px-2.5 sm:px-3 shadow-md shadow-sky-500/20 bg-gradient-to-r from-sky-500 to-purple-600 border-0 flex items-center gap-1"
                  >
                    <span>✍️</span>
                    <span className="hidden sm:inline">Join Flat</span>
                    <span className="sm:hidden">Join</span>
                  </button>
                </div>
              )}

              {/* Mobile Drawer Hamburger */}
              <div className="xl:hidden ml-1">
                <label
                  htmlFor="mobile-drawer"
                  className="btn btn-ghost btn-sm btn-circle text-slate-300 hover:bg-slate-800"
                  aria-label="Toggle navigation menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="w-5 h-5 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </label>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <input id="mobile-drawer" type="checkbox" className="hidden peer" />
      <div className="fixed inset-0 z-[100] hidden peer-checked:flex xl:hidden">
        {/* Backdrop */}
        <label
          htmlFor="mobile-drawer"
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Drawer Content */}
        <div className="relative w-80 max-w-[85vw] bg-base-200 h-full overflow-y-auto animate-slide-in-left shadow-2xl border-r border-slate-800 flex flex-col justify-between">
          <div>
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800/80 bg-base-300/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍛</span>
                  <div>
                    <span className="font-bold text-base gradient-text">
                      Bachelor Flat
                    </span>
                    <p className="text-[10px] text-slate-400">Meal Management</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="btn btn-ghost btn-sm btn-circle text-slate-400"
                >
                  ✕
                </button>
              </div>

              {/* Mobile Month Switcher */}
              <div className="mt-3 p-2.5 rounded-xl bg-base-100/80 border border-slate-700">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <span>📅</span> Active Month:
                  </span>
                  {!isCurrentMonth && (
                    <button
                      onClick={resetToCurrentMonth}
                      className="text-[10px] text-sky-400 hover:underline"
                    >
                      Current Month
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="btn btn-ghost btn-xs text-slate-300 px-2"
                  >
                    ‹
                  </button>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="input input-bordered input-xs flex-1 bg-base-200 border-slate-700 text-xs text-center font-bold text-sky-300"
                  />
                  <button
                    onClick={nextMonth}
                    className="btn btn-ghost btn-xs text-slate-300 px-2"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Mobile Auth Status Banner */}
              <div className="mt-3 p-2.5 rounded-xl bg-base-100/60 border border-slate-700/60">
                {isLoggedIn ? (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-white truncate">
                        {user?.name || user?.username}
                      </p>
                      <p className="text-[11px] font-medium flex items-center gap-1 mt-0.5">
                        {isSuperAdmin ? (
                          <span className="text-amber-400">👑 Super Admin</span>
                        ) : user?.role === "admin" ? (
                          <span className="text-sky-400">⭐ Admin</span>
                        ) : user?.role === "sub_manager" ? (
                          <span className="text-purple-400">⭐ Manager</span>
                        ) : (
                          <span className="text-emerald-400">👤 Flat Member</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        closeDrawer();
                        logout();
                      }}
                      className="btn btn-ghost btn-xs text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs text-slate-200 font-semibold">Bachelor Flat Member</p>
                        <p className="text-[10px] text-slate-400">Sign in or request flat access</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          closeDrawer();
                          openLoginModal("signin");
                        }}
                        className="btn btn-ghost btn-xs flex-1 border border-slate-700 text-slate-300"
                      >
                        🔐 Sign In
                      </button>
                      <button
                        onClick={() => {
                          closeDrawer();
                          openLoginModal("signup");
                        }}
                        className="btn btn-primary btn-xs flex-1 bg-gradient-to-r from-sky-500 to-purple-600 border-0"
                      >
                        ✍️ Join Flat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Links - Automatically closes drawer on click */}
            <div className="p-3 flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeDrawer}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold"
                        : "text-slate-300 hover:text-sky-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Drawer Footer Developer Credit */}
          <div className="p-4 border-t border-slate-800 bg-base-300/30 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Developed by
            </p>
            <p className="text-xs font-semibold gradient-text mt-0.5">
              SM FERDOUS AHMMED (ASIF)
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
