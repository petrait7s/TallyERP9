import { useEffect } from 'react';
import pkg from '../../../package.json';
import type { KeyHandler } from '../keys';
import { useApp } from '../store';
import { LESSONS, TASKS, MCQS } from '../learn/content';

export function AboutScreen(props: { register: (h: KeyHandler | null) => void }) {
  const pop = useApp((s) => s.pop);
  useEffect(() => { props.register({ id: 'about', onKey: (k) => (k === 'Esc' || k === 'Enter' ? (pop(), true) : false) }); return () => props.register(null); }, []);
  return (
    <div className="panel menu-panel wide" role="dialog" aria-label="About TallyLearn NGO">
      <div className="panel-title">About TallyLearn NGO</div>
      <div className="stub about">
        <p><b>TallyLearn NGO</b> v{pkg.version} - a practice simulator for NGO accounting in the style of Tally ERP 9.</p>
        <p>{LESSONS.length} lessons (English + Bangla), {TASKS.length} interview tasks, {MCQS.length} MCQs, a seeded fictional NGO (Sylhet Community Development Foundation), fully offline.</p>
        <p className="disclaimer"><b>Disclaimer.</b> Tally and Tally ERP 9 are registered trademarks of Tally Solutions Pvt. Ltd. TallyLearn NGO is an independent learning tool and is <b>not affiliated with, endorsed by or derived from</b> Tally Solutions. It recreates keyboard workflow and report layouts only; no Tally code, logos or assets are used. All people, grants and figures in the seed data are fictional.</p>
        <p>VAT, TDS, FD-6/FD-7 and similar statutory features are <b>simulations for teaching</b>, not tax or legal advice. Verify current Bangladesh rules before relying on them.</p>
        <p>Licence: MIT. Windows builds are unsigned, so SmartScreen may warn on first run.</p>
        <div className="typed">Esc: back</div>
      </div>
    </div>
  );
}
