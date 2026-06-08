import { useMemo, useRef, useState } from 'react'
import { formatClock } from './useFlightTimer'

function randomFlightNo() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const a = letters[Math.floor(Math.random() * letters.length)]
  const b = letters[Math.floor(Math.random() * letters.length)]
  const n = Math.floor(1000 + Math.random() * 8999)
  return `${a}${b} ${n}`
}
const randomSeat = () => `${Math.floor(1 + Math.random() * 42)}${'ABCDEF'[Math.floor(Math.random() * 6)]}`
const randomGate = () => `${'ABCD'[Math.floor(Math.random() * 4)]}${Math.floor(1 + Math.random() * 30)}`
const randomSeq = () => String(Math.floor(1 + Math.random() * 180)).padStart(3, '0')

// Refined Code-128-style barcode
function Barcode({ className = 'w-full h-14' }) {
  const { rects, total } = useMemo(() => {
    const out = []
    let seed = 13
    let x = 0
    for (let i = 0; i < 64; i++) {
      seed = (seed * 9301 + 49297) % 233280
      const w = 1 + (seed % 3)
      if (i % 2 === 0) out.push(<rect key={i} x={x} y="0" width={w} height="60" fill="#15161a" />)
      x += w
    }
    return { rects: out, total: x }
  }, [])
  return (
    <svg viewBox={`0 0 ${total} 60`} className={className} preserveAspectRatio="none">
      {rects}
    </svg>
  )
}

// Gold airline emblem
function Emblem({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="none" stroke="#caa14a" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="#caa14a" strokeWidth="0.6" strokeOpacity="0.5" />
      <text x="20" y="21" textAnchor="middle" dominantBaseline="central" fontSize="16" fill="#caa14a">
        ✈
      </text>
    </svg>
  )
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[8px] tracking-[0.22em] uppercase text-amber-700/80">{label}</div>
      <div className="font-fids text-gray-900 text-sm sm:text-[15px] leading-tight truncate">{value}</div>
    </div>
  )
}

export default function BoardingPass({ flight, user, onBoard }) {
  const { from, to, durationSec } = flight
  const [name, setName] = useState((user?.name || 'STUDENT PASSENGER').toUpperCase())
  const [tear, setTear] = useState(0)
  const [torn, setTorn] = useState(false)
  const wrapRef = useRef(null)
  const dragging = useRef(false)
  const startY = useRef(0)

  const flightNo = useMemo(() => flight.flightNo || randomFlightNo(), [flight.flightNo])
  const seat = useMemo(() => flight.seat || randomSeat(), [flight.seat])
  const gate = useMemo(randomGate, [])
  const seq = useMemo(randomSeq, [])
  const zone = useMemo(() => Math.floor(1 + Math.random() * 4), [])
  const now = useMemo(() => new Date(), [])
  const arrival = useMemo(() => new Date(now.getTime() + durationSec * 1000), [now, durationSec])
  const boarding = useMemo(() => new Date(now.getTime() - 35 * 60000), [now])
  const dateStr = `${String(now.getDate()).padStart(2, '0')} ${now
    .toLocaleString('en', { month: 'short' })
    .toUpperCase()} ${String(now.getFullYear()).slice(2)}`

  const onPointerDown = (e) => {
    if (torn) return
    dragging.current = true
    startY.current = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!dragging.current || torn) return
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    const h = wrapRef.current?.offsetHeight || 220
    const p = Math.max(0, Math.min(1, (y - startY.current) / h))
    setTear(p)
    if (p >= 0.9) {
      setTorn(true)
      setTear(1)
      dragging.current = false
    }
  }
  const onPointerUp = () => {
    dragging.current = false
    if (!torn) setTear(0)
  }

  const gap = tear * 14
  const mainShift = torn ? -20 : -gap / 2
  const stubShift = torn ? 20 : gap / 2

  // Subtle paper texture + guilloché-ish security feel
  const paperStyle = {
    background:
      'repeating-linear-gradient(135deg, rgba(0,0,0,0.018) 0 1px, transparent 1px 7px), linear-gradient(180deg, #fbf9f3, #f3efe4)',
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-3 py-10 font-inter relative overflow-hidden"
      style={{ background: 'radial-gradient(circle at 50% 25%, #0c1936, #050d2a 55%, #03081b)' }}
    >
      <div className="text-center mb-6 z-10">
        <div className="flex items-center justify-center gap-3 text-fids-amber font-fids tracking-[0.3em] text-sm">
          <span className="h-px w-8 bg-fids-amber/40" />
          BOARDING PASS
          <span className="h-px w-8 bg-fids-amber/40" />
        </div>
        <div className="text-white/45 text-[11px] mt-2 tracking-widest">
          {torn ? 'TICKET TORN — READY TO BOARD' : 'DRAG DOWN THE PERFORATION TO TEAR ✂'}
        </div>
      </div>

      <div ref={wrapRef} className="relative w-full max-w-3xl select-none z-10" style={{ perspective: '1400px' }}>
        <div className="flex items-stretch" style={{ minHeight: 240 }}>
          {/* MAIN SECTION */}
          <div
            className="flex-1 rounded-l-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] transition-transform duration-500 relative"
            style={{ ...paperStyle, transform: `translateX(${mainShift}px) rotate(${torn ? -1.4 : 0}deg)` }}
          >
            {/* gold top hairline */}
            <div className="h-1 bg-gradient-to-r from-[#caa14a] via-[#f0d9a0] to-[#caa14a]" />

            {/* header band */}
            <div className="relative bg-gradient-to-r from-[#0b1733] to-[#16305f] px-4 sm:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Emblem />
                <div>
                  <div className="font-fids text-amber-300 text-base tracking-[0.22em] leading-none">FOCUS AIR</div>
                  <div className="text-white/45 text-[7px] tracking-[0.35em] mt-1">PREMIUM FOCUS CARRIER</div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block bg-amber-300/90 text-[#0b1733] text-[10px] font-bold tracking-[0.15em] px-2 py-0.5 rounded">
                  FOCUS CLASS
                </span>
                <div className="text-amber-200/60 text-[7px] tracking-[0.3em] mt-1">SKYPRIORITY ✦</div>
              </div>
            </div>

            {/* watermark */}
            <span className="pointer-events-none absolute right-4 bottom-2 text-[120px] leading-none text-gray-900/[0.04] select-none">
              ✈
            </span>

            <div className="px-4 sm:px-6 py-5 relative">
              {/* route */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-center">
                  <div className="text-4xl sm:text-6xl font-fids text-[#0b1733] leading-none">{from.iata}</div>
                  <div className="text-[10px] text-gray-500 mt-1.5 tracking-widest uppercase truncate max-w-[120px]">
                    {from.city}
                  </div>
                </div>
                <div className="flex-1 flex items-center px-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-700/40" />
                  <span className="text-amber-700 text-xl px-1">✈</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-700/40" />
                </div>
                <div className="text-center">
                  <div className="text-4xl sm:text-6xl font-fids text-[#0b1733] leading-none">{to.iata}</div>
                  <div className="text-[10px] text-gray-500 mt-1.5 tracking-widest uppercase truncate max-w-[120px]">
                    {to.city}
                  </div>
                </div>
              </div>

              {/* passenger */}
              <div className="mt-5">
                <div className="text-[8px] tracking-[0.22em] text-amber-700/80 uppercase mb-1">Passenger Name</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  className="w-full font-boarding text-xl sm:text-2xl text-[#0b1733] bg-transparent border-b border-dotted border-gray-400 focus:border-amber-600 outline-none pb-1"
                />
              </div>

              {/* gold divider */}
              <div className="h-px bg-amber-700/20 my-4" />

              {/* fields */}
              <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                <Field label="Flight" value={flightNo} />
                <Field label="Date" value={dateStr} />
                <Field label="Boarding" value={formatClock(boarding)} />
                <Field label="Departs" value={formatClock(now)} />
                <Field label="Arrives" value={formatClock(arrival)} />
                <Field label="Gate" value={gate} />
                <Field label="Seat" value={seat} />
                <Field label="Zone" value={`GROUP ${zone}`} />
              </div>
            </div>
          </div>

          {/* PERFORATION / DRAG HANDLE */}
          <div
            className="relative w-7 sm:w-8 cursor-grab active:cursor-grabbing touch-none z-20"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {/* notches (punched ticket look) */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#050d2a]" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#050d2a]" />
            <div className="absolute inset-y-3 left-1/2 -translate-x-1/2 w-[3px] perf-line" />
            {!torn && (
              <div
                className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
                style={{ top: `calc(${8 + tear * 80}%)` }}
              >
                <div className="bg-fids-amber text-black rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg animate-bounce">
                  ✂
                </div>
              </div>
            )}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[3px] bg-amber-500"
              style={{ top: 12, height: `${tear * 88}%` }}
            />
          </div>

          {/* STUB SECTION */}
          <div
            className="w-36 sm:w-56 rounded-r-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] transition-transform duration-500 relative"
            style={{ ...paperStyle, transform: `translateX(${stubShift}px) rotate(${torn ? 1.4 : 0}deg)` }}
          >
            <div className="h-1 bg-gradient-to-r from-[#caa14a] via-[#f0d9a0] to-[#caa14a]" />
            <div className="bg-gradient-to-r from-[#0b1733] to-[#16305f] px-3 py-2.5 flex items-center justify-between">
              <span className="text-amber-300/90 font-fids text-[10px] tracking-[0.2em]">BOARDING</span>
              <Emblem size={18} />
            </div>
            <div className="px-3 py-3.5 flex flex-col h-[calc(100%-44px)]">
              <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
                <Field label="Flight" value={flightNo} />
                <Field label="Gate" value={gate} />
                <Field label="Seat" value={seat} />
                <Field label="Zone" value={`G${zone}`} />
              </div>
              <div className="mt-1.5 truncate">
                <div className="text-[8px] tracking-[0.22em] uppercase text-amber-700/80">Passenger</div>
                <div className="font-fids text-[#0b1733] text-xs truncate">{name}</div>
              </div>
              <div className="mt-auto pt-3">
                <Barcode />
                <div className="flex items-center justify-between mt-1">
                  <span className="font-fids text-[8px] tracking-[0.2em] text-gray-500">
                    {from.iata}•{to.iata}
                  </span>
                  <span className="font-fids text-[8px] tracking-[0.2em] text-gray-500">SEQ {seq}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress hint bar */}
        {!torn && (
          <div className="mt-5 mx-auto max-w-xs">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-75"
                style={{ width: `${tear * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {torn && (
        <button
          onClick={onBoard}
          className="mt-8 bg-fids-amber text-black px-10 py-4 font-fids tracking-[0.3em] text-lg hover:bg-fids-gold active:scale-95 transition-all shadow-[0_0_30px_rgba(245,166,35,0.4)] animate-fade-in z-10"
        >
          BOARD FLIGHT →
        </button>
      )}
    </div>
  )
}
