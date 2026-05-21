import { describe, it, expect, afterEach } from 'vitest';
import { pickModel, resolveModelName, pickModelForMessage } from './model-selector';

describe('pickModel — STEM heurística', () => {
  it('devuelve mini para chat conversacional', () => {
    expect(pickModel('hola, ¿cómo estás?')).toBe('mini');
    expect(pickModel('contame de la guerra de Malvinas')).toBe('mini');
    expect(pickModel('¿qué pensás de Borges?')).toBe('mini');
    expect(pickModel('How was your day?')).toBe('mini');
  });

  it('devuelve reasoning para keywords STEM en español', () => {
    expect(pickModel('resolvé 2x+5=11')).toBe('reasoning');
    expect(pickModel('Explícame la ecuación cuadrática')).toBe('reasoning');
    expect(pickModel('cómo funciona la fotosíntesis paso a paso')).toBe('reasoning');
    expect(pickModel('derivar f(x) = 3x^2')).toBe('reasoning');
    expect(pickModel('balanceo de reacción química')).toBe('reasoning');
  });

  it('devuelve reasoning para keywords STEM en inglés', () => {
    expect(pickModel('solve 2x+5=11')).toBe('reasoning');
    expect(pickModel('explain photosynthesis step by step')).toBe('reasoning');
    expect(pickModel('what is the derivative of 3x^2')).toBe('reasoning');
  });

  it('devuelve reasoning para patrones matemáticos literales', () => {
    expect(pickModel('cuánto es 5 + 3')).toBe('reasoning');
    expect(pickModel('3*4=?')).toBe('reasoning');
    expect(pickModel('x^2 - 1 = 0')).toBe('reasoning');
  });

  it('mini para humanidades sin tokens STEM', () => {
    expect(pickModel('analiza este pasaje de García Márquez')).toBe('mini');
    expect(pickModel('¿quién fue Octavio Paz?')).toBe('mini');
    expect(pickModel('explain the importance of the French Revolution')).toBe('mini');
  });

  it('mini para mensajes vacíos o no-texto', () => {
    expect(pickModel('')).toBe('mini');
    expect(pickModel('  ')).toBe('mini');
  });
});

describe('resolveModelName', () => {
  const snap = { ...process.env };
  afterEach(() => {
    process.env = { ...snap };
  });

  it('mini default = gpt-4o-mini, reasoning default = gpt-4o', () => {
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_MODEL_REASONING;
    expect(resolveModelName('mini')).toBe('gpt-4o-mini');
    expect(resolveModelName('reasoning')).toBe('gpt-4o');
  });

  it('respeta env override', () => {
    process.env.OPENAI_MODEL = 'gpt-test-mini';
    process.env.OPENAI_MODEL_REASONING = 'gpt-test-pro';
    expect(resolveModelName('mini')).toBe('gpt-test-mini');
    expect(resolveModelName('reasoning')).toBe('gpt-test-pro');
  });
});

describe('pickModelForMessage', () => {
  it('combina heurística + resolución de env', () => {
    const r = pickModelForMessage('resolvé 2x+5=11');
    expect(r.kind).toBe('reasoning');
    expect(r.name).toMatch(/gpt-4o/);
  });

  it('chat normal cae a mini', () => {
    const r = pickModelForMessage('hola Angela');
    expect(r.kind).toBe('mini');
    expect(r.name).toMatch(/mini/);
  });
});
