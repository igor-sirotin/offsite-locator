import { useState } from 'react'
import LocationCard from './LocationCard.jsx'
import { scoreCustomCity, findAirportsForCity } from '../utils/scorer.js'
import { encodeTeam } from '../utils/shareEncoder.js'

const PAGE_SIZE = 5

// Parse a comma/space-separated string of IATA codes into a clean array
function parseIataCodes(str) {
  return str.toUpperCase().split(/[\s,;]+/).map(s => s.trim()).filter(s => /^[A-Z]{3}$/.test(s))
}

export default function ResultsSection({ allResults, warnings, team, scoringData, outdated }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [customResults, setCustomResults] = useState([])
  const [form, setForm] = useState({ city: '', country: '', iatas: '' })
  const [formError, setFormError] = useState(null)
  const [scoring, setScoring] = useState(false)
  const [copied, setCopied] = useState(false)
  const FILTER_DEFAULTS = { maxHours: 30, minSafety: 0, minCost: 0 }
  const [filters, setFilters] = useState(FILTER_DEFAULTS)

  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: Number(value) }))
    setVisibleCount(PAGE_SIZE)
  }

  function clearFilters() {
    setFilters(FILTER_DEFAULTS)
    setVisibleCount(PAGE_SIZE)
  }

  function handleShare() {
    const encoded = encodeTeam(team)
    const url = `${window.location.origin}${window.location.pathname}?t=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const combined = [...allResults, ...customResults]
    .sort((a, b) => b.combinedScore - a.combinedScore)

  const filtered = combined.filter(r => {
    if (r.avgHours > filters.maxHours) return false
    if ((r.safetyScore ?? 50) < filters.minSafety) return false
    if ((r.costScore ?? 50) < filters.minCost) return false
    return true
  })

  const filtersActive =
    filters.maxHours !== FILTER_DEFAULTS.maxHours ||
    filters.minSafety !== FILTER_DEFAULTS.minSafety ||
    filters.minCost !== FILTER_DEFAULTS.minCost
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setFormError(null)
  }

  async function handleAddCity(e) {
    e.preventDefault()
    const city = form.city.trim()
    const country = form.country.trim()

    if (!city) return setFormError('City name is required.')
    if (!country) return setFormError('Country is required.')

    let iatas = parseIataCodes(form.iatas)

    if (iatas.length === 0) {
      const detected = findAirportsForCity(city, scoringData.airports, scoringData.routes)
      if (detected.length === 0) {
        return setFormError(`No airport found for "${city}". Please enter IATA code(s) manually.`)
      }
      iatas = detected.map(a => a.iata)
      setForm(prev => ({ ...prev, iatas: iatas.join(', ') }))
    }

    const primaryIata = iatas[0]
    const duplicate = combined.find(r => r.iata === primaryIata)
    if (duplicate) return setFormError(`${primaryIata} is already in the list (${duplicate.city}).`)

    setScoring(true)
    setFormError(null)
    try {
      const result = scoreCustomCity(
        { city, country, iata: primaryIata, iatas, iso2: null, custom: true },
        team,
        scoringData.passportIndex,
        scoringData.airports,
        scoringData.routes,
        scoringData.safetyData,
        scoringData.costData,
      )
      setCustomResults(prev => [...prev, result])
      setForm({ city: '', country: '', iatas: '' })
      const newCombined = [...allResults, ...customResults, result]
        .sort((a, b) => b.combinedScore - a.combinedScore)
      const newRank = newCombined.findIndex(r => r.iata === primaryIata) + 1
      if (newRank > visibleCount) setVisibleCount(newRank)
    } finally {
      setScoring(false)
    }
  }

  return (
    <div className={outdated ? 'opacity-50 pointer-events-none select-none transition-opacity' : 'transition-opacity'}>
      {warnings.length > 0 && (
        <div className="mb-6 glass-card rounded-xl p-4 border border-amber-500/30 bg-amber-500/5 animate-fade-in">
          <p className="text-amber-400 text-sm font-semibold mb-2">Warnings:</p>
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
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-100">Top Locations</h2>
          <button
            onClick={handleShare}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-slate-300 hover:border-indigo-400/40 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Share link
              </>
            )}
          </button>
        </div>
        <div className="flex items-baseline justify-between gap-4 mt-1">
          <p className="text-xs text-slate-600">
            Ranked by visa accessibility (40%), cost of living (20%), flight travel time (25%), and country safety (15%)
          </p>
          <p className="shrink-0 text-xs text-slate-600">Team data is URL-encoded — nothing stored.</p>
        </div>
      </div>

      <div className="mb-4 glass-card rounded-2xl p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Filters</h3>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-slate-400 hover:text-indigo-300 transition-colors"
            >
              Clear filters
            </button>
          ) : (
            <span className="text-xs text-slate-600">All {combined.length} locations</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-xs text-slate-400">Max travel time</label>
              <span className="text-xs font-semibold text-slate-200 tabular-nums">
                {filters.maxHours >= FILTER_DEFAULTS.maxHours ? 'Any' : `≤ ${filters.maxHours}h`}
              </span>
            </div>
            <input
              type="range"
              name="maxHours"
              value={filters.maxHours}
              onChange={handleFilterChange}
              min="1"
              max="30"
              step="0.5"
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-xs text-slate-400">Min safety score</label>
              <span className="text-xs font-semibold text-slate-200 tabular-nums">
                {filters.minSafety <= 0 ? 'Any' : `≥ ${filters.minSafety}`}
              </span>
            </div>
            <input
              type="range"
              name="minSafety"
              value={filters.minSafety}
              onChange={handleFilterChange}
              min="0"
              max="100"
              step="1"
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-xs text-slate-400">Min cost score <span className="text-slate-600">(higher = cheaper)</span></label>
              <span className="text-xs font-semibold text-slate-200 tabular-nums">
                {filters.minCost <= 0 ? 'Any' : `≥ ${filters.minCost}`}
              </span>
            </div>
            <input
              type="range"
              name="minCost"
              value={filters.minCost}
              onChange={handleFilterChange}
              min="0"
              max="100"
              step="1"
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
        {filtersActive && (
          <p className="mt-3 text-xs text-slate-500">
            Showing {filtered.length} of {combined.length} {combined.length === 1 ? 'location' : 'locations'}.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {visible.map((result, idx) => (
          <LocationCard key={result.iata} result={result} rank={idx + 1} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-400">
          No locations match the current filters.
        </div>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:border-indigo-400/40 hover:text-white transition-colors"
          >
            Show more ({filtered.length - visibleCount} remaining)
          </button>
          <button
            onClick={() => setVisibleCount(filtered.length)}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Show all
          </button>
        </div>
      )}

      {/* Custom location form */}
      <div className="mt-8 glass-card rounded-2xl p-5 animate-fade-in">
        <h3 className="text-base font-semibold text-slate-100 mb-1">Add a custom location</h3>
        <p className="text-xs text-slate-500 mb-4">
          Leave airports blank to auto-detect all airports for the city. Multiple codes are supported (e.g. <span className="text-slate-400 font-mono">LHR, LGW, LCY</span>).
        </p>
        <form onSubmit={handleAddCity} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-32">
            <label className="text-xs text-slate-400">City</label>
            <input
              name="city"
              value={form.city}
              onChange={handleFormChange}
              placeholder="e.g. London"
              className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-36">
            <label className="text-xs text-slate-400">Country</label>
            <input
              name="country"
              value={form.country}
              onChange={handleFormChange}
              placeholder="e.g. United Kingdom"
              className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-36 flex-1">
            <label className="text-xs text-slate-400">Airports <span className="text-slate-600">(optional)</span></label>
            <input
              name="iatas"
              value={form.iatas}
              onChange={handleFormChange}
              placeholder="auto-detect"
              className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={scoring}
            className="gradient-btn px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {scoring ? 'Scoring…' : '+ Add & Score'}
          </button>
        </form>
        {formError && (
          <p className="mt-2 text-xs text-red-400">{formError}</p>
        )}
      </div>
    </div>
  )
}
