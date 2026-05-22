/**
 * Tokenizer markdown → bloques estructurados para LessonMarkdown.tsx.
 *
 * Lo extraemos del componente para que sea testeable sin levantar
 * react-katex en el entorno de vitest. LessonMarkdown.tsx importa y
 * renderiza; este modulo es la logica de parsing pura.
 */

export type Block =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'mathBlock'; tex: string }
  | { type: 'image'; description: string };

export function tokenize(markdown: string): Block[] {
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

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^\s*\{\{IMAGE:/i.test(line)) {
      flushParagraph();
      flushList();
      const m = line.match(/\{\{IMAGE:\s*(.+?)\}\}/i);
      if (m) blocks.push({ type: 'image', description: m[1].trim() });
      continue;
    }

    if (listKind) flushList();
    buffer.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}
