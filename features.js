
/* Zusätzliche LifeOS-Funktionen – getrennt gespeichert, damit bestehende Einträge erhalten bleiben. */
(() => {
 const KEY="lifeos-features-v1";
 const defaults={journal:[],projects:[],countdowns:[],theme:"light",quoteIndex:0,habitHistory:{}};
 let extra; try{extra={...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{extra={...defaults}}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(extra))}catch{toast("Speichern nicht möglich.")}};
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const toast=m=>{const el=$("toast");if(!el)return;el.textContent=m;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2100)};
 const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
 const quotes=["Beginne dort, wo du bist. Nutze, was du hast. Tu, was du kannst.","Kleine Schritte bringen dich ebenfalls voran.","Klarheit entsteht oft, wenn du einfach anfängst.","Konzentriere dich auf den nächsten sinnvollen Schritt.","Fortschritt muss nicht perfekt aussehen.","Gute Gewohnheiten wachsen durch Wiederholung.","Du musst nicht alles heute schaffen.","Ein guter Plan lässt Raum für Pausen."];
 const setTheme=t=>{document.body.classList.remove("theme-dark","theme-lavender");if(t==="dark")document.body.classList.add("theme-dark");if(t==="lavender")document.body.classList.add("theme-lavender");extra.theme=t;save()};
 setTheme(extra.theme);
 function renderQuote(){ $("dailyQuoteText").textContent=quotes[extra.quoteIndex%quotes.length] }
 function renderDay(){
  const tasks=window.lifeosData?.tasks||[];
  const events=window.lifeosData?.events||[];
  const routines=window.lifeosData?.routines||{};
  const todayEvents=events.filter(e=>e.date===today()).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  const open=tasks.filter(t=>!t.done);
  const routineItems=[...(routines.morning||[]),...(routines.evening||[]),...(routines.custom||[])].filter(x=>!x.done);
  const root=$("dayPlanContent");
  const sections=[["Termine heute",todayEvents.map(e=>(e.time?e.time+" · ":"")+e.title)],["Offene Aufgaben",open.slice(0,8).map(t=>t.title)],["Offene Routinen",routineItems.slice(0,8).map(r=>r.title)]];
  root.innerHTML=sections.map(([h,items])=>'<div class="form-card"><b>'+h+'</b>'+(items.length?items.map(x=>'<div class="week-event">'+esc(x)+'</div>').join(""):'<p class="item-meta">Nichts offen.</p>')+'</div>').join("");
 }
 function renderBriefing(){
  const tasks=window.lifeosData?.tasks||[],events=window.lifeosData?.events||[];
  const todays=events.filter(e=>e.date===today()).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  const open=tasks.filter(t=>!t.done);
  $("briefingContent").innerHTML='<div class="form-card"><b>'+new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})+'</b><p class="item-meta">Du hast '+open.length+' offene Aufgaben und '+todays.length+' Termine heute.</p></div><div class="form-card"><b>Deine Termine</b>'+(todays.length?todays.map(e=>'<p class="week-event">'+esc(e.time?e.time+" · ":"")+esc(e.title)+'</p>').join(""):'<p class="item-meta">Keine Termine für heute eingetragen.</p>')+'</div><div class="form-card"><b>Ein guter nächster Schritt</b>'+(open.length?'<p>'+esc(open[0].title)+'</p>':'<p class="item-meta">Lege eine Aufgabe fest, wenn du möchtest.</p>')+'</div><button class="secondary-button" id="briefingQuote">Tageszitat ansehen</button>';
  $("briefingQuote").onclick=()=>{renderQuote();document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="quote"))};
 }
 function renderJournal(){const root=$("journalList");root.innerHTML=extra.journal.length?[...extra.journal].reverse().map(j=>'<article class="item-card"><div class="item-main"><p class="item-title">'+esc(j.date)+' · '+esc(j.mood)+'</p><p class="item-meta">'+esc(j.text)+'</p></div><button class="delete-button" data-journal-delete="'+j.id+'">×</button></article>').join(""):'<div class="empty-state">Noch keine Tagebucheinträge.</div>'}
 function renderProjects(){const root=$("projectList");root.innerHTML=extra.projects.length?extra.projects.map(p=>{const done=p.steps.filter(s=>s.done).length,percent=p.steps.length?Math.round(done/p.steps.length*100):0;return '<article class="item-card"><div class="item-main"><p class="item-title">'+esc(p.name)+'</p><p class="item-meta">'+esc(p.description||"Projekt")+'</p><p class="project-progress">'+done+'/'+p.steps.length+' Schritte · '+percent+'%</p><div class="progress-track"><span style="width:'+percent+'%"></span></div>'+p.steps.map(s=>'<div class="project-step"><button class="check-button '+(s.done?'checked':'')+'" data-step="'+p.id+':'+s.id+'">'+(s.done?'✓':'')+'</button><span class="item-meta">'+esc(s.title)+'</span></div>').join("")+'<form class="project-step" data-step-form="'+p.id+'"><input maxlength="100" placeholder="Nächster Schritt" required><button class="secondary-button">+</button></form></div><button class="delete-button" data-project-delete="'+p.id+'">×</button></article>'}).join(""):'<div class="empty-state">Erstelle dein erstes Projekt.</div>'}
 function renderCountdowns(){const root=$("countdownList");root.innerHTML=extra.countdowns.length?[...extra.countdowns].sort((a,b)=>a.date.localeCompare(b.date)).map(c=>{const diff=Math.ceil((new Date(c.date+"T00:00:00")-new Date(today()+"T00:00:00"))/86400000);let label=diff<0?"Vor "+Math.abs(diff)+" Tagen":diff===0?"Heute": "Noch "+diff+" Tage";return '<article class="item-card"><div class="item-main"><p class="item-title">'+esc(c.name)+'</p><p class="item-meta">'+esc(new Date(c.date+"T00:00:00").toLocaleDateString("de-DE"))+' · '+label+'</p></div><button class="delete-button" data-countdown-delete="'+c.id+'">×</button></article>'}).join(""):'<div class="empty-state">Noch keine Countdowns angelegt.</div>'}
 const workoutPlans={
  full:[["Kniebeugen","2–3 Sätze · 8–12 Wiederholungen"],["Liegestütze (angepasst möglich)","2–3 Sätze · 6–12 Wiederholungen"],["Rudern mit leichtem Gewicht oder Band","2–3 Sätze · 8–12 Wiederholungen"],["Glute Bridge","2–3 Sätze · 10–15 Wiederholungen"],["Dead Bug","2 Sätze · 6–10 je Seite"]],
  upper:[["Liegestütze","2–3 Sätze · 6–12 Wiederholungen"],["Rudern mit Band oder leichtem Gewicht","2–3 Sätze · 8–12 Wiederholungen"],["Schulterdrücken leicht","2 Sätze · 8–12 Wiederholungen"],["Bizeps-Curls leicht","2 Sätze · 10–12 Wiederholungen"],["Trizepsdrücken mit Band","2 Sätze · 10–12 Wiederholungen"]],
  lower:[["Kniebeugen","2–3 Sätze · 8–12 Wiederholungen"],["Ausfallschritte","2 Sätze · 6–10 je Seite"],["Glute Bridge","2–3 Sätze · 10–15 Wiederholungen"],["Wadenheben","2 Sätze · 12–15 Wiederholungen"],["Bird Dog","2 Sätze · 8 je Seite"]],
  mobility:[["Cat-Cow","2 Runden · 8 Wiederholungen"],["Bird Dog","2 Sätze · 8 je Seite"],["Dead Bug","2 Sätze · 8 je Seite"],["Hüftmobilisation","2 Runden · ruhig und kontrolliert"],["Sanfte Brustwirbel-Rotation","2 Runden · je Seite"]]
 };
 $("generateWorkout").addEventListener("click",()=>{const type=$("workoutType").value,level=$("workoutLevel").value;const plan=workoutPlans[type];$("workoutResult").innerHTML='<div class="form-card"><b>Dein Vorschlag</b><p class="item-meta">'+(level==="beginner"?"Starte mit 2 Sätzen und lerne die Bewegungen ruhig und sauber.":"Passe die Satzanzahl an deine Erfahrung und Erholung an.")+' Plane Pausen ein und beende eine Übung, wenn sie Schmerzen verursacht.</p>'+plan.map((x,i)=>'<div class="week-event"><b>'+(i+1)+'. '+x[0]+'</b><p class="item-meta">'+(level==="beginner"?x[1].replace("2–3","2"):x[1])+'</p></div>').join("")+'<button class="primary-button full-button" id="saveGeneratedWorkout">In Trainingspläne übernehmen</button></div>';$("saveGeneratedWorkout").onclick=()=>{const form=document.createElement("form");form.id="trainingForm";const title="LifeOS "+$("workoutType").selectedOptions[0].text;const details=plan.map(x=>x[0]+" – "+x[1]).join("\n");const saved=JSON.parse(localStorage.getItem("lifeos-data-v1")||"{}");saved.training=saved.training||[];saved.training.push({id:crypto.randomUUID(),title,details});localStorage.setItem("lifeos-data-v1",JSON.stringify(saved));toast("Trainingsplan gespeichert. Öffne Training, um ihn zu sehen.")}});
 let focusInterval=null,remaining=25*60,running=false;
 function drawClock(){$("focusClock").textContent=String(Math.floor(remaining/60)).padStart(2,"0")+":"+String(remaining%60).padStart(2,"0")}
 $("focusMinutes").addEventListener("change",()=>{if(!running){remaining=Number($("focusMinutes").value)*60;drawClock()}});
 $("focusStart").addEventListener("click",()=>{if(running){clearInterval(focusInterval);running=false;$("focusStart").textContent="Weiter";$("focusStatus").textContent="Pausiert.";return}if(remaining<=0)remaining=Number($("focusMinutes").value)*60;running=true;$("focusStart").textContent="Pause";$("focusStatus").textContent="Fokus läuft – bleib bei deinem Schritt.";focusInterval=setInterval(()=>{remaining--;drawClock();if(remaining<=0){clearInterval(focusInterval);running=false;$("focusStart").textContent="Start";$("focusStatus").textContent="Fokuszeit beendet. Gönn dir eine Pause.";toast("Fokuszeit geschafft.")}},1000)});
 $("focusReset").addEventListener("click",()=>{clearInterval(focusInterval);running=false;remaining=Number($("focusMinutes").value)*60;drawClock();$("focusStart").textContent="Start";$("focusStatus").textContent="Bereit, wenn du es bist."});drawClock();
 $("journalForm").addEventListener("submit",e=>{e.preventDefault();extra.journal.push({id:crypto.randomUUID(),date:today(),mood:$("journalMood").value,text:$("journalText").value.trim()});save();e.target.reset();renderJournal();toast("Tagebucheintrag gespeichert.")});
 $("projectForm").addEventListener("submit",e=>{e.preventDefault();extra.projects.push({id:crypto.randomUUID(),name:$("projectName").value.trim(),description:$("projectDescription").value.trim(),steps:[]});save();e.target.reset();renderProjects();toast("Projekt erstellt.")});
 $("projectList").addEventListener("submit",e=>{const f=e.target.closest("[data-step-form]");if(!f)return;e.preventDefault();const p=extra.projects.find(x=>x.id===f.dataset.stepForm);const title=f.querySelector("input").value.trim();if(p&&title){p.steps.push({id:crypto.randomUUID(),title,done:false});save();renderProjects()}});
 $("countdownForm").addEventListener("submit",e=>{e.preventDefault();extra.countdowns.push({id:crypto.randomUUID(),name:$("countdownName").value.trim(),date:$("countdownDate").value});save();e.target.reset();renderCountdowns();toast("Countdown hinzugefügt.")});
 $("newQuote").addEventListener("click",()=>{extra.quoteIndex=(extra.quoteIndex+1)%quotes.length;save();renderQuote()});
 $("refreshDayPlan").addEventListener("click",renderDay);
 document.querySelectorAll("[data-theme-choice]").forEach(b=>b.addEventListener("click",()=>{setTheme(b.dataset.themeChoice);toast("Design geändert.")}));
 document.addEventListener("click",e=>{const jd=e.target.closest("[data-journal-delete]");if(jd){extra.journal=extra.journal.filter(x=>x.id!==jd.dataset.journalDelete);save();renderJournal()}const pd=e.target.closest("[data-project-delete]");if(pd){extra.projects=extra.projects.filter(x=>x.id!==pd.dataset.projectDelete);save();renderProjects()}const cd=e.target.closest("[data-countdown-delete]");if(cd){extra.countdowns=extra.countdowns.filter(x=>x.id!==cd.dataset.countdownDelete);save();renderCountdowns()}const st=e.target.closest("[data-step]");if(st){const [pid,sid]=st.dataset.step.split(":");const p=extra.projects.find(x=>x.id===pid),s=p?.steps.find(x=>x.id===sid);if(s)s.done=!s.done;save();renderProjects()}});
 renderQuote();renderJournal();renderProjects();renderCountdowns();
 window.addEventListener("pageshow",()=>{renderDay();renderBriefing()});
 document.addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b&&["dayplan","briefing"].includes(b.dataset.page)){setTimeout(()=>{renderDay();renderBriefing()},0)}});
 window.lifeosRefreshFeatures=()=>{renderDay();renderBriefing()};
})();
