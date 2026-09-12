/* Market M5-M8 story/stage sequence. */
(() => {
  const stories = JourneyContent.STORIES;
  Object.assign(stories, {
    'market-m5-setup': {
      id: 'market-m5-setup', chapterId: 'chapter-1-three-roads', titleKo: '두 가지 운반 도구',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'narrator', zh: '少年記住客棧的位置，又回到市集的大路。收貨處前放著三包剛到的貨。', ko: '소년은 여관 위치를 기억해 두고 다시 장터 큰길로 돌아왔다. 받는 곳 앞에는 막 도착한 짐 세 꾸러미가 놓여 있었다.' },
        { speaker: 'marketkeeper', zh: '正好。這三包貨要搬過去，可是今天能用的工具只剩兩種。', ko: '마침 잘 왔네. 이 짐 세 꾸러미를 저쪽으로 옮겨야 하는데, 오늘 쓸 수 있는 도구가 두 종류밖에 안 남았어.' },
        { speaker: 'marketkeeper', zh: '小籃子便宜，一次只能帶兩包；大木箱比較貴，可是三包一次就能帶走。', ko: '작은 바구니는 싸지만 한 번에 두 개만 들 수 있고, 큰 나무상자는 더 비싸지만 세 개를 한 번에 옮길 수 있어.' },
        { speaker: 'marketkeeper', zh: '先把價格和能裝多少都看清楚，再由你選擇。兩種都能把事情做完。', ko: '가격과 한 번에 얼마나 실을 수 있는지 둘 다 보고 네가 골라. 어느 쪽을 골라도 일은 끝낼 수 있어.' },
        { speaker: 'boy', zh: '所以不能只看哪個比較便宜。', ko: '그럼 어느 쪽이 더 싼지만 보면 안 되겠네요.' }
      ]
    },
    'market-after-m5': {
      id: 'market-after-m5', chapterId: 'chapter-1-three-roads', titleKo: '가격과 가치',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'marketkeeper', zh: '好了，三包貨都到了。', ko: '좋아, 짐 세 꾸러미가 모두 도착했네.' },
        { speaker: 'marketkeeper', zh: '價格是要付多少錢；價值還要看你現在需要什麼。', ko: '가격은 얼마를 내야 하는지고, 가치는 지금 무엇이 필요한지까지 봐야 해.' },
        { speaker: 'boy', zh: '兩個選擇都能完成，只是付出的東西不一樣。', ko: '둘 다 끝낼 수 있지만, 대신 치르는 게 서로 다르네요.' }
      ]
    },
    'market-m6-setup': {
      id: 'market-m6-setup', chapterId: 'chapter-1-three-roads', titleKo: '이번에는 하나만',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'marketkeeper', zh: '還有兩件急著送的東西：一袋麵粉和一罐燈油。', ko: '급히 보내야 할 게 두 가지 더 있어. 밀가루 한 자루와 등잔기름 한 통이야.' },
        { speaker: 'marketkeeper', zh: '可是你現在的行李只能再放一件。這一趟先選一件送，另一件等下一趟。', ko: '그런데 지금 네 짐에는 하나밖에 더 못 넣어. 이번에는 하나를 골라 먼저 보내고, 다른 하나는 다음 차례로 미루자.' },
        { speaker: 'boy', zh: '不是丟掉，只是這一趟不帶。', ko: '버리는 게 아니라, 이번 차례에는 안 가져가는 거군요.' },
        { speaker: 'marketkeeper', zh: '對。這次的放棄，是把順序讓給另一件。', ko: '그래. 이번의 포기는 다른 물건에 먼저 순서를 내주는 거야.' }
      ]
    },
    'market-after-m6': {
      id: 'market-after-m6', chapterId: 'chapter-1-three-roads', titleKo: '다음 차례가 남아 있다',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'marketkeeper', zh: '先送的一件到了。另一件還好好留在原地，下一趟再送就行。', ko: '먼저 보낸 물건은 도착했어. 다른 하나는 그대로 잘 남아 있으니 다음 차례에 보내면 돼.' },
        { speaker: 'boy', zh: '原來放棄這一次，不等於永遠不要。', ko: '이번 한 번을 포기하는 게 영원히 안 한다는 뜻은 아니네요.' }
      ]
    },
    'market-m7-setup': {
      id: 'market-m7-setup', chapterId: 'chapter-1-three-roads', titleKo: '늦게 도착한 마지막 짐',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'narrator', zh: '傍晚前，最後一批晚到的貨終於送進市集。麵粉、菜、燈油和布混在一起。', ko: '해가 기울기 전, 마지막으로 늦었던 짐이 장터에 들어왔다. 밀가루와 채소, 등잔기름과 천이 한데 섞여 있었다.' },
        { speaker: 'marketkeeper', zh: '不是把東西都堆在一起就好。先看每個地方缺什麼，再分配。', ko: '물건을 한곳에 쌓아 두기만 해서는 안 돼. 먼저 각 장소에 뭐가 부족한지 보고 나눠 보내자.' },
        { speaker: 'marketkeeper', zh: '缺的補充進去，現在沒人需要的就送回倉庫。', ko: '부족한 건 보충하고, 지금 필요한 곳이 없는 물건은 창고로 보내면 돼.' },
        { speaker: 'boy', zh: '我先看需求，再把每樣東西送到它該去的地方。', ko: '먼저 필요한 걸 보고, 물건마다 가야 할 곳으로 보내볼게요.' }
      ]
    },
    'market-after-m7': {
      id: 'market-after-m7', chapterId: 'chapter-1-three-roads', titleKo: '장날을 앞두고',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'marketkeeper', zh: '這下晚到的貨也都歸位了。明天開市前只剩幾件零碎的事。', ko: '이제 늦게 온 물건도 전부 제자리를 찾았네. 장이 열리기 전에는 자잘한 일 몇 가지만 남았어.' },
        { speaker: 'marketkeeper', zh: '有的能直接分配，有的得先交換，還有一樣得花錢買。', ko: '어떤 건 바로 나눠 보내면 되고, 어떤 건 먼저 교환해야 하고, 하나는 돈을 주고 사야 해.' },
        { speaker: 'boy', zh: '順序我自己決定也可以嗎？', ko: '순서는 제가 정해도 돼요?' },
        { speaker: 'marketkeeper', zh: '當然。先看手上有什麼、各處缺什麼，再決定就好。', ko: '물론이지. 손에 뭐가 있고 각자 뭐가 필요한지만 보고 정하면 돼.' }
      ]
    },
    'market-m8-setup': {
      id: 'market-m8-setup', chapterId: 'chapter-1-three-roads', titleKo: '장이 열리기 전에',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'narrator', zh: '開市前，棚子還沒完全張好，客棧和兩個攤子也各少一樣東西。', ko: '장이 열리기 전, 천막은 아직 완전히 펼쳐지지 않았고 여관과 두 좌판에도 하나씩 부족한 것이 있었다.' },
        { speaker: 'marketkeeper', zh: '車邊有麵粉、燈油和布。布可以去換繩子；菜要到菜攤買。', ko: '짐 옆에는 밀가루와 등잔기름, 천이 있어. 천은 밧줄과 바꿀 수 있고, 채소는 채소 좌판에서 사야 해.' },
        { speaker: 'marketkeeper', zh: '怎麼走、先做哪一件，都由你決定。', ko: '어디로 가고 무엇부터 할지는 네가 정해.' },
        { speaker: 'boy', zh: '先看需要什麼，再看手上有什麼。剩下的就照情況處理。', ko: '먼저 무엇이 필요한지 보고, 손에 무엇이 있는지 보자. 나머지는 상황에 맞춰 처리하면 돼.' }
      ]
    },
    'market-after-m8': {
      id: 'market-after-m8', chapterId: 'chapter-1-three-roads', titleKo: '장터가 움직이기 시작하다',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'narrator', zh: '麵包坊添上麵粉，燈油攤補好油罐，新的繩子拉起棚布，客棧的鍋裡也多了青菜。', ko: '빵집에는 밀가루가 채워지고, 등잔기름 좌판에는 기름이 놓였다. 새 밧줄이 천막을 당겨 올렸고, 여관의 솥에도 채소가 더해졌다.' },
        { speaker: 'narrator', zh: '棚子一張開，攤主們開始招呼客人。原本零散的準備一下子連成了整個市集的動靜。', ko: '천막이 펼쳐지자 좌판 주인들이 손님을 맞기 시작했다. 흩어져 있던 준비가 한꺼번에 장터 전체의 움직임으로 이어졌다.' },
        { speaker: 'merchant', zh: '哎呀，你現在比我還熟這個市集了吧？', ko: '어머, 이제 나보다 네가 이 장터를 더 잘 아는 것 아니니?' },
        { speaker: 'marketkeeper', zh: '你不是只會搬東西。你會先看需要什麼，再決定怎麼交換、怎麼買、怎麼分配。', ko: '넌 그냥 물건만 나르는 게 아니구나. 무엇이 필요한지 먼저 보고, 어떻게 바꾸고 사고 나눌지 결정할 줄 알아.' },
        { speaker: 'boy', zh: '原來東西少一點，也不一定會亂掉。先看看手上有什麼就好了。', ko: '물건이 조금 모자라도 꼭 엉망이 되는 건 아니네요. 먼저 가진 걸 살펴보면 되는 거였어요.' },
        { speaker: 'narrator', zh: '少年回頭看了一眼客棧的燈，又看向熱鬧起來的市集。他已經知道，自己可以從哪裡回來，也知道這裡的人需要什麼。', ko: '소년은 여관의 등을 한 번 돌아보고, 활기를 띠기 시작한 장터를 바라봤다. 이제 돌아올 곳도, 이곳 사람들이 무엇을 필요로 하는지도 조금 알 것 같았다.' }
      ]
    }
  });

  const section = JourneyContent.JOURNEY
    .flatMap(chapter => chapter.sections)
    .find(item => item.id === 'market-town');
  if (!section || section.sequence.some(node => node.id === 'market-stage-5')) return;

  section.sequence.push(
    { type: 'story', id: 'market-m5-setup', requires: ['story:market-after-m4'] },
    { type: 'stage', id: 'market-stage-5', requires: ['story:market-m5-setup'] },
    { type: 'story', id: 'market-after-m5', requires: ['stage:market-stage-5'], returnToWorldAfter: true },
    { type: 'story', id: 'market-m6-setup', requires: ['story:market-after-m5'] },
    { type: 'stage', id: 'market-stage-6', requires: ['story:market-m6-setup'] },
    { type: 'story', id: 'market-after-m6', requires: ['stage:market-stage-6'], returnToWorldAfter: true },
    { type: 'story', id: 'market-m7-setup', requires: ['story:market-after-m6'] },
    { type: 'stage', id: 'market-stage-7', requires: ['story:market-m7-setup'] },
    { type: 'story', id: 'market-after-m7', requires: ['stage:market-stage-7'], returnToWorldAfter: true },
    { type: 'story', id: 'market-m8-setup', requires: ['story:market-after-m7'] },
    { type: 'stage', id: 'market-stage-8', requires: ['story:market-m8-setup'] },
    { type: 'story', id: 'market-after-m8', requires: ['stage:market-stage-8'], returnToWorldAfter: true }
  );
})();
