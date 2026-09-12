const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const files = fs.readdirSync(srcDir).filter(name => name.endsWith('.js'));

const hasZh = text => /[\u3400-\u9fff]/u.test(text);
const hasKo = text => /[가-힣]/u.test(text);
const literalPattern = /setStatus\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1\s*(?:,\s*(['"`])([^'"`]*?)\3)?\s*\)/g;

// Korean-only messages are allowed here only when they are clearly UI/system operation,
// not language-learning feedback about the game world.
const OPERATIONAL_KO = [
  /저장/, /브라우저/, /이 탭/, /먼저 .*눌러/, /옆 칸/, /상하좌우 한 칸/,
  /이동할 .*골라/, /가까이 가/, /올라갈 수 없어/, /들어갈 수 없어/,
  /그쪽으로는 갈 수 없어/, /문이 아직 닫혀/, /살펴봐/, /확인할 수 있어/,
  /더 움직이지 않아/, /필요한 것과 가진 것/, /현재 상태를 보고/, /한 턴 기다렸어/,
  /한 칸 이동했어/, /길표지는 가까이/, /먼저 안쪽 길표지/, /목표와 지형/
];

const rows = [];
for (const file of files) {
  const source = fs.readFileSync(path.join(srcDir, file), 'utf8');
  let match;
  while ((match = literalPattern.exec(source))) {
    const text = match[2].replace(/\\(['"`\\])/g, '$1');
    const before = source.slice(0, match.index);
    const line = before.split('\n').length;
    const zh = hasZh(text), ko = hasKo(text);
    let kind = zh && ko ? 'bilingual-learning' : zh ? 'chinese-only' : ko ? 'korean-only' : 'other';
    let verdict = 'OK';
    if (kind === 'korean-only') verdict = OPERATIONAL_KO.some(pattern => pattern.test(text)) ? 'OPERATIONAL' : 'REVIEW';
    rows.push({ file, line, kind, verdict, text });
  }
}

const counts = rows.reduce((acc, row) => {
  const key = `${row.kind}:${row.verdict}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

console.log('STATUS_LANGUAGE_AUDIT', JSON.stringify(counts));
for (const row of rows.filter(row => row.verdict === 'REVIEW')) {
  console.log(`REVIEW ${row.file}:${row.line} ${JSON.stringify(row.text)}`);
}

const reviews = rows.filter(row => row.verdict === 'REVIEW');
if (reviews.length) {
  console.log(`STATUS_LANGUAGE_REVIEW_COUNT ${reviews.length}`);
} else {
  console.log('STATUS_LANGUAGE_REVIEW_COUNT 0');
}
