# Offsite Locator — CLAUDE.md

## Project Overview

Pure frontend SPA that ranks ~60 candidate cities for a team offsite based on visa accessibility, travel time, country safety, and cost of living. No backend, no AI, no map view — free public databases only, fetched at runtime.

## Tech Stack

- **Vite + React 18** (`npm run dev` to start)
- **Tailwind CSS v3** — JIT scanner; class names must appear as complete literal strings
- **papaparse** — CSV parsing

## Running the App

```bash
npm install
npm run dev
```

## Data Sources

| Source | Used for | Notes |
|---|---|---|
| [imorte/passport-index-data](https://github.com/imorte/passport-index-data) | Visa requirements matrix | Fetched at runtime; keys are full English country names |
| [OurAirports](https://github.com/davidmegginson/ourairports-data) | Airport coordinates + IATA codes | Use this, NOT OpenFlights airports.dat — OurAirports includes BER (opened 2020) |
| [OpenFlights routes.dat](https://github.com/jpatokal/openflights) | Flight route graph | ~2014 vintage; SXF/TXL renamed to BER via `IATA_RENAMES` in `dataLoader.js` |
| World Bank PV.EST API | Country safety scores | Free, no auth, 205 countries; normalized 0–100 |

All datasets are cached in module-level variables after first fetch (session cache).

## Key Architectural Decisions

### Tailwind literal class names
`animate-fade-in-delay-1` through `animate-fade-in-delay-5` must be literal strings in source — do NOT construct them via template literals like `` `animate-fade-in-delay-${rank}` ``. They live in `RANK_STYLES` in `LocationCard.jsx`.

### CSV columns
`name, residence, citizenships, airports` — `city` and `country` were removed. `residence` is the country of residence (full English name), used only for the residence rule in visa scoring.

### Citizenship matching
CSV citizenships are full English country names (e.g. `Germany`, `United States`). Do NOT call `.toUpperCase()` on them — passport index keys are mixed case. `COUNTRY_ALIASES` in `scorer.js` handles known variants (Czechia/Czech Republic, Türkiye/Turkey, etc.).

### IATA_RENAMES
`SXF` and `TXL` are renamed to `BER` during routes.dat parsing. This is a data correction, not a fallback — the old codes no longer exist.

### Passport index `-1` values
In the raw matrix CSV, `-1` appears on the diagonal (same-country pairs) and means "citizen". It does NOT mean "no data" or "no admission". It's mapped to `'citizen'` in `normVisa()`.

### Multi-airport destinations
Each candidate city has an `iatas: string[]` field (multiple airports, e.g. London: LHR/LGW/LCY/STN/LTN). `estimateTravelEffort` accepts this array and picks the best route to any of them.

### Residence rule
A team member whose `residence` matches the destination country is treated as a resident — `type: 'free'`, regardless of their passport. This is checked in `scoreSingleCity` before the passport lookup.

### e-visa treatment
e-visas are treated as a barrier (not counted toward the visa score). No free public database encodes e-visa difficulty/cost/processing time. Commercial sources (IATA Timatic, iVisa, Sherpa) have this data but are not open. This is documented in spec.md.

## Scoring

```
combined = 0.4 × visa_score + 0.25 × travel_score + 0.15 × safety_score + 0.2 × cost_score
```

- **Visa score**: (members with free or easy access) / total × 100
  - Free: citizen, visa free, numeric days, eTA, resident
  - Easy: visa on arrival
  - Barrier: e-visa, visa required, no admission
- **Travel score**: `max(0, 100 − avg_hours × 4)`
  - Direct: haversine distance ÷ 850 km/h
  - 1 stop: flight time + 2.5h
  - 2+ stops: flight time + 6h
  - No route: 30h penalty
- **Safety score**: World Bank PV.EST normalized to 0–100; missing → 50
- **Cost score**: World Bank PA.NUS.PPPC.RF price level ratio, inverted and normalized to 0–100 (cheap = 100, expensive = 0); missing → 50

## File Map

```
src/
  App.jsx                  # Step orchestration: upload → team → loading → results
  components/
    Header.jsx
    UploadSection.jsx
    TeamTable.jsx
    LoadingSection.jsx
    ResultsSection.jsx     # Pagination, custom city form
    LocationCard.jsx       # Score bars, per-member table, rank badges
  utils/
    dataLoader.js          # Fetch + cache all external data
    scorer.js              # All scoring logic + findAirportsForCity
    csvParser.js           # Parse team CSV; citizenships split by ';'
    haversine.js           # flightHours(lat1,lon1,lat2,lon2)
  data/
    candidateCities.js     # ~60 hardcoded cities; getFlagEmoji(iso2)
public/
  team_template.csv        # Example CSV with full country names
```
