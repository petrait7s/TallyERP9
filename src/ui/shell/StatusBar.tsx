import { useEffect, useState } from 'react';
import { useApp } from '../store';

export function StatusBar() {
  const hint = useApp((s) => s.hint);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="status-bar">
      <span>TallyLearn NGO v1.0 (practice edition, unaffiliated with Tally Solutions)</span>
      <span className="status-hint" role="status" aria-live="polite">{hint}</span>
      <span>{now.toLocaleDateString('en-GB')} {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
}
