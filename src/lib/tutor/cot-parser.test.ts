import { describe, it, expect } from 'vitest';
import { parseChainOfThought } from './cot-parser';

describe('parseChainOfThought', () => {
  it('returns hasSteps=false for plain chat without headers', () => {
    const r = parseChainOfThought('Hola Sofía, ¿en qué puedo ayudarte hoy?');
    expect(r.hasSteps).toBe(false);
    expect(r.steps).toEqual([]);
    expect(r.preamble).toContain('Sofía');
  });

  it('parses two Spanish step headers', () => {
    const text = `Vamos a resolver 2x+5=11.

### Paso 1
Restamos 5 a ambos lados: 2x = 6.

### Paso 2
Dividimos entre 2: x = 3.

¿Te hace sentido?`;
    const r = parseChainOfThought(text);
    expect(r.hasSteps).toBe(true);
    expect(r.preamble).toContain('Vamos a resolver');
    expect(r.steps).toHaveLength(2);
    expect(r.steps[0].label).toBe('Paso 1');
    expect(r.steps[0].body).toContain('Restamos 5');
    expect(r.steps[1].label).toBe('Paso 2');
    expect(r.steps[1].body).toContain('Dividimos entre 2');
    // Outro queda dentro del último step.
    expect(r.steps[1].body).toContain('¿Te hace sentido?');
  });

  it('parses English Step headers', () => {
    const text = `Let's break this down.

### Step 1
Subtract 5 from both sides.

### Step 2
Divide by 2.`;
    const r = parseChainOfThought(text);
    expect(r.hasSteps).toBe(true);
    expect(r.steps.map((s) => s.label)).toEqual(['Step 1', 'Step 2']);
  });

  it('case-insensitive header detection', () => {
    const r = parseChainOfThought('### paso 1\ncosa\n### PASO 2\nmas');
    expect(r.hasSteps).toBe(true);
    expect(r.steps).toHaveLength(2);
  });

  it('handles preamble-only (header at start)', () => {
    const r = parseChainOfThought('### Paso 1\nprimer paso\n### Paso 2\nsegundo');
    expect(r.preamble).toBe('');
    expect(r.steps).toHaveLength(2);
  });

  it('handles headers with trailing text on same line', () => {
    const r = parseChainOfThought('### Paso 1: Restar 5\ncuerpo del paso');
    expect(r.steps[0].label).toBe('Paso 1: Restar 5');
    expect(r.steps[0].body).toBe('cuerpo del paso');
  });

  it('ignores `###` not followed by Paso/Step', () => {
    const r = parseChainOfThought('### Resumen\nesto no es un step');
    expect(r.hasSteps).toBe(false);
    expect(r.preamble).toContain('### Resumen');
  });

  it('trims preamble and step bodies', () => {
    const r = parseChainOfThought(`

  Intro

### Paso 1

   contenido con whitespace

`);
    expect(r.preamble).toBe('Intro');
    expect(r.steps[0].body).toBe('contenido con whitespace');
  });
});
