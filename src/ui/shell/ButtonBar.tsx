import type { ButtonDef } from '../keys';

/** Right-hand F-key button bar. Slots with no action render greyed. */
export function ButtonBar({ buttons }: { buttons: ButtonDef[] }) {
  return (
    <div className="button-bar">
      {buttons.map((b, i) => (
        <button
          key={`${b.key}-${i}`}
          className="tbtn"
          disabled={b.disabled || !b.action}
          onClick={() => b.action?.()}
          tabIndex={-1}
        >
          <span className="tbtn-key">{b.key}</span>
          {b.label ? `: ${b.label}` : ''}
        </button>
      ))}
    </div>
  );
}
