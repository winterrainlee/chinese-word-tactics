# 학술탑 Slice A 구현 기록 v0.1

> 상태: `🧪` G3 구현·지역 G4 자동검사 완료 / G5 Pages·G6 iPhone 승인 대기
> 구현일: 2026-09-25
> 빌드: `2026-09-25-academic-tower-slice-a2`
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
- 01에서는 문장을 두 의미 덩어리로 나누고 `卻` 뒤 판단을 최종 중심으로 남긴다.
- 02에서는 완결된 두 기록을 `然而`로 연결하고, 앞 기록을 지우지 않으면서 최종 결론을 뒤 기록에 맞춰 갱신한다.
- 01 뒤의 이야기까지 본 뒤 허브가 열리며, 01은 다시 연구, 02는 첫 연구, 03은 다음 slice로 표시된다.
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

01의 두 절단 선택은 모두 같은 의미 경계 `before-marker`로 정규화한다. 쉼표와 `卻` 앞 가운데 하나만 유일한 문자 위치 정답으로 강제하지 않는다. 앞 정보만 중심으로 확정하면 완료되지 않으며, 되돌리거나 뒤 중심을 다시 선택해 복구할 수 있다.

02는 다음 네 상태를 분리한다.

- 뒤 기록을 펼쳤는가
- 두 기록을 단순 추가로 볼지 대조로 볼지
- 현재 중심이 앞 기록인지 뒤 기록인지
- 최종 결론을 회복 완료로 볼지 아직 정상 아님으로 볼지

`대조 + 뒤 기록 중심 + 아직 정상 아님`을 명시적으로 확정해야 완료된다. 단순 추가나 회복 완료를 고르면 그 읽기가 만드는 결론을 피드백으로 남기고 같은 판에서 다시 고칠 수 있다.

## 4. 저장 경계

- 첫 방문 완료: `academic-tower-entered`
- 01·02 첫 플레이 완료: 기존 `completedStages`
- 절단 위치, 관계 선택, 오답, 작업대 중간 상태: 전술 저장 안에서만 유지
- 재플레이: 본편 완료·milestone·마지막 본편 위치를 바꾸지 않음
- 새로고침: 완료 직전 인라인 완료 상태와 완료 뒤 학술탑 허브 복귀를 복원
- 묶음 milestone `academic-tower-turn-foundation`: Slice C 전까지 만들지 않음
- 탑 전체 완료 milestone: 만들지 않음

## 5. 자동검사 증거

추가한 계약은 다음을 고정한다.

- 01의 복수 절단 허용, 오답, 복구, 완료 판정
- 02의 단순 추가·잘못된 결론 오답과 대조 결론 복구
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

2026-09-25 기준 전체 게이트에서 Node 회귀 294개, 콘텐츠·후보·생애주기·상태 문구·이야기 발음 교차검사, 기존 지역과 학술탑의 브라우저 회귀가 모두 통과했다. 브라우저 캡처 이름은 `academic-tower-01-complete-375x812.png`, `academic-tower-hub-<viewport>.png`, `academic-tower-02-<viewport>.png`다. CI에서도 두 smoke를 명시적으로 실행하고 캡처를 UX artifact에 포함한다.

첫 Pages 배포에서는 변경된 기반 콘텐츠 파일 `src/content.js`에 cache key가 없어 이전 `research-city` 정의가 재사용되는 문제가 있었다. Slice A2에서 `v=20260925-academictower2`를 부여하고 이를 자동검사 계약에 추가했다.

## 6. 남은 게이트

- G5: 커밋·푸시 뒤 Pages CI 전체 통과와 라이브 `cwt-build`, 빈 저장·기존 저장·진행 중 저장 확인
- G6: iPhone 13 mini Safari에서 주소창 펼침·접힘, 첫 입장, 단어 카드, 오답·되돌리기, 완료·재플레이·새로고침, 가장 긴 02 상태 확인
- Slice B: 03 `果然／竟然`, 02·03 병렬 선수 조건, 04 `反而`
- Slice C: 05 종합, 결과 이야기, 첫 연구 묶음 milestone

따라서 현재 `🧪`는 Slice A에만 적용한다. 첫 연구 묶음 전체와 학술탑 전체를 완료 상태로 올리지 않는다.
