const WORDS={
  '接近':{p:'ㄐㄧㄝ ㄐㄧㄣˋ',k:'가까이 가다, 접근하다',ex:'我慢慢接近石碑。',rule:'이 게임에서는 석비와 상하좌우 한 칸 거리까지 가면 석비가 반응해.'},
  '遠離':{p:'ㄩㄢˇ ㄌㄧˊ',k:'멀어지다, 멀리 떨어지다',ex:'請遠離危險的地方。',rule:'늑대의 위험 범위와 거리를 두어야 해. 매번 거리가 늘어나야 한다는 뜻은 아니야.'},
  '通過':{p:'ㄊㄨㄥ ㄍㄨㄛˋ',k:'통과하다, 지나가다',ex:'我們要通過這個遺跡。',rule:'유적의 한쪽 입구로 들어가 다른 쪽 입구로 나와야 통과한 것으로 판정해.'},
  '到達':{p:'ㄉㄠˋ ㄉㄚˊ',k:'도착하다, 이르다',ex:'最後到達出口。',rule:'필요한 조건을 마친 뒤 출구에 도착하면 스테이지가 끝나.'},
  '避開':{p:'ㄅㄧˋ ㄎㄞ',k:'피하다, 비켜 가다',ex:'避開危險，繼續前進。',rule:'가시 칸으로 들어가는 행동은 확정되지 않아. 다른 경로를 찾아야 해.'},
  '進入':{p:'ㄐㄧㄣˋ ㄖㄨˋ',k:'들어가다, 진입하다',ex:'請進入關口。',rule:'관문 경계 안쪽으로 실제로 들어가면 進入이 성립해.'},
  '退出':{p:'ㄊㄨㄟˋ ㄔㄨ',k:'나가다, 빠져나오다',ex:'看完路標，再退出關口。',rule:'안쪽에서 볼일을 마친 뒤 관문 밖으로 나오면 退出이 성립해. 通過처럼 반대편으로 빠져나갈 필요는 없어.'},
  '距離':{p:'ㄐㄩˋ ㄌㄧˊ',k:'거리, 떨어진 정도',ex:'這個標記跟鐘樓的距離比較遠。',rule:'이 판에서는 종탑과 현재 지점 사이가 몇 칸 떨어져 있는지 보여줘. 숫자를 맞히는 문제가 아니라 각 위치의 관계를 비교하는 정보야.'},
  '範圍':{p:'ㄈㄢˋ ㄨㄟˊ',k:'범위, 영향을 미치는 영역',ex:'這裡還在鐘聲的範圍內。',rule:'종소리가 실제로 들리는 모든 칸이 범위야. 클리어 전에는 전체 모양을 보여주지 않아.'}
};

const STAGES=[
  {id:'stage-0',title:'出發',subtitle:'마을을 떠나다',grid:['.E.','...','...','.S.'],goal:'到村口去。',words:[],win:['at_exit'],story:'소년은 뒤를 돌아보았다.\n익숙한 마을은 이제 조금씩 멀어지고 있었다.'},
  {id:'stage-1',title:'接近',subtitle:'낡은 석비',grid:['##E##','#...#','##G##','#...#','#K..#','#...#','##S##'],goal:'接近石碑。',goalAfter:'走到出口。',words:['接近'],win:['stone','at_exit'],story:'「방금… 글자가 빛난 건가?」'},
  {id:'stage-2',title:'遠離',subtitle:'늑대가 있는 길',grid:['##E##','.....','.#.#.','...W.','.#.#.','.....','##S##'],goal:'遠離野狼，走到出口。',words:['遠離'],win:['at_exit'],wolf:{cycle:[[3,3]],radius:1},story:'가장 짧은 길이 언제나 좋은 길은 아니었다.'},
  {id:'stage-3',title:'通過・到達',subtitle:'폐허를 지나서',grid:['#..E#','#.#.#','#R#.#','#R#.#','#R#.#','#.#.#','#..S#'],goal:'通過遺跡，然後到達出口。',words:['通過','到達'],win:['crossed','at_exit'],ruin:{portals:[[1,1],[5,1]]},story:'지나가는 것과 도착하는 것.\n비슷해 보여도 길 위에서는 전혀 다른 일이었다.'},
  {id:'stage-4',title:'避開',subtitle:'위험한 길',grid:['##E##','.....','.X.X.','..X..','.X.X.','.....','##S##'],goal:'避開危險，到達出口。',words:['避開','到達'],win:['at_exit'],story:'목적지만큼, 그곳까지 가는 길도 중요했다.'},
  {id:'stage-5',title:'走出森林',subtitle:'숲을 빠져나가라',grid:['....E','.#.#.','.#..W','.##X.','.RRR.','.K##.','S....'],goal:'接近石碑，通過遺跡，到達出口。',rule:'遠離野狼，避開危險。',words:['接近','遠離','通過','到達','避開'],win:['stone','crossed','at_exit'],ruin:{portals:[[4,0],[4,4]]},wolf:{initial:3,cycle:[[2,2],[2,2],[2,3],[2,4],[2,4],[2,3]],radius:1},story:'少年離開了熟悉的村子。\n他第一次發現，這個世界的「話」似乎有一種奇怪的力量。\n\n「救命！」'},
  {id:'gate-stage-1',title:'進入・退出',subtitle:'문 안쪽',kicker:'1장 · 길목 1/7',grid:['#####','#IIL#','#I#I#','#III#','##D##','.....','..S..'],goal:'進入關口，看路標，再退出。',rule:'길표지는 가까이 가서 살펴봐야 해.',words:['進入','退出'],win:['entered','inspected','exited'],enterExit:{insideChars:['I'],boundary:'D',outsideChars:['.','S'],inspect:'L'},story:'관문 안쪽의 오래된 길표지를 확인했다.'},
  {id:'gate-stage-2',title:'距離・範圍',subtitle:'종소리가 닿는 곳',kicker:'1장 · 길목 2/7',grid:['#####','#.B.#','..P..','.P#P.','.P.P.','.....','..S..'],goal:'找出鐘聲範圍內，距離鐘樓最遠的標記點。',rule:'표식에 서면 종탑까지의 距離와 종소리가 들리는지 확인할 수 있어.',words:['距離','範圍'],win:['range_boundary'],rangeSource:{source:'B',radius:3,pointChar:'P',revealOnFirstClear:true},story:'종소리가 닿는 가장자리를 찾았다.'}
];

const WORLD={
  id:'first-world',
  title:'첫 월드',
  origin:'出發',
  originNameKo:'고향 마을',
  originIcon:'region-origin',
  regions:[
    {id:'gate-town',name:'關口鎮',nameKo:'길목',icon:'region-gate-town',subtitle:'길을 읽는 마을',status:'available',note:'경로·범위·순서·위치를 다룬다.',targets:['進入','退出','距離','範圍','路線','經由']},
    {id:'workshop-town',name:'工坊村',nameKo:'장인골',icon:'region-workshop-town',subtitle:'상태를 바꾸는 마을',status:'available',note:'장치의 상태와 조건을 조작한다.',targets:['改變','保持','增加','減少','條件','允許']},
    {id:'market-town',name:'市集鎮',nameKo:'장터',icon:'region-market-town',subtitle:'자원을 고르는 마을',status:'available',note:'교환·선택·부족·가치를 다룬다.',targets:['需求','足夠','缺少','交換','價值','費用']},
    {id:'border-village',name:'邊境村',nameKo:'끝마을',icon:'region-border-village',subtitle:'위험과 손실을 다루는 마을',status:'recommended',recommendedAfter:'gate-town',note:'바로 갈 수 있지만 길목을 먼저 여행하면 길을 읽기 쉽다.',targets:['危機','風險','警告','損失']},
    {id:'council-town',name:'議會鎮',nameKo:'회의소',icon:'region-council-town',subtitle:'의견과 관계를 조정하는 마을',status:'recommended',recommendedAfter:'market-town',note:'바로 갈 수 있지만 장터를 먼저 경험하면 선택과 배분을 이해하기 쉽다.',targets:['接受','拒絕','支持','反對','公平']},
    {id:'research-city',name:'研究城',nameKo:'학술도시',icon:'region-research-city',subtitle:'생각을 조합하는 도시',status:'locked',requires:'workshop-core',note:'장인골의 핵심 시험을 완료하면 열린다.',targets:['分析','資訊','證明','關鍵','符合']}
  ]
};
