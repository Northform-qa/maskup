import { useState, useEffect } from 'react'
import HeroPhoto from '../components/HeroPhoto'
import FieldTypeChip from '../components/FieldTypeChip'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { normalizeField } from '../lib/fieldUtils'

const STATUS_OPTIONS = [
  {
    key: 'open',
    label: 'Open',
    sublabel: 'Listing live',
    icon: '☀️',
    color: 'text-brand',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    key: 'rain_delay',
    label: 'Rain delay',
    sublabel: 'Posted at top of listing',
    icon: '🌧️',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    key: 'closed',
    label: 'Closed today',
    sublabel: 'Hides from search',
    icon: '✕',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  },
]

const HEALTH_ITEMS = [
  { label: 'Hours added', detail: 'All 7 days configured', done: true },
  { label: 'Rental info added', detail: 'Markers + masks', done: true },
  { label: 'Contact info verified', detail: 'Phone & website confirmed', done: true },
  { label: 'Photos uploaded', detail: 'Add at least 3 photos', done: false },
  { label: 'Pricing added', detail: 'Add your session pricing', done: false },
]

const MONTH_LABELS = {
  '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
  '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
  '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC',
}

function parseDateBadge(dateStr) {
  const [, month, day] = dateStr.split('-')
  return { month: MONTH_LABELS[month] ?? month, day: parseInt(day) }
}

function StatCard({ label, value, delta, up }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-5 flex-1 min-w-0">
      <p className="text-[9px] md:text-xs text-gray-400 leading-tight mb-1 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-none">{value}</p>
      <p className={`text-[10px] md:text-xs font-medium mt-1 ${up ? 'text-brand' : 'text-red-500'}`}>
        {up ? '▲' : '▼'} {delta} vs last week
      </p>
    </div>
  )
}

function initials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

export default function OwnerDashboard() {
  const { user, profile } = useAuth()
  const [field, setField] = useState(null)
  const [events, setEvents] = useState([])
  const [loadingField, setLoadingField] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [weatherStatus, setWeatherStatus] = useState('open')
  const [overridePlayers, setOverridePlayers] = useState('')
  const [savedPlayers, setSavedPlayers] = useState(null)

  useEffect(() => {
    if (!user) return
    async function fetchField() {
      const { data, error } = await supabase
        .from('fields')
        .select('*, events(*)')
        .eq('owner_id', user.id)
        .single()

      if (error) {
        setFetchError(error.message)
      } else if (data) {
        const normalized = normalizeField(data)
        setField(normalized)
        setEvents(normalized.events)
        setWeatherStatus(data.weather_status ?? 'open')
        if (data.active_players_now != null) setSavedPlayers(data.active_players_now)
      }
      setLoadingField(false)
    }
    fetchField()
  }, [user])

  async function handleWeatherChange(key) {
    setWeatherStatus(key)
    if (!field) return
    await supabase.from('fields').update({ weather_status: key }).eq('id', field.id)
  }

  async function handleSavePlayers() {
    const n = parseInt(overridePlayers, 10)
    if (!Number.isNaN(n) && n >= 0) {
      setSavedPlayers(n)
      if (field) {
        await supabase.from('fields').update({ active_players_now: n }).eq('id', field.id)
      }
    }
  }

  const doneCount = HEALTH_ITEMS.filter((i) => i.done).length
  const allDone = doneCount === HEALTH_ITEMS.length

  if (loadingField) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading dashboard…</span>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <p className="text-sm text-red-500">{fetchError}</p>
      </div>
    )
  }

  if (!field) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <p className="text-sm text-gray-500">No field found for your account.</p>
      </div>
    )
  }

  const isPending = field.listing_status === 'pending'
  const avatarInitials = initials(profile?.display_name ?? user?.email ?? '')

  return (
    <div className="min-h-screen bg-cream-100">

      {/* ── Desktop nav bar ── */}
      <div className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-brand font-black text-lg tracking-tight">Maskup</span>
            <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
            <span className="px-2 py-0.5 text-xs font-semibold bg-brand/10 text-brand rounded-full">Owner</span>
          </div>
          <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            View public listing →
          </button>
        </div>
      </div>

      {/* ── Desktop heading row ── */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-1">Owner Dashboard</p>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
                {isPending ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Pending approval
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-brand text-xs font-semibold rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    Live
                  </span>
                )}
                <span className="text-sm text-gray-400">
                  {field.city}, {field.province}
                </span>
              </div>
            </div>
            <button className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors">
              + Post new event
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile header ── */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Owner dashboard</p>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5 leading-tight">{field.name}</h1>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
            {avatarInitials}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="px-4 py-5 md:max-w-6xl md:mx-auto md:px-6 md:py-8">

        {/* Stat cards — placeholder until analytics are wired */}
        <div className="flex gap-2 md:gap-4 mb-4 md:mb-6">
          <StatCard label="Profile views this week" value="—" delta="—" up={true} />
          <StatCard label="Times saved" value="—" delta="—" up={true} />
          <StatCard label="Calls to book" value="—" delta="—" up={true} />
        </div>

        {/*
          2-col grid on desktop: items flow as
            [listing]  [status]
            [events]   [health]
          Mobile: same DOM order stacks vertically via space-y-4
        */}
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-[3fr_2fr] md:gap-6 md:items-start">

          {/* LEFT col · row 1 — Live listing preview */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 md:px-5 md:pt-5">
              <h2 className="text-sm font-semibold text-gray-800">Your live listing</h2>
              <button className="flex items-center gap-1 text-xs font-medium text-brand border border-brand/30 rounded-full px-3 py-1 hover:bg-brand/5 transition-colors">
                ✏️ Edit listing
              </button>
            </div>
            <div className="mx-4 mb-4 md:mx-5 md:mb-5 border border-gray-200 rounded-xl overflow-hidden">
              <div className="relative">
                <HeroPhoto className="h-28 md:h-40 w-full text-[9px]" label="HERO · COMBAT ZONE" />
                <span className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  LIVE
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900 mb-1">{field.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <span>📍</span> {field.city}, {field.province} · {field.num_fields} fields
                </div>
                <div className="flex gap-1 flex-wrap">
                  {field.field_types.map((t) => (
                    <FieldTypeChip key={t} type={t} small />
                  ))}
                </div>
              </div>
              <div className="px-3 pb-3">
                <button className="w-full py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  ✏️ Edit
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT col · row 1 — Today's status + active players override */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Today's status</h2>

            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => {
                const active = weatherStatus === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleWeatherChange(opt.key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      active ? `${opt.bg} ${opt.border}` : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex-shrink-0 text-lg leading-none">{opt.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${active ? opt.color : 'text-gray-600'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-400">{opt.sublabel}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      active ? 'border-brand bg-brand' : 'border-gray-300'
                    }`}>
                      {active && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {weatherStatus === 'rain_delay' && (
              <div className="mt-3 flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl p-3">
                <span className="text-orange-400 flex-shrink-0 mt-0.5">ⓘ</span>
                <p className="text-xs text-orange-700 leading-relaxed">
                  Rain delay banner is showing on your listing. Clears automatically at midnight unless you extend it.
                </p>
              </div>
            )}

            {weatherStatus === 'closed' && (
              <div className="mt-3 flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <span className="text-gray-400 flex-shrink-0 mt-0.5">ⓘ</span>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your field is hidden from search results until you reopen.
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Set active players now
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={overridePlayers}
                  onChange={(e) => setOverridePlayers(e.target.value)}
                  placeholder="e.g. 24"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 placeholder-gray-400"
                />
                <button
                  onClick={handleSavePlayers}
                  className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors"
                >
                  Save
                </button>
              </div>
              {savedPlayers !== null && (
                <p className="text-xs text-brand font-medium mt-1.5">✓ Showing {savedPlayers} players on-site</p>
              )}
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Overrides the community estimate. Resets automatically at midnight.
              </p>
            </div>
          </div>

          {/* LEFT col · row 2 — Upcoming events */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Upcoming events</h2>
              {/* Desktop inline button */}
              <button className="hidden md:flex items-center gap-1 text-xs font-medium text-white bg-brand px-3 py-1.5 rounded-full hover:bg-brand-dark transition-colors">
                + Post new event
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {events.map((event) => {
                const { month, day } = parseDateBadge(event.date)
                const timeStr = event.end_time
                  ? `${event.start_time}–${event.end_time}`
                  : event.start_time
                return (
                  <div key={event.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex flex-col items-center w-9 flex-shrink-0">
                      <span className="text-[9px] font-bold text-brand uppercase leading-none">{month}</span>
                      <span className="text-xl font-bold text-gray-900 leading-tight">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{event.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {event.day_label} · {timeStr} · {event.spots_remaining} spots
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-xs">✏️</button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-xs">🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Mobile: dashed post button below list */}
            <button className="md:hidden mt-3 w-full py-2.5 border border-dashed border-brand/40 text-brand text-sm font-medium rounded-xl hover:bg-brand/5 transition-colors">
              + Post new event
            </button>
          </div>

          {/* RIGHT col · row 2 — Listing health */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Listing health</h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                allDone ? 'bg-green-100 text-brand' : 'bg-amber-100 text-amber-700'
              }`}>
                {doneCount} of {HEALTH_ITEMS.length} complete
              </span>
            </div>

            <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${allDone ? 'bg-brand' : 'bg-amber-400'}`}
                style={{ width: `${(doneCount / HEALTH_ITEMS.length) * 100}%` }}
              />
            </div>

            <div className="space-y-3">
              {HEALTH_ITEMS.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.done ? 'bg-brand' : 'border-2 border-gray-300'
                  }`}>
                    {item.done && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${item.done ? 'text-gray-800' : 'text-gray-500'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile nav spacer */}
      <div className="h-20 md:hidden" />
    </div>
  )
}
