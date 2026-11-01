# 여관 C 레이어 시험 v0.1

2026-11-01. 목적은 완성된 여관 제작이 아니라 같은 공간이 사건을 기억하는 표현 구조 검증이다.

- 체험: https://winterrainlee.github.io/chinese-word-tactics/inn-layer-test/
- 자산·데이터: `inn-layer-test/assets.html`, `scene.json`, `assets/manifest.json`
- 동일 조건 비교: `inn-layer-test/review.html` (375×812 / 360×640 CSS viewport)
- 기준: main `2dbc02bdb60f964c80be6e53500b4c97e2760c37`, 기존 `inn-style-test/assets/lobby-c.webp`
- 기존 A/B/C, `src/`, 본편 이야기·해금·저장 형식은 수정하지 않는다.

## 공간과 합성

원래 C를 참조하여 변하는 사물과 주인을 지운 고정 배경을 제작했다. 벽·창문·계단·카운터·식탁·문·고정 화분·햇빛을 유지한다. 분리 과정은 원본 픽셀의 완전한 추출이 아니라 재그림이므로 작은 천과 윤곽에 차이가 있다.

9개 투명 WebP(주인, 게시판, 흰 종이, 벽돌색 종이, 주전자, 찻잔, 장부, 젖은 짐, 물기)를 독립 생성했다. 실제 알파 채널이 있으며 모서리는 투명하다. PNG에서 WebP로 형식만 인코딩했다. 전체 배경은 상태 전환 때 같은 DOM 노드와 같은 URL로 유지한다. 흰 종이와 벽돌색 종이는 각각 첫 게시물과 새 의뢰의 안정적 사물 ID로 배치한다.

원본 `counter-front.svg`는 고정 배경 WebP를 내장하여 카운터 앞면만 clipPath로 표시한다. 모바일 실행판은 같은 마스크 좌표를 CSS clip-path로 적용하고 이미 불러온 배경 파일 URL을 재사용한다. 배경과 같은 좌표·픽셀을 재사용하므로 전경 경계에서 이중 색 차이가 생기지 않는다. 생성형 주인의 몸 아랫부분을 가리고 기물은 그 위에 놓는다. 카운터는 상태별 배경 교체가 아니다.

|순서|내용|
|---|---|
|0|고정 구조|
|5|물기와 발자국|
|10–13|게시판과 각 게시물|
|20|여관 주인|
|30|카운터 전경|
|40–42|차 기물·장부·젖은 짐|
|110–131|독립 터치 버튼, 숫자가 높을수록 우선|

대화창은 장면 바깥 하단의 독립 DOM이다. 배경을 덮는 모달을 사용하지 않는다. 중요한 장면에는 기존 StoryRuntime을 시험 어댑터로 호출한다. 소년의 방은 기존 WorldInn을 그대로 호출하고 문으로 로비에 복귀한다. 출입문은 독립적인 ‘여관 문앞’ 시험 화면으로 이동한다. 본편 월드맵 이동이나 진행 연결은 하지 않는다.

## 구성 데이터와 사건

`scene.json`: assets(그림), placements(화면 투영 위치), conditions(표시 조건), interactions(대사 종류·히트 영역·우선순위), objects(안정적 ID·참조·층·z)를 분리한다. ID는 `inn.lobby.*`이며 14개 사물에 중복 없이 고정한다. 좌표는 C의 4:5 그림에 대한 백분율이며 실제 세계 좌표/길찾기 데이터와 혼용하지 않는다.

|board|rain|newQuest|결과|
|---|---|---|---|
|0|0|0|첫 방문, 평상시|
|1|0|0|게시판과 첫 종이|
|0|1|0|게시판 없이 젖은 짐과 물기|
|1|1|0|게시판 + 비의 흔적|
|0|0|1|새 의뢰 대기, 종이 미표시|
|0|1|1|비의 흔적, 새 의뢰 대기|
|1|0|1|첫 종이 + 새 의뢰 종이|
|1|1|1|두 종이 + 비의 흔적|

본편 첫 의뢰의 게시판 해금 milestone과 큰비를 하나의 사건으로 합치지 않는다. 시험의 boolean은 본편 진행 읽기/쓰기가 없는 메모리 전용 fixture다. 월백버섯 수령 문구는 첫 의뢰의 맥락을 확인하기 위한 예시이고, 수건 배달은 시험 전용 새 의뢰 문구다. 실제 수락·보상·완료를 실행하지 않는다. 기본 URL 새로고침은 첫 방문으로, query가 있는 검증 URL은 해당 fixture로 돌아간다.

개발 설정에서 세 사건, 전체 레이어, 개별 자산을 독립적으로 켜고 끈다. 숨겨진 사물은 터치도 비활성화한다. 읽던 게시판을 제거하면 대화도 닫힌다. ‘기존 C 보기’는 비교용이고 이때 상호작용은 비활성이다.

## 검증

- `node tools/verify-content.cjs`: 통과. 단위 검사 368개와 콘텐츠/UX/이야기 감사를 포함한다.
- `tests/inn-layer-model.test.cjs`: 8개 조합, 안정 ID, 참조 무결성, 독립 숨김과 비변이 검사.
- `tests/smoke_inn_layers.py`: GitHub CI에서 375×812 및 360×640 모바일/touch 컨텍스트. 모든 상태의 추가·제거, 같은 배경 노드/URL 유지, 최소44px 및 중앙점 겹침 순서, 기물 반응, 중국어/한국어, 방·이야기·문밖 왕복, 저장 API 쓰기 0을 검사한다.
- 클라우드 Chrome의 고정 크기 iframe에서도 시각 검수. 360×640에서 식탁 중앙 터치가 찻잔에 가려지는 문제를 발견하여 식탁 오른쪽으로 영역을 분리했다.
- 배포와 CI의 최종 결과는 아래 배포 기록에 확정했다. iPhone Safari 실제 기기 최종 승인은 별도다.

## 본편 적용 전

1. 투명 기물의 선 굵기·그림자·비례를 원본 C에 더 맞춘 수작업 정리. 작은 찻잔/장부는 작은 화면에서 식별이 약하므로 세부 묘사보다 실루엣을 강화한다.
2. 물기와 젖은 짐의 접지 그림자를 실제 날씨 조명에 맞게 조정. 현재는 오후 햇빛이 유지되는 ‘비가 그친 뒤’로 해석한다.
3. 주인/향후 손님 포즈별 가림 마스크와 위치 규칙 확정. 현재 주인 한 명으로만 검증했다.
4. 본편 milestone→표시 상태의 읽기 전용 어댑터, 여러 게시물의 선택 UI, 실제 의뢰 데이터 연결은 별도 설계/승인 후 적용한다.
5. Safari 주소창·safe area·글자 확대·VoiceOver와 실제 손가락 조작 검수. 360×640에서는 그림 폭248px로 축소해 공간을 유지하므로 상세 사물 인지가 타협점이다.

## 배포 기록

2026-11-01 GitHub Actions [41303621946](https://github.com/winterrainlee/chinese-word-tactics/actions/runs/41303621946) 전체 성공 및 Pages 배포 성공. 배포 코드 커밋 `7b8ddd4ba43995cde0d81108c53363f8a3c8c3cd`. 기존 본편 브라우저 회귀와 A/B/C 검사, 새 레이어 모바일 검사 모두 통과. 공개 URL에서 모든 자산 로딩(data-ready=true), 3사건 전환, 중국어·한국어 대화, 기존 소년의 방 진입·복귀를 재확인했다. [공개 배포 증빙](../inn-layer-test/evidence/live-pages.jpg).

최종 결과 문서와 증빙만 후속 `[skip ci]` 커밋으로 기록한다. 실행 코드/배포 자산은 위에서 검증한 배포 커밋 그대로다. 실제 iPhone Safari 사용자 최종 승인은 대기 중이다.

## 비교 증빙

고정 크기 Chrome iframe의 같은 화면 구성으로 촬영했다. 실제 iPhone Safari 촬영은 아니다. CI의 별도 모바일 touch 컨텍스트 스크린샷은 Actions `ux-screenshots` artifact에도 보존된다.

- [첫 방문 / 게시판 / 큰비+새 의뢰](../inn-layer-test/evidence/states-375.jpg)
- [게시판 없는 큰비 / 게시판+비 / 새 의뢰](../inn-layer-test/evidence/independent-rain-375.jpg)
- [360×640 중국어·한국어 대화](../inn-layer-test/evidence/mobile-360-dialogue.jpg)
- [기존 C와 레이어 합성](../inn-layer-test/evidence/original-vs-layers.jpg)

구조 검증 결과: 기존 C의 공간 배치와 고정 조명을 유지하면서 사건별 사물만 독립적으로 바뀐다. 이 구성을 후속 실험의 기준으로 권장한다. 본편 적용 전에 위의 그림 정리와 실제 기기 검수를 거쳐야 한다.

## 로딩 정지 사용자 제보 대응 (2026-11-01)

실제 기기에서 ‘여관을 준비하는 중…’이 유지된다는 제보를 받았다. 해당 기기의 로그가 없으므로 정확한 원인은 미확정이다. 코드에서 숨겨진 SVG/WebP를 포함한 `img.decode()` 전체 대기를 무제한 수행하는 취약점을 확인했다. 그림 load/error + 15초 제한으로 바꾸고, 공간 데이터 요청도 15초 제한을 둔다. 초기 스크립트 누락/실행 오류는 외부 파일에 의존하지 않는 인라인 시작 감시기로 표시하며 재시도 버튼을 제공한다. 파일 버전 쿼리로 이전 실행 파일 캐시를 분리한다.

기존 Chrome 검사 외에 WebKit 모바일 검사를 배포 게이트에 추가했다. decode가 영원히 완료되지 않는 상황, 그림 요청 실패 후 재시도, 시작 스크립트 누락도 검사한다. 수정 커밋 `e6d773292b5152b2eef190f4185730c6f16d469c`, [CI 41305081154](https://github.com/winterrainlee/chinese-word-tactics/actions/runs/41305081154) 전체 성공 및 Pages 배포 완료. Chromium/WebKit 각각 375×812·360×640과 실패 복구 검사 통과. 공개 `inn-layer-test/?v=2`에서 버전2 스크립트, 로딩 완료 및 중국어/한국어 대화를 재확인했다. [공개 수정판 증빙](../inn-layer-test/evidence/loading-fix-live.jpg). 실제 사용자의 동일 기기 재확인은 별도다.

## 새 의뢰 쪽지 색 (2026-11-01)

첫 게시물은 기존 흰색 자산을 유지한다. 새 의뢰는 별도 투명 자산 `assets/notice-new-brick.webp`를 사용한다. `board && newQuest`일 때 벽돌색 쪽지가 추가되고, 새 의뢰를 끄면 그 쪽지만 사라진다. 큰비 상태와 독립이다.

이미지 편집 도구로 기존 쪽지를 참조해 제작했다. 최종 프롬프트: “Change ONLY the paper color to muted faded brick red / terracotta, around #B96C55 with warm lighter worn patches. Keep the paper silhouette, size, placement, transparent margins, nail, folds, dark ink marks, outline and soft shadows. Storybook retro RPG watercolor texture. Actual transparent background, no board or extra objects.”

배포 코드 `44ba197cec6c2e6f7624cee5573344a771a81019`. [CI 41312067887](https://github.com/winterrainlee/chinese-word-tactics/actions/runs/41312067887) 전체 성공 및 Pages 배포 완료. 공개 `inn-layer-test/?v=3&board=1&newQuest=1`에서 벽돌색 자산 로딩, 새 의뢰 OFF 시 해당 쪽지 제거와 흰색 유지, ON 시 복원을 확인했다. [공개 화면](../inn-layer-test/evidence/brick-note-live.jpg).

## 모바일 자산 최적화 (2026-11-01)

원본 `assets/*.webp`, `assets/counter-front.svg` 및 기존 C는 그대로 보존했다. `assets/mobile/`에 런타임 전용 WebP를 생성했다. 배경은 최대800×1000, 작은 사물은 최대 장면400×500에서 표시 크기의 3배를 기준으로 축소했다. 알파 채널을 유지하며 배경 quality82, 사물 quality86으로 인코딩한다. `scene.json`의 `source`가 원본, `src`가 실행용이다. 자산 페이지에서 둘 다 접근할 수 있다.

`python tools/build-inn-mobile-assets.py`로 재생성한다(Pillow 필요). 원본 SHA-256을 먼저 검증하고 원본에는 쓰지 않는다. `assets/mobile/manifest.json`에 크기·품질·해시·바이트를 기록한다.

|비교 범위|이전|최적화 후|
|---|---:|---:|
|첫 로딩 그림 파일 합계(중복 URL 제외)|1,354,443 bytes|105,738 bytes|
|원본 C 비교 그림|처음부터137,140 bytes 로딩|비교 버튼을 누를 때만 로딩|
|카운터 전경|배경을 내장한 SVG 별도 요청|모바일 배경 URL + 같은 클립 좌표 재사용|

첫 로딩 그림 파일 합계는 약92.2% 감소했다. 이는 압축된 파일 크기 비교이며 통신 상태·캐시·HTTP 압축을 포함한 실측 로딩 시간은 아니다. 숨겨진 상태용 작은 기물은 미리 불러와 전환 시 그림이 늦게 나타나지 않게 한다. 기존 무한 decode 대기 방지, 오류 표시와 재시도는 유지한다.

검증에 원본 해시 보존, 모바일 그림160KB 예산, 실제 브라우저의 모바일 경로 요청과 원본 C 지연 로딩을 추가했다. 배포 코드 `4c1e72ea991f4e4d205e0d29206c74c070403f46`. [CI 41315197945](https://github.com/winterrainlee/chinese-word-tactics/actions/runs/41315197945) 전체 성공 및 Pages 배포 완료. Chromium/WebKit 375×812·360×640, 원본 해시·모바일 경로·원본 C 지연 요청·실패 복구 검사를 통과했다. 공개 `inn-layer-test/?v=4&board=1&rain=1&newQuest=1`에서 모바일 자산 경로, 축소 크기, 정상 진입과 대화를 확인했다. [공개 증빙](../inn-layer-test/evidence/mobile-optimized-live.jpg). 실제 iPhone에서의 체감 로딩 속도는 사용자 확인을 남긴다.
