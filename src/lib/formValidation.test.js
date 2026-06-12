import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, validatePhone, validatePricing, validatePositiveInt, validateWebsite } from './formValidation'

// ── validateEmail ─────────────────────────────────────────────

describe('validateEmail', () => {
  it('returns null for a valid email', () => {
    expect(validateEmail('player@maskup.gg')).toBeNull()
  })

  it('returns error for empty string', () => {
    expect(validateEmail('')).toBeTruthy()
  })

  it('returns error for null', () => {
    expect(validateEmail(null)).toBeTruthy()
  })

  it('returns error for missing @', () => {
    expect(validateEmail('notanemail.com')).toBeTruthy()
  })

  it('returns error for missing domain', () => {
    expect(validateEmail('user@')).toBeTruthy()
  })

  it('accepts email with subdomains', () => {
    expect(validateEmail('user@mail.maskup.gg')).toBeNull()
  })

  it('trims whitespace before validating', () => {
    expect(validateEmail('  player@maskup.gg  ')).toBeNull()
  })
})

// ── validatePassword ──────────────────────────────────────────

describe('validatePassword', () => {
  it('returns null for a valid 8-char password', () => {
    expect(validatePassword('password')).toBeNull()
  })

  it('returns null for a strong password', () => {
    expect(validatePassword('Tr0ub4dor&3')).toBeNull()
  })

  it('returns error for null', () => {
    expect(validatePassword(null)).toBeTruthy()
  })

  it('returns error for fewer than 8 characters', () => {
    expect(validatePassword('short')).toBeTruthy()
  })

  it('returns error for exactly 7 characters', () => {
    expect(validatePassword('1234567')).toBeTruthy()
  })

  it('returns null for exactly 8 characters', () => {
    expect(validatePassword('12345678')).toBeNull()
  })

  it('returns error for password over 128 characters', () => {
    expect(validatePassword('a'.repeat(129))).toBeTruthy()
  })

  it('returns null for exactly 128 characters', () => {
    expect(validatePassword('a'.repeat(128))).toBeNull()
  })
})

// ── validatePhone ─────────────────────────────────────────────

describe('validatePhone', () => {
  it('returns null for empty (optional field)', () => {
    expect(validatePhone('')).toBeNull()
    expect(validatePhone(null)).toBeNull()
  })

  it('accepts 10 raw digits', () => {
    expect(validatePhone('4165551234')).toBeNull()
  })

  it('accepts formatted (416) 555-1234', () => {
    expect(validatePhone('(416) 555-1234')).toBeNull()
  })

  it('accepts dashes 416-555-1234', () => {
    expect(validatePhone('416-555-1234')).toBeNull()
  })

  it('accepts 11 digits starting with 1', () => {
    expect(validatePhone('14165551234')).toBeNull()
  })

  it('accepts 1-416-555-1234', () => {
    expect(validatePhone('1-416-555-1234')).toBeNull()
  })

  it('rejects 11 digits not starting with 1', () => {
    expect(validatePhone('24165551234')).toBeTruthy()
  })

  it('rejects 9 digits', () => {
    expect(validatePhone('416555123')).toBeTruthy()
  })

  it('rejects 12 digits', () => {
    expect(validatePhone('416555123456')).toBeTruthy()
  })

  it('rejects a non-phone string', () => {
    expect(validatePhone('not-a-phone')).toBeTruthy()
  })
})

// ── validatePricing ───────────────────────────────────────────

describe('validatePricing', () => {
  it('returns null for empty (optional field)', () => {
    expect(validatePricing('')).toBeNull()
    expect(validatePricing(null)).toBeNull()
  })

  it('accepts a plain number', () => {
    expect(validatePricing('30')).toBeNull()
  })

  it('accepts a dollar-prefixed number', () => {
    expect(validatePricing('$30')).toBeNull()
  })

  it('accepts a range with hyphen', () => {
    expect(validatePricing('30-55')).toBeNull()
  })

  it('accepts a range with em dash', () => {
    expect(validatePricing('30–55')).toBeNull()
  })

  it('accepts a range with dollar signs', () => {
    expect(validatePricing('$30–$55')).toBeNull()
  })

  it('accepts a decimal price', () => {
    expect(validatePricing('29.99')).toBeNull()
  })

  it('rejects a range where high is less than low', () => {
    expect(validatePricing('55-30')).toBeTruthy()
  })

  it('rejects free text', () => {
    expect(validatePricing('call for pricing')).toBeTruthy()
  })

  it('rejects letters mixed in', () => {
    expect(validatePricing('$30pp')).toBeTruthy()
  })
})

// ── validatePositiveInt ───────────────────────────────────────

describe('validatePositiveInt', () => {
  it('returns null for empty (optional field)', () => {
    expect(validatePositiveInt(null)).toBeNull()
    expect(validatePositiveInt('')).toBeNull()
  })

  it('accepts a valid positive integer', () => {
    expect(validatePositiveInt(5)).toBeNull()
  })

  it('accepts the string "10"', () => {
    expect(validatePositiveInt('10')).toBeNull()
  })

  it('rejects 0', () => {
    expect(validatePositiveInt(0)).toBeTruthy()
  })

  it('rejects negative numbers', () => {
    expect(validatePositiveInt(-1)).toBeTruthy()
  })

  it('rejects decimals', () => {
    expect(validatePositiveInt(3.5)).toBeTruthy()
  })

  it('rejects non-numeric strings', () => {
    expect(validatePositiveInt('abc')).toBeTruthy()
  })
})

// ── validateWebsite ───────────────────────────────────────────

describe('validateWebsite', () => {
  it('returns null for empty (optional field)', () => {
    expect(validateWebsite('')).toBeNull()
    expect(validateWebsite(null)).toBeNull()
  })

  it('accepts a bare domain', () => {
    expect(validateWebsite('maskup.gg')).toBeNull()
  })

  it('accepts https URL', () => {
    expect(validateWebsite('https://maskup.gg')).toBeNull()
  })

  it('accepts http URL', () => {
    expect(validateWebsite('http://www.sgtsplatters.com')).toBeNull()
  })

  it('rejects a string with no dot', () => {
    expect(validateWebsite('notawebsite')).toBeTruthy()
  })

  it('rejects a plain word', () => {
    expect(validateWebsite('justtext')).toBeTruthy()
  })
})
