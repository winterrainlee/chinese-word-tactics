const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/app.js');
const styles = read('src/styles.css');
const flow = read('src/flow-runtime.js');
const index = read('index.html');

const warnings = [];
const passes = [];

function warn(id, message) { warnings.push({ id, message }); }
function pass(id, message) { passes.push({ id, message }); }

const completionDelay = app.match(/completionTimer=setTimeout\([\s\S]*?\},(\d+)\)/)?.[1];
if (completionDelay) {
  const ms = Number(completionDelay);
  if (ms < 500) warn('UX-05', `완료 시트가 최종 행동 뒤 ${ms}ms 만에 열린다. 마지막 판 변화와 성공 피드백이 묻히는지 브라우저 캡처로 확인할 것.`);
  else pass('UX-05', `완료 전환 지연 ${ms}ms가 명시되어 있다.`);
} else {
  warn('UX-05', '완료 시트 전환 시간을 정적으로 확인하지 못했다.');
}

const goalFont = Number(styles.match(/\.goal\{[^}]*font-size:(\d+)px/s)?.[1]);
const statusFont = Number(styles.match(/\.status\{[^}]*font-size:(\d+)px/s)?.[1]);
if (goalFont && statusFont && goalFont > statusFont) {
  warn('UX-01/02', `목표 글자 ${goalFont}px, 상태 메시지 ${statusFont}px다. 플레이 중 상태 변화가 충분히 눈에 들어오는지 대표 화면에서 비교할 것.`);
} else {
  pass('UX-01/02', '목표와 상태 메시지의 글자 위계에 뚜렷한 역전 위험이 감지되지 않았다.');
}

if (/\.goalbox\{[^}]*box-shadow:/s.test(styles) && /\.status\{[^}]*background:rgba\([^)]*,\.68\)/s.test(styles)) {
  warn('UX-01/02', '목표는 독립 카드+그림자이고 상태창은 반투명 배경이다. 첫 진입과 행동 직후 화면에서 시각적 무게를 비교할 것.');
}

if (/id=\"flowRetry\" class=\"secondary\"/.test(flow) && /id=\"flowNext\"/.test(flow)) {
  pass('UX-06', '완료 화면에서 재시도는 secondary, 다음 진행은 primary로 구분된다.');
} else {
  warn('UX-06', '완료 화면의 primary/secondary 행동 위계를 정적으로 확인하지 못했다.');
}

if (/if \(node\) return playNode\(node\)/.test(flow)) {
  pass('UX-07/09', '다음 노드가 있으면 여정 목록을 거치지 않고 직접 이어진다.');
} else {
  warn('UX-07/09', '다음 노드 직접 연결 계약을 찾지 못했다.');
}

if (/next\?\.type === 'stage' \? '스테이지 시작'/.test(flow) && /next\?\.type === 'story' \? '이야기 계속'/.test(flow)) {
  pass('UX-08', '이야기 마지막 버튼이 다음 노드 유형을 예고한다.');
} else {
  warn('UX-08', '이야기 종료 버튼 라벨과 다음 노드 유형 연결을 확인하지 못했다.');
}

const order = ['class="goalbox"', 'class="mapwrap"', 'class="status"', 'class="words"', 'class="controls"'];
let cursor = -1;
const stableOrder = order.every(token => {
  const next = index.indexOf(token, cursor + 1);
  if (next < 0 || next <= cursor) return false;
  cursor = next;
  return true;
});
if (stableOrder) pass('UX-01/02', '전술 화면이 목표 → 판 → 상태 → 단어 → 조작 순서를 유지한다.');
else warn('UX-01/02', '전술 화면 기본 정보 순서가 달라졌다.');

console.log('UX heuristic audit');
for (const item of passes) console.log(`PASS ${item.id}  ${item.message}`);
for (const item of warnings) console.log(`WARN ${item.id}  ${item.message}`);
console.log(`\n${passes.length} pass, ${warnings.length} warning`);

if (process.argv.includes('--strict') && warnings.length) process.exitCode = 1;
