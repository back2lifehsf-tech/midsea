'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTutorStore } from '@/lib/tutor/angela-state';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// MCQ demo hardcoded por slug. Sin Prisma, sin runtime data. Sirve para
// disparar la intervención proactiva de Angela (consecutiveErrors >= 2) y
// dar al estudiante algo concreto que hacer hasta que armemos el sistema
// real de ejercicios.

interface MCQ {
  id: string;
  prompt: { es: string; en: string };
  options: { es: string; en: string }[];
  correctIndex: number;
}

const FALLBACK: MCQ[] = [
  {
    id: 'fb1',
    prompt: { es: '¿Estás listo para empezar?', en: 'Ready to begin?' },
    options: [
      { es: 'Sí', en: 'Yes' },
      { es: 'Quiero ver el video primero', en: "I'd watch the video first" }
    ],
    correctIndex: 0
  }
];

const QUESTIONS_BY_SLUG: Record<string, MCQ[]> = {
  'improper-fractions': [
    {
      id: 'q1',
      prompt: { es: '¿Cuál de estas es una fracción impropia?', en: 'Which one is an improper fraction?' },
      options: [
        { es: '3/5', en: '3/5' },
        { es: '7/4', en: '7/4' },
        { es: '1/2', en: '1/2' }
      ],
      correctIndex: 1
    },
    {
      id: 'q2',
      prompt: { es: '9/4 como número mixto:', en: '9/4 as a mixed number:' },
      options: [
        { es: '1 5/4', en: '1 5/4' },
        { es: '2 1/4', en: '2 1/4' },
        { es: '4 1/9', en: '4 1/9' }
      ],
      correctIndex: 1
    },
    {
      id: 'q3',
      prompt: { es: '¿Cuál fracción es mayor que 1?', en: 'Which fraction is greater than 1?' },
      options: [
        { es: '4/5', en: '4/5' },
        { es: '3/3', en: '3/3' },
        { es: '5/3', en: '5/3' }
      ],
      correctIndex: 2
    }
  ],
  'addition-with-carrying': [
    {
      id: 'q1',
      prompt: { es: '47 + 38 = ?', en: '47 + 38 = ?' },
      options: [
        { es: '75', en: '75' },
        { es: '85', en: '85' },
        { es: '95', en: '95' }
      ],
      correctIndex: 1
    },
    {
      id: 'q2',
      prompt: { es: '156 + 67 = ?', en: '156 + 67 = ?' },
      options: [
        { es: '213', en: '213' },
        { es: '223', en: '223' },
        { es: '224', en: '224' }
      ],
      correctIndex: 1
    }
  ],
  'treasure-island-ch-3': [
    {
      id: 'q1',
      prompt: { es: '¿Quién narra La isla del tesoro?', en: 'Who narrates Treasure Island?' },
      options: [
        { es: 'Long John Silver', en: 'Long John Silver' },
        { es: 'Jim Hawkins', en: 'Jim Hawkins' },
        { es: 'El doctor Livesey', en: 'Dr. Livesey' }
      ],
      correctIndex: 1
    },
    {
      id: 'q2',
      prompt: { es: '¿Qué objeto clave aparece al principio del libro?', en: 'What key item appears early in the book?' },
      options: [
        { es: 'Un mapa del tesoro', en: 'A treasure map' },
        { es: 'Una brújula rota', en: 'A broken compass' },
        { es: 'Un loro hablador', en: 'A talking parrot' }
      ],
      correctIndex: 0
    }
  ],
  'water-cycle': [
    {
      id: 'q1',
      prompt: { es: '¿Qué proceso convierte agua líquida en vapor?', en: 'Which process turns liquid water into vapor?' },
      options: [
        { es: 'Condensación', en: 'Condensation' },
        { es: 'Evaporación', en: 'Evaporation' },
        { es: 'Precipitación', en: 'Precipitation' }
      ],
      correctIndex: 1
    },
    {
      id: 'q2',
      prompt: { es: 'La lluvia es un ejemplo de…', en: 'Rain is an example of…' },
      options: [
        { es: 'Evaporación', en: 'Evaporation' },
        { es: 'Precipitación', en: 'Precipitation' },
        { es: 'Colección', en: 'Collection' }
      ],
      correctIndex: 1
    }
  ]
};

export function ExerciseDemo({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations('student.exercises');
  const startExercises = useTutorStore((s) => s.startExercises);
  const recordAnswer = useTutorStore((s) => s.recordAnswer);
  const openWidget = useTutorStore((s) => s.openWidget);

  const questions = useMemo(() => QUESTIONS_BY_SLUG[slug] ?? FALLBACK, [slug]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  // Registrar al store que hay N ejercicios en este lesson en mount.
  useEffect(() => {
    startExercises(questions.length);
  }, [questions.length, startExercises]);

  if (done) {
    return (
      <Card>
        <h3 className="font-display text-lg font-semibold text-midsea-deep">
          {t('completed.title')}
        </h3>
        <p className="mt-2 text-sm text-midsea-ink/70">{t('completed.body')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setCurrentIndex(0);
              setFeedback(null);
              setSelectedIdx(null);
              setDone(false);
              startExercises(questions.length);
            }}
          >
            {t('completed.restart')}
          </Button>
          <Button variant="ghost" onClick={() => openWidget('focus')}>
            {t('completed.askAngela')}
          </Button>
        </div>
      </Card>
    );
  }

  const q = questions[currentIndex];
  const isEs = locale !== 'en';

  function choose(optionIdx: number) {
    if (feedback) return;
    const correct = optionIdx === q.correctIndex;
    setSelectedIdx(optionIdx);
    setFeedback(correct ? 'correct' : 'incorrect');
    recordAnswer(correct);
  }

  function next() {
    if (currentIndex + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setCurrentIndex(currentIndex + 1);
    setFeedback(null);
    setSelectedIdx(null);
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-midsea-lagoon">
          {t('progress', { current: currentIndex + 1, total: questions.length })}
        </p>
        <button
          type="button"
          onClick={() => openWidget('focus')}
          className="text-xs text-midsea-ocean hover:underline"
        >
          {t('askAngela')}
        </button>
      </div>

      <p className="mt-3 font-display text-lg font-semibold text-midsea-deep">
        {isEs ? q.prompt.es : q.prompt.en}
      </p>

      <div className="mt-4 grid gap-2">
        {q.options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = feedback === 'correct' && isSelected;
          const isWrong = feedback === 'incorrect' && isSelected;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => choose(idx)}
              disabled={feedback !== null}
              className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition disabled:cursor-default ${
                isCorrect
                  ? 'bg-midsea-lagoon/15 text-midsea-deep ring-1 ring-midsea-lagoon'
                  : isWrong
                    ? 'bg-midsea-coral/15 text-midsea-deep ring-1 ring-midsea-coral'
                    : 'bg-white text-midsea-deep ring-1 ring-midsea-ocean/15 hover:bg-midsea-foam'
              }`}
            >
              {isEs ? opt.es : opt.en}
            </button>
          );
        })}
      </div>

      {feedback ? (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            feedback === 'correct'
              ? 'bg-midsea-lagoon/10 text-midsea-deep'
              : 'bg-midsea-coral/10 text-midsea-deep'
          }`}
        >
          <p>{feedback === 'correct' ? t('feedback.correct') : t('feedback.incorrect')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" onClick={next}>
              {currentIndex + 1 >= questions.length ? t('finish') : t('next')}
            </Button>
            {feedback === 'incorrect' ? (
              <Button variant="ghost" onClick={() => openWidget('focus')}>
                {t('askAngela')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
