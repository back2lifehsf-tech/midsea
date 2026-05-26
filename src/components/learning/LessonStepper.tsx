'use client';

import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { PlayIcon, BookOpenIcon, ClipboardListIcon, CheckIcon } from './lessonIcons';

// Rediseño v3 — Mejora 4: stepper horizontal numerado (Video · Lectura · Quiz)
// ahora clickeable. Cada chip cambia la etapa activa del LessonPlayerShell sin
// tocar la URL. Tipos compartidos con LessonSidebarProgress.

export type StepId = 'video' | 'reading' | 'quiz';
export type StepStatus = 'done' | 'active' | 'pending';

export interface StepInfo {
  id: StepId;
  number: number;
  status: StepStatus;
}

export interface LessonStepperProps {
  steps: StepInfo[];
  // Etapa que el estudiante está viendo ahora mismo (controla el estilo de tab
  // activo, independientemente del `status` del step).
  activeStep: 'reading' | 'quiz';
  onStepClick: (step: StepId) => void;
}

export const STEP_ICON: Record<StepId, ComponentType<{ className?: string }>> = {
  video: PlayIcon,
  reading: BookOpenIcon,
  quiz: ClipboardListIcon
};

// done y active son navegables (el estudiante puede volver a leer); pending no.
const isClickable = (status: StepStatus) => status === 'done' || status === 'active';

export function LessonStepper({ steps, activeStep, onStepClick }: LessonStepperProps) {
  const t = useTranslations('student.lesson.stepper');

  return (
    <nav aria-label={t('ariaLabel')}>
      <div className="flex items-center gap-0 border-b border-midsea-border">
        {steps.map((s) => {
          const Icon = STEP_ICON[s.id];
          const isActiveTab = s.id === activeStep;
          const clickable = isClickable(s.status);

          // Indicador interno: refleja el `status`, no la pestaña abierta.
          const indicator =
            s.status === 'done' ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-midsea-lagoon text-white">
                <CheckIcon className="h-2.5 w-2.5" />
              </span>
            ) : s.status === 'active' ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-midsea-lagoon text-xs font-semibold text-white">
                {s.number}
              </span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-midsea-border text-xs text-midsea-muted">
                {s.number}
              </span>
            );

          // El estilo de "tab activo" (underline + fondo) lo decide activeStep.
          const stateCls = isActiveTab
            ? '-mb-px border-b-2 border-midsea-lagoon bg-midsea-lagoon-light font-medium text-midsea-lagoon'
            : s.status === 'pending'
              ? 'text-midsea-muted opacity-60'
              : 'text-midsea-lagoon';

          const cursorCls = isActiveTab
            ? 'cursor-default'
            : clickable
              ? 'cursor-pointer hover:bg-midsea-lagoon-light/50'
              : 'cursor-not-allowed';

          return (
            <button
              key={s.id}
              type="button"
              aria-current={isActiveTab ? 'step' : undefined}
              disabled={!clickable}
              onClick={clickable ? () => onStepClick(s.id) : undefined}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors ${stateCls} ${cursorCls}`}
            >
              {indicator}
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t(s.id)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
