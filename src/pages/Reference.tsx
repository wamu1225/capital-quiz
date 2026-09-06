import { useState } from 'react';
import { countries, REGION_LABELS, type Region } from '../data/countries';
import { href } from '../lib/router';

const REGION_ORDER: Region[] = ['namerica', 'latinamerica', 'europe', 'africa', 'middleeast', 'asia', 'oceania'];

export default function Reference() {
  const [query, setQuery] = useState('');

  const q = query.trim();
  const filtered = q
    ? countries.filter((c) => c.commonName.includes(q) || c.capital.includes(q))
    : countries;

  return (
    <>
      <h1 className="content-h1">国と首都の一覧</h1>
      <input
        className="ref-search"
        type="text"
        placeholder="国名や首都名で検索"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {REGION_ORDER.map((r) => {
        const list = filtered.filter((c) => c.region === r);
        if (list.length === 0) return null;
        return (
          <div className="ref-region-group" key={r}>
            <div className="ref-region-group__title">{REGION_LABELS[r]}</div>
            <ul>
              {list.map((c) => (
                <li className="ref-row" key={c.id}>
                  <span>
                    <a href={href(`/countries/${c.id}/`)}>{c.commonName}</a>
                    {c.specialType && <span className="ref-row__badge">訳あり</span>}
                  </span>
                  <span className="ref-row__capital">{c.capital}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}
