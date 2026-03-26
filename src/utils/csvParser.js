import Papa from 'papaparse'

/**
 * Parse a CSV file uploaded by the user into team member objects.
 * Expected columns: name, city, country, citizenships, airports
 * citizenships and airports are semicolon-separated.
 */
export function parseTeamCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      transform: (value) => (typeof value === 'string' ? value.trim() : value),
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          const fatal = results.errors.filter(e => e.type === 'Delimiter' || e.type === 'Quotes')
          if (fatal.length > 0) {
            return reject(new Error(`CSV parse error: ${fatal[0].message}`))
          }
        }

        const required = ['name', 'city', 'country', 'citizenships', 'airports']
        const headers = results.meta.fields || []
        const normalized = headers.map(h => h.toLowerCase().trim())
        const missing = required.filter(r => !normalized.includes(r))

        if (missing.length > 0) {
          return reject(new Error(`CSV is missing required columns: ${missing.join(', ')}. Expected: name, city, country, citizenships, airports`))
        }

        const members = results.data
          .filter(row => row.name && row.name.trim())
          .map((row, idx) => {
            const citizenships = (row.citizenships || '')
              .split(';')
              .map(s => s.trim())
              .filter(Boolean)

            const airports = (row.airports || '')
              .split(';')
              .map(s => s.trim().toUpperCase())
              .filter(Boolean)

            return {
              id: idx,
              name: (row.name || '').trim(),
              city: (row.city || '').trim(),
              country: (row.country || '').trim(),
              citizenships,
              airports,
            }
          })

        if (members.length === 0) {
          return reject(new Error('CSV contains no valid team members.'))
        }

        resolve(members)
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      },
    })
  })
}
