'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../tower-reading-p1-test/model.js');
test('all P1 tasks have valid stable data and unassisted final reading',()=>{assert.equal(m.validate(),true);for(const st of m.studies)assert.equal(st.tasks.at(-1).kind,'reading');});
for(const st of m.studies)test(st.id+' rejects incorrect/incomplete attempts and can be replayed',()=>{
  let s=m.fresh(st.id);
  for(const t of st.tasks){
    assert.equal(m.current(s).id,t.id);
    if(t.kind==='lesson'){
      const initial=s;
      assert.ok(!s.solved&&!s.attempted&&!s.last);
      assert.equal(m.lessonVariant(s).id,t.variants[0].id);
      for(const v of t.variants){
        s=m.apply(s,{type:'explore',id:v.id});
        assert.equal(m.visible(s),v.sentence);
        assert.equal(m.lessonVariant(s).id,v.id);
        assert.ok(!s.solved&&!s.attempted&&!s.last);
      }
      assert.equal(m.apply(s,{type:'answer',id:'invalid'}).last,null);
      assert.equal(m.apply(initial,{type:'next'}).index,initial.index+1);
      s=m.apply(s,{type:'next'});continue;
    }
    assert.equal(m.apply(s,{type:'next'}).index,s.index);
    if(t.tail)assert.ok(!m.visible(s).includes(t.tail));
    if(t.options){
      s=m.apply(s,{type:'answer',id:t.options.find(o=>o.id!==t.answer).id});
      assert.equal(s.solved,false);assert.ok(s.last.feedback);
      if(t.tail)assert.ok(m.visible(s).endsWith(t.tail));
      s=m.apply(s,{type:'answer',id:t.answer});
    }else{
      assert.equal(m.apply(s,{type:'check'}).solved,false);
      for(const r of t.rows)s=m.apply(s,{type:'set',row:r.id,id:t.columns.find(c=>c.id!==r.answer).id});
      s=m.apply(s,{type:'check'});assert.equal(s.solved,false);assert.ok(s.last.feedback);
      for(const r of t.rows)s=m.apply(s,{type:'set',row:r.id,id:r.answer});
      s=m.apply(s,{type:'check'});
    }
    assert.ok(s.solved);s=m.apply(s,{type:'next'});
  }
  assert.ok(s.done);assert.equal(m.fresh(st.id).index,0);
});

test('every room opens with observation and preserves the original 16 application tasks',()=>{assert.equal(m.studies.flatMap(s=>s.tasks).filter(t=>t.kind==='lesson').length,11);assert.equal(m.studies.flatMap(s=>s.tasks).filter(t=>t.kind!=='lesson').length,16);for(const st of m.studies){assert.equal(st.tasks[0].kind,'lesson');assert.equal(st.tasks.at(-1).kind,'reading');}});
