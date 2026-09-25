# 학술탑 Slice A·B1 구현 기록 v0.1

> 상태: `🧪` G3 구현·지역 G4 자동검사 완료 / G5 Pages·G6 iPhone 승인 대기
> 구현일: 2026-09-25
> 빌드: `2026-09-25-academic-tower-expectation-sort1`
> 범위: 첫 방문, 전용 허브, 01 `卻`, 중간 이야기, 02 `然而`, 03 `果然／竟然`, 저장·재플레이·재진입

## 1. 완료한 수직 slice

Slice A는 다음 한 흐름을 실제 플레이 가능하게 연결한다.

```text
chapter1-complete
→ 월드의 학술탑 선택
→ academic-tower-arrival
→ academic-tower-turn-intro
→ 01 academic-tower-turn-01-que
→ academic-tower-turn-after-que
→ 학술탑 허브
→ 02 academic-tower-turn-02-raner 또는 03 academic-tower-turn-03-expectation
→ 학술탑 허브
```

- 첫 방문에서는 문지기가 낯선 소년을 막고, 수로 기록 연구원이 수리패와 조사 주제를 확인한 뒤 자기 연구실 방문을 책임진다.
- 01에서는 문장을 두 사실로 나눠 읽고, 사실은 보존하면서 `짧으니 이용하기 좋다`는 성급한 판단만 고친다.
- 02에서는 두 기록을 함께 읽고, 수량의 부분 개선을 장치 전체 회복으로 확대한 복구 보고만 고친다.
- 03에서는 예상 기록과 실제 결과를 비교해 `예상대로 / 果然`, `예상 밖 / 竟然`으로 네 사례를 분류한다. 긍정·부정 결과와 일치·이탈을 2×2로 교차해 감정값 요령을 막는다.
- 두 방 모두 안내 연습 뒤 반대 방향의 새 기록을 해결해야 완료된다. 01은 `오래됐지만 정상 작동`, 02는 `미수리지만 수량 정상`으로 단순한 뒤쪽·부정 결론 반복을 막는다.
- 01 뒤의 이야기까지 본 뒤 허브가 열리며, 02와 03은 어느 순서로든 진행할 수 있고 미구현 방은 `준비 중`으로 표시된다.
- 02·03 완료 뒤에도 전체 탑 완료나 격파를 만들지 않고 허브로 돌아간다. 04와 그 직전 이야기는 다음 slice까지 열지 않는다.

## 2. 구현 경계

| 책임 | 구현 위치 |
|---|---|
| 목표어·세 방 데이터·5개 방 허브 메타데이터 | `src/academic-tower-content.js` |
| 첫 방문·연구 도입·01 뒤 이야기와 여정 연결 | `src/academic-tower-journey-content.js` |
| 주장 수정·예상 관계 분류 작업대의 순수 상태 전이·판정·표현 | `src/academic-tower-runtime.js` |
| 상설 방 목록과 첫 플레이·재플레이 진입 | `src/academic-tower-hub-runtime.js` |
| 허브·작업대 모바일 레이아웃 | `src/academic-tower.css` |
| 월드 진입·완료 뒤 허브 반환·새로고침 복귀 | `src/flow-runtime.js`, `src/ux-play-runtime.js`, `src/app.js` |
| 단어장·생애주기·TBCL 편집층 | `src/lexicon-content.js`, `data/vocabulary-lifecycle-v0.1.json`, `data/tbcl-word-levels-2025-04.json` |
| 이야기 주음부호·화자·배경 | `src/story-pronunciation-content.js`, `src/story-runtime.js` |

기존 `STAGES` 순서는 바꾸지 않았고 01·02 뒤에 03을 추가했다. 이전 임시 월드 ID `research-city`가 방문 기록에 남아 있으면 `academic-tower`로 읽는 migration도 넣었다.

## 3. 판정과 복구

01·02는 `academicTower.kind='claim-revision'`, `schemaVersion=3`의 같은 순수 상태 전이를 사용한다.

```text
전체 자료 확인 → 고칠 주장 선택 → 두 사실을 살린 수정안 선택
→ 수정 전후와 접속 표현의 근거 연결 확인
→ 새 기록의 통합 수정안 선택 → 완료
```

- 모든 응답은 `null`로 시작한다. 자료 열람 상태와 정답 색을 섞지 않는다.
- 짧은 원문은 처음부터 전부 보이며 별도 `문장 마저 읽기` 행동이 없다. 01의 문장 분할은 실제 두 의미 덩어리를 보여 주는 독해 보조이고 완료 조건은 아니다.
- 02는 `relation / focus / conclusion`을 별도 버튼으로 반복하지 않는다. 뒤 기록이 어느 과잉 주장을 제한하는지와 두 기록을 보존한 수정안만 판단한다.
- 오답은 사실 카드를 지우지 않고, 무엇을 과도하게 확대하거나 취소했는지 한국어로 즉시 보여 준다.
- 네 선택지는 서로 다른 오개념을 진단한다. 정답 슬롯은 입장마다 회전하고 상태에 저장되며, 연습 주장·연습 수정·새 기록 수정의 정답 위치는 서로 다르다.
- 기존 v1·v2 진행 중 작업대는 렌더 시 v3 첫 상태로 초기화한다. 안정 stage ID와 이미 완료된 `completedStages`는 유지한다.

03은 `academicTower.kind='expectation-sort'`, `schemaVersion=1`의 별도 순수 상태 전이를 사용한다.

```text
예상 기록과 실제 기록 비교 → 예상대로/예상 밖 레일 선택 → 관계 확정
→ 果然/竟然 분류 도장 확인 → 다음 사례 → 네 사례 완료
```

- 안내 2사례는 실제 기록의 `果然 / 竟然`을 강조하고, 적용 2사례는 표지어 없이 먼저 관계를 판단하게 한다.
- 사례 조합은 `긍정·일치`, `부정·이탈`, `부정·일치`, `긍정·이탈`을 한 번씩 포함한다.
- 오답 뒤에도 예상과 실제 기록, 선택한 레일을 남겨 비교 근거를 잃지 않고 바로 재분류할 수 있다.
- 관계는 실제로 두 종류이므로 네 번째 보기로 부풀리지 않고, 네 사례가 서로 다른 오개념을 진단하게 한다.

## 4. 저장 경계

- 첫 방문 완료: `academic-tower-entered`
- 01·02·03 첫 플레이 완료: 기존 `completedStages`
- 현재 단계, 선택한 주장·수정안, 선택지 순서, 오답: 전술 저장 안에서만 유지
- 재플레이: 본편 완료·milestone·마지막 본편 위치를 바꾸지 않음
- 새로고침: 완료 직전 인라인 완료 상태와 완료 뒤 학술탑 허브 복귀를 복원
- 묶음 milestone `academic-tower-turn-foundation`: Slice C 전까지 만들지 않음
- 탑 전체 완료 milestone: 만들지 않음

## 5. 자동검사 증거

추가한 계약은 다음을 고정한다.

- 01의 사실/과잉 추론 구분, 두 사실 보존, 반대 방향 새 기록, 완료 판정
- 02의 부분/전체 구분, 두 기록 보존, 반대 방향 새 기록, 완료 판정
- 03의 긍정/부정×일치/이탈 2×2 구성, 안내/적용 분리, 오답 복구, 네 사례 완료 판정
- 전체 원문의 즉시 노출, 미선택 초기 상태, 4개 보기의 구별되는 피드백, 같은 위치 반복 방지, 저장 중 선택지 순서 보존
- 첫 입장 잠금, 이야기 연결, 허브 반환, 계획 방 비활성화
- 첫 플레이 저장과 재플레이 비변경
- 단어 카드, 단어장, lifecycle, TBCL, 이야기 주음부호 교차 참조
- `/chinese-word-tactics/` 하위 경로 종단 완주와 자산 404 검사
- 375×812, 375×667, 375×640, 360×640의 가로 overflow·44px·620px 검사

검증 명령:

```bash
node tools/verify-content.cjs --browser
python3 tests/smoke_academic_tower.py
python3 tests/smoke_academic_tower_layout.py
```

2026-09-25 기준 Slice A·B1 전체 게이트에서 Node 회귀 297개, 콘텐츠·후보·생애주기·상태 문구·이야기 발음 교차검사, 기존 지역과 학술탑의 브라우저 회귀가 모두 통과했다. 같은 게이트에 03 순수 판정과 완주·4 viewport 캡처를 포함한다. 브라우저 캡처 이름은 `academic-tower-01-complete-375x812.png`, `academic-tower-03-complete-375x812.png`, `academic-tower-hub-<viewport>.png`, `academic-tower-02-<viewport>.png`, `academic-tower-03-<viewport>.png`다.

첫 Pages 배포에서는 변경된 기반 콘텐츠 파일 `src/content.js`에 cache key가 없어 이전 `research-city` 정의가 재사용되는 문제가 있었다. Slice A2에서 `v=20260925-academictower2`를 부여했고, expectation-sort 빌드에서는 학술탑 콘텐츠·런타임·CSS와 단어장·이야기 발음 query key, `cwt-build`를 함께 갱신했다.

## 6. 남은 게이트

- G5: 커밋·푸시 뒤 Pages CI 전체 통과와 라이브 `cwt-build`, 빈 저장·기존 저장·진행 중 저장 확인
- G6: iPhone 13 mini Safari에서 주소창 펼침·접힘, 첫 입장, 단어 카드, 오답·되돌리기, 완료·재플레이·새로고침, 가장 긴 03 적용 상태 확인
- Slice B2: 02·03 완료 뒤 이야기, 04 `反而`
- Slice C: 05 종합, 결과 이야기, 첫 연구 묶음 milestone

따라서 현재 `🧪`는 Slice A·B1에만 적용한다. 첫 연구 묶음 전체와 학술탑 전체를 완료 상태로 올리지 않는다.
