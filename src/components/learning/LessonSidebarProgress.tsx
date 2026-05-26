'use client';

import { useTranslations } from 'next-intl';
import { CheckIcon } from './lessonIcons';
import { STEP_ICON, type StepInfo } from './LessonStepper';

// Rediseño v3: card "Tu progreso" — réplica vertical de las etapas del
// stepper. Client Component (Mejora 4) para reflejar el estado vivo de los
// steps que mantiene LessonPlayerShell tras completar el quiz.

export interface LessonSidebarProgressProps {
  steps: StepInfo[];
}

export function LessonSidebarProgress({ steps }: LessonSidebarProgressProps) {
  const t = useTranslations('student.lesson');

  return (
    <div className="rounded-xl border border-midsea-border bg-midsea-foam p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-midsea-muted">
        {t('sidebar.progressTitle')}
      </p>
      <ul>
        {steps.map((s) => {
          const Icon = STEP_ICON[s.id];
          const isPending = s.status === 'pending';
          return (
            <li
              key={s.id}
              className={`flex items-center gap-2 py-1 text-sm ${
                isPending ? 'text-midsea-muted' : 'font-medium text-midsea-lagoon'
              }`}
            >
              {s.status === 'done' ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-midsea-lagoon-light">
                  <CheckIcon className="h-2.5 w-2.5 text-midsea-lagoon" />
                </span>
              ) : s.status === 'active' ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-midsea-lagoon text-xs font-semibold text-midsea-lagoon">
                  {s.number}
                </span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-midsea-border text-xs text-midsea-muted">
                  {s.number}
                </span>
              )}
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{t(`stepper.${s.id}`)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
