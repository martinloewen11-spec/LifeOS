const STORAGE_KEY = "lifeos-data-v1";
const emptyData = { tasks: [], events: [], notes: [], routines: { morning: [], evening: [], custom: [] }, training: [], habits: [] };
let data = loadData();
window.lifeosData = data;
let currentRoutine = "morning";
let toastTimer;

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const result = saved ? { ...emptyData, ...saved, routines: { ...emptyData.routines, ...(saved.routines || {}) } } : structuredClone(emptyData);
    result.habits = (result.habits || []).map(h => ({ ...h, doneDates: Array.isArray(h.doneDates) ? h.doneDates : (h.doneDate ? [h.doneDate] : []), done: (Array.isArray(h.doneDates) ? h.doneDates : (h.doneDate ? [h.doneDate] : [])).includes(todayISO()) }));
    return result;
  } catch {
    return structuredClone(emptyData);
  }
}
function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { showToast("Speichern auf diesem Gerät nicht möglich."); }
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function showPage(page) {
  document.querySelectorAll(".page").forEach(el => el.classList.toggle("active", el.id === page));
  document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.page === page || (page !== "home" && page !== "tasks" && page !== "calendar" && page !== "routines") && el.dataset.page === "more"));
  if (page === "week") renderWeek();
  if (page === "stats") renderStats();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function empty(container, message) {
  container.innerHTML = '<div class="empty-state">' + escapeHTML(message) + '</div>';
}
function makeCard(title, meta, actions = "") {
  return '<article class="item-card"><div class="item-main"><p class="item-title">' + escapeHTML(title) + '</p>' +
    (meta ? '<p class="item-meta">' + escapeHTML(meta) + '</p>' : '') + '</div>' + actions + '</article>';
}
function renderTasks() {
  const list = document.getElementById("tasksList");
  const open = data.tasks.filter(t => !t.done);
  if (!data.tasks.length) empty(list, "Noch keine Aufgaben. Füge deine erste hinzu.");
  else list.innerHTML = data.tasks.map(t => '<article class="item-card ' + (t.done ? "done" : "") + '">' +
    '<button class="check-button ' + (t.done ? "checked" : "") + '" data-task-toggle="' + t.id + '" aria-label="Aufgabe erledigt">' + (t.done ? "✓" : "") + '</button>' +
    '<div class="item-main"><p class="item-title">' + escapeHTML(t.title) + '</p></div>' +
    '<button class="delete-button" data-delete="tasks" data-id="' + t.id + '" aria-label="Löschen">×</button></article>').join("");
  const home = document.getElementById("homeTasks");
  if (!open.length) empty(home, "Alles erledigt – oder noch nichts geplant.");
  else home.innerHTML = open.slice(0, 4).map(t => makeCard(t.title, "Offen")).join("");
}
function renderEvents() {
  const sorted = [...data.events].sort((a,b) => (a.date + (a.time || "" )).localeCompare(b.date + (b.time || "")));
  const list = document.getElementById("eventsList");
  if (!sorted.length) empty(list, "Noch keine Termine gespeichert.");
  else list.innerHTML = sorted.map(e => makeCard(e.title, new Date(e.date + "T00:00:00").toLocaleDateString("de-DE") + (e.time ? " · " + e.time : "") +
    ' <button class="delete-button" data-delete="events" data-id="' + e.id + '" aria-label="Löschen">×</button>')).join("");
  const upcoming = sorted.filter(e => e.date >= todayISO()).slice(0, 3);
  const home = document.getElementById("homeEvents");
  if (!upcoming.length) empty(home, "Keine kommenden Termine.");
  else home.innerHTML = upcoming.map(e => makeCard(e.title, new Date(e.date + "T00:00:00").toLocaleDateString("de-DE") + (e.time ? " · " + e.time : ""))).join("");
}
function renderNotes() {
  const list = document.getElementById("notesList");
  if (!data.notes.length) empty(list, "Deine gespeicherten Notizen erscheinen hier.");
  else list.innerHTML = [...data.notes].reverse().map(n => makeCard(n.title, n.text, '<button class="delete-button" data-delete="notes" data-id="' + n.id + '" aria-label="Löschen">×</button>')).join("");
}
function renderRoutines() {
  const list = document.getElementById("routinesList");
  const items = data.routines[currentRoutine] || [];
  if (!items.length) empty(list, "Noch keine Schritte in dieser Routine.");
  else list.innerHTML = items.map(r => '<article class="item-card ' + (r.done ? "done" : "") + '">' +
    '<button class="check-button ' + (r.done ? "checked" : "") + '" data-routine-toggle="' + r.id + '">' + (r.done ? "✓" : "") + '</button>' +
    '<div class="item-main"><p class="item-title">' + escapeHTML(r.title) + '</p></div>' +
    '<button class="delete-button" data-delete-routine="' + r.id + '" aria-label="Löschen">×</button></article>').join("");
}
function renderTraining() {
  const list = document.getElementById("trainingList");
  if (!data.training.length) empty(list, "Noch keine Trainingspläne gespeichert.");
  else list.innerHTML = [...data.training].reverse().map(t => makeCard(t.title, t.details, '<button class="delete-button" data-delete="training" data-id="' + t.id + '" aria-label="Löschen">×</button>')).join("");
}
function habitStreak(h) {
  const dates = [...new Set(h.doneDates || [])].sort();
  const hasToday = dates.includes(todayISO());
  const cursor = new Date((hasToday ? todayISO() : previousISO()) + "T00:00:00Z");
  let current = 0;
  while (dates.includes(cursor.toISOString().slice(0,10))) { current++; cursor.setUTCDate(cursor.getUTCDate()-1); }
  let best = 0, run = 0, previous = null;
  for (const date of dates) {
    const d = new Date(date + "T00:00:00Z");
    const gap = previous ? (d - previous) / 86400000 : 0;
    run = gap === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = d;
  }
  return { current, best, total: dates.length, hasToday };
}
function previousISO() {
  const d = new Date(); d.setDate(d.getDate()-1);
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function renderHabits() {
  const list = document.getElementById("habitsList");
  if (!data.habits.length) { empty(list, "Füge etwas hinzu, das du aufbauen oder bewusst reduzieren möchtest."); return; }
  list.innerHTML = data.habits.map(h => {
    h.doneDates = Array.isArray(h.doneDates) ? h.doneDates : [];
    const streak = habitStreak(h);
    const avoid = h.mode === "avoid";
    const milestone = streak.current >= 30 ? '<p class="streak-milestone">🏆 30-Tage-Meilenstein erreicht!</p>' : '';
    const todayLabel = streak.hasToday ? (avoid ? "Heute eingehalten" : "Heute erledigt") : (avoid ? "Heute noch nicht abgehakt" : "Heute noch offen");
    const actionLabel = avoid ? "Heute geschafft" : "Heute erledigt";
    return '<article class="habit-card">' +
      '<div class="habit-card-top"><div class="item-main"><p class="item-title">' + escapeHTML(h.title) + '</p><p class="item-meta">' + todayLabel + '</p></div>' +
      '<button class="check-button ' + (streak.hasToday ? "checked" : "") + '" data-habit-toggle="' + h.id + '" aria-label="' + actionLabel + '">' + (streak.hasToday ? "✓" : "") + '</button></div>' +
      '<div class="streak-stats"><div><strong>🔥 ' + streak.current + '</strong><small>' + (avoid ? "Tage am Stück" : "Tage in Folge") + '</small></div><div><strong>🏅 ' + streak.best + '</strong><small>Beste Serie</small></div><div><strong>' + streak.total + '</strong><small>Check-ins</small></div></div>' +
      '<div class="streak-track"><span style="width:' + Math.min(100,streak.current/30*100) + '%"></span></div>' + milestone +
      '<div class="habit-card-actions"><span class="item-meta">' + (streak.current ? (avoid ? "Ein Tag nach dem anderen." : "Weiter so – Schritt für Schritt.") : "Du kannst jederzeit neu anfangen.") + '</span><button class="text-button" data-habit-reset="' + h.id + '">Streak neu starten</button></div>' +
      '<button class="delete-button habit-delete" data-delete="habits" data-id="' + h.id + '" aria-label="Gewohnheit löschen">×</button></article>';
  }).join("");
}
function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function renderWeek() {
  const root = document.getElementById("weekList");
  const start = new Date();
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  root.innerHTML = Array.from({length:7}, (_,i) => {
    const d = new Date(start); d.setDate(start.getDate()+i);
    const iso = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
    const events = data.events.filter(e => e.date === iso);
    return '<div class="week-day"><h3>' + d.toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"2-digit"}) + '</h3>' +
      (events.length ? events.map(e => '<div class="week-event">' + escapeHTML(e.time ? e.time + " · " : "") + escapeHTML(e.title) + '</div>').join("") : '<p class="item-meta">Keine Termine</p>') + '</div>';
  }).join("");
}
function renderStats() {
  const done = data.tasks.filter(t => t.done).length;
  const root = document.getElementById("statsGrid");
  const values = [[data.tasks.length,"Aufgaben gesamt"],[done,"Erledigte Aufgaben"],[data.events.length,"Termine gespeichert"],[data.notes.length,"Notizen"],[data.training.length,"Trainingspläne"],[data.habits.length,"Gewohnheiten"]];
  root.innerHTML = values.map(v => '<div class="stat-card"><p class="stat-number">' + v[0] + '</p><p class="stat-label">' + v[1] + '</p></div>').join("");
}
function renderAll() {
  renderTasks(); renderEvents(); renderNotes(); renderRoutines(); renderTraining(); renderHabits(); renderWeek(); renderStats();
  window.lifeosData = data;
}
window.lifeosRefreshAll = renderAll;
window.lifeosSaveData = saveData;
function addItem(formId, inputId, collection, extra = {}) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById(inputId);
    const title = input.value.trim();
    if (!title) return;
    data[collection].push({ id: crypto.randomUUID(), title, ...extra() });
    saveData(); form.reset(); renderAll(); showToast("Gespeichert.");
  });
}
addItem("taskForm","taskInput","tasks");
document.getElementById("eventForm").addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("eventTitle").value.trim();
  const date = document.getElementById("eventDate").value;
  if (!title || !date) return;
  data.events.push({id:crypto.randomUUID(),title,date,time:document.getElementById("eventTime").value});
  saveData(); e.target.reset(); renderAll(); showToast("Termin gespeichert.");
});
document.getElementById("noteForm").addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("noteTitle").value.trim();
  if (!title) return;
  data.notes.push({id:crypto.randomUUID(),title,text:document.getElementById("noteText").value.trim()});
  saveData(); e.target.reset(); renderAll(); showToast("Notiz gespeichert.");
});
document.getElementById("routineForm").addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("routineInput");
  const title = input.value.trim(); if (!title) return;
  data.routines[currentRoutine].push({id:crypto.randomUUID(),title,done:false});
  saveData(); input.value=""; renderRoutines(); showToast("Schritt hinzugefügt.");
});
document.getElementById("trainingForm").addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("trainingName").value.trim();
  const details = document.getElementById("trainingExercises").value.trim();
  if (!title || !details) return;
  data.training.push({id:crypto.randomUUID(),title,details});
  saveData(); e.target.reset(); renderTraining(); renderStats(); showToast("Trainingsplan gespeichert.");
});
document.getElementById("habitForm").addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("habitInput").value.trim();
  if (!title) return;
  const mode = document.getElementById("habitType").value;
  data.habits.push({id:crypto.randomUUID(),title,mode,done:false,doneDates:[]});
  saveData(); e.target.reset(); renderHabits(); renderStats(); showToast("Gewohnheit gespeichert.");
});
document.addEventListener("click", e => {
  const pageButton = e.target.closest("[data-page]");
  if (pageButton) showPage(pageButton.dataset.page);
  const toggleTask = e.target.closest("[data-task-toggle]");
  if (toggleTask) { const item=data.tasks.find(t=>t.id===toggleTask.dataset.taskToggle); if(item)item.done=!item.done; saveData(); renderAll(); }
  const toggleRoutine = e.target.closest("[data-routine-toggle]");
  if (toggleRoutine) { const item=data.routines[currentRoutine].find(r=>r.id===toggleRoutine.dataset.routineToggle); if(item)item.done=!item.done; saveData(); renderRoutines(); }
  const toggleHabit = e.target.closest("[data-habit-toggle]");
  if (toggleHabit) { const item=data.habits.find(h=>h.id===toggleHabit.dataset.habitToggle); if(item){item.doneDates=Array.isArray(item.doneDates)?item.doneDates:[];const index=item.doneDates.indexOf(todayISO());if(index>=0)item.doneDates.splice(index,1);else item.doneDates.push(todayISO());item.done=item.doneDates.includes(todayISO());} saveData(); renderHabits(); renderStats(); }
  const resetHabit = e.target.closest("[data-habit-reset]");
  if (resetHabit) { const item=data.habits.find(h=>h.id===resetHabit.dataset.habitReset); if(item && window.confirm("Möchtest du die Streak-Aufzeichnung dieser Gewohnheit wirklich zurücksetzen?")){item.doneDates=[];item.done=false;item.doneDate=null;saveData();renderHabits();showToast("Neuer Start – deine Streak beginnt von vorn.");} }
  const del = e.target.closest("[data-delete]");
  if (del) { const key=del.dataset.delete; data[key]=data[key].filter(x=>x.id!==del.dataset.id); saveData(); renderAll(); showToast("Eintrag gelöscht."); }
  const delRoutine = e.target.closest("[data-delete-routine]");
  if (delRoutine) { data.routines[currentRoutine]=data.routines[currentRoutine].filter(x=>x.id!==delRoutine.dataset.deleteRoutine); saveData(); renderRoutines(); }
  const routineTab = e.target.closest("[data-routine]");
  if (routineTab) { currentRoutine=routineTab.dataset.routine; document.querySelectorAll("[data-routine]").forEach(b=>b.classList.toggle("selected",b===routineTab)); renderRoutines(); }
});
document.getElementById("quickAdd").addEventListener("click", () => {
  const choice = window.prompt("Was möchtest du hinzufügen?\n1 = Aufgabe\n2 = Termin\n3 = Notiz");
  if (choice === "1") showPage("tasks");
  else if (choice === "2") showPage("calendar");
  else if (choice === "3") showPage("notes");
});
document.getElementById("dateLine").textContent = new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"});
document.getElementById("eventDate").value = todayISO();
renderAll();