export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <span className="loading loading-ring loading-lg text-sky-400" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}
