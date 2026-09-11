import { WORLD_LAND_PATH, WORLD_MAP_VB_W, WORLD_MAP_VB_H, projectLatLng } from '../lib/worldMap';

interface WorldMapDotProps {
  lat: number;
  lng: number;
  label?: string;
}

/** 実座標（Natural Earth由来・正距円筒図法）の世界地図に、指定した緯度経度を光る点で示す */
export default function WorldMapDot({ lat, lng, label }: WorldMapDotProps) {
  const { x, y } = projectLatLng(lat, lng);
  return (
    <svg
      viewBox={`0 0 ${WORLD_MAP_VB_W} ${WORLD_MAP_VB_H}`}
      role="img"
      aria-label={label ? `世界地図上の${label}の位置` : '世界地図上の位置'}
      className="world-map-dot"
    >
      <rect x={0} y={0} width={WORLD_MAP_VB_W} height={WORLD_MAP_VB_H} fill="var(--map-ocean, #dbe9f4)" />
      <path d={WORLD_LAND_PATH} fill="var(--map-land, #b9c9b0)" stroke="var(--map-land-stroke, #94a58c)" strokeWidth={0.4} />
      <circle cx={x} cy={y} r={9} fill="var(--gold)" opacity={0.35}>
        <animate attributeName="r" values="9;15;9" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r={5} fill="var(--navy-deep)" stroke="#fff" strokeWidth={1.5} />
    </svg>
  );
}
