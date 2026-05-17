'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type TabKey = 'preK2' | 'g35' | 'g68' | 'g912';
type SubjectKey = 'math' | 'science' | 'language' | 'history' | 'art' | 'bible';

const tabs: TabKey[] = ['preK2', 'g35', 'g68', 'g912'];
const bodyKeyByTab: Record<TabKey, string> = {
  preK2: 'preK2Body',
  g35: 'g35Body',
  g68: 'g68Body',
  g912: 'g912Body'
};

const subjectIcons: Record<SubjectKey, React.ReactNode> = {
  math: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
      <line x1="4" y1="9" x2="11" y2="9" />
      <line x1="7.5" y1="5.5" x2="7.5" y2="12.5" />
      <line x1="14" y1="6" x2="20" y2="12" />
      <line x1="20" y1="6" x2="14" y2="12" />
      <line x1="4" y1="18" x2="11" y2="18" />
      <line x1="14" y1="18" x2="20" y2="18" />
    </svg>
  ),
  science: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
      <path d="M10 3v6L5 19a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-10V3" />
      <line x1="8" y1="3" x2="16" y2="3" />
    </svg>
  ),
  language: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
      <path d="M5 8h7" />
      <path d="M8.5 5v3" />
      <path d="M5 8c0 4 3 7 6 8" />
      <path d="M12 8c0 4-3 7-6 8" />
      <path d="M13 21l4-10 4 10" />
      <path d="M14.5 17.5h5" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  ),
  art: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <circle cx="7.5" cy="10" r="1" />
      <circle cx="12" cy="7" r="1" />
      <circle cx="16.5" cy="10" r="1" />
      <path d="M14 21a3 3 0 0 1-3-3v-2a2 2 0 0 0-2-2H7" />
    </svg>
  ),
  bible: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
      <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
      <path d="M5 18a2 2 0 0 1 2-2h12" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="10" y1="10.5" x2="14" y2="10.5" />
    </svg>
  )
};

export function CurriculumTabs() {
  const t = useTranslations('landing.curriculum');
  const [active, setActive] = useState<TabKey>('preK2');
  const subjects: SubjectKey[] = ['math', 'science', 'language', 'history', 'art', 'bible'];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Curriculum grade"
        className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
      >
        {tabs.map((tab) => {
          const isActive = tab === active;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`curriculum-panel-${tab}`}
              id={`curriculum-tab-${tab}`}
              onClick={() => setActive(tab)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-ocean focus-visible:ring-offset-2 ${
                isActive
                  ? 'bg-midsea-deep text-white shadow-wave'
                  : 'bg-white text-midsea-deep ring-1 ring-midsea-ocean/20 hover:bg-midsea-foam'
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`curriculum-panel-${active}`}
        aria-labelledby={`curriculum-tab-${active}`}
        className="mt-6 rounded-2xl bg-white p-6 shadow-wave ring-1 ring-midsea-ocean/10"
      >
        <p className="text-base text-midsea-ink/80">{t(bodyKeyByTab[active])}</p>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Subjects">
          {subjects.map((s) => (
            <li
              key={s}
              className="inline-flex items-center gap-2 rounded-full bg-midsea-foam px-3 py-1.5 text-sm text-midsea-deep"
            >
              <span className="text-midsea-ocean">{subjectIcons[s]}</span>
              <span className="font-medium">{t(`subjects.${s}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
