/* Small story variants keyed by saved first-play tactical outcomes. */
(() => {
  const VARIANTS = {
    'gate-after-route': {
      stageId: 'gate-stage-3',
      variants: {
        'west-post': [
          { speaker: 'narrator', zh: '少年到了北口，從行李裡拿出西哨站交給他的木牌。', ko: '소년은 북쪽 출구에 도착해 짐 속에서 서쪽 초소가 건네준 나무패를 꺼냈다.' },
          { speaker: 'narrator', zh: '木牌上刻著「西哨通行牌」。', ko: '나무패에는 「西哨通行牌」라고 새겨져 있었다.' },
          { speaker: 'boy', zh: '看到這塊牌，就知道我是經由西路過來的。', ko: '이 패를 보면 내가 서쪽 길을 경유해서 왔다는 걸 알 수 있겠네.' },
          { speaker: 'narrator', zh: '東西兩條路在北口重新會合。前方不遠處，一輛貨車停在路邊。', ko: '동쪽과 서쪽 두 길은 북쪽 출구에서 다시 만났다. 조금 앞쪽 길가에는 짐수레 한 대가 멈춰 있었다.' },
          { speaker: 'boy', zh: '那輛車……是不是又卡住了？', ko: '저 수레…… 또 어디 걸린 건가?' }
        ],
        'east-post': [
          { speaker: 'narrator', zh: '少年到了北口，從行李裡拿出東哨站交給他的木牌。', ko: '소년은 북쪽 출구에 도착해 짐 속에서 동쪽 초소가 건네준 나무패를 꺼냈다.' },
          { speaker: 'narrator', zh: '木牌上刻著「東哨通行牌」。', ko: '나무패에는 「東哨通行牌」라고 새겨져 있었다.' },
          { speaker: 'boy', zh: '看到這塊牌，就知道我是經由東路過來的。', ko: '이 패를 보면 내가 동쪽 길을 경유해서 왔다는 걸 알 수 있겠네.' },
          { speaker: 'narrator', zh: '東西兩條路在北口重新會合。前方不遠處，一輛貨車停在路邊。', ko: '동쪽과 서쪽 두 길은 북쪽 출구에서 다시 만났다. 조금 앞쪽 길가에는 짐수레 한 대가 멈춰 있었다.' },
          { speaker: 'boy', zh: '那輛車……是不是又卡住了？', ko: '저 수레…… 또 어디 걸린 건가?' }
        ],
        'east-post+west-post': [
          { speaker: 'narrator', zh: '少年到了北口，從行李裡拿出兩塊木牌。', ko: '소년은 북쪽 출구에 도착해 짐 속에서 나무패 두 개를 꺼냈다.' },
          { speaker: 'narrator', zh: '一塊刻著「西哨通行牌」，另一塊刻著「東哨通行牌」。', ko: '하나는 「西哨通行牌」, 다른 하나는 「東哨通行牌」였다.' },
          { speaker: 'boy', zh: '結果兩條路我都走了一遍。不同的路線，也可以經由不同的地方。', ko: '결국 두 길을 다 걸어봤네. 다른 경로에서는 다른 곳을 경유할 수도 있고.' },
          { speaker: 'narrator', zh: '兩條路最後都在北口重新會合。前方不遠處，一輛貨車停在路邊。', ko: '두 길은 결국 북쪽 출구에서 다시 만났다. 조금 앞쪽 길가에는 짐수레 한 대가 멈춰 있었다.' },
          { speaker: 'boy', zh: '那輛車……是不是又卡住了？', ko: '저 수레…… 또 어디 걸린 건가?' }
        ]
      }
    }
  };
  const strings = value => Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string'))] : [];
  const outcomeKey = outcome => strings(outcome?.viaIds).sort().join('+');
  function resolve(story, progress) {
    const cfg = VARIANTS[story?.id];
    if (!cfg) return story;
    const beats = cfg.variants[outcomeKey(progress?.stageOutcomes?.[cfg.stageId])];
    return beats ? { ...story, beats } : story;
  }
  globalThis.StoryOutcomeContent = Object.freeze({ VARIANTS, outcomeKey, resolve });
})();
