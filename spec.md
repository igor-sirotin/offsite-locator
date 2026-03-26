# Offsite Locator — Webapp Spec

A webapp that helps choose the best city for a team offsite, based on travel accessibility and visa requirements.

---

## Input: Team CSV

The user uploads a CSV file with the following columns:

```
name, city, country, citizenships, airports
```

- `name` — team member's name (string)
- `city` — their home city (string)
- `country` — their home country (string)
- `citizenships` — semicolon-separated list of passport countries as full English names, e.g. `Germany;United States`
- `airports` — semicolon-separated list of IATA origin airport codes (3-letter), e.g. `JFK;EWR`

Example row:
```
Alice,Berlin,Germany,Germany;United States,BER
```

If an airport code is unrecognized, warn the user. If a citizenship name is not found in the visa database, warn the user.

---

## Candidate Destination Cities

A curated list of ~60 major cities worldwide, well-served by international airports (not limited to capitals). Each city is identified by its primary IATA airport code.

---

## Selection Criteria

### 1. Visa Accessibility (primary, 60% weight)

Data source: [passport-index-data](https://github.com/imorte/passport-index-data)

For each team member:
- They may hold multiple citizenships — use whichever gives the best visa outcome for a given destination.

Visa categories (in order of preference):
1. **Visa-free** — no visa required (including numeric stay limits)
2. **eVisa / Visa on arrival** — easy online or on-arrival process, no embassy visit
3. **Visa required** — embassy application required
4. **No admission**

Score = (members with category 1 or 2) / total members × 100

### 2. Travel Accessibility (secondary, 40% weight)

Airport data: [OurAirports](https://github.com/davidmegginson/ourairports-data) — actively maintained, includes airports opened after 2014 (e.g. BER).

Route data: OpenFlights `routes.dat`. Retired IATA codes are transparently renamed to their replacement (e.g. SXF/TXL → BER) during loading, so current airport codes work correctly.

Travel effort per person (best route across all their origin airports):
- **Direct flight** → estimated flight duration (haversine distance ÷ 850 km/h)
- **1 stop** → flight duration + 2.5h layover
- **2+ stops** → flight duration + 6h penalty
- **No route found** → 30h (maximum penalty)

Score = max(0, 100 − avg_hours × 4)

### Combined Score

`combined = 0.6 × visa_score + 0.4 × travel_score`

---

## Output

### Team Members Table
Shows all loaded members: name, city, country, citizenships, airports.

### Top 5 Suggested Locations
Ranked list of 5 cities. For each:
- City name, flag, country, IATA code
- Combined score (0–100)
- Visa score bar: X/Y members visa-free or easy
- Travel score bar: average travel time
- Expandable per-member table: best passport used, visa status, estimated travel time, connection type

Warnings are shown for unrecognized airport codes or citizenship names.

---

## Constraints

- No AI/LLM — free public databases only.
- No map view.
- Pure frontend SPA (Vite + React + Tailwind).
- CSV upload is the only supported input method.
