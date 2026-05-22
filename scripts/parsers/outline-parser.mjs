/**
 * Outline parser dual A/B — ADR-006 §2.
 *
 * Lee un outline .md del founder (en docs/content/source/) y lo normaliza
 * a una estructura común consumible por scripts/generate-lesson.mjs.
 *
 * Formatos detectables:
 *   A — "Primaria-style con Producto del estudiante" (Sociales, Música,
 *       ESL con variante semanal de 4 días). 1 tema por mes.
 *   B — "HS-denso 2 temas/mes" (Mat, Lengua, Ciencias HS). Sin "Producto
 *       del estudiante", 2 `### Tema:` por mes con 4 hands-on cada uno.
 *
 * El markdown viene tal cual lo emite pandoc (.docx → .md) — usa `\-`
 * para bullets y `\|` para tablas. El parser tolera ambas formas.
 *
 * Output:
 * {
 *   format: 'A' | 'B',
 *   metadata: { gradeBand?, frecuencia?, enfoque?, baseCurricular?, calendario? },
 *   months: [
 *     {
 *       monthName: 'Marzo', monthIndex: 1,
 *       monthTitle?: 'Mundo Helenístico',          // suffix tras `–` en el header
 *       topics: [
 *         {
 *           title: 'Conjuntos y números reales',
 *           contents?: 'Alejandro Magno y la ...',  // Formato A
 *           handsOn: ['Diagramas de Venn', ...],
 *           product?: 'Mapa comentado',             // Formato A
 *           christianFocus: boolean,                // detectado por keywords
 *           esl?: { unidad, vocabulario, estructuras, semanaTipo: [...] }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

export const SPANISH_MONTHS = Object.freeze({
  MARZO: 1,
  ABRIL: 2,
  MAYO: 3,
  JUNIO: 4,
  JULIO: 5,
  AGOSTO: 6,
  SEPTIEMBRE: 7,
  OCTUBRE: 8,
  NOVIEMBRE: 9,
  DICIEMBRE: 10
});

const CHRISTIAN_KEYWORDS = [
  'cristian',
  'bíblic',
  'biblic',
  'valores cristianos',
  'reflexión cristiana',
  'reflexion cristiana',
  'reflexión fe',
  'reflexion fe',
  'cierre bíblico',
  'cierre biblico',
  'fe y ciencia'
];

const NON_MONTH_HEADERS = new Set([
  'OBJETIVOS DEL AÑO',
  'OBJETIVOS DEL ANO',
  'OBJETIVOS',
  'INTRODUCCIÓN',
  'INTRODUCCION',
  'METODOLOGÍA',
  'METODOLOGIA',
  'EVALUACIÓN',
  'EVALUACION'
]);

// Pandoc escapa guiones (`-` → `\-`) y a veces pipes (`|` → `\|`). Esta
// función limpia el line para extraer el texto real del bullet.
function cleanBulletLine(line) {
  return line
    .replace(/^\s*\\?-\s+/, '')
    .replace(/\\\|/g, '|')
    .replace(/\\([_*~])/g, '$1')
    .replace(/\\\\$/, '') // pandoc emite `\` al final del párrafo
    .trim();
}

function stripPandocBackslashes(text) {
  return text
    .replace(/\\\|/g, '|')
    .replace(/\\([_*~-])/g, '$1')
    .replace(/\\\\$/gm, '')
    .trim();
}

function hasChristianFocus(...texts) {
  const joined = texts.filter(Boolean).join('\n').toLowerCase();
  return CHRISTIAN_KEYWORDS.some((k) => joined.includes(k));
}

export function detectFormat(markdown) {
  const hasProducto = /^Producto del estudiante:/im.test(markdown);
  const hasSemanaTipo = /^### Semana tipo/im.test(markdown);
  const hasTemaSection = /^### Tema:/im.test(markdown);
  // Heurística per ADR-006 §2. "Semana tipo" es variante ESL del formato A.
  if (hasProducto || hasSemanaTipo) return 'A';
  if (hasTemaSection) return 'B';
  return 'A';
}

function extractMetadata(markdown) {
  // Primer bloque sin `## ` (header + 1-6 líneas de metadata libre).
  const meta = {};
  const firstHeaderIdx = markdown.search(/^## /m);
  const head = firstHeaderIdx >= 0 ? markdown.slice(0, firstHeaderIdx) : markdown;
  const cleaned = stripPandocBackslashes(head);

  const pick = (re) => {
    const m = cleaned.match(re);
    return m ? m[1].trim() : undefined;
  };

  meta.calendario = pick(/Calendario:\s*(.+)/i);
  meta.frecuencia =
    pick(/Frecuencia:\s*(.+)/i) ?? pick(/Carga horaria(?:\s+sugerida)?:\s*(.+)/i);
  // Dos variantes: "Enfoque: <texto>" (Format A) y "Enfoque cristiano,
  // lógico y formal." sin colon (Format B).
  meta.enfoque =
    pick(/Enfoque(?:\s+anual)?:\s*(.+)/i) ??
    pick(/^Enfoque\s+([a-záéíóúñ][^\n]+?)\.?\s*$/im);
  meta.baseCurricular = pick(/Base curricular:\s*(.+)/i);
  meta.perfil = pick(/Perfil:\s*(.+)/i);
  meta.objetivo = pick(/Objetivo:\s*(.+)/i);

  // Detectar si la cosmovisión cristiana está declarada en metadata.
  meta.declaresChristianFocus = hasChristianFocus(
    meta.enfoque,
    meta.objetivo,
    meta.perfil,
    cleaned
  );

  return meta;
}

// Separa el markdown en secciones por `## ` y devuelve array de
// { headerText, body } SIN procesar el header.
function splitByH2(markdown) {
  const lines = markdown.split(/\r?\n/);
  const out = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(/^## (.+)$/);
    if (m) {
      if (current) out.push(current);
      current = { headerText: m[1].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) out.push(current);
  return out.map((s) => ({ headerText: s.headerText, body: s.body.join('\n') }));
}

// Header `MARZO`, `Marzo`, `Marzo – Repaso armónico`, `MARZO – Mundo
// Helenístico` → { monthName, monthIndex, monthTitle? }. Devuelve null
// si no es un header de mes válido (e.g. `Objetivos del año`).
function parseMonthHeader(headerText) {
  // Aceptar `–`, `—`, `-` como separador opcional.
  const m = headerText.match(/^([A-Za-zÁÉÍÓÚáéíóúÑñ]+)\s*(?:[–—-]\s*(.+))?$/);
  if (!m) return null;
  const upper = m[1].toUpperCase();
  if (NON_MONTH_HEADERS.has(upper)) return null;
  const monthIndex = SPANISH_MONTHS[upper];
  if (!monthIndex) return null;
  return {
    monthName: upper.charAt(0) + upper.slice(1).toLowerCase(),
    monthIndex,
    monthTitle: m[2]?.trim()
  };
}

// Dentro del body de un mes (Format A), extrae bullets de la sección
// `### Actividades Hands-On`. La sección termina cuando aparece el
// próximo `### ` o `## ` o EOF.
function extractHandsOnSection(body, headerRe = /^### Actividades Hands-On/im) {
  const lines = body.split(/\r?\n/);
  const out = [];
  let inSection = false;
  for (const line of lines) {
    if (headerRe.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^##? /.test(line)) break;
    if (!inSection) continue;
    if (/^\s*\\?-\s+/.test(line)) {
      out.push(cleanBulletLine(line));
    }
  }
  return out;
}

// Para Format A no-ESL: el `### Actividades Hands-On` es un heading.
// Para Format B: `Actividades Hands-On:` es texto plano seguido de bullets.
function extractHandsOnBulletsPlain(body) {
  // En Format B, los bullets siguen a "Actividades Hands-On:" y van hasta
  // el siguiente `### Tema:` o `## <mes>`. La línea "Actividades..." NO
  // es header markdown.
  const lines = body.split(/\r?\n/);
  const out = [];
  let inSection = false;
  for (const line of lines) {
    if (/^\s*Actividades Hands-On\s*:/i.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^### |^## /.test(line)) break;
    if (!inSection) continue;
    if (/^\s*\\?-\s+/.test(line)) {
      out.push(cleanBulletLine(line));
    }
  }
  return out;
}

// Para Format A ESL "Semana tipo (4 días)": extrae las 4 líneas Día N:
function extractSemanaTipo(body) {
  const lines = body.split(/\r?\n/);
  const out = [];
  for (const raw of lines) {
    const line = stripPandocBackslashes(raw);
    const m = line.match(/^D[ií]a\s+\d+\s*:\s*(.+)$/i);
    if (m) out.push(m[1].trim());
  }
  return out;
}

function parseFormatA(markdown) {
  const months = [];
  for (const section of splitByH2(markdown)) {
    const monthInfo = parseMonthHeader(section.headerText);
    if (!monthInfo) continue;
    const body = section.body;
    const cleaned = stripPandocBackslashes(body);

    const contentsMatch = cleaned.match(/^Contenidos\s*:\s*(.+)$/m);
    const productMatch = cleaned.match(/^Producto del estudiante\s*:\s*(.+)$/m);

    // ESL detection: "Unidad:" + "Semana tipo (4 días)".
    const unidadMatch = cleaned.match(/^Unidad\s*:\s*(.+)$/m);
    const vocabMatch = cleaned.match(/^Vocabulario\s*:\s*(.+)$/m);
    const estructurasMatch = cleaned.match(/^Estructuras?\s*:\s*(.+)$/m);
    const isEsl = /^### Semana tipo/im.test(body);

    let topic;
    if (isEsl) {
      topic = {
        title: unidadMatch ? unidadMatch[1].trim() : monthInfo.monthTitle ?? monthInfo.monthName,
        contents: vocabMatch ? vocabMatch[1].trim() : undefined,
        handsOn: extractSemanaTipo(body),
        product: undefined,
        christianFocus: hasChristianFocus(cleaned),
        esl: {
          unidad: unidadMatch?.[1].trim(),
          vocabulario: vocabMatch?.[1].trim(),
          estructuras: estructurasMatch?.[1].trim(),
          semanaTipo: extractSemanaTipo(body)
        }
      };
    } else {
      topic = {
        title: monthInfo.monthTitle ?? contentsMatch?.[1].trim() ?? monthInfo.monthName,
        contents: contentsMatch?.[1].trim(),
        handsOn: extractHandsOnSection(body),
        product: productMatch?.[1].trim(),
        christianFocus: hasChristianFocus(cleaned)
      };
    }

    months.push({
      monthName: monthInfo.monthName,
      monthIndex: monthInfo.monthIndex,
      monthTitle: monthInfo.monthTitle,
      topics: [topic]
    });
  }
  return months;
}

function parseFormatB(markdown) {
  const months = [];
  for (const section of splitByH2(markdown)) {
    const monthInfo = parseMonthHeader(section.headerText);
    if (!monthInfo) continue;
    const body = section.body;

    // Split por `### Tema:` para obtener cada bloque de tema.
    const temaBlocks = [];
    let buf = [];
    let currentTitle = null;
    for (const line of body.split(/\r?\n/)) {
      const m = line.match(/^###\s+Tema\s*:\s*(.+)$/i);
      if (m) {
        if (currentTitle !== null) temaBlocks.push({ title: currentTitle, body: buf.join('\n') });
        currentTitle = stripPandocBackslashes(m[1]).trim();
        buf = [];
      } else if (currentTitle !== null) {
        buf.push(line);
      }
    }
    if (currentTitle !== null) temaBlocks.push({ title: currentTitle, body: buf.join('\n') });

    const topics = temaBlocks.map((t) => ({
      title: t.title,
      contents: undefined,
      handsOn: extractHandsOnBulletsPlain(t.body),
      product: undefined,
      christianFocus: hasChristianFocus(stripPandocBackslashes(t.body))
    }));

    if (topics.length > 0) {
      months.push({
        monthName: monthInfo.monthName,
        monthIndex: monthInfo.monthIndex,
        monthTitle: monthInfo.monthTitle,
        topics
      });
    }
  }
  return months;
}

export function parseOutline(markdown) {
  const format = detectFormat(markdown);
  const metadata = extractMetadata(markdown);
  const months = format === 'A' ? parseFormatA(markdown) : parseFormatB(markdown);
  return { format, metadata, months };
}
