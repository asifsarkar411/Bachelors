export default function StatsCard({ icon, label, value, sub, color = "sky" }) {
  const colorMap = {
    sky: "from-sky-500/20 to-sky-600/5 border-sky-500/20 text-sky-400",
    purple:
      "from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400",
    pink: "from-pink-500/20 to-pink-600/5 border-pink-500/20 text-pink-400",
    green:
      "from-green-500/20 to-green-600/5 border-green-500/20 text-green-400",
    amber:
      "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400",
    red: "from-red-500/20 to-red-600/5 border-red-500/20 text-red-400",
  };

  const cls = colorMap[color] || colorMap.sky;

  return (
    <div
      className={`glass-card stat-shimmer p-5 bg-gradient-to-br ${cls} border`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <span
          className={`text-xs font-medium uppercase tracking-wider opacity-70 ${cls.split(" ").pop()}`}
        >
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
