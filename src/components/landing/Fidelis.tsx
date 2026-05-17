// Fidelis — globo terraqueo kawaii, mascota de MIDSEA Academy. Placeholder
// SVG (sin assets externos) con la paleta oficial: azul profundo + teal de
// fondo, mejillas rosadas, ojos con sparkle, sonrisa sutil. Diseñado para
// quedar bien en el hero a 320-480px de ancho.

export function Fidelis({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Fidelis"
      className={className}
    >
      <defs>
        <radialGradient id="fidelis-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0D9488" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fidelis-globe" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="55%" stopColor="#1800AA" />
          <stop offset="100%" stopColor="#1800AA" />
        </linearGradient>
        <radialGradient id="fidelis-shine" cx="35%" cy="30%" r="35%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* aura suave */}
      <circle cx="100" cy="100" r="95" fill="url(#fidelis-aura)" />

      {/* cuerpo del globo */}
      <circle cx="100" cy="100" r="68" fill="url(#fidelis-globe)" />

      {/* continentes abstractos (teal) */}
      <path
        d="M 48 92 C 55 78, 78 76, 84 95 C 89 110, 70 116, 58 110 Z"
        fill="#0D9488"
        opacity="0.55"
      />
      <path
        d="M 110 70 C 132 66, 144 84, 138 96 C 132 110, 110 105, 108 90 Z"
        fill="#0D9488"
        opacity="0.55"
      />
      <path
        d="M 86 130 C 100 122, 122 128, 126 138 C 118 150, 92 144, 86 134 Z"
        fill="#0D9488"
        opacity="0.5"
      />

      {/* shine / highlight */}
      <circle cx="100" cy="100" r="68" fill="url(#fidelis-shine)" />

      {/* ojos con sparkle */}
      <g>
        <ellipse cx="80" cy="100" rx="7.5" ry="10" fill="#000000" />
        <circle cx="82" cy="96" r="2.6" fill="#FFFFFF" />
        <circle cx="78" cy="103.5" r="1.2" fill="#FFFFFF" />
      </g>
      <g>
        <ellipse cx="120" cy="100" rx="7.5" ry="10" fill="#000000" />
        <circle cx="122" cy="96" r="2.6" fill="#FFFFFF" />
        <circle cx="118" cy="103.5" r="1.2" fill="#FFFFFF" />
      </g>

      {/* mejillas rosadas */}
      <ellipse cx="66" cy="120" rx="9" ry="5" fill="#FF9FB1" opacity="0.78" />
      <ellipse cx="134" cy="120" rx="9" ry="5" fill="#FF9FB1" opacity="0.78" />

      {/* sonrisa sutil */}
      <path
        d="M 88 128 Q 100 137 112 128"
        stroke="#000000"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* sparkles orbitando — naranja brand + teal */}
      <g fill="#F9B21C">
        <path d="M 24 30 L 27 24 L 30 30 L 36 33 L 30 36 L 27 42 L 24 36 L 18 33 Z" />
        <path d="M 166 46 L 168 42 L 170 46 L 173 48 L 170 50 L 168 54 L 166 50 L 163 48 Z" />
        <path d="M 30 168 L 32 165 L 34 168 L 37 170 L 34 172 L 32 175 L 30 172 L 27 170 Z" />
      </g>
      <g fill="#0D9488">
        <path d="M 176 162 L 178 158 L 180 162 L 184 164 L 180 166 L 178 170 L 176 166 L 172 164 Z" />
      </g>
    </svg>
  );
}
