import { useRef, useState } from 'react';
import type { Period } from '../../engine';
import { formatDate, parseTallyDate } from '../dates';

/** F2 report period: From, Enter, To, Enter accepts. */
export function PeriodDialog(props: { value: Period; fyStart: string; fyEnd: string; onAccept: (p: Period) => void; onCancel: () => void }) {
  const [from, setFrom] = useState(formatDate(props.value.from));
  const [to, setTo] = useState(formatDate(props.value.to));
  const [err, setErr] = useState('');
  const toRef = useRef<HTMLInputElement>(null);
  const f = parseTallyDate(from, props.value.from, { from: props.fyStart, to: props.fyEnd });
  const t = parseTallyDate(to, props.value.to, { from: props.fyStart, to: props.fyEnd });
  const stop = (e: React.KeyboardEvent) => e.stopPropagation();
  const accept = () => {
    if (!f || !t) return setErr('Invalid date');
    if (f > t) return setErr('From date is after To date');
    if (f < props.fyStart || t > props.fyEnd) return setErr('Period must be within the financial year');
    props.onAccept({ from: f, to: t });
  };
  return (
    <div className="modal-back">
      <div className="panel modal" role="dialog" aria-modal="true">
        <div className="panel-title">Change Period</div>
        <label className="field">From:&nbsp;
          <input autoFocus value={from} onFocus={(e) => e.target.select()} onChange={(e) => setFrom(e.target.value)}
            onKeyDown={(e) => { stop(e); if (e.key === 'Escape') props.onCancel(); if (e.key === 'Enter') { setFrom(f ? formatDate(f) : from); toRef.current?.focus(); } }} />
        </label>
        <label className="field">To:&nbsp;&nbsp;&nbsp;
          <input ref={toRef} value={to} onFocus={(e) => e.target.select()} onChange={(e) => setTo(e.target.value)}
            onKeyDown={(e) => { stop(e); if (e.key === 'Escape') props.onCancel(); if (e.key === 'Enter') accept(); }} />
        </label>
        <div className="note">{err || (f && t ? `${formatDate(f)} to ${formatDate(t)}` : 'Invalid date')}</div>
      </div>
    </div>
  );
}
