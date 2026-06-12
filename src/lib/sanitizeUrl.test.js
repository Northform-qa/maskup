import { describe, it, expect } from 'vitest'
import { sanitizeUrl } from './sanitizeUrl'

describe('sanitizeUrl', () => {

  // ── Null / empty input ────────────────────────────────────
  it('returns null for null', () => {
    expect(sanitizeUrl(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(sanitizeUrl(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(sanitizeUrl('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(sanitizeUrl('   ')).toBeNull()
  })

  // ── Safe protocols — pass through unchanged ───────────────
  it('passes through an https URL unchanged', () => {
    expect(sanitizeUrl('https://maskup.gg')).toBe('https://maskup.gg')
  })

  it('passes through an http URL unchanged', () => {
    expect(sanitizeUrl('http://maskup.gg')).toBe('http://maskup.gg')
  })

  it('passes through HTTPS with path and query unchanged', () => {
    expect(sanitizeUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1')
  })

  it('is case-insensitive for the protocol', () => {
    expect(sanitizeUrl('HTTPS://maskup.gg')).toBe('HTTPS://maskup.gg')
    expect(sanitizeUrl('HTTP://maskup.gg')).toBe('HTTP://maskup.gg')
  })

  // ── No protocol — prepend https:// ────────────────────────
  it('prepends https:// when no protocol is present', () => {
    expect(sanitizeUrl('maskup.gg')).toBe('https://maskup.gg')
  })

  it('prepends https:// for a subdomain without protocol', () => {
    expect(sanitizeUrl('www.sgtsplatters.com')).toBe('https://www.sgtsplatters.com')
  })

  it('trims whitespace before prepending', () => {
    expect(sanitizeUrl('  maskup.gg  ')).toBe('https://maskup.gg')
  })

  // ── Dangerous protocols — reject ──────────────────────────
  it('returns null for javascript: URL', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
  })

  it('returns null for javascript: URL with mixed case', () => {
    expect(sanitizeUrl('JavaScript:alert(1)')).toBeNull()
  })

  it('returns null for data: URL', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('returns null for vbscript: URL', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull()
  })

  it('returns null for file: URL', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBeNull()
  })

  // ── Edge cases ────────────────────────────────────────────
  it('handles a URL with a port number', () => {
    expect(sanitizeUrl('https://localhost:3000')).toBe('https://localhost:3000')
  })

  it('handles a URL with a fragment', () => {
    expect(sanitizeUrl('https://maskup.gg#section')).toBe('https://maskup.gg#section')
  })
})
