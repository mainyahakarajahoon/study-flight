import { Suspense, lazy, useState } from 'react'
import DepartureBoard from './DepartureBoard'
import BoardingPass from './BoardingPass'

// Heavy screens (world-map geo data + confetti) load on demand so the
// departure board appears instantly.
const FlightCockpit = lazy(() => import('./FlightCockpit'))
const ArrivalScreen = lazy(() => import('./ArrivalScreen'))

function FlightLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-flight-bg text-fids-amber font-fids tracking-[0.3em]">
      PREPARING CABIN…
    </div>
  )
}

// Screen state machine: 1 departures → 2 boarding pass → 3 flight → 4 arrival
export default function App() {
  const [screen, setScreen] = useState(1)
  const [flight, setFlight] = useState(null)
  const [studySeconds, setStudySeconds] = useState(0)

  const handleCheckIn = (f) => {
    setFlight(f)
    setScreen(2)
  }

  const handleBoard = () => setScreen(3)

  const handleArrive = (seconds) => {
    if (seconds === null) {
      // Emergency landing / abort → back to departures
      resetAll()
      return
    }
    setStudySeconds(seconds ?? flight?.durationSec ?? 0)
    window.onbeforeunload = null
    setScreen(4)
  }

  const resetAll = () => {
    window.onbeforeunload = null
    setFlight(null)
    setStudySeconds(0)
    setScreen(1)
  }

  const handleRestart = () => {
    localStorage.removeItem('focusflight_notes')
    resetAll()
  }

  return (
    <>
      {screen === 1 && <DepartureBoard onCheckIn={handleCheckIn} />}
      {screen === 2 && flight && <BoardingPass flight={flight} onBoard={handleBoard} />}
      <Suspense fallback={<FlightLoader />}>
        {screen === 3 && flight && <FlightCockpit flight={flight} onArrive={handleArrive} />}
        {screen === 4 && flight && (
          <ArrivalScreen flight={flight} studySeconds={studySeconds} onRestart={handleRestart} />
        )}
      </Suspense>
    </>
  )
}
