import { useEffect, useMemo, useRef, useState } from 'react'
import { useFlightTimer, formatHMS, formatClock } from './useFlightTimer'
import WorldMap from './WorldMap'

const PHASES = [
  { at: 0, msg: 'Takeoff! Engines at full power. 🛫' },
  { at: 0.15, msg: 'Climbing to cruising altitude. Focus mode engaged.' },
  { at: 0.3, msg: 'Cruising at 35,000 ft. Deep work time.' },
  { at: 0.5, msg: "Halfway there. You're doing great." },
  { at: 0.75, msg: 'Beginning descent. Final stretch!' },
  { at: 0.9, msg: 'Approach mode. Land strong.' },
  { at: 1, msg: 'Landed. 🛬' },
]

function phaseFor(p) {
  let m = PHASES[0].msg
  for (const ph of PHASES) if (p >= ph.at) m = ph.msg
  return m
}

// Climb/cruise/descent profile (0..1) based on REAL elapsed time, not a % of
// the route — aircraft climb to cruise in ~16 min and descend in ~22 min
// regardless of how long the flight is.
function climbProfile(elapsedSec, durationSec) {
  const climb = Math.min(16 * 60, durationSec * 0.4) // ~16 min climb
  const descent = Math.min(22 * 60, durationSec * 0.4) // ~22 min descent
  if (elapsedSec <= climb) return climb > 0 ? elapsedSec / climb : 1
  const descentStart = durationSec - descent
  if (elapsedSec >= descentStart)
    return descent > 0 ? Math.max(0, (durationSec - elapsedSec) / descent) : 0
  return 1
}

export default function FlightCockpit({ flight, onArrive }) {
  const { from, to, durationSec } = flight
  const { elapsed, remaining, progress } = useFlightTimer(durationSec, true, () => onArrive(elapsedRef.current))
  const elapsedRef = useRef(0)
  elapsedRef.current = elapsed

  const [notes, setNotes] = useState(() => localStorage.getItem('focusflight_notes') || '')
  const [soundOn, setSoundOn] = useState(false)
  const audioRef = useRef(null)

  const flightNo = useMemo(
    () => `ZS ${Math.floor(1000 + Math.random() * 8999)}`,
    []
  )
  const arrivalClock = useMemo(
    () => formatClock(new Date(Date.now() + remaining * 1000)),
    // recompute occasionally; based on initial remaining is fine but keep live-ish
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Persist notes
  useEffect(() => {
    localStorage.setItem('focusflight_notes', notes)
  }, [notes])

  // beforeunload guard mid-flight
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // Ambient cabin hum: brown noise + low oscillators via Web Audio API
  const toggleSound = () => {
    if (soundOn) {
      audioRef.current?.stop()
      audioRef.current = null
      setSoundOn(false)
      return
    }
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    // Browsers create the context in a "suspended" state; it must be resumed
    // from within a user gesture (this click) or no sound is produced.
    if (ctx.state === 'suspended') ctx.resume()
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, ctx.currentTime)
    master.connect(ctx.destination)

    // Brown noise buffer
    const bufferSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (last + 0.02 * white) / 1.02
      last = data[i]
      data[i] *= 3.5
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 420
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.5
    noise.connect(lp).connect(noiseGain).connect(master)
    noise.start()

    // Two low hum oscillators
    const oscs = [60, 95].map((f) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = 0.04
      o.connect(g).connect(master)
      o.start()
      return o
    })

    master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.2)

    audioRef.current = {
      stop: () => {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
        setTimeout(() => {
          try {
            noise.stop()
            oscs.forEach((o) => o.stop())
            ctx.close()
          } catch (e) {
            /* noop */
          }
        }, 450)
      },
    }
    setSoundOn(true)
  }
  useEffect(() => () => audioRef.current?.stop(), [])

  // Realistic per-flight cruise figures (typical jet airliner ranges).
  const cruiseAlt = useMemo(() => 35000 + Math.floor(Math.random() * 5) * 1000, []) // 35k–39k ft
  const cruiseSpeed = useMemo(() => 860 + Math.floor(Math.random() * 13) * 5, []) // 860–920 km/h
  const climbFrac = climbProfile(elapsed, durationSec)
  const altitude = climbFrac * cruiseAlt
  // Ground speed jumps to rotation speed (~280 km/h) at takeoff, then ramps to cruise.
  const speed = climbFrac <= 0 ? 0 : 280 + climbFrac * (cruiseSpeed - 280)

  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)

  // Compact HUD progress ring geometry
  const ringR = 30
  const ringC = 2 * Math.PI * ringR

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-flight-bg text-white font-inter">
      {/* FULL-SCREEN LIVE MAP (camera follows the aircraft) */}
      <WorldMap from={from} to={to} progress={progress} />

      {/* legibility scrims */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

      {/* TOP-LEFT — altitude + speed */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 w-36 sm:w-44">
        {[
          { label: 'ALTITUDE', value: altitude, max: 42000, unit: 'ft', color: '#3B82F6' },
          { label: 'GROUND SPEED', value: speed, max: 1000, unit: 'km/h', color: '#F5A623' },
        ].map((g) => (
          <div key={g.label} className="bg-black/55 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
            <div className="text-white/45 text-[9px] tracking-[0.2em]">{g.label}</div>
            <div className="font-fids tabular-nums text-lg leading-tight" style={{ color: g.color }}>
              {Math.round(g.value).toLocaleString()}
              <span className="text-white/40 text-[10px] ml-1">{g.unit}</span>
            </div>
            <div className="h-1 mt-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, (g.value / g.max) * 100)}%`, background: g.color, transition: 'width 0.25s linear' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* TOP-RIGHT — countdown + progress ring */}
      <div className="absolute top-3 right-3 z-20 bg-black/55 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 flex items-center gap-3">
        <div className="relative w-[64px] h-[64px]">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r={ringR} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r={ringR}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={ringC}
              strokeDashoffset={ringC * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 0.25s linear', filter: 'drop-shadow(0 0 5px rgba(59,130,246,0.7))' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-fids text-sm text-fids-accent">
            {Math.round(progress * 100)}%
          </div>
        </div>
        <div className="text-right">
          <div className="text-white/40 text-[9px] tracking-[0.25em]">REMAINING</div>
          <div className="font-fids text-xl sm:text-2xl tabular-nums leading-tight">{formatHMS(remaining)}</div>
        </div>
      </div>

      {/* TOP-CENTER — phase message */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 max-w-[55%] hidden md:block">
        <p
          key={phaseFor(progress)}
          className="text-center text-sm lg:text-base text-white bg-black/45 backdrop-blur-sm rounded-full px-4 py-2 animate-fade-in"
        >
          {phaseFor(progress)}
        </p>
      </div>

      {/* phase message (mobile, above FIDS bar) */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-[90%] md:hidden">
        <p key={phaseFor(progress)} className="text-center text-sm text-white/90 bg-black/45 rounded-full px-4 py-1.5 animate-fade-in">
          {phaseFor(progress)}
        </p>
      </div>

      {/* NOTES toggle + sliding panel */}
      <button
        onClick={() => setNotesOpen((o) => !o)}
        className="absolute top-1/2 -translate-y-1/2 right-3 z-30 bg-black/55 backdrop-blur-sm border border-white/15 rounded-lg px-2.5 py-3 text-xs font-fids tracking-widest hover:bg-black/70"
        style={{ writingMode: 'vertical-rl' }}
      >
        {notesOpen ? 'CLOSE ✕' : '📝 NOTES'}
      </button>
      <div
        className={`absolute top-0 right-0 h-full w-[300px] max-w-[85%] z-30 bg-[#06122f]/95 backdrop-blur-md border-l border-white/10 p-4 flex flex-col transition-transform duration-300 ${
          notesOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-[11px] tracking-[0.2em] uppercase">Flight Notes</span>
          <button onClick={() => setNotesOpen(false)} className="text-white/50 hover:text-white text-sm">
            ✕
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down what you're studying…"
          className="lined-paper thin-scroll flex-1 w-full resize-none bg-transparent text-white/90 outline-none text-sm px-1"
        />
        <div className="text-white/30 text-[10px] mt-2 text-right">autosaved to this device</div>
      </div>

      {/* BOTTOM FIDS BAR */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-black/85 border-t border-fids-amber/30 px-3 sm:px-5 py-2.5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-1 font-fids text-fids-amber text-xs sm:text-sm tracking-widest">
          <span>FLT {flightNo}</span>
          <span>
            {from.iata} <span className="text-fids-dim">→</span> {to.iata}
          </span>
          <span>
            ELAPSED <span className="text-fids-gold">{formatHMS(elapsed)}</span>
          </span>
          <span className="text-fids-dim hidden sm:inline">|</span>
          <span>
            EST. ARR <span className="text-fids-gold">{arrivalClock}</span>
          </span>
          <button
            onClick={toggleSound}
            className="border border-fids-amber/40 px-2 py-0.5 hover:bg-fids-amber/10 transition-colors"
          >
            {soundOn ? '🔊 CABIN HUM ON' : '🔈 SOUND OFF'}
          </button>
        </div>
      </div>

      {/* EMERGENCY LANDING */}
      <button
        onClick={() => setEmergencyOpen(true)}
        className="absolute bottom-14 left-3 z-30 bg-red-600/90 hover:bg-red-600 text-white text-[10px] tracking-widest px-3 py-1.5 rounded-md shadow-lg"
      >
        ⚠ EMERGENCY LANDING
      </button>

      {emergencyOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-flight-bg border border-red-500/50 rounded-xl p-6 max-w-sm text-center animate-fade-in">
            <div className="text-red-400 text-lg font-semibold mb-2">Abort the flight?</div>
            <p className="text-white/60 text-sm mb-5">
              This ends your focus session and returns to departures. Progress will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEmergencyOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm"
              >
                Keep Flying
              </button>
              <button
                onClick={() => {
                  audioRef.current?.stop()
                  window.onbeforeunload = null
                  onArrive(null) // null => aborted
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold"
              >
                Emergency Land
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
