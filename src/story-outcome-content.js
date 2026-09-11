/* Small story variants keyed by saved first-play tactical outcomes. */
(() => {
  const VARIANTS = {
    'gate-after-route': {
      stageId: 'gate-stage-3',
      variants: {
        'west-post': [
          { speaker: 'narrator', zh: '少年到了北口，從行李裡拿出西哨站交給他的木牌。', ko: '소년은 북쪽 출구에 도착해 짐 속에서 서쪽 초소가 건네준 나무패를 꺼냈다.' },
          { speaker: 'narrator', zh: '木牌上刻著「西哨通行牌」。', ko: '나무패에는 「西哨通行牌」라고 새겨져 있었다.' },
          { speaker: 'boy', zh: '看到這塊牌，就知道我是經由西路過來的。', ko: '이 패를 보면 내가 서쪽 길을 거쳐서 왔다는 걸 알 수 있겠네.' },
          { speaker: 'narrator', zh: '東西兩條路在北口重新會合。前方不遠處，一輛貨車停在路邊。', ko: '동쪽과 서쪽 두 길은 북쪽 출구에서 다시 만났다. 조금 앞쪽 길가에는 짐수레 한 대가 멈춰 있었다.' },
          { speaker: 'boy', zh: '那輛車……是不是又卡住了？', ko: '저 수레…… 또 어디 걸린 건가?' }
        ],
        'east-post': [
          { speaker: 'narrator', zh: '少年到了北口，從行李裡拿出東哨站交給他的木牌。', ko: '소년은 북쪽 출구에 도착해 짐 속에서 동쪽 초소가 건네준 나무패를 꺼냈다.' },
          { speaker: 'narrator', zh: '木牌上刻著「東哨通行牌」。', ko: '나무패에는 「東哨通行牌」라고 새겨져 있었다.' },
          { speaker: 'boy', zh: '看到這塊牌，就知道我是經由東路過來的。', ko: '이 패를 보면 내가 동쪽 길을 거쳐서 왔다는 걸 알 수 있겠네.' },
          { speaker: 'narrator', zh: '東西兩條路在北口重新會合。前方不遠處，一輛貨車停在路邊。', ko: '동쪽과 서쪽 두 길은 북쪽 출구에서 다시 만났다. 조금 앞쪽 길가에는 짐수레 한 대가 멈춰 있었다.' },
          { speaker: 'boy', zh: '那輛車……是不是又卡住了？', ko: '저 수레…… 또 어디 걸린 건가?' }
        ],
        'east-post+west-post': [
          { speaker: 'narrator', zh: '少年到了北口，從行李裡拿出兩塊木牌。', ko: '소년은 북쪽 출구에 도착해 짐 속에서 나무패 두 개를 꺼냈다.' },
          { speaker: 'narrator', zh: '一塊刻著「西哨通行牌」，另一塊刻著「東哨通行牌」。', ko: '하나는 「西哨通行牌」, 다른 하나는 「東哨通行牌」였다.' },
          { speaker: 'boy', zh: '原來路線不同，經由的哨站也會不同，但最後都能到達北口。', ko: '경로가 다르면 거치는 초소도 달라지지만, 어느 쪽이든 북쪽 출구에 도착하는구나.' },
          { speaker: 'narrator', zh: '兩條路最後都在北口重新會合。前方不遠處，一輛貨車停在路邊。', ko: '두 길은 결국 북쪽 출구에서 다시 만났다. 조금 앞쪽 길가에는 짐수레 한 대가 멈춰 있었다.' },
          { speaker: 'boy', zh: '那輛車……是不是又卡住了？', ko: '저 수레…… 또 어디 걸린 건가?' }
        ]
      }
    },
    'gate-after-narrow-gate': {
      stageId: 'gate-stage-3',
      variants: {
        'west-post': [
          { speaker: 'driver', zh: '過去了！多虧先把車往後退，門打開後總算能往前走了。', ko: '통과했다! 먼저 수레를 뒤로 뺀 덕분에 문을 열고 앞으로 갈 수 있었어.' },
          { speaker: 'boy', zh: '原來只要換個位置，同一輛車就能繼續走。', ko: '위치를 바꿔 주니 같은 수레도 다시 움직일 수 있네요.' },
          { speaker: 'narrator', zh: '貨車過了門，前方的舊路卻被封住了，只剩一條新開的繞道。', ko: '수레가 문을 지나자 앞쪽의 옛길은 막혀 있었고, 새로 난 우회로만 남아 있었다.' },
          { speaker: 'narrator', zh: '車夫看見少年行李旁掛著「西哨通行牌」。', ko: '수레꾼은 소년의 짐 옆에 매달린 「西哨通行牌」를 보았다.' },
          { speaker: 'driver', zh: '你走過西路？那你應該認得這附近的路。', ko: '서쪽 길을 걸어봤어? 그럼 이 근처 길은 알겠구나.' },
          { speaker: 'boy', zh: '那我來帶路吧。我走在前面探路，您跟著我走。', ko: '그럼 제가 길을 안내할게요. 앞에서 살펴볼 테니 제 뒤를 따라오세요.' }
        ],
        'east-post': [
          { speaker: 'driver', zh: '過去了！多虧先把車往後退，門打開後總算能往前走了。', ko: '통과했다! 먼저 수레를 뒤로 뺀 덕분에 문을 열고 앞으로 갈 수 있었어.' },
          { speaker: 'boy', zh: '原來只要換個位置，同一輛車就能繼續走。', ko: '위치를 바꿔 주니 같은 수레도 다시 움직일 수 있네요.' },
          { speaker: 'narrator', zh: '貨車過了門，前方的舊路卻被封住了，只剩一條新開的繞道。', ko: '수레가 문을 지나자 앞쪽의 옛길은 막혀 있었고, 새로 난 우회로만 남아 있었다.' },
          { speaker: 'narrator', zh: '車夫看見少年行李旁掛著「東哨通行牌」。', ko: '수레꾼은 소년의 짐 옆에 매달린 「東哨通行牌」를 보았다.' },
          { speaker: 'driver', zh: '你走過東路？那你應該認得這附近的路。', ko: '동쪽 길을 걸어봤어? 그럼 이 근처 길은 알겠구나.' },
          { speaker: 'boy', zh: '那我來帶路吧。我走在前面探路，您跟著我走。', ko: '그럼 제가 길을 안내할게요. 앞에서 살펴볼 테니 제 뒤를 따라오세요.' }
        ],
        'east-post+west-post': [
          { speaker: 'driver', zh: '過去了！多虧先把車往後退，門打開後總算能往前走了。', ko: '통과했다! 먼저 수레를 뒤로 뺀 덕분에 문을 열고 앞으로 갈 수 있었어.' },
          { speaker: 'boy', zh: '原來只要換個位置，同一輛車就能繼續走。', ko: '위치를 바꿔 주니 같은 수레도 다시 움직일 수 있네요.' },
          { speaker: 'narrator', zh: '貨車過了門，前方的舊路卻被封住了，只剩一條新開的繞道。', ko: '수레가 문을 지나자 앞쪽의 옛길은 막혀 있었고, 새로 난 우회로만 남아 있었다.' },
          { speaker: 'narrator', zh: '車夫看見少年帶著西哨和東哨兩塊通行牌。', ko: '수레꾼은 소년이 서쪽과 동쪽 초소의 통행패를 둘 다 지닌 것을 보았다.' },
          { speaker: 'driver', zh: '兩條路你都走過？那這附近就交給你帶路了。', ko: '두 길을 다 걸어봤어? 그럼 이 근처에서는 네가 앞장서 줘.' },
          { speaker: 'boy', zh: '好。我走在前面探路，您跟著我走。', ko: '좋아요. 앞에서 살펴볼 테니 제 뒤를 따라오세요.' }
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
