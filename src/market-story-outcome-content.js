/* Market story variants keyed by first-play M5/M6 outcomes. */
(() => {
  const base = globalThis.StoryOutcomeContent;
  const VARIANTS = {
    'market-after-m5': {
      stageId: 'market-stage-5', field: 'choice',
      variants: {
        basket: [
          { speaker: 'marketkeeper', zh: '你選了小籃子。省下的錢比較多，不過三包貨要分兩趟搬。', ko: '작은 바구니를 골랐구나. 돈은 더 많이 남았지만, 짐 세 개는 두 번에 나눠 옮겨야 했어.' },
          { speaker: 'boy', zh: '我多走了一趟，不過錢還剩很多。', ko: '한 번 더 오갔지만 돈은 많이 남았네요.' },
          { speaker: 'marketkeeper', zh: '對。價格是要付多少錢；價值還要看你現在需要什麼。', ko: '그래. 가격은 얼마를 내는지고, 가치는 지금 무엇이 필요한지까지 봐야 해.' },
          { speaker: 'boy', zh: '所以便宜不一定比較好，只是這次我選了省錢。', ko: '그러니까 싸다고 무조건 더 좋은 건 아니고, 이번에는 돈을 아끼는 쪽을 고른 거네요.' }
        ],
        crate: [
          { speaker: 'marketkeeper', zh: '你選了大木箱。花的錢比較多，不過三包貨一次就搬完了。', ko: '큰 나무상자를 골랐구나. 돈은 더 들었지만 짐 세 개를 한 번에 다 옮겼어.' },
          { speaker: 'boy', zh: '錢剩得少一點，可是不用再走第二趟。', ko: '돈은 덜 남았지만 두 번째로 오갈 필요는 없었네요.' },
          { speaker: 'marketkeeper', zh: '對。價格是要付多少錢；價值還要看你現在需要什麼。', ko: '그래. 가격은 얼마를 내는지고, 가치는 지금 무엇이 필요한지까지 봐야 해.' },
          { speaker: 'boy', zh: '所以貴不一定比較差，只是這次我選了省時間。', ko: '그러니까 비싸다고 무조건 나쁜 건 아니고, 이번에는 오가는 수고를 아끼는 쪽을 고른 거네요.' }
        ]
      }
    },
    'market-after-m6': {
      stageId: 'market-stage-6', field: 'chosenCargo',
      variants: {
        flour: [
          { speaker: 'marketkeeper', zh: '麵粉先送到麵包坊了。燈油還留在原地，下一趟再送。', ko: '밀가루는 먼저 빵집에 도착했어. 등잔기름은 그대로 남아 있으니 다음 차례에 보내면 돼.' },
          { speaker: 'boy', zh: '我這一趟放棄了燈油，可是沒有把它丟掉。', ko: '이번에는 등잔기름을 포기했지만, 버린 건 아니네요.' },
          { speaker: 'marketkeeper', zh: '沒錯。有時候放棄只是先決定順序。', ko: '맞아. 어떤 포기는 그냥 순서를 먼저 정하는 일이기도 해.' }
        ],
        oil: [
          { speaker: 'marketkeeper', zh: '燈油先送到油攤了。麵粉還留在原地，下一趟再送。', ko: '등잔기름은 먼저 기름 좌판에 도착했어. 밀가루는 그대로 남아 있으니 다음 차례에 보내면 돼.' },
          { speaker: 'boy', zh: '我這一趟放棄了麵粉，可是沒有把它丟掉。', ko: '이번에는 밀가루를 포기했지만, 버린 건 아니네요.' },
          { speaker: 'marketkeeper', zh: '沒錯。有時候放棄只是先決定順序。', ko: '맞아. 어떤 포기는 그냥 순서를 먼저 정하는 일이기도 해.' }
        ]
      }
    }
  };

  function resolve(story, progress) {
    const resolved = base?.resolve ? base.resolve(story, progress) : story;
    const cfg = VARIANTS[resolved?.id];
    if (!cfg) return resolved;
    const key = progress?.stageOutcomes?.[cfg.stageId]?.[cfg.field];
    const beats = cfg.variants[key];
    return beats ? { ...resolved, beats } : resolved;
  }

  globalThis.StoryOutcomeContent = Object.freeze({
    ...(base || {}), marketVariants: VARIANTS, resolve
  });
})();
