import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evalCheck } from '../src/ui/learn/check';
import { COVERAGE, GLOSSARY, LESSONS, MCQS, TASKS } from '../src/ui/learn/content';
import { certificateHtml } from '../src/ui/learn/certificate';
import { pickTasks, sample, scoreInterview, MCQ_COUNT, TASK_COUNT } from '../src/ui/learn/interview';
import { applyOps, type Ctx } from '../src/ui/learn/ops';
import { emptyProgress, levelCompletion, levelUnlocked, lessonScore, recordLesson, LEVELS } from '../src/ui/learn/progress';
import { loadSeed } from '../src/ui/seeds';
import type { Check, Op } from '../src/ui/learn/types';

const ctxFor = (key: 'scdf' | 'tea' | 'blank'): Ctx => ({ company: loadSeed(key), visited: new Set(), companies: ['Sylhet Community Development Foundation', 'Tea Garden Women Cooperative', 'Blank NGO'], user: { name: 'admin', role: 'Admin' } });

describe('lessons', () => {
  it('has the full curriculum', () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'X1', 'X2', 'E1'])
      expect(ids, id).toContain(id);
    for (let n = 1; n <= 18; n++) expect(ids, `N${n}`).toContain(`N${n}`);
    expect(LESSONS.length).toBeGreaterThanOrEqual(51);
  });

  it.each(LESSONS.map((l) => [l.id, l] as const))('%s: every step fails before and passes after the solution', (_id, lesson) => {
    const ctx = ctxFor(lesson.company);
    applyOps(ctx, lesson.setup as Op[]);
    expect(lesson.steps.length).toBeGreaterThan(0);
    lesson.steps.forEach((s, i) => expect(evalCheck(s.check as Check, ctx), `step ${i + 1} must not pass at the start`).toBe(false));
    applyOps(ctx, lesson.solution as Op[]);
    lesson.steps.forEach((s, i) => expect(evalCheck(s.check as Check, ctx), `step ${i + 1}: ${s.instruction.en}`).toBe(true));
    for (const st of lesson.steps) { expect(st.instruction.en.length).toBeGreaterThan(5); expect(st.instruction.bn.length).toBeGreaterThan(2); expect(st.hint?.bn).toBeTruthy(); }
    expect(lesson.title.bn).toBeTruthy();
    for (const q of lesson.quiz ?? []) { expect(q.options.length).toBeGreaterThanOrEqual(2); expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.answer).toBeLessThan(q.options.length); }
  });

  it('seed books still balance after every lesson solution', () => {
    for (const l of LESSONS.filter((x) => x.company === 'scdf').slice(0, 12)) {
      const ctx = ctxFor('scdf');
      applyOps(ctx, l.setup as Op[]); applyOps(ctx, l.solution as Op[]);
      expect(evalCheck({ t: 'metric', name: 'tbBalanced' }, ctx), l.id).toBe(true);
    }
  });
});

describe('coverage', () => {
  it('every catalog item A1-A12 and B1-B18 has a lesson that exists; docs/COVERAGE.md lists them', () => {
    const ids = new Set(LESSONS.map((l) => l.id));
    const md = readFileSync('docs/COVERAGE.md', 'utf8');
    for (const k of [...Array.from({ length: 12 }, (_, i) => `A${i + 1}`), ...Array.from({ length: 18 }, (_, i) => `B${i + 1}`)]) {
      const c = COVERAGE[k];
      expect(c, k).toBeTruthy();
      expect(c.lessons.length, `${k} needs a lesson`).toBeGreaterThan(0);
      for (const l of c.lessons) expect(ids.has(l), `${k} -> ${l}`).toBe(true);
      expect(md, `docs/COVERAGE.md mentions ${k}`).toContain(`| ${k} |`);
    }
  });
});

describe('task bank and MCQ bank', () => {
  it('has 100+ tasks in many families and 50+ MCQs', () => {
    expect(TASKS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(TASKS.map((t) => t.family)).size).toBeGreaterThanOrEqual(18);
    expect(MCQS.length).toBeGreaterThanOrEqual(50);
    expect(GLOSSARY.length).toBeGreaterThan(25);
    for (const q of MCQS) { expect(q.options.length).toBe(4); expect(q.answer).toBeLessThan(4); expect(new Set(q.options).size).toBe(4); }
  });
  it.each(TASKS.map((t) => [t.id, t] as const))('%s completable on the SCDF seed', (_id, t) => {
    const ctx = ctxFor('scdf');
    applyOps(ctx, t.setup as Op[]);
    expect(evalCheck(t.check as Check, ctx), 'must not pass at the start').toBe(false);
    applyOps(ctx, t.solution as Op[]);
    expect(evalCheck(t.check as Check, ctx), t.text.en).toBe(true);
  });
  it('all tasks can be solved together without conflicts', () => {
    const ctx = ctxFor('scdf');
    for (const t of TASKS) applyOps(ctx, t.setup as Op[]);
    for (const t of TASKS) applyOps(ctx, t.solution as Op[]);
    expect(TASKS.every((t) => evalCheck(t.check as Check, ctx))).toBe(true);
    expect(evalCheck({ t: 'metric', name: 'tbBalanced' }, ctx)).toBe(true);
  });
});

describe('interview, progress, certificate', () => {
  it('sampling is deterministic, distinct and covers every family', () => {
    const a = pickTasks(TASKS, TASK_COUNT, 42), b = pickTasks(TASKS, TASK_COUNT, 42), c = pickTasks(TASKS, TASK_COUNT, 43);
    expect(a.map((t) => t.id)).toEqual(b.map((t) => t.id));
    expect(a.map((t) => t.id)).not.toEqual(c.map((t) => t.id));
    expect(new Set(a.map((t) => t.id)).size).toBe(TASK_COUNT);
    expect(new Set(a.map((t) => t.family)).size).toBe(new Set(TASKS.map((t) => t.family)).size);
    expect(sample(MCQS, MCQ_COUNT, 1)).toHaveLength(MCQ_COUNT);
  });
  it('scoring and grade', () => {
    expect(scoreInterview(30, 30, 50, 50)).toMatchObject({ percent: 100, passed: true, grade: 'Distinction' });
    expect(scoreInterview(0, 30, 0, 50)).toMatchObject({ percent: 0, passed: false, grade: 'Not yet' });
    expect(scoreInterview(21, 30, 35, 50).passed).toBe(true);
  });
  it('level gating unlocks at 80% and xp is only awarded once', () => {
    let p = emptyProgress();
    const beg = LESSONS.filter((l) => l.level === 'beginner');
    expect(levelUnlocked(LESSONS, p, 'beginner')).toBe(true);
    expect(levelUnlocked(LESSONS, p, 'intermediate')).toBe(false);
    for (const l of beg.slice(0, 5)) p = recordLesson(p, l, 100);
    expect(levelCompletion(LESSONS, p, 'beginner')).toBeCloseTo(5 / 7);
    expect(levelUnlocked(LESSONS, p, 'intermediate')).toBe(false);
    p = recordLesson(p, beg[5], 100);
    expect(levelUnlocked(LESSONS, p, 'intermediate')).toBe(true);
    const xp = p.xp;
    p = recordLesson(p, beg[0], 100);
    expect(p.xp).toBe(xp);
    p = recordLesson(p, beg[6], 60);
    expect(p.lessons[beg[6].id].done).toBe(false);
    expect(lessonScore(3, 4)).toBe(75);
    expect(lessonScore(0, 0)).toBe(100);
    expect(LEVELS).toHaveLength(6);
  });
  it('certificate html escapes the name', () => {
    const html = certificateHtml('A <b> Learner', scoreInterview(30, 30, 50, 50), '2026-11-19');
    expect(html).toContain('A &lt;b&gt; Learner');
    expect(html).toContain('Distinction');
  });
});
