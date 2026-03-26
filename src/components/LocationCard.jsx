import { useState } from 'react'
import { getFlagEmoji } from '../data/candidateCities.js'

// Literal class names required so Tailwind's scanner includes them in the CSS bundle.
// Do not convert these to template literals.
const RANK_STYLES = {
  1: { badge: 'bg-amber-400/20 text-amber-300 border-amber-400/30', ring: 'ring-1 ring-amber-400/20', label: '1st', anim: 'animate-fade-in-delay-1' },
  2: { badge: 'bg-slate-400/20 text-slate-300 border-slate-400/30', ring: 'ring-1 ring-slate-400/20', label: '2nd', anim: 'animate-fade-in-delay-2' },
  3: { badge: 'bg-orange-700/30 text-orange-300 border-orange-700/30', ring: 'ring-1 ring-orange-600/20', label: '3rd', anim: 'animate-fade-in-delay-3' },
  4: { badge: 'bg-white/5 text-slate-400 border-white/10', ring: '', label: '4th', anim: 'animate-fade-in-delay-4' },
  5: { badge: 'bg-white/5 text-slate-400 border-white/10', ring: '', label: '5th', anim: 'animate-fade-in-delay-5' },
}

const TRAVEL_TYPE_STYLES = {
  direct:    { label: 'Direct',    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  one_stop:  { label: '1 Stop',    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  two_plus:  { label: '2+ Stops',  cls: 'bg-orange-500/15 text-orange-300 border-orange-500/25' },
  no_route:  { label: 'No Route',  cls: 'bg-red-500/15 text-red-300 border-red-500/25' },
}

const VISA_TYPE_STYLES = {
  free:     { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  easy:     { cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  required: { cls: 'bg-red-500/15 text-red-300 border-red-500/25' },
  blocked:  { cls: 'bg-red-700/20 text-red-400 border-red-700/30' },
  unknown:  { cls: 'bg-white/5 text-slate-400 border-white/10' },
}

function ScoreBar({ score, colorClass }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${colorClass}`}
        style={{ width: `${Math.max(2, score)}%` }}
      />
    </div>
  )
}

function scoreColor(score) {
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function formatHours(h) {
  if (h >= 30) return '30h+'
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export default function LocationCard({ result, rank }) {
  const [expanded, setExpanded] = useState(false)
  const style = RANK_STYLES[rank] || RANK_STYLES[5]

  const flag = getFlagEmoji(result.iso2)

  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${style.ring} ${style.anim}`}>
      {/* Main row */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Rank badge */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex flex-col items-center justify-center ${style.badge}`}>
            <span className="text-xs font-bold leading-none">{style.label}</span>
          </div>

          {/* City info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-100">
                {flag && <span className="mr-1">{flag}</span>}
                {result.city}
              </h3>
              <span className="text-sm text-slate-400">{result.country}</span>
              <span className="text-xs font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{result.iata}</span>
            </div>

            {/* Score bars */}
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Visa</span>
                  <span className="text-xs font-semibold text-slate-200">{result.easyCount}/{result.totalMembers} easy</span>
                </div>
                <ScoreBar score={result.visaScore} colorClass={scoreColor(result.visaScore)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Travel</span>
                  <span className="text-xs font-semibold text-slate-200">avg {formatHours(result.avgHours)}</span>
                </div>
                <ScoreBar score={result.travelScore} colorClass={scoreColor(result.travelScore)} />
              </div>
            </div>
          </div>

          {/* Combined score */}
          <div className="flex-shrink-0 text-right">
            <div className="text-3xl font-bold gradient-text leading-none">{Math.round(result.combinedScore)}</div>
            <div className="text-xs text-slate-500 mt-1">/ 100</div>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? 'Hide' : 'Show'} team details
        </button>
      </div>

      {/* Expanded per-member table */}
      {expanded && (
        <div className="border-t border-white/[0.06]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left py-2 px-5 font-medium text-slate-500">Member</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Best Passport</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Visa Status</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Est. Travel</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500 pr-5">Connection</th>
                </tr>
              </thead>
              <tbody>
                {result.visaPerMember.map((vm, idx) => {
                  const tm = result.travelPerMember[idx]
                  const visaStyle = VISA_TYPE_STYLES[vm.type] || VISA_TYPE_STYLES.unknown
                  const travelStyle = TRAVEL_TYPE_STYLES[tm?.type] || TRAVEL_TYPE_STYLES.no_route
                  return (
                    <tr key={vm.name} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                      <td className="py-2.5 px-5 text-slate-200 font-medium">{vm.name}</td>
                      <td className="py-2.5 px-3">
                        {vm.passport
                          ? <span className="font-mono text-indigo-300">{vm.passport}</span>
                          : <span className="text-slate-600">—</span>
                        }
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded border text-xs ${visaStyle.cls}`}>
                          {vm.label || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono">
                        {tm ? formatHours(tm.hours) : '—'}
                        {tm?.origin && tm.origin !== result.iata && (
                          <span className="ml-1 text-slate-500">from {tm.origin}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 pr-5">
                        <span className={`inline-block px-2 py-0.5 rounded border text-xs ${travelStyle.cls}`}>
                          {travelStyle.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
