import { CANDIDATE_CITIES } from '../data/candidateCities.js'
import { flightHours } from './haversine.js'

// Bidirectional country name aliases for passport index matching
const COUNTRY_ALIASES = {
  'Czech Republic': 'Czechia',
  'Czechia': 'Czech Republic',
  'South Korea': 'Korea, South',
  'Korea, South': 'South Korea',
  'North Korea': 'Korea, North',
  'Korea, North': 'North Korea',
  'Turkey': 'Türkiye',
  'Türkiye': 'Turkey',
  'United States': 'United States of America',
  'United States of America': 'United States',
  'Russia': 'Russian Federation',
  'Russian Federation': 'Russia',
  'Iran': 'Iran, Islamic Republic of',
  'Iran, Islamic Republic of': 'Iran',
  'Bolivia': 'Bolivia, Plurinational State of',
  'Venezuela': 'Venezuela, Bolivarian Republic of',
  'Syria': 'Syrian Arab Republic',
  'Taiwan': 'Taiwan, Province of China',
  'Macedonia': 'North Macedonia',
  'North Macedonia': 'Macedonia',
  'Moldova': 'Moldova, Republic of',
  'Vietnam': 'Viet Nam',
  'Viet Nam': 'Vietnam',
  'Tanzania': 'Tanzania, United Republic of',
  'South Korea': 'South Korea',
}

function findInMap(map, key) {
  if (!key || !map) return undefined
  if (map.has(key)) return map.get(key)
  const alias = COUNTRY_ALIASES[key]
  if (alias && map.has(alias)) return map.get(alias)
  const lower = key.toLowerCase()
  for (const [k, v] of map) {
    if (k.toLowerCase() === lower) return v
  }
  return undefined
}

// Priority order: lower index = better for traveller
const VISA_PRIORITY = ['citizen', 'visa free', 'e-visa', 'visa on arrival', 'visa required', 'no admission']

function normVisa(value) {
  if (!value) return ''
  const v = value.toLowerCase().trim()
  if (/^\d+$/.test(v)) return 'visa free'
  return v
}

function visaPriorityIndex(value) {
  const n = normVisa(value)
  const idx = VISA_PRIORITY.indexOf(n)
  return idx === -1 ? VISA_PRIORITY.length : idx
}

function visaCategoryType(value) {
  const n = normVisa(value)
  if (n === 'citizen' || n === 'visa free') return 'free'
  if (n === 'e-visa' || n === 'visa on arrival') return 'easy'
  if (n === 'visa required') return 'required'
  if (n === 'no admission') return 'blocked'
  return 'unknown'
}

function visaCategoryLabel(value) {
  if (!value) return 'Unknown'
  const n = normVisa(value)
  if (n === 'citizen') return 'Citizen'
  if (n === 'visa free') return 'Visa Free'
  if (n === 'e-visa') return 'eVisa'
  if (n === 'visa on arrival') return 'Visa on Arrival'
  if (n === 'visa required') return 'Visa Required'
  if (n === 'no admission') return 'No Admission'
  return value
}

function getBestVisaOutcome(matrix, passportCountries, destCountry) {
  let bestValue = null
  let bestPriority = Infinity
  let bestPassport = null

  for (const passport of passportCountries) {
    const passportMap = findInMap(matrix, passport)
    if (!passportMap) continue

    const value = findInMap(passportMap, destCountry)
    if (!value) continue

    const priority = visaPriorityIndex(value)
    if (priority < bestPriority) {
      bestPriority = priority
      bestValue = value
      bestPassport = passport
    }
  }

  return { value: bestValue, passport: bestPassport }
}

function estimateTravelEffort(memberAirports, destIata, airports, routes) {
  const destAirport = airports.get(destIata)
  if (!destAirport) return { hours: 30, type: 'no_route', origin: null }

  let bestHours = Infinity
  let bestType = 'no_route'
  let bestOrigin = null

  for (const originIata of memberAirports) {
    if (originIata === destIata) return { hours: 0, type: 'direct', origin: originIata }

    const originAirport = airports.get(originIata)
    if (!originAirport) continue

    const baseHours = flightHours(
      originAirport.lat, originAirport.lon,
      destAirport.lat, destAirport.lon,
    )

    // Direct?
    if (routes.forward.get(originIata)?.has(destIata)) {
      if (baseHours < bestHours) {
        bestHours = baseHours
        bestType = 'direct'
        bestOrigin = originIata
      }
      continue
    }

    // 1-stop?
    const originNeighbors = routes.forward.get(originIata)
    const destFeeders = routes.reverse.get(destIata)
    if (originNeighbors && destFeeders) {
      let hasConnection = false
      for (const neighbor of originNeighbors) {
        if (destFeeders.has(neighbor)) { hasConnection = true; break }
      }
      if (hasConnection) {
        const h = baseHours + 2.5
        if (h < bestHours) { bestHours = h; bestType = 'one_stop'; bestOrigin = originIata }
        continue
      }
    }

    // 2+ stops
    const h = baseHours + 6
    if (h < bestHours) { bestHours = h; bestType = 'two_plus'; bestOrigin = originIata }
  }

  if (bestHours === Infinity) return { hours: 30, type: 'no_route', origin: null }
  return { hours: bestHours, type: bestType, origin: bestOrigin }
}

export function findUnrecognizedCitizenships(team, passportIndex) {
  const { matrix } = passportIndex
  const warnings = []
  const seen = new Set()
  for (const member of team) {
    for (const citizenship of member.citizenships) {
      const key = `${member.name}::${citizenship}`
      if (seen.has(key)) continue
      seen.add(key)
      if (!findInMap(matrix, citizenship)) {
        warnings.push(`${member.name}: citizenship "${citizenship}" not found in visa database`)
      }
    }
  }
  return warnings
}

export function scoreLocations(team, passportIndex, airports, routes) {
  const { matrix } = passportIndex
  const results = []

  for (const candidate of CANDIDATE_CITIES) {
    const destCountry = candidate.country

    // Visa scoring
    const visaPerMember = team.map(member => {
      const { value, passport } = getBestVisaOutcome(matrix, member.citizenships, destCountry)
      return {
        name: member.name,
        value,
        passport,
        label: visaCategoryLabel(value),
        type: visaCategoryType(value),
      }
    })
    const easyCount = visaPerMember.filter(m => m.type === 'free' || m.type === 'easy').length
    const visaScore = team.length > 0 ? (easyCount / team.length) * 100 : 0

    // Travel scoring
    const travelPerMember = team.map(member => {
      const effort = estimateTravelEffort(member.airports, candidate.iata, airports, routes)
      return {
        name: member.name,
        hours: effort.hours,
        type: effort.type,
        origin: effort.origin,
      }
    })
    const avgHours = travelPerMember.reduce((s, m) => s + m.hours, 0) / Math.max(team.length, 1)
    const travelScore = Math.max(0, 100 - avgHours * 4)

    const combinedScore = 0.6 * visaScore + 0.4 * travelScore

    results.push({
      ...candidate,
      visaScore,
      travelScore,
      combinedScore,
      easyCount,
      totalMembers: team.length,
      avgHours,
      visaPerMember,
      travelPerMember,
    })
  }

  return results.sort((a, b) => b.combinedScore - a.combinedScore)
}
