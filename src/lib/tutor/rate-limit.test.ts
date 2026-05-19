import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { upsert, update } = vi.hoisted(() => ({
  upsert: vi.fn(),
  update: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tutorUsageDaily: { upsert, update }
  }
}));

import {
  consumeOneOrThrow,
  recordTokens,
  RateLimitedError,
  getDailyMsgCap,
  todayUtcDate
} from './rate-limit';

describe('rate-limit.getDailyMsgCap', () => {
  const original = process.env.TUTOR_DAILY_MSG_CAP;
  afterEach(() => {
    if (original === undefined) delete process.env.TUTOR_DAILY_MSG_CAP;
    else process.env.TUTOR_DAILY_MSG_CAP = original;
  });

  it('defaults to 50 when unset', () => {
    delete process.env.TUTOR_DAILY_MSG_CAP;
    expect(getDailyMsgCap()).toBe(50);
  });

  it('reads positive integers from env', () => {
    process.env.TUTOR_DAILY_MSG_CAP = '100';
    expect(getDailyMsgCap()).toBe(100);
  });

  it('ignores invalid values and falls back to default', () => {
    process.env.TUTOR_DAILY_MSG_CAP = 'abc';
    expect(getDailyMsgCap()).toBe(50);
    process.env.TUTOR_DAILY_MSG_CAP = '0';
    expect(getDailyMsgCap()).toBe(50);
    process.env.TUTOR_DAILY_MSG_CAP = '-5';
    expect(getDailyMsgCap()).toBe(50);
  });
});

describe('rate-limit.todayUtcDate', () => {
  it('truncates to UTC midnight', () => {
    const d = todayUtcDate(new Date('2026-05-19T13:45:01.123Z'));
    expect(d.toISOString()).toBe('2026-05-19T00:00:00.000Z');
  });
});

describe('rate-limit.consumeOneOrThrow', () => {
  beforeEach(() => {
    upsert.mockReset();
    update.mockReset();
    delete process.env.TUTOR_DAILY_MSG_CAP;
  });

  it('returns count + cap on first message of the day', async () => {
    upsert.mockResolvedValue({ msgCount: 1 });
    const res = await consumeOneOrThrow('s1');
    expect(res).toEqual({ msgCount: 1, cap: 50 });
    expect(upsert).toHaveBeenCalledTimes(1);
    const args = upsert.mock.calls[0][0];
    expect(args.create.msgCount).toBe(1);
    expect(args.update.msgCount).toEqual({ increment: 1 });
    expect(args.select).toEqual({ msgCount: true });
  });

  it('returns cap value when at the limit', async () => {
    upsert.mockResolvedValue({ msgCount: 50 });
    const res = await consumeOneOrThrow('s1');
    expect(res.msgCount).toBe(50);
  });

  it('throws RateLimitedError when post-increment count exceeds cap', async () => {
    upsert.mockResolvedValue({ msgCount: 51 });
    await expect(consumeOneOrThrow('s1')).rejects.toBeInstanceOf(RateLimitedError);
  });

  it('uses custom cap from env', async () => {
    process.env.TUTOR_DAILY_MSG_CAP = '5';
    upsert.mockResolvedValue({ msgCount: 6 });
    await expect(consumeOneOrThrow('s1')).rejects.toMatchObject({
      cap: 5,
      count: 6
    });
  });
});

describe('rate-limit.recordTokens', () => {
  beforeEach(() => {
    update.mockReset();
  });

  it('increments tokensUsed', async () => {
    update.mockResolvedValue({});
    await recordTokens('s1', 120);
    expect(update).toHaveBeenCalledTimes(1);
    const args = update.mock.calls[0][0];
    expect(args.data.tokensUsed).toEqual({ increment: 120 });
  });

  it('skips when tokens <= 0', async () => {
    await recordTokens('s1', 0);
    await recordTokens('s1', -10);
    expect(update).not.toHaveBeenCalled();
  });

  it('swallows update errors (telemetry-only)', async () => {
    update.mockRejectedValue(new Error('boom'));
    await expect(recordTokens('s1', 10)).resolves.toBeUndefined();
  });
});
