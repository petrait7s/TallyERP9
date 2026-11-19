import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cancelVoucher, duplicateVoucher } from '../../engine';
import { buildReport, toCsv } from '../reports/build';
import type { ReportModel, ReportParams, Row } from '../reports/types';
import type { KeyHandler } from '../keys';
import { PeriodDialog } from '../shell/PeriodDialog';
import { useApp } from '../store';

/** Remembers cursor/toggles per drill-down level so Esc returns to the same row. */
const memory = new Map<string, { sel: number; side: 0 | 1; detailed: boolean; vertical: boolean }>();

const selectable = (r: Row | undefined) => !!r && !r.total && !r.heading;

function nav(rows: Row[], from: number, dir: 1 | -1, step = 1): number {
  let i = from;
  let moved = 0;
  while (moved < step) {
    let j = i + dir;
    while (j >= 0 && j < rows.length && !selectable(rows[j])) j += dir;
    if (j < 0 || j >= rows.length) break;
    i = j;
    moved++;
  }
  return i;
}
const first = (rows: Row[]) => Math.max(0, rows.findIndex(selectable));
const last = (rows: Row[]) => { for (let i = rows.length - 1; i >= 0; i--) if (selectable(rows[i])) return i; return 0; };

export function ReportScreen(props: { params: ReportParams; depth: number; register: (h: KeyHandler | null) => void }) {
  const { company, period, setPeriod, push, pop, mutate, setHint, setExtraButtons } = useApp();
  const memKey = `${props.depth}:${JSON.stringify(props.params)}`;
  const saved = memory.get(memKey);
  const [detailed, setDetailed] = useState(saved?.detailed ?? false);
  const [vertical, setVertical] = useState(saved?.vertical ?? false);
  const [side, setSide] = useState<0 | 1>(saved?.side ?? 0);
  const [sel, setSel] = useState(saved?.sel ?? -1);
  const [periodOpen, setPeriodOpen] = useState(false);

  const model: ReportModel = useMemo(
    () => buildReport(company, props.params, period, { detailed, vertical }),
    [company, props.params, period, detailed, vertical],
  );
  const sides: Row[][] = model.layout === 'double' ? [model.rows, model.right ?? []] : [model.rows];
  const cur = sides[Math.min(side, sides.length - 1)];
  const idx = sel >= 0 && sel < cur.length && selectable(cur[sel]) ? sel : first(cur);

  useEffect(() => { memory.set(memKey, { sel: idx, side, detailed, vertical }); }, [memKey, idx, side, detailed, vertical]);
  useLayoutEffect(() => { document.querySelector('.rsel')?.scrollIntoView({ block: 'nearest' }); });

  const state = useRef({ model, cur, idx, side, detailed, vertical });
  state.current = { model, cur, idx, side, detailed, vertical };

  const open = () => {
    const row = state.current.cur[state.current.idx];
    if (!row) return;
    if (row.drill) push({ id: 'report', title: row.cells[0] || 'Report', data: { params: row.drill } });
    else if (row.voucherId) {
      const v = useApp.getState().company.vouchers.find((x) => x.id === row.voucherId);
      if (v) push({ id: 'voucherEntry', title: `${v.type} ${v.number}`, data: { typeName: v.type, voucherId: v.id } });
    }
  };
  const exportCsv = () => {
    const blob = new Blob(['﻿' + toCsv(state.current.model)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${state.current.model.title.replace(/[^\w]+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setHint('Exported to CSV');
  };
  const voucherAction = (kind: 'dup' | 'cancel') => {
    const row = state.current.cur[state.current.idx];
    if (!row?.voucherId || !state.current.model.voucherActions) return;
    const id = row.voucherId;
    const err = mutate((c) => (kind === 'dup' ? void duplicateVoucher(c, id) : cancelVoucher(c, id)));
    setHint(err ?? (kind === 'dup' ? 'Voucher duplicated' : 'Voucher cancelled'));
  };

  const keyActions = useRef({ open, exportCsv, voucherAction, pop });
  keyActions.current = { open, exportCsv, voucherAction, pop };

  useEffect(() => {
    props.register({
      id: `report:${props.params.id}`,
      onKey: (k) => {
        const st = state.current;
        const a = keyActions.current;
        const move = (dir: 1 | -1, step = 1) => { setSel(nav(st.cur, st.idx, dir, step)); return true; };
        switch (k) {
          case 'Esc': a.pop(); return true;
          case 'ArrowDown': return move(1);
          case 'ArrowUp': return move(-1);
          case 'PageDown': return move(1, 10);
          case 'PageUp': return move(-1, 10);
          case 'Home': setSel(first(st.cur)); return true;
          case 'End': setSel(last(st.cur)); return true;
          case 'ArrowLeft': if (st.model.layout === 'double') { setSide(0); setSel(-1); } return true;
          case 'ArrowRight': if (st.model.layout === 'double') { setSide(1); setSel(-1); } return true;
          case 'Enter': a.open(); return true;
          case 'F2': setPeriodOpen(true); return true;
          case 'Alt+F1': if (st.model.canDetail) setDetailed((d) => !d); return true;
          case 'Alt+F5': if (st.model.canVertical) { setVertical((v) => !v); setSide(0); setSel(-1); } return true;
          case 'Alt+E': a.exportCsv(); return true;
          case 'Alt+P': window.print(); return true;
          case 'Alt+2': a.voucherAction('dup'); return true;
          case 'Alt+X': a.voucherAction('cancel'); return true;
        }
        return false;
      },
    });
    return () => props.register(null);
  }, []);

  useEffect(() => {
    setExtraButtons([
      { key: 'F2', label: 'Period', action: () => setPeriodOpen(true) },
      { key: 'Alt+F1', label: detailed ? 'Condensed' : 'Detailed', disabled: !model.canDetail, action: () => setDetailed((d) => !d) },
      { key: 'Alt+F5', label: vertical ? 'Horizontal' : 'Vertical', disabled: !model.canVertical, action: () => setVertical((v) => !v) },
      { key: 'Alt+E', label: 'Export', action: () => keyActions.current.exportCsv() },
      { key: 'Alt+P', label: 'Print', action: () => window.print() },
      { key: 'Esc', label: 'Back', action: () => keyActions.current.pop() },
    ]);
    return () => setExtraButtons([]);
  }, [detailed, vertical, model.canDetail, model.canVertical, setExtraButtons]);

  const table = (rows: Row[], active: boolean, title?: string) => (
    <div className="rtable-wrap">
      {title ? <div className="rside-title">{title}</div> : null}
      <table className="rtable">
        <thead>
          <tr>{model.columns.map((c, i) => <th key={i} className={i >= model.numericFrom ? 'num' : ''}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const selected = active && i === idx && selectable(r);
            return (
              <tr key={i} className={[selected ? 'rsel' : '', r.bold ? 'rbold' : '', r.total ? 'rtotal' : '', r.heading ? 'rhead' : ''].join(' ')}
                onClick={() => { if (selectable(r)) { setSide(model.layout === 'double' && rows === model.right ? 1 : 0); setSel(i); } }}
                onDoubleClick={() => keyActions.current.open()}>
                {model.columns.map((_, ci) => (
                  <td key={ci} className={ci >= model.numericFrom ? 'num' : ''} style={ci === 0 && r.indent ? { paddingLeft: 8 + r.indent * 16 } : undefined}>
                    {r.cells[ci] ?? ''}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="panel report-panel">
      <div className="panel-title">{model.title}</div>
      {model.subtitle ? <div className="report-sub">{company.name} &nbsp;|&nbsp; {model.subtitle}</div> : null}
      <div className={model.layout === 'double' ? 'report-body two' : 'report-body'}>
        {model.layout === 'double'
          ? (<>{table(model.rows, side === 0, model.leftTitle)}{table(model.right ?? [], side === 1, model.rightTitle)}</>)
          : table(model.rows, true)}
      </div>
      {model.note ? <div className="form-msg err">{model.note}</div> : null}
      {periodOpen ? (
        <PeriodDialog value={period} fyStart={company.fyStart} fyEnd={company.fyEnd}
          onAccept={(p) => { setPeriod(p); setPeriodOpen(false); }} onCancel={() => setPeriodOpen(false)} />
      ) : null}
    </div>
  );
}
