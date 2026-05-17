'use client';

import { useEffect, useState } from 'react';
import { ChatTutor } from './ChatTutor';
import type { Locale } from '@/i18n';

interface PanelLabels {
  ask: string;
  panelTitle: string;
  // Ya viene formateado por el server con t('context', { topic }).
  context: string;
  disclaimer: string;
  close: string;
  chat: {
    placeholder: string;
    send: string;
    thinking: string;
    starters: string[];
  };
}

// Memory project-midsea-framing: el tutor es un boton contextual DENTRO de una
// leccion, nunca un destino de nav. Este panel encapsula esa interaccion.
// Mantenemos ChatTutor montado para preservar la conversacion al cerrar/reabrir.
export function LessonHelpPanel({
  locale,
  topic,
  gradeLevel,
  studentFirstName,
  labels
}: {
  locale: Locale;
  topic: string;
  gradeLevel?: number;
  studentFirstName?: string;
  labels: PanelLabels;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-midsea-coral px-5 py-3 text-sm font-semibold text-white shadow-wave hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-coral focus-visible:ring-offset-2"
      >
        {labels.ask}
      </button>

      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <button
          type="button"
          aria-label={labels.close}
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-midsea-deep/40"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-help-title"
          className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-lg transition-transform duration-200 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <header className="border-b border-midsea-ocean/10 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="lesson-help-title" className="font-display text-lg font-bold text-midsea-deep">
                  {labels.panelTitle}
                </h2>
                <p className="mt-1 text-xs text-midsea-ink/70">{labels.context}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1 text-sm text-midsea-deep hover:bg-midsea-foam"
              >
                {labels.close}
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            <ChatTutor
              locale={locale}
              topic={topic}
              studentFirstName={studentFirstName}
              gradeLevel={gradeLevel}
              labels={labels.chat}
            />
          </div>
          <footer className="border-t border-midsea-ocean/10 px-5 py-3 text-xs text-midsea-ink/60">
            {labels.disclaimer}
          </footer>
        </aside>
      </div>
    </>
  );
}
