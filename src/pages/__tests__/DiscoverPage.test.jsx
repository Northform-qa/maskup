import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import DiscoverPage from '../DiscoverPage'

const mockRawField = {
  id: 'field-1',
  name: 'Alpha Field',
  claimed: true,
  city: 'Toronto',
  province: 'ON',
  weather_status: 'open',
  listing_status: 'published',
  field_types: ['Woodsball'],
  num_fields: 3,
  typical_capacity: 60,
  pricing: '$30–50 per session',
  rentals_available: true,
  rental_pricing: 'Full kit',
  description: 'Test field.',
  active_players_now: null,
  crowd_report_count: 0,
  crowd_report_last_updated: null,
  rating: null,
  review_count: null,
  distance_km: null,
  walk_ins: false,
  hours: { Mon: '9am–5pm', Tue: 'Closed', Wed: 'Closed', Thu: 'Closed', Fri: 'Closed', Sat: '9am–5pm', Sun: '9am–5pm' },
  seasonal_start: null,
  seasonal_end: null,
  events: [],
}

function buildChain(resolvedValue) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DiscoverPage />
    </MemoryRouter>
  )
}

describe('DiscoverPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading state before the fetch resolves', () => {
    supabase.from.mockReturnValue(buildChain({ data: [mockRawField], error: null }))
    renderPage()
    expect(screen.getByText('Loading fields…')).toBeInTheDocument()
  })

  it('renders field cards after a successful fetch', async () => {
    supabase.from.mockReturnValue(buildChain({ data: [mockRawField], error: null }))
    renderPage()
    expect(await screen.findByText('Alpha Field')).toBeInTheDocument()
    expect(screen.getByText('Toronto, ON')).toBeInTheDocument()
  })

  it('shows error message when the fetch fails', async () => {
    supabase.from.mockReturnValue(buildChain({ data: null, error: { message: 'Connection failed' } }))
    renderPage()
    expect(await screen.findByText('Connection failed')).toBeInTheDocument()
  })

  it('shows empty state when no fields are returned', async () => {
    supabase.from.mockReturnValue(buildChain({ data: [], error: null }))
    renderPage()
    expect(await screen.findByText('No fields match this filter.')).toBeInTheDocument()
  })
})
