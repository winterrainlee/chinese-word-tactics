#!/usr/bin/env python3
"""Offline research harness. No runtime imports, network calls, or corpus export.
python tools/reader-cna-eval.py --self-test
python tools/reader-cna-eval.py --corpus /private/texts.json --output /private/measured.json
Corpus: [{id,layer,paragraphs:[str]}]. Gold & fingerprints are in the results file.
"""
import argparse, hashlib, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / 'data/reader-cna-eval-results-v0.1.json'
A0 = '然而 卻 反而 因此 所以 因而 但是 而且 並且 仍然 另外 雖然 即使 如果 只要 除非 否則 既然 例如 換句話說 總之 總而言之'.split()
ADDED = '至於 其中 此外 接著 隨後 另一方面 針對 對於 儘管 由於 為了 因應 受惠於 首先'.split()
DISCOVERED = '受惠 甚至 因為 根據 除了 不論 隨著 也就是 第一 第二 第三 第四 依照'.split()
RISK = '不過 結果 只是 包括 同時'.split()
SINGLES = list('若則但仍並也後再就才得把')
# Experimental bounded patterns only. Outputs are endpoints, not a meaning span.
PAIRS = [
 ('繼後',r'(繼)[^。！？；\n]{1,80}?(後)'),
 ('先再',r'(先)[^。！？；\n]{1,60}?(再)'),
 ('只有才',r'(只有)[^。！？；\n]{1,60}?(才)'),
 ('不是而是',r'(不是)[^。！？；\n]{1,60}?(而是)'),
 ('不僅更',r'(不僅)[^。！？；\n]{1,60}?(更)'),
 ('不但也',r'(不但)[^。！？；\n]{1,60}?(也)'),
 ('待後',r'(待)[^。！？；\n]{1,40}?(後)'),
 ('當時',r'(當)[^。！？；\n]{1,40}?(時)'),
 ('除外',r'(除)(?!了|役)[^。！？；\n]{1,40}?(外)'),
 ('沒有就沒有',r'(沒有)[^。！？；\n]{1,40}?(就)(?=沒有)'),
 ('以為例',r'(以)[^。！？；，\n]{1,20}?(為例)'),
 ('雖仍',r'(雖)(?!然)[^。！？；\n]{1,60}?(仍)'),
 ('雖然但',r'(雖然)[^。！？；\n]{1,60}?(但)(?!是)'),
 ('但仍',r'(但)(?!是)[^。！？；\n]{0,60}?(仍)(?!然)'),
 ('若就則',r'(若)[^。！？；\n]{1,60}?[，,][^。！？；\n]{0,8}?(就|則)')
]
def utf16(t): return len(t.encode('utf-16-le'))//2
def digest(t): return hashlib.sha256(t.encode()).hexdigest()
def span(t,s,e,rule): return dict(start=utf16(t[:s]),end=utf16(t[:e]),marker=t[s:e],rule=rule)
def resolve(items):
 out=[];end=-1
 for x in sorted(items,key=lambda x:(x['start'],-x['end'],x['rule'])):
  if x['start']>=end: out.append(x);end=x['end']
 return out

def detect(t,condition):
 forms=A0 + ([] if condition=='A0' else ADDED)
 if condition=='A1-discovered': forms+=DISCOVERED
 if condition=='A1-risk': forms+=RISK
 out=[span(t,m.start(),m.end(),'literal:'+s) for s in forms for m in re.finditer(re.escape(s),t)]
 if condition=='A2':
  for name,pattern in PAIRS:
   for m in re.finditer(pattern,t):
    out.extend(span(t,*m.span(i),'pair:'+name) for i in range(1,len(m.groups())+1))
  for m in re.finditer(r'(?<=[，。；：「])但(?!是)',t):out.append(span(t,m.start(),m.end(),'clause-initial-但'))
  if t.startswith('但') and not t.startswith('但是'):out.append(span(t,0,1,'clause-initial-但'))
  for m in re.finditer(r'(?<![原規準法守細通])則(?=表示|將|在|由|減少|受)',t):out.append(span(t,m.start(),m.end(),'restricted-則'))
  for m in re.finditer(r'若(?=[^。！？；\n]{1,80}，[^。！？；\n]{0,12}(?:應|將|預計))',t):out.append(span(t,m.start(),m.end(),'若-comma-consequence'))
  for m in re.finditer(r'(?<=[說跑做泡忙])得(?=很|太|不錯|沒時間)',t):out.append(span(t,m.start(),m.end(),'degree-得-allowlist'))
  for m in re.finditer(r'繼[^。！？；\n]{1,80}?後，(再)',t):out.append(span(t,*m.span(1),'sequence-繼後再'))
 return resolve(out)
def score(pred,gold,uncertain=()):
 ps={(x['start'],x['end']) for x in pred};gs={(x['start'],x['end']) for x in gold};us={(x['start'],x['end']) for x in uncertain}
 tp=len(ps&gs);fp=len(ps-gs-us);fn=len(gs-ps)
 return dict(tp=tp,fp=fp,fn=fn,uncertainHits=len(ps&us),precision=tp/(tp+fp) if tp+fp else None,recall=tp/(tp+fn) if tp+fn else None)
def aggregate(rows):
 out={k:sum(r[k] for r in rows) for k in ['tp','fp','fn','uncertainHits','highlightCount','highlightChars','textChars']}
 out['precision']=out['tp']/(out['tp']+out['fp']) if out['tp']+out['fp'] else None
 out['recall']=out['tp']/(out['tp']+out['fn']) if out['tp']+out['fn'] else None
 out['highlightRatio']=out['highlightChars']/out['textChars'] if out['textChars'] else None
 return out
CONDITIONS=['A0','A1','A2','A1-discovered','A1-risk']
def evaluate(corpus,result):
 docs=[]
 for d in corpus:
  ref=next(x for x in result['documents'] if x['id']==d['id'] and x['layer']==d['layer'])
  assert len(d['paragraphs'])==len(ref['paragraphs']),'paragraph count changed'
  rows=[]
  for n,t in enumerate(d['paragraphs'],1):
   fp=ref['paragraphs'][n-1];assert digest(t)==fp['sha256'],f"text changed: {d['id']} {d['layer']} p{n}"
   anns=[x for x in ref['annotations'] if x['paragraph']==n];gold=[x for x in anns if x['judgment']=='useful'];u=[x for x in anns if x['judgment']=='uncertain']
   for a in anns:
    assert t.encode('utf-16-le')[2*a['start']:2*a['end']].decode('utf-16-le')==a['marker']
   measures={}
   for c in CONDITIONS:
    pred=detect(t,c);s=score(pred,gold,u)
    s.update(highlightCount=len(pred),highlightChars=sum(len(x['marker']) for x in pred),textChars=len(t),predictions=pred)
    s['highlightRatio']=s['highlightChars']/len(t) if t else None;measures[c]=s
   rows.append(dict(paragraph=n,conditions=measures))
  docs.append(dict(id=d['id'],layer=d['layer'],paragraphs=rows,conditions={c:aggregate([x['conditions'][c] for x in rows]) for c in CONDITIONS}))
 return dict(documents=docs,aggregate={layer:{c:aggregate([d['conditions'][c] for d in docs if layer=='all' or d['layer']==layer]) for c in CONDITIONS} for layer in ['A','B','all']})
def verify_recorded():
 r=json.loads(RESULT.read_text());docs=[]
 for d in r['documents']:
  rows=[]
  for p in d['paragraphs']:
   aa=[a for a in d['annotations'] if a['paragraph']==p['paragraph']]
   for a in aa:
    assert 0<=a['start']<a['end']<=p['utf16Units']
    assert a['end']-a['start']==utf16(a['marker'])
   gold=[a for a in aa if a['judgment']=='useful'];u=[a for a in aa if a['judgment']=='uncertain']
   row={}
   for c in CONDITIONS:
    pred=[a for a in aa if a['detection'][c]]
    assert len({(a['start'],a['end']) for a in pred})==len(pred)
    ordered=sorted(pred,key=lambda a:a['start'])
    assert all(a['end']<=b['start'] for a,b in zip(ordered,ordered[1:]))
    q=score(pred,gold,u);q.update(highlightCount=len(pred),highlightChars=sum(len(a['marker']) for a in pred),textChars=p['codePoints'])
    q['highlightRatio']=q['highlightChars']/q['textChars'] if q['textChars'] else None
    assert q==p['metrics'][c],(d['id'],d['layer'],p['paragraph'],c)
    row[c]=q
   rows.append(row)
  stats={c:aggregate([x[c] for x in rows]) for c in CONDITIONS}
  assert stats==d['metrics'];docs.append((d['layer'],stats))
 for layer in ['A','B','all']:
  for c in CONDITIONS:
   assert aggregate([s[c] for l,s in docs if layer=='all' or l==layer])==r['aggregate'][layer][c]
 print('Recorded annotations, offsets, non-overlap, paragraph/document/layer aggregates: PASS')

def self_test():
 r=json.loads(RESULT.read_text());out=[]
 for case in r['syntheticCases']:
  hits=[x for x in detect(case['text'],case.get('condition','A2')) if x['marker'] in case['evaluateMarkers']]
  found=[(x['start'],x['marker']) for x in hits];expected=[tuple(x) for x in case['expected']]
  # Failures of the candidate heuristic are observed findings, not test failures.
  assert found==[tuple(x) for x in case['observed']],case['id']
  out.append(dict(id=case['id'],matchesGold=found==expected))
 assert detect('😀然而然而','A0')[0]['start']==2
 assert [x['marker'] for x in detect('總而言之','A0')]==['總而言之']
 assert detect('','A2')==[]
 print(json.dumps(dict(cases=len(out),matchingGold=sum(x['matchesGold'] for x in out),knownFailures=[x['id'] for x in out if not x['matchesGold']],utf16AndOverlap='pass'),ensure_ascii=False))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--self-test',action='store_true');p.add_argument('--verify-recorded',action='store_true');p.add_argument('--corpus');p.add_argument('--output');a=p.parse_args()
 if a.self_test:self_test()
 elif a.verify_recorded:verify_recorded()
 else:
  p.error('--corpus and --output required') if not(a.corpus and a.output) else None
  r=evaluate(json.loads(Path(a.corpus).read_text()),json.loads(RESULT.read_text()));Path(a.output).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
  print(json.dumps(r['aggregate'],ensure_ascii=False,indent=2))
