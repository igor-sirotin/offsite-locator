import LocationCard from './LocationCard.jsx'

export default function ResultsSection({ results, warnings }) {
  return (
    <div>
      {warnings.length > 0 && (
        <div className="mb-6 glass-card rounded-xl p-4 border border-amber-500/30 bg-amber-500/5 animate-fade-in">
          <p className="text-amber-400 text-sm font-semibold mb-2">Warnings — some airport codes were not recognized:</p>
          <ul className="text-amber-300/80 text-sm space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-100">Top 5 Locations</h2>
        <p className="text-slate-400 text-sm mt-1">
          Ranked by visa accessibility (60%) and flight travel time (40%)
        </p>
      </div>

      <div className="space-y-4">
        {results.map((result, idx) => (
          <LocationCard key={result.iata} result={result} rank={idx + 1} />
        ))}
      </div>
    </div>
  )
}
