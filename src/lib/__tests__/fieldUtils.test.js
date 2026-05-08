import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatTime,
  formatDisplayDate,
  getTodayHours,
  normalizeEvent,
  normalizeField,
} from '../fieldUtils'

// ── formatTime ──────────────────────────────────────────────────
describe('formatTime', () => {
  it('formats a whole hour in the morning', () => {
    expect(formatTime('10:00:00')).toBe('10am')
  })
  it('formats a time with minutes', () => {
    expect(formatTime('10:30:00')).toBe('10:30am')
  })
  it('formats noon correctly', () => {
    expect(formatTime('12:00')).toBe('12pm')
  })
  it('formats midnight as 12am', () => {
    expect(formatTime('00:00')).toBe('12am')
  })
  it('converts 13:00 to 1pm', () => {
    expect(formatTime('13:00')).toBe('1pm')
  })
  it('returns null for null input', () => {
    expect(formatTime(null)).toBeNull()
  })
  it('returns null for empty string', () => {
    expect(formatTime('')).toBeNull()
  })
})

// ── formatDisplayDate ────────────────────────────────────────────
describe('formatDisplayDate', () => {
  it('returns empty string for empty input', () => {
    expect(formatDisplayDate('')).toBe('')
  })
  it('returns empty string for null input', () => {
    expect(formatDisplayDate(null)).toBe('')
  })
  it('includes the month and day number for a valid date', () => {
    const result = formatDisplayDate('2026-06-14')
    expect(result).toContain('Jun')
    expect(result).toContain('14')
  })
})

// ── getTodayHours (Monday = Jan 5 2026) ─────────────────────────
describe('getTodayHours', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-05T12:00:00')) // Monday
  })
  afterEach(() => vi.useRealTimers())

  it('returns null for null hours object', () => {
    expect(getTodayHours(null)).toBeNull()
  })
  it('returns null for undefined hours object', () => {
    expect(getTodayHours(undefined)).toBeNull()
  })
  it('returns null when today is not in the hours object', () => {
    expect(getTodayHours({ Tue: '9am–5pm' })).toBeNull()
  })
  it('returns the string value for an open day (string format)', () => {
    expect(getTodayHours({ Mon: '9am–5pm' })).toBe('9am–5pm')
  })
  it('returns null for "Closed" string (string format)', () => {
    expect(getTodayHours({ Mon: 'Closed' })).toBeNull()
  })
  it('returns formatted string for object format {open, close}', () => {
    expect(getTodayHours({ Mon: { open: '09:00', close: '17:00' } })).toBe('9am–5pm')
  })
  it('returns null for object format {closed: true}', () => {
    expect(getTodayHours({ Mon: { closed: true } })).toBeNull()
  })
})

// ── normalizeEvent ───────────────────────────────────────────────
describe('normalizeEvent', () => {
  it('formats start_time and end_time from Supabase time strings', () => {
    const event = {
      id: 'e1',
      date: '2026-06-14',
      start_time: '10:00:00',
      end_time: '16:00:00',
      title: 'Test Event',
    }
    const result = normalizeEvent(event)
    expect(result.start_time).toBe('10am')
    expect(result.end_time).toBe('4pm')
  })
  it('generates a display_date containing the month and day', () => {
    const event = { id: 'e1', date: '2026-06-14', start_time: '09:00:00', end_time: null }
    const result = normalizeEvent(event)
    expect(result.display_date).toContain('Jun')
    expect(result.display_date).toContain('14')
  })
  it('handles null end_time without throwing', () => {
    const event = { date: '2026-06-14', start_time: '09:00:00', end_time: null }
    const result = normalizeEvent(event)
    expect(result.end_time).toBeNull()
  })
})

// ── normalizeField ───────────────────────────────────────────────
describe('normalizeField', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-05T12:00:00')) // Monday
  })
  afterEach(() => vi.useRealTimers())

  it('derives today_hours from the hours object', () => {
    const raw = { hours: { Mon: '9am–5pm', Tue: 'Closed' }, events: [] }
    expect(normalizeField(raw).today_hours).toBe('9am–5pm')
  })
  it('derives today_hours using object format {open, close}', () => {
    const raw = { hours: { Mon: { open: '09:00', close: '17:00' } }, events: [] }
    expect(normalizeField(raw).today_hours).toBe('9am–5pm')
  })
  it('sorts events by date ascending', () => {
    const raw = {
      hours: {},
      events: [
        { id: '2', date: '2026-07-01', start_time: '10:00:00', end_time: '16:00:00' },
        { id: '1', date: '2026-06-14', start_time: '09:00:00', end_time: '17:00:00' },
      ],
    }
    const result = normalizeField(raw)
    expect(result.events[0].id).toBe('1')
    expect(result.events[1].id).toBe('2')
  })
  it('handles null events gracefully', () => {
    const raw = { hours: {}, events: null }
    expect(normalizeField(raw).events).toEqual([])
  })
})
