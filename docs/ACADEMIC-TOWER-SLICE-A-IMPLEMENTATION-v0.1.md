# 학술탑 Slice A 구현 기록 v0.1

> 상태: `🧪` G3 구현·지역 G4 자동검사 완료 / G5 Pages·G6 iPhone 승인 대기
> 구현일: 2026-09-25
> 빌드: `2026-09-25-academic-tower-claim-revision1`
> 범위: 첫 방문, 전용 허브, 01 `卻`, 중간 이야기, 02 `然而`, 저장·재플레이·재진입

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
→ 02 academic-tower-turn-02-raner
→ 학술탑 허브
```

- 첫 방문에서는 문지기가 낯선 소년을 막고, 수로 기록 연구원이 수리패와 조사 주제를 확인한 뒤 자기 연구실 방문을 책임진다.
- 01에서는 문장을 두 사실로 나눠 읽고, 사실은 보존하면서 `짧으니 이용하기 좋다`는 성급한 판단만 고친다.
- 02에서는 두 기록을 함께 읽고, 수량의 부분 개선을 장치 전체 회복으로 확대한 복구 보고만 고친다.
- 두 방 모두 안내 연습 뒤 반대 방향의 새 기록을 해결해야 완료된다. 01은 `오래됐지만 정상 작동`, 02는 `미수리지만 수량 정상`으로 단순한 뒤쪽·부정 결론 반복을 막는다.
- 01 뒤의 이야기까지 본 뒤 허브가 열리며, 01은 다시 연구, 02는 첫 연구, 미구현 방은 `준비 중`으로 표시된다.
- 02 완료 뒤에는 전체 탑 완료나 격파를 만들지 않고 허브로 돌아간다.

## 2. 구현 경계

| 책임 | 구현 위치 |
|---|---|
| 목표어·두 방 데이터·5개 방 허브 메타데이터 | `src/academic-tower-content.js` |
| 첫 방문·연구 도입·01 뒤 이야기와 여정 연결 | `src/academic-tower-journey-content.js` |
| 두 독해 작업대의 순수 상태 전이·판정·표현 | `src/academic-tower-runtime.js` |
| 상설 방 목록과 첫 플레이·재플레이 진입 | `src/academic-tower-hub-runtime.js` |
| 허브·작업대 모바일 레이아웃 | `src/academic-tower.css` |
| 월드 진입·완료 뒤 허브 반환·새로고침 복귀 | `src/flow-runtime.js`, `src/ux-play-runtime.js`, `src/app.js` |
| 단어장·생애주기·TBCL 편집층 | `src/lexicon-content.js`, `data/vocabulary-lifecycle-v0.1.json`, `data/tbcl-word-levels-2025-04.json` |
| 이야기 주음부호·화자·배경 | `src/story-pronunciation-content.js`, `src/story-runtime.js` |

기존 `STAGES` 순서는 바꾸지 않았고 01·02를 북쪽 숲 F8 뒤에 추가했다. 이전 임시 월드 ID `research-city`가 방문 기록에 남아 있으면 `academic-tower`로 읽는 migration도 넣었다.

## 3. 판정과 복구

01·02는 `academicTower.kind='claim-revision'`, `schemaVersion=2`의 같은 순수 상태 전이를 사용한다.

```text
연습 자료 공개 → 고칠 주장 선택 → 두 사실을 살린 수정안 선택
→ 수정 전후와 접속 표현의 근거 연결 확인
→ 새 기록의 통합 수정안 선택 → 완료
```

- 모든 응답은 `null`로 시작한다. 자료 열람 상태와 정답 색을 섞지 않는다.
- 01의 문장 분할은 실제 두 의미 덩어리를 보여 주는 독해 보조이고 완료 조건은 아니다.
- 02는 `relation / focus / conclusion`을 별도 버튼으로 반복하지 않는다. 뒤 기록이 어느 과잉 주장을 제한하는지와 두 기록을 보존한 수정안만 판단한다.
- 오답은 사실 카드를 지우지 않고, 무엇을 과도하게 확대하거나 취소했는지 한국어로 즉시 보여 준다.
- 선택지의 정답 슬롯은 입장마다 회전하고 상태에 저장된다. 연습 주장·연습 수정·새 기록 수정의 정답 위치는 서로 다르다.
- 기존 v1 진행 중 작업대는 렌더 시 v2 첫 상태로 초기화한다. 안정 stage ID와 이미 완료된 `completedStages`는 유지한다.

## 4. 저장 경계

- 첫 방문 완료: `academic-tower-entered`
- 01·02 첫 플레이 완료: 기존 `completedStages`
- 공개 자료, 현재 단계, 선택한 주장·수정안, 선택지 순서, 오답: 전술 저장 안에서만 유지
- 재플레이: 본편 완료·milestone·마지막 본편 위치를 바꾸지 않음
- 새로고침: 완료 직전 인라인 완료 상태와 완료 뒤 학술탑 허브 복귀를 복원
- 묶음 milestone `academic-tower-turn-foundation`: Slice C 전까지 만들지 않음
- 탑 전체 완료 milestone: 만들지 않음

## 5. 자동검사 증거

추가한 계약은 다음을 고정한다.

- 01의 사실/과잉 추론 구분, 두 사실 보존, 반대 방향 새 기록, 완료 판정
- 02의 부분/전체 구분, 두 기록 보존, 반대 방향 새 기록, 완료 판정
- 미선택 초기 상태, 자료 공개 전 제출 차단, 같은 위치 반복 방지, 저장 중 선택지 순서 보존
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

2026-09-25 기준 전체 게이트에서 Node 회귀 296개, 콘텐츠·후보·생애주기·상태 문구·이야기 발음 교차검사, 기존 지역과 학술탑의 브라우저 회귀가 모두 통과했다. 브라우저 캡처 이름은 `academic-tower-01-complete-375x812.png`, `academic-tower-hub-<viewport>.png`, `academic-tower-02-<viewport>.png`다. CI에서도 두 smoke를 명시적으로 실행하고 캡처를 UX artifact에 포함한다.

첫 Pages 배포에서는 변경된 기반 콘텐츠 파일 `src/content.js`에 cache key가 없어 이전 `research-city` 정의가 재사용되는 문제가 있었다. Slice A2에서 `v=20260925-academictower2`를 부여했고, claim-revision 빌드에서는 학술탑 콘텐츠·런타임·CSS·이야기 query key와 `cwt-build`를 함께 갱신한다.

## 6. 남은 게이트

- G5: 커밋·푸시 뒤 Pages CI 전체 통과와 라이브 `cwt-build`, 빈 저장·기존 저장·진행 중 저장 확인
- G6: iPhone 13 mini Safari에서 주소창 펼침·접힘, 첫 입장, 단어 카드, 오답·되돌리기, 완료·재플레이·새로고침, 가장 긴 02 상태 확인
- Slice B: 03 `果然／竟然`, 02·03 병렬 선수 조건, 04 `反而`
- Slice C: 05 종합, 결과 이야기, 첫 연구 묶음 milestone

따라서 현재 `🧪`는 Slice A에만 적용한다. 첫 연구 묶음 전체와 학술탑 전체를 완료 상태로 올리지 않는다.
