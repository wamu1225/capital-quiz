import { href } from '../lib/router';

export default function Home() {
  return (
    <>
      <p className="home-lead">
        オランダの首都はアムステルダム、では政治の中心地は？ 台湾の首都は、と聞かれたら何と答えますか？
        世界には、単純な暗記だけでは答えにくい「訳あり」の首都を持つ国が少なくありません。
        このサイトは、そうした国もごまかさずに扱いながら、外務省の公表情報にもとづいて世界の国と首都を学べるクイズです。
      </p>
      <nav className="mode-index">
        <a className="mode-index__item" href={href('/region/')}>
          <div className="mode-index__num">01：地域別クイズ</div>
          <div className="mode-index__title">世界7地域から出題</div>
          <p className="mode-index__desc">
            北米、中南米、欧州、アフリカ、中東、アジア、オセアニアの中から地域を選び、4択でその地域の首都を当てます。
          </p>
        </a>
        <a className="mode-index__item" href={href('/trivia/')}>
          <div className="mode-index__num">02：首都トリビア</div>
          <div className="mode-index__title">訳ありの首都だけを集めた特別クイズ</div>
          <p className="mode-index__desc">
            憲法上の首都と実際の政府所在地が違う国、外交的な事情がある国、遷都の歴史を持つ国を出題します。
            正解でも不正解でも、答えたあとに「なぜそうなっているか」の解説が読めます。
          </p>
        </a>
        <a className="mode-index__item" href={href('/countries/')}>
          <div className="mode-index__num">03：国と首都の一覧</div>
          <div className="mode-index__title">200の国・地域から検索する</div>
          <p className="mode-index__desc">
            クイズに出す前に確認したい、後で見返したいときのリファレンス。地域別に一覧でき、名前で検索もできます。
          </p>
        </a>
      </nav>
    </>
  );
}
