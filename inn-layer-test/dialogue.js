/* Test-only lines. Does not accept/complete any real quest. */
globalThis.InnLayerDialogue = Object.freeze({
  lines(kind, state) {
    const line = (speaker, zh, ko) => ({speaker, zh, ko});
    if (kind === 'talk') return [
      line('客棧主人 · 여관 주인', state.rain ? '回來啦？外面的地還很濕，小心一點。' : '回來啦？先坐一下，喝杯茶吧。', state.rain ? '돌아왔구나? 밖은 아직 바닥이 젖어 있으니 조심해.' : '돌아왔구나? 잠깐 앉아서 차 한 잔 마셔.'),
      line('客棧主人 · 여관 주인', state.board ? (state.newQuest ? '板上又多了一張紙，是新的委託。' : '委託板已經掛好了，可以去看看。') : '牆上還沒有委託板。有事的話，先來找我吧。', state.board ? (state.newQuest ? '게시판에 종이가 한 장 더 붙었어. 새로운 부탁이야.' : '의뢰 게시판을 걸어뒀어. 가서 살펴보렴.') : '벽에는 아직 의뢰 게시판이 없어. 필요한 일이 있으면 먼저 나를 찾아오렴.')
    ];
    const response = {
      board: state.newQuest ? line('委託板 · 새 의뢰', '有人留下新的委託：請幫忙把乾毛巾送到樓上。', '새 부탁이 적혀 있어. 마른 수건을 위층으로 가져다 주세요.') : line('委託板 · 첫 게시물', '月白菇三個，已經收到了。謝謝幫忙！', '월백버섯 세 개를 잘 받았습니다. 도와줘서 고마워요!'),
      table: line('餐桌 · 식탁', '桌邊留著空位，可以坐下歇一會兒。', '식탁 옆에 빈자리가 있어. 앉아서 잠깐 쉴 수 있겠네.'),
      pot: line('茶壺 · 찻주전자', '壺裡還有茶，摸起來暖暖的。', '주전자에는 차가 남아 있어. 만져보니 따뜻하네.'),
      cup: line('茶杯 · 찻잔', '小杯子放在桌上，等著下一位客人。', '작은 잔이 식탁 위에서 다음 손님을 기다리고 있어.'),
      ledger: line('帳簿 · 장부', '老闆把今天的事情記在這本帳簿裡。', '주인은 오늘의 일을 이 장부에 적어두었어.'),
      wet: line('濕行李 · 젖은 짐', '客人的行李淋濕了，先放在門邊晾一晾。', '손님 짐이 비에 젖었어. 우선 문 옆에 두고 말리는 중이야.'),
      water: line('水跡 · 물기', '門邊留下了水跡，地板還沒乾。', '문 옆에 물기가 남았어. 바닥이 아직 마르지 않았네.')
    };
    return response[kind] ? [response[kind]] : [];
  }
});
