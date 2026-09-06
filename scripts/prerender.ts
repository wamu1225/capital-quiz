// scripts/prerender.ts：SSG。トップ、地域別クイズ、トリビア、国一覧、about/privacyの
// 静的フォールバックHTML、per-page meta、JSON-LDを焼き込み、sitemap.xmlを生成する。
// 実行: npx tsx scripts/prerender.ts（npm run predeploy 内）
import * as fs from 'fs';
import * as path from 'path';
import { countries, REGION_LABELS, type Region } from '../src/data/countries';
import { triviaExplanations } from '../src/data/trivia';
import { ABOUT_CONTENT, PRIVACY_CONTENT, SITE_NAME } from '../src/data/static-pages';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const BASE = '/capital-quiz';
const BASE_URL = 'https://study-apps.com/capital-quiz';

console.log('--- capital-quiz SSG Pre-rendering ---');
if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
// base './' のため、1階層下（/region/asia/ 等）は ../assets/ に変換
function templateForDepth(depth: number): string {
  if (depth === 0) return templateHtml;
  const up = '../'.repeat(depth);
  return templateHtml
    .replace(/href="\.\/assets\//g, `href="${up}assets/`)
    .replace(/src="\.\/assets\//g, `src="${up}assets/`)
    .replace(/href="\.\/favicon\.svg"/g, `href="${up}favicon.svg"`);
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function mdToHtml(content: string): string {
  return content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => (b.startsWith('## ') ? `<h2>${esc(b.slice(3))}</h2>` : `<p>${esc(b)}</p>`))
    .join('\n');
}

function applyMeta(html: string, title: string, description: string, urlPath: string): string {
  const fullTitle = urlPath === '/' ? '世界の首都クイズ｜訳ありの首都まで正確に学べる' : `${title}｜${SITE_NAME}`;
  const url = `${BASE_URL}${urlPath}`;
  return html
    .replace(/<title>.*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${esc(fullTitle)}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${esc(fullTitle)}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${esc(description)}" />`);
}

function writePage(subpath: string, html: string) {
  const dir = subpath === '' ? DIST_DIR : path.join(DIST_DIR, subpath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

const footerNav = `<nav style="margin-top:24px;display:flex;gap:16px;flex-wrap:wrap"><a href="${BASE}/about/" style="color:#16324a">このサイトについて</a><a href="${BASE}/privacy/" style="color:#16324a">プライバシーポリシー</a></nav>`;

const shellStyle =
  'font-family:sans-serif;line-height:1.85;max-width:760px;margin:0 auto;padding:24px 20px;color:#1f2a33';
const h1Style = 'font-size:1.6rem;border-bottom:3px solid #c9963c;padding-bottom:8px;margin-bottom:16px;color:#16324a';

function wrap(depth: number, title: string, desc: string, urlPath: string, bodyHtml: string, jsonLd: object) {
  let html = applyMeta(templateForDepth(depth), title, desc, urlPath);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`);
  return html;
}

const REGION_ORDER: Region[] = ['namerica', 'latinamerica', 'europe', 'africa', 'middleeast', 'asia', 'oceania'];

// ── トップ ──
const homeDesc =
  '外務省の公表情報にもとづく世界の国と首都のクイズ。憲法上の首都と実際の政府所在地が違う国など「訳あり」の首都も、解説つきで丁寧に扱います。';
const homeBody = `<article style="${shellStyle}">
  <h1 style="${h1Style}">${SITE_NAME}</h1>
  <p>${esc(homeDesc)}</p>
  <h2 style="font-size:1.2rem;margin:24px 0 8px;color:#16324a">地域別クイズ</h2>
  <p>世界7地域から出題する4択クイズです。<a href="${BASE}/region/" style="color:#16324a">地域を選んで始める</a></p>
  <h2 style="font-size:1.2rem;margin:24px 0 8px;color:#16324a">首都トリビア</h2>
  <p>訳ありの首都だけを集めた特別クイズです。<a href="${BASE}/trivia/" style="color:#16324a">トリビアを始める</a></p>
  <h2 style="font-size:1.2rem;margin:24px 0 8px;color:#16324a">国と首都の一覧</h2>
  <p>200の国・地域を検索できます。<a href="${BASE}/countries/" style="color:#16324a">一覧を見る</a></p>
  ${footerNav}
</article>`;
writePage(
  '',
  wrap(0, '', homeDesc, '/', homeBody, {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${BASE_URL}/`,
    description: homeDesc,
    inLanguage: 'ja',
  }),
);
console.log('✓ トップページ');

// ── 地域選択 ──
{
  const desc = '出題したい地域を選びます。北米、中南米、欧州、アフリカ、中東、アジア、オセアニアの7地域があります。';
  const rows = REGION_ORDER.map((r) => {
    const count = countries.filter((c) => c.region === r && c.includeInQuiz).length;
    return `<li><a href="${BASE}/region/${r}/" style="color:#16324a">${esc(REGION_LABELS[r])}</a>（${count}か国・地域）</li>`;
  }).join('\n');
  const body = `<article style="${shellStyle}">
    <h1 style="${h1Style}">地域別クイズ</h1>
    <p>${esc(desc)}</p>
    <ul style="padding-left:18px">${rows}</ul>
    ${footerNav}
  </article>`;
  writePage(
    'region',
    wrap(1, '地域別クイズ', desc, '/region/', body, {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '地域別クイズ',
      url: `${BASE_URL}/region/`,
      inLanguage: 'ja',
    }),
  );
}
console.log('✓ /region/');

// ── 地域別クイズページ（7件） ──
for (const r of REGION_ORDER) {
  const label = REGION_LABELS[r];
  const list = countries.filter((c) => c.region === r && c.includeInQuiz);
  const desc = `${label}の${list.length}か国・地域から出題する首都当てクイズです。`;
  const rows = list.map((c) => `<li>${esc(c.commonName)}</li>`).join('\n');
  const body = `<article style="${shellStyle}">
    <h1 style="${h1Style}">地域別クイズ：${esc(label)}</h1>
    <p>${esc(desc)}</p>
    <h2 style="font-size:1.05rem;margin:20px 0 8px;color:#16324a">出題範囲</h2>
    <ul style="columns:2;column-gap:24px;padding-left:18px;font-size:0.92rem">${rows}</ul>
    <p style="margin-top:20px"><a href="${BASE}/region/" style="color:#16324a">← 地域選択に戻る</a></p>
    ${footerNav}
  </article>`;
  writePage(
    `region/${r}`,
    wrap(2, `地域別クイズ：${label}`, desc, `/region/${r}/`, body, {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      name: `${label}の首都クイズ`,
      about: label,
      url: `${BASE_URL}/region/${r}/`,
      inLanguage: 'ja',
    }),
  );
}
console.log('✓ /region/<region>/ 全7件');

// ── 首都トリビア ──
{
  const list = countries.filter((c) => c.specialType && c.includeInQuiz);
  const desc = `憲法上の首都と実際の政府所在地が違う国、外交的な事情がある国、遷都の歴史を持つ国、${list.length}か国を集めた特別クイズです。`;
  const rows = list
    .map((c) => `<li><strong>${esc(c.commonName)}</strong>：${esc(triviaExplanations[c.id] ?? '')}</li>`)
    .join('\n');
  const body = `<article style="${shellStyle}">
    <h1 style="${h1Style}">首都トリビア：訳ありの首都</h1>
    <p>${esc(desc)}</p>
    <ul style="padding-left:18px;font-size:0.92rem;line-height:1.9">${rows}</ul>
    ${footerNav}
  </article>`;
  writePage(
    'trivia',
    wrap(1, '首都トリビア：訳ありの首都', desc, '/trivia/', body, {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      name: '首都トリビア：訳ありの首都',
      url: `${BASE_URL}/trivia/`,
      inLanguage: 'ja',
    }),
  );
}
console.log('✓ /trivia/');

// ── 国と首都の一覧 ──
{
  const desc = '外務省の公表情報にもとづく200の国・地域と、その首都の一覧です。地域別に検索できます。';
  const groups = REGION_ORDER.map((r) => {
    const list = countries.filter((c) => c.region === r);
    const rows = list
      .map(
        (c) =>
          `<li><a href="${BASE}/countries/${c.id}/" style="color:#16324a">${esc(c.commonName)}</a>：${esc(c.capital)}${c.specialType ? '（訳あり）' : ''}</li>`,
      )
      .join('\n');
    return `<h2 style="font-size:1.05rem;margin:20px 0 8px;color:#16324a">${esc(REGION_LABELS[r])}</h2>
    <ul style="padding-left:18px;font-size:0.92rem">${rows}</ul>`;
  }).join('\n');
  const body = `<article style="${shellStyle}">
    <h1 style="${h1Style}">国と首都の一覧</h1>
    <p>${esc(desc)}</p>
    ${groups}
    ${footerNav}
  </article>`;
  writePage(
    'countries',
    wrap(1, '国と首都の一覧', desc, '/countries/', body, {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '国と首都の一覧',
      url: `${BASE_URL}/countries/`,
      inLanguage: 'ja',
    }),
  );
}
console.log('✓ /countries/');

// ── 個別国ページ（200件） ──
for (const c of countries) {
  const explanation = c.specialType ? triviaExplanations[c.id] : null;
  const desc = `${c.commonName}の首都は${c.capital}。外務省の公表情報にもとづく基本情報${explanation ? 'と、首都をめぐる背景の解説' : ''}です。`;
  const body = `<article style="${shellStyle}">
    <p style="font-size:0.85rem;color:#6b7380;margin-bottom:8px"><a href="${BASE}/countries/" style="color:#6b7380">国と首都の一覧</a>／${esc(REGION_LABELS[c.region])}</p>
    <h1 style="${h1Style}">${esc(c.commonName)}</h1>
    <p>正式名称：${esc(c.officialName)}</p>
    <div style="padding:18px 20px;background:#fff;border:1.5px solid #d8d0bd;border-radius:6px;margin-bottom:20px">
      <div style="font-size:0.8rem;color:#c9963c;font-weight:700;margin-bottom:4px">首都</div>
      <div style="font-size:1.6rem;font-weight:700;color:#16324a">${esc(c.capital)}</div>
    </div>
    ${c.note ? `<p style="background:#f3ede0;padding:14px 16px;border-radius:6px;margin-bottom:16px">補足：${esc(c.note)}</p>` : ''}
    ${explanation ? `<p style="background:#f3ede0;padding:14px 16px;border-radius:6px;margin-bottom:16px">訳あり解説：${esc(explanation)}</p>` : ''}
    <p>出典：<a href="${esc(c.mofaUrl)}" style="color:#16324a">外務省の公表情報</a></p>
    <p style="margin-top:20px"><a href="${BASE}/region/${c.region}/" style="color:#16324a">${esc(REGION_LABELS[c.region])}のクイズに挑戦する</a></p>
    ${footerNav}
  </article>`;
  writePage(
    `countries/${c.id}`,
    wrap(2, c.commonName, desc, `/countries/${c.id}/`, body, {
      '@context': 'https://schema.org',
      '@type': 'Country',
      name: c.commonName,
      url: `${BASE_URL}/countries/${c.id}/`,
    }),
  );
}
console.log('✓ /countries/<id>/ 全200件');

// ── about / privacy ──
for (const [slug, title, desc, content] of [
  ['about', 'このサイトについて', `${SITE_NAME}のデータの出典と編集方針を説明します。`, ABOUT_CONTENT],
  ['privacy', 'プライバシーポリシー', `${SITE_NAME}のプライバシーポリシー。`, PRIVACY_CONTENT],
] as const) {
  const body = `<article style="${shellStyle}">
    <h1 style="${h1Style}">${esc(title)}</h1>
    ${mdToHtml(content)}
    ${footerNav}
  </article>`;
  writePage(
    slug,
    wrap(1, title, desc, `/${slug}/`, body, {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description: desc,
      url: `${BASE_URL}/${slug}/`,
      inLanguage: 'ja',
    }),
  );
}
console.log('✓ /about/ /privacy/');

// ── sitemap.xml ──
const today = new Date().toISOString().split('T')[0];
const urls = [
  { loc: `${BASE_URL}/`, priority: '1.0' },
  { loc: `${BASE_URL}/region/`, priority: '0.8' },
  ...REGION_ORDER.map((r) => ({ loc: `${BASE_URL}/region/${r}/`, priority: '0.7' })),
  { loc: `${BASE_URL}/trivia/`, priority: '0.8' },
  { loc: `${BASE_URL}/countries/`, priority: '0.8' },
  ...countries.map((c) => ({ loc: `${BASE_URL}/countries/${c.id}/`, priority: '0.5' })),
  { loc: `${BASE_URL}/about/`, priority: '0.3' },
  { loc: `${BASE_URL}/privacy/`, priority: '0.2' },
];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);
console.log(`✓ sitemap.xml（全${urls.length}URL）`);

console.log('--- Done ---');
