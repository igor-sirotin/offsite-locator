# Offsite Locator — Webapp Spec

A webapp that helps choose the best city for a team offsite, based on travel accessibility, visa requirements, and country safety.

---

## Input: Team CSV

The user uploads a CSV file with the following columns:

```
name, residence, citizenships, airports
```

- `name` — team member's name (string)
- `residence` — their country of residence (string, full English name) — used to determine if they can enter the destination as a resident
- `citizenships` — semicolon-separated list of passport countries as full English names, e.g. `Germany;United States`
- `airports` — semicolon-separated list of IATA origin airport codes (3-letter), e.g. `JFK;EWR`

Example row:
```
Alice,Germany,Germany;United States,BER
```

**Warnings** are shown if an airport code is unrecognized or a citizenship name is not found in the visa database.

---

## Candidate Destination Cities

A curated hardcoded list of ~60 major cities worldwide, well-served by international airports (not limited to capitals). Each city has a primary IATA airport code and ISO2 country code. The user can also add custom cities at the results stage.

---

## Selection Criteria

### 1. Visa Accessibility (primary, 50% weight)

Data source: [imorte/passport-index-data](https://github.com/imorte/passport-index-data) — matrix CSV fetched at runtime.

Rules:
- Team members with multiple citizenships use whichever gives the best outcome.
- Team members living in the destination country are treated as residents (free access, regardless of passport).

Visa categories (best → worst):

| DB value | Meaning | Counts toward score |
|---|---|---|
| `-1` | Citizen (same-country diagonal) | ✓ free |
| `visa free` / numeric (days) | No visa needed | ✓ free |
| `eta` | Electronic Travel Authorisation — trivial online form, minutes | ✓ free |
| `visa on arrival` | Granted at the border | ✓ easy |
| `e-visa` | Online visa application — involves documents, fees, waiting | ✗ |
| `visa required` | Embassy application required | ✗ |
| `no admission` | Entry not permitted | ✗ |

**Note on e-visa granularity:** No free public database exists that encodes e-visa difficulty, cost, or processing time at a per-country-pair level. Commercial sources (IATA Timatic, iVisa, Sherpa) have this data but are not open. Until such a source is available, all e-visas are treated as a barrier (not counted toward the score), which is the conservative safe choice.

Score = (members with free or easy access) / total members × 100

### 2. Travel Accessibility (secondary, 25% weight)

Airport data: [OurAirports](https://github.com/davidmegginson/ourairports-data) — actively maintained, includes recent airports (e.g. BER opened 2020). Only airports with scheduled service are loaded.

Route data: [OpenFlights routes.dat](https://github.com/jpatokal/openflights). Retired IATA codes are transparently renamed on load (e.g. SXF/TXL → BER).

Destination cities with multiple airports: best route to any of the city's airports is used (e.g. London: LHR, LGW, LCY, STN, LTN). Team members' origin airports are also tried in combination.

Travel effort per person:
- **Direct flight** → haversine distance ÷ 850 km/h
- **1 stop** → flight time + 2.5h layover
- **2+ stops** → flight time + 6h penalty
- **No route found** → 30h (maximum penalty)

Score = max(0, 100 − avg_hours × 4)

### 3. Country Safety (15% weight)

Data source: **World Bank Governance Indicators — Political Stability governance score (`GOV_WGI_PV.SC`)**, fetched via free JSON API (no auth required), ~200 countries. Replaces the retired `PV.EST` indicator (the `-2.5..+2.5` estimate); `GOV_WGI_PV.SC` is the same dimension already published on a 0–100 scale.

- Rescaled to 0–100 using the actual min/max of the loaded dataset
- Lookup by ISO2 code; falls back to country name match
- Countries missing from dataset default to 50 (neutral)

Score = rescaled `GOV_WGI_PV.SC` value for the destination country.

### 4. Cost of Living (20% weight)

Data source: **World Bank Price Level Index, GDP (`PA.NUS.GDP.PLI`)**, fetched via free JSON API (no auth required). This index reflects how expensive a country is relative to the US (USA = 100; <100 = cheaper; >100 = pricier). Replaces the retired `PA.NUS.PPPC.RF` ratio (same dimension, expressed as a ratio with USA = 1.0).

- Inverted and normalized to 0–100 so that the cheapest country scores 100 and the most expensive scores 0
- Lookup by ISO2 code; falls back to country name match
- Countries missing from dataset default to 50 (neutral)

Score = 100 − normalized price level ratio.

### Combined Score

```
combined = 0.4 × visa_score + 0.25 × travel_score + 0.15 × safety_score + 0.2 × cost_score
```

---

## Output

### Team Members Table
Shows all loaded members: name, city, country, citizenships, airports.

### Location Rankings
- Default view: top 5 results
- "Show more" reveals 5 at a time; "Show all" reveals all ~60 candidates
- Custom locations can be added (city name + country + optional IATA codes); if airports left blank, they are auto-detected from the OurAirports database by city name, picking the busiest airport(s) by route count

Each location card shows:
- City name, flag emoji, country, IATA code(s), rank badge (gold/silver/bronze for top 3)
- Combined score (0–100)
- Four score bars: Visa (X/Y members no-visa), Travel (avg hours), Safety (0–100), Cost (0–100)
- Expandable per-member table: best passport used, visa status badge, estimated travel time, connection type badge

---

## Constraints

- No AI/LLM — free public databases only.
- No map view.
- Pure frontend SPA (Vite + React + Tailwind + papaparse). No backend.
- CSV upload is the only team input method.
- All external data is fetched at runtime and cached in memory for the session.
