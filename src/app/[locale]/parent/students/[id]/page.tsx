import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { CourseActionButton } from '@/components/parent/catalog/CourseActionButton';
import type { CourseSummary } from '@/components/parent/catalog/CourseActivationDialog';
import { requireParent } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

/**
 * Parent → Student Detail. Epic 04 Tarea 6.
 *
 * Vista de gestión por hijo:
 *   - Header: nombre, grado, status de subscription.
 *   - Sección "Cursos activos": enrollments con `active=true` + progreso
 *     agregado de LessonProgress del estudiante en ese curso.
 *   - Sección "Catálogo disponible": cursos `published=true` que NO
 *     están activos (puede incluir enrollments inactivos para reactivar).
 *
 * El padre activa/desactiva via CourseActionButton → CourseActivationDialog.
 * Plan Core incluye acceso ilimitado, no hay cobro adicional por activar
 * (ADR-005 §4).
 */
export default async function ParentStudentDetailPage({
  params: { locale, id: studentId }
}: {
  params: { locale: string; id: string };
}) {
  const parent = await requireParent(locale);
  if (parent.isDemo) {
    // El padre demo no tiene students reales; redirigimos al dashboard.
    redirect(`/${locale}/parent`);
  }

  const [tDetail, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'parent.studentDetail' }),
    getTranslations({ locale, namespace: 'parent.nav' })
  ]);

  // Ownership check + carga.
  const student = await prisma.student.findFirst({
    where: { id: studentId, familyId: parent.familyId },
    select: {
      id: true,
      displayName: true,
      gradeLevel: true,
      subscriptionStatus: true,
      enrollments: {
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              titleEs: true,
              titleEn: true,
              descriptionEs: true,
              descriptionEn: true,
              subject: true,
              gradeBand: true,
              _count: { select: { lessons: true, competencies: true } }
            }
          }
        }
      }
    }
  });
  if (!student) notFound();

  // Catálogo: todos los Course published. Marcamos cuáles ya están
  // activos para presentar de forma distinta.
  const allCourses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { orderIndex: 'asc' },
    select: {
      id: true,
      slug: true,
      titleEs: true,
      titleEn: true,
      descriptionEs: true,
      descriptionEn: true,
      subject: true,
      gradeBand: true,
      _count: { select: { lessons: true, competencies: true } }
    }
  });

  const activeEnrollments = student.enrollments.filter((e) => e.active);
  const activeCourseIds = new Set(activeEnrollments.map((e) => e.courseId));
  const availableCourses = allCourses.filter(
    (c) => !activeCourseIds.has(c.id)
  );

  // Progress agregado: cuántas lessons mastered tiene el estudiante por curso.
  // Una sola query para todos los cursos activos.
  const progressByCourse = new Map<string, { mastered: number; total: number }>();
  for (const enr of activeEnrollments) {
    progressByCourse.set(enr.courseId, {
      mastered: 0,
      total: enr.course._count.lessons
    });
  }
  if (activeEnrollments.length > 0) {
    const masteredRows = await prisma.lessonProgress.findMany({
      where: {
        studentId: student.id,
        status: 'MASTERED',
        lesson: {
          courseId: { in: activeEnrollments.map((e) => e.courseId) }
        }
      },
      select: { lesson: { select: { courseId: true } } }
    });
    for (const row of masteredRows) {
      const courseId = row.lesson.courseId;
      if (!courseId) continue;
      const p = progressByCourse.get(courseId);
      if (p) p.mastered += 1;
    }
  }

  const isEs = locale !== 'en';
  const gradeLabel =
    student.gradeLevel === 0
      ? tDetail('gradePreK')
      : tDetail('gradeNumbered', { n: student.gradeLevel });

  function toSummary(course: typeof allCourses[number]): CourseSummary {
    return {
      id: course.id,
      slug: course.slug,
      titleEs: course.titleEs,
      titleEn: course.titleEn,
      descriptionEs: course.descriptionEs,
      descriptionEn: course.descriptionEn,
      subject: course.subject,
      gradeBand: course.gradeBand,
      lessonCount: course._count.lessons,
      competencyCount: course._count.competencies
    };
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/${locale}/parent`}
        className="inline-block text-sm text-midsea-ocean hover:underline"
      >
        ← {tNav('backToDashboard')}
      </Link>

      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-midsea-ocean">
          {gradeLabel} · {tDetail(`status.${student.subscriptionStatus}`)}
        </p>
        <h1 className="font-display text-3xl font-bold text-midsea-deep">
          {student.displayName}
        </h1>
        <p className="text-sm text-midsea-ink/70">
          {tDetail('subtitle', { name: student.displayName })}
        </p>
      </header>

      <section aria-labelledby="active-courses" className="space-y-3">
        <h2
          id="active-courses"
          className="font-display text-xl font-semibold text-midsea-deep"
        >
          {tDetail('activeCoursesHeading', { n: activeEnrollments.length })}
        </h2>
        {activeEnrollments.length === 0 ? (
          <Card>
            <p className="text-sm text-midsea-ink/70">
              {tDetail('noActiveCourses')}
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeEnrollments.map((enr) => {
              const summary = toSummary(enr.course);
              const progress = progressByCourse.get(enr.courseId) ?? {
                mastered: 0,
                total: enr.course._count.lessons
              };
              const pct =
                progress.total > 0
                  ? Math.round((progress.mastered / progress.total) * 100)
                  : 0;
              return (
                <Card key={enr.id}>
                  <h3 className="font-display text-base font-bold text-midsea-deep">
                    {isEs ? enr.course.titleEs : enr.course.titleEn}
                  </h3>
                  <p className="mt-1 text-xs text-midsea-ink/60">
                    {tDetail('progress', {
                      mastered: progress.mastered,
                      total: progress.total,
                      pct
                    })}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-midsea-ink/50">
                      {tDetail('activatedOn', {
                        date: enr.activatedAt.toLocaleDateString(locale)
                      })}
                    </p>
                    <CourseActionButton
                      mode="deactivate"
                      course={summary}
                      studentId={student.id}
                      studentName={student.displayName}
                      isEs={isEs}
                      variant="ghost"
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="available-courses" className="space-y-3">
        <h2
          id="available-courses"
          className="font-display text-xl font-semibold text-midsea-deep"
        >
          {tDetail('availableCoursesHeading')}
        </h2>
        {availableCourses.length === 0 ? (
          <Card>
            <p className="text-sm text-midsea-ink/70">
              {tDetail('allActivated')}
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {availableCourses.map((course) => {
              const summary = toSummary(course);
              return (
                <Card key={course.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base font-bold text-midsea-deep">
                        {isEs ? course.titleEs : course.titleEn}
                      </h3>
                      <p className="mt-1 line-clamp-3 text-sm text-midsea-ink/70">
                        {isEs ? course.descriptionEs : course.descriptionEn}
                      </p>
                      <p className="mt-2 text-xs text-midsea-ink/50">
                        {tDetail('catalogStats', {
                          lessons: course._count.lessons,
                          competencies: course._count.competencies
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <CourseActionButton
                      mode="activate"
                      course={summary}
                      studentId={student.id}
                      studentName={student.displayName}
                      isEs={isEs}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
