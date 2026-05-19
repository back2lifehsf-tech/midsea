import { requireStudent } from '@/lib/auth/session';
import { loadStudentTutorContext } from '@/lib/tutor/StudentContextEngine';
import { StuckChat } from '@/components/tutoring/sylvie/Chat';
import type { TutorMessageDto } from '@/lib/tutor/types';

/**
 * /[locale]/student/stuck — Epic 02 §5.
 *
 * Hosts el chat de Sylvie a pantalla completa. SSR carga los últimos 20
 * turnos del estudiante (memoria cross-session) y los hidrata en el
 * Zustand store del cliente — así el primer render ya muestra historial
 * sin parpadeo.
 *
 * Demo students: el `requireStudent` les deja entrar al espacio, pero
 * sus IDs son sintéticos (DEMO_PARENT_CONTEXT.id) y no tienen TutorMessages
 * reales. Pasamos lista vacía y dejamos que el API responda 401 si
 * intentan enviar — la limpieza de demo mode entera está en Epic 03.
 */
export default async function StuckPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const student = await requireStudent(locale);

  let initialMessages: TutorMessageDto[] = [];
  if (!student.isDemo) {
    try {
      const ctx = await loadStudentTutorContext(student.id);
      initialMessages = ctx.recentMessages;
    } catch (e) {
      // Si el row del student desapareció entre auth y carga, mejor
      // renderizar chat vacío que romper el render entero.
      console.error('[tutor] /stuck initial load failed:', e);
    }
  }

  return (
    <StuckChat
      initialMessages={initialMessages}
      studentName={student.displayName}
    />
  );
}
