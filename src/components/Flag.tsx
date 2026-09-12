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
  return (
    <img
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
