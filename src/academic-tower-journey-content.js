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
        { speaker: 'narrator', zh: '研究員把三張紙按日期排開。原件還看得清楚，要送去工坊的副本上，幾個連接詞卻已經褪色了。', ko: '연구원은 종이 세 장을 날짜순으로 펼쳤다. 원본은 아직 읽을 수 있었지만 장인골에 보낼 사본에서는 몇몇 접속어의 먹빛이 바래 있었다.' },
        { speaker: 'towerResearcher', zh: '工坊還在使用相近的舊裝置。要把副本送下去，不能只抄第一張。', ko: '장인골에서는 지금도 비슷한 옛 장치를 쓰고 있어. 사본을 내려보내려면 첫 장만 옮겨 적어서는 안 돼.' },
        { speaker: 'boy', zh: '句子前後還在。我讀完兩邊，再把連接詞補回去。', ko: '접속어 앞뒤 문장은 남아 있어요. 양쪽을 끝까지 읽고 알맞은 말을 복원해 볼게요.' },
        { speaker: 'towerResearcher', zh: '這次我不標出關係。別只看熟悉的字，先讀完整句。', ko: '이번에는 관계를 표시해 주지 않을게. 익숙한 글자만 고르지 말고 문장 전체를 먼저 읽어.' }
      ]
    },
    'academic-tower-turn-result': {
      id: 'academic-tower-turn-result', chapterId: 'academic-tower-research', titleKo: '첫 번째 가설',
      background: 'academic-tower', placeZh: '學術塔研究室', placeKo: '학술탑 연구실',
      beats: [
        { speaker: 'narrator', zh: '少年把最後一個連接詞補回副本，在下方寫下了安全範圍。', ko: '소년은 마지막 접속어를 사본에 복원하고 그 아래에 안전한 범위를 적었다.' },
        { speaker: 'towerResearcher', zh: '如果只讀第一張，我們就會叫工匠繼續增加水量。後面的記錄，正好阻止了這個錯誤。', ko: '첫 장만 읽었다면 장인에게 계속 물을 늘리라고 했을 거야. 뒤의 기록이 바로 그 잘못을 막아 줬어.' },
        { speaker: 'boy', zh: '記錄不是互相說謊。是我如果停得太早，就會讀錯。', ko: '기록들이 서로 거짓말한 게 아니었어요. 제가 너무 일찍 멈춰 읽으면 틀리는 거였어요.' },
        { speaker: 'narrator', zh: '補好的副本被放到舊索引旁。卡片角落那道磨損的刻痕，忽然亮起一道很淡的光。', ko: '복원한 사본을 옛 색인 옆에 놓았다. 카드 귀퉁이의 닳은 자국에서 갑자기 희미한 빛이 번졌다.' },
        { speaker: 'boy', zh: '又亮了。', ko: '또 빛났어요.' },
        { speaker: 'towerResearcher', zh: '我也看見了。先別碰。', ko: '나도 봤어. 우선 손대지 마.' },
        { speaker: 'narrator', zh: '光只停了一瞬，隨即退回舊紙的顏色。', ko: '빛은 한순간 머물렀다가 곧 낡은 종이 빛깔 속으로 사라졌다.' },
        { speaker: 'towerResearcher', zh: '現在只能記下條件：同一組記錄的順序和關係都排好時，它有了反應。這還不是答案。', ko: '지금 기록할 수 있는 조건은 하나야. 같은 묶음의 순서와 관계가 맞춰졌을 때 표식이 반응했다는 것. 아직 답은 아니야.' },
        { speaker: 'boy', zh: '至少，它不只跟水車有關。關口的路標也亮過。', ko: '적어도 수차에만 관계된 건 아니네요. 길목의 길표지도 빛났으니까요.' },
        { speaker: 'towerResearcher', zh: '也不像某一個工匠的署名。要再找別的記錄，才能知道它跟什麼有關。', ko: '어느 장인 한 사람의 서명 같지도 않아. 무엇과 관계있는지 알려면 다른 기록을 더 찾아야 해.' },
        { speaker: 'narrator', zh: '研究員拉開長桌下的一個空格，把少年補好的副本和安全記錄放了進去。', ko: '연구원은 긴 탁자 아래의 빈 칸 하나를 열어 소년이 복원한 사본과 안전 기록을 넣었다.' },
        { speaker: 'towerResearcher', zh: '這一格先留給你。以後找到相同的記號，或是讀不通的記錄，就放在這裡。', ko: '이 칸은 네 자리로 남겨 둘게. 같은 표식을 찾거나 잘 읽히지 않는 기록이 생기면 여기에 모으자.' },
        { speaker: 'boy', zh: '那我還可以再來嗎？', ko: '그럼 다시 와도 되나요?' },
        { speaker: 'towerResearcher', zh: '這座塔沒有「全部讀完」的一天。找到下一個問題，再回來就是了。', ko: '이 탑에는 ‘전부 다 읽는 날’이 없어. 다음 질문을 찾으면 다시 오면 돼.' }
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
      plannedStageCount: 5,
      revealRequires: ['story:academic-tower-arrival'],
      sequence: [
        {
          type: 'story', id: 'academic-tower-arrival',
          requires: ['story:chapter1-room-finale'], milestone: 'academic-tower-entered'
        },
        { type: 'story', id: 'academic-tower-turn-intro', requires: ['story:academic-tower-arrival'] },
        { type: 'stage', id: 'academic-tower-turn-01-que', requires: ['story:academic-tower-turn-intro'] },
        {
          type: 'story', id: 'academic-tower-turn-after-que',
          requires: ['stage:academic-tower-turn-01-que'], returnToRegionHubAfter: 'academic-tower'
        },
        {
          type: 'stage', id: 'academic-tower-turn-02-raner',
          requires: ['story:academic-tower-turn-after-que'], returnToRegionHubAfter: 'academic-tower'
        },
        {
          type: 'stage', id: 'academic-tower-turn-03-expectation',
          requires: ['story:academic-tower-turn-after-que'], returnToRegionHubAfter: 'academic-tower'
        },
        {
          type: 'story', id: 'academic-tower-turn-before-faner',
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
    }]
  });
})();
