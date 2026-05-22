/**
 * Mini-renderer markdown → JSX para Epic 04 Tarea 5.
 *
 * Cubre el subset que produce el prompt v1.1 (scripts/prompts/
 * lesson-generator-v1.md): headers (## y ###), parrafos, listas
 * (`- ` y `1. `), KaTeX inline (`$...$`) y block (`$$...$$`), placeholders
 * `{{IMAGE: descripcion}}`, **bold** y *italic*.
 *
 * Por que no react-markdown: guardrail del epic dice solo katex + react-katex.
 * El prompt produce markdown controlado — un parser a mano cubre el caso.
 */
import { Fragment } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

type Block =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'mathBlock'; tex: string }
  | { type: 'image'; description: string };

function tokenize(markdown: string): Block[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: Block[] = [];
  let buffer: string[] = [];
  let listKind: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    const text = buffer.join('\n').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    buffer = [];
  };
  const flushList = () => {
    if (listItems.length && listKind) {
      blocks.push({ type: listKind, items: listItems });
    }
    listItems = [];
    listKind = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/\r$/, '');

    // Block math `$$...$$` — soporta single-line y multi-line.
    if (/^\s*\$\$/.test(line)) {
      flushParagraph();
      flushList();
      const inline = line.match(/^\s*\$\$(.+?)\$\$\s*$/);
      if (inline) {
        blocks.push({ type: 'mathBlock', tex: inline[1].trim() });
        continue;
      }
      // multi-line: acumular hasta el siguiente `$$`.
      const collected: string[] = [line.replace(/^\s*\$\$/, '')];
      while (++i < lines.length && !/\$\$\s*$/.test(lines[i])) {
        collected.push(lines[i]);
      }
      if (i < lines.length) {
        collected.push(lines[i].replace(/\$\$\s*$/, ''));
      }
      blocks.push({ type: 'mathBlock', tex: collected.join('\n').trim() });
      continue;
    }

    // Heading
    const h = line.match(/^(#{2,4})\s+(.+)$/);
    if (h) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: h[1].length as 2 | 3 | 4,
        text: h[2].trim()
      });
      continue;
    }

    // Bullet list
    const ul = line.match(/^\s*-\s+(.+)$/);
    if (ul) {
      flushParagraph();
      if (listKind && listKind !== 'ul') flushList();
      listKind = 'ul';
      listItems.push(ul[1].trim());
      continue;
    }
    // Ordered list
    const ol = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ol) {
      flushParagraph();
      if (listKind && listKind !== 'ol') flushList();
      listKind = 'ol';
      listItems.push(ol[1].trim());
      continue;
    }

    // Linea vacia: termina parrafo/lista.
    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    // Imagen placeholder en linea propia o como prefijo.
    if (/^\s*\{\{IMAGE:/i.test(line)) {
      flushParagraph();
      flushList();
      const m = line.match(/\{\{IMAGE:\s*(.+?)\}\}/i);
      if (m) blocks.push({ type: 'image', description: m[1].trim() });
      continue;
    }

    // Acumular en parrafo en curso.
    if (listKind) flushList();
    buffer.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

/**
 * Renderiza inline text: KaTeX `$...$`, **bold**, *italic*,
 * `{{IMAGE: ...}}` inline (raro pero soportado).
 */
function renderInline(text: string, keyPrefix: string) {
  // Split en tokens: $...$ | **...** | *...* | {{IMAGE:...}} | plain.
  // Regex con capturas para distinguir cada tipo.
  const pattern =
    /(\$[^$\n]+\$|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\{\{IMAGE:\s*[^}]+\}\})/g;
  const parts = text.split(pattern);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!part) return null;
    if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
      return <InlineMath key={key} math={part.slice(1, -1)} />;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const img = part.match(/^\{\{IMAGE:\s*(.+?)\}\}$/i);
    if (img) {
      return (
        <ImagePlaceholder key={key} description={img[1].trim()} inline />
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function ImagePlaceholder({
  description,
  inline = false
}: {
  description: string;
  inline?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={description}
      className={[
        'block rounded-xl border border-dashed border-midsea-ocean/30 bg-midsea-foam/70 px-4 py-6 text-center text-sm italic text-midsea-ink/60',
        inline ? 'my-2 mx-0' : 'my-4'
      ].join(' ')}
    >
      {description}
    </span>
  );
}

export function LessonMarkdown({ markdown }: { markdown: string }) {
  const blocks = tokenize(markdown);
  return (
    <div className="prose prose-midsea max-w-none text-[15px] leading-relaxed text-midsea-ink">
      {blocks.map((block, i) => {
        const key = `b-${i}`;
        switch (block.type) {
          case 'heading': {
            const Tag = `h${block.level}` as 'h2' | 'h3' | 'h4';
            const cls =
              block.level === 2
                ? 'mt-6 font-display text-xl font-bold text-midsea-deep'
                : block.level === 3
                  ? 'mt-5 font-display text-lg font-semibold text-midsea-deep'
                  : 'mt-4 font-display text-base font-semibold text-midsea-deep';
            return (
              <Tag key={key} className={cls}>
                {renderInline(block.text, key)}
              </Tag>
            );
          }
          case 'paragraph':
            return (
              <p key={key} className="mt-3 text-midsea-ink">
                {renderInline(block.text, key)}
              </p>
            );
          case 'ul':
            return (
              <ul key={key} className="ml-5 mt-3 list-disc space-y-1">
                {block.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key} className="ml-5 mt-3 list-decimal space-y-1">
                {block.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          case 'mathBlock':
            return (
              <div key={key} className="my-4 overflow-x-auto py-1">
                <BlockMath math={block.tex} />
              </div>
            );
          case 'image':
            return <ImagePlaceholder key={key} description={block.description} />;
        }
      })}
    </div>
  );
}
