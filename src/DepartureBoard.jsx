import { useEffect, useMemo, useRef, useState } from 'react'
import { haversine, flightDurationSeconds } from './airports'
import { SplitFlap, FIDSClock } from './FIDSBoard'

const AMBIENT = [
  { code: 'AF 1180', dest: 'PARIS', gate: 'A12', time: '08:40', status: 'BOARDING' },
  { code: 'BA 0249', dest: 'LONDON', gate: 'B03', time: '09:05', status: 'ON TIME' },
  { code: 'LH 0411', dest: 'FRANKFURT', gate: 'C21', time: '09:30', status: 'DEPARTED' },
  { code: 'EK 0202', dest: 'DUBAI', gate: 'D07', time: '10:15', status: 'ON TIME' },
  { code: 'SQ 0025', dest: 'SINGAPORE', gate: 'A05', time: '10:50', status: 'DELAYED' },
]

const statusColor = (s) =>
  s === 'BOARDING'
    ? 'text-green-400'
    : s === 'DELAYED'
      ? 'text-red-400'
      : s === 'DEPARTED'
        ? 'text-fids-dim'
        : 'text-fids-white'

function AirportPicker({ label, value, onSelect, exclude, airports, loading }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toUpperCase()
    const out = []
    for (const a of airports) {
      if (a.iata === exclude) continue
      if (
        !q ||
        a.iata.includes(q) ||
        a.city.toUpperCase().includes(q) ||
        a.country.toUpperCase().includes(q)
      ) {
        out.push(a)
        if (out.length >= 60) break
      }
    }
    return out
  }, [query, exclude, airports])

  return (
    <div className="relative border-b border-white/10">
      <button
        onClick={() => !loading && setOpen((o) => !o)}
        disabled={loading}
        className="w-full grid grid-cols-[64px_1fr_auto] items-center gap-3 px-3 sm:px-5 py-4 text-left hover:bg-white/5 transition-colors disabled:opacity-60"
      >
        <span className="font-fids text-fids-dim text-sm tracking-widest">{label}</span>
        {value ? (
          <span className="font-fids text-fids-amber text-lg sm:text-2xl truncate">
            {value.city.toUpperCase()}{' '}
            <span className="text-fids-white/70 text-base">/ {value.country}</span>
          </span>
        ) : (
          <span className="font-fids text-fids-dim text-lg sm:text-2xl">
            {loading ? 'LOADING…' : '— SELECT —'}
          </span>
        )}
        <span className="font-fids text-fids-gold text-lg sm:text-2xl tracking-widest">
          {value ? value.iata : '•••'}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 top-full bg-black border border-fids-amber/40 shadow-2xl max-h-72 overflow-y-auto thin-scroll">
          <div className="sticky top-0 bg-black p-2 border-b border-white/10">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${airports.length.toLocaleString()} airports…`}
              className="w-full bg-black border border-white/20 px-3 py-2 font-fids text-fids-amber placeholder:text-fids-dim outline-none focus:border-fids-amber"
            />
          </div>
          {results.map((a) => (
            <button
              key={a.iata}
              onClick={() => {
                onSelect(a)
                setOpen(false)
                setQuery('')
              }}
              className="w-full grid grid-cols-[56px_1fr_auto] gap-2 items-center px-3 py-2 text-left hover:bg-fids-amber/15 border-b border-white/5"
            >
              <span className="font-fids text-fids-gold tracking-wider">{a.iata}</span>
              <span className="font-fids text-fids-white truncate">{a.city.toUpperCase()}</span>
              <span className="font-fids text-fids-dim text-xs">{a.country}</span>
            </button>
          ))}
          {results.length === 0 && (
            <div className="px-3 py-4 font-fids text-fids-dim text-sm">NO MATCHING AIRPORTS</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DepartureBoard({ onCheckIn, user, onOpenPassport }) {
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [airports, setAirports] = useState([])
  const flipKey = useRef(0)

  // Load the full 9,000+ airport dataset on demand so the board paints instantly.
  useEffect(() => {
    let alive = true
    import('./airportsData').then((m) => {
      if (!alive) return
      setAirports(
        m.RAW.map(([iata, city, country, lat, lon]) => ({ iata, city, country, lat, lon }))
      )
    })
    return () => {
      alive = false
    }
  }, [])
  const loading = airports.length === 0

  const ready = from && to
  const distanceKm = ready ? Math.round(haversine(from, to)) : 0
  const durationSec = ready ? flightDurationSeconds(from, to) : 0
  const durH = Math.floor(durationSec / 3600)
  const durM = Math.round((durationSec % 3600) / 60)

  const handleCheckIn = () => {
    if (!ready) return
    onCheckIn({ from, to, distanceKm, durationSec })
  }

  return (
    <div className="min-h-screen bg-fids-bg text-fids-white px-3 sm:px-6 py-5 sm:py-8 font-fids">
      <div className="max-w-3xl mx-auto">
        {/* Traveller bar */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-fids-dim tracking-[0.25em]">
            ✦ WELCOME, <span className="text-fids-amber">{(user?.name || 'TRAVELLER').toUpperCase()}</span>
          </span>
          <button
            onClick={onOpenPassport}
            className="text-fids-dim hover:text-fids-amber tracking-[0.25em] border border-white/15 hover:border-fids-amber/50 px-3 py-1.5 transition-colors"
          >
            🛂 PASSPORT ▸
          </button>
        </div>

        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-fids-amber/60 pb-3 mb-2">
          <div>
            <h1 className="text-fids-amber text-3xl sm:text-5xl tracking-[0.2em] leading-none">
              DEPARTURES
            </h1>
            <p className="text-fids-dim text-xs sm:text-sm tracking-[0.3em] mt-1">
              FOCUS FLIGHT • INTERNATIONAL TERMINAL F
            </p>
          </div>
          <FIDSClock className="text-fids-amber text-xl sm:text-3xl" />
        </div>

        {/* The user's flight builder — at the top, build your itinerary first */}
        <div className="mt-5 border border-fids-amber/40">
          <div className="px-3 sm:px-5 py-2 bg-fids-amber/10 border-b border-fids-amber/30 text-fids-amber text-xs tracking-[0.3em]">
            ✈ YOUR FLIGHT — BUILD ITINERARY
          </div>
          <AirportPicker
            label="FROM"
            value={from}
            onSelect={setFrom}
            exclude={to?.iata}
            airports={airports}
            loading={loading}
          />
          <AirportPicker
            label="TO"
            value={to}
            onSelect={setTo}
            exclude={from?.iata}
            airports={airports}
            loading={loading}
          />

          {/* Split-flap destination banner */}
          {ready && (
            <div className="px-3 sm:px-5 py-4 border-b border-white/10 bg-black">
              <div className="text-fids-dim text-xs tracking-[0.3em] mb-1">NOW DISPLAYING</div>
              <div className="text-fids-amber text-2xl sm:text-4xl tracking-[0.15em]">
                <SplitFlap
                  key={`${from.iata}-${to.iata}-${flipKey.current++}`}
                  text={`${from.iata} ${to.iata}  ${to.city}`}
                  speed={40}
                  settleStagger={55}
                />
              </div>
            </div>
          )}

          {/* Distance + duration highlight row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 px-3 sm:px-5 py-4 bg-fids-amber/5">
            <div>
              <div className="text-fids-dim text-[10px] tracking-[0.25em]">DISTANCE</div>
              <div className="text-fids-gold text-lg sm:text-2xl tabular-nums">
                {ready ? `${distanceKm.toLocaleString()} KM` : '—'}
              </div>
            </div>
            <div>
              <div className="text-fids-dim text-[10px] tracking-[0.25em]">EST. DURATION</div>
              <div className="text-fids-gold text-lg sm:text-2xl tabular-nums">
                {ready ? `${durH}H ${String(durM).padStart(2, '0')}M` : '—'}
              </div>
            </div>
            <div>
              <div className="text-fids-dim text-[10px] tracking-[0.25em]">CRUISE</div>
              <div className="text-fids-gold text-lg sm:text-2xl tabular-nums">
                {ready ? '900 KM/H' : '—'}
              </div>
            </div>
            <div>
              <div className="text-fids-dim text-[10px] tracking-[0.25em]">STATUS</div>
              <div className={`text-lg sm:text-2xl ${ready ? 'text-fids-amber' : 'text-fids-dim'}`}>
                {ready ? (
                  <>
                    READY<span className="animate-blink">▋</span>
                  </>
                ) : (
                  'PENDING'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Check in */}
        <button
          disabled={!ready}
          onClick={handleCheckIn}
          className={`mt-6 w-full py-4 text-lg sm:text-xl tracking-[0.3em] font-bold transition-all ${
            ready
              ? 'bg-fids-amber text-black hover:bg-fids-gold active:scale-[0.99] shadow-[0_0_30px_rgba(245,166,35,0.35)]'
              : 'bg-white/5 text-fids-dim cursor-not-allowed'
          }`}
        >
          CHECK IN →
        </button>
        <p className="text-center text-fids-dim text-xs mt-3 tracking-widest">
          Your flight time becomes your focus session.
        </p>

        {/* Other departures — ambient board dressing */}
        <div className="mt-10">
          <div className="text-fids-dim text-xs tracking-[0.3em] mb-2 px-1">OTHER DEPARTURES</div>
          <div className="hidden sm:grid grid-cols-[1.4fr_1fr_0.6fr_1fr] gap-4 px-5 py-2 text-fids-dim text-[10px] tracking-[0.25em] border-b border-white/10">
            <span>DESTINATION</span>
            <span>FLIGHT</span>
            <span>GATE</span>
            <span className="text-right">STATUS</span>
          </div>
          {AMBIENT.map((r, i) => (
            <div
              key={r.code}
              className="grid grid-cols-[1.4fr_1fr_0.6fr_1fr] gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 border-b border-white/5 opacity-45"
              style={{ animation: `fids-flicker ${6 + i}s infinite` }}
            >
              <span className="text-fids-white tracking-widest truncate">{r.dest}</span>
              <span className="text-fids-dim hidden sm:block">{r.code}</span>
              <span className="text-fids-dim hidden sm:block">{r.gate}</span>
              <span className={`text-right text-sm ${statusColor(r.status)}`}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
