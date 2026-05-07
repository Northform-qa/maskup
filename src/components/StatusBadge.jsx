export default function StatusBadge({ status }) {
  if (status === 'open') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-brand">
        <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
        Open now
      </span>
    )
  }
  if (status === 'rain_delay') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        <span className="text-sm">☁️</span>
        Rain delay
      </span>
    )
  }
  if (status === 'closed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        Closed
      </span>
    )
  }
  return null
}
