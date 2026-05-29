import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import FieldDetailPage from '../FieldDetailPage'

const mockRawField = {
  id: 'field-1',
  name: 'Alpha Field',
  claimed: true,
  city: 'Toronto',
  province: 'ON',
  weather_status: 'open',
  field_types: ['Woodball', 'Speedball'],
  num_fields: 4,
  typical_capacity: 80,
  pricing: '$35–60 per session',
  rentals_available: true,
  rental_pricing: 'Full kit included.',
  description: 'A great outdoor paintball field.',
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
  const chain = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(resolvedValue)
  chain.maybeSingle = vi.fn().mockResolvedValue(resolvedValue)
  // Makes `await chain` work for queries that don't use a terminator method (e.g. count queries)
  chain.then = (resolve, reject) =>
    Promise.resolve({ data: null, error: null, count: 0 }).then(resolve, reject)
  return chain
}

function renderWithRoute(id = 'field-1') {
  return render(
    <MemoryRouter initialEntries={[`/field/${id}`]}>
      <Routes>
        <Route path="/field/:id" element={<FieldDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('FieldDetailPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading state before the fetch resolves', () => {
    supabase.from.mockReturnValue(buildChain({ data: mockRawField, error: null }))
    renderWithRoute()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders the field name after a successful fetch', async () => {
    supabase.from.mockReturnValue(buildChain({ data: mockRawField, error: null }))
    renderWithRoute()
    expect(await screen.findByText('Alpha Field')).toBeInTheDocument()
  })

  it('renders the field description', async () => {
    supabase.from.mockReturnValue(buildChain({ data: mockRawField, error: null }))
    renderWithRoute()
    expect(await screen.findByText('A great outdoor paintball field.')).toBeInTheDocument()
  })

  it('shows error message when the fetch fails', async () => {
    supabase.from.mockReturnValue(buildChain({ data: null, error: { message: 'Not found' } }))
    renderWithRoute()
    expect(await screen.findByText('Not found')).toBeInTheDocument()
  })
})
