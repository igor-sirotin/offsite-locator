import Papa from 'papaparse'

// Module-level cache so we only fetch once per session
let passportIndexCache = null
let airportsCache = null
let routesCache = null
let safetyCache = null
let costCache = null

// IATA codes that were retired and replaced by a new code for the same airport.
// routes.dat (OpenFlights, ~2014) still uses the old codes; we rename them on load
// so the rest of the app works with current codes without any special-casing.
const IATA_RENAMES = {
  SXF: 'BER', // Berlin Schönefeld → Berlin Brandenburg (opened Nov 2020, same site)
  TXL: 'BER', // Berlin Tegel → Berlin Brandenburg (closed Nov 2020)
}

const PASSPORT_INDEX_URL =
  'https://raw.githubusercontent.com/imorte/passport-index-data/master/passport-index-matrix.csv'
// OurAirports: actively maintained, includes airports opened after 2014
const AIRPORTS_URL =
  'https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv'
const ROUTES_URL =
  'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat'

async function fetchText(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

/**
 * Parse passport index CSV.
 * Returns { matrix: Map<originCountry, Map<destCountry, value>>, countries: string[] }
 */
export async function loadPassportIndex(onStatus) {
  if (passportIndexCache) return passportIndexCache

  if (onStatus) onStatus('Loading visa data…')

  const text = await fetchText(PASSPORT_INDEX_URL)

  const result = await new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => resolve(results),
      error: (err) => reject(new Error(`Passport index parse error: ${err.message}`)),
    })
  })

  const rows = result.data
  if (!rows || rows.length < 2) {
    throw new Error('Passport index data is empty or malformed.')
  }

  // First row: headers. First cell is "Passport", rest are destination countries.
  const destCountries = rows[0].slice(1).map(c => c.trim())

  const matrix = new Map()
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const origin = (row[0] || '').trim()
    if (!origin) continue
    const destMap = new Map()
    for (let j = 1; j < row.length; j++) {
      const dest = destCountries[j - 1]
      if (dest) destMap.set(dest, (row[j] || '').trim())
    }
    matrix.set(origin, destMap)
  }

  passportIndexCache = { matrix, countries: destCountries }
  return passportIndexCache
}

/**
 * Parse airports from OurAirports airports.csv.
 * Header: id, ident, type, name, latitude_deg, longitude_deg, elevation_ft,
 *         continent, iso_country, iso_region, municipality, scheduled_service,
 *         icao_code, iata_code, gps_code, local_code, home_link, wikipedia_link, keywords
 * Returns Map<IATA, { iata, name, city, country, lat, lon }>
 */
export async function loadAirports(onStatus) {
  if (airportsCache) return airportsCache

  if (onStatus) onStatus('Loading airport data…')

  const text = await fetchText(AIRPORTS_URL)

  const result = await new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: r => resolve(r),
      error: err => reject(new Error(`Airport data parse error: ${err.message}`)),
    })
  })

  const airportMap = new Map()
  for (const row of result.data) {
    const iata = (row.iata_code || '').trim()
    if (!iata) continue

    // Only keep airports with scheduled service to avoid noise
    if (row.scheduled_service !== 'yes') continue

    const lat = parseFloat(row.latitude_deg)
    const lon = parseFloat(row.longitude_deg)
    if (isNaN(lat) || isNaN(lon)) continue

    airportMap.set(iata, {
      iata,
      name: (row.name || '').trim(),
      city: (row.municipality || '').trim(),
      country: (row.iso_country || '').trim(),
      lat,
      lon,
    })
  }

  airportsCache = airportMap
  return airportsCache
}

/**
 * Parse routes from OpenFlights routes.dat.
 * Format: Airline, AirlineID, SrcAirport, SrcAirportID, DstAirport, DstAirportID, Codeshare, Stops, Equipment
 * Retired IATA codes are renamed to current codes via IATA_RENAMES.
 * Returns { forward: Map<src, Set<dst>>, reverse: Map<dst, Set<src>> }
 */
export async function loadRoutes(onStatus) {
  if (routesCache) return routesCache

  if (onStatus) onStatus('Loading flight routes…')

  const text = await fetchText(ROUTES_URL)
  const lines = text.split('\n')

  const forward = new Map()
  const reverse = new Map()

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const fields = trimmed.split(',')
    if (fields.length < 5) continue

    let src = (fields[2] || '').trim()
    let dst = (fields[4] || '').trim()

    if (!src || src === '\\N' || !dst || dst === '\\N') continue
    if (src.length !== 3 || dst.length !== 3) continue

    // Apply known IATA code renames so stale codes map to current ones
    src = IATA_RENAMES[src] ?? src
    dst = IATA_RENAMES[dst] ?? dst

    if (!forward.has(src)) forward.set(src, new Set())
    forward.get(src).add(dst)

    if (!reverse.has(dst)) reverse.set(dst, new Set())
    reverse.get(dst).add(src)
  }

  routesCache = { forward, reverse }
  return routesCache
}

/**
 * Load country safety scores from the World Bank Political Stability and
 * Absence of Violence/Terrorism indicator (PV.EST).
 * Returns { byIso2: Map<iso2, score 0-100>, byName: Map<lowerName, score 0-100> }
 * Score 0 = least stable, 100 = most stable. Missing countries default to 50.
 */
export async function loadSafetyData(onStatus) {
  if (safetyCache) return safetyCache

  if (onStatus) onStatus('Loading safety data…')

  const url = 'https://api.worldbank.org/v2/country/all/indicator/PV.EST?format=json&mrv=1&per_page=300'
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch safety data: ${response.status}`)

  const [, entries] = await response.json()

  const valid = entries.filter(e => e.value !== null && /^[A-Z]{2}$/.test(e.country.id))
  const rawValues = valid.map(e => e.value)
  const minVal = Math.min(...rawValues)
  const maxVal = Math.max(...rawValues)
  const normalize = v => Math.round((v - minVal) / (maxVal - minVal) * 100)

  const byIso2 = new Map()
  const byName = new Map()
  for (const entry of valid) {
    const score = normalize(entry.value)
    byIso2.set(entry.country.id, score)
    byName.set(entry.country.value.toLowerCase(), score)
  }

  safetyCache = { byIso2, byName }
  return safetyCache
}

/**
 * Load country cost scores from the World Bank Price Level Ratio indicator (PA.NUS.PPPC.RF).
 * A value of 1.0 = same price level as the US; values below 1 are cheaper, above 1 are pricier.
 * Returns { byIso2: Map<iso2, score 0-100>, byName: Map<lowerName, score 0-100> }
 * Score 100 = cheapest, 0 = most expensive. Missing countries default to 50.
 */
export async function loadCostData(onStatus) {
  if (costCache) return costCache

  if (onStatus) onStatus('Loading cost data…')

  const url = 'https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPPC.RF?format=json&mrv=1&per_page=300'
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch cost data: ${response.status}`)

  const [, entries] = await response.json()

  const valid = entries.filter(e => e.value !== null && /^[A-Z]{2}$/.test(e.country.id))
  const rawValues = valid.map(e => e.value)
  const minVal = Math.min(...rawValues)
  const maxVal = Math.max(...rawValues)
  // Invert so cheap (low ratio) → high score
  const normalize = v => Math.round((1 - (v - minVal) / (maxVal - minVal)) * 100)

  const byIso2 = new Map()
  const byName = new Map()
  for (const entry of valid) {
    const score = normalize(entry.value)
    byIso2.set(entry.country.id, score)
    byName.set(entry.country.value.toLowerCase(), score)
  }

  costCache = { byIso2, byName }
  return costCache
}

/**
 * Load all data sources in sequence, reporting status.
 */
export async function loadAllData(onStatus) {
  const [passportIndex, airports, routes] = await Promise.all([
    loadPassportIndex(onStatus),
    loadAirports(onStatus),
    loadRoutes(onStatus),
  ])
  return { passportIndex, airports, routes }
}
