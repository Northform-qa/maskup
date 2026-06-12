/**
 * One-time utility: geocodes all fields with null lat/lng via Mapbox
 * and writes coordinates back to Supabase via the REST API.
 *
 * Usage:  node scripts/geocode-fields.js
 *
 * Reads VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN
 * from .env.local — never commit credentials.
 *
 * Safe to re-run — only updates fields where lat IS NULL OR lng IS NULL.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env.local ───────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

function parseEnvFile(filePath) {
  const env = {}
  const lines = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '').trim()
    env[key] = val
  }
  return env
}

const env = parseEnvFile(envPath)
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY
const MAPBOX_TOKEN = env.VITE_MAPBOX_TOKEN

if (!SUPABASE_URL || !SUPABASE_KEY || !MAPBOX_TOKEN) {
  console.error('Missing required env vars. Check .env.local for VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN.')
  process.exit(1)
}

console.log(`Supabase URL : ${SUPABASE_URL}`)
console.log(`Mapbox token : ${MAPBOX_TOKEN.slice(0, 8)}… (${MAPBOX_TOKEN.length} chars)`)
console.log()

// ── Supabase REST helpers (no SDK — avoids Node fetch compat issues) ──
const SUPA_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

async function getFieldsMissingCoords() {
  const url = `${SUPABASE_URL}/rest/v1/fields?select=id,name,address,city,province&or=(lat.is.null,lng.is.null)&order=name`
  const res = await fetch(url, { headers: SUPA_HEADERS })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  return res.json()
}

// ── Mapbox geocoding ──────────────────────────────────────────
async function geocode(address, city, province) {
  const query = `${address}, ${city}, ${province}, Canada`
  const encoded = encodeURIComponent(query)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&country=CA&limit=1`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Mapbox ${res.status} ${res.statusText}`)

  const json = await res.json()
  const feature = json.features?.[0]
  if (!feature) return null

  const [lng, lat] = feature.geometry.coordinates
  return { lat, lng, place_name: feature.place_name }
}

// ── Helpers ───────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('Fetching fields with missing coordinates…\n')

  let fields
  try {
    fields = await getFieldsMissingCoords()
  } catch (err) {
    console.error('Failed to fetch fields:', err.message)
    if (err.cause) console.error('Cause:', err.cause)
    process.exit(1)
  }

  if (!fields.length) {
    console.log('No fields with missing coordinates. Nothing to do.')
    return
  }

  console.log(`Found ${fields.length} field(s) to geocode.\n`)

  let succeeded = 0
  let failed = 0

  const sqlLines = []

  for (const field of fields) {
    const addressStr = `${field.address}, ${field.city}, ${field.province}, Canada`
    process.stdout.write(`Geocoding: ${field.name} (${addressStr}) … `)

    try {
      const result = await geocode(field.address, field.city, field.province)

      if (!result) {
        console.log('NO RESULT')
        console.warn(`  ⚠  No geocoding result for: ${addressStr}`)
        failed++
      } else {
        console.log(`✓  lat: ${result.lat.toFixed(5)}, lng: ${result.lng.toFixed(5)}`)
        console.log(`     Matched: ${result.place_name}`)
        sqlLines.push(`UPDATE public.fields SET lat = ${result.lat}, lng = ${result.lng} WHERE id = '${field.id}'; -- ${field.name}`)
        succeeded++
      }
    } catch (err) {
      console.log('ERROR')
      console.error(`  ✗  ${field.name}: ${err.message}`)
      failed++
    }

    await sleep(200)
  }

  console.log('\n─────────────────────────────────────────')
  console.log(`Done. ${succeeded} geocoded successfully, ${failed} failed.`)

  if (sqlLines.length > 0) {
    console.log('\n── Paste this into the Supabase SQL editor ──────────────\n')
    console.log(sqlLines.join('\n'))
    console.log('\n──────────────────────────────────────────────────────────')
  }

  if (failed > 0) {
    console.log('\nFields marked ⚠ or ✗ returned no result — set coordinates manually.')
  }
}

main()
