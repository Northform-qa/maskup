export default function StarRating({ rating, count, size = 'sm' }) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const starSize = size === 'sm' ? 'text-sm' : 'text-base'

  return (
    <div className={`flex items-center gap-1 ${textSize}`}>
      <span className={`${starSize} text-yellow-400`}>★</span>
      <span className="font-semibold text-gray-800">{rating?.toFixed(1)}</span>
      {count != null && <span className="text-gray-400">({count})</span>}
    </div>
  )
}
