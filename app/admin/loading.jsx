export default function Loading() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-48"></div>
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-32">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-4"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 h-96"></div>
    </div>
  );
}
