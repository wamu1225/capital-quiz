import { useMemo, useState } from 'react';
import type { Question } from '../lib/quiz';
import { triviaExplanations } from '../data/trivia';
import { href } from '../lib/router';

interface QuizProps {
  title: string;
  backHref: string;
  backLabel: string;
  buildQuestions: () => Question[];
  /** trivia モードでは正誤に関わらず解説を出す */
  showExplanationAlways?: boolean;
}

export default function Quiz({ title, backHref, backLabel, buildQuestions, showExplanationAlways }: QuizProps) {
  const questions = useMemo(buildQuestions, [buildQuestions]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

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

  if (index >= questions.length) {
    return (
      <div className="quiz-result">
        <h1 className="content-h1">{title}</h1>
        <p className="quiz-result__score">
          {score} / {questions.length} 問正解
        </p>
        <div className="quiz-result__actions">
          <button
            className="btn-primary"
            onClick={() => {
              setIndex(0);
              setSelected(null);
              setScore(0);
            }}
          >
            もう一度
          </button>
          <a className="btn-secondary" href={href(backHref)}>
            {backLabel}
          </a>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const answered = selected !== null;
  const isCorrect = selected === q.correctIndex;
  const explanation = triviaExplanations[q.country.id];

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  }

  function next() {
    setSelected(null);
    setIndex((i) => i + 1);
  }

  return (
    <>
      <div className="quiz-header">
        <a href={href(backHref)}>← {backLabel}</a>
        <span className="quiz-progress">
          {index + 1} / {questions.length}
        </span>
      </div>
      <div className="quiz-question">
        <div className="quiz-question__label">この国の首都は？</div>
        <div className="quiz-question__country">{q.country.commonName}</div>
      </div>
      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = 'quiz-option';
          if (answered && i === q.correctIndex) cls += ' quiz-option--correct';
          else if (answered && i === selected) cls += ' quiz-option--wrong';
          return (
            <button key={opt} className={cls} onClick={() => choose(i)} disabled={answered}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (showExplanationAlways || (explanation && true)) && explanation && (
        <div className="quiz-explanation">
          <div className="quiz-explanation__label">{isCorrect ? '正解 ／ 訳あり解説' : '訳あり解説'}</div>
          {explanation}
        </div>
      )}
      {answered && (
        <button className="quiz-next" onClick={next}>
          {index + 1 < questions.length ? '次の問題へ' : '結果を見る'}
        </button>
      )}
    </>
  );
}
