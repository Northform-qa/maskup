import { useEffect, useRef, useState } from 'react'
import { Map, Marker, NavigationControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const ONTARIO = { longitude: -79.5, latitude: 44.0, zoom: 7 }
const MAX_BOUNDS = [[-95.15, 41.6], [-74.3, 56.9]]
const FIELD_ZOOM = 13

export default function MapboxMap({ fields = [], selectedId, onSelectPin, flyTarget, className = '' }) {
  const mapRef = useRef(null)
  const onSelectPinRef = useRef(onSelectPin)
  const [userLocation, setUserLocation] = useState(null)
  const [locationDenied, setLocationDenied] = useState(false)

  useEffect(() => { onSelectPinRef.current = onSelectPin }, [onSelectPin])

  // Fly to selected field marker
  useEffect(() => {
    if (!selectedId) return
    const field = fields.find((f) => f.id === selectedId)
    if (field?.lat != null && field?.lng != null) {
      mapRef.current?.flyTo({
        center: [Number(field.lng), Number(field.lat)],
        zoom: FIELD_ZOOM,
        duration: 800,
      })
    }
  }, [selectedId, fields])

  // Fly to external target (search: postal code or city centroid)
  useEffect(() => {
    if (!flyTarget) return
    mapRef.current?.flyTo({ center: flyTarget.center, zoom: flyTarget.zoom, duration: 1000 })
  }, [flyTarget])

  function handleLocate() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserLocation({ lat, lng })
        setLocationDenied(false)
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 10, duration: 1000 })
      },
      () => setLocationDenied(true),
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Map
        ref={mapRef}
        mapboxAccessToken={TOKEN}
        initialViewState={ONTARIO}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        maxBounds={MAX_BOUNDS}
        dragRotate={false}
        onLoad={() => mapRef.current?.touchZoomRotate.disableRotation()}
      >
        <NavigationControl showCompass={false} position="top-right" />

        {fields.map((field) => {
          if (field.lat == null || field.lng == null) return null
          const isSelected = field.id === selectedId
          return (
            <Marker
              key={field.id}
              longitude={Number(field.lng)}
              latitude={Number(field.lat)}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                onSelectPinRef.current?.(field.id)
              }}
            >
              <div
                className={`rounded-full border-white shadow-md cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'w-5 h-5 bg-[#2a4d0c] border-[3px]'
                    : 'w-3.5 h-3.5 bg-[#3B6D11] border-2'
                }`}
              />
            </Marker>
          )
        })}

        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg pointer-events-none" />
          </Marker>
        )}
      </Map>

      {/* "Use my location" button + denied message */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-col items-start gap-1.5">
        <button
          onClick={handleLocate}
          className="bg-white rounded-full shadow-md px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06z" />
          </svg>
          Use my location
        </button>
        {locationDenied && (
          <p className="text-[10px] text-gray-600 bg-white/95 rounded-lg px-2.5 py-1.5 shadow leading-snug max-w-[190px]">
            Location access denied — try searching by city or postal code
          </p>
        )}
      </div>
    </div>
  )
}
