'use client';
import styles from './Avatar.module.css';
import type { AvatarState } from '@/lib/tutor/store';

interface AngelaAvatarProps {
  state: AvatarState;
  size?: 'sm' | 'md' | 'lg';
  /** Texto leído por screen readers; debe describir el estado. */
  ariaLabel: string;
}

const SIZE_PX: Record<NonNullable<AngelaAvatarProps['size']>, number> = {
  sm: 48,
  md: 96,
  lg: 144
};

/**
 * SVG inline con 4 estados controlados por className (ver Avatar.module.css).
 * Geometría: cara redondeada teal sobre fondo, boca arco, dos ojos. Los
 * estados emocionales completos del AI_TUTOR_SPEC §2.2 son Epic 03.
 */
export function AngelaAvatar({ state, size = 'md', ariaLabel }: AngelaAvatarProps) {
  const px = SIZE_PX[size];
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`${styles.avatar} ${styles[state]}`}
      style={{ width: px, height: px }}
    >
      <svg viewBox="0 0 96 96" width={px} height={px} aria-hidden>
        <defs>
          <linearGradient id="angelaBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        {/* Sparkles (visibles en celebrating) */}
        <g className={styles.sparkles}>
          <text x="6" y="22" fontSize="14">
            ✨
          </text>
          <text x="74" y="86" fontSize="14">
            ✨
          </text>
        </g>

        {/* Body */}
        <g className={styles.body}>
          <rect
            x="14"
            y="22"
            width="68"
            height="62"
            rx="34"
            fill="url(#angelaBody)"
            stroke="#0f766e"
            strokeWidth="2"
          />
          {/* Eyes */}
          <circle cx="34" cy="46" r="6" fill="#0f172a" />
          <circle cx="62" cy="46" r="6" fill="#0f172a" />
          <circle cx="36" cy="44" r="2" fill="#ffffff" />
          <circle cx="64" cy="44" r="2" fill="#ffffff" />
          {/* Cheeks */}
          <circle cx="28" cy="60" r="3" fill="#fb7185" opacity="0.6" />
          <circle cx="68" cy="60" r="3" fill="#fb7185" opacity="0.6" />
          {/* Mouth */}
          <path
            className={styles.mouth}
            d="M 38 64 Q 48 72 58 64"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Thinking dots (visibles en thinking) */}
        <g className={styles.thinkDots}>
          <circle cx="78" cy="18" r="3.5" fill="#0f172a" />
          <circle cx="86" cy="11" r="2.5" fill="#0f172a" />
          <circle cx="92" cy="6" r="1.8" fill="#0f172a" />
        </g>
      </svg>
    </div>
  );
}
