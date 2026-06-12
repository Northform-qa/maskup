/**
 * Sanitizes a user-supplied URL so it is safe to use in an href attribute.
 *
 * Rules:
 * - Returns null for null / empty / whitespace-only input
 * - Passes through http:// and https:// URLs unchanged
 * - Prepends https:// when no protocol is present (e.g. "maskup.gg")
 * - Returns null for any other protocol (javascript:, data:, vbscript:, etc.)
 */
export function sanitizeUrl(url) {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // Already a safe protocol
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  // No protocol detected — safe to prepend https://
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(trimmed)) return `https://${trimmed}`

  // Any other explicit protocol (javascript:, data:, vbscript:, …) — reject
  return null
}
