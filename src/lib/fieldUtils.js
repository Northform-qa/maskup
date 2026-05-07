const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function getTodayHours(hours) {
  const key = DAY_KEYS[new Date().getDay()]
  const val = hours?.[key]
  return val && val !== 'Closed' ? val : null
}

// Converts Supabase time strings ('10:00:00') to display format ('10am', '10:30am')
export function formatTime(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${period}` : `${hour}:${m.toString().padStart(2, '0')}${period}`
}

// Converts '2026-06-14' → 'Sun Jun 14'
// Uses T12:00:00 to prevent UTC midnight from shifting the displayed day
export function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function normalizeEvent(e) {
  return {
    ...e,
    display_date: formatDisplayDate(e.date),
    start_time: formatTime(e.start_time),
    end_time: formatTime(e.end_time),
  }
}

export function normalizeField(f) {
  return {
    ...f,
    today_hours: getTodayHours(f.hours),
    events: (f.events ?? [])
      .map(normalizeEvent)
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}
