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

/** 指定プールから、重複しない誤答3件を選んで4択問題を作る */
export function makeQuestion(country: Country, pool: Country[]): Question {
  const distractorPool = pool.filter((c) => c.id !== country.id && c.capital !== country.capital);
  const distractors = shuffle(distractorPool)
    .slice(0, 3)
    .map((c) => c.capital);
  const options = shuffle([country.capital, ...distractors]);
  const correctIndex = options.indexOf(country.capital);
  return { country, options, correctIndex };
}

/** 地域別クイズ用の出題プール（標準出題対象のみ） */
export function questionsForRegion(region: Region, count: number): Question[] {
  const pool = countries.filter((c) => c.region === region && c.includeInQuiz);
  const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
  // 誤答の選択肢は地域内に限らず全世界プールから（地域内だけだと同地域の似た首都ばかりで
  // 選択肢が枯渇する小地域があるため）
  const globalPool = countries.filter((c) => c.includeInQuiz);
  return picked.map((c) => makeQuestion(c, globalPool));
}

/** 「訳ありの首都」トリビアモード＝specialType付きの国だけを出題 */
export function triviaQuestions(): Question[] {
  const pool = countries.filter((c) => c.specialType && c.includeInQuiz);
  const globalPool = countries.filter((c) => c.includeInQuiz);
  return shuffle(pool).map((c) => makeQuestion(c, globalPool));
}
