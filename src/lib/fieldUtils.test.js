import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatTime, formatDisplayDate, getTodayHours, normalizeEvent, normalizeField } from './fieldUtils'

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
    field_types: ['Woodball', 'Speedball', 'Woodball'],
    hours: { Mon: '9am–5pm' },
    events: [],
  }

  it('deduplicates field_types', () => {
    const result = normalizeField(base)
    expect(result.field_types).toEqual(['Woodball', 'Speedball'])
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
