import { useState } from 'react'
import Header from './components/Header.jsx'
import UploadSection from './components/UploadSection.jsx'
import TeamTable from './components/TeamTable.jsx'
import LoadingSection from './components/LoadingSection.jsx'
import ResultsSection from './components/ResultsSection.jsx'
import { parseTeamCSV } from './utils/csvParser.js'
import { loadPassportIndex, loadAirports, loadRoutes } from './utils/dataLoader.js'
import { scoreLocations, findUnrecognizedCitizenships } from './utils/scorer.js'

export default function App() {
  const [step, setStep] = useState('upload') // upload | team | loading | results
  const [team, setTeam] = useState([])
  const [filename, setFilename] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState('')
  const [warnings, setWarnings] = useState([])

  async function handleFileUpload(file) {
    setError(null)
    setWarnings([])
    try {
      const members = await parseTeamCSV(file)
      setTeam(members)
      setFilename(file.name)
      setStep('team')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleFindLocations() {
    setStep('loading')
    setError(null)
    try {
      setLoadingStatus('Loading visa requirements…')
      const passportIndex = await loadPassportIndex()

      setLoadingStatus('Loading airport data…')
      const airports = await loadAirports()

      setLoadingStatus('Loading flight routes…')
      const routes = await loadRoutes()

      setLoadingStatus('Calculating scores…')

      const allWarnings = []

      for (const member of team) {
        for (const iata of member.airports) {
          if (!airports.has(iata)) {
            allWarnings.push(`${member.name}: airport code "${iata}" not found in database`)
          }
        }
      }

      allWarnings.push(...findUnrecognizedCitizenships(team, passportIndex))

      setWarnings(allWarnings)

      const scored = scoreLocations(team, passportIndex, airports, routes)
      setResults(scored.slice(0, 5))
      setStep('results')
    } catch (err) {
      setError(err.message)
      setStep('team')
    }
  }

  function handleReset() {
    setStep('upload')
    setTeam([])
    setFilename('')
    setResults([])
    setError(null)
    setWarnings([])
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-5xl mx-auto px-4 pb-24">
        {error && (
          <div className="mb-6 glass-card rounded-xl p-4 border border-red-500/30 bg-red-500/10 text-red-300 text-sm animate-fade-in">
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        {step === 'upload' && (
          <UploadSection onUpload={handleFileUpload} />
        )}

        {(step === 'team' || step === 'results') && (
          <TeamTable
            team={team}
            filename={filename}
            onFindLocations={handleFindLocations}
            onReset={handleReset}
            showFindButton={step === 'team'}
          />
        )}

        {step === 'loading' && (
          <LoadingSection status={loadingStatus} />
        )}

        {step === 'results' && (
          <ResultsSection results={results} warnings={warnings} />
        )}
      </main>
    </div>
  )
}
