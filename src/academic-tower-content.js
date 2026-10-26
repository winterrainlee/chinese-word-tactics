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
          resultZh: '水車轉得更快了。', resultKo: '수차가 더 빨리 돌았다.',
          reviewZh: '水車果然轉得更快了。',
          successFeedbackKo: '좋은 결과라서가 아니라, 더 빨라질 것이라는 예상과 실제가 맞았어.',
          wrongFeedbackKo: '예상에도 더 빨라진다고 적혀 있어. 실제 결과와 같은지 다시 비교해 봐.'
        },
        {
          id: 'negative-surprising', mode: 'guided', valence: 'negative', relation: 'surprising', markerZh: '竟然',
          expectationZh: '齒輪修復了。預計：水車會重新轉動。',
          expectationKo: '톱니를 수리했다. 예상: 수차가 다시 움직일 것이다.',
          resultZh: '水車還是沒有轉動。', resultKo: '수차가 여전히 움직이지 않았다.',
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
          draftParts: [
            { claimId: 'fact-increased', text: '수로를 수리한 뒤 수량이 늘었다.' },
            { claimId: 'overreach-restored', text: '그러므로 장치 전체도 정상으로 돌아왔다.' }
          ],
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
          id: 'water-decreased', mode: 'infer-expectation',
          inferenceZh:'水量減少以後，水車反而恢復了正常。',
          inferenceKo:'물을 줄인 뒤 수차는 오히려 정상으로 돌아왔다.',
          expectationOptions:[
            {id:'stop',text:'물을 줄이면 수차가 멈출 것이다',feedback:''},
            {id:'normal',text:'물을 줄이면 수차가 정상으로 돌아올 것이다',feedback:'그렇게 예상했다면 실제 결과가 예상대로 나온 셈이야. 反而가 나타내는 어긋남을 다시 읽어 봐.'},
            {id:'unknown',text:'수차가 어떻게 될지 아무 예상도 없었다',feedback:'反而는 실제 결과가 앞서 생각한 방향과 어긋남을 나타내. 정상으로 돌아온 결과와 대비되는 예상을 찾아봐.'}
          ],
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

  Object.assign(WORDS, {
    '既然': { p: 'ㄐㄧˋ ㄖㄢˊ', k: '이미 그러한 이상; 확인된 상황을 뒤 판단의 전제로 삼다', ex: '既然已經確認齒輪損壞，就先修復它。', rule: '아직 모르는 조건이 아니라 이미 성립한 사실에서 다음 판단을 시작해.' },
    '不然': { p: 'ㄅㄨˋ ㄖㄢˊ', k: '그렇지 않으면; 앞 행동을 하지 않을 경우의 귀결을 잇다', ex: '先把記錄綁好，不然紙張會散開。', rule: '앞 행동 다음에 일어난다는 순서가 아니라, 그렇게 하지 않을 경우를 읽어.' }
  });
  bundle.rooms.push({ id: 'academic-tower-turn-03a-ran-family', number: '03A', titleKo: '색인 옆의 메모', titleZh: '索引旁的筆記', expressions: [], implemented: true, optional: true, sideGroup: 'branch', requires: ['academic-tower-turn-02-raner', 'academic-tower-turn-03-expectation'] });
  STAGES.push({
    id: 'academic-tower-turn-03a-ran-family', title: '색인 옆의 메모', subtitle: '색인 옆의 메모', kicker: '학술탑 · 선택 연구 03A',
    grid: ['S'], goal: '比較字形和句子的關係。', rule: '같은 글자가 보여도 문장 속 역할은 따로 읽어.', words: ['既然', '不然'], win: [],
    story: '일곱 표현의 문장 관계를 비교하고, 확인된 손상과 흩어질 기록에 맞는 두 문장을 완성했다.', completionTitle: '✓ 같은 흔적, 다른 쓰임', completionAction: '관찰 메모 남기기',
    academicTower: {
      kind: 'ran-observation', schemaVersion: 1, noticeWords: ['然而', '果然', '竟然'],
      cards: [
        { word: '然而', sentence: '水量增加了。然而，裝置還沒有恢復正常。', position: 'first', relation: '앞 성과와 뒤 상태의 대조', options: ['앞 성과와 뒤 상태의 대조', '두 행동의 순서', '확인된 사실을 전제로 판단'], sense: '然의 그러함 + 而의 이어 전환하는 감각', explanation: '수량 증가를 취소하지 않고 장치 상태를 함께 읽는다.', compareWord: '卻', compareKo: '둘 다 앞뒤를 대조하지만, 卻는 한 문장 안에서 예상과 다른 사실을 밀어 넣고, 然而는 앞 기록을 인정한 채 뒤 기록으로 판단을 제한한다.' },
        { word: '果然', sentence: '原先預計水車會停。水車果然停了。', position: 'last', relation: '예상과 실제의 일치', options: ['예상과 실제의 일치', '예상과 실제의 불일치', '하지 않았을 경우의 귀결'], sense: '果의 과연·실제로라는 감각 + 然의 그러함', explanation: '멈춘 것이 좋은지 나쁜지가 아니라 예상과 맞는지를 본다.', compareWord: '竟然', compareKo: '둘 다 예상과 실제를 비교한다. 果然은 둘이 맞을 때, 竟然은 어긋날 때 쓴다.' },
        { word: '竟然', sentence: '原先預計水車會停。水車竟然恢復正常了。', position: 'last', relation: '예상과 실제의 불일치', options: ['예상과 실제의 일치', '예상과 실제의 불일치', '두 행동의 순서'], sense: '竟의 뜻밖의 귀결 감각 + 然의 그러함', explanation: '회복은 좋은 결과지만 멈추리라는 예상과는 다르다.', compareWord: '果然', compareKo: '둘 다 예상과 실제를 비교한다. 竟然은 둘이 어긋날 때, 果然은 맞을 때 쓴다.' },
        { word: '然後', sentence: '先檢查裝置，然後調整水量。', position: 'first', relation: '두 행동의 순서', options: ['두 행동의 순서', '하지 않았을 경우의 귀결', '앞 사실을 인정하는 양보'], sense: '然의 그렇게 + 後의 뒤라는 감각', explanation: '점검한 다음 수량을 조절한다.', compareWord: '果然／竟然', compareKo: '果然·竟然은 예상과 실제의 관계를 표시하지만, 然後는 두 사건의 순서만 잇는다.' },
        { word: '雖然', sentence: '雖然水道比較短，雨天卻更危險。', position: 'last', relation: '앞 사실을 인정하는 양보', options: ['앞 사실을 인정하는 양보', '두 행동의 순서', '예상과 실제의 일치'], sense: '雖의 비록 + 然의 그러함', explanation: '짧다는 사실을 인정하면서 비 오는 날의 위험을 남긴다.', compareWord: '卻', compareKo: '雖然은 앞 사실을 먼저 인정해 양보를 열고, 卻는 뒤에서 그와 어긋나는 사실을 제시한다. 둘은 한 문장에서 함께 쓰이기도 한다.' },
        { word: '既然', sentence: '既然已經確認齒輪損壞，就先修復它。', position: 'last', relation: '확인된 사실을 전제로 판단', options: ['확인된 사실을 전제로 판단', '아직 모르는 조건의 가정', '두 행동의 순서'], sense: '既의 이미 + 然의 그러함', explanation: '손상이 확인되었으므로 수리를 먼저 한다.', compareWord: '果然', compareKo: '둘 다 이미 드러난 사실과 닿아 있지만, 果然은 예상이 실제로 맞았음을 확인하고, 既然은 확인된 사실을 다음 판단의 전제로 삼는다.' },
        { word: '不然', sentence: '先把鬆開的記錄綁好，不然紙張會散開。', position: 'last', relation: '하지 않았을 경우의 귀결', options: ['하지 않았을 경우의 귀결', '두 행동의 순서', '예상과 실제의 일치'], sense: '不의 아니다 + 然의 그러함', explanation: '묶은 뒤 흩어진다는 말이 아니라, 묶지 않으면 흩어진다는 경고다.', compareWord: '然而', compareKo: '然而는 이미 있는 앞뒤 사실을 대조하지만, 不然은 앞 행동을 하지 않았을 경우의 결과를 이어 준다.' }
      ],
      applications: [
        { id: 'premise', context: '損壞已經確認，不是假設。', before: '', after: '齒輪損壞，就先修復。', options: ['既然', '如果'], correct: '既然', feedback: '如果도 문법적으로 가능하지만, 이미 확인한 사실을 아직 모르는 조건으로 바꾸게 돼.' },
        { id: 'alternative', context: '沒有綁好的紙張可能散開。', before: '先綁好，', after: '紙張會散開。', options: ['不然', '然後'], correct: '不然', feedback: '然後를 넣으면 묶은 다음 종이가 흩어진다는 순서가 돼. 원문은 묶지 않을 경우를 경고해.' }
      ]
    }
  });

  // Rebuild R1: stable source IDs are the selectable objects, never answer positions.
  const room = suffix => STAGES.find(stage => stage.id === `academic-tower-turn-${suffix}`).academicTower;
  room('01-que').legacyCasesEquivalent=false;
  room('01-que').tasks = room('01-que').cases.map((item,index) => ({
    id:item.id, word:'卻',
    sources:item.sources.map(source=>({id:source.id,text:source.text})),
    translation:item.sources.map(source=>source.labelKo).join(' / '),
    slots:[], answer:{},
    ...(index===0 ? {
      title:'卻는 두 사실을 어떻게 이어 줄까?',
      relations:[
        {id:'cause',text:'수로가 짧아서 비 오는 날 더 위험하다'},
        {id:'contrast',text:'수로가 짧은데도 비 오는 날 더 위험하다'},
        {id:'sequence',text:'수로가 짧아진 다음 비 오는 날 더 위험해졌다'}
      ], relation:'contrast',confirmLabel:'관계 확인',
      success:'짧으면 이용하기 좋겠다고 기대할 수 있지만, 비 오는 날에는 더 위험하대. 卻는 그 기대와 어긋나는 사실을 이어 줘.',
      wrong:{cause:'원문은 짧기 때문에 위험하다고 설명하지 않아. 짧다는 장점에서 생긴 기대와 뒤의 위험을 비교해 봐.',sequence:'원문은 수로가 짧아진 뒤 위험해졌다는 시간 순서가 아니야. 짧다는 장점과 어긋나는 위험을 이어 주고 있어.'}
    } : {
      title:'오래된 장치에 대한 메모에서 고칠 부분은?',
      targets:[{id:'age',text:'장치는 오래됐다.'},{id:'assumption',text:'그러니 지금은 정상 작동하지 못할 것이다.'}],
      slots:[{id:'to',label:'고칠 판단'}],answer:{to:'assumption'},directSlot:'to',
      confirmLabel:'메모 고치기',workLabel:'내 점검 메모',
      correction:'장치는 오래됐지만 지금도 정상으로 작동한다.',
      success:'卻 뒤의 정상 작동은 “오래됐으니 작동하지 못할 것”이라는 예상과 어긋나. 장치의 나이가 아니라 그 예상을 고쳤어.',
      slotFeedback:{to:'오래됐다는 사실은 기록에도 있어. 卻 뒤의 작동 상태와 맞지 않는 판단을 찾아봐.'}
    })
  }));
  room('03-expectation').tasks = room('03-expectation').cases.map(item => ({
    id:item.id, title:'예상과 실제를 각각 짚고 이어 보자.',
    sources:[{id:'expectation',text:item.expectationZh},{id:'actual',text:item.resultZh}],
    translation: `${item.expectationKo} ${item.resultKo}`,
    slots:[{id:'from',label:'어떻게 될 거라고 봤어?',style:'expected'}, {id:'to',label:'실제로는 어떻게 됐어?',style:'actual'}],
    answer:{from:'expectation',to:'actual'},
    relations:[{id:'matched',text:'果然',label:'예상과 같아'}, {id:'surprising',text:'竟然',label:'예상과 달라'}],
    relation:item.relation, success:item.successFeedbackKo, memo:item.reviewZh,
    wrong:{matched:item.wrongFeedbackKo,surprising:item.wrongFeedbackKo}
  }));

  // R2: attach a later inspection to the exact inference it changes.
  room('02-raner').tasks = room('02-raner').cases.map(item => ({
    id:item.id, title:'뒤 기록을 보고, 내 보고에서 고칠 판단에 붙여 보자.',
    sources:item.sources.map(source => ({id:source.id,text:source.text})),
    translation:item.sources.map(source => source.labelKo).join(' / '),
    targets:item.id==='practice' ? [
      {id:'water-fact',text:'수로를 수리한 뒤 수량이 늘었다.'},
      {id:'whole-judgment',text:'그러므로 장치 전체도 정상으로 돌아왔다.'}
    ] : [
      {id:'repair-fact',text:'옛 수로는 아직 수리되지 않았다.'},
      {id:'water-judgment',text:'그러니 지금 수량도 정상일 수 없다.'},
      {id:'future-judgment',text:'앞으로 수로를 더 수리할 필요는 없다.'}
    ],
    slots:[{id:'from',label:'판단을 바꾸게 한 기록'}, {id:'to',label:'내 보고에서 고칠 부분'}],
    answer:{from:item.sources[1].id,to:item.id==='practice' ? 'whole-judgment' : 'water-judgment'},
    word:'然而', memo:item.revisions.find(r=>r.id===item.correctRevisionId).labelKo,
    success:item.successFeedbackKo,
    slotFeedback:{from:'뒤 점검 결과까지 읽어 봐. 앞 기록도 원본에 그대로 남겨 두자.',to:'기록에 직접 적힌 사실을 취소하거나 앞으로의 정비까지 확정하지 마. 뒤 기록과 맞지 않는 현재 판단을 찾아보자.'}
  }));

  // R3: discover the shared character, then operate on each sentence's scope.
  const ran=room('03a-ran-family');
  const observed = (id,word,left,right,leftLabel,rightLabel,extra={}) => ({
    id,word,title:'표현을 읽고, 앞뒤 구절을 이어 보자.',
    sources:[{id:'before',text:left},{id:'after',text:right}],
    slots:[{id:'from',label:leftLabel},{id:'to',label:rightLabel}],
    answer:{from:'before',to:'after'}, ...extra
  });
  ran.tasks=[
    observed('observe-raner','然而','水量增加了。','然而，裝置還沒有恢復正常。','앞에서 확인한 사실','함께 남길 뒤 사실'),
    observed('observe-guoran','果然','原先預計水車會停。','水車果然停了。','어떻게 될 거라고 봤어?','실제로는 어떻게 됐어?',{slots:[{id:'from',label:'어떻게 될 거라고 봤어?',style:'expected'},{id:'to',label:'실제로는 어떻게 됐어?',style:'actual'}],linkText:'果然 · 예상과 실제를 함께 읽어 봐.'}),
    observed('observe-jingran','竟然','原先預計水車會停。','水車竟然恢復正常了。','어떻게 될 거라고 봤어?','실제로는 어떻게 됐어?',{slots:[{id:'from',label:'어떻게 될 거라고 봤어?',style:'expected'},{id:'to',label:'실제로는 어떻게 됐어?',style:'actual'}],linkText:'竟然 · 예상과 실제를 함께 읽어 봐.'}),
    observed('observe-ranhou','然後','先檢查裝置，','然後調整水量。','먼저 할 일','그다음에 할 일',{linkText:'然後 →'}),
    observed('observe-suiran','雖然','雖然水道比較短，','雨天卻更危險。','그대로 인정할 앞 사실','함께 읽어야 할 뒤 사실',{linkText:'雖然 … 卻 …'}),
    observed('observe-jiran','既然','既然已經確認齒輪損壞，','就先修復它。','받아들이고 출발할 사실','그 사실에서 이어지는 판단',{linkText:'既然 … 就 …'}),
    observed('observe-buran','不然','先把鬆開的記錄綁好，','不然紙張會散開。','앞에서 권한 행동','이 결과는 언제 생길까?',{
      relations:[{id:'not-done',text:'앞 행동을 하지 않으면'}, {id:'after-done',text:'앞 행동을 하고 나면'}],relation:'not-done',
      slots:[{id:'from',label:'앞에서 권한 행동'},{id:'to',label:'이 결과는 언제 생길까?',style:'possible'}],
      wrong:{'after-done':'묶은 다음 종이가 흩어진다는 순서가 아니야. 不然은 묶지 않았을 경우를 이어 줘.'}})
  ];
  ran.tasks.forEach((task,i)=>{const card=ran.cards[i]; task.success=card.explanation;task.memo=card.compareKo;task.translation=card.explanation;});
  ran.tasks.push(
    observed('apply-premise','既然','既然齒輪損壞，','就先修復。','판단의 출발점으로 삼은 사실','이어서 할 일',{
      context:'損壞已經確認，不是假設。',success:'손상을 받아들이고 수리 판단을 이었어.',
      memo:'既然은 받아들인 사실에서 판단을 시작해. 如果는 조건으로 제시하는 표현이야. 같은 사실도 조건으로 말할 수 있어.'}),
    observed('apply-alternative','不然','先綁好，','不然紙張會散開。','앞에서 권한 행동','이어지는 결과',{
      relations:[{id:'not-done',text:'묶지 않으면'}, {id:'after-done',text:'묶고 나면'}],relation:'not-done',
      slots:[{id:'from',label:'앞에서 권한 행동'},{id:'to',label:'이어지는 결과',style:'possible'}],
      success:'묶지 않았을 경우에 종이가 흩어진다는 경고를 붙였어.',wrong:{'after-done':'然後처럼 묶은 뒤의 일을 말하는 게 아니야. 묶지 않을 경우를 다시 읽어 봐.'}})
  );
  WORDS['既然'].rule='발화에서 받아들인 전제에서 다음 판단을 시작해. 如果는 조건으로 제시하며, 반드시 모르는 사실만 말하는 것은 아니야.';
  ran.applications[0].feedback='如果도 문법적으로 가능해. 여기서는 손상을 받아들인 전제로 삼아 다음 판단을 잇는 既然을 연습해.';

  // R4: preserve all seven former relations, not seven identical cloze interactions.
  const synthesis=room('05-synthesis'), oldBlank=id=>synthesis.blanks.find(b=>b.id===id);
  const safety='雖然增加水量可以讓水流更快，然而如果水量超過安全範圍，剛修復的裝置反而可能損壞。';
  const archive=[
    '研究員先前預計水量增加後，水車會轉得更快。第一次增加水量後，水車果然轉得更快了。',
    '第二次增加水量前，研究員仍預計水車會轉得更快。第二次增加水量後，水車卻沒有轉得更快。記錄旁寫著：「沒想到會完全停下來。」水車竟然完全停了下來。',
    '增加水量通常能讓水車轉得更快。然而，這次增加水量沒有幫助。原本希望水車轉得更快。這次增加水量沒有幫助，反而使另一個齒輪損壞。',
    '舊圖旁另有警語：「水量超過安全範圍，裝置可能損壞。」但圖上的水量刻度已經模糊。'+safety
  ];
  synthesis.tasks=[
    observed('r1-match','果然','研究員先前預計水量增加後，水車會轉得更快。','第一次增加水量後，水車果然轉得更快了。','原先預計','實際記錄',{
      title:'예상과 실제를 짚어 같은 결과를 이어 보자.',
      slots:[{id:'from',label:'어떻게 될 거라고 봤어?',style:'expected'},{id:'to',label:'실제로는 어떻게 됐어?',style:'actual'}],
      success:oldBlank('r1').successFeedbackKo,archiveIndex:0}),
    observed('r2-contrast','卻','第二次增加水量前，研究員仍預計水車會轉得更快。','第二次增加水量後，水車卻沒有轉得更快。','앞에서 예상한 내용','뒤에서 확인한 사실',{
      success:oldBlank('r2-a').successFeedbackKo,archiveIndex:1}),
    {id:'r2-evaluation',word:'竟然',title:'이 기록에 적힌 놀라움을 되살리려면?',
      context:'記錄旁寫著：「沒想到會完全停下來。」',sources:[{id:'result',text:'水車＿＿完全停了下來。'}],slots:[],answer:{},
      relations:oldBlank('r2-b').options.map(word=>({id:word,text:word})),relation:'竟然',
      success:oldBlank('r2-b').successFeedbackKo,wrong:synthesis.connectorFeedback,
      memo:'水車竟然完全停了下來。',archiveIndex:1},
    observed('r3-general','然而','增加水量通常能讓水車轉得更快。','然而，這次增加水量沒有幫助。','일반적으로 기대하는 효과','이번에 확인한 결과',{
      success:oldBlank('r3-a').successFeedbackKo,archiveIndex:2}),
    observed('r3-replacement','反而','原本希望水車轉得更快。','這次增加水量沒有幫助，反而使另一個齒輪損壞。','기대했던 결과','그 대신 생긴 결과',{
      slots:[{id:'from',label:'기대했던 결과',style:'expected'},{id:'to',label:'그 대신 생긴 결과',style:'actual'}],
      success:oldBlank('r3-b').successFeedbackKo,archiveIndex:2}),
    {id:'safety-scope',word:'反而',title:'어떤 경우에 손상될 수 있다는 말일까?',
      context:'舊圖旁另有警語：「水量超過安全範圍，裝置可能損壞。」但圖上的水量刻度已經模糊。',
      sources:[{id:'effect',text:'雖然增加水量可以讓水流更快，'},{id:'condition',text:'然而如果水量超過安全範圍，'},{id:'risk',text:'剛修復的裝置反而可能損壞。'}],
      slots:[{id:'effect',label:'앞에서 인정한 효과'},{id:'from',label:'어떤 경우라면?',style:'expected'},{id:'to',label:'그때 생길 수 있는 일',style:'possible'}],
      answer:{effect:'effect',from:'condition',to:'risk'},archiveIndex:3,
      hint:'칸을 누르고 해당 구절을 골라. 可能이 있는 결과는 이미 일어난 일과 구별해서 남겨 줘.',
      success:'수량을 늘리는 효과는 남겼어. 안전 범위를 넘으면 손상될 수 있지만, 이미 손상됐다고 확정하지 않았어.',
      slotFeedback:{effect:'앞의 효과도 인정하고 있어. 위험이 있다고 그 효과를 지우지는 마.',from:'손상 가능성은 모든 수량 증가가 아니라 안전 범위를 넘는 경우에 붙어 있어.',to:'可能을 포함한 구절을 그대로 남겨. 아직 일어난 사건으로 확정하지 말자.'}},
    {id:'reread',title:'기호를 잠시 내려놓고 기록을 이어 읽어 보자.',type:'read',sources:archive.map((text,i)=>({id:'record-'+i,text})),slots:[],answer:{},success:'기록마다 결과가 달랐고, 안전한 수량의 눈금은 아직 흐려져 있어.',confirmLabel:'전체 기록을 읽었어',archiveIndex:4},
    {id:'dispatch',title:'공방에 어디까지 전달할 수 있을까?',type:'decision',
      sources:[{id:'context',text:oldBlank('dispatch').contextZh}],slots:[],answer:{},
      relations:oldBlank('dispatch').options.map((text,i)=>({id:'decision-'+i,text})),relation:'decision-0',
      wrong:Object.fromEntries(oldBlank('dispatch').options.map((text,i)=>['decision-'+i,oldBlank('dispatch').optionFeedback?.[text]])),
      success:oldBlank('dispatch').successFeedbackKo,confirmLabel:'이 판단 전달',archiveIndex:4}
  ];
  synthesis.readingArchive=archive;

  // Only decisions are interactive; source order is already visible on the page.
  const showPair = task => {
    task.displayPaths = task.slots.map(slot => ({...slot, sourceId:task.answer[slot.id]}));
    task.slots=[]; task.answer={};
  };
  for (const task of room('03-expectation').tasks) {
    showPair(task); task.title='예상과 실제가 같았을까?';
  }
  for (const task of room('02-raner').tasks) {
    task.slots=task.slots.filter(slot=>slot.id==='to');
    task.answer={to:task.answer.to}; task.directSlot='to';
    task.title='보고에서 고쳐야 할 부분은?'; task.confirmLabel='보고 고치기';
  }
  for (const task of ran.tasks) {
    showPair(task);
    if (!task.relations) {task.type='read';task.title=task.word;task.confirmLabel='다음 기록';}
    else task.title='종이가 흩어지는 건 어느 경우일까?';
  }
  const premise=ran.tasks.find(task=>task.id==='apply-premise');
  premise.type='judgment';premise.title='확인한 손상을 어떤 출발점으로 삼았을까?';
  premise.relations=[{id:'accepted',text:'손상을 받아들이고 수리를 결정한다'},{id:'conditional',text:'손상됐을 경우에만 수리하기로 한다'}];
  premise.relation='accepted';premise.confirmLabel='판단 확인';
  premise.wrong={conditional:'여기서는 손상을 이미 확인했어. 既然은 그 사실을 받아들이고 다음 판단을 이어 줘.'};
  const interpretations={
    'r1-match':['예상했던 결과가 나왔다','예상과 다른 결과가 나왔다'],
    'r2-contrast':['예상했던 속도 증가가 나타나지 않았다','물을 더 넣지 않았다는 기록이다'],
    'r3-general':['보통의 효과와 이번 결과가 달랐다','물이 늘면 언제나 효과가 없다는 뜻이다'],
    'r3-replacement':['빨라지기를 바랐지만 다른 톱니가 손상됐다','빨라졌고 톱니도 함께 손상됐다']
  };
  for (const task of synthesis.tasks) {
    if (interpretations[task.id]) {
      showPair(task);task.title='이 기록은 어떤 뜻일까?';
      task.relations=interpretations[task.id].map((text,i)=>({id:'reading-'+i,text}));task.relation='reading-0';
      task.confirmLabel='해석 확인';
    }
    if (task.id==='safety-scope') {
      task.displayPaths=[{id:'risk',label:'생길 수 있는 일',style:'possible',sourceId:'risk'}];
      task.slots=task.slots.filter(slot=>slot.id==='from');task.answer={from:'condition'};
      task.directSlot='from';task.title='어떤 경우에 장치가 손상될 수 있을까?';task.confirmLabel='조건 확인';
      task.hint='';
    }
  }

  ran.introStory = 'academic-tower-ran-intro';
  ran.introduction = [
    {speaker:'소년',zh:'這幾個詞裡都有「然」。它是什麼意思？',ko:'이 표현들에는 모두 然이 있네요. 무슨 뜻이에요?'},
    {speaker:'연구원',zh:'「然」有「如此、這樣」的意思。我們先從這裡看起。',ko:'然에는 “그러하다·그렇게”라는 뜻이 있어. 이번에는 여기서부터 살펴보자.'},
    {speaker:'연구원',zh:'它和不同的字組成詞，用法也會不同。字義是線索，還要看整個詞和句子。',ko:'다른 글자와 어울리면 쓰임도 달라져. 글자 뜻을 단서로 삼고, 단어와 문장 전체에서 확인해 보자.'}
  ];
  ran.characterGuides = {
    '然而':{character:'而',clue:'而는 앞뒤를 이어 줘. 여기서는 대조하는 방향으로 이어져.',meaning:'然而는 앞말을 받아들이면서도 다른 사실을 덧붙이는 “그러나”라는 뜻이야.'},
    '果然':{character:'果',clue:'果에는 “정말·실제로”라는 뜻이 있어.',meaning:'果然은 예상했던 일이 실제로 이루어졌다는 “과연·예상대로”라는 뜻이야.'},
    '竟然':{character:'竟',clue:'竟에는 “뜻밖에도”라는 뜻이 있어.',meaning:'竟然은 예상이나 상식을 벗어난 일에 대한 놀라움을 나타내.'},
    '然後':{character:'後',clue:'後는 “뒤”를 뜻해.',meaning:'然後는 그렇게 한 뒤에 다음 일이 이어진다는 “그다음에”라는 뜻이야.'},
    '雖然':{character:'雖',clue:'雖는 “비록 ~이지만”이라는 양보를 나타내.',meaning:'雖然은 앞의 사실을 인정하면서 뒤에 다른 내용을 이어 갈 준비를 해.'},
    '既然':{character:'既',clue:'既의 “이미”라는 뜻을 단서로 삼아 봐.',meaning:'既然은 어떤 상황을 받아들인 전제로 삼아, “그러한 이상” 다음 판단을 이어 가.'},
    '不然':{character:'不',clue:'不는 “아니다”라는 부정이야.',meaning:'不然은 “그렇지 않다”, 연결 표현으로는 “그렇지 않으면”이라는 뜻이야.'}
  };
  for (const task of ran.tasks) {
    if (task.id.startsWith('observe-')) task.characterGuide=ran.characterGuides[task.word];
  }


  // Optional 03B: a thank-you visit becomes a small joint study of the village.
  // Append only: legacy tactical saves persist STAGES indexes.
  Object.assign(WORDS, {
    '仍然': { p:'ㄖㄥˊ ㄖㄢˊ', k:'여전히, 아직도; 어떤 상태나 행동이 계속됨',
      ex:'通往市集的那條路現在仍然有人走。',
      rule:'남아 있는 대상과 기간을 살펴봐. 한 부분이 이어진다고 마을 전체가 똑같은 것은 아니야.' },
    '突然': { p:'ㄊㄨˊ ㄖㄢˊ', k:'갑자기; 예고 없이 일이 일어남',
      ex:'一張摺好的紙突然滑了出來。',
      rule:'사건이 갑작스럽게 일어나는 시점이 중심이야. 놀라움의 평가와는 구별해.' },
    '當然': { p:'ㄉㄤ ㄖㄢˊ', k:'당연히, 물론; 말하는 이가 자연스럽게 옳다고 여김',
      ex:'當然認得！我走過那條路。',
      rule:'말하는 사람의 확신을 표현해. 확신 자체가 근거의 증명이나 오류는 아니야.' },
    '固然': { p:'ㄍㄨˋ ㄖㄢˊ', k:'물론, ~인 것은 사실이지만; 먼저 인정하면서 다른 면을 함께 말함',
      ex:'舊圖上固然畫著幾間工坊，但現在的市集也有各種買賣。',
      rule:'앞 내용을 인정하고 뒤 관점을 더해. 모든 용법이 양보 구조인 것은 아니야.' },
    '不盡然': { p:'ㄅㄨˋ ㄐㄧㄣˋ ㄖㄢˊ', k:'꼭 그렇지만은 않다; 전부가 맞는 것은 아님',
      ex:'說舊圖完全沒有參考價值，也不盡然。',
      rule:'전부를 부정하는 말이 아니야. 맞는 일부와 지나친 부분을 나눠 봐.' }
  });

  bundle.rooms.push({
    id:'academic-tower-turn-03b-ran-village', number:'03B',
    titleKo:'옛 지도, 지금의 마을', titleZh:'舊地圖上的三溪鎮',
    expressions:[], implemented:true, optional:true, sideGroup:'branch',
    introStoryId:'academic-tower-ran-village-intro',
    requires:['academic-tower-turn-03a-ran-family'],
    requiresStories:['academic-tower-ran-result']
  });

  const villageTask = (id, word, title, sources, extra={}) => ({
    id,word,title,sources,slots:[],answer:{},...extra
  });
  const villageStudy = {
    kind:'meaning-links', schemaVersion:1, introStory:'academic-tower-ran-village-intro',
    villageResearch:true, tasks:[
      villageTask('village-path','仍然','옛 기록과 지금의 모습을 비교해 볼까?',[
        {id:'old-map',label:'옛 지도와 옆 메모',text:'舊圖上標著一條通往市集的路，路旁畫著兩處歇腳的地方。圖邊寫著：「這條路常有人走。」'},
        {id:'boy-now',label:'소년이 지금 본 것',text:'我走過那條路，路上還有人來往。不過，我只看見一處歇腳的地方。'}
      ],{
        sourceLabel:'대조할 자료',workLabel:'소년의 비교 메모',workKind:'observe',
        question:'소년이 仍然을 써서 남길 수 있는 관찰은?',confirmLabel:'소년의 메모 남기기',
        relations:[
          {id:'road-used',text:'通往市集的那條路現在仍然有人走。'},
          {id:'two-rests',text:'路旁兩處歇腳的地方現在仍然都在。'},
          {id:'same-crowd',text:'那條路現在仍然每天都跟以前一樣熱鬧。'}
        ], relation:'road-used',
        wrong:{
          'two-rests':'소년은 쉼터 하나만 봤어. 나머지 한 곳이 지금도 있는지는 아직 몰라.',
          'same-crowd':'그 길을 다니는 사람은 있지만, 옛날과 지금이 매일 똑같이 붐빈다는 근거는 없어.'
        },
        success:'그 길을 다니는 사람이 지금도 있다는 것만 남겼어. 다른 쉼터와 길의 혼잡도는 아직 확인하지 않았어.',
        translation:'옛 지도에는 장터로 향하는 길과 쉼터 두 곳이 그려져 있어. 옆 메모에는 사람들이 그 길을 자주 다닌다고 적혀 있지. 소년은 지금도 사람이 다니는 걸 봤지만, 쉼터는 한 곳만 봤대.'
      }),
      villageTask('village-paper','突然','지도 사이에서 나온 쪽지',[
        {id:'paper',label:'연구실에서 생긴 일',text:'研究員剛翻開地圖的一角，一張摺好的紙突然滑了出來。'}
      ],{
        type:'read', readOnly:true, confirmLabel:'쪽지 펼치기',
        success:'종이가 갑자기 미끄러져 나온 짧은 순간이었어.'
      }),
      villageTask('village-assumption','當然','지도에서 확인한 정보와 쪽지의 생각은?',[
        {id:'map-workshops',label:'옛 지도',text:'水道旁畫著幾間工坊。舊圖標著通往市集的路。'},
        {id:'loose-margin',label:'작성자 미상의 쪽지',text:'水道旁有幾間工坊，鎮上的買賣當然都離不開水道。'}
      ],{
        question:'소년은 쪽지의 어디를 작성자의 당연한 단정으로 표시할까?',
        targets:[
          {id:'map-fact',text:'水道旁畫著幾間工坊。'},
          {id:'author-claim',text:'鎮上的買賣當然都離不開水道。'},
          {id:'map-path',text:'舊圖標著通往市集的路。'}
        ],
        slots:[{id:'to',label:'작성자의 판단'}],answer:{to:'author-claim'},directSlot:'to',
        workLabel:'소년의 검토 표시',workKind:'decision',confirmLabel:'작성자의 주장 표시',
        slotFeedback:{to:'그건 지도에서 직접 볼 수 있는 정보야. 쪽지에서 마을 전체까지 넓힌 판단을 찾아봐.'},
        success:'당연하다고 쓴 것은 작성자의 확신이야. 지도가 마을의 모든 거래를 증명한 건 아니지.',
        translation:'옛 지도에는 수로 옆 공방과 장터 방향 길이 그려져 있어. 하지만 쪽지는 마을의 모든 거래가 수로에서 벗어날 수 없다고 단정했어.'
      }),
      villageTask('village-concession','固然','지도의 사실을 남기고 다른 모습도 덧붙이자',[
        {id:'old-fact',label:'옛 지도의 기록',text:'水道旁畫著幾間工坊。'},
        {id:'boy-market',label:'소년이 본 지금 장터',text:'我在市集也看過各種買賣。光看舊圖上的工坊，還不知道現在全鎮的樣子。'}
      ],{
        sourceLabel:'대조할 자료',workLabel:'연구원의 해설 초안',workKind:'interpretation',
        workContext:'연구원이 옛 지도에 그려진 공방을 먼저 적었어. 소년이 본 지금 장터의 이야기를 이어 보자.',
        question:'연구원이 적은 문장에 소년의 장터 경험을 어떻게 덧붙일까?',
        choicePrefix:'舊圖上固然畫著水道旁的幾間工坊，但',prefixLabel:'연구원이 적기 시작한 문장',
        relations:[
          {id:'present-market',text:'現在的市集也有各種買賣，不能只憑舊圖推斷今天全鎮的生活。'},
          {id:'old-only-workshops',text:'這表示舊時全鎮的人一定都住在工坊附近。'},
          {id:'all-gone',text:'圖上的那幾間工坊現在一定全都消失了。'}
        ],relation:'present-market',confirmLabel:'연구원의 문장 이어 쓰기',
        wrong:{
          'old-only-workshops':'옛 지도에 공방이 그려져 있다고 모든 사람이 그 근처에 살았던 것은 아니야.',
          'all-gone':'소년은 지금 공방이 모두 사라졌다고 말하지 않았어. 알고 있는 사실만 더하자.'
        },
        success:'옛 지도에 공방이 표시된 건 그대로 인정하고, 소년이 오늘날 장터에서 본 여러 거래를 덧붙였어.',
        translation:'옛 지도에 수로 주변 공방이 그려진 것은 사실이야. 소년은 지금 장터에서 여러 거래를 봤고, 옛 지도만으로 현재 마을 전체를 판단할 수 없다고 말했어.'
      }),
      villageTask('village-scope','不盡然','옛 지도는 지금도 쓸모가 있을까?',[
        {id:'folder-opinion',label:'자료 봉투에 적힌 평가 · 작성자 미상',text:'這張舊圖太舊了，對現在的三溪鎮已經完全沒有參考價值。'}
      ],{
        draft:'這張舊圖很舊，所以對現在的三溪鎮已經完全沒有參考價值。',
        sourceLabel:'봉투 원문',workLabel:'봉투 평가의 검토문',workKind:'decision',
        workContext:'연구원이 봉투의 주장을 검토하려고 옮겨 적었어. 소년과 연구원이 내린 결론은 아니야.',
        draftLabel:'봉투 평가를 요약한 검토용 문장',
        question:'함께 쓸 해설에 넣기 전에, 어디를 지나치게 단정했는지 골라.',
        targets:[
          {id:'old-fact',text:'這張舊圖很舊'},
          {id:'present-target',text:'對現在的三溪鎮'},
          {id:'no-value',text:'完全沒有參考價值'}
        ],
        slots:[{id:'to',label:'고칠 판단'}],answer:{to:'no-value'},directSlot:'to',
        confirmLabel:'과장된 평가 고치기',
        correction:'舊圖雖然不能告訴我們現在每個地方的樣子，但至少能用來對照那條通往市集的路。',
        wrong:{},
        slotFeedback:{to:'옛 지도가 오래됐고, 지금의 마을을 비교하려는 건 맞아. 완전히 쓸모없다는 판단만 다시 봐.'},
        success:'지금 마을의 모든 것을 설명할 수는 없지만, 옛날과 지금의 길을 비교할 자료는 남아 있지.',
        translation:'자료 봉투에는 옛 지도가 너무 오래돼 지금 마을에는 전혀 참고할 가치가 없다고 쓰여 있어. 하지만 적어도 길을 비교할 단서는 남아 있어.'
      }),
      villageTask('village-reread','仍然','둘이 남긴 해설을 다시 읽자',[
        {id:'joint-note',label:'옛 지도 옆에 붙일 공동 해설',text:'舊圖標著一條通往市集的路，圖旁還記著那條路常有人走，並畫了水道旁的幾間工坊。少年說，那條路現在仍然有人走；他只看見一處歇腳的地方，另一處是否還在，尚不知道。舊圖上固然畫著水道旁的工坊，但今天的市集也有各種買賣，不能只憑舊圖就說全鎮的買賣都離不開水道。有人說舊圖對今天毫無參考價值，這樣的說法也不盡然；至少，我們可以拿那條路和現在的情況對照。'}
      ],{
        type:'read',readOnly:true,confirmLabel:'함께 쓴 해설 확인',
        sourceNote:'옛 지도·작성자 미상 쪽지·소년의 현재 증언을 구별해 정리한 공동 해설이야.',
        success:'원본 기록을 지우지 않고, 확인한 것과 아직 모르는 것을 함께 남겼어.'
      })
    ]
  };

  // Both intermediate scenes use the same shared StoryRuntime UI as the intro/outcome.
  // They are checkpoint scenes within one stable stage, not extra Journey nodes.
  villageStudy.scenes = {
    paper: {
      id:'academic-tower-03b-scene-paper', titleKo:'갑자기 나온 종이',
      background:'academic-tower', placeZh:'學術塔研究室', placeKo:'학술탑 연구실',
      beats:[
        {speaker:'towerResearcher',zh:'原來你真的走過。那我不能只看舊圖了。',ko:'정말 다녀왔구나. 그럼 옛 지도만 보고 있을 순 없겠네.'},
        {speaker:'narrator',zh:'研究員剛翻開地圖的一角，一張摺好的紙突然滑了出來。',ko:'연구원이 지도의 한쪽을 들추자 접힌 종이가 갑자기 빠져나왔다.'},
        {speaker:'boy',zh:'這張紙怎麼突然跑出來了？',ko:'이 종이는 왜 갑자기 튀어나오는 거예요?'},
        {speaker:'towerResearcher',zh:'咦？我明明記得已經整理好了……',ko:'어? 분명 정리해 놨다고 생각했는데….'},
        {speaker:'narrator',zh:'少年忍不住笑了一下。研究員也笑了，把紙攤開。',ko:'소년이 웃음을 참지 못하자 연구원도 피식 웃고 종이를 펼쳤다.'}
      ]
    },
    market: {
      id:'academic-tower-03b-scene-market', titleKo:'이번에는 내가 배울 차례',
      background:'academic-tower', placeZh:'學術塔研究室', placeKo:'학술탑 연구실',
      beats:[
        {speaker:'boy',zh:'剛才那張紙說得那麼肯定，怎麼會知道全鎮的事呢？',ko:'아까 그 쪽지는 그렇게 자신 있게 말하던데, 마을 전체를 어떻게 알았을까요?'},
        {speaker:'towerResearcher',zh:'你說得對。原來現在的市集還有那麼多買賣。',ko:'그러네. 지금 장터에는 다양한 거래가 있구나.'},
        {speaker:'boy',zh:'你沒去看過嗎？',ko:'연구원님은 가 보신 적 없어요?'},
        {speaker:'towerResearcher',zh:'舊記錄我看得多，現在的市集倒是你比較熟。這一段就一起寫吧。',ko:'옛 기록은 내가 많이 봤지만 지금 장터는 네가 더 잘 알겠네. 이 부분은 함께 적자.'}
      ]
    }
  };

  STAGES.push({
    id:'academic-tower-turn-03b-ran-village', title:'옛 지도, 지금의 마을',
    subtitle:'옛 지도, 지금의 마을', kicker:'학술탑 · 선택 연구 03B',
    grid:['S'], goal:'舊地圖與現在的三溪鎮。', rule:'옛 기록·소년의 경험·작성자 미상의 주장을 구별해 읽어.',
    words:['仍然','突然','當然','固然','不盡然'], win:[],
    story:'연구원과 옛 지도에 지금의 마을에 관한 해설을 덧붙이고 함께 도시락을 나눠 먹었다.',
    completionTitle:'✓ 옛 지도, 지금의 마을', completionAction:'함께 쓴 기록 보기',
    academicTower:villageStudy
  });

  globalThis.AcademicTowerContent = Object.freeze({
    bundle: Object.freeze({ ...bundle, rooms: Object.freeze(bundle.rooms.map(room => Object.freeze(room))) })
  });
})();
