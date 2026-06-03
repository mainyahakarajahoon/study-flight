import { useEffect, useRef, useState } from 'react'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * SplitFlap — animates a string with a Solari board flip effect.
 * Each character cycles through random glyphs before landing on the target.
 */
export function SplitFlap({ text, className = '', play = true, speed = 45, settleStagger = 70 }) {
  const target = (text || '').toUpperCase()
  const [display, setDisplay] = useState(play ? '' : target)
  const intervalRef = useRef(null)
  const timeoutsRef = useRef([])

  useEffect(() => {
    if (!play) {
      setDisplay(target)
      return
    }
    // Each character "settles" at a staggered time; until then it shows random glyphs.
    const settleAt = target.split('').map((_, i) => settleStagger * (i + 1))
    const started = performance.now()

    intervalRef.current = setInterval(() => {
      const t = performance.now() - started
      let allSettled = true
      const next = target
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' '
          if (t >= settleAt[i]) return ch
          allSettled = false
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        })
        .join('')
      setDisplay(next)
      if (allSettled) {
        clearInterval(intervalRef.current)
        setDisplay(target)
      }
    }, speed)

    return () => {
      clearInterval(intervalRef.current)
      timeoutsRef.current.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, play, speed, settleStagger])

  return (
    <span className={`inline-flex ${className}`} aria-label={target}>
      {display.split('').map((ch, i) => (
        <span key={i} className="flap-char">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
}

/** A single FIDS board row with grid columns. */
export function FIDSRow({ cols, highlight = false, dim = false, className = '' }) {
  return (
    <div
      className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_1fr_0.8fr_1fr] items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 border-b border-white/10 ${
        highlight ? 'bg-fids-amber/10' : ''
      } ${dim ? 'opacity-45' : ''} ${className}`}
    >
      {cols}
    </div>
  )
}

/** Live ticking clock in FIDS style. */
export function FIDSClock({ className = '' }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return (
    <span className={`font-fids tabular-nums ${className}`}>
      {hh}:{mm}
      <span className="text-fids-amber/60">:{ss}</span>
    </span>
  )
}
