import { Suspense, lazy, useState } from 'react'
import DepartureBoard from './DepartureBoard'
import BoardingPass from './BoardingPass'
import AuthScreen from './AuthScreen'
import { getCurrentUser, logout, addFlight, getNotes, clearNotes } from './store'

// Heavy screens (world-map geo data + confetti) load on demand.
const FlightCockpit = lazy(() => import('./FlightCockpit'))
const ArrivalScreen = lazy(() => import('./ArrivalScreen'))
const PassportScreen = lazy(() => import('./PassportScreen'))

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-flight-bg text-fids-amber font-fids tracking-[0.3em]">
      PREPARING CABIN…
    </div>
  )
}

const randomFlightNo = () => {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  return `${L[(Math.random() * L.length) | 0]}${L[(Math.random() * L.length) | 0]} ${
    1000 + ((Math.random() * 8999) | 0)
  }`
}

// Screen state machine: 1 departures → 2 boarding → 3 flight → 4 arrival; 5 passport
export default function App() {
  const [user, setUser] = useState(() => getCurrentUser())
  const [screen, setScreen] = useState(1)
  const [flight, setFlight] = useState(null)
  const [studySeconds, setStudySeconds] = useState(0)

  if (!user) return <AuthScreen onAuth={setUser} />

  const handleCheckIn = (f) => {
    clearNotes() // fresh notepad for this flight
    setFlight({ ...f, flightNo: randomFlightNo() })
    setScreen(2)
  }

  const handleBoard = () => setScreen(3)

  const handleArrive = (seconds) => {
    window.onbeforeunload = null
    if (seconds === null) {
      // Emergency landing / abort → back to departures, nothing logged
      resetFlight()
      return
    }
    const studied = seconds ?? flight?.durationSec ?? 0
    // Persist the completed flight to the traveller's log.
    addFlight(user.id, {
      from: flight.from,
      to: flight.to,
      distanceKm: flight.distanceKm,
      durationSec: flight.durationSec,
      studySeconds: studied,
      flightNo: flight.flightNo,
      notes: getNotes(),
      date: new Date().toISOString(),
    })
    setStudySeconds(studied)
    setScreen(4)
  }

  const resetFlight = () => {
    window.onbeforeunload = null
    setFlight(null)
    setStudySeconds(0)
    setScreen(1)
  }

  const handleRestart = () => {
    clearNotes()
    resetFlight()
  }

  const handleLogout = () => {
    logout()
    clearNotes()
    setFlight(null)
    setStudySeconds(0)
    setScreen(1)
    setUser(null)
  }

  return (
    <Suspense fallback={<Loader />}>
      {screen === 1 && (
        <DepartureBoard
          user={user}
          onCheckIn={handleCheckIn}
          onOpenPassport={() => setScreen(5)}
        />
      )}
      {screen === 2 && flight && <BoardingPass flight={flight} user={user} onBoard={handleBoard} />}
      {screen === 3 && flight && <FlightCockpit flight={flight} onArrive={handleArrive} />}
      {screen === 4 && flight && (
        <ArrivalScreen
          flight={flight}
          studySeconds={studySeconds}
          onRestart={handleRestart}
          onOpenPassport={() => setScreen(5)}
        />
      )}
      {screen === 5 && (
        <PassportScreen user={user} onBack={() => setScreen(1)} onLogout={handleLogout} />
      )}
    </Suspense>
  )
}
