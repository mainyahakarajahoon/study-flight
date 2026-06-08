import { useMemo } from 'react'
import landData from './worldLand110.json'
import bordersData from './worldBorders110.json'
import { greatCirclePoint } from './geo'

const PW = 2000
const PH = 1000
const project = (lon, lat) => [((lon + 180) / 360) * PW, ((90 - lat) / 180) * PH]

function subpaths(coords) {
  const subs = []
  let cur = []
  let prevX = null
  for (const [lon, lat] of coords) {
    const [x, y] = project(lon, lat)
    if (prevX !== null && Math.abs(x - prevX) > PW / 2) {
      if (cur.length > 1) subs.push(cur)
      cur = []
    }
    cur.push([x, y])
    prevX = x
  }
  if (cur.length > 1) subs.push(cur)
  return subs
}

const ringsFrom = (g) =>
  g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? g.coordinates.flat() : []
const linesFrom = (g) =>
  g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []

// Static world geometry — built once at module load.
const LAND_PATH = (() => {
  let d = ''
  for (const f of landData.features)
    for (const ring of ringsFrom(f.geometry))
      for (const s of subpaths(ring))
        d += 'M' + s.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z'
  return d
})()
const BORDER_PATH = (() => {
  let d = ''
  for (const f of bordersData.features)
    for (const line of linesFrom(f.geometry))
      for (const s of subpaths(line))
        d += 'M' + s.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')
  return d
})()

export default function AirportsMap({ airports = [], flights = [] }) {
  // Great-circle arcs for each route flown.
  const routePaths = useMemo(() => {
    return flights
      .filter((f) => f.from && f.to)
      .map((f) => {
        const segs = []
        let cur = []
        let prevX = null
        for (let i = 0; i <= 80; i++) {
          const p = greatCirclePoint(f.from, f.to, i / 80)
          const [x, y] = project(p.lon, p.lat)
          if (prevX !== null && Math.abs(x - prevX) > PW / 2) {
            if (cur.length > 1) segs.push(cur)
            cur = []
          }
          cur.push([x, y])
          prevX = x
        }
        if (cur.length > 1) segs.push(cur)
        return segs
          .map((s) => 'M' + s.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L'))
          .join(' ')
      })
  }, [flights])

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-[#06070a]">
      <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full h-auto block">
        <defs>
          <radialGradient id="apOcean" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#0d0e10" />
            <stop offset="100%" stopColor="#040405" />
          </radialGradient>
          <linearGradient id="apLand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c2b28" />
            <stop offset="100%" stopColor="#1a1916" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={PW} height={PH} fill="url(#apOcean)" />
        <path d={BORDER_PATH} fill="none" stroke="#9c8a63" strokeOpacity="0.3" strokeWidth="0.5" strokeDasharray="1.5 2" />
        <path d={LAND_PATH} fill="url(#apLand)" stroke="#cdb079" strokeOpacity="0.4" strokeWidth="0.6" />

        {/* routes flown */}
        {routePaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#FFD36B" strokeOpacity="0.35" strokeWidth="1" strokeLinecap="round" />
        ))}

        {/* visited airports */}
        {airports.map((a) => {
          const [x, y] = project(a.lon, a.lat)
          return (
            <g key={a.iata}>
              <circle cx={x} cy={y} r="6" fill="#F5A623" fillOpacity="0.18" />
              <circle cx={x} cy={y} r="2.4" fill="#FFE08A" stroke="#7a5a16" strokeWidth="0.5" />
            </g>
          )
        })}
      </svg>
      {airports.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-fids-dim text-xs tracking-[0.25em]">
          NO AIRPORTS VISITED YET
        </div>
      )}
    </div>
  )
}
