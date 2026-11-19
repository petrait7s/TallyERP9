import { create } from 'zustand';
import { addLedger, createCompany, toPaisa } from '../engine';
import type { Company, Period } from '../engine';
import type { ButtonDef } from './keys';

export interface ScreenRef {
  /** screen id, e.g. 'gateway', 'menu:Masters', 'stub:Ledgers' */
  id: string;
  title: string;
  /** payload (menu key, etc) */
  data?: Record<string, unknown>;
}

interface AppState {
  company: Company;
  currentDate: string;
  /** report period (F2 in reports) */
  period: Period;
  setPeriod(p: Period): void;
  screens: ScreenRef[];
  /** transient message shown in the status bar */
  hint: string;
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

export const useApp = create<AppState>((set, get) => ({
  company: demoCompany(),
  currentDate: '2025-04-01',
  period: { from: '2025-04-01', to: '2026-03-31' },
  setPeriod: (period) => set({ period }),
  screens: [{ id: 'gateway', title: 'Gateway of Tally' }],
  hint: '',
  extraButtons: [],
  mutate: (fn) => {
    const copy = structuredClone(get().company);
    try {
      fn(copy);
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
