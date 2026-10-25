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

## R2 G2 — 02·04

02의 practice는 원본 `water-increased`·`device-not-restored`를 보존한다. 뒤 기록을 직접 선택하고 내 보고의 `whole-judgment`에 연결한다. `water-fact`를 고르는 경우 원문 사실을 취소한 것으로 거부한다. transfer는 `water-restored` → `water-judgment`이며 `repair-fact` 취소와 `future-judgment` 확정을 거부한다. 이 연결 자체가 보고 수정이므로 옛 수정안 객관식을 다시 묻지 않는다. 미확정 연결을 저장하고 잘못 붙인 대상을 그대로 보여 준다. 완료 시 고친 보고를 보여 준다. 새 revision은 meaning-links/1이다.

04는 기존 replacement-link/2의 직접 원문 선택·두 결과 동시 확인·적용 연결어 판단을 보존한다. R1의 expected 점선·actual 실선을 재사용한다. `faster`→`stopped`, `stop`→`normal`이 정상이며 `more-water` 등 조건을 결과로 놓으면 구분해서 피드백한다. 竟然은 문법 오류로 배제하지 않고 이번 기록이 두 결과의 대비를 남기는 과제라고 설명한다. 데이터·저장 migration은 필요 없다.

저장 보완: 01~03에서 구형 저장의 앞 사례 완료가 명확한 경우 그 완료만 대응시키고 현재 사례의 연결부터 다시 시작한다. 구형 미확정 선택은 새 연결로 추정하지 않는다. 03A·05는 과제 구조 대응이 불명확하므로 해당 방 첫 작업으로 복구한다.

R2 자동검사: 지역 Node 15개, 전체 빠른 콘텐츠 게이트, 본선 01~05 완주, MVP 오답·되돌리기·재개, 네 viewport 통과. 원본 취소·추론 수정·조건 구절 오선택을 서로 구분한다. R1 원격 반영은 `ad6dbaf`이며 로컬 커밋과 원격 tree SHA 일치를 확인했다.
