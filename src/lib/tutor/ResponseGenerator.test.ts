import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StudentSummary, TokenUsage } from './types';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('@/lib/openai', () => ({
  getOpenAI: () => ({
    chat: { completions: { create: mockCreate } }
  }),
  TUTOR_MODEL: 'gpt-test'
}));

import { generateStream, __test } from './ResponseGenerator';
import {
  buildAngelaSystemPromptEs,
  buildAngelaSystemPromptEn,
  buildAngelaSystemPromptHsEs,
  buildAngelaSystemPromptHsEn,
  buildAngelaSystemPrompt
} from './prompts';

const sofia: StudentSummary = {
  id: 's1',
  displayName: 'Sofía',
  gradeLevel: 3,
  locale: 'es'
};

function fakeStream(
  chunks: Array<{ content?: string; usage?: TokenUsage }>
): AsyncIterable<unknown> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const c of chunks) {
        yield {
          choices: [{ delta: { content: c.content } }],
          usage: c.usage
            ? {
                prompt_tokens: c.usage.promptTokens,
                completion_tokens: c.usage.completionTokens,
                total_tokens: c.usage.totalTokens
              }
            : undefined
        };
      }
    }
  };
}

describe('prompts.buildAngelaSystemPrompt', () => {
  it('ES prompt mentions student name and grade label', () => {
    const p = buildAngelaSystemPromptEs(sofia);
    expect(p).toContain('Sofía');
    expect(p).toContain('3° grado');
    expect(p).toContain('MIDSEA Academy');
  });

  it('EN prompt uses ordinal grade label', () => {
    const mateo: StudentSummary = {
      id: 's2',
      displayName: 'Mateo',
      gradeLevel: 5,
      locale: 'en'
    };
    const p = buildAngelaSystemPromptEn(mateo);
    expect(p).toContain('Mateo');
    expect(p).toContain('5th grade');
  });

  it('PreK fallback for gradeLevel <= 0', () => {
    const kid: StudentSummary = {
      id: 's3',
      displayName: 'Lía',
      gradeLevel: 0,
      locale: 'es'
    };
    expect(buildAngelaSystemPromptEs(kid)).toContain('PreK');
    expect(buildAngelaSystemPromptEn(kid)).toContain('PreK');
  });
});

describe('prompts.buildAngelaSystemPromptHsEs (LATAM neutro)', () => {
  const teen: StudentSummary = {
    id: 's4',
    displayName: 'Lucía',
    gradeLevel: 10,
    locale: 'es'
  };

  it('uses "tú" voseo-neutral pronouns', () => {
    const p = buildAngelaSystemPromptHsEs(teen);
    // Affirmative checks: prompt explicitly instructs "tú/puedes/tienes".
    expect(p).toMatch(/"tú"/);
    expect(p).toMatch(/"puedes"/);
    expect(p).toMatch(/"tienes"/);
  });

  it('explicitly forbids voseo + Spain "vosotros" + regional slang', () => {
    const p = buildAngelaSystemPromptHsEs(teen);
    expect(p).toMatch(/CERO voseo argentino/i);
    expect(p).toMatch(/"vosotros"/);
    expect(p).toMatch(/CERO slang/i);
  });

  it('declares Christian worldview with non-proselitizing guardrail', () => {
    const p = buildAngelaSystemPromptHsEs(teen);
    expect(p).toMatch(/cristiana coherente/i);
    expect(p).toMatch(/denominacionalmente abierta/i);
    expect(p).toMatch(/NUNCA proselitas/i);
    expect(p).toMatch(/padres o pastor/i);
  });

  it('instructs chain-of-thought headers for STEM', () => {
    const p = buildAngelaSystemPromptHsEs(teen);
    expect(p).toMatch(/Paso 1/);
    expect(p).toMatch(/Paso 2/);
  });

  it('formats grade label for Secundaria correctly', () => {
    expect(buildAngelaSystemPromptHsEs(teen)).toContain('2° año de Secundaria (10°)');
  });
});

describe('prompts.buildAngelaSystemPromptHsEn (parallel EN)', () => {
  const teen: StudentSummary = {
    id: 's5',
    displayName: 'Marcus',
    gradeLevel: 10,
    locale: 'en'
  };

  it('mentions Christian worldview + chain-of-thought', () => {
    const p = buildAngelaSystemPromptHsEn(teen);
    expect(p).toMatch(/Christian framework/i);
    expect(p).toMatch(/denominationally open/i);
    expect(p).toMatch(/NEVER proselytize/i);
    expect(p).toMatch(/Step 1/);
  });
});

describe('prompts.buildAngelaSystemPrompt (audienceTier selector)', () => {
  const sofiaCore: StudentSummary = {
    id: 's1',
    displayName: 'Sofía',
    gradeLevel: 3,
    locale: 'es'
  };
  const luciaHs: StudentSummary = {
    id: 's2',
    displayName: 'Lucía',
    gradeLevel: 10,
    locale: 'es'
  };

  it('returns HS prompt by default when no audienceTier passed', () => {
    const p = buildAngelaSystemPrompt('es', luciaHs);
    expect(p).toMatch(/coach académica/i);
    expect(p).toMatch(/CERO voseo argentino/);
  });

  it('returns CORE prompt when audienceTier=CORE explicitly', () => {
    const p = buildAngelaSystemPrompt('es', sofiaCore, 'CORE');
    expect(p).toMatch(/tutora AI personal/i);
    expect(p).not.toMatch(/CERO voseo argentino/);
  });

  it('respects locale within HS tier', () => {
    expect(buildAngelaSystemPrompt('en', luciaHs, 'HS')).toMatch(/Christian framework/);
    expect(buildAngelaSystemPrompt('es', luciaHs, 'HS')).toMatch(/cosmovisión/i);
  });
});

describe('ResponseGenerator.generateStream', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('passes system prompt + conversation to OpenAI in order', async () => {
    mockCreate.mockResolvedValue(fakeStream([{ content: 'ok' }]));
    const it = await generateStream({
      locale: 'es',
      student: sofia,
      conversation: [
        { role: 'user', content: 'hola' },
        { role: 'assistant', content: 'hola Sofía' },
        { role: 'user', content: 'ayuda' }
      ]
    });
    for await (const _ of it) {
      /* drain */
    }
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const args = mockCreate.mock.calls[0][0];
    expect(args.model).toBe('gpt-test');
    expect(args.stream).toBe(true);
    expect(args.stream_options).toEqual({ include_usage: true });
    expect(args.messages[0].role).toBe('system');
    expect(args.messages[0].content).toContain('Sofía');
    expect(args.messages.slice(1).map((m: { role: string }) => m.role)).toEqual([
      'user',
      'assistant',
      'user'
    ]);
  });

  it('passes audienceTier=CORE through to the prompt builder', async () => {
    mockCreate.mockResolvedValue(fakeStream([{ content: 'ok' }]));
    const it = await generateStream({
      locale: 'es',
      student: sofia,
      conversation: [{ role: 'user', content: 'hi' }],
      audienceTier: 'CORE'
    });
    for await (const _ of it) {
      /* drain */
    }
    const args = mockCreate.mock.calls[0][0];
    // CORE prompt mentions "tutora AI personal" (Epic 02 wording).
    expect(args.messages[0].content).toMatch(/tutora AI personal/i);
    expect(args.messages[0].content).not.toMatch(/CERO voseo/);
  });

  it('defaults to HS audienceTier when not passed', async () => {
    mockCreate.mockResolvedValue(fakeStream([{ content: 'ok' }]));
    const it = await generateStream({
      locale: 'es',
      student: sofia,
      conversation: [{ role: 'user', content: 'hi' }]
    });
    for await (const _ of it) {
      /* drain */
    }
    const args = mockCreate.mock.calls[0][0];
    expect(args.messages[0].content).toMatch(/CERO voseo argentino/);
  });

  it('overrides model when `model` param is passed (reasoning escalation)', async () => {
    mockCreate.mockResolvedValue(fakeStream([{ content: 'ok' }]));
    const it = await generateStream({
      locale: 'es',
      student: sofia,
      conversation: [{ role: 'user', content: 'resolvé 2x+5=11' }],
      model: 'gpt-4o-test'
    });
    for await (const _ of it) {
      /* drain */
    }
    expect(mockCreate.mock.calls[0][0].model).toBe('gpt-4o-test');
  });

  it('yields content deltas in order', async () => {
    mockCreate.mockResolvedValue(
      fakeStream([{ content: 'Hola' }, { content: ' Sofía' }, { content: ', dime' }])
    );
    const it = await generateStream({
      locale: 'es',
      student: sofia,
      conversation: [{ role: 'user', content: 'hi' }]
    });
    const out: string[] = [];
    for await (const tok of it) out.push(tok);
    expect(out.join('')).toBe('Hola Sofía, dime');
  });

  it('skips chunks with empty delta but still surfaces usage', async () => {
    const usage: TokenUsage = {
      promptTokens: 100,
      completionTokens: 20,
      totalTokens: 120,
      model: 'gpt-test'
    };
    mockCreate.mockResolvedValue(
      fakeStream([
        { content: 'A' },
        { content: undefined },
        { content: 'B', usage }
      ])
    );
    const captured: TokenUsage[] = [];
    const it = await generateStream({
      locale: 'es',
      student: sofia,
      conversation: [{ role: 'user', content: 'x' }],
      onComplete: (u) => captured.push(u)
    });
    const out: string[] = [];
    for await (const tok of it) out.push(tok);
    expect(out).toEqual(['A', 'B']);
    expect(captured).toHaveLength(1);
    expect(captured[0]).toEqual({
      promptTokens: 100,
      completionTokens: 20,
      totalTokens: 120,
      model: 'gpt-test'
    });
  });

  it('wrapStream tolerates a missing onComplete', async () => {
    const stream = fakeStream([
      { content: 'X' },
      {
        usage: {
          promptTokens: 1,
          completionTokens: 1,
          totalTokens: 2,
          model: 'gpt-test'
        }
      }
    ]);
    const out: string[] = [];
    for await (const tok of __test.wrapStream(stream)) out.push(tok);
    expect(out).toEqual(['X']);
  });
});
