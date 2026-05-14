const TWO_HOURS_MS = 2 * 60 * 60 * 1000

function isFresh(lastFetched) {
  if (!lastFetched) return false
  return Date.now() - new Date(lastFetched).getTime() < TWO_HOURS_MS
}

export default function WeatherChip({ field, className = '' }) {
  const isIndoor = field.field_types?.includes('Indoor')

  if (isIndoor) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 ${className}`}>
        🏠 Indoor — weather not a factor
      </span>
    )
  }

  if (!isFresh(field.weather_last_fetched)) return null

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700 ${className}`}>
      {field.weather_icon} {field.weather_temp_c}°C · {field.weather_precip_chance}% rain
    </span>
  )
}
