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

// Priority order: lower index = better for the traveller.
// eta   = Electronic Travel Authorisation (trivial online form, minutes, no docs)
// e-visa = Electronic visa (real application, documents, waiting period)
// -1 in the raw data means no information; treated as worst case.
const VISA_PRIORITY = [
  'citizen',
  'visa free',  // numeric stay-days also map here
  'eta',
  'visa on arrival',
  'e-visa',
  'visa required',
  'no admission',
]

function normVisa(value) {
  if (!value) return ''
  const v = value.toLowerCase().trim()
  if (/^\d+$/.test(v)) return 'visa free'  // numeric = days of visa-free stay
  if (v === '-1') return 'citizen'          // diagonal entries: same-country = citizen
  return v
}

function visaPriorityIndex(value) {
  const n = normVisa(value)
  const idx = VISA_PRIORITY.indexOf(n)
  return idx === -1 ? VISA_PRIORITY.length : idx
}

// Scoring tiers:
//   'free'     — no friction: citizen, visa free, numeric stay, eTA, resident
//   'easy'     — minor friction: visa on arrival (decided at the border)
//   'evisa'    — real effort: online application with docs/fees/waiting
//   'required' — embassy application required
//   'blocked'  — no admission
function visaCategoryType(value) {
  if (value === 'resident') return 'free'
  const n = normVisa(value)
  if (n === 'citizen' || n === 'visa free' || n === 'eta') return 'free'
  if (n === 'visa on arrival') return 'easy'
  if (n === 'e-visa') return 'evisa'
  if (n === 'visa required') return 'required'
  if (n === 'no admission') return 'blocked'
  return 'unknown'
}

function visaCategoryLabel(value) {
  if (value === 'resident') return 'Resident'
  if (!value) return 'Unknown'
  const n = normVisa(value)
  if (n === 'citizen') return 'Citizen'
  if (n === 'visa free') return 'Visa Free'
  if (n === 'eta') return 'eTA'
  if (n === 'visa on arrival') return 'Visa on Arrival'
  if (n === 'e-visa') return 'eVisa'
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

// destIatas is an array — member can fly to any airport in the destination city.
function estimateTravelEffort(memberAirports, destIatas, airports, routes) {
  let bestHours = Infinity
  let bestType = 'no_route'
  let bestOrigin = null

  for (const destIata of destIatas) {
    const destAirport = airports.get(destIata)
    if (!destAirport) continue

    for (const originIata of memberAirports) {
      if (originIata === destIata) return { hours: 0, type: 'direct', origin: originIata }

      const originAirport = airports.get(originIata)
      if (!originAirport) continue

      const baseHours = flightHours(
        originAirport.lat, originAirport.lon,
        destAirport.lat, destAirport.lon,
      )

      if (routes.forward.get(originIata)?.has(destIata)) {
        if (baseHours < bestHours) { bestHours = baseHours; bestType = 'direct'; bestOrigin = originIata }
        continue
      }

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

      const h = baseHours + 6
      if (h < bestHours) { bestHours = h; bestType = 'two_plus'; bestOrigin = originIata }
    }
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

function lookupSafetyScore(candidate, safetyData) {
  if (!safetyData) return 50
  if (candidate.iso2) {
    const s = safetyData.byIso2.get(candidate.iso2)
    if (s !== undefined) return s
  }
  const s = safetyData.byName.get(candidate.country.toLowerCase())
  return s ?? 50
}

function lookupCostScore(candidate, costData) {
  if (!costData) return 50
  if (candidate.iso2) {
    const s = costData.byIso2.get(candidate.iso2)
    if (s !== undefined) return s
  }
  const s = costData.byName.get(candidate.country.toLowerCase())
  return s ?? 50
}

function scoreSingleCity(candidate, team, matrix, airports, routes, safetyData, costData) {
  const visaPerMember = team.map(member => {
    // A team member who lives in the destination country can enter regardless of passport.
    const isResident = member.residence.trim().toLowerCase() === candidate.country.trim().toLowerCase()
    if (isResident) {
      return { name: member.name, value: 'resident', passport: null, label: 'Resident', type: 'free' }
    }
    const { value, passport } = getBestVisaOutcome(matrix, member.citizenships, candidate.country)
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

  const destIatas = candidate.iatas ?? [candidate.iata]
  const travelPerMember = team.map(member => {
    const effort = estimateTravelEffort(member.airports, destIatas, airports, routes)
    return {
      name: member.name,
      hours: effort.hours,
      type: effort.type,
      origin: effort.origin,
    }
  })
  const avgHours = travelPerMember.reduce((s, m) => s + m.hours, 0) / Math.max(team.length, 1)
  const travelScore = Math.max(0, 100 - avgHours * 4)

  const safetyScore = lookupSafetyScore(candidate, safetyData)
  const costScore = lookupCostScore(candidate, costData)

  const combinedScore = 0.4 * visaScore + 0.25 * travelScore + 0.15 * safetyScore + 0.2 * costScore

  return {
    ...candidate,
    visaScore,
    travelScore,
    safetyScore,
    costScore,
    combinedScore,
    easyCount,
    totalMembers: team.length,
    avgHours,
    visaPerMember,
    travelPerMember,
  }
}

export function scoreLocations(team, passportIndex, airports, routes, safetyData, costData) {
  const { matrix } = passportIndex
  return CANDIDATE_CITIES
    .map(candidate => scoreSingleCity(candidate, team, matrix, airports, routes, safetyData, costData))
    .sort((a, b) => b.combinedScore - a.combinedScore)
}

export function scoreCustomCity(cityDef, team, passportIndex, airports, routes, safetyData, costData) {
  return scoreSingleCity(cityDef, team, passportIndex.matrix, airports, routes, safetyData, costData)
}

/**
 * Find all airports for a given city name by searching the airports map.
 * Returns them sorted by outgoing route count (busiest first).
 * Falls back to partial/substring match if no exact city name match.
 */
export function findAirportsForCity(cityName, airports, routes) {
  const needle = cityName.trim().toLowerCase()
  let matches = []

  for (const airport of airports.values()) {
    if (airport.city.toLowerCase() === needle) matches.push(airport)
  }

  if (matches.length === 0) {
    for (const airport of airports.values()) {
      if (airport.city.toLowerCase().includes(needle)) matches.push(airport)
    }
  }

  matches.sort((a, b) =>
    (routes.forward.get(b.iata)?.size ?? 0) - (routes.forward.get(a.iata)?.size ?? 0)
  )
  return matches
}
