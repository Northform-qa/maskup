import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatTime, formatDisplayDate, getTodayHours, getTodayHoursState, normalizeEvent, normalizeField, fieldMatchesFilter, getDistanceKm } from './fieldUtils'

// Pin to a known Monday so getTodayHours always reads the 'Mon' key
const MOCK_MONDAY = new Date('2026-06-15T12:00:00').getTime()

beforeEach(() => vi.setSystemTime(MOCK_MONDAY))
afterEach(() => vi.useRealTimers())

// ─── formatTime ───────────────────────────────────────────────

describe('formatTime', () => {
  it('returns null for null input', () => {
    expect(formatTime(null)).toBeNull()
  })

  it('formats an exact hour in the morning', () => {
    expect(formatTime('09:00')).toBe('9am')
  })

  it('formats an exact hour in the afternoon', () => {
    expect(formatTime('14:00')).toBe('2pm')
  })

  it('formats noon as 12pm', () => {
    expect(formatTime('12:00')).toBe('12pm')
  })

  it('formats midnight as 12am', () => {
    expect(formatTime('00:00')).toBe('12am')
  })

  it('includes minutes when non-zero', () => {
    expect(formatTime('10:30')).toBe('10:30am')
  })

  it('pads single-digit minutes', () => {
    expect(formatTime('13:05')).toBe('1:05pm')
  })

  it('handles Supabase full timestamp strings (HH:MM:SS)', () => {
    expect(formatTime('10:00:00')).toBe('10am')
  })
})

// ─── formatDisplayDate ────────────────────────────────────────

describe('formatDisplayDate', () => {
  it('returns empty string for null', () => {
    expect(formatDisplayDate(null)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatDisplayDate('')).toBe('')
  })

  it('formats a known date correctly', () => {
    // 2026-06-14 is a Sunday
    expect(formatDisplayDate('2026-06-14')).toBe('Sun, Jun 14')
  })

  it('does not shift the day due to UTC midnight', () => {
    // This would show Sat Jun 13 if parsed as UTC midnight without the T12:00:00 fix
    expect(formatDisplayDate('2026-06-14')).toContain('14')
  })
})

// ─── getTodayHours ────────────────────────────────────────────

describe('getTodayHours', () => {
  it('returns null for null hours', () => {
    expect(getTodayHours(null)).toBeNull()
  })

  it('returns null when today (Mon) has no entry in a populated hours object', () => {
    expect(getTodayHours({ Tue: '10am–4pm' })).toBeNull()
  })

  it('returns null for empty hours object on a weekday', () => {
    expect(getTodayHours({})).toBeNull()
  })

  it('returns default 9am–5pm on Saturday when hours is null', () => {
    vi.setSystemTime(new Date('2026-06-20T12:00:00').getTime()) // Saturday
    expect(getTodayHours(null)).toBe('9am–5pm')
  })

  it('returns default 9am–5pm on Sunday when hours is null', () => {
    vi.setSystemTime(new Date('2026-06-21T12:00:00').getTime()) // Sunday
    expect(getTodayHours(null)).toBe('9am–5pm')
  })

  it('returns default 9am–5pm on Saturday when hours object is empty', () => {
    vi.setSystemTime(new Date('2026-06-20T12:00:00').getTime()) // Saturday
    expect(getTodayHours({})).toBe('9am–5pm')
  })

  it('does not apply default on Saturday when owner has explicitly set hours', () => {
    vi.setSystemTime(new Date('2026-06-20T12:00:00').getTime()) // Saturday
    expect(getTodayHours({ Sat: '10am–6pm' })).toBe('10am–6pm')
  })

  it('does not apply default on Saturday when owner has explicitly set Closed', () => {
    vi.setSystemTime(new Date('2026-06-20T12:00:00').getTime()) // Saturday
    expect(getTodayHours({ Sat: 'Closed' })).toBeNull()
  })

  it('returns null on a weekday with no hours data', () => {
    vi.setSystemTime(new Date('2026-06-17T12:00:00').getTime()) // Wednesday
    expect(getTodayHours(null)).toBeNull()
  })

  it('returns string value for legacy string format', () => {
    expect(getTodayHours({ Mon: '9am–5pm' })).toBe('9am–5pm')
  })

  it('returns null for string "Closed"', () => {
    expect(getTodayHours({ Mon: 'Closed' })).toBeNull()
  })

  it('formats object format with open and close times', () => {
    expect(getTodayHours({ Mon: { open: '09:00', close: '17:00' } })).toBe('9am–5pm')
  })

  it('returns null for object format with closed: true', () => {
    expect(getTodayHours({ Mon: { closed: true } })).toBeNull()
  })

  it('returns null for object format missing open/close', () => {
    expect(getTodayHours({ Mon: {} })).toBeNull()
  })
})

// ─── normalizeEvent ───────────────────────────────────────────

describe('normalizeEvent', () => {
  it('adds display_date and formats times', () => {
    const event = {
      id: 'e1',
      title: 'Big Game',
      event_type: 'big_game',
      date: '2026-06-14',
      start_time: '10:00',
      end_time: '16:00',
    }
    const result = normalizeEvent(event)
    expect(result.display_date).toContain('14')
    expect(result.start_time).toBe('10am')
    expect(result.end_time).toBe('4pm')
  })

  it('handles null end_time', () => {
    const event = { id: 'e2', date: '2026-06-14', start_time: '09:00', end_time: null }
    expect(normalizeEvent(event).end_time).toBeNull()
  })

  it('preserves all other event fields', () => {
    const event = { id: 'e3', title: 'Test', date: '2026-06-14', start_time: '09:00', end_time: null, spots_remaining: 42 }
    expect(normalizeEvent(event).spots_remaining).toBe(42)
  })
})

// ─── normalizeField ───────────────────────────────────────────

describe('normalizeField', () => {
  const base = {
    id: '1',
    name: 'Test Field',
    field_types: ['Woodsball', 'Speedball', 'Woodsball'],
    hours: { Mon: '9am–5pm' },
    events: [],
  }

  it('deduplicates field_types', () => {
    const result = normalizeField(base)
    expect(result.field_types).toEqual(['Woodsball', 'Speedball'])
  })

  it('sets today_hours from hours object', () => {
    const result = normalizeField(base)
    expect(result.today_hours).toBe('9am–5pm')
  })

  it('sets today_hours to null when field is closed today', () => {
    const result = normalizeField({ ...base, hours: { Mon: 'Closed' } })
    expect(result.today_hours).toBeNull()
  })

  it('handles null field_types gracefully', () => {
    const result = normalizeField({ ...base, field_types: null })
    expect(result.field_types).toEqual([])
  })

  it('handles null events gracefully', () => {
    const result = normalizeField({ ...base, events: null })
    expect(result.events).toEqual([])
  })

  it('sorts events by date ascending', () => {
    const field = {
      ...base,
      events: [
        { id: 'e2', date: '2026-07-01', start_time: '10:00', end_time: null },
        { id: 'e1', date: '2026-06-14', start_time: '09:00', end_time: null },
      ],
    }
    const result = normalizeField(field)
    expect(result.events[0].id).toBe('e1')
    expect(result.events[1].id).toBe('e2')
  })

  it('preserves all other field properties', () => {
    const result = normalizeField({ ...base, city: 'Toronto', rating: 4.7 })
    expect(result.city).toBe('Toronto')
    expect(result.rating).toBe(4.7)
  })
})

// ─── getTodayHoursState ───────────────────────────────────────

describe('getTodayHoursState', () => {
  // Pinned to Monday via beforeEach above — reads 'Mon' key

  it('returns null when hours is null (no data → Contact field)', () => {
    expect(getTodayHoursState(null)).toBeNull()
  })

  it('returns null when hours is undefined', () => {
    expect(getTodayHoursState(undefined)).toBeNull()
  })

  it('returns null when hours is an empty object', () => {
    expect(getTodayHoursState({})).toBeNull()
  })

  it('returns false when today has no entry in hours (Closed today)', () => {
    expect(getTodayHoursState({ Tue: '10am–4pm' })).toBe(false)
  })

  it('returns false when today is string "Closed"', () => {
    expect(getTodayHoursState({ Mon: 'Closed' })).toBe(false)
  })

  it('returns false when today has closed: true (object format)', () => {
    expect(getTodayHoursState({ Mon: { closed: true } })).toBe(false)
  })

  it('returns false when today entry has no open/close and is not a string', () => {
    expect(getTodayHoursState({ Mon: {} })).toBe(false)
  })

  it('returns time string for legacy string format', () => {
    expect(getTodayHoursState({ Mon: '9am–5pm' })).toBe('9am–5pm')
  })

  it('returns formatted time string for object format with open/close', () => {
    expect(getTodayHoursState({ Mon: { open: '10:00', close: '16:00' } })).toBe('10am–4pm')
  })

  it('returns formatted time string with minutes when non-zero', () => {
    expect(getTodayHoursState({ Mon: { open: '09:30', close: '17:30' } })).toBe('9:30am–5:30pm')
  })
})

// ─── hours null check (FieldDetailPage "Contact field for hours" condition) ───

describe('hours null check logic', () => {
  // Mirrors the condition in FieldDetailPage.jsx:
  // !field.hours || Object.keys(field.hours).length === 0
  function showHoursFallback(hours) {
    return !hours || Object.keys(hours).length === 0
  }

  it('shows fallback when hours is null', () => {
    expect(showHoursFallback(null)).toBe(true)
  })

  it('shows fallback when hours is undefined', () => {
    expect(showHoursFallback(undefined)).toBe(true)
  })

  it('shows fallback when hours is an empty object', () => {
    expect(showHoursFallback({})).toBe(true)
  })

  it('does not show fallback when hours has at least one day entry', () => {
    expect(showHoursFallback({ Mon: '9am–5pm' })).toBe(false)
  })

  it('does not show fallback when hours has multiple day entries', () => {
    expect(showHoursFallback({ Mon: { open: '09:00', close: '17:00' }, Tue: { closed: true } })).toBe(false)
  })
})

// ─── pricing null check (FieldDetailPage pricing fallback condition) ─────────

describe('pricing null check logic', () => {
  // Mirrors the condition in FieldDetailPage.jsx: !field.pricing
  // and the branch: field.owner_id ? tel link : /register link
  function showPricingFallback(pricing) {
    return !pricing
  }
  function pricingBranch(field) {
    if (field.owner_id) return field.phone ? 'tel' : 'nothing'
    return 'register'
  }

  it('shows fallback when pricing is null', () => {
    expect(showPricingFallback(null)).toBe(true)
  })

  it('shows fallback when pricing is undefined', () => {
    expect(showPricingFallback(undefined)).toBe(true)
  })

  it('shows fallback when pricing is empty string', () => {
    expect(showPricingFallback('')).toBe(true)
  })

  it('does not show fallback when pricing has a value', () => {
    expect(showPricingFallback('$25–$40')).toBe(false)
  })

  it('shows register link for unclaimed field (no owner_id)', () => {
    expect(pricingBranch({ owner_id: null, phone: null })).toBe('register')
  })

  it('shows tel link for claimed field with phone', () => {
    expect(pricingBranch({ owner_id: 'abc', phone: '555-1234' })).toBe('tel')
  })

  it('shows nothing for claimed field with no phone', () => {
    expect(pricingBranch({ owner_id: 'abc', phone: null })).toBe('nothing')
  })
})

// ─── getDistanceKm ──────────────────────────────────────────

describe('getDistanceKm', () => {
  it('returns ~0 for the same location', () => {
    expect(getDistanceKm(43.6532, -79.3832, 43.6532, -79.3832)).toBeCloseTo(0, 5)
  })

  it('returns a distance under 5km for nearby coordinates', () => {
    // ~0.5km north of the same point
    const distance = getDistanceKm(43.6532, -79.3832, 43.6577, -79.3832)
    expect(distance).toBeLessThan(5)
  })

  it('returns a distance over 5km for far-apart coordinates', () => {
    // Toronto vs Hamilton, ~60km apart
    const distance = getDistanceKm(43.6532, -79.3832, 43.2557, -79.8711)
    expect(distance).toBeGreaterThan(5)
  })
})

// ─── fieldMatchesFilter ───────────────────────────────────────

describe('fieldMatchesFilter', () => {
  const field = { field_types: ['Woodsball', 'Speedball'] }

  it('returns true when activeFilter is "All"', () => {
    expect(fieldMatchesFilter(field, 'All')).toBe(true)
  })

  it('returns true when activeFilter is null', () => {
    expect(fieldMatchesFilter(field, null)).toBe(true)
  })

  it('returns true when activeFilter is undefined', () => {
    expect(fieldMatchesFilter(field, undefined)).toBe(true)
  })

  it('returns true when field includes the active filter type', () => {
    expect(fieldMatchesFilter(field, 'Woodsball')).toBe(true)
  })

  it('returns true for a second matching type', () => {
    expect(fieldMatchesFilter(field, 'Speedball')).toBe(true)
  })

  it('returns false when field does not include the active filter type', () => {
    expect(fieldMatchesFilter(field, 'Airsoft')).toBe(false)
  })

  it('returns false when field has no matching types', () => {
    expect(fieldMatchesFilter({ field_types: ['Indoor'] }, 'Woodsball')).toBe(false)
  })

  it('returns true when field_types is null/undefined (no crash)', () => {
    expect(fieldMatchesFilter({ field_types: null }, 'All')).toBe(true)
  })

  it('returns false gracefully when field_types is null and a filter is active', () => {
    expect(fieldMatchesFilter({ field_types: null }, 'Woodsball')).toBe(false)
  })
})
