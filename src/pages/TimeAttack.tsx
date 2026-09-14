import { useEffect, useMemo, useRef, useState } from 'react';
import { countries, type Country } from '../data/countries';
import { GEO } from '../data/geo';
import { makeQuestion, type Question } from '../lib/quiz';
import { recordCountryAnswer, reportTimeAttackScore, getTimeAttackBest } from '../lib/progress';
import { href } from '../lib/router';
import Flag from '../components/Flag';

const DURATION_MS = 60_000;
/** 間違えた国は何問おいて再出題するか（同一セッションで連続して出さないため） */
const COOLDOWN = 4;
/** 直近何問はまったく繰り返さないか */
const RECENT_WINDOW = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** タイムアタック＝60秒でどれだけ首都当てに正解できるか（O-3-20のC＝挑戦の緊張）。
 * 間違えた国は数問おいて再出題し、直近5問は繰り返さない（O-3-20のD）。 */
export default function TimeAttack() {
  const pool = useMemo(() => countries.filter((c) => c.includeInQuiz), []);
  const queueRef = useRef<Country[]>([]);
  const recentRef = useRef<string[]>([]);
  const pendingRef = useRef<{ id: string; dueAt: number }[]>([]);
  const askedCountRef = useRef(0);
  const endAtRef = useRef(0);
  const answeringRef = useRef(false);

  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [msLeft, setMsLeft] = useState(DURATION_MS);
  const [result, setResult] = useState<{ best: number; isNewBest: boolean } | null>(null);
  const best = useMemo(() => getTimeAttackBest(), [phase]);

  function pickNext(): Country {
    const asked = askedCountRef.current;
    const dueIdx = pendingRef.current.findIndex((p) => p.dueAt <= asked && !recentRef.current.includes(p.id));
    if (dueIdx >= 0) {
      const { id } = pendingRef.current.splice(dueIdx, 1)[0];
      const found = pool.find((c) => c.id === id);
      if (found) return found;
    }
    if (queueRef.current.length === 0) queueRef.current = shuffle(pool);
    for (let tries = 0; tries < queueRef.current.length; tries++) {
      const c = queueRef.current.shift()!;
      if (!recentRef.current.includes(c.id)) return c;
      queueRef.current.push(c);
    }
    return queueRef.current.shift() ?? pool[0];
  }

  function askNext() {
    const country = pickNext();
    askedCountRef.current += 1;
    recentRef.current = [...recentRef.current, country.id].slice(-RECENT_WINDOW);
    const regionalPool = pool.filter((c) => c.region === country.region);
    setQuestion(makeQuestion(country, regionalPool, pool));
    setSelected(null);
  }

  function start() {
    queueRef.current = shuffle(pool);
    recentRef.current = [];
    pendingRef.current = [];
    askedCountRef.current = 0;
    setScore(0);
    setResult(null);
    endAtRef.current = Date.now() + DURATION_MS;
    setMsLeft(DURATION_MS);
    setPhase('playing');
    askNext();
  }

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = window.setInterval(() => {
      const left = endAtRef.current - Date.now();
      if (left <= 0) {
        window.clearInterval(id);
        setMsLeft(0);
        setPhase('done');
      } else {
        setMsLeft(left);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') {
      setResult(reportTimeAttackScore(score));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function choose(i: number) {
    if (!question || answeringRef.current || phase !== 'playing') return;
    answeringRef.current = true;
    setSelected(i);
    const correct = i === question.correctIndex;
    recordCountryAnswer(question.country.id, 'capital', correct);
    if (correct) {
      setScore((s) => s + 1);
    } else {
      pendingRef.current.push({ id: question.country.id, dueAt: askedCountRef.current + COOLDOWN });
    }
    window.setTimeout(() => {
      answeringRef.current = false;
      if (endAtRef.current - Date.now() > 0) {
        askNext();
      } else {
        setPhase('done');
      }
    }, 550);
  }

  if (phase === 'ready') {
    return (
      <div className="quiz-result">
        <h1 className="content-h1">タイムアタック</h1>
        <p className="content-p">60秒で何問、首都当てに正解できるか。間違えた国は少し間を置いてまた出題されます。</p>
        {best > 0 && <p className="quiz-result__best">自己ベスト：{best}問</p>}
        <div className="quiz-result__actions">
          <button className="btn-primary" onClick={start}>
            スタート
          </button>
          <a className="btn-secondary" href={href('/')}>
            トップに戻る
          </a>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="quiz-result">
        <h1 className="content-h1">タイムアタック結果</h1>
        <p className="quiz-result__score">{score} 問正解</p>
        {result &&
          (result.isNewBest ? (
            <p className="quiz-result__best quiz-result__best--new">自己ベスト更新！（{result.best}問）</p>
          ) : (
            <p className="quiz-result__best">自己ベスト：{result.best}問</p>
          ))}
        <div className="quiz-result__actions">
          <button className="btn-primary" onClick={start}>
            もう一度
          </button>
          <a className="btn-secondary" href={href('/')}>
            トップに戻る
          </a>
        </div>
      </div>
    );
  }

  if (!question) return null;
  const geo = GEO[question.country.id];
  const answered = selected !== null;

  return (
    <>
      <div className="quiz-header">
        <span className="timeattack-clock">残り {Math.ceil(msLeft / 1000)}秒</span>
        <div className="quiz-stats">
          <span className="quiz-stat">
            <span className="quiz-stat__label">スコア</span>
            <span className="quiz-stat__value">{score}</span>
          </span>
        </div>
      </div>
      <div className="quiz-question">
        <div className="quiz-question__label">この国の首都は？</div>
        <div className="quiz-question__country">
          <Flag className="quiz-question__flag" iso2={geo?.iso2} />
          {question.country.commonName}
        </div>
      </div>
      <div className="quiz-options">
        {question.options.map((opt, i) => {
          let cls = 'quiz-option';
          const isCorrectOption = answered && i === question.correctIndex;
          const isWrongOption = answered && i === selected && i !== question.correctIndex;
          if (isCorrectOption) cls += ' quiz-option--correct';
          else if (isWrongOption) cls += ' quiz-option--wrong';
          return (
            <button key={opt} className={cls} onClick={() => choose(i)} disabled={answered}>
              <span className="quiz-option__label">{opt}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
