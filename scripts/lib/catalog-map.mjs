/**
 * Mapeo Course slug → metadata operativa del pipeline (ADR-006).
 *
 * Fuente humana de la verdad: docs/curriculum/midsea-hs-catalog.md. Si
 * esto cambia ahí (e.g. cambia un slug, se promueve un curso rolling
 * release a pilot), actualizar este archivo + re-correr generación.
 *
 * Notas:
 *  - subjectCode = prefijo corto del competencyCode (e.g. MATH → "MATH",
 *    LANGUAGE → "LENG", ENGLISH_ESL → "ESL", HISTORY → "HIS",
 *    SCIENCE → "SCI", MUSIC → "MUS").
 *  - gradeCode = sufijo de grado para el competencyCode: "G09", "G10",
 *    o "G09_10" para cursos combinados.
 *  - outlineFormat: 'A' o 'B' — informa al parser; en runtime se valida
 *    por detección automática y se warna si no coincide.
 *  - christianFocus refleja el outline (si el founder declaró enfoque
 *    cristiano). Se pasa al prompt para activar reflexión espiritual
 *    sutil.
 */

export const CATALOG = Object.freeze({
  'math-grade-9': {
    titleEs: 'Matemática — Grado 9°',
    titleEn: 'Mathematics — Grade 9',
    subject: 'MATH',
    subjectCode: 'MATH',
    gradeBand: 'CICLO_BASICO',
    gradeCode: 'G09',
    outlinePath:
      'docs/content/source/Matematicas/Secundaria/Matematica_9_Marzo_Diciembre_Completo.md',
    outlineFormat: 'B',
    christianFocus: true,
    lessonsPerTopic: 2
  },
  'math-grade-10': {
    titleEs: 'Matemática — Grado 10°',
    titleEn: 'Mathematics — Grade 10',
    subject: 'MATH',
    subjectCode: 'MATH',
    gradeBand: 'CICLO_BASICO',
    gradeCode: 'G10',
    outlinePath:
      'docs/content/source/Matematicas/Secundaria/Matematica_10_Marzo_Diciembre_Completo.md',
    outlineFormat: 'B',
    christianFocus: true,
    lessonsPerTopic: 2
  },
  'language-grade-9-10': {
    titleEs: 'Lengua y Literatura — Grados 9°-10°',
    titleEn: 'Spanish Language and Literature — Grades 9-10',
    subject: 'LANGUAGE',
    subjectCode: 'LENG',
    gradeBand: 'CICLO_BASICO',
    gradeCode: 'G09_10',
    outlinePath:
      'docs/content/source/Espanol/Secundaria/Lengua_9th, 10th_ Completo_Completo.md',
    outlineFormat: 'B',
    christianFocus: true,
    lessonsPerTopic: 2
  },
  'english-esl-grade-9': {
    titleEs: 'Inglés ESL — Grado 9° (A2)',
    titleEn: 'English ESL — Grade 9 (A2)',
    subject: 'ENGLISH_ESL',
    subjectCode: 'ESL',
    gradeBand: 'CICLO_BASICO',
    gradeCode: 'G09',
    outlinePath:
      'docs/content/source/English ESL/Secundaria/Ingles_ESL_Grado_9_Completo_Final.md',
    outlineFormat: 'A',
    christianFocus: true,
    lessonsPerTopic: 4
  },
  'english-esl-grade-10': {
    titleEs: 'Inglés ESL — Grado 10° (A2+/Transición a B1)',
    titleEn: 'English ESL — Grade 10 (A2+ / Transition to B1)',
    subject: 'ENGLISH_ESL',
    subjectCode: 'ESL',
    gradeBand: 'CICLO_BASICO',
    gradeCode: 'G10',
    outlinePath:
      'docs/content/source/English ESL/Secundaria/Ingles_ESL_Grado_10_Completo_Final.md',
    outlineFormat: 'A',
    christianFocus: true,
    lessonsPerTopic: 4
  },
  'history-ancient-civ-2-grade-9-10': {
    titleEs: 'Civilización Antigua II — Grados 9°-10°',
    titleEn: 'Ancient Civilization II — Grades 9-10',
    subject: 'HISTORY',
    subjectCode: 'HIS',
    gradeBand: 'CICLO_BASICO',
    gradeCode: 'G09_10',
    outlinePath:
      'docs/content/source/Ciencias Sociales/Secundaria/Civilizacion_Antigua_II_Grados_9_10.md',
    outlineFormat: 'A',
    christianFocus: true,
    lessonsPerTopic: 2
  },
  'science-biology-grade-9-10': {
    titleEs: 'Biología — Grados 9°-10°',
    titleEn: 'Biology — Grades 9-10',
    subject: 'SCIENCE',
    subjectCode: 'SCI',
    gradeBand: 'CICLO_BASICO',
    gradeCode: 'G09_10',
    outlinePath:
      'docs/content/source/Ciencias/Secundaria/Ciencias_9,10_ Biologia .md',
    outlineFormat: 'B',
    christianFocus: true,
    lessonsPerTopic: 2
  },
  'music-grade-9': {
    titleEs: 'Música — Grado 9°',
    titleEn: 'Music — Grade 9',
    subject: 'MUSIC',
    subjectCode: 'MUS',
    gradeBand: 'CICLO_BASICO',
    gradeCode: 'G09',
    outlinePath:
      'docs/content/source/Musica/Secundaria/Musica_9_Secundaria.md',
    outlineFormat: 'A',
    christianFocus: false,
    lessonsPerTopic: 2
  }
});

/**
 * Construye el competencyCode canónico para una lección dada.
 *
 * Patrón: ARG-<SUBJ>-G<NN>[_NN]-M<NN>-T<NN>-L<NN>.
 * Ejemplos:
 *   buildCompetencyCode({subjectCode:'MATH', gradeCode:'G09'}, 1, 1, 1)
 *     → 'ARG-MATH-G09-M01-T01-L01'
 *   buildCompetencyCode({subjectCode:'HIS', gradeCode:'G09_10'}, 4, 1, 1)
 *     → 'ARG-HIS-G09_10-M04-T01-L01'
 */
export function buildCompetencyCode(course, monthIndex, topicIndex, lessonN) {
  const pad = (n) => String(n).padStart(2, '0');
  return `ARG-${course.subjectCode}-${course.gradeCode}-M${pad(monthIndex)}-T${pad(
    topicIndex
  )}-L${pad(lessonN)}`;
}

export function getCourse(slug) {
  const c = CATALOG[slug];
  if (!c) {
    throw new Error(
      `Course slug "${slug}" no está en el catálogo del Pilot Mínimo. Slugs válidos: ${Object.keys(
        CATALOG
      ).join(', ')}`
    );
  }
  return c;
}

export function listCourseSlugs() {
  return Object.keys(CATALOG);
}
