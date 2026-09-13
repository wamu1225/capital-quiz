import { countries, type Country, type Region } from '../data/countries';

export interface Question {
  country: Country;
  options: string[];
  correctIndex: number;
}

/** 1セットあたりの標準出題数（O-3-17床3＝5問程度・1分以内で終わり、即もう1回に入れる） */
export const ROUND_SIZE = 5;

type RandFn = () => number;

function shuffle<T>(arr: T[], rand: RandFn = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 日付文字列などから決定的な乱数列を作る（デイリーチャレンジ用・mulberry32） */
export function seededRand(seedStr: string): RandFn {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 指定プールから、重複しない誤答3件を選んで4択問題を作る。
 * pool（優先プール）だけで3件そろわない場合のみ、fallbackPool から不足分を補う
 * （地域内候補が3件未満の小地域向け。O-3-16）。
 */
export function makeQuestion(country: Country, pool: Country[], fallbackPool?: Country[], rand: RandFn = Math.random): Question {
  const isValid = (c: Country) => c.id !== country.id && c.capital !== country.capital;
  const primary = shuffle(pool.filter(isValid), rand).slice(0, 3);
  let distractorCountries = primary;
  if (distractorCountries.length < 3 && fallbackPool) {
    const usedIds = new Set([country.id, ...distractorCountries.map((c) => c.id)]);
    const usedCapitals = new Set([country.capital, ...distractorCountries.map((c) => c.capital)]);
    const extra = shuffle(
      fallbackPool.filter((c) => isValid(c) && !usedIds.has(c.id) && !usedCapitals.has(c.capital)),
      rand
    ).slice(0, 3 - distractorCountries.length);
    distractorCountries = distractorCountries.concat(extra);
  }
  const distractors = distractorCountries.map((c) => c.capital);
  const options = shuffle([country.capital, ...distractors], rand);
  const correctIndex = options.indexOf(country.capital);
  return { country, options, correctIndex };
}

/** 地域別クイズ用の出題プール（標準出題対象のみ） */
export function questionsForRegion(region: Region, count: number): Question[] {
  const pool = countries.filter((c) => c.region === region && c.includeInQuiz);
  const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
  // 誤答はまず同地域から選ぶ（同じ首都圏の紛らわしさが中心体験）。
  // 同地域だけで3件そろわない小地域（例：北米は2か国）は全世界プールで不足分を補う。
  const globalPool = countries.filter((c) => c.includeInQuiz);
  return picked.map((c) => makeQuestion(c, pool, globalPool));
}

/** 指定した国IDだけを出題する（復習モード用）。誤答は各国の同地域から優先して選ぶ。
 * 1回はROUND_SIZE問まで＝残りは次回以降の復習に回る（1分以内で終わる床3を復習にも適用）。 */
export function questionsForCountryIds(ids: string[], count = ROUND_SIZE): Question[] {
  const targets = countries.filter((c) => c.includeInQuiz && ids.includes(c.id));
  const globalPool = countries.filter((c) => c.includeInQuiz);
  return shuffle(targets)
    .slice(0, count)
    .map((c) => {
      const regionalPool = countries.filter((o) => o.includeInQuiz && o.region === c.region);
      return makeQuestion(c, regionalPool, globalPool);
    });
}

/** その日の日付（YYYY-MM-DD・端末のローカル日付）をシードに、全世界プールから5問を決定的に出題する */
export function dailyQuestions(dateStr: string, count = 5): Question[] {
  const rand = seededRand(dateStr);
  const globalPool = countries.filter((c) => c.includeInQuiz);
  const picked = shuffle(globalPool, rand).slice(0, count);
  return picked.map((c) => {
    const regionalPool = countries.filter((o) => o.includeInQuiz && o.region === c.region);
    return makeQuestion(c, regionalPool, globalPool, rand);
  });
}

export function todayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 「訳ありの首都」トリビアモード＝specialType付きの国だけを出題。
 * 全件（17か国）を一度に出すと1分では終わらないため、1回はROUND_SIZE問まで
 * ＝残りは次に遊んだときに出る（毎回シャッフルするので何度か遊べば全件に当たる）。 */
export function triviaQuestions(count = ROUND_SIZE): Question[] {
  const pool = countries.filter((c) => c.specialType && c.includeInQuiz);
  const globalPool = countries.filter((c) => c.includeInQuiz);
  return shuffle(pool)
    .slice(0, count)
    .map((c) => makeQuestion(c, globalPool));
}
