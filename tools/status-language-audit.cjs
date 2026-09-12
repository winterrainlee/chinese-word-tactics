const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const files = fs.readdirSync(srcDir).filter(name => name.endsWith('.js'));

const hasZh = text => /[\u3400-\u9fff]/u.test(text);
const hasKo = text => /[가-힣]/u.test(text);
const literalPattern = /setStatus\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1\s*(?:,\s*(['"`])([^'"`]*?)\3)?\s*\)/g;

// These legacy/runtime strings are deliberately promoted to Chinese-first feedback by
// normalizeLearningFeedback() in src/ux-play-runtime.js. Keeping the authored runtime
// copy unchanged avoids scattering presentation policy through individual mechanics.
const UX_NORMALIZED = [
  /^아직 비석에 접근하지 않았어\.$/,
  /^문이 열려 있어\. 수레가 지나갈 수 있어\.$/,
  /^\$\{location\.labelZh\} — \$\{location\.labelKo\}의 현재 상태를 확인했어\.$/
];

// Korean-only messages are allowed here only when they explain controls, constraints,
// input modes, recovery, or system state rather than the meaning of a game-world event.
const OPERATIONAL_KO = [
  /저장/, /브라우저/, /이 탭/, /먼저 .*눌러/, /옆 칸/, /상하좌우 한 칸/,
  /이동할 .*골라/, /가까이 가/, /올라갈 수 없어/, /들어갈 수 없어/,
  /그쪽으로는 갈 수 없어/, /문이 아직 닫혀/, /살펴봐/, /확인할 수 있어/,
  /더 움직이지 않아/, /필요한 것과 가진 것/, /현재 상태를 보고/, /한 턴 기다렸어/,
  /한 칸 이동했어/, /길표지는 가까이/, /먼저 안쪽 길표지/, /목표와 지형/,
  /직전 행동 전으로 되돌렸어/, /늑대는 행동할 때마다 움직여/,
  /행렬의 수레를 직접 움직이지 않아/, /이번에도 소년만 움직여/,
  /이번에는 수레를 직접 움직이지 않아/, /아직 이 행동을 사용할 수 없어/,
  /이동 모드로 돌아왔어/, /소년이 그 자리에 있어/,
  /그쪽으로는 수레를 움직일 수 없어/, /소년이 문이 열릴 칸에 서 있어/,
  /문은 표시된 칸으로 열려/, /다시 소년을 움직이는 중이야/
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
    const normalized = UX_NORMALIZED.some(pattern => pattern.test(text));
    let kind = zh && ko ? 'bilingual-learning' : zh ? 'chinese-only' : ko ? 'korean-only' : 'other';
    let verdict = 'OK';
    if (normalized) verdict = 'UX-NORMALIZED';
    else if (kind === 'korean-only') verdict = OPERATIONAL_KO.some(pattern => pattern.test(text)) ? 'OPERATIONAL' : 'REVIEW';
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
console.log(`STATUS_LANGUAGE_REVIEW_COUNT ${reviews.length}`);
if (reviews.length) process.exitCode = 1;
