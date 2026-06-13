import { describe, it, expect } from 'vitest'
import { getHeroState } from '../heroPhotoState'

const claimed   = { owner_id: 'abc' }
const unclaimed = { owner_id: null }

describe('getHeroState', () => {
  it('returns D when field is null', () => {
    expect(getHeroState(null, null)).toBe('D')
  })

  it('returns D when field is undefined', () => {
    expect(getHeroState(undefined, null)).toBe('D')
  })

  it('returns C for a claimed field regardless of viewer', () => {
    expect(getHeroState(claimed, null)).toBe('C')
    expect(getHeroState(claimed, { role: 'player' })).toBe('C')
    expect(getHeroState(claimed, { role: 'owner' })).toBe('C')
    expect(getHeroState(claimed, { role: 'admin' })).toBe('C')
  })

  it('returns A for unclaimed field with no viewer', () => {
    expect(getHeroState(unclaimed, null)).toBe('A')
  })

  it('returns A for unclaimed field with a player viewer', () => {
    expect(getHeroState(unclaimed, { role: 'player' })).toBe('A')
  })

  it('returns B for unclaimed field with an owner viewer', () => {
    expect(getHeroState(unclaimed, { role: 'owner' })).toBe('B')
  })

  it('returns B for unclaimed field with an admin viewer', () => {
    expect(getHeroState(unclaimed, { role: 'admin' })).toBe('B')
  })
})
