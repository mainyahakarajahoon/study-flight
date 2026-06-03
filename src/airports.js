// Airport data lives in the generated ./airportsData.js (9,000+ airports),
// loaded on demand by the departure board. This module holds the geo math.

const R = 6371 // Earth radius in km
const toRad = (d) => (d * Math.PI) / 180

// Haversine great-circle distance in km
export function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Flight duration in seconds at 900 km/h cruise speed
export function flightDurationSeconds(a, b) {
  const km = haversine(a, b)
  const hours = km / 900
  return Math.max(60, Math.round(hours * 3600)) // floor of 1 min for tiny hops
}
