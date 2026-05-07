import { getActivePlayers } from '../data/mockData'

/**
 * Renders the crowd-sourced active players indicator using the display rules:
 * - null data → "No reports yet today"
 * - stale (>2h old) → "Last reported Xh ago" in muted text
 * - fresh → "~N players on-site · N reports · Updated Xm ago"
 *
 * size: 'sm' (field card) | 'md' (detail page)
 */
export default function ActivePlayers({ field, size = 'sm' }) {
  const info = getActivePlayers(field)

  if (info.type === 'none') {
    return (
      <span className={`inline-flex items-center gap-1 text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block flex-shrink-0" />
        {info.text}
      </span>
    )
  }

  if (info.type === 'stale') {
    return (
      <span className={`inline-flex items-center gap-1 text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 inline-block flex-shrink-0" />
        {info.text}
      </span>
    )
  }

  // fresh
  return (
    <span className={`inline-flex items-center gap-1 text-brand font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <span className="relative flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
        <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-brand animate-ping opacity-60" />
      </span>
      {info.text}
    </span>
  )
}
