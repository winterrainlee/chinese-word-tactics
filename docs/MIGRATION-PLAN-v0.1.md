# 신규 저장소 이전 계획 v0.1

## 목표

`winterrainlee.github.io/public/word-game/`의 실험판을 독립 저장소로 옮기되, 기존 튜토리얼 v0.3의 동작을 먼저 보존한다.

## 단계

1. 기존 튜토리얼 6판을 `legacy/tutorial-v03.html`에 보존한다.
2. 루트 `index.html`에서 기존 보정 스크립트를 적용해 현재 플레이 감각을 유지한다.
3. GitHub Pages 배포를 연결해 새 저장소 단독으로 실행 가능한지 확인한다.
4. 이후 iframe 보정 구조를 제거하고 `app / engine / views / storage / learning` 책임으로 분리한다.
5. 월드맵을 추가하고 `關口鎮`을 첫 신규 지역으로 구현한다.
6. `工坊村`, `市集鎮` 순으로 확장한다.

## v0.4 완료 조건

- 새 저장소 단독으로 튜토리얼 6판이 실행된다.
- 이동, 위험 회피, 기다리기, 살펴보기, 되돌리기, 단어 카드가 유지된다.
- GitHub Pages 하위 경로에서 자원 경로가 깨지지 않는다.
- 기존 `winterrainlee.github.io/word-game/`는 삭제하지 않는다.

## 다음 구조

```text
index.html
src/
  app.js
  engine.js
  views.js
  storage.js
  learning.js
  styles.css
data/
  vocab/
  world/
  stages/
docs/
legacy/
```

현재 `legacy/`는 비교 기준이며 최종 구조가 아니다.
