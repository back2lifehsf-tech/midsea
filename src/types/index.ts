import type { Locale } from '@/i18n';

export type { Locale };

export type Subject =
  | 'MATH'
  | 'LANGUAGE_ARTS'
  | 'SCIENCE'
  | 'SOCIAL_STUDIES'
  | 'FOREIGN_LANGUAGE'
  | 'ELECTIVE';

export interface StudentSummary {
  id: string;
  displayName: string;
  gradeLevel: number;
  preferredLocale: Locale;
  totalCoin: number;
}

export interface LessonSummary {
  id: string;
  slug: string;
  subject: Subject;
  gradeLevel: number;
  title: string;
  estMinutes: number;
}

export interface TutorChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
