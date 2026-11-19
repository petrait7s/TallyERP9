import { useState } from 'react';
import { formatDate, parseTallyDate } from '../dates';

/** F2 change-date prompt. Enter accepts, Esc cancels (handled via onKey from Shell). */
export function DateDialog(props: { value: string; value2?: string; onAccept: (iso: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(formatDate(props.value));
  const parsed = parseTallyDate(text, props.value);
  return (
    <div className="modal-back">
      <div className="panel modal" role="dialog" aria-modal="true">
        <div className="panel-title">Change Current Date</div>
        <label className="field">
          Current Date:&nbsp;
          <input
            autoFocus
            onFocus={(e) => e.target.select()}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter' && parsed) props.onAccept(parsed);
              if (e.key === 'Escape') props.onCancel();
            }}
          />
        </label>
        <div className="note">{parsed ? formatDate(parsed) : 'Invalid date'}</div>
      </div>
    </div>
  );
}
