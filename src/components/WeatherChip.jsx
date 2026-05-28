const TWO_HOURS_MS = 2 * 60 * 60 * 1000

function isFresh(lastFetched) {
  if (!lastFetched) return false
  return Date.now() - new Date(lastFetched).getTime() < TWO_HOURS_MS
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export default function WeatherChip({ field, variant = 'card', className = '' }) {
  const isIndoor = field.field_types?.includes('Indoor')
  const fresh = isFresh(field.weather_last_fetched)

  if (variant === 'detail') {
    if (isIndoor) {
      return <p className="text-sm text-gray-400">Indoor — weather not a factor</p>
    }
    if (!fresh) {
      return <p className="text-sm text-gray-400">Weather data unavailable</p>
    }
    return (
      <p className="text-sm text-gray-700">
        {field.weather_icon} {capitalize(field.weather_condition)} · {field.weather_temp_c}°C · {field.weather_precip_chance}% chance of precipitation
      </p>
    )
  }

  // card variant
  if (isIndoor || !fresh) return null

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700 ${className}`}>
      {field.weather_icon} {field.weather_temp_c}°C
    </span>
  )
}
