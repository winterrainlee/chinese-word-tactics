# chinese-word-tactics

번체 중국어 B1–B2 어휘를 작은 전술 스테이지와 문맥형 의뢰로 익히는 모바일 우선 웹게임.

## 현재 상태

- 기준 버전: v0.3 튜토리얼 「出發」 이전 중
- 목표 기기: iPhone 13 mini Safari 세로 화면
- 배포: GitHub Pages 예정
- 개발 브랜치: `bootstrap-v0.4`

## 핵심 원칙

- 단어의 뜻을 이용해 판을 푼다.
- 단어 카드는 언제든 무료로 확인할 수 있다.
- 시간 제한, 목숨, 별점, 반복 파밍을 두지 않는다.
- 하나의 정답 경로보다 여러 해결법을 허용한다.
- 튜토리얼 이후에는 월드맵에서 마을 진행 순서를 직접 고른다.

## 현재 디렉터리

- `index.html` — 이전 중인 게임 진입점
- `legacy/tutorial-v03.html` — 기존 튜토리얼 보존본
- `docs/` — 게임·진행·구현 기획
- `data/` — 어휘·월드·스테이지 원자료
- `.github/workflows/deploy.yml` — GitHub Pages 배포

## 이전 목표 v0.4

1. 기존 튜토리얼 6판의 동작을 독립 저장소에서 보존한다.
2. GitHub Pages에서 직접 실행한다.
3. iframe 보정 구조를 제거하고 코드 책임을 분리한다.
4. 이후 월드맵과 關口鎮 구현으로 확장한다.

기존 실험판은 `winterrainlee.github.io/word-game/`에 당분간 보존한다.
