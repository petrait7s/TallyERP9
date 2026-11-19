import { describe, expect, it } from 'vitest';
import { KeyRouter, normalizeKey } from '../src/ui/keys';
import { formatDate, parseTallyDate, weekday } from '../src/ui/dates';

describe('normalizeKey', () => {
  it('maps', () => {
    expect(normalizeKey({ key: 'Escape' })).toBe('Esc');
    expect(normalizeKey({ key: 'F8', ctrlKey: true })).toBe('Ctrl+F8');
    expect(normalizeKey({ key: 'c', altKey: true })).toBe('Alt+C');
    expect(normalizeKey({ key: 'Shift', shiftKey: true })).toBe('');
    expect(normalizeKey({ key: ' ' })).toBe('Space');
  });
});

describe('KeyRouter', () => {
  it('top handler first, then enabled buttons; pop restores', () => {
    const r = new KeyRouter();
    const log: string[] = [];
    r.push({ id: 'a', onKey: (k) => (k === 'Esc' ? (log.push('a-esc'), true) : false) });
    r.push({
      id: 'b',
      onKey: (k) => k === 'Esc' && (log.push('b-esc'), true),
      buttons: () => [{ key: 'F4', label: 'x', action: () => log.push('f4') }, { key: 'F5', label: 'y', disabled: true, action: () => log.push('f5') }],
    });
    r.dispatch({ key: 'Escape' });
    expect(r.dispatch({ key: 'F4' })).toBe(true);
    expect(r.dispatch({ key: 'F5' })).toBe(false);
    r.pop();
    r.dispatch({ key: 'Escape' });
    expect(log).toEqual(['b-esc', 'f4', 'a-esc']);
  });
});

describe('dates', () => {
  it('parses Tally shorthand', () => {
    expect(parseTallyDate('1-4-25', '2025-04-01')).toBe('2025-04-01');
    expect(parseTallyDate('15', '2025-06-03')).toBe('2025-06-15');
    expect(parseTallyDate('1/5', '2025-04-01')).toBe('2025-05-01');
    expect(parseTallyDate('31-2', '2025-04-01')).toBeNull();
    expect(parseTallyDate('x', '2025-04-01')).toBeNull();
  });
  it('formats', () => {
    expect(formatDate('2025-04-01')).toBe('1-Apr-2025');
    expect(weekday('2025-04-01')).toBe('Tuesday');
  });
});
