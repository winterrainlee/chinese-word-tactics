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
        }
      ]
    }]
  });
})();
