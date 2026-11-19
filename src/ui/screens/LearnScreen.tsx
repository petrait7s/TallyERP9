import { useEffect, useRef } from 'react';
import { LESSONS } from '../learn/content';
import { LEVELS, LEVEL_NAME, levelCompletion, levelUnlocked, UNLOCK_AT } from '../learn/progress';
import { useLearn } from '../learn/store';
import { SimpleForm } from '../components/SimpleForm';
import { TallyList, useListNav } from '../components/TallyList';
import type { KeyHandler } from '../keys';
import { useApp } from '../store';

type Register = (h: KeyHandler | null) => void;

/** Learning Centre: levels, lessons, interview simulators, glossary, coverage. */
export function LearnScreen(props: { register: Register; openCheatsheet: () => void }) {
  const { push, pop, home, setHint } = useApp();
  const learn = useLearn();
  const p = learn.progress;
  const items: { label: string; heading?: boolean }[] = [];
  const acts: (() => void)[] = [];
  const add = (label: string, act: () => void, heading = false) => { items.push({ label, heading }); acts.push(act); };

  add(`XP ${p.xp}   |   Language: ${p.lang === 'en' ? 'English' : 'Bangla'} (Enter to switch)`, () => learn.toggleLang());
  add('Interview Simulator (A8): 30 timed tasks + 50 MCQ', () => push({ id: 'interviewStart', title: 'Interview', data: { v2: false } }));
  add('Interview Simulator v2 (X2): all Core + NGO topics', () => push({ id: 'interviewStart', title: 'Interview v2', data: { v2: true } }));
  add('Glossary & shortcut cheat sheet (Ctrl+/)', props.openCheatsheet);
  add('Coverage map (catalog vs lessons)', () => push({ id: 'report', title: 'Coverage', data: { params: { id: 'coverage' } } }));
  add('Free Practice: leave the lesson, coach off', () => { void learn.exit(); setHint('Free practice - coach off'); home(); });
  for (const lv of LEVELS) {
    const ls = LESSONS.filter((l) => l.level === lv);
    const open = levelUnlocked(LESSONS, p, lv);
    const pct = Math.round(levelCompletion(LESSONS, p, lv) * 100);
    add(`${LEVEL_NAME[lv]}  (${pct}% complete)${open ? '' : `  - LOCKED until previous level is ${UNLOCK_AT * 100}%`}`, () => undefined, true);
    for (const l of ls) {
      const lp = p.lessons[l.id];
      const mark = lp?.done ? `[done ${lp.score}%]` : open ? '[ ]' : '[locked]';
      add(`${mark.padEnd(12)} ${l.id.padEnd(4)} ${p.lang === 'bn' ? l.title.bn : l.title.en}`, () => {
        if (!open) { setHint(`Locked: finish ${UNLOCK_AT * 100}% of the previous level first`); return; }
        learn.start(l.id);
        home();
        setHint(`Lesson ${l.id} started - sandbox company loaded`);
      });
    }
  }
  const nav = useListNav(items, (i) => acts[i]?.());
  const ref = useRef(nav);
  ref.current = nav;
  useEffect(() => {
    props.register({ id: 'learn', onKey: (k) => (k === 'Esc' ? (pop(), true) : ref.current.onKey(k)) });
    return () => props.register(null);
  }, []);
  return <TallyList title="Learning Centre" items={items} sel={nav.sel} typed={nav.typed} onPick={nav.setSel} wide />;
}

export function InterviewStart(props: { v2: boolean; register: Register }) {
  const { pop, home } = useApp();
  const start = useLearn((s) => s.startInterview);
  useEffect(() => { props.register({ id: 'interviewStart', onKey: () => false }); return () => props.register(null); }, []);
  return (
    <SimpleForm title={`Interview Simulator ${props.v2 ? 'v2' : ''}: 30 tasks (30 min) + 50 MCQ (25 min)`} fields={[{ key: 'name', label: 'Your name (for the certificate)', type: 'text' }]} initial={{ name: '' }} onCancel={pop}
      onAccept={(v) => { if (!v.name.trim()) return 'Enter your name'; start(v.name.trim(), props.v2); home(); return null; }} />
  );
}
