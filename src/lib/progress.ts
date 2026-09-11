import type { Region } from '../data/countries';

const STORAGE_KEY = 'capital-quiz:progress:v1';

export interface RegionBest {
  score: number;
  timeMs: number;
}

interface CountryStat {
  /** これまでに一度でも正解したことがあるか（到達度カウント用） */
  correctEver: boolean;
  /** 直近の解答が誤答だったか（復習モードの対象） */
  needsReview: boolean;
}

interface ProgressData {
  regionBests: Partial<Record<Region, RegionBest>>;
  countryStats: Record<string, CountryStat>;
}

function emptyData(): ProgressData {
  return { regionBests: {}, countryStats: {} };
}

/** localStorage が使えない・壊れた値が入っている場合でも落ちないようにする（O-3-17完了条件7） */
function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    return {
      regionBests: parsed && typeof parsed.regionBests === 'object' ? parsed.regionBests : {},
      countryStats: parsed && typeof parsed.countryStats === 'object' ? parsed.countryStats : {},
    };
  } catch {
    return emptyData();
  }
}

function saveProgress(data: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ストレージが無効・満杯でも進行を止めない
  }
}

export function getRegionBest(region: Region): RegionBest | null {
  return loadProgress().regionBests[region] ?? null;
}

/** 地域クイズの結果を記録し、自己ベストを更新したかを返す */
export function recordRegionResult(region: Region, score: number, timeMs: number): { best: RegionBest; isNewBest: boolean } {
  const data = loadProgress();
  const prev = data.regionBests[region];
  const isNewBest = !prev || score > prev.score || (score === prev.score && timeMs < prev.timeMs);
  const best: RegionBest = isNewBest ? { score, timeMs } : prev;
  data.regionBests[region] = best;
  saveProgress(data);
  return { best, isNewBest };
}

export function recordCountryAnswer(countryId: string, correct: boolean): void {
  const data = loadProgress();
  const prevStat = data.countryStats[countryId];
  data.countryStats[countryId] = {
    correctEver: Boolean(prevStat?.correctEver) || correct,
    needsReview: !correct,
  };
  saveProgress(data);
}

/** これまでに一度でも正解した国の数（「200中いくつ」の分子） */
export function getMasteredCount(): number {
  const data = loadProgress();
  return Object.values(data.countryStats).filter((s) => s.correctEver).length;
}

/** 直近の解答が誤答のままの国IDリスト（復習モードの出題対象） */
export function getReviewCountryIds(): string[] {
  const data = loadProgress();
  return Object.entries(data.countryStats)
    .filter(([, s]) => s.needsReview)
    .map(([id]) => id);
}

export function formatTimeMs(ms: number): string {
  return (ms / 1000).toFixed(1) + '秒';
}
