// Candidate cities for offsite location scoring
// Each city has: city name, country name, primary IATA code, ISO 2-letter country code

export const CANDIDATE_CITIES = [
  // Europe
  { city: 'London', country: 'United Kingdom', iata: 'LHR', iso2: 'GB' },
  { city: 'Paris', country: 'France', iata: 'CDG', iso2: 'FR' },
  { city: 'Amsterdam', country: 'Netherlands', iata: 'AMS', iso2: 'NL' },
  { city: 'Frankfurt', country: 'Germany', iata: 'FRA', iso2: 'DE' },
  { city: 'Berlin', country: 'Germany', iata: 'BER', iso2: 'DE' },
  { city: 'Munich', country: 'Germany', iata: 'MUC', iso2: 'DE' },
  { city: 'Madrid', country: 'Spain', iata: 'MAD', iso2: 'ES' },
  { city: 'Barcelona', country: 'Spain', iata: 'BCN', iso2: 'ES' },
  { city: 'Lisbon', country: 'Portugal', iata: 'LIS', iso2: 'PT' },
  { city: 'Rome', country: 'Italy', iata: 'FCO', iso2: 'IT' },
  { city: 'Milan', country: 'Italy', iata: 'MXP', iso2: 'IT' },
  { city: 'Vienna', country: 'Austria', iata: 'VIE', iso2: 'AT' },
  { city: 'Zurich', country: 'Switzerland', iata: 'ZRH', iso2: 'CH' },
  { city: 'Brussels', country: 'Belgium', iata: 'BRU', iso2: 'BE' },
  { city: 'Copenhagen', country: 'Denmark', iata: 'CPH', iso2: 'DK' },
  { city: 'Stockholm', country: 'Sweden', iata: 'ARN', iso2: 'SE' },
  { city: 'Oslo', country: 'Norway', iata: 'OSL', iso2: 'NO' },
  { city: 'Helsinki', country: 'Finland', iata: 'HEL', iso2: 'FI' },
  { city: 'Dublin', country: 'Ireland', iata: 'DUB', iso2: 'IE' },
  { city: 'Prague', country: 'Czech Republic', iata: 'PRG', iso2: 'CZ' },
  { city: 'Warsaw', country: 'Poland', iata: 'WAW', iso2: 'PL' },
  { city: 'Budapest', country: 'Hungary', iata: 'BUD', iso2: 'HU' },
  { city: 'Athens', country: 'Greece', iata: 'ATH', iso2: 'GR' },
  { city: 'Tallinn', country: 'Estonia', iata: 'TLL', iso2: 'EE' },
  { city: 'Riga', country: 'Latvia', iata: 'RIX', iso2: 'LV' },
  { city: 'Porto', country: 'Portugal', iata: 'OPO', iso2: 'PT' },
  { city: 'Tbilisi', country: 'Georgia', iata: 'TBS', iso2: 'GE' },

  // Americas
  { city: 'New York', country: 'United States', iata: 'JFK', iso2: 'US' },
  { city: 'Los Angeles', country: 'United States', iata: 'LAX', iso2: 'US' },
  { city: 'Miami', country: 'United States', iata: 'MIA', iso2: 'US' },
  { city: 'Chicago', country: 'United States', iata: 'ORD', iso2: 'US' },
  { city: 'San Francisco', country: 'United States', iata: 'SFO', iso2: 'US' },
  { city: 'Toronto', country: 'Canada', iata: 'YYZ', iso2: 'CA' },
  { city: 'Vancouver', country: 'Canada', iata: 'YVR', iso2: 'CA' },
  { city: 'Mexico City', country: 'Mexico', iata: 'MEX', iso2: 'MX' },
  { city: 'Cancun', country: 'Mexico', iata: 'CUN', iso2: 'MX' },
  { city: 'Bogota', country: 'Colombia', iata: 'BOG', iso2: 'CO' },
  { city: 'Lima', country: 'Peru', iata: 'LIM', iso2: 'PE' },
  { city: 'Santiago', country: 'Chile', iata: 'SCL', iso2: 'CL' },
  { city: 'Sao Paulo', country: 'Brazil', iata: 'GRU', iso2: 'BR' },
  { city: 'Buenos Aires', country: 'Argentina', iata: 'EZE', iso2: 'AR' },

  // Middle East & Africa
  { city: 'Dubai', country: 'United Arab Emirates', iata: 'DXB', iso2: 'AE' },
  { city: 'Doha', country: 'Qatar', iata: 'DOH', iso2: 'QA' },
  { city: 'Istanbul', country: 'Turkey', iata: 'IST', iso2: 'TR' },
  { city: 'Tel Aviv', country: 'Israel', iata: 'TLV', iso2: 'IL' },
  { city: 'Nairobi', country: 'Kenya', iata: 'NBO', iso2: 'KE' },
  { city: 'Cape Town', country: 'South Africa', iata: 'CPT', iso2: 'ZA' },
  { city: 'Casablanca', country: 'Morocco', iata: 'CMN', iso2: 'MA' },

  // Asia-Pacific
  { city: 'Singapore', country: 'Singapore', iata: 'SIN', iso2: 'SG' },
  { city: 'Bangkok', country: 'Thailand', iata: 'BKK', iso2: 'TH' },
  { city: 'Tokyo', country: 'Japan', iata: 'NRT', iso2: 'JP' },
  { city: 'Seoul', country: 'South Korea', iata: 'ICN', iso2: 'KR' },
  { city: 'Hong Kong', country: 'Hong Kong', iata: 'HKG', iso2: 'HK' },
  { city: 'Kuala Lumpur', country: 'Malaysia', iata: 'KUL', iso2: 'MY' },
  { city: 'Bali', country: 'Indonesia', iata: 'DPS', iso2: 'ID' },
  { city: 'Sydney', country: 'Australia', iata: 'SYD', iso2: 'AU' },
  { city: 'Melbourne', country: 'Australia', iata: 'MEL', iso2: 'AU' },
  { city: 'Mumbai', country: 'India', iata: 'BOM', iso2: 'IN' },
  { city: 'Delhi', country: 'India', iata: 'DEL', iso2: 'IN' },
]

// Generate flag emoji from ISO2 country code
export function getFlagEmoji(iso2) {
  if (!iso2 || iso2.length !== 2) return ''
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
