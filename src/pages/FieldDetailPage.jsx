import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBadge from '../components/StatusBadge'
import FieldTypeChip from '../components/FieldTypeChip'
import HeroPhoto from '../components/HeroPhoto'
import ActivePlayers from '../components/ActivePlayers'
import { supabase } from '../lib/supabase'
import { normalizeField, formatTime } from '../lib/fieldUtils'
import { useAuth } from '../context/AuthContext'
import WeatherChip from '../components/WeatherChip'

const EVENT_TYPE_LABELS = {
  big_game: 'Big Game',
  league: 'League',
  tournament: 'Tournament',
  walk_on: 'Walk-on',
}

const EVENT_TYPE_COLORS = {
  big_game: 'bg-red-100 text-red-700',
  league: 'bg-blue-100 text-blue-700',
  tournament: 'bg-purple-100 text-purple-700',
  walk_on: 'bg-gray-100 text-gray-600',
}

const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TODAY_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]

const TODAY = new Date().toISOString().split('T')[0]

export default function FieldDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [photoIndex] = useState(0)
  const [field, setField] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const totalPhotos = 24

  const [goingCount, setGoingCount] = useState(0)
  const [userRsvp, setUserRsvp] = useState(null)
  const [userRsvpLoaded, setUserRsvpLoaded] = useState(false)
  const [rsvpBusy, setRsvpBusy] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [mentionedIt, setMentionedIt] = useState(false)

  async function handleMentionIt() {
    setMentionedIt(true)
    await supabase.rpc('increment_player_cta_clicks', { field_id: id })
  }

  async function handleShare(fieldName) {
    const shareData = {
      title: fieldName,
      text: `Check out ${fieldName} on MaskUp.gg`,
      url: window.location.href,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch { /* user dismissed or share failed */ }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  useEffect(() => {
    async function fetchField() {
      const { data, error } = await supabase
        .from('fields')
        .select('*, events(*)')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        setError(error.message)
      } else if (!data) {
        setError('Field not found or not yet published.')
      } else {
        setField(normalizeField(data))
      }
      setLoading(false)
    }
    fetchField()
  }, [id])

  useEffect(() => {
    async function fetchGoingCount() {
      const { count } = await supabase
        .from('going_today')
        .select('*', { count: 'exact', head: true })
        .eq('field_id', id)
        .eq('date', TODAY)
      setGoingCount(count ?? 0)
    }
    fetchGoingCount()
  }, [id])

  useEffect(() => {
    if (!user) return
    async function fetchUserRsvp() {
      const { data } = await supabase
        .from('going_today')
        .select('field_id, fields(name)')
        .eq('user_id', user.id)
        .eq('date', TODAY)
        .maybeSingle()
      setUserRsvp(data)
      setUserRsvpLoaded(true)
    }
    fetchUserRsvp()
  }, [user])

  async function handleRsvp() {
    if (!user || rsvpBusy) return
    setRsvpBusy(true)
    setGoingCount((c) => c + 1)
    setUserRsvp({ field_id: id, fields: { name: field.name } })
    const { error } = await supabase
      .from('going_today')
      .upsert({ field_id: id, user_id: user.id, date: TODAY }, { onConflict: 'user_id,date' })
    if (error) {
      setGoingCount((c) => c - 1)
      setUserRsvp(null)
    }
    setRsvpBusy(false)
  }

  async function handleUndo() {
    if (!user || rsvpBusy) return
    setRsvpBusy(true)
    setGoingCount((c) => Math.max(0, c - 1))
    setUserRsvp(null)
    const { error } = await supabase
      .from('going_today')
      .delete()
      .eq('user_id', user.id)
      .eq('field_id', id)
      .eq('date', TODAY)
    if (error) {
      setGoingCount((c) => c + 1)
      setUserRsvp({ field_id: id, fields: { name: field?.name } })
    }
    setRsvpBusy(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (error || !field) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-red-400 text-sm text-center">{error ?? 'Field not found.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-brand font-medium">← Go back</button>
      </div>
    )
  }

  const isIndoor = field.field_types.includes('Indoor')

  return (
    <div className="min-h-screen bg-white pb-24">

      {/* ── 1 + 2. Hero photo with top bar overlaid ── */}
      <div className="relative">
        <HeroPhoto className="h-64 w-full" label="HERO PHOTO · FIELD" />

        <div className="absolute top-0 left-0 right-0 pt-12 px-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow text-gray-700"
          >
            ←
          </button>
          <div className="flex gap-2">
            <button className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow text-gray-700 text-sm">
              ↗
            </button>
            <button className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow text-gray-700">
              ♡
            </button>
          </div>
        </div>

        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
          📷 {photoIndex + 1} / {totalPhotos}
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* ── 3. Field header ── */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {field.city}, {field.province}{field.distance_km != null && ` · ${field.distance_km} km away`}
          </div>
          {field.lat && field.lng && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${field.lat},${field.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand font-medium hover:underline flex-shrink-0"
            >
              🗺️ Get Directions
            </a>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{field.name}</h1>

        {field.rating != null && (
          <div className="flex items-center gap-1 mb-3">
            {'★★★★★'.split('').map((_, i) => (
              <span key={i} className={`text-lg ${i < Math.floor(field.rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
            ))}
            <span className="text-sm font-semibold text-gray-800 ml-0.5">{field.rating.toFixed(1)}</span>
            {field.review_count != null && (
              <span className="text-sm text-gray-400">({field.review_count} reviews)</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-5">
          <StatusBadge status={field.weather_status} />
          {field.today_hours && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
              🕐 {field.today_hours}
            </span>
          )}
          {field.walk_ins && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
              ✓ Walk-ins OK
            </span>
          )}
        </div>

        {/* ── Unclaimed banner ── */}
        {!field.claimed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-sm text-amber-800 leading-relaxed mb-3">
              This listing hasn't been claimed yet. Know someone who runs{' '}
              <span className="font-semibold">{field.name}</span>? Share MaskUp.gg with them.
            </p>
            <button
              onClick={() => handleShare(field.name)}
              className="w-full py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors"
            >
              {shareCopied ? 'Link copied!' : 'Share this listing'}
            </button>
          </div>
        )}

        {/* ── "I Mentioned It" CTA ── */}
        {!field.claimed && (
          <div className="mb-5">
            <p className="text-xs text-gray-500 mb-2">Already mentioned MaskUp.gg at this field? Let us know!</p>
            <button
              onClick={handleMentionIt}
              disabled={mentionedIt}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                mentionedIt
                  ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-default'
                  : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
              }`}
            >
              {mentionedIt ? 'Thanks for spreading the word! 🎯' : 'I mentioned it ✓'}
            </button>
          </div>
        )}

        {/* ── 4. Stat row — omit Pricing/Rentals for unclaimed when data missing ── */}
        <div className="flex gap-2 mb-5">
          {[
            { icon: '⚡', label: 'FIELDS', value: field.num_fields },
            { icon: '💰', label: 'PRICING', value: field.pricing?.split('–')[0]?.trim() ?? '—', skip: !field.claimed && !field.pricing },
            { icon: '🎿', label: 'RENTALS', value: field.rentals_available ? 'Yes' : 'No', skip: !field.claimed },
          ].filter((s) => !s.skip).map((stat) => (
            <div key={stat.label} className="flex-1 border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-1">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">{stat.label}</span>
              <span className="text-sm font-bold text-gray-800 text-center leading-tight">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Pricing CTA — unclaimed fields with no pricing data */}
        {!field.claimed && !field.pricing && (
          <p className="text-sm text-amber-700 mb-5">
            Pricing not listed yet — mention MaskUp.gg next time you're at {field.name}
          </p>
        )}

        {/* ── 4b. Weather ── */}
        <div className="mb-5">
          <WeatherChip field={field} variant="detail" />
        </div>

        {/* ── 5. Active players — own section ── */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Players on-site now</p>
          <ActivePlayers field={field} size="md" />
          <p className="text-xs text-gray-400 mt-1.5">Community estimate · reports reset nightly</p>
          <button className="mt-2 text-xs text-brand font-medium hover:underline">
            Are you here? Submit a report
          </button>
        </div>

        {/* ── 5b. I'm Going Today RSVP ── */}
        <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Going today</p>

          {goingCount > 0 && (
            <p className="text-sm font-medium text-gray-700 mb-3">
              {goingCount} {goingCount === 1 ? 'person' : 'people'} going today
            </p>
          )}

          {!user && (
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="text-sm text-brand font-semibold hover:underline"
            >
              {goingCount > 0 ? 'Sign in to join them' : 'Sign in to say you\'re going today'}
            </Link>
          )}

          {user && userRsvpLoaded && !userRsvp && (
            <button
              onClick={handleRsvp}
              disabled={rsvpBusy}
              className="w-full py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-60"
            >
              I'm going today
            </button>
          )}

          {user && userRsvpLoaded && userRsvp?.field_id === id && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand">You're going ✓</span>
              <button
                onClick={handleUndo}
                disabled={rsvpBusy}
                className="text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-40"
              >
                Undo
              </button>
            </div>
          )}

          {user && userRsvpLoaded && userRsvp && userRsvp.field_id !== id && (
            <p className="text-sm text-gray-500">
              You've already said you're going to{' '}
              <span className="font-medium text-gray-700">{userRsvp.fields?.name}</span> today
            </p>
          )}
        </div>

        {/* ── 6. Game types ── */}
        {(field.field_types.length > 0 || !field.claimed) && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Game types</h2>
            {field.field_types.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {field.field_types.map((t) => (
                  <FieldTypeChip key={t} type={t} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-700">Game types not listed yet — ask the staff at {field.name} to claim their listing</p>
            )}
          </div>
        )}

        {/* ── 7. Upcoming events ── */}
        {field.events.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Upcoming events</h2>
            <div className="space-y-2">
              {field.events.slice(0, 3).map((event) => (
                <button
                  key={event.id}
                  className="w-full text-left flex items-center gap-3 bg-orange-50 rounded-xl p-3 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 text-center">
                    <div className="text-xs font-bold text-orange-600 uppercase leading-none">
                      {event.display_date?.split(' ')[0]}
                    </div>
                    <div className="text-xl font-bold text-orange-700 leading-tight">
                      {event.display_date?.split(' ')[1]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${EVENT_TYPE_COLORS[event.event_type]}`}>
                        {EVENT_TYPE_LABELS[event.event_type]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.start_time}–{event.end_time} · {event.spots_remaining} spots left
                    </p>
                  </div>
                  <span className="text-gray-400 text-lg flex-shrink-0">›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 8. About this field ── */}
        {(field.description || !field.claimed) && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">About this field</h2>
            {field.description ? (
              <p className="text-sm text-gray-600 leading-relaxed">{field.description}</p>
            ) : (
              <p className="text-sm text-amber-700">No description yet — know this field? Tell them about MaskUp.gg</p>
            )}
          </div>
        )}

        {/* ── 9. Hours ── */}
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Hours</h2>
          {!field.claimed && Object.keys(field.hours ?? {}).length === 0 ? (
            <p className="text-sm text-amber-700">
              Hours not listed yet — next time you visit {field.name}, ask them about claiming their free MaskUp.gg listing!
            </p>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {DAYS_ORDER.map((day) => {
                  const raw = field.hours?.[day]
                  let hoursLabel = 'Closed'
                  if (raw) {
                    if (typeof raw === 'string') {
                      hoursLabel = raw !== 'Closed' ? raw : 'Closed'
                    } else if (!raw.closed && raw.open && raw.close) {
                      hoursLabel = `${formatTime(raw.open)}–${formatTime(raw.close)}`
                    }
                  }
                  const isClosed = hoursLabel === 'Closed'
                  const isToday = day === TODAY_DAY
                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between py-2 ${isToday ? '-mx-1 px-1 bg-brand/5 rounded' : ''}`}
                    >
                      <span className={`text-sm ${isToday ? 'text-brand font-semibold' : 'text-gray-600'}`}>
                        {day}
                        {isToday && <span className="ml-2 text-[10px] bg-brand text-white px-1.5 py-0.5 rounded-full font-medium">Today</span>}
                      </span>
                      <span className={`text-sm ${isClosed ? 'text-gray-400' : isToday ? 'text-brand font-semibold' : 'text-gray-700'}`}>
                        {hoursLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2.5">
                {isIndoor || !field.seasonal_start
                  ? 'Open year-round'
                  : `Seasonal: ${new Date(field.seasonal_start).toLocaleDateString('en-CA', { month: 'long' })} – ${new Date(field.seasonal_end).toLocaleDateString('en-CA', { month: 'long' })}`}
              </p>
            </>
          )}
        </div>

        {/* ── 10. Rental gear ── */}
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Rental gear</h2>
          {field.rentals_available ? (
            <div className="flex items-start gap-2">
              <span className="text-brand text-sm mt-0.5 flex-shrink-0">✓</span>
              <p className="text-sm text-gray-600">{field.rental_pricing}</p>
            </div>
          ) : !field.claimed ? (
            <p className="text-sm text-amber-700">Rental info not available yet — ask {field.name} about claiming their free MaskUp.gg listing</p>
          ) : (
            <p className="text-sm text-gray-400">No rentals — bring your own gear</p>
          )}
        </div>

      </div>

      {/* ── 11. Sticky footer ── */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex items-center gap-3 px-4 py-3 z-50">
        {field.lat && field.lng ? (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${field.lat},${field.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            🗺️ Directions
          </a>
        ) : (
          <button disabled className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-300 flex items-center justify-center gap-2 cursor-not-allowed">
            🗺️ Directions
          </button>
        )}
        <button className="flex-1 py-3 bg-brand rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors">
          <span>📞</span> Call to book
        </button>
      </div>
    </div>
  )
}
