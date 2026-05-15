export default function MaskUpLogo({ className = '' }) {
  return (
    <svg
      viewBox="20 10 52 68"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MaskUp logo mark"
      className={className}
    >
      {/* ball 1 — top */}
      <rect x="45" y="17.6" width="13" height="2.4" rx="1.2" fill="#3B6D11" />
      <rect x="45" y="21"   width="9"  height="2.4" rx="1.2" fill="#3B6D11" />
      <rect x="45" y="24.5" width="5"  height="2.4" rx="1.2" fill="#3B6D11" />
      <circle cx="32" cy="22" r="10" fill="#3B6D11" />
      <circle cx="27.8" cy="17.8" r="2.6" fill="#F5F2EB" />

      {/* ball 2 — centre */}
      <rect x="57" y="39.5" width="13" height="2.4" rx="1.2" fill="#3B6D11" />
      <rect x="57" y="43"   width="9"  height="2.4" rx="1.2" fill="#3B6D11" />
      <rect x="57" y="46.5" width="5"  height="2.4" rx="1.2" fill="#3B6D11" />
      <circle cx="44" cy="44" r="10" fill="#3B6D11" />
      <circle cx="39.8" cy="39.8" r="2.6" fill="#F5F2EB" />

      {/* ball 3 — bottom */}
      <rect x="45" y="61.5" width="13" height="2.4" rx="1.2" fill="#3B6D11" />
      <rect x="45" y="65"   width="9"  height="2.4" rx="1.2" fill="#3B6D11" />
      <rect x="45" y="68.5" width="5"  height="2.4" rx="1.2" fill="#3B6D11" />
      <circle cx="32" cy="66" r="10" fill="#3B6D11" />
      <circle cx="27.8" cy="61.8" r="2.6" fill="#F5F2EB" />
    </svg>
  )
}
