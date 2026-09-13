# 안티그래비티 콘텐츠 감사 호출 가이드 v0.1

> 작성일: 2026-09-13
> 적용 대상: `chinese-word-tactics`의 번체 중국어·한국어 제목, 대사, 목표, 상태 메시지, 단어 카드, UI 문구에 대한 읽기 전용 2차 검수
> 목적: 안티그래비티 CLI를 안전하게 호출하고, 빈 성공 응답·권한 거부·과잉 수정 제안을 걸러내는 공통 절차를 정한다.

---

## 1. 역할과 책임

안티그래비티는 독립적인 2차 검토자다. 최종 판단자나 자동 수정기가 아니다.

- 안티그래비티에는 범위가 분명한 읽기 전용 검토를 맡긴다.
- 저장소 기준 문서, 현재 사용자 노출 문구, 기존 감사 결과만 제공한다.
- 안티그래비티의 성공 메시지나 심각도 판정만으로 수정 여부를 정하지 않는다.
- Codex가 모든 인용을 실제 파일과 대조하고, 설계 의도·런타임 덮어쓰기·테스트 상태를 확인한다.
- 구현은 사용자가 별도로 승인한 범위에서만 진행한다.

윤문 기준의 우선순위는 다음과 같다.

1. 현재 런타임과 테스트가 보여주는 실제 사용자 경험
2. [한국어 제목 및 시나리오 작성·윤문 가이드](KOREAN-TITLE-SCENARIO-GUIDE-v0.1.md)
3. 최신 구역별 설계와 [세계관 및 이름짓기 원칙](WORLD-NAMING-PRINCIPLES-v0.1.md)
4. 안티그래비티의 제안

---

## 2. 기본 호출 도구

Codex의 `agy-delegate` 스킬에 포함된 래퍼를 사용한다.

```bash
python3 <AGY_DELEGATE_SKILL_DIR>/scripts/agy_delegate.py \
  --prompt-file /private/tmp/agy-copy-audit.txt \
  --workdir /private/tmp \
  --effort high \
  --timeout 900
```

- 짧고 판정 기준이 분명한 검토는 `--effort low` 또는 `medium`을 사용할 수 있다.
- 전 구역 시나리오처럼 문맥이 크고 연결부까지 읽어야 하는 감사는 `high`를 사용한다.
- 읽기 전용 감사에는 `--allow-edits`를 붙이지 않는다.
- `--dangerously-skip-permissions`는 사용하지 않는다.
- 새 감사에는 이전 대화를 이어받는 `--continue`를 사용하지 않는다.

프롬프트 계약 파일은 UTF-8 임시 파일로 만들고, Codex에서는 `apply_patch`로 작성한다. 사용자 입력이나 저장소 내용을 셸 문자열로 직접 보간하지 않는다.

---

## 3. 현재 확인된 headless 권한 제약

2026-09-13 기준 래퍼는 안티그래비티를 다음 성격으로 실행한다.

- `--sandbox`
- `--disable-slash-commands`
- `--output-format json`
- `--print`

이 조합의 headless 세션은 도구 승인 질문을 사용자에게 표시할 수 없다. 사전에 허용되지 않은 도구는 자동 거부된다.

실제로 확인된 실패는 다음 두 가지다.

| 요청 | 결과 | 증상 |
|---|---|---|
| 감사 스크립트 실행 | `RunCommand` 거부 | `status: SUCCESS`지만 `response`가 비고 `denied_actions`에 `command`가 남음 |
| 저장소 파일 읽기 | `ViewFile` 거부 | `status: SUCCESS`지만 `response`가 비고 `denied_actions`에 `read_file`이 남음 |

CLI의 `--mode plan`도 이 래퍼 조합에서는 해결책이 아니다. `--disable-slash-commands`가 켜져 있으면 plan 모드가 효력을 내지 않는다는 경고가 확인됐다.

다음 방식으로 우회하지 않는다.

- 저장소 전체에 대한 영구 `read_file(...)` allow-rule 추가
- 전역 설정에 광범위한 읽기·쓰기 자동 승인 추가
- 샌드박스 해제
- `--dangerously-skip-permissions` 사용
- 리뷰를 이유로 홈 디렉터리나 다른 저장소까지 범위 확대

---

## 4. 기본 해결책: 선별 증거 인라인 전달

콘텐츠 감사에서는 안티그래비티가 저장소를 직접 읽게 하지 않는다. Codex가 먼저 검수 범위의 자료를 읽고, 비밀·무관한 파일을 제외한 텍스트만 프롬프트 안에 넣는다.

### 4.1 포함할 자료

최소 증거 묶음은 다음과 같다.

1. 윤문 기준 문서 전문
2. 필요할 때 이름짓기·상태 언어 기준의 관련 부분
3. 현재 로드되는 `*content*.js`, `*journey-content*.js`, 결과 분기 콘텐츠
4. 런타임의 사용자 노출 문자열과 접근성 문구
5. `tools/story-handoff-audit.cjs`와 `tools/status-language-audit.cjs`의 사전 실행 결과
6. 파일명, 줄 번호, 스테이지·이야기 ID

다음은 포함하지 않는다.

- `legacy/`
- 보관 문서와 현재 로드되지 않는 초안
- 인증 정보, 환경 변수, 개인 설정 파일
- 이미지 바이너리와 생성 자산
- 리뷰와 무관한 저장소 기록

### 4.2 증거 만들기

1. `rg`로 사용자 노출 문자열의 실제 위치를 찾는다.
2. `nl -ba` 또는 동등한 읽기 방식으로 파일명과 줄 번호를 보존한다.
3. 로컬 감사 도구는 Codex가 먼저 실행한다.
4. 결과를 임시 계약 파일에 `=== EMBEDDED EVIDENCE ===` 구역으로 붙인다.
5. 안티그래비티가 별도 파일을 읽을 필요가 없도록 필요한 문맥을 완결한다.

증거 묶음이 너무 크면 구역별로 나눈다. `길목`, `장인골`, `장터`처럼 독립적으로 검증 가능한 단위가 기본이다. 서로 이어지는 완료문과 후일담은 같은 묶음에 둔다.

### 4.3 작업 디렉터리

인라인 증거 방식에서는 `--workdir /private/tmp`를 사용한다.

- 저장소를 직접 탐색할 이유를 없앤다.
- 읽기 권한 요청을 유발할 가능성을 줄인다.
- 안티그래비티가 전달받은 증거 밖의 내용을 사실처럼 인용하지 못하게 한다.

---

## 5. 작업 계약 템플릿

```text
You are performing a read-only editorial review of the currently shipped
Traditional Chinese and Korean copy for chinese-word-tactics.

EXECUTION RULES
- All source evidence is embedded below.
- Do not call ViewFile, ReadFile, RunCommand, shell, search, URL, or other tools.
- Do not ask for permissions and do not modify anything.
- Analyze only the embedded evidence and return a non-empty final response.

OBJECTIVE
- Review Traditional Chinese naturalness and difficulty.
- Review Korean naturalness, speaker voice, and terminology.
- Find repetition, inconsistency, and solution leaks.
- Give special attention to unfamiliar Korean terms.

CONSTRAINTS
- Preserve learning targets and puzzle mechanics.
- Required Chinese should normally stay around A2 to early B1.
- Do not rewrite official pronunciation, level, or source metadata.
- Separate definite defects from optional style alternatives.

DELIVERABLE IN KOREAN
A. Must-fix findings
B. Recommended improvements
C. Optional choices
D. Unfamiliar Korean terminology
E. Journey handoff findings
F. Coverage summary

FOR EVERY FINDING
- severity and category
- exact file and stable locator
- exact current text
- proposed replacement
- reason tied to the guide and gameplay context

ACCEPTANCE CHECKS
- Every quoted current string exists in the evidence.
- Do not change a mechanic or learning target without warning.
- Do not classify intentional pedagogical repetition as a defect without context.
- Return a partial explanation rather than an empty response if anything is unclear.

=== EMBEDDED EVIDENCE ===
...
```

계약에는 특히 다음 문장을 넣는다.

> `Never return an empty response.`

권한 거부 뒤에도 `status: SUCCESS`가 반환될 수 있으므로, 빈 결과를 정상 완료로 오인하지 않기 위한 방어다.

---

## 6. 결과 판정

래퍼 종료 뒤 다음 네 항목을 모두 확인한다.

1. 프로세스 종료 코드가 `0`인가.
2. JSON의 `status`가 `SUCCESS`인가.
3. `response`가 공백이 아닌 실제 검토문인가.
4. `denied_actions`가 없거나, 결과 완결성에 영향을 주지 않는가.

다음 결과는 실패다.

```json
{
  "status": "SUCCESS",
  "response": "",
  "denied_actions": [
    { "action": "read_file" }
  ]
}
```

성공 응답이어도 인용 파일·문구·줄 번호가 실제 증거와 맞지 않으면 그 항목은 폐기한다.

---

## 7. 제안 검증 순서

각 제안은 다음 순서로 검증한다.

### 7.1 실제 노출 여부

- 원본 데이터가 이후 로드 파일에서 덮어써지는가.
- 완료문이 런타임 예외 처리로 대체되는가.
- 현재 여정에 포함된 콘텐츠인가.
- 재플레이와 첫 플레이에서 같은 문구가 보이는가.

### 7.2 설계 의도

- 조건 공개가 정답 누설인지, 퍼즐 판단에 필요한 목표 상태인지 구분한다.
- 한국어 단독 문구가 번역 누락인지, 즉시 이해해야 하는 조작 안내인지 구분한다.
- 낯선 용어가 실수인지, 세계관에서 의도적으로 만든 이름인지 확인한다.

### 7.3 일관성

- 같은 용어를 제목, 대사, 상태, 접근성 문구, 테스트, 최신 설계 문서까지 검색한다.
- 중국어 학습어와 공식 발음·등급·출처는 한국어 윤문 때문에 바꾸지 않는다.
- 구형 기본 데이터가 현재 마이그레이션 층에서 이미 대체되는지 확인한다.

### 7.4 자동검사

```bash
node tools/status-language-audit.cjs
node tools/story-handoff-audit.cjs
node --test tests/*.test.cjs
```

유사도 감사의 `REVIEW`는 실패가 아니라 사람이 읽을 후보 목록이다. 높은 유사도가 교육적 회고인지 불필요한 반복인지 직접 판단한다.

---

## 8. 자주 생기는 오판

| 오판 | 확인 방법 |
|---|---|
| 데이터의 중국어 완료문을 번역 누락으로 단정 | 완료 UI에서 별도 한국어 문구로 대체되는지 런타임 확인 |
| 목표 조건 공개를 정답 누설로 단정 | 퍼즐이 목표 상태를 찾는 판인지, 주어진 목표에 맞추는 판인지 설계 확인 |
| 한국어 단독 조작 안내를 언어 UX 위반으로 단정 | `STATUS-LANGUAGE-UX`의 조작·제약 예외와 감사 결과 확인 |
| 구형 지역명을 현재 사용자 노출명으로 단정 | 최신 월드 마이그레이션 층의 패치 확인 |
| 번체 문자열을 한국어 한자어처럼 독음 | 해당 문자열이 중국어 학습층인지 한국어 문장 속 미번역 조각인지 구분 |

오판을 발견하면 보고서 전체를 버리지 않는다. 정확한 제안만 남기고 심각도를 다시 매긴다.

---

## 9. 완료 체크리스트

- [ ] 감사 범위와 제외 범위를 계약에 적었다.
- [ ] 기준 문서와 현재 사용자 노출 문구만 증거로 넣었다.
- [ ] 명령 실행과 파일 읽기를 안티그래비티에 요구하지 않았다.
- [ ] 샌드박스와 읽기 전용 원칙을 유지했다.
- [ ] 응답이 비어 있지 않고 권한 거부가 없는지 확인했다.
- [ ] 모든 인용을 실제 소스에서 다시 검색했다.
- [ ] 런타임 덮어쓰기와 설계 의도를 확인했다.
- [ ] 확정 용어 변경은 관련 문서와 테스트까지 함께 반영했다.
- [ ] 감사 도구와 전체 테스트를 실행했다.
- [ ] 안티그래비티의 결과와 Codex의 최종 판정을 구분해 기록했다.

안티그래비티 감사의 완료 기준은 보고서를 받는 데 있지 않다. 검증 가능한 제안만 남기고, 게임의 학습 목표와 플레이 경험을 보존한 상태로 다음 수정 판단에 넘겨야 완료다.
