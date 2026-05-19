/**
 * Tipos compartidos del motor de Angela. Epic 02 §1.
 *
 * Mantengo estos tipos desacoplados de Prisma para que el route handler y
 * los componentes UI puedan consumirlos sin arrastrar el cliente de DB.
 * Las funciones de los engines son las que traducen entre Prisma y estos
 * DTOs.
 */

export type TutorRole = 'user' | 'assistant' | 'system';

export interface StudentSummary {
  id: string;
  displayName: string;
  gradeLevel: number;
  locale: 'es' | 'en';
}

export interface TutorMessageDto {
  id: string;
  role: TutorRole;
  content: string;
  createdAt: Date;
}

export interface StudentTutorContext {
  student: StudentSummary;
  /** Cronológico ascendente (más viejo → más nuevo). Hasta HISTORY_LIMIT. */
  recentMessages: TutorMessageDto[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}
