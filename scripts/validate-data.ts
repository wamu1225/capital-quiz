// scripts/validate-data.ts — countries.ts のデータ整合性を機械チェックする。
import { countries } from '../src/data/countries';
import { triviaExplanations } from '../src/data/trivia';

const errors: string[] = [];

const seenIds = new Set<string>();
for (const c of countries) {
  if (!c.id || !/^[a-z0-9_]+$/.test(c.id)) {
    errors.push(`不正なid: ${JSON.stringify(c)}`);
  }
  if (seenIds.has(c.id)) {
    errors.push(`id重複: ${c.id}`);
  }
  seenIds.add(c.id);

  if (!c.commonName) errors.push(`commonName欠落: ${c.id}`);
  if (!c.officialName) errors.push(`officialName欠落: ${c.id}`);
  if (!c.capital) errors.push(`capital欠落: ${c.id}`);
  if (!c.mofaUrl || !c.mofaUrl.startsWith('https://www.mofa.go.jp/')) {
    errors.push(`mofaUrlが不正: ${c.id} -> ${c.mofaUrl}`);
  }

  // includeInQuiz=true なのに capital が「記載なし」系は矛盾（出題できない）
  if (c.includeInQuiz && (c.capital === '記載なし' || c.capital.includes('記載なし'))) {
    errors.push(`出題対象なのにcapitalが未記載: ${c.id}`);
  }
  // 「記載なし」系は includeInQuiz=false であるべき
  if (!c.includeInQuiz && c.capital !== '記載なし') {
    // 除外理由が capital 欠落以外のケースもあり得るため warning 相当（許容）
  }
}

// specialType付きの国は全てtrivia解説を持つべき
for (const c of countries) {
  if (c.specialType && !triviaExplanations[c.id]) {
    errors.push(`specialTypeがあるのにtrivia解説が無い: ${c.id}`);
  }
}
// trivia解説があるのにcountries側にspecialTypeが無い＝孤立データ
for (const id of Object.keys(triviaExplanations)) {
  const c = countries.find((x) => x.id === id);
  if (!c) errors.push(`trivia解説のidがcountriesに存在しない: ${id}`);
  else if (!c.specialType) errors.push(`trivia解説はあるがspecialTypeが無い: ${id}`);
}

const quizCount = countries.filter((c) => c.includeInQuiz).length;
console.log(`--- capital-quiz データ検証 ---`);
console.log(`国・地域 総数: ${countries.length}`);
console.log(`標準クイズ出題対象: ${quizCount}`);
console.log(`特殊分類（typeA/B/C）: ${countries.filter((c) => c.specialType).length}`);

if (errors.length > 0) {
  console.error(`\n❌ ${errors.length}件のエラー:`);
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}
console.log('\n✅ All checks passed!');
