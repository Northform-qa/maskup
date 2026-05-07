import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MapPlaceholder from '../components/MapPlaceholder'
import StatusBadge from '../components/StatusBadge'
import StarRating from '../components/StarRating'
import ActivePlayers from '../components/ActivePlayers'
import HeroPhoto from '../components/HeroPhoto'
import { supabase } from '../lib/supabase'
import { normalizeField } from '../lib/fieldUtils'
import { FILTER_CHIPS } from '../data/mockData'

export default function DiscoverPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchFields() {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('listing_status', 'published')
        .order('name')

      if (error) {
        setError(error.message)
      } else {
        setFields((data ?? []).map(normalizeField))
      }
      setLoading(false)
    }
    fetchFields()
  }, [])

  const filtered =
    activeFilter === 'All'
      ? fields
      : fields.filter((f) => f.field_types.includes(activeFilter))

  return (
    <div className="md:hidden flex flex-col h-screen bg-white">
      {/* Search bar */}
      <div className="px-4 pt-12 pb-3 bg-white">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search fields, cities, postal code"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
          <button className="text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
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
      <MapPlaceholder
        selectedId={selectedId}
        onSelectPin={setSelectedId}
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
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No fields match this filter.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((field) => (
              <button
                key={field.id}
                onClick={() => navigate(`/field/${field.id}`)}
                className="w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <HeroPhoto className="w-16 h-16 flex-shrink-0 rounded-lg text-[8px]" label="FIELD" />

                <div className="flex-1 min-w-0">
                  {/* Name + fav */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight">{field.name}</h3>
                    <button onClick={(e) => e.stopPropagation()} className="text-gray-300 flex-shrink-0 mt-0.5">♡</button>
                  </div>

                  {/* City + distance */}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {field.city}, {field.province}
                    {field.distance_km != null && ` · ${field.distance_km} km`}
                  </p>

                  {/* Status + hours */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <StatusBadge status={field.weather_status} />
                    {field.today_hours && (
                      <span className="text-xs text-gray-500">🕐 {field.today_hours} today</span>
                    )}
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
