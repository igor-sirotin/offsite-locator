import { useRef, useState } from 'react'

export default function UploadSection({ onUpload, onStartEmpty }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onUpload(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }

  return (
    <div className="animate-fade-in">
      <div
        className={`glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
          dragging
            ? 'border-indigo-400/60 bg-indigo-500/10'
            : 'border-white/10 hover:border-indigo-400/40 hover:bg-white/[0.03]'
        }`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className={`w-16 h-16 rounded-2xl mb-5 flex items-center justify-center transition-all duration-300 ${
          dragging ? 'bg-indigo-500/30' : 'bg-white/[0.06]'
        }`}>
          <svg className={`w-8 h-8 transition-colors duration-300 ${dragging ? 'text-indigo-300' : 'text-slate-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-slate-100 mb-2">Upload your team CSV</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-xs">
          Drag and drop your file here, or click to browse
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="gradient-btn px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
          >
            Choose File
          </button>
          <a
            href="/team_template.csv"
            download
            onClick={e => e.stopPropagation()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors"
          >
            Download Template
          </a>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={onStartEmpty}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          or start without a file →
        </button>
      </div>

      <div className="mt-4 glass-card rounded-xl p-4 text-xs text-slate-500">
        <p className="font-medium text-slate-400 mb-1">Expected CSV format:</p>
        <code className="text-indigo-300">name, city, country, citizenships, airports</code>
        <p className="mt-1">Citizenships and airports are semicolon-separated (e.g. <code className="text-indigo-300">DE;US</code> or <code className="text-indigo-300">JFK;EWR</code>)</p>
      </div>
    </div>
  )
}
