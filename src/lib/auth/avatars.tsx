// Set fijo de avatares para perfiles de estudiantes. Epic 01 §3b — el padre
// asigna uno al crear el perfil; el niño lo reconoce visualmente al loguear.
// 8 opciones de animales (universalmente reconocibles K-2, sin texto).
// Render: SVG inline (cero deps, accesible via aria-label).

export const AVATARS = ['fox', 'owl', 'cat', 'dog', 'panda', 'lion', 'fish', 'rabbit'] as const;
export type AvatarKey = (typeof AVATARS)[number];

export function isAvatarKey(value: unknown): value is AvatarKey {
  return typeof value === 'string' && (AVATARS as readonly string[]).includes(value);
}

interface AvatarPalette {
  bg: string;
  fg: string;
  accent: string;
}

const PALETTE: Record<AvatarKey, AvatarPalette> = {
  fox: { bg: '#F9B21C', fg: '#1800AA', accent: '#FFFFFF' },
  owl: { bg: '#0D9488', fg: '#FCD46F', accent: '#FFFFFF' },
  cat: { bg: '#FF9FB1', fg: '#1800AA', accent: '#FFFFFF' },
  dog: { bg: '#FCD46F', fg: '#000000', accent: '#FFFFFF' },
  panda: { bg: '#FFFFFF', fg: '#000000', accent: '#0D9488' },
  lion: { bg: '#F9B21C', fg: '#7A4F00', accent: '#FFFFFF' },
  fish: { bg: '#0D9488', fg: '#FFFFFF', accent: '#F9B21C' },
  rabbit: { bg: '#EEF1FF', fg: '#1800AA', accent: '#FF9FB1' }
};

export function paletteFor(key: AvatarKey): AvatarPalette {
  return PALETTE[key];
}

// Shapes minimas que sugieren al animal (orejas/forma de cabeza). No queremos
// recargarse en detalles — el palette y la silueta hacen el trabajo.
// Cada SVG asume viewBox 0 0 100 100.
interface AvatarShape {
  ears: string; // path del par de orejas o accesorio superior
  faceR: number; // radio cara
  eyes: 'round' | 'oval' | 'happy';
  mouth: 'smile' | 'beak' | 'fish' | 'whiskers';
}

const SHAPE: Record<AvatarKey, AvatarShape> = {
  fox: { ears: 'M 28 28 L 35 12 L 45 26 Z M 72 28 L 65 12 L 55 26 Z', faceR: 32, eyes: 'oval', mouth: 'smile' },
  owl: { ears: 'M 30 26 L 38 16 L 44 28 Z M 70 26 L 62 16 L 56 28 Z', faceR: 34, eyes: 'round', mouth: 'beak' },
  cat: { ears: 'M 30 28 L 32 14 L 46 26 Z M 70 28 L 68 14 L 54 26 Z', faceR: 32, eyes: 'oval', mouth: 'whiskers' },
  dog: { ears: 'M 22 38 Q 18 22 32 24 L 36 38 Z M 78 38 Q 82 22 68 24 L 64 38 Z', faceR: 32, eyes: 'round', mouth: 'smile' },
  panda: { ears: 'M 28 30 a 8 8 0 1 1 0.01 0 Z M 72 30 a 8 8 0 1 1 0.01 0 Z', faceR: 33, eyes: 'happy', mouth: 'smile' },
  lion: { ears: 'M 18 50 a 6 6 0 1 1 0.01 0 Z M 82 50 a 6 6 0 1 1 0.01 0 Z', faceR: 30, eyes: 'oval', mouth: 'smile' },
  fish: { ears: 'M 84 50 L 96 38 L 96 62 Z', faceR: 30, eyes: 'round', mouth: 'fish' },
  rabbit: { ears: 'M 38 24 a 5 12 0 1 1 0.01 0 Z M 62 24 a 5 12 0 1 1 0.01 0 Z', faceR: 30, eyes: 'oval', mouth: 'smile' }
};

function eyesNode(eyes: AvatarShape['eyes'], fg: string) {
  if (eyes === 'happy') {
    return (
      <g stroke={fg} strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M 38 50 Q 42 46 46 50" />
        <path d="M 54 50 Q 58 46 62 50" />
      </g>
    );
  }
  const rx = eyes === 'round' ? 3.5 : 3;
  const ry = eyes === 'round' ? 3.5 : 4.5;
  return (
    <g fill={fg}>
      <ellipse cx="40" cy="50" rx={rx} ry={ry} />
      <ellipse cx="60" cy="50" rx={rx} ry={ry} />
    </g>
  );
}

function mouthNode(mouth: AvatarShape['mouth'], fg: string) {
  switch (mouth) {
    case 'beak':
      return <path d="M 45 60 L 55 60 L 50 68 Z" fill="#F9B21C" stroke={fg} strokeWidth="1.2" />;
    case 'fish':
      return <path d="M 44 62 Q 50 58 56 62 Q 50 66 44 62 Z" fill={fg} />;
    case 'whiskers':
      return (
        <g stroke={fg} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M 47 62 Q 50 65 53 62" />
          <line x1="30" y1="60" x2="38" y2="61" />
          <line x1="62" y1="61" x2="70" y2="60" />
          <line x1="30" y1="64" x2="38" y2="63" />
          <line x1="62" y1="63" x2="70" y2="64" />
        </g>
      );
    case 'smile':
    default:
      return <path d="M 44 60 Q 50 66 56 60" stroke={fg} strokeWidth="2" fill="none" strokeLinecap="round" />;
  }
}

export function AvatarSvg({
  avatar,
  className,
  size = 80,
  label
}: {
  avatar: AvatarKey;
  className?: string;
  size?: number;
  label?: string;
}) {
  const p = paletteFor(avatar);
  const s = SHAPE[avatar];
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={label ?? avatar}
    >
      <circle cx="50" cy="50" r="48" fill={p.accent} />
      <circle cx="50" cy="50" r={s.faceR + 6} fill={p.bg} />
      <path d={s.ears} fill={p.bg} stroke={p.fg} strokeWidth="1.2" />
      <circle cx="50" cy="50" r={s.faceR} fill={p.bg} stroke={p.fg} strokeWidth="1.5" />
      {eyesNode(s.eyes, p.fg)}
      {mouthNode(s.mouth, p.fg)}
    </svg>
  );
}
