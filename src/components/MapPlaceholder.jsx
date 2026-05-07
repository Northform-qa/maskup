import { FIELDS } from '../data/mockData'

const PIN_POSITIONS = [
  { id: '1', x: 42, y: 38 },
  { id: '2', x: 18, y: 55 },
  { id: '3', x: 72, y: 22 },
  { id: '4', x: 55, y: 28 },
  { id: '5', x: 48, y: 45 },
  { id: '6', x: 60, y: 18 },
  { id: '7', x: 50, y: 60 },
]

export default function MapPlaceholder({ selectedId, onSelectPin, className = '' }) {
  return (
    <div className={`relative bg-[#e8ead3] overflow-hidden ${className}`}>
      {/* Grid lines to mimic map */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#888" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* Road lines */}
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#ccc" strokeWidth="2" />
        <line x1="35%" y1="0" x2="55%" y2="100%" stroke="#ccc" strokeWidth="1.5" />
        <ellipse cx="60%" cy="30%" rx="18%" ry="12%" fill="#c8d9e6" opacity="0.6" />
        <text x="56%" y="33%" fontSize="9" fill="#7a9eb8" textAnchor="middle">Lake Simcoe</text>
        <line x1="0" y1="65%" x2="45%" y2="50%" stroke="#bbb" strokeWidth="1" />
        <text x="18%" y="53%" fontSize="8" fill="#999" textAnchor="middle">101</text>
      </svg>

      {/* Map pins */}
      {PIN_POSITIONS.map((pin) => {
        const isSelected = pin.id === selectedId
        return (
          <button
            key={pin.id}
            onClick={() => onSelectPin?.(pin.id)}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-full cursor-pointer"
          >
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22s14-12.667 14-22C28 6.268 21.732 0 14 0z"
                fill={isSelected ? '#E53E3E' : '#3B6D11'}
              />
              <circle cx="14" cy="14" r="6" fill="white" />
              {isSelected && <circle cx="14" cy="14" r="3" fill="#E53E3E" />}
            </svg>
          </button>
        )
      })}

      {/* User location dot */}
      <div
        style={{ left: '43%', top: '52%' }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      >
        <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
      </div>

      {/* Scale label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/80 text-xs text-gray-500 px-2 py-0.5 rounded">
        Centered on · 60 km radius
      </div>

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-px">
        <button className="w-7 h-7 bg-white rounded-t shadow text-gray-600 text-sm font-bold flex items-center justify-center">+</button>
        <button className="w-7 h-7 bg-white shadow text-gray-600 text-sm font-bold flex items-center justify-center">−</button>
        <button className="w-7 h-7 bg-white rounded-b shadow text-gray-500 text-xs flex items-center justify-center">⊞</button>
      </div>
    </div>
  )
}
