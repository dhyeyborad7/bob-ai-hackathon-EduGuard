// EduGuard AI — Main Application (v2 — with real data support)
// CSV Import · Add Student · localStorage persistence · Export CSV

/* ══════════════════════════════════════════════════════════════
   DATA LAYER
   ══════════════════════════════════════════════════════════════ */

function processStudent(s) {
  const score   = calculateRiskScore(s);
  const risk    = getRiskLevel(score);
  const factors = getTopRiskFactors(s);
  const actions = generateInterventions(s);
  const dropout = Math.round(getDropoutProbability(score));
  // derive deptCode from dept name if missing
  const deptCode = s.deptCode || s.dept.split(' ').map(w=>w[0]).join('').toUpperCase();
  return { ...s, deptCode, riskScore:score, riskLevel:risk, topFactors:factors, interventions:actions, dropoutProbability:dropout };
}

function loadData() {
  try {
    const stored = localStorage.getItem('eduguard_v2');
    if (stored) {
      const raw = JSON.parse(stored);
      if (Array.isArray(raw) && raw.length > 0) return raw.map(processStudent);
    }
  } catch(e) {}
  return STUDENTS.map(processStudent);
}

function saveData() {
  // Strip computed fields before storing
  const raw = APP_DATA.map(({ riskScore, riskLevel, topFactors, interventions, dropoutProbability, ...s }) => s);
  localStorage.setItem('eduguard_v2', JSON.stringify(raw));
}

function appGetStats() {
  const high   = APP_DATA.filter(s => s.riskLevel.level === 'HIGH').length;
  const medium = APP_DATA.filter(s => s.riskLevel.level === 'MEDIUM').length;
  const low    = APP_DATA.filter(s => s.riskLevel.level === 'LOW').length;
  return { total: APP_DATA.length, high, medium, low };
}

let APP_DATA = loadData();

/* ══════════════════════════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════════════════════════ */
function initials(name) {
  return name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
}
function avatarColor(id='') {
  const palette = ['#7c6fff','#ff4757','#ff9f43','#26de81','#4facfe','#fd79a8','#a29bfe','#00cec9'];
  return palette[(id.charCodeAt(0)||0) % palette.length];
}
function nowTime() {
  return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
}
function todayDate() {
  return new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
}
function destroyChart(key) {
  if (STATE.charts[key]) { STATE.charts[key].destroy(); delete STATE.charts[key]; }
}
function barColor(val) {
  if (val >= 75) return '#26de81';
  if (val >= 55) return '#ff9f43';
  return '#ff4757';
}

/* ── Toast ─────────────────────────────────────────────────── */
function showToast(msg, type='success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `position:fixed;bottom:28px;right:28px;z-index:9999;padding:12px 20px;border-radius:10px;
      font-size:0.85rem;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,0.5);
      transition:all 0.3s;backdrop-filter:blur(10px);max-width:360px;line-height:1.4`;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === 'success' ? 'rgba(38,222,129,0.15)' : 'rgba(255,71,87,0.15)';
  toast.style.border = `1px solid ${type === 'success' ? '#26de81' : '#ff4757'}`;
  toast.style.color  = type === 'success' ? '#26de81' : '#ff4757';
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

/* ══════════════════════════════════════════════════════════════
   STATE & ROUTING
   ══════════════════════════════════════════════════════════════ */
const STATE = { view:'dashboard', charts:{}, chatHistory:[] };

function navigate(view) {
  STATE.view = view;
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.view === view));
  Object.keys(STATE.charts).forEach(k => destroyChart(k));
  document.getElementById('main-content').innerHTML = '';
  switch(view) {
    case 'dashboard': renderDashboard(); break;
    case 'students':  renderStudents();  break;
    case 'bob-ai':    renderBobAI();     break;
    case 'analytics': renderAnalytics(); break;
  }
}

/* ══════════════════════════════════════════════════════════════
   VIEW 1: DASHBOARD
   ══════════════════════════════════════════════════════════════ */
function renderDashboard() {
  const stats   = appGetStats();
  const highRisk = APP_DATA.filter(s=>s.riskLevel.level==='HIGH').sort((a,b)=>b.riskScore-a.riskScore).slice(0,6);
  const recent   = APP_DATA.filter(s=>s.riskLevel.level!=='LOW').sort((a,b)=>b.riskScore-a.riskScore).slice(0,5);
  const isDemo   = !localStorage.getItem('eduguard_v2');

  document.getElementById('main-content').innerHTML = `
  <div class="main">
    <div class="topbar">
      <div class="topbar-title">Dashboard <span class="topbar-sub">Academic Risk Overview — Semester 1, 2026-27</span></div>
      <div class="topbar-actions">
        ${isDemo ? `<div style="background:rgba(255,159,67,0.12);border:1px solid rgba(255,159,67,0.3);color:#ff9f43;padding:5px 12px;border-radius:6px;font-size:0.73rem;font-weight:600">⚠️ Demo Data — Import CSV for real students</div>` : ''}
        <div class="topbar-date">📅 ${todayDate()}</div>
      </div>
    </div>
    <div class="content fade-in">
      <div class="stats-row">
        <div class="stat-card purple">
          <div class="stat-icon">🎓</div>
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Students Monitored</div>
          <div class="stat-delta down">All departments</div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon">🚨</div>
          <div class="stat-value text-high">${stats.high}</div>
          <div class="stat-label">High Risk Students</div>
          <div class="stat-delta up">↑ Needs intervention</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon">⚠️</div>
          <div class="stat-value text-med">${stats.medium}</div>
          <div class="stat-label">Medium Risk Students</div>
          <div class="stat-delta up">Monitor closely</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">✅</div>
          <div class="stat-value text-low">${stats.low}</div>
          <div class="stat-label">Low Risk Students</div>
          <div class="stat-delta down">On track</div>
        </div>
      </div>
      <div class="dashboard-grid">
        <div class="card">
          <div class="section-header">
            <div><div class="section-title">🚨 High Risk Students</div><div class="section-sub">Requires immediate coordinator attention</div></div>
            <span class="badge-count">${highRisk.length} students</span>
          </div>
          ${highRisk.length === 0 ? '<div class="empty-state"><div class="empty-icon">🎉</div>No high-risk students found!</div>' : `
          <table class="risk-table">
            <thead><tr><th>Student</th><th>Risk</th><th>Score</th><th>Top Factor</th><th></th></tr></thead>
            <tbody>
              ${highRisk.map(s=>`
              <tr onclick="openModal('${s.id}')">
                <td><div class="avatar-cell">
                  <div class="avatar" style="background:${avatarColor(s.id)}">${initials(s.name)}</div>
                  <div><div class="student-name">${s.name}</div><div class="student-dept">${s.deptCode||''} · Yr ${s.year}</div></div>
                </div></td>
                <td><span class="risk-badge HIGH">🔴 High</span></td>
                <td><span class="score-pill" style="color:${s.riskLevel.color}">${s.riskScore}</span></td>
                <td class="text-xs text-muted">${s.topFactors[0]?.name||''}: <strong style="color:${s.riskLevel.color}">${s.topFactors[0]?.value||''}${s.topFactors[0]?.unit||''}</strong></td>
                <td><button class="btn-view" onclick="event.stopPropagation();openModal('${s.id}')">View</button></td>
              </tr>`).join('')}
            </tbody>
          </table>`}
        </div>
        <div class="card">
          <div class="section-header">
            <div><div class="section-title">📊 Risk Distribution</div><div class="section-sub">Current semester snapshot</div></div>
          </div>
          <div class="chart-wrap"><canvas id="donutChart"></canvas></div>
          <div style="display:flex;gap:16px;justify-content:center;margin-top:16px;">
            <div style="display:flex;align-items:center;gap:6px;font-size:0.78rem"><span style="width:10px;height:10px;background:#ff4757;border-radius:50%;display:inline-block"></span>High (${stats.high})</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:0.78rem"><span style="width:10px;height:10px;background:#ff9f43;border-radius:50%;display:inline-block"></span>Medium (${stats.medium})</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:0.78rem"><span style="width:10px;height:10px;background:#26de81;border-radius:50%;display:inline-block"></span>Low (${stats.low})</div>
          </div>
        </div>
      </div>
      <div class="dashboard-grid-3">
        <div class="card">
          <div class="section-header">
            <div><div class="section-title">📋 Recent Alerts</div><div class="section-sub">Sorted by severity</div></div>
          </div>
          ${recent.length === 0 ? '<div class="empty-state">No alerts 🎉</div>' : `
          <table class="risk-table">
            <thead><tr><th>Student</th><th>Risk</th><th>Trend</th><th>Dropout Prob.</th></tr></thead>
            <tbody>
              ${recent.map(s=>`
              <tr onclick="openModal('${s.id}')">
                <td><div class="avatar-cell">
                  <div class="avatar" style="background:${avatarColor(s.id)}">${initials(s.name)}</div>
                  <div><div class="student-name">${s.name}</div><div class="student-dept">${s.rollNo}</div></div>
                </div></td>
                <td><span class="risk-badge ${s.riskLevel.level}">${s.riskLevel.icon} ${s.riskLevel.label}</span></td>
                <td><span class="trend-chip ${s.trend}">${s.trend==='declining'?'↓':s.trend==='improving'?'↑':'→'} ${s.trend}</span></td>
                <td style="color:${s.riskLevel.color};font-weight:700">${s.dropoutProbability}%</td>
              </tr>`).join('')}
            </tbody>
          </table>`}
        </div>
        <div class="card">
          <div class="section-header"><div><div class="section-title">🤖 IBM Bob Insights</div><div class="section-sub">AI-generated recommendations</div></div></div>
          <div class="bob-insight">
            <div class="bob-insight-header"><span class="bob-logo">BOB</span><span class="bob-insight-title">Critical Alert</span></div>
            <div class="bob-insight-text">${stats.high} student(s) are at <strong style="color:#ff4757">HIGH risk</strong> of dropout. Predicted combined cost of intervention if ignored: ₹12L+ in readmission & lost fees. Immediate multi-stakeholder action required.</div>
          </div>
          <div class="bob-insight">
            <div class="bob-insight-header"><span class="bob-logo">BOB</span><span class="bob-insight-title">Pattern Detected</span></div>
            <div class="bob-insight-text">${Math.round(APP_DATA.filter(s=>s.year===1).filter(s=>s.riskLevel.level!=='LOW').length / Math.max(APP_DATA.filter(s=>s.year===1).length,1)*100)}% of Year-1 students are at risk — campus adjustment is a key dropout trigger. Recommend a structured first-month mentoring program.</div>
          </div>
          <div class="bob-insight">
            <div class="bob-insight-header"><span class="bob-logo">BOB</span><span class="bob-insight-title">Top Risk Factor</span></div>
            <div class="bob-insight-text">Across all at-risk students, <strong>financial stress</strong> is the #1 contributing factor. ${APP_DATA.filter(s=>s.financialStress>=6).length} student(s) are eligible for CHARUSAT Student Welfare aid programs — refer them immediately.</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  setTimeout(() => {
    const ctx = document.getElementById('donutChart');
    if (!ctx) return;
    STATE.charts.donut = new Chart(ctx, {
      type:'doughnut',
      data:{ labels:['High Risk','Medium Risk','Low Risk'],
        datasets:[{ data:[stats.high,stats.medium,stats.low],
          backgroundColor:['#ff4757','#ff9f43','#26de81'],
          borderColor:'#0e1428', borderWidth:3, hoverOffset:6 }]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${c.label}: ${c.raw} students`}} },
        cutout:'68%' }
    });
  }, 50);
}

/* ══════════════════════════════════════════════════════════════
   VIEW 2: STUDENTS + IMPORT + ADD
   ══════════════════════════════════════════════════════════════ */
function renderStudents() {
  document.getElementById('main-content').innerHTML = `
  <div class="main">
    <div class="topbar">
      <div class="topbar-title">All Students <span class="topbar-sub">${APP_DATA.length} students</span></div>
      <div class="topbar-actions">
        <button onclick="showAddStudentModal()" style="background:rgba(124,111,255,0.15);border:1px solid rgba(124,111,255,0.3);color:#7c6fff;padding:7px 14px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='rgba(124,111,255,0.3)'" onmouseout="this.style.background='rgba(124,111,255,0.15)'">+ Add Student</button>
        <button onclick="showImportModal()" style="background:rgba(5,74,218,0.15);border:1px solid rgba(5,74,218,0.35);color:#4facfe;padding:7px 14px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='rgba(5,74,218,0.3)'" onmouseout="this.style.background='rgba(5,74,218,0.15)'">📂 Import CSV</button>
        <button onclick="exportCSV()" style="background:rgba(38,222,129,0.1);border:1px solid rgba(38,222,129,0.25);color:#26de81;padding:7px 14px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='rgba(38,222,129,0.2)'" onmouseout="this.style.background='rgba(38,222,129,0.1)'">⬇️ Export</button>
        <button onclick="resetToDemo()" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(232,234,246,0.4);padding:7px 14px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer" title="Reset to synthetic demo data">↺ Reset</button>
      </div>
    </div>
    <div class="content fade-in">
      <div class="search-bar">
        <input class="search-input" id="searchInput" placeholder="🔍  Search by name, roll no, department..." oninput="filterStudents()">
        <select class="filter-select" id="riskFilter" onchange="filterStudents()">
          <option value="all">All Risk Levels</option>
          <option value="HIGH">🔴 High Risk</option>
          <option value="MEDIUM">🟡 Medium Risk</option>
          <option value="LOW">🟢 Low Risk</option>
        </select>
        <select class="filter-select" id="deptFilter" onchange="filterStudents()">
          <option value="all">All Departments</option>
          ${[...new Set(APP_DATA.map(s=>s.dept))].map(d=>`<option value="${d}">${d}</option>`).join('')}
        </select>
        <select class="filter-select" id="yearFilter" onchange="filterStudents()">
          <option value="all">All Years</option>
          ${[...new Set(APP_DATA.map(s=>s.year))].sort().map(y=>`<option value="${y}">Year ${y}</option>`).join('')}
        </select>
      </div>
      <div class="students-grid" id="studentsGrid">${renderStudentCards(APP_DATA)}</div>
    </div>
  </div>`;
}

function renderStudentCards(list) {
  if (list.length === 0) return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div>No students match your filters.</div>`;
  return list.map(s=>`
  <div class="student-card risk-${s.riskLevel.level.toLowerCase()}" onclick="openModal('${s.id}')">
    <div class="sc-top">
      <div class="avatar" style="background:${avatarColor(s.id)};width:44px;height:44px;font-size:0.9rem">${initials(s.name)}</div>
      <div class="sc-info">
        <div class="sc-name">${s.name}</div>
        <div class="sc-meta">${s.rollNo} · ${s.deptCode||''} · Year ${s.year}</div>
      </div>
      <div style="font-size:1.4rem;font-weight:900;color:${s.riskLevel.color}">${s.riskScore}</div>
    </div>
    <div class="sc-bars">
      ${[['Attend.',s.attendance],['Marks',s.marks],['Assign.',s.assignments]].map(([label,val])=>`
      <div class="sc-bar-row">
        <span class="sc-bar-label">${label}</span>
        <div class="sc-bar-wrap"><div class="sc-bar" style="width:${val}%;background:${barColor(val)}"></div></div>
        <span class="sc-bar-val">${val}%</span>
      </div>`).join('')}
    </div>
    <div class="sc-footer">
      <span class="risk-badge ${s.riskLevel.level}">${s.riskLevel.icon} ${s.riskLevel.label}</span>
      <span class="trend-chip ${s.trend}">${s.trend==='declining'?'↓':s.trend==='improving'?'↑':'→'} ${s.trend}</span>
    </div>
  </div>`).join('');
}

function filterStudents() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const risk   = document.getElementById('riskFilter').value;
  const dept   = document.getElementById('deptFilter').value;
  const year   = document.getElementById('yearFilter').value;
  const filtered = APP_DATA.filter(s => {
    return (s.name.toLowerCase().includes(search)||s.rollNo.toLowerCase().includes(search)||s.dept.toLowerCase().includes(search)) &&
           (risk==='all'||s.riskLevel.level===risk) &&
           (dept==='all'||s.dept===dept) &&
           (year==='all'||String(s.year)===year);
  });
  document.getElementById('studentsGrid').innerHTML = renderStudentCards(filtered);
}

/* ── CSV Import ─────────────────────────────────────────────── */
function showImportModal() {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <div class="modal-title"><div class="modal-name">📂 Import Students from CSV</div><div class="modal-meta">Upload real student data from your university ERP/Excel export</div></div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="padding:24px;display:flex;flex-direction:column;gap:20px">
      <!-- Drop Zone -->
      <div id="dropZone" style="border:2px dashed rgba(124,111,255,0.4);border-radius:14px;padding:40px;text-align:center;cursor:pointer;transition:all 0.2s;background:rgba(124,111,255,0.04)"
        ondragover="event.preventDefault();this.style.borderColor='#7c6fff';this.style.background='rgba(124,111,255,0.08)'"
        ondragleave="this.style.borderColor='rgba(124,111,255,0.4)';this.style.background='rgba(124,111,255,0.04)'"
        ondrop="handleDrop(event)" onclick="document.getElementById('csvFileInput').click()">
        <div style="font-size:2.5rem;margin-bottom:10px">📊</div>
        <div style="font-size:1rem;font-weight:700;margin-bottom:6px">Drag & drop your CSV file here</div>
        <div style="font-size:0.8rem;color:rgba(232,234,246,0.5)">or click to browse · Supports .csv files</div>
        <input type="file" id="csvFileInput" accept=".csv" style="display:none" onchange="handleFileSelect(this)">
      </div>

      <!-- CSV Format -->
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:16px">
        <div style="font-size:0.82rem;font-weight:700;margin-bottom:8px;color:#4facfe">📋 Required CSV Column Format:</div>
        <code style="font-size:0.72rem;color:rgba(232,234,246,0.6);line-height:2;display:block;overflow-x:auto;white-space:nowrap">
          name, dept, year, sem, rollNo, email, advisor, guardian, attendance, marks, assignments, lab, participation, financialStress, socialIssues, backlogs, trend, notes
        </code>
        <div style="margin-top:10px;font-size:0.72rem;color:rgba(232,234,246,0.4)">
          • <strong style="color:#7c6fff">attendance, marks, assignments, lab, participation</strong> → numbers 0–100<br>
          • <strong style="color:#7c6fff">financialStress, socialIssues</strong> → numbers 0–10<br>
          • <strong style="color:#7c6fff">backlogs</strong> → integer<br>
          • <strong style="color:#7c6fff">trend</strong> → "improving" | "stable" | "declining"
        </div>
      </div>

      <!-- Download Sample -->
      <div style="display:flex;gap:10px">
        <button onclick="downloadSampleCSV()" style="flex:1;padding:10px;background:rgba(38,222,129,0.1);border:1px solid rgba(38,222,129,0.25);color:#26de81;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer">
          ⬇️ Download Sample CSV Template
        </button>
        <button onclick="closeModal()" style="padding:10px 20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(232,234,246,0.5);border-radius:8px;font-size:0.82rem;cursor:pointer">Cancel</button>
      </div>

      <!-- Preview area -->
      <div id="importPreview" style="display:none"></div>
    </div>`;
  overlay.classList.add('open');
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById('dropZone').style.borderColor = 'rgba(124,111,255,0.4)';
  document.getElementById('dropZone').style.background  = 'rgba(124,111,255,0.04)';
  const file = event.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) readCSVFile(file);
  else showToast('Please drop a .csv file', 'error');
}

function handleFileSelect(input) {
  const file = input.files[0];
  if (file) readCSVFile(file);
}

function readCSVFile(file) {
  const reader = new FileReader();
  reader.onload = e => previewCSV(e.target.result, file.name);
  reader.readAsText(file);
}

function previewCSV(text, filename) {
  const parsed = parseCSV(text);
  if (parsed.length === 0) { showToast('No valid student rows found in CSV', 'error'); return; }
  const preview = document.getElementById('importPreview');
  preview.style.display = 'block';
  preview.innerHTML = `
    <div style="background:rgba(38,222,129,0.08);border:1px solid rgba(38,222,129,0.2);border-radius:10px;padding:16px">
      <div style="font-weight:700;color:#26de81;margin-bottom:8px">✅ ${parsed.length} students ready to import from "${filename}"</div>
      <div style="font-size:0.78rem;color:rgba(232,234,246,0.6);margin-bottom:12px">Preview of first 3 records:</div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:0.75rem">
          <thead><tr>${['Name','Dept','Year','Attendance','Marks','Trend'].map(h=>`<th style="text-align:left;padding:4px 8px;color:rgba(232,234,246,0.4);border-bottom:1px solid rgba(255,255,255,0.07)">${h}</th>`).join('')}</tr></thead>
          <tbody>${parsed.slice(0,3).map(s=>`<tr>
            <td style="padding:6px 8px;font-weight:600">${s.name}</td>
            <td style="padding:6px 8px;color:rgba(232,234,246,0.6)">${s.dept}</td>
            <td style="padding:6px 8px;color:rgba(232,234,246,0.6)">${s.year}</td>
            <td style="padding:6px 8px;color:${barColor(s.attendance)}">${s.attendance}%</td>
            <td style="padding:6px 8px;color:${barColor(s.marks)}">${s.marks}%</td>
            <td style="padding:6px 8px">${s.trend}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      <div style="margin-top:14px;display:flex;gap:10px">
        <button onclick="confirmImport(${JSON.stringify(parsed).replace(/"/g,'&quot;')})" style="flex:1;padding:10px;background:linear-gradient(135deg,#054ada,#1a6eff);border:none;color:#fff;border-radius:8px;font-size:0.85rem;font-weight:700;cursor:pointer">
          ✅ Import ${parsed.length} Students
        </button>
        <button onclick="confirmImport(${JSON.stringify(parsed).replace(/"/g,'&quot;')},true)" style="padding:10px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:rgba(232,234,246,0.7);border-radius:8px;font-size:0.82rem;cursor:pointer" title="Remove existing students and replace with CSV data">
          Replace All
        </button>
      </div>
    </div>`;
}

function parseCSV(text) {
  const lines = text.split('\n').map(l=>l.trim()).filter(l=>l);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h=>h.trim().toLowerCase());
  const get = (obj, key, def='') => obj[headers.indexOf(key)] !== undefined ? (obj[headers.indexOf(key)]||'').trim() : def;
  return lines.slice(1).map((line, i) => {
    const cols = line.split(',').map(v=>v.trim());
    return {
      id:           get(cols,'rollno') || `IMP${Date.now()}${i}`,
      name:         get(cols,'name')   || `Student ${i+1}`,
      dept:         get(cols,'dept')   || 'Unknown Department',
      deptCode:     (get(cols,'dept')||'UNK').split(' ').map(w=>w[0]).join('').toUpperCase(),
      year:         parseInt(get(cols,'year')) || 1,
      sem:          parseInt(get(cols,'sem'))  || 1,
      rollNo:       get(cols,'rollno') || `IMP${i+1}`,
      email:        get(cols,'email')  || '',
      advisor:      get(cols,'advisor')   || 'Faculty Advisor',
      guardian:     get(cols,'guardian')  || 'Parent/Guardian',
      attendance:   parseFloat(get(cols,'attendance'))    || 75,
      marks:        parseFloat(get(cols,'marks'))         || 60,
      assignments:  parseFloat(get(cols,'assignments'))   || 70,
      lab:          parseFloat(get(cols,'lab'))           || 75,
      participation:parseFloat(get(cols,'participation')) || 60,
      financialStress: parseFloat(get(cols,'financialstress'))  || 0,
      socialIssues:    parseFloat(get(cols,'socialissues'))     || 0,
      backlogs:        parseInt(get(cols,'backlogs'))           || 0,
      trend:           get(cols,'trend') || 'stable',
      notes:           get(cols,'notes') || 'Imported from CSV',
    };
  }).filter(s => s.name && s.name !== 'Student 1' || s.rollNo !== 'IMP1');
}

function confirmImport(parsedStr, replaceAll=false) {
  const parsed = typeof parsedStr === 'string' ? JSON.parse(parsedStr) : parsedStr;
  const processed = parsed.map(s => processStudent(s));
  if (replaceAll) { APP_DATA = processed; }
  else { APP_DATA = [...APP_DATA, ...processed]; }
  saveData();
  closeModal();
  showToast(`✅ ${processed.length} students imported successfully!`);
  navigate('students');
}

function downloadSampleCSV() {
  const header = 'name,dept,year,sem,rollNo,email,advisor,guardian,attendance,marks,assignments,lab,participation,financialStress,socialIssues,backlogs,trend,notes';
  const rows = [
    'Raj Patel,Computer Engineering,2,3,24CE001,24ce001@charusat.ac.in,Dr. Ronak Patel,Mahesh Patel,62,45,55,65,40,7,3,2,declining,Financial difficulty reported',
    'Aanya Desai,Information Technology,1,1,25IT001,25it001@charusat.ac.in,Dr. Hemant Yadav,Suresh Desai,88,72,85,90,78,1,0,0,improving,Top performer',
    'Veer Mehta,AI & Machine Learning,3,5,23AIML001,23aiml001@charusat.ac.in,Dr. Hardik Jaiswal,Dinesh Mehta,55,40,48,60,35,6,4,3,declining,Multiple backlogs and personal issues',
  ];
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'eduguard_student_template.csv';
  a.click();
  showToast('✅ Sample CSV template downloaded!');
}

/* ── Export CSV ─────────────────────────────────────────────── */
function exportCSV() {
  const header = 'Name,Dept,Year,RollNo,Email,Attendance,Marks,Assignments,Lab,Participation,FinancialStress,SocialIssues,Backlogs,Trend,RiskScore,RiskLevel,DropoutProbability%';
  const rows = APP_DATA.map(s =>
    [s.name,s.dept,s.year,s.rollNo,s.email,s.attendance,s.marks,s.assignments,s.lab,s.participation,
     s.financialStress,s.socialIssues,s.backlogs,s.trend,s.riskScore,s.riskLevel.level,s.dropoutProbability].join(',')
  );
  const csv = [header,...rows].join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `eduguard_risk_report_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast(`✅ Exported ${APP_DATA.length} student records`);
}

/* ── Add Student Form ───────────────────────────────────────── */
function showAddStudentModal() {
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <div class="modal-title"><div class="modal-name">+ Add New Student</div><div class="modal-meta">Manually enter student details to compute risk score</div></div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="padding:24px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        ${formField('name','Full Name','text','Arjun Patel',true)}
        ${formField('rollNo','Roll Number','text','24CE001',true)}
        ${formField('dept','Department','text','Computer Engineering',true)}
        ${formField('year','Year','number','2',true,'min="1" max="5"')}
        ${formField('sem','Semester','number','3',false,'min="1" max="8"')}
        ${formField('email','Email','email','24ce001@charusat.ac.in')}
        ${formField('advisor','Faculty Advisor','text','Dr. Ronak Patel')}
        ${formField('guardian','Guardian Name','text','Ramesh Patel')}
      </div>
      <div style="margin:16px 0;border-top:1px solid rgba(255,255,255,0.07);padding-top:16px">
        <div style="font-size:0.78rem;font-weight:700;color:#7c6fff;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.06em">Academic Metrics (0–100%)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
          ${rangeField('attendance','Attendance %',75)}
          ${rangeField('marks','Internal Marks %',60)}
          ${rangeField('assignments','Assignment Rate %',70)}
          ${rangeField('lab','Lab Attendance %',75)}
          ${rangeField('participation','Participation %',60)}
        </div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:0.78rem;font-weight:700;color:#ff9f43;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.06em">Risk Indicators</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
          ${rangeField('financialStress','Financial Stress',3,'0','10')}
          ${rangeField('socialIssues','Social Issues',2,'0','10')}
          ${formField('backlogs','Active Backlogs','number','0',false,'min="0"')}
        </div>
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:0.72rem;color:rgba(232,234,246,0.4);text-transform:uppercase;letter-spacing:0.06em;font-weight:600;display:block;margin-bottom:6px">Trend</label>
        <select id="f_trend" style="width:100%;background:#111930;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;color:#e8eaf6;font-size:0.85rem;outline:none">
          <option value="stable">→ Stable</option>
          <option value="declining">↓ Declining</option>
          <option value="improving">↑ Improving</option>
        </select>
      </div>
      ${formField('notes','Notes (optional)','text','Any relevant context about this student')}
      <div style="margin-top:20px;display:flex;gap:10px">
        <button onclick="submitAddStudent()" style="flex:1;padding:12px;background:linear-gradient(135deg,#7c6fff,#667eea);border:none;color:#fff;border-radius:10px;font-size:0.9rem;font-weight:700;cursor:pointer">
          ➕ Add Student & Compute Risk Score
        </button>
        <button onclick="closeModal()" style="padding:12px 20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(232,234,246,0.5);border-radius:10px;font-size:0.85rem;cursor:pointer">Cancel</button>
      </div>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function formField(id, label, type, placeholder, required=false, extra='') {
  return `<div>
    <label for="f_${id}" style="font-size:0.72rem;color:rgba(232,234,246,0.4);text-transform:uppercase;letter-spacing:0.06em;font-weight:600;display:block;margin-bottom:6px">${label}${required?' *':''}</label>
    <input id="f_${id}" type="${type}" placeholder="${placeholder}" ${extra}
      style="width:100%;background:#111930;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;color:#e8eaf6;font-size:0.85rem;outline:none;transition:border-color 0.2s"
      onfocus="this.style.borderColor='#7c6fff'" onblur="this.style.borderColor='rgba(255,255,255,0.08)'">
  </div>`;
}

function rangeField(id, label, defaultVal, min='0', max='100') {
  return `<div>
    <label style="font-size:0.72rem;color:rgba(232,234,246,0.4);text-transform:uppercase;letter-spacing:0.06em;font-weight:600;display:flex;justify-content:space-between;margin-bottom:6px">
      <span>${label}</span><span id="r_${id}_val" style="color:#7c6fff">${defaultVal}</span>
    </label>
    <input id="f_${id}" type="range" min="${min}" max="${max}" value="${defaultVal}"
      oninput="document.getElementById('r_${id}_val').textContent=this.value"
      style="width:100%;accent-color:#7c6fff;cursor:pointer">
  </div>`;
}

function getField(id, type='string') {
  const el = document.getElementById('f_'+id);
  if (!el) return type==='number' ? 0 : '';
  const v = el.value;
  return type==='number' ? (parseFloat(v)||0) : v.trim();
}

function submitAddStudent() {
  const name = getField('name');
  const rollNo = getField('rollNo');
  if (!name || !rollNo) { showToast('Name and Roll Number are required', 'error'); return; }
  const s = {
    id:            rollNo || `S${Date.now()}`,
    name, rollNo,
    dept:          getField('dept') || 'Unknown',
    deptCode:      (getField('dept')||'UNK').split(' ').map(w=>w[0]).join('').toUpperCase(),
    year:          getField('year','number') || 1,
    sem:           getField('sem','number') || 1,
    email:         getField('email'),
    advisor:       getField('advisor') || 'Faculty Advisor',
    guardian:      getField('guardian') || '',
    attendance:    getField('attendance','number'),
    marks:         getField('marks','number'),
    assignments:   getField('assignments','number'),
    lab:           getField('lab','number'),
    participation: getField('participation','number'),
    financialStress: getField('financialStress','number'),
    socialIssues:    getField('socialIssues','number'),
    backlogs:        getField('backlogs','number'),
    trend:           document.getElementById('f_trend')?.value || 'stable',
    notes:           getField('notes') || 'Manually added',
  };
  const processed = processStudent(s);
  APP_DATA.unshift(processed);
  saveData();
  closeModal();
  showToast(`✅ ${s.name} added! Risk Score: ${processed.riskScore}/100 (${processed.riskLevel.label})`);
  navigate('students');
}

/* ── Reset ──────────────────────────────────────────────────── */
function resetToDemo() {
  if (!confirm('Reset to 25 synthetic demo students? Your imported data will be lost.')) return;
  localStorage.removeItem('eduguard_v2');
  APP_DATA = STUDENTS.map(processStudent);
  showToast('↺ Reset to demo data');
  navigate('students');
}

/* ══════════════════════════════════════════════════════════════
   VIEW 3: BOB AI CHAT
   ══════════════════════════════════════════════════════════════ */
function renderBobAI() {
  const stats = appGetStats();
  document.getElementById('main-content').innerHTML = `
  <div class="main">
    <div class="topbar">
      <div class="topbar-title">IBM Bob AI <span class="topbar-sub">Powered by IBM watsonx — Ask anything about your students</span></div>
      <div class="topbar-actions"><span class="chat-online">● Bob Online</span></div>
    </div>
    <div class="content fade-in" style="height:calc(100vh - 64px);overflow:hidden;padding-bottom:0">
      <div class="bob-view">
        <div class="chat-container">
          <div class="chat-header">
            <span class="bob-badge">IBM BOB</span>
            <div class="chat-header-info">
              <div class="chat-title">EduGuard AI Assistant</div>
              <div class="chat-sub">IBM Bob · watsonx.ai · Agent Mode · ${APP_DATA.length} students loaded</div>
            </div>
            <span class="chat-online">● Online</span>
          </div>
          <div class="chat-messages" id="chatMessages">
            <div class="message bot"><div class="msg-avatar">B</div><div>
              <div class="msg-bubble">
                <strong>👋 Hello, Coordinator!</strong><br><br>
                I'm IBM Bob, your AI academic advisor. I have access to <strong>${APP_DATA.length} student records</strong> (${stats.high} high risk, ${stats.medium} medium, ${stats.low} low).<br><br>
                Ask me anything about your students — I can analyze risk patterns, generate intervention plans, or give you department-level insights.
              </div>
              <div class="msg-time">${nowTime()}</div>
            </div></div>
          </div>
          <div class="chat-input-area">
            <div class="chat-suggestions" id="suggestions">
              <span class="suggestion-chip" onclick="sendSuggestion(this)">Who is at highest risk?</span>
              <span class="suggestion-chip" onclick="sendSuggestion(this)">Analyze Arjun Patel</span>
              <span class="suggestion-chip" onclick="sendSuggestion(this)">Which department needs attention?</span>
              <span class="suggestion-chip" onclick="sendSuggestion(this)">Generate intervention report</span>
              <span class="suggestion-chip" onclick="sendSuggestion(this)">Year 1 dropout risk?</span>
            </div>
            <div class="chat-input-row">
              <input class="chat-input" id="chatInput" placeholder="Ask Bob about any student or trend..." onkeydown="if(event.key==='Enter')sendChat()">
              <button class="chat-send" onclick="sendChat()">Send ✈️</button>
            </div>
          </div>
        </div>
        <div class="bob-info-panel">
          <div class="section-title" style="margin-bottom:4px">🤖 IBM Bob Integration</div>
          <div class="text-sm text-muted" style="margin-bottom:12px">How Bob powers EduGuard AI</div>
          ${[
            ['🧠','Agent Mode','Bob autonomously analyses multi-factor student data and generates actionable recommendations.'],
            ['📊','watsonx.ai','Connected to IBM watsonx.ai for dropout probability estimation and NLP-based risk analysis.'],
            ['🔁','Plan Mode','Bob uses Plan Mode before each intervention plan to design the optimal multi-stakeholder action sequence.'],
            ['/review','Slash Commands','Coordinators use /review [rollNo] for instant risk reports and /report for weekly summaries.'],
            ['⚡','Subagents','For batch analysis Bob spawns lightweight subagents to process records in parallel.'],
            ['🔗','MCP Tools','Bob connects to CHARUSAT\'s student database, FMIS attendance API, and exam results portal via MCP.'],
          ].map(([icon,title,desc])=>`<div class="bob-feature"><div class="bob-feature-icon">${icon}</div><div><div class="bob-feature-title">${title}</div><div class="bob-feature-desc">${desc}</div></div></div>`).join('')}
          <div style="padding:12px;background:rgba(5,74,218,0.1);border:1px solid rgba(5,74,218,0.25);border-radius:8px;font-size:0.75rem;color:#4facfe;line-height:1.5">
            <strong>📌 Bob Reference:</strong> Agent Mode · Plan Mode · Bob Shell · Slash Commands · Subagents · Background Tasks · MCP Integrations<br>
            <span style="color:#7c6fff;display:block;margin-top:4px">bob.ibm.com/docs/ide</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function sendSuggestion(el) { document.getElementById('chatInput').value=el.textContent; el.remove(); sendChat(); }

function sendChat() {
  const input = document.getElementById('chatInput');
  const query = input.value.trim();
  if (!query) return;
  input.value = '';
  addMessage('user', query);
  showTyping();
  setTimeout(() => { removeTyping(); addMessage('bot', getBobResponse(query)); }, 1200+Math.random()*800);
}

function addMessage(role, text) {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `<div class="msg-avatar">${role==='bot'?'B':'You'}</div><div><div class="msg-bubble">${text}</div><div class="msg-time">${nowTime()}</div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.id = 'typing'; div.className = 'message bot';
  div.innerHTML = `<div class="msg-avatar">B</div><div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
  msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
}
function removeTyping() { const t=document.getElementById('typing'); if(t) t.remove(); }

function getBobResponse(query) {
  const q = query.toLowerCase();
  const stats = appGetStats();
  const highRisk = APP_DATA.filter(s=>s.riskLevel.level==='HIGH').sort((a,b)=>b.riskScore-a.riskScore);

  if (q.includes('highest risk')||q.includes('most at risk')||q.includes('critical')) {
    const top3 = highRisk.slice(0,3);
    if (top3.length === 0) return `<strong>✅ Great news!</strong> No students are currently in the High Risk category. All ${APP_DATA.length} students are either medium or low risk. Continue routine monitoring.`;
    return `<strong>🚨 Top ${top3.length} Highest-Risk Students:</strong><br><br>${top3.map((s,i)=>`<strong>${i+1}. ${s.name}</strong> (${s.rollNo})<br>&nbsp;&nbsp;&nbsp;📊 Risk: <span style="color:#ff4757">${s.riskScore}/100</span> · Dropout: <span style="color:#ff4757">${s.dropoutProbability}%</span><br>&nbsp;&nbsp;&nbsp;⚠️ ${s.topFactors[0]?.name||'Unknown'}: ${s.topFactors[0]?.value||''}${s.topFactors[0]?.unit||''}<br>&nbsp;&nbsp;&nbsp;📌 ${s.notes?.split('.')[0]||'No notes'}`).join('<br><br>')}<br><br><span style="color:#4facfe">💬 Type a student name for a full analysis and intervention plan.</span>`;
  }

  if (q.includes('department')||q.includes('dept')||q.includes('attention')) {
    const byDept = {};
    APP_DATA.forEach(s=>{
      if(!byDept[s.deptCode||s.dept]) byDept[s.deptCode||s.dept]={high:0,total:0,avg:0};
      byDept[s.deptCode||s.dept].total++;
      byDept[s.deptCode||s.dept].avg += s.riskScore;
      if(s.riskLevel.level==='HIGH') byDept[s.deptCode||s.dept].high++;
    });
    const sorted = Object.entries(byDept).sort((a,b)=>b[1].high-a[1].high);
    return `<strong>📊 Department Risk Breakdown:</strong><br><br>${sorted.map(([dept,d])=>`<strong>${dept}</strong>: <span style="color:#ff4757">${d.high} High</span> — Avg Risk: ${Math.round(d.avg/d.total)}/100`).join('<br>')}<br><br><strong>Bob's Recommendation:</strong><br>${sorted[0]?`Focus intervention efforts on <strong>${sorted[0][0]}</strong> first — highest concentration of at-risk students.`:'All departments look healthy!'}`;
  }

  if (q.includes('intervention')||q.includes('report')||q.includes('action plan')) {
    const critical = highRisk.filter(s=>s.riskScore>=75);
    return `<strong>📄 Intervention Priority Report — ${todayDate()}</strong><br><br>
<strong>🔴 CRITICAL (Immediate — 48h):</strong><br>${critical.length ? critical.map(s=>`• ${s.name} (${s.rollNo}) — Score ${s.riskScore}`).join('<br>') : '• None currently'}<br><br>
<strong>🟡 HIGH (This week):</strong><br>${highRisk.filter(s=>s.riskScore<75).map(s=>`• ${s.name} — ${s.topFactors[0]?.name||''}`).join('<br>')||'• None'}<br><br>
<strong>📌 System Actions:</strong><br>1. Activate CHARUSAT Early Warning Protocol for all ${highRisk.length} high-risk students<br>2. Trigger parent notification for students with attendance < 65%<br>3. Refer ${APP_DATA.filter(s=>s.financialStress>=6).length} student(s) to Student Welfare Cell<br><br><span style="color:#4facfe">💬 Click any student card to see their detailed intervention plan.</span>`;
  }

  if (q.includes('year 1')||q.includes('first year')) {
    const yr1 = APP_DATA.filter(s=>s.year===1);
    const yr1Risk = yr1.filter(s=>s.riskLevel.level!=='LOW');
    return `<strong>📊 Year-1 Analysis (${yr1.length} students):</strong><br><br>At Risk: <span style="color:#ff4757"><strong>${yr1Risk.length}</strong> (${Math.round(yr1Risk.length/Math.max(yr1.length,1)*100)}%)</span><br><br><strong>Key Stressors for Year 1:</strong><br>📍 Campus adjustment & homesickness<br>📍 Financial transition shock<br>📍 Academic load from 12th grade → B.Tech<br>📍 Low social integration in first 60 days<br><br><strong>Bob's Recommendation:</strong><br>Implement a <strong>"First-60-Days Buddy Program"</strong> pairing Year-1 students with Year-3 mentors. Research shows this reduces first-year dropout by 25–30%.`;
  }

  // Try to match a student name
  const matched = APP_DATA.find(s =>
    s.name.toLowerCase().split(' ').some(part => q.includes(part) && part.length > 2) ||
    q.includes(s.rollNo.toLowerCase())
  );
  if (matched) {
    const s = matched;
    return `<strong>📋 Risk Profile: ${s.name} (${s.rollNo})</strong><br><br>
<span style="color:${s.riskLevel.color}">● ${s.riskLevel.label} — Score: ${s.riskScore}/100</span><br>
Dropout Probability: <span style="color:${s.riskLevel.color};font-weight:700">${s.dropoutProbability}%</span> without intervention<br>
Trend: ${s.trend==='declining'?'↓ Declining 🚨':s.trend==='improving'?'↑ Improving ✅':'→ Stable'}<br><br>
<strong>Top Risk Factor:</strong> ${s.topFactors[0]?.name||'N/A'} — ${s.topFactors[0]?.value||''}${s.topFactors[0]?.unit||''}<br>
<strong>Faculty Advisor:</strong> ${s.advisor}<br>
<strong>Notes:</strong> ${s.notes}<br><br>
<strong>Top Intervention:</strong> ${s.interventions[0]?.action||'Routine monitoring'}<br><br>
<span style="color:#4facfe">💬 Click the student card in "All Students" to see the full intervention plan.</span>`;
  }

  return `<strong>I can help you with:</strong><br><br>
📊 <strong>Student Analysis</strong> — "Analyze [name]"<br>
🚨 <strong>At-Risk Lists</strong> — "Who is at highest risk?"<br>
🏫 <strong>Dept Insights</strong> — "Which department needs attention?"<br>
📋 <strong>Action Plans</strong> — "Generate intervention report"<br>
📈 <strong>Year Trends</strong> — "Year 1 dropout risk?"<br><br>
<span style="color:#4facfe">I have ${APP_DATA.length} student records loaded and ready. Try one of the above!</span>`;
}

/* ══════════════════════════════════════════════════════════════
   VIEW 4: ANALYTICS
   ══════════════════════════════════════════════════════════════ */
function renderAnalytics() {
  document.getElementById('main-content').innerHTML = `
  <div class="main">
    <div class="topbar">
      <div class="topbar-title">Analytics <span class="topbar-sub">Risk trends & department insights</span></div>
    </div>
    <div class="content fade-in">
      <div class="analytics-grid" style="margin-bottom:20px">
        <div class="card">
          <div class="section-header"><div><div class="section-title">📊 Dept-wise Average Risk Score</div></div></div>
          <div class="chart-wrap"><canvas id="deptChart"></canvas></div>
        </div>
        <div class="card">
          <div class="section-header"><div><div class="section-title">🎯 Risk Factor Radar</div><div class="section-sub">High risk vs Low risk students</div></div></div>
          <div class="chart-wrap"><canvas id="radarChart"></canvas></div>
        </div>
      </div>
      <div class="analytics-grid">
        <div class="card">
          <div class="section-header"><div><div class="section-title">📈 Risk Score by Year</div></div></div>
          <div class="chart-wrap"><canvas id="yearChart"></canvas></div>
        </div>
        <div class="card">
          <div class="section-header"><div><div class="section-title">📋 Risk Distribution by Department</div></div></div>
          <div class="chart-wrap"><canvas id="stackChart"></canvas></div>
        </div>
      </div>
      <div class="card" style="margin-top:20px">
        <div class="section-header"><div><div class="section-title">🔑 IBM Bob Key Insights</div></div></div>
        <div class="dashboard-grid-3" style="gap:12px;margin-top:0">
          ${buildInsights().map(([title,desc])=>`<div class="bob-insight"><div class="bob-insight-header"><span class="bob-logo">BOB</span><span class="bob-insight-title">${title}</span></div><div class="bob-insight-text">${desc}</div></div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;

  buildCharts();
}

function buildInsights() {
  const stats = appGetStats();
  const highFin = APP_DATA.filter(s=>s.financialStress>=6).length;
  const yr1At   = APP_DATA.filter(s=>s.year===1&&s.riskLevel.level!=='LOW').length;
  const yr1Tot  = APP_DATA.filter(s=>s.year===1).length;
  return [
    [`🎓 ${Math.round(stats.high/Math.max(stats.total,1)*100)}% Dropout Risk`,`Without intervention, ${stats.high} student(s) face >50% probability of dropout or academic probation by Semester 4.`],
    [`💰 Financial Stress #1`,`${highFin} student(s) (${Math.round(highFin/Math.max(stats.total,1)*100)}%) have financial stress ≥6/10. This is the strongest single dropout predictor in this dataset.`],
    [`📅 Attendance = Leading Indicator`,`Attendance below 65% has a 0.72 correlation with dropout risk. Early attendance alerts are the highest-ROI intervention.`],
  ];
}

function buildCharts() {
  const depts = [...new Set(APP_DATA.map(s=>s.deptCode||s.dept.slice(0,4)))];
  const deptAvg  = depts.map(d => { const g=APP_DATA.filter(s=>(s.deptCode||s.dept.slice(0,4))===d); return g.length?Math.round(g.reduce((a,s)=>a+s.riskScore,0)/g.length):0; });
  const deptHigh = depts.map(d => APP_DATA.filter(s=>(s.deptCode||s.dept.slice(0,4))===d&&s.riskLevel.level==='HIGH').length);
  const deptMed  = depts.map(d => APP_DATA.filter(s=>(s.deptCode||s.dept.slice(0,4))===d&&s.riskLevel.level==='MEDIUM').length);
  const deptLow  = depts.map(d => APP_DATA.filter(s=>(s.deptCode||s.dept.slice(0,4))===d&&s.riskLevel.level==='LOW').length);

  const hr = APP_DATA.filter(s=>s.riskLevel.level==='HIGH');
  const lr = APP_DATA.filter(s=>s.riskLevel.level==='LOW');
  const avgF = (arr, f) => arr.length ? Math.round(arr.reduce((a,s)=>a+s[f],0)/arr.length) : 0;

  const years = [...new Set(APP_DATA.map(s=>s.year))].sort();
  const yearAvg = years.map(y => { const g=APP_DATA.filter(s=>s.year===y); return g.length?Math.round(g.reduce((a,s)=>a+s.riskScore,0)/g.length):0; });

  const gOpts = { responsive:true, maintainAspectRatio:false,
    plugins:{legend:{labels:{color:'#e8eaf6',font:{size:11}}}},
    scales:{x:{ticks:{color:'#7a7f9a'},grid:{color:'rgba(255,255,255,0.04)'}},
            y:{ticks:{color:'#7a7f9a'},grid:{color:'rgba(255,255,255,0.04)'}}} };

  setTimeout(()=>{
    STATE.charts.dept = new Chart(document.getElementById('deptChart'), { type:'bar',
      data:{ labels:depts, datasets:[{ label:'Avg Risk Score', data:deptAvg,
        backgroundColor:deptAvg.map(v=>v>=66?'rgba(255,71,87,0.7)':v>=36?'rgba(255,159,67,0.7)':'rgba(38,222,129,0.7)'),
        borderRadius:6, borderSkipped:false }]},
      options:{...gOpts, plugins:{legend:{display:false}}} });

    STATE.charts.radar = new Chart(document.getElementById('radarChart'), { type:'radar',
      data:{ labels:['Attendance','Marks','Assignments','Lab','Participation'],
        datasets:[
          { label:'High Risk Avg', data:[avgF(hr,'attendance'),avgF(hr,'marks'),avgF(hr,'assignments'),avgF(hr,'lab'),avgF(hr,'participation')],
            borderColor:'#ff4757',backgroundColor:'rgba(255,71,87,0.1)',pointBackgroundColor:'#ff4757',pointRadius:4 },
          { label:'Low Risk Avg',  data:[avgF(lr,'attendance'),avgF(lr,'marks'),avgF(lr,'assignments'),avgF(lr,'lab'),avgF(lr,'participation')],
            borderColor:'#26de81',backgroundColor:'rgba(38,222,129,0.1)',pointBackgroundColor:'#26de81',pointRadius:4 }]},
      options:{ responsive:true, maintainAspectRatio:false,
        scales:{r:{ticks:{color:'#7a7f9a',backdropColor:'transparent'},grid:{color:'rgba(255,255,255,0.07)'},pointLabels:{color:'#e8eaf6',font:{size:11}}}},
        plugins:{legend:{labels:{color:'#e8eaf6',font:{size:11}}}}} });

    STATE.charts.year = new Chart(document.getElementById('yearChart'), { type:'bar',
      data:{ labels:years.map(y=>`Year ${y}`),
        datasets:[{ label:'Avg Risk Score', data:yearAvg,
          backgroundColor:yearAvg.map(v=>v>=66?'rgba(255,71,87,0.7)':v>=36?'rgba(255,159,67,0.7)':'rgba(38,222,129,0.7)'),
          borderRadius:6, borderSkipped:false }]},
      options:{...gOpts, plugins:{legend:{display:false}}} });

    STATE.charts.stack = new Chart(document.getElementById('stackChart'), { type:'bar',
      data:{ labels:depts, datasets:[
        { label:'High',   data:deptHigh, backgroundColor:'rgba(255,71,87,0.8)',  borderRadius:{topLeft:0,topRight:0,bottomLeft:4,bottomRight:4}, stack:'s' },
        { label:'Medium', data:deptMed,  backgroundColor:'rgba(255,159,67,0.7)', stack:'s' },
        { label:'Low',    data:deptLow,  backgroundColor:'rgba(38,222,129,0.7)', borderRadius:{topLeft:4,topRight:4,bottomLeft:0,bottomRight:0}, stack:'s' }]},
      options:{...gOpts} });
  }, 50);
}

/* ══════════════════════════════════════════════════════════════
   STUDENT MODAL
   ══════════════════════════════════════════════════════════════ */
function openModal(id) {
  const s = APP_DATA.find(x=>x.id===id);
  if (!s) return;
  const circ = 2*Math.PI*70;
  const offset = circ*(1-s.riskScore/100);
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <div class="modal-avatar" style="background:${avatarColor(s.id)}">${initials(s.name)}</div>
      <div class="modal-title">
        <div class="modal-name">${s.name}</div>
        <div class="modal-meta">${s.rollNo} · ${s.dept} · Year ${s.year} (Sem ${s.sem}) · ${s.email||'No email'}</div>
      </div>
      <span class="risk-badge ${s.riskLevel.level}" style="font-size:0.82rem;padding:5px 14px">${s.riskLevel.emoji} ${s.riskLevel.label}</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-left">
        <div class="gauge-wrap">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12"/>
            <circle id="gaugeArc" cx="80" cy="80" r="70" fill="none" stroke="${s.riskLevel.color}" stroke-width="12" stroke-linecap="round"
              stroke-dasharray="${circ}" stroke-dashoffset="${circ}" transform="rotate(-90 80 80)"
              style="transition:stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)"/>
          </svg>
          <div class="gauge-center">
            <div class="gauge-score" style="color:${s.riskLevel.color}">${s.riskScore}</div>
            <div class="gauge-label">Risk Score</div>
          </div>
        </div>
        <div style="text-align:center;margin-top:-8px">
          <div style="font-size:0.8rem;font-weight:700;color:${s.riskLevel.color}">${s.dropoutProbability}% dropout risk</div>
          <div class="text-xs text-muted" style="margin-top:2px">without intervention</div>
        </div>
        <div class="info-rows">
          ${[['Advisor',s.advisor],['Guardian',s.guardian||'N/A'],['Trend',s.trend==='declining'?'↓ Declining 🚨':s.trend==='improving'?'↑ Improving ✅':'→ Stable'],['Backlogs',s.backlogs>0?`${s.backlogs} active ⚠️`:'0 ✅']].map(([k,v])=>`<div class="info-row"><div class="info-key">${k}</div><div class="info-val">${v}</div></div>`).join('')}
          <div class="info-row"><div class="info-key">Notes</div><div class="info-val text-xs" style="color:var(--txt3);line-height:1.5">${s.notes||'No notes'}</div></div>
        </div>
        <button onclick="APP_DATA=APP_DATA.filter(x=>x.id!=='${s.id}');saveData();closeModal();showToast('Student removed');navigate('students')" style="width:100%;padding:8px;background:rgba(255,71,87,0.08);border:1px solid rgba(255,71,87,0.2);color:#ff4757;border-radius:8px;font-size:0.75rem;cursor:pointer;margin-top:auto">🗑 Remove Student</button>
      </div>
      <div class="modal-right">
        <div>
          <div class="section-title" style="margin-bottom:12px">📊 Risk Factor Breakdown</div>
          <div class="factors-grid">
            ${s.topFactors.slice(0,6).map(f=>`<div class="factor-card ${f.status}">
              <div class="factor-top"><span class="text-xs text-muted">${f.icon} ${f.name}</span><span class="factor-val">${f.value}${f.unit}</span></div>
              <div class="prog-bar-wrap"><div class="prog-bar" style="width:${f.unit===''?Math.min(f.value/5*100,100):f.unit==='/10'?f.value*10:f.value}%;background:${f.status==='critical'?'#ff4757':f.status==='warning'?'#ff9f43':'#26de81'}"></div></div>
              <div class="text-xs text-muted" style="margin-top:4px">Threshold: ${f.threshold}${f.unit}</div>
            </div>`).join('')}
          </div>
        </div>
        <div>
          <div class="section-title" style="margin-bottom:12px">🎯 IBM Bob Intervention Plan</div>
          <div class="interventions-list">
            ${s.interventions.map(a=>`<div class="intervention-item">
              <div class="int-icon">${a.icon}</div>
              <div class="int-body">
                <div class="int-top"><span class="int-type">${a.type}</span><span class="int-priority ${a.priority}">${a.priority}</span></div>
                <div class="int-action">${a.action}</div>
                <div class="int-footer"><div class="int-resp">👤 ${a.responsible}</div><div class="int-time">⏱ ${a.timeline}</div></div>
              </div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('modal-overlay').classList.add('open');
  setTimeout(() => { const arc=document.getElementById('gaugeArc'); if(arc) arc.style.strokeDashoffset = offset; }, 100);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => navigate('dashboard'));
