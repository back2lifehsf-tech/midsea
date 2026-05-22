import { getTranslations } from 'next-intl/server';
import { requireParent, type ParentContext } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import {
  StudentCard,
  type StudentCardData
} from '@/components/parent/billing/StudentCard';
import { MonthlyTotalBar } from '@/components/parent/billing/MonthlyTotalBar';
import { AddStudentButton } from '@/components/parent/billing/AddStudentButton';
import {
  PLAN_TIER_VALUES,
  BILLING_CYCLE_VALUES
} from '@/lib/schemas/student';

/**
 * Parent dashboard. Epic 03 §1 overhaul.
 *
 * Foco único: "Mis Estudiantes". El planner / reports / settings viven
 * en otras rutas (placeholders Epic 01). El weekly chart anterior se
 * removió — depende de lesson activity real que no existe todavía
 * (Epic 04 trae el Lesson Player + currículo).
 *
 * Vapor prohibido: cards NO muestran mastery ni minutos del día. Eso
 * es Epic 04+. Aquí mostramos identidad + plan + subscription status.
 */
export const dynamic = 'force-dynamic';

type PlanTier = (typeof PLAN_TIER_VALUES)[number];
type BillingCycle = (typeof BILLING_CYCLE_VALUES)[number];

async function loadStudents(parent: ParentContext): Promise<StudentCardData[]> {
  if (parent.isDemo) {
    // Demo mode: dataset sintético. No hay billing real; pintamos ACTIVE
    // para que el UI demo se vea poblado sin pedir tarjeta.
    return [
      {
        id: 'demo-sofia',
        displayName: 'Sofía',
        gradeLevel: 3,
        subscriptionStatus: 'ACTIVE',
        planTier: 'CORE',
        monthlyAmountCents: 2900
      },
      {
        id: 'demo-mateo',
        displayName: 'Mateo',
        gradeLevel: 5,
        subscriptionStatus: 'ACTIVE',
        planTier: 'PRO',
        monthlyAmountCents: 4500
      }
    ];
  }
  const rows = await prisma.student.findMany({
    where: { familyId: parent.family.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      displayName: true,
      gradeLevel: true,
      subscriptionStatus: true,
      planTier: true,
      monthlyAmountCents: true,
      stripeSubscriptionId: true
    }
  });
  return rows.map(({ stripeSubscriptionId, ...rest }) => ({
    ...rest,
    hasStripeSubscription: stripeSubscriptionId !== null
  }));
}

function normalizePlan(raw?: string): PlanTier | undefined {
  if (!raw) return undefined;
  const up = raw.toUpperCase();
  return (PLAN_TIER_VALUES as readonly string[]).includes(up)
    ? (up as PlanTier)
    : undefined;
}

function normalizeCycle(raw?: string): BillingCycle | undefined {
  if (!raw) return undefined;
  const up = raw.toUpperCase();
  return (BILLING_CYCLE_VALUES as readonly string[]).includes(up)
    ? (up as BillingCycle)
    : undefined;
}

export default async function ParentDashboardPage({
  params: { locale },
  searchParams
}: {
  params: { locale: string };
  searchParams: { plan?: string; cycle?: string };
}) {
  const parent = await requireParent(locale);
  const t = await getTranslations({ locale, namespace: 'parent.students.list' });

  const students = await loadStudents(parent);
  const initialPlan = normalizePlan(searchParams.plan);
  const initialCycle = normalizeCycle(searchParams.cycle);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-midsea-ocean">
            {t('subheading')}
          </p>
          <h1 className="font-display text-3xl font-bold text-midsea-deep">
            {t('heading')}
          </h1>
        </div>
        {students.length > 0 && !parent.isDemo ? (
          <AddStudentButton
            variant="header"
            initialPlan={initialPlan}
            initialCycle={initialCycle}
          />
        ) : null}
      </header>

      {students.length === 0 ? (
        <EmptyState
          heading={t('empty.heading')}
          subheading={t('empty.subheading')}
          showCta={!parent.isDemo}
          initialPlan={initialPlan}
          initialCycle={initialCycle}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((s) => (
              <StudentCard key={s.id} student={s} locale={locale} />
            ))}
          </div>
          <MonthlyTotalBar students={students} />
        </div>
      )}
    </div>
  );
}

function EmptyState({
  heading,
  subheading,
  showCta,
  initialPlan,
  initialCycle
}: {
  heading: string;
  subheading: string;
  showCta: boolean;
  initialPlan?: PlanTier;
  initialCycle?: BillingCycle;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border-2 border-dashed border-midsea-ocean/20 bg-white/60 p-10 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-midsea-foam to-midsea-lagoon/30 text-3xl">
        👋
      </div>
      <h2 className="font-display text-2xl font-bold text-midsea-deep">
        {heading}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-midsea-ink/70">
        {subheading}
      </p>
      {showCta ? (
        <div className="mt-6">
          <AddStudentButton
            variant="cta"
            initialPlan={initialPlan}
            initialCycle={initialCycle}
          />
        </div>
      ) : null}
    </div>
  );
}
