import { prng } from '../../engine';
import type { Mcq, Task } from './types';

export const TASK_COUNT = 30;
export const MCQ_COUNT = 50;
export const TASK_MINUTES = 30;
export const MCQ_MINUTES = 25;
export const PASS_PERCENT = 70;

/** Pick `n` distinct items deterministically from `bank` (Fisher-Yates with seeded PRNG). */
export function sample<T>(bank: T[], n: number, seed: number): T[] {
  const r = prng(seed);
  const a = [...bank];
  for (let i = a.length - 1; i > 0; i--) { const j = r.int(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, Math.min(n, a.length));
}

/** Tasks are drawn so every family appears at least once (balanced coverage), then filled randomly. */
export function pickTasks(bank: Task[], n: number, seed: number): Task[] {
  const families = [...new Set(bank.map((t) => t.family))];
  const first = families.map((f) => sample(bank.filter((t) => t.family === f), 1, seed + f.length)[0]);
  const rest = sample(bank.filter((t) => !first.includes(t)), n - first.length, seed);
  return sample([...first, ...rest].slice(0, n), n, seed + 1);
}

export interface InterviewResult { taskScore: number; taskTotal: number; mcqScore: number; mcqTotal: number; percent: number; passed: boolean; grade: string }

export function scoreInterview(taskDone: number, taskTotal: number, mcqCorrect: number, mcqTotal: number): InterviewResult {
  const percent = taskTotal + mcqTotal ? Math.round(((taskDone * 2 + mcqCorrect) / (taskTotal * 2 + mcqTotal)) * 100) : 0;
  const grade = percent >= 90 ? 'Distinction' : percent >= 80 ? 'Merit' : percent >= PASS_PERCENT ? 'Pass' : 'Not yet';
  return { taskScore: taskDone, taskTotal, mcqScore: mcqCorrect, mcqTotal, percent, passed: percent >= PASS_PERCENT, grade };
}

export const shuffleMcq = (bank: Mcq[], n: number, seed: number): Mcq[] => sample(bank, n, seed);
