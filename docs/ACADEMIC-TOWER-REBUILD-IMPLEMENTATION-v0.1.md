# 학술탑 재구축 구현 기록

2026-10-25 · 기준 main `12b8920` · 실기기 승인 대기.

## R0 — 책임과 기준선

기존 로컬 main은 깨끗하나 원격보다 뒤였으며, 별도 docs/meaning-mobile-actions 작업 트리에는 문서 3개의 staged 수정이 있었다. 모두 보존하고 최신 원격에서 별도 worktree를 만들었다.

`academic-tower-content.js`가 과제와 stage ID를, `academic-tower-runtime.js`가 순수 전이와 렌더·이벤트를 담당한다. 입력은 runAction → history 추가 → state.academicTower 갱신 → save → render → isSolved → GameFlow.recordStageComplete 순이다. 전체 완료 버튼은 결과 화면 진입을 따로 담당한다. `save-data.js`는 전술 상태 전체를 백업하므로 새 작업 필드를 별도 whitelist에 추가할 필요가 없다. 여정·아이템은 기존 GameFlow/JourneyProgress 계약을 유지한다.

기존 kind/revision: 01·02 claim-revision/3, 03 expectation-sort/1, 04 replacement-link/2, 05 connector-cloze/2, 03A ran-observation/1. 새 의미 조작 상태는 kind=meaning-links, schemaVersion=1로 별도 식별한다. 외부 저장 formatVersion=1과 기존 stage 순서는 유지한다. 진행 중 구형 작업은 해당 방의 새 작업 시작점으로만 복구하며 영구 완료·이야기·아이템은 건드리지 않는다. 새 입력의 구절 ID·관계·선택 칸·확정 관계들을 저장한다. 잘못된 미확정 값은 현재 작업에서만 정규화한다.

기준선: `node tools/verify-content.cjs` 통과. 최초 브라우저 실행은 Python playwright 미설치로 실행 전 실패했으며 의존성을 준비한 뒤 재실행한다.

## R1 G2 — 01·03

공통 입력: 빈 작업 칸을 탭하고 원문 구절을 탭한다. 원문은 지우지 않는다. 관계 선택은 미리보기이며 구절 두 개와 관계가 있어야 확정할 수 있다. 오답은 그대로 남고 입력마다 기존 history로 되돌린다. 무료 뜻은 접어서 제공한다. 완료는 모든 과제를 확정한 뒤 기존 완료 이야기로 이어진다. 반복 성공 수는 저장하지 않는다.

| 방·task ID | 구절 ID / 연결 대상 | 허용 관계·결과 | 대표 오답·피드백 |
|---|---|---|---|
| 01 practice | short → rain-danger | 두 사실 보존, 이용 판단만 수정 | 앞 사실 취소 / 위험 제외를 구분한다. |
| 01 transfer | old → working | 오래됨과 정상 작동을 함께 남긴다. | 순서 반전·사실 취소를 구분한다. |
| 03 positive-matched | expectation → actual | matched/果然 | 두 칸을 뒤바꾸거나 竟然을 고르면 원문을 비교한다. |
| 03 negative-surprising | expectation → actual | surprising/竟然 | 나쁜 결과라는 이유로 果然/竟然을 정하지 않는다. |
| 03 negative-matched | expectation → actual | matched/果然 | 나쁜 결과의 일치를 유지한다. |
| 03 positive-surprising | expectation → actual | surprising/竟然 | 좋은 결과의 이탈을 유지한다. |

01은 기존 주장·수정안 2회 객관식을 두 구절+보존 관계 1회로 대체한다. 확정 시 내 메모에서만 잘못된 추론을 지우고 수정 문장을 보인다. 03은 원본 두 구절에 정답 표제를 붙이지 않으며, 선택한 예상(점선)·실제(실선)의 관계가 작업면에 남는다. 저장 revision은 두 방 모두 meaning-links/1이다.

검증: 미선택 확정 거부, 같은 구절 중복·역방향 거부, 원문 불변, 오답 유지, 네 조합, 저장 왕복·새로고침·되돌리기, 재플레이 영구 상태 불변, 타 방 회귀. 375×812/667/640 및 360×640의 스크롤·44px 조작을 확인한다. 실기기에서는 두 구절을 다시 읽게 되는지와 한국어 조작 문구를 확인한다.

R1 자동검사: 전체 빠른 콘텐츠 게이트, 학술탑 본선 01~05 완주, MVP 조작·재개·재플레이, 네 viewport 통과. Chromium 설치는 1.55의 대체 공식 다운로드 서버로 해결했다. 실기기 승인은 별도 대기한다.
