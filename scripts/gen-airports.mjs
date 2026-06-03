import { readFileSync, writeFileSync } from 'node:fs'

const csv = readFileSync('C:/Users/Parth Sharma/Downloads/airports.csv', 'utf8')

// Minimal RFC-4180 CSV line parser (handles quoted fields with commas/quotes).
function parseLine(line) {
  const out = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQ = false
      } else cur += c
    } else if (c === '"') inQ = true
    else if (c === ',') {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

// Friendly metro-area names for major hubs (CSV "city" is the local town,
// e.g. JFK -> "Inwood", LHR -> "West Drayton").
const CITY_OVERRIDES = {
  ATL: 'Atlanta', LAX: 'Los Angeles', ORD: 'Chicago', DFW: 'Dallas', DEN: 'Denver',
  JFK: 'New York', LGA: 'New York', EWR: 'New York', SFO: 'San Francisco', SEA: 'Seattle',
  MIA: 'Miami', BOS: 'Boston', LAS: 'Las Vegas', IAD: 'Washington', DCA: 'Washington',
  YYZ: 'Toronto', YVR: 'Vancouver', YUL: 'Montreal', MEX: 'Mexico City', GRU: 'São Paulo',
  GIG: 'Rio de Janeiro', EZE: 'Buenos Aires', BOG: 'Bogotá', LIM: 'Lima', SCL: 'Santiago',
  LHR: 'London', LGW: 'London Gatwick', STN: 'London Stansted', LCY: 'London City',
  CDG: 'Paris', ORY: 'Paris Orly', AMS: 'Amsterdam', FRA: 'Frankfurt', MUC: 'Munich',
  MAD: 'Madrid', BCN: 'Barcelona', FCO: 'Rome', MXP: 'Milan', ZRH: 'Zurich', GVA: 'Geneva',
  VIE: 'Vienna', CPH: 'Copenhagen', ARN: 'Stockholm', OSL: 'Oslo', HEL: 'Helsinki',
  DUB: 'Dublin', LIS: 'Lisbon', ATH: 'Athens', IST: 'Istanbul', SVO: 'Moscow', DME: 'Moscow',
  DXB: 'Dubai', AUH: 'Abu Dhabi', DOH: 'Doha', RUH: 'Riyadh', JED: 'Jeddah', TLV: 'Tel Aviv',
  CAI: 'Cairo', JNB: 'Johannesburg', CPT: 'Cape Town', NBO: 'Nairobi', LOS: 'Lagos',
  ADD: 'Addis Ababa', CMN: 'Casablanca', DEL: 'New Delhi', BOM: 'Mumbai', BLR: 'Bangalore',
  MAA: 'Chennai', HYD: 'Hyderabad', CCU: 'Kolkata', COK: 'Kochi', BKK: 'Bangkok',
  SIN: 'Singapore', KUL: 'Kuala Lumpur', CGK: 'Jakarta', MNL: 'Manila', SGN: 'Ho Chi Minh City',
  HAN: 'Hanoi', HKG: 'Hong Kong', TPE: 'Taipei', PEK: 'Beijing', PKX: 'Beijing', PVG: 'Shanghai',
  SHA: 'Shanghai', CAN: 'Guangzhou', SZX: 'Shenzhen', ICN: 'Seoul', GMP: 'Seoul',
  NRT: 'Tokyo', HND: 'Tokyo', KIX: 'Osaka', NGO: 'Nagoya', SYD: 'Sydney', MEL: 'Melbourne',
  BNE: 'Brisbane', PER: 'Perth', AKL: 'Auckland', CHC: 'Christchurch',
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countryName = (iso) => {
  if (!iso) return ''
  try {
    const n = regionNames.of(iso.toUpperCase())
    return n && n !== iso ? n : iso
  } catch {
    return iso
  }
}

const lines = csv.split(/\r?\n/)
const rows = []
const seen = new Set()
for (let i = 1; i < lines.length; i++) {
  if (!lines[i]) continue
  const f = parseLine(lines[i])
  const iata = (f[0] || '').trim().toUpperCase()
  const name = (f[2] || '').trim()
  const lat = parseFloat(f[3])
  const lon = parseFloat(f[4])
  const iso = (f[9] || '').trim()
  let city = (f[10] || '').trim()
  if (iata.length !== 3 || Number.isNaN(lat) || Number.isNaN(lon)) continue
  if (seen.has(iata)) continue
  seen.add(iata)
  if (CITY_OVERRIDES[iata]) city = CITY_OVERRIDES[iata]
  else if (!city) city = name
  rows.push([iata, city, countryName(iso), Math.round(lat * 1e4) / 1e4, Math.round(lon * 1e4) / 1e4])
}

rows.sort((a, b) => a[0].localeCompare(b[0]))

const body =
  '// AUTO-GENERATED from airports.csv (do not edit by hand).\n' +
  '// Format: [IATA, city, country, lat, lon]\n' +
  'export const RAW = ' +
  JSON.stringify(rows) +
  '\n'

writeFileSync('C:/Users/Parth Sharma/Documents/study-flight/src/airportsData.js', body)
console.log('airports:', rows.length)
console.log('sample:', JSON.stringify(rows.slice(0, 3)))
console.log('JFK:', JSON.stringify(rows.find((r) => r[0] === 'JFK')))
console.log('LHR:', JSON.stringify(rows.find((r) => r[0] === 'LHR')))
