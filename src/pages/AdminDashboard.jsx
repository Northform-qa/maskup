// SQL — run once in Supabase SQL Editor if column doesn't exist:
// ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS rejection_reason text;

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sanitizeUrl } from '../lib/sanitizeUrl'

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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function fmtHour(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, '0')}${period}`
}

function FieldInfoSection({ field }) {
  const hasHours = Object.keys(field.hours ?? {}).length > 0

  return (
    <div className="px-5 py-4 space-y-4 border-b border-gray-100 text-sm">

      {/* Location */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Location</p>
        <p className="text-gray-700">
          {[field.address, field.city, field.province, field.postal_code].filter(Boolean).join(', ')}
        </p>
        <p className={`text-xs mt-0.5 ${field.lat ? 'text-brand' : 'text-amber-600'}`}>
          {field.lat ? '✓ Geocoded — will appear on map' : '○ Not geocoded — will not appear on map'}
        </p>
      </div>

      {/* Contact */}
      {(field.phone || field.website) && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Contact</p>
          <div className="space-y-0.5">
            {field.phone && <p className="text-gray-700">📞 {field.phone}</p>}
            {field.website && (
              <a href={sanitizeUrl(field.website)} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline block">
                🌐 {field.website}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Game types */}
      {(field.field_types ?? []).length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Game Types</p>
          <div className="flex flex-wrap gap-1">
            {field.field_types.map((t) => (
              <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      {(field.num_fields || field.typical_capacity || field.rentals_available || field.pricing) && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Details</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-gray-700">
            {field.num_fields && <span>⚡ {field.num_fields} fields</span>}
            {field.typical_capacity && <span>👥 Up to {field.typical_capacity} players</span>}
            {field.rentals_available && <span>🎿 Rentals available</span>}
            {field.pricing && <span>💰 {field.pricing}</span>}
          </div>
        </div>
      )}

      {/* Hours */}
      {hasHours && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Hours</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            {DAYS.map((day) => {
              const h = field.hours?.[day]
              const closed = !h || h.closed
              const label = closed ? 'Closed' : `${fmtHour(h.open)}–${fmtHour(h.close)}`
              return (
                <div key={day} className="flex justify-between">
                  <span className="text-xs text-gray-500">{day}</span>
                  <span className={`text-xs ${closed ? 'text-gray-300' : 'text-gray-700 font-medium'}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Description */}
      {field.description && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Description</p>
          <p className="text-gray-600 leading-relaxed">{field.description}</p>
        </div>
      )}
    </div>
  )
}

// ── Pending approval card ──────────────────────────────────────────────────
function PendingCard({ field, onApprove, onReject, onRequestChanges, saving }) {
  const [mode, setMode] = useState(null) // null | 'reject' | 'changes'
  const [reason, setReason] = useState('')

  const v = computeVerifications(field)

  function handleCancel() { setMode(null); setReason('') }

  const owner = field.users
  const profile = owner?.owner_profiles?.[0]
  const ownerName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : owner?.display_name
  const ownerLabel = owner
    ? [ownerName, owner.email].filter(Boolean).join(' — ')
    : null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-1">{field.name}</h2>
        {ownerLabel && (
          <p className="text-xs text-gray-400 mb-2">Submitted by: {ownerLabel}</p>
        )}
        <div className="flex items-start justify-between gap-2">
          <FieldTags field={field} />
          <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
            🕐 {timeAgo(field.created_at)}
          </span>
        </div>
      </div>

      <FieldInfoSection field={field} />

      <div className="px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Checklist</p>
        <div className="space-y-2">
          <VerificationRow
            label={v.address_geocoded ? 'Address geocoded — map pin set' : 'Address not geocoded — will not appear on map'}
            passed={v.address_geocoded}
          />
          <VerificationRow label={v.website_responds ? 'Website provided' : 'No website provided'} passed={v.website_responds} />
          <VerificationRow label="No photos uploaded yet — listing will show placeholder" passed={v.photos_uploaded} />
          <VerificationRow label={v.hours_provided ? 'Hours provided' : 'No hours provided'} passed={v.hours_provided} />
        </div>
      </div>

      {mode === 'reject' && (
        <div className="px-5 pb-4">
          <label className="block text-xs font-semibold text-red-600 mb-1.5">Reason for rejection — this listing will be permanently closed</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell the owner why their listing was not approved..."
            rows={3}
            className="w-full px-3 py-2 border border-red-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 text-gray-700 resize-none"
          />
        </div>
      )}

      {mode === 'changes' && (
        <div className="px-5 pb-4">
          <label className="block text-xs font-semibold text-amber-600 mb-1.5">What needs to be updated? — owner can edit and resubmit</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell the owner exactly what needs to be fixed before their listing can be approved..."
            rows={3}
            className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 text-gray-700 resize-none"
          />
        </div>
      )}

      <div className="px-5 pb-4 flex items-center gap-3 flex-wrap">
        {mode === null ? (
          <>
            <button
              onClick={() => onApprove(field.id)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              ✓ Approve &amp; publish
            </button>
            <button
              onClick={() => setMode('changes')}
              disabled={saving}
              className="px-4 py-2.5 border border-amber-300 text-sm font-medium text-amber-600 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              Request changes
            </button>
            <button
              onClick={() => setMode('reject')}
              disabled={saving}
              className="px-4 py-2.5 border border-red-300 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </>
        ) : mode === 'reject' ? (
          <>
            <button
              onClick={() => reason.trim() && onReject(field.id, reason.trim(), field.name)}
              disabled={!reason.trim() || saving}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${reason.trim() && !saving ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              Confirm rejection
            </button>
            <button onClick={handleCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
          </>
        ) : (
          <>
            <button
              onClick={() => reason.trim() && onRequestChanges(field.id, reason.trim(), field.name)}
              disabled={!reason.trim() || saving}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${reason.trim() && !saving ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              Send &amp; request changes
            </button>
            <button onClick={handleCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
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

function ClaimCard({ field, onApprove, onReject, onRequestChanges, saving }) {
  const [mode, setMode] = useState(null) // null | 'reject' | 'changes'
  const [reason, setReason] = useState('')

  const claimant = field.users
  const claimantLabel = claimant
    ? [claimant.display_name, claimant.email].filter(Boolean).join(' — ')
    : null
  const addedFields = computeAddedFields(field)

  function handleCancel() { setMode(null); setReason('') }

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

      <FieldInfoSection field={field} />

      {mode === 'reject' && (
        <div className="px-5 pb-4 pt-3">
          <label className="block text-xs font-semibold text-red-600 mb-1.5">Reason for rejection — claim will be permanently closed</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell the claimant why their claim was not approved..."
            rows={3}
            className="w-full px-3 py-2 border border-red-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 text-gray-700 resize-none"
          />
        </div>
      )}

      {mode === 'changes' && (
        <div className="px-5 pb-4 pt-3">
          <label className="block text-xs font-semibold text-amber-600 mb-1.5">Reason for declining — claimant will need to re-initiate their claim</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell the claimant what needs to be addressed before re-submitting their claim..."
            rows={3}
            className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 text-gray-700 resize-none"
          />
        </div>
      )}

      <div className="px-5 pb-4 flex items-center gap-3 flex-wrap">
        {mode === null ? (
          <>
            <button
              onClick={() => onApprove(field.id, field.name)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              ✓ Approve claim
            </button>
            <button
              onClick={() => setMode('changes')}
              disabled={saving}
              className="px-4 py-2.5 border border-amber-300 text-sm font-medium text-amber-600 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              Request changes
            </button>
            <button
              onClick={() => setMode('reject')}
              disabled={saving}
              className="px-4 py-2.5 border border-red-300 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </>
        ) : mode === 'reject' ? (
          <>
            <button
              onClick={() => reason.trim() && onReject(field.id, reason.trim(), field.name)}
              disabled={!reason.trim() || saving}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${reason.trim() && !saving ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              Confirm rejection
            </button>
            <button onClick={handleCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
          </>
        ) : (
          <>
            <button
              onClick={() => reason.trim() && onRequestChanges(field.id, reason.trim(), field.name)}
              disabled={!reason.trim() || saving}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${reason.trim() && !saving ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              Send &amp; request changes
            </button>
            <button onClick={handleCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
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
          supabase.from('fields').select('*, users!owner_id(display_name, email, owner_profiles(first_name, last_name))').eq('listing_status', 'pending').is('claim_requested_by', null).order('created_at', { ascending: false }),
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

  // Fire-and-forget — email failure never blocks the admin action
  async function notifyOwner(fieldId, action) {
    try {
      const { error } = await supabase.functions.invoke('notify-owner', {
        body: { fieldId, action },
      })
      if (error) console.error('notify-owner edge function error:', error)
    } catch (err) {
      console.error('notify-owner call failed:', err)
    }
  }

  async function handleApprove(id) {
    setSaving(true)
    const { error } = await supabase.from('fields').update({ listing_status: 'published' }).eq('id', id)
    if (error) { setError(error.message) } else {
      const field = pendingFields.find((f) => f.id === id)
      setPendingFields((prev) => prev.filter((f) => f.id !== id))
      if (field) setPublishedFields((prev) => [...prev, { ...field, listing_status: 'published' }].sort((a, b) => a.name.localeCompare(b.name)))
      showToast('Listing approved and now live')
      notifyOwner(id, 'approved')
    }
    setSaving(false)
  }

  async function handleReject(id, rejection_reason, fieldName) {
    setSaving(true)
    const { error } = await supabase.from('fields').update({ listing_status: 'rejected', rejection_reason }).eq('id', id)
    if (error) { setError(error.message) } else {
      setPendingFields((prev) => prev.filter((f) => f.id !== id))
      showToast(`${fieldName} has been rejected.`)
      notifyOwner(id, 'rejected')
    }
    setSaving(false)
  }

  async function handleRequestChanges(id, rejection_reason, fieldName) {
    setSaving(true)
    const { error } = await supabase.from('fields').update({ listing_status: 'requires_changes', rejection_reason }).eq('id', id)
    if (error) { setError(error.message) } else {
      setPendingFields((prev) => prev.filter((f) => f.id !== id))
      showToast(`Changes requested for ${fieldName}.`)
      notifyOwner(id, 'requires_changes')
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
      notifyOwner(id, 'approved')
    }
    setSaving(false)
  }

  async function handleRejectClaim(id, rejection_reason, fieldName) {
    setSaving(true)
    const { error } = await supabase.from('fields').update({
      rejection_reason,
      claim_requested_by: null,
      claim_requested_at: null,
    }).eq('id', id)
    if (error) { setError(error.message) } else {
      setPendingClaims((prev) => prev.filter((f) => f.id !== id))
      showToast(`Claim for ${fieldName} rejected.`)
      notifyOwner(id, 'rejected')
    }
    setSaving(false)
  }

  async function handleRequestClaimChanges(id, rejection_reason, fieldName) {
    setSaving(true)
    const { error } = await supabase.from('fields').update({
      rejection_reason,
      claim_requested_by: null,
      claim_requested_at: null,
    }).eq('id', id)
    if (error) { setError(error.message) } else {
      setPendingClaims((prev) => prev.filter((f) => f.id !== id))
      showToast(`Claim for ${fieldName} declined — claimant notified to re-apply.`)
      notifyOwner(id, 'rejected')
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
          <Link to="/profile" className="text-xs text-brand font-medium hover:underline flex items-center gap-1 mb-2">
            ← My Profile
          </Link>
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
                      onRequestChanges={handleRequestChanges}
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
                      onRequestChanges={handleRequestClaimChanges}
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
