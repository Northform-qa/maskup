import leoProfanity from 'leo-profanity'

const BLOCKED_NAMES = ['admin', 'moderator', 'maskup', 'support', 'staff', 'official']

// leo-profanity ships with a comprehensive dictionary including slurs —
// the word list lives in node_modules, never in this repo.
leoProfanity.loadDictionary()

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

  // Check three forms: original, spaces-substituted (catches shit_player),
  // and fully stripped (catches n_i_g_g_e_r style evasion)
  const withSpaces = v.replace(/[_-]/g, ' ')
  const stripped = v.replace(/[_-]/g, '')
  if (leoProfanity.check(v) || leoProfanity.check(withSpaces) || leoProfanity.check(stripped)) {
    return 'This display name isn\'t allowed. Please choose something appropriate.'
  }

  return null // valid
}
