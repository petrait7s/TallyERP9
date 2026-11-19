import type { Lesson, Level } from './types';

export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced', 'core', 'ngo', 'capstone'];
export const LEVEL_NAME: Record<Level, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', core: 'Core Tally (extended)', ngo: 'NGO management', capstone: 'Capstone' };

export interface LessonProgress { done: boolean; score: number; attempts: number }
export interface Progress {
  lessons: Record<string, LessonProgress>;
  xp: number;
  lang: 'en' | 'bn';
  coach: boolean;
  interview?: { best: number; passed: boolean; at: string }[];
}

export const emptyProgress = (): Progress => ({ lessons: {}, xp: 0, lang: 'en', coach: true });

const KEY = 'tl:progress';
export function loadProgress(): Progress {
  try { const t = localStorage.getItem(KEY); if (t) return { ...emptyProgress(), ...JSON.parse(t) }; } catch { /* no storage */ }
  return emptyProgress();
}
export function saveProgress(p: Progress): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* no storage */ }
}

export const UNLOCK_AT = 0.8;

export function levelCompletion(lessons: Lesson[], p: Progress, level: Level): number {
  const ls = lessons.filter((l) => l.level === level);
  return ls.length ? ls.filter((l) => p.lessons[l.id]?.done).length / ls.length : 1;
}

/** A level unlocks when the previous level is >= 80% complete. */
export function levelUnlocked(lessons: Lesson[], p: Progress, level: Level): boolean {
  const i = LEVELS.indexOf(level);
  return i === 0 || levelCompletion(lessons, p, LEVELS[i - 1]) >= UNLOCK_AT;
}

export const STEP_XP = 10;
export const QUIZ_XP = 20;

/** Lesson score: quiz percent (100 when there is no quiz). */
export function lessonScore(quizCorrect: number, quizTotal: number): number {
  return quizTotal ? Math.round((quizCorrect / quizTotal) * 100) : 100;
}

export function recordLesson(p: Progress, lesson: Lesson, score: number): Progress {
  const prev = p.lessons[lesson.id];
  const done = score >= UNLOCK_AT * 100;
  const firstTime = !prev?.done && done;
  return {
    ...p,
    xp: p.xp + (firstTime ? lesson.steps.length * STEP_XP + (lesson.quiz ? QUIZ_XP : 0) : 0),
    lessons: { ...p.lessons, [lesson.id]: { done: done || !!prev?.done, score: Math.max(score, prev?.score ?? 0), attempts: (prev?.attempts ?? 0) + 1 } },
  };
}
