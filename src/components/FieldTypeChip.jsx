const COLOR_MAP = {
  Woodball: 'bg-green-100 text-green-800',
  Scenario: 'bg-amber-100 text-amber-800',
  Speedball: 'bg-blue-100 text-blue-800',
  Hyperball: 'bg-purple-100 text-purple-800',
  Indoor: 'bg-gray-100 text-gray-700',
  'Big games': 'bg-red-100 text-red-700',
  'Private bookings': 'bg-indigo-100 text-indigo-700',
}

export default function FieldTypeChip({ type, small = false }) {
  const color = COLOR_MAP[type] ?? 'bg-gray-100 text-gray-700'
  return (
    <span
      className={`inline-block rounded-full font-medium ${color} ${
        small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      }`}
    >
      {type}
    </span>
  )
}
