import { countries, REGION_LABELS } from '../data/countries';
import { triviaExplanations } from '../data/trivia';
import { href } from '../lib/router';
import { GEO } from '../data/geo';
import { getCountryMastery } from '../lib/progress';
import { tokyoRelation } from '../lib/geoFacts';
import WorldMapDot from '../components/WorldMapDot';
import Flag from '../components/Flag';

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
  const geo = GEO[country.id];
  const mastery = getCountryMastery(country.id);
  const relation = geo ? tokyoRelation(geo.lat, geo.lng) : null;
  const regionMates = countries.filter((c) => c.region === country.region && c.id !== country.id && c.includeInQuiz);

  return (
    <>
      <p style={{ fontSize: '0.85rem', color: '#6b7380', marginBottom: 8 }}>
        <a href={href('/countries/')}>国と首都の一覧</a> ／ {REGION_LABELS[country.region]}
      </p>
      <h1 className="content-h1" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Flag iso2={geo?.iso2} />
        {country.commonName}
      </h1>
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

      <ul className="mastery-badges">
        <li className={mastery.capital ? 'mastery-badge is-done' : 'mastery-badge'}>首都{mastery.capital ? '◯' : '－'}</li>
        <li className={mastery.flag ? 'mastery-badge is-done' : 'mastery-badge'}>旗{mastery.flag ? '◯' : '－'}</li>
        <li className={mastery.map ? 'mastery-badge is-done' : 'mastery-badge'}>位置{mastery.map ? '◯' : '－'}</li>
      </ul>

      {geo && (
        <div className="quiz-reveal-map" style={{ maxWidth: 360, marginBottom: 20 }}>
          <WorldMapDot lat={geo.lat} lng={geo.lng} label={country.commonName} />
        </div>
      )}

      {relation && (
        <p className="content-p">
          東京から見ると、およそ<strong>{relation.direction}の方角に直線距離約{relation.distanceKm.toLocaleString('ja-JP')}km</strong>
          （緯度経度から算出した大圏距離。実際の航空路線の距離とは異なります）。
        </p>
      )}

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

      {regionMates.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7380', fontWeight: 700, marginBottom: 6 }}>
            {REGION_LABELS[country.region]}の他の国
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
            {regionMates.map((c) => (
              <a key={c.id} href={href(`/countries/${c.id}/`)} style={{ whiteSpace: 'nowrap' }}>
                {c.commonName}
              </a>
            ))}
          </div>
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
