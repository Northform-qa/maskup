import { Filter } from 'bad-words'

const profanityFilter = new Filter()

const BLOCKED_NAMES = ['admin', 'moderator', 'maskup', 'support', 'staff', 'official']

export function validateDisplayName(value) {
  const v = value.trim()

  if (v.length === 0) return null // optional field — blank is fine

  if (v.length < 3) return 'Display name must be at least 3 characters.'
  if (v.length > 30) return 'Display name must be 30 characters or fewer.'
  if (!/^[a-zA-Z0-9_-]+$/.test(v)) return 'Only letters, numbers, underscores, and hyphens are allowed.'
  if (/^\d+$/.test(v)) return 'Display name cannot be numbers only.'

  const lower = v.toLowerCase()
  if (BLOCKED_NAMES.some((b) => lower.includes(b))) {
    return 'This display name isn\'t allowed. Please choose something appropriate.'
  }

  // Replace underscores and hyphens with spaces so "shit_player" is caught
  if (profanityFilter.isProfane(v.replace(/[_-]/g, ' '))) {
    return 'This display name isn\'t allowed. Please choose something appropriate.'
  }

  return null // valid
}
