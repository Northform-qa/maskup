import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import compactLockup from '../assets/logos/green/Compact Horizontal Lockup.svg'

const STATIC_TABS = [
  { to: '/', label: 'Discover', icon: '🗺️' },
  { to: '/events', label: 'Events', icon: '⚡' },
  { to: '/favourites', label: 'Favourites', icon: '♡' },
]

export default function MobileNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const youTo = user ? '/profile' : '/login'

  return (
    <>
      <header className="md:hidden fixed top-0 inset-x-0 bg-white border-b border-gray-200 z-50 flex items-center justify-center h-12">
        <Link to="/">
          <img src={compactLockup} alt="MaskUp.gg" className="h-9 w-auto" />
        </Link>
      </header>
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50 flex">
      {STATIC_TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
            pathname === tab.to ? 'text-brand' : 'text-gray-400'
          }`}
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
      <Link
        to={youTo}
        className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
          pathname === youTo ? 'text-brand' : 'text-gray-400'
        }`}
      >
        <span className="text-lg leading-none">👤</span>
        <span>Me</span>
      </Link>
    </nav>
    </>
  )
}
