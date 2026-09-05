// scripts/generate-ogp.ts — OGP画像（1200×630）を public/ogp.png に生成する。
// 実行: npx tsx scripts/generate-ogp.ts
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const FONT = "'Yu Gothic','Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,'Noto Sans JP',sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#faf7f0"/>
  <rect x="0" y="0" width="1200" height="16" fill="#16324a"/>
  <rect x="0" y="16" width="1200" height="6" fill="#c9963c"/>
  <g transform="translate(880 315)">
    <circle r="180" fill="none" stroke="#16324a" stroke-width="3"/>
    <ellipse rx="180" ry="70" fill="none" stroke="#16324a" stroke-width="2.2"/>
    <ellipse rx="180" ry="130" fill="none" stroke="#16324a" stroke-width="2.2"/>
    <line x1="0" y1="-180" x2="0" y2="180" stroke="#16324a" stroke-width="2.2"/>
    <line x1="-180" y1="0" x2="180" y2="0" stroke="#16324a" stroke-width="1.6" opacity="0.5"/>
    <circle cx="70" cy="-90" r="12" fill="#c9963c"/>
    <circle cx="-90" cy="40" r="9" fill="#c9963c" opacity="0.75"/>
    <circle cx="30" cy="120" r="9" fill="#c9963c" opacity="0.75"/>
  </g>
  <text x="96" y="230" font-family="${FONT}" font-size="70" font-weight="700" fill="#16324a">世界の首都</text>
  <text x="96" y="308" font-family="${FONT}" font-size="70" font-weight="700" fill="#16324a">クイズ</text>
  <text x="96" y="366" font-family="${FONT}" font-size="26" fill="#6b7380">訳ありの首都まで、外務省の情報にもとづいて正確に</text>
  <line x1="96" y1="420" x2="560" y2="420" stroke="#c9963c" stroke-width="2"/>
  <text x="96" y="470" font-family="${FONT}" font-size="24" fill="#16324a" font-weight="600">study-apps.com/capital-quiz/</text>
</svg>`;

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const outPath = path.join(PUBLIC_DIR, 'ogp.png');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✓ ogp.png (1200x630) を生成: ${outPath}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
