import 'server-only';
import { prisma } from '@/lib/prisma';
import { DEMO_ACTIVE_STUDENT, type DemoStudent } from '@/lib/demo/data';
import type { ParentContext } from './session';

// Shape minimo que las paginas usan: id, displayName, gradeLevel, preferredLocale.
// Una `Prisma.Student` lo satisface; `DemoStudent` tambien. Mantenemos isDemo
// por si el detail page quiere branch downstream.
export interface ActiveStudent {
  id: string;
  displayName: string;
  gradeLevel: number;
  preferredLocale: 'es' | 'en';
  isDemo: boolean;
}

/**
 * "Active student" — el hijo cuyo dashboard estamos mirando.
 *
 * v1 simplification: el primer hijo de la familia (orden de creacion).
 * Cuando un demo accede al espacio del estudiante usamos un Lucia sintetico
 * fijo, asi no dependemos de DB seedeada para iterar UI.
 */
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

function demoToActive(s: DemoStudent): ActiveStudent {
  return {
    id: s.id,
    displayName: s.displayName,
    gradeLevel: s.gradeLevel,
    preferredLocale: s.preferredLocale,
    isDemo: true
  };
}
