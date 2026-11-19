import { describe, expect, it } from 'vitest';
import { generateScdf } from '../src/engine';
import { buildReport } from '../src/ui/reports/build';
import { MOD_REPORTS } from '../src/ui/reports/modules';

describe('performance on the 600-voucher seed', () => {
  const c = generateScdf();
  const per = { from: c.fyStart, to: c.fyEnd };
  const t = (f: () => void) => { const s = performance.now(); f(); return performance.now() - s; };
  it('core reports render quickly', () => {
    for (const id of ['tb', 'bs', 'ie', 'rp', 'daybook', 'outstanding', 'funds'] as const)
      expect(t(() => buildReport(c, { id }, per, { detailed: true, vertical: false })), id).toBeLessThan(800);
  });
  it('all module reports together stay fast', () => {
    const ms = t(() => { for (const [k, d] of Object.entries(MOD_REPORTS)) buildReport(c, { id: 'mod', mod: k, arg: (d.ask ?? []).map((f) => `${f.key}=${f.def(c)}`).join('|') }, per, { detailed: false, vertical: false }); });
    expect(ms).toBeLessThan(4000);
  });
  it('seed generation is under 3 seconds', () => { expect(t(() => generateScdf())).toBeLessThan(3000); });
});
