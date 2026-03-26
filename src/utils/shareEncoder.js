/**
 * Encode/decode team data to/from a URL-safe base64 string.
 * Format: base64url(JSON([{n, r, c[], a[]}]))
 */

export function encodeTeam(team) {
  const data = team.map(m => ({
    n: m.name,
    r: m.residence,
    c: m.citizenships,
    a: m.airports,
  }))
  const json = JSON.stringify(data)
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function decodeTeam(encoded) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4
  const padded2 = pad ? padded + '='.repeat(4 - pad) : padded
  const json = atob(padded2)
  const data = JSON.parse(json)
  if (!Array.isArray(data)) throw new Error('Invalid share link')
  return data.map((m, i) => ({
    id: i + 1,
    name: m.n,
    residence: m.r,
    citizenships: m.c,
    airports: m.a,
  }))
}
