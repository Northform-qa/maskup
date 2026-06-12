import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { validateDisplayName } from '../lib/displayNameValidation'
import StatusBadge from '../components/StatusBadge'
import shieldIcon from '../assets/logos/green/Shield Icon Only.svg'

function initials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

// ── Shared card wrapper ───────────────────────────────────────
function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

// ── State A — Not logged in ───────────────────────────────────
function StateNotLoggedIn() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <Card className="p-8 sm:p-10 text-center">
          <img src={shieldIcon} alt="" className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Your MaskUp profile</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Sign in to track your favourite fields, RSVP to walk-on days and submit crowd reports.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full h-11 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="block w-full h-11 border-2 border-brand text-brand text-sm font-bold rounded-lg hover:bg-brand/5 transition-colors flex items-center justify-center"
            >
              Create Account
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-6">Ontario's paintball &amp; airsoft community</p>
        </Card>
      </div>
    </div>
  )
}

// ── State E — Email not confirmed ─────────────────────────────
function StateEmailUnconfirmed({ user, signOut }) {
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  async function handleResend() {
    await supabase.auth.resend({ type: 'signup', email: user.email })
    setResent(true)
    setCooldown(60)
  }

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const name = user.user_metadata?.display_name
  const avatarLabel = initials(name ?? user.email)

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-4">
        <Card className="p-6 sm:p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-5">
            <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white text-xl font-bold mb-3">
              {avatarLabel}
            </div>
            {name && <p className="text-base font-bold text-gray-900">{name}</p>}
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-amber-800 mb-1">Please confirm your email</p>
            <p className="text-sm text-amber-700 leading-relaxed">
              We sent a confirmation link to <span className="font-semibold">{user.email}</span>. Check your inbox and click the link to activate your account.
            </p>
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className="mt-3 w-full h-9 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60"
            >
              {resent && cooldown > 0
                ? `Email resent — resend again in ${cooldown}s`
                : 'Resend confirmation email'}
            </button>
            <p className="text-xs text-amber-600 mt-2 text-center">
              Wrong email address?{' '}
              <a href="mailto:support@maskup.gg" className="underline hover:text-amber-800">
                Contact support@maskup.gg
              </a>
            </p>
          </div>

          <p className="text-xs text-gray-400 text-center mb-5">
            Some features are unavailable until your email is confirmed.
          </p>

          <button
            onClick={signOut}
            className="w-full h-10 border border-red-200 text-red-500 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </Card>
      </div>
    </div>
  )
}

// ── Display name inline editor ────────────────────────────────
function DisplayNameEditor({ userId, currentName, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentName ?? '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    const err = validateDisplayName(value)
    if (err) { setError(err); return }

    const { data: taken } = await supabase.rpc('is_display_name_taken', { name: value.trim() })
    if (taken) { setError('That display name is already taken.'); return }

    setSaving(true)
    const { error: updateErr } = await supabase
      .from('users')
      .update({ display_name: value.trim() })
      .eq('id', userId)
    setSaving(false)

    if (updateErr) { setError(updateErr.message); return }
    setSaved(true)
    setEditing(false)
    onSaved(value.trim())
    setTimeout(() => setSaved(false), 3000)
  }

  function handleCancel() {
    setValue(currentName ?? '')
    setError(null)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Display name</p>
          <p className="text-sm font-medium text-gray-800">{currentName || <span className="text-gray-400">Not set</span>}</p>
          {saved && <p className="text-xs text-brand mt-0.5">Saved ✓</p>}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-gray-400 hover:text-brand transition-colors p-1"
          aria-label="Edit display name"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1.5">Display name</p>
      <input
        type="text"
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(null) }}
        autoFocus
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ${error ? 'border-red-400' : 'border-gray-300'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-8 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 h-8 border border-gray-300 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── State B — Player ──────────────────────────────────────────
function StatePlayer({ user, profile, signOut, extraTopContent = null }) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [rsvpCount, setRsvpCount] = useState(0)
  const [todayRsvp, setTodayRsvp] = useState(null)
  const [pwResetSent, setPwResetSent] = useState(false)
  const TODAY = new Date().toISOString().split('T')[0]
  const MONTH_START = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const [{ count }, { data: rsvp }] = await Promise.all([
        supabase
          .from('going_today')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('date', MONTH_START),
        supabase
          .from('going_today')
          .select('field_id, fields(name)')
          .eq('user_id', user.id)
          .eq('date', TODAY)
          .maybeSingle(),
      ])
      setRsvpCount(count ?? 0)
      setTodayRsvp(rsvp)
    }
    load()
  }, [user.id, TODAY, MONTH_START])

  async function handlePasswordReset() {
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: 'https://www.maskup.gg/reset-password',
    })
    setPwResetSent(true)
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-y-auto bg-[#F5F2EB] px-4 py-10">
      <div className="w-full max-w-lg mx-auto space-y-4">

        {extraTopContent}

        {/* Avatar + name */}
        <div className="text-center mb-2">
          <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            {initials(displayName || user.email)}
          </div>
          <p className="text-xl font-bold text-gray-900">{displayName || 'Player'}</p>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'RSVPs this month', value: rsvpCount },
            { label: 'Crowd reports', value: 0 },
          ].map((s) => (
            <Card key={s.label} className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Going today */}
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">I'm Going Today</p>
          {todayRsvp ? (
            <p className="text-sm font-semibold text-brand">
              {todayRsvp.fields?.name} — You're going today ✓
            </p>
          ) : (
            <p className="text-sm text-gray-400">You haven't RSVPd to any field today.</p>
          )}
        </Card>

        {/* Settings */}
        <Card className="divide-y divide-gray-100">
          <div className="p-4">
            <DisplayNameEditor
              userId={user.id}
              currentName={displayName}
              onSaved={setDisplayName}
            />
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1.5">Password</p>
            {pwResetSent ? (
              <p className="text-sm text-brand">We've sent a password reset link to {user.email}</p>
            ) : (
              <button
                onClick={handlePasswordReset}
                className="text-sm text-brand font-medium hover:underline"
              >
                Change password
              </button>
            )}
          </div>
          <div className="p-4">
            <button
              onClick={signOut}
              className="w-full h-10 border border-red-200 text-red-500 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </Card>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 pt-2 pb-20 md:pb-4">
          <Link to="/privacy" className="text-xs text-gray-400 hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="text-xs text-gray-400 hover:underline">Terms of Use</Link>
        </div>

      </div>
    </div>
  )
}

// ── State C — Owner ───────────────────────────────────────────
function StateOwner({ user, profile, signOut }) {
  const [field, setField] = useState(null)
  const [fieldLoading, setFieldLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('fields')
        .select('id, name, listing_status, rejection_reason')
        .eq('owner_id', user.id)
        .maybeSingle()
      setField(data)
      setFieldLoading(false)
    }
    load()
  }, [user.id])

  const ownerCard = !fieldLoading && field ? (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand text-white">Field Owner</span>
        <p className="text-sm font-bold text-gray-900 truncate">{field.name}</p>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <StatusBadge status={
          field.listing_status === 'published' ? 'open'
          : field.listing_status === 'pending' ? 'rain_delay'
          : 'closed'
        } />
        <p className="text-sm text-gray-600">
          {field.listing_status === 'published' && 'Your field is live and visible to players.'}
          {field.listing_status === 'pending' && 'Your listing is under review. Our team will be in touch within 48 hours.'}
          {field.listing_status === 'rejected' && 'Your listing was not approved.'}
        </p>
      </div>
      {field.listing_status === 'rejected' && field.rejection_reason && (
        <p className="text-xs text-red-500 mb-2">{field.rejection_reason}</p>
      )}
      {field.listing_status === 'published' ? (
        <Link
          to="/owner-dashboard"
          className="mt-2 block w-full h-10 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center"
        >
          Go to Owner Dashboard
        </Link>
      ) : (
        <div className="flex items-center gap-3 mt-2">
          {field.listing_status === 'rejected' && (
            <Link to="/register" className="text-sm text-brand font-medium hover:underline">Edit listing</Link>
          )}
          <a href="mailto:support@maskup.gg" className="text-sm text-gray-500 hover:underline">Contact support</a>
        </div>
      )}
    </Card>
  ) : null

  return <StatePlayer user={user} profile={profile} signOut={signOut} extraTopContent={ownerCard} />
}

// ── State D — Admin ───────────────────────────────────────────
function StateAdmin({ user, profile, signOut }) {
  const adminCard = (
    <Card className="p-4 text-center">
      <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-brand text-white mb-3">Admin</span>
      <Link
        to="/admin"
        className="block w-full h-10 bg-brand text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center"
      >
        Go to Admin Dashboard
      </Link>
    </Card>
  )

  return <StatePlayer user={user} profile={profile} signOut={signOut} extraTopContent={adminCard} />
}

// ── Root component ────────────────────────────────────────────
export default function PlayerProfilePage() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <StateNotLoggedIn />

  const emailConfirmed = !!user.email_confirmed_at
  if (!emailConfirmed) return <StateEmailUnconfirmed user={user} signOut={signOut} />

  if (profile?.role === 'owner') return <StateOwner user={user} profile={profile} signOut={signOut} />
  if (profile?.role === 'admin') return <StateAdmin user={user} profile={profile} signOut={signOut} />
  return <StatePlayer user={user} profile={profile} signOut={signOut} />
}
