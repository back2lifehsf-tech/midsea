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
 * Prioridad: NextAuth real (parent o student) > demo cookie. Si NextAuth
 * trae IDs pero los rows desaparecieron, caemos a demo (si hay cookie) o
 * login.
 *
 * Epic 01 §4 — role enforcement:
 *   - `requireParent(locale)` SOLO permite role=PARENT. Si entra un student
 *     redirige a /student. Si no hay sesion va a /login.
 *   - `requireStudent(locale)` SOLO permite role=STUDENT. Si entra un parent
 *     redirige a /student-login (selector de avatar para que elija perfil).
 *     Demo mode: demo-parent va a /student-login; demo-student entra normal.
 *
 * Estos guards no se ponen en middleware (decisión documentada en
 * src/middleware.ts) porque consultar JWT/DB en cada request agrega latencia
 * a rutas que ya hacen el check en layout server-side. Layout-level guards
 * son la fuente de verdad.
 */

export function getSession() {
  return getServerSession(authOptions);
}

export function getDemoRole(): DemoRole | null {
  const value = cookies().get(DEMO_COOKIE_NAME)?.value;
  return isDemoRole(value) ? value : null;
}

export type ParentContext =
  | (Awaited<ReturnType<typeof loadRealParent>> & { isDemo: false })
  | DemoParentContext;

export interface StudentContext {
  id: string;
  displayName: string;
  gradeLevel: number;
  preferredLocale: 'es' | 'en';
  familyId: string;
  avatarKey: string | null;
  isDemo: boolean;
}

async function loadRealParent(parentId: string) {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: { family: true }
  });
  return parent;
}

async function loadRealStudent(studentId: string) {
  return prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      displayName: true,
      gradeLevel: true,
      preferredLocale: true,
      familyId: true,
      avatarKey: true
    }
  });
}

type SessionInfo =
  | { kind: 'real-parent'; parent: NonNullable<Awaited<ReturnType<typeof loadRealParent>>> }
  | { kind: 'real-student'; student: NonNullable<Awaited<ReturnType<typeof loadRealStudent>>> }
  | { kind: 'demo'; role: DemoRole }
  | null;

async function resolveSession(): Promise<SessionInfo> {
  const session = await getSession();
  // STUDENT real session — prioridad sobre PARENT porque un JWT solo carga
  // una identidad. Si studentId está presente, role=STUDENT.
  if (session?.user?.studentId) {
    const student = await loadRealStudent(session.user.studentId);
    if (student) return { kind: 'real-student', student };
  }
  if (session?.user?.parentId) {
    const parent = await loadRealParent(session.user.parentId);
    if (parent) return { kind: 'real-parent', parent };
  }
  const demoRole = getDemoRole();
  if (demoRole) {
    return { kind: 'demo', role: demoRole };
  }
  return null;
}

/**
 * Guard de /parent/*. Solo PARENT.
 */
export async function requireParent(locale: string): Promise<ParentContext> {
  const info = await resolveSession();
  if (info?.kind === 'real-parent') {
    return { ...info.parent, isDemo: false as const };
  }
  if (info?.kind === 'real-student') {
    // Student logueado intentando entrar al espacio del padre → al suyo.
    redirect(`/${locale}/student`);
  }
  if (info?.kind === 'demo' && info.role === 'parent') {
    return DEMO_PARENT_CONTEXT;
  }
  if (info?.kind === 'demo' && info.role === 'student') {
    redirect(`/${locale}/student`);
  }
  redirect(`/${locale}/login`);
}

/**
 * Guard de /student/*. Solo STUDENT (o demo-student).
 * Si entra un PARENT real o demo-parent, lo manda al selector visual de
 * estudiante (/student-login) — NO entra automáticamente como el primer
 * hijo (epic 01 DoD: "ve un selector ... pero NO entra ... automáticamente").
 */
export async function requireStudent(locale: string): Promise<StudentContext> {
  const info = await resolveSession();
  if (info?.kind === 'real-student') {
    const s = info.student;
    return {
      id: s.id,
      displayName: s.displayName,
      gradeLevel: s.gradeLevel,
      preferredLocale: s.preferredLocale,
      familyId: s.familyId,
      avatarKey: s.avatarKey,
      isDemo: false
    };
  }
  if (info?.kind === 'real-parent') {
    redirect(`/${locale}/student-login`);
  }
  if (info?.kind === 'demo' && info.role === 'student') {
    return {
      id: DEMO_PARENT_CONTEXT.id, // placeholder; el branch isDemo lo reemplaza
      displayName: 'Demo Student',
      gradeLevel: 3,
      preferredLocale: 'es',
      familyId: DEMO_PARENT_CONTEXT.familyId,
      avatarKey: null,
      isDemo: true
    };
  }
  if (info?.kind === 'demo' && info.role === 'parent') {
    redirect(`/${locale}/student-login`);
  }
  redirect(`/${locale}/login`);
}

/**
 * @deprecated — usar `requireStudent` en student space y `requireParent` en
 * parent space. Este alias se mantiene mientras refactoreamos los callers
 * del epic 01; quitar en Epic 02.
 */
export async function requireStudentSpaceAccess(locale: string): Promise<ParentContext> {
  const info = await resolveSession();
  if (info?.kind === 'real-parent') return { ...info.parent, isDemo: false as const };
  if (info?.kind === 'real-student') {
    // Construimos un parent context sintético para no romper callers viejos.
    // En el refactor a requireStudent este path desaparece.
    const parent = await prisma.parent.findFirst({
      where: { familyId: info.student.familyId },
      include: { family: true }
    });
    if (parent) return { ...parent, isDemo: false as const };
  }
  if (info?.kind === 'demo') return DEMO_PARENT_CONTEXT;
  redirect(`/${locale}/login`);
}
