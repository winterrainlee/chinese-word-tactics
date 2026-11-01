/* Market M1-M4 story/stage sequence. */
(() => {
  const stories = JourneyContent.STORIES;
  Object.assign(stories, {
    'market-arrival': {
      id: 'market-arrival', chapterId: 'chapter-1-three-roads', titleKo: '장터에서 다시 만나다',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'narrator', zh: '少年沿著大路走進市集。棚子下面擺著麵包、布匹、油罐和各種生活用品。', ko: '소년은 큰길을 따라 장터 안으로 들어갔다. 천막 아래에는 빵과 천, 기름통과 여러 생활용품이 놓여 있었다.' },
        { speaker: 'narrator', zh: '幾個攤子旁，一位捲起袖子的中年女行商正在分開剛送到的貨物。旁邊停著一輛小小的木製手推車。', ko: '몇몇 좌판 옆에서 소매를 걷어붙인 중년 행상 아주머니가 막 도착한 짐을 나누어 정리하고 있었다. 곁에는 작은 목제 손수레가 세워져 있었다.' },
        { speaker: 'merchant', zh: '哎，小弟！你也來市集啦。剛才路上真多虧你。', ko: '어머, 너도 장터에 왔구나. 아까 길에서는 정말 네 덕을 봤어.' },
        { speaker: 'boy', zh: '阿姨，妳的貨都送到了嗎？', ko: '아주머니, 물건은 다 배달하셨어요?' },
        { speaker: 'merchant', zh: '大半送到了。我今天還得在這裡跑幾趟，現在正忙著把這批貨分開。', ko: '거의 다 왔지. 오늘 장터에서 몇 번 더 오가야 해서, 지금은 이 짐부터 나눠 놓는 중이야.' },
        { speaker: 'marketkeeper', zh: '妳先忙這邊吧。那兩個攤子的麵粉我還沒確認。', ko: '아주머니는 이쪽부터 정리하세요. 저 두 좌판 밀가루는 아직 확인을 못 했네요.' },
        { speaker: 'merchant', zh: '小弟，可以再幫我一個小忙嗎？我現在走不開。幫我看看兩個攤子各需要多少；我手邊還有一袋麵粉。', ko: '얘야, 작은 부탁 하나만 더 해도 될까? 나는 지금 손을 뗄 수가 없네. 두 좌판에 각각 얼마나 필요한지 좀 봐 줘. 내 곁에 밀가루 한 자루가 남아 있어.' },
        { speaker: 'boy', zh: '好。我先看需求，再看現在夠不夠。', ko: '좋아요. 먼저 필요한 양을 보고, 지금 충분한지 확인할게요.' }
      ]
    },
    'market-after-m1': {
      id: 'market-after-m1', chapterId: 'chapter-1-three-roads', titleKo: '두 좌판을 채우고',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'marketkeeper', zh: '好了，兩邊現在都夠了。謝謝你。', ko: '좋아, 이제 두 곳 모두 충분하네. 고맙다.' },
        { speaker: 'merchant', zh: '幫大忙了。我這邊也整理得差不多了。', ko: '큰 도움이 됐어. 나도 이쪽 정리가 거의 끝났네.' },
        { speaker: 'merchant', zh: '不過這批貨還有幾箱沒處理。等一下有空的話，再幫阿姨看一眼吧。', ko: '그런데 이번 짐에 아직 처리하지 못한 상자가 몇 개 남았어. 괜찮으면 이따가 한 번만 더 봐 주렴.' }
      ]
    },
    'market-m2-setup': {
      id: 'market-m2-setup', chapterId: 'chapter-1-three-roads', titleKo: '아주머니의 남은 짐',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'merchant', zh: '剛好，你回來了。這批貨原來裝了多少、送出了多少，我都記得。', ko: '마침 잘 왔구나. 이번 짐에 원래 얼마나 있었고 얼마나 보냈는지는 내가 기억하고 있어.' },
        { speaker: 'merchant', zh: '可是現在真正剩下多少，還是得再看一眼。', ko: '그런데 지금 실제로 얼마나 남았는지는 다시 한번 봐야겠네.' },
        { speaker: 'merchant', zh: '你可以幫我把真的剩下來的東西送回倉庫嗎？', ko: '실제로 남아 있는 물건을 창고로 돌려보내는 걸 좀 도와줄래?' },
        { speaker: 'boy', zh: '好。我先看看現在還剩什麼。', ko: '좋아요. 지금 뭐가 남아 있는지부터 볼게요.' }
      ]
    },
    'market-after-m2': {
      id: 'market-after-m2', chapterId: 'chapter-1-three-roads', titleKo: '돌려보내지 않아도 되는 천',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'merchant', zh: '對，就是那兩箱燈油。這下這批貨真的整理乾淨了。', ko: '맞아, 남아 있던 건 그 등잔기름 두 상자였어. 이제 이번 짐은 정말 정리됐네.' },
        { speaker: 'merchant', zh: '啊，還有這捆布。這個不用帶回去。前面的繩子攤正好需要布。', ko: '아, 그리고 이 천 한 묶음. 이건 다시 가져갈 필요 없겠다. 앞쪽 밧줄 좌판에서 마침 천이 필요하대.' },
        { speaker: 'merchant', zh: '我下一趟又正好少一捆繩子。也許可以拿這捆布去交換。', ko: '나는 다음 배달에 쓸 밧줄 한 묶음이 마침 부족해. 이 천을 가져가서 바꿀 수 있을지도 모르겠네.' },
        { speaker: 'boy', zh: '用剩下的布，換到需要的繩子。', ko: '남은 천으로 필요한 밧줄을 바꾸는 거군요.' },
        { speaker: 'merchant', zh: '對。要是你願意，再幫阿姨跑一趟吧。', ko: '그래. 괜찮다면 아주머니 심부름 한 번만 더 해 주렴.' }
      ]
    },
    'market-m3-setup': {
      id: 'market-m3-setup', chapterId: 'chapter-1-three-roads', titleKo: '천 한 묶음을 들고',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'narrator', zh: '行商阿姨把一捆布交給少年。繩子攤就在市集另一邊。', ko: '행상 아주머니는 천 한 묶음을 소년에게 건넸다. 밧줄 좌판은 장터 반대편에 있었다.' },
        { speaker: 'merchant', zh: '對方要的是布，我們要的是繩子。不是白拿，要互相交換。', ko: '저쪽에서 필요한 건 천이고, 우리에게 필요한 건 밧줄이야. 그냥 받는 게 아니라 서로 바꾸는 거지.' },
        { speaker: 'boy', zh: '交換以後，我再把獲得的繩子帶回來。', ko: '교환한 다음, 얻은 밧줄을 다시 가져올게요.' }
      ]
    },
    'market-after-m3': {
      id: 'market-after-m3', chapterId: 'chapter-1-three-roads', titleKo: '각자의 일을 계속하다',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'merchant', zh: '就是這個。謝啦，這樣下一趟的貨就能綁好了。', ko: '바로 이거야. 고맙다. 이제 다음 짐도 제대로 묶을 수 있겠어.' },
        { speaker: 'merchant', zh: '你已經開始幫市集的人做事啦？', ko: '벌써 장터 사람들 일도 돕고 있구나?' },
        { speaker: 'boy', zh: '只是剛好看到有需要幫忙的地方。', ko: '그냥 마침 도움이 필요한 곳이 보여서요.' },
        { speaker: 'merchant', zh: '哈哈，跟在路上遇到你的時候一樣。那我先去送下一批貨。晚點再見。', ko: '하하, 길에서 널 만났을 때랑 똑같네. 난 다음 짐을 배달하러 갈게. 또 보자.' },
        { speaker: 'narrator', zh: '行商阿姨拉著小木車往另一排攤子走去。少年也回頭看向仍在忙碌的市集。', ko: '행상 아주머니는 작은 목제 손수레를 끌고 다른 좌판 쪽으로 갔다. 소년도 다시 분주한 장터를 바라보았다.' }
      ]
    },
    'market-m4-setup': {
      id: 'market-m4-setup', chapterId: 'chapter-1-three-roads', titleKo: '오늘 저녁거리를 부탁받다',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'narrator', zh: '少年再走進市集時，一名客棧主人正站在兩個攤子中間，手裡拿著空籃子。', ko: '소년이 다시 장터로 들어오자, 여관 주인이 빈 바구니를 든 채 두 좌판 사이에 서 있었다.' },
        { speaker: 'innkeeper', zh: '小弟，你現在有空嗎？客棧的鍋還在火上，我得趕快回去看著。', ko: '얘야, 지금 잠깐 시간 있니? 여관에 솥을 불 위에 올려 둬서 내가 얼른 돌아가 봐야 해.' },
        { speaker: 'innkeeper', zh: '今晚還少一份菜和一個麵包。這十個錢幣給你，可以幫我買回來嗎？', ko: '오늘 저녁에 채소 한 묶음하고 빵 하나가 더 필요해. 이 동전 열 개를 줄 테니 대신 사다 줄래?' },
        { speaker: 'innkeeper', zh: '先看看價格。買好了就帶回來給我。', ko: '먼저 가격을 보고 사렴. 다 샀으면 내게 가져다줘.' },
        { speaker: 'boy', zh: '好。我買好了就送回來。', ko: '좋아요. 다 사면 바로 가져올게요.' }
      ]
    },
    'market-after-m4': {
      id: 'market-after-m4', chapterId: 'chapter-1-three-roads', titleKo: '오늘 돌아갈 곳',
      background: 'market', placeZh: '客棧旁', placeKo: '장터 골목',
      beats: [
        { speaker: 'innkeeper', zh: '菜和麵包都齊了。謝謝你，晚飯總算不用再擔心了。', ko: '채소와 빵이 다 모였네. 고맙다. 이제 저녁 준비는 걱정하지 않아도 되겠어.' },
        { speaker: 'innkeeper', zh: '對了，你今天住哪裡？', ko: '그러고 보니, 오늘은 어디서 묵니?' },
        { speaker: 'boy', zh: '我還沒決定。', ko: '아직 정하지 않았어요.' },
        { speaker: 'innkeeper', zh: '客棧還有一間空房。你今天幫了我不少忙，要是不嫌棄，今晚先住下吧。', ko: '여관에 빈방이 하나 있어. 오늘 네가 많이 도와줬으니, 괜찮다면 오늘은 거기서 쉬렴.' },
        { speaker: 'boy', zh: '真的可以嗎？', ko: '정말 그래도 돼요?' },
        { speaker: 'innkeeper', zh: '當然。先把這裡當個落腳處。想繼續逛市集也沒關係，晚一點再回來就好。', ko: '그럼. 우선 여기를 머물 곳으로 생각해. 장터를 더 둘러보고 싶으면 그래도 괜찮아. 나중에 돌아오면 돼.' },
        { speaker: 'narrator', zh: '少年看了看客棧門口亮起的燈。來到三溪鎮以後，他第一次有了一個可以回來的地方。', ko: '소년은 여관 입구에 켜진 등을 바라보았다. 물길마을에 온 뒤 처음으로, 돌아올 수 있는 곳이 하나 생겼다.' }
      ]
    }
  });

  const section = JourneyContent.JOURNEY
    .flatMap(chapter => chapter.sections)
    .find(item => item.id === 'market-town');
  if (!section) return;
  section.sequence.splice(0, section.sequence.length,
    { type: 'story', id: 'market-arrival', requires: ['story:chapter1-roadside-merchant'] },
    { type: 'stage', id: 'market-stage-1', requires: ['story:market-arrival'] },
    { type: 'story', id: 'market-after-m1', requires: ['stage:market-stage-1'], returnToWorldAfter: true },
    { type: 'story', id: 'market-m2-setup', requires: ['story:market-after-m1'] },
    { type: 'stage', id: 'market-stage-2', requires: ['story:market-m2-setup'] },
    { type: 'story', id: 'market-after-m2', requires: ['stage:market-stage-2'], returnToWorldAfter: true },
    { type: 'story', id: 'market-m3-setup', requires: ['story:market-after-m2'] },
    { type: 'stage', id: 'market-stage-3', requires: ['story:market-m3-setup'] },
    { type: 'story', id: 'market-after-m3', requires: ['stage:market-stage-3'], returnToWorldAfter: true },
    { type: 'story', id: 'market-m4-setup', requires: ['story:market-after-m3'] },
    { type: 'stage', id: 'market-stage-4', requires: ['story:market-m4-setup'] },
    { type: 'story', id: 'market-after-m4', requires: ['stage:market-stage-4'], returnToWorldAfter: true }
  );
})();
