// Optional private corpus replay. Never writes text or excerpts.
const fs=require('node:fs'), crypto=require('node:crypto');
require('../src/reader-content.js'); require('../src/reader-matcher.js');
if (!process.argv[2]) throw Error('Usage: node tools/reader-runtime-eval.cjs /private/texts.json');
const corpus=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const gold=JSON.parse(fs.readFileSync('data/reader-cna-eval-results-v0.1.json','utf8'));
const result={lexiconVersion:ReaderContent.lexiconVersion,documents:[]};
for(const doc of corpus){
 const ref=gold.documents.find(d=>d.id===doc.id&&d.layer===doc.layer);
 if(!ref||ref.paragraphs.length!==doc.paragraphs.length)throw Error('Corpus mismatch');
 const rows=doc.paragraphs.map((text,i)=>{
  if(crypto.createHash('sha256').update(text).digest('hex')!==ref.paragraphs[i].sha256)throw Error('Changed source');
  const spans=ReaderMatcher.detect(text), annotations=ref.annotations.filter(a=>a.paragraph===i+1);
  const has=(a,s)=>a.start===s.start&&a.end===s.end;
  const tp=spans.filter(s=>annotations.some(a=>a.judgment==='useful'&&has(a,s))).length;
  const uncertain=spans.filter(s=>annotations.some(a=>a.judgment==='uncertain'&&has(a,s))).length;
  const fn=annotations.filter(a=>a.judgment==='useful'&&!spans.some(s=>has(a,s))).length;
  return {paragraph:i+1,tp,fp:spans.length-tp-uncertain,fn,uncertain,highlights:spans.length,highlightChars:spans.reduce((n,s)=>n+[...text.slice(s.start,s.end)].length,0),chars:[...text].length};
 });
 result.documents.push({id:doc.id,layer:doc.layer,paragraphs:rows});
}
result.aggregate={};
for(const layer of ['A','B','all']){
 const total={tp:0,fp:0,fn:0,uncertain:0,highlights:0,highlightChars:0,chars:0};
 for(const d of result.documents.filter(d=>layer==='all'||d.layer===layer))for(const row of d.paragraphs)for(const key of Object.keys(total))total[key]+=row[key];
 total.precision=total.tp+total.fp?total.tp/(total.tp+total.fp):null;
 total.recall=total.tp+total.fn?total.tp/(total.tp+total.fn):null;
 total.highlightRatio=total.highlightChars/total.chars;
 result.aggregate[layer]=total;
}
console.log(JSON.stringify(result,null,2));
