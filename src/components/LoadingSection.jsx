export default function LoadingSection({ status }) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-white/5" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin-slow" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-violet-400 animate-spin" style={{ animationDuration: '0.8s' }} />
      </div>
      <div className="text-center">
        <p className="text-slate-300 font-medium">{status || 'Loading…'}</p>
        <p className="text-slate-500 text-sm mt-1">Fetching open data sources</p>
      </div>
    </div>
  )
}
