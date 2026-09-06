import { countries, REGION_LABELS } from '../data/countries';
import { triviaExplanations } from '../data/trivia';
import { href } from '../lib/router';

export default function CountryDetail({ id }: { id: string }) {
  const country = countries.find((c) => c.id === id);

  if (!country) {
    return (
      <>
        <h1 className="content-h1">国が見つかりません</h1>
        <p className="content-p">
          <a href={href('/countries/')}>一覧に戻る</a>
        </p>
      </>
    );
  }

  const explanation = country.specialType ? triviaExplanations[country.id] : null;

  return (
    <>
      <p style={{ fontSize: '0.85rem', color: '#6b7380', marginBottom: 8 }}>
        <a href={href('/countries/')}>国と首都の一覧</a> ／ {REGION_LABELS[country.region]}
      </p>
      <h1 className="content-h1">{country.commonName}</h1>
      <p className="content-p">正式名称：{country.officialName}</p>
      <div
        style={{
          padding: '18px 20px',
          background: '#fff',
          border: '1.5px solid #d8d0bd',
          borderRadius: 6,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: '0.8rem', color: '#c9963c', fontWeight: 700, marginBottom: 4 }}>首都</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16324a' }}>{country.capital}</div>
      </div>

      {country.note && (
        <div className="quiz-explanation" style={{ marginBottom: 20 }}>
          <div className="quiz-explanation__label">補足</div>
          {country.note}
        </div>
      )}

      {explanation && (
        <div className="quiz-explanation" style={{ marginBottom: 20 }}>
          <div className="quiz-explanation__label">訳あり解説</div>
          {explanation}
        </div>
      )}

      <p className="content-p">
        出典：
        <a href={country.mofaUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#16324a' }}>
          外務省の公表情報
        </a>
      </p>

      <p style={{ marginTop: 24 }}>
        <a className="btn-secondary" href={href(`/region/${country.region}/`)} style={{ display: 'inline-block', padding: '10px 20px' }}>
          {REGION_LABELS[country.region]}のクイズに挑戦する
        </a>
      </p>
    </>
  );
}
