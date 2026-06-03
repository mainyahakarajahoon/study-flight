import { useEffect, useRef, useState } from 'react'

/**
 * High-accuracy flight timer built on performance.now().
 * @param {number} durationSec total flight duration in seconds
 * @param {boolean} active whether the timer is running
 * @param {() => void} onComplete fired once when progress reaches 100%
 */
export function useFlightTimer(durationSec, active, onComplete) {
  const [elapsed, setElapsed] = useState(0) // seconds elapsed
  const startRef = useRef(null)
  const intervalRef = useRef(null)
  const doneRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!active) return
    doneRef.current = false
    // Anchor to performance.now() so elapsed stays accurate even if the
    // interval is throttled while the tab is backgrounded. Unlike
    // requestAnimationFrame, setInterval keeps firing when unfocused, so the
    // ring and map never freeze.
    startRef.current = performance.now()

    const sample = () => {
      const sec = (performance.now() - startRef.current) / 1000
      setElapsed(Math.min(sec, durationSec))
      if (sec >= durationSec && !doneRef.current) {
        doneRef.current = true
        clearInterval(intervalRef.current)
        onCompleteRef.current && onCompleteRef.current()
      }
    }
    sample()
    intervalRef.current = setInterval(sample, 200)
    return () => clearInterval(intervalRef.current)
  }, [active, durationSec])

  const progress = durationSec > 0 ? Math.min(1, elapsed / durationSec) : 0
  const remaining = Math.max(0, durationSec - elapsed)

  return { elapsed, remaining, progress }
}

export function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':')
}

export function formatClock(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}
