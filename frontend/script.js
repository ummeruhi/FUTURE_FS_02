const API = "http://localhost:5000";

/* =========================
   UTIL
========================= */
function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function nowTime(){
  const d = new Date();
  return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

/* =========================
   THEME
========================= */
function applyThemeFromStorage(){
  const t = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", t);
  document.getElementById("themeToggle").textContent = (t === "dark") ? "☀️" : "🌙";
}
function toggleTheme(){
  const curr = document.documentElement.getAttribute("data-theme") || "light";
  const next = (curr === "dark") ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyThemeFromStorage();
}

/* =========================
   MOBILE SIDEBAR
========================= */
function openSidebarMobile(){
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.remove("hidden");
}
function closeSidebarMobile(){
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.add("hidden");
}

/* =========================
   TOAST
========================= */
function toast(message, type="success"){
  const wrap = document.getElementById("toastWrap");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `
    <div class="toast-row">
      <div class="toast-msg">${escapeHTML(message)}</div>
      <div class="toast-x" onclick="this.parentElement.parentElement.remove()">✕</div>
    </div>
    <div class="toast-bar"></div>
  `;
  wrap.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 250);
  }, 2800);
}

/* =========================
   NAV / TABS
========================= */
function setActive(tab){
  ["tabDashboard","tabLeads","tabPipeline"].forEach(id => document.getElementById(id).classList.remove("active"));
  if(tab === "dashboard") document.getElementById("tabDashboard").classList.add("active");
  if(tab === "leads") document.getElementById("tabLeads").classList.add("active");
  if(tab === "pipeline") document.getElementById("tabPipeline").classList.add("active");
}

function showSection(which){
  const dash = document.getElementById("sectionDashboard");
  const leads = document.getElementById("sectionLeads");
  const pipe = document.getElementById("sectionPipeline");
  const title = document.getElementById("pageTitle");
  const note = document.getElementById("softNote");

  dash.classList.add("hidden");
  leads.classList.add("hidden");
  pipe.classList.add("hidden");

  if(which === "dashboard"){
    dash.classList.remove("hidden");
    setActive("dashboard");
    title.textContent = "Dashboard";
    note.textContent = "Insights, pipeline & activity";
    loadAnalytics();
    renderTimeline();
    renderTopLeads();
  }

  if(which === "leads"){
    leads.classList.remove("hidden");
    setActive("leads");
    title.textContent = "Leads";
    note.textContent = "Manage pipeline + bulk actions";
    closeLeadForm();
    loadLeads();
  }

  if(which === "pipeline"){
    pipe.classList.remove("hidden");
    setActive("pipeline");
    title.textContent = "Pipeline";
    note.textContent = "Drag & drop Kanban";
    loadLeads();
  }

  closeSidebarMobile();
}

/* =========================
   USER
========================= */
function loadUsername(){
  const raw = localStorage.getItem("admin");
  let name = "User";
  try{
    const obj = JSON.parse(raw);
    if(obj?.username) name = obj.username;
    if(typeof raw === "string" && raw && !obj?.username) name = raw;
  }catch(e){}
  document.getElementById("navUsername").textContent = name;
}
function logout(){
  localStorage.removeItem("admin");
  window.location.href = "login.html";
}

/* =========================
   ACTIVITY LOG (LOCAL)
========================= */
const ACT_KEY = "activity_log_v1";
function getActivity(){
  try{
    const arr = JSON.parse(localStorage.getItem(ACT_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function pushActivity(action, lead){
  const item = {
    t: Date.now(),
    time: nowTime(),
    action,
    leadId: lead?.id ?? null,
    name: lead?.name ?? "",
    status: lead?.status ?? ""
  };
  const list = [item, ...getActivity()].slice(0, 60);
  localStorage.setItem(ACT_KEY, JSON.stringify(list));
  renderTimeline();
}
function clearActivity(){
  localStorage.removeItem(ACT_KEY);
  renderTimeline();
}
function renderTimeline(){
  const wrap = document.getElementById("timeline");
  if(!wrap) return;
  const items = getActivity();
  if(items.length === 0){
    wrap.innerHTML = `<div class="empty-block">No activity yet. Try adding a lead, updating status, or saving notes.</div>`;
    return;
  }
  wrap.innerHTML = items.map(it => `
    <div class="tl-item">
      <div class="tl-dot"></div>
      <div class="tl-main">
        <div class="tl-line">
          <span class="tl-action">${escapeHTML(it.action)}</span>
          <span class="tl-time">${escapeHTML(it.time)}</span>
        </div>
        <div class="tl-sub">
          ${it.name ? `<b>${escapeHTML(it.name)}</b>` : `<span class="muted">—</span>`}
          ${it.status ? `<span class="chip">${escapeHTML(it.status)}</span>` : ""}
        </div>
      </div>
    </div>
  `).join("");
}

/* =========================
   SCORING (NO TAGS)
========================= */
function scoreLead(lead){
  let score = 0;
  const status = (lead.status || "new");

  if(status === "new") score += 40;
  if(status === "contacted") score += 60;
  if(status === "converted") score += 90;

  if(lead.email) score += 6;
  if(lead.phone) score += 10;

  // notes boost (DB notes if present)
  if((lead.notes || "").trim().length >= 20) score += 6;

  // recency boost (optional)
  const ca = lead.created_at || lead.createdAt;
  if(ca){
    const ts = new Date(ca).getTime();
    if(!Number.isNaN(ts)){
      const days = (Date.now() - ts) / (1000*60*60*24);
      if(days <= 3) score += 10;
      else if(days <= 7) score += 6;
      else if(days <= 30) score += 2;
    }
  }

  return clamp(Math.round(score), 0, 100);
}
function scoreLabel(score){
  if(score >= 85) return "Hot";
  if(score >= 60) return "Warm";
  return "Cold";
}
function scoreClass(score){
  if(score >= 85) return "score-hot";
  if(score >= 60) return "score-warm";
  return "score-cold";
}

/* =========================
   SIDEBAR COLLAPSE (DESKTOP)
========================= */
function applySidebarState(){
  const collapsed = localStorage.getItem("nav_collapsed") === "1";
  const app = document.querySelector(".app");
  const sidebar = document.querySelector(".sidebar");
  if(!app || !sidebar) return;
  app.classList.toggle("nav-collapsed", collapsed);
  sidebar.classList.toggle("nav-collapsed", collapsed);
  const btn = document.getElementById("navToggle");
  if(btn) btn.textContent = collapsed ? "⟶" : "⟵";
}

function toggleSidebar(){
  const curr = localStorage.getItem("nav_collapsed") === "1";
  localStorage.setItem("nav_collapsed", curr ? "0" : "1");
  applySidebarState();
}

/* =========================
   CHARTS + ANALYTICS
========================= */
let barChart, donutChart;

function animateCounter(id, value){
  const el = document.getElementById(id);
  const target = Number(value || 0);
  let start = 0;
  const step = Math.max(1, Math.ceil(target / 40));

  const interval = setInterval(() => {
    start += step;
    if(start >= target){
      el.innerText = target;
      clearInterval(interval);
    }else{
      el.innerText = start;
    }
  }, 18);
}

async function loadAnalytics(){
  try{
    const res = await fetch(`${API}/analytics`);
    const data = await res.json();

    animateCounter("totalLeads", data.total);
    animateCounter("newLeads", data.newLeads);
    animateCounter("contactedLeads", data.contacted);
    animateCounter("convertedLeads", data.converted);

    document.getElementById("syncTime").textContent = nowTime();

    const total = Number(data.total) || 0;
    const newCount = Number(data.newLeads) || 0;
    const contacted = Number(data.contacted) || 0;
    const converted = Number(data.converted) || 0;
    const rate = Number(data.conversionRate) || 0;

    document.getElementById("conversionRateText").textContent = rate + "%";
    document.getElementById("kpiNew").textContent = newCount;
    document.getElementById("kpiContacted").textContent = contacted;
    document.getElementById("kpiConverted").textContent = converted;

    const bctx = document.getElementById("barChart");
    if(barChart) barChart.destroy();
    barChart = new Chart(bctx, {
      type: "bar",
      data: { labels: ["New","Contacted","Converted"], datasets: [{ label:"Leads", data:[newCount,contacted,converted], borderRadius:12 }] },
      options: { responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{beginAtZero:true, ticks:{precision:0}} } }
    });

    const dctx = document.getElementById("donutChart");
    if(donutChart) donutChart.destroy();
    donutChart = new Chart(dctx, {
      type: "doughnut",
      data: { labels:["Converted","Remaining"], datasets:[{ data:[converted, Math.max(0,total-converted)], borderWidth:0, hoverOffset:4 }] },
      options: { cutout:"72%", plugins:{legend:{display:false}} }
    });

  }catch(err){
    toast("Analytics fetch failed ❌", "error");
  }
}

/* =========================
   LEADS + FILTER + PAGINATION
========================= */
let allLeadsCache = [];
let currentStatusFilter = "all";
let currentPage = 1;
let pageSize = 10;
let lastFilteredCache = [];
let selected = new Set();

function setPageSize(v){ pageSize = Number(v) || 10; currentPage = 1; applyLeadFilters(); }
function clearSearch(){ const s = document.getElementById("leadSearch"); s.value = ""; applyLeadFilters(); s.focus(); }

function setStatusFilter(filter){
  currentStatusFilter = filter;
  currentPage = 1;
  document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
  const pill = document.querySelector(`.pill[data-filter="${filter}"]`);
  if(pill) pill.classList.add("active");
  applyLeadFilters();
}

function matchesSearch(lead, term){
  if(!term) return true;
  const t = term.toLowerCase();
  return (
    String(lead.name || "").toLowerCase().includes(t) ||
    String(lead.email || "").toLowerCase().includes(t) ||
    String(lead.phone || "").toLowerCase().includes(t)
  );
}
function matchesStatus(lead){
  if(currentStatusFilter === "all") return true;
  return (lead.status || "new") === currentStatusFilter;
}

function setLeadsSkeleton(){
  const tbody = document.getElementById("leadsTable");
  tbody.innerHTML = "";
  for(let i=0;i<8;i++){
    tbody.innerHTML += `
      <tr>
        <td><div class="sk sk-box"></div></td>
        <td><div class="sk sk-line"></div></td>
        <td><div class="sk sk-line"></div></td>
        <td><div class="sk sk-line sm"></div></td>
        <td><div class="sk sk-pill"></div></td>
        <td><div class="sk sk-pill"></div></td>
        <td><div class="sk sk-btn"></div></td>
      </tr>
    `;
  }
}

async function loadLeads(){
  try{
    if(!document.getElementById("sectionLeads").classList.contains("hidden")) setLeadsSkeleton();
    const res = await fetch(`${API}/leads`);
    const leads = await res.json();
    allLeadsCache = Array.isArray(leads) ? leads : [];

    const ids = new Set(allLeadsCache.map(l => l.id));
    selected = new Set([...selected].filter(id => ids.has(id)));
    updateBulkBar();

    applyLeadFilters();
    renderPipeline();
    renderTopLeads();
  }catch(err){
    toast("Leads fetch failed ❌", "error");
  }
}

function applyLeadFilters(){
  const term = (document.getElementById("leadSearch")?.value || "").trim();

  const filtered = allLeadsCache
    .filter(l => matchesStatus(l) && matchesSearch(l, term))
    .map(l => ({...l, __score: scoreLead(l)}))
    .sort((a,b) => b.__score - a.__score);

  lastFilteredCache = filtered;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  document.getElementById("showingCount").textContent = pageItems.length;
  document.getElementById("totalCount").textContent = filtered.length;
  document.getElementById("pageNumber").textContent = currentPage;
  document.getElementById("pageTotal").textContent = totalPages;

  renderLeadsTable(pageItems, filtered.length);
  syncSelectAllCheckbox(pageItems);
}

function prevPage(){ if(currentPage > 1){ currentPage--; applyLeadFilters(); } }
function nextPage(){
  const totalPages = Math.max(1, Math.ceil(lastFilteredCache.length / pageSize));
  if(currentPage < totalPages){ currentPage++; applyLeadFilters(); }
}

/* =========================
   SELECTION + BULK
========================= */
function toggleRow(id, checked){
  if(checked) selected.add(id); else selected.delete(id);
  updateBulkBar();
}

function toggleSelectAll(checked){
  const term = (document.getElementById("leadSearch")?.value || "").trim();
  const filtered = allLeadsCache.filter(l => matchesStatus(l) && matchesSearch(l, term));
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  pageItems.forEach(l => checked ? selected.add(l.id) : selected.delete(l.id));
  updateBulkBar();
  applyLeadFilters();
}

function syncSelectAllCheckbox(pageItems){
  const cb = document.getElementById("selectAll");
  if(!cb) return;
  if(pageItems.length === 0){ cb.checked = false; cb.indeterminate = false; return; }
  const selectedOnPage = pageItems.filter(l => selected.has(l.id)).length;
  cb.checked = selectedOnPage === pageItems.length;
  cb.indeterminate = selectedOnPage > 0 && selectedOnPage < pageItems.length;
}

function updateBulkBar(){
  const bar = document.getElementById("bulkBar");
  const count = selected.size;
  document.getElementById("bulkCount").textContent = count;
  if(count > 0) bar.classList.remove("hidden");
  else bar.classList.add("hidden");
}

function clearSelection(){
  selected.clear();
  updateBulkBar();
  applyLeadFilters();
}

async function bulkSetStatus(status){
  if(!status || selected.size === 0) return;

  const ids = [...selected];
  toast(`Bulk updating ${ids.length} leads…`, "success");

  const results = await Promise.allSettled(ids.map(id =>
    fetch(`${API}/leads/${id}/status`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ status })
    })
  ));

  const ok = results.filter(r => r.status === "fulfilled").length;
  pushActivity(`Bulk status → ${status} (${ok}/${ids.length})`, {id:null,name:"",status});
  toast(`Bulk status updated: ${ok}/${ids.length}`, ok === ids.length ? "success" : "error");

  selected.clear();
  updateBulkBar();
  loadAnalytics();
  await loadLeads();
  document.getElementById("bulkStatus").value = "";
}

async function bulkDelete(){
  if(selected.size === 0) return;
  if(!confirm(`Delete ${selected.size} leads?`)) return;

  const ids = [...selected];
  toast(`Bulk deleting ${ids.length} leads…`, "success");

  const results = await Promise.allSettled(ids.map(id =>
    fetch(`${API}/leads/${id}`, { method: "DELETE" })
  ));

  const ok = results.filter(r => r.status === "fulfilled").length;
  pushActivity(`Bulk delete (${ok}/${ids.length})`, {id:null,name:"",status:""});
  toast(`Bulk deleted: ${ok}/${ids.length}`, ok === ids.length ? "success" : "error");

  selected.clear();
  updateBulkBar();
  loadAnalytics();
  await loadLeads();
}

/* =========================
   TABLE RENDER (NO TAG COL)
========================= */
function statusSelectHTML(current, id){
  const opts = ["new","contacted","converted"];
  const c = current || "new";
  return `
    <select class="status-select" data-id="${id}" onchange="updateStatusFromSelect(this)">
      ${opts.map(s => `<option value="${s}" ${s===c ? "selected":""}>${s}</option>`).join("")}
    </select>
  `;
}

function scoreHTML(lead){
  const s = lead.__score ?? scoreLead(lead);
  const cls = scoreClass(s);
  return `
    <div class="score-cell">
      <span class="score-badge ${cls}">${s} • ${scoreLabel(s)}</span>
      <div class="score-mini"><div class="score-mini-fill" style="width:${s}%;"></div></div>
    </div>
  `;
}

function renderLeadsTable(leads, totalFiltered){
  const tbody = document.getElementById("leadsTable");
  tbody.innerHTML = "";

  leads.forEach(lead => {
    const checked = selected.has(lead.id) ? "checked" : "";
    tbody.innerHTML += `
      <tr>
        <td><input type="checkbox" ${checked} onclick="toggleRow(${lead.id}, this.checked)" /></td>
        <td>
          <div class="td-strong">${escapeHTML(lead.name || "-")}</div>
          <div class="td-sub">${escapeHTML(lead.source || "—")}</div>
        </td>
        <td>${escapeHTML(lead.email || "-")}</td>
        <td>${escapeHTML(lead.phone || "-")}</td>
        <td>${scoreHTML(lead)}</td>
        <td>
          ${statusSelectHTML(lead.status, lead.id)}
          <span class="save-msg" id="saveMsg-${lead.id}"></span>
        </td>
        <td class="actions">
          <button class="secondary-mini" type="button" onclick="openNotes(${lead.id})">Notes</button>
          <button class="danger-mini" type="button" onclick="deleteLead(${lead.id})">Delete</button>
        </td>
      </tr>
    `;
  });

  if(totalFiltered === 0){
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">
          🚀 No leads found.<br>
          <span class="empty-sub">Try a different filter or click <b>Add Lead</b>.</span>
        </td>
      </tr>
    `;
  }
}

/* =========================
   SINGLE STATUS UPDATE
========================= */
async function updateStatusFromSelect(selectEl){
  const leadId = selectEl.getAttribute("data-id");
  const status = selectEl.value;

  const msg = document.getElementById(`saveMsg-${leadId}`);
  if(msg) msg.textContent = "Saving...";

  try{
    const res = await fetch(`${API}/leads/${leadId}/status`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ status })
    });

    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.message || "Update failed");

    const lead = allLeadsCache.find(l => String(l.id) === String(leadId)) || {id:leadId,name:"",status};
    pushActivity(`Status updated → ${status}`, {...lead, status});

    toast("Status updated ✅", "success");
    if(msg) msg.textContent = "✅";

    loadAnalytics();
    await loadLeads();

    setTimeout(() => { if(msg) msg.textContent = ""; }, 900);
  }catch(err){
    toast("Status update failed ❌", "error");
    if(msg) msg.textContent = "❌";
  }
}

/* =========================
   DELETE
========================= */
async function deleteLead(id){
  if(!confirm("Delete this lead?")) return;

  const lead = allLeadsCache.find(l => l.id === id) || {id,name:"",status:""};
  try{
    const res = await fetch(`${API}/leads/${id}`, { method: "DELETE" });
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error || "Delete failed");

    pushActivity("Lead deleted", lead);
    toast("Lead deleted ✅", "success");

    loadAnalytics();
    await loadLeads();
  }catch(err){
    toast("Delete failed ❌", "error");
  }
}

/* =========================
   ADD LEAD FORM
========================= */
function openLeadForm(){
  const card = document.getElementById("leadFormCard");
  card.classList.remove("hidden");
  card.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => document.getElementById("leadName")?.focus(), 120);
}
function closeLeadForm(){ document.getElementById("leadFormCard").classList.add("hidden"); }

/* =========================
   NOTES MODAL (DB NOTES IF POSSIBLE)
========================= */
let activeNotesLeadId = null;

// fallback local notes only if backend doesn't support saving
function localNotesKey(id){ return `lead_notes_${id}`; }

function openNotes(id){
  activeNotesLeadId = id;
  const lead = allLeadsCache.find(l => l.id === id) || {};

  document.getElementById("notesLeadMeta").textContent =
    `${lead.name || "—"} • ${lead.email || "—"} • ${lead.status || "—"}`;

  // Prefer DB notes if available, else local fallback
  const fromDb = (lead.notes || "").trim();
  const fallback = (localStorage.getItem(localNotesKey(id)) || "").trim();
  document.getElementById("notesText").value = fromDb || fallback || "";

  document.getElementById("notesModal").classList.remove("hidden");
  setTimeout(() => document.getElementById("notesText").focus(), 80);
}

function closeNotes(){
  document.getElementById("notesModal").classList.add("hidden");
  activeNotesLeadId = null;
}

async function saveNotes(){
  if(!activeNotesLeadId) return;

  const notes = document.getElementById("notesText").value || "";
  const id = activeNotesLeadId;

  // try save to backend (if endpoint exists)
  try{
    const res = await fetch(`${API}/leads/${id}/notes`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ notes })
    });

    if(!res.ok) throw new Error("No backend notes endpoint");

    // update cache
    const lead = allLeadsCache.find(l => l.id === id);
    if(lead) lead.notes = notes;

    pushActivity("Notes saved", lead || {id, name:"", status:""});
    toast("Notes saved to DB ✅", "success");

    closeNotes();
    applyLeadFilters();
    renderTopLeads();
    renderPipeline();
    return;
  }catch(e){
    // fallback local
    localStorage.setItem(localNotesKey(id), notes);
    const lead = allLeadsCache.find(l => l.id === id) || {id};
    pushActivity("Notes saved (local)", lead);
    toast("Saved locally ✅ (DB endpoint not found)", "success");
    closeNotes();
  }
}

/* =========================
   PIPELINE (KANBAN)
========================= */
function allowDrop(ev){ ev.preventDefault(); }
function dragCard(ev, id){ ev.dataTransfer.setData("text/plain", String(id)); }

async function dropCard(ev, newStatus){
  ev.preventDefault();
  const id = Number(ev.dataTransfer.getData("text/plain"));
  if(!id) return;

  const lead = allLeadsCache.find(l => l.id === id);
  if(!lead) return;
  if((lead.status || "new") === newStatus) return;

  toast(`Moving → ${newStatus}…`, "success");

  try{
    const res = await fetch(`${API}/leads/${id}/status`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.message || "Move failed");

    pushActivity(`Moved in pipeline → ${newStatus}`, {...lead, status:newStatus});
    toast("Pipeline updated ✅", "success");

    loadAnalytics();
    await loadLeads();
  }catch(err){
    toast("Move failed ❌", "error");
    renderPipeline();
  }
}

function kanCardHTML(lead){
  const score = scoreLead(lead);
  return `
    <div class="kan-card" draggable="true" ondragstart="dragCard(event, ${lead.id})">
      <div class="kan-card-top">
        <div class="kan-name">${escapeHTML(lead.name || "-")}</div>
        <span class="score-badge ${scoreClass(score)}">${score}</span>
      </div>

      <div class="kan-sub">${escapeHTML(lead.email || "-")}</div>

      <div class="kan-actions">
        <button class="secondary-mini" type="button" onclick="openNotes(${lead.id})">Notes</button>
        <button class="danger-mini" type="button" onclick="deleteLead(${lead.id})">Delete</button>
      </div>
    </div>
  `;
}

function renderPipeline(){
  const newWrap = document.getElementById("kanNew");
  const conWrap = document.getElementById("kanContacted");
  const covWrap = document.getElementById("kanConverted");
  if(!newWrap || !conWrap || !covWrap) return;

  const newLeads = allLeadsCache.filter(l => (l.status || "new") === "new").slice().sort((a,b)=>scoreLead(b)-scoreLead(a));
  const contacted = allLeadsCache.filter(l => (l.status || "new") === "contacted").slice().sort((a,b)=>scoreLead(b)-scoreLead(a));
  const converted = allLeadsCache.filter(l => (l.status || "new") === "converted").slice().sort((a,b)=>scoreLead(b)-scoreLead(a));

  document.getElementById("kanCountNew").textContent = newLeads.length;
  document.getElementById("kanCountContacted").textContent = contacted.length;
  document.getElementById("kanCountConverted").textContent = converted.length;

  newWrap.innerHTML = newLeads.length ? newLeads.map(kanCardHTML).join("") : `<div class="kan-empty">No leads</div>`;
  conWrap.innerHTML = contacted.length ? contacted.map(kanCardHTML).join("") : `<div class="kan-empty">No leads</div>`;
  covWrap.innerHTML = converted.length ? converted.map(kanCardHTML).join("") : `<div class="kan-empty">No leads</div>`;
}

/* =========================
   TOP LEADS WIDGET
========================= */
function renderTopLeads(){
  const wrap = document.getElementById("topLeads");
  if(!wrap) return;

  const top = allLeadsCache
    .map(l => ({...l, __score: scoreLead(l)}))
    .sort((a,b)=>b.__score - a.__score)
    .slice(0, 6);

  if(top.length === 0){
    wrap.innerHTML = `<div class="empty-block">No leads yet.</div>`;
    return;
  }

  wrap.innerHTML = top.map(l => `
    <div class="top-row">
      <div>
        <div class="td-strong">${escapeHTML(l.name || "-")}</div>
        <div class="td-sub">${escapeHTML(l.email || "-")}</div>
      </div>
      <div class="top-right">
        <span class="score-badge ${scoreClass(l.__score)}">${l.__score} • ${scoreLabel(l.__score)}</span>
        <button class="link-btn" type="button" onclick="openNotes(${l.id})">Open</button>
      </div>
    </div>
  `).join("");
}

/* =========================
   EXPORT CSV (NO TAGS)
========================= */
function exportCSV(){
  const rows = lastFilteredCache.length ? lastFilteredCache : allLeadsCache.map(l => ({...l, __score: scoreLead(l)}));
  if(!rows.length){
    toast("No leads to export", "error");
    return;
  }

  const headers = ["id","name","email","phone","status","source","score","notes"];
  const csv = [
    headers.join(","),
    ...rows.map(r => {
      const obj = {
        id: r.id,
        name: r.name ?? "",
        email: r.email ?? "",
        phone: r.phone ?? "",
        status: r.status ?? "",
        source: r.source ?? "",
        score: r.__score ?? scoreLead(r),
        notes: (r.notes ?? "")
      };
      return headers.map(h => `"${String(obj[h] ?? "").replace(/"/g,'""')}"`).join(",");
    })
  ].join("\n");

  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_export_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  pushActivity("Exported CSV", {id:null,name:"",status:""});
  toast("CSV exported ✅", "success");
}

/* =========================
   REFRESH
========================= */
function refreshAll(){
  loadAnalytics();
  loadLeads();
  renderTimeline();
  toast("Refreshed ✅", "success");
}

/* =========================
   INIT + SHORTCUTS
========================= */
document.addEventListener("DOMContentLoaded", () => {
  applySidebarState();
  applyThemeFromStorage();
  loadUsername();
  loadAnalytics();
  showSection("dashboard");
  setStatusFilter("all");
  renderTimeline();

  document.getElementById("leadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("leadMsg");
    msg.textContent = "Saving...";

    const payload = {
      name: document.getElementById("leadName").value.trim(),
      email: document.getElementById("leadEmail").value.trim(),
      phone: document.getElementById("leadPhone").value.trim(),
      status: document.getElementById("leadStatus").value,
      source: "manual"
    };

    try{
      const res = await fetch(`${API}/leads`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.error || "Failed to add lead");

      pushActivity("Lead added", payload);
      msg.textContent = "✅ Lead saved!";
      toast("Lead added ✅", "success");
      e.target.reset();

      loadAnalytics();
      await loadLeads();
      closeLeadForm();
    }catch(err){
      msg.textContent = "❌ " + err.message;
      toast("Failed to add lead ❌", "error");
    }
  });

  document.addEventListener("keydown", (e) => {
    const modalOpen = !document.getElementById("notesModal").classList.contains("hidden");

    if(e.key === "Escape"){
      if(modalOpen) closeNotes();
      closeLeadForm();
      closeSidebarMobile();
      return;
    }
    if(modalOpen) return;

    if(e.key === "/" && !e.ctrlKey && !e.metaKey){
      const leadsVisible = !document.getElementById("sectionLeads").classList.contains("hidden");
      if(leadsVisible){
        e.preventDefault();
        document.getElementById("leadSearch").focus();
      }
    }

    if((e.key === "n" || e.key === "N") && !e.ctrlKey && !e.metaKey){
      const leadsVisible = !document.getElementById("sectionLeads").classList.contains("hidden");
      if(leadsVisible) openLeadForm();
    }
  });
});
