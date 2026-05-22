/**
 * Tests del parser dual A/B (ADR-006).
 *
 * Usa dos outlines reales del corpus como fixtures:
 *   - Formato A: Civilización Antigua II (Sociales) — `Producto del estudiante`.
 *   - Formato B: Matemática 9° — `### Tema:` × 2 por mes.
 *
 * Si los outlines fuente cambian de estructura, estos tests fallan y avisan
 * que hay que re-validar el pipeline.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SPANISH_MONTHS,
  detectFormat,
  parseOutline
} from './outline-parser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

const FIXTURE_A = path.join(
  repoRoot,
  'docs',
  'content',
  'source',
  'Ciencias Sociales',
  'Secundaria',
  'Civilizacion_Antigua_II_Grados_9_10.md'
);
const FIXTURE_B = path.join(
  repoRoot,
  'docs',
  'content',
  'source',
  'Matematicas',
  'Secundaria',
  'Matematica_9_Marzo_Diciembre_Completo.md'
);
const FIXTURE_ESL = path.join(
  repoRoot,
  'docs',
  'content',
  'source',
  'English ESL',
  'Secundaria',
  'Ingles_ESL_Grado_9_Completo_Final.md'
);

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

describe('detectFormat', () => {
  it('detecta formato A en outline con "Producto del estudiante"', () => {
    expect(detectFormat(read(FIXTURE_A))).toBe('A');
  });

  it('detecta formato B en outline HS-denso con "### Tema:"', () => {
    expect(detectFormat(read(FIXTURE_B))).toBe('B');
  });

  it('detecta formato A en ESL con "Semana tipo (4 días)"', () => {
    expect(detectFormat(read(FIXTURE_ESL))).toBe('A');
  });
});

describe('parseOutline — Format A (Civilización Antigua II)', () => {
  const parsed = parseOutline(read(FIXTURE_A));

  it('reporta format A y extrae metadata', () => {
    expect(parsed.format).toBe('A');
    expect(parsed.metadata.calendario).toMatch(/Marzo a Diciembre/i);
    expect(parsed.metadata.baseCurricular).toMatch(/Sociales|Historia/i);
  });

  it('extrae los 10 meses Marzo-Diciembre', () => {
    expect(parsed.months).toHaveLength(10);
    expect(parsed.months[0].monthName).toBe('Marzo');
    expect(parsed.months[0].monthIndex).toBe(1);
    expect(parsed.months[9].monthName).toBe('Diciembre');
    expect(parsed.months[9].monthIndex).toBe(10);
  });

  it('cada mes tiene exactamente 1 tema (Format A)', () => {
    for (const m of parsed.months) {
      expect(m.topics).toHaveLength(1);
    }
  });

  it('extrae monthTitle del header (e.g. "MARZO – Mundo Helenístico")', () => {
    expect(parsed.months[0].monthTitle).toMatch(/Mundo Helen[ií]stico/);
    expect(parsed.months[3].monthTitle).toMatch(/Cristianismo/);
  });

  it('extrae contenidos, handsOn y producto del estudiante', () => {
    const marzo = parsed.months[0].topics[0];
    expect(marzo.contents).toMatch(/Alejandro/i);
    expect(marzo.handsOn.length).toBeGreaterThanOrEqual(2);
    expect(marzo.handsOn[0]).toMatch(/Mapa.*Alejandro/i);
    expect(marzo.product).toMatch(/Mapa/i);
  });

  it('detecta christianFocus en meses con contenido cristiano', () => {
    const junio = parsed.months[3].topics[0]; // JUNIO – Cristianismo primitivo
    expect(junio.christianFocus).toBe(true);
  });

  it('no expone campos de ESL en outline no-ESL', () => {
    expect(parsed.months[0].topics[0].esl).toBeUndefined();
  });
});

describe('parseOutline — Format B (Matemática 9°)', () => {
  const parsed = parseOutline(read(FIXTURE_B));

  it('reporta format B y extrae metadata', () => {
    expect(parsed.format).toBe('B');
    expect(parsed.metadata.frecuencia).toMatch(/4 d[ií]as/i);
    expect(parsed.metadata.enfoque).toMatch(/cristiano/i);
    expect(parsed.metadata.declaresChristianFocus).toBe(true);
  });

  it('extrae los 10 meses Marzo-Diciembre', () => {
    expect(parsed.months).toHaveLength(10);
    expect(parsed.months[0].monthName).toBe('Marzo');
    expect(parsed.months[9].monthName).toBe('Diciembre');
  });

  it('cada mes tiene exactamente 2 temas (Format B)', () => {
    for (const m of parsed.months) {
      expect(m.topics).toHaveLength(2);
    }
  });

  it('extrae títulos de cada tema y hands-on (4 bullets por tema)', () => {
    const marzo = parsed.months[0];
    expect(marzo.topics[0].title).toMatch(/Conjuntos y n[úu]meros reales/);
    expect(marzo.topics[1].title).toMatch(/Operaciones combinadas/);
    expect(marzo.topics[0].handsOn).toHaveLength(4);
    expect(marzo.topics[0].handsOn[0]).toMatch(/Diagramas de Venn/);
  });

  it('no extrae "Producto del estudiante" (Format B no lo tiene)', () => {
    for (const m of parsed.months) {
      for (const t of m.topics) {
        expect(t.product).toBeUndefined();
      }
    }
  });
});

describe('parseOutline — Format A ESL (Inglés ESL 9°)', () => {
  const parsed = parseOutline(read(FIXTURE_ESL));

  it('reporta format A (Semana tipo) y detecta enfoque cristiano', () => {
    expect(parsed.format).toBe('A');
    expect(parsed.metadata.declaresChristianFocus).toBe(true);
  });

  it('extrae los meses (Marzo en adelante, sin contar "Objetivos del año")', () => {
    expect(parsed.months.length).toBeGreaterThanOrEqual(8);
    expect(parsed.months[0].monthName).toBe('Marzo');
  });

  it('cada mes ESL tiene 1 topic con datos `esl` y 4 días en semanaTipo', () => {
    const marzo = parsed.months[0].topics[0];
    expect(marzo.esl).toBeDefined();
    expect(marzo.esl?.unidad).toMatch(/Personal Identity/i);
    expect(marzo.esl?.semanaTipo).toHaveLength(4);
    expect(marzo.esl?.semanaTipo[3]).toMatch(/reflexi[óo]n cristiana/i);
  });

  it('handsOn de ESL son los 4 días del semana tipo', () => {
    const marzo = parsed.months[0].topics[0];
    expect(marzo.handsOn).toHaveLength(4);
  });
});

describe('SPANISH_MONTHS exporta el mapping completo Marzo-Diciembre', () => {
  it('contiene los 10 meses con índices 1-10', () => {
    expect(SPANISH_MONTHS.MARZO).toBe(1);
    expect(SPANISH_MONTHS.DICIEMBRE).toBe(10);
    expect(Object.keys(SPANISH_MONTHS)).toHaveLength(10);
  });
});
