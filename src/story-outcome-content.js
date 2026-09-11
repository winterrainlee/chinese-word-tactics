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
    },
    'gate-after-narrow-gate': {
      stageId: 'gate-stage-3',
      variants: {
        'west-post': [
          { speaker: 'driver', zh: '進去了！剛才先後退，門打開後就能前進了。', ko: '들어왔다! 아까는 먼저 뒤로 물러났다가, 문이 열린 뒤에는 앞으로 갈 수 있었네.' },
          { speaker: 'boy', zh: '同一輛車，位置變了，能做的事也跟著變了。', ko: '같은 수레라도 위치가 바뀌니까 할 수 있는 일도 달라지네요.' },
          { speaker: 'narrator', zh: '貨車過了門，前面的舊路卻被封住，只剩一條新開的繞路。', ko: '수레가 문을 지나자 앞쪽의 옛길은 막혀 있었고 새로 난 우회로만 남아 있었다.' },
          { speaker: 'narrator', zh: '車夫看見少年行李旁掛著「西哨通行牌」。', ko: '마부는 소년의 짐 옆에 매달린 「西哨通行牌」를 보았다.' },
          { speaker: 'driver', zh: '你走過西路？那你應該認得這附近的路。', ko: '서쪽 길을 걸어봤어? 그럼 이 근처 길은 알겠구나.' },
          { speaker: 'boy', zh: '我帶你走吧。我走前面，你跟著我。', ko: '제가 이끌게요. 제가 앞에 갈 테니 따라오세요.' }
        ],
        'east-post': [
          { speaker: 'driver', zh: '進去了！剛才先後退，門打開後就能前進了。', ko: '들어왔다! 아까는 먼저 뒤로 물러났다가, 문이 열린 뒤에는 앞으로 갈 수 있었네.' },
          { speaker: 'boy', zh: '同一輛車，位置變了，能做的事也跟著變了。', ko: '같은 수레라도 위치가 바뀌니까 할 수 있는 일도 달라지네요.' },
          { speaker: 'narrator', zh: '貨車過了門，前面的舊路卻被封住，只剩一條新開的繞路。', ko: '수레가 문을 지나자 앞쪽의 옛길은 막혀 있었고 새로 난 우회로만 남아 있었다.' },
          { speaker: 'narrator', zh: '車夫看見少年行李旁掛著「東哨通行牌」。', ko: '마부는 소년의 짐 옆에 매달린 「東哨通行牌」를 보았다.' },
          { speaker: 'driver', zh: '你走過東路？那你應該認得這附近的路。', ko: '동쪽 길을 걸어봤어? 그럼 이 근처 길은 알겠구나.' },
          { speaker: 'boy', zh: '我帶你走吧。我走前面，你跟著我。', ko: '제가 이끌게요. 제가 앞에 갈 테니 따라오세요.' }
        ],
        'east-post+west-post': [
          { speaker: 'driver', zh: '進去了！剛才先後退，門打開後就能前進了。', ko: '들어왔다! 아까는 먼저 뒤로 물러났다가, 문이 열린 뒤에는 앞으로 갈 수 있었네.' },
          { speaker: 'boy', zh: '同一輛車，位置變了，能做的事也跟著變了。', ko: '같은 수레라도 위치가 바뀌니까 할 수 있는 일도 달라지네요.' },
          { speaker: 'narrator', zh: '貨車過了門，前面的舊路卻被封住，只剩一條新開的繞路。', ko: '수레가 문을 지나자 앞쪽의 옛길은 막혀 있었고 새로 난 우회로만 남아 있었다.' },
          { speaker: 'narrator', zh: '車夫看見少年帶著西哨和東哨兩塊通行牌。', ko: '마부는 소년이 서쪽과 동쪽 초소의 통행패를 둘 다 지닌 것을 보았다.' },
          { speaker: 'driver', zh: '兩條路你都走過？那這附近就交給你帶路了。', ko: '두 길을 다 걸어봤어? 그럼 이 근처에서는 네가 길을 이끌어줘.' },
          { speaker: 'boy', zh: '好。我走前面，你跟著我。', ko: '좋아요. 제가 앞에 갈 테니 따라오세요.' }
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
