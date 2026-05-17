import 'server-only';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';
import { DEMO_COOKIE_NAME, isDemoRole, type DemoRole } from './demo-shared';
import { DEMO_PARENT_CONTEXT, type DemoParentContext } from '@/lib/demo/data';

/**
 * Sesion canonica para Server Components / route handlers.
 *
 * Prioridad: NextAuth real > demo cookie. Si la sesion NextAuth trae parentId
 * pero el row de Prisma desaparecio, caemos a demo (si hay cookie) o login.
 *
 * `requireParent`: guard del espacio /parent/*. Acepta real o demo='parent'.
 * Si demo='student' intenta acceder, redirige a /student.
 *
 * `requireStudentSpaceAccess`: guard del espacio /student/*. Mas permisivo —
 * acepta real (parent actuando en nombre del hijo) o cualquier demo. En v2
 * separariamos student auth pero hoy no existe.
 */

export function getSession() {
  return getServerSession(authOptions);
}

export function getDemoRole(): DemoRole | null {
  const value = cookies().get(DEMO_COOKIE_NAME)?.value;
  return isDemoRole(value) ? value : null;
}

// Shape comun que ambas rutas (real y demo) devuelven; las paginas branch
// sobre `isDemo` para elegir Prisma vs fixture.
export type ParentContext =
  | (Awaited<ReturnType<typeof loadRealParent>> & { isDemo: false })
  | DemoParentContext;

async function loadRealParent(parentId: string) {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: { family: true }
  });
  return parent;
}

async function resolveSession() {
  const session = await getSession();
  const parentId = session?.user?.parentId;
  if (parentId) {
    const parent = await loadRealParent(parentId);
    if (parent) {
      return { kind: 'real' as const, parent: { ...parent, isDemo: false as const } };
    }
  }
  const demoRole = getDemoRole();
  if (demoRole) {
    return { kind: 'demo' as const, role: demoRole };
  }
  return null;
}

export async function requireParent(locale: string): Promise<ParentContext> {
  const info = await resolveSession();
  if (info?.kind === 'real') return info.parent;
  if (info?.kind === 'demo' && info.role === 'parent') return DEMO_PARENT_CONTEXT;
  if (info?.kind === 'demo' && info.role === 'student') {
    redirect(`/${locale}/student`);
  }
  redirect(`/${locale}/login`);
}

export async function requireStudentSpaceAccess(locale: string): Promise<ParentContext> {
  const info = await resolveSession();
  if (info?.kind === 'real') return info.parent;
  if (info?.kind === 'demo') return DEMO_PARENT_CONTEXT;
  redirect(`/${locale}/login`);
}
