/* Story text is a game-authored layer, separate from official vocabulary data. */
(() => {
  const STORIES = {
    'prologue-departure': {
      id: 'prologue-departure', chapterId: 'prologue', titleKo: '고향을 떠나다',
      background: 'origin', placeZh: '出發', placeKo: '고향 마을',
      beats: [
        { speaker: 'narrator', zh: '天亮了。少年站在村口，背上是小小的行李。', ko: '날이 밝았다. 소년은 작은 짐을 메고 마을 어귀에 서 있었다.' },
        { speaker: 'boy', zh: '村子外面，會是什麼樣子呢？', ko: '마을 밖은 어떤 모습일까?' },
        { speaker: 'narrator', zh: '熟悉的小路一直通向森林。', ko: '익숙한 오솔길이 숲까지 이어져 있었다.' },
        { speaker: 'boy', zh: '好，出發吧。', ko: '좋아, 출발하자.' }
      ]
    },
    'prologue-forest-edge': {
      id: 'prologue-forest-edge', chapterId: 'prologue', titleKo: '숲 너머의 목소리',
      background: 'forest', placeZh: '森林邊', placeKo: '숲 어귀',
      beats: [
        { speaker: 'narrator', zh: '少年走出了森林。前面的路，漸漸寬了起來。', ko: '소년은 숲을 빠져나왔다. 앞에 놓인 길이 조금씩 넓어졌다.' },
        { speaker: 'boy', zh: '剛才石碑上的字……真的亮了嗎？', ko: '아까 석비의 글자…… 정말 빛났던 걸까?' },
        { speaker: 'narrator', zh: '他還沒想明白，路旁就傳來一個聲音。', ko: '미처 생각을 정리하기도 전에 길가에서 목소리가 들려왔다.' },
        { speaker: 'unknown', zh: '救命！有人在嗎？', ko: '사람 살려! 누구 없어요?' }
      ]
    },
    'chapter1-roadside-merchant': {
      id: 'chapter1-roadside-merchant', chapterId: 'chapter-1-three-roads', titleKo: '길가의 행상인',
      background: 'roadside', placeZh: '三岔路', placeKo: '세 갈래 길',
      beats: [
        { speaker: 'merchant', zh: '剛才有狼！我急著躲開，結果車輪卡住了。', ko: '방금 늑대가 있었어! 급히 피하다가 수레바퀴가 끼고 말았지.' },
        { speaker: 'boy', zh: '別急。我來幫你推。', ko: '잠깐만요. 제가 밀어볼게요.' },
        { speaker: 'narrator', zh: '兩人一起用力，總算把車推回了路上。', ko: '둘이 함께 힘을 쓰자 마침내 수레가 길 위로 올라왔다.' },
        { speaker: 'merchant', zh: '謝謝你！你是第一次來這裡吧？', ko: '고맙구나! 이곳은 처음이지?' },
        { speaker: 'merchant', zh: '前面的三條路都通往三溪鎮。關口那邊車馬來往多，沿著溪流能到工坊，走大路則會到市集。', ko: '앞의 세 길은 모두 물길마을로 이어져. 관문 쪽은 사람과 수레가 많이 오가고, 물길을 따라가면 공방이, 큰길로 가면 장터가 나오지.' },
        { speaker: 'merchant', zh: '三條路都走得通。想先看看哪裡，就由你決定吧。', ko: '세 길 모두 갈 수 있어. 어디부터 둘러볼지는 네가 정하렴.' }
      ]
    },
    'gate-arrival': {
      id: 'gate-arrival', chapterId: 'chapter-1-three-roads', titleKo: '관문에 도착하다',
      background: 'gate', placeZh: '關口鎮', placeKo: '길목',
      beats: [
        { speaker: 'narrator', zh: '少年沿著行商指的路，來到了三溪鎮外圍的關口。', ko: '소년은 행상인이 가리킨 길을 따라 물길마을 외곽의 길목에 도착했다.' },
        { speaker: 'gatekeeper', zh: '第一次來嗎？北邊的路最近不太好走。', ko: '처음 왔나? 요즘 북쪽 길이 좀 좋지 않아.' },
        { speaker: 'gatekeeper', zh: '關口裡有一塊舊路標，字有點看不清楚。', ko: '관문 안쪽에 오래된 길표지가 있는데, 글자가 좀 잘 안 보여.' },
        { speaker: 'gatekeeper', zh: '可以進入關口幫我看看嗎？看完後，從原路退出來就好。', ko: '관문 안으로 들어가서 한번 살펴봐 줄래? 확인한 뒤에는 들어온 길로 다시 나오면 돼.' },
        { speaker: 'boy', zh: '好，我去看看。', ko: '좋아요. 가서 볼게요.' }
      ]
    },
    'gate-after-entry': {
      id: 'gate-after-entry', chapterId: 'chapter-1-three-roads', titleKo: '안팎은 잘 보네',
      background: 'gate', placeZh: '關口鎮', placeKo: '길목',
      beats: [
        { speaker: 'gatekeeper', zh: '回來了？裡面的路標怎麼樣？', ko: '돌아왔네. 안쪽 길표지는 어땠어?' },
        { speaker: 'boy', zh: '字有一點模糊。可是我靠近的時候，好像突然看清楚了。', ko: '글자가 조금 흐렸어요. 그런데 가까이 가니까 갑자기 또렷하게 보인 것 같아요.' },
        { speaker: 'gatekeeper', zh: '是嗎？也許只是光線吧。至少你進出關口都很順。', ko: '그래? 빛 때문일지도 모르지. 그래도 관문 안팎은 잘 오가네.' },
        { speaker: 'narrator', zh: '這時，塔上的鐘響了。幾個人抬頭看向遠處。', ko: '그때 감시탑의 종이 울렸다. 몇 사람이 고개를 들어 먼 곳을 바라봤다.' },
        { speaker: 'gatekeeper', zh: '正好。下一件事，跟鐘聲能傳多遠有關。', ko: '잘됐네. 다음 일은 종소리가 어디까지 닿는지와 관계가 있어.' }
      ]
    },
    'gate-bell-task': {
      id: 'gate-bell-task', chapterId: 'chapter-1-three-roads', titleKo: '종소리를 확인해 줘',
      background: 'gate', placeZh: '關口鎮', placeKo: '길목',
      beats: [
        { speaker: 'gatekeeper', zh: '北邊新開的路上，鐘聲到底能傳到哪裡，我們還不確定。', ko: '북쪽에 새로 난 길에서 종소리가 어디까지 닿는지 아직 확실하지 않아.' },
        { speaker: 'gatekeeper', zh: '我在路上立了幾支標記牌。走到標記旁，就能比較它和鐘樓的距離。', ko: '길에 표지판을 몇 개 세워 뒀어. 표지판 옆에 서면 종탑과의 거리를 비교할 수 있지.' },
        { speaker: 'gatekeeper', zh: '幫我找找看，哪一個標記還聽得到鐘聲，而且離鐘樓最遠。', ko: '종소리가 아직 들리는 표식 중에서 종탑과 가장 멀리 떨어진 곳을 찾아봐 줘.' },
        { speaker: 'boy', zh: '好。我一路聽聽看。', ko: '좋아요. 움직이면서 들어볼게요.' }
      ]
    },
    'gate-after-bell': {
      id: 'gate-after-bell', chapterId: 'chapter-1-three-roads', titleKo: '종소리의 가장자리',
      background: 'gate', placeZh: '關口鎮', placeKo: '길목',
      beats: [
        { speaker: 'boy', zh: '找到了。再往外一點，就聽不到了。', ko: '찾았어요. 여기서 조금만 더 멀어지면 들리지 않아요.' },
        { speaker: 'gatekeeper', zh: '那裡就是鐘聲能到的範圍邊緣。', ko: '그곳이 종소리가 닿는 범위의 가장자리구나.' },
        { speaker: 'boy', zh: '每個標記和鐘樓的距離都不一樣。把還聽得到鐘聲的地方連起來，就能看出它的範圍了。', ko: '표식마다 종탑과의 거리가 달랐어요. 그래도 종소리가 들리는 곳을 이어 보니 범위가 어디까지인지 알겠어요.' },
        { speaker: 'gatekeeper', zh: '很好。接下來還得把調查結果送到北邊的哨站。那裡有兩條路可以走。', ko: '좋아. 이제 조사 결과를 북쪽 초소에 전해야겠군. 그곳으로 가는 길은 두 갈래야.' }
      ]
    },
    'gate-route-task': {
      id: 'gate-route-task', chapterId: 'chapter-1-three-roads', titleKo: '두 길 중 하나로',
      background: 'gate', placeZh: '關口鎮', placeKo: '길목',
      beats: [
        { speaker: 'gatekeeper', zh: '往北口的路分成兩條，西路和東路最後都能到達北口。', ko: '북쪽 출구로 가는 길은 둘로 갈라져 있어. 서쪽 길과 동쪽 길 모두 결국 북쪽 출구로 이어지지.' },
        { speaker: 'gatekeeper', zh: '剛才調查鐘聲範圍的結果也得回報哨站。你選一條路線，經由一個哨站再往北走吧。', ko: '방금 확인한 종소리 범위도 초소에 알려야 해. 경로를 하나 골라 초소 한 곳을 거쳐 북쪽으로 가 주렴.' },
        { speaker: 'gatekeeper', zh: '兩邊都走得通。挑一條你覺得好走的就行。', ko: '어느 쪽으로 가도 괜찮아. 네가 걷기 편한 길을 택하면 돼.' },
        { speaker: 'boy', zh: '明白了。我會先經過哨站。', ko: '알겠어요. 초소를 거쳐서 갈게요.' }
      ]
    },
    'gate-after-route': {
      id: 'gate-after-route', chapterId: 'chapter-1-three-roads', titleKo: '길은 다시 만난다',
      background: 'gate', placeZh: '北口', placeKo: '북쪽 출구',
      beats: [
        { speaker: 'narrator', zh: '少年經過哨站，從自己選的路線來到了北口。', ko: '소년은 초소를 거쳐 자신이 고른 길을 따라 북쪽 출구에 도착했다.' },
        { speaker: 'boy', zh: '原來兩條路都能到北口，只是沿途經過的地方不同。', ko: '두 길 모두 북쪽 출구로 이어지는구나. 다만 가는 동안 거치는 곳이 달라.' },
        { speaker: 'narrator', zh: '前方不遠處，一輛貨車停在路邊，車夫正繞著車子查看。', ko: '조금 앞쪽 길가에는 짐수레 한 대가 멈춰 있었고, 수레꾼이 수레 주위를 돌며 살펴보고 있었다.' },
        { speaker: 'boy', zh: '那輛車……是不是又卡住了？', ko: '저 수레…… 또 어디 걸린 건가?' }
      ]
    },
    'gate-cart-task': {
      id: 'gate-cart-task', chapterId: 'chapter-1-three-roads', titleKo: '바퀴가 걸린 자리',
      background: 'gate', placeZh: '北口外', placeKo: '북쪽 출구 밖',
      beats: [
        { speaker: 'driver', zh: '奇怪，車子動不了了。怎麼推都推不動。', ko: '이상하네. 수레가 움직이질 않아. 아무리 밀어도 꼼짝도 안 해.' },
        { speaker: 'boy', zh: '您先別推。我來看看貨車現在的位置，還有周圍的情況。', ko: '잠깐만 그대로 계세요. 수레의 현재 위치와 주변 상황부터 살펴볼게요.' },
        { speaker: 'driver', zh: '旁邊有箱子，也有石頭。可我看不出是哪一個在礙事。', ko: '옆에는 상자도 있고 돌도 있어. 그런데 뭐가 방해하는 건지는 모르겠어.' },
        { speaker: 'boy', zh: '一個一個查看，應該就能找出是哪裡卡住了。', ko: '하나씩 살펴보면 어디에 걸렸는지 찾을 수 있을 거예요.' }
      ]
    },
    'gate-after-obstacle': {
      id: 'gate-after-obstacle', chapterId: 'chapter-1-three-roads', titleKo: '다시 움직이는 수레',
      background: 'gate', placeZh: '北口外', placeKo: '북쪽 출구 밖',
      beats: [
        { speaker: 'driver', zh: '原來是那塊石頭卡住前輪。難怪一直推不動。', ko: '앞바퀴를 막은 게 그 돌이었구나. 어쩐지 아무리 밀어도 안 되더라.' },
        { speaker: 'boy', zh: '一、二——嘿！', ko: '하나, 둘— 영차!' },
        { speaker: 'narrator', zh: '少年彎下腰，用力把石頭推到路旁。', ko: '소년은 허리를 숙여 힘껏 돌을 길가로 밀어냈다.' },
        { speaker: 'narrator', zh: '障礙移開後，貨車慢慢往前走了。', ko: '장애물을 치우자 수레가 천천히 다시 움직이기 시작했다.' },
        { speaker: 'narrator', zh: '可是沒走多遠，貨車又在一扇狹窄的門前停了下來。', ko: '하지만 얼마 가지 않아 수레는 좁은 문 앞에서 다시 멈췄다.' },
        { speaker: 'driver', zh: '這扇門是往內開的，可是車停得太近，門推不開。', ko: '이 문은 안쪽으로 열리는데, 수레가 너무 바짝 붙어서 문을 밀 수가 없겠어.' },
        { speaker: 'boy', zh: '那得先把車挪開，替門騰出位置。', ko: '그럼 먼저 수레를 옮겨서 문이 열릴 자리를 만들어야겠네요.' }
      ]
    },
    'gate-narrow-gate-task': {
      id: 'gate-narrow-gate-task', chapterId: 'chapter-1-three-roads', titleKo: '좁은 문 앞에서',
      background: 'gate', placeZh: '北門', placeKo: '북쪽 좁은 문',
      beats: [
        { speaker: 'narrator', zh: '少年仔細看了看門板和貨車的位置。', ko: '소년은 문짝과 수레의 위치를 자세히 살펴보았다.' },
        { speaker: 'driver', zh: '往前推只會把門堵得更緊。', ko: '앞으로 밀면 문을 더 단단히 막게 되겠어.' },
        { speaker: 'boy', zh: '貨車朝北，現在不能前進，那就先後退一點。等門打開，再往前移動。', ko: '수레가 북쪽을 향하고 있으니, 지금 전진할 수 없다면 먼저 조금 후퇴시키면 되겠네요. 문을 연 다음 다시 앞으로 움직여 볼게요.' }
      ]
    },
    'gate-after-narrow-gate': {
      id: 'gate-after-narrow-gate', chapterId: 'chapter-1-three-roads', titleKo: '문 너머의 새 길',
      background: 'gate', placeZh: '北門外', placeKo: '북문 바깥',
      beats: [
        { speaker: 'driver', zh: '過去了！多虧先把車往後退，門打開後總算能往前走了。', ko: '통과했다! 먼저 수레를 뒤로 뺀 덕분에 문을 열고 앞으로 갈 수 있었어.' },
        { speaker: 'boy', zh: '原來只要換個位置，同一輛車就能繼續走。', ko: '위치를 바꿔 주니 같은 수레도 다시 움직일 수 있네요.' },
        { speaker: 'narrator', zh: '貨車過了門，前方的舊路卻被封住了，只剩一條新開的繞道。', ko: '수레가 문을 지나자 앞쪽의 옛길은 막혀 있었고, 새로 난 우회로만 남아 있었다.' },
        { speaker: 'driver', zh: '我沒走過這條路。你知道怎麼走嗎？', ko: '난 이 길을 가본 적이 없어. 어떻게 가는지 알아?' },
        { speaker: 'boy', zh: '我先走在前面探路。您跟著我走吧。', ko: '제가 앞에서 길을 살펴볼게요. 제 뒤를 따라오세요.' }
      ]
    },
    'gate-after-leading': {
      id: 'gate-after-leading', chapterId: 'chapter-1-three-roads', titleKo: '앞에서 이끄는 길',
      background: 'gate', placeZh: '北路', placeKo: '북쪽 길',
      beats: [
        { speaker: 'narrator', zh: '少年走在前面，貨車穩穩地跟在後方，最後一起抵達了北邊的路口。', ko: '소년이 앞장서자 수레는 그 뒤를 차근차근 따라왔고, 마침내 함께 북쪽 갈림길에 도착했다.' },
        { speaker: 'driver', zh: '原來跟著你走，就不用一直猜哪條路能過了。', ko: '네 뒤를 따라오니까 어느 길이 지나갈 수 있는지 계속 고민하지 않아도 되는군.' },
        { speaker: 'boy', zh: '我只是先確認貨車能不能通過，再帶您走過來而已。', ko: '수레도 지나갈 수 있는지 먼저 확인한 다음 이쪽으로 안내했을 뿐이에요.' },
        { speaker: 'gatekeeper', zh: '剛才你帶路帶得很好，那輛車一路都走得很順。', ko: '방금 길을 아주 잘 안내했어. 수레도 막히지 않고 잘 따라왔고.' },
        { speaker: 'narrator', zh: '不遠處，幾輛貨車正陸續駛進鐘聲範圍內的車隊集合處。', ko: '멀지 않은 곳에서는 수레 몇 대가 종소리가 닿는 집결지로 하나둘 들어오고 있었다.' },
        { speaker: 'gatekeeper', zh: '第一支往北走的車隊也快要出發了。', ko: '북쪽으로 가는 첫 수레 행렬도 곧 출발할 참이야.' }
      ]
    }
  };
  const JOURNEY = [
    { id: 'prologue', titleKo: '프롤로그 · 고향 마을', tag: '튜토리얼', sections: [
      { id: 'origin', nextSectionId: 'shared-intro', sequence: [
        { type: 'story', id: 'prologue-departure', requires: [] },
        ...Array.from({ length: 6 }, (_, i) => ({ type: 'stage', id: `stage-${i}`, requires: i ? [`stage:stage-${i - 1}`] : [] })),
        { type: 'story', id: 'prologue-forest-edge', requires: ['stage:stage-5'] }
      ] }
    ] },
    { id: 'chapter-1-three-roads', titleKo: '1장 · 세 갈래 길', sections: [
      { id: 'shared-intro', sequence: [
        { type: 'story', id: 'chapter1-roadside-merchant', requires: ['story:prologue-forest-edge'] }
      ] },
      { id: 'gate-town', regionId: 'gate-town', plannedStageCount: 7, sequence: [
        { type: 'story', id: 'gate-arrival', requires: ['story:chapter1-roadside-merchant'] },
        { type: 'stage', id: 'gate-stage-1', requires: ['story:gate-arrival'] },
        { type: 'story', id: 'gate-after-entry', requires: ['stage:gate-stage-1'], returnToWorldAfter: true },
        { type: 'story', id: 'gate-bell-task', requires: ['story:gate-after-entry'] },
        { type: 'stage', id: 'gate-stage-2', requires: ['story:gate-bell-task'] },
        { type: 'story', id: 'gate-after-bell', requires: ['stage:gate-stage-2'], returnToWorldAfter: true },
        { type: 'story', id: 'gate-route-task', requires: ['story:gate-after-bell'] },
        { type: 'stage', id: 'gate-stage-3', requires: ['story:gate-route-task'] },
        { type: 'story', id: 'gate-after-route', requires: ['stage:gate-stage-3'], returnToWorldAfter: true },
        { type: 'story', id: 'gate-cart-task', requires: ['story:gate-after-route'] },
        { type: 'stage', id: 'gate-stage-4', requires: ['story:gate-cart-task'] },
        { type: 'story', id: 'gate-after-obstacle', requires: ['stage:gate-stage-4'], returnToWorldAfter: true },
        { type: 'story', id: 'gate-narrow-gate-task', requires: ['story:gate-after-obstacle'] },
        { type: 'stage', id: 'gate-stage-5', requires: ['story:gate-narrow-gate-task'] },
        { type: 'story', id: 'gate-after-narrow-gate', requires: ['stage:gate-stage-5'], returnToWorldAfter: true },
        { type: 'stage', id: 'gate-stage-6', requires: ['story:gate-after-narrow-gate'] },
        { type: 'story', id: 'gate-after-leading', requires: ['stage:gate-stage-6'], returnToWorldAfter: true }
      ] },
      ...['workshop-town', 'market-town'].map(regionId => ({ id: regionId, regionId, plannedStageCount: 7, sequence: [] }))
    ] }
  ];
  globalThis.JourneyContent = Object.freeze({ STORIES, JOURNEY,
    tier1CoreMilestones: ['gate-core', 'workshop-core', 'market-core'] });
})();
