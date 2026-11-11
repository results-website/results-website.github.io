export const LETTERS = 'ABCDEFGH';
export const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
export const mean = xs => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
export const variance = (xs, sample=true) => {
  if (xs.length < (sample ? 2 : 1)) return null;
  const m=mean(xs); return xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-(sample?1:0));
};
export const sd = xs => {const v=variance(xs);return v===null?null:Math.sqrt(v);};
export function quantile(xs,p){if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y),i=(a.length-1)*p;return a[Math.floor(i)]+(a[Math.ceil(i)]-a[Math.floor(i)])*(i%1);}
export function correlation(xs,ys){if(xs.length<2)return null;const x=mean(xs),y=mean(ys);let a=0,b=0,c=0;xs.forEach((v,i)=>{a+=(v-x)*(ys[i]-y);b+=(v-x)**2;c+=(ys[i]-y)**2;});return b&&c?Math.max(-1,Math.min(1,a/Math.sqrt(b*c))):null;}

export function validateDataset(d){
  if(d?.schema!=='ecs174-review-v1'||!Array.isArray(d.students)||!d.students.length||!/^[a-f0-9]{64}$/.test(d.scan_sha256)||!/^[a-f0-9]{64}$/.test(d.dataset_id))throw Error('This is not a supported midterm review file.');
  if(!d.keys||Object.keys(d.keys).sort().join(',')!=='V0,V1,V2,V3'||Object.values(d.keys).some(k=>!/^[A-H]{21}$/.test(k)))throw Error('The answer keys are invalid.');
  if(!Array.isArray(d.questions)||d.questions.length!==21)throw Error('Expected 21 question descriptions.');
  const pages=new Set();
  for(const s of d.students){
    if(!Number.isInteger(s.page)||s.page<1||pages.has(s.page)||!Array.isArray(s.questions)||s.questions.length!==21)throw Error('Invalid or duplicate scan page.');
    pages.add(s.page);
    for(const [i,q] of s.questions.entries())if(q.question!==i+1||!['',...LETTERS].includes(q.answer)||typeof q.status!=='string')throw Error('Invalid original answer record.');
    if(!['name','student_id','identity_review'].every(k=>typeof s[k]==='string'))throw Error('Invalid identity record.');
  }
  for(const value of Object.values(d.media||{}))if(typeof value!=='string'||!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(value))throw Error('Review images must be embedded locally.');
  for(const [i,q] of d.questions.entries()){
    if(q.number!==i+1)throw Error('Question order is invalid.');
    for(const v of Object.keys(d.keys))if(!q.option_maps?.[v]||[...LETTERS].some(a=>!LETTERS.includes(q.option_maps[v][a])))throw Error('Missing version-specific option mapping.');
  }
  validateCorrections(d,d.initial_corrections||{});
  return d;
}

export function validateCorrections(d,pages){
  if(!pages||typeof pages!=='object'||Array.isArray(pages))throw Error('Corrections must contain a pages object.');
  const validPages=new Set(d.students.map(s=>String(s.page)));
  const allowed=['name','student_id','identity_review','version','answers','acknowledge_version_conflict','acknowledge_extra_rows'];
  for(const [p,c] of Object.entries(pages)){
    if(!validPages.has(p)||!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).some(k=>!allowed.includes(k)))throw Error(`Invalid correction for page ${p}.`);
    for(const k of ['name','student_id','identity_review'])if(own(c,k)&&typeof c[k]!=='string')throw Error(`Invalid ${k} on page ${p}.`);
    if(own(c,'version')&&!['',...Object.keys(d.keys)].includes(c.version))throw Error(`Invalid version on page ${p}.`);
    for(const k of ['acknowledge_version_conflict','acknowledge_extra_rows'])if(own(c,k)&&typeof c[k]!=='boolean')throw Error(`Invalid acknowledgement on page ${p}.`);
    if(own(c,'answers')){
      if(!c.answers||typeof c.answers!=='object'||Array.isArray(c.answers))throw Error('Invalid answer corrections.');
      for(const [n,a] of Object.entries(c.answers))if(!/^([1-9]|1[0-9]|2[01])$/.test(n)||!['',...LETTERS].includes(a))throw Error(`Invalid answer on page ${p}, question ${n}.`);
    }
  }
  return pages;
}

export function gradeAll(d,edits={}){
  const marker=Object.fromEntries(Object.entries(d.keys).map(([v,k])=>[k[14],v]));
  const rows=d.students.map(original=>{
    const c=edits[String(original.page)]||{},name=c.name??original.name,student_id=c.student_id??original.student_id,identity_review=c.identity_review??original.identity_review,flags=[];
    if(!name||!student_id)flags.push('identity_missing');
    if(student_id&&!/^\d{9}$/.test(student_id))flags.push('student_id_format');
    if(identity_review)flags.push('identity_review');
    if(original.error)flags.push('scan_layout_failed');
    if(original.extra_marked_rows?.length&&!c.acknowledge_extra_rows)flags.push('marks_after_q21');
    const questions=original.questions.map(q=>own(c.answers||{},String(q.question))?{...q,answer:c.answers[q.question],status:c.answers[q.question]?'reviewed':'reviewed_blank'}:{...q});
    const unknown=questions.filter(q=>!['read','reviewed','reviewed_blank'].includes(q.status));
    unknown.forEach(q=>flags.push(`Q${q.question}:${q.status}`));
    const inferred=marker[questions[14]?.answer]||'',version=own(c,'version')?c.version:inferred;
    const version_source=c.version?'review_override':inferred?'Q15_assumed_correct':'unresolved';
    if(!version)flags.push('version_unresolved');
    const scores={},uppers={};
    for(const [v,key] of Object.entries(d.keys)){scores[v]=original.error?0:questions.filter((q,i)=>q.answer===key[i]).length;uppers[v]=original.error?21:scores[v]+unknown.length;}
    if(version&&version_source==='Q15_assumed_correct'&&Math.max(...Object.values(scores))>=uppers[version]+4&&!c.acknowledge_version_conflict)flags.push('version_score_conflict');
    const score_lower=version?scores[version]:null,score_upper=version?uppers[version]:null;
    return {page:original.page,name,student_id,identity_review,questions,version,version_source,scores,uppers,score_lower,score_upper,flags,unknown,original,correction:c};
  });
  const ids=new Map();for(const r of rows)if(r.student_id)ids.set(r.student_id,(ids.get(r.student_id)||0)+1);
  for(const r of rows){if(ids.get(r.student_id)>1)r.flags.push('duplicate_student_id');r.status=r.flags.length?'REVIEW':'GRADED';r.final_score=r.flags.length?null:r.score_lower;}
  return rows;
}

export function statistics(d,rows,cohort='resolved'){
  const complete=rows.filter(r=>r.version&&!r.unknown.length&&!r.original.error&&!r.flags.includes('version_score_conflict'));
  const included=cohort==='final'?complete.filter(r=>r.status==='GRADED'):complete;
  const points=included.map(r=>r.questions.map((q,i)=>Number(q.answer===d.keys[r.version][i])));
  const scores=included.map(r=>r.score_lower),content=points.map(xs=>xs.reduce((s,x)=>s+x,0));
  const histogram=Array.from({length:22},(_,score)=>({score,count:scores.filter(x=>x===score).length}));
  const perQuestion=d.questions.map((q,i)=>{
    const xs=points.map(p=>p[i]),distribution=Object.fromEntries([...LETTERS].map(a=>[a,0]));let blanks=0;
    included.forEach(r=>{const a=r.questions[i].answer;if(a)distribution[q.option_maps[r.version][a]]++;else blanks++;});
    const allUnknown=rows.filter(r=>!r.version||r.unknown.some(x=>x.question===i+1)).length;
    return {question:i+1,title:q.title,topic:q.topic,n:xs.length,correct:xs.reduce((a,b)=>a+b,0),mean:mean(xs),sd:sd(xs),percent_correct:xs.length?100*mean(xs):null,corrected_item_total:correlation(xs,content.map((total,j)=>total-xs[j])),blank:blanks,unresolved_all_sheets:allUnknown,distribution,canonical_correct:d.keys.V0[i]};
  });
  const totalVariance=variance(content,false),sumItemVariance=perQuestion.reduce((s,q,i)=>s+(variance(points.map(p=>p[i]),false)||0),0);
  const alpha=included.length>1&&totalVariance>0?21/20*(1-sumItemVariance/totalVariance):null;
  const versions=Object.keys(d.keys).map(v=>{const xs=included.filter(r=>r.version===v).map(r=>r.score_lower);return {version:v,n:xs.length,mean:mean(xs),median:quantile(xs,.5),sd:sd(xs)};});
  const topics=Object.entries(d.topics).map(([topic,ns])=>{const xs=points.map(p=>mean(ns.map(n=>p[n-1])));return {topic,questions:ns,n:xs.length,mean:mean(xs),percent_correct:xs.length?100*mean(xs):null,sd:sd(xs)};});
  return {cohort,n:included.length,total:rows.length,excluded:rows.length-included.length,identity_held_included:included.filter(r=>r.status==='REVIEW').length,mean:mean(scores),median:quantile(scores,.5),sd:sd(scores),min:scores.length?Math.min(...scores):null,max:scores.length?Math.max(...scores):null,q1:quantile(scores,.25),q3:quantile(scores,.75),kr20:alpha,content_items:21,histogram,questions:perQuestion,versions,topics};
}

export function csvText(rows,fields){
  const cell=value=>{let s=value==null?'':String(value);if(typeof value!=='number'&&/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  return '\ufeff'+[fields.map(cell).join(','),...rows.map(r=>fields.map(k=>cell(r[k])).join(','))].join('\r\n');
}
export function gradeExport(rows){return rows.map(r=>({page:r.page,name:r.name,student_id:r.student_id,version:r.version,version_source:r.version_source,answers:r.questions.map(q=>['read','reviewed','reviewed_blank'].includes(q.status)?q.answer||'-':'?').join(' '),score_lower:r.score_lower,score_upper:r.score_upper,final_score:r.final_score,out_of:21,percent:r.final_score===null?null:100*r.final_score/21,status:r.status,flags:r.flags.join('; '),...Object.fromEntries(r.questions.map(q=>['q'+q.question,q.answer]))}));}
