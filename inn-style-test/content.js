/* Comparison fixtures, not canonical story/progression or geographical coordinates. */
globalThis.InnComparison = Object.freeze({
 styles: {a:'회화적 삽화', b:'고전 픽셀 RPG', c:'그림책형 레트로 RPG'},
 hotspots: [
  {id:'keeper',label:'여관 주인과 이야기하기',hint:'주인',x:7,y:17,w:38,h:25},
  {id:'board',label:'게시판 조사하기',hint:'게시판',x:45,y:8,w:23,h:14},
  {id:'stairs',label:'계단으로 소년의 방에 가기',hint:'2층',x:74,y:8,w:21,h:39},
  {id:'table',label:'식탁 살펴보기',hint:'식탁',x:15,y:55,w:45,h:27},
  {id:'door',label:'출입문으로 나가기',hint:'문',x:80,y:51,w:19,h:35}
 ],
 talk: [
  {speaker:'客棧主人 · 여관 주인',zh:'回來啦？先坐一下，喝杯茶吧。',ko:'돌아왔구나? 우선 잠깐 앉아서 차 한 잔 마셔.'},
  {speaker:'少年 · 소년',zh:'謝謝。今天有什麼新消息嗎？',ko:'고마워요. 오늘은 무슨 새로운 소식이 있나요?'},
  {speaker:'客棧主人 · 여관 주인',zh:'可以看看牆上的告示。累了就上樓休息吧。',ko:'벽에 붙은 안내문을 살펴보렴. 피곤하면 위층에 올라가 쉬어.'}
 ],
 board:{speaker:'告示板 · 게시판',zh:'用完杯子，請放回桌上。',ko:'컵을 다 썼으면 식탁 위에 돌려놓아 주세요.'},
 table:{speaker:'餐桌 · 식탁',zh:'桌上有一壺茶，旁邊放著杯子。',ko:'식탁 위에 차 한 주전자가 있고, 옆에는 컵이 놓여 있어.'},
 door:{speaker:'門口 · 출입문',zh:'門外傳來街上的聲音。',ko:'문밖에서 거리의 소리가 들려와.'}
});
