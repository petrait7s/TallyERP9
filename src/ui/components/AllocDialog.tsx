import { useEffect, useRef, useState } from 'react';
import { formatAmount, outstandingBills, toPaisa, type BillRef, type Company, type CostAlloc, type Paisa } from '../../engine';
import { PickInput } from './PickInput';

type Row = { a: string; b: string; amt: string };
const METHODS = ['New Ref', 'Agst Ref', 'Advance', 'On Account'];

interface Props {
  kind: 'cost' | 'bill';
  company: Company;
  ledger: string;
  total: Paisa;
  /** +1 Dr / -1 Cr */
  sign: 1 | -1;
  excludeVoucherId?: number;
  onDone: (result: CostAlloc[] | BillRef[] | null) => void;
}

/** Cost-centre / bill-wise allocation sub-screen. Enter advances; empty first column or full allocation finishes; Esc skips. */
export function AllocDialog({ kind, company, ledger, total, sign, excludeVoucherId, onDone }: Props) {
  const [rows, setRows] = useState<Row[]>([{ a: '', b: '', amt: '' }]);
  const [cur, setCur] = useState({ r: 0, c: 0 });
  const [error, setError] = useState('');
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const open = kind === 'bill' ? outstandingBills(company, ledger, { excludeVoucherId }) : [];

  const sum = (upTo = rows.length) => rows.slice(0, upTo).reduce((s, x) => s + (x.amt ? safe(x.amt) : 0), 0);
  const remaining = total - sum(cur.r);
  const cols = kind === 'cost' ? ['a', 'amt'] : rows[cur.r].a === 'On Account' ? ['a', 'amt'] : ['a', 'b', 'amt'];
  const colName = cols[Math.min(cur.c, cols.length - 1)];
  const key = `${cur.r}.${colName}`;

  useEffect(() => { refs.current[key]?.focus(); }, [key]);

  const upd = (r: number, patch: Partial<Row>) => setRows((xs) => xs.map((x, i) => (i === r ? { ...x, ...patch } : x)));
  const finish = (rs: Row[]) => {
    const used = rs.filter((x) => x.a);
    if (kind === 'cost') onDone(used.map((x) => ({ costCentre: x.a, amount: safe(x.amt) })));
    else onDone(used.map((x) => ({ method: x.a as BillRef['method'], ref: x.a === 'On Account' ? '' : x.b, amount: safe(x.amt) })));
  };

  const next = () => {
    const row = rows[cur.r];
    if (colName === 'a' && !row.a) {
      if (!cur.r) { setError(kind === 'cost' ? 'Select a cost centre' : 'Select a method'); return; }
      return;
    }
    if (colName === 'amt') {
      const v = safe(row.amt);
      if (!(v > 0)) { setError('Enter an amount'); return; }
      if (v > remaining) { setError(`Exceeds remaining ${formatAmount(remaining)}`); return; }
      const left = remaining - v;
      if (left === 0) { finish(rows); return; }
      setRows((xs) => [...xs, { a: '', b: '', amt: '' }]);
      setCur({ r: cur.r + 1, c: 0 });
      setError('');
      return;
    }
    setError('');
    setCur({ r: cur.r, c: cur.c + 1 });
  };

  const onPickA = (v: string) => {
    const patch: Partial<Row> = { a: v, b: '' };
    if (kind === 'cost') patch.amt = formatAmount(remaining, { decimals: true });
    else if (v !== 'Agst Ref') patch.amt = formatAmount(remaining);
    upd(cur.r, patch);
    setError('');
    setCur({ r: cur.r, c: 1 });
  };
  const onPickRef = (v: string) => {
    const refName = v.split(' | ')[0];
    const bill = open.find((x) => x.ref === refName);
    const amt = bill ? Math.min(remaining, Math.abs(bill.pending)) : remaining;
    upd(cur.r, { b: refName, amt: formatAmount(amt) });
    setCur({ r: cur.r, c: 2 });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); onDone(null); return; }
    if (e.key === 'Enter') { e.preventDefault(); next(); }
  };

  const centres = company.costCentres.map((x) => x.name);
  const total$ = formatAmount(total);

  return (
    <div className="modal-back" onKeyDown={onKeyDown}>
      <div className="panel alloc">
        <div className="panel-title">{kind === 'cost' ? 'Cost Centre Allocations' : 'Bill-wise Details'} for: {ledger}</div>
        <div className="alloc-sub">Amount: {total$} {sign > 0 ? 'Dr' : 'Cr'} &nbsp; Remaining: {formatAmount(Math.max(0, remaining))}</div>
        <table className="alloc-table">
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <td>
                  <PickInput
                    value={row.a} active={r === cur.r && colName === 'a'}
                    options={kind === 'cost' ? centres : METHODS}
                    onPick={onPickA}
                    onFocus={() => r === cur.r && setCur({ r, c: 0 })}
                    inputRef={(el) => { refs.current[`${r}.a`] = el; }}
                    placeholder={kind === 'cost' ? 'Cost Centre' : 'Type of Ref'}
                  />
                </td>
                {kind === 'bill' && row.a !== 'On Account' ? (
                  <td>
                    {row.a === 'Agst Ref' ? (
                      <PickInput
                        value={row.b} active={r === cur.r && colName === 'b'}
                        options={open.filter((b) => Math.sign(b.pending) !== sign).map((b) => `${b.ref} | ${formatAmount(Math.abs(b.pending))}`)}
                        onPick={onPickRef} inputRef={(el) => { refs.current[`${r}.b`] = el; }} placeholder="Name"
                      />
                    ) : (
                      <input
                        ref={(el) => { refs.current[`${r}.b`] = el; }} value={row.b} placeholder="Name"
                        onChange={(e) => upd(r, { b: e.target.value })}
                        disabled={r !== cur.r || !row.a}
                      />
                    )}
                  </td>
                ) : kind === 'bill' ? <td /> : null}
                <td>
                  <input
                    ref={(el) => { refs.current[`${r}.amt`] = el; }} className="num" value={row.amt}
                    onChange={(e) => upd(r, { amt: e.target.value })} disabled={r !== cur.r}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error ? <div className="form-msg err">{error}</div> : null}
        <div className="typed">Enter: next &nbsp; Esc: skip</div>
      </div>
    </div>
  );
}

function safe(s: string): Paisa {
  try { return toPaisa(s); } catch { return 0; }
}
