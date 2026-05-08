import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SignupPage() {
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (displayName.trim()) {
      const { data: taken } = await supabase.rpc('is_display_name_taken', { name: displayName.trim() })
      if (taken) {
        setError('That display name is already taken.')
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
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="w-5 h-5 rounded-full bg-brand inline-block" />
            <span className="font-bold text-brand tracking-tight text-lg">Maskup</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Join Maskup</h1>
          <p className="text-sm text-gray-500 mt-1">Find fields and track the action</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name or handle"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ characters"
                required
                minLength={8}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Field owner?{' '}
          <Link to="/register" className="text-brand hover:underline">
            Register your field instead
          </Link>
        </p>
      </div>
    </div>
  )
}
