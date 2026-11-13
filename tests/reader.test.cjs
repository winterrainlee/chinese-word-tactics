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
