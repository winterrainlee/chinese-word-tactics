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
