export default function TeamTable({ team, filename, onFindLocations, onReset, showFindButton }) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            {team.length} team member{team.length !== 1 ? 's' : ''} loaded
          </h2>
          {filename && (
            <p className="text-xs text-slate-500 mt-0.5">from {filename}</p>
          )}
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-slate-200 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          Upload new file
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Residence</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Passports</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Origin Airports</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member, idx) => (
                <tr
                  key={member.id}
                  className={`border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors ${
                    idx % 2 === 0 ? '' : 'bg-white/[0.015]'
                  }`}
                >
                  <td className="py-3 px-4 text-slate-100 font-medium">{member.name}</td>
                  <td className="py-3 px-4 text-slate-300">{member.residence}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {member.citizenships.map(c => (
                        <span key={c} className="px-1.5 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {member.airports.map(a => (
                        <span key={a} className="px-1.5 py-0.5 rounded text-xs bg-violet-500/20 text-violet-300 border border-violet-500/20 font-mono">
                          {a}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showFindButton && (
        <div className="flex justify-center">
          <button
            onClick={onFindLocations}
            className="gradient-btn px-8 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg shadow-indigo-500/25 flex items-center gap-2.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Find Best Locations
          </button>
        </div>
      )}
    </div>
  )
}
