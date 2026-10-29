const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../src/story-outcome-content.js');
const S=globalThis.StoryOutcomeContent;
const intro={id:'academic-tower-er-intro',beats:[
  {speaker:'narrator',zh:'甲',ko:'시작'}, {speaker:'boy',zh:'咦？你要去哪裡？',ko:'어? 어디 가세요?'},
  {speaker:'towerResearcher',zh:'乙',ko:'어디'}
]};
const result={id:'academic-tower-er-result',beats:[
  {speaker:'boy',zh:'甲',ko:'첫째'}, {speaker:'towerResearcher',zh:'乙',ko:'둘째'},
  {speaker:'boy',zh:'丙',ko:'셋째'},
  {speaker:'towerResearcher',zh:'我們把看到的事記下來，也會告訴管理人員。接著要查什麼，也記好了。',ko:'결정'},
  {speaker:'boy',zh:'丁',ko:'넷째'}
]};
const id='academic-tower-turn-04a-er-family';

test('04A greeting changes only for familiar 03B visit and stays frozen across later completion',()=>{
  const newPlayer=S.resolve(intro,{completedStages:[]});
  assert.equal(newPlayer,intro);
  const previouslyFamiliar=S.resolve(intro,{completedStages:['academic-tower-turn-03b-ran-village']});
  assert.match(previouslyFamiliar.beats[1].zh,/又在這裡遇到/);
  assert.equal(previouslyFamiliar.beats[0],intro.beats[0]);
  const frozenOrdinary=S.resolve(intro,{
    completedStages:['academic-tower-turn-03b-ran-village'],
    sideResearchProgress:{[id]:{introVariantId:'ordinary'}}
  });
  assert.equal(frozenOrdinary,intro);
  const frozenFamiliar=S.resolve(intro,{
    completedStages:[],sideResearchProgress:{[id]:{introVariantId:'familiar'}}
  });
  assert.match(frozenFamiliar.beats[1].ko,/또 만나네요/);
});

test('04A result names the first saved next inquiry but never claims it was already solved',()=>{
  const none=S.resolve(result,{stageOutcomes:{}});
  assert.equal(none,result);
  const records=S.resolve(result,{stageOutcomes:{[id]:{nextInquiryId:'inquiry-records'}}});
  const outlet=S.resolve(result,{stageOutcomes:{[id]:{nextInquiryId:'inquiry-outlet'}}});
  assert.match(records.beats[3].zh,/修繕紀錄/);
  assert.match(outlet.beats[3].zh,/下游出口/);
  assert.doesNotMatch(records.beats[3].ko,/찾았어|확인했어/);
  assert.doesNotMatch(outlet.beats[3].ko,/찾았어|확인했어/);
  assert.equal(records.beats[0],result.beats[0]);
  assert.equal(outlet.beats[4],result.beats[4]);
});
