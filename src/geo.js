// Great-circle helpers for the live world-map flight tracker.
const toRad = (d) => (d * Math.PI) / 180
const toDeg = (r) => (r * 180) / Math.PI

/**
 * Point along the great circle between a and b at fraction f (0..1).
 * Uses spherical interpolation (slerp) so the path follows Earth's curve.
 */
export function greatCirclePoint(a, b, f) {
  const p1 = toRad(a.lat)
  const l1 = toRad(a.lon)
  const p2 = toRad(b.lat)
  const l2 = toRad(b.lon)

  // angular distance between the two points
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((p2 - p1) / 2) ** 2 +
          Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2
      )
    )
  if (d === 0 || Number.isNaN(d)) return { lat: a.lat, lon: a.lon }

  const A = Math.sin((1 - f) * d) / Math.sin(d)
  const B = Math.sin(f * d) / Math.sin(d)
  const x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2)
  const y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2)
  const z = A * Math.sin(p1) + B * Math.sin(p2)

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
  const lon = Math.atan2(y, x)
  return { lat: toDeg(lat), lon: toDeg(lon) }
}

/** Format a lat/lon as e.g. 51.4°N, 0.5°W */
export function formatLatLon({ lat, lon }) {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(1)}°${ns}  ${Math.abs(lon).toFixed(1)}°${ew}`
}
