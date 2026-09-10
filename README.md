# chinese-word-tactics

번체 중국어 B1–B2 어휘를 작은 전술 스테이지와 문맥형 의뢰로 익히는 모바일 우선 웹게임.

## 현재 상태

- 기준 버전: **v0.5 월드맵**
- 목표 기기: iPhone 13 mini Safari 세로 화면
- 배포: GitHub Pages
- 현재 구현: 튜토리얼 `出發` 6판 + 월드맵 + 자유/권장/잠금 지역 상태
- 다음 개발 목표: **v0.6 關口鎮 1차 묶음**
- 바로 다음 판: `進入 / 退出`

진행 상황은 [`docs/DEVELOPMENT-STATUS.md`](./docs/DEVELOPMENT-STATUS.md)에서 관리한다.

## 핵심 원칙

- 단어의 뜻을 이용해 판을 푼다.
- 단어 카드는 언제든 무료로 확인할 수 있다.
- 시간 제한, 목숨, 별점, 반복 파밍을 두지 않는다.
- 하나의 정답 경로보다 여러 해결법을 허용한다.
- 튜토리얼 이후에는 월드맵에서 마을 진행 순서를 직접 고른다.
- 추천 경로와 실제 잠금 조건을 구분한다.

## 현재 구조

- `index.html` — 게임 진입점과 전술/월드 화면 셸
- `src/app.js` — 튜토리얼 진행, 월드 상태, 화면 전환
- `src/content.js` — 현재 런타임 단어·스테이지·월드 메타데이터
- `src/styles.css` — 전술 화면 스타일
- `src/world.css`, `src/view.css` — 월드 화면과 뷰 전환 스타일
- `legacy/tutorial-v03.html` — 기존 튜토리얼 기준선 보존본
- `docs/` — 진행·구현·상황판 문서
- `data/` — 앞으로 옮길 어휘·월드·스테이지 원자료 위치
- `.github/workflows/deploy.yml` — GitHub Pages 배포 및 JavaScript 문법 검사

## 완료된 기반 작업

1. 기존 튜토리얼 6판을 독립 저장소로 이전했다.
2. GitHub Pages에서 iPhone Safari 직접 플레이를 확인했다.
3. iframe 보정 구조를 제거하고 런타임을 분리했다.
4. 튜토리얼 완료 뒤 월드맵을 연결했다.
5. `關口鎮 / 工坊村 / 市集鎮` 자유 지역, `邊境村 / 議會鎮` 권장 지역, `研究城` 잠금 지역을 표시한다.

기존 실험판은 `winterrainlee.github.io/word-game/`에 당분간 보존한다.
