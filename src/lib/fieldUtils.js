const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function getTodayHours(hours) {
  const dayIndex = new Date().getDay() // 0 = Sun, 6 = Sat
  const key = DAY_KEYS[dayIndex]
  const val = hours?.[key]

  if (!val) {
    // Default: fields with no hours data at all are assumed open Sat/Sun 9am–5pm
    const noHoursData = !hours || Object.keys(hours).length === 0
    if (noHoursData && (dayIndex === 0 || dayIndex === 6)) return '9am–5pm'
    return null
  }

  // String format (legacy seed data): '9am–5pm' or 'Closed'
  if (typeof val === 'string') return val !== 'Closed' ? val : null
  // Object format (form submissions): {open: '09:00', close: '17:00'} or {closed: true}
  if (val.closed) return null
  if (val.open && val.close) return `${formatTime(val.open)}–${formatTime(val.close)}`
  return null
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

// Returns true if the field matches the active filter chip.
// 'All' or null/undefined → always matches.
export function fieldMatchesFilter(field, activeFilter) {
  if (!activeFilter || activeFilter === 'All') return true
  return field.field_types?.includes(activeFilter) ?? false
}

export function normalizeField(f) {
  return {
    ...f,
    field_types: [...new Set(f.field_types ?? [])],
    today_hours: getTodayHours(f.hours),
    events: (f.events ?? [])
      .map(normalizeEvent)
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}
