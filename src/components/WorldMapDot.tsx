import { renderWorldMapSvg, type MapZoomBounds } from '../lib/worldMap';

interface WorldMapDotProps {
  lat: number;
  lng: number;
  label?: string;
  bounds?: MapZoomBounds;
}

/**
 * 実座標（Natural Earth由来・正距円筒図法）の世界地図に、指定した緯度経度を光る点で示す。
 * SVG本体は renderWorldMapSvg（scripts/prerender.ts と共有）で生成し、単一ソース化する。
 * bounds を渡すと、その範囲だけを拡大した「ズーム地図」になる（O-3-24差し戻し対応）。
 */
export default function WorldMapDot({ lat, lng, label, bounds }: WorldMapDotProps) {
  return <div className="world-map-dot-wrap" dangerouslySetInnerHTML={{ __html: renderWorldMapSvg(lat, lng, label, bounds) }} />;
}
