import { BASE } from '../lib/router';

interface FlagProps {
  iso2: string | undefined;
  className?: string;
}

/**
 * 国旗をSVG画像で表示する。絵文字（Regional Indicator Symbols）は環境によって
 * 合字されず「MY」のような2文字表示になることが実機検証で判明したため、
 * flag-icons（MIT）のSVGアセットを public/flags/ に同梱して確実に表示する。
 * パスは絶対パス（BASE起点）＝ページの階層に関わらず正しく解決される。
 */
export default function Flag({ iso2, className }: FlagProps) {
  if (!iso2) return <span className={className} aria-hidden="true" />;
  // key を国ごとに変える＝国が替わったら img を作り直す。同じ img の src だけ替えると、
  // 新しい画像を読み込むあいだ前の国の国旗が新しい国名の横に残る（11-17 監督が本番で実測：北朝鮮の問題にエチオピアの国旗）
  return (
    <img
      key={iso2}
      className={`flag-img${className ? ' ' + className : ''}`}
      src={`${BASE}/flags/${iso2.toLowerCase()}.svg`}
      alt=""
      aria-hidden="true"
      width={28}
      height={21}
      loading="lazy"
    />
  );
}

/** 次に出す国旗を先に読み込んでおく（切り替えの瞬間に空白が見えないように） */
export function preloadFlag(iso2: string | undefined) {
  if (!iso2 || typeof Image === 'undefined') return;
  const img = new Image();
  img.src = `${BASE}/flags/${iso2.toLowerCase()}.svg`;
}
