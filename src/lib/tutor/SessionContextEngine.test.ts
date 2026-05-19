import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sessionFindFirst, sessionCreate, messageCreate, messageFindMany } =
  vi.hoisted(() => ({
    sessionFindFirst: vi.fn(),
    sessionCreate: vi.fn(),
    messageCreate: vi.fn(),
    messageFindMany: vi.fn()
  }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tutorSession: { findFirst: sessionFindFirst, create: sessionCreate },
    tutorMessage: { create: messageCreate, findMany: messageFindMany }
  }
}));

import {
  getOrCreateTodaysSession,
  appendUserMessage,
  appendAssistantMessage,
  getMessagesForSession,
  __test
} from './SessionContextEngine';

describe('SessionContextEngine.todayUtcRange', () => {
  it('returns a 24h window aligned to UTC midnight', () => {
    const noon = new Date('2026-05-19T11:30:00Z');
    const { start, end } = __test.todayUtcRange(noon);
    expect(start.toISOString()).toBe('2026-05-19T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-05-20T00:00:00.000Z');
  });

  it('returns the same window for any moment inside the same UTC day', () => {
    const a = __test.todayUtcRange(new Date('2026-05-19T00:00:01Z'));
    const b = __test.todayUtcRange(new Date('2026-05-19T23:59:59Z'));
    expect(a.start.getTime()).toBe(b.start.getTime());
    expect(a.end.getTime()).toBe(b.end.getTime());
  });
});

describe('SessionContextEngine.getOrCreateTodaysSession', () => {
  beforeEach(() => {
    sessionFindFirst.mockReset();
    sessionCreate.mockReset();
  });

  it('reuses the existing session if one was created today', async () => {
    const existing = {
      id: 'sess-1',
      createdAt: new Date('2026-05-19T10:00:00Z'),
      locale: 'es' as const
    };
    sessionFindFirst.mockResolvedValue(existing);

    const got = await getOrCreateTodaysSession('s1', 'es');
    expect(got).toBe(existing);
    expect(sessionCreate).not.toHaveBeenCalled();
  });

  it('creates a new session when nothing was found for today', async () => {
    sessionFindFirst.mockResolvedValue(null);
    sessionCreate.mockResolvedValue({
      id: 'sess-2',
      createdAt: new Date(),
      locale: 'en'
    });

    const got = await getOrCreateTodaysSession('s1', 'en');
    expect(got.id).toBe('sess-2');
    expect(sessionCreate).toHaveBeenCalledWith({
      data: { studentId: 's1', locale: 'en' },
      select: { id: true, createdAt: true, locale: true }
    });
  });
});

describe('SessionContextEngine.append* + getMessagesForSession', () => {
  beforeEach(() => {
    messageCreate.mockReset();
    messageFindMany.mockReset();
  });

  it('appendUserMessage writes role=user', async () => {
    messageCreate.mockResolvedValue({
      id: 'm1',
      role: 'user',
      content: 'hola',
      createdAt: new Date()
    });
    const msg = await appendUserMessage('sess-1', 'hola');
    expect(msg.role).toBe('user');
    expect(messageCreate).toHaveBeenCalledWith({
      data: { sessionId: 'sess-1', role: 'user', content: 'hola' },
      select: { id: true, role: true, content: true, createdAt: true }
    });
  });

  it('appendAssistantMessage writes role=assistant', async () => {
    messageCreate.mockResolvedValue({
      id: 'm2',
      role: 'assistant',
      content: 'hola estudiante',
      createdAt: new Date()
    });
    const msg = await appendAssistantMessage('sess-1', 'hola estudiante');
    expect(msg.role).toBe('assistant');
  });

  it('appendAssistantMessage with metadata logs but still persists content', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    messageCreate.mockResolvedValue({
      id: 'm3',
      role: 'assistant',
      content: 'ok',
      createdAt: new Date()
    });
    await appendAssistantMessage('sess-1', 'ok', { totalTokens: 42 });
    expect(spy).toHaveBeenCalled();
    expect(messageCreate).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('getMessagesForSession returns Prisma rows mapped to DTO', async () => {
    const t = new Date();
    messageFindMany.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'hi', createdAt: t },
      { id: 'm2', role: 'assistant', content: 'hello', createdAt: t }
    ]);
    const list = await getMessagesForSession('sess-1');
    expect(list).toHaveLength(2);
    expect(list[0].role).toBe('user');
    expect(list[1].role).toBe('assistant');
  });
});
