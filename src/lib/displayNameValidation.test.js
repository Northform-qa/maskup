import { describe, it, expect } from 'vitest'
import { validateDisplayName } from './displayNameValidation'

describe('validateDisplayName', () => {

  // ── Happy path ────────────────────────────────────────────
  it('returns null for a valid display name', () => {
    expect(validateDisplayName('Player1')).toBeNull()
  })

  it('returns null for a name with underscores and hyphens', () => {
    expect(validateDisplayName('cool_player-99')).toBeNull()
  })

  it('returns null for an empty string (field is optional)', () => {
    expect(validateDisplayName('')).toBeNull()
  })

  it('returns null for a name with only whitespace (treated as empty)', () => {
    expect(validateDisplayName('   ')).toBeNull()
  })

  it('returns null for a name exactly 3 characters', () => {
    expect(validateDisplayName('abc')).toBeNull()
  })

  it('returns null for a name exactly 30 characters', () => {
    expect(validateDisplayName('a'.repeat(30))).toBeNull()
  })

  // ── Rule 1: minimum 3 characters ─────────────────────────
  it('rejects a name shorter than 3 characters', () => {
    expect(validateDisplayName('ab')).toMatch(/at least 3/)
  })

  it('rejects a single character name', () => {
    expect(validateDisplayName('a')).toMatch(/at least 3/)
  })

  // ── Rule 2: maximum 30 characters ────────────────────────
  it('rejects a name longer than 30 characters', () => {
    expect(validateDisplayName('a'.repeat(31))).toMatch(/30 characters/)
  })

  // ── Rule 3: only letters, numbers, underscores, hyphens ──
  it('rejects a name with spaces', () => {
    expect(validateDisplayName('cool player')).toMatch(/underscores/)
  })

  it('rejects a name with special characters', () => {
    expect(validateDisplayName('player!')).toMatch(/underscores/)
  })

  it('rejects a name with an @ symbol', () => {
    expect(validateDisplayName('player@field')).toMatch(/underscores/)
  })

  it('rejects a name with a period', () => {
    expect(validateDisplayName('player.name')).toMatch(/underscores/)
  })

  // ── Rule 4: cannot be only numbers ───────────────────────
  it('rejects a name that is only numbers', () => {
    expect(validateDisplayName('12345')).toMatch(/numbers only/)
  })

  it('rejects a name that is only a single number', () => {
    expect(validateDisplayName('123')).toMatch(/numbers only/)
  })

  it('accepts a name that starts with numbers but has letters', () => {
    expect(validateDisplayName('99player')).toBeNull()
  })

  // ── Rule 5: reserved words ────────────────────────────────
  it('rejects "admin"', () => {
    expect(validateDisplayName('admin')).toBeTruthy()
  })

  it('rejects "moderator"', () => {
    expect(validateDisplayName('moderator')).toBeTruthy()
  })

  it('rejects "maskup"', () => {
    expect(validateDisplayName('maskup')).toBeTruthy()
  })

  it('rejects "support"', () => {
    expect(validateDisplayName('support')).toBeTruthy()
  })

  it('rejects "staff"', () => {
    expect(validateDisplayName('staff')).toBeTruthy()
  })

  it('rejects "official"', () => {
    expect(validateDisplayName('official')).toBeTruthy()
  })

  it('rejects a name containing a reserved word (case-insensitive)', () => {
    expect(validateDisplayName('ADMIN_user')).toBeTruthy()
  })

  it('rejects a name containing a reserved word mixed into a longer name', () => {
    expect(validateDisplayName('superstaff99')).toBeTruthy()
  })

  // ── Rule 6: profanity filter ──────────────────────────────
  it('rejects a name containing profanity joined by underscore', () => {
    expect(validateDisplayName('shit_player')).toBeTruthy()
  })

  it('rejects a name containing profanity joined by hyphen', () => {
    expect(validateDisplayName('shit-player')).toBeTruthy()
  })

  it('rejects a name that is a profane word', () => {
    expect(validateDisplayName('asshole')).toBeTruthy()
  })

  // ── Edge cases ────────────────────────────────────────────
  it('trims leading and trailing whitespace before validating', () => {
    expect(validateDisplayName('  Player1  ')).toBeNull()
  })

  it('accepts a mix of uppercase and lowercase letters', () => {
    expect(validateDisplayName('CoolPlayer')).toBeNull()
  })

  it('accepts a name with a leading hyphen (valid chars)', () => {
    expect(validateDisplayName('-player')).toBeNull()
  })
})
