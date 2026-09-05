import { countries, REGION_LABELS, type Region } from '../data/countries';
import { href } from '../lib/router';

const REGION_ORDER: Region[] = ['namerica', 'latinamerica', 'europe', 'africa', 'middleeast', 'asia', 'oceania'];

export default function RegionSelect() {
  return (
    <>
      <h1 className="content-h1">地域別クイズ</h1>
      <p className="content-p">出題したい地域を選んでください。1回のクイズは10問です。</p>
      <ul className="region-list">
        {REGION_ORDER.map((r) => {
          const count = countries.filter((c) => c.region === r && c.includeInQuiz).length;
          return (
            <li key={r}>
              <a className="region-list__item" href={href(`/region/${r}/`)}>
                <span>{REGION_LABELS[r]}</span>
                <span className="region-list__count">{count}か国・地域</span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
