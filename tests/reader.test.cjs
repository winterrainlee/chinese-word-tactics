const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../src/reader-content.js');
require('../src/reader-matcher.js');
const detect = text => ReaderMatcher.detect(text);
const forms = text => detect(text).map(s=>text.slice(s.start,s.end));
test('generated dictionary matches reviewed source',()=>{
  assert.deepEqual(ReaderContent,JSON.parse(fs.readFileSync('data/reader-markers-v0.1.json','utf8')));
});
test('A1 additions and longest match preserve UTF16 positions',()=>{
  const text='😀𠮷總而言之，此外其中因此因此';
  assert.deepEqual(forms(text),['總而言之','此外','其中','因此','因此']);
  assert.equal(detect(text)[0].start,4);
  assert.deepEqual(forms(''),[]);
});
test('known cross-word false positives and genuine connectors',()=>{
  assert.deepEqual(forms('廢除非核政策。立即使用。'),[]);
  assert.deepEqual(forms('除非下雨，即使很冷也去。'),['除非','即使']);
});
test('topic cues require clause opening',()=>{
  assert.deepEqual(forms('針對問題，對於此事，他提出針對問題的方法。'),['針對','對於']);
});
test('bounded A2 cues with negative lexical cases',()=>{
  assert.deepEqual(forms('若下雨，將取消。但天晴，則表示可以出發。'),['若','但','則']);
  assert.deepEqual(forms('若干人說但願成功，原則表示支持，準則將公布。'),[]);
  assert.deepEqual(forms('但凡來訪都歡迎。泰若將軍說好。'),[]);
  assert.deepEqual(forms('若下雨。明天，將取消。'),[]);
});
test('unsafe A2 pairs and all 得 remain held',()=>{
  for (const text of ['先進技術再提升','只有人才','當時沒有時間','除了外觀外','說得很清楚','跑得很快','做得不錯','覺得很好','得到答案','不得離開','得易科罰金','我得先走','看得懂','並列人才把握']) assert.deepEqual(forms(text),[],text);
});
test('literal text input is not a regex',()=>{
  assert.deepEqual(forms('<img onerror="alert(1)">.*[因此]'),['因此']);
});
test('v0.2 additions recognize authored forward-reading examples',()=>{
  const cases = {
    '可是':'我想出門，可是外面下雨了。','不過':'價格很高。不過，品質很好。',
    '因為':'因為下雨，我們取消行程。','於是':'他找不到路，於是打電話問我。',
    '不但':'這項計畫不但省錢，還能節省時間。','不僅':'這不僅是技術問題。',
    '甚至':'風很強，甚至吹倒了樹。','況且':'時間不夠，況且天色已晚。','何況':'他走路都很累，何況跑步。',
    '再者':'再者，我們沒有足夠的資料。','假如':'假如明天下雨，我們留在家裡。',
    '假使':'假使時間足夠，我想再看一遍。','即便':'即便很累，他也沒有停下來。',
    '縱使':'縱使失敗，我也要試試。','無論':'無論天氣如何，我都會到場。',
    '不論':'不論有無理由，都可提出申請。','一旦':'一旦發現問題，立刻停止。',
    '以免':'請先確認地址，以免走錯。','免得':'帶把傘吧，免得淋雨。','以便':'請留下電話，以便聯絡。',
    '比如':'我喜歡水果，比如蘋果。','譬如':'有很多選擇，譬如搭火車。',
    '換言之':'換言之，我們需要更多時間。','也就是說':'也就是說，明天不用來。',
    '除此之外':'除此之外，還有一個問題。','反之':'反之，成本就會增加。','其次':'其次，請檢查水溫。'
  };
  for (const [form,text] of Object.entries(cases)) assert.deepEqual(forms(text),[form],text);
});
test('v0.2 contrast and lexical guards reject authored non-cues',()=>{
  for (const text of ['他可是專家。','這可是大事。','可是你本人？','可是你本人?',
    '不過三天就完成了。','不過是小事。','我跑不過他。','這樣再好不過了。',
    '他只不過，隨口問問。','不過\n，這是另一段。','原因為設備故障。','這個基因為顯性。',
    '關鍵在於是否準備充分。','放在其次要位置。']) assert.deepEqual(forms(text),[],text);
  assert.deepEqual(forms('不過 , 我想再試試。'),['不過']);
  assert.deepEqual(forms('可是\n你本人？'),[]);
  // Genuine contrast questions and unpunctuated 不過 are intentionally held.
  assert.deepEqual(forms('可是，這樣真的好嗎？'),[]);
  assert.deepEqual(forms('不過我還想試試。'),[]);
  assert.deepEqual(forms('正因為下雨，我才留下。'),['因為']);
});
test('v0.2 uses longest variants and exact UTF16 spans',()=>{
  const text='😀𠮷比如說茶，譬如說水。';
  assert.deepEqual(forms(text),['比如說','譬如說']);
  assert.equal(detect(text)[0].start,4);
  assert.deepEqual(forms('不但便宜，而且好用。'),['不但','而且']);
});
