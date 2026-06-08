import { useMemo, useState } from 'react'
import { getFlights, getAirportsCovered, getStats } from './store'
import { formatHMS } from './useFlightTimer'
import { FIDSClock } from './FIDSBoard'
import AirportsMap from './AirportsMap'

const fmtDate = (iso) =>
  new Date(iso)
    .toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()

function Stat({ label, value, sub }) {
  return (
    <div className="border border-white/12 bg-white/[0.03] px-4 py-3">
      <div className="text-fids-dim text-[10px] tracking-[0.25em]">{label}</div>
      <div className="text-fids-gold text-xl sm:text-2xl tabular-nums leading-tight mt-0.5">{value}</div>
      {sub && <div className="text-fids-dim text-[10px] tracking-widest mt-0.5">{sub}</div>}
    </div>
  )
}

function FlightCard({ f }) {
  const [open, setOpen] = useState(false)
  const hasNotes = (f.notes || '').trim().length > 0
  return (
    <div className="border-b border-white/8">
      <button
        onClick={() => hasNotes && setOpen((o) => !o)}
        className={`w-full grid grid-cols-[1fr_auto] gap-3 px-3 sm:px-4 py-3 text-left ${
          hasNotes ? 'hover:bg-white/[0.03]' : 'cursor-default'
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-fids-amber text-lg sm:text-xl">
            <span>{f.from?.iata}</span>
            <span className="text-fids-dim text-sm">✈</span>
            <span>{f.to?.iata}</span>
            <span className="text-fids-white/60 text-xs tracking-wider truncate hidden sm:inline">
              {f.from?.city} → {f.to?.city}
            </span>
          </div>
          <div className="text-fids-dim text-[10px] tracking-[0.2em] mt-1">
            {fmtDate(f.date)} • {f.distanceKm?.toLocaleString()} KM • FLT {f.flightNo || '—'}
            {hasNotes && <span className="text-fids-amber/70"> • 📝 NOTES</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-fids-gold font-fids tabular-nums">{formatHMS(f.studySeconds || 0)}</div>
          <div className="text-fids-dim text-[9px] tracking-[0.2em]">FOCUS TIME</div>
        </div>
      </button>
      {open && hasNotes && (
        <div className="px-3 sm:px-4 pb-4">
          <div className="bg-black/40 border border-white/10 p-3 text-white/80 text-sm whitespace-pre-wrap font-inter lined-paper">
            {f.notes}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PassportScreen({ user, onBack, onLogout }) {
  const [tab, setTab] = useState('flights') // 'flights' | 'airports'
  const flights = useMemo(() => getFlights(user.id), [user.id])
  const airports = useMemo(() => getAirportsCovered(user.id), [user.id])
  const stats = useMemo(() => getStats(user.id), [user.id])
  const memberSince = fmtDate(new Date(user.createdAt).toISOString())

  return (
    <div className="min-h-screen bg-fids-bg text-fids-white font-fids px-3 sm:px-6 py-5 sm:py-8">
      <div className="max-w-3xl mx-auto">
        {/* header */}
        <div className="flex items-center justify-between border-b border-fids-amber/30 pb-3 mb-4">
          <button onClick={onBack} className="text-fids-dim hover:text-fids-amber text-sm tracking-[0.2em]">
            ← DEPARTURES
          </button>
          <FIDSClock className="text-fids-amber text-lg" />
        </div>

        {/* passport identity */}
        <div className="border border-fids-amber/40 bg-gradient-to-br from-fids-amber/[0.07] to-transparent p-5 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-fids-dim text-[10px] tracking-[0.3em]">FOCUS FLIGHT PASSPORT</div>
              <div className="text-fids-amber text-2xl sm:text-3xl tracking-[0.12em] mt-1">
                {user.name.toUpperCase()}
              </div>
              <div className="text-fids-dim text-[11px] tracking-widest mt-1">{user.email}</div>
              <div className="text-fids-dim text-[10px] tracking-[0.25em] mt-2">MEMBER SINCE {memberSince}</div>
            </div>
            <button
              onClick={onLogout}
              className="text-fids-dim hover:text-red-400 text-[10px] tracking-[0.2em] border border-white/15 px-2 py-1"
            >
              LOG OUT
            </button>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="FLIGHTS" value={stats.flightCount} />
          <Stat label="FOCUS TIME" value={formatHMS(stats.studySeconds)} />
          <Stat label="AIRPORTS" value={stats.airports} />
          <Stat label="DISTANCE" value={`${(stats.distanceKm / 1000).toFixed(1)}K`} sub="KM FLOWN" />
        </div>

        {/* tabs */}
        <div className="flex gap-1 mb-4">
          {[
            ['flights', `FLIGHT LOG (${flights.length})`],
            ['airports', `AIRPORTS (${airports.length})`],
          ].map(([id, lbl]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-xs tracking-[0.2em] border ${
                tab === id
                  ? 'border-fids-amber text-fids-amber bg-fids-amber/10'
                  : 'border-white/12 text-fids-dim hover:text-fids-white'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {tab === 'flights' &&
          (flights.length ? (
            <div className="border border-white/10">
              {flights.map((f) => (
                <FlightCard key={f.id} f={f} />
              ))}
            </div>
          ) : (
            <EmptyState text="No flights logged yet. Complete a focus flight and it'll appear here." />
          ))}

        {tab === 'airports' && (
          <div>
            <AirportsMap airports={airports} flights={flights} />
            {airports.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {airports
                  .slice()
                  .sort((a, b) => b.visits - a.visits)
                  .map((a) => (
                    <div
                      key={a.iata}
                      className="flex items-center justify-between border border-white/10 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <span className="text-fids-gold tracking-wider">{a.iata}</span>
                        <span className="text-fids-white/70 text-xs ml-2 truncate">{a.city}</span>
                      </div>
                      <span className="text-fids-dim text-[10px] tracking-widest">×{a.visits}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="border border-dashed border-white/15 py-12 text-center text-fids-dim text-sm tracking-widest px-4">
      {text}
    </div>
  )
}
