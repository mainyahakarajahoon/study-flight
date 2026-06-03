import { useMemo } from 'react'
import landData from './worldLand50.json'
import bordersData from './worldBorders50.json'
import { greatCirclePoint, formatLatLon } from './geo'

// Projection space (equirectangular). Larger = more spatial resolution.
const PW = 2000
const PH = 1000
const project = (lon, lat) => [((lon + 180) / 360) * PW, ((90 - lat) / 180) * PH]

// Viewport (the visible "camera" window). Slice-fills the screen.
const VW = 1200
const VH = 800
const Z = 3.4 // zoom — how close the camera sits to the surface

function polysFromGeometry(geom) {
  if (geom.type === 'Polygon') return geom.coordinates
  if (geom.type === 'MultiPolygon') return geom.coordinates.flat()
  return []
}

function linesFromGeometry(geom) {
  if (geom.type === 'LineString') return [geom.coordinates]
  if (geom.type === 'MultiLineString') return geom.coordinates
  return []
}

// Split a ring into subpaths, breaking at the antimeridian seam.
function ringToSubpaths(ring) {
  const subs = []
  let cur = []
  let prevX = null
  for (const [lon, lat] of ring) {
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

export default function WorldMap({ from, to, progress }) {
  // Static land path — built once.
  const landPath = useMemo(() => {
    let d = ''
    for (const feature of landData.features) {
      for (const ring of polysFromGeometry(feature.geometry)) {
        for (const sub of ringToSubpaths(ring)) {
          d += 'M' + sub.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z'
        }
      }
    }
    return d
  }, [])

  // Static country-border lines — built once (open polylines, no closing).
  const bordersPath = useMemo(() => {
    let d = ''
    for (const feature of bordersData.features) {
      for (const line of linesFromGeometry(feature.geometry)) {
        for (const sub of ringToSubpaths(line)) {
          d += 'M' + sub.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')
        }
      }
    }
    return d
  }, [])

  // Great-circle route as screen polylines (split at antimeridian).
  const routePath = useMemo(() => {
    const N = 220
    const segs = []
    let cur = []
    let prevX = null
    for (let i = 0; i <= N; i++) {
      const p = greatCirclePoint(from, to, i / N)
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
  }, [from, to])

  const [ox, oy] = project(from.lon, from.lat)
  const [dx, dy] = project(to.lon, to.lat)

  // Aircraft position + heading (in projection space).
  const cur = greatCirclePoint(from, to, progress)
  const ahead = greatCirclePoint(from, to, Math.min(1, progress + 0.01))
  const [px, py] = project(cur.lon, cur.lat)
  const [ax, ay] = project(ahead.lon, ahead.lat)
  const headingDeg = (Math.atan2(ay - py, ax - px) * 180) / Math.PI

  // Camera: translate so the aircraft sits at the viewport centre, scaled by Z.
  // Uses valid CSS transform syntax (px + comma) with transform-box:view-box so
  // it operates in the SVG viewBox coordinate space from origin (0,0).
  const tx = (VW / 2 - px * Z).toFixed(2)
  const ty = (VH / 2 - py * Z).toFixed(2)
  const camStyle = {
    transform: `translate(${tx}px, ${ty}px) scale(${Z})`,
    transformBox: 'view-box',
    transformOrigin: '0px 0px',
    transition: 'transform 0.25s linear',
  }

  return (
    <div className="absolute inset-0 bg-[#06070a]">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block"
      >
        <defs>
          <radialGradient id="ocean" cx="50%" cy="46%" r="85%">
            <stop offset="0%" stopColor="#0d0e10" />
            <stop offset="55%" stopColor="#08090a" />
            <stop offset="100%" stopColor="#040405" />
          </radialGradient>
          <linearGradient id="landFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c2b28" />
            <stop offset="100%" stopColor="#1a1916" />
          </linearGradient>
          <radialGradient id="planeSpot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F5A623" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
          </radialGradient>
          <filter id="planeGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width={VW} height={VH} fill="url(#ocean)" />

        {/* Panning + zoomed world */}
        <g style={camStyle}>
          {/* graticule */}
          <g stroke="#F5A623" strokeOpacity="0.05" strokeWidth="0.5" vectorEffect="non-scaling-stroke">
            {[...Array(35)].map((_, i) => (
              <line key={`v${i}`} x1={(i * PW) / 36} y1="0" x2={(i * PW) / 36} y2={PH} />
            ))}
            {[...Array(17)].map((_, i) => (
              <line key={`h${i}`} x1="0" y1={((i + 1) * PH) / 18} x2={PW} y2={((i + 1) * PH) / 18} />
            ))}
          </g>

          {/* land — slate fill with a soft coast halo */}
          <path
            d={landPath}
            fill="url(#landFill)"
            stroke="#cdb079"
            strokeOpacity="0.22"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
          />
          {/* country borders — subtle dashed hairlines */}
          <path
            d={bordersPath}
            fill="none"
            stroke="#9c8a63"
            strokeOpacity="0.4"
            strokeWidth="0.4"
            strokeDasharray="1.5 2"
            vectorEffect="non-scaling-stroke"
          />
          {/* crisp champagne coastline */}
          <path
            d={landPath}
            fill="none"
            stroke="#f2d9a3"
            strokeOpacity="0.55"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* full route (dim dashed) */}
          <path
            d={routePath}
            fill="none"
            stroke="#caa15a"
            strokeOpacity="0.35"
            strokeWidth="1.4"
            strokeDasharray="3 5"
            vectorEffect="non-scaling-stroke"
          />
          {/* flown portion — soft glow halo */}
          <path
            d={routePath}
            fill="none"
            stroke="#FFD36B"
            strokeOpacity="0.3"
            strokeWidth="7"
            strokeLinecap="round"
            pathLength="1000"
            strokeDasharray={`${progress * 1000} 1000`}
            vectorEffect="non-scaling-stroke"
            style={{ transition: 'stroke-dasharray 0.25s linear' }}
          />
          {/* flown portion — bright core */}
          <path
            d={routePath}
            fill="none"
            stroke="#FFE08A"
            strokeWidth="2.2"
            strokeLinecap="round"
            pathLength="1000"
            strokeDasharray={`${progress * 1000} 1000`}
            vectorEffect="non-scaling-stroke"
            style={{ transition: 'stroke-dasharray 0.25s linear' }}
          />

          {/* origin / destination markers */}
          <g vectorEffect="non-scaling-stroke">
            <circle cx={ox} cy={oy} r="2" fill="#F5A623" stroke="#000" strokeWidth="0.4" />
            <circle cx={dx} cy={dy} r="2" fill="#fff" stroke="#000" strokeWidth="0.4" />
          </g>
          <text x={ox} y={oy - 4} fill="#F5A623" fontSize="6" fontFamily="Share Tech Mono" textAnchor="middle">
            {from.iata}
          </text>
          <text x={dx} y={dy - 4} fill="#fff" fontSize="6" fontFamily="Share Tech Mono" textAnchor="middle">
            {to.iata}
          </text>
        </g>

        {/* Aircraft — pinned to the centre of the viewport */}
        <g transform={`translate(${VW / 2} ${VH / 2})`}>
          {/* soft spotlight (crisp falloff, not a diffuse blob) */}
          <circle r="58" fill="url(#planeSpot)" />
          {/* expanding sonar ping */}
          <circle r="30" fill="none" stroke="#FFD36B" strokeOpacity="0.4" strokeWidth="1">
            <animate attributeName="r" values="16;44;16" dur="3.4s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="3.4s" repeatCount="indefinite" />
          </circle>
          <text
            fontSize="32"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            transform={`rotate(${headingDeg + 45})`}
            style={{ transition: 'transform 0.25s linear', filter: 'drop-shadow(0 0 5px rgba(255,200,90,0.95))' }}
          >
            ✈
          </text>
        </g>
      </svg>

      {/* cinematic vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 220px 70px rgba(0,0,0,0.75)' }}
      />
      {/* subtle top sheen */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
        style={{ background: 'linear-gradient(to bottom, rgba(245,166,35,0.04), transparent)' }}
      />

      {/* Live coordinate chip under the aircraft */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-10 pointer-events-none">
        <div className="font-fids text-[11px] sm:text-sm text-fids-amber bg-black/55 px-3 py-1 rounded-full whitespace-nowrap text-center">
          {formatLatLon(cur)}
        </div>
      </div>
    </div>
  )
}
