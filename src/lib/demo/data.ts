// Demo fixture data — usado por el modo demo (cookie midsea_demo_role) para
// renderizar parent/student dashboards SIN tocar Prisma. Replica el seed para
// que la UX sea consistente con la version real cuando la DB este conectada.

// Subjects: usamos los string literals del enum Prisma sin importarlos para
// que este archivo no dependa de @prisma/client. Las paginas mapean estos a
// labels via el namespace i18n `subjects`.
export type DemoSubject =
  | 'MATH'
  | 'LANGUAGE_ARTS'
  | 'SCIENCE'
  | 'SOCIAL_STUDIES'
  | 'FOREIGN_LANGUAGE'
  | 'ELECTIVE';

export type DemoLessonStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'MASTERED';

export const DEMO_PARENT_ID = 'demo-parent';
export const DEMO_FAMILY_ID = 'demo-family';
export const DEMO_ACTIVE_STUDENT_ID = 'demo-lucia';

export interface DemoFamily {
  id: string;
  name: string;
  locale: 'es' | 'en';
}

export const DEMO_FAMILY: DemoFamily = {
  id: DEMO_FAMILY_ID,
  name: 'Familia Demo',
  locale: 'es'
};

// Shape compatible con `requireParent` real (Parent + family include).
// El flag isDemo permite a las paginas elegir DB vs fixture sin reescribir
// todo el rendering.
export interface DemoParentContext {
  id: string;
  email: string;
  name: string;
  familyId: string;
  family: DemoFamily;
  isDemo: true;
  createdAt: Date;
}

export const DEMO_PARENT_CONTEXT: DemoParentContext = {
  id: DEMO_PARENT_ID,
  email: 'demo@midsea.app',
  name: 'Demo Parent',
  familyId: DEMO_FAMILY_ID,
  family: DEMO_FAMILY,
  isDemo: true,
  createdAt: new Date('2026-01-01')
};

export interface DemoStudent {
  id: string;
  displayName: string;
  gradeLevel: number;
  preferredLocale: 'es' | 'en';
  birthDate: Date;
  familyId: string;
}

export const DEMO_STUDENTS: DemoStudent[] = [
  {
    id: 'demo-lucia',
    displayName: 'Lucía',
    gradeLevel: 3,
    preferredLocale: 'es',
    birthDate: new Date('2017-06-15'),
    familyId: DEMO_FAMILY_ID
  },
  {
    id: 'demo-mateo',
    displayName: 'Mateo',
    gradeLevel: 5,
    preferredLocale: 'es',
    birthDate: new Date('2015-03-10'),
    familyId: DEMO_FAMILY_ID
  }
];

export const DEMO_ACTIVE_STUDENT: DemoStudent = DEMO_STUDENTS[0];

// Lessons + progress (Lucía) — espeja prisma/seed.mjs.
export interface DemoLesson {
  slug: string;
  titleEs: string;
  titleEn: string;
  subject: DemoSubject;
  gradeLevel: number;
  estMinutes: number;
  rewardNexos: number;
  orderIndex: number;
}

export const DEMO_LESSONS: DemoLesson[] = [
  {
    slug: 'addition-with-carrying',
    titleEs: 'Sumas con llevadas',
    titleEn: 'Addition with carrying',
    subject: 'MATH',
    gradeLevel: 3,
    estMinutes: 10,
    rewardNexos: 100,
    orderIndex: 0
  },
  {
    slug: 'improper-fractions',
    titleEs: 'Fracciones impropias',
    titleEn: 'Improper fractions',
    subject: 'MATH',
    gradeLevel: 3,
    estMinutes: 15,
    rewardNexos: 100,
    orderIndex: 1
  },
  {
    slug: 'treasure-island-ch-3',
    titleEs: 'Lectura: La isla del tesoro (cap. 3)',
    titleEn: 'Reading: Treasure Island (ch. 3)',
    subject: 'LANGUAGE_ARTS',
    gradeLevel: 3,
    estMinutes: 20,
    rewardNexos: 100,
    orderIndex: 2
  },
  {
    slug: 'water-cycle',
    titleEs: 'El ciclo del agua',
    titleEn: 'The water cycle',
    subject: 'SCIENCE',
    gradeLevel: 3,
    estMinutes: 12,
    rewardNexos: 100,
    orderIndex: 3
  }
];

export interface DemoProgress {
  slug: string;
  status: DemoLessonStatus;
  masteryPct: number;
  attempts: number;
  lastAttempt: Date | null;
}

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(today.getDate() - 3);

export const DEMO_LUCIA_PROGRESS: DemoProgress[] = [
  { slug: 'addition-with-carrying', status: 'MASTERED', masteryPct: 92, attempts: 2, lastAttempt: threeDaysAgo },
  { slug: 'improper-fractions', status: 'IN_PROGRESS', masteryPct: 45, attempts: 1, lastAttempt: today },
  { slug: 'treasure-island-ch-3', status: 'AVAILABLE', masteryPct: 0, attempts: 0, lastAttempt: null },
  { slug: 'water-cycle', status: 'AVAILABLE', masteryPct: 0, attempts: 0, lastAttempt: null }
];

// Para parent overview cards (Lucía + Mateo). Mateo no tiene progress detallado
// — usamos numeros pre-agregados para no inventar progreso por leccion para el.
export interface DemoOverviewKid {
  id: string;
  name: string;
  gradeLevel: number;
  minutesToday: number;
  masteryPct: number;
  stuckTopicEs?: string;
  stuckTopicEn?: string;
}

export const DEMO_OVERVIEW_KIDS: DemoOverviewKid[] = [
  {
    id: 'demo-lucia',
    name: 'Lucía',
    gradeLevel: 3,
    minutesToday: 15, // estMinutes de improper-fractions (in_progress hoy)
    masteryPct: 68 // promedio de IN_PROGRESS (45) + MASTERED (92)
  },
  {
    id: 'demo-mateo',
    name: 'Mateo',
    gradeLevel: 5,
    minutesToday: 18,
    masteryPct: 64,
    stuckTopicEs: 'Fracciones',
    stuckTopicEn: 'Fractions'
  }
];

// L M X J V S D — minutos agregados por dia entre los dos hijos.
export const DEMO_WEEKLY_MINUTES: number[] = [55, 70, 40, 85, 65, 30, 0];

// NexosEntry agregado para la estudiante activa (Lucía). Coincide con el seed.
export const DEMO_TOTAL_NEXOS = 1240;
