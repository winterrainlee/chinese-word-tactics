const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const styles = read('src/styles.css');
const uxStyles = read('src/ux-play.css');
const flow = read('src/flow-runtime.js');
const ux = read('src/ux-play-runtime.js');
const continuous = read('src/continuous-region-flow.js');
const index = read('index.html');

const warnings = [];
const passes = [];

function warn(id, message) { warnings.push({ id, message }); }
function pass(id, message) { passes.push({ id, message }); }

const completionStart = ux.indexOf('function showStageComplete');
const completionEnd = ux.indexOf('globalThis.GameFlow', completionStart);
const completionBody = completionStart >= 0 && completionEnd > completionStart ? ux.slice(completionStart, completionEnd) : '';
if (/completionBar/.test(ux) && /completion\.hidden = false/.test(completionBody) && /id=\"flowNext\"/.test(completionBody) && !/openSheet/.test(completionBody)) {
  pass('UX-05/06', '완료는 판을 덮는 시트 대신 같은 전술 화면의 인라인 진행 행동으로 표시된다.');
} else {
  warn('UX-05/06', '완료가 최종 판을 덮지 않는지 정적으로 확인하지 못했다.');
}

const goalFont = Number(uxStyles.match(/\.goal\{[^}]*font-size:(\d+(?:\.\d+)?)px/s)?.[1]);
const statusFont = Number(uxStyles.match(/\.status\{[^}]*font-size:(\d+(?:\.\d+)?)px/s)?.[1]);
if (goalFont && statusFont && goalFont - statusFont <= 1) {
  pass('UX-01/02', `목표 ${goalFont}px, 상태 메시지 ${statusFont}px로 플레이 중 피드백이 지나치게 약하지 않다.`);
} else {
  warn('UX-01/02', `목표/상태 글자 위계를 확인할 것. goal=${goalFont || '?'} status=${statusFont || '?'}px.`);
}

if (/\.goalbox\{[^}]*box-shadow:none/s.test(uxStyles) && /\.ruleline\{display:none\}/.test(uxStyles)) {
  pass('UX-01', '상시 목표 카드는 그림자를 줄이고 상세 규칙을 필요할 때 여는 구조다.');
} else {
  warn('UX-01', '목표 카드의 상시 시각 무게가 충분히 줄었는지 확인할 것.');
}

if (/document\.querySelector\('#grid \.market-panel'\)/.test(ux) && /context\.replaceChildren\(panel\)/.test(ux)) {
  pass('UX-02', '장터 대상 패널은 실제 판-상태 메시지 사이를 막지 않고 상태 메시지 아래로 이동한다.');
} else {
  warn('UX-02', '장터 대상 패널과 상태 메시지의 순서를 확인하지 못했다.');
}

if (/if \(node\) return playNode\(node\)/.test(flow) && /node\.returnToWorldAfter = index === lastStoryIndex/.test(continuous)) {
  pass('UX-07/09', '다음 노드 직접 연결과 구역 내부 연속 진행 규칙이 함께 존재한다.');
} else {
  warn('UX-07/09', '구역 내부 연속 진행 계약을 확인하지 못했다.');
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
if (stableOrder) pass('UX-01/02', '기본 전술 DOM은 목표 → 판 → 상태 → 단어 → 조작 순서를 유지한다.');
else warn('UX-01/02', '전술 화면 기본 정보 순서가 달라졌다.');

if (/\.cell\{[^}]*min-width:44px;[^}]*min-height:44px;/s.test(styles)) pass('UX-12', '기본 전술 칸의 44px 터치 바닥값이 유지된다.');
else warn('UX-12', '기본 전술 칸의 최소 터치 크기를 확인할 것.');

console.log('UX heuristic audit');
for (const item of passes) console.log(`PASS ${item.id}  ${item.message}`);
for (const item of warnings) console.log(`WARN ${item.id}  ${item.message}`);
console.log(`\n${passes.length} pass, ${warnings.length} warning`);

if (process.argv.includes('--strict') && warnings.length) process.exitCode = 1;