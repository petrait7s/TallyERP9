import { useEffect, useMemo, useRef } from 'react';
import { buildReport } from '../reports/build';
import { reportToHtml } from '../reports/html';
import type { ReportParams } from '../reports/types';
import type { KeyHandler } from '../keys';
import { getAdapter } from '../persist';
import { useApp } from '../store';

/** Print preview (A4) of a report. Alt+P prints, Alt+E saves a PDF (Electron) or opens the print dialog (browser). */
export function PreviewScreen(props: { params: ReportParams; opts: { detailed: boolean; vertical: boolean }; register: (h: KeyHandler | null) => void }) {
  const { company, period, pop, setHint, setExtraButtons } = useApp();
  const model = useMemo(() => buildReport(company, props.params, period, props.opts), [company, props.params, period, props.opts]);
  const html = useMemo(() => reportToHtml(model, company.name), [model, company.name]);
  const frame = useRef<HTMLIFrameElement>(null);

  const print = () => { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print(); };
  const pdf = async () => {
    const name = `${model.title.replace(/[^\w]+/g, '_')}.pdf`;
    const r = await getAdapter().exportPdf(html, name);
    if (r === undefined) { setHint('PDF export needs the desktop app; use "Save as PDF" in the print dialog'); print(); }
    else setHint(r ? `PDF saved: ${r}` : 'PDF export cancelled');
  };
  const act = useRef({ print, pdf, pop });
  act.current = { print, pdf, pop };

  useEffect(() => {
    props.register({
      id: 'preview',
      onKey: (k) => {
        if (k === 'Esc') { act.current.pop(); return true; }
        if (k === 'Alt+P' || k === 'Enter') { act.current.print(); return true; }
        if (k === 'Alt+E') { void act.current.pdf(); return true; }
        return false;
      },
    });
    setExtraButtons([
      { key: 'Alt+P', label: 'Print', action: () => act.current.print() },
      { key: 'Alt+E', label: 'Save PDF', action: () => void act.current.pdf() },
      { key: 'Esc', label: 'Back', action: () => act.current.pop() },
    ]);
    return () => { props.register(null); setExtraButtons([]); };
  }, []);

  return (
    <div className="panel report-panel preview-panel">
      <div className="panel-title">Print Preview: {model.title}</div>
      <iframe ref={frame} title="preview" srcDoc={html} className="preview-frame" sandbox="allow-same-origin allow-modals" />
    </div>
  );
}
