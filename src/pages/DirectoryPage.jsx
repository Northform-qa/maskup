import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MapPlaceholder from '../components/MapPlaceholder'
import StatusBadge from '../components/StatusBadge'
import FieldTypeChip from '../components/FieldTypeChip'
import ActivePlayers from '../components/ActivePlayers'
import HeroPhoto from '../components/HeroPhoto'
import WeatherChip from '../components/WeatherChip'
import { supabase } from '../lib/supabase'
import { normalizeField } from '../lib/fieldUtils'
import { FILTER_CHIPS } from '../data/mockData'

const EXTRA_FILTERS = [
  { label: '🎿 Rentals', value: 'rentals' },
  { label: '● Open today', value: 'open' },
  { label: '📅 Events this weekend', value: 'events' },
]

export default function DirectoryPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [fields, setFields] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sort] = useState('Distance')
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

  const filtered =
    activeFilter === 'All'
      ? fields
      : fields.filter((f) => f.field_types.includes(activeFilter))

  const selectedField = filtered.find((f) => f.id === selectedId) ?? filtered[0]

  return (
    <div className="hidden md:flex flex-col h-screen bg-cream-100">
      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === chip
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        {EXTRA_FILTERS.map((f) => (
          <button
            key={f.value}
            className="px-3 py-1 rounded-full text-xs font-medium border border-gray-300 text-gray-600 hover:border-gray-400 transition-colors"
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
          <span>{filtered.length} fields</span>
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
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No fields match this filter.</div>
          ) : null}
          <div className="divide-y divide-gray-100">
            {filtered.map((field) => {
              const active = field.id === selectedId
              return (
                <button
                  key={field.id}
                  onClick={() => setSelectedId(field.id)}
                  className={`w-full text-left px-3 py-3 transition-colors ${
                    active ? 'bg-green-50 border-l-2 border-brand' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-2.5">
                    <HeroPhoto className="w-12 h-12 flex-shrink-0 rounded text-[7px]" label="" />
                    <div className="flex-1 min-w-0">
                      {/* Name + fav */}
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">{field.name}</h3>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => e.stopPropagation()}
                          className={`ml-1 flex-shrink-0 text-sm ${active ? 'text-red-400' : 'text-gray-300'}`}
                        >
                          {active ? '♥' : '♡'}
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
                        <WeatherChip field={field} />
                      </div>

                      {/* Field type chips */}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {field.field_types.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{t}</span>
                        ))}
                      </div>

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
        <MapPlaceholder
          selectedId={selectedId}
          onSelectPin={setSelectedId}
          className="flex-1"
        />

        {/* ── Right: preview panel ── */}
        {selectedField && (
          <div className="w-72 flex-shrink-0 overflow-y-auto bg-white border-l border-gray-200 flex flex-col">
            <HeroPhoto className="h-40 w-full text-xs flex-shrink-0" label="HERO PHOTO" />

            <div className="p-4 flex-1 flex flex-col">
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
                <WeatherChip field={selectedField} />
              </div>

              {/* Stat grid — Fields / Pricing / Rentals only (no capacity) */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: '⚡', label: 'FIELDS', value: selectedField.num_fields },
                  { icon: '💰', label: 'PRICING', value: selectedField.pricing?.split(' ')[0] ?? '—' },
                  { icon: '🎿', label: 'RENTALS', value: selectedField.rentals_available ? 'Yes' : 'No' },
                ].map((stat) => (
                  <div key={stat.label} className="border border-gray-200 rounded-lg p-2 flex flex-col items-center gap-0.5 text-center">
                    <span className="text-base">{stat.icon}</span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">{stat.label}</span>
                    <span className="text-sm font-semibold text-gray-800 leading-tight">{stat.value}</span>
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
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Game Types</p>
                <div className="flex flex-wrap gap-1">
                  {selectedField.field_types.map((t) => (
                    <FieldTypeChip key={t} type={t} small />
                  ))}
                </div>
              </div>

              {/* Upcoming event */}
              {selectedField.events[0] && (
                <div className="bg-orange-50 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <span className="text-orange-500 text-sm flex-shrink-0">📅</span>
                  <span className="text-xs font-medium text-orange-800 leading-tight">
                    {selectedField.events[0].title} — {selectedField.events[0].display_date}
                  </span>
                </div>
              )}

              {/* CTAs */}
              <div className="mt-auto space-y-2">
                <button
                  onClick={() => navigate(`/field/${selectedField.id}`)}
                  className="w-full bg-brand text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-brand-dark transition-colors"
                >
                  View full field page →
                </button>
                <button className="w-full text-center text-xs text-gray-500 py-1 hover:text-gray-700 flex items-center justify-center gap-1">
                  <span>⊕</span> Get directions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
