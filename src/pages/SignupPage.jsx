import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { validateDisplayName } from '../lib/displayNameValidation'
import compactLockup from '../assets/logos/green/Compact Horizontal Lockup.svg'

function getPasswordStrength(pwd) {
  if (pwd.length === 0) return null
  if (pwd.length < 8) return 'weak'
  const types = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(pwd)).length
  if (types >= 3) return 'strong'
  if (types >= 2) return 'fair'
  return 'weak'
}

const STRENGTH_CONFIG = {
  weak:   { label: 'Weak',   color: 'bg-red-400',    width: 'w-1/3' },
  fair:   { label: 'Fair',   color: 'bg-yellow-400', width: 'w-2/3' },
  strong: { label: 'Strong', color: 'bg-brand',      width: 'w-full' },
}

export default function SignupPage() {
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [displayNameError, setDisplayNameError] = useState(null)
  const [nameCheckStatus, setNameCheckStatus] = useState('idle') // idle | checking | available | taken
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(password)

  function handleDisplayNameChange(e) {
    const val = e.target.value
    setDisplayName(val)
    setDisplayNameError(validateDisplayName(val))
    setNameCheckStatus('idle')
  }

  // Debounced availability check
  useEffect(() => {
    const trimmed = displayName.trim()
    if (!trimmed || displayNameError) {
      setNameCheckStatus('idle')
      return
    }
    setNameCheckStatus('checking')
    const timer = setTimeout(async () => {
      const { data: taken } = await supabase.rpc('is_display_name_taken', { name: trimmed })
      setNameCheckStatus(taken ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(timer)
  }, [displayName, displayNameError])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const nameErr = validateDisplayName(displayName)
    if (nameErr) {
      setDisplayNameError(nameErr)
      setLoading(false)
      return
    }

    if (displayName.trim()) {
      const { data: taken } = await supabase.rpc('is_display_name_taken', { name: displayName.trim() })
      if (taken) {
        setDisplayNameError('That display name is already taken.')
        setLoading(false)
        return
      }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim() || null,
          role: 'player',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Trigger creates the public.users row automatically.
    // onAuthStateChange in AuthProvider updates the session.
    navigate('/', { replace: true })
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F5F2EB] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-6 sm:p-8">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/">
            <img src={compactLockup} alt="MaskUp.gg" style={{ width: '160px' }} className="h-auto" />
          </Link>
        </div>

        {/* Heading */}
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Create your account</h1>
          <p className="text-sm text-gray-500 leading-relaxed">Join Ontario's paintball and airsoft community.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={handleDisplayNameChange}
                placeholder="Your name or handle"
                className={`w-full px-4 py-3 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors ${
                  displayNameError || nameCheckStatus === 'taken' ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {/* Availability indicator */}
              {nameCheckStatus === 'checking' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin block" />
                </span>
              )}
              {nameCheckStatus === 'available' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand text-base leading-none">✓</span>
              )}
              {nameCheckStatus === 'taken' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-base leading-none">✕</span>
              )}
            </div>
            {displayNameError && <p className="text-xs text-red-500 mt-1">{displayNameError}</p>}
            {!displayNameError && nameCheckStatus === 'taken' && (
              <p className="text-xs text-red-500 mt-1">That display name is already taken.</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ characters"
                required
                minLength={8}
                className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {/* Strength bar */}
            {strength && (
              <div className="mt-2">
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${STRENGTH_CONFIG[strength].color} ${STRENGTH_CONFIG[strength].width}`} />
                </div>
                <p className={`text-xs mt-1 font-medium ${strength === 'weak' ? 'text-red-400' : strength === 'fair' ? 'text-yellow-500' : 'text-brand'}`}>
                  {STRENGTH_CONFIG[strength].label}
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!displayNameError || nameCheckStatus === 'taken'}
            className="w-full h-11 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          {/* Terms */}
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-brand hover:underline">Terms of Use</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-brand hover:underline">Privacy Policy</Link>.
          </p>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Sign in link */}
        <p className="text-sm text-gray-500 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-medium hover:underline">Sign in</Link>
        </p>

      </div>
    </div>
  )
}
