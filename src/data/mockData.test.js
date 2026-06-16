import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getActivePlayers } from './mockData'

const NOW = new Date('2026-06-15T12:00:00').getTime()

beforeEach(() => vi.setSystemTime(NOW))
afterEach(() => vi.useRealTimers())

describe('getActivePlayers', () => {
  it('returns none when active_players_now is null', () => {
    const result = getActivePlayers({
      active_players_now: null,
      crowd_report_count: 0,
      crowd_report_last_updated: null,
    })
    expect(result.type).toBe('none')
    expect(result.text).toBe('No check-ins yet today')
  })

  it('returns none when active_players_now is set but last_updated is null', () => {
    const result = getActivePlayers({
      active_players_now: 30,
      crowd_report_count: 2,
      crowd_report_last_updated: null,
    })
    expect(result.type).toBe('none')
  })

  it('returns fresh when last updated less than 2 hours ago', () => {
    const fortyFiveMinsAgo = new Date(NOW - 45 * 60 * 1000).toISOString()
    const result = getActivePlayers({
      active_players_now: 43,
      crowd_report_count: 7,
      crowd_report_last_updated: fortyFiveMinsAgo,
    })
    expect(result.type).toBe('fresh')
    expect(result.count).toBe(43)
    expect(result.text).toContain('~43 players checked in today')
    expect(result.text).toContain('45 min ago')
  })

  it('returns stale when last updated 2 or more hours ago', () => {
    const threeHoursAgo = new Date(NOW - 3 * 60 * 60 * 1000).toISOString()
    const result = getActivePlayers({
      active_players_now: 22,
      crowd_report_count: 3,
      crowd_report_last_updated: threeHoursAgo,
    })
    expect(result.type).toBe('stale')
    expect(result.text).toBe('Last check-in reported 3h ago')
  })

  it('returns stale exactly at the 2 hour boundary', () => {
    const exactlyTwoHoursAgo = new Date(NOW - 2 * 60 * 60 * 1000).toISOString()
    const result = getActivePlayers({
      active_players_now: 10,
      crowd_report_count: 1,
      crowd_report_last_updated: exactlyTwoHoursAgo,
    })
    expect(result.type).toBe('stale')
  })
})
