// Shared form validation utilities used across OwnerRegistration, EditListingPage,
// and auth pages. All functions return null on valid input, or an error string.

// ── Email ─────────────────────────────────────────────────────
export function validateEmail(value) {
  if (!value?.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.'
  return null
}

// ── Password ─────────────────────────────────────────────────
// Standard minimum: 8 characters.
export function validatePassword(value) {
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  if (value.length > 128) return 'Password must be 128 characters or fewer.'
  return null
}

// ── Phone (North American) ────────────────────────────────────
// Accepts: (416) 555-1234 · 416-555-1234 · 4165551234 · 1-416-555-1234 · +1 416 555 1234
// Strips all non-digits then checks for 10 digits or 11 starting with 1.
export function validatePhone(value) {
  if (!value?.trim()) return null // optional field
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11 && digits[0] !== '1') return 'Enter a valid North American phone number.'
  if (digits.length !== 10 && digits.length !== 11) return 'Enter a valid 10-digit North American phone number.'
  return null
}

// ── Pricing ───────────────────────────────────────────────────
// Accepts a number or a range: 30 · $30 · 30-55 · $30-55 · $30–$55 · 30.00
// Both ends of a range must be positive numbers; end must be >= start.
export function validatePricing(value) {
  if (!value?.trim()) return null // optional field
  const v = value.trim().replace(/\$/g, '').replace(/\s/g, '')
  const rangeMatch = v.match(/^(\d+(?:\.\d{1,2})?)[-–](\d+(?:\.\d{1,2})?)$/)
  if (rangeMatch) {
    const [, low, high] = rangeMatch
    if (parseFloat(high) < parseFloat(low)) return 'The upper price must be greater than the lower price.'
    return null
  }
  if (/^\d+(?:\.\d{1,2})?$/.test(v)) return null
  return 'Enter a price or range (e.g. 30 or 30–55).'
}

// ── Positive integer ──────────────────────────────────────────
// For fields like "number of fields" or "max capacity".
export function validatePositiveInt(value, label = 'This field') {
  if (!value && value !== 0) return null // optional field
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) return `${label} must be a whole number greater than 0.`
  return null
}

// ── Website URL ───────────────────────────────────────────────
export function validateWebsite(value) {
  if (!value?.trim()) return null // optional field
  const v = value.trim()
  // Allow bare domains (maskup.gg) or full URLs — must contain at least one dot
  if (!/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(v)) return 'Enter a valid website URL (e.g. maskup.gg).'
  return null
}
