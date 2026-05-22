#!/usr/bin/env node
/**
 * Genera un sitio HTML estatico con las 280 lecciones para que un
 * reviewer externo pueda leer todas las lecciones del Pilot Minimo
 * sin necesidad de levantar el dev server ni la app.
 *
 * Uso:
 *   node scripts/export-review-html.mjs
 *
 * Lee outputs/gen/ (todos los cursos) y escribe a outputs/review-site/.
 * Despues vos zipeas outputs/review-site/ y lo compartis por Drive.
 *
 * Estructura del sitio:
 *   outputs/review-site/
 *     index.html                  — landing con stats + links a los 8 cursos
 *     style.css                   — estilos shared
 *     <course-slug>/
 *       index.html                — overview del curso + lista de lecciones
 *       <lesson-slug>.html        — leccion individual: ES + EN side-by-side
 *
 * Cada lección renderiza:
 *   - Metadata (titulo, mes, estMinutes, competencyCode)
 *   - contentMarkdownEs y contentMarkdownEn renderizados a HTML
 *   - KaTeX `$...$` y `$$...$$` via auto-render desde CDN
 *   - Placeholders {{IMAGE: ...}} como cajas grises
 *   - 3 actividades con respuesta correcta visible (para revision)
 *   - Reflexion cristiana cuando existe
 *   - Quiz final con respuestas correctas visibles
 *
 * El reviewer puede comentar via channel paralelo (Google Doc, Slack,
 * email) referenciando el slug de la leccion.
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG, listCourseSlugs } from './lib/catalog-map.mjs';
import { repoRoot } from './lib/env.mjs';

const OUTPUT_DIR = path.join(repoRoot(), 'outputs', 'review-site');
const GEN_DIR = path.join(repoRoot(), 'outputs', 'gen');

// ─────────────────────────────────────────────────────────────
// Markdown → HTML (subset que produce el prompt v1.1)
// ─────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

function inlineMd(text) {
  // No escapamos KaTeX inline `$...$` para que el auto-render lo capture.
  // Sí escapamos el resto. Procesamos por partes: split en tokens KaTeX y
  // procesamos cada parte no-KaTeX por separado.
  const parts = text.split(/(\$[^$\n]+\$)/g);
  return parts
    .map((p) => {
      if (!p) return '';
      if (p.startsWith('$') && p.endsWith('$') && p.length > 1) return p;
      let escaped = escapeHtml(p);
      escaped = escaped.replace(
        /\{\{IMAGE:\s*([^}]+)\}\}/gi,
        (_, d) => `<span class="img-inline">[IMG: ${d.trim()}]</span>`
      );
      escaped = escaped.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
      escaped = escaped.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
      return escaped;
    })
    .join('');
}

function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let buffer = [];
  let listKind = null;
  let listItems = [];

  const flushPara = () => {
    if (buffer.length) {
      const text = buffer.join('\n').trim();
      if (text) out.push(`<p>${inlineMd(text)}</p>`);
    }
    buffer = [];
  };
  const flushList = () => {
    if (listKind && listItems.length) {
      const tag = listKind;
      out.push(
        `<${tag}>${listItems.map((li) => `<li>${inlineMd(li)}</li>`).join('')}</${tag}>`
      );
    }
    listItems = [];
    listKind = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');

    if (/^\s*\$\$/.test(line)) {
      flushPara();
      flushList();
      const inline = line.match(/^\s*\$\$(.+?)\$\$\s*$/);
      if (inline) {
        out.push(`<div class="math-block">$$${inline[1]}$$</div>`);
        continue;
      }
      const collected = [line.replace(/^\s*\$\$/, '')];
      while (++i < lines.length && !/\$\$\s*$/.test(lines[i])) {
        collected.push(lines[i]);
      }
      if (i < lines.length) {
        collected.push(lines[i].replace(/\$\$\s*$/, ''));
      }
      out.push(`<div class="math-block">$$${collected.join('\n').trim()}$$</div>`);
      continue;
    }

    const h = line.match(/^(#{2,4})\s+(.+)$/);
    if (h) {
      flushPara();
      flushList();
      out.push(`<h${h[1].length}>${inlineMd(h[2].trim())}</h${h[1].length}>`);
      continue;
    }

    const ul = line.match(/^\s*-\s+(.+)$/);
    if (ul) {
      flushPara();
      if (listKind && listKind !== 'ul') flushList();
      listKind = 'ul';
      listItems.push(ul[1].trim());
      continue;
    }

    const ol = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ol) {
      flushPara();
      if (listKind && listKind !== 'ol') flushList();
      listKind = 'ol';
      listItems.push(ol[1].trim());
      continue;
    }

    if (line.trim() === '') {
      flushPara();
      flushList();
      continue;
    }

    if (/^\s*\{\{IMAGE:/i.test(line)) {
      flushPara();
      flushList();
      const m = line.match(/\{\{IMAGE:\s*(.+?)\}\}/i);
      if (m) out.push(`<div class="img-block">[IMG: ${escapeHtml(m[1].trim())}]</div>`);
      continue;
    }

    if (listKind) flushList();
    buffer.push(line);
  }
  flushPara();
  flushList();
  return out.join('\n');
}

// ─────────────────────────────────────────────────────────────
// Renderers de bloques específicos (activities, quiz)
// ─────────────────────────────────────────────────────────────

function renderActivity(a, idx) {
  let header = `<h4>Actividad ${idx + 1} <span class="badge">${a.type}</span></h4>`;
  let body = '';
  if (a.type === 'multiple_choice') {
    const opts = (lang, options) =>
      options
        .map(
          (o, i) =>
            `<li class="${i === a.correctIndex ? 'correct' : ''}">${i === a.correctIndex ? '✓ ' : ''}${escapeHtml(o)}</li>`
        )
        .join('');
    body = `
      <div class="bi-lang">
        <div class="lang"><span class="lang-tag">ES</span><p>${inlineMd(a.promptEs)}</p>
          <ol class="options">${opts('es', a.optionsEs)}</ol></div>
        <div class="lang"><span class="lang-tag">EN</span><p>${inlineMd(a.promptEn)}</p>
          <ol class="options">${opts('en', a.optionsEn)}</ol></div>
      </div>
      ${a.explanationEs ? `<p class="explanation"><strong>Explicación:</strong> ${escapeHtml(a.explanationEs)} <em>(EN: ${escapeHtml(a.explanationEn ?? '')})</em></p>` : ''}
    `;
  } else if (a.type === 'fill_in_blank') {
    body = `
      <div class="bi-lang">
        <div class="lang"><span class="lang-tag">ES</span><p>${inlineMd(a.promptEs)}</p>
          <p class="answers"><strong>Aceptadas:</strong> ${a.acceptedAnswersEs.map((x) => `<code>${escapeHtml(x)}</code>`).join(', ')}</p></div>
        <div class="lang"><span class="lang-tag">EN</span><p>${inlineMd(a.promptEn)}</p>
          <p class="answers"><strong>Accepted:</strong> ${a.acceptedAnswersEn.map((x) => `<code>${escapeHtml(x)}</code>`).join(', ')}</p></div>
      </div>
    `;
  } else if (a.type === 'short_answer') {
    body = `
      <div class="bi-lang">
        <div class="lang"><span class="lang-tag">ES</span><p>${inlineMd(a.promptEs)}</p>
          <p class="answers"><strong>Keywords:</strong> ${a.rubricKeywordsEs.map((x) => `<code>${escapeHtml(x)}</code>`).join(', ')}</p>
          ${a.sampleAnswerEs ? `<p><em>Sample: ${escapeHtml(a.sampleAnswerEs)}</em></p>` : ''}</div>
        <div class="lang"><span class="lang-tag">EN</span><p>${inlineMd(a.promptEn)}</p>
          <p class="answers"><strong>Keywords:</strong> ${a.rubricKeywordsEn.map((x) => `<code>${escapeHtml(x)}</code>`).join(', ')}</p></div>
      </div>
    `;
  } else if (a.type === 'step_by_step') {
    body = `
      <div class="bi-lang">
        <div class="lang"><span class="lang-tag">ES</span><p>${inlineMd(a.promptEs)}</p>
          <ol class="steps">${a.stepsEs.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol></div>
        <div class="lang"><span class="lang-tag">EN</span><p>${inlineMd(a.promptEn)}</p>
          <ol class="steps">${a.stepsEn.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol></div>
      </div>
      <p class="explanation"><em>Los pasos están en el orden correcto. En la app se barajan para el estudiante.</em></p>
    `;
  }
  return `<div class="activity">${header}${body}</div>`;
}

function renderQuizQuestion(q, idx) {
  let body = '';
  const header = `<h4>Pregunta ${idx + 1} <span class="badge">${q.type}</span></h4>`;
  if (q.type === 'multiple_choice') {
    const opts = (opts) =>
      opts
        .map(
          (o, i) =>
            `<li class="${i === q.correctIndex ? 'correct' : ''}">${i === q.correctIndex ? '✓ ' : ''}${escapeHtml(o)}</li>`
        )
        .join('');
    body = `
      <div class="bi-lang">
        <div class="lang"><span class="lang-tag">ES</span><p>${inlineMd(q.promptEs)}</p>
          <ol class="options">${opts(q.optionsEs)}</ol></div>
        <div class="lang"><span class="lang-tag">EN</span><p>${inlineMd(q.promptEn)}</p>
          <ol class="options">${opts(q.optionsEn)}</ol></div>
      </div>
    `;
  } else if (q.type === 'fill_in_blank') {
    body = `
      <div class="bi-lang">
        <div class="lang"><span class="lang-tag">ES</span><p>${inlineMd(q.promptEs)}</p>
          <p class="answers"><strong>Aceptadas:</strong> ${q.acceptedAnswersEs.map((x) => `<code>${escapeHtml(x)}</code>`).join(', ')}</p></div>
        <div class="lang"><span class="lang-tag">EN</span><p>${inlineMd(q.promptEn)}</p>
          <p class="answers"><strong>Accepted:</strong> ${q.acceptedAnswersEn.map((x) => `<code>${escapeHtml(x)}</code>`).join(', ')}</p></div>
      </div>
    `;
  } else if (q.type === 'short_answer') {
    body = `
      <div class="bi-lang">
        <div class="lang"><span class="lang-tag">ES</span><p>${inlineMd(q.promptEs)}</p>
          <p class="answers"><strong>Keywords:</strong> ${q.rubricKeywordsEs.map((x) => `<code>${escapeHtml(x)}</code>`).join(', ')}</p></div>
        <div class="lang"><span class="lang-tag">EN</span><p>${inlineMd(q.promptEn)}</p>
          <p class="answers"><strong>Keywords:</strong> ${q.rubricKeywordsEn.map((x) => `<code>${escapeHtml(x)}</code>`).join(', ')}</p></div>
      </div>
    `;
  }
  return `<div class="quiz-question">${header}${body}</div>`;
}

// ─────────────────────────────────────────────────────────────
// HTML page templates
// ─────────────────────────────────────────────────────────────

function pageHead(title) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Midsea Review</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]});"></script>
<link rel="stylesheet" href="${title === 'Midsea Pilot — Catálogo de Review' ? './style.css' : '../style.css'}">
</head>
<body>`;
}

function lessonPage(lesson, course, courseSlug) {
  const refEs = lesson.reflectionEs;
  const refEn = lesson.reflectionEn;
  return `${pageHead(lesson.titleEs)}
<header class="page-header">
  <a href="./index.html" class="back-link">← Volver al curso</a>
  <p class="course-name">${escapeHtml(course.titleEs)}</p>
  <h1>${escapeHtml(lesson.titleEs)}</h1>
  <p class="title-en"><em>${escapeHtml(lesson.titleEn)}</em></p>
  <dl class="meta">
    <dt>Mes</dt><dd>${lesson.monthIndex}/10</dd>
    <dt>Tema</dt><dd>${escapeHtml(lesson.topicTitleEs)}</dd>
    <dt>Tiempo estimado</dt><dd>${lesson.estMinutes} min</dd>
    <dt>Slug</dt><dd><code>${escapeHtml(lesson.slug)}</code></dd>
    <dt>Competencia</dt><dd><code>${escapeHtml(lesson.competencyCode)}</code></dd>
  </dl>
</header>

<section class="summary">
  <h2>Resumen</h2>
  <div class="bi-lang">
    <div class="lang"><span class="lang-tag">ES</span><p>${escapeHtml(lesson.summaryEs)}</p></div>
    <div class="lang"><span class="lang-tag">EN</span><p>${escapeHtml(lesson.summaryEn)}</p></div>
  </div>
  <p class="competency-desc"><strong>Lo que se desarrolla:</strong> ${escapeHtml(lesson.competencyDescriptionEs)} <em>(EN: ${escapeHtml(lesson.competencyDescriptionEn)})</em></p>
</section>

<section class="content">
  <h2>Contenido (Español)</h2>
  <div class="markdown">${markdownToHtml(lesson.contentMarkdownEs)}</div>
  <details>
    <summary>Ver contenido en inglés</summary>
    <div class="markdown">${markdownToHtml(lesson.contentMarkdownEn)}</div>
  </details>
</section>

<section class="activities">
  <h2>Actividades intercaladas (${lesson.activities.length})</h2>
  ${lesson.activities.map((a, i) => renderActivity(a, i)).join('\n')}
</section>

${
  refEs
    ? `<section class="reflection">
  <h2>Momento de reflexión cristiana</h2>
  <div class="bi-lang">
    <div class="lang"><span class="lang-tag">ES</span><p><em>${escapeHtml(refEs)}</em></p></div>
    <div class="lang"><span class="lang-tag">EN</span><p><em>${escapeHtml(refEn ?? '')}</em></p></div>
  </div>
</section>`
    : ''
}

<section class="quiz">
  <h2>Quiz final (${lesson.quiz.questions.length} preguntas)</h2>
  ${lesson.quiz.questions.map((q, i) => renderQuizQuestion(q, i)).join('\n')}
</section>

<section class="handson">
  <h2>Hands-on al cierre</h2>
  <div class="bi-lang">
    <div class="lang"><span class="lang-tag">ES</span><p>${escapeHtml(lesson.handsOnSuggestionEs)}</p></div>
    <div class="lang"><span class="lang-tag">EN</span><p>${escapeHtml(lesson.handsOnSuggestionEn)}</p></div>
  </div>
</section>

<footer class="page-footer">
  <p>Generado por Midsea Academy — Pilot HS Latam</p>
  <p>Slug: <code>${escapeHtml(lesson.slug)}</code> · Modelo: ${escapeHtml(lesson.metadata.model)} · Prompt: ${escapeHtml(lesson.metadata.promptVersion)}</p>
</footer>
</body></html>`;
}

function courseIndexPage(course, courseSlug, lessons) {
  const byMonth = new Map();
  for (const l of lessons) {
    if (!byMonth.has(l.monthIndex)) byMonth.set(l.monthIndex, []);
    byMonth.get(l.monthIndex).push(l);
  }
  const sortedMonths = [...byMonth.keys()].sort((a, b) => a - b);
  const monthHtml = sortedMonths
    .map((m) => {
      const items = byMonth
        .get(m)
        .sort((a, b) => a.lessonOrderIndex - b.lessonOrderIndex)
        .map(
          (l) =>
            `<li><a href="./${l.slug}.html">${escapeHtml(l.titleEs)}</a> <span class="muted">— ${escapeHtml(l.topicTitleEs)}</span></li>`
        )
        .join('');
      return `<section class="month"><h3>Mes ${m}</h3><ul>${items}</ul></section>`;
    })
    .join('\n');
  return `${pageHead(course.titleEs)}
<header class="page-header">
  <a href="../index.html" class="back-link">← Volver al catálogo</a>
  <h1>${escapeHtml(course.titleEs)}</h1>
  <p class="title-en"><em>${escapeHtml(course.titleEn)}</em></p>
  <dl class="meta">
    <dt>Materia</dt><dd>${escapeHtml(course.subject)}</dd>
    <dt>Grado</dt><dd>${escapeHtml(course.gradeBand)}</dd>
    <dt>Lecciones</dt><dd>${lessons.length}</dd>
  </dl>
</header>
<main>
${monthHtml}
</main>
<footer class="page-footer">
  <p>Midsea Academy — Pilot HS Latam</p>
</footer>
</body></html>`;
}

function masterIndexPage(stats) {
  const total = stats.reduce((acc, s) => acc + s.count, 0);
  const cards = stats
    .map(
      (s) => `<a class="course-card" href="./${s.slug}/index.html">
  <span class="badge">${escapeHtml(s.subject)}</span>
  <h2>${escapeHtml(s.titleEs)}</h2>
  <p class="title-en"><em>${escapeHtml(s.titleEn)}</em></p>
  <p class="count">${s.count} lecciones</p>
</a>`
    )
    .join('\n');
  return `${pageHead('Midsea Pilot — Catálogo de Review')}
<header class="page-header">
  <h1>Midsea Pilot HS — Catálogo de Review</h1>
  <p>Borradores generados por GPT-4o (prompt v1.1) listos para revisión humana.</p>
  <p class="stats"><strong>${total} lecciones</strong> distribuidas en <strong>${stats.length} cursos</strong>.</p>
</header>

<section class="how-to-review">
  <h2>Cómo revisar</h2>
  <p>Para cada lección, te pedimos verificar:</p>
  <ul>
    <li><strong>Tono LATAM neutro</strong>: usa "tú" (no "vos", no "vosotros"); sin localismos rioplatenses, peninsulares, mexicanos, colombianos, etc.</li>
    <li><strong>Cosmovisión cristiana respetuosa</strong>: referencias naturales cuando aplica, sin proselitismo, denominacionalmente abierta (apta para católicos, evangélicos, ortodoxos, protestantes históricos).</li>
    <li><strong>Contenido conceptualmente correcto</strong>: sin errores de hecho, fórmulas matemáticas válidas, hechos históricos correctos.</li>
    <li><strong>Tono académico-respetuoso al adolescente</strong> (13-17 años): no infantil, no condescendiente.</li>
    <li><strong>Actividades demostrables</strong>: obligan a pensar, no son decoración.</li>
    <li><strong>Quiz con respuestas correctas inequívocas</strong>: las marcadas con ✓ verde son las correctas.</li>
    <li><strong>Traducción EN culturalmente correcta</strong>: no calque literal.</li>
  </ul>
  <p>Si encontrás un issue en una lección puntual, anotá el <code>slug</code> (visible al pie de cada lección) y enviános tu feedback por el canal que hayamos acordado.</p>
</section>

<section class="courses">
  <h2>Cursos</h2>
  <div class="course-grid">
    ${cards}
  </div>
</section>

<footer class="page-footer">
  <p>Midsea Academy — Pilot HS Latinoamérica · Generado ${new Date().toISOString().slice(0, 10)}</p>
</footer>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const STYLE_CSS = `
* { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 980px; margin: 0 auto; padding: 2rem 1.5rem 4rem; line-height: 1.6; color: #1f2937; background: #fafaf7; }
h1 { color: #0c4a6e; font-size: 2rem; margin: 0.5rem 0 0.25rem; }
h2 { color: #0c4a6e; font-size: 1.5rem; margin-top: 2.5rem; border-bottom: 2px solid #bae6fd; padding-bottom: 0.4rem; }
h3 { color: #075985; font-size: 1.2rem; margin-top: 1.5rem; }
h4 { color: #0369a1; font-size: 1rem; margin-top: 1.25rem; margin-bottom: 0.5rem; }
a { color: #0284c7; text-decoration: none; }
a:hover { text-decoration: underline; }
.back-link { display: inline-block; margin-bottom: 1rem; font-size: 0.9rem; color: #64748b; }
.course-name { font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
.title-en { color: #64748b; margin-top: 0; font-size: 1.1rem; }
.muted { color: #94a3b8; font-size: 0.9rem; }
.badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; vertical-align: middle; margin-left: 0.5rem; }
.page-header { background: white; padding: 1.5rem 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-left: 4px solid #0284c7; }
.page-footer { margin-top: 4rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #94a3b8; font-size: 0.85rem; }
.meta { display: grid; grid-template-columns: max-content 1fr; gap: 0.3rem 1rem; margin-top: 0.8rem; font-size: 0.9rem; }
.meta dt { color: #64748b; font-weight: 600; }
.meta dd { margin: 0; color: #334155; }
code { background: #f1f5f9; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.85em; }
.bi-lang { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 0.5rem 0; }
@media (max-width: 720px) { .bi-lang { grid-template-columns: 1fr; } }
.lang { background: white; padding: 0.75rem 1rem; border-radius: 8px; border-left: 3px solid #cbd5e1; }
.lang:nth-child(2) { border-left-color: #fbbf24; background: #fffbeb; }
.lang-tag { display: inline-block; background: #1e293b; color: white; padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.7rem; font-weight: bold; margin-bottom: 0.25rem; }
.lang:nth-child(2) .lang-tag { background: #d97706; }
.markdown { background: white; padding: 1.5rem 2rem; border-radius: 8px; }
.markdown p { margin: 0.75rem 0; }
.markdown ol, .markdown ul { margin: 0.5rem 0 0.5rem 1.5rem; }
.math-block { background: #f8fafc; padding: 0.75rem; border-radius: 6px; margin: 0.75rem 0; overflow-x: auto; text-align: center; }
.img-block, .img-inline { display: inline-block; background: #e5e7eb; color: #6b7280; padding: 0.5rem 1rem; border-radius: 4px; font-style: italic; font-size: 0.9em; border: 1px dashed #9ca3af; }
.img-block { display: block; text-align: center; margin: 1rem 0; padding: 1.5rem; }
.activity, .quiz-question { background: #f0f9ff; padding: 1rem 1.25rem; border-radius: 8px; margin: 1rem 0; border-left: 3px solid #38bdf8; }
.quiz-question { background: #fef3c7; border-left-color: #f59e0b; }
.options, .steps { list-style: none; padding: 0; margin: 0.5rem 0; }
.options li, .steps li { background: white; padding: 0.4rem 0.75rem; margin: 0.3rem 0; border-radius: 4px; border-left: 2px solid #e5e7eb; }
.options li.correct { background: #d1fae5; border-left-color: #10b981; font-weight: 600; }
.steps li { counter-increment: step; }
.steps { counter-reset: step; padding-left: 1.5rem; list-style-position: outside; }
.answers { font-size: 0.9em; color: #475569; margin-top: 0.4rem; }
.explanation { background: white; padding: 0.5rem 0.75rem; margin-top: 0.5rem; border-radius: 4px; font-size: 0.9em; color: #475569; border-left: 2px solid #cbd5e1; }
.reflection { background: #fef9c3; padding: 1.5rem 2rem; border-radius: 8px; border-left: 4px solid #ca8a04; }
.handson { background: #ecfccb; padding: 1rem 1.5rem; border-radius: 8px; border-left: 4px solid #84cc16; }
.competency-desc { background: #fafaf7; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.9em; margin-top: 1rem; }
.summary p { font-size: 1rem; }
.month { margin-bottom: 1.5rem; }
.month ul { list-style: none; padding-left: 0; }
.month li { background: white; padding: 0.6rem 1rem; margin: 0.3rem 0; border-radius: 6px; border-left: 3px solid #cbd5e1; }
.course-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem; }
.course-card { display: block; background: white; padding: 1.25rem 1.5rem; border-radius: 10px; border: 1px solid #e5e7eb; transition: all 0.15s; }
.course-card:hover { border-color: #0284c7; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.1); text-decoration: none; transform: translateY(-1px); }
.course-card h2 { margin: 0.5rem 0 0.25rem; font-size: 1.1rem; border: none; padding: 0; }
.course-card .count { color: #64748b; font-size: 0.9rem; margin: 0.5rem 0 0; }
.stats { font-size: 1.1rem; color: #334155; }
.how-to-review { background: white; padding: 1.5rem 2rem; border-radius: 10px; margin: 2rem 0; border-left: 4px solid #fbbf24; }
.how-to-review ul { padding-left: 1.5rem; }
.how-to-review li { margin: 0.4rem 0; }
details summary { cursor: pointer; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 6px; margin-top: 1rem; font-weight: 600; color: #475569; }
details[open] summary { background: #e0f2fe; color: #0c4a6e; }
`;

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

function loadLessons(courseSlug) {
  const dir = path.join(GEN_DIR, courseSlug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.invalid.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      } catch (e) {
        console.warn(`  ⚠ no se pudo parsear ${f}: ${e.message}`);
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) =>
      a.monthIndex !== b.monthIndex
        ? a.monthIndex - b.monthIndex
        : a.lessonOrderIndex - b.lessonOrderIndex
    );
}

function main() {
  // Clean output dir.
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'style.css'), STYLE_CSS);

  const stats = [];
  for (const slug of listCourseSlugs()) {
    const course = CATALOG[slug];
    const lessons = loadLessons(slug);
    if (lessons.length === 0) {
      console.log(`· ${slug}: 0 lecciones (skipped)`);
      continue;
    }
    const courseDir = path.join(OUTPUT_DIR, slug);
    fs.mkdirSync(courseDir, { recursive: true });
    fs.writeFileSync(
      path.join(courseDir, 'index.html'),
      courseIndexPage(course, slug, lessons)
    );
    for (const lesson of lessons) {
      fs.writeFileSync(
        path.join(courseDir, `${lesson.slug}.html`),
        lessonPage(lesson, course, slug)
      );
    }
    stats.push({
      slug,
      titleEs: course.titleEs,
      titleEn: course.titleEn,
      subject: course.subject,
      count: lessons.length
    });
    console.log(`✓ ${slug}: ${lessons.length} lecciones`);
  }
  // Master index.
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), masterIndexPage(stats));
  console.log(
    `\nDONE — sitio en outputs/review-site/ (${stats.reduce((a, s) => a + s.count, 0)} lecciones, ${stats.length} cursos)`
  );
  console.log(
    'Para compartir: zippeá outputs/review-site/ y subilo a Drive/Dropbox. El reviewer abre index.html.'
  );
}

main();
