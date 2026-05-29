import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const REJECTION_REASONS = [
  'Incomplete information',
  'Cannot verify location',
  'Duplicate listing',
  'Not a paintball field',
]

const TABS = ['Pending', 'Claims', 'Published', 'Hidden']

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

function FieldTags({ field }) {
  const tags = [
    field.city && `${field.city}, ${field.province}`,
    field.phone,
    ...(field.field_types ?? []),
    field.num_fields && `${field.num_fields} fields`,
    field.rentals_available && 'Rentals available',
    field.typical_capacity && `Up to ${field.typical_capacity} players`,
  ].filter(Boolean)

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
          {tag}
        </span>
      ))}
    </div>
  )
}

// ── Pending approval card ──────────────────────────────────────────────────
function PendingCard({ field, onApprove, onReject, saving }) {
  const [showReject, setShowReject] = useState(false)
  const [selectedReason, setSelectedReason] = useState(null)
  const [customNote, setCustomNote] = useState('')

  const v = computeVerifications(field)

  function handleRejectClick() {
    if (!showReject) { setShowReject(true); return }
    if (selectedReason) onReject(field.id, selectedReason, customNote)
  }

  function handleCancel() {
    setShowReject(false)
    setSelectedReason(null)
    setCustomNote('')
  }

  const owner = field.users
  const ownerLabel = owner
    ? [owner.display_name, owner.email].filter(Boolean).join(' — ')
    : null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-1">{field.name}</h2>
        {ownerLabel && (
          <p className="text-xs text-gray-400 mb-2">Submitted by {ownerLabel}</p>
        )}
        <div className="flex items-start justify-between gap-2">
          <FieldTags field={field} />
          <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
            🕐 {timeAgo(field.created_at)}
          </span>
        </div>
      </div>

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
            label={v.website_responds ? `Website provided (${field.website})` : 'No website provided'}
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

      <div className="px-5 pb-4 flex items-center gap-3 flex-wrap">
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
              onClick={handleRejectClick}
              disabled={saving}
              className="px-4 py-2.5 border border-red-300 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleRejectClick}
              disabled={!selectedReason || saving}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                selectedReason && !saving
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirm reject
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Published / Hidden management card ────────────────────────────────────
function ManagedCard({ field, onHide, onRestore, onToggleFeature, onDelete, saving }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isHidden = field.listing_status === 'hidden'

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${isHidden ? 'border-gray-200 opacity-75' : 'border-gray-200'}`}>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-gray-900 truncate">{field.name}</h2>
              {field.featured && (
                <span className="flex-shrink-0 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                  ★ Featured
                </span>
              )}
            </div>
            <FieldTags field={field} />
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(field.created_at)}</span>
        </div>
      </div>

      <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
        {isHidden ? (
          <button
            onClick={() => onRestore(field.id)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            ↑ Restore listing
          </button>
        ) : (
          <>
            <button
              onClick={() => onToggleFeature(field.id, field.featured)}
              disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                field.featured
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {field.featured ? '★ Unfeature' : '☆ Feature'}
            </button>
            <button
              onClick={() => onHide(field.id)}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hide
            </button>
          </>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 border border-red-200 text-sm font-medium text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-red-600 font-medium">Remove permanently?</span>
            <button
              onClick={() => onDelete(field.id)}
              disabled={saving}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 border border-gray-300 text-xs text-gray-600 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Claim card helpers ─────────────────────────────────────────────────────
function computeAddedFields(field) {
  const added = []
  if (Object.values(field.hours ?? {}).some((h) => typeof h === 'object' && !h.closed)) added.push('hours')
  if (field.pricing) added.push('pricing')
  if (field.rentals_available) added.push('rentals')
  if ((field.field_types ?? []).length > 0) added.push('game types')
  if (field.description) added.push('description')
  if (field.phone) added.push('phone')
  if (field.website) added.push('website')
  return added
}

function ClaimCard({ field, onApprove, onReject, saving }) {
  const [showReject, setShowReject] = useState(false)
  const [selectedReason, setSelectedReason] = useState(null)
  const [customNote, setCustomNote] = useState('')

  const claimant = field.users
  const claimantLabel = claimant
    ? [claimant.display_name, claimant.email].filter(Boolean).join(' — ')
    : null
  const addedFields = computeAddedFields(field)

  function handleRejectClick() {
    if (!showReject) { setShowReject(true); return }
    if (selectedReason) onReject(field.id, selectedReason, customNote)
  }

  function handleCancel() {
    setShowReject(false)
    setSelectedReason(null)
    setCustomNote('')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-0.5">{field.name}</h2>
        <p className="text-xs text-gray-500 mb-1">{field.city}, {field.province}</p>
        {claimantLabel && (
          <p className="text-xs text-gray-400 mb-2">Claim by {claimantLabel}</p>
        )}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-gray-400">🕐 {timeAgo(field.claim_requested_at)}</span>
          {addedFields.length > 0 && (
            <span className="text-xs text-brand font-medium">Added: {addedFields.join(', ')}</span>
          )}
        </div>
      </div>

      {showReject && (
        <div className="px-5 pb-4 pt-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Send rejection reason to claimant</p>
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
            placeholder="Optional: add a note for the claimant"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 text-gray-600"
          />
        </div>
      )}

      <div className="px-5 pb-4 flex items-center gap-3 flex-wrap">
        {!showReject ? (
          <>
            <button
              onClick={() => onApprove(field.id, field.name)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              ✓ Approve claim
            </button>
            <button
              onClick={handleRejectClick}
              disabled={saving}
              className="px-4 py-2.5 border border-red-300 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleRejectClick}
              disabled={!selectedReason || saving}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                selectedReason && !saving
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirm reject
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Pending')
  const [pendingFields, setPendingFields] = useState([])
  const [pendingClaims, setPendingClaims] = useState([])
  const [publishedFields, setPublishedFields] = useState([])
  const [hiddenFields, setHiddenFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    async function load() {
      try {
        const [
          { data: pending, error: pendingErr },
          { data: claims, error: claimsErr },
          { data: published, error: publishedErr },
          { data: hidden, error: hiddenErr },
        ] = await Promise.all([
          supabase.from('fields').select('*, users!owner_id(display_name, email)').eq('listing_status', 'pending').is('claim_requested_by', null).order('created_at', { ascending: false }),
          supabase.from('fields').select('*, users!claim_requested_by(display_name, email)').not('claim_requested_by', 'is', null).eq('claimed', false).order('claim_requested_at', { ascending: false }),
          supabase.from('fields').select('*').eq('listing_status', 'published').order('name'),
          supabase.from('fields').select('*').eq('listing_status', 'hidden').order('name'),
        ])

        const err = pendingErr || claimsErr || publishedErr || hiddenErr
        if (err) {
          setError(err.message)
        } else {
          setPendingFields(pending ?? [])
          setPendingClaims(claims ?? [])
          setPublishedFields(published ?? [])
          setHiddenFields(hidden ?? [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleApprove(id) {
    setSaving(true)
    const { error } = await supabase.from('fields').update({ listing_status: 'published' }).eq('id', id)
    if (error) { setError(error.message) } else {
      const field = pendingFields.find((f) => f.id === id)
      setPendingFields((prev) => prev.filter((f) => f.id !== id))
      if (field) setPublishedFields((prev) => [...prev, { ...field, listing_status: 'published' }].sort((a, b) => a.name.localeCompare(b.name)))
      showToast('Listing approved and now live')
    }
    setSaving(false)
  }

  async function handleReject(id, selectedReason, customNote) {
    setSaving(true)
    const rejection_reason = selectedReason + (customNote?.trim() ? ` — ${customNote.trim()}` : '')
    const { error } = await supabase.from('fields').update({ listing_status: 'rejected', rejection_reason }).eq('id', id)
    if (error) { setError(error.message) } else {
      setPendingFields((prev) => prev.filter((f) => f.id !== id))
      showToast('Listing rejected')
    }
    setSaving(false)
  }

  async function handleHide(id) {
    setSaving(true)
    const { error } = await supabase.from('fields').update({ listing_status: 'hidden' }).eq('id', id)
    if (error) { setError(error.message) } else {
      const field = publishedFields.find((f) => f.id === id)
      setPublishedFields((prev) => prev.filter((f) => f.id !== id))
      if (field) setHiddenFields((prev) => [...prev, { ...field, listing_status: 'hidden' }].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setSaving(false)
  }

  async function handleRestore(id) {
    setSaving(true)
    const { error } = await supabase.from('fields').update({ listing_status: 'published' }).eq('id', id)
    if (error) { setError(error.message) } else {
      const field = hiddenFields.find((f) => f.id === id)
      setHiddenFields((prev) => prev.filter((f) => f.id !== id))
      if (field) setPublishedFields((prev) => [...prev, { ...field, listing_status: 'published' }].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setSaving(false)
  }

  async function handleToggleFeature(id, currentFeatured) {
    setSaving(true)
    const { error } = await supabase.from('fields').update({ featured: !currentFeatured }).eq('id', id)
    if (error) { setError(error.message) } else {
      setPublishedFields((prev) => prev.map((f) => f.id === id ? { ...f, featured: !currentFeatured } : f))
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    setSaving(true)
    const { error } = await supabase.from('fields').delete().eq('id', id)
    if (error) { setError(error.message) } else {
      setPublishedFields((prev) => prev.filter((f) => f.id !== id))
      setHiddenFields((prev) => prev.filter((f) => f.id !== id))
    }
    setSaving(false)
  }

  async function handleApproveClaim(id, fieldName) {
    setSaving(true)
    const claim = pendingClaims.find((f) => f.id === id)
    const { error } = await supabase.from('fields').update({
      claimed: true,
      owner_id: claim?.claim_requested_by,
      listing_status: 'published',
      claim_requested_by: null,
      claim_requested_at: null,
    }).eq('id', id)
    if (error) { setError(error.message) } else {
      setPendingClaims((prev) => prev.filter((f) => f.id !== id))
      showToast(`Claim approved — ${fieldName} is now live`)
    }
    setSaving(false)
  }

  async function handleRejectClaim(id, selectedReason, customNote) {
    setSaving(true)
    const rejection_reason = selectedReason + (customNote?.trim() ? ` — ${customNote.trim()}` : '')
    const { error } = await supabase.from('fields').update({
      listing_status: 'rejected',
      rejection_reason,
      claim_requested_by: null,
      claim_requested_at: null,
    }).eq('id', id)
    if (error) { setError(error.message) } else {
      setPendingClaims((prev) => prev.filter((f) => f.id !== id))
      showToast('Claim rejected')
    }
    setSaving(false)
  }

  const counts = {
    Pending: pendingFields.length,
    Claims: pendingClaims.length,
    Published: publishedFields.length,
    Hidden: hiddenFields.length,
  }

  return (
    <div className="min-h-screen bg-cream-100 py-8 px-4">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-1">Admin Dashboard</p>
          <h1 className="text-xl font-bold text-gray-900">Manage listings</h1>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Published', value: publishedFields.length, color: 'bg-white border-gray-200', textColor: 'text-gray-900', labelColor: 'text-gray-500' },
            { label: 'Pending review', value: pendingFields.length, color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700', labelColor: 'text-orange-600' },
            { label: 'Hidden', value: hiddenFields.length, color: 'bg-white border-gray-200', textColor: 'text-gray-900', labelColor: 'text-gray-500' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <p className={`text-xs mb-1 ${s.labelColor}`}>{s.label}</p>
              <p className={`text-2xl font-bold ${s.textColor}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {counts[tab] > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  tab === 'Pending' ? 'bg-orange-100 text-orange-700' :
                  tab === 'Claims' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-3 flex-shrink-0">✕</button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : (
          <>
            {/* Pending tab */}
            {activeTab === 'Pending' && (
              pendingFields.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <span className="text-4xl mb-3 block">✓</span>
                  <h3 className="text-lg font-semibold text-gray-800">All caught up!</h3>
                  <p className="text-sm text-gray-500 mt-1">No pending listings to review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingFields.map((field) => (
                    <PendingCard
                      key={field.id}
                      field={field}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      saving={saving}
                    />
                  ))}
                </div>
              )
            )}

            {/* Claims tab */}
            {activeTab === 'Claims' && (
              pendingClaims.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <span className="text-4xl mb-3 block">🎯</span>
                  <h3 className="text-lg font-semibold text-gray-800">No pending claims</h3>
                  <p className="text-sm text-gray-500 mt-1">Claim requests will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingClaims.map((field) => (
                    <ClaimCard
                      key={field.id}
                      field={field}
                      onApprove={handleApproveClaim}
                      onReject={handleRejectClaim}
                      saving={saving}
                    />
                  ))}
                </div>
              )
            )}

            {/* Published tab */}
            {activeTab === 'Published' && (
              publishedFields.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                  No published listings yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedFields.map((field) => (
                    <ManagedCard
                      key={field.id}
                      field={field}
                      onHide={handleHide}
                      onRestore={handleRestore}
                      onToggleFeature={handleToggleFeature}
                      onDelete={handleDelete}
                      saving={saving}
                    />
                  ))}
                </div>
              )
            )}

            {/* Hidden tab */}
            {activeTab === 'Hidden' && (
              hiddenFields.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                  No hidden listings.
                </div>
              ) : (
                <div className="space-y-3">
                  {hiddenFields.map((field) => (
                    <ManagedCard
                      key={field.id}
                      field={field}
                      onHide={handleHide}
                      onRestore={handleRestore}
                      onToggleFeature={handleToggleFeature}
                      onDelete={handleDelete}
                      saving={saving}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}
