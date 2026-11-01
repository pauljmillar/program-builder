import fs from "node:fs";
import path from "node:path";

const contentDir = path.join(process.cwd(), "content");

export function readContentFile(name: string): string {
  return fs.readFileSync(path.join(contentDir, name), "utf8");
}

export function readMdx(name: string): string {
  return readContentFile(name).trim();
}

export function readJson<T>(name: string): T {
  return JSON.parse(readContentFile(name)) as T;
}

export interface BuildLogTimelineEntry {
  date: string;
  hours: number;
  phase: string;
  shipped: string;
  tools: string[];
}

export interface BuildLogFailure {
  title: string;
  whatHappened: string;
  howCaught: string;
  fix: string;
  commit: string;
  lesson: string;
}

export interface BuildLog {
  summary: {
    totalHours: number;
    calendarDays: number;
    aiCodeKeptPct: number;
    modelSpendUsd: { ideation: number; build: number; evals: number; liveDemo: number };
    tokens: { input: number; output: number; cacheRead: number };
  };
  timeline: BuildLogTimelineEntry[];
  tools: { tool: string; usedFor: string }[];
  failures: BuildLogFailure[];
  keptVsRewritten: { keptPct: number; rewrittenAreas: string[] };
  cost: {
    ideation: string;
    build: string;
    evals: string;
    liveDemoToDate: string;
    hosting: string;
  };
  beforeProduction: string[];
}

export function getBuildLog(): BuildLog {
  return readJson<BuildLog>("build-log.json");
}

export interface AboutStat {
  value: string;
  label: string;
}

export function getAboutStats(): AboutStat[] {
  return readJson<AboutStat[]>("about-stats.json");
}
