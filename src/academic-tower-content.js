/* Academic Tower Slice A: shared reading-workbench data and the first two rooms. */
(() => {
  Object.assign(WORDS, {
    '卻': {
      p: 'ㄑㄩㄝˋ',
      k: '그런데, 하지만; 오히려 앞말과 다른 뒤 내용을 이끌다',
      ex: '這條水道比較短，雨天卻更危險。',
      rule: '이 방에서는 앞 정보를 지우지 않은 채, 卻 뒤에 놓인 내용으로 최종 판단의 중심을 옮겨.'
    },
    '然而': {
      p: 'ㄖㄢˊ ㄦˊ',
      k: '그러나, 그렇지만',
      ex: '修復舊水道可以增加水量。然而，這個裝置還沒有恢復正常。',
      rule: '이 방에서는 앞 기록을 인정하면서도, 이어지는 기록이 전체 결론을 제한하도록 두 기록을 연결해.'
    }
  });

  const bundle = {
    id: 'academic-tower-turning-directions-v0.1',
    regionId: 'academic-tower',
    hubId: 'academic-tower-hub',
    titleKo: '방향이 바뀌는 문장',
    titleZh: '改變方向的句子',
    rooms: [
      {
        id: 'academic-tower-turn-01-que', number: '01', titleKo: '뒤에 남는 중심',
        titleZh: '重點卻在後面', expressions: ['卻'], implemented: true, requires: []
      },
      {
        id: 'academic-tower-turn-02-raner', number: '02', titleKo: '기록 사이의 전환',
        titleZh: '然而，記錄還沒結束', expressions: ['然而'], implemented: true,
        requires: ['academic-tower-turn-01-que']
      },
      {
        id: 'academic-tower-turn-03-expectation', number: '03', titleKo: '예상과 실제',
        titleZh: '果然，還是竟然？', expressions: ['果然', '竟然'], implemented: false,
        requires: ['academic-tower-turn-01-que']
      },
      {
        id: 'academic-tower-turn-04-faner', number: '04', titleKo: '반대로 나온 결과',
        titleZh: '結果反而相反', expressions: ['反而'], implemented: false,
        requires: ['academic-tower-turn-02-raner', 'academic-tower-turn-03-expectation']
      },
      {
        id: 'academic-tower-turn-05-synthesis', number: '05', titleKo: '겹쳐진 방향',
        titleZh: '讀懂轉折與反轉', expressions: ['卻', '然而', '果然', '竟然', '反而'], implemented: false,
        requires: ['academic-tower-turn-04-faner']
      }
    ]
  };

  STAGES.push({
    id: 'academic-tower-turn-01-que',
    title: '卻',
    subtitle: '뒤에 남는 중심',
    kicker: '학술탑 · 방향이 바뀌는 문장 01',
    grid: ['S'],
    goal: '把句子分開，把重點留在後面。',
    rule: '앞 정보를 버리지 말고, 마지막 판단이 어디에 남는지 표시해.',
    words: ['卻'],
    win: [],
    story: '앞의 장점은 남겨 두되, 비 오는 날의 위험이 최종 판단의 중심임을 기록했다.',
    completionTitle: '✓ 뒤에 남는 중심을 찾음',
    completionAction: '이야기 계속',
    academicTower: {
      kind: 'later-focus',
      record: '這條水道比較短，雨天卻更危險。',
      chunks: [
        { id: 'earlier', text: '這條水道比較短', labelKo: '앞 정보 · 수로가 더 짧다' },
        { id: 'later', text: '雨天卻更危險', labelKo: '뒤 판단 · 비 오는 날 더 위험하다' }
      ],
      splitOptions: [
        { id: 'comma', label: '쉼표에서 나누기', normalized: 'before-marker' },
        { id: 'marker', label: '卻 앞에서 나누기', normalized: 'before-marker' }
      ]
    },
    wordContext: {
      '卻': {
        ex: '這條水道比較短，雨天卻更危險。',
        rule: '但是／可是／不過처럼 앞뒤를 대조하지만, 이 기록에서는 卻 뒤의 위험 정보에 중심 표식을 놓아야 해.'
      }
    }
  });

  STAGES.push({
    id: 'academic-tower-turn-02-raner',
    title: '卻・然而',
    subtitle: '기록 사이의 전환',
    kicker: '학술탑 · 방향이 바뀌는 문장 02',
    grid: ['S'],
    goal: '用「然而」連接兩份記錄，再更新最後的判斷。',
    rule: '첫 기록이 맞더라도, 뒤 기록을 읽은 뒤 전체 결론을 다시 정해야 해.',
    words: ['卻', '然而'],
    win: [],
    story: '수리 효과와 아직 남은 이상을 함께 보존한 채, 최종 상태를 “아직 정상 아님”으로 고쳤다.',
    completionTitle: '✓ 두 기록의 전환을 연결함',
    completionAction: '연구실로',
    academicTower: {
      kind: 'record-contrast',
      records: [
        { id: 'earlier-record', text: '修復舊水道可以增加水量。', labelKo: '앞 기록 · 수리 효과 있음' },
        { id: 'later-record', text: '然而，這個裝置還沒有恢復正常。', labelKo: '뒤 기록 · 장치는 아직 정상 아님' }
      ],
      conclusions: [
        { id: 'restored', labelZh: '裝置已恢復正常', labelKo: '장치가 정상으로 회복됨' },
        { id: 'not-restored', labelZh: '裝置還沒有恢復正常', labelKo: '장치는 아직 정상 아님' }
      ]
    },
    wordContext: {
      '卻': {
        ex: '雨天卻更危險。',
        rule: '01에서는 한 문장 안에서 卻 뒤 절로 중심을 옮겼어. 이번 방의 然而는 떨어진 두 기록 사이에서 같은 갱신을 더 넓게 적용해.'
      },
      '然而': {
        ex: '修復舊水道可以增加水量。然而，這個裝置還沒有恢復正常。',
        rule: '앞 기록을 틀렸다고 지우는 말이 아니야. 수리 효과는 인정하되, 뒤 기록을 연결해 전체 장치가 아직 정상은 아니라는 결론으로 갱신해.'
      }
    }
  });

  globalThis.AcademicTowerContent = Object.freeze({
    bundle: Object.freeze({ ...bundle, rooms: Object.freeze(bundle.rooms.map(room => Object.freeze(room))) })
  });
})();
