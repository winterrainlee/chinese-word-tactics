/* Academic Tower Slice A story and journey sequence. Loaded after the Chapter 1 finale. */
(() => {
  const stories = globalThis.JourneyContent?.STORIES;
  const journey = globalThis.JourneyContent?.JOURNEY;
  if (!stories || !Array.isArray(journey)) return;

  Object.assign(stories, {
    'academic-tower-arrival': {
      id: 'academic-tower-arrival', chapterId: 'academic-tower-research', titleKo: '문 앞에서 멈추다',
      background: 'academic-tower', placeZh: '學術塔門前', placeKo: '학술탑 정문',
      beats: [
        { speaker: 'narrator', zh: '沿著工坊谷的水道往上走，屋瓦和水聲漸漸落到身後。學術塔就立在幾條上游水道交會的坡地上。', ko: '장인골의 수로를 따라 올라가자 지붕과 물소리가 조금씩 아래로 멀어졌다. 몇 갈래 상류 물길이 만나는 비탈에 학술탑이 서 있었다.' },
        { speaker: 'narrator', zh: '幾個抱著書卷的人報上名字，陸續走進門裡。少年站到門前，卻不知道該找誰。', ko: '두루마리를 안은 사람들이 이름을 말하고 차례로 문 안으로 들어갔다. 소년은 문 앞에 섰지만 누구를 찾아야 하는지 알지 못했다.' },
        { speaker: 'towerGatekeeper', zh: '先等一下。塔裡的記錄庫不對外開放。你要找哪一位？', ko: '잠깐 기다려. 탑의 기록 보관실은 외부인에게 개방하지 않아. 누구를 찾아왔지?' },
        { speaker: 'boy', zh: '我……不知道名字。我是從工坊谷來的。那裡的工匠說，塔裡也許有舊調節器的記錄。', ko: '저… 이름은 몰라요. 장인골에서 왔는데, 그곳 장인이 오래된 조절기 기록이 탑에 있을지도 모른다고 했어요.' },
        { speaker: 'towerGatekeeper', zh: '沒有約定，也說不出要找誰，我不能讓你進去。要查記錄，得先請塔裡的人登記。', ko: '약속도 없고 찾는 사람도 말할 수 없다면 들여보낼 수 없어. 기록을 보려면 탑 안 사람이 먼저 방문을 등록해야 해.' },
        { speaker: 'boy', zh: '可是舊調節器的銘牌亮了一下，我還在關口看過很像的……', ko: '하지만 오래된 조절기 명판이 잠깐 빛났고, 길목에서도 비슷한 걸 본 적이 있어서….' },
        { speaker: 'narrator', zh: '越說越像是在辯解。少年握緊手裡的修繕牌，聲音也小了下去。', ko: '말할수록 변명처럼 들렸다. 소년은 손에 든 수리패를 꼭 쥐었고 목소리도 점점 작아졌다.' },
        { speaker: 'narrator', zh: '正要出門的一名研究員停下腳步，看了一眼少年手裡的木牌。', ko: '마침 밖으로 나오던 연구원 한 명이 걸음을 멈추고 소년 손의 나무패를 바라봤다.' },
        { speaker: 'towerResearcher', zh: '那是工坊谷的修繕牌吧？誰給你的？', ko: '그건 장인골의 수리패지? 누가 줬니?' },
        { speaker: 'boy', zh: '修好舊調節器以後，那裡的工匠給我的。也是他叫我來問舊記錄。', ko: '오래된 조절기를 고친 뒤 그곳 장인이 줬어요. 옛 기록을 물어보라고 한 것도 그분이고요.' },
        { speaker: 'towerResearcher', zh: '你說的是哪一座調節器？又想查什麼？', ko: '어느 조절기를 말하는 거지? 무엇을 찾고 있고?' },
        { speaker: 'boy', zh: '幾間工坊共用的那一座。旁邊的舊銘牌有一道記號，還亮了一下。', ko: '여러 공방이 함께 쓰는 조절기요. 옆의 낡은 명판에 표식이 있었고 잠깐 빛났어요.' },
        { speaker: 'towerResearcher', zh: '舊水道和調節器的記錄正是我在整理。讓他先到我的研究室，不進記錄庫。我來登記。', ko: '옛 수로와 조절기 기록은 마침 내가 정리하고 있어. 보관실에는 들어가지 않고 내 연구실로 데려갈게. 방문 등록은 내가 맡지.' },
        { speaker: 'towerGatekeeper', zh: '既然由你負責，就在訪客簿上寫清楚。離開時也要從這裡出去。', ko: '당신이 책임진다면 방문부에 분명히 적어 줘. 나갈 때도 이쪽으로 나와야 하고.' },
        { speaker: 'towerResearcher', zh: '修繕牌不是學術塔的通行證。不過它至少證明，工坊的人讓你接近過那座裝置。剩下的話，到裡面慢慢說。', ko: '수리패가 학술탑 통행증은 아니야. 그래도 공방 사람들이 네게 그 장치를 맡긴 적이 있다는 건 보여 주지. 나머지 이야기는 안에서 천천히 듣자.' }
      ]
    },
    'academic-tower-turn-intro': {
      id: 'academic-tower-turn-intro', chapterId: 'academic-tower-research', titleKo: '연구실의 오래된 색인',
      background: 'academic-tower', placeZh: '學術塔研究室', placeKo: '학술탑 연구실',
      beats: [
        { speaker: 'narrator', zh: '研究室的窗邊晾著受潮的紙，長桌上壓著一卷卷舊圖。牆邊一整架都是水道和水車的記錄。', ko: '연구실 창가에는 습기를 먹은 종이가 널려 있었고, 긴 탁자 위에는 낡은 도면 두루마리가 눌려 있었다. 벽 한쪽 서가는 수로와 수차 기록으로 가득했다.' },
        { speaker: 'towerResearcher', zh: '左邊那疊才按年代排好，先別碰。把你看見的記號畫在這裡。', ko: '왼쪽 기록은 이제 막 연대순으로 맞췄으니 우선 건드리지 마. 네가 본 표식은 여기에 그려 줘.' },
        { speaker: 'narrator', zh: '少年把修繕牌放在桌角，又照著記憶畫下舊銘牌上的刻痕。', ko: '소년은 수리패를 탁자 귀퉁이에 놓고, 기억을 더듬어 낡은 명판의 자국을 그렸다.' },
        { speaker: 'boy', zh: '舊調節器的銘牌上有這個記號。它亮了一下。關口的舊路標上，也有很像的光。', ko: '오래된 조절기 명판에 이 표식이 있었어요. 잠깐 빛났고요. 길목의 낡은 길표지에서도 비슷한 빛을 봤어요.' },
        { speaker: 'towerResearcher', zh: '很像，不等於就是同一種東西。先把你看見的分開說。', ko: '아주 비슷하다는 게 곧 같은 것이라는 뜻은 아니야. 네가 본 것부터 나눠서 말해 보자.' },
        { speaker: 'boy', zh: '你不相信我嗎？', ko: '제 말을 안 믿는 건가요?' },
        { speaker: 'towerResearcher', zh: '我相信你看見了光。可是那道光是什麼，還不能急著下結論。', ko: '네가 빛을 봤다는 건 믿어. 하지만 그 빛이 무엇인지는 아직 서둘러 결론 내릴 수 없어.' },
        { speaker: 'narrator', zh: '研究員從專門放水道記錄的高架上抽出一張索引卡。少年畫的記號，也出現在卡片一角。', ko: '연구원은 수로 기록만 모아 둔 높은 서가에서 색인 카드 한 장을 꺼냈다. 소년이 그린 표식이 카드 한쪽에도 남아 있었다.' },
        { speaker: 'towerResearcher', zh: '它收在舊水道的索引裡。記錄的內容可以同時是真的，可是旁邊的審閱筆記似乎太快下了結論。', ko: '이 표식은 옛 수로 색인에 들어 있어. 기록 내용은 함께 참일 수 있는데, 옆의 검토 메모가 너무 빨리 결론을 내린 것 같아.' },
        { speaker: 'boy', zh: '水道比較短，雨天卻更危險。可是筆記寫著，較短，所以雨天也適合使用。', ko: '수로는 더 짧지만 비 오는 날에는 더 위험하네요. 그런데 메모에는 짧으니까 비 오는 날에도 이용하기 좋다고 쓰였어요.' },
        { speaker: 'towerResearcher', zh: '每個字都看得懂，不等於整份記錄已經讀懂了。把事實分開，再找出筆記多推了一步的地方。', ko: '글자를 모두 안다고 기록 전체를 이해한 건 아니야. 사실을 나눠 보고, 메모가 한 걸음 더 나가 버린 곳을 찾아보자.' }
      ]
    },
    'academic-tower-turn-after-que': {
      id: 'academic-tower-turn-after-que', chapterId: 'academic-tower-research', titleKo: '메모에 남길 것',
      background: 'academic-tower', placeZh: '學術塔研究室', placeKo: '학술탑 연구실',
      beats: [
        { speaker: 'boy', zh: '水道較短和雨天較危險都是真的。要改的是「較短，所以雨天適合使用」這個判斷。', ko: '수로가 짧다는 것과 비 오는 날 더 위험하다는 건 둘 다 사실이에요. 고쳐야 하는 건 “짧으니 비 오는 날 이용하기 좋다”는 판단이고요.' },
        { speaker: 'towerResearcher', zh: '對。「卻」沒有擦掉前面的事實，只是叫我們回頭檢查從那個事實推出的判斷。', ko: '맞아. `卻`은 앞의 사실을 지우지 않고, 그 사실에서 끌어낸 판단을 다시 검토하게 하지.' },
        { speaker: 'narrator', zh: '研究員又放下兩疊紙。一疊是隔著好幾句才轉向的調查記錄，另一疊寫著操作前的預想和實際結果。', ko: '연구원은 종이 두 묶음을 더 내려놓았다. 한쪽은 여러 문장을 사이에 두고 방향이 바뀌는 조사 기록이고, 다른 쪽은 조작 전의 예상과 실제 결과를 적은 기록이었다.' },
        { speaker: 'towerResearcher', zh: '接下來有兩條線。先看哪一疊都可以。', ko: '다음부터는 두 갈래야. 어느 묶음을 먼저 살펴봐도 돼.' },
        { speaker: 'boy', zh: '它們都會改變後面的讀法嗎？', ko: '둘 다 뒤 내용을 읽는 방법을 바꾸나요?' },
        { speaker: 'towerResearcher', zh: '會，但改法不同。別急著把它們全叫成同一種「但是」。', ko: '그래. 하지만 바꾸는 방법은 달라. 모두 같은 ‘하지만’이라고 서둘러 묶지는 마.' }
      ]
    },
    'academic-tower-turn-before-faner': {
      id: 'academic-tower-turn-before-faner', chapterId: 'academic-tower-research', titleKo: '다르다는 것과 대신 생긴 것',
      background: 'academic-tower', placeZh: '學術塔研究室', placeKo: '학술탑 연구실',
      beats: [
        { speaker: 'boy', zh: '「然而」讓後面的記錄改變了最後的判斷。「果然」和「竟然」是在看結果合不合預想。', ko: '`然而`는 뒤 기록이 최종 판단을 바꾸게 했고, `果然`과 `竟然`은 결과가 예상과 맞는지 보는 말이었어요.' },
        { speaker: 'towerResearcher', zh: '很好。那這一張該放在哪一邊？', ko: '좋아. 그러면 이 기록은 어느 쪽에 놓아야 할까?' },
        { speaker: 'narrator', zh: '紙上先寫著「增加水量」，預想欄記著水車會轉得更快；實際記錄卻寫著水車停了。', ko: '종이에는 먼저 ‘물의 양을 늘림’이라고 적혀 있었고, 예상 칸에는 수차가 더 빠르게 돌 것이라고 쓰여 있었다. 그러나 실제 기록에는 수차가 멈췄다고 적혀 있었다.' },
        { speaker: 'boy', zh: '不只是沒想到。預想的結果沒有發生，停下來這個結果反而出現了。', ko: '예상 밖이라는 것만으로는 부족하네요. 예상한 결과는 생기지 않고, 멈춘다는 결과가 대신 생겼어요.' },
        { speaker: 'towerResearcher', zh: '對。把沒有發生的預想和取代它的結果都留下。', ko: '맞아. 생기지 않은 예상과 그 자리를 대신한 결과를 둘 다 남겨 보자.' }
      ]
    },
    'academic-tower-turn-before-synthesis': {
      id: 'academic-tower-turn-before-synthesis', chapterId: 'academic-tower-research', titleKo: '흩어진 세 장',
      background: 'academic-tower', placeZh: '學術塔研究室', placeKo: '학술탑 연구실',
      beats: [
        { speaker: 'boy', zh: '水量增加，本來以為會轉得更快，實際上卻沒有轉得更快，反而停了。沒有發生的預想和取代它的結果都要留下。', ko: '물을 늘리면 더 빨리 돌 거라고 예상했지만 실제로는 더 빨라지지 않고, 오히려 멈췄어요. 생기지 않은 예상과 그 자리를 대신한 결과를 둘 다 남겨야 하네요.' },
        { speaker: 'towerResearcher', zh: '這幾張不是不同裝置的記錄。它們寫的是同一座水車，只是日期不同。', ko: '이 기록들은 서로 다른 장치 이야기가 아니야. 날짜만 다를 뿐 같은 수차를 기록한 거야.' },
        { speaker: 'narrator', zh: '研究員把三張受損的記錄按日期排開，準備整理一份送往工坊的新副本。', ko: '연구원은 훼손된 기록 세 장을 날짜순으로 펼쳤다. 이를 정리해 장인골로 보낼 새 사본을 만들 참이었다.' },
        { speaker: 'towerResearcher', zh: '工坊還在使用相近的舊裝置。要把副本送下去，不能只抄第一張。', ko: '장인골에서는 지금도 비슷한 옛 장치를 쓰고 있어. 사본을 내려보내려면 첫 장만 옮겨 적어서는 안 돼.' },
        { speaker: 'boy', zh: '句子前後還在。我讀完兩邊，再把連接詞補回去。', ko: '접속어 앞뒤 문장은 남아 있어요. 양쪽을 끝까지 읽고 알맞은 말을 복원해 볼게요.' },
        { speaker: 'towerResearcher', zh: '這次我不標出關係。別只看熟悉的字，先讀完整句。', ko: '이번에는 관계를 표시해 주지 않을게. 익숙한 글자만 고르지 말고 문장 전체를 먼저 읽어.' }
      ]
    },
    'academic-tower-turn-result': {
      id: 'academic-tower-turn-result', chapterId: 'academic-tower-research', titleKo: '첫 번째 가설',
      background: 'academic-tower', placeZh: '學術塔研究室', placeKo: '학술탑 연구실',
      beats: [
        { speaker: 'narrator', zh: '少年在副本下方寫下提醒：不能只憑舊記錄決定水量，還要確認裝置的情況。', ko: '소년은 사본 아래에 주의사항을 적었다. 옛 기록만으로 수량을 결정하지 말고 장치 상태를 확인해야 한다.' },
        { speaker: 'towerResearcher', zh: '如果只讀第一張，我們就會叫工匠繼續增加水量。後面的記錄，正好阻止了這個錯誤。', ko: '첫 장만 읽었다면 장인에게 계속 물을 늘리라고 했을 거야. 뒤의 기록이 바로 그 잘못을 막아 줬어.' },
        { speaker: 'boy', zh: '記錄不是互相說謊。是我如果停得太早，就會讀錯。', ko: '기록들이 서로 거짓말한 게 아니었어요. 제가 너무 일찍 멈춰 읽으면 틀리는 거였어요.' },
        { speaker: 'narrator', zh: '補好的副本被放到舊索引旁。卡片角落那道磨損的刻痕，忽然亮起一道很淡的光。', ko: '복원한 사본을 옛 색인 옆에 놓았다. 카드 귀퉁이의 닳은 자국에서 갑자기 희미한 빛이 번졌다.' },
        { speaker: 'boy', zh: '又亮了。', ko: '또 빛났어요.' },
        { speaker: 'towerResearcher', zh: '我也看見了。先別碰。', ko: '나도 봤어. 우선 손대지 마.' },
        { speaker: 'narrator', zh: '光只停了一瞬，隨即退回舊紙的顏色。', ko: '빛은 한순간 머물렀다가 곧 낡은 종이 빛깔 속으로 사라졌다.' },
        { speaker: 'towerResearcher', zh: '現在只能記下條件：同一組記錄的順序和關係都排好時，它有了反應。這還不是答案。', ko: '지금 기록할 수 있는 조건은 하나야. 같은 묶음의 순서와 관계가 맞춰졌을 때 표식이 반응했다는 것. 아직 답은 아니야.' },
        { speaker: 'boy', zh: '至少，它不只跟水車有關。關口的路標也亮過。', ko: '적어도 수차에만 관계된 건 아니네요. 길목의 길표지도 빛났으니까요.' },
        { speaker: 'towerResearcher', zh: '也不像某一個工匠的署名。要再找別的記錄，才能知道它跟什麼有關。', ko: '어느 장인 한 사람의 서명 같지도 않아. 무엇과 관계있는지 알려면 다른 기록을 더 찾아야 해.' },
        { speaker: 'narrator', zh: '研究員把副本放進送往工坊的紙袋，另把觀察記錄放進留給少年的空格。', ko: '연구원은 사본을 장인골로 보낼 종이봉투에 넣고, 관찰 기록은 소년에게 남겨 둔 빈 칸에 보관했다.' },
        { speaker: 'towerResearcher', zh: '這一格先留給你。以後找到相同的記號，或是讀不通的記錄，就放在這裡。', ko: '이 칸은 네 자리로 남겨 둘게. 같은 표식을 찾거나 잘 읽히지 않는 기록이 생기면 여기에 모으자.' },
        { speaker: 'towerResearcher', zh: '這張觀察卡你帶著。下次再看到那個記號，先把你真的看到的寫下來，再帶回來。', ko: '이 관찰 카드는 네가 가져가. 다음에 그 표식을 또 보면, 결론부터 내리지 말고 실제로 본 것부터 적어서 가져와.' },
        { speaker: 'narrator', zh: '少年接過小小的卡片。紙角只印著「觀察」兩個字，下面還留著幾道空白。', ko: '소년은 작은 카드를 받아 들었다. 종이 귀퉁이에는 ‘관찰’이라는 두 글자만 찍혀 있었고, 아래에는 몇 줄의 빈칸이 남아 있었다.' },
        { speaker: 'boy', zh: '那我還可以再來嗎？', ko: '그럼 다시 와도 되나요?' },
        { speaker: 'towerResearcher', zh: '這座塔沒有「全部讀完」的一天。找到下一個問題，再回來就是了。', ko: '이 탑에는 ‘전부 다 읽는 날’이 없어. 다음 질문을 찾으면 다시 오면 돼.' }
      ]
    }
  });

  Object.assign(stories, {
    'academic-tower-ran-intro': {
      lateIntroMilestone:'academic-tower-turn-foundation', lateIntroKo:'소년은 자신에게 남겨 둔 칸에서 이전 기록을 꺼냈다.',
      id: 'academic-tower-ran-intro', chapterId: 'academic-tower-research', titleKo: '색인 옆의 메모', background: 'academic-tower', placeZh: '學術塔研究室', placeKo: '학술탑 연구실',
      beats: [
        { speaker:'narrator', zh:'少年又看了看先前的記錄。', ko:'소년은 이전 기록을 다시 살펴봤다. 같은 글자가 여러 표현에서 눈에 띄었다.' },
        ...STAGES.find(stage=>stage.id==='academic-tower-turn-03a-ran-family').academicTower.introduction.map(beat=>({...beat,speaker:beat.speaker==='소년' ? 'boy' : 'towerResearcher'}))
      ]
    },
    'academic-tower-ran-result': {
      id: 'academic-tower-ran-result', chapterId: 'academic-tower-research', titleKo: '같은 흔적, 다른 방향', background: 'academic-tower', placeZh: '學術塔研究室', placeKo: '학술탑 연구실',
      beats: [
        { speaker: 'boy', zh: '所以不能看到同一個字，就把它們當成同一種用法。', ko: '그러니까 같은 글자가 보인다고 같은 쓰임으로 묶으면 안 되고요.' },
        { speaker: 'towerResearcher', zh: '對。字可以給你線索，但不能替你把句子讀完。', ko: '맞아. 글자는 단서를 줄 수 있지만 네 대신 문장 전체를 읽어 주지는 않아.' }
      ]
    }
  });


  // The optional 03B is an independent visit, never an automatic continuation of 03A.
  Object.assign(stories, {
    'academic-tower-ran-village-intro': {
      id:'academic-tower-ran-village-intro', chapterId:'academic-tower-research',
      titleKo:'도시락을 싸 왔어요', background:'academic-tower',
      placeZh:'學術塔門前', placeKo:'학술탑 정문',
      beats:[
        {speaker:'narrator',zh:'少年又來到學術塔門前，手裡提著一個用布包好的小飯盒。這次，他不是來查記錄的。',ko:'소년이 천으로 감싼 작은 도시락을 들고 다시 학술탑 문 앞에 섰다. 이번에는 기록을 찾으러 온 게 아니었다.'},
        {speaker:'towerGatekeeper',zh:'是你啊。這次要找哪一位？',ko:'전에 왔던 아이구나. 이번엔 누구를 찾니?'},
        {speaker:'boy',zh:'上次幫我看記錄的那位研究員。我想跟他道謝，還帶了點吃的。',ko:'지난번에 기록을 봐주신 연구원분이요. 감사 인사드리려고 먹을 것도 조금 싸 왔어요.'},
        {speaker:'towerGatekeeper',zh:'我先替你問一聲。進去還是要登記。',ko:'계신지 먼저 물어볼게. 들어가려면 방문 등록은 해야 하고.'},
        {speaker:'narrator',zh:'研究員從裡面走了出來，看見少年，停下了腳步。',ko:'안에서 나온 연구원은 소년을 보고 걸음을 멈췄다.'},
        {speaker:'towerResearcher',zh:'怎麼了？又遇到讀不懂的記錄了嗎？',ko:'무슨 일이니? 또 읽기 어려운 기록을 만났어?'},
        {speaker:'boy',zh:'沒有啦。上次你幫了我很多。我在客棧準備了一份簡單的便當，想帶來給你。',ko:'아니에요. 지난번에 많이 도와주셔서요. 여관에서 간단한 도시락을 싸 왔어요.'},
        {speaker:'towerResearcher',zh:'……原來是這樣。還特地準備了吃的啊。謝謝你。進來坐一下吧。',ko:'……그랬구나. 먹을 것까지 챙겨 왔네. 고맙다. 들어와서 잠깐 앉을래?'},
        {speaker:'narrator',zh:'研究員在訪客簿上記好名字，帶少年走進自己的研究室，把飯盒放在沒有文件的小桌上。',ko:'연구원은 방문부에 이름을 적고 소년을 자기 연구실로 데려갔다. 도시락은 자료가 없는 작은 탁자에 조심스럽게 놓았다.'},
        {speaker:'boy',zh:'裡面只有麵包和水果。不知道你喜不喜歡。',ko:'안에는 빵하고 과일밖에 없는데, 좋아하실지 모르겠어요.'},
        {speaker:'towerResearcher',zh:'謝謝。待會兒一起吃吧。',ko:'고마워. 조금 이따 같이 먹자.'},
        {speaker:'boy',zh:'咦？桌上這張是三溪鎮的舊地圖嗎？',ko:'어? 책상에 있는 이거 물길마을 옛 지도예요?'},
        {speaker:'towerResearcher',zh:'是啊。我在核對舊圖旁的註記。你認得上面的地方？',ko:'맞아. 옛 지도 옆의 설명을 확인하고 있었어. 여기가 어딘지 알아보겠니?'},
        {speaker:'boy',zh:'當然認得！我走過那條路。',ko:'당연히 알죠! 저 그 길 가 봤어요.'},
        {speaker:'towerResearcher',zh:'那這回得向你請教了。現在那條路是什麼樣子？',ko:'그럼 이번엔 내가 물어봐야겠네. 그 길은 지금 어때?'}
      ]
    },
    'academic-tower-ran-village-result': {
      id:'academic-tower-ran-village-result', chapterId:'academic-tower-research',
      titleKo:'함께 남긴 한 줄', background:'academic-tower',
      placeZh:'學術塔研究室', placeKo:'학술탑 연구실',
      beats:[
        {speaker:'boy',zh:'完全沒用了？也不盡然吧。至少那條路現在還有人走。',ko:'완전히 쓸모없다고요? 꼭 그런 건 아니죠. 적어도 그 길은 지금도 사람들이 다니잖아요.'},
        {speaker:'narrator',zh:'兩人在舊地圖旁放了一張新的註記。原來那張紙沒有被丟掉，只是旁邊多了一段說明。',ko:'둘은 옛 지도 옆에 새 해설을 한 장 붙였다. 원래 종이를 버린 게 아니라 그 옆에 설명을 더한 것이다.'},
        {speaker:'boy',zh:'我本來只是來送便當、說聲謝謝，沒想到還跟你一起整理了地圖。',ko:'도시락 드리고 감사 인사만 하려던 건데, 지도까지 함께 정리했네요.'},
        {speaker:'towerResearcher',zh:'舊圖告訴我上面畫了什麼，你卻知道現在的人怎麼走。',ko:'옛 지도는 그때 무엇을 그렸는지 알려 주고, 너는 사람들이 지금 어떻게 다니는지 알잖아.'},
        {speaker:'boy',zh:'不過我也只看過一部分。另一處歇腳的地方還在不在，我不知道。',ko:'그래도 저도 일부만 봤어요. 다른 쉼터가 아직 남아 있는지는 모르겠고요.'},
        {speaker:'towerResearcher',zh:'那就先留著這個問題。不是每一張註記都要有答案。',ko:'그럼 그 질문은 남겨 두자. 모든 메모에 답이 있어야 하는 건 아니니까.'},
        {speaker:'narrator',zh:'研究員把共同寫好的註記夾回地圖封套，收好筆。兩人回到放飯盒的小桌旁。',ko:'연구원은 함께 쓴 해설을 지도 봉투에 넣고 펜을 정리했다. 둘은 도시락을 놓아둔 작은 탁자로 돌아왔다.'},
        {speaker:'towerResearcher',zh:'差點忘了你帶來的便當。一起吃吧。',ko:'네가 가져온 도시락을 잊을 뻔했네. 같이 먹자.'},
        {speaker:'boy',zh:'可是，這是帶來給你的。',ko:'그런데 그건 연구원님 드리려고 가져온 건데요.'},
        {speaker:'towerResearcher',zh:'我知道啊。所以一起吃。',ko:'알아. 그러니까 같이 먹자.'},
        {speaker:'narrator',zh:'兩人分著吃了盒裡的麵包和水果。少年起身道別，離開時照樣在訪客簿上留下記錄。',ko:'둘은 도시락의 빵과 과일을 나눠 먹었다. 소년은 작별 인사를 하고 나갈 때도 평소처럼 방문부에 퇴실을 남겼다.'}
      ]
    }
  });


  // 04A: a chance meeting outdoors, followed by a small fieldwork result.
  Object.assign(stories, {
    'academic-tower-er-intro': {
      id:'academic-tower-er-intro',chapterId:'academic-tower-research',
      titleKo:'비가 그친 탑의 문밖',background:'academic-tower',
      placeZh:'學術塔門外',placeKo:'학술탑 밖 산책길',
      beats:[
        {speaker:'narrator',zh:'雨停了，少年沿著水道散步。學術塔的門開了，研究員正要出門。',ko:'비가 그친 뒤 소년은 물길을 따라 걷고 있었다. 학술탑 문이 열리고 연구원이 밖으로 나왔다.'},
        {speaker:'boy',zh:'咦？你要去哪裡？',ko:'어? 어디 가세요?'},
        {speaker:'towerResearcher',zh:'前幾天下了大雨。我想去看看上游的水門。',ko:'며칠 전에 큰비가 왔거든. 상류 수문을 보러 가는 길이야.'},
        {speaker:'boy',zh:'水門壞了嗎？',ko:'수문이 고장 났어요?'},
        {speaker:'towerResearcher',zh:'還沒有這樣的報告。不過，今年的雨和以前不太一樣。',ko:'그런 보고는 없었어. 다만 올해는 비 오는 모양이 평소와 좀 달라.'},
        {speaker:'towerResearcher',zh:'下過大雨，不代表每一段水道的情況都一樣。我要去看看。',ko:'큰비가 왔다고 모든 수로의 상태가 같다는 뜻은 아니니까. 직접 확인하려고.'},
        {speaker:'boy',zh:'我也可以一起去嗎？',ko:'저도 같이 가도 돼요?'},
        {speaker:'towerResearcher',zh:'好啊。不過，只能走安全的路。',ko:'좋지. 대신 안전한 길로만 다니자.'}
      ]
    },
    'academic-tower-er-result': {
      id:'academic-tower-er-result',chapterId:'academic-tower-research',
      titleKo:'남겨 둔 다음 질문',background:'academic-tower',
      placeZh:'學術塔門外',placeKo:'학술탑으로 돌아오는 길',
      beats:[
        {speaker:'boy',zh:'原圖上沒有那條水路。我們真的找到新的線索了。',ko:'원래 도면에는 없던 물길이었어요. 새로운 단서를 찾았네요.'},
        {speaker:'towerResearcher',zh:'對。不過，還不知道是誰做的，也不知道水會流去哪裡。',ko:'맞아. 하지만 누가 만들었고 물이 어디로 가는지는 아직 모르지.'},
        {speaker:'boy',zh:'那今天的調查算完成了嗎？',ko:'그럼 오늘 조사는 끝난 건가요?'},
        {speaker:'towerResearcher',zh:'我們把看到的事記下來，也會告訴管理人員。接著要查什麼，也記好了。',ko:'오늘 확인한 걸 기록했고 관리자에게도 알려야지. 다음에 무엇을 조사할지도 정했어.'},
        {speaker:'boy',zh:'本來只是一起去看水門，沒想到又有新的問題。',ko:'처음에는 그냥 수문 보러 따라왔는데, 새로운 질문까지 생겼네요.'},
        {speaker:'towerResearcher',zh:'研究就是這樣。知道了一件事，才能再往前問一步。',ko:'연구란 그런 거야. 하나를 알아야 그다음 질문도 할 수 있거든.'}
      ]
    }
  });

  if (journey.some(chapter => chapter.id === 'academic-tower-research')) return;
  journey.push({
    id: 'academic-tower-research',
    titleKo: '학술탑 · 계속되는 연구',
    tag: '상설 연구',
    sections: [{
      id: 'academic-tower',
      regionId: 'academic-tower',
      nameKo: '방향이 바뀌는 문장', stageLabel: '연구',
      plannedStageCount: 5,
      revealRequires: ['story:academic-tower-arrival'],
      sequence: [
        {
          type: 'story', id: 'academic-tower-arrival',
          requires: ['story:workshop-finale'], milestone: 'academic-tower-entered'
        },
        { type: 'story', id: 'academic-tower-turn-intro', requires: ['story:academic-tower-arrival'] },
        { type: 'stage', id: 'academic-tower-turn-01-que', requires: ['story:academic-tower-turn-intro'] },
        {
          type: 'story', id: 'academic-tower-turn-after-que',
          requires: ['stage:academic-tower-turn-01-que'], returnToRegionHubAfter: 'academic-tower'
        },
        {
          type: 'stage', id: 'academic-tower-turn-02-raner',
          timelineHeading: '두 갈래 연구', timelineNote: '02와 03은 어느 쪽부터 살펴봐도 좋아.',
          requires: ['story:academic-tower-turn-after-que'], returnToRegionHubAfter: 'academic-tower'
        },
        {
          type: 'stage', id: 'academic-tower-turn-03-expectation',
          requires: ['story:academic-tower-turn-after-que'], returnToRegionHubAfter: 'academic-tower'
        },
        {
          type: 'story', id: 'academic-tower-turn-before-faner',
          timelineHeading: '기록 종합',
          requires: ['stage:academic-tower-turn-02-raner', 'stage:academic-tower-turn-03-expectation'],
          returnToRegionHubAfter: 'academic-tower'
        },
        {
          type: 'stage', id: 'academic-tower-turn-04-faner',
          requires: ['story:academic-tower-turn-before-faner'], returnToRegionHubAfter: 'academic-tower'
        },
        {
          type: 'story', id: 'academic-tower-turn-before-synthesis',
          requires: ['stage:academic-tower-turn-04-faner'], returnToRegionHubAfter: 'academic-tower'
        },
        {
          type: 'stage', id: 'academic-tower-turn-05-synthesis',
          requires: ['story:academic-tower-turn-before-synthesis'], returnToRegionHubAfter: 'academic-tower'
        },
        {
          type: 'story', id: 'academic-tower-turn-result',
          requires: ['stage:academic-tower-turn-05-synthesis'], milestone: 'academic-tower-turn-foundation',
          returnToRegionHubAfter: 'academic-tower'
        }
      ]
    }, {
      id: 'academic-tower-optional', regionId: 'academic-tower', plannedStageCount: 1,
      nameKo: '색인 옆의 메모 · 선택 연구', stageLabel: '연구',
      revealRequires: ['stage:academic-tower-turn-02-raner', 'stage:academic-tower-turn-03-expectation'],
      sequence: [
        { type: 'story', id: 'academic-tower-ran-intro', requires: ['stage:academic-tower-turn-02-raner', 'stage:academic-tower-turn-03-expectation'] },
        { type: 'stage', id: 'academic-tower-turn-03a-ran-family', requires: ['story:academic-tower-ran-intro'] },
        { type: 'story', id: 'academic-tower-ran-result', requires: ['stage:academic-tower-turn-03a-ran-family'], returnToRegionHubAfter: 'academic-tower' }
      ]
    }, {
      id:'academic-tower-optional-ran-village', regionId:'academic-tower',
      plannedStageCount:1, nameKo:'옛 지도, 지금의 마을 · 선택 연구', stageLabel:'연구',
      revealRequires:['stage:academic-tower-turn-03a-ran-family','story:academic-tower-ran-result'],
      sequence:[
        {type:'story',id:'academic-tower-ran-village-intro',requires:['story:academic-tower-ran-result','story:market-after-m4']},
        {type:'stage',id:'academic-tower-turn-03b-ran-village',requires:['story:academic-tower-ran-village-intro']},
        {type:'story',id:'academic-tower-ran-village-result',requires:['stage:academic-tower-turn-03b-ran-village'],returnToRegionHubAfter:'academic-tower'}
      ]
    }, {
      id:'academic-tower-optional-er-fieldwork',regionId:'academic-tower',
      plannedStageCount:1,nameKo:'비가 그친 물길 · 선택 연구',stageLabel:'연구',
      revealRequires:['stage:academic-tower-turn-04-faner'],revealAfterRain:true,
      sequence:[
        {type:'story',id:'academic-tower-er-intro',requires:['stage:academic-tower-turn-04-faner'],requiresRainPassed:true},
        {type:'stage',id:'academic-tower-turn-04a-er-family',requires:['story:academic-tower-er-intro']},
        {type:'story',id:'academic-tower-er-result',requires:['stage:academic-tower-turn-04a-er-family'],returnToWorldAfter:true}
      ]
    }]
  });
})();
