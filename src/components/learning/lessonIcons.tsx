import type { ReactNode } from 'react';

// Íconos inline (equivalentes a Lucide: Play, BookOpen, ClipboardList, Check,
// Clock, Coins, Sparkles, ArrowLeft/Right). Inline para no agregar la
// dependencia lucide-react — mismo patrón que el resto del codebase.
// Heredan el color vía `currentColor`; el tamaño se controla con className.

type IconProps = { className?: string };

function Svg({ className = 'h-3.5 w-3.5', children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </Svg>
  );
}

export function BookOpenIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z" />
      <path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z" />
    </Svg>
  );
}

export function ClipboardListIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </Svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </Svg>
  );
}

export function CoinsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="9" cy="9" r="6" />
      <path d="M14.7 7.3A6 6 0 1 1 11 18.9" />
    </Svg>
  );
}

export function SparklesIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3l1.6 4.8L18 9.4l-4.4 1.6L12 16l-1.6-5L6 9.4l4.4-1.6z" />
    </Svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </Svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </Svg>
  );
}

// Equivalente al `FileDown` de Lucide (documento con flecha de descarga).
// Inline para no agregar lucide-react — mismo patrón que el resto del archivo.
export function FileDownIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="14 3 14 9 20 9" />
      <line x1="12" y1="12" x2="12" y2="17" />
      <polyline points="9 14 12 17 15 14" />
    </Svg>
  );
}
