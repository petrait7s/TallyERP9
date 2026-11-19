import { createCompany, parseCompanyFile, serializeCompany, type Company } from '../engine';

export interface CompanyMeta { id: string; name: string; savedAt: string }

/** Storage + file access. Electron (IPC) in the app, localStorage/Blob in a plain browser (dev, tests). */
export interface Adapter {
  list(): Promise<CompanyMeta[]>;
  load(id: string): Promise<string | null>;
  save(id: string, json: string): Promise<void>;
  remove(id: string): Promise<void>;
  getLast(): Promise<string | null>;
  setLast(id: string): Promise<void>;
  /** save text via dialog / download; resolves to a path or file name, null if cancelled */
  saveText(name: string, text: string): Promise<string | null>;
  /** pick a file and read it (Electron only; browser returns undefined = use <input type=file>) */
  openText(): Promise<string | null | undefined>;
  /** render HTML to PDF (Electron only; browser returns undefined = use print dialog) */
  exportPdf(html: string, name: string): Promise<string | null | undefined>;
}

declare global {
  interface Window {
    tallylearn?: {
      platform: string;
      storage: Pick<Adapter, 'list' | 'load' | 'save' | 'remove' | 'getLast' | 'setLast'>;
      files: { saveText: Adapter['saveText']; openText: () => Promise<string | null>; exportPdf: (h: string, n: string) => Promise<string | null> };
    };
  }
}

const P = 'tl:company:';

const browserAdapter: Adapter = {
  async list() {
    const out: CompanyMeta[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith(P)) continue;
      try {
        const o = JSON.parse(localStorage.getItem(k)!);
        out.push({ id: k.slice(P.length), name: o.company.name, savedAt: o.savedAt });
      } catch { /* skip */ }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  },
  async load(id) { return localStorage.getItem(P + id); },
  async save(id, json) { localStorage.setItem(P + id, json); },
  async remove(id) { localStorage.removeItem(P + id); },
  async getLast() { return localStorage.getItem('tl:last'); },
  async setLast(id) { localStorage.setItem('tl:last', id); },
  async saveText(name, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    return name;
  },
  async openText() { return undefined; },
  async exportPdf() { return undefined; },
};

function electronAdapter(t: NonNullable<Window['tallylearn']>): Adapter {
  return { ...t.storage, saveText: t.files.saveText, openText: t.files.openText, exportPdf: t.files.exportPdf };
}

export function getAdapter(): Adapter {
  const t = typeof window !== 'undefined' ? window.tallylearn : undefined;
  return t?.storage ? electronAdapter(t) : browserAdapter;
}

export function uid(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export async function saveCompany(id: string, c: Company): Promise<void> {
  await getAdapter().save(id, serializeCompany(c, id));
}

export async function loadCompanyFile(id: string): Promise<Company | null> {
  const text = await getAdapter().load(id);
  return text ? parseCompanyFile(text).company : null;
}

export { createCompany };
