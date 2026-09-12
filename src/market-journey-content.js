/* Market M1-M3 story/stage sequence. */
(() => {
  const stories = JourneyContent.STORIES;
  Object.assign(stories, {
    'market-arrival': {
      id: 'market-arrival', chapterId: 'chapter-1-three-roads', titleKo: '장터로 들어서다',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'narrator', zh: '少年沿著大路走進市集。棚子下面擺著麵包、布匹、油罐和各種生活用品。', ko: '소년은 큰길을 따라 장터 안으로 들어갔다. 천막 아래에는 빵과 천, 기름통과 여러 생활용품이 놓여 있었다.' },
        { speaker: 'narrator', zh: '不遠處，一輛貨車停在幾個攤子旁。那個車棚和綁貨物的繩結，看起來有點眼熟。', ko: '멀지 않은 곳에 짐수레 한 대가 몇몇 좌판 옆에 서 있었다. 수레의 덮개와 짐을 묶은 매듭이 어딘가 익숙해 보였다.' },
        { speaker: 'boy', zh: '那輛車……好像在哪裡看過。', ko: '저 수레…… 어디서 본 것 같은데.' },
        { speaker: 'marketkeeper', zh: '小弟，可以幫我看一下這兩個攤子嗎？今天有幾車貨晚到了，我想先確認麵粉夠不夠。', ko: '꼬마야, 이 두 좌판을 좀 봐 줄래? 오늘 짐수레 몇 대가 늦어서 밀가루가 충분한지 먼저 확인하려고 해.' },
        { speaker: 'marketkeeper', zh: '先看每個攤子的需求，再看看現在有多少。旁邊的小車上還有一袋麵粉。', ko: '각 좌판에 얼마나 필요한지 보고 지금 얼마나 있는지 확인해 봐. 옆의 작은 배달수레에는 밀가루 한 자루가 남아 있어.' },
        { speaker: 'boy', zh: '好。我先看需要多少，再看現在有多少。', ko: '좋아요. 먼저 얼마나 필요한지 보고, 지금 얼마나 있는지 볼게요.' }
      ]
    },
    'market-after-m1': {
      id: 'market-after-m1', chapterId: 'chapter-1-three-roads', titleKo: '익숙한 수레',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'marketkeeper', zh: '好了，兩邊現在都夠了。謝謝你。', ko: '좋아, 이제 두 곳 모두 충분하네. 고맙다.' },
        { speaker: 'marketkeeper', zh: '剛才晚到的貨車也差不多卸完了。那邊還有一些箱子要整理。', ko: '아까 늦게 온 짐수레도 거의 다 짐을 내렸어. 저쪽에 아직 정리할 상자가 좀 남았네.' },
        { speaker: 'narrator', zh: '少年順著他指的方向看去。正是剛才覺得眼熟的那輛貨車。', ko: '소년은 장터지기가 가리킨 쪽을 보았다. 아까부터 눈에 익다고 생각했던 바로 그 수레였다.' },
        { speaker: 'boy', zh: '果然是那輛車。', ko: '역시 그 수레였구나.' }
      ]
    },
    'market-m2-setup': {
      id: 'market-m2-setup', chapterId: 'chapter-1-three-roads', titleKo: '장터에서 다시 만난 행상인',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'merchant', zh: '咦？是你！你也到市集來了？', ko: '어? 너구나! 너도 장터에 왔네?' },
        { speaker: 'boy', zh: '你的貨都送到了嗎？', ko: '물건은 다 배달하셨어요?' },
        { speaker: 'merchant', zh: '差不多了。剛才在路上耽擱了一點，總算趕上了。', ko: '거의 다. 길에서 좀 지체했지만 그래도 겨우 맞췄어.' },
        { speaker: 'merchant', zh: '可是車上還剩幾箱。我記得原來裝了多少，也知道送出了多少，可現在還是得看一眼剩下的數量。', ko: '그런데 수레에 상자가 몇 개 남았네. 원래 몇 개를 실었고 몇 개를 배달했는지는 기억하지만, 지금 남은 수량은 다시 한번 봐야겠어.' },
        { speaker: 'merchant', zh: '你可以幫我把真的剩下來的東西送回倉庫嗎？', ko: '실제로 남아 있는 물건을 창고로 돌려보내는 걸 좀 도와줄래?' },
        { speaker: 'boy', zh: '好。我先看看車上現在還有什麼。', ko: '좋아요. 수레에 지금 뭐가 남아 있는지부터 볼게요.' }
      ]
    },
    'market-after-m2': {
      id: 'market-after-m2', chapterId: 'chapter-1-three-roads', titleKo: '돌려보내지 않아도 되는 천',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'merchant', zh: '對，就是那兩箱燈油。這下車上真的整理乾淨了。', ko: '맞아, 남아 있던 건 그 등잔기름 두 상자였어. 이제 수레가 정말 정리됐네.' },
        { speaker: 'merchant', zh: '啊，還有這捆布。這個不用帶回去。前面的繩子攤正好需要布。', ko: '아, 그리고 이 천 한 묶음. 이건 다시 가져갈 필요 없겠다. 앞쪽 밧줄 좌판에서 마침 천이 필요하대.' },
        { speaker: 'merchant', zh: '我下一趟又正好少一捆繩子。也許可以拿這捆布去交換。', ko: '나는 다음 배달에 쓸 밧줄 한 묶음이 마침 부족해. 이 천을 가져가서 바꿀 수 있을지도 모르겠네.' },
        { speaker: 'boy', zh: '用剩下的布，換到需要的繩子。', ko: '남은 천으로 필요한 밧줄을 바꾸는 거군요.' },
        { speaker: 'merchant', zh: '對。要是你願意，再幫我跑一趟吧。', ko: '그래. 괜찮다면 한 번만 더 부탁할게.' }
      ]
    },
    'market-m3-setup': {
      id: 'market-m3-setup', chapterId: 'chapter-1-three-roads', titleKo: '천 한 묶음을 들고',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'narrator', zh: '行商把一捆布交給少年。繩子攤就在市集另一邊。', ko: '행상인은 천 한 묶음을 소년에게 건넸다. 밧줄 좌판은 장터 반대편에 있었다.' },
        { speaker: 'merchant', zh: '對方要的是布，我們要的是繩子。不是白拿，要互相交換。', ko: '저쪽에서 필요한 건 천이고, 우리에게 필요한 건 밧줄이야. 그냥 받는 게 아니라 서로 바꾸는 거지.' },
        { speaker: 'boy', zh: '交換以後，我再把獲得的繩子帶回來。', ko: '교환한 다음, 얻은 밧줄을 다시 가져올게요.' }
      ]
    },
    'market-after-m3': {
      id: 'market-after-m3', chapterId: 'chapter-1-three-roads', titleKo: '장터에서 각자의 일을 계속하다',
      background: 'market', placeZh: '市集', placeKo: '장터',
      beats: [
        { speaker: 'merchant', zh: '就是這個。謝啦，這樣下一趟的貨就能綁好了。', ko: '바로 이거야. 고맙다. 이제 다음 짐도 제대로 묶을 수 있겠어.' },
        { speaker: 'merchant', zh: '你已經開始幫市集的人做事啦？', ko: '벌써 장터 사람들 일도 돕고 있구나?' },
        { speaker: 'boy', zh: '只是剛好看到有需要幫忙的地方。', ko: '그냥 마침 도움이 필요한 곳이 보여서요.' },
        { speaker: 'merchant', zh: '哈哈，跟在路上遇到你的時候一樣。那我先去送下一批貨。晚點再見。', ko: '하하, 길에서 널 만났을 때랑 똑같네. 난 다음 짐을 배달하러 갈게. 또 보자.' },
        { speaker: 'narrator', zh: '行商推著車往另一排攤子走去。少年也回頭看向仍在忙碌的市集。', ko: '행상인은 수레를 끌고 다른 좌판 쪽으로 갔다. 소년도 다시 분주한 장터를 바라보았다.' }
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
    { type: 'story', id: 'market-after-m3', requires: ['stage:market-stage-3'], returnToWorldAfter: true }
  );
})();
