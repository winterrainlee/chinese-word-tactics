/* Standalone G1 tracing viewer. The game and its saves are never loaded here. */
(() => {
  'use strict';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const model = globalThis.WorldSpatialPrototype;
  const state = {
    data: null, gridId: 'medium', showGrid: true, showTraces: true,
    showAnchors: false, selectedPoint: null, selectedAnchor: null
  };

  const svgElement = (tag, attributes = {}) => {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  };
  const pathData = points => points.map(([x, y], index) => (index ? 'L' : 'M') + x + ' ' + y).join(' ');
  const detailItem = (title, description, small = '') => {
    const wrapper = document.createElement('div');
    wrapper.className = 'detailItem';
    if (small) {
      const note = document.createElement('div');
      note.className = 'miniLabel';
      note.textContent = small;
      wrapper.append(note);
    }
    const strong = document.createElement('strong');
    strong.textContent = title;
    const p = document.createElement('p');
    p.textContent = description;
    wrapper.append(strong, p);
    return wrapper;
  };
  const grid = () => model.gridFor(state.data, state.gridId);

  function renderGrid() {
    if (!state.data) return;
    const layer = $('gridLayer');
    layer.replaceChildren();
    if (!state.showGrid) return;
    const { width, height } = state.data.source.referenceSize;
    const preset = grid();
    const fragment = document.createDocumentFragment();
    for (let col = 1; col < preset.cols; col++) {
      const x = width * col / preset.cols;
      fragment.append(svgElement('line', { x1: x, y1: 0, x2: x, y2: height, class: 'gridLine' }));
    }
    for (let row = 1; row < preset.rows; row++) {
      const y = height * row / preset.rows;
      fragment.append(svgElement('line', { x1: 0, y1: y, x2: width, y2: y, class: 'gridLine' }));
    }
    layer.append(fragment);
  }

  function renderFeatures() {
    if (!state.data) return;
    const layer = $('featureLayer');
    layer.replaceChildren();
    if (!state.showTraces) return;
    const fragment = document.createDocumentFragment();
    state.data.features.forEach(feature => {
      if (feature.point) {
        const [x, y] = feature.point;
        fragment.append(svgElement('circle', { cx: x, cy: y, r: 10, class: 'traceBridgeOuter' }));
        fragment.append(svgElement('path', {
          d: 'M' + (x - 5) + ' ' + (y - 4) + 'L' + (x + 5) + ' ' + (y + 4) +
             'M' + (x + 5) + ' ' + (y - 4) + 'L' + (x - 5) + ' ' + (y + 4),
          class: 'traceBridgeInner'
        }));
        return;
      }
      const d = pathData(feature.points);
      const isWater = feature.type === 'water';
      fragment.append(svgElement('path', {
        d, 'stroke-width': feature.radiusPx * 2,
        class: isWater ? 'traceWaterHalo' : 'traceRoadHalo'
      }));
      fragment.append(svgElement('path', { d, class: isWater ? 'traceWaterCore' : 'traceRoadCore' }));
    });
    layer.append(fragment);
  }

  function renderAnchors() {
    if (!state.data) return;
    const layer = $('placePins');
    layer.replaceChildren();
    if (!state.showAnchors) return;
    const fragment = document.createDocumentFragment();
    state.data.placeAnchors.forEach(anchor => {
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'pin';
      pin.dataset.anchorId = anchor.id;
      pin.dataset.role = anchor.role;
      pin.style.left = anchor.xPct + '%';
      pin.style.top = anchor.yPct + '%';
      pin.textContent = anchor.label;
      pin.title = anchor.label + ' · 기존 월드맵 표시 좌표';
      pin.setAttribute('aria-label', anchor.label + ' 표시 정보 보기');
      pin.addEventListener('click', () => {
        state.selectedAnchor = anchor.id;
        state.selectedPoint = null;
        renderSelection();
      });
      fragment.append(pin);
    });
    layer.append(fragment);
  }

  function renderSelection() {
    if (!state.data) return;
    const layer = $('selectionLayer');
    const title = $('selectionTitle');
    const summary = $('selectionSummary');
    const details = $('selectionDetails');
    const quick = $('mapQuick');
    layer.replaceChildren();
    details.replaceChildren();
    quick.hidden = true;
    if (state.selectedAnchor) {
      const anchor = model.getAnchor(state.data, state.selectedAnchor);
      if (!anchor) return;
      title.textContent = anchor.label + ' · 장소 표식';
      summary.textContent = '현재 게임의 월드맵에서 사용하는 아이콘 위치야. 실제 시설의 중심 좌표나 지형 경계는 아니야.';
      details.append(detailItem('삽화 위 표시 좌표',
        'x ' + anchor.xPct + '% · y ' + anchor.yPct + '% · 기존 지역 ID ' + anchor.id,
        '기존 구현 참조'));
      if (anchor.role === 'outside-direction') details.append(detailItem(
        '바깥 방향 표식', '끝마을 자체가 이 그림 안에 있다는 뜻은 아니야. 외부 연결망으로 별도로 관리해야 해.'));
      quick.hidden = false;
      quick.textContent = anchor.label + ' · 기존 화면의 표시 위치';
      return;
    }
    if (!state.selectedPoint) {
      title.textContent = '지도의 한 칸을 골라봐.';
      summary.textContent = '지도 위를 탭하면 선택한 격자의 행·열과 가까운 물길·길·다리 후보를 확인할 수 있어.';
      return;
    }
    const cell = model.cellAt(state.data, state.gridId, state.selectedPoint[0], state.selectedPoint[1]);
    if (!cell) return;
    const { bounds, col, row, candidates } = cell;
    layer.append(svgElement('rect', {
      x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, class: 'selectionRect'
    }));
    const position = (col + 1) + '열 · ' + (row + 1) + '행';
    title.textContent = position;
    summary.textContent = candidates.length
      ? '삽화에서 표시한 요소 후보 ' + candidates.length + '개와 가까운 칸이야. 아직 확정 지형 분류는 아니야.'
      : '아직 지형을 분류하지 않은 칸이야. 아무것도 표시되지 않았다고 평지나 안전지대로 확정할 수는 없어.';
    details.append(detailItem('격자 위치', position + ' · ' + grid().label + ' 시험 격자',
      '선택한 칸'));
    candidates.forEach(candidate => {
      const kind = { water: '물길', road: '도로', bridge: '다리' }[candidate.type] || '지형';
      details.append(detailItem(candidate.label,
        '그림 위에서 육안으로 표시한 ' + kind + ' 후보와 가까워. 실제 연결·유속·침수 위험은 아직 확인하지 않았어.',
        '검토 후보 · ' + candidate.id));
    });
    quick.hidden = false;
    quick.textContent = position + ' · ' + (candidates.length ? '후보 ' + candidates.length + '개' : '분류 보류');
  }

  function selectPoint(x, y) {
    state.selectedAnchor = null;
    const { width, height } = state.data.source.referenceSize;
    state.selectedPoint = [Math.max(0, Math.min(width - 0.001, x)),
                           Math.max(0, Math.min(height - 0.001, y))];
    renderSelection();
  }

  function bindControls() {
    $('gridSize').addEventListener('change', event => {
      state.gridId = event.target.value;
      renderGrid();
      renderSelection();
      $('gridDescription').textContent = grid().label +
        ' · 칸 수 ' + (grid().cols * grid().rows).toLocaleString('ko-KR') +
        '개. 지형 후보의 선·점은 동일한 위치에 남아 있어.';
    });
    for (const [id, field, render] of [
      ['showGrid', 'showGrid', renderGrid],
      ['showTraces', 'showTraces', renderFeatures],
      ['showAnchors', 'showAnchors', renderAnchors]
    ]) {
      $(id).addEventListener('change', event => {
        state[field] = event.target.checked;
        render();
      });
    }
    $('mapHit').addEventListener('click', event => {
      const bounds = $('mapHit').getBoundingClientRect();
      const { width, height } = state.data.source.referenceSize;
      selectPoint((event.clientX - bounds.left) / bounds.width * width,
                  (event.clientY - bounds.top) / bounds.height * height);
    });
    $('mapHit').addEventListener('keydown', event => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      const { width, height } = state.data.source.referenceSize;
      if (!state.selectedPoint || state.selectedAnchor) {
        selectPoint(width / 2, height / 2);
        return;
      }
      const current = model.cellAt(state.data, state.gridId, ...state.selectedPoint);
      const preset = grid();
      const dc = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      const dr = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
      const col = Math.max(0, Math.min(preset.cols - 1, current.col + dc));
      const row = Math.max(0, Math.min(preset.rows - 1, current.row + dr));
      selectPoint((col + .5) / preset.cols * width, (row + .5) / preset.rows * height);
    });
  }

  async function loadArtwork(data) {
    const { assetBase, chunkCount, mime } = data.source;
    const requests = Array.from({ length: chunkCount }, (_, index) =>
      fetch(assetBase + '/' + String(index).padStart(2, '0') + '.txt'));
    const responses = await Promise.all(requests);
    if (responses.some(response => !response.ok)) throw new Error('일부 월드맵 조각을 읽지 못했어.');
    const parts = await Promise.all(responses.map(response => response.text()));
    const binary = atob(parts.join('').replace(/\s+/g, ''));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const artwork = $('mapArtwork');
    artwork.src = blobUrl;
    try { await artwork.decode(); }
    catch { URL.revokeObjectURL(blobUrl); throw new Error('월드맵 이미지를 표시하지 못했어.'); }
    window.addEventListener('pagehide', () => URL.revokeObjectURL(blobUrl), { once: true });
    $('loadStatus').textContent = '현재 게임과 동일한 원본 삽화야. 지도에서 칸을 눌러봐.';
  }

  async function start() {
    if (!model) throw new Error('지형 조회 모듈을 찾을 수 없어.');
    const response = await fetch('../data/world-spatial-illustration-trace-v0.1.json');
    if (!response.ok) throw new Error('삽화 추적 데이터 파일을 찾지 못했어.');
    const data = await response.json();
    if (data.status !== 'review-only' || data.schemaVersion !== 1) throw new Error('검토용 데이터 형식이 아니야.');
    state.data = data;
    bindControls();
    renderGrid();
    renderFeatures();
    renderAnchors();
    renderSelection();
    document.documentElement.dataset.gridReady = 'true';
    // Debug-only, read-only inspection hook for regression tests.
    globalThis.WorldGridTest = Object.freeze({
      getState: () => ({
        gridId: state.gridId, selectedPoint: state.selectedPoint?.slice() || null,
        selectedAnchor: state.selectedAnchor
      })
    });
    try { await loadArtwork(data); }
    catch (error) { $('loadStatus').textContent = '이미지 로딩 문제: ' + error.message; }
  }

  start().catch(error => {
    $('loadStatus').textContent = '시험판을 열지 못했어: ' + error.message;
    console.error(error);
  });
})();
