import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { SplitFlap, FIDSClock } from './FIDSBoard'
import { formatHMS } from './useFlightTimer'

export default function ArrivalScreen({ flight, studySeconds, onRestart }) {
  const { from, to } = flight
  const [showFlap, setShowFlap] = useState(false)
  const notes = localStorage.getItem('focusflight_notes') || ''

  useEffect(() => {
    const t = setTimeout(() => setShowFlap(true), 300)
    // Confetti burst
    const fire = () => {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#F5A623', '#FFD700', '#3B82F6', '#ffffff'] })
      confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } })
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } })
    }
    const c1 = setTimeout(fire, 500)
    const c2 = setTimeout(fire, 1300)
    return () => {
      clearTimeout(t)
      clearTimeout(c1)
      clearTimeout(c2)
    }
  }, [])

  return (
    <div className="min-h-screen bg-fids-bg text-fids-white font-fids px-3 sm:px-6 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-fids-amber/60 pb-3 mb-4">
          <div>
            <h1 className="text-fids-amber text-3xl sm:text-5xl tracking-[0.2em] leading-none">
              ARRIVALS
            </h1>
            <p className="text-fids-dim text-xs tracking-[0.3em] mt-1">FOCUS FLIGHT • TERMINAL F</p>
          </div>
          <FIDSClock className="text-fids-amber text-xl sm:text-3xl" />
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1.6fr_1fr_0.9fr] gap-3 px-3 sm:px-5 py-2 text-fids-dim text-[10px] sm:text-xs tracking-[0.25em] border-b border-white/10">
          <span>FROM</span>
          <span className="hidden sm:block">ROUTE</span>
          <span className="text-right">STATUS</span>
        </div>

        {/* The user's arriving flight */}
        <div className="grid grid-cols-[1.6fr_1fr_0.9fr] gap-3 px-3 sm:px-5 py-5 bg-fids-amber/10 border-b border-fids-amber/30 items-center">
          <span className="text-fids-amber text-xl sm:text-3xl tracking-[0.1em]">
            <SplitFlap text={to.city} play={showFlap} speed={45} settleStagger={75} />
          </span>
          <span className="text-fids-dim hidden sm:block text-sm">
            {from.iata} → {to.iata}
          </span>
          <span className="text-right text-green-400 text-sm sm:text-lg">LANDED ✓</span>
        </div>

        {/* Summary */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <div className="border border-white/15 p-4">
            <div className="text-fids-dim text-[10px] tracking-[0.25em]">TOTAL STUDY TIME</div>
            <div className="text-fids-gold text-2xl sm:text-3xl tabular-nums mt-1">
              {formatHMS(studySeconds)}
            </div>
          </div>
          <div className="border border-white/15 p-4">
            <div className="text-fids-dim text-[10px] tracking-[0.25em]">FLIGHT ROUTE</div>
            <div className="text-fids-white text-lg sm:text-xl mt-1">
              {from.iata} <span className="text-fids-amber">→</span> {to.iata}
            </div>
            <div className="text-fids-dim text-xs mt-1">
              {from.city} to {to.city}
            </div>
          </div>
          <div className="border border-white/15 p-4">
            <div className="text-fids-dim text-[10px] tracking-[0.25em]">SESSION</div>
            <div className="text-green-400 text-lg sm:text-xl mt-1">COMPLETE ✓</div>
          </div>
        </div>

        <p className="text-center text-fids-amber text-lg sm:text-2xl tracking-[0.15em] mt-8">
          Study session complete. Well done. 🎉
        </p>

        {/* Saved notes */}
        <div className="mt-8 border border-white/15 bg-white/5">
          <div className="px-4 py-2 border-b border-white/10 text-fids-dim text-xs tracking-[0.25em]">
            YOUR FLIGHT NOTES
          </div>
          <div className="p-4 font-inter text-white/85 text-sm whitespace-pre-wrap min-h-[80px] lined-paper">
            {notes.trim() ? notes : <span className="text-fids-dim italic">No notes recorded this flight.</span>}
          </div>
        </div>

        <button
          onClick={onRestart}
          className="mt-8 w-full py-4 bg-fids-amber text-black text-lg tracking-[0.3em] font-bold hover:bg-fids-gold active:scale-[0.99] transition-all shadow-[0_0_30px_rgba(245,166,35,0.35)]"
        >
          BOOK NEXT FLIGHT →
        </button>
      </div>
    </div>
  )
}
