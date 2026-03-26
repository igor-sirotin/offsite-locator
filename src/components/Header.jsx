export default function Header() {
  return (
    <>
      <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-center text-sm text-amber-300">
        <span className="font-semibold">Data disclaimer:</span> Scores are estimates based on public datasets and may be outdated or inaccurate.
        <div className="mt-1.5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-amber-400/70 text-xs">
          <span>Visa: <a href="https://github.com/imorte/passport-index-data" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">passport-index-data</a></span>
          <span>Flight routes: <a href="https://github.com/Jonty/airline-route-data" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">airline-route-data</a></span>
          <span>Airports: <a href="https://github.com/davidmegginson/ourairports-data" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">OurAirports</a></span>
          <span>Safety: <a href="https://data.worldbank.org/indicator/PV.EST" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">World Bank PV.EST</a></span>
          <span>Cost: <a href="https://data.worldbank.org/indicator/PA.NUS.PPPC.RF" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">World Bank PA.NUS.PPPC.RF</a></span>
        </div>
      </div>
      <header className="py-10 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight">Offsite Locator</h1>
        </div>
        <p className="text-slate-400 text-base max-w-md mx-auto">
          Find the perfect city for your team offsite — optimized for visa-free travel and flight accessibility.
        </p>
      </header>
    </>
  )
}
