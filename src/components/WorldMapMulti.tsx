import { renderWorldMapMulti } from '../lib/worldMap';

interface WorldMapMultiProps {
  points: { lat: number; lng: number; correct?: boolean }[];
  label?: string;
}

/** 複数地点をまとめて示す世界地図（結果画面の「間違えた国」振り返り用）。SVG本体は renderWorldMapMulti と単一ソース化。 */
export default function WorldMapMulti({ points, label }: WorldMapMultiProps) {
  return <div className="world-map-dot-wrap" dangerouslySetInnerHTML={{ __html: renderWorldMapMulti(points, label) }} />;
}
