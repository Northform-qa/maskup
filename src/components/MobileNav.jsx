import { Link, useLocation } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Discover', icon: '🗺️' },
  { to: '/directory', label: 'Fields', icon: '⚡' },
  { to: '/favourites', label: 'Favourites', icon: '♡' },
  { to: '/owner-dashboard', label: 'You', icon: '👤' },
]

export default function MobileNav() {
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50 flex">
      {TABS.map((tab) => {
        const active = pathname === tab.to
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              active ? 'text-brand' : 'text-gray-400'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
