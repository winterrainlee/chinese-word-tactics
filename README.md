# chinese-word-tactics

번체 중국어 B1–B2 어휘를 작은 전술 스테이지와 문맥형 의뢰로 익히는 모바일 우선 웹게임.

## 현재 상태

- 현재 기반: **v1.0 릴리스 후보 — 물길마을의 첫 여행**
- 목표 기기: iPhone 13 mini Safari 세로 화면
- 배포: GitHub Pages
- 현재 구현: 튜토리얼 6판 + 물길마을 도착 흐름 + 길목 G1~G7 + 장인골 W1~W7 + 장터 M1~M8 + 여관 방 MVP + 1장 결말 + 북쪽 숲 첫 자유 의뢰 + 설정의 저장 내보내기·복원
- v1.0 목표: **물길마을의 첫 여행** — 세 갈래의 완결, 돌아올 여관, 첫 자유 의뢰
- 바로 다음 단계: **전 콘텐츠 최종 윤문**. 이후 빈 저장부터 1장 결말과 첫 자유 의뢰까지 대표 경로를 다시 완주하고, 다른 구역 순서·재플레이·백업 복원까지 최종 회귀 검사한다(Q07).

진행 상황은 [`docs/DEVELOPMENT-STATUS.md`](./docs/DEVELOPMENT-STATUS.md)에서 관리한다.
1장 결말의 최신 이야기 기준은 [`docs/CHAPTER1-FINALE-DESIGN-v0.1.md`](./docs/CHAPTER1-FINALE-DESIGN-v0.1.md), 자유 의뢰와 게시판의 최신 기준은 [`docs/QUEST-BOARD-DESIGN-v0.2.md`](./docs/QUEST-BOARD-DESIGN-v0.2.md)다.

## 핵심 원칙

- 단어의 뜻을 이용해 판을 푼다.
- 단어 카드는 언제든 무료로 확인할 수 있다.
- 시간 제한, 목숨, 별점, 반복 파밍을 두지 않는다.
- 하나의 정답 경로보다 여러 해결법을 허용한다.
- 튜토리얼 이후에는 물길마을의 세 구역 진행 순서를 직접 고른다.
- 추천 경로와 실제 잠금 조건을 구분한다.
- 이야기 진행은 가상의 날짜 경과보다 **플레이 결과와 세계 상태 변화**로 연다.

## 현재 구조

- `index.html` — 게임 진입점과 전술/월드/설정 화면 셸
- `src/app.js` — 튜토리얼 진행, 월드 상태, 화면 전환
- `src/content.js` — 기존 튜토리얼·길목 단어와 스테이지 데이터
- `src/workshop-content.js` — 장인골 단어와 스테이지 데이터
- `src/workshop-runtime.js`, `src/workshop-runtime.css` — 장치를 직접 조작하는 장인골 상태 런타임
- `src/market-content.js`, `src/market-runtime.js` — 장터 스테이지와 자원·거래·분배 런타임
- `src/save-data.js` — 버전이 있는 로컬 저장 백업 형식, 검증, 복원
- `src/settings-runtime.js`, `src/settings.css` — 설정 화면과 저장 내보내기·복원·초기화
- 여관 관련 런타임·자산 — 방 진입과 사물 상호작용 MVP
- `src/styles.css` — 전술 화면 스타일
- `src/world.css`, `src/view.css` — 월드 화면과 뷰 전환 스타일
- `legacy/tutorial-v03.html` — 기존 튜토리얼 기준선 보존본
- `docs/` — 진행·구현·상황판 문서
- `data/` — 어휘·월드·스테이지 원자료 위치
- `.github/workflows/deploy.yml` — GitHub Pages 배포 및 JavaScript/브라우저 회귀 검사

## 현재까지 완료된 큰 흐름

1. 기존 튜토리얼 6판을 독립 저장소로 이전하고 GitHub Pages에서 iPhone Safari 직접 플레이를 확인했다.
2. 튜토리얼 완료 뒤 이야기·여정과 물길마을 그림지도를 연결했다.
3. 같은 물길마을 안의 `길목 / 장인골 / 장터`를 자유롭게 고르게 했다.
4. 길목 G1~G7에서 길·거리·경로·장애물·수레·추종 흐름을 완결하고 `gate-core`를 기록한다.
5. 장인골 W1~W7에서 상태·연결·조건·파생 결과·손상·수리 흐름을 완결하고 `workshop-core`를 기록한다.
6. 장터 M1~M8에서 필요·수량·교환·구매·선택·분배 흐름을 완결하고 `market-core`를 기록한다.
7. 장터 진행 중 여관을 해금하고, 방 열쇠와 여관 방 MVP를 연결했다.
8. 세 core가 모두 모인 뒤 **여관 장소 문구 변화 → 여관 합류 장면 → 방에서 1장 결말 → 여관 주인의 첫 직접 의뢰**를 구현했다.
9. 여정에 **자유 의뢰 · 물길마을 주변 → 북쪽 숲 → 개별 의뢰** 구조를 추가해 이후 북쪽 숲 의뢰가 서로 독립적으로 쌓이게 했다.
10. 제목 화면과 게임 메뉴에서 들어가는 **설정**을 열고, 현재 게임이 소유한 저장 영역만 버전이 있는 JSON으로 내보내고 검사·미리보기 뒤 복원할 수 있게 했다. iPhone 13 mini Safari에서도 실제 파일 내보내기→선택→복원→진행 유지까지 확인했다.

기존 실험판은 `winterrainlee.github.io/word-game/`에 당분간 보존한다.
