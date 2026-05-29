import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ── Claim path: unclaimed field search ───────────────────────────
function ClaimSearchScreen({ onContinue, onBack }) {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('fields')
        .select('id, name, city, province, address, postal_code, phone, website, lat, lng, num_fields, typical_capacity, field_types')
        .eq('claimed', false)
        .order('name')
      setFields(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = query.trim().length === 0
    ? fields
    : fields.filter((f) => {
        const q = query.toLowerCase()
        return f.name?.toLowerCase().includes(q) || f.city?.toLowerCase().includes(q)
      })

  return (
    <div className="min-h-screen bg-cream-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
          ← Back
        </button>
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Find your field</h1>
          <p className="text-sm text-gray-500">Search for your field in our existing listings</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or city…"
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm px-4">
                {query ? 'No fields found — try a different name or city.' : 'No unclaimed fields available.'}
              </div>
            ) : (
              filtered.map((field) => {
                const isSelected = selected?.id === field.id
                return (
                  <button
                    key={field.id}
                    onClick={() => setSelected(isSelected ? null : field)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors border-l-4 ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${isSelected ? 'text-amber-800' : 'text-gray-900'}`}>
                        {field.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {field.city}, {field.province}
                        {field.address && ` · ${field.address}`}
                      </p>
                    </div>
                    {isSelected && <span className="text-amber-500 text-base flex-shrink-0">✓</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {selected && (
          <button
            onClick={() => onContinue(selected)}
            className="w-full mt-4 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors"
          >
            Continue to claim {selected.name} →
          </button>
        )}
      </div>
    </div>
  )
}

// ── Step 0 path selector ──────────────────────────────────────────
function PathSelectScreen({ onSelectNew, onSelectClaim }) {
  return (
    <div className="min-h-screen bg-cream-100 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Let's get your field listed</h1>
          <p className="text-sm text-gray-500">Choose how you'd like to proceed</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onSelectNew}
            className="group bg-white border-2 border-gray-200 hover:border-brand rounded-2xl p-6 text-left transition-all hover:shadow-md"
          >
            <span className="text-4xl block mb-3">🏕️</span>
            <h2 className="text-base font-bold text-gray-900 mb-1 group-hover:text-brand transition-colors">
              Register a New Field
            </h2>
            <p className="text-sm text-gray-500">Your field isn't on MaskUp yet</p>
          </button>
          <button
            onClick={onSelectClaim}
            className="group bg-white border-2 border-gray-200 hover:border-amber-400 rounded-2xl p-6 text-left transition-all hover:shadow-md"
          >
            <span className="text-4xl block mb-3">🎯</span>
            <h2 className="text-base font-bold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
              Claim an Existing Listing
            </h2>
            <p className="text-sm text-gray-500">Your field is already on MaskUp but hasn't been claimed</p>
          </button>
        </div>
      </div>
    </div>
  )
}

const STEPS = ['Account', 'Field details', 'Hours & pricing', 'Photos & submit']

const FIELD_TYPES = ['Woodball', 'Speedball', 'Scenario', 'Airsoft', 'Rec ball', 'Hyperball', 'Indoor', 'Tournament']

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PROVINCES = ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'YT', 'NU']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  done
                    ? 'bg-brand text-white'
                    : active
                    ? 'bg-brand text-white ring-4 ring-brand/20'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-brand font-medium' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < current ? 'bg-brand' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Step1({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="you@yourfield.ca"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={data.password}
          onChange={(e) => onChange('password', e.target.value)}
          placeholder="8+ characters"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
        <input
          type="text"
          value={data.display_name}
          onChange={(e) => onChange('display_name', e.target.value)}
          placeholder="Your name or field nickname"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
        <p className="text-xs text-green-700 font-medium">✓ Free basic listing · approved in under 48h</p>
      </div>
    </div>
  )
}

function Step2({ data, onChange }) {
  const toggleFieldType = (type) => {
    const current = data.field_types || []
    onChange(
      'field_types',
      current.includes(type) ? current.filter((t) => t !== type) : [...current, type]
    )
  }
  const toggleRental = (key) => {
    const current = data.rentals || []
    onChange('rentals', current.includes(key) ? current.filter((r) => r !== key) : [...current, key])
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Field name <span className="text-red-500 text-xs float-right font-normal">Required</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Combat Zone Paintball"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="123 Field Road"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Woodstock"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Province <span className="text-red-500">*</span>
          </label>
          <select
            value={data.province}
            onChange={(e) => onChange('province', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
          >
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postal code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.postal_code}
            onChange={(e) => onChange('postal_code', e.target.value.toUpperCase())}
            placeholder="N4S 1A1"
            maxLength={7}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input
            type="text"
            value="Canada"
            readOnly
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-default"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 -mt-2">Full address is used to pin your field on the map</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Field types offered <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_TYPES.map((type) => {
            const selected = (data.field_types || []).includes(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleFieldType(type)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                  selected
                    ? 'bg-brand/10 border-brand text-brand'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${selected ? 'bg-brand border-brand text-white' : 'border-gray-300'}`}>
                  {selected && <span className="text-[10px]">✓</span>}
                </span>
                {type}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of fields</label>
          <input
            type="number"
            value={data.num_fields}
            onChange={(e) => onChange('num_fields', e.target.value)}
            placeholder="5"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max group size</label>
          <input
            type="number"
            value={data.typical_capacity}
            onChange={(e) => onChange('typical_capacity', e.target.value)}
            placeholder="e.g. 40"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rental gear available?</label>
        <div className="flex gap-2">
          {['Markers', 'Masks', 'Full kit'].map((item) => {
            const selected = (data.rentals || []).includes(item)
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleRental(item)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-brand/10 border-brand text-brand'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${selected ? 'bg-brand border-brand text-white' : 'border-gray-300'}`}>
                  {selected && <span className="text-[10px]">✓</span>}
                </span>
                {item}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Step3({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Hours by day</h3>
        <div className="space-y-2">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3">
              <span className="w-8 text-sm text-gray-600 flex-shrink-0">{day}</span>
              <label className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={data.hours?.[day]?.closed !== true}
                  onChange={(e) => {
                    const current = data.hours || {}
                    onChange('hours', {
                      ...current,
                      [day]: e.target.checked ? { open: '9:00', close: '17:00' } : { closed: true },
                    })
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <span className="text-xs text-gray-500">Open</span>
              </label>
              {data.hours?.[day]?.closed !== true && (
                <>
                  <input
                    type="time"
                    value={data.hours?.[day]?.open || '09:00'}
                    onChange={(e) => {
                      const current = data.hours || {}
                      onChange('hours', { ...current, [day]: { ...current[day], open: e.target.value } })
                    }}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand/30"
                  />
                  <span className="text-xs text-gray-400">–</span>
                  <input
                    type="time"
                    value={data.hours?.[day]?.close || '17:00'}
                    onChange={(e) => {
                      const current = data.hours || {}
                      onChange('hours', { ...current, [day]: { ...current[day], close: e.target.value } })
                    }}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand/30"
                  />
                </>
              )}
              {data.hours?.[day]?.closed === true && (
                <span className="flex-1 text-xs text-gray-400 italic">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Season start</label>
          <input
            type="date"
            value={data.seasonal_start || ''}
            onChange={(e) => onChange('seasonal_start', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Season end</label>
          <input
            type="date"
            value={data.seasonal_end || ''}
            onChange={(e) => onChange('seasonal_end', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pricing (per session)</label>
        <input
          type="text"
          value={data.rental_pricing || ''}
          onChange={(e) => onChange('rental_pricing', e.target.value)}
          placeholder="e.g. $30–55"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="tel"
          value={data.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="(519) 555-0000"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
        <input
          type="url"
          value={data.website || ''}
          onChange={(e) => onChange('website', e.target.value)}
          placeholder="https://yourfield.ca"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>
    </div>
  )
}

function Step4({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Field description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={4}
          placeholder="Tell players what makes your field special — terrain, field types, vibe, what to expect..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 hover:border-brand/50 transition-colors cursor-pointer">
          <span className="text-3xl">📷</span>
          <p className="text-sm font-medium text-gray-600">Upload field photos</p>
          <p className="text-xs text-center">Drag & drop or click to browse<br />JPG, PNG up to 5MB each</p>
          <button type="button" className="mt-2 px-4 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
            Choose files
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          No photos yet? Your listing will show a placeholder until photos are added.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-cream-100 rounded-xl p-4 space-y-1">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Ready to submit?</h3>
        {[
          { label: 'Field name', value: data.name || '—' },
          { label: 'Location', value: data.city ? `${data.address ? data.address + ', ' : ''}${data.city}, ${data.province} ${data.postal_code}`.trim() : '—' },
          { label: 'Field types', value: data.field_types?.join(', ') || '—' },
          { label: 'Phone / Website', value: [data.phone, data.website].filter(Boolean).join(' · ') || '—' },
        ].map((row) => (
          <div key={row.label} className="flex gap-2 text-xs">
            <span className="text-gray-400 w-28 flex-shrink-0">{row.label}</span>
            <span className="text-gray-700 font-medium">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

async function geocodeAddress(address, city, province, postalCode) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  const query = encodeURIComponent(`${address}, ${city}, ${province}, ${postalCode}, Canada`)
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=CA&types=address,poi&limit=1&access_token=${token}`
  )
  const json = await res.json()
  const [lng, lat] = json.features?.[0]?.center ?? [null, null]
  return { lat, lng }
}

export default function OwnerRegistration() {
  const navigate = useNavigate()
  const location = useLocation()
  const isClaim = new URLSearchParams(location.search).get('claim') === 'true'
  const [screen, setScreen] = useState(isClaim ? 'claim_search' : 'path_select')
  const [path, setPath] = useState(isClaim ? 'claim' : 'new')
  const [selectedClaimField, setSelectedClaimField] = useState(null)
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    display_name: '',
    name: 'Combat Zone Paintball',
    city: 'Woodstock',
    province: 'ON',
    address: '',
    postal_code: '',
    field_types: ['Woodball', 'Scenario'],
    num_fields: '5',
    typical_capacity: '',
    rentals: ['Markers', 'Masks'],
    hours: {
      Mon: { closed: true },
      Tue: { closed: true },
      Wed: { closed: true },
      Thu: { closed: true },
      Fri: { open: '12:00', close: '20:00' },
      Sat: { open: '09:00', close: '16:00' },
      Sun: { open: '10:00', close: '16:00' },
    },
    seasonal_start: '',
    seasonal_end: '',
    rental_pricing: '',
    phone: '',
    website: '',
    description: '',
  })

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)

    if (formData.display_name.trim()) {
      const { data: taken } = await supabase.rpc('is_display_name_taken', { name: formData.display_name.trim() })
      if (taken) {
        setError('That display name is already taken.')
        setSubmitting(false)
        return
      }
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          display_name: formData.display_name.trim() || null,
          role: 'owner',
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }

    const { lat, lng } = formData.address.trim()
      ? await geocodeAddress(formData.address.trim(), formData.city.trim(), formData.province, formData.postal_code.trim())
      : path === 'claim'
      ? { lat: selectedClaimField?.lat ?? null, lng: selectedClaimField?.lng ?? null }
      : { lat: null, lng: null }

    const fieldPayload = {
      name: formData.name.trim(),
      city: formData.city.trim(),
      province: formData.province,
      address: formData.address.trim() || null,
      postal_code: formData.postal_code.trim() || null,
      lat,
      lng,
      field_types: formData.field_types,
      num_fields: formData.num_fields ? parseInt(formData.num_fields, 10) : null,
      typical_capacity: formData.typical_capacity ? parseInt(formData.typical_capacity, 10) : null,
      rentals_available: formData.rentals.length > 0,
      hours: formData.hours,
      seasonal_start: formData.seasonal_start || null,
      seasonal_end: formData.seasonal_end || null,
      pricing: formData.rental_pricing || null,
      phone: formData.phone || null,
      website: formData.website || null,
      description: formData.description || null,
      listing_status: 'pending',
    }

    if (path === 'claim') {
      const { error: claimError } = await supabase.rpc('submit_claim_request', {
        p_field_id:          selectedClaimField.id,
        p_user_id:           authData.user.id,
        p_name:              fieldPayload.name,
        p_address:           fieldPayload.address,
        p_city:              fieldPayload.city,
        p_province:          fieldPayload.province,
        p_postal_code:       fieldPayload.postal_code,
        p_lat:               fieldPayload.lat,
        p_lng:               fieldPayload.lng,
        p_field_types:       fieldPayload.field_types,
        p_num_fields:        fieldPayload.num_fields,
        p_typical_capacity:  fieldPayload.typical_capacity,
        p_rentals_available: fieldPayload.rentals_available,
        p_hours:             fieldPayload.hours,
        p_seasonal_start:    fieldPayload.seasonal_start,
        p_seasonal_end:      fieldPayload.seasonal_end,
        p_pricing:           fieldPayload.pricing,
        p_phone:             fieldPayload.phone,
        p_website:           fieldPayload.website,
        p_description:       fieldPayload.description,
      })

      if (claimError) {
        setError(claimError.message)
        setSubmitting(false)
        return
      }
    } else {
      const { error: fieldError } = await supabase.from('fields').insert({
        owner_id: authData.user.id,
        ...fieldPayload,
      })

      if (fieldError) {
        setError(fieldError.message)
        setSubmitting(false)
        return
      }
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  const handleNext = () => {
    setError(null)
    if (step === 0) {
      if (!formData.email.trim() || !formData.password.trim()) {
        setError('Email and password are required.')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setError('Please enter a valid email address.')
        return
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
    }
    if (step === 1) {
      const missing = []
      if (!formData.name.trim()) missing.push('field name')
      if (!formData.address.trim()) missing.push('street address')
      if (!formData.city.trim()) missing.push('city')
      if (!formData.postal_code.trim()) missing.push('postal code')
      if (formData.field_types.length === 0) missing.push('at least one field type')
      if (missing.length > 0) {
        setError(`Please fill in: ${missing.join(', ')}.`)
        return
      }
    }
    if (step === 2) {
      const rawPhone = formData.phone?.trim()
      if (rawPhone) {
        const digits = rawPhone.replace(/\D/g, '')
        const validLength = digits.length === 10 || (digits.length === 11 && digits[0] === '1')
        if (!validLength) {
          setError('Please enter a valid phone number (e.g. (519) 555-0000).')
          return
        }
      }
      const rawWeb = formData.website?.trim()
      if (rawWeb) {
        try {
          const u = new URL(rawWeb.match(/^https?:\/\//i) ? rawWeb : `https://${rawWeb}`)
          const tld = u.hostname.split('.').pop()
          if (!u.hostname.includes('.') || tld.length < 2) throw new Error()
        } catch {
          setError('Please enter a valid website URL (e.g. yourfield.ca or https://yourfield.com)')
          return
        }
      }
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => setStep((s) => Math.max(0, s - 1))

  const StepComponent = [Step1, Step2, Step3, Step4][step]

  if (screen === 'path_select') {
    return (
      <PathSelectScreen
        onSelectNew={() => { setPath('new'); setScreen('form') }}
        onSelectClaim={() => { setPath('claim'); setScreen('claim_search') }}
      />
    )
  }

  if (screen === 'claim_search') {
    return (
      <ClaimSearchScreen
        onBack={() => setScreen('path_select')}
        onContinue={(field) => {
          setSelectedClaimField(field)
          setFormData((prev) => ({
            ...prev,
            name: field.name || '',
            address: field.address || '',
            city: field.city || '',
            province: field.province || 'ON',
            postal_code: field.postal_code || '',
            phone: field.phone || '',
            website: field.website || '',
          }))
          setScreen('form')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-cream-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-1">
            Owner Registration · Step {step + 1} of 4
          </p>
        </div>

        {/* Free badge */}
        {step === 0 && (
          <div className="flex items-center justify-center mb-6">
            <span className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Free basic listing · approved in under 48h
            </span>
          </div>
        )}

        <StepIndicator current={step} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {path === 'claim' && selectedClaimField && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800 leading-relaxed">
              You're claiming <span className="font-semibold">{selectedClaimField.name}</span>. Pre-filled details came from our existing listing — please review and update anything that's changed.
            </div>
          )}
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            {['Your account', 'About your field', 'Hours & pricing', 'Photos & submit'][step]}
          </h2>

          {submitted ? (
            <PostSubmitView field={formData} />
          ) : (
            <>
              <StepComponent data={formData} onChange={handleChange} />

              {/* Nav buttons */}
              {error && (
                <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                {step > 0 ? (
                  <button
                    onClick={handleBack}
                    disabled={submitting}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
                  >
                    ← Back
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Step {step + 1} of 4</span>
                  <button
                    onClick={handleNext}
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-60"
                  >
                    {step < 3 ? (
                      <>Next: {STEPS[step + 1]} <span>›</span></>
                    ) : submitting ? (
                      'Submitting…'
                    ) : (
                      'Submit listing ✓'
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Post-submit state preview (mockup annotation) */}
        {submitted && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span className="text-xs font-semibold text-amber-800">Pending</span>
            </div>
            <p className="text-xs text-amber-700">
              Your listing is under review. {formData.name || 'Your field'} has been submitted and is awaiting approval. You'll receive an email within 48 hours. Your field will not appear in search results until approved.
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => navigate('/')}
                className="text-xs text-brand font-medium hover:underline"
              >
                Edit listing
              </button>
              <button className="text-xs text-gray-500 font-medium hover:underline">
                Contact support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PostSubmitView({ field }) {
  return (
    <div className="text-center py-8 space-y-3">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <span className="text-3xl">✓</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Listing submitted!</h3>
      <p className="text-sm text-gray-500">
        We'll review <strong>{field.name || 'your field'}</strong> and send a confirmation to {field.email || 'your email'} within 48 hours.
      </p>
    </div>
  )
}
