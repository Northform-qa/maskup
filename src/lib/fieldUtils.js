const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// nowMins defaults to current time; pass an explicit value in tests to avoid mocking Date.
export function isOpenNow(hours, nowMins = new Date().getHours() * 60 + new Date().getMinutes()) {
  const val = hours?.[DAY_KEYS[new Date().getDay()]]
  if (!val || val.closed) return false
  if (val.open && val.close) {
    const [oh, om] = val.open.split(':').map(Number)
    const [ch, cm] = val.close.split(':').map(Number)
    return nowMins >= oh * 60 + om && nowMins < ch * 60 + cm
  }
  // Legacy string format: '9am–5pm'
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

// Returns the effective status to display for a field.
// weather_status 'rain_delay' and 'closed' are owner overrides — always respected.
// weather_status 'open' defers to actual hours: 'open' if within hours, null if outside or unknown.
export function getFieldStatus(field, nowMins) {
  const ws = field?.weather_status
  if (ws === 'rain_delay' || ws === 'closed') return ws
  const hasHours = field?.hours && Object.keys(field.hours).length > 0
  if (!hasHours) return null
  return isOpenNow(field.hours, nowMins) ? 'open' : null
}

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
