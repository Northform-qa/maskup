import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Discover' },
  { to: '/events', label: 'Events' },
  { to: '/owners', label: 'Owners' },
  { to: '/about', label: 'About' },
]

export default function NavBar() {
  const { pathname } = useLocation()

  return (
    <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand inline-block" />
          <span className="font-bold text-brand tracking-tight text-lg">Maskup</span>
        </Link>
        <div className="flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                pathname === link.to ? 'text-brand' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Postal code, city, or field name"
            className="w-72 pl-4 pr-10 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand/30 bg-gray-50"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">⌘K</span>
        </div>
        <Link
          to="/register"
          className="px-4 py-1.5 bg-brand text-white text-sm font-medium rounded-full hover:bg-brand-dark transition-colors"
        >
          List your field
        </Link>
        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold">
          JK
        </div>
      </div>
    </nav>
  )
}
