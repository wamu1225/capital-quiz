import { countries, REGION_LABELS, type Region } from '../data/countries';
import { href } from '../lib/router';
import { getMasteredCount, getRegionBest, getReviewCountryIds, formatTimeMs } from '../lib/progress';

const REGION_ORDER: Region[] = ['namerica', 'latinamerica', 'europe', 'africa', 'middleeast', 'asia', 'oceania'];

export default function RegionSelect() {
  const totalQuizCountries = countries.filter((c) => c.includeInQuiz).length;
  const mastered = getMasteredCount();
  const reviewCount = getReviewCountryIds().length;

  return (
    <>
      <h1 className="content-h1">地域別クイズ</h1>
      <p className="content-p">
        出題したい地域を選んでください。1回のクイズは5問・1分程度で終わります。到達度：
        <strong>
          {mastered}/{totalQuizCountries}
        </strong>
        か国・地域
      </p>
      {reviewCount > 0 && (
        <p className="content-p">
          <a className="btn-secondary" href={href('/review/')} style={{ display: 'inline-block', padding: '10px 20px' }}>
            間違えた{reviewCount}か国を復習する →
          </a>
        </p>
      )}
      <ul className="region-list">
        {REGION_ORDER.map((r) => {
          const count = countries.filter((c) => c.region === r && c.includeInQuiz).length;
          const best = getRegionBest(r);
          return (
            <li key={r}>
              <a className="region-list__item" href={href(`/region/${r}/`)}>
                <span>{REGION_LABELS[r]}</span>
                <span className="region-list__meta">
                  <span className="region-list__count">{count}か国・地域</span>
                  {best && (
                    <span className="region-list__best">
                      自己ベスト {best.score}/5（{formatTimeMs(best.timeMs)}）
                    </span>
                  )}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
