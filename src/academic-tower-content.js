/* Academic Tower: shared claim-revision workbench data and the first two rooms. */
(() => {
  Object.assign(WORDS, {
    '卻': {
      p: 'ㄑㄩㄝˋ',
      k: '그런데, 하지만; 앞에서 생긴 예상과 다른 내용을 뒤에서 덧붙이다',
      ex: '這條水道比較短，雨天卻更危險。',
      rule: '앞뒤 사실은 함께 남을 수 있어. 卻 뒤 내용을 읽고, 앞 사실에서 너무 빨리 내린 판단이 없는지 다시 살펴봐.'
    },
    '然而': {
      p: 'ㄖㄢˊ ㄦˊ',
      k: '그러나, 그렇지만; 앞 기록을 인정하면서 뒤 기록으로 판단을 제한하다',
      ex: '修復舊水道後，水量增加了。然而，這個裝置還沒有恢復正常。',
      rule: '앞 기록을 지우는 말이 아니야. 뒤 기록까지 읽고, 부분적인 결과를 전체 결론으로 넓힌 곳이 없는지 확인해.'
    },
    '果然': {
      p: 'ㄍㄨㄛˇ ㄖㄢˊ',
      k: '과연, 역시; 실제 결과가 앞서 세운 예상과 맞았음을 나타내다',
      ex: '水量增加後，水車果然轉得更快了。',
      rule: '결과가 좋다는 뜻이 아니라 예상과 실제가 맞았다는 표지야. 나쁜 결과도 예상대로라면 果然을 쓸 수 있어.'
    },
    '竟然': {
      p: 'ㄐㄧㄥˋ ㄖㄢˊ',
      k: '뜻밖에도; 실제 결과가 앞서 세운 예상에서 벗어났음을 나타내다',
      ex: '齒輪修復後，水車竟然還是沒有轉動。',
      rule: '결과가 나쁘다는 뜻이 아니라 예상과 실제가 달랐다는 표지야. 좋은 결과도 뜻밖이라면 竟然을 쓸 수 있어.'
    },
    '反而': {
      p: 'ㄈㄢˇ ㄦˊ',
      k: '오히려; 예상한 결과는 생기지 않고 그 대신 다른 결과가 생겼음을 나타내다',
      ex: '水量增加以後，水車沒有轉得更快，反而停了下來。',
      rule: '뜻밖이라는 평가만 붙이는 말이 아니야. 생기지 않은 예상과 그 자리를 대신해 실제로 생긴 결과를 이어 줘.'
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
        id: 'academic-tower-turn-01-que', number: '01', titleKo: '수로 이용 검토',
        titleZh: '卻要重新判斷', expressions: ['卻'], implemented: true, requires: []
      },
      {
        id: 'academic-tower-turn-02-raner', number: '02', titleKo: '장치 복구 검토',
        titleZh: '然而，記錄還沒結束', expressions: ['然而'], implemented: true,
        requires: ['academic-tower-turn-01-que']
      },
      {
        id: 'academic-tower-turn-03-expectation', number: '03', titleKo: '예상과 실제',
        titleZh: '果然，還是竟然？', expressions: ['果然', '竟然'], implemented: true,
        requires: ['academic-tower-turn-01-que']
      },
      {
        id: 'academic-tower-turn-04-faner', number: '04', titleKo: '예상 대신 생긴 결과',
        titleZh: '沒有更快，反而停下來', expressions: ['反而'], implemented: true,
        requires: ['academic-tower-turn-02-raner', 'academic-tower-turn-03-expectation']
      },
      {
        id: 'academic-tower-turn-05-synthesis', number: '05', titleKo: '접속어 복원',
        titleZh: '把褪色的連接詞補回去', expressions: ['卻', '然而', '果然', '竟然', '反而'], implemented: true,
        requires: ['academic-tower-turn-04-faner']
      }
    ]
  };

  const claim = (id, labelKo, feedbackKo) => ({ id, labelKo, feedbackKo });
  const revision = (id, labelKo, feedbackKo, labelZh) => ({ id, labelKo, feedbackKo, labelZh });

  STAGES.push({
    id: 'academic-tower-turn-01-que',
    title: '卻',
    subtitle: '수로 이용 검토',
    kicker: '학술탑 · 방향이 바뀌는 문장 01',
    grid: ['S'],
    goal: '找出記錄沒有支持的判斷，再修正筆記。',
    rule: '두 사실 중 하나를 버리지 말고, 사실에서 너무 빨리 내린 판단만 고쳐.',
    words: ['卻'],
    win: [],
    story: '수로가 짧다는 사실과 비 오는 날의 위험을 함께 남기고, 성급한 이용 판단만 고쳤다.',
    completionTitle: '✓ 두 사실을 살려 메모를 고침',
    completionAction: '이야기 계속',
    academicTower: {
      schemaVersion: 3,
      kind: 'claim-revision',
      cases: [
        {
          id: 'practice', mode: 'guided', scope: 'sentence', connectorZh: '卻',
          questionKo: '비 오는 날 이 수로를 이용할 때, 기록이 뒷받침하지 않는 메모는?',
          draftKo: '검토 초안 · 짧으니 비 오는 날 이용하기 좋다.',
          sources: [
            { id: 'short', text: '這條水道比較短', labelKo: '수로가 더 짧다' },
            { id: 'rain-danger', text: '雨天卻更危險。', labelKo: '비 오는 날에는 더 위험하다', connectorZh: '卻' }
          ],
          claims: [
            claim('fact-short', '이 수로는 더 짧다.', '위험하다는 내용이 수로의 길이를 바꾸지는 않아.'),
            claim('overreach-use', '짧으니 비 오는 날 이용하기 좋다.', '짧다는 사실에서 이용 판단으로 넘어간 부분을 찾았어.'),
            claim('fact-danger', '비 오는 날에는 더 위험하다.', '위험은 기록에 직접 적혀 있어. 앞의 장점과 함께 살펴봐.'),
            claim('supported-both', '이 수로는 더 짧지만, 비 오는 날에는 더 위험하다.', '두 사실을 그대로 합친 문장이야. 고칠 대상은 여기서 더 나아간 이용 판단이야.')
          ],
          repairTargetId: 'overreach-use',
          revisions: [
            revision('keep-both', '짧다는 장점은 있다. 우천 시 위험도 이용 판단에 반영한다.', ''),
            revision('ignore-danger', '짧다는 장점은 있다. 우천 시 위험은 이용 판단에서 제외한다.', '길이의 장점만으로 비 오는 날의 위험을 빼면 안 돼.'),
            revision('cancel-short', '우천 시 더 위험하다. 따라서 수로가 짧다는 기록을 취소한다.', '위험하다고 해서 짧다는 사실까지 틀린 것은 아니야.'),
            revision('overcorrect-ban', '우천 시 더 위험하다. 따라서 비 오는 날에는 이 수로 이용을 전면 금지한다.', '기록은 위험도가 더 높다고 했을 뿐, 이용을 전면 금지하라고 하지는 않아.')
          ],
          correctRevisionId: 'keep-both',
          successFeedbackKo: '짧다는 사실은 남겼고, 그 장점만으로 이용을 결정하는 판단을 고쳤어.',
          connectionKo: '卻 뒤의 위험 기록이 “짧으니 이용하기 좋다”는 추론을 다시 검토하게 했다.'
        },
        {
          id: 'transfer', mode: 'transfer', scope: 'sentence', connectorZh: '卻',
          questionKo: '새 기록의 두 사실을 모두 살린 메모는?',
          draftKo: '새 기록 · 오래된 장치의 현재 상태를 정리하자.',
          sources: [
            { id: 'old', text: '這個裝置很舊', labelKo: '장치가 오래되었다' },
            { id: 'working', text: '卻還能正常運作。', labelKo: '지금도 정상 작동한다', connectorZh: '卻' }
          ],
          revisions: [
            revision('cancel-old', '정상 작동하므로 오래되었다는 기록을 취소한다.', '현재의 작동 상태가 장치의 나이를 바꾸지는 않아.', '裝置運作正常，所以它並不舊。'),
            revision('old-not-working', '오래되었으므로 현재 정상 작동한다는 기록을 취소한다.', '오래되었다는 이유로 확인된 작동 상태를 지우지는 마.', '裝置很舊，所以正常運作的記錄不可信。'),
            revision('old-and-working', '장치는 오래되었다. 그래도 지금은 정상 작동한다.', '', '裝置很舊，目前仍能正常運作。'),
            revision('skip-maintenance', '오래됐지만 정상 작동하므로 점검이나 수리는 필요 없다.', '현재 작동한다는 사실만으로 앞으로의 점검 필요성까지 판단할 수는 없어.', '裝置很舊，但運作正常，以後不必檢查。')
          ],
          correctRevisionId: 'old-and-working',
          successFeedbackKo: '오래되었다는 사실과 현재의 작동 상태를 함께 남겼어.',
          connectionKo: '卻 뒤의 작동 기록이 “오래되면 작동하지 못한다”는 예상을 고치게 했다.'
        }
      ]
    },
    wordContext: {
      '卻': {
        ex: '這條水道比較短，雨天卻更危險。',
        rule: '但是／可是／不過처럼 앞뒤를 대조해. 앞 사실을 취소하기보다, 뒤 사실을 읽고 앞에서 생긴 예상이나 판단을 다시 살펴보게 해.'
      }
    }
  });

  const expectationStage = {
    id: 'academic-tower-turn-03-expectation',
    title: '果然／竟然',
    subtitle: '예상과 실제',
    kicker: '학술탑 · 방향이 바뀌는 문장 03',
    grid: ['S'],
    goal: '比較預想和實際結果，把記錄放到正確的位置。',
    rule: '결과의 좋고 나쁨이 아니라, 앞서 적은 예상과 실제 결과가 같은지 비교해.',
    words: ['果然', '竟然'],
    win: [],
    story: '좋은 결과와 나쁜 결과를 기준으로 삼지 않고, 예상과 실제의 일치 여부로 네 기록을 다시 분류했다.',
    completionTitle: '✓ 예상과 실제의 관계를 분류함',
    completionAction: '연구실로',
    academicTower: {
      schemaVersion: 1,
      kind: 'expectation-sort',
      relations: [
        { id: 'matched', labelKo: '예상대로', labelZh: '果然', hintKo: '예상과 실제가 같다' },
        { id: 'surprising', labelKo: '예상 밖', labelZh: '竟然', hintKo: '예상과 실제가 다르다' }
      ],
      cases: [
        {
          id: 'positive-matched', mode: 'guided', valence: 'positive', relation: 'matched', markerZh: '果然',
          expectationZh: '水量增加了。預計：水車會轉得更快。',
          expectationKo: '수량이 늘었다. 예상: 수차가 더 빨리 돌 것이다.',
          resultZh: '水車果然轉得更快了。', resultKo: '수차가 과연 더 빨리 돌았다.',
          reviewZh: '水車果然轉得更快了。',
          successFeedbackKo: '좋은 결과라서가 아니라, 더 빨라질 것이라는 예상과 실제가 맞았어.',
          wrongFeedbackKo: '예상에도 더 빨라진다고 적혀 있어. 실제 결과와 같은지 다시 비교해 봐.'
        },
        {
          id: 'negative-surprising', mode: 'guided', valence: 'negative', relation: 'surprising', markerZh: '竟然',
          expectationZh: '齒輪修復了。預計：水車會重新轉動。',
          expectationKo: '톱니를 수리했다. 예상: 수차가 다시 움직일 것이다.',
          resultZh: '水車竟然還是沒有轉動。', resultKo: '수차가 뜻밖에도 여전히 움직이지 않았다.',
          reviewZh: '水車竟然還是沒有轉動。',
          successFeedbackKo: '나쁜 결과라서가 아니라, 다시 움직일 것이라는 예상에서 벗어났어.',
          wrongFeedbackKo: '예상은 다시 움직이는 것이었지만 실제로는 움직이지 않았어. 두 기록의 차이를 봐.'
        },
        {
          id: 'negative-matched', mode: 'transfer', valence: 'negative', relation: 'matched', markerZh: '果然',
          expectationZh: '齒輪的裂痕更深了。預計：水車會停下來。',
          expectationKo: '톱니의 균열이 더 깊어졌다. 예상: 수차가 멈출 것이다.',
          resultZh: '水車停了下來。', resultKo: '수차가 멈췄다.',
          reviewZh: '水車果然停了下來。',
          successFeedbackKo: '나쁜 결과여도 예상과 실제가 맞으면 果然이야.',
          wrongFeedbackKo: '멈출 것이라는 예상과 실제로 멈춘 결과가 같아. 결과의 좋고 나쁨은 기준이 아니야.'
        },
        {
          id: 'positive-surprising', mode: 'transfer', valence: 'positive', relation: 'surprising', markerZh: '竟然',
          expectationZh: '舊水道還沒有修復。預計：水量不會恢復正常。',
          expectationKo: '옛 수로는 아직 수리되지 않았다. 예상: 수량이 정상으로 돌아오지 않을 것이다.',
          resultZh: '水量恢復正常了。', resultKo: '수량이 정상으로 돌아왔다.',
          reviewZh: '水量竟然恢復正常了。',
          successFeedbackKo: '좋은 결과여도 예상에서 벗어나면 竟然이야.',
          wrongFeedbackKo: '예상은 정상으로 돌아오지 않는 것이었지만 실제 수량은 회복됐어. 방향이 달라.'
        }
      ]
    },
    wordContext: {
      '果然': {
        ex: '水車果然停了下來。',
        rule: '긍정적인 결과가 아니라 예상과 실제의 일치를 표시해. 예상한 나쁜 결과가 그대로 생겨도 果然을 쓸 수 있어.'
      },
      '竟然': {
        ex: '水量竟然恢復正常了。',
        rule: '부정적인 결과가 아니라 예상과 실제의 불일치를 표시해. 뜻밖의 좋은 결과에도 竟然을 쓸 수 있어.'
      }
    }
  };

  STAGES.push({
    id: 'academic-tower-turn-02-raner',
    title: '然而',
    subtitle: '장치 복구 검토',
    kicker: '학술탑 · 방향이 바뀌는 문장 02',
    grid: ['S'],
    goal: '讀完兩份記錄，修正證據不足的報告。',
    rule: '부분적인 결과와 장치 전체의 상태를 구별해 복구 보고를 고쳐.',
    words: ['然而'],
    win: [],
    story: '수량이 늘어난 부분 성과와 아직 정상은 아닌 장치 상태를 함께 남겨 복구 보고를 고쳤다.',
    completionTitle: '✓ 두 기록을 살려 보고를 고침',
    completionAction: '연구실로',
    academicTower: {
      schemaVersion: 3,
      kind: 'claim-revision',
      cases: [
        {
          id: 'practice', mode: 'guided', scope: 'records', connectorZh: '然而',
          questionKo: '두 기록을 함께 읽으면, 복구 보고의 어느 주장을 고쳐야 할까?',
          draftKo: '복구 초안 · 수량이 늘었으니 장치 전체도 정상으로 돌아왔다.',
          sources: [
            { id: 'water-increased', text: '修復舊水道後，水量增加了。', labelKo: '수로 수리 뒤 수량이 늘었다' },
            { id: 'device-not-restored', text: '然而，這個裝置還沒有恢復正常。', labelKo: '장치는 아직 정상으로 돌아오지 않았다', connectorZh: '然而' }
          ],
          claims: [
            claim('fact-increased', '수로를 수리한 뒤 수량이 늘었다.', '장치에 이상이 남아도 수량 증가 기록은 사라지지 않아.'),
            claim('fact-not-restored', '장치는 아직 정상으로 돌아오지 않았다.', '수량이 늘었다는 사실만으로 점검 결과를 취소할 수 없어.'),
            claim('overreach-restored', '수량이 늘었으니 장치 전체도 정상으로 돌아왔다.', '수량의 변화로 장치 전체를 판단한 부분을 찾았어.'),
            claim('supported-both', '수량은 늘었지만, 장치 전체는 아직 정상으로 돌아오지 않았다.', '두 기록을 그대로 합친 판단이야. 고칠 곳은 부분 개선을 전체 회복으로 넓힌 주장이야.')
          ],
          repairTargetId: 'overreach-restored',
          revisions: [
            revision('cancel-improvement', '장치는 아직 정상 아님. 따라서 수량 증가 기록도 취소한다.', '전체가 정상은 아니어도 일부 개선은 있을 수 있어.'),
            revision('keep-both', '수량은 늘었다. 장치 전체는 아직 정상으로 돌아오지 않았다.', ''),
            revision('restore-all', '수량은 늘었다. 따라서 장치 전체도 정상으로 처리한다.', '수량의 개선과 장치 전체의 정상 여부는 같은 판단이 아니야.'),
            revision('predict-decline', '장치는 아직 정상이 아니다. 따라서 늘어난 수량도 곧 다시 줄 것이다.', '현재 기록만으로 앞으로 수량이 다시 줄 것이라고 예측할 수는 없어.')
          ],
          correctRevisionId: 'keep-both',
          successFeedbackKo: '수량의 개선은 남기고, 장치 전체가 정상이라는 판단을 고쳤어.',
          connectionKo: '然而 뒤의 점검 기록이 “부분 개선이면 전체도 정상”이라는 추론을 제한했다.'
        },
        {
          id: 'transfer', mode: 'transfer', scope: 'records', connectorZh: '然而',
          questionKo: '새 기록 두 장을 함께 반영한 메모는?',
          draftKo: '새 기록 · 미수리 상태와 현재 수량을 함께 정리하자.',
          sources: [
            { id: 'not-repaired', text: '舊水道還沒有修復。工匠先看了水量，再調整裝置。', labelKo: '옛 수로는 아직 수리되지 않았다. 장인은 수량을 살피고 장치를 조정했다' },
            { id: 'water-restored', text: '然而，調整裝置以後，水量已經恢復正常。', labelKo: '장치 조정 뒤 수량은 정상으로 돌아왔다', connectorZh: '然而' }
          ],
          revisions: [
            revision('assume-repaired', '수량이 정상이므로 옛 수로도 수리 완료로 처리한다.', '수량 회복이 옛 수로의 수리 완료를 뜻하지는 않아.', '水量正常，表示舊水道也已修復。'),
            revision('keep-both', '옛 수로는 아직 미수리 상태다. 장치 조정 뒤 수량은 정상이다.', '', '舊水道尚未修復，調整裝置後水量已正常。'),
            revision('deny-water', '옛 수로가 미수리 상태이므로 수량 회복 기록을 취소한다.', '옛 수로 상태만으로 장치 조정 뒤의 수량을 부정할 수 없어.', '水道未修復，水量恢復的記錄一定有錯。'),
            revision('skip-repair', '수량이 정상으로 돌아왔으므로 옛 수로는 더 수리할 필요가 없다.', '현재 수량만으로 미수리 수로의 정비 필요성까지 판단할 수는 없어.', '水量正常，以後不必修復舊水道。')
          ],
          correctRevisionId: 'keep-both',
          successFeedbackKo: '미수리 상태와 수량 회복을 함께 남겼어. 앞 기록만으로 뒤 결과를 지우지 않았어.',
          connectionKo: '然而 뒤의 수량 기록이 “미수리면 수량도 정상일 수 없다”는 예상을 고치게 했다.'
        }
      ]
    },
    wordContext: {
      '然而': {
        ex: '修復舊水道後，水量增加了。然而，這個裝置還沒有恢復正常。',
        rule: '앞 기록을 틀렸다고 지우지 않아. 뒤 기록을 연결해, 앞 기록만으로 넓혀 버린 전체 판단을 다시 제한해.'
      }
    }
  });

  STAGES.push(expectationStage);

  const replacementStage = {
    id: 'academic-tower-turn-04-faner',
    title: '反而',
    subtitle: '예상 대신 생긴 결과',
    kicker: '학술탑 · 방향이 바뀌는 문장 04',
    grid: ['S'],
    goal: '找出沒有發生的預想和實際結果，再把它們連起來。',
    rule: '단순히 놀라운 결과를 찾는 데서 멈추지 말고, 생기지 않은 예상과 그 자리를 대신한 실제 결과를 함께 남겨.',
    words: ['反而'],
    win: [],
    story: '생기지 않은 예상과 그 대신 생긴 실제 결과를 함께 남겨 두 기록을 고쳤다.',
    completionTitle: '✓ 예상과 대체 결과를 연결함',
    completionAction: '이야기 계속',
    academicTower: {
      schemaVersion: 2,
      kind: 'replacement-link',
      correctLinkId: 'faner',
      linkOptions: [
        { id: 'que', labelZh: '卻', feedbackKo: '대조하는 문장으로는 가능해. 이번 기록에서는 대조에 더해, 기대한 효과 대신 생긴 결과를 강조하려고 해.' },
        { id: 'raner', labelZh: '然而', feedbackKo: '앞뒤를 전환하는 문장으로는 가능해. 이번에는 기대한 효과 대신 생긴 결과를 강조해 남겨 보자.' },
        { id: 'jingran', labelZh: '竟然', feedbackKo: '실제 결과가 뜻밖이라는 평가는 붙였어. 이제 생기지 않은 예상과 그 대신 나타난 결과를 직접 이어야 해.' },
        { id: 'faner', labelZh: '反而', feedbackKo: '' }
      ],
      cases: [
        {
          id: 'water-increased', mode: 'guided',
          expectationZh: '水量增加了。預計：水車會轉得更快。',
          actualZh: '水車停了下來。',
          absentResultId: 'faster', actualResultId: 'stopped',
          completedZh: '水量增加以後，水車沒有轉得更快，反而停了下來。',
          cards: [
            { id: 'faster', sourceZh: '轉得更快', textZh: '轉得更快', absentFeedbackKo: '', actualFeedbackKo: '이것은 기록에 적힌 예상이야. 실제로 생긴 결과를 골라.' },
            { id: 'stopped', sourceZh: '停了下來', textZh: '停了下來', absentFeedbackKo: '이것은 실제로 생긴 결과야. 생기지 않은 예상을 골라.', actualFeedbackKo: '' },
            { id: 'more-water', sourceZh: '水量增加', textZh: '水量增加', absentFeedbackKo: '이것은 예상 결과가 아니라 먼저 확인된 조건이야.', actualFeedbackKo: '이것은 뒤에 생긴 결과가 아니라 먼저 확인된 조건이야.' },
            { id: 'destroyed', textZh: '裝置完全損壞', absentFeedbackKo: '기록에 없던 결과야. 적힌 예상 가운데 생기지 않은 것을 찾아.', actualFeedbackKo: '기록은 멈췄다고만 했어. 완전히 망가졌다고 넓히지 마.' }
          ],
          successFeedbackKo: '더 빨라질 것이라는 예상은 생기지 않았고, 그 대신 멈추는 결과가 나타났어.'
        },
        {
          id: 'water-decreased', mode: 'transfer',
          expectationZh: '水量減少了。預計：水車會停下來。',
          actualZh: '水車恢復了正常。',
          absentResultId: 'stop', actualResultId: 'normal',
          completedZh: '水量減少以後，水車沒有停下來，反而恢復了正常。',
          cards: [
            { id: 'stop', sourceZh: '停下來', textZh: '停下來', absentFeedbackKo: '', actualFeedbackKo: '이것은 기록에 적힌 예상이야. 실제 결과는 다른 곳에 있어.' },
            { id: 'normal', sourceZh: '恢復了正常', textZh: '恢復正常', absentFeedbackKo: '이것은 실제로 생긴 결과야. 생기지 않은 예상을 먼저 찾아.', actualFeedbackKo: '' },
            { id: 'less-water', sourceZh: '水量減少', textZh: '水量減少', absentFeedbackKo: '이것은 예상 결과가 아니라 먼저 확인된 조건이야.', actualFeedbackKo: '이것은 뒤에 생긴 결과가 아니라 먼저 확인된 조건이야.' },
            { id: 'all-repaired', textZh: '所有水道都修復', absentFeedbackKo: '기록에 없던 결과야. 적힌 예상 가운데 생기지 않은 것을 찾아.', actualFeedbackKo: '수차가 정상으로 돌아왔다고 모든 수로가 수리된 것은 아니야.' }
          ],
          successFeedbackKo: '멈출 것이라는 예상은 생기지 않았고, 정상으로 돌아온 결과가 그 자리를 대신했어.'
        }
      ]
    },
    wordContext: {
      '反而': {
        ex: '水量增加以後，水車沒有轉得更快，反而停了下來。',
        rule: '竟然처럼 결과를 뜻밖이라고 평가하는 데서 멈추지 않아. 생기지 않은 예상과 그 대신 나타난 실제 결과를 연결해.'
      }
    }
  };

  const synthesisStage = {
    id: 'academic-tower-turn-05-synthesis',
    title: '接續詞',
    subtitle: '접속어 복원',
    kicker: '학술탑 · 방향이 바뀌는 문장 05',
    grid: ['S'],
    goal: '讀完整句子，選回褪色的連接詞。',
    rule: '빈칸만 보지 말고 앞뒤 문장을 끝까지 읽어. 순서·결과·덧붙임과 예상·대조·대체 관계를 구별해.',
    words: ['卻', '然而', '果然', '竟然', '反而'],
    win: [],
    story: '기록의 관계를 복원하고, 적정 수량은 아직 확정할 수 없다는 주의사항을 전달용 사본에 남겼다.',
    completionTitle: '✓ 기록과 전달할 판단을 정리함',
    completionAction: '이야기 계속',
    academicTower: {
      schemaVersion: 2,
      kind: 'connector-cloze',
      connectorFeedback: {
        '卻': '한 문장 안의 예상과 다른 사실을 대조하는 말이야. 지금 빈칸이 요구하는 관계와 범위를 다시 봐.',
        '然而': '앞 기록을 인정하면서 뒤 기록으로 판단을 제한하는 말이야. 지금은 기록 사이의 전환이 필요한지 확인해.',
        '果然': '실제 결과가 앞선 예상과 맞았다는 표지야. 예상과 실제가 같은지 먼저 비교해.',
        '竟然': '실제 결과가 예상 밖이라는 평가를 붙이는 말이야. 예상에서 벗어났는지 먼저 비교해.',
        '反而': '예상한 결과 대신 다른 결과가 생겼음을 잇는 말이야. 사라진 예상과 대체 결과가 모두 있는지 살펴봐.',
        '然後': '앞뒤를 시간 순서로 잇는 말이야. 시간 순서만으로 이 문장의 관계가 남는지 다시 봐.',
        '所以': '뒤 내용을 앞 내용의 결과로 잇는 말이야. 단순한 원인과 결과를 말하는 자리인지 다시 봐.',
        '而且': '같은 방향의 정보를 하나 더 보태는 말이야. 앞뒤가 같은 방향으로 쌓이는지 다시 봐.'
      },
      blanks: [
        {
          id: 'r1', sectionKo: '기록 1',
          contextZh: '研究員先前預計：「增加水量後，水車會轉得更快。」',
          beforeZh: '第一次增加水量後，水車', afterZh: '轉得更快。',
          correctConnectorId: '果然', options: ['果然', '竟然', '然後', '所以'],
          successFeedbackKo: '더 빨라질 것이라는 예상과 실제 결과가 같아서 果然이야.'
        },
        {
          id: 'r2-a', sectionKo: '기록 2 · 첫 문장',
          questionKo: '놀라움의 평가를 덧붙이지 않고, 예상과 다른 사실을 대조하려면?',
          contextZh: '第二次增加水量前，研究員仍預計水車會轉得更快。',
          beforeZh: '第二次增加水量後，水車', afterZh: '沒有轉得更快。',
          correctConnectorId: '卻', options: ['卻', '竟然', '所以', '而且'],
          successFeedbackKo: '한 문장 안에서 앞선 예상과 다른 사실을 卻로 대조했어.'
        },
        {
          id: 'r2-b', sectionKo: '기록 2 · 둘째 문장',
          contextZh: '記錄旁寫著：「沒想到會完全停下來。」',
          beforeZh: '水車', afterZh: '完全停了下來。',
          correctConnectorId: '竟然', options: ['竟然', '果然', '然後', '所以'],
          successFeedbackKo: '완전히 멈춘 실제 결과가 예상 밖이어서 竟然이야.'
        },
        {
          id: 'r3-a', sectionKo: '기록 3 · 첫 문장',
          contextZh: '',
          beforeZh: '增加水量通常能讓水車轉得更快。', afterZh: '，這次增加水量沒有幫助。',
          questionKo: '앞의 일반적인 효과와 이번 기록을 문장 사이에서 대조하려면?',
          correctConnectorId: '然而', options: ['然而', '果然', '所以', '而且'],
          successFeedbackKo: '앞의 일반 기록을 인정하면서 이번 기록으로 판단을 제한해 然而가 맞아.'
        },
        {
          id: 'r3-b', sectionKo: '기록 3 · 둘째 문장',
          contextZh: '原本希望水車轉得更快。',
          questionKo: '피해를 추가로 나열하기보다, 기대한 효과 대신 손상이 생겼음을 강조하려면?',
          beforeZh: '這次增加水量沒有幫助，', afterZh: '使另一個齒輪損壞。',
          correctConnectorId: '反而', options: ['反而', '竟然', '所以', '而且'],
          optionFeedback: {
            '而且': '추가 피해를 나열하는 문장으로는 가능해. 이번에는 기대한 효과와 반대로 생긴 결과를 강조하려고 해.',
            '竟然': '뜻밖이라는 평가도 가능해. 이번 기록의 목적은 예상했던 효과 대신 손상이 생겼다는 관계를 남기는 거야.'
          },
          successFeedbackKo: '도움이 되지 않았을 뿐 아니라 그 대신 손상이라는 결과가 생겨 反而야.'
        },
        {
          id: 's-a', sectionKo: '안전 기록 · 첫 빈칸',
          contextZh: '舊圖旁另有警語：「水量超過安全範圍，裝置可能損壞。」但圖上的水量刻度已經模糊。',
          questionKo: '앞의 효과를 인정하면서 뒤의 주의사항으로 전환하려면?',
          beforeZh: '雖然增加水量可以讓水流更快，', afterZh: '如果水量超過安全範圍，',
          tailZh: '剛修復的裝置也可能損壞。',
          correctConnectorId: '然而', options: ['然而', '竟然', '所以', '而且'],
          successFeedbackKo: '앞의 효과를 인정한 뒤 안전 조건으로 판단을 제한해 然而가 맞아.'
        },
        {
          id: 's-b', sectionKo: '안전 기록 · 둘째 빈칸',
          questionKo: '효과를 기대한 조작이 손상을 부를 수 있다는 역전을 강조하려면?',
          contextZh: '雖然增加水量可以讓水流更快，然而如果水量超過安全範圍，',
          beforeZh: '剛修復的裝置', afterZh: '可能損壞。',
          correctConnectorId: '反而', options: ['反而', '果然', '然後', '所以'],
          successFeedbackKo: '더 빨라질 것이라는 기대 대신 손상이 생길 수 있어 反而가 맞아.'
        },
        {
          id: 'dispatch', kind: 'decision', sectionKo: '전달할 판단',
          contextZh: '同一座水車在不同日期有不同結果。舊圖提醒不可超過安全範圍，但水量刻度已經模糊。',
          promptZh: '現在可以把哪一項判斷送到工坊？',
          questionKo: '관찰된 사실을 지키고, 아직 모르는 범위는 확정하지 않는 판단은?',
          correctConnectorId: '不能只憑這些記錄決定水量，還要確認裝置的情況。',
          options: [
            '不能只憑這些記錄決定水量，還要確認裝置的情況。',
            '第一次增加水量有效，以後也應該繼續增加。',
            '增加水量曾造成損壞，以後一律減少就安全。',
            '已經知道確切的安全水量，不用再檢查。'
          ],
          optionFeedback: {
            '第一次增加水量有效，以後也應該繼續增加。': '첫 기록의 효과를 다른 시기와 장치 상태까지 넓힌 판단이야. 뒤 기록도 함께 봐.',
            '增加水量曾造成損壞，以後一律減少就安全。': '증가가 위험했던 사례만으로 항상 감소가 안전하다고 할 수는 없어.',
            '已經知道確切的安全水量，不用再檢查。': '주의사항은 남았지만 눈금은 흐려졌어. 정확한 적정량은 아직 확인하지 못했어.'
          },
          successFeedbackKo: '무조건 늘리거나 줄이지 않고 장치 상태와 적정량을 확인해야 한다는 주의사항을 남겼어.'
        }
      ]
    }
  };

  STAGES.push(replacementStage);
  STAGES.push(synthesisStage);

  globalThis.AcademicTowerContent = Object.freeze({
    bundle: Object.freeze({ ...bundle, rooms: Object.freeze(bundle.rooms.map(room => Object.freeze(room))) })
  });
})();
