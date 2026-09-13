/* Workshop W4-W7 story sequence. Loaded after workshop-journey-content.js. */
(() => {
  const stories = JourneyContent.STORIES;
  Object.assign(stories, {
    'workshop-w4-setup': {
      id: 'workshop-w4-setup', chapterId: 'chapter-1-three-roads', titleKo: '열리지 않는 작업대',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '再回到工坊時，工匠正把幾件工具搬到一張舊工作臺旁。工作臺前的卡鎖卻沒有打開。', ko: '다시 공방에 오자 장인은 낡은 작업대 옆으로 공구를 옮기고 있었다. 그런데 작업대 앞의 잠금쇠가 풀리지 않고 있었다.' },
        { speaker: 'artisan', zh: '這張工作臺不是用鑰匙開的。旁邊三個條件都對了，卡鎖才會放開。', ko: '이 작업대는 열쇠로 여는 게 아니야. 옆의 세 조건이 모두 맞아야 잠금쇠가 풀리지.' },
        { speaker: 'boy', zh: '三個都要一樣嗎？', ko: '세 개를 전부 같은 상태로 만들면 돼요?' },
        { speaker: 'artisan', zh: '不是。每個條件要的狀態不同。水量要剛好，工作軸要連接，火爐要關掉。', ko: '아니. 조건마다 필요한 상태가 달라. 물은 알맞게, 작업축은 연결, 화덕은 꺼진 상태여야 해.' },
        { speaker: 'artisan', zh: '我把工具整理好。你先看哪個條件已經符合，哪個還沒有。', ko: '나는 공구를 정리해 둘게. 너는 어떤 조건이 이미 맞고 어떤 조건이 아직 안 맞는지 먼저 봐.' }
      ]
    },
    'workshop-after-w4': {
      id: 'workshop-after-w4', chapterId: 'chapter-1-three-roads', titleKo: '하나가 아니라 모두',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '最後一個條件符合時，三個小標記一起對上，工作臺的卡鎖喀一聲彈開。', ko: '마지막 조건까지 맞자 세 표시가 모두 들어맞았고, 작업대 잠금쇠가 딸깍 소리를 내며 풀렸다.' },
        { speaker: 'boy', zh: '一個條件符合還不夠，要看全部。', ko: '조건 하나만 맞는 걸로는 부족하고, 전부 봐야 하는 거군요.' },
        { speaker: 'artisan', zh: '對。越往裡面的裝置，越常是幾個條件一起決定結果。', ko: '그래. 안쪽 장치로 갈수록 여러 조건이 함께 결과를 정하는 경우가 많아.' }
      ]
    },
    'workshop-w5-setup': {
      id: 'workshop-w5-setup', chapterId: 'chapter-1-three-roads', titleKo: '연기 속의 불꽃',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '另一座小爐子冒著黑煙。火焰本身不算小，煙卻一直往上竄。', ko: '다른 작은 화덕에서는 검은 연기가 피어오르고 있었다. 불꽃 자체는 약하지 않은데 연기만 계속 솟았다.' },
        { speaker: 'artisan', zh: '這次火力已經剛剛好。別碰火，只調風。', ko: '이번에는 불의 세기가 이미 딱 맞아. 불은 건드리지 말고 바람만 조절해.' },
        { speaker: 'boy', zh: '要調到哪裡？', ko: '어디까지 맞추면 돼요?' },
        { speaker: 'artisan', zh: '別只看刻度。看結果。風夠了，會有東西出現，也會有東西消失。', ko: '눈금만 보지 마. 결과를 봐. 바람이 충분해지면 나타나는 것도 있고, 사라지는 것도 있을 거야.' }
      ]
    },
    'workshop-after-w5': {
      id: 'workshop-after-w5', chapterId: 'chapter-1-three-roads', titleKo: '직접 누르지 않는 결과',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '風量再增加一段，火焰的顏色變成清亮的藍色，原本翻滾的黑煙也散了。', ko: '바람을 한 단계 더 올리자 불꽃이 맑은 푸른빛으로 바뀌었고, 피어오르던 검은 연기도 흩어졌다.' },
        { speaker: 'boy', zh: '我沒有做「出現」或「消失」的動作。是條件變了，結果自己出現。', ko: '제가 나타나게 하거나 사라지게 하는 행동을 한 건 아니네요. 조건이 바뀌니까 결과가 생긴 거예요.' },
        { speaker: 'artisan', zh: '就是這樣。修東西常常不是直接碰結果，而是去找造成結果的狀態。', ko: '바로 그거야. 장치를 다룰 때는 결과를 직접 건드리는 게 아니라 그 결과를 만드는 상태를 찾는 경우가 많지.' }
      ]
    },
    'workshop-w6-setup': {
      id: 'workshop-w6-setup', chapterId: 'chapter-1-three-roads', titleKo: '이번에는 정말 망가졌다',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '工坊深處傳來斷斷續續的喀啦聲。一組三個齒輪停在半途，怎麼調也不動。', ko: '공방 안쪽에서 끊기는 듯한 덜컹 소리가 났다. 세 톱니로 된 장치가 중간에서 멈춘 채 아무리 조절해도 움직이지 않았다.' },
        { speaker: 'artisan', zh: '前面的問題多半是狀態不對。這次不一樣，三個齒輪裡有一個真的損壞了。', ko: '앞의 문제들은 대부분 상태가 잘못된 거였지. 이번엔 달라. 세 톱니 중 하나가 실제로 손상됐어.' },
        { speaker: 'artisan', zh: '我先不告訴你是哪個。先看，再決定要不要修。', ko: '어느 건지는 먼저 말하지 않을게. 상태를 보고 수리가 필요한지 판단해 봐.' },
        { speaker: 'boy', zh: '正常的就不要亂修。', ko: '정상인 건 괜히 수리하면 안 되고요.' },
        { speaker: 'artisan', zh: '嗯。找到損壞的，再修復它。然後看看什麼恢復了。', ko: '그래. 손상된 걸 찾고, 그걸 수리해. 그다음 무엇이 회복되는지도 보고.' }
      ]
    },
    'workshop-after-w6': {
      id: 'workshop-after-w6', chapterId: 'chapter-1-three-roads', titleKo: '고치는 일과 돌아오는 기능',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '裂開的齒輪修好後，三個齒輪重新咬合，停住的機器又轉了起來。', ko: '갈라진 톱니를 고치자 세 톱니가 다시 맞물렸고, 멈춰 있던 장치가 다시 돌기 시작했다.' },
        { speaker: 'artisan', zh: '齒輪是你修復的，機器的功能是因此恢復的。兩件事別混在一起。', ko: '네가 한 일은 톱니를 수리한 거고, 그 결과 장치의 기능이 회복된 거야. 둘은 구분해서 봐.' },
        { speaker: 'boy', zh: '修復是動作，恢復是結果。', ko: '수리는 행동이고, 회복은 결과네요.' },
        { speaker: 'artisan', zh: '對。看來可以帶你去看最後那個了。', ko: '맞아. 이제 마지막 장치를 보여줘도 되겠구나.' }
      ]
    },
    'workshop-before-core': {
      id: 'workshop-before-core', chapterId: 'chapter-1-three-roads', titleKo: '골짜기의 오래된 조절기',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '工匠帶少年走到幾間工坊共用的舊調節器前。水管、木軸和齒輪都從這裡分向不同的工坊。', ko: '장인은 소년을 여러 공방이 함께 쓰는 오래된 조절기 앞으로 데려갔다. 수로와 나무축, 톱니가 이곳에서 각 공방으로 갈라져 나갔다.' },
        { speaker: 'artisan', zh: '你第一次來時，我只是手走不開，才請路過的小孩幫我看兩個水門。', ko: '네가 처음 왔을 때는 내가 손을 뗄 수가 없어서 지나가던 꼬마한테 수문 두 개만 봐 달라고 한 거였지.' },
        { speaker: 'artisan', zh: '現在不一樣。這個我就在旁邊看著，但怎麼處理，你先自己判斷。', ko: '지금은 달라. 나는 바로 옆에서 보고 있을 테니, 어떻게 손댈지는 네가 먼저 판단해 봐.' },
        { speaker: 'boy', zh: '要先看哪些地方已經正常，哪些地方真的要動。', ko: '먼저 어디가 이미 정상이고, 어디를 정말 손대야 하는지 봐야겠네요.' },
        { speaker: 'artisan', zh: '沒錯。先別急著修。看看動了這個，哪裡會跟著變。', ko: '그래. 서둘러 고치지 마. 하나를 움직였을 때 어디가 같이 변하는지 봐.' }
      ]
    },
    'workshop-finale': {
      id: 'workshop-finale', chapterId: 'chapter-1-three-roads', titleKo: '맡겨도 되는 사람',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '水流穩了，空轉的輪子停下，修好的齒輪重新咬合。舊調節器的敲擊聲終於消失。', ko: '물 흐름이 안정되고, 헛돌던 바퀴가 멈췄으며, 수리한 톱니가 다시 맞물렸다. 오래된 조절기의 덜컹거림도 마침내 사라졌다.' },
        { speaker: 'artisan', zh: '你手不算特別快。這反而好。你會先看，不該碰的地方也知道不要碰。', ko: '네 손이 특별히 빠른 건 아니야. 오히려 그게 좋아. 먼저 보고, 건드리지 말아야 할 곳도 알아서 안 건드리니까.' },
        { speaker: 'artisan', zh: '拿著。這是修繕牌。以後工坊裡有人需要幫忙，看到這個就知道你不是來亂碰東西的。', ko: '자, 받아. 공방 수리패야. 앞으로 공방에서 누가 도움을 구할 때 이걸 보면 네가 함부로 장치를 만지는 애는 아니라는 걸 알 거다.' },
        { speaker: 'narrator', zh: '工匠又把幾枚硬幣放到少年手裡。', ko: '장인은 동전 몇 닢도 소년의 손에 올려놓았다.' },
        { speaker: 'artisan', zh: '這是今天的工錢。做了事，就該拿。', ko: '오늘 일한 품삯이다. 일을 했으면 받아야지.' },
        { speaker: 'boy', zh: '……謝謝。', ko: '……고맙습니다.' },
        { speaker: 'narrator', zh: '就在這時，調節器旁一塊舊銘牌上的刻痕短短亮了一下，又立刻暗下去。', ko: '그때 조절기 옆의 오래된 명판에 새겨진 자국이 잠깐 빛났다가 곧 다시 어두워졌다.' },
        { speaker: 'artisan', zh: '嗯？這標記……以前的圖紙上好像也有。學術塔也許留著舊記錄。有空再去問吧，不急。', ko: '응? 이 표식… 예전 도면에서도 본 것 같은데. 학술탑에 옛 기록이 남아 있을지도 몰라. 나중에 시간 나면 물어봐. 급한 건 아니고.' }
      ]
    }
  });

  const section = JourneyContent.JOURNEY
    .flatMap(chapter => chapter.sections)
    .find(item => item.id === 'workshop-town');
  if (!section || section.sequence.some(node => node.id === 'workshop-stage-4')) return;

  section.sequence.push(
    { type: 'story', id: 'workshop-w4-setup', requires: ['story:workshop-after-w3'] },
    { type: 'stage', id: 'workshop-stage-4', requires: ['story:workshop-w4-setup'] },
    { type: 'story', id: 'workshop-after-w4', requires: ['stage:workshop-stage-4'], returnToWorldAfter: true },
    { type: 'story', id: 'workshop-w5-setup', requires: ['story:workshop-after-w4'] },
    { type: 'stage', id: 'workshop-stage-5', requires: ['story:workshop-w5-setup'] },
    { type: 'story', id: 'workshop-after-w5', requires: ['stage:workshop-stage-5'], returnToWorldAfter: true },
    { type: 'story', id: 'workshop-w6-setup', requires: ['story:workshop-after-w5'] },
    { type: 'stage', id: 'workshop-stage-6', requires: ['story:workshop-w6-setup'] },
    { type: 'story', id: 'workshop-after-w6', requires: ['stage:workshop-stage-6'], returnToWorldAfter: true },
    { type: 'story', id: 'workshop-before-core', requires: ['story:workshop-after-w6'] },
    { type: 'stage', id: 'workshop-stage-7', requires: ['story:workshop-before-core'] },
    { type: 'story', id: 'workshop-finale', requires: ['stage:workshop-stage-7'], returnToWorldAfter: true }
  );
})();
