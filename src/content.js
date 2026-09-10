const WORDS={
  '接近':{p:'ㄐㄧㄝ ㄐㄧㄣˋ',k:'가까이 가다, 접근하다',ex:'我慢慢接近石碑。',rule:'이 게임에서는 석비와 상하좌우 한 칸 거리까지 가면 석비가 반응해.'},
  '遠離':{p:'ㄩㄢˇ ㄌㄧˊ',k:'멀어지다, 멀리 떨어지다',ex:'請遠離危險的地方。',rule:'늑대의 위험 범위와 거리를 두어야 해. 매번 거리가 늘어나야 한다는 뜻은 아니야.'},
  '通過':{p:'ㄊㄨㄥ ㄍㄨㄛˋ',k:'통과하다, 지나가다',ex:'我們要通過這個遺跡。',rule:'유적의 한쪽 입구로 들어가 다른 쪽 입구로 나와야 통과한 것으로 판정해.'},
  '到達':{p:'ㄉㄠˋ ㄉㄚˊ',k:'도착하다, 이르다',ex:'最後到達出口。',rule:'필요한 조건을 마친 뒤 출구에 도착하면 스테이지가 끝나.'},
  '避開':{p:'ㄅㄧˋ ㄎㄞ',k:'피하다, 비켜 가다',ex:'避開危險，繼續前進。',rule:'가시 칸으로 들어가는 행동은 확정되지 않아. 다른 경로를 찾아야 해.'}
};

const STAGES=[
  {id:'stage-0',title:'出發',subtitle:'마을을 떠나다',grid:['.E.','...','...','.S.'],goal:'到村口去。',words:[],win:['at_exit'],story:'소년은 뒤를 돌아보았다.\n익숙한 마을은 이제 조금씩 멀어지고 있었다.'},
  {id:'stage-1',title:'接近',subtitle:'낡은 석비',grid:['##E##','#...#','##G##','#...#','#K..#','#...#','##S##'],goal:'接近石碑。',goalAfter:'走到出口。',words:['接近'],win:['stone','at_exit'],story:'「방금… 글자가 빛난 건가?」'},
  {id:'stage-2',title:'遠離',subtitle:'늑대가 있는 길',grid:['##E##','.....','.#.#.','...W.','.#.#.','.....','##S##'],goal:'遠離野狼，走到出口。',words:['遠離'],win:['at_exit'],wolf:{cycle:[[3,3]],radius:1},story:'가장 짧은 길이 언제나 좋은 길은 아니었다.'},
  {id:'stage-3',title:'通過・到達',subtitle:'폐허를 지나서',grid:['#..E#','#.#.#','#R#.#','#R#.#','#R#.#','#.#.#','#..S#'],goal:'通過遺跡，然後到達出口。',words:['通過','到達'],win:['crossed','at_exit'],ruin:{portals:[[1,1],[5,1]]},story:'지나가는 것과 도착하는 것.\n비슷해 보여도 길 위에서는 전혀 다른 일이었다.'},
  {id:'stage-4',title:'避開',subtitle:'위험한 길',grid:['##E##','.....','.X.X.','..X..','.X.X.','.....','##S##'],goal:'避開危險，到達出口。',words:['避開','到達'],win:['at_exit'],story:'목적지만큼, 그곳까지 가는 길도 중요했다.'},
  {id:'stage-5',title:'走出森林',subtitle:'숲을 빠져나가라',grid:['....E','.#.#.','.#..W','.##X.','.RRR.','.K##.','S....'],goal:'接近石碑，通過遺跡，到達出口。',rule:'遠離野狼，避開危險。',words:['接近','遠離','通過','到達','避開'],win:['stone','crossed','at_exit'],ruin:{portals:[[4,0],[4,4]]},wolf:{initial:3,cycle:[[2,2],[2,2],[2,3],[2,4],[2,4],[2,3]],radius:1},story:'소년離開了熟悉的村子。\n他第一次發現，這個世界的「話」似乎有一種奇怪的力量。\n\n「救命！」'}
];

const WORLD={
  id:'first-world',
  title:'첫 월드',
  origin:'出發',
  originNameKo:'출발 마을',
  originIcon:'region-origin',
  regions:[
    {id:'gate-town',name:'關口鎮',nameKo:'관문 마을',icon:'region-gate-town',subtitle:'길을 읽는 마을',status:'available',note:'경로·범위·순서·위치를 다룬다.',targets:['進入','退出','距離','範圍','路線','經由']},
    {id:'workshop-town',name:'工坊村',nameKo:'공방 마을',icon:'region-workshop-town',subtitle:'상태를 바꾸는 마을',status:'available',note:'장치의 상태와 조건을 조작한다.',targets:['改變','保持','增加','減少','條件','允許']},
    {id:'market-town',name:'市集鎮',nameKo:'시장 마을',icon:'region-market-town',subtitle:'자원을 고르는 마을',status:'available',note:'교환·선택·부족·가치를 다룬다.',targets:['需求','足夠','缺少','交換','價值','費用']},
    {id:'border-village',name:'邊境村',nameKo:'변경 마을',icon:'region-border-village',subtitle:'위험과 손실을 다루는 마을',status:'recommended',recommendedAfter:'gate-town',note:'바로 갈 수 있지만 관문 마을을 먼저 여행하면 길을 읽기 쉽다.',targets:['危機','風險','警告','損失']},
    {id:'council-town',name:'議會鎮',nameKo:'의회 마을',icon:'region-council-town',subtitle:'의견과 관계를 조정하는 마을',status:'recommended',recommendedAfter:'market-town',note:'바로 갈 수 있지만 시장 마을을 먼저 경험하면 선택과 배분을 이해하기 쉽다.',targets:['接受','拒絕','支持','反對','公平']},
    {id:'research-city',name:'研究城',nameKo:'연구 도시',icon:'region-research-city',subtitle:'생각을 조합하는 도시',status:'locked',requires:'workshop-core',note:'공방 마을의 핵심 시험을 완료하면 열린다.',targets:['分析','資訊','證明','關鍵','符合']}
  ]
};
