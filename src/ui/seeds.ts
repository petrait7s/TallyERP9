import { migrate, type Company } from '../engine';
import scdf from '../../content/seed/scdf.v1.json';
import tea from '../../content/seed/tea.v1.json';
import blank from '../../content/seed/blank.v1.json';

export type SeedKey = 'scdf' | 'tea' | 'blank';
const FILES: Record<SeedKey, { company: unknown }> = { scdf, tea, blank } as never;

/** Fresh copy of a seed company (never mutates the bundled data). */
export function loadSeed(key: SeedKey): Company {
  return migrate(structuredClone(FILES[key].company));
}
export const SEED_KEYS: SeedKey[] = ['scdf', 'tea', 'blank'];
