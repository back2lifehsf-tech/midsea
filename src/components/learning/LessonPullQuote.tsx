// Rediseño v3: pull quote con borde teal izquierdo, texto serif itálico.
// Server Component puro. El texto viene del summary de la lección (page.tsx).

export function LessonPullQuote({ text }: { text: string }) {
  if (!text) return null;
  return (
    <blockquote className="my-6 border-l-[3px] border-midsea-lagoon pl-4 font-serif text-[15px] italic leading-relaxed text-midsea-ink/75">
      {text}
    </blockquote>
  );
}
