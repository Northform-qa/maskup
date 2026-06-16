import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActivePlayers from '../ActivePlayers'

describe('ActivePlayers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-05T12:00:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('shows "No check-ins yet today" when no data exists', () => {
    const field = { active_players_now: null, crowd_report_count: 0, crowd_report_last_updated: null }
    render(<ActivePlayers field={field} />)
    expect(screen.getByText('No check-ins yet today')).toBeInTheDocument()
  })

  it('shows stale indicator when last report is older than 2 hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const field = { active_players_now: 20, crowd_report_count: 2, crowd_report_last_updated: threeHoursAgo }
    render(<ActivePlayers field={field} />)
    expect(screen.getByText(/Last check-in reported/)).toBeInTheDocument()
  })

  it('shows live player count for a fresh report', () => {
    const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString()
    const field = { active_players_now: 42, crowd_report_count: 5, crowd_report_last_updated: fortyFiveMinutesAgo }
    render(<ActivePlayers field={field} />)
    expect(screen.getByText(/~42 players/)).toBeInTheDocument()
  })
})
