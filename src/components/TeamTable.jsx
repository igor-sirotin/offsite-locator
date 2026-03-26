import { useState } from 'react'

function downloadTeamCSV(team) {
  const header = 'name,residence,citizenships,airports'
  const rows = team.map(m =>
    [m.name, m.residence, m.citizenships.join(';'), m.airports.join(';')]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'team.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function parseMemberDraft(d, id) {
  return {
    id,
    name: d.name.trim(),
    residence: d.residence.trim(),
    citizenships: d.citizenships.split(';').map(s => s.trim()).filter(Boolean),
    airports: d.airports.split(';').map(s => s.trim().toUpperCase()).filter(Boolean),
  }
}

const BLANK = { name: '', residence: '', citizenships: '', airports: '' }

const IATA_RE = /^[A-Z]{3}$/

function validate(d) {
  const errors = {}
  if (!d.name.trim()) {
    errors.name = 'Required'
  }
  if (!d.residence.trim()) {
    errors.residence = 'Required'
  }
  const citizenshipList = d.citizenships.split(';').map(s => s.trim()).filter(Boolean)
  if (citizenshipList.length === 0) {
    errors.citizenships = 'At least one passport required'
  }
  const airportList = d.airports.split(';').map(s => s.trim().toUpperCase()).filter(Boolean)
  if (airportList.length === 0) {
    errors.airports = 'At least one airport required'
  } else {
    const bad = airportList.filter(a => !IATA_RE.test(a))
    if (bad.length > 0) {
      errors.airports = `Invalid IATA code${bad.length > 1 ? 's' : ''}: ${bad.join(', ')}`
    }
  }
  return errors
}

function inputCls(hasError) {
  return `w-full bg-white/[0.06] border rounded px-2 py-1 text-slate-100 text-sm focus:outline-none placeholder:text-slate-600 transition-colors ${
    hasError ? 'border-red-500/60 focus:border-red-500/80' : 'border-white/10 focus:border-indigo-500/50'
  }`
}

function EditCells({ d, setD, onSave, onCancel, errors = {}, touched = {}, onBlur }) {
  function onKeyDown(e) {
    if (e.key === 'Enter') onSave()
    if (e.key === 'Escape') onCancel()
  }
  function field(name) {
    return {
      value: d[name],
      onChange: e => setD({ ...d, [name]: e.target.value }),
      onBlur: () => onBlur?.(name),
      onKeyDown,
    }
  }
  return (
    <>
      <td className="py-2 px-4">
        <input className={inputCls(touched.name && errors.name)} placeholder="Name" autoFocus {...field('name')} />
        {touched.name && errors.name && <p className="text-red-400 text-xs mt-0.5">{errors.name}</p>}
      </td>
      <td className="py-2 px-4">
        <input className={inputCls(touched.residence && errors.residence)} placeholder="Germany" {...field('residence')} />
        {touched.residence && errors.residence && <p className="text-red-400 text-xs mt-0.5">{errors.residence}</p>}
      </td>
      <td className="py-2 px-4">
        <input className={inputCls(touched.citizenships && errors.citizenships)} placeholder="Germany;United States" {...field('citizenships')} />
        {touched.citizenships && errors.citizenships && <p className="text-red-400 text-xs mt-0.5">{errors.citizenships}</p>}
      </td>
      <td className="py-2 px-4">
        <input className={inputCls(touched.airports && errors.airports)} placeholder="BER;MUC" {...field('airports')} />
        {touched.airports && errors.airports && <p className="text-red-400 text-xs mt-0.5">{errors.airports}</p>}
      </td>
      <td className="py-2 px-4">
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={onSave}
            className="text-xs px-2 py-1 rounded bg-indigo-500/30 text-indigo-300 hover:bg-indigo-500/50 transition-colors"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="text-xs px-2 py-1 rounded bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </td>
    </>
  )
}

export default function TeamTable({ team, filename, onFindLocations, onReset, onTeamChange, onRecalculate, showFindButton, resultsOutdated }) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(BLANK)
  const [draftTouched, setDraftTouched] = useState({})
  const [addingNew, setAddingNew] = useState(false)
  const [newDraft, setNewDraft] = useState(BLANK)
  const [newTouched, setNewTouched] = useState({})

  const ALL_TOUCHED = { name: true, residence: true, citizenships: true, airports: true }

  function startEdit(member) {
    setAddingNew(false)
    setEditingId(member.id)
    setDraftTouched({})
    setDraft({
      name: member.name,
      residence: member.residence,
      citizenships: member.citizenships.join(';'),
      airports: member.airports.join(';'),
    })
  }

  function saveEdit() {
    const errors = validate(draft)
    if (Object.keys(errors).length > 0) { setDraftTouched(ALL_TOUCHED); return }
    onTeamChange(team.map(m => m.id === editingId ? parseMemberDraft(draft, m.id) : m))
    setEditingId(null)
  }

  function startAdd() {
    setEditingId(null)
    setAddingNew(true)
    setNewDraft(BLANK)
    setNewTouched({})
  }

  function saveNew() {
    const errors = validate(newDraft)
    if (Object.keys(errors).length > 0) { setNewTouched(ALL_TOUCHED); return }
    const nextId = team.length > 0 ? Math.max(...team.map(m => m.id)) + 1 : 0
    onTeamChange([...team, parseMemberDraft(newDraft, nextId)])
    setAddingNew(false)
    setNewDraft(BLANK)
    setNewTouched({})
  }

  function removeMember(id) {
    if (editingId === id) setEditingId(null)
    onTeamChange(team.filter(m => m.id !== id))
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            {team.length} team member{team.length !== 1 ? 's' : ''}
          </h2>
          {filename && <p className="text-xs text-slate-500 mt-0.5">from {filename}</p>}
        </div>
        <div className="flex gap-2">
          {team.length > 0 && (
            <button
              onClick={() => downloadTeamCSV(team)}
              className="text-xs text-slate-400 hover:text-slate-200 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download CSV
            </button>
          )}
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-slate-200 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            {filename ? 'Upload new file' : 'Start over'}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Residence</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Passports</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Origin Airports</th>
                <th className="py-3 px-4 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {team.map((member, idx) => (
                <tr
                  key={member.id}
                  className={`border-b border-white/[0.04] last:border-0 transition-colors ${
                    editingId === member.id
                      ? 'bg-white/[0.04]'
                      : `hover:bg-white/[0.03] ${idx % 2 === 0 ? '' : 'bg-white/[0.015]'}`
                  }`}
                >
                  {editingId === member.id ? (
                    <EditCells
                      d={draft} setD={setDraft}
                      onSave={saveEdit} onCancel={() => setEditingId(null)}
                      errors={validate(draft)} touched={draftTouched}
                      onBlur={f => setDraftTouched(t => ({ ...t, [f]: true }))}
                    />
                  ) : (
                    <>
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
                      <td className="py-3 px-4">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => startEdit(member)}
                            className="p-1.5 rounded text-slate-600 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeMember(member.id)}
                            className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
                            title="Remove"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {addingNew && (
                <tr className="border-t border-white/[0.08] bg-white/[0.04]">
                  <EditCells
                    d={newDraft} setD={setNewDraft}
                    onSave={saveNew} onCancel={() => { setAddingNew(false); setNewDraft(BLANK); setNewTouched({}) }}
                    errors={validate(newDraft)} touched={newTouched}
                    onBlur={f => setNewTouched(t => ({ ...t, [f]: true }))}
                  />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={startAdd}
          disabled={addingNew}
          className="text-xs text-slate-400 hover:text-slate-200 border border-dashed border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add member
        </button>
      </div>

      {showFindButton && (
        <div className="flex justify-center">
          <button
            onClick={onFindLocations}
            disabled={team.length === 0}
            className="gradient-btn px-8 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg shadow-indigo-500/25 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Find Best Locations
          </button>
        </div>
      )}

      {resultsOutdated && (
        <div className="flex justify-center">
          <button
            onClick={onRecalculate}
            disabled={team.length === 0}
            className="gradient-btn px-8 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg shadow-indigo-500/25 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Recalculate Results
          </button>
        </div>
      )}
    </div>
  )
}
