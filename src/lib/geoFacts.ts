// src/lib/geoFacts.ts — 東京からの方角・直線距離を球面三角法で計算する。
// 国別ページが平均111字と薄い問題（O-3-28）への対応。新たな出典・事実の追加検証は不要＝
// 既存のGEO（検証済みの緯度経度データ）から導出する幾何計算のみのため、
// 捏造や転載のリスクなく全200件に一括で適用できる。

const TOKYO = { lat: 35.6762, lng: 139.6503 };
const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** 2点間の大圏距離（km）。ハーバーサイン公式。 */
function greatCircleDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** 出発点から見た到着点の初期方位角（0-360度、北を0とし時計回り）。 */
function initialBearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

const COMPASS_16 = [
  '北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東',
  '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西',
];

function bearingToCompass16(deg: number): string {
  const idx = Math.round(deg / 22.5) % 16;
  return COMPASS_16[idx];
}

export interface TokyoRelation {
  distanceKm: number;
  direction: string;
}

/** 東京から見た、指定した緯度経度への直線距離（km・四捨五入）と16方位。 */
export function tokyoRelation(lat: number, lng: number): TokyoRelation {
  const distanceKm = Math.round(greatCircleDistanceKm(TOKYO.lat, TOKYO.lng, lat, lng));
  const direction = bearingToCompass16(initialBearingDeg(TOKYO.lat, TOKYO.lng, lat, lng));
  return { distanceKm, direction };
}
