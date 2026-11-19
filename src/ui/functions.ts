import { exportMastersXml, serializeCompany } from '../engine';
import { buildReport } from './reports/build';
import { reportToHtml } from './reports/html';
import { getAdapter } from './persist';
import { flushSave, useApp } from './store';
import { loadSeed } from './seeds';

/** Built-in functions reachable from menus (export, reset, login, auditor pack). */
export function runFn(name: string): void {
  const st = useApp.getState();
  const a = getAdapter();
  st.visit(`fn:${name}`);
  switch (name) {
    case 'about':
      st.push({ id: 'about', title: 'About' });
      return;
    case 'learn':
      st.push({ id: 'learn', title: 'Learning Centre' });
      return;
    case 'xmlExport':
      void a.saveText(`${st.company.name.replace(/[^\w]+/g, '_')}-masters.xml`, exportMastersXml(st.company)).then((p) => st.setHint(p ? `XML exported: ${p}` : 'Export cancelled'));
      return;
    case 'resetSeed': {
      const key = st.company.meta.seedKey;
      if (!key) { st.setHint('This company was not created from a seed'); return; }
      const fresh = loadSeed(key);
      useApp.getState().openCompany(st.companyId, fresh);
      void flushSave().then(() => a.save(st.companyId, serializeCompany(fresh, st.companyId)));
      useApp.getState().setHint(`Company reset to the ${key.toUpperCase()} seed`);
      return;
    }
    case 'login':
      st.push({ id: 'company', title: 'Select User', data: { action: 'login' } });
      return;
    case 'auditorPack': {
      const ids = ['tb', 'bs', 'ie', 'rp', 'funds'] as const;
      const mods = ['assets.schedule', 'pack.notes', 'audit.exceptions'];
      const parts = [
        ...ids.map((id) => buildReport(st.company, { id }, st.period, { detailed: false, vertical: false })),
        ...mods.map((m) => buildReport(st.company, { id: 'mod', mod: m }, st.period, { detailed: false, vertical: false })),
      ].map((m) => reportToHtml(m, st.company.name).replace(/^[\s\S]*<body>/, '<section style="page-break-after:always">').replace(/<\/body>[\s\S]*$/, '</section>'));
      const head = reportToHtml(buildReport(st.company, { id: 'tb' }, st.period, { detailed: false, vertical: false }), st.company.name).match(/<style>[\s\S]*?<\/style>/)![0];
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Auditor Pack</title>${head}</head><body>${parts.join('')}</body></html>`;
      void a.exportPdf(html, `${st.company.name.replace(/[^\w]+/g, '_')}-auditor-pack.pdf`).then((p) => {
        if (p === undefined) { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print(); } st.setHint('Auditor pack opened for printing (use Save as PDF)'); }
        else st.setHint(p ? `Auditor pack saved: ${p}` : 'Export cancelled');
      });
      return;
    }
  }
}
