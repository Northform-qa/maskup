import { Link } from 'react-router-dom'
import shieldIcon from '../assets/logos/green/Shield Icon Only.svg'
import { getHeroState } from '../lib/heroPhotoState'

// compact=true → thumbnail mode: shield icon only, no text or CTA (for list thumbnails)
export default function HeroPhoto({ className = '', field = null, currentUser = null, compact = false }) {
  const state = getHeroState(field, currentUser)

  return (
    <div className={`bg-cream-100 flex flex-col items-center justify-center gap-2 ${className}`}>
      <img
        src={shieldIcon}
        alt=""
        className={`opacity-60 ${compact ? 'w-8 h-8' : 'w-16 h-16'}`}
      />

      {!compact && state === 'A' && (
        <>
          <p className="text-xs text-gray-500 font-medium">Is this your field?</p>
          <Link
            to="/register"
            className="text-xs text-brand font-semibold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            List it free on MaskUp →
          </Link>
        </>
      )}

      {!compact && state === 'B' && (
        <Link
          to="/register"
          className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Claim this listing
        </Link>
      )}

      {!compact && state === 'C' && (
        <p className="text-xs text-gray-400">Photo coming soon</p>
      )}
    </div>
  )
}
