import * as fs from 'node:fs';
import * as path from 'node:path';

export interface CompanyMeta { id: string; name: string; savedAt: string }

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const KEEP_BACKUPS = 5;

/** JSON company files with atomic writes and rotating backups. No Electron imports (unit-testable). */
export function createStorage(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
  const file = (id: string) => {
    if (!SAFE_ID.test(id)) throw new Error('Invalid company id');
    return path.join(dir, `${id}.json`);
  };
  const metaFile = path.join(dir, 'meta.json');

  function rotate(id: string): void {
    const f = file(id);
    if (!fs.existsSync(f)) return;
    for (let i = KEEP_BACKUPS - 1; i >= 1; i--) {
      const from = `${f}.bak${i}`;
      if (fs.existsSync(from)) fs.renameSync(from, `${f}.bak${i + 1}`);
    }
    fs.copyFileSync(f, `${f}.bak1`);
  }

  return {
    dir,
    list(): CompanyMeta[] {
      const out: CompanyMeta[] = [];
      for (const n of fs.readdirSync(dir)) {
        if (!n.endsWith('.json') || n === 'meta.json') continue;
        const id = n.slice(0, -5);
        if (!SAFE_ID.test(id)) continue;
        try {
          const o = JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8'));
          out.push({ id, name: String(o.company?.name ?? id), savedAt: String(o.savedAt ?? '') });
        } catch { /* unreadable file: skipped; backups remain on disk */ }
      }
      return out.sort((a, b) => a.name.localeCompare(b.name));
    },
    load(id: string): string | null {
      const f = file(id);
      return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
    },
    save(id: string, json: string): void {
      JSON.parse(json); // refuse to write garbage
      const f = file(id);
      rotate(id);
      const tmp = `${f}.tmp`;
      fs.writeFileSync(tmp, json, 'utf8');
      fs.renameSync(tmp, f);
    },
    remove(id: string): void {
      const f = file(id);
      if (fs.existsSync(f)) fs.renameSync(f, `${f}.deleted`);
    },
    getLast(): string | null {
      try { return JSON.parse(fs.readFileSync(metaFile, 'utf8')).last ?? null; } catch { return null; }
    },
    setLast(id: string): void {
      file(id);
      fs.writeFileSync(metaFile, JSON.stringify({ last: id }), 'utf8');
    },
    backups(id: string): string[] {
      const f = file(id);
      return fs.readdirSync(dir).filter((n) => n.startsWith(`${id}.json.bak`)).map((n) => path.join(dir, n)).filter((x) => x.startsWith(f));
    },
  };
}
