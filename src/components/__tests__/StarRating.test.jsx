import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StarRating from '../StarRating'

describe('StarRating', () => {
  it('renders nothing when rating is null', () => {
    const { container } = render(<StarRating rating={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the rating value formatted to one decimal', () => {
    render(<StarRating rating={4.7} count={312} />)
    expect(screen.getByText('4.7')).toBeInTheDocument()
  })

  it('renders the review count', () => {
    render(<StarRating rating={4.7} count={312} />)
    expect(screen.getByText('(312)')).toBeInTheDocument()
  })

  it('does not render a count when count is null', () => {
    render(<StarRating rating={4.5} count={null} />)
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument()
  })
})
