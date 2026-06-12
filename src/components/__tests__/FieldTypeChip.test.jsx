import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FieldTypeChip from '../FieldTypeChip'

describe('FieldTypeChip', () => {
  it('renders the type label', () => {
    render(<FieldTypeChip type="Woodsball" />)
    expect(screen.getByText('Woodsball')).toBeInTheDocument()
  })

  it('applies Airsoft teal colour classes', () => {
    const { container } = render(<FieldTypeChip type="Airsoft" />)
    expect(container.firstChild).toHaveClass('bg-teal-100', 'text-teal-800')
  })

  it('applies Woodsball green colour classes', () => {
    const { container } = render(<FieldTypeChip type="Woodsball" />)
    expect(container.firstChild).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('falls back to gray classes for an unknown type', () => {
    const { container } = render(<FieldTypeChip type="Unknown" />)
    expect(container.firstChild).toHaveClass('bg-gray-100', 'text-gray-700')
  })
})
