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

  const claim = (id, labelKo, feedbackKo) => ({ id, labelKo, feedbackKo });
  const revision = (id, labelKo, feedbackKo) => ({ id, labelKo, feedbackKo });

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
      schemaVersion: 2,
      kind: 'claim-revision',
      cases: [
        {
          id: 'practice', mode: 'guided', scope: 'sentence', connectorZh: '卻',
          questionKo: '비 오는 날 이 수로를 이용할 때, 기록이 뒷받침하지 않는 메모는?',
          draftKo: '검토 초안 · 짧으니 비 오는 날 이용하기 좋다.',
          revealLabelKo: '문장 마저 읽기',
          sources: [
            { id: 'short', text: '這條水道比較短', labelKo: '수로가 더 짧다', initiallyVisible: true },
            { id: 'rain-danger', text: '雨天卻更危險。', labelKo: '비 오는 날에는 더 위험하다', initiallyVisible: false, connectorZh: '卻' }
          ],
          claims: [
            claim('fact-short', '이 수로는 더 짧다.', '위험하다는 내용이 수로의 길이를 바꾸지는 않아.'),
            claim('overreach-use', '짧으니 비 오는 날 이용하기 좋다.', '짧다는 사실에서 이용 판단으로 넘어간 부분을 찾았어.'),
            claim('fact-danger', '비 오는 날에는 더 위험하다.', '위험은 기록에 직접 적혀 있어. 앞의 장점과 함께 살펴봐.')
          ],
          repairTargetId: 'overreach-use',
          revisions: [
            revision('keep-both', '짧다는 장점은 있다. 우천 시 위험도 이용 판단에 반영한다.', ''),
            revision('ignore-danger', '짧다는 장점은 있다. 우천 시 위험은 이용 판단에서 제외한다.', '길이의 장점만으로 비 오는 날의 위험을 빼면 안 돼.'),
            revision('cancel-short', '우천 시 더 위험하다. 따라서 수로가 짧다는 기록을 취소한다.', '위험하다고 해서 짧다는 사실까지 틀린 것은 아니야.')
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
            { id: 'old', text: '這個裝置很舊', labelKo: '장치가 오래되었다', initiallyVisible: true },
            { id: 'working', text: '卻還能正常運作。', labelKo: '지금도 정상 작동한다', initiallyVisible: true, connectorZh: '卻' }
          ],
          revisions: [
            revision('cancel-old', '정상 작동하므로 오래되었다는 기록을 취소한다.', '현재의 작동 상태가 장치의 나이를 바꾸지는 않아.'),
            revision('old-not-working', '오래되었으므로 현재 정상 작동한다는 기록을 취소한다.', '오래되었다는 이유로 확인된 작동 상태를 지우지는 마.'),
            revision('old-and-working', '장치는 오래되었다. 그래도 지금은 정상 작동한다.', '')
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
      schemaVersion: 2,
      kind: 'claim-revision',
      cases: [
        {
          id: 'practice', mode: 'guided', scope: 'records', connectorZh: '然而',
          questionKo: '두 기록을 함께 읽으면, 복구 보고의 어느 주장을 고쳐야 할까?',
          draftKo: '복구 초안 · 수량이 늘었으니 장치 전체도 정상으로 돌아왔다.',
          revealLabelKo: '점검 기록 읽기',
          sources: [
            { id: 'water-increased', text: '修復舊水道後，水量增加了。', labelKo: '수로 수리 뒤 수량이 늘었다', initiallyVisible: true },
            { id: 'device-not-restored', text: '然而，這個裝置還沒有恢復正常。', labelKo: '장치는 아직 정상으로 돌아오지 않았다', initiallyVisible: false, connectorZh: '然而' }
          ],
          claims: [
            claim('fact-increased', '수로를 수리한 뒤 수량이 늘었다.', '장치에 이상이 남아도 수량 증가 기록은 사라지지 않아.'),
            claim('fact-not-restored', '장치는 아직 정상으로 돌아오지 않았다.', '수량이 늘었다는 사실만으로 점검 결과를 취소할 수 없어.'),
            claim('overreach-restored', '수량이 늘었으니 장치 전체도 정상으로 돌아왔다.', '수량의 변화로 장치 전체를 판단한 부분을 찾았어.')
          ],
          repairTargetId: 'overreach-restored',
          revisions: [
            revision('cancel-improvement', '장치는 아직 정상 아님. 따라서 수량 증가 기록도 취소한다.', '전체가 정상은 아니어도 일부 개선은 있을 수 있어.'),
            revision('keep-both', '수량은 늘었다. 장치 전체는 아직 정상으로 돌아오지 않았다.', ''),
            revision('restore-all', '수량은 늘었다. 따라서 장치 전체도 정상으로 처리한다.', '수량의 개선과 장치 전체의 정상 여부는 같은 판단이 아니야.')
          ],
          correctRevisionId: 'keep-both',
          successFeedbackKo: '수량의 개선은 남기고, 장치 전체가 정상이라는 판단을 고쳤어.',
          connectionKo: '然而 뒤의 점검 기록이 “부분 개선이면 전체도 정상”이라는 추론을 제한했다.'
        },
        {
          id: 'transfer', mode: 'transfer', scope: 'records', connectorZh: '然而',
          questionKo: '새 기록 두 장을 함께 반영한 메모는?',
          draftKo: '새 기록 · 미수리 상태와 현재 수량을 함께 정리하자.',
          revealLabelKo: '다음 기록 읽기',
          sources: [
            { id: 'not-repaired', text: '舊水道還沒有修復。', labelKo: '옛 수로는 아직 수리되지 않았다', initiallyVisible: true },
            { id: 'water-restored', text: '然而，調整裝置以後，水量已經恢復正常。', labelKo: '장치 조정 뒤 수량은 정상으로 돌아왔다', initiallyVisible: false, connectorZh: '然而' }
          ],
          revisions: [
            revision('assume-repaired', '수량이 정상이므로 옛 수로도 수리 완료로 처리한다.', '수량 회복이 옛 수로의 수리 완료를 뜻하지는 않아.'),
            revision('keep-both', '옛 수로는 아직 미수리 상태다. 장치 조정 뒤 수량은 정상이다.', ''),
            revision('deny-water', '옛 수로가 미수리 상태이므로 수량 회복 기록을 취소한다.', '옛 수로 상태만으로 장치 조정 뒤의 수량을 부정할 수 없어.')
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

  globalThis.AcademicTowerContent = Object.freeze({
    bundle: Object.freeze({ ...bundle, rooms: Object.freeze(bundle.rooms.map(room => Object.freeze(room))) })
  });
})();
