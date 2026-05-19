import { describe, it, expect } from 'vitest';
import { SseEventParser } from './sse-parser';

describe('SseEventParser', () => {
  it('emits a token event for a complete data line', () => {
    const p = new SseEventParser();
    const events = p.feed('data: {"token":"Hola"}\n\n');
    expect(events).toEqual([{ type: 'token', value: 'Hola' }]);
    expect(p.hasPending()).toBe(false);
  });

  it('buffers partial events across multiple feeds', () => {
    const p = new SseEventParser();
    expect(p.feed('data: {"tok')).toEqual([]);
    expect(p.hasPending()).toBe(true);
    expect(p.feed('en":"world"}\n\n')).toEqual([
      { type: 'token', value: 'world' }
    ]);
    expect(p.hasPending()).toBe(false);
  });

  it('emits multiple events in a single feed', () => {
    const p = new SseEventParser();
    const events = p.feed(
      'data: {"token":"A"}\n\ndata: {"token":"B"}\n\ndata: {"done":true}\n\n'
    );
    expect(events).toEqual([
      { type: 'token', value: 'A' },
      { type: 'token', value: 'B' },
      { type: 'done' }
    ]);
  });

  it('handles done event', () => {
    const p = new SseEventParser();
    expect(p.feed('data: {"done":true}\n\n')).toEqual([{ type: 'done' }]);
  });

  it('handles error event', () => {
    const p = new SseEventParser();
    expect(p.feed('data: {"error":"boom"}\n\n')).toEqual([
      { type: 'error', value: 'boom' }
    ]);
  });

  it('ignores malformed JSON without throwing', () => {
    const p = new SseEventParser();
    expect(p.feed('data: not-json\n\n')).toEqual([]);
    expect(p.feed('data: {"token":"after"}\n\n')).toEqual([
      { type: 'token', value: 'after' }
    ]);
  });

  it('ignores blocks without a data: line', () => {
    const p = new SseEventParser();
    expect(p.feed(': comment\n\n')).toEqual([]);
    expect(p.feed('event: heartbeat\n\n')).toEqual([]);
  });

  it('preserves Unicode in tokens', () => {
    const p = new SseEventParser();
    const events = p.feed('data: {"token":"¿Cómo estás? 🌟"}\n\n');
    expect(events).toEqual([{ type: 'token', value: '¿Cómo estás? 🌟' }]);
  });

  it('handles tokens with newlines (escaped)', () => {
    const p = new SseEventParser();
    const events = p.feed('data: {"token":"line1\\nline2"}\n\n');
    expect(events).toEqual([{ type: 'token', value: 'line1\nline2' }]);
  });
});
