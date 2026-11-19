import { create } from 'zustand';
import { addLedger, can as roleCan, createCompany, toPaisa, type Action, type Role } from '../engine';
import type { Company, Period } from '../engine';
import type { ButtonDef } from './keys';
import { getAdapter, saveCompany } from './persist';
import { loadSeed, SEED_KEYS } from './seeds';

export interface ScreenRef {
  /** screen id, e.g. 'gateway', 'menu:Masters', 'stub:Ledgers' */
  id: string;
  title: string;
  /** payload (menu key, etc) */
  data?: Record<string, unknown>;
}

interface AppState {
  company: Company;
  /** storage id of the open company */
  companyId: string;
  /** replace the open company (select/restore/create) and return to Gateway */
  openCompany(id: string, c: Company): void;
  currentDate: string;
  /** report period (F2 in reports) */
  period: Period;
  setPeriod(p: Period): void;
  screens: ScreenRef[];
  /** transient message shown in the status bar */
  hint: string;
  /** signed-in user (roles gate entry and masters) */
  user: { name: string; role: Role };
  setUser(u: { name: string; role: Role }): void;
  can(a: Action): boolean;
  /** keys opened/visited in this session (lesson validators) */
  visited: Set<string>;
  visit(k: string): void;
  extraButtons: ButtonDef[];
  /** run an engine mutation on a copy; commits only on success */
  mutate(fn: (c: Company) => void): string | null;
  setExtraButtons(b: ButtonDef[]): void;
  push(s: ScreenRef): void;
  pop(): void;
  home(): void;
  setDate(iso: string): void;
  setHint(h: string): void;
}

export function demoCompany(): Company {
  const c = createCompany('Sylhet Community Development Foundation', '2025-04-01', '2026-03-31');
  addLedger(c, { name: 'Islami Bank A/c', group: 'Bank Accounts', opening: toPaisa(420000) });
  addLedger(c, { name: 'Capital Fund', group: 'Capital Fund', opening: -toPaisa(420000) });
  addLedger(c, { name: 'Local Donations', group: 'Donations', opening: 0 });
  addLedger(c, { name: 'Rent', group: 'Admin Expenses', opening: 0 });
  addLedger(c, { name: 'Rahim Traders', group: 'Sundry Debtors', opening: 0, billWise: true });
  addLedger(c, { name: 'Training Fee', group: 'Direct Incomes', opening: 0, costCentresApplicable: true });
  c.costCentres.push({ name: 'WASH-Jaflong', category: 'Primary Cost Category' }, { name: 'Health-Camp', category: 'Primary Cost Category' });
  return c;
}

/** visited keys change often (every keypress); listeners are notified without a React state update. */
export const visitListeners: (() => void)[] = [];

export const useApp = create<AppState>((set, get) => ({
  company: demoCompany(),
  companyId: 'demo',
  openCompany: (id, c) => set({ company: c, companyId: id, period: { from: c.fyStart, to: c.fyEnd }, currentDate: c.fyStart, screens: [{ id: 'gateway', title: 'Gateway of Tally' }], hint: '' }),
  currentDate: '2025-04-01',
  period: { from: '2025-04-01', to: '2026-03-31' },
  setPeriod: (period) => set({ period }),
  screens: [{ id: 'gateway', title: 'Gateway of Tally' }],
  hint: '',
  user: { name: 'admin', role: 'Admin' },
  setUser: (user) => set({ user }),
  can: (a) => roleCan(get().user.role, a),
  visited: new Set<string>(),
  visit: (k) => { const v = get().visited; if (!v.has(k)) { v.add(k); visitListeners.forEach((f) => f()); } },
  extraButtons: [],
  mutate: (fn) => {
    const copy = structuredClone(get().company);
    const logLen = copy.editLog?.length ?? 0;
    try {
      fn(copy);
      for (const e of (copy.editLog ?? []).slice(logLen)) e.user = get().user.name;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
    set({ company: copy });
    return null;
  },
  setExtraButtons: (extraButtons) => set({ extraButtons }),
  push: (s) => set((st) => ({ screens: [...st.screens, s] })),
  pop: () => set((st) => (st.screens.length > 1 ? { screens: st.screens.slice(0, -1) } : st)),
  home: () => set((st) => ({ screens: st.screens.slice(0, 1) })),
  setDate: (iso) => set({ currentDate: iso }),
  setHint: (hint) => set({ hint }),
}));


// ---- autosave: debounce company changes into storage
let timer: ReturnType<typeof setTimeout> | undefined;
let pending: { id: string; company: Company } | null = null;

export async function flushSave(): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = undefined;
  const p = pending;
  pending = null;
  if (p) await saveCompany(p.id, p.company);
}

useApp.subscribe((s, prev) => {
  if (s.company === prev.company) return;
  if (s.companyId !== prev.companyId) return; // switching: already saved by caller
  if (s.companyId === 'lesson' || s.companyId === 'interview') return; // sandboxes are never saved
  pending = { id: s.companyId, company: s.company };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { void flushSave(); }, 400);
});

/** First run seeds SCDF, Tea Garden and Blank NGO; later runs reopen the last company. */
export async function boot(): Promise<void> {
  const a = getAdapter();
  let metas = await a.list();
  if (!metas.length) {
    for (const key of SEED_KEYS) await saveCompany(key, loadSeed(key));
    await a.setLast('scdf');
    metas = await a.list();
  }
  const last = await a.getLast();
  const id = metas.find((m) => m.id === last)?.id ?? metas.find((m) => m.id === 'scdf')?.id ?? metas[0].id;
  const text = await a.load(id);
  if (text) {
    const { parseCompanyFile } = await import('../engine');
    useApp.getState().openCompany(id, parseCompanyFile(text).company);
    await a.setLast(id);
  }
}
