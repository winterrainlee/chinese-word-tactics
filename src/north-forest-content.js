/* Northern forest F2-F8: four sibling requests built on the reusable C08 place. */
(() => {
  if (typeof STAGES === 'undefined' || typeof WORDS === 'undefined' ||
      !globalThis.JourneyContent?.STORIES || !Array.isArray(globalThis.JourneyContent?.JOURNEY)) return;

  const IDS = Object.freeze({
    F2: 'north-forest-stage-2', F3: 'north-forest-stage-3',
    F4: 'north-forest-stage-4', F5: 'north-forest-stage-5',
    F6: 'north-forest-stage-6', F7: 'north-forest-stage-7',
    F8: 'north-forest-stage-8'
  });

  Object.assign(WORDS, {
    '標記': { p: 'ㄅㄧㄠ ㄐㄧˋ', k: '표식, 표시', ex: '森林外圍有三個木頭標記。', rule: '숲길에 실제로 놓인 나무 표식이야. 먼저 외형과 가려진 부분을 확인해.' },
    '方向': { p: 'ㄈㄤ ㄒㄧㄤˋ', k: '방향', ex: '先看看每個標記的方向。', rule: '표지판 몸체가 향하는 쪽을 읽어. 색이 아니라 모양과 실제 길을 함께 봐야 해.' },
    '確認': { p: 'ㄑㄩㄝˋ ㄖㄣˋ', k: '확인하다', ex: '把看清楚的方向一個一個確認。', rule: '단순히 대상을 본 것과 방향을 확인해 기록한 상태를 구분해.' },
    '正確': { p: 'ㄓㄥˋ ㄑㄩㄝˋ', k: '정확하다, 올바르다', ex: '這個方向和實際的路線一致，才是正確的。', rule: '현재 표식의 방향이 실제 길과 맞는 상태야.' },
    '指示': { p: 'ㄓˇ ㄕˋ', k: '가리키다, 안내하다', ex: '標記指示回市集的路。', rule: '표식이 어느 쪽으로 가야 하는지 사람에게 알려 주는 기능을 말해.' },
    '特徵': { p: 'ㄊㄜˋ ㄓㄥ', k: '특징', ex: '顏色、長度和葉尖都是特徵。', rule: '색·길이·끝 모양처럼 대상을 구별할 때 함께 보는 정보야.' },
    '相似': { p: 'ㄒㄧㄤ ㄙˋ', k: '비슷하다', ex: '這些葉子看起來很相似。', rule: '일부 특징이 같아도 모든 조건이 같은 것은 아니야.' },
    '不同': { p: 'ㄅㄨˋ ㄊㄨㄥˊ', k: '다르다, 서로 다르다', ex: '這些葉子很相似，可是葉尖不同。', rule: '전체적으로 비슷해 보여도 특정 특징은 다를 수 있어.' },
    '分辨': { p: 'ㄈㄣ ㄅㄧㄢˋ', k: '구별하다', ex: '比較幾個特徵，就能分辨出來。', rule: '여러 특징을 함께 비교해 목표 대상을 가려내는 판단이야.' },
    '材料': { p: 'ㄘㄞˊ ㄌㄧㄠˋ', k: '재료', ex: '工匠需要兩根藤條做材料。', rule: '이번에는 실제 작업에 쓰기 위해 들고 돌아가는 덩굴을 말해.' },
    '適合': { p: 'ㄕˋ ㄏㄜˊ', k: '적합하다, 알맞다', ex: '長、細、長在水邊的藤條比較適合。', rule: '같은 식물이어도 이번 용도의 모든 조건을 만족해야 해.' },
    '生長': { p: 'ㄕㄥ ㄓㄤˇ', k: '자라다, 생장하다', ex: '這根藤條生長在水邊。', rule: '식물의 좌표가 아니라 어떤 환경에서 자라는지를 읽는 말이야.' },
    '遺失': { p: 'ㄧˊ ㄕ', k: '잃어버리다, 분실하다', ex: '採集人遺失了一個小包裹。', rule: '원래 있던 꾸러미가 지금은 없어졌다는 사건 상태야.' },
    '尋找': { p: 'ㄒㄩㄣˊ ㄓㄠˇ', k: '찾다, 찾아보다', ex: '從最後看到的位置開始尋找。', rule: '숲 전체를 무작정 누르지 않고 마지막 정보에서 범위를 좁혀 가.' },
    '痕跡': { p: 'ㄏㄣˊ ㄐㄧ', k: '흔적', ex: '枝上留下了藍色的痕跡。', rule: '대상 자체가 아니라 지나간 뒤 남은 실·발자국·바퀴 자국 같은 정보야.' },
    '發現': { p: 'ㄈㄚ ㄒㄧㄢˋ', k: '발견하다', ex: '在矮樹叢下面發現了包裹。', rule: '탐색 결과 처음으로 숨은 대상을 찾아낸 상태 변화야.' },
    '附近': { p: 'ㄈㄨˋ ㄐㄧㄣˋ', k: '근처, 부근', ex: '先看看最後痕跡的附近。', rule: '마지막 흔적을 중심으로 실제 한두 칸 안의 공간 관계를 뜻해.' },
    '留下': { p: 'ㄌㄧㄡˊ ㄒㄧㄚˋ', k: '남기다, 남겨 두다', ex: '包裹在枝上留下了藍色的線。', rule: '지나간 꾸러미가 뒤에 실 조각을 남긴 관계를 보여 줘.' },
    '情況': { p: 'ㄑㄧㄥˊ ㄎㄨㄤˋ', k: '상황, 상태', ex: '先確認每條路現在的情況。', rule: '마름·젖음·폭·장애물을 한데 묶어 현재 길 상태를 읽는 말이야.' },
    '安全': { p: 'ㄢ ㄑㄩㄢˊ', k: '안전하다', ex: '乾而且寬的路對貨車比較安全。', rule: '현재 작은 수레가 실제로 무리 없이 지날 수 있는 상태야.' },
    '危險': { p: 'ㄨㄟˊ ㄒㄧㄢˇ', k: '위험하다', ex: '又濕又窄的路對貨車太危險。', rule: '대상과 현재 상황 때문에 이 선택을 확정하기 부적절한 상태야.' }
  });

  const action = (target, label, operation, extra = {}) => ({
    target, label, action: 'north-forest-action', operation, ...extra
  });
  const observable = (id, char, labelZh, labelKo, extra = {}) => ({ id, char, labelZh, labelKo, ...extra });

  const stages = [
    {
      id: 'north-forest-stage-2', title: '標記・方向・確認', subtitle: '잎에 가려진 표식', kicker: '자유 의뢰 · 북쪽 숲 F2',
      grid: ['######', '#..A.#', '#....#', '#B.S.#', '#...C#', '##E###'],
      goal: '確認三個標記的方向。', rule: '표식을 직접 눌러 외형을 보고, 가까이에서 방향을 확인해.',
      words: ['標記', '方向', '確認'], win: ['north_forest'],
      northForest: {
        kind: 'markers', initialState: {
          markerAObserved: false, markerAConfirmed: false,
          markerBObserved: false, markerBConfirmed: false,
          markerCObserved: false, markerCRevealed: false, markerCConfirmed: false
        },
        observables: [
          observable('marker-a', 'A', '木頭標記', '나무 표식 A', { variant: 'marker', direction: '右', observedFlag: 'markerAObserved', confirmedFlag: 'markerAConfirmed', directSets: ['markerAObserved'] }),
          observable('marker-b', 'B', '木頭標記', '나무 표식 B', { variant: 'marker', direction: '上', observedFlag: 'markerBObserved', confirmedFlag: 'markerBConfirmed', directSets: ['markerBObserved'] }),
          observable('marker-c', 'C', '被葉子遮住的標記', '잎에 가려진 표식 C', { variant: 'marker', direction: '左', observedFlag: 'markerCObserved', revealedFlag: 'markerCRevealed', confirmedFlag: 'markerCConfirmed', directSets: ['markerCObserved'] })
        ]
      },
      contextActions: [
        action('A', '方向 확인하기', 'set-flags', { sets: ['markerAObserved', 'markerAConfirmed'], unless: 'markerAConfirmed', message: '這個標記的方向是右。方向確認了。 오른쪽을 가리키는 표식으로 확인했어.' }),
        action('B', '方向 확인하기', 'set-flags', { sets: ['markerBObserved', 'markerBConfirmed'], unless: 'markerBConfirmed', message: '這個標記的方向是上。方向確認了。 위쪽을 가리키는 표식으로 확인했어.' }),
        action('C', '잎 젖히기', 'set-flags', { sets: ['markerCRevealed'], unless: 'markerCRevealed', priority: 100, message: '把葉子撥開後，標記的形狀看清楚了。 잎을 젖히자 표지판 몸체가 드러났어.' }),
        action('C', '方向 확인하기', 'set-flags', { sets: ['markerCObserved', 'markerCConfirmed'], requires: 'markerCRevealed', unless: 'markerCConfirmed', message: '這個標記的方向是左。方向確認了。 왼쪽을 가리키는 표식으로 확인했어.' })
      ],
      story: '三個標記的方向都確認了。 세 표식의 방향을 모두 확인했다.'
    },
    {
      id: 'north-forest-stage-3', title: '正確・指示', subtitle: '돌아간 표지판', kicker: '자유 의뢰 · 북쪽 숲 F3',
      grid: ['######', '#..R.#', '#....#', '#..S.#', '#....#', '###B##'],
      goal: '觀察通往市集的路，把轉歪的標記調回正確方向。', rule: '정상 표식은 없어. 실제 장터 길이 어느 쪽으로 이어지는지 보고 팻말을 한 방향씩 돌려봐.',
      words: ['正確', '指示'], win: ['north_forest'],
      northForest: {
        kind: 'discrete', initialState: { markerDirection: '左', actualRouteObserved: false },
        discrete: { id: 'rotated-marker', char: 'R', states: ['上', '右', '下', '左'], stateFlag: 'markerDirection', target: '下' },
        terrain: [{ className: 'forest-reference-road', positions: [[2,3],[3,3],[4,3],[5,3]], labelZh: '通往市集的路', labelKo: '장터로 이어지는 흙길' }],
        observables: [
          observable('rotated-marker', 'R', '轉歪的標記', '돌아간 표지판', { variant: 'marker', directionFlag: 'markerDirection' }),
          observable('reference-b', 'B', '通往市集的路', '장터 쪽으로 이어지는 실제 길', { variant: 'route-reference', blocking: true })
        ]
      },
      contextActions: [
        action('B', '실제 장터 길 確認', 'set-flags', { sets: ['actualRouteObserved'], unless: 'actualRouteObserved', message: '這條土路通往市集。 이 흙길이 장터 쪽으로 이어지는 것을 확인했어.' }),
        action('R', '표지판 한 칸 돌리기', 'rotate', { discreteId: 'rotated-marker' })
      ],
      story: '標記的指示正確了。 표식이 실제 장터 쪽 길을 올바르게 가리킨다.'
    },
    {
      id: 'north-forest-stage-4', title: '特徵・相似・不同・分辨', subtitle: '닮은 잎', kicker: '자유 의뢰 · 북쪽 숲 F4',
      grid: ['######', '#A..B#', '#....#', '#..S.#', '#C..D#', '######'],
      goal: '比較特徵，分辨出和樣本相同的植物。', rule: '견본은 深綠色 · 長 · 尖. 색 하나가 아니라 세 특징을 함께 비교해.',
      words: ['特徵', '相似', '不同', '分辨'], win: ['north_forest'],
      northForest: {
        kind: 'attributes', targetId: 'plant-a', attributeKeys: ['color', 'length', 'tip'],
        reference: { color: '深綠色', length: '長', tip: '尖' },
        referenceCard: { labelZh: '樣本', labelKo: '견본', variant: 'plant-long-pointed-dark' },
        minimumComparisons: 2,
        initialState: { plantAObserved: false, plantBObserved: false, plantCObserved: false, plantDObserved: false, selectedPatch: null, collectedPatch: null, comparedPatchIds: [], comparedSimilar: false, differentObserved: false, matchingPlantConfirmed: false, plantCollected: false },
        observables: [
          observable('plant-a', 'A', '葉子 A', '식물 군락 A', { variant: 'plant-long-pointed-dark', observedFlag: 'plantAObserved', attributes: { color: '深綠色', length: '長', tip: '尖' } }),
          observable('plant-b', 'B', '葉子 B', '식물 군락 B', { variant: 'plant-long-round-dark', observedFlag: 'plantBObserved', attributes: { color: '深綠色', length: '長', tip: '圓' } }),
          observable('plant-c', 'C', '葉子 C', '식물 군락 C', { variant: 'plant-long-pointed-light', observedFlag: 'plantCObserved', attributes: { color: '淺綠色', length: '長', tip: '尖' } }),
          observable('plant-d', 'D', '葉子 D', '식물 군락 D', { variant: 'plant-short-pointed-dark', observedFlag: 'plantDObserved', attributes: { color: '深綠色', length: '短', tip: '尖' } })
        ]
      },
      contextActions: ['A','B','C','D'].flatMap((target, index) => {
        const id = ['plant-a','plant-b','plant-c','plant-d'][index], flag = `plant${target}Observed`;
        const actions = [
          action(target, '特徵 확인하기', 'observe', { objectId: id, unless: flag }),
          action(target, '견본과 비교하기', 'select-attribute', { objectId: id, requires: flag, priority: 100 })
        ];
        if (target === 'A') actions.push(action(target, '확인한 식물 챙기기', 'collect-attribute', { objectId: id, requires: 'matchingPlantConfirmed', unless: 'plantCollected', priority: 110 }));
        return actions;
      }),
      story: '幾個特徵都相同，少年把分辨出的植物收好了。 여러 특징이 같은 식물을 구별해 한 포기 챙겼다.'
    },
    {
      id: 'north-forest-stage-5', title: '材料・適合・生長', subtitle: '장인이 찾는 재료', kicker: '자유 의뢰 · 북쪽 숲 F5',
      grid: ['######', '#A..B#', '#~..~#', '#..S.#', '#C~.D#', '#..E.#'],
      goal: '找出適合的材料兩根，再退出森林。', rule: '필요 조건은 長 · 細 · 生長在水邊. 잘못 챙긴 재료는 같은 자리에서 다시 놓을 수 있어.',
      words: ['材料', '適合', '生長'], win: ['north_forest', 'at_exit'],
      northForest: {
        kind: 'materials', required: 2, requirements: { length: '長', width: '細', habitat: '水邊' },
        workOrder: { labelZh: '材料條件', values: ['長', '細', '生長在水邊', '兩根'] },
        initialState: { materialAObserved: false, materialBObserved: false, materialCObserved: false, materialDObserved: false, carriedMaterials: [] },
        terrain: [{
          className: 'forest-stream', positions: [[2,1],[2,4],[4,2]], labelZh: '水邊', labelKo: '물가',
          enterMessage: '水邊。 얕은 물과 젖은 흙이 이어지는 물가야.'
        }],
        observables: [
          observable('material-a', 'A', '藤條 A', '덩굴 군락 A', { variant: 'vine-long-thin', observedFlag: 'materialAObserved', attributes: { length: '長', width: '細', habitat: '水邊' } }),
          observable('material-b', 'B', '藤條 B', '덩굴 군락 B', { variant: 'vine-long-thick', observedFlag: 'materialBObserved', attributes: { length: '長', width: '粗', habitat: '水邊' } }),
          observable('material-c', 'C', '藤條 C', '덩굴 군락 C', { variant: 'vine-long-thin', observedFlag: 'materialCObserved', attributes: { length: '長', width: '細', habitat: '水邊' } }),
          observable('material-d', 'D', '藤條 D', '덩굴 군락 D', { variant: 'vine-short-thin', observedFlag: 'materialDObserved', attributes: { length: '短', width: '細', habitat: '林地' } })
        ]
      },
      contextActions: ['A','B','C','D'].flatMap((target, index) => {
        const id = ['material-a','material-b','material-c','material-d'][index], flag = `material${target}Observed`, held = `material${target}Held`;
        return [
          action(target, '特徵과 生長 위치 확인', 'observe', { objectId: id, unless: flag }),
          action(target, '재료 챙기기', 'take-material', { objectId: id, requires: flag, unless: held, priority: 100 }),
          action(target, '재료 다시 놓기', 'return-material', { objectId: id, requires: held, priority: 110 })
        ];
      }),
      story: '適合的材料有兩根，數量足夠了。 조건에 맞는 덩굴 두 개를 챙겼다.'
    },
    {
      id: 'north-forest-stage-6', title: '遺失・尋找・痕跡', subtitle: '사라진 꾸러미', kicker: '자유 의뢰 · 북쪽 숲 F6',
      grid: ['#######', '#..Q..#', '#..T..#', '#W.L.V#', '#..S..#', '#######'],
      goal: '從最後的位置開始，跟著相關痕跡到下一片空地。', rule: '이번 목표는 꾸러미 발견이 아니야. 다른 흔적과 파란 실을 비교해 다음 수색 구역까지 가.',
      words: ['遺失', '尋找', '痕跡'], win: ['north_forest'],
      completionTitle: '✓ 추적 지점 도달', completionAction: '흔적을 따라 계속 찾기',
      northForest: {
        kind: 'clue-path', initialState: { lastSeenConfirmed: false, alternativeTraceChecked: false, blueThreadConfirmed: false, relatedTraceConfirmed: false, reachedClearing: false },
        clearingMessage: '痕跡延伸到下一片空地，包裹還沒找到。 흔적은 다음 빈터까지 이어지지만 꾸러미는 아직 보이지 않아.',
        observables: [
          observable('last-seen', 'L', '最後看到的位置', '꾸러미를 마지막으로 본 자리', { variant: 'last-seen' }),
          observable('animal-trace', 'W', '動物腳印', '동물 발자국', { variant: 'trace-animal', visibleRequires: ['lastSeenConfirmed'] }),
          observable('wheel-trace', 'V', '車輪痕跡', '수레바퀴 자국', { variant: 'trace-wheel', visibleRequires: ['lastSeenConfirmed'] }),
          observable('blue-thread', 'T', '藍色線頭', '가지에 걸린 파란 실', { variant: 'trace-blue-thread', visibleRequires: ['lastSeenConfirmed'], passableWhen: 'blueThreadConfirmed' }),
          observable('drag-trace', 'Q', '拖過的痕跡', '끌린 자국과 파란 실', { variant: 'trace-drag', visibleRequires: ['blueThreadConfirmed'], passableWhen: 'relatedTraceConfirmed' })
        ]
      },
      contextActions: [
        action('L', '마지막 위치 確認', 'set-flags', { sets: ['lastSeenConfirmed'], unless: 'lastSeenConfirmed', message: '最後看到包裹的位置確認了。 이제 이 周圍에서 흔적을 찾아보자.' }),
        action('W', '발자국 확인하기', 'set-flags', { sets: ['alternativeTraceChecked'], requires: 'lastSeenConfirmed', message: '這是動物留下的痕跡，和包裹沒有關係。 동물 발자국이라 꾸러미와는 관계없어.' }),
        action('V', '바퀴 자국 확인하기', 'set-flags', { sets: ['alternativeTraceChecked'], requires: 'lastSeenConfirmed', message: '有車輪痕跡，可是這條路常有車經過。 이것만으로는 방향을 확인할 수 없어.' }),
        action('T', '파란 실 확인하기', 'set-flags', { sets: ['blueThreadConfirmed'], requires: ['lastSeenConfirmed', 'alternativeTraceChecked'], unless: 'blueThreadConfirmed', message: '枝上留下了一小段藍色的線。 다른 흔적과 달리 꾸러미의 파란 끈과 이어질 가능성이 있어.' }),
        action('Q', '후속 흔적 확인하기', 'set-flags', { sets: ['relatedTraceConfirmed'], requires: 'blueThreadConfirmed', unless: 'relatedTraceConfirmed', message: '藍色線旁邊還有拖過的痕跡。 올바른 방향이 빈터 쪽으로 이어져.' })
      ],
      story: '痕跡把尋找的方向帶到小空地，包裹還沒找到。 다음 수색 지점에 도착했지만 꾸러미는 아직 찾지 못했다.'
    },
    {
      id: 'north-forest-stage-7', title: '發現・附近・留下', subtitle: '흔적이 멈춘 곳', kicker: '자유 의뢰 · 북쪽 숲 F7',
      grid: ['#######', '#A....#', '#..B..#', '#..L.C#', '#..D..#', '#..S..#', '###E###'],
      goal: '在最後痕跡附近發現包裹，收好後回到採集人等候的路口。', rule: '마지막 흔적 가까이에서 꾸러미를 찾고 챙겨. 채집인이 기다리는 숲길 입구로 돌아와야 의뢰가 끝나.',
      words: ['發現', '附近', '留下'], win: ['north_forest', 'at_exit'],
      northForest: {
        kind: 'clue-nearby', centerId: 'last-trace', radius: 2,
        exitLabelZh: '採集人等候的路口', exitLabelKo: '채집인이 기다리는 숲길 입구',
        initialState: { finalTraceConfirmed: false, nearbyCompared: false, bundleThreadFound: false, bundleDiscovered: false, bundleCollected: false },
        observables: [
          observable('far-tree', 'A', '大樹', '큰 나무', { variant: 'tree-large' }),
          observable('round-rock', 'B', '圓石', '둥근 바위', { variant: 'rock-round' }),
          observable('last-trace', 'L', '最後的痕跡', '마지막 파란 실 흔적', { variant: 'trace-blue-thread' }),
          observable('low-bush', 'C', '矮樹叢', '낮은 덤불', { variant: 'bush-low' }),
          observable('small-stream', 'D', '小水溝', '작은 물길', { variant: 'small-stream', blocking: false })
        ],
        terrain: [{ className: 'forest-stream', positions: [[4,3]] }]
      },
      contextActions: [
        action('L', '마지막 痕跡 확인', 'set-flags', { sets: ['finalTraceConfirmed'], unless: 'finalTraceConfirmed', message: '最後的痕跡是低枝上的藍色線。 이 지점의 附近부터 살펴보자.' }),
        action('A', '큰 나무 살펴보기', 'nearby-note', { requires: 'finalTraceConfirmed', message: '離最後的痕跡有點遠。先看看附近吧。 마지막 흔적에서 조금 멀어.' }),
        action('B', '둥근 바위 살펴보기', 'nearby-note', { sets: ['nearbyCompared'], requires: 'finalTraceConfirmed', message: '圓石附近沒有新留下的痕跡。 바위 근처와 비교해 다른 가까운 곳을 살펴보자.' }),
        action('D', '작은 물길 살펴보기', 'nearby-note', { sets: ['nearbyCompared'], requires: 'finalTraceConfirmed', message: '小水溝附近沒有藍色的線。 물길 쪽과 비교해 다른 가까운 곳을 살펴보자.' }),
        action('C', '덤불의 실 확인하기', 'set-flags', { sets: ['bundleThreadFound'], requires: ['finalTraceConfirmed', 'nearbyCompared'], unless: 'bundleThreadFound', message: '矮樹叢的枝上又留下了藍色的線。 다른 가까운 곳과 달리 덤불 아래로 이어져.' }),
        action('C', '덤불 아래 살펴보기', 'set-flags', { sets: ['bundleDiscovered'], requires: 'bundleThreadFound', unless: 'bundleDiscovered', priority: 100, message: '在矮樹叢下面發現了遺失的包裹。 파란 끈 꾸러미를 발견했어.' }),
        action('C', '꾸러미 챙기기', 'set-flags', { sets: ['bundleCollected'], requires: 'bundleDiscovered', unless: 'bundleCollected', priority: 110, message: '把包裹收好了。 이제 채집인이 기다리는 숲길 입구로 돌아가자.' })
      ],
      story: '遺失的包裹找到了，也帶回採集人等候的路口。 파란 끈 꾸러미를 찾아 채집인이 기다리는 입구까지 가져왔다.'
    },
    {
      id: 'north-forest-stage-8', title: '情況・安全・危險', subtitle: '오늘의 숲길', kicker: '자유 의뢰 · 북쪽 숲 F8',
      grid: ['###E###', '#.....#', '#.#~#.#', '#O#~#.#', '#.#M#.#', '#W...Z#', '##CS###'],
      goal: '確認路況，選安全的路，帶領貨車到市集。', rule: '세 길의 情況을 비교한 뒤 안전한 길 입구로 가서 수레를 안내해. 서쪽은 가지 앞에서 한 번 멈춰.',
      words: ['情況', '安全', '危險'], win: ['at_exit', 'follower_at_exit', 'north_forest'],
      follower: {
        char: 'C', leaderGoalChar: 'E', followerGoal: [1,3], blockedChars: ['#','~'], narrowChar: '~',
        cartLabel: '장터로 가져갈 작은 손수레',
        narrowLabel: '젖고 좁아서 소년만 지날 수 있는 길',
        narrowMessage: '這段路又濕又窄，現在讓貨車通過太危險。 수레는 멈췄어. 後退해서 다른 길을 고를 수 있어.',
        goalMessage: '少年帶領小貨車安全到了市集。 소년이 앞에서 길을 확인하며 작은 수레를 장터까지 이끌었어.',
        guidedRoutes: {
          westToObstacle: [[5,1],[4,1]],
          westToMarket: [[3,1],[2,1],[1,1],[1,2],[1,3],[0,3]],
          eastToMarket: [[5,5],[4,5],[3,5],[2,5],[1,5],[1,4],[1,3],[0,3]]
        }
      },
      finalObstacle: {
        char: 'O', kind: 'branch', labelKo: '서쪽 길을 막는 굵은 가지', clearedLabelKo: '가지를 치운 서쪽 길',
        inspectMessage: '倒下的粗樹枝是西路的障礙。 굵은 가지를 치우면 이 마른 넓은 길을 쓸 수 있어.',
        clearMessage: '障礙移開了。 가지를 길가로 옮겨 서쪽 길도 수레가 지나갈 수 있어.',
        inspectLabel: '가지 살펴보기', clearLabel: '가지 치우기'
      },
      northForest: {
        kind: 'route-cart', initialState: { westSituationConfirmed: false, middleSituationConfirmed: false, eastSituationConfirmed: false },
        terrain: [
          { className: 'forest-path-dry forest-path-wide', positions: [[5,1],[4,1],[3,1],[2,1],[1,1],[1,2],[1,3]] },
          { className: 'forest-path-wet forest-path-narrow', positions: [[4,3],[3,3],[2,3]] },
          { className: 'forest-path-dry forest-path-wide', positions: [[5,5],[4,5],[3,5],[2,5],[1,5],[1,4],[1,3]] }
        ],
        observables: [
          observable('west-route', 'W', '西邊短路', '서쪽 짧은 길 입구', { variant: 'route-west', blocking: false, directSets: ['westSituationConfirmed'], attributes: { surface: '乾', breadth: '寬', obstacle: '粗樹枝' } }),
          observable('middle-route', 'M', '中間小路', '가운데 젖은 길 입구', { variant: 'route-middle', blocking: false, directSets: ['middleSituationConfirmed'], attributes: { surface: '濕', breadth: '窄', obstacle: '無' } }),
          observable('east-route', 'Z', '東邊長路', '동쪽 긴 길 입구', { variant: 'route-east', blocking: false, directSets: ['eastSituationConfirmed'], attributes: { surface: '乾', breadth: '寬', obstacle: '無' } })
        ]
      },
      contextActions: [
        action('W', '서쪽 情況 확인', 'set-flags', { sets: ['westSituationConfirmed'], unless: 'westSituationConfirmed', message: '西路乾而且寬，但是有樹枝障礙。 가지를 치우면 수레에 安全해.' }),
        action('M', '가운데 情況 확인', 'set-flags', { sets: ['middleSituationConfirmed'], unless: 'middleSituationConfirmed', message: '中路又濕又窄。 사람은 지나가도 지금 수레에는 危險해.' }),
        action('M', '수레와 함께 後退', 'retreat-cart', { requires: 'middleSituationConfirmed', priority: 120 }),
        action('Z', '동쪽 情況 확인', 'set-flags', { sets: ['eastSituationConfirmed'], unless: 'eastSituationConfirmed', message: '東路乾而且寬，沒有障礙。 조금 멀지만 지금 수레에 安全해.' }),
        { target: 'W', label: '서쪽 길로 수레 안내', action: 'follower-guide-route', routeId: 'westToObstacle', sets: 'westRouteEntered', unless: 'westRouteEntered', requires: ['westSituationConfirmed', 'middleSituationConfirmed', 'eastSituationConfirmed'], priority: 110, message: '乾而寬的西路可以通過。 수레를 이끌고 굵은 가지 앞까지 왔어.' },
        { target: 'Z', label: '동쪽 길로 수레 안내', action: 'follower-guide-route', routeId: 'eastToMarket', sets: 'eastRouteEntered', unless: 'eastRouteEntered', requires: ['westSituationConfirmed', 'middleSituationConfirmed', 'eastSituationConfirmed'], priority: 110 },
        { target: 'O', label: '가지 살펴보기', action: 'g7-inspect-obstacle', unless: 'g7ObstacleIdentified' },
        { target: 'O', label: '가지 치우기', action: 'g7-clear-obstacle', priority: 100, requires: 'g7ObstacleIdentified', unless: 'g7ObstacleCleared' },
        { target: 'O', label: '서쪽 길로 계속 안내', action: 'follower-guide-route', routeId: 'westToMarket', requires: ['westSituationConfirmed', 'middleSituationConfirmed', 'eastSituationConfirmed', 'g7ObstacleCleared'], priority: 120 }
      ],
      story: '少年帶著小貨車安全回到市集。 소년은 수레보다 앞에서 길을 확인하며 장터로 돌아왔다.'
    }
  ];

  for (const stage of stages) if (!STAGES.some(item => item.id === stage.id)) STAGES.push(stage);

  Object.assign(globalThis.JourneyContent.STORIES, {
    'north-forest-signs-request': {
      id: 'north-forest-signs-request', chapterId: 'waterway-side-quests', titleKo: '채집인이 남긴 메모',
      background: 'inn', placeZh: '客棧', placeKo: '여관 게시판', beats: [
        { speaker: 'innkeeper', zh: '這是常來市集的採集人留下的。他想請人去北邊森林外圍，確認三個標記現在指的方向。', ko: '장터에 자주 오는 채집인이 남긴 메모야. 북쪽 숲 바깥쪽의 표식 세 개가 지금 어느 방향을 가리키는지 확인해 줄 사람을 찾는대.' },
        { speaker: 'boy', zh: '我上次找月白菇的地方，也在那附近嗎？', ko: '지난번 월백버섯 찾던 곳도 그 근처예요?' },
        { speaker: 'innkeeper', zh: '差不多。你去過一次，應該認得入口。採集人還坐在客棧窗邊，你願意接的話，先去跟他問清楚吧。', ko: '대충 그쪽이야. 한번 다녀왔으니 입구 정도는 알아보겠지. 채집인이 아직 여관 창가에 있으니, 맡아 볼 거면 먼저 가서 자세히 물어봐.' },
        { speaker: 'narrator', zh: '少年走到客棧窗邊，向正在整理籃子的採集人打了招呼。', ko: '소년은 여관 창가로 가서 바구니를 정리하던 채집인에게 말을 걸었다.' },
        { speaker: 'collector', zh: '你就是願意接下委託的孩子？不用走遠，幫我看看外圍三個標記就行。', ko: '부탁을 맡아 주겠다는 아이구나? 멀리 갈 필요 없어. 바깥쪽 표식 세 개만 봐 줘.' },
        { speaker: 'boy', zh: '好。我到了森林以後，要確認什麼？', ko: '좋아요. 숲에 가면 무엇을 확인하면 되나요?' },
        { speaker: 'collector', zh: '我想知道它們現在指的方向。你先確認，不用急著動。', ko: '지금 어느 방향을 가리키는지만 알고 싶어. 먼저 확인해. 바로 손댈 필요는 없어.' }
      ]
    },
    'north-forest-after-f2': {
      id: 'north-forest-after-f2', chapterId: 'waterway-side-quests', titleKo: '하나만 다른 방향',
      background: 'forest', placeZh: '北邊森林外圍', placeKo: '북쪽 숲 바깥쪽', beats: [
        { speaker: 'boy', zh: '三個標記裡，有一個方向不一樣。', ko: '세 표식 중 하나만 방향이 달랐어요.' },
        { speaker: 'collector', zh: '那塊可能轉了。風吹久了，木樁會慢慢鬆。', ko: '그건 돌아갔을 수도 있겠네. 바람을 오래 맞으면 나무 축이 조금씩 느슨해지거든.' },
        { speaker: 'collector', zh: '旁邊的路沒變。看看通往市集的路往哪裡延伸，就能自己判斷正確方向。', ko: '옆의 길 자체는 그대로야. 장터로 가는 길이 어느 쪽으로 이어지는지 보면 올바른 방향을 직접 판단할 수 있어.' }
      ]
    },
    'north-forest-signs-report': {
      id: 'north-forest-signs-report', chapterId: 'waterway-side-quests', titleKo: '장터로 이어지는 표식',
      background: 'forest', placeZh: '北邊森林外圍', placeKo: '북쪽 숲 바깥쪽', beats: [
        { speaker: 'collector', zh: '好，這樣從市集那邊過來的人就不會走錯了。', ko: '좋아. 이제 장터 쪽에서 오는 사람들도 길을 잘못 들진 않겠네.' },
        { speaker: 'boy', zh: '原來這些標記不是只給採集的人看的。', ko: '이 표식은 채집하는 사람들만 보는 게 아니군요.' }
      ]
    },
    'north-forest-material-request': {
      id: 'north-forest-material-request', chapterId: 'waterway-side-quests', titleKo: '장인이 보여 준 잎',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골', beats: [
        { speaker: 'artisan', zh: '最近常去北邊森林？', ko: '요즘 북쪽 숲에 자주 간다며?' },
        { speaker: 'boy', zh: '去了幾次。還是有很多地方不熟。', ko: '몇 번 가긴 했어요. 아직 모르는 곳이 많지만요.' },
        { speaker: 'artisan', zh: '不用熟整座森林。我需要的是外圍就能找到的東西。', ko: '숲 전체를 알 필요는 없어. 내가 필요한 건 바깥쪽에서도 구할 수 있으니까.' },
        { speaker: 'artisan', zh: '像這種。可是那裡長得相似的很多，只看顏色容易拿錯。', ko: '이런 거야. 그런데 거기 비슷하게 생긴 게 많아서 색만 보고 고르면 틀리기 쉬워.' },
        { speaker: 'boy', zh: '深綠色，葉子長，前面是尖的……', ko: '진한 초록이고, 잎이 길고, 끝이 뾰족하고……' },
        { speaker: 'artisan', zh: '對。顏色只是特徵之一。形狀也要一起看。', ko: '그래. 색은 특징 중 하나일 뿐이야. 모양도 같이 봐야 해.' }
      ]
    },
    'north-forest-after-f4': {
      id: 'north-forest-after-f4', chapterId: 'waterway-side-quests', titleKo: '구별한 뒤의 조건',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골', beats: [
        { speaker: 'artisan', zh: '你分辨得出來，也把樣本帶回來了。可是做材料，還要再看別的條件。', ko: '잘 구별해서 식물도 챙겨 왔구나. 하지만 재료로 쓰려면 다른 조건도 더 봐야 해.' },
        { speaker: 'artisan', zh: '這次不給你看另一個樣本。記住：要長、細，而且生長在水邊。帶兩根回來。', ko: '이번에는 다른 견본을 보여 주지 않을게. 길고, 가늘고, 물가에서 자라는 것. 두 줄기만 가져와.' }
      ]
    },
    'north-forest-material-report': {
      id: 'north-forest-material-report', chapterId: 'waterway-side-quests', titleKo: '필요한 만큼의 재료',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골', beats: [
        { speaker: 'artisan', zh: '這些就夠了。你沒有看到像的就全部帶回來，這樣很好。', ko: '이 정도면 충분해. 비슷해 보인다고 전부 가져오지 않은 게 잘했어.' },
        { speaker: 'boy', zh: '以前只覺得森林裡都是樹和草，現在看起來好像都不太一樣了。', ko: '전에는 숲에 나무랑 풀만 가득하다고 생각했는데, 이제 보니 다 조금씩 다르네요.' }
      ]
    },
    'north-forest-bundle-request': {
      id: 'north-forest-bundle-request', chapterId: 'waterway-side-quests', titleKo: '사라진 작은 꾸러미',
      background: 'market', placeZh: '市集', placeKo: '장터', beats: [
        { speaker: 'collector', zh: '奇怪，少了一包。', ko: '이상하네. 꾸러미 하나가 없어.' },
        { speaker: 'boy', zh: '是在森林裡掉的嗎？', ko: '숲에서 떨어뜨린 걸까요?' },
        { speaker: 'collector', zh: '不知道。離開森林以前我還看過一次，到了市集才發現不見了。', ko: '모르겠어. 숲을 나오기 전에는 한번 봤는데, 장터에 와서야 없어진 걸 알았어.' },
        { speaker: 'collector', zh: '包裹用藍色的布繩綁著。別從整座森林亂找，先從我最後看到它的地方開始吧。', ko: '꾸러미는 파란 천끈으로 묶었어. 숲 전체를 무작정 찾지는 마. 마지막으로 봤던 곳부터 시작해.' }
      ]
    },
    'north-forest-after-f6': {
      id: 'north-forest-after-f6', chapterId: 'waterway-side-quests', titleKo: '흔적이 옅어진 빈터',
      background: 'forest', placeZh: '北邊森林空地', placeKo: '북쪽 숲 빈터', beats: [
        { speaker: 'boy', zh: '痕跡到這裡還看得到，可是包裹還沒看到。再往前，痕跡就不明顯了。', ko: '흔적은 여기까지 보이지만 꾸러미는 아직 안 보여요. 그 앞부터는 흔적도 흐려져요.' },
        { speaker: 'collector', zh: '最後看到痕跡的地方很重要。東西可能就在附近。', ko: '마지막으로 흔적을 본 곳이 중요해. 물건은 근처에 있을 수도 있어.' }
      ]
    },
    'north-forest-bundle-report': {
      id: 'north-forest-bundle-report', chapterId: 'waterway-side-quests', titleKo: '길에서 멀지 않은 곳',
      background: 'market', placeZh: '市集', placeKo: '장터', beats: [
        { speaker: 'collector', zh: '就是這個。原來離路沒有多遠。', ko: '이거야. 생각보다 길에서 멀지 않았네.' },
        { speaker: 'marketkeeper', zh: '你最近真的常往那邊跑啊。', ko: '요즘 정말 그쪽을 자주 다니는구나.' },
        { speaker: 'boy', zh: '只是去過幾次，開始認得幾個地方了。', ko: '몇 번 가다 보니 몇 군데는 알아보게 된 정도예요.' }
      ]
    },
    'north-forest-road-request': {
      id: 'north-forest-road-request', chapterId: 'waterway-side-quests', titleKo: '오늘 달라진 숲길',
      background: 'forest', placeZh: '北邊森林外圍', placeKo: '북쪽 숲 바깥쪽', beats: [
        { speaker: 'collector', zh: '今天要把這些送到市集。不過剛才有人說，外圍有一段路變得不好走。', ko: '오늘 이걸 장터로 가져가야 하는데, 아까 누가 그러더라. 바깥쪽 길 한 군데가 걷기 안 좋아졌대.' },
        { speaker: 'boy', zh: '是哪一條？', ko: '어느 길인데요?' },
        { speaker: 'collector', zh: '我也還沒確認。你最近走過那幾條路，要不要一起看看？', ko: '나도 아직 확인 못 했어. 너 요즘 그 길들을 다녀봤으니 같이 한번 볼래?' },
        { speaker: 'collector', zh: '先看每條路現在的情況。能安全過去就好，不一定要走最近的。', ko: '각 길의 지금 상태부터 보자. 안전하게 지나갈 수 있으면 돼. 꼭 가장 가까운 길일 필요는 없어.' }
      ]
    },
    'north-forest-road-arrival': {
      id: 'north-forest-road-arrival', chapterId: 'waterway-side-quests', titleKo: '이번에는 앞에서',
      background: 'market', placeZh: '市集', placeKo: '장터', beats: [
        { speaker: 'merchant', zh: '咦？這次換你帶著車進市集了？', ko: '어라? 이번에는 네가 수레를 데리고 장터로 들어오네?' },
        { speaker: 'boy', zh: '只是剛好知道哪條路能走。', ko: '그냥 어느 길로 올 수 있는지 알았을 뿐이에요.' },
        { speaker: 'merchant', zh: '剛來的時候，你還跟著我的車走呢。', ko: '처음 왔을 때는 네가 내 수레를 따라왔었는데.' },
        { speaker: 'boy', zh: '……現在好像真的比較認得這裡了。', ko: '……이제 정말 이곳을 좀 알 것 같아요.' },
        { speaker: 'merchant', zh: '那就好。慢慢來吧。', ko: '그럼 됐네. 천천히 알아가면 되지.' }
      ]
    },
    'north-forest-epilogue': {
      id: 'north-forest-epilogue', chapterId: 'waterway-side-quests', titleKo: '낯설지 않은 주변',
      background: 'inn', placeZh: '客棧', placeKo: '여관', beats: [
        { speaker: 'narrator', zh: '剛到三溪鎮的時候，三條路、市集和森林都是第一次看到的地方。現在聽到一個委託，少年已經會慢慢想起該往哪裡走。', ko: '처음 물길마을에 왔을 때는 세 갈래 길도, 장터도, 숲도 모두 처음 보는 곳이었다. 이제는 부탁을 들으면 어느 쪽으로 가야 할지 조금씩 떠오른다.' },
        { speaker: 'boy', zh: '北邊森林、市集、工坊谷……我好像慢慢知道它們在哪裡了。', ko: '북쪽 숲, 장터, 장인골…… 어디에 있는지 조금씩 알 것 같아.' }
      ]
    }
  });

  const collection = globalThis.JourneyContent.JOURNEY.find(item => item.id === 'waterway-side-quests');
  const forest = collection?.sections?.find(item => item.id === 'north-forest');
  if (!forest) return;

  const quests = [
    {
      id: 'north-forest-signs', titleKo: '숲길의 표식', titleZh: '森林路的標記', introStoryId: 'north-forest-signs-request',
      revealRequires: ['story:north-forest-signs-request'], sequence: [
        { type: 'story', id: 'north-forest-signs-request', entryRegionId: 'quest-board', requires: ['story:quest-board-installed'] },
        { type: 'stage', id: IDS.F2, entryRegionId: 'north-forest', requires: ['story:north-forest-signs-request'] },
        { type: 'story', id: 'north-forest-after-f2', entryRegionId: 'north-forest', requires: [`stage:${IDS.F2}`] },
        { type: 'stage', id: IDS.F3, entryRegionId: 'north-forest', requires: ['story:north-forest-after-f2'] },
        { type: 'story', id: 'north-forest-signs-report', entryRegionId: 'north-forest', requires: [`stage:${IDS.F3}`], returnToWorldAfter: true }
      ]
    },
    {
      id: 'north-forest-materials', titleKo: '장인이 찾는 재료', titleZh: '工匠要找的材料', introStoryId: 'north-forest-material-request',
      revealRequires: ['story:north-forest-material-request'], sequence: [
        { type: 'story', id: 'north-forest-material-request', entryRegionId: 'quest-board', requires: ['story:quest-board-installed'] },
        { type: 'stage', id: IDS.F4, entryRegionId: 'north-forest', requires: ['story:north-forest-material-request'] },
        { type: 'story', id: 'north-forest-after-f4', entryRegionId: 'north-forest', requires: [`stage:${IDS.F4}`] },
        { type: 'stage', id: IDS.F5, entryRegionId: 'north-forest', requires: ['story:north-forest-after-f4'] },
        { type: 'story', id: 'north-forest-material-report', entryRegionId: 'north-forest', requires: [`stage:${IDS.F5}`], returnToWorldAfter: true }
      ]
    },
    {
      id: 'north-forest-bundle', titleKo: '사라진 꾸러미', titleZh: '遺失的包裹', introStoryId: 'north-forest-bundle-request',
      revealRequires: ['story:north-forest-bundle-request'], sequence: [
        { type: 'story', id: 'north-forest-bundle-request', entryRegionId: 'quest-board', requires: ['story:north-forest-signs-report', 'story:north-forest-material-report'] },
        { type: 'stage', id: IDS.F6, entryRegionId: 'north-forest', requires: ['story:north-forest-bundle-request'] },
        { type: 'story', id: 'north-forest-after-f6', entryRegionId: 'north-forest', requires: [`stage:${IDS.F6}`] },
        { type: 'stage', id: IDS.F7, entryRegionId: 'north-forest', requires: ['story:north-forest-after-f6'] },
        { type: 'story', id: 'north-forest-bundle-report', entryRegionId: 'north-forest', requires: [`stage:${IDS.F7}`], returnToWorldAfter: true }
      ]
    },
    {
      id: 'north-forest-road', titleKo: '오늘의 숲길', titleZh: '今天的森林路', introStoryId: 'north-forest-road-request',
      revealRequires: ['story:north-forest-road-request'], sequence: [
        { type: 'story', id: 'north-forest-road-request', entryRegionId: 'quest-board', requires: ['story:north-forest-bundle-report'] },
        { type: 'stage', id: IDS.F8, entryRegionId: 'north-forest', requires: ['story:north-forest-road-request'] },
        { type: 'story', id: 'north-forest-road-arrival', entryRegionId: 'north-forest', requires: [`stage:${IDS.F8}`] },
        { type: 'story', id: 'north-forest-epilogue', entryRegionId: 'north-forest', requires: ['story:north-forest-road-arrival'], milestone: 'north-forest-familiar', returnToWorldAfter: true }
      ]
    }
  ];

  for (const quest of quests) if (!forest.quests.some(item => item.id === quest.id)) forest.quests.push(quest);

  globalThis.NorthForestContent = Object.freeze({ IDS, QUESTS: quests.map(quest => Object.freeze({
    id: quest.id, titleKo: quest.titleKo, titleZh: quest.titleZh, introStoryId: quest.introStoryId,
    stageIds: quest.sequence.filter(node => node.type === 'stage').map(node => node.id),
    finalStoryId: quest.sequence.filter(node => node.type === 'story').at(-1).id
  })) });
})();
