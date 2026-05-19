import 'server-only';
import { prisma } from '@/lib/prisma';
import { DEMO_ACTIVE_STUDENT, type DemoStudent } from '@/lib/demo/data';
import type { ParentContext, StudentContext } from './session';

/**
 * "Active student" — el hijo cuyo dashboard estamos mirando.
 *
 * Epic 01 §4: con role enforcement real, la fuente del active student es:
 *   - Si la sesión es STUDENT, ES él mismo (no se computa con familyId).
 *     Para ese caso usar `requireStudent(locale)` directo (más eficiente).
 *   - Si la sesión es PARENT y entra a /student/*, el guard de `requireStudent`
 *     lo redirige a /student-login. Por lo tanto este helper en el flujo
 *     normal NO se invoca con un PARENT.
 *
 * Compatibilidad: este helper sigue existiendo para callers viejos que
 * usaban `requireStudentSpaceAccess(locale)` + `getActiveStudent(parent)`.
 * Una vez todos los callers migren a `requireStudent`, este archivo se
 * puede borrar.
 */

export interface ActiveStudent {
  id: string;
  displayName: string;
  gradeLevel: number;
  preferredLocale: 'es' | 'en';
  isDemo: boolean;
}

export async function getActiveStudent(parent: ParentContext): Promise<ActiveStudent | null> {
  if (parent.isDemo) {
    return demoToActive(DEMO_ACTIVE_STUDENT);
  }
  const student = await prisma.student.findFirst({
    where: { familyId: parent.family.id },
    orderBy: { createdAt: 'asc' }
  });
  if (!student) return null;
  return {
    id: student.id,
    displayName: student.displayName,
    gradeLevel: student.gradeLevel,
    preferredLocale: student.preferredLocale,
    isDemo: false
  };
}

/** Para callers que ya tienen un StudentContext y solo necesitan el subset. */
export function fromStudent(s: StudentContext): ActiveStudent {
  return {
    id: s.id,
    displayName: s.displayName,
    gradeLevel: s.gradeLevel,
    preferredLocale: s.preferredLocale,
    isDemo: s.isDemo
  };
}

function demoToActive(s: DemoStudent): ActiveStudent {
  return {
    id: s.id,
    displayName: s.displayName,
    gradeLevel: s.gradeLevel,
    preferredLocale: s.preferredLocale,
    isDemo: true
  };
}
