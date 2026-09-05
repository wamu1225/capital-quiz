import { useCallback, useEffect, useState } from 'react';
import { BASE, getCurrentPath, href, navigate } from './lib/router';
import { questionsForRegion, triviaQuestions } from './lib/quiz';
import { REGION_LABELS, type Region } from './data/countries';
import { SITE_NAME, ABOUT_CONTENT, PRIVACY_CONTENT } from './data/static-pages';
import Home from './pages/Home';
import RegionSelect from './pages/RegionSelect';
import Quiz from './pages/Quiz';
import Reference from './pages/Reference';
import StaticPage from './pages/StaticPage';

function useRoute() {
  const [path, setPath] = useState(getCurrentPath());
  useEffect(() => {
    const onPop = () => setPath(getCurrentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export default function App() {
  const path = useRoute();

  const onNavClick = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('a');
    if (!target) return;
    const url = target.getAttribute('href');
    if (!url || !url.startsWith(BASE) || target.target === '_blank') return;
    e.preventDefault();
    navigate(url.slice(BASE.length) || '/');
  }, []);

  let page: React.ReactNode;
  const regionMatch = path.match(/^\/region\/([a-z]+)\/?$/);

  if (path === '/') {
    page = <Home />;
  } else if (path === '/region/') {
    page = <RegionSelect />;
  } else if (regionMatch) {
    const region = regionMatch[1] as Region;
    const label = REGION_LABELS[region];
    if (label) {
      page = (
        <Quiz
          key={region}
          title={`地域別クイズ：${label}`}
          backHref="/region/"
          backLabel="地域選択に戻る"
          buildQuestions={() => questionsForRegion(region, 10)}
        />
      );
    } else {
      page = <NotFound />;
    }
  } else if (path === '/trivia/') {
    page = (
      <Quiz
        title="首都トリビア：訳ありの首都"
        backHref="/"
        backLabel="トップに戻る"
        buildQuestions={triviaQuestions}
        showExplanationAlways
      />
    );
  } else if (path === '/countries/') {
    page = <Reference />;
  } else if (path === '/about/') {
    page = <StaticPage title="このサイトについて" content={ABOUT_CONTENT} />;
  } else if (path === '/privacy/') {
    page = <StaticPage title="プライバシーポリシー" content={PRIVACY_CONTENT} />;
  } else {
    page = <NotFound />;
  }

  return (
    <div className="site-shell" onClick={onNavClick}>
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-header__title">
            <a href={href('/')}>{SITE_NAME}</a>
          </div>
          <nav className="site-header__nav">
            <a href={href('/countries/')}>国と首都の一覧</a>
            <a href={href('/about/')}>このサイトについて</a>
          </nav>
        </div>
      </header>
      <main className="site-main">{page}</main>
      <footer className="site-footer">
        <a href={href('/about/')}>このサイトについて</a> ／ <a href={href('/privacy/')}>プライバシーポリシー</a>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <>
      <h1 className="content-h1">ページが見つかりません</h1>
      <p className="content-p">
        <a href={href('/')}>トップへ戻る</a>
      </p>
    </>
  );
}
