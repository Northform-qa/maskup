import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY')!

const OWM_ICON_EMOJI: Record<string, string> = {
  '01': '☀️',
  '02': '🌤️',
  '03': '⛅',
  '04': '☁️',
  '09': '🌧️',
  '10': '🌦️',
  '11': '⛈️',
  '13': '🌨️',
  '50': '🌫️',
}

function iconToEmoji(icon: string): string {
  return OWM_ICON_EMOJI[icon.slice(0, 2)] ?? '🌡️'
}

// Derive precipitation probability from current weather API response.
// The /weather endpoint doesn't give pop directly — we infer from weather ID and rain/snow volumes.
function getPrecipChance(data: Record<string, unknown>): number {
  const rain = (data.rain as Record<string, number> | undefined)?.['1h'] ?? 0
  const snow = (data.snow as Record<string, number> | undefined)?.['1h'] ?? 0
  if (rain > 0 || snow > 0) {
    return Math.min(100, Math.round((rain + snow) * 40))
  }
  const weather = data.weather as Array<{ id: number }>
  const id = weather?.[0]?.id ?? 800
  if (id >= 200 && id < 300) return 90
  if (id >= 300 && id < 400) return 60
  if (id >= 500 && id < 600) return 80
  if (id >= 600 && id < 700) return 70
  if (id >= 700 && id < 800) return 20
  if (id === 800) return 0
  const clouds = (data.clouds as Record<string, number> | undefined)?.all ?? 0
  return Math.round(clouds / 3)
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: fields, error: fetchError } = await supabase
    .from('fields')
    .select('id, lat, lng')
    .eq('listing_status', 'published')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  const results: unknown[] = []

  for (const field of fields ?? []) {
    try {
      const url =
        `https://api.openweathermap.org/data/2.5/weather` +
        `?lat=${field.lat}&lon=${field.lng}&appid=${OPENWEATHER_API_KEY}&units=metric`

      const res = await fetch(url)
      const json = await res.json()

      if (!res.ok) {
        results.push({ id: field.id, error: json.message ?? 'OWM error' })
        continue
      }

      const weather = json.weather as Array<{ description: string; icon: string }>
      const main = json.main as { temp: number }

      const patch = {
        weather_temp_c: Math.round(main.temp),
        weather_condition: weather[0].description,
        weather_icon: iconToEmoji(weather[0].icon),
        weather_precip_chance: getPrecipChance(json),
        weather_last_fetched: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('fields')
        .update(patch)
        .eq('id', field.id)

      results.push({ id: field.id, error: updateError?.message ?? null, ...patch })
    } catch (e) {
      results.push({ id: field.id, error: (e as Error).message })
    }
  }

  return new Response(
    JSON.stringify({ updated: results.length, results }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
