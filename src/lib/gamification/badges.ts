/**
 * Catalogo de logros v1 — sincronizado con la tabla Badge (code = clave aqui).
 * Las reglas de unlock viven aqui para evaluarlas en server actions sin tocar la DB.
 */

export interface BadgeDef {
  code: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  iconKey: string;
  rewardCoin: number;
}

export const BADGES: readonly BadgeDef[] = [
  {
    code: 'first-wave',
    nameEs: 'Primera ola',
    nameEn: 'First wave',
    descriptionEs: 'Domina tu primera leccion en Midsea.',
    descriptionEn: 'Master your first lesson on Midsea.',
    iconKey: 'wave',
    rewardCoin: 50
  },
  {
    code: 'streak-7',
    nameEs: 'Marea constante',
    nameEn: 'Steady tide',
    descriptionEs: 'Aprende 7 dias seguidos.',
    descriptionEn: 'Learn 7 days in a row.',
    iconKey: 'tide',
    rewardCoin: 150
  },
  {
    code: 'math-navigator',
    nameEs: 'Navegante matematico',
    nameEn: 'Math navigator',
    descriptionEs: 'Domina 10 lecciones de matematicas.',
    descriptionEn: 'Master 10 math lessons.',
    iconKey: 'compass',
    rewardCoin: 200
  },
  {
    code: 'bilingual-explorer',
    nameEs: 'Explorador bilingue',
    nameEn: 'Bilingual explorer',
    descriptionEs: 'Completa una leccion en cada idioma.',
    descriptionEn: 'Complete a lesson in each language.',
    iconKey: 'globe',
    rewardCoin: 100
  }
] as const;

export interface BadgeEvalInput {
  totalMasteredLessons: number;
  masteredByLocale: { es: number; en: number };
  masteredBySubject: Record<string, number>;
  streakDays: number;
}

export function evaluateBadges(
  input: BadgeEvalInput,
  alreadyEarnedCodes: ReadonlySet<string>
): BadgeDef[] {
  const newly: BadgeDef[] = [];

  for (const badge of BADGES) {
    if (alreadyEarnedCodes.has(badge.code)) continue;
    if (matchesBadgeRule(badge.code, input)) newly.push(badge);
  }

  return newly;
}

function matchesBadgeRule(code: string, input: BadgeEvalInput): boolean {
  switch (code) {
    case 'first-wave':
      return input.totalMasteredLessons >= 1;
    case 'streak-7':
      return input.streakDays >= 7;
    case 'math-navigator':
      return (input.masteredBySubject['MATH'] ?? 0) >= 10;
    case 'bilingual-explorer':
      return input.masteredByLocale.es >= 1 && input.masteredByLocale.en >= 1;
    default:
      return false;
  }
}
