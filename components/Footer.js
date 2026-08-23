export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/50 bg-base-200/50 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Bachelor Flat Meal Manager
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Developed by{" "}
            <span className="font-semibold gradient-text">
              SM FERDOUS AHMMED (ASIF)
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
