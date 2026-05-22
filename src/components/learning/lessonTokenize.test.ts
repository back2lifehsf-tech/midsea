/**
 * Tests del tokenizer markdown → blocks (Epic 04 Tarea 5/8).
 *
 * Cubre el subset que produce el prompt v1.1: headers, parrafos, listas
 * (`-` y `1.`), KaTeX block (`$$...$$` single y multi-line), placeholders
 * de imagen `{{IMAGE: ...}}`. El KaTeX inline `$x$` se renderiza
 * via react-katex en el componente, no es responsabilidad del tokenizer.
 */
import { describe, expect, it } from 'vitest';
import { tokenize } from './lessonTokenize';

describe('tokenize — headers', () => {
  it('reconoce ## y ### y ####', () => {
    const blocks = tokenize(
      '## Introducción\n\n### Subtema\n\n#### Detalle\n\nTexto.'
    );
    expect(blocks).toEqual([
      { type: 'heading', level: 2, text: 'Introducción' },
      { type: 'heading', level: 3, text: 'Subtema' },
      { type: 'heading', level: 4, text: 'Detalle' },
      { type: 'paragraph', text: 'Texto.' }
    ]);
  });

  it('# (h1) NO es tratado como heading (no permitido en lecciones)', () => {
    // Decisión de diseño: el titulo de la leccion vive en `titleEs` del
    // model; el body markdown NO debe tener H1. El tokenizer lo deja
    // como parrafo plain.
    const blocks = tokenize('# Esto seria H1');
    expect(blocks[0].type).toBe('paragraph');
  });

  it('# adentro del texto NO es heading', () => {
    const blocks = tokenize('Costo: $100 # impuestos incluidos');
    expect(blocks[0].type).toBe('paragraph');
  });
});

describe('tokenize — paragraphs', () => {
  it('parrafos separados por linea en blanco', () => {
    const blocks = tokenize('Primero.\n\nSegundo.\n\nTercero.');
    expect(blocks).toHaveLength(3);
    expect(blocks.every((b) => b.type === 'paragraph')).toBe(true);
  });

  it('lineas consecutivas se unen en un mismo parrafo', () => {
    const blocks = tokenize('Linea 1\nLinea 2\nLinea 3');
    expect(blocks).toEqual([
      { type: 'paragraph', text: 'Linea 1\nLinea 2\nLinea 3' }
    ]);
  });

  it('trims trailing whitespace', () => {
    const blocks = tokenize('   Texto   \n\n');
    expect(blocks[0]).toEqual({ type: 'paragraph', text: 'Texto' });
  });
});

describe('tokenize — listas', () => {
  it('lista con guiones', () => {
    const blocks = tokenize('- Manzana\n- Banana\n- Cereza');
    expect(blocks).toEqual([
      { type: 'ul', items: ['Manzana', 'Banana', 'Cereza'] }
    ]);
  });

  it('lista numerada', () => {
    const blocks = tokenize('1. Primero\n2. Segundo\n3. Tercero');
    expect(blocks).toEqual([
      { type: 'ol', items: ['Primero', 'Segundo', 'Tercero'] }
    ]);
  });

  it('cambio de tipo de lista crea bloques separados', () => {
    const blocks = tokenize('- A\n- B\n1. C\n2. D');
    expect(blocks).toEqual([
      { type: 'ul', items: ['A', 'B'] },
      { type: 'ol', items: ['C', 'D'] }
    ]);
  });

  it('lista mezclada con parrafos', () => {
    const blocks = tokenize('Texto.\n\n- A\n- B\n\nMas texto.');
    expect(blocks).toEqual([
      { type: 'paragraph', text: 'Texto.' },
      { type: 'ul', items: ['A', 'B'] },
      { type: 'paragraph', text: 'Mas texto.' }
    ]);
  });
});

describe('tokenize — bloques KaTeX', () => {
  it('block math single-line', () => {
    const blocks = tokenize('$$x^2 + 2x + 1 = 0$$');
    expect(blocks).toEqual([
      { type: 'mathBlock', tex: 'x^2 + 2x + 1 = 0' }
    ]);
  });

  it('block math multi-line', () => {
    const blocks = tokenize('$$\n\\frac{a}{b} = \\frac{c}{d}\n$$');
    expect(blocks[0]).toEqual({
      type: 'mathBlock',
      tex: '\\frac{a}{b} = \\frac{c}{d}'
    });
  });

  it('block math separa parrafos', () => {
    const blocks = tokenize('Antes.\n\n$$y = mx + b$$\n\nDespues.');
    expect(blocks).toEqual([
      { type: 'paragraph', text: 'Antes.' },
      { type: 'mathBlock', tex: 'y = mx + b' },
      { type: 'paragraph', text: 'Despues.' }
    ]);
  });
});

describe('tokenize — imagenes placeholder', () => {
  it('placeholder en linea propia', () => {
    const blocks = tokenize('{{IMAGE: Diagrama de Venn de A y B}}');
    expect(blocks).toEqual([
      { type: 'image', description: 'Diagrama de Venn de A y B' }
    ]);
  });

  it('multiples placeholders', () => {
    const blocks = tokenize(
      '{{IMAGE: Primera}}\n\nTexto.\n\n{{IMAGE: Segunda}}'
    );
    expect(blocks).toEqual([
      { type: 'image', description: 'Primera' },
      { type: 'paragraph', text: 'Texto.' },
      { type: 'image', description: 'Segunda' }
    ]);
  });

  it('case-insensitive', () => {
    const blocks = tokenize('{{image: minusculas}}');
    expect(blocks[0]).toEqual({ type: 'image', description: 'minusculas' });
  });
});

describe('tokenize — caso real de leccion piloto', () => {
  it('parsea estructura tipica de math-grade-9 sin loops', () => {
    const markdown = `## Introducción

En matematicas, las operaciones combinadas son fundamentales.

### Orden de Operaciones

Seguimos PEMDAS:

1. **P**aréntesis
2. **E**xponentes
3. **M**ultiplicación y **D**ivisión
4. **A**dición y **S**ustracción

### Ejemplo

Considera:

$$3 + 6 \\times (5 + 4) \\div 3 - 7$$

{{IMAGE: Tabla de PEMDAS resumida}}

## Aplicaciones

Operaciones combinadas se usan en ingenieria.`;
    const blocks = tokenize(markdown);
    const types = blocks.map((b) => b.type);
    expect(types).toContain('heading');
    expect(types).toContain('paragraph');
    expect(types).toContain('ol');
    expect(types).toContain('mathBlock');
    expect(types).toContain('image');
    // El ol debe tener 4 items.
    const ol = blocks.find((b) => b.type === 'ol');
    expect(ol).toBeDefined();
    if (ol && ol.type === 'ol') expect(ol.items).toHaveLength(4);
    // No queda nada en buffer (todo el markdown fue tokenizado).
    const lastBlock = blocks[blocks.length - 1];
    expect(lastBlock.type).toBe('paragraph');
  });
});
