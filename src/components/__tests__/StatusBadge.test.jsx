import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '../StatusBadge'

describe('StatusBadge', () => {
  it('renders "Open now" for open status', () => {
    render(<StatusBadge status="open" />)
    expect(screen.getByText('Open now')).toBeInTheDocument()
  })

  it('renders "Rain delay" for rain_delay status', () => {
    render(<StatusBadge status="rain_delay" />)
    expect(screen.getByText('Rain delay')).toBeInTheDocument()
  })

  it('renders "Closed" for closed status', () => {
    render(<StatusBadge status="closed" />)
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it('renders nothing for an unknown status', () => {
    const { container } = render(<StatusBadge status="unknown" />)
    expect(container).toBeEmptyDOMElement()
  })
})
