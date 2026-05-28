import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFavourites } from '../lib/useFavourites'
import MapboxMap from '../components/MapboxMap'
import StatusBadge from '../components/StatusBadge'
import StarRating from '../components/StarRating'
import ActivePlayers from '../components/ActivePlayers'
import HeroPhoto from '../components/HeroPhoto'
import WeatherChip from '../components/WeatherChip'
import { supabase } from '../lib/supabase'
import { normalizeField } from '../lib/fieldUtils'
import { FILTER_CHIPS } from '../data/mockData'

const POSTAL_RE = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/

async function geocodePostal(code) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(code)}.json?country=CA&types=postcode&access_token=${token}`
  )
  const json = await res.json()
  const feature = json.features?.[0]
  if (!feature) return null
  const [lng, lat] = feature.center
  return { lng, lat }
}

function distanceSq(field, { lat, lng }) {
  const dlat = Number(field.lat) - lat
  const dlng = Number(field.lng) - lng
  return dlat * dlat + dlng * dlng
}

export default function DiscoverPage() {
  const { user } = useAuth()
  const { favourites, toggleFavourite } = useFavourites(user)

  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchActive, setSearchActive] = useState(false)
  const [searchFields, setSearchFields] = useState([])
  const [flyTarget, setFlyTarget] = useState(null)

  const debounceRef = useRef(null)
  const navigate = useNavigate()

  // Fetch all published fields on mount (unchanged)
  useEffect(() => {
    async function fetchFields() {
      const today = new Date().toISOString().split('T')[0]
      const [{ data, error }, { data: goingRows }] = await Promise.all([
        supabase.from('fields').select('*').eq('listing_status', 'published').order('name'),
        supabase.from('going_today').select('field_id').eq('date', today),
      ])

      if (error) {
        setError(error.message)
      } else {
        const countByField = {}
        goingRows?.forEach((r) => {
          countByField[r.field_id] = (countByField[r.field_id] || 0) + 1
        })
        setFields((data ?? []).map((f) => ({
          ...normalizeField(f),
          going_today_count: countByField[f.id] || 0,
        })))
      }
      setLoading(false)
    }
    fetchFields()
  }, [])

  // Scroll selected card into view when a marker is tapped
  useEffect(() => {
    if (!selectedId) return
    document.getElementById(`field-card-${selectedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedId])

  // Build autocomplete suggestions (debounced 300 ms)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    const q = query.trim()

    debounceRef.current = setTimeout(async () => {
      if (q.length < 2) {
        setSuggestions([])
        setShowDropdown(false)
        return
      }
      const suggs = []

      // 1. Field name matches
      const { data: nameMatches } = await supabase
        .from('fields')
        .select('id, name, city, province, lat, lng')
        .ilike('name', `%${q}%`)
        .eq('listing_status', 'published')
        .limit(4)

      nameMatches?.forEach((f) => {
        suggs.push({ type: 'field', id: f.id, label: `${f.name} — ${f.city}`, field: f })
      })

      // 2. City matches (grouped by city, max 2 entries)
      if (suggs.length < 5) {
        const { data: cityMatches } = await supabase
          .from('fields')
          .select('id, city, province, lat, lng')
          .ilike('city', `%${q}%`)
          .eq('listing_status', 'published')
          .limit(20)

        const cities = {}
        cityMatches?.forEach((f) => {
          const key = `${f.city}|${f.province}`
          if (!cities[key]) cities[key] = { city: f.city, province: f.province, fieldRefs: [] }
          cities[key].fieldRefs.push(f)
        })

        Object.values(cities).forEach((c) => {
          if (suggs.length < 5) {
            suggs.push({
              type: 'city',
              id: `city-${c.city}-${c.province}`,
              label: `${c.city}, ${c.province}`,
              city: c.city,
              province: c.province,
            })
          }
        })
      }

      // 3. Postal code option
      if (POSTAL_RE.test(q) && suggs.length < 6) {
        suggs.push({
          type: 'postal',
          id: `postal-${q}`,
          label: `Search near ${q.toUpperCase()}`,
          code: q,
        })
      }

      setSuggestions(suggs.slice(0, 6))
      setShowDropdown(suggs.length > 0)
    }, q.length < 2 ? 0 : 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  async function handleSelectSuggestion(sugg) {
    setShowDropdown(false)
    setSearchActive(true)

    if (sugg.type === 'field') {
      setQuery(sugg.label)
      const match = fields.find((f) => f.id === sugg.id)
      setSearchFields(match ? [match] : [])
      setSelectedId(sugg.id)
      // selectedId useEffect handles the map flyTo
    } else if (sugg.type === 'city') {
      setQuery(sugg.label)
      const cityFields = fields.filter(
        (f) => f.city.toLowerCase() === sugg.city.toLowerCase()
      )
      setSearchFields(cityFields)
      const withCoords = cityFields.filter((f) => f.lat != null && f.lng != null)
      if (withCoords.length > 0) {
        const avgLat = withCoords.reduce((s, f) => s + Number(f.lat), 0) / withCoords.length
        const avgLng = withCoords.reduce((s, f) => s + Number(f.lng), 0) / withCoords.length
        setFlyTarget({ center: [avgLng, avgLat], zoom: 10 })
      }
    } else if (sugg.type === 'postal') {
      setQuery(sugg.code.toUpperCase())
      const geo = await geocodePostal(sugg.code)
      if (geo) {
        const sorted = fields
          .filter((f) => f.lat != null && f.lng != null)
          .sort((a, b) => distanceSq(a, geo) - distanceSq(b, geo))
        setSearchFields(sorted)
        setFlyTarget({ center: [geo.lng, geo.lat], zoom: 10 })
      }
    }
  }

  function handleClear() {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    setSearchActive(false)
    setSearchFields([])
    setSelectedId(null)
    setFlyTarget({ center: [-79.5, 44.0], zoom: 7 })
  }

  const filtered =
    activeFilter === 'All'
      ? fields
      : fields.filter((f) => f.field_types.includes(activeFilter))

  const displayed = searchActive ? searchFields : filtered

  return (
    <div className="md:hidden flex flex-col h-screen bg-white">
      {/* Search bar */}
      <div className="px-4 pt-12 pb-3 bg-white">
        {/* Wordmark */}
        <p className="text-base tracking-tight leading-none mb-3">
          <span className="font-bold text-brand">Mask</span><span className="font-normal text-gray-800">Up</span><span className="font-normal text-gray-400 text-sm">.gg</span>
        </p>
        <div className="relative">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search fields, cities, postal code"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              {suggestions.map((sugg) => (
                <button
                  key={sugg.id}
                  onMouseDown={() => handleSelectSuggestion(sugg)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                >
                  {sugg.type === 'field' && (
                    <svg className="w-3.5 h-3.5 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {sugg.type === 'city' && (
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {sugg.type === 'postal' && (
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  <span className="truncate">{sugg.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === chip
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapboxMap
        fields={fields}
        selectedId={selectedId}
        onSelectPin={setSelectedId}
        flyTarget={flyTarget}
        className="flex-shrink-0 h-[42vh]"
      />

      {/* Bottom sheet */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <p className="text-xs text-gray-500 text-right px-4 pb-2">within 60 km</p>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading fields…</div>
        ) : error ? (
          <div className="py-16 text-center text-red-400 text-sm px-6">{error}</div>
        ) : displayed.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {searchActive ? 'No fields found.' : 'No fields match this filter.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayed.map((field) => (
              <button
                key={field.id}
                id={`field-card-${field.id}`}
                onClick={() => navigate(`/field/${field.id}`)}
                className="w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <HeroPhoto className="w-16 h-16 flex-shrink-0 rounded-lg text-[8px]" label="FIELD" />

                <div className="flex-1 min-w-0">
                  {/* Name + fav */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight">{field.name}</h3>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => toggleFavourite(e, field.id)}
                      className={`flex-shrink-0 mt-0.5 text-sm transition-colors ${favourites.has(field.id) ? 'text-red-400' : 'text-gray-300 hover:text-red-300'}`}
                    >
                      {favourites.has(field.id) ? '♥' : '♡'}
                    </span>
                  </div>

                  {/* City + distance */}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {field.city}, {field.province}
                    {field.distance_km != null && ` · ${field.distance_km} km`}
                  </p>

                  {/* Status + hours + weather */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <StatusBadge status={field.weather_status} />
                    {field.today_hours && (
                      <span className="text-xs text-gray-500">🕐 {field.today_hours} today</span>
                    )}
                    <WeatherChip field={field} className="ml-auto" />
                  </div>

                  {/* Star rating — hidden until reviews are live (Phase 2) */}
                  <div className="mt-1.5">
                    <StarRating rating={field.rating} count={field.review_count} />
                  </div>

                  {/* Field type chips */}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {field.field_types.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{t}</span>
                    ))}
                  </div>

                  {/* Active players — beneath field type chips */}
                  <div className="mt-1">
                    <ActivePlayers field={field} size="sm" />
                  </div>

                  {/* Going today count */}
                  {field.going_today_count > 0 && (
                    <p className="text-xs text-brand font-medium mt-1">
                      🙋 {field.going_today_count} going today
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  )
}
