import { countries, type Country, type Region } from '../data/countries';

export interface Question {
  country: Country;
  options: string[];
  correctIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 指定プールから、重複しない誤答3件を選んで4択問題を作る。
 * pool（優先プール）だけで3件そろわない場合のみ、fallbackPool から不足分を補う
 * （地域内候補が3件未満の小地域向け。O-3-16）。
 */
export function makeQuestion(country: Country, pool: Country[], fallbackPool?: Country[]): Question {
  const isValid = (c: Country) => c.id !== country.id && c.capital !== country.capital;
  const primary = shuffle(pool.filter(isValid)).slice(0, 3);
  let distractorCountries = primary;
  if (distractorCountries.length < 3 && fallbackPool) {
    const usedIds = new Set([country.id, ...distractorCountries.map((c) => c.id)]);
    const usedCapitals = new Set([country.capital, ...distractorCountries.map((c) => c.capital)]);
    const extra = shuffle(
      fallbackPool.filter((c) => isValid(c) && !usedIds.has(c.id) && !usedCapitals.has(c.capital))
    ).slice(0, 3 - distractorCountries.length);
    distractorCountries = distractorCountries.concat(extra);
  }
  const distractors = distractorCountries.map((c) => c.capital);
  const options = shuffle([country.capital, ...distractors]);
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

/** 指定した国IDだけを出題する（復習モード用）。誤答は各国の同地域から優先して選ぶ */
export function questionsForCountryIds(ids: string[]): Question[] {
  const targets = countries.filter((c) => c.includeInQuiz && ids.includes(c.id));
  const globalPool = countries.filter((c) => c.includeInQuiz);
  return shuffle(targets).map((c) => {
    const regionalPool = countries.filter((o) => o.includeInQuiz && o.region === c.region);
    return makeQuestion(c, regionalPool, globalPool);
  });
}

/** 「訳ありの首都」トリビアモード＝specialType付きの国だけを出題 */
export function triviaQuestions(): Question[] {
  const pool = countries.filter((c) => c.specialType && c.includeInQuiz);
  const globalPool = countries.filter((c) => c.includeInQuiz);
  return shuffle(pool).map((c) => makeQuestion(c, globalPool));
}
