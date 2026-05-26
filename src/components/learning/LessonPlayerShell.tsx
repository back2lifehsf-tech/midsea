'use client';
/**
 * Rediseño v3 — Mejora 4: orquestador de la página de lección.
 *
 * Convierte la lección de scroll único a navegación por etapas (tabs) sin
 * cambio de URL. El estudiante ve UNA etapa a la vez (Lectura o Quiz) y
 * cambia entre ellas haciendo clic en el stepper. La transición es un fade
 * CSS de 150ms (sin Framer Motion).
 *
 * page.tsx (Server Component) fetchea los datos y los serializa a props;
 * este shell maneja todo el estado interactivo.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LessonMarkdown } from './LessonMarkdown';
import { LessonStepper, type StepInfo, type StepId } from './LessonStepper';
import { LessonSidebarProgress } from './LessonSidebarProgress';
import { LessonSidebarDomain } from './LessonSidebarDomain';
import { LessonPullQuote } from './LessonPullQuote';
import { AngelaSidebarCard } from './AngelaSidebarCard';
import { LessonContextRegister } from './LessonContextRegister';
import { ActivityList, type ActivityData } from './Activity';
import { Quiz } from './Quiz';
import {
  ClockIcon,
  CoinsIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from './lessonIcons';
import type { LessonContext } from '@/lib/tutor/LessonContext';

// Misma forma que LessonRender.quizQuestions en page.tsx. Se castea a `never`
// al pasar a <Quiz> (igual que antes) porque el union interno de Quiz exige
// options no-opcionales para multiple_choice.
export interface ShellQuizQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'short_answer';
  promptEs: string;
  promptEn: string;
  optionsEs?: string[];
  optionsEn?: string[];
}

export interface LessonPlayerShellProps {
  // Datos de la lección
  lessonId: string;
  lessonSlug: string;
  titleEs: string;
  titleEn: string;
  subject: string; // clave cruda (namespace `subjects`)
  gradeLevel: number;
  estMinutes: number;
  rewardCoin: number;
  bodyMd: string | null; // ya resuelto al locale activo en page.tsx
  summaryEs: string | null;
  summaryEn: string | null;
  reflectionEs: string | null;
  reflectionEn: string | null;
  activities: ActivityData[];
  quizQuestions: ShellQuizQuestion[];

  // Progreso
  masteryPct: number;
  attempts: number;
  initialSteps: StepInfo[];

  // Contexto
  locale: string;
  studentFirstName: string;
  backHref: string;

  // Lección siguiente (opcional — botón al completar el quiz)
  nextLessonSlug?: string;
  nextLessonTitle?: string;
}

export default function LessonPlayerShell(props: LessonPlayerShellProps) {
  const t = useTranslations('student.lesson');
  const tSubjects = useTranslations('subjects');

  const [activeStep, setActiveStep] = useState<'reading' | 'quiz'>('reading');
  const [steps, setSteps] = useState<StepInfo[]>(props.initialSteps);
  const [visible, setVisible] = useState(true);

  const isEs = props.locale !== 'en';
  const title = isEs ? props.titleEs : props.titleEn;
  const summary = isEs ? props.summaryEs : props.summaryEn;
  const reflection = isEs ? props.reflectionEs : props.reflectionEn;

  // LessonContext para Angela — se monta una vez al nivel del shell para que
  // sobreviva al cambio de tab (Riesgo 2 de la Mejora 4).
  const lessonCtx: LessonContext = {
    lessonId: props.lessonId,
    slug: props.lessonSlug,
    titleEs: props.titleEs,
    titleEn: props.titleEn,
    subject: props.subject,
    gradeLevel: props.gradeLevel,
    estMinutes: props.estMinutes
  };

  const handleStepChange = (newStep: StepId) => {
    if (newStep === 'video') return; // sin videos en v1
    if (newStep === activeStep) return;
    setVisible(false);
    setTimeout(() => {
      setActiveStep(newStep);
      // Si la etapa destino estaba pending (ej. Quiz al primer "Ir al Quiz →"),
      // pasa a active: refleja que el estudiante ya la abrió y la vuelve
      // navegable desde el stepper.
      setSteps((prev) =>
        prev.map((s) =>
          s.id === newStep && s.status === 'pending'
            ? { ...s, status: 'active' as const }
            : s
        )
      );
      setVisible(true);
    }, 150);
  };

  const handleQuizComplete = (result: { masteryPct: number }) => {
    if (result.masteryPct >= 80) {
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' as const })));
    } else {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'reading'
            ? { ...s, status: 'done' as const }
            : { ...s, status: 'active' as const }
        )
      );
    }
  };

  return (
    <div className="px-1 py-2 md:px-2">
      {/* Angela context — siempre montado, nunca dentro de las vistas */}
      <LessonContextRegister lesson={lessonCtx} studentFirstName={props.studentFirstName} />

      {/* Topbar: breadcrumb + tiempo + badge coin */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-midsea-muted">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate">{tSubjects(props.subject)}</span>
          <span aria-hidden className="text-midsea-border">
            ›
          </span>
          <span className="truncate font-medium text-midsea-ink">{title}</span>
        </div>
        <div className="flex items-center gap-3 sm:ml-auto">
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5" />
            {t('topbar.minutesLabel', { minutes: props.estMinutes })}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-coin-light px-2.5 py-0.5 text-xs font-medium text-coin-dark">
            <CoinsIcon className="h-3 w-3" />
            {t('topbar.coinLabel', { coin: props.rewardCoin })}
          </span>
        </div>
      </div>

      {/* Stepper clickeable */}
      <LessonStepper steps={steps} activeStep={activeStep} onStepClick={handleStepChange} />

      {/* Layout dos columnas */}
      <div className="mt-6 flex gap-8">
        {/* Columna principal — con fade */}
        <div className="min-w-0 flex-1">
          <div
            className={`transition-opacity duration-150 ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {activeStep === 'reading' ? (
              <ReadingView
                title={title}
                gradeLevel={props.gradeLevel}
                bodyMd={props.bodyMd}
                summary={summary}
                reflection={reflection}
                activities={props.activities}
                isEs={isEs}
                backHref={props.backHref}
                onGoToQuiz={() => handleStepChange('quiz')}
              />
            ) : (
              <QuizView
                lessonSlug={props.lessonSlug}
                quizQuestions={props.quizQuestions}
                isEs={isEs}
                rewardCoin={props.rewardCoin}
                locale={props.locale}
                nextLessonSlug={props.nextLessonSlug}
                nextLessonTitle={props.nextLessonTitle}
                onComplete={handleQuizComplete}
                onBackToReading={() => handleStepChange('reading')}
              />
            )}
          </div>
        </div>

        {/* Sidebar — fuera del fade, siempre visible (solo desktop) */}
        <aside className="hidden gap-3 lg:flex lg:w-64 lg:shrink-0 lg:flex-col">
          <LessonSidebarProgress steps={steps} />
          <LessonSidebarDomain
            masteryPct={props.masteryPct}
            rewardCoin={props.rewardCoin}
            hasAttempts={props.attempts > 0}
          />
          <AngelaSidebarCard locale={props.locale} />
        </aside>
      </div>
    </div>
  );
}

function ReadingView({
  title,
  gradeLevel,
  bodyMd,
  summary,
  reflection,
  activities,
  isEs,
  backHref,
  onGoToQuiz
}: {
  title: string;
  gradeLevel: number;
  bodyMd: string | null;
  summary: string | null;
  reflection: string | null;
  activities: ActivityData[];
  isEs: boolean;
  backHref: string;
  onGoToQuiz: () => void;
}) {
  const t = useTranslations('student.lesson');

  return (
    <>
      <h1 className="mb-3 font-serif text-2xl font-normal leading-snug text-midsea-ink">
        {title}
      </h1>
      <div className="mb-4 flex items-center gap-3 text-xs text-midsea-muted">
        <span>{gradeLevel}°</span>
      </div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-midsea-muted">
        {t('stepper.reading')}
      </p>

      {bodyMd ? (
        <div className="font-sans text-[15px] leading-relaxed text-midsea-ink">
          <LessonMarkdown markdown={bodyMd} />
        </div>
      ) : null}

      <LessonPullQuote text={summary ?? ''} />

      {activities.length > 0 ? <ActivityList activities={activities} isEs={isEs} /> : null}

      {reflection ? (
        <div className="mt-6 rounded-xl border border-coin/20 bg-coin-light px-4 py-3">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-coin-dark">
            <SparklesIcon className="h-3 w-3" />
            {t('reflection')}
          </p>
          <p className="font-serif text-sm italic leading-relaxed text-coin-dark">{reflection}</p>
        </div>
      ) : null}

      {/* Footer de navegación */}
      <div className="mt-8 flex items-center justify-between border-t border-midsea-border pt-5">
        <Button as={Link} href={backHref} variant="ghost">
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          {t('back')}
        </Button>
        <Button variant="primary" onClick={onGoToQuiz}>
          {t('nav.goToQuiz')}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </>
  );
}

function QuizView({
  lessonSlug,
  quizQuestions,
  isEs,
  rewardCoin,
  locale,
  nextLessonSlug,
  nextLessonTitle,
  onComplete,
  onBackToReading
}: {
  lessonSlug: string;
  quizQuestions: ShellQuizQuestion[];
  isEs: boolean;
  rewardCoin: number;
  locale: string;
  nextLessonSlug?: string;
  nextLessonTitle?: string;
  onComplete: (result: { masteryPct: number }) => void;
  onBackToReading: () => void;
}) {
  const t = useTranslations('student.lesson');

  return (
    <>
      <Quiz
        lessonSlug={lessonSlug}
        questions={quizQuestions as never}
        isEs={isEs}
        rewardCoin={rewardCoin}
        onComplete={onComplete}
      />

      {/* Footer de navegación */}
      <div className="mt-8 flex items-center justify-between border-t border-midsea-border pt-5">
        <Button variant="ghost" onClick={onBackToReading}>
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          {t('nav.backToReading')}
        </Button>
        {nextLessonSlug ? (
          <Button as={Link} href={`/${locale}/student/lessons/${nextLessonSlug}`} variant="primary">
            {nextLessonTitle ?? t('nav.nextLesson')}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </>
  );
}
