# v0.5 월드 연결 메모

기준: `INITIAL-PROGRESSION-PLAN-v0.1.md`, `POST-TUTORIAL-WORLD-v0.1.md`

이번 단계는 튜토리얼 이후 월드 선택 구조를 실제 UI에 연결한다.

- `關口鎮 / 工坊村 / 市集鎮`: 자유 선택
- `邊境村 / 議會鎮`: 입장 가능하지만 권장 선행 마을 표시
- `研究城`: `工坊村` 핵심 시험 완료 전 잠금
- 월드 방문 상태는 `chinese-word-tactics-world-v1`에 저장
- 튜토리얼 저장 키 `chufa-tutorial-v03`는 유지
- 실제 마을 의뢰는 다음 단계에서 추가

`src/content.js`는 현재 실행에 필요한 튜토리얼/월드 콘텐츠 정의를 담고, `src/app.js`는 진행과 상호작용을 담당한다.
