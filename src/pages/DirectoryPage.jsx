import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFavourites } from '../lib/useFavourites'
import MapboxMap from '../components/MapboxMap'
import StatusBadge from '../components/StatusBadge'
import FieldTypeChip from '../components/FieldTypeChip'
import ActivePlayers from '../components/ActivePlayers'
import shieldIcon from '../assets/logos/green/Shield Icon Only.svg'
import HeroPhoto from '../components/HeroPhoto'
import WeatherChip from '../components/WeatherChip'
import { supabase } from '../lib/supabase'
import { getTodayHours } from '../lib/fieldUtils'
import { normalizeField } from '../lib/fieldUtils'
import { FILTER_CHIPS } from '../data/mockData'

const POSTAL_RE = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/
const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isOpenNow(field) {
  const val = field.hours?.[DAY_KEYS[new Date().getDay()]]
  if (!val) return false
  if (val.closed) return false
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  if (val.open && val.close) {
    const [oh, om] = val.open.split(':').map(Number)
    const [ch, cm] = val.close.split(':').map(Number)
    return nowMins >= oh * 60 + om && nowMins < ch * 60 + cm
  }
  if (typeof val === 'string' && val !== 'Closed') {
    const match = val.match(/(\d+)(?::(\d+))?(am|pm)[–-](\d+)(?::(\d+))?(am|pm)/i)
    if (!match) return false
    let [, oh, om = '0', op, ch, cm = '0', cp] = match
    oh = parseInt(oh); om = parseInt(om); ch = parseInt(ch); cm = parseInt(cm)
    if (op.toLowerCase() === 'pm' && oh !== 12) oh += 12
    if (op.toLowerCase() === 'am' && oh === 12) oh = 0
    if (cp.toLowerCase() === 'pm' && ch !== 12) ch += 12
    if (cp.toLowerCase() === 'am' && ch === 12) ch = 0
    return nowMins >= oh * 60 + om && nowMins < ch * 60 + cm
  }
  return false
}

function getWeekendDates() {
  const today = new Date()
  const day = today.getDay()
  const daysUntilSat = day === 6 ? 0 : 6 - day
  const sat = new Date(today)
  sat.setDate(today.getDate() + daysUntilSat)
  const sun = new Date(sat)
  sun.setDate(sat.getDate() + 1)
  const fmt = (d) => d.toISOString().split('T')[0]
  return [fmt(sat), fmt(sun)]
}

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

export default function DirectoryPage() {
  const { user } = useAuth()
  const { favourites, toggleFavourite } = useFavourites(user)

  const [activeFilter, setActiveFilter] = useState('All')
  const [fields, setFields] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sort] = useState('Distance')
  const [showOpenToday, setShowOpenToday] = useState(false)
  const [showRentals, setShowRentals] = useState(false)
  const [showEventsWeekend, setShowEventsWeekend] = useState(false)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchActive, setSearchActive] = useState(false)
  const [searchFields, setSearchFields] = useState([])
  const [flyTarget, setFlyTarget] = useState(null)
  const debounceRef = useRef(null)

  const navigate = useNavigate()

  useEffect(() => {
    async function fetchFields() {
      const today = new Date().toISOString().split('T')[0]
      const [{ data, error }, { data: goingRows }] = await Promise.all([
        supabase.from('fields').select('*, events(*)').eq('listing_status', 'published').order('name'),
        supabase.from('going_today').select('field_id').eq('date', today),
      ])

      if (error) {
        setError(error.message)
      } else {
        const countByField = {}
        goingRows?.forEach((r) => {
          countByField[r.field_id] = (countByField[r.field_id] || 0) + 1
        })
        const normalized = (data ?? []).map((f) => ({
          ...normalizeField(f),
          going_today_count: countByField[f.id] || 0,
        }))
        setFields(normalized)
        if (normalized.length > 0) setSelectedId(normalized[0].id)
      }
      setLoading(false)
    }
    fetchFields()
  }, [])

  // Debounced autocomplete
  useEffect(() => {
    clearTimeout(debounceRef.current)
    const q = query.trim()
    debounceRef.current = setTimeout(async () => {
      if (q.length < 2) { setSuggestions([]); setShowDropdown(false); return }
      const suggs = []

      const { data: nameMatches } = await supabase
        .from('fields').select('id, name, city, province, lat, lng')
        .ilike('name', `%${q}%`).eq('listing_status', 'published').limit(4)
      nameMatches?.forEach((f) => suggs.push({ type: 'field', id: f.id, label: `${f.name} — ${f.city}`, field: f }))

      if (suggs.length < 5) {
        const { data: cityMatches } = await supabase
          .from('fields').select('id, city, province, lat, lng')
          .ilike('city', `%${q}%`).eq('listing_status', 'published').limit(20)
        const cities = {}
        cityMatches?.forEach((f) => {
          const key = `${f.city}|${f.province}`
          if (!cities[key]) cities[key] = { city: f.city, province: f.province }
        })
        Object.values(cities).forEach((c) => {
          if (suggs.length < 5) suggs.push({ type: 'city', id: `city-${c.city}-${c.province}`, label: `${c.city}, ${c.province}`, city: c.city, province: c.province })
        })
      }

      if (POSTAL_RE.test(q) && suggs.length < 6)
        suggs.push({ type: 'postal', id: `postal-${q}`, label: `Search near ${q.toUpperCase()}`, code: q })

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
    } else if (sugg.type === 'city') {
      setQuery(sugg.label)
      const cityFields = fields.filter((f) => f.city.toLowerCase() === sugg.city.toLowerCase())
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
        const sorted = fields.filter((f) => f.lat != null && f.lng != null).sort((a, b) => distanceSq(a, geo) - distanceSq(b, geo))
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
    setSelectedId(fields[0]?.id ?? null)
    setFlyTarget({ center: [-79.5, 44.0], zoom: 7 })
  }

  const filtered =
    activeFilter === 'All'
      ? fields
      : fields.filter((f) => f.field_types.includes(activeFilter))

  const weekendDates = getWeekendDates()
  const baseList = searchActive ? searchFields : filtered
  const displayed = baseList.filter((f) => {
    if (showOpenToday && !(f.weather_status === 'open' && isOpenNow(f))) return false
    if (showRentals && !f.rentals_available) return false
    if (showEventsWeekend && !f.events.some((e) => weekendDates.includes(e.date))) return false
    return true
  })
  const selectedField = displayed.find((f) => f.id === selectedId) ?? displayed[0]

  return (
    <div className="hidden md:flex flex-col h-full bg-cream-100">
      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-3 flex-wrap">

        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-56">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search fields or cities…"
              className="flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button onClick={handleClear} className="text-gray-400 hover:text-gray-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
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
                  {sugg.type !== 'field' && (
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  )}
                  <span className="truncate text-xs">{sugg.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Field type chips */}
        <div className="flex items-center gap-1.5">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => { setActiveFilter(chip); setSearchActive(false) }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === chip && !searchActive
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        {[
          { label: '● Open today', active: showOpenToday, toggle: () => setShowOpenToday((v) => !v) },
          { label: '🎿 Rentals', active: showRentals, toggle: () => setShowRentals((v) => !v) },
          { label: '📅 Events this weekend', active: showEventsWeekend, toggle: () => setShowEventsWeekend((v) => !v) },
        ].map(({ label, active, toggle }) => (
          <button
            key={label}
            onClick={toggle}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              active
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
          <span>{displayed.length} fields</span>
          <button className="flex items-center gap-1 text-gray-600 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Sort: {sort}
          </button>
        </div>
      </div>

      {/* 3-panel body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: field list ── */}
        <div className="w-72 flex-shrink-0 overflow-y-auto bg-white border-r border-gray-200">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading fields…</div>
          ) : error ? (
            <div className="py-16 text-center text-red-400 text-sm px-4">{error}</div>
          ) : displayed.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              <img src={shieldIcon} alt="" className="w-16 h-16 mx-auto mb-4 opacity-60" />
              {searchActive ? 'No fields found.' : 'No fields match this filter.'}
            </div>
          ) : null}
          <div className="divide-y divide-gray-100">
            {displayed.map((field) => {
              const active = field.id === selectedId
              return (
                <button
                  key={field.id}
                  onClick={() => setSelectedId(field.id)}
                  className={`w-full text-left pl-0 pr-3 py-3 transition-colors border-l-4 ${
                    active
                      ? 'bg-green-100 border-brand'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <div className="flex gap-2.5 pl-3">
                    <HeroPhoto className="w-12 h-12 flex-shrink-0 rounded text-[7px]" label="" />
                    <div className="flex-1 min-w-0">
                      {/* Name + fav */}
                      <div className="flex items-start justify-between gap-1">
                        <h3 className={`text-sm font-semibold leading-tight ${active ? 'text-brand' : 'text-gray-900'}`}>{field.name}</h3>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => toggleFavourite(e, field.id)}
                          className={`ml-1 flex-shrink-0 text-sm transition-colors ${favourites.has(field.id) ? 'text-red-400' : 'text-gray-300 hover:text-red-300'}`}
                        >
                          {favourites.has(field.id) ? '♥' : '♡'}
                        </span>
                      </div>

                      {/* City + distance */}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {field.city}, {field.province}
                        {field.distance_km != null && ` · ${field.distance_km} km`}
                      </p>

                      {/* Status + weather */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <StatusBadge status={field.weather_status} />
                        {field.today_hours && (
                          <span className="text-xs text-gray-400">🕐 {field.today_hours}</span>
                        )}
                        <WeatherChip field={field} className="ml-auto" />
                      </div>

                      {/* Field type chips */}
                      {field.field_types.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {field.field_types.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{t}</span>
                          ))}
                        </div>
                      )}

                      {/* Active players — beneath chips */}
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
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Centre: Map ── */}
        <MapboxMap
          fields={fields}
          selectedId={selectedId}
          onSelectPin={setSelectedId}
          flyTarget={flyTarget}
          className="flex-1"
        />

        {/* ── Right: preview panel ── */}
        {selectedField && (
          <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <HeroPhoto className="h-40 w-full text-xs flex-shrink-0" label="HERO PHOTO" />

              <div className="p-4">
                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {selectedField.city}, {selectedField.province}
                  {selectedField.distance_km != null && ` · ${selectedField.distance_km} km`}
                </div>

                {/* Star rating — hidden until Phase 2 reviews */}
                {selectedField.rating != null && (
                  <div className="flex items-center gap-1 mb-3">
                    {'★★★★★'.split('').map((_, i) => (
                      <span key={i} className={`text-sm ${i < Math.floor(selectedField.rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                    ))}
                    {selectedField.review_count != null && (
                      <span className="text-xs text-gray-500 ml-0.5">({selectedField.review_count})</span>
                    )}
                  </div>
                )}

                {/* Status badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <StatusBadge status={selectedField.weather_status} />
                  {selectedField.today_hours && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      🕐 {selectedField.today_hours} today
                    </span>
                  )}
                  {selectedField.walk_ins && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      Walk-ins OK
                    </span>
                  )}
                  <WeatherChip field={selectedField} className="ml-auto" />
                </div>

                {/* Stat row */}
                <div className="flex gap-2 mb-4">
                  {[
                    {
                      icon: '🕐',
                      label: "TODAY'S HOURS",
                      value: (() => {
                        const hours = getTodayHours(selectedField.hours)
                        if (hours) return hours
                        const isIndoor = selectedField.field_types?.includes('Indoor')
                        return isIndoor ? 'Open year-round' : 'Closed today'
                      })(),
                    },
                    { icon: '💰', label: 'GENERAL PRICING', value: selectedField.pricing || null, muted: !selectedField.pricing },
                    { icon: '🎿', label: 'RENTALS', value: selectedField.rentals_available ? 'Yes' : 'No', skip: !selectedField.claimed },
                  ].filter((s) => !s.skip).map((stat) => (
                    <div key={stat.label} className="flex-1 border border-gray-200 rounded-lg p-2 flex flex-col items-center gap-0.5 text-center">
                      <span className="text-base">{stat.icon}</span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">{stat.label}</span>
                      {stat.muted
                        ? <span className="text-xs text-gray-400 leading-tight">Contact field for pricing</span>
                        : <span className="text-sm font-semibold text-gray-800 leading-tight">{stat.value}</span>
                      }
                    </div>
                  ))}
                </div>

                {/* Active players */}
                <div className="mb-4">
                  <ActivePlayers field={selectedField} size="sm" />
                  {selectedField.going_today_count > 0 && (
                    <p className="text-xs text-brand font-medium mt-1">
                      🙋 {selectedField.going_today_count} going today
                    </p>
                  )}
                </div>

                {/* Game types */}
                {selectedField.field_types.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Field Types</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedField.field_types.map((t) => (
                        <FieldTypeChip key={t} type={t} small />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming event */}
                {selectedField.events[0] && (
                  <div className="bg-orange-50 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <span className="text-orange-500 text-sm flex-shrink-0">📅</span>
                    <span className="text-xs font-medium text-orange-800 leading-tight">
                      {selectedField.events[0].title} — {selectedField.events[0].display_date}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pinned CTAs — always visible at panel bottom */}
            <div className="flex-shrink-0 border-t border-gray-100 p-4 space-y-2 bg-white">
              <button
                onClick={() => navigate(`/field/${selectedField.id}`)}
                className="w-full bg-brand text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-brand-dark transition-colors"
              >
                View full field page →
              </button>
              {selectedField.lat && selectedField.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedField.lat},${selectedField.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                >
                  🗺️ Get Directions
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
