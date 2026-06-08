// ---------------------------------------------------------------------------
// Local-first data layer for Focus Flight accounts + history.
// Everything is namespaced so it can later be swapped for a cloud backend
// (e.g. Supabase) by reimplementing these same exported functions.
// ---------------------------------------------------------------------------

const USERS_KEY = 'ff_users'
const SESSION_KEY = 'ff_session'
const NOTES_KEY = 'focusflight_notes' // live notepad for the in-progress flight

const loadUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u))
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt })

async function hashPassword(pw) {
  const data = new TextEncoder().encode(`focusflight::${pw}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export async function signup({ name, email, password }) {
  name = (name || '').trim()
  email = (email || '').trim().toLowerCase()
  if (name.length < 2) throw new Error('Please enter your name.')
  if (!isEmail(email)) throw new Error('Please enter a valid email address.')
  if ((password || '').length < 6) throw new Error('Password must be at least 6 characters.')

  const users = loadUsers()
  if (users[email]) throw new Error('An account with this email already exists.')

  const id = 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const passHash = await hashPassword(password)
  users[email] = { id, name, email, passHash, createdAt: Date.now() }
  saveUsers(users)
  localStorage.setItem(SESSION_KEY, id)
  return publicUser(users[email])
}

export async function login({ email, password }) {
  email = (email || '').trim().toLowerCase()
  const users = loadUsers()
  const u = users[email]
  if (!u) throw new Error('No account found for that email.')
  const passHash = await hashPassword(password)
  if (passHash !== u.passHash) throw new Error('Incorrect password.')
  localStorage.setItem(SESSION_KEY, u.id)
  return publicUser(u)
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getCurrentUser() {
  const id = localStorage.getItem(SESSION_KEY)
  if (!id) return null
  const u = Object.values(loadUsers()).find((x) => x.id === id)
  return u ? publicUser(u) : null
}

// --- Flights ---------------------------------------------------------------
const flightsKey = (uid) => `ff_flights_${uid}`

export function getFlights(uid) {
  return JSON.parse(localStorage.getItem(flightsKey(uid)) || '[]')
}

export function addFlight(uid, record) {
  const flights = getFlights(uid)
  flights.unshift({ id: 'f_' + Date.now().toString(36), ...record })
  localStorage.setItem(flightsKey(uid), JSON.stringify(flights))
  return flights
}

// Unique airports the user has flown through (origins + destinations).
export function getAirportsCovered(uid) {
  const map = new Map()
  for (const f of getFlights(uid)) {
    for (const a of [f.from, f.to]) {
      if (!a) continue
      const e = map.get(a.iata)
      if (e) e.visits += 1
      else map.set(a.iata, { ...a, visits: 1 })
    }
  }
  return [...map.values()]
}

// Aggregate stats for the passport header.
export function getStats(uid) {
  const flights = getFlights(uid)
  const studySeconds = flights.reduce((s, f) => s + (f.studySeconds || 0), 0)
  const distanceKm = flights.reduce((s, f) => s + (f.distanceKm || 0), 0)
  return {
    flightCount: flights.length,
    studySeconds,
    distanceKm,
    airports: getAirportsCovered(uid).length,
  }
}

// --- Live notepad (per in-progress flight) ---------------------------------
export const getNotes = () => localStorage.getItem(NOTES_KEY) || ''
export const setNotes = (v) => localStorage.setItem(NOTES_KEY, v)
export const clearNotes = () => localStorage.removeItem(NOTES_KEY)
