"use client";
import { useState, useEffect } from "react";

export default function DeveloperPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem("bf_visited");
    if (!hasVisited) {
      setTimeout(() => setShow(true), 500);
      localStorage.setItem("bf_visited", "true");
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => setShow(false)}
      />

      {/* Popup */}
      <div className="relative animate-scale-in max-w-md w-full">
        <div className="glass-card !border-sky-500/30 p-8 text-center overflow-hidden">
          {/* Decorative gradient orbs */}
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-purple-500/20 blur-3xl" />

          <div className="relative">
            {/* Logo */}
            <div className="text-5xl mb-4 animate-float">🍛</div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-2 gradient-text">
              Bachelor Flat
            </h2>
            <h3 className="text-lg text-slate-300 mb-6">
              Meal Management System
            </h3>

            {/* Divider */}
            <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-sky-500 to-purple-500 rounded mb-6" />

            {/* Developer Credit */}
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">
              Developed by
            </p>
            <p className="text-xl font-bold text-white mb-1">
              SM FERDOUS AHMMED
            </p>
            <p className="text-sm text-sky-400 font-medium mb-6">(ASIF)</p>

            {/* Close Button */}
            <button
              onClick={() => setShow(false)}
              className="btn btn-primary btn-sm px-8 rounded-full"
            >
              Enter App →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
