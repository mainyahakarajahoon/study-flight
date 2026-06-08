import { useMemo, useState } from 'react'
import { FIDSClock } from './FIDSBoard'

const COLS = ['A', 'B', 'C', 'D', 'E', 'F']
const ROWS = 24
const FOCUS_ROWS = 4 // first N rows are Focus Class

const seatType = (col) => (col === 'A' || col === 'F' ? 'WINDOW' : col === 'C' || col === 'D' ? 'AISLE' : 'MIDDLE')

// Deterministic "already booked" seats, seeded by the flight number so the
// cabin looks the same every time you view this flight.
function buildOccupied(seedStr) {
  let seed = 0
  for (const ch of seedStr || 'ZS') seed = (seed * 31 + ch.charCodeAt(0)) & 0x7fffffff
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const occ = new Set()
  for (let r = 1; r <= ROWS; r++) {
    for (const c of COLS) {
      const p = r <= FOCUS_ROWS ? 0.45 : 0.3 // premium rows fill up faster
      if (rand() < p) occ.add(`${r}${c}`)
    }
  }
  return occ
}

export default function SeatMap({ flight, onConfirm, onBack }) {
  const { from, to, flightNo } = flight
  const occupied = useMemo(() => buildOccupied(flightNo), [flightNo])
  const [selected, setSelected] = useState(null)

  const Seat = ({ id, focus }) => {
    const isOcc = occupied.has(id)
    const isSel = selected === id
    const base =
      'w-7 h-7 sm:w-8 sm:h-8 rounded-md rounded-b-lg text-[9px] font-fids flex items-center justify-center transition-all'
    let cls
    if (isOcc) cls = 'bg-white/[0.06] border border-white/5 text-white/15 cursor-not-allowed'
    else if (isSel) cls = 'bg-fids-amber text-black font-bold border border-fids-amber shadow-[0_0_12px_rgba(245,166,35,0.6)] scale-110'
    else if (focus)
      cls = 'border border-fids-amber/45 text-fids-amber/70 hover:bg-fids-amber/15 hover:border-fids-amber cursor-pointer'
    else cls = 'border border-white/25 text-white/40 hover:border-fids-amber hover:text-fids-amber cursor-pointer'
    return (
      <button
        type="button"
        disabled={isOcc}
        onClick={() => setSelected(id)}
        className={`${base} ${cls}`}
        title={isOcc ? 'Occupied' : id}
      >
        {isSel ? id.replace(/\d+/, '') : ''}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-flight-bg text-fids-white font-fids flex flex-col">
      {/* header */}
      <div className="border-b border-fids-amber/30 px-4 sm:px-6 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={onBack} className="text-fids-dim hover:text-fids-amber text-xs tracking-[0.2em]">
            ← CHANGE FLIGHT
          </button>
          <FIDSClock className="text-fids-amber text-sm" />
        </div>
      </div>

      <div className="max-w-md w-full mx-auto px-4 flex-1 flex flex-col">
        <div className="text-center mt-5 mb-3">
          <h1 className="text-fids-amber text-xl sm:text-2xl tracking-[0.25em]">SELECT YOUR SEAT</h1>
          <p className="text-fids-dim text-[11px] tracking-[0.25em] mt-1">
            {from.iata} → {to.iata} • FLT {flightNo}
          </p>
        </div>

        {/* legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] tracking-[0.15em] text-fids-dim mb-3">
          <Legend swatch="border border-white/25" label="AVAILABLE" />
          <Legend swatch="border border-fids-amber/45 bg-fids-amber/10" label="FOCUS CLASS" />
          <Legend swatch="bg-fids-amber" label="YOUR SEAT" />
          <Legend swatch="bg-white/10" label="OCCUPIED" />
        </div>

        {/* cabin */}
        <div className="flex-1 overflow-y-auto thin-scroll">
          <div className="mx-auto w-fit bg-black/30 border-x border-white/10 rounded-t-[80px] px-4 sm:px-6 pt-10 pb-6">
            {/* nose / cockpit hint */}
            <div className="text-center text-fids-dim text-[9px] tracking-[0.3em] mb-4">✈ FLIGHT DECK</div>

            {/* column letters */}
            <div className="grid grid-cols-[20px_repeat(3,minmax(0,1fr))_18px_repeat(3,minmax(0,1fr))] gap-1.5 mb-2 text-center text-fids-dim text-[9px]">
              <span />
              {['A', 'B', 'C'].map((c) => (
                <span key={c}>{c}</span>
              ))}
              <span />
              {['D', 'E', 'F'].map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>

            {Array.from({ length: ROWS }, (_, i) => i + 1).map((row) => {
              const focus = row <= FOCUS_ROWS
              return (
                <div key={row}>
                  {row === FOCUS_ROWS + 1 && (
                    <div className="flex items-center gap-2 my-2 text-fids-dim text-[8px] tracking-[0.3em]">
                      <span className="h-px flex-1 bg-white/10" />
                      ECONOMY
                      <span className="h-px flex-1 bg-white/10" />
                    </div>
                  )}
                  <div className="grid grid-cols-[20px_repeat(3,minmax(0,1fr))_18px_repeat(3,minmax(0,1fr))] gap-1.5 mb-1.5 items-center">
                    <span className="text-fids-dim text-[9px] text-center">{row}</span>
                    <Seat id={`${row}A`} focus={focus} />
                    <Seat id={`${row}B`} focus={focus} />
                    <Seat id={`${row}C`} focus={focus} />
                    <span className="text-fids-dim/40 text-[8px] text-center">{row}</span>
                    <Seat id={`${row}D`} focus={focus} />
                    <Seat id={`${row}E`} focus={focus} />
                    <Seat id={`${row}F`} focus={focus} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* footer */}
        <div className="py-4 border-t border-white/10 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-fids-dim text-[10px] tracking-[0.25em]">SELECTED SEAT</div>
            <div className="text-right">
              {selected ? (
                <>
                  <span className="text-fids-amber text-2xl tracking-widest">{selected}</span>
                  <span className="text-fids-dim text-[10px] ml-2">
                    {seatType(selected.replace(/\d+/, ''))} •{' '}
                    {parseInt(selected) <= FOCUS_ROWS ? 'FOCUS CLASS' : 'ECONOMY'}
                  </span>
                </>
              ) : (
                <span className="text-fids-dim text-sm tracking-widest">— NONE —</span>
              )}
            </div>
          </div>
          <button
            disabled={!selected}
            onClick={() => onConfirm(selected)}
            className={`w-full py-4 tracking-[0.3em] font-bold transition-all ${
              selected
                ? 'bg-fids-amber text-black hover:bg-fids-gold active:scale-[0.99] shadow-[0_0_30px_rgba(245,166,35,0.35)]'
                : 'bg-white/5 text-fids-dim cursor-not-allowed'
            }`}
          >
            CONFIRM SEAT →
          </button>
        </div>
      </div>
    </div>
  )
}

function Legend({ swatch, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${swatch}`} />
      {label}
    </span>
  )
}
