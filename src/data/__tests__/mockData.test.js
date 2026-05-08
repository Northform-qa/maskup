import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getActivePlayers } from '../mockData'

describe('getActivePlayers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-05T12:00:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns none when active_players_now is null', () => {
    const field = { active_players_now: null, crowd_report_count: 0, crowd_report_last_updated: null }
    const result = getActivePlayers(field)
    expect(result.type).toBe('none')
    expect(result.text).toBe('No reports yet today')
  })

  it('returns none when crowd_report_last_updated is null', () => {
    const field = { active_players_now: 42, crowd_report_count: 3, crowd_report_last_updated: null }
    const result = getActivePlayers(field)
    expect(result.type).toBe('none')
  })

  it('returns stale when report is older than 2 hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const field = { active_players_now: 42, crowd_report_count: 3, crowd_report_last_updated: threeHoursAgo }
    const result = getActivePlayers(field)
    expect(result.type).toBe('stale')
    expect(result.text).toContain('3h ago')
  })

  it('returns fresh with player count when report is recent', () => {
    const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString()
    const field = { active_players_now: 42, crowd_report_count: 5, crowd_report_last_updated: fortyFiveMinutesAgo }
    const result = getActivePlayers(field)
    expect(result.type).toBe('fresh')
    expect(result.count).toBe(42)
    expect(result.text).toContain('~42')
    expect(result.text).toContain('5 reports')
    expect(result.text).toContain('45m ago')
  })
})
