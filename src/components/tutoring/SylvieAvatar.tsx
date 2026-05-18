'use client';

import type { SylvieState } from '@/lib/tutor/sylvie-state';

/**
 * SylvieAvatar — cara kawaii de la tutora AI de MIDSEA Academy.
 *
 * Implementacion v1: SVG + CSS keyframes (no Lottie). Cuando lleguen assets
 * `.json` reales podemos swap del render interno manteniendo este API:
 *   <SylvieAvatar state="idle" size="md" />
 *
 * Estados (AI_TUTOR_SPEC seccion 2.2):
 *   - idle:        breathing sutil, parpadeo ocasional
 *   - active:      ojos abiertos, alerta
 *   - suggesting:  pulse + ojos pendientes, listo para ofrecer pista
 *   - explaining:  3 puntos de "pensando" sobre la cabeza
 *   - celebrating: bounce con sparkles dorados
 *   - resting:     ojos cerrados, Zzz flotando
 *
 * Sizes via wrapper Tailwind: sm = 40px, md = 64px, lg = 96px.
 */
export function SylvieAvatar({
  state = 'idle',
  size = 'md',
  onClick,
  className = '',
  ariaLabel
}: {
  state?: SylvieState;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  const sizeClass =
    size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-24 w-24' : 'h-16 w-16';

  const isClickable = Boolean(onClick);
  const showThinking = state === 'explaining';
  const showSparkles = state === 'celebrating';
  const showZzz = state === 'resting';
  const eyesClosed = state === 'resting';
  const mouth =
    state === 'celebrating'
      ? 'M40 64 Q50 78 60 64'
      : state === 'suggesting'
        ? 'M40 67 Q50 70 60 67'
        : state === 'explaining'
          ? 'M44 68 Q50 70 56 68'
          : 'M40 66 Q50 73 60 66';

  const breatheClass =
    state === 'idle' ? 'animate-breathe' : state === 'celebrating' ? 'animate-bounceSoft' : '';

  const auraOpacity =
    state === 'suggesting' ? 'opacity-90' : state === 'celebrating' ? 'opacity-100' : 'opacity-60';

  const Wrapper = isClickable ? 'button' : 'div';

  return (
    <Wrapper
      type={isClickable ? 'button' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative inline-grid place-items-center ${sizeClass} ${
        isClickable
          ? 'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon focus-visible:ring-offset-2'
          : ''
      } ${className}`}
    >
      {/* Pulse exterior cuando Sylvie esta sugiriendo (AI_TUTOR_SPEC 6.3 — pulse animation) */}
      {state === 'suggesting' ? (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-midsea-coral/40 animate-ripple"
        />
      ) : null}

      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={!ariaLabel}
        className={`relative h-full w-full ${breatheClass}`}
      >
        <defs>
          <radialGradient id="sylvie-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sylvie-face" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD46F" />
            <stop offset="100%" stopColor="#F9B21C" />
          </linearGradient>
          <radialGradient id="sylvie-shine" cx="35%" cy="30%" r="35%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* aura */}
        <circle cx="50" cy="50" r="49" fill="url(#sylvie-aura)" className={auraOpacity} />

        {/* face */}
        <circle cx="50" cy="50" r="36" fill="url(#sylvie-face)" />

        {/* shine */}
        <circle cx="50" cy="50" r="36" fill="url(#sylvie-shine)" />

        {/* cheeks */}
        <ellipse cx="29" cy="62" rx="5" ry="3.5" fill="#FF9FB1" opacity="0.75" />
        <ellipse cx="71" cy="62" rx="5" ry="3.5" fill="#FF9FB1" opacity="0.75" />

        {/* eyes — open vs closed */}
        {eyesClosed ? (
          <g stroke="#000000" strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M34 52 Q38 56 42 52" />
            <path d="M58 52 Q62 56 66 52" />
          </g>
        ) : (
          <g style={{ transformOrigin: '50% 52%' }} className="animate-blink">
            <g>
              <ellipse cx="38" cy="52" rx="3.6" ry="5.2" fill="#000000" />
              <circle cx="39.2" cy="50" r="1.3" fill="#FFFFFF" />
              <circle cx="37.4" cy="54" r="0.7" fill="#FFFFFF" />
            </g>
            <g>
              <ellipse cx="62" cy="52" rx="3.6" ry="5.2" fill="#000000" />
              <circle cx="63.2" cy="50" r="1.3" fill="#FFFFFF" />
              <circle cx="61.4" cy="54" r="0.7" fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* mouth */}
        <path
          d={mouth}
          stroke="#000000"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill={state === 'celebrating' ? '#000000' : 'none'}
        />

        {/* thinking dots (explaining) */}
        {showThinking ? (
          <g fill="#1800AA">
            <circle cx="34" cy="14" r="2.2" className="animate-thinkDot" style={{ animationDelay: '0s' }} />
            <circle cx="50" cy="10" r="2.2" className="animate-thinkDot" style={{ animationDelay: '0.2s' }} />
            <circle cx="66" cy="14" r="2.2" className="animate-thinkDot" style={{ animationDelay: '0.4s' }} />
          </g>
        ) : null}

        {/* sparkles (celebrating) */}
        {showSparkles ? (
          <g fill="#F9B21C">
            <path
              d="M 14 26 L 16 22 L 18 26 L 22 28 L 18 30 L 16 34 L 14 30 L 10 28 Z"
              className="animate-sparkleSpin"
              style={{ animationDelay: '0s' }}
            />
            <path
              d="M 82 22 L 84 18 L 86 22 L 90 24 L 86 26 L 84 30 L 82 26 L 78 24 Z"
              className="animate-sparkleSpin"
              style={{ animationDelay: '0.4s' }}
            />
            <path
              d="M 50 8 L 51.5 4 L 53 8 L 57 10 L 53 12 L 51.5 16 L 50 12 L 46 10 Z"
              className="animate-sparkleSpin"
              style={{ animationDelay: '0.8s' }}
            />
          </g>
        ) : null}

        {/* Zzz (resting) */}
        {showZzz ? (
          <g fill="#1800AA" className="animate-zzzFloat">
            <text x="68" y="22" fontSize="14" fontWeight="700">
              z
            </text>
            <text x="78" y="14" fontSize="10" fontWeight="700">
              z
            </text>
          </g>
        ) : null}
      </svg>
    </Wrapper>
  );
}
