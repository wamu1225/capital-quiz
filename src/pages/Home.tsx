import { href } from '../lib/router';
import { SITE_NAME } from '../data/static-pages';
import { countries } from '../data/countries';
import { getDailyStatus, getMasteredCount, getReviewCountryIds } from '../lib/progress';
import { todayDateStr } from '../lib/quiz';

export default function Home() {
  const today = todayDateStr();
  const { completedToday, streakDays } = getDailyStatus(today);
  const mastered = getMasteredCount();
  const total = countries.filter((c) => c.includeInQuiz).length;
  const reviewCount = getReviewCountryIds().length;

  return (
    <>
      <h1 className="visually-hidden">{SITE_NAME}</h1>
      <section className="play-hero">
        <a className="play-hero__daily" href={href('/daily/')}>
          <span className="play-hero__daily-label">{completedToday ? '今日はクリア済み・もう一度遊べます' : '今日のチャレンジ（5問・1分）'}</span>
          <span className="play-hero__daily-cta">{completedToday ? 'もう一度遊ぶ →' : '遊ぶ →'}</span>
          {streakDays > 0 && <span className="play-hero__daily-streak">連続{streakDays}日目</span>}
        </a>
        <div className="play-hero__row">
          <a className="play-hero__tile" href={href('/region/')}>
            地域を選ぶ
          </a>
          <a className="play-hero__tile" href={href('/trivia/')}>
            訳ありトリビア
          </a>
          {reviewCount > 0 && (
            <a className="play-hero__tile" href={href('/review/')}>
              復習（{reviewCount}）
            </a>
          )}
          <a className="play-hero__tile" href={href('/countries/')}>
            国と首都の一覧
          </a>
        </div>
        <p className="play-hero__progress">
          到達度：
          <strong>
            {mastered}/{total}
          </strong>
          か国・地域
        </p>
      </section>

      <p className="home-lead">
        オランダの首都はアムステルダム、では政治の中心地は？ 台湾の首都は、と聞かれたら何と答えますか？
        世界には、単純な暗記だけでは答えにくい「訳あり」の首都を持つ国が少なくありません。
        このサイトは、そうした国もごまかさずに扱いながら、外務省の公表情報にもとづいて世界の国と首都を学べるクイズです。
      </p>
    </>
  );
}
