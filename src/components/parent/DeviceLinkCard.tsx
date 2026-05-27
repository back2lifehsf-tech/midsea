'use client';

/**
 * DeviceLinkCard — Mejora 11 (Device Pairing).
 *
 * Card en el Parent Dashboard para generar y compartir el link de vinculación
 * de dispositivos. El padre genera el link → lo comparte al estudiante por
 * WhatsApp/email → el estudiante lo abre en su tablet → ya puede entrar solo
 * con su avatar y PIN para siempre en ese dispositivo.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// Íconos inline (sin lucide-react — mismo patrón que el resto del codebase)
function IconSmartphone({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}
function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconLoader({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  );
}

export function DeviceLinkCard() {
  const t = useTranslations('parent.deviceLink');
  const [loading, setLoading] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/device/generate-link', { method: 'POST' });
      if (!res.ok) throw new Error('server_error');
      const data = await res.json() as { linkUrl: string; expiresAt: string };
      setLinkUrl(data.linkUrl);
      setExpiresAt(data.expiresAt);
    } catch {
      setError('No pudimos generar el link. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para contextos sin clipboard API
      const el = document.createElement('textarea');
      el.value = linkUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-xl border border-midsea-border bg-midsea-foam p-5">
      {/* Título */}
      <p className="flex items-center gap-2 text-sm font-semibold text-midsea-ink">
        <IconSmartphone className="text-midsea-lagoon" />
        {t('cardTitle')}
      </p>

      {/* Descripción */}
      <p className="mt-1 mb-4 text-sm leading-snug text-midsea-muted">
        {t('cardDescription')}
      </p>

      {/* Botón generar */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-midsea-deep px-4 py-2.5 text-sm font-semibold text-white shadow-wave transition hover:bg-midsea-lagoon disabled:opacity-60"
      >
        {loading ? (
          <>
            <IconLoader className="animate-spin" />
            {t('generating')}
          </>
        ) : (
          t('generateButton')
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="mt-3 text-xs text-red-500">{error}</p>
      )}

      {/* Link generado */}
      {linkUrl && (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-midsea-border bg-midsea-surface px-3 py-2">
            <span className="flex-1 truncate font-mono text-xs text-midsea-muted">
              {linkUrl}
            </span>
            <button
              onClick={handleCopy}
              aria-label={t('copyButton')}
              className="shrink-0 text-midsea-lagoon transition hover:text-midsea-lagoon/70"
            >
              {copied ? <IconCheck /> : <IconCopy />}
            </button>
          </div>
          {copied && (
            <p className="mt-1 text-xs font-medium text-midsea-lagoon">{t('copied')}</p>
          )}
          <p className="mt-2 text-xs text-midsea-muted">{t('expiresIn')}</p>
        </>
      )}
    </div>
  );
}
