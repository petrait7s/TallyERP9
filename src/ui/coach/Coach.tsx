import { useEffect, useRef, useState } from 'react';
import { GLOSSARY, LESSONS, lessonById } from '../learn/content';
import { MCQ_COUNT } from '../learn/interview';
import { useLearn } from '../learn/store';
import { certificateHtml } from '../learn/certificate';
import { getAdapter } from '../persist';

const T = (lang: 'en' | 'bn', bi: { en: string; bn: string }) => (lang === 'bn' ? bi.bn : bi.en);

const mmss = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function useNow(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return now;
}

/** Collapsible side coach: lesson steps or interview tasks. Never changes the Tally screens themselves. */
export function Coach() {
  const { active, interview, progress, coachOpen, toggleCoach, toggleLang, showHint, showKeys, reset, exit, start, nextTask, finishTasks } = useLearn();
  const now = useNow();
  const lang = progress.lang;
  if (!active && !interview) return null;

  if (!coachOpen) return <div className="panel coach collapsed" onClick={toggleCoach}><b>Coach</b> <small>(Ctrl+J)</small></div>;

  if (interview && interview.phase === 'tasks') {
    const t = interview.tasks[interview.current];
    const done = Object.values(interview.done).filter(Boolean).length;
    return (
      <div className="panel coach" role="complementary" aria-label="Lesson coach">
        <div className="panel-title">Interview {interview.v2 ? 'v2' : ''} <button className="mini" onClick={toggleCoach}>-</button></div>
        <div className="coach-body">
          <div className="coach-meta">Task {interview.current + 1}/{interview.tasks.length} &nbsp; Done {done} &nbsp; <b>{mmss(interview.taskDeadline - now)}</b></div>
          <div className={interview.done[t.id] ? 'coach-step ok' : 'coach-step'}>{interview.done[t.id] ? '✓ ' : ''}{T(lang, t.text)}</div>
          <div className="coach-btns">
            <button onClick={nextTask}>Next task (Ctrl+N)</button>
            <button onClick={finishTasks}>Finish tasks &rarr; MCQ (Ctrl+M)</button>
            <button onClick={toggleLang}>{lang === 'en' ? 'বাংলা' : 'English'}</button>
          </div>
        </div>
      </div>
    );
  }
  if (!active) return null;
  const lesson = lessonById(active.id)!;
  const step = lesson.steps[Math.min(active.step, lesson.steps.length - 1)];
  const idx = LESSONS.findIndex((l) => l.id === lesson.id);
  const next = LESSONS[idx + 1];
  return (
    <div className="panel coach" role="complementary" aria-label="Lesson coach">
      <div className="panel-title">{lesson.id}: {T(lang, lesson.title)} <button className="mini" onClick={toggleCoach}>-</button></div>
      <div className="coach-body">
        <div className="coach-bar"><div style={{ width: `${(Math.min(active.step, lesson.steps.length) / lesson.steps.length) * 100}%` }} /></div>
        {active.phase === 'steps' ? (
          <>
            <div className="coach-meta">Step {active.step + 1}/{lesson.steps.length}</div>
            <div className="coach-step">{T(lang, step.instruction)}</div>
            {active.hint && step.hint ? <div className="coach-hint">{T(lang, step.hint)}</div> : null}
            {active.keys && step.keys ? <div className="coach-keys">{step.keys}</div> : null}
          </>
        ) : active.phase === 'quiz' ? (
          <div className="coach-step">{lang === 'bn' ? 'কুইজ দিন (Enter)।' : 'Steps done. Take the quiz (it opens now).'}{active.score !== undefined ? ` Score ${active.score}% - need 80%.` : ''}</div>
        ) : (
          <div className="coach-step ok">{lang === 'bn' ? 'পাঠ সম্পন্ন!' : 'Lesson complete!'} {active.score}%</div>
        )}
        <div className="coach-btns">
          {active.phase === 'steps' ? <><button onClick={showHint}>Hint (Ctrl+H)</button><button onClick={showKeys}>Show me (Ctrl+K)</button></> : null}
          {active.phase === 'done' && next ? <button onClick={() => start(next.id)}>Next: {next.id}</button> : null}
          <button onClick={reset}>Reset sandbox (Ctrl+R)</button>
          <button onClick={toggleLang}>{lang === 'en' ? 'বাংলা' : 'English'}</button>
          <button onClick={() => void exit()}>Exit lesson</button>
        </div>
      </div>
    </div>
  );
}

/** Quiz at the end of a lesson, and the 50-question interview MCQ round. Keys 1-4 answer, Enter next. */
export function QuizDialog() {
  const { active, interview, progress, finishQuiz, finishMcq } = useLearn();
  const lang = progress.lang;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const now = useNow();
  const lesson = active?.phase === 'quiz' ? lessonById(active.id) : undefined;
  const mcq = interview?.phase === 'mcq' ? interview : undefined;
  const qs = lesson?.quiz ?? mcq?.mcq ?? [];
  const key = lesson ? `l-${lesson.id}-${active?.score ?? 'x'}` : mcq ? 'iv' : '';
  useEffect(() => { setI(0); setAnswers([]); }, [key]);
  const open = qs.length > 0;
  const overtime = mcq ? now > mcq.mcqDeadline : false;

  const answer = (n: number) => {
    const next = [...answers]; next[i] = n; setAnswers(next);
    if (i + 1 >= qs.length) {
      if (lesson) finishQuiz(qs.filter((q, k) => next[k] === q.answer).length, qs.length);
      else finishMcq(next);
    } else setI(i + 1);
  };
  const latest = useRef({ answer, qs, i, open });
  latest.current = { answer, qs, i, open };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const L = latest.current;
      if (!L.open || e.ctrlKey || e.altKey) return;
      if (e.key >= '1' && e.key <= '4' && Number(e.key) <= L.qs[L.i].options.length) { e.preventDefault(); e.stopPropagation(); L.answer(Number(e.key) - 1); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
  useEffect(() => { if (mcq && overtime) finishMcq(answers); }, [overtime]);
  if (!open) return null;
  const q = qs[i];
  return (
    <div className="modal-back">
      <div className="panel quiz" role="dialog" aria-modal="true" aria-label="Quiz">
        <div className="panel-title">{lesson ? `Quiz: ${lesson.id}` : 'Interview MCQ'} {i + 1}/{qs.length}{mcq ? `  -  ${mmss(mcq.mcqDeadline - now)}` : ''}</div>
        <div className="quiz-q">{T(lang, q.q)}</div>
        <ul className="menu-list">{q.options.map((o, k) => <li key={k} className="menu-item" onClick={() => answer(k)}><b>{k + 1}</b>&nbsp; {o}</li>)}</ul>
        <div className="typed">Press 1-{q.options.length} to answer{lesson ? ' (80% to pass)' : `  (${MCQ_COUNT} questions)`}</div>
      </div>
    </div>
  );
}

export function InterviewResult() {
  const { interview, closeInterview, progress } = useLearn();
  if (interview?.phase !== 'result' || !interview.result) return null;
  const r = interview.result;
  const printCert = async () => {
    const html = certificateHtml(interview.name, r, new Date().toISOString().slice(0, 10));
    const p = await getAdapter().exportPdf(html, `Certificate-${interview.name.replace(/\W+/g, '_')}.pdf`);
    if (p === undefined) { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print(); } }
  };
  return (
    <div className="modal-back">
      <div className="panel quiz" tabIndex={-1} ref={(el) => el?.focus()} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') void closeInterview(); if (e.altKey && e.key.toLowerCase() === 'p' && r.passed) void printCert(); }}>
        <div className="panel-title">Interview Result</div>
        <div className="quiz-q"><b>{r.percent}%</b> - {r.grade} ({r.passed ? 'PASSED' : 'not passed; 70% needed'})</div>
        <div className="coach-step">Practical tasks: {r.taskScore}/{r.taskTotal} &nbsp; MCQ: {r.mcqScore}/{r.mcqTotal}</div>
        <div className="coach-btns">{r.passed ? <button onClick={() => void printCert()}>Certificate PDF (Alt+P)</button> : null}<button onClick={() => void closeInterview()}>Close (Enter)</button></div>
        <div className="typed">XP {progress.xp}</div>
      </div>
    </div>
  );
}

const SHORTCUTS: [string, string][] = [
  ['Esc', 'back / cancel'], ['Enter', 'select / next field / drill down'], ['Ctrl+A', 'accept'], ['Ctrl+Q', 'abandon'], ['Alt+C', 'create master on the fly'], ['Alt+D', 'delete (in alteration)'],
  ['Alt+2', 'duplicate voucher (Day Book)'], ['Alt+X', 'cancel voucher'], ['Alt+P / Alt+E', 'print preview / export CSV'], ['Alt+F1', 'detailed / condensed'], ['Alt+F5', 'vertical / horizontal'],
  ['F1', 'select company'], ['F2', 'date / period'], ['F3 / Alt+F3', 'company info'], ['F4-F9', 'Contra, Payment, Receipt, Journal, Sales, Purchase'], ['Ctrl+F8 / Ctrl+F9', 'Credit / Debit note'],
  ['F10', 'other vouchers'], ['F11 / F12', 'features / configure'], ['Ctrl+H / Ctrl+K', 'coach hint / show me'], ['Ctrl+L / Ctrl+J', 'coach language / collapse'], ['Ctrl+/', 'this sheet'],
];

export function Cheatsheet({ onClose }: { onClose: () => void }) {
  const lang = useLearn((s) => s.progress.lang);
  return (
    <div className="modal-back">
      <div className="panel cheat" tabIndex={-1} ref={(el) => el?.focus()} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }}>
        <div className="panel-title">Shortcuts &amp; Glossary (Esc to close)</div>
        <div className="cheat-body">
          <table className="rtable"><tbody>{SHORTCUTS.map(([k, d]) => <tr key={k}><td><b>{k}</b></td><td>{d}</td></tr>)}</tbody></table>
          <table className="rtable"><tbody>{GLOSSARY.map((g) => <tr key={g.term}><td><b>{g.term}</b></td><td>{lang === 'bn' ? g.bn : g.en}</td></tr>)}</tbody></table>
        </div>
      </div>
    </div>
  );
}
