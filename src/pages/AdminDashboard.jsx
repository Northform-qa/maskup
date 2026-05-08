import { useState } from 'react'
import { PENDING_FIELDS } from '../data/mockData'

const REJECTION_REASONS = [
  'Incomplete information',
  'Cannot verify location',
  'Duplicate listing',
  'Not a paintball field',
]

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

function FieldCard({ field, onApprove, onReject }) {
  const [showReject, setShowReject] = useState(false)
  const [selectedReason, setSelectedReason] = useState(null)
  const [customNote, setCustomNote] = useState('')

  const handleReject = () => {
    if (!showReject) {
      setShowReject(true)
      return
    }
    if (selectedReason) onReject(field.id, selectedReason, customNote)
  }

  const tags = [
    field.city && `${field.city}, ${field.province}`,
    field.email,
    field.phone,
    ...field.field_types,
    field.num_fields && `${field.num_fields} fields`,
    field.rentals_available && 'Rentals available',
    field.max_capacity && `Max ${field.max_capacity} players`,
  ].filter(Boolean)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Tags + timestamp */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
            🕐 {field.created_at}
          </span>
        </div>
      </div>

      {/* Quick verification */}
      <div className="px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Quick Verification</p>
        <div className="space-y-2">
          <VerificationRow
            label={`Address geocoded successfully — ${field.city}, ${field.province}`}
            passed={field.verifications.address_geocoded}
          />
          <VerificationRow
            label={`Website link responds${field.website ? ` (${field.website})` : ''}`}
            passed={field.verifications.website_responds}
          />
          <VerificationRow
            label="No photos uploaded yet — listing will show placeholder"
            passed={field.verifications.photos_uploaded}
          />
          <VerificationRow
            label="Hours and seasonal dates provided"
            passed={field.verifications.hours_provided}
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
            placeholder="Please add your full street address and at least one contact phone number before resubmitting."
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
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors"
            >
              ✓ Approve &amp; publish
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onApprove(field.id)}
              className="px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Approve &amp; publish
            </button>
            <button
              onClick={handleReject}
              disabled={!selectedReason}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                selectedReason
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              → Send rejection
            </button>
          </>
        )}
        <button className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <span className="text-sm">⊕</span> Preview listing
        </button>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [fields, setFields] = useState(PENDING_FIELDS)
  const [approvedCount] = useState(5)
  const [totalListed] = useState(18)

  const handleApprove = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  const handleReject = (id, _reason, _note) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
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
              {fields.length} pending
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total listed</p>
            <p className="text-2xl font-bold text-gray-900">{totalListed}</p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
            <p className="text-xs text-orange-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-orange-700">{fields.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <p className="text-xs text-green-600 mb-1">Approved this month</p>
            <p className="text-2xl font-bold text-brand">{approvedCount}</p>
          </div>
        </div>

        {/* Field cards */}
        {fields.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <span className="text-4xl mb-3 block">✓</span>
            <h3 className="text-lg font-semibold text-gray-800">All caught up!</h3>
            <p className="text-sm text-gray-500 mt-1">No pending listings to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
