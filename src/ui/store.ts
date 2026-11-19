import { create } from 'zustand';
import { addLedger, createCompany, toPaisa } from '../engine';
import type { Company } from '../engine';

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
  screens: ScreenRef[];
  /** transient message shown in the status bar */
  hint: string;
  push(s: ScreenRef): void;
  pop(): void;
  home(): void;
  setDate(iso: string): void;
  setHint(h: string): void;
}

export function demoCompany(): Company {
  const c = createCompany('Sylhet Community Development Foundation', '2025-04-01', '2026-03-31');
  addLedger(c, { name: 'Islami Bank A/c', group: 'Bank Accounts', opening: toPaisa(420000) });
  return c;
}

export const useApp = create<AppState>((set) => ({
  company: demoCompany(),
  currentDate: '2025-04-01',
  screens: [{ id: 'gateway', title: 'Gateway of Tally' }],
  hint: '',
  push: (s) => set((st) => ({ screens: [...st.screens, s] })),
  pop: () => set((st) => (st.screens.length > 1 ? { screens: st.screens.slice(0, -1) } : st)),
  home: () => set((st) => ({ screens: st.screens.slice(0, 1) })),
  setDate: (iso) => set({ currentDate: iso }),
  setHint: (hint) => set({ hint }),
}));
