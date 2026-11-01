# 생성 프롬프트 · built-in image_gen

참조 1: `inn-layer-test/assets/mobile/background-light-v2.webp` (C 화풍).
참조 2: 기존 방을 복원한 이미지 (배경 생성의 공간 참조), 이후에는 새 `source/background.png`를 기물의 공간 참조로 사용했다.

## 배경

Use case: illustration-story. Create ONE game background asset, portrait 4:5 canvas. Image 1 is the exact STYLE reference (approved C inn lobby): rounded simplified forms, clear warm brown hand drawn outlines, broad cream/ochre/sage muted planes, restrained gouache texture, no photorealism. Image 2 is the boy's room SPATIAL reference only, NOT its realistic painterly style. Reinterpret this small upstairs room in image 1's clean storybook retro RPG style and slightly elevated view. IMPORTANT: produce EMPTY ROOM fixed architecture only: cream plaster back wall with wood beams (upper 40% of image), left wall with daylight lattice window, warm wood floor in lower 60%, open wooden doorway along far right foreground, gentle light from left window falling rightwards. Keep ample clean wall in middle upper area for future small plaques. No bed, no desk, no chair, no chest, no shelves with objects, no lamps, no movable objects or furniture shadows. These will be separate game layers later. Door is fixed architecture and must be visually obvious on lower right, not covering central floor. Match reference1 outline strength, camera slope and color-plane simplicity. Quiet humble lived-in personal room, not a grand hall. No text, UI, frames, people, grid or watermarks. Rendering asset for a mobile game; readable large shapes, modest texture.

## 기물 공통

Use case: illustration-story. A single independent furniture sprite for a mobile storybook retro RPG. Image1 is approved C style, image2 is the empty room where the sprite will be placed. Match warm dark-brown hand drawn outlines, rounded readable forms, broad muted cream/ochre/sage color planes, minimal gouache texture. Elevated frontal perspective matching room floor; light from left. Actual transparent background, NO floor patch/walls/room/checkerboard. Include only modest soft contact shadow attached under object. Entire silhouette uncropped, tight but safe 5% transparent padding. No text, UI, character, fantasy ornament, photorealistic detail. Target visible on mobile, strong simple silhouette.

## 침대 추가문

A humble narrow single wooden bed, upright rectangular headboard at the back, cream pillow, muted sage gray blanket. Head at upper right/back, footboard at lower left/front, visible right side. Camera looking diagonally along bed from front-right, in harmony with room's left floor perspective. Bed fits left side of room at x6% y32%, 41% width 39% height (roughly 164x195 CSS px). Portrait-ish sprite canvas, keep clear structural legs and low footboard. No nightstand or other objects.

## 책상 추가문

A small humble wooden writing desk with one shallow drawer and four legs. Empty top surface. Frontal view with top clearly visible, slight view of left side, positioned against back wall on right in room. Target box width128 height120 CSS px. No chair, books, cup, paper, tools or other objects. Compact rounded sturdy shape.

## 의자 추가문

A simple wooden straight-backed chair, with three broad back slats and a plain seat. Seen obliquely FROM BEHIND so back faces viewer and the seat extends towards the upper right; it will stand in front of writing desk at right rear of room. Target box80x110 CSS px. Four sturdy legs, no upholstery, no desk or other objects.

## 상자 추가문

A low closed wooden clothes chest, with simple iron corner braces and one modest center latch, seen from above and front-right, top visible and right side visible. Target box116x100 CSS px at front-left of room. Flat closed lid with NO objects or cloth on it, suitable for two small travel tokens placed later. Quiet simple silhouette, not a pirate treasure chest.

## 합성 조정

생성 결과의 투명 여백을 보존했다. 실제 배치는 `src/inn-room-scene.js`의 box와 hit가 기준이다. 기념품은 기존 DOM 표현과 실제 획득 조건을 유지하며, 별도로 `inn-scenes.css`에서 새 가구 위에 배치한다. 원본 PNG의 리터칭은 하지 않았다. 실행 파일만 Pillow로 축소·WebP 변환했다.
