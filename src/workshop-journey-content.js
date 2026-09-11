/* Workshop story/stage sequence. Mutates the shallow-frozen JourneyContent children before progress helpers read them. */
(() => {
  const stories = JourneyContent.STORIES;
  Object.assign(stories, {
    'workshop-arrival': {
      id: 'workshop-arrival', chapterId: 'chapter-1-three-roads', titleKo: '물소리를 따라 장인골로',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '少年沿著溪流往上走。水聲裡混著木輪轉動和敲打工具的聲音。', ko: '소년은 물길을 따라 위쪽으로 걸었다. 물소리 사이로 나무 바퀴 도는 소리와 공구 두드리는 소리가 섞여 들렸다.' },
        { speaker: 'narrator', zh: '幾間工坊沿著水道排開。一名工匠正用兩手扶著總水門的木桿，旁邊一座小水車卻停著不動。', ko: '수로를 따라 작은 공방들이 늘어서 있었다. 한 장인이 두 손으로 큰 수문의 나무 손잡이를 붙들고 있었고, 옆의 작은 물레방아 하나는 멈춰 있었다.' },
        { speaker: 'artisan', zh: '喂，小弟！不好意思，可以幫個忙嗎？', ko: '거기, 꼬마야! 미안한데 잠깐 손 좀 빌려줄래?' },
        { speaker: 'artisan', zh: '這個總水門的卡榫鬆了，我得先扶著，不然水會全偏到另一條水道。我現在走不開。', ko: '이 큰 수문의 고정쇠가 느슨해져서 내가 붙잡고 있어야 해. 손을 놓으면 물이 한쪽 수로로 몰려. 지금은 여기서 움직일 수가 없구나.' },
        { speaker: 'artisan', zh: '本來該我去看那座停掉的水車。你先幫我看看那兩個小水門，好嗎？', ko: '원래는 내가 저 멈춘 물레방아를 보러 가야 하는데. 저쪽 작은 수문 두 개만 대신 봐 줄 수 있겠니?' },
        { speaker: 'boy', zh: '我嗎？可是我不會修東西。', ko: '제가요? 그런데 저는 수리할 줄 모르는데요.' },
        { speaker: 'artisan', zh: '不用你修。先看就好。左邊的水還太少，右邊現在剛剛好。左邊慢慢調，右邊別動。', ko: '수리까지 할 필요 없어. 먼저 상태만 보면 돼. 왼쪽은 아직 물이 부족하고, 오른쪽은 지금 딱 맞아. 왼쪽만 조금씩 움직여 보고 오른쪽은 건드리지 마.' },
        { speaker: 'artisan', zh: '先別急著動。每動一次，就看看哪裡跟著變。', ko: '급하게 만지지 말고. 한 번 움직일 때마다 어디가 같이 달라지는지 봐.' },
        { speaker: 'boy', zh: '好。我先看看現在的狀態。', ko: '좋아요. 먼저 지금 상태부터 볼게요.' }
      ]
    },
    'workshop-after-w1': {
      id: 'workshop-after-w1', chapterId: 'chapter-1-three-roads', titleKo: '손대지 않는 것도 기술',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '少年一點一點調高左邊的水門。第二次調整後，水車終於慢慢轉了起來。右邊的水門從頭到尾都沒有動。', ko: '소년은 왼쪽 수문을 조금씩 올렸다. 두 번째로 조절하자 물레방아가 마침내 천천히 돌기 시작했다. 오른쪽 수문은 처음부터 끝까지 그대로였다.' },
        { speaker: 'artisan', zh: '好，這樣我就不用放開這邊，也知道那座水車怎麼了。謝啦。', ko: '좋아. 덕분에 내가 이쪽을 놓지 않고도 저 물레방아 상태를 확인했네. 고맙다.' },
        { speaker: 'artisan', zh: '要改的地方改，不該動的地方保持原樣。你倒是沒有一上來就亂碰。', ko: '바꿀 곳은 바꾸고, 건드리지 않을 곳은 그대로 두는 거야. 너는 다짜고짜 이것저것 만지지는 않는구나.' },
        { speaker: 'boy', zh: '原來修東西，不是每個地方都要動。', ko: '고친다고 해서 모든 곳을 움직여야 하는 건 아니구나.' },
        { speaker: 'artisan', zh: '我先把這邊的卡榫固定好。工坊裡還有幾處怪怪的，你願意的話，等等再來幫我看看。', ko: '난 우선 이쪽 고정쇠부터 제대로 고쳐 놓을게. 공방 안에 이상한 곳이 몇 군데 더 있으니, 괜찮다면 나중에 다시 와서 좀 봐 줘.' }
      ]
    },
    'workshop-w2-setup': {
      id: 'workshop-w2-setup', chapterId: 'chapter-1-three-roads', titleKo: '불과 바람이 어긋난 화덕',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '少年再走進工坊時，總水門的卡榫已經固定好了。那名工匠正站在一座小火爐旁。', ko: '소년이 다시 공방으로 들어오자 큰 수문의 고정쇠는 이미 고쳐져 있었다. 그 장인은 작은 화덕 옆에 서 있었다.' },
        { speaker: 'artisan', zh: '剛好，你來了。剛才你會先看再動，這個也幫我看一下吧。我就在旁邊。', ko: '마침 잘 왔다. 아까 보니 너는 먼저 보고 나서 움직이더라. 이것도 한번 봐 줄래? 이번엔 나도 바로 옆에 있을게.' },
        { speaker: 'artisan', zh: '這個爐子怪怪的。火太大了，風反而太小。兩邊都不對。', ko: '이 화덕 상태가 좀 이상해. 불은 너무 센데 바람은 오히려 너무 약해. 양쪽 다 맞지 않아.' },
        { speaker: 'boy', zh: '所以不能只看一邊。', ko: '그럼 한쪽만 봐서는 안 되겠네요.' },
        { speaker: 'artisan', zh: '對。火和風一起看。別管哪個先，最後都調到剛剛好就行。', ko: '그래. 불과 바람을 같이 봐. 어느 쪽부터 해도 상관없고, 마지막에 둘 다 딱 맞게 조절하면 돼.' },
        { speaker: 'boy', zh: '我試試看。', ko: '해볼게요.' }
      ]
    },
    'workshop-after-w2': {
      id: 'workshop-after-w2', chapterId: 'chapter-1-three-roads', titleKo: '크게가 아니라 알맞게',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '少年把太大的火減少，又把太小的風增加。兩邊都到合適的位置後，爐子的聲音穩了下來。', ko: '소년은 너무 센 불을 줄이고 너무 약한 바람을 늘렸다. 두 상태가 모두 알맞은 곳에 오자 화덕 소리가 안정됐다.' },
        { speaker: 'artisan', zh: '這就叫調整。不是越大越好，也不是越小越好，是要放到對的位置。', ko: '이런 게 조절이야. 무조건 클수록 좋은 것도, 작을수록 좋은 것도 아니고 알맞은 자리에 맞추는 거지.' },
        { speaker: 'boy', zh: '增加和減少，都是為了最後的狀態。', ko: '늘리는 것과 줄이는 것 모두 마지막 상태를 맞추기 위한 거네요.' },
        { speaker: 'artisan', zh: '沒錯。你開始會看兩個地方一起變了。下次給你看一個更麻煩的——一邊動，另一邊也會跟著動。', ko: '맞아. 이제 두 곳의 상태를 같이 보기 시작했네. 다음엔 좀 더 골치 아픈 걸 보여주지. 한쪽을 움직이면 다른 쪽도 같이 움직이는 장치야.' }
      ]
    },
    'workshop-w3-setup': {
      id: 'workshop-w3-setup', chapterId: 'chapter-1-three-roads', titleKo: '같이 도는 장치들',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '工匠帶少年走到長長的木軸旁。主軸一直在轉，下面分出三條皮帶。', ko: '장인은 소년을 길쭉한 나무 주축 옆으로 데려갔다. 주축은 계속 돌고 있었고, 아래로 세 갈래 벨트가 나뉘어 있었다.' },
        { speaker: 'artisan', zh: '這就是我剛才說的。這裡一連接，主軸的力量就會傳過去，那邊也會一起轉。', ko: '아까 말한 게 이거야. 여기 연결쇠가 맞물리면 주축의 힘이 건너가서 저쪽 장치도 같이 돌아.' },
        { speaker: 'artisan', zh: '左邊的磨輪等一下要用，現在卻沒有連接。中央木輪現在正常，不用動。', ko: '왼쪽 숫돌은 곧 써야 하는데 지금은 주축과 분리돼 있어. 가운데 작업바퀴는 지금 정상이라 건드릴 필요 없고.' },
        { speaker: 'boy', zh: '右邊的吊輪在轉，可是上面什麼也沒掛。', ko: '오른쪽 권양기는 돌고 있는데, 걸려 있는 게 아무것도 없네요.' },
        { speaker: 'artisan', zh: '沒錯。要用的連接起來，不用的就分開。中央保持現在這樣。', ko: '맞아. 쓸 것은 연결하고, 안 쓰는 것은 분리해. 가운데는 지금 상태를 유지하면 돼.' },
        { speaker: 'artisan', zh: '順序你自己決定。動一個連接處，就看看哪些輪子跟著變。', ko: '순서는 네가 정해. 연결쇠 하나를 움직일 때마다 어떤 바퀴가 같이 달라지는지 봐.' }
      ]
    },
    'workshop-after-w3': {
      id: 'workshop-after-w3', chapterId: 'chapter-1-three-roads', titleKo: '이어진 만큼 힘이 간다',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '磨輪接上主軸後轉了起來，空著的吊輪則和主軸分開，慢慢停下。中央木輪一直照常轉著。', ko: '숫돌은 주축과 연결되자 돌기 시작했고, 비어 있던 권양기는 주축에서 분리되어 천천히 멈췄다. 가운데 작업바퀴는 계속 정상적으로 돌았다.' },
        { speaker: 'artisan', zh: '連接不是只把兩個東西靠在一起。力量也會跟著連接過去。', ko: '연결은 물건 두 개를 그냥 붙여 놓는 게 아니야. 힘도 그 연결을 따라 건너가지.' },
        { speaker: 'boy', zh: '所以不用的地方也一直連著，反而會多帶一個東西。', ko: '그러면 안 쓰는 곳까지 계속 연결해 두면 괜히 장치 하나를 더 돌리는 셈이네요.' },
        { speaker: 'artisan', zh: '對。該連的連，該分的分，原本正常的就保持。你現在開始會看「關係」了。', ko: '그렇지. 이을 건 잇고, 떼어 둘 건 떼어 두고, 원래 정상인 건 유지하는 거야. 이제 장치 사이의 관계를 보기 시작했네.' },
        { speaker: 'artisan', zh: '下一個可不是只看一條連接就行。幾個狀態要一起對，工作臺才會打開。', ko: '다음 건 연결 하나만 본다고 끝나지 않아. 여러 상태가 함께 맞아야 작업대가 열릴 거야.' }
      ]
    }
  });

  const section = JourneyContent.JOURNEY
    .flatMap(chapter => chapter.sections)
    .find(item => item.id === 'workshop-town');
  if (!section) return;
  section.sequence.splice(0, section.sequence.length,
    { type: 'story', id: 'workshop-arrival', requires: ['story:chapter1-roadside-merchant'] },
    { type: 'stage', id: 'workshop-stage-1', requires: ['story:workshop-arrival'] },
    { type: 'story', id: 'workshop-after-w1', requires: ['stage:workshop-stage-1'], returnToWorldAfter: true },
    { type: 'story', id: 'workshop-w2-setup', requires: ['story:workshop-after-w1'] },
    { type: 'stage', id: 'workshop-stage-2', requires: ['story:workshop-w2-setup'] },
    { type: 'story', id: 'workshop-after-w2', requires: ['stage:workshop-stage-2'], returnToWorldAfter: true },
    { type: 'story', id: 'workshop-w3-setup', requires: ['story:workshop-after-w2'] },
    { type: 'stage', id: 'workshop-stage-3', requires: ['story:workshop-w3-setup'] },
    { type: 'story', id: 'workshop-after-w3', requires: ['stage:workshop-stage-3'], returnToWorldAfter: true }
  );
})();