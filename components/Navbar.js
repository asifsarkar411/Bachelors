"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/meals", label: "Meal Count", icon: "🍽️" },
  { href: "/bajar", label: "Bajar List", icon: "🛒" },
  { href: "/cash", label: "Cash", icon: "💰" },
  { href: "/summary", label: "Summary", icon: "📊" },
  { href: "/flat-expenses", label: "Flat Expenses", icon: "🏢" },
  { href: "/admin", label: "Admin", icon: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="sticky top-0 z-50 glass-card !rounded-none border-x-0 border-t-0">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🍛</span>
              <span className="font-bold text-lg gradient-text hidden sm:inline">
                Bachelor Flat
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    pathname === link.href
                      ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                      : "text-slate-400 hover:text-sky-300 hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <label
                htmlFor="mobile-drawer"
                className="btn btn-ghost btn-sm btn-circle"
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
      </nav>

      {/* Mobile Drawer */}
      <input id="mobile-drawer" type="checkbox" className="hidden peer" />
      <div className="fixed inset-0 z-[100] hidden peer-checked:flex lg:hidden">
        <label
          htmlFor="mobile-drawer"
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <div className="relative w-72 max-w-[80vw] bg-base-200 h-full overflow-y-auto animate-slide-in-left shadow-2xl">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍛</span>
                <span className="font-bold text-lg gradient-text">
                  Bachelor Flat
                </span>
              </div>
              <label
                htmlFor="mobile-drawer"
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </label>
            </div>
          </div>
          <div className="p-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <label key={link.href} htmlFor="mobile-drawer">
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    pathname === link.href
                      ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                      : "text-slate-400 hover:text-sky-300 hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
