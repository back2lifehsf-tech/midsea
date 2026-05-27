'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Íconos inline (sin lucide-react — mismo patrón que el resto del codebase)
function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

interface Props {
  examId: string;
  courseSlug: string;
  locale: string;
}

export default function ExamStartButton({ examId, courseSlug, locale }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch(`/api/exam/${examId}/start`, { method: 'POST' });
      if (!res.ok) throw new Error('start_failed');
      router.push(`/${locale}/student/courses/${courseSlug}/exam/${examId}/take`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-midsea-lagoon text-white font-medium text-sm py-3 hover:bg-midsea-lagoon/90 transition-colors disabled:opacity-60"
    >
      {loading ? 'Iniciando...' : 'Comenzar examen'}
      {!loading && <IconArrowRight size={16} />}
    </button>
  );
}
