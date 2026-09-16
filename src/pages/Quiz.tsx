import { useMemo, useRef, useState } from 'react';
import type { Question } from '../lib/quiz';
import type { Region } from '../data/countries';
import { GEO } from '../data/geo';
import { triviaExplanations } from '../data/trivia';
import { href } from '../lib/router';
import {
  formatTimeMs,
  getRegionBest,
  getReviewCountryIds,
  recordCountryAnswer,
  recordDailyCompletion,
  recordRegionResult,
  type RegionBest,
} from '../lib/progress';
import WorldMapDot from '../components/WorldMapDot';
import WorldMapMulti from '../components/WorldMapMulti';
import Flag from '../components/Flag';

interface QuizProps {
  title: string;
  backHref: string;
  backLabel: string;
  buildQuestions: () => Question[];
  /** trivia モードでは正誤に関わらず解説を出す */
  showExplanationAlways?: boolean;
  /** 指定すると自己ベストの記録・表示を行う（地域別クイズ用。復習・トリビアでは未指定） */
  region?: Region;
  /** デイリーチャレンジの完了記録・連続日数表示を行う */
  isDaily?: string;
}

export default function Quiz({ title, backHref, backLabel, buildQuestions, showExplanationAlways, region, isDaily }: QuizProps) {
  const questions = useMemo(buildQuestions, [buildQuestions]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [missed, setMissed] = useState<Question[]>([]);
  const [played, setPlayed] = useState<{ q: Question; correct: boolean }[]>([]);
  const prevBest = useMemo<RegionBest | null>(() => (region ? getRegionBest(region) : null), [region]);
  const startRef = useRef(Date.now());
  const recordedRef = useRef(false);
  const [result, setResult] = useState<{ best: RegionBest; isNewBest: boolean } | null>(null);
  const [dailyStreak, setDailyStreak] = useState<number | null>(null);

  if (questions.length === 0) {
    return (
      <>
        <h1 className="content-h1">{title}</h1>
        <p className="content-p">出題できる問題がありませんでした。</p>
        <a className="btn-secondary" href={href(backHref)} style={{ display: 'inline-block', padding: '10px 20px' }}>
          {backLabel}
        </a>
      </>
    );
  }

  function reset() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setMissed([]);
    setPlayed([]);
    startRef.current = Date.now();
    recordedRef.current = false;
    setResult(null);
  }

  if (index >= questions.length) {
    if (!recordedRef.current) {
      recordedRef.current = true;
      if (region) {
        const timeMs = Date.now() - startRef.current;
        setResult(recordRegionResult(region, score, timeMs));
      }
      if (isDaily) {
        setDailyStreak(recordDailyCompletion(isDaily).streakDays);
      }
    }
    return (
      <div className="quiz-result">
        <h1 className="content-h1">{title}</h1>
        <p className="quiz-result__score">
          {score} / {questions.length} 問正解
        </p>
        {bestStreak > 1 && <p className="quiz-result__streak">最大連続正解：{bestStreak}問</p>}
        {dailyStreak !== null && <p className="quiz-result__best quiz-result__best--new">デイリーチャレンジ連続{dailyStreak}日目</p>}
        {result &&
          (score === 0 ? (
            <p className="quiz-result__best">次はきっと分かる。もう一度いってみよう</p>
          ) : (
            <p className={result.isNewBest ? 'quiz-result__best quiz-result__best--new' : 'quiz-result__best'}>
              {result.isNewBest
                ? `自己ベスト更新！（${result.best.score}問・${formatTimeMs(result.best.timeMs)}）`
                : `自己ベスト：${result.best.score}問・${formatTimeMs(result.best.timeMs)}`}
            </p>
          ))}
        {played.length > 0 && (
          <div className="quiz-result__missed">
            <div className="quiz-result__missed-label">今回めぐった国</div>
            <WorldMapMulti
              points={played
                .map((p) => {
                  const g = GEO[p.q.country.id];
                  return g ? { ...g, correct: p.correct } : null;
                })
                .filter((g): g is NonNullable<typeof g> => Boolean(g))}
              label="今回めぐった国"
            />
            <p className="quiz-result__map-legend">緑＝正解した国／赤＝間違えた国</p>
          </div>
        )}
        {missed.length > 0 && (
          <div className="quiz-result__missed">
            <div className="quiz-result__missed-label">間違えた国</div>
            <ul className="quiz-result__missed-list">
              {missed.map((m) => (
                <li key={m.country.id}>
                  <a href={href(`/countries/${m.country.id}/`)}>
                    <Flag className="quiz-result__missed-flag" iso2={GEO[m.country.id]?.iso2} />
                    <span>{m.country.commonName}</span>
                    <span className="quiz-result__missed-capital">{m.country.capital}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="quiz-result__actions">
          <button className="btn-primary" onClick={reset}>
            もう一度
          </button>
          <a className="btn-secondary" href={href(backHref)}>
            {backLabel}
          </a>
          {getReviewCountryIds().length > 0 && (
            <a className="btn-secondary" href={href('/review/')}>
              間違えた国を復習する
            </a>
          )}
        </div>
      </div>
    );
  }

  const q = questions[index];
  const answered = selected !== null;
  const isCorrect = selected === q.correctIndex;
  const explanation = triviaExplanations[q.country.id];
  const geo = GEO[q.country.id];

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    const correct = i === q.correctIndex;
    recordCountryAnswer(q.country.id, q.kind, correct);
    setPlayed((p) => [...p, { q, correct }]);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
      setMissed((m) => [...m, q]);
    }
  }

  function next() {
    setSelected(null);
    setIndex((i) => i + 1);
  }

  return (
    <>
      <div className="quiz-header">
        <a href={href(backHref)}>← {backLabel}</a>
        <div className="quiz-stats">
          <span className="quiz-stat">
            <span className="quiz-stat__label">問題</span>
            <span className="quiz-stat__value">
              {index + 1}/{questions.length}
            </span>
          </span>
          <span className="quiz-stat">
            <span className="quiz-stat__label">スコア</span>
            <span className="quiz-stat__value">{score}</span>
          </span>
          <span className="quiz-stat">
            <span className="quiz-stat__label">連続正解</span>
            <span className="quiz-stat__value">{streak}</span>
          </span>
        </div>
      </div>
      {prevBest && index === 0 && !answered && (
        <p className="quiz-prev-best">
          自己ベスト：{prevBest.score}/{questions.length}問（{formatTimeMs(prevBest.timeMs)}）
        </p>
      )}
      <div className="quiz-question">
        {q.kind === 'capital' && (
          <>
            <div className="quiz-question__label">この国の首都は？</div>
            <div className="quiz-question__country">
              <Flag className="quiz-question__flag" iso2={geo?.iso2} />
              {q.country.commonName}
            </div>
          </>
        )}
        {q.kind === 'flag' && (
          <>
            <div className="quiz-question__label">この国旗の国は？</div>
            <Flag className="quiz-question__flag quiz-question__flag--big" iso2={geo?.iso2} />
          </>
        )}
        {q.kind === 'map' && (
          <>
            <div className="quiz-question__label">この位置にある国は？</div>
            {geo && (
              <div className="quiz-reveal-map">
                <WorldMapDot lat={geo.lat} lng={geo.lng} />
              </div>
            )}
          </>
        )}
      </div>
      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = 'quiz-option';
          const isCorrectOption = answered && i === q.correctIndex;
          const isWrongOption = answered && i === selected && i !== q.correctIndex;
          if (isCorrectOption) cls += ' quiz-option--correct';
          else if (isWrongOption) cls += ' quiz-option--wrong';
          return (
            <button key={opt} className={cls} onClick={() => choose(i)} disabled={answered}>
              <span className="quiz-option__label">{opt}</span>
              {isCorrectOption && <span className="quiz-option__mark quiz-option__mark--correct">○ 正解</span>}
              {isWrongOption && <span className="quiz-option__mark quiz-option__mark--wrong">× 不正解</span>}
            </button>
          );
        })}
      </div>
      {answered && geo && q.kind !== 'map' && (
        <div className="quiz-reveal-map">
          <WorldMapDot lat={geo.lat} lng={geo.lng} label={q.country.commonName} />
        </div>
      )}
      {answered && (showExplanationAlways || (explanation && true)) && explanation && (
        <div className="quiz-explanation">
          <div className="quiz-explanation__label">{isCorrect ? '正解 ／ 訳あり解説' : '訳あり解説'}</div>
          {explanation}
        </div>
      )}
      {answered && (
        <>
          <p className="quiz-country-link">
            {q.kind === 'map' && <Flag className="quiz-question__flag" iso2={geo?.iso2} />}
            <a href={href(`/countries/${q.country.id}/`)}>{q.country.commonName}のページを見る →</a>
          </p>
          <button className="quiz-next" onClick={next}>
            {index + 1 < questions.length ? '次の問題へ' : '結果を見る'}
          </button>
        </>
      )}
    </>
  );
}
