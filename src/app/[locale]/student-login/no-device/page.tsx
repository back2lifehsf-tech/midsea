'use client';

/**
 * /student-login/no-device — Mejora 11 (Device Pairing).
 *
 * Pantalla amigable cuando el estudiante llega a un dispositivo sin la
 * cookie midsea_device_family. Explica cómo pedirle al padre el link y
 * permite pegar el link manualmente si ya lo tiene.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NoDevicePage() {
  const t = useTranslations('student.noDevice');
  const router = useRouter();
  const [showInput, setShowInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = linkValue.trim();
    if (!trimmed) return;
    // Navegar al link que pegó (puede ser URL completa o path relativo)
    try {
      const url = new URL(trimmed);
      router.push(url.pathname + url.search);
    } catch {
      // Si no es URL válida, intentar como path
      router.push(trimmed);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-midsea-sand px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Avatar placeholder */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-midsea-lagoon/20 to-midsea-ocean/20 text-5xl">
          👋
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-xl font-bold text-midsea-deep">
            {t('title')}
          </h1>
          <p className="text-sm leading-relaxed text-midsea-ink/70">
            {t('description')}
          </p>
        </div>

        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="w-full rounded-xl bg-midsea-deep px-5 py-3 text-sm font-semibold text-white shadow-wave transition hover:bg-midsea-lagoon"
          >
            {t('hasLink')}
          </button>
        ) : (
          <form onSubmit={handleLinkSubmit} className="space-y-3">
            <input
              type="url"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder={t('linkPlaceholder')}
              autoFocus
              className="w-full rounded-xl border border-midsea-border bg-white px-4 py-3 text-sm text-midsea-ink placeholder:text-midsea-muted focus:outline-none focus:ring-2 focus:ring-midsea-lagoon"
            />
            <button
              type="submit"
              disabled={!linkValue.trim()}
              className="w-full rounded-xl bg-midsea-deep px-5 py-3 text-sm font-semibold text-white shadow-wave transition hover:bg-midsea-lagoon disabled:opacity-50"
            >
              {t('hasLink')}
            </button>
          </form>
        )}

        <p className="text-xs text-midsea-muted">
          <Link
            href="/login"
            className="underline underline-offset-2 hover:text-midsea-lagoon"
          >
            Entrar como padre
          </Link>
        </p>
      </div>
    </div>
  );
}
