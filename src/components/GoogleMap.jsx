import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

const ONTARIO_CENTER = { lat: 44.0, lng: -79.5 }
const DEFAULT_ZOOM = 7
const FIELD_ZOOM = 13
const PIN_GREEN = '#3B6D11'
const PIN_RED = '#E53E3E'

const loader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  version: 'weekly',
})

function pinIcon(google, color) {
  return {
    path: 'M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22s14-12.667 14-22C28 6.268 21.732 0 14 0z',
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 0,
    scale: 1,
    anchor: new google.maps.Point(14, 36),
  }
}

export default function GoogleMap({ fields = [], selectedId, onSelectPin, className = '' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const googleRef = useRef(null)
  const markersRef = useRef({})
  const userMarkerRef = useRef(null)
  const onSelectPinRef = useRef(onSelectPin)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => { onSelectPinRef.current = onSelectPin }, [onSelectPin])

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let active = true

    loader.load().then((google) => {
      if (!active || mapRef.current) return
      googleRef.current = google
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: ONTARIO_CENTER,
        zoom: DEFAULT_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
      })
      setMapReady(true)
    }).catch(() => {})

    return () => { active = false }
  }, [])

  // Sync field markers when map ready, fields, or selectedId change
  useEffect(() => {
    if (!mapReady) return
    const google = googleRef.current
    const map = mapRef.current

    const liveIds = new Set(fields.map((f) => f.id))

    // Remove markers for fields no longer in the list
    Object.keys(markersRef.current).forEach((id) => {
      if (!liveIds.has(id)) {
        markersRef.current[id].setMap(null)
        delete markersRef.current[id]
      }
    })

    // Add or update markers
    fields.forEach((field) => {
      if (field.lat == null || field.lng == null) return
      const color = field.id === selectedId ? PIN_RED : PIN_GREEN
      const icon = pinIcon(google, color)

      if (markersRef.current[field.id]) {
        markersRef.current[field.id].setIcon(icon)
      } else {
        const marker = new google.maps.Marker({
          position: { lat: Number(field.lat), lng: Number(field.lng) },
          map,
          icon,
          title: field.name,
        })
        marker.addListener('click', () => onSelectPinRef.current?.(field.id))
        markersRef.current[field.id] = marker
      }
    })
  }, [mapReady, fields, selectedId])

  // Pan and zoom to selected field
  useEffect(() => {
    if (!mapReady || !selectedId) return
    const field = fields.find((f) => f.id === selectedId)
    if (field?.lat != null && field?.lng != null) {
      mapRef.current.panTo({ lat: Number(field.lat), lng: Number(field.lng) })
      mapRef.current.setZoom(FIELD_ZOOM)
    }
  }, [mapReady, selectedId, fields])

  function handleLocate() {
    if (!navigator.geolocation || !mapRef.current) return
    navigator.geolocation.getCurrentPosition(({ coords: { latitude: lat, longitude: lng } }) => {
      const pos = { lat, lng }
      mapRef.current.panTo(pos)
      mapRef.current.setZoom(12)

      if (userMarkerRef.current) {
        userMarkerRef.current.setPosition(pos)
      } else {
        userMarkerRef.current = new googleRef.current.maps.Marker({
          position: pos,
          map: mapRef.current,
          icon: {
            path: googleRef.current.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8,
          },
        })
      }
    })
  }

  return (
    <div className={`relative ${className}`}>
      {!mapReady && (
        <div className="absolute inset-0 bg-[#e8ead3] flex items-center justify-center">
          <span className="text-sm text-gray-400">Loading map…</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      <button
        onClick={handleLocate}
        className="absolute bottom-3 left-3 z-10 bg-white rounded-full shadow-md px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5"
        aria-label="Use my location"
      >
        <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06z" />
        </svg>
        Use my location
      </button>
    </div>
  )
}
