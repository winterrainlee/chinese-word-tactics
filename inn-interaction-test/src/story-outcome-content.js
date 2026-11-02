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
  // The Academy Tower is available after Workshop W7, even when Gate G7
  // remains unfinished. Refer to the other glowing road sign only if the
  // boy has actually seen it. Replace just the Gate-specific beats.
  const towerBeforeGate = Object.freeze({
    'academic-tower-arrival': Object.freeze({ index: 5, beat: Object.freeze({
      speaker: 'boy', zh: '可是舊調節器的銘牌亮了一下。',
      ko: '하지만 오래된 조절기의 명판이 잠깐 빛났어요.'
    }) }),
    'academic-tower-turn-intro': Object.freeze({ index: 3, beat: Object.freeze({
      speaker: 'boy', zh: '舊調節器的銘牌上有這個記號。它亮了一下。',
      ko: '오래된 조절기 명판에 이 표식이 있었어요. 잠깐 빛났고요.'
    }) }),
    'academic-tower-turn-result': Object.freeze({ index: 8, beat: Object.freeze({
      speaker: 'boy', zh: '至少，它不只跟水車有關。',
      ko: '적어도 수차에만 관계된 건 아니네요.'
    }) })
  });
  // 04A: the earlier 03B visit changes one greeting, while the first
  // fieldwork inquiry changes what the pair actually plans to do next.
  // These are replacements of one beat, never new Journey nodes.
  const erVariants = Object.freeze({
    intro: Object.freeze({
      familiar: Object.freeze({ index:1, beat:Object.freeze({
        speaker:'boy', zh:'哎，又在這裡遇到你了！你要去哪裡？',
        ko:'어, 여기서 또 만나네요! 어디 가세요?'
      }) })
    }),
    result: Object.freeze({
      'inquiry-records': Object.freeze({ index:3, beat:Object.freeze({
        speaker:'towerResearcher',
        zh:'我們先查查後來有沒有修繕紀錄。今天的觀察也會告訴管理人員。',
        ko:'나중에 보수 기록이 남았는지 먼저 찾아보자. 오늘 관찰도 관리자에게 알리고.'
      }) }),
      'inquiry-outlet': Object.freeze({ index:3, beat:Object.freeze({
        speaker:'towerResearcher',
        zh:'等管理人員確認安全後，我們再去查看下游出口。今天的觀察也會先告訴他們。',
        ko:'관리자가 안전을 확인한 뒤에 하류 출구를 살펴보자. 오늘 관찰은 먼저 전달하고.'
      }) })
    })
  });
  const ER_STAGE = 'academic-tower-turn-04a-er-family';
  const replaceBeat = (story, replacement) => replacement && story?.beats?.[replacement.index]
    ? { ...story, beats:story.beats.map((beat,index) => index===replacement.index ? replacement.beat : beat) }
    : story;
  const strings = value => Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string'))] : [];
  const outcomeKey = outcome => strings(outcome?.viaIds).sort().join('+');
  function resolve(story, progress) {
    if (story?.lateIntroMilestone && progress?.completedMilestones?.includes(story.lateIntroMilestone)) {
      story={...story,beats:story.beats.map((beat,index)=>index===0 ? {...beat,ko:story.lateIntroKo} : beat)};
    }
    if (towerBeforeGate[story?.id] &&
        !strings(progress?.seenStories).includes('gate-after-convoy')) {
      return replaceBeat(story, towerBeforeGate[story.id]);
    }
    if (story?.id === 'academic-tower-er-intro') {
      const saved = progress?.sideResearchProgress?.[ER_STAGE]?.introVariantId;
      const familiar = saved === 'familiar' || (saved == null &&
        progress?.completedStages?.includes('academic-tower-turn-03b-ran-village'));
      return familiar ? replaceBeat(story,erVariants.intro.familiar) : story;
    }
    if (story?.id === 'academic-tower-er-result') {
      const selected = progress?.stageOutcomes?.[ER_STAGE]?.nextInquiryId;
      return replaceBeat(story,erVariants.result[selected]);
    }
    const cfg = VARIANTS[story?.id];
    if (!cfg) return story;
    const beats = cfg.variants[outcomeKey(progress?.stageOutcomes?.[cfg.stageId])];
    return beats ? { ...story, beats } : story;
  }
  globalThis.StoryOutcomeContent = Object.freeze({ VARIANTS, erVariants, towerBeforeGate, outcomeKey, resolve });
})();
