import { countries, REGION_LABELS, type Region } from '../data/countries';

const STORAGE_KEY = 'capital-quiz:progress:v1';

export type QuizKind = 'capital' | 'flag' | 'map';

export interface RegionBest {
  score: number;
  timeMs: number;
}

interface CountryStat {
  /** 首都当てで一度でも正解したことがあるか（到達度カウント・旧schemaのcorrectEverと同じ意味） */
  capital?: boolean;
  /** 国旗当てで一度でも正解したことがあるか */
  flag?: boolean;
  /** 位置当てで一度でも正解したことがあるか */
  map?: boolean;
  /** @deprecated 旧schema。読み込み時にcapitalへ移行する */
  correctEver?: boolean;
  /** 直近の解答（いずれかの出題形式）が誤答だったか（復習モードの対象） */
  needsReview: boolean;
}

interface DailyInfo {
  /** 最後にデイリーチャレンジを完了した日（YYYY-MM-DD） */
  lastCompletedDate: string | null;
  /** 連続で完了した日数 */
  streakDays: number;
}

interface ProgressData {
  regionBests: Partial<Record<Region, RegionBest>>;
  countryStats: Record<string, CountryStat>;
  daily: DailyInfo;
  /** タイムアタックの自己ベスト（60秒での正解数） */
  timeAttackBest: number;
}

function emptyData(): ProgressData {
  return { regionBests: {}, countryStats: {}, daily: { lastCompletedDate: null, streakDays: 0 }, timeAttackBest: 0 };
}

/** localStorage が使えない・壊れた値が入っている場合でも落ちないようにする（O-3-17完了条件7） */
function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    const rawStats = parsed && typeof parsed.countryStats === 'object' ? parsed.countryStats : {};
    const countryStats: Record<string, CountryStat> = {};
    for (const [id, s] of Object.entries(rawStats as Record<string, CountryStat>)) {
      if (!s || typeof s !== 'object') continue;
      countryStats[id] = {
        // 旧schema（O-3-17）はcorrectEverしか持たない＝首都当てのことなのでcapitalへ移行する
        capital: typeof s.capital === 'boolean' ? s.capital : Boolean(s.correctEver),
        flag: Boolean(s.flag),
        map: Boolean(s.map),
        needsReview: Boolean(s.needsReview),
      };
    }
    return {
      regionBests: parsed && typeof parsed.regionBests === 'object' ? parsed.regionBests : {},
      countryStats,
      daily:
        parsed && typeof parsed.daily === 'object' && parsed.daily
          ? { lastCompletedDate: parsed.daily.lastCompletedDate ?? null, streakDays: Number(parsed.daily.streakDays) || 0 }
          : { lastCompletedDate: null, streakDays: 0 },
      timeAttackBest: Number(parsed?.timeAttackBest) || 0,
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

/** 地域クイズの結果を記録し、自己ベストを更新したかを返す。
 * isFirstPlay＝この地域を初めて遊んだ場合。比較対象が無いので「更新」ではなく通常表示にする
 * （初回でも必ず「自己ベスト更新！」と出ていた見た目の違和感＝O-3-24差し戻し・監督所見への対応）。 */
export function recordRegionResult(
  region: Region,
  score: number,
  timeMs: number
): { best: RegionBest; isNewBest: boolean; isFirstPlay: boolean } {
  const data = loadProgress();
  const prev = data.regionBests[region];
  const isFirstPlay = !prev;
  const isNewBest = isFirstPlay || score > prev.score || (score === prev.score && timeMs < prev.timeMs);
  const best: RegionBest = isNewBest ? { score, timeMs } : prev;
  data.regionBests[region] = best;
  saveProgress(data);
  return { best, isNewBest, isFirstPlay };
}

export function recordCountryAnswer(countryId: string, kind: QuizKind, correct: boolean): void {
  const data = loadProgress();
  const prevStat = data.countryStats[countryId];
  data.countryStats[countryId] = {
    capital: Boolean(prevStat?.capital) || (kind === 'capital' && correct),
    flag: Boolean(prevStat?.flag) || (kind === 'flag' && correct),
    map: Boolean(prevStat?.map) || (kind === 'map' && correct),
    needsReview: !correct,
  };
  saveProgress(data);
}

/** これまでに一度でも首都当てに正解した国の数（「200中いくつ」の分子。旧O-3-17の到達度と同じ定義） */
export function getMasteredCount(): number {
  const data = loadProgress();
  return Object.values(data.countryStats).filter((s) => s.capital).length;
}

export interface RegionMastery {
  region: Region;
  label: string;
  mastered: number;
  total: number;
}

/** 地域ごとの制覇率（首都到達度）を一括で返す。地域選択・結果画面の両方で使う（O-3-20差し戻し分・O-3-24第3段）。 */
export function getAllRegionMastery(): RegionMastery[] {
  const data = loadProgress();
  const regions = Array.from(new Set(countries.map((c) => c.region)));
  return regions.map((region) => {
    const regionCountries = countries.filter((c) => c.region === region && c.includeInQuiz);
    const mastered = regionCountries.filter((c) => data.countryStats[c.id]?.capital).length;
    return { region, label: REGION_LABELS[region], mastered, total: regionCountries.length };
  });
}

/** 直近の解答が誤答のままの国IDリスト（復習モードの出題対象） */
export function getReviewCountryIds(): string[] {
  const data = loadProgress();
  return Object.entries(data.countryStats)
    .filter(([, s]) => s.needsReview)
    .map(([id]) => id);
}

/** 指定した出題形式で一度でも正解した国IDの集合（未出題を優先する出題づくりに使う） */
export function getKindCorrectIds(kind: QuizKind): Set<string> {
  const data = loadProgress();
  const out = new Set<string>();
  for (const [id, s] of Object.entries(data.countryStats)) {
    if (s[kind]) out.add(id);
  }
  return out;
}

export interface CountryMastery {
  capital: boolean;
  flag: boolean;
  map: boolean;
}

/** 国別ページの「首都◯／旗◯／位置◯」表示に使う */
export function getCountryMastery(countryId: string): CountryMastery {
  const s = loadProgress().countryStats[countryId];
  return { capital: Boolean(s?.capital), flag: Boolean(s?.flag), map: Boolean(s?.map) };
}

export function isFullyMastered(countryId: string): boolean {
  const m = getCountryMastery(countryId);
  return m.capital && m.flag && m.map;
}

export function getTimeAttackBest(): number {
  return loadProgress().timeAttackBest;
}

/** タイムアタックのスコアを記録し、自己ベストを更新したかを返す */
export function reportTimeAttackScore(score: number): { best: number; isNewBest: boolean } {
  const data = loadProgress();
  const isNewBest = score > data.timeAttackBest;
  if (isNewBest) {
    data.timeAttackBest = score;
    saveProgress(data);
  }
  return { best: isNewBest ? score : data.timeAttackBest, isNewBest };
}

export function formatTimeMs(ms: number): string {
  return (ms / 1000).toFixed(1) + '秒';
}

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function getDailyStatus(today: string): { completedToday: boolean; streakDays: number } {
  const data = loadProgress();
  return { completedToday: data.daily.lastCompletedDate === today, streakDays: data.daily.streakDays };
}

/** デイリーチャレンジ完了を記録し、連続日数を更新する（同じ日に複数回呼んでも二重加算しない） */
export function recordDailyCompletion(today: string): { streakDays: number } {
  const data = loadProgress();
  if (data.daily.lastCompletedDate === today) return { streakDays: data.daily.streakDays };
  const wasYesterday = data.daily.lastCompletedDate === addDaysStr(today, -1);
  data.daily = { lastCompletedDate: today, streakDays: wasYesterday ? data.daily.streakDays + 1 : 1 };
  saveProgress(data);
  return { streakDays: data.daily.streakDays };
}
