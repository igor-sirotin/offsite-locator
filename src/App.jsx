import { useState } from 'react'
import Header from './components/Header.jsx'
import UploadSection from './components/UploadSection.jsx'
import TeamTable from './components/TeamTable.jsx'
import LoadingSection from './components/LoadingSection.jsx'
import ResultsSection from './components/ResultsSection.jsx'
import { parseTeamCSV } from './utils/csvParser.js'
import { loadPassportIndex, loadAirports, loadRoutes, loadSafetyData, loadCostData } from './utils/dataLoader.js'
import { scoreLocations, findUnrecognizedCitizenships } from './utils/scorer.js'

export default function App() {
  const [step, setStep] = useState('upload') // upload | team | loading | results
  const [team, setTeam] = useState([])
  const [filename, setFilename] = useState('')
  const [allResults, setAllResults] = useState([])
  const [scoringData, setScoringData] = useState(null)
  const [error, setError] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState('')
  const [warnings, setWarnings] = useState([])
  const [resultsOutdated, setResultsOutdated] = useState(false)

  function handleStartEmpty() {
    setTeam([])
    setFilename('')
    setError(null)
    setWarnings([])
    setStep('team')
  }

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

  function handleTeamChange(newTeam) {
    setTeam(newTeam)
    if (step === 'results') setResultsOutdated(true)
  }

  async function runScoring(currentTeam) {
    setStep('loading')
    setError(null)
    setResultsOutdated(false)
    try {
      setLoadingStatus('Loading visa requirements…')
      const passportIndex = await loadPassportIndex()

      setLoadingStatus('Loading airport data…')
      const airports = await loadAirports()

      setLoadingStatus('Loading flight routes…')
      const routes = await loadRoutes()

      setLoadingStatus('Loading safety data…')
      const safetyData = await loadSafetyData()

      setLoadingStatus('Loading cost data…')
      const costData = await loadCostData()

      setLoadingStatus('Calculating scores…')

      const allWarnings = []
      for (const member of currentTeam) {
        for (const iata of member.airports) {
          if (!airports.has(iata)) {
            allWarnings.push(`${member.name}: airport code "${iata}" not found in database`)
          }
        }
      }
      allWarnings.push(...findUnrecognizedCitizenships(currentTeam, passportIndex))
      setWarnings(allWarnings)

      const scored = scoreLocations(currentTeam, passportIndex, airports, routes, safetyData, costData)
      setAllResults(scored)
      setScoringData({ passportIndex, airports, routes, safetyData, costData })
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
    setAllResults([])
    setScoringData(null)
    setError(null)
    setWarnings([])
    setResultsOutdated(false)
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
          <UploadSection onUpload={handleFileUpload} onStartEmpty={handleStartEmpty} />
        )}

        {(step === 'team' || step === 'results') && (
          <TeamTable
            team={team}
            filename={filename}
            onFindLocations={() => runScoring(team)}
            onReset={handleReset}
            onTeamChange={handleTeamChange}
            onRecalculate={() => runScoring(team)}
            showFindButton={step === 'team'}
            resultsOutdated={resultsOutdated}
          />
        )}

        {step === 'loading' && (
          <LoadingSection status={loadingStatus} />
        )}

        {step === 'results' && (
          <ResultsSection
            allResults={allResults}
            warnings={warnings}
            team={team}
            scoringData={scoringData}
            outdated={resultsOutdated}
          />
        )}
      </main>
    </div>
  )
}
