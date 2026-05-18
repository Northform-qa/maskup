import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const FIELD_TYPES = ['Woodball', 'Speedball', 'Scenario', 'Airsoft', 'Rec ball', 'Hyperball', 'Indoor', 'Tournament']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PROVINCES = ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'YT', 'NU']

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

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-800 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand'

export default function EditListingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [fieldId, setFieldId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    province: 'ON',
    postal_code: '',
    field_types: [],
    num_fields: '',
    typical_capacity: '',
    rentals_available: false,
    rental_pricing: '',
    pricing: '',
    hours: {},
    seasonal_start: '',
    seasonal_end: '',
    phone: '',
    website: '',
    description: '',
  })

  // Track original address to know if re-geocoding is needed
  const [originalAddress, setOriginalAddress] = useState('')

  useEffect(() => {
    if (!user) return
    async function fetchField() {
      try {
        const { data, error } = await supabase
          .from('fields')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle()

        if (error) { setError(error.message); return }
        if (!data) { setError('No field found for your account.'); return }

        setFieldId(data.id)
        const addr = data.address ?? ''
        setOriginalAddress(`${addr}|${data.city}|${data.province}|${data.postal_code ?? ''}`)
        setForm({
          name: data.name ?? '',
          address: addr,
          city: data.city ?? '',
          province: data.province ?? 'ON',
          postal_code: data.postal_code ?? '',
          field_types: data.field_types ?? [],
          num_fields: data.num_fields?.toString() ?? '',
          typical_capacity: data.typical_capacity?.toString() ?? '',
          rentals_available: data.rentals_available ?? false,
          rental_pricing: data.rental_pricing ?? '',
          pricing: data.pricing ?? '',
          hours: data.hours ?? {},
          seasonal_start: data.seasonal_start ?? '',
          seasonal_end: data.seasonal_end ?? '',
          phone: data.phone ?? '',
          website: data.website ?? '',
          description: data.description ?? '',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchField()
  }, [user])

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleFieldType(type) {
    set('field_types', form.field_types.includes(type)
      ? form.field_types.filter((t) => t !== type)
      : [...form.field_types, type]
    )
  }

  function setHour(day, patch) {
    set('hours', { ...form.hours, [day]: { ...form.hours[day], ...patch } })
  }

  async function handleSave() {
    setError(null)
    if (!form.name.trim()) { setError('Field name is required.'); return }
    if (!form.address.trim() || !form.city.trim() || !form.postal_code.trim()) {
      setError('Street address, city, and postal code are required.')
      return
    }
    if (form.field_types.length === 0) { setError('Select at least one field type.'); return }

    setSaving(true)

    // Re-geocode only if address changed
    const currentAddress = `${form.address}|${form.city}|${form.province}|${form.postal_code}`
    let geoUpdate = {}
    if (currentAddress !== originalAddress && form.address.trim()) {
      const { lat, lng } = await geocodeAddress(form.address.trim(), form.city.trim(), form.province, form.postal_code.trim())
      geoUpdate = { lat, lng }
    }

    const { error } = await supabase
      .from('fields')
      .update({
        name: form.name.trim(),
        address: form.address.trim() || null,
        city: form.city.trim(),
        province: form.province,
        postal_code: form.postal_code.trim() || null,
        field_types: [...new Set(form.field_types)],
        num_fields: form.num_fields ? parseInt(form.num_fields, 10) : null,
        typical_capacity: form.typical_capacity ? parseInt(form.typical_capacity, 10) : null,
        rentals_available: form.rentals_available,
        rental_pricing: form.rental_pricing || null,
        pricing: form.pricing || null,
        hours: form.hours,
        seasonal_start: form.seasonal_start || null,
        seasonal_end: form.seasonal_end || null,
        phone: form.phone || null,
        website: form.website || null,
        description: form.description || null,
        ...geoUpdate,
      })
      .eq('id', fieldId)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setOriginalAddress(currentAddress)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-100 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/owner-dashboard')}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
          >
            ←
          </button>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Owner Dashboard</p>
            <h1 className="text-lg font-bold text-gray-900">Edit listing</h1>
          </div>
        </div>

        {/* Field info */}
        <Section title="Field information">
          <Field label="Field name" required>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Combat Zone Paintball" className={inputCls} />
          </Field>

          <Field label="Field types" required>
            <div className="grid grid-cols-2 gap-2">
              {FIELD_TYPES.map((type) => {
                const selected = form.field_types.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleFieldType(type)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left ${
                      selected ? 'bg-brand/10 border-brand text-brand' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
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
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Number of fields">
              <input type="number" value={form.num_fields} onChange={(e) => set('num_fields', e.target.value)} placeholder="5" className={inputCls} />
            </Field>
            <Field label="Max group size">
              <input type="number" value={form.typical_capacity} onChange={(e) => set('typical_capacity', e.target.value)} placeholder="40" className={inputCls} />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={4}
              placeholder="Tell players what makes your field special…"
              className={`${inputCls} resize-none`}
            />
          </Field>
        </Section>

        {/* Location */}
        <Section title="Location">
          <Field label="Street address" required>
            <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Field Road" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" required>
              <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Woodstock" className={inputCls} />
            </Field>
            <Field label="Province" required>
              <select value={form.province} onChange={(e) => set('province', e.target.value)} className={`${inputCls} bg-white`}>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Postal code" required>
              <input
                type="text"
                value={form.postal_code}
                onChange={(e) => set('postal_code', e.target.value.toUpperCase())}
                placeholder="N4S 1A1"
                maxLength={7}
                className={inputCls}
              />
            </Field>
            <Field label="Country">
              <input type="text" value="Canada" readOnly className={`${inputCls} bg-gray-50 text-gray-400 cursor-default`} />
            </Field>
          </div>
          <p className="text-xs text-gray-400">Saving a new address will re-pin your field on the map.</p>
        </Section>

        {/* Hours */}
        <Section title="Hours">
          <div className="space-y-2">
            {DAYS.map((day) => {
              const val = form.hours[day]
              const isOpen = val && !val.closed
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-8 text-sm text-gray-600 flex-shrink-0">{day}</span>
                  <label className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={!!isOpen}
                      onChange={(e) => setHour(day, e.target.checked ? { open: '09:00', close: '17:00', closed: undefined } : { closed: true })}
                      className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <span className="text-xs text-gray-500">Open</span>
                  </label>
                  {isOpen ? (
                    <>
                      <input
                        type="time"
                        value={val?.open ?? '09:00'}
                        onChange={(e) => setHour(day, { open: e.target.value })}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand/30"
                      />
                      <span className="text-xs text-gray-400">–</span>
                      <input
                        type="time"
                        value={val?.close ?? '17:00'}
                        onChange={(e) => setHour(day, { close: e.target.value })}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand/30"
                      />
                    </>
                  ) : (
                    <span className="flex-1 text-xs text-gray-400 italic">Closed</span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Field label="Season start">
              <input type="date" value={form.seasonal_start} onChange={(e) => set('seasonal_start', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Season end">
              <input type="date" value={form.seasonal_end} onChange={(e) => set('seasonal_end', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Pricing & Contact */}
        <Section title="Pricing & contact">
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
            <input
              type="checkbox"
              id="rentals"
              checked={form.rentals_available}
              onChange={(e) => set('rentals_available', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <label htmlFor="rentals" className="text-sm font-medium text-gray-700 cursor-pointer">Rental gear available</label>
          </div>

          {form.rentals_available && (
            <Field label="Rental pricing / gear details">
              <input type="text" value={form.rental_pricing} onChange={(e) => set('rental_pricing', e.target.value)} placeholder="e.g. Full kit $25 · Markers only $15" className={inputCls} />
            </Field>
          )}

          <Field label="Session pricing">
            <input type="text" value={form.pricing} onChange={(e) => set('pricing', e.target.value)} placeholder="e.g. $30–55 per session" className={inputCls} />
          </Field>

          <Field label="Phone">
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(519) 555-0000" className={inputCls} />
          </Field>

          <Field label="Website">
            <input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://yourfield.ca" className={inputCls} />
          </Field>
        </Section>

        {/* Error / success */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
            ✓ Changes saved
          </div>
        )}

        {/* Save */}
        <div className="flex items-center gap-3 pb-8">
          <button
            onClick={() => navigate('/owner-dashboard')}
            className="px-5 py-3 border border-gray-300 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

      </div>
    </div>
  )
}
