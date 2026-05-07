export default function HeroPhoto({ label = 'FIELD PHOTO', className = '' }) {
  return (
    <div
      className={`bg-cream-200 flex items-center justify-center text-gray-400 text-xs font-medium tracking-widest uppercase ${className}`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)',
      }}
    >
      {label}
    </div>
  )
}
