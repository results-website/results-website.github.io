(() => {
  'use strict';
  const data=window.MIDTERM_REPORT;
  if(!data||data.schema!=='ecs174-professor-report-v1')return;
  const $=selector=>document.querySelector(selector);
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const format=(value,digits=2)=>value==null?'—':Number(value).toFixed(digits);
  const percent=value=>value==null?'—':format(value,1)+'%';
  const letters=[...'ABCDEFGH'];
  let selectedQuestion=1,activeTab='overview';
  const gradeFilters={search:'',version:'all',match:'all',sort:'roster'};
  let printFilters=null;

  function showTab(name){
    activeTab=name;
    for(const section of ['overview','questions','grades','roster','methods']){
      $('#'+section+'-section').hidden=section!==name;
      $(`[data-tab="${section}"]`).classList.toggle('active',section===name);
    }
  }

  function renderOverview(){
    const s=data.summary;
    $('#snapshot').textContent='Updated grades + official roster · '+new Date(data.generated_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})+' · '+s.n+' exams';
    const cards=[
      [s.n,'Students included','All answer sets resolved'],
      [format(s.mean)+' <small>/ 21</small>','Mean score',percent(s.mean_percent)+' average'],
      [format(s.median)+' <small>/ 21</small>','Median score','Middle of the score distribution'],
      [format(s.sd),'Standard deviation','Sample SD · n − 1'],
      [format(s.kr20,3),'KR-20 / Cronbach’s α','All 21 questions included']
    ];
    $('#metrics').innerHTML=cards.map(([value,label,note])=>`<div class="metric"><div class="metric-value">${value}</div><div class="metric-label">${label}</div><div class="metric-note">${note}</div></div>`).join('');
    $('#score-range').textContent=`Range ${s.min}–${s.max} / 21`;
    const maximum=Math.max(...data.histogram.map(bin=>bin.count),1);
    $('#histogram').innerHTML=data.histogram.map(bin=>`<div class="hist-bin" title="${bin.score} points: ${bin.count} students"><div class="hist-bar" style="height:${100*bin.count/maximum}%">${bin.count?`<span class="hist-count">${bin.count}</span>`:''}</div><span class="hist-label">${bin.score}</span></div>`).join('');
    $('#histogram').setAttribute('role','img');
    $('#histogram').setAttribute('aria-label',data.histogram.map(bin=>`${bin.score} points: ${bin.count} students`).join('; '));
    $('#quartiles').innerHTML=`<span>25th percentile <strong>${format(s.q1,0)}</strong></span><span>Median <strong>${format(s.median,0)}</strong></span><span>75th percentile <strong>${format(s.q3,0)}</strong></span>`;
    $('#topics').innerHTML=data.topics.map(topic=>`<div class="bar-heading"><span>${escape(topic.topic)}</span><strong>${percent(topic.percent_correct)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${topic.percent_correct}%"></div></div>`).join('');
    $('#most-missed').innerHTML=[...data.questions].sort((a,b)=>a.percent_correct-b.percent_correct).slice(0,3).map(q=>`<button class="missed-item" data-question="${q.number}"><span><span class="question-number">Q${q.number}</span>${escape(q.title)}<small>${q.n-q.correct} of ${q.n} answered incorrectly</small></span><span class="missed-pct">${percent(q.percent_correct)}<small>correct</small></span></button>`).join('');
    $('#version-table').innerHTML='<thead><tr><th>Version</th><th>N</th><th>Mean / 21</th><th>Median</th><th>Sample SD</th></tr></thead><tbody>'+data.versions.map(v=>`<tr><td>${v.version}</td><td>${v.n}</td><td>${format(v.mean)}</td><td>${format(v.median)}</td><td>${format(v.sd)}</td></tr>`).join('')+'</tbody>';
  }

  function renderQuestions(){
    const order=$('#question-sort').value;
    const questions=[...data.questions].sort((a,b)=>order==='hardest'?a.mean-b.mean:order==='discrimination'?(b.corrected_item_total??-2)-(a.corrected_item_total??-2):a.number-b.number);
    $('#questions-table').innerHTML='<thead><tr><th>Question</th><th>N</th><th>Correct</th><th>Mean (0–1)</th><th>Sample SD</th><th>Item–rest r</th><th>Blank</th></tr></thead><tbody>'+questions.map(q=>`<tr><td><button class="table-link" data-question="${q.number}"><strong>Q${q.number}</strong> · ${escape(q.title)} ↗</button></td><td class="number">${q.n}</td><td class="number">${percent(q.percent_correct)}</td><td class="number">${format(q.mean,3)}</td><td class="number">${format(q.sd,3)}</td><td class="number ${q.corrected_item_total<0?'negative':''}">${format(q.corrected_item_total,3)}</td><td class="number">${q.blank}</td></tr>`).join('')+'</tbody>';
  }

  function renderRoster(){
    const roster=data.roster,s=roster.summary;
    const cards=[[s.roster_students,'Students on roster'],[s.matched_exams,'One-to-one exam matches'],[s.roster_without_exam,'Roster records without an exam'],[s.auditors,'Auditor included in statistics']];
    $('#roster-metrics').innerHTML=cards.map(([value,label])=>`<div class="metric"><div class="metric-value">${value}</div><div class="metric-label">${label}</div></div>`).join('');
    $('#auditors-table').innerHTML='<thead><tr><th>Page</th><th>Name on exam</th><th>Written / transcribed ID</th><th>Score / 21</th><th>Version</th></tr></thead><tbody>'+roster.auditors.map(s=>`<tr><td>${s.page}</td><td><button class="table-link" data-student="${s.page}">${escape(s.name)} ↗</button></td><td>${escape(s.student_id)}</td><td>${s.score}</td><td>${s.version}</td></tr>`).join('')+'</tbody>';
    $('#no-exam-table').innerHTML='<thead><tr><th>Official roster name</th><th>SIS student ID</th><th>Grade</th></tr></thead><tbody>'+roster.students.filter(r=>r.match_status==='no_exam_record').map(r=>`<tr><td>${escape(r.roster_name)}</td><td>${r.student_id}</td><td>Not assigned</td></tr>`).join('')+'</tbody>';
    const filter=$('#roster-filter').value;
    $('#roster-table').innerHTML='<thead><tr><th>Roster #</th><th>Official roster name</th><th>SIS student ID</th><th>Exam page</th><th>Score / 21</th><th>Match</th></tr></thead><tbody>'+roster.students.filter(r=>filter==='all'||r.match_status===filter).map(r=>`<tr><td>${r.roster_order}</td><td>${escape(r.roster_name)}</td><td>${r.student_id}</td><td>${r.page===null?'—':r.page}</td><td>${r.score===null?'—':r.score}</td><td class="${r.match_status==='matched'?'match-ok':'muted'}">${r.match_status==='matched'?'Matched':'No exam record'}</td></tr>`).join('')+'</tbody>';
    const summary=roster.matched_score_summary;
    $('#matched-score-summary').textContent=`${summary.n} matched roster scores: mean ${format(summary.mean)}/21; median ${format(summary.median)}; sample SD ${format(summary.sd)}. Overall exam analysis includes all ${data.students.length} exams.`;
  }

  function renderQuestionDetail(){
    const q=data.questions[selectedQuestion-1];
    const maximum=Math.max(...Object.values(q.distribution),q.blank,1);
    const choices=letters.map(letter=>({letter,text:q.options[letter],count:q.distribution[letter],correct:letter===q.canonical_correct}));
    choices.push({letter:'—',text:'Reviewed blank',count:q.blank,correct:false});
    $('#question-detail').innerHTML=`<p class="eyebrow">RESPONSE DISTRIBUTION · ${q.n} STUDENTS</p><h2>Q${q.number} · ${escape(q.title)}</h2><p class="context">${escape(q.reason)}</p><div class="answer-key">${Object.entries(q.correct_options).map(([version,answer])=>`<span>${version} key: <strong>${answer}</strong></span>`).join('')}</div>${choices.map(choice=>`<div class="distractor"><div class="distractor-label"><span><strong>${choice.letter}${choice.correct?' ✓':''}</strong> · ${escape(choice.text)}</span><strong>${choice.count} <span class="muted">(${percent(100*choice.count/q.n)})</span></strong></div><div class="bar-track"><div class="bar-fill ${choice.correct?'correct':''}" style="width:${100*choice.count/maximum}%"></div></div></div>`).join('')}<p class="muted small">Options are aligned by their content across versions. A–H labels above refer to V0; green identifies the correct answer.</p>`;
  }

  function filteredStudents(){
    const query=gradeFilters.search.trim().toLocaleLowerCase();
    return data.students.filter(s=>(gradeFilters.version==='all'||s.version===gradeFilters.version)&&(gradeFilters.match==='all'||s.match_status===gradeFilters.match)&&(!query||`${s.name} ${s.roster_name} ${s.student_id} ${s.page} ${s.source_name} ${s.source_student_id}`.toLocaleLowerCase().includes(query))).sort((a,b)=>gradeFilters.sort==='highest'?b.score-a.score||a.name.localeCompare(b.name):gradeFilters.sort==='lowest'?a.score-b.score||a.name.localeCompare(b.name):gradeFilters.sort==='page'?a.page-b.page:gradeFilters.sort==='roster'?a.roster_order-b.roster_order:a.name.localeCompare(b.name));
  }

  function renderGrades(){
    const students=filteredStudents();
    $('#grade-count').textContent=`${students.length} / ${data.students.length} students`;
    $('#grades-table').innerHTML='<thead><tr><th>Page</th><th>Student · roster identity</th><th>Student ID</th><th>Version</th><th>Score / 21</th><th>Percentage</th></tr></thead><tbody>'+(students.length?students.map(s=>`<tr><td class="number">${s.page}</td><td><button class="table-link" data-student="${s.page}">${escape(s.name)} ↗</button>${s.match_status==='auditor'?'<br><span class="roster-flag auditor">Auditor</span>':s.match_status==='unmatched'?'<br><span class="roster-flag">No roster match</span>':''}</td><td class="number">${escape(s.student_id||'—')}</td><td>${s.version}</td><td class="score-cell number">${s.score} <span class="muted">/ 21</span></td><td class="number">${percent(s.percent)}<div class="percent-track"><span style="width:${s.percent}%"></span></div></td></tr>`).join(''):'<tr><td class="empty" colspan="6">No matching student records.</td></tr>')+'</tbody>';
  }

  function showStudent(page){
    const s=data.students.find(student=>student.page===page);
    if(!s)return;
    $('#student-title').textContent=s.name;
    $('#student-result').innerHTML=`<div class="student-summary"><span class="student-score">${s.score}<small> / 21</small></span><strong>${percent(s.percent)}</strong><span>${s.version} · scan page ${s.page}</span><span>ID: ${escape(s.student_id||'Not provided')}</span></div>${s.match_status==='auditor'?'<p class="roster-flag auditor">Auditor · included in the score distribution and all exam statistics.</p>':s.match_status==='unmatched'?'<p class="roster-flag">This exam has no match in the supplied roster.</p>':''}<div class="response-grid">${s.answers.map((answer,i)=>`<div class="response ${s.points[i]?'':'wrong'}"><div class="response-q">Q${i+1}</div><div class="response-answer">${escape(answer||'—')} ${s.points[i]?'✓':'×'}</div><div class="response-key">Key: ${data.questions[i].correct_options[s.version]} · ${s.points[i]} / 1</div></div>`).join('')}</div><p class="muted small">A dash means a reviewed blank response. Every question, including Q15, counts for one point.</p><details class="identity-details"><summary>Roster match details</summary><p>${escape(s.match_note)}</p><p>Original grade-sheet name: ${escape(s.source_name)}<br>Original transcribed ID: ${escape(s.source_student_id||'Not provided')}</p></details>`;
    $('#student-dialog').showModal();
  }

  function csvText(rows,fields){
    const cell=value=>{let text=value==null?'':String(value);if(typeof value!=='number'&&/^[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
    return '\ufeff'+[fields.map(cell).join(','),...rows.map(row=>fields.map(key=>cell(row[key])).join(','))].join('\r\n');
  }

  function download(name,body,type){
    const url=URL.createObjectURL(new Blob([body],{type}));
    const link=document.createElement('a');link.href=url;link.download=name;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }

  function exportGrades(matchedOnly=false){
    const rows=data.students.filter(s=>!matchedOnly||s.match_status==='matched').map(s=>({...s,answers:s.answers.map(a=>a||'-').join(' '),...Object.fromEntries(s.answers.map((answer,i)=>['q'+(i+1),answer]))}));
    download(matchedOnly?'ECS174-midterm-roster-matched-grades.csv':'ECS174-midterm-grades.csv',csvText(rows,['page','name','student_id','roster_name','match_status','enrollment_status','match_method','version','score','out_of','percent','answers','source_name','source_student_id',...Array.from({length:21},(_,i)=>'q'+(i+1))]),'text/csv;charset=utf-8');
  }

  function exportQuestions(){
    download('ECS174-midterm-question-statistics.csv',csvText(data.questions,['number','title','topic','n','correct','mean','sd','percent_correct','corrected_item_total','blank']),'text/csv;charset=utf-8');
  }

  function exportRoster(audit=false){
    const rows=audit?data.roster.matches:data.roster.students;
    const fields=audit?['page','source_name','source_student_id','roster_name','matched_name','roster_student_id','match_method','match_note','score']:['roster_order','roster_name','name','student_id','match_status','page','score','out_of','percent','version','match_method'];
    download(audit?'ECS174-roster-match-audit.csv':'ECS174-roster-reconciliation.csv',csvText(rows,fields),'text/csv;charset=utf-8');
  }

  $('#methods').innerHTML=data.methodology.map(text=>'<li>'+escape(text)+'</li>').join('');
  $('#source').innerHTML=`<p><strong>Grades:</strong> ${escape(data.source.filename)} · ${data.source.table_rows} exam records</p><p><strong>Roster:</strong> ${escape(data.roster.source_filename)} · ${data.roster.summary.roster_students} students</p><p><strong>Grade source SHA-256:</strong><br><code>${data.source.sha256}</code></p><p><strong>Roster source SHA-256:</strong><br><code>${data.roster.source_sha256}</code></p>`;
  $('#question-sort').addEventListener('change',renderQuestions);
  $('#grade-search').addEventListener('input',event=>{gradeFilters.search=event.target.value;renderGrades();});
  $('#grade-version').addEventListener('change',event=>{gradeFilters.version=event.target.value;renderGrades();});
  $('#grade-match').addEventListener('change',event=>{gradeFilters.match=event.target.value;renderGrades();});
  $('#grade-sort').addEventListener('change',event=>{gradeFilters.sort=event.target.value;renderGrades();});
  $('#roster-filter').addEventListener('change',renderRoster);
  $('#close-student').addEventListener('click',()=>$('#student-dialog').close());
  $('#print-report').addEventListener('click',()=>window.print());
  window.addEventListener('beforeprint',()=>{printFilters={...gradeFilters};Object.assign(gradeFilters,{search:'',version:'all',match:'all',sort:'page'});renderGrades();});
  window.addEventListener('afterprint',()=>{if(printFilters){Object.assign(gradeFilters,printFilters);printFilters=null;renderGrades();}});
  document.addEventListener('click',event=>{
    const button=event.target.closest('button,a');
    if(!button)return;
    if(button.dataset.tab)showTab(button.dataset.tab);
    if(button.dataset.question){selectedQuestion=Number(button.dataset.question);showTab('questions');renderQuestionDetail();$('#question-detail').scrollIntoView({behavior:'smooth',block:'start'});}
    if(button.dataset.student)showStudent(Number(button.dataset.student));
    if(button.matches('a[download][href="grades.csv"]')){event.preventDefault();exportGrades();}
    if(button.matches('a[download][href="question-statistics.csv"]')){event.preventDefault();exportQuestions();}
    if(button.matches('a[download][href="matched-grades.csv"]')){event.preventDefault();exportGrades(true);}
    if(button.matches('a[download][href="roster-reconciliation.csv"]')){event.preventDefault();exportRoster();}
    if(button.matches('a[download][href="roster-matches.csv"]')){event.preventDefault();exportRoster(true);}
    if(button.matches('a[download][href="report.html"]')&&window.MIDTERM_OFFLINE){event.preventDefault();download('ECS174-midterm-report.html','<!doctype html>'+document.documentElement.outerHTML,'text/html;charset=utf-8');}
  });
  renderOverview();renderQuestions();renderQuestionDetail();renderGrades();renderRoster();
})();
