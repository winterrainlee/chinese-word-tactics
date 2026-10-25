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

## R3 G2 — 03A

공통 글자 notice → discovery는 그대로 둔다. meaning-links/1 상태에 selectedCharacter·introVariant를 함께 저장한다. 발견 전 然을 표제·도움에 따로 노출하지 않는다. 이후 observe-raner/guoran/jingran/ranhou/suiran/jiran/buran을 순서대로 연다. 각 task의 원문 before/after를 각각 고른다. 然而·雖然은 두 사실, 果然·竟然은 예상·실제, 然後는 먼저·다음 행동, 既然은 받아들인 사실·판단을 연결한다. 不然은 before/after를 고른 뒤 not-done에 연결하며 after-done을 거부한다. 각 task마다 한 번만 확정한다.

apply-premise·apply-alternative의 기존 두 적용 문장은 각각 전제→수리, 묶지 않음→흩어짐 연결로 유지한다. 일곱 표현은 한 번에 한 문장씩 보이며 끝에는 저장한 연결을 관찰 메모로 볼 수 있다. 글자 위치 객관식은 없앤다. 모든 구절·관계 선택은 저장·되돌리기가 가능하다. 구형 03A 관계명 완료는 새 연결 완료로 추정하지 않고 03A 시작점으로 복구한다. 영구 완료·관찰 카드·소년의 칸은 기존 ID로 유지한다.

정상·오답 검사: 7+2 작업 모두 대상이 있어야 확정, 공통 글자 오선택 유지, 순서 반전 거부, 不然/然後 구분, 既然/如果의 과잉 일반화 제거. 본선 05 이전/이후 방문, 중간 새로고침, 재플레이, 선택 연구 생략과 아이템 중복 없음은 기존 흐름으로 검사한다.

R3 자동검사: 지역 Node 15개와 전체 빠른 게이트 통과. 03A 브라우저에서 공통 글자 오답 포커스, 7+2 구절 연결, 不然 오독, 되돌리기, 새로고침, 조기/늦은 방문, 본선 milestone 불변, 재플레이를 네 화면 크기에서 통과했다. 아이폰 승인은 대기한다.

## R4 G2 — 05

새 작업은 meaning-links/1의 8개다. 구형 blankIndex/완료 개수는 의미 연결 완료로 환산하지 않는다. 이 방의 첫 작업으로만 복구하고 영구 완료·이야기·카드는 보존한다.

| task ID | 구형 위치 | 구절과 조작 | 오답·완료 |
|---|---|---|---|
| r1-match | r1 果然 | before 예상 → after 실제 | 두 구절 모두 있어야 일치 연결을 확정한다. |
| r2-contrast | r2-a 卻 | before 예상 → after 다른 사실 | 예상과 사실을 뒤집으면 거부한다. |
| r2-evaluation | r2-b 竟然 | 읽은 실제 결과와 沒想到 메모를 보고 흐린 표현을 복원한다. | 竟然이며 관계를 다시 중복 채점하지 않는다. |
| r3-general | r3-a 然而 | before 일반 효과 → after 이번 결과 | 일반 효과 취소와 구별해 두 구절을 남긴다. |
| r3-replacement | r3-b 反而 | before 기대 → after 손상 결과 | 기대/실제 두 구절을 모두 고른다. |
| safety-scope | s-a 然而 + s-b 反而 | effect 효과를 남기고 condition 안전 범위 초과 → risk 손상 가능성을 붙인다. | 전체 안전문을 먼저 공개한다. effect/from/to가 모두 맞아야 확정하며 risk는 점선 가능성으로 표시한다. |
| reread | 전체 재독 | 4개 기록을 완전한 중국어 문장으로 표시한다. | 읽었다는 명시적 확인 후 전달 판단으로 간다. 탭으로 실제 독해를 입증하지는 않는다. |
| dispatch | 기존 전달 판단 | 기존 네 판단 중 추가 확인 필요 판단을 전달한다. | 증가/감소 일반화와 정확한 수량 확정을 각각 거부한다. |

원문 sources의 안정 ID는 before/after, 안전문은 effect/condition/risk다. 연결 슬롯과 마지막 판정·확정 답·taskIndex를 저장한다. 연결은 항상 미리보기이며 잘못 놓은 구절도 남는다. 무료 조회·되돌리기를 유지한다. 이미 읽은 앞 기록과 같은 기록의 앞 구절은 남기고 이후 내용을 미리 맞히게 하지 않는다. 03A 완료 여부와 관계없이 조건 구절 선택 안내를 제공한다. safety-scope는 실제 사건 실선을 사용하지 않으며 可能을 선택 결과에 그대로 남긴다.

검증: 8개 task 전체 진행, 과거 일곱 관계 대응, 안전문 전체 공개, 조건/효과/가능성 혼동, 앞 기록 유지, 전체 재독 없이는 dispatch 진입 불가, 최종 과잉 일반화 거부, 저장 왕복·재플레이·milestone 단일 발생을 확인한다.

R4 자동검사: 전체 빠른 콘텐츠 게이트, 본선 완주(03A 생략), 전체 학술탑 네 viewport, 지역 Node 16개(모든 입력 상태의 백업·복원 왕복 포함)를 통과했다. 안전문 전체와 가능한 손상 표시, 재독 단계, 최종 잘못된 수량 확정을 검사했다. R5 전체 회귀·배포는 진행 중이다.
