import { create } from 'zustand';
import { loadSeed } from '../seeds';
import { getAdapter } from '../persist';
import { parseCompanyFile } from '../../engine';
import { useApp, visitListeners } from '../store';
import { evalCheck } from './check';
import { LESSONS, MCQS, TASKS, lessonById } from './content';
import { MCQ_COUNT, MCQ_MINUTES, TASK_COUNT, TASK_MINUTES, pickTasks, sample, scoreInterview, type InterviewResult } from './interview';
import { applyOps, type Ctx } from './ops';
import { levelUnlocked, loadProgress, recordLesson, saveProgress, lessonScore, UNLOCK_AT, type Progress } from './progress';
import type { Lesson, Mcq, Op, Task } from './types';

export const SANDBOX_IDS = ['lesson', 'interview'];

export interface ActiveLesson { id: string; step: number; phase: 'steps' | 'quiz' | 'done'; hint: boolean; keys: boolean; score?: number }
export interface Interview {
  v2: boolean; name: string; phase: 'tasks' | 'mcq' | 'result';
  tasks: Task[]; done: Record<string, boolean>; current: number;
  mcq: Mcq[]; answers: number[]; taskDeadline: number; mcqDeadline: number; result?: InterviewResult;
}

interface LearnState {
  progress: Progress;
  active: ActiveLesson | null;
  interview: Interview | null;
  /** names of companies created/split inside a lesson sandbox */
  companies: string[];
  coachOpen: boolean;
  start(id: string): void;
  exit(): Promise<void>;
  reset(): void;
  toggleLang(): void;
  toggleCoach(): void;
  showHint(): void;
  showKeys(): void;
  finishQuiz(correct: number, total: number): void;
  addCompany(name: string): void;
  startInterview(name: string, v2: boolean): void;
  nextTask(): void;
  finishTasks(): void;
  finishMcq(answers: number[]): void;
  closeInterview(): Promise<void>;
}

/** Reopen the user's real (persisted) company after a sandbox lesson or interview. */
export async function restoreReal(): Promise<void> {
  const a = getAdapter();
  const metas = await a.list();
  const last = await a.getLast();
  const id = metas.find((m) => m.id === last)?.id ?? metas[0]?.id;
  if (!id) return;
  const text = await a.load(id);
  if (text) useApp.getState().openCompany(id, parseCompanyFile(text).company);
}

function sandbox(id: 'lesson' | 'interview', key: 'scdf' | 'tea' | 'blank', setup: Op[] = []): void {
  const company = loadSeed(key);
  const ctx: Ctx = { company, visited: new Set(), companies: [], user: { name: 'admin', role: 'Admin' } };
  applyOps(ctx, setup);
  const app = useApp.getState();
  app.openCompany(id, ctx.company);
  useApp.setState({ visited: new Set(), user: { name: 'admin', role: 'Admin' } });
}

const names = () => ['Sylhet Community Development Foundation', 'Tea Garden Women Cooperative', 'Blank NGO'];

export const useLearn = create<LearnState>((set, get) => ({
  progress: loadProgress(),
  active: null,
  interview: null,
  companies: names(),
  coachOpen: true,

  start: (id) => {
    const lesson = lessonById(id);
    if (!lesson) return;
    if (get().interview) return;
    sandbox('lesson', lesson.company, lesson.setup);
    set({ active: { id, step: 0, phase: 'steps', hint: false, keys: false }, companies: names(), coachOpen: true });
    evaluate();
  },
  exit: async () => {
    set({ active: null, interview: null });
    await restoreReal();
  },
  reset: () => {
    const a = get().active;
    if (!a) return;
    const lesson = lessonById(a.id)!;
    sandbox('lesson', lesson.company, lesson.setup);
    set({ active: { id: a.id, step: 0, phase: 'steps', hint: false, keys: false }, companies: names() });
    evaluate();
  },
  toggleLang: () => { const p = { ...get().progress, lang: get().progress.lang === 'en' ? 'bn' as const : 'en' as const }; saveProgress(p); set({ progress: p }); },
  toggleCoach: () => set((s) => ({ coachOpen: !s.coachOpen })),
  showHint: () => set((s) => (s.active ? { active: { ...s.active, hint: !s.active.hint } } : s)),
  showKeys: () => set((s) => (s.active ? { active: { ...s.active, keys: !s.active.keys } } : s)),
  finishQuiz: (correct, total) => {
    const a = get().active;
    if (!a) return;
    const lesson = lessonById(a.id)!;
    const score = lessonScore(correct, total);
    const progress = recordLesson(get().progress, lesson, score);
    saveProgress(progress);
    set({ progress, active: { ...a, phase: score >= UNLOCK_AT * 100 ? 'done' : 'quiz', score } });
  },
  addCompany: (name) => set((s) => ({ companies: [...s.companies, name] })),

  startInterview: (name, v2) => {
    const seed = Date.now() % 100000;
    const tasks = pickTasks(TASKS, TASK_COUNT, seed);
    sandbox('interview', 'scdf', tasks.flatMap((t) => t.setup ?? []));
    const now = Date.now();
    set({ active: null, interview: { v2, name, phase: 'tasks', tasks, done: {}, current: 0, mcq: sample(MCQS, MCQ_COUNT, seed + 7), answers: [], taskDeadline: now + TASK_MINUTES * 60000, mcqDeadline: 0 }, companies: names(), coachOpen: true });
    evaluate();
  },
  nextTask: () => set((s) => (s.interview ? { interview: { ...s.interview, current: (s.interview.current + 1) % s.interview.tasks.length } } : s)),
  finishTasks: () => set((s) => (s.interview?.phase === 'tasks' ? { interview: { ...s.interview, phase: 'mcq', mcqDeadline: Date.now() + MCQ_MINUTES * 60000 } } : s)),
  finishMcq: (answers) => {
    const iv = get().interview;
    if (!iv) return;
    const correct = iv.mcq.filter((q, i) => answers[i] === q.answer).length;
    const taskDone = Object.values(iv.done).filter(Boolean).length;
    const result = scoreInterview(taskDone, iv.tasks.length, correct, iv.mcq.length);
    let progress: Progress = { ...get().progress, interview: [...(get().progress.interview ?? []), { best: result.percent, passed: result.passed, at: new Date().toISOString() }] };
    if (result.passed) { const l = lessonById(iv.v2 ? 'X2' : 'A8'); if (l) progress = recordLesson(progress, l, 100); }
    saveProgress(progress);
    set({ progress, interview: { ...iv, answers, phase: 'result', result } });
  },
  closeInterview: async () => { set({ interview: null }); await restoreReal(); },
}));

/** Re-check lesson steps / interview tasks against the live sandbox. */
export function evaluate(): void {
  const L = useLearn.getState();
  const A = useApp.getState();
  const ctx: Ctx = { company: A.company, visited: A.visited, companies: L.companies, user: A.user };
  if (L.active && L.active.phase === 'steps' && A.companyId === 'lesson') {
    const lesson = lessonById(L.active.id)!;
    let step = L.active.step;
    while (step < lesson.steps.length && evalCheck(lesson.steps[step].check, ctx)) step++;
    if (step !== L.active.step) {
      const finished = step >= lesson.steps.length;
      if (finished && !lesson.quiz?.length) {
        const progress = recordLesson(L.progress, lesson, 100);
        saveProgress(progress);
        useLearn.setState({ progress, active: { ...L.active, step, phase: 'done', hint: false, keys: false, score: 100 } });
      } else useLearn.setState({ active: { ...L.active, step, phase: finished ? 'quiz' : 'steps', hint: false, keys: false } });
    }
  }
  const iv = L.interview;
  if (iv && iv.phase === 'tasks' && A.companyId === 'interview') {
    const done = { ...iv.done };
    let changed = false;
    for (const t of iv.tasks) if (!done[t.id] && evalCheck(t.check, ctx)) { done[t.id] = true; changed = true; }
    if (changed) useLearn.setState({ interview: { ...iv, done } });
  }
}

useApp.subscribe(() => evaluate());
visitListeners.push(() => evaluate());

export const unlocked = (p: Progress, lesson: Lesson): boolean => levelUnlocked(LESSONS, p, lesson.level);
