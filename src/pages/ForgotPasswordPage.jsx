import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import compactLockup from '../assets/logos/green/Compact Horizontal Lockup.svg'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.maskup.gg/reset-password',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-8 sm:p-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={compactLockup} alt="MaskUp.gg" style={{ width: '180px' }} className="h-auto" />
          </Link>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-1">
              We've sent a reset link to
            </p>
            <p className="text-sm font-semibold text-gray-800 mb-6">{email}</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Didn't get it? Check your spam folder or{' '}
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-brand font-medium hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                Enter your email address and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-brand font-medium hover:underline">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
