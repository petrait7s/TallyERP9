import beginner from '../../../content/lessons/beginner.json';
import intermediate from '../../../content/lessons/intermediate.json';
import advanced from '../../../content/lessons/advanced.json';
import core from '../../../content/lessons/core.json';
import ngo from '../../../content/lessons/ngo.json';
import capstone from '../../../content/lessons/capstone.json';
import tasks from '../../../content/bank/tasks.json';
import mcq from '../../../content/bank/mcq.json';
import glossary from '../../../content/bank/glossary.json';
import coverage from '../../../content/coverage.json';
import type { Lesson, Mcq, Task } from './types';

export const LESSONS = [beginner, intermediate, advanced, core, ngo, capstone].flat() as unknown as Lesson[];
export const TASKS = tasks as unknown as Task[];
export const MCQS = mcq as unknown as Mcq[];
export const GLOSSARY = glossary as { term: string; en: string; bn: string }[];
export const COVERAGE = coverage as Record<string, { title: string; screen: string; seed: string; lessons: string[] }>;
export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
