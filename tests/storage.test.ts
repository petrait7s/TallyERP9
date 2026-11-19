import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createStorage } from '../src/main/storage';

const mk = () => createStorage(mkdtempSync(join(tmpdir(), 'tl-')));
const doc = (name: string, n = 0) => JSON.stringify({ format: 'tallylearn-company', savedAt: `t${n}`, company: { name } });

describe('storage', () => {
  it('save/load/list/remove', () => {
    const s = mk();
    s.save('a1', doc('Alpha'));
    s.save('b1', doc('Beta'));
    expect(s.list().map((x) => x.name)).toEqual(['Alpha', 'Beta']);
    expect(JSON.parse(s.load('a1')!).company.name).toBe('Alpha');
    expect(s.load('zz')).toBeNull();
    s.remove('a1');
    expect(s.list().map((x) => x.id)).toEqual(['b1']);
  });
  it('rotates at most 5 backups and writes atomically', () => {
    const s = mk();
    for (let i = 0; i < 9; i++) s.save('c1', doc('C', i));
    expect(s.backups('c1')).toHaveLength(5);
    expect(JSON.parse(readFileSync(join(s.dir, 'c1.json'), 'utf8')).savedAt).toBe('t8');
    expect(existsSync(join(s.dir, 'c1.json.tmp'))).toBe(false);
  });
  it('rejects bad ids and garbage; remembers last', () => {
    const s = mk();
    expect(() => s.save('../evil', doc('x'))).toThrow(/Invalid/);
    expect(() => s.save('ok', '{not json')).toThrow();
    s.save('ok', doc('Ok'));
    s.setLast('ok');
    expect(s.getLast()).toBe('ok');
  });
});
