# data

게임의 원자료와 편집 데이터를 코드와 분리해 관리한다.

## 예정 구조

- `vocab/` — 핵심 어휘, 게임 편집층, 어휘 스키마
- `world/` — 월드와 마을 연결 정보
- `stages/` — 튜토리얼 및 마을별 스테이지 정의

초기 이전에서는 기존 튜토리얼 실행 기준선을 먼저 확보한다. 기존 저장소의 다음 자료는 이어지는 데이터 이전 단계에서 원문을 보존해 옮긴다.

- `CORE-VOCAB-v0.1.md`
- `core-vocab-v0.1.json`
- `VOCABULARY-SCHEMA.md`
- `word-game-overlay.json`
- `POST-TUTORIAL-WORLD-v0.1.md`
- `INITIAL-PROGRESSION-PLAN-v0.1.md`

TBCL 공식 원자료와 게임 편집층은 계속 분리한다.

## 학술탑 담화 표지 후보

- `tbcl-discourse-candidates-2025-04.json` — 공식 2025-04 TBCL 4·4*·5급 어휘 4,070개와 공식 4·4*·5급 문법점 255개를 전수검토해 남긴 원자료 후보 221개. 공식 표제·등급·문법점 번호만 보존한다.
- `academic-tower-discourse-candidates-v0.1.json` — 위 원자료 후보의 학술탑 기능 분류, TBCL 1~3급 선수 표현, `core / secondary / later` 우선순위, 준비도 묶음, 첫 연구 묶음의 안정 ID·선수 그래프와 무제한·무격파 진행 정책을 담는 게임 편집층이다.

두 파일은 아직 모바일 런타임에서 직접 불러오지 않는다. 콘텐츠 작성용 자료이며 `node tools/academic-tower-candidate-audit.cjs`로 원자료·편집층 참조, 우선순위 분할, 선수 그래프와 첫 연구 묶음 계약을 검사한다.
