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
import { buildAngelaSystemPromptEs, buildAngelaSystemPromptEn } from './prompts';

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
    // drain
    for await (const _ of it) {
      /* noop */
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
