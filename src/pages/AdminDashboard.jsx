import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const REJECTION_REASONS = [
  'Incomplete information',
  'Cannot verify location',
  'Duplicate listing',
  'Not a paintball field',
]

function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function computeVerifications(field) {
  return {
    address_geocoded: field.lat != null && field.lng != null,
    website_responds: !!field.website,
    photos_uploaded: false,
    hours_provided: Object.keys(field.hours ?? {}).length > 0,
  }
}

function VerificationRow({ label, passed }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-xs ${
          passed ? 'bg-brand text-white' : 'bg-gray-100 border border-gray-300 text-gray-300'
        }`}
      >
        {passed ? '✓' : '○'}
      </span>
      <span className={`text-sm ${passed ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}

function FieldCard({ field, onApprove, onReject, saving }) {
  const [showReject, setShowReject] = useState(false)
  const [selectedReason, setSelectedReason] = useState(null)
  const [customNote, setCustomNote] = useState('')

  const v = computeVerifications(field)

  const handleReject = () => {
    if (!showReject) { setShowReject(true); return }
    if (selectedReason) onReject(field.id, selectedReason, customNote)
  }

  const tags = [
    field.city && `${field.city}, ${field.province}`,
    field.phone,
    ...( field.field_types ?? []),
    field.num_fields && `${field.num_fields} fields`,
    field.rentals_available && 'Rentals available',
    field.typical_capacity && `Up to ${field.typical_capacity} players`,
  ].filter(Boolean)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header: name + tags + timestamp */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-2">{field.name}</h2>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
            🕐 {timeAgo(field.created_at)}
          </span>
        </div>
      </div>

      {/* Quick verification */}
      <div className="px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Quick Verification</p>
        <div className="space-y-2">
          <VerificationRow
            label={v.address_geocoded
              ? `Address geocoded — ${field.city}, ${field.province}`
              : 'Address not geocoded — lat/lng missing'}
            passed={v.address_geocoded}
          />
          <VerificationRow
            label={v.website_responds
              ? `Website provided (${field.website})`
              : 'No website provided'}
            passed={v.website_responds}
          />
          <VerificationRow
            label="No photos uploaded yet — listing will show placeholder"
            passed={v.photos_uploaded}
          />
          <VerificationRow
            label={v.hours_provided ? 'Hours provided' : 'No hours provided'}
            passed={v.hours_provided}
          />
        </div>
      </div>

      {/* Rejection reason selector */}
      {showReject && (
        <div className="px-5 pb-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Send rejection reason to owner</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {REJECTION_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors ${
                  selectedReason === reason
                    ? 'bg-red-50 border-red-400 text-red-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Optional: add a note for the owner"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 text-gray-600"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-5 pb-4 flex items-center gap-3">
        {!showReject ? (
          <>
            <button
              onClick={() => onApprove(field.id)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              ✓ Approve &amp; publish
            </button>
            <button
              onClick={handleReject}
              disabled={saving}
              className="px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onApprove(field.id)}
              disabled={saving}
              className="px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Approve &amp; publish
            </button>
            <button
              onClick={handleReject}
              disabled={!selectedReason || saving}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                selectedReason && !saving
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              → Send rejection
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [pendingFields, setPendingFields] = useState([])
  const [totalListed, setTotalListed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const [
          { data: pending, error: pendingErr },
          { count: published },
        ] = await Promise.all([
          supabase
            .from('fields')
            .select('*')
            .eq('listing_status', 'pending')
            .order('created_at', { ascending: false }),
          supabase
            .from('fields')
            .select('*', { count: 'exact', head: true })
            .eq('listing_status', 'published'),
        ])

        if (pendingErr) {
          setError(pendingErr.message)
        } else {
          setPendingFields(pending ?? [])
          setTotalListed(published ?? 0)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  async function handleApprove(id) {
    setSaving(true)
    const { error } = await supabase
      .from('fields')
      .update({ listing_status: 'published' })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setPendingFields((prev) => prev.filter((f) => f.id !== id))
      setTotalListed((prev) => prev + 1)
    }
    setSaving(false)
  }

  async function handleReject(id, _reason, _note) {
    setSaving(true)
    const { error } = await supabase
      .from('fields')
      .update({ listing_status: 'rejected' })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setPendingFields((prev) => prev.filter((f) => f.id !== id))
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-cream-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-1">
            Admin Dashboard · Pending Approvals
          </p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-500 text-sm font-bold">!</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Review new listings before they go live</h1>
            <span className="ml-auto px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
              {pendingFields.length} pending
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total published</p>
            <p className="text-2xl font-bold text-gray-900">{totalListed}</p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
            <p className="text-xs text-orange-600 mb-1">Pending review</p>
            <p className="text-2xl font-bold text-orange-700">{pendingFields.length}</p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Field cards */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : pendingFields.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <span className="text-4xl mb-3 block">✓</span>
            <h3 className="text-lg font-semibold text-gray-800">All caught up!</h3>
            <p className="text-sm text-gray-500 mt-1">No pending listings to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingFields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                onApprove={handleApprove}
                onReject={handleReject}
                saving={saving}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
