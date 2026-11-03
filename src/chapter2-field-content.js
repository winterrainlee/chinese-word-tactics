/* Two independent post-rain field notebooks. Keys identify evidence and destinations in saves. */
(() => {
  const council = {
    id: 'council-stage-01-minutes', words: ['該','本'],
    region: 'council-town', prefix: 'chapter2-council-first', placeZh: '會議所', placeKo: '회의소',
    title: '누가 무엇을 말했을까', book: '회의록 초안',
    intro: [
      ['narrator','會議所裡，幾位居民正在等人發言。','회의소에 모인 주민들이 발언을 기다리고 있었다.'],
      ['marketkeeper','你來得正好。幫我們把大家的話記下來，好嗎？','마침 잘 왔구나. 사람들이 하는 말을 좀 적어 줄래?']
    ],
    prior: ['boy','我看過村口的公告。大家說的話，我會另外記。','마을 어귀에서 공고를 봤어요. 여기서 들은 말은 따로 적을게요.'],
    result: [
      ['narrator','大家看過記錄，決定先請人去現場確認。','주민들은 회의록을 돌려 보고 우선 현장을 살펴봐 달라고 부탁하기로 했다.'],
      ['boy','先把要查的事交給大家。先修哪裡，還沒決定。','확인할 일을 먼저 전하자. 어디부터 고칠지는 아직 정해지지 않았어.']
    ],
    sources: {
      market: ['장터 대표','上次的貨已經分好了。新一批貨還沒到，我們想先問問送貨的人。','지난 물자는 이미 나눴어요. 새 물자가 아직 안 와서 운반하는 분에게 먼저 물어보고 싶어요.'],
      workshop: ['장인골 대표','水車還在轉。我們想再檢查水道。','수차는 여전히 돌아가요. 수로를 다시 점검하고 싶습니다.'],
      resident: ['물가 주민','我擔心下次下大雨時，住在低處的人怎麼辦。','다음에 큰비가 오면 낮은 곳에 사는 사람들은 어떡할지 걱정이에요.'],
      minutes: ['물길마을 회의록 · 작성지 三溪鎮','先確認該批貨的運送情況。本鎮還沒有決定修繕順序。','해당 물자의 운반 상황부터 확인한다. 우리 마을은 아직 보수 순서를 정하지 않았다.']
    },
    readings: {"market": "ㄕㄤˋ ㄘˋ ㄉㄜ˙ ㄏㄨㄛˋ ㄧˇ ㄐㄧㄥ ㄈㄣ ㄏㄠˇ ㄌㄜ˙ ㄒㄧㄣ ㄧˋ ㄆㄧ ㄏㄨㄛˋ ㄏㄞˊ ㄇㄟˊ ㄉㄠˋ ㄨㄛˇ ㄇㄣ˙ ㄒㄧㄤˇ ㄒㄧㄢ ㄨㄣˋ ㄨㄣˋ ㄙㄨㄥˋ ㄏㄨㄛˋ ㄉㄜ˙ ㄖㄣˊ", "workshop": "ㄕㄨㄟˇ ㄔㄜ ㄏㄞˊ ㄗㄞˋ ㄓㄨㄢˋ ㄨㄛˇ ㄇㄣ˙ ㄒㄧㄤˇ ㄗㄞˋ ㄐㄧㄢˇ ㄔㄚˊ ㄕㄨㄟˇ ㄉㄠˋ", "resident": "ㄨㄛˇ ㄉㄢ ㄒㄧㄣ ㄒㄧㄚˋ ㄘˋ ㄒㄧㄚˋ ㄉㄚˋ ㄩˇ ㄕˊ ㄓㄨˋ ㄗㄞˋ ㄉㄧ ㄔㄨˋ ㄉㄜ˙ ㄖㄣˊ ㄗㄣˇ ㄇㄜ˙ ㄅㄢˋ", "minutes": "ㄒㄧㄢ ㄑㄩㄝˋ ㄖㄣˋ ㄍㄞ ㄆㄧ ㄏㄨㄛˋ ㄉㄜ˙ ㄩㄣˋ ㄙㄨㄥˋ ㄑㄧㄥˊ ㄎㄨㄤˋ ㄅㄣˇ ㄓㄣˋ ㄏㄞˊ ㄇㄟˊ ㄧㄡˇ ㄐㄩㄝˊ ㄉㄧㄥˋ ㄒㄧㄡ ㄕㄢˋ ㄕㄨㄣˋ ㄒㄩˋ"},
    sets: {
      speakers: {market:'장터 대표',workshop:'장인골 대표',resident:'물가 주민'},
      kinds: {report:'현재 상황에 대한 증언',request:'현장 확인 요청',concern:'다음 큰비에 대한 걱정'},
      goods: {old:'지난번 분배를 마친 물자',incoming:'아직 도착하지 않은 새 물자'},
      places: {border:'끝마을 邊境村',town:'회의록을 쓰는 물길마을 三溪鎮'}
    },
    rows: [
      ['shipment','market','새 물자가 아직 오지 않았다','speakers','market'],
      ['inspection','workshop','수로를 다시 점검하고 싶다','kinds','request'],
      ['wheel','workshop','수차는 여전히 돌아간다','kinds','report'],
      ['river','resident','낮은 곳에 사는 사람들은 어떡할까','kinds','concern'],
      ['river-speaker','resident','물가의 걱정을 전한 사람','speakers','resident'],
      ['goods','minutes','該批貨가 받는 물자','goods','incoming'],
      ['town','minutes','本鎮이 가리키는 곳','places','town']
    ]
  };
  const border = {
    id: 'border-stage-01-notice', words: ['目前','暫時','限制'],
    region: 'border-village', prefix: 'chapter2-border-first', placeZh: '邊境村', placeKo: '끝마을',
    title: '막힌 것은 어느 길일까', book: '통행 조사표',
    intro: [
      ['narrator','少年沿著北路到了邊境村。村口貼著一張公告。','소년은 북쪽 길을 따라 끝마을에 닿았다. 마을 어귀에 공고 한 장이 붙어 있었다.'],
      ['merchant','聽說路都不通了。真的是這樣嗎？','길이 다 막혔다던데, 정말 그럴까?']
    ],
    prior: ['boy','會議上有人想知道貨怎麼運。我先看看公告。','회의에서 물자를 어떻게 옮길지 궁금해했지. 공고부터 읽어 보자.'],
    result: [
      ['boy','我自己走到了村口。要往外地走，還得看是人還是車。','난 걸어서 마을 어귀까지 왔어. 여기서 바깥으로 가려면 사람인지 수레인지도 살펴야 해.'],
      ['narrator','少年收好記錄。公告沒有說原因，也沒有說何時解除限制。','소년은 기록을 챙겼다. 공고에는 제한 이유도, 언제 풀릴지도 적혀 있지 않았다.']
    ],
    sources: {
      notice: ['끝마을 현장 공고','目前，通往外地的部分路段暫時限制重載貨車雙向通行。行人仍可通過，輕型手推車須先確認通行條件。','현재 외부로 이어지는 일부 구간에서 무거운 짐수레의 양방향 통행을 임시로 제한한다. 보행자는 통행할 수 있고 가벼운 손수레는 먼저 조건을 확인해야 한다.'],
      rumor: ['여행 중인 행상이 전한 말','聽說路都不通了。','길이 다 막혔다고 들었어.']
    },
    readings: {"notice": "ㄇㄨˋ ㄑㄧㄢˊ ㄊㄨㄥ ㄨㄤˇ ㄨㄞˋ ㄉㄧˋ ㄉㄜ˙ ㄅㄨˋ ㄈㄣˋ ㄌㄨˋ ㄉㄨㄢˋ ㄓㄢˋ ㄕˊ ㄒㄧㄢˋ ㄓˋ ㄓㄨㄥˋ ㄗㄞˋ ㄏㄨㄛˋ ㄔㄜ ㄕㄨㄤ ㄒㄧㄤˋ ㄊㄨㄥ ㄒㄧㄥˊ ㄒㄧㄥˊ ㄖㄣˊ ㄖㄥˊ ㄎㄜˇ ㄊㄨㄥ ㄍㄨㄛˋ ㄑㄧㄥ ㄒㄧㄥˊ ㄕㄡˇ ㄊㄨㄟ ㄔㄜ ㄒㄩ ㄒㄧㄢ ㄑㄩㄝˋ ㄖㄣˋ ㄊㄨㄥ ㄒㄧㄥˊ ㄊㄧㄠˊ ㄐㄧㄢˋ", "rumor": "ㄊㄧㄥ ㄕㄨㄛ ㄌㄨˋ ㄉㄡ ㄅㄨˋ ㄊㄨㄥ ㄌㄜ˙"},
    sets: {
      scope: {all:'끝마을까지 오는 길 전체',part:'외부로 이어지는 일부 구간'},
      time: {forever:'앞으로 계속',temporary:'현재 적용 중 · 해제 시각 미상'},
      travel: {walk:'현재 통행 가능',check:'통행 조건부터 확인',limit:'양방향 임시 제한'},
      source: {official:'공식 공고',hearsay:'전해 들은 말'}
    },
    rows: [
      ['reach','notice','限制가 적용되는 길','scope','part'],
      ['when','notice','目前 · 暫時의 적용 기간','time','temporary'],
      ['walker','notice','보행','travel','walk'],
      ['handcart','notice','가벼운 손수레','travel','check'],
      ['freight','notice','무거운 짐수레','travel','limit'],
      ['traveler','rumor','“길이 다 막혔다”의 출처','source','hearsay']
    ]
  };
  const entries = [council,border];
  const chapter = JourneyContent.JOURNEY.find(item => item.id === 'chapter-2-after-rain');
  function beat([speaker,zh,ko]) { return {speaker,zh,ko}; }
  for (const entry of entries) {
    const intro = entry.prefix+'-intro', result = entry.prefix+'-result';
    STAGES.push({id:entry.id, title:entry.placeKo+' 01', subtitle:entry.title, words:entry.words, grid:['S']});
    for (const [id, titleKo, beats] of [[intro,entry.title,entry.intro],[result,entry.placeKo+'에서 남긴 기록',entry.result]]) {
      JourneyContent.STORIES[id] = {id,chapterId:chapter.id,titleKo,placeKo:entry.placeKo,placeZh:entry.placeZh,
        background:entry.region,beats:beats.map(beat)};
    }
    chapter.sections.push({id:entry.prefix,regionId:entry.region,revealAfterRain:true,sequence:[
      {type:'story',id:intro,requiresRainPassed:true},
      {type:'stage',id:entry.id,requiresRainPassed:true,requires:['story:'+intro]},
      {type:'story',id:result,requiresRainPassed:true,requires:['stage:'+entry.id],returnToWorldAfter:true}
    ].map(node => ({...node, chooseOnMap:true}))});
  }
  Object.assign(WORDS,{
    '該':{p:'ㄍㄞ',k:'앞서 말한 그, 해당하는',ex:'先確認該批貨的運送情況。',rule:'앞에서 특정한 물자를 찾아 회의록에 연결해.'},
    '本':{p:'ㄅㄣˇ',k:'말하거나 쓰는 쪽의 이, 우리',ex:'本鎮還沒有決定修繕順序。',rule:'회의록을 작성하는 마을을 찾아.'},
    '目前':{p:'ㄇㄨˋ ㄑㄧㄢˊ',k:'현재, 지금 시점에',ex:'目前行人仍可通過。',rule:'공고가 설명하는 시점을 확인해.'},
    '暫時':{p:'ㄓㄢˋ ㄕˊ',k:'잠시, 임시로',ex:'部分路段暫時限制通行。',rule:'임시 조치가 언제 끝나는지는 따로 확인해야 해.'},
    '限制':{p:'ㄒㄧㄢˋ ㄓˋ',k:'범위를 정해 제한하다',ex:'部分路段限制重載貨車雙向通行。',rule:'어느 구간에서 무엇이 제한되는지 찾아.'}
  });
  globalThis.Chapter2Fields = {entries, beat,
    byStage: id => entries.find(item => item.id === id),
    byIntro: id => entries.find(item => item.prefix+'-intro' === id),
    validDraft(entry,draft) {
      return !!entry && draft && typeof draft.prior === 'boolean' && Array.isArray(draft.links) &&
        (draft.cursor === undefined || Number.isInteger(draft.cursor) && draft.cursor >= 0 && draft.cursor < entry.rows.length) &&
        draft.links.length === entry.rows.length && draft.links.every((link,i) =>
          link === null || typeof link === 'string' && Object.hasOwn(entry.sets[entry.rows[i][3]],link));
    }
  };
})();
