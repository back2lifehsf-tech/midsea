/**
 * Tests del catalog-map (ADR-005 §7 + ADR-006).
 *
 * Verifica:
 *  - Los 8 cursos del Pilot Minimo estan registrados.
 *  - buildCompetencyCode produce el formato canonico para los casos
 *    edge: grade combinado (G09_10), grade simple (G09), todos los
 *    subjectCode posibles.
 *  - getCourse tira error claro para slugs invalidos.
 *  - listCourseSlugs devuelve exactamente los 8 slugs.
 */
import { describe, expect, it } from 'vitest';
import {
  CATALOG,
  buildCompetencyCode,
  getCourse,
  listCourseSlugs
} from './catalog-map.mjs';

const EXPECTED_SLUGS = [
  'math-grade-9',
  'math-grade-10',
  'language-grade-9-10',
  'english-esl-grade-9',
  'english-esl-grade-10',
  'history-ancient-civ-2-grade-9-10',
  'science-biology-grade-9-10',
  'music-grade-9'
];

describe('CATALOG — Pilot Minimo de 8 cursos', () => {
  it('exporta exactamente 8 cursos', () => {
    expect(Object.keys(CATALOG)).toHaveLength(8);
  });

  it('los 8 slugs son los esperados del Pilot Minimo', () => {
    const slugs = listCourseSlugs().sort();
    expect(slugs).toEqual([...EXPECTED_SLUGS].sort());
  });

  it('cada curso tiene los campos minimos requeridos', () => {
    for (const slug of EXPECTED_SLUGS) {
      const c = CATALOG[slug];
      expect(c.titleEs).toBeTypeOf('string');
      expect(c.titleEn).toBeTypeOf('string');
      expect(c.subject).toBeTypeOf('string');
      expect(c.subjectCode).toMatch(/^[A-Z]+$/);
      expect(c.gradeBand).toMatch(/^(CICLO_BASICO|CICLO_ORIENTADO|TRANSVERSAL)$/);
      expect(c.gradeCode).toMatch(/^G\d{2}(?:_\d{2})?$/);
      expect(c.outlinePath).toContain('docs/content/source/');
      expect(c.outlineFormat).toMatch(/^[AB]$/);
      expect(c.lessonsPerTopic).toBeGreaterThanOrEqual(2);
    }
  });

  it('todos los cursos del Pilot Minimo son CICLO_BASICO', () => {
    for (const c of Object.values(CATALOG)) {
      expect(c.gradeBand).toBe('CICLO_BASICO');
    }
  });

  it('cursos combinados (9-10) tienen gradeCode G09_10', () => {
    expect(CATALOG['language-grade-9-10'].gradeCode).toBe('G09_10');
    expect(CATALOG['history-ancient-civ-2-grade-9-10'].gradeCode).toBe('G09_10');
    expect(CATALOG['science-biology-grade-9-10'].gradeCode).toBe('G09_10');
  });
});

describe('buildCompetencyCode', () => {
  it('grade simple G09', () => {
    const code = buildCompetencyCode(
      { subjectCode: 'MATH', gradeCode: 'G09' },
      1,
      1,
      1
    );
    expect(code).toBe('ARG-MATH-G09-M01-T01-L01');
  });

  it('grade simple G10 con multi-digito', () => {
    const code = buildCompetencyCode(
      { subjectCode: 'MATH', gradeCode: 'G10' },
      10,
      2,
      4
    );
    expect(code).toBe('ARG-MATH-G10-M10-T02-L04');
  });

  it('grade combinado G09_10', () => {
    const code = buildCompetencyCode(
      { subjectCode: 'HIS', gradeCode: 'G09_10' },
      4,
      1,
      1
    );
    expect(code).toBe('ARG-HIS-G09_10-M04-T01-L01');
  });

  it('pad zero-prefix correcto para mes/topic/leccion < 10', () => {
    const code = buildCompetencyCode(
      { subjectCode: 'ESL', gradeCode: 'G09' },
      3,
      1,
      2
    );
    expect(code).toBe('ARG-ESL-G09-M03-T01-L02');
    // Sanity: M3 != M03.
    expect(code).not.toContain('-M3-');
  });
});

describe('getCourse', () => {
  it('devuelve el curso para un slug valido', () => {
    const c = getCourse('math-grade-9');
    expect(c.titleEs).toBe('Matemática — Grado 9°');
  });

  it('tira error con mensaje claro para slug invalido', () => {
    expect(() => getCourse('non-existent-slug')).toThrow(/Pilot Mínimo/);
  });

  it('el error lista los slugs validos para debug', () => {
    let msg = '';
    try {
      getCourse('bad-slug');
    } catch (e) {
      msg = e.message;
    }
    expect(msg).toContain('math-grade-9');
    expect(msg).toContain('music-grade-9');
  });
});

describe('correspondencia subjectCode ↔ subject (Prisma enum)', () => {
  it('cada subject del enum tiene su subjectCode esperado', () => {
    const expectedMapping = {
      MATH: 'MATH',
      LANGUAGE: 'LENG',
      ENGLISH_ESL: 'ESL',
      HISTORY: 'HIS',
      SCIENCE: 'SCI',
      MUSIC: 'MUS'
    };
    for (const c of Object.values(CATALOG)) {
      expect(c.subjectCode).toBe(expectedMapping[c.subject]);
    }
  });
});
