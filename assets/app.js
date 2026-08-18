/* 辉达惠瑞 · 全店运营管理工作台 —— 框架 / 导航 / 路由 */
const D = window.__COCKPIT__, M = window.__MODULES__;

/* ---------- 全局日期区间查询 ---------- */
const DQ_KEY = 'COCKPIT_QUERY_RANGE';
let currentKey = 'gm.cockpit';

function loadRange() {
  try { return JSON.parse(localStorage.getItem(DQ_KEY) || 'null'); } catch (e) { return null; }
}
function queryRange() { return loadRange() || { start: '', end: '' }; }
function renderDqCur() {
  const r = loadRange();
  const el = document.getElementById('dqCur');
  if (el) el.innerHTML = r ? '当前区间 <b>' + E(r.start) + '</b> ~ <b>' + E(r.end) + '</b>' : '';
}
function setRange(start, end) {
  if (start > end) { alert('起始日期不能晚于结束日期'); return; }
  localStorage.setItem(DQ_KEY, JSON.stringify({ start, end }));
  const s = document.getElementById('dqStart'), e = document.getElementById('dqEnd');
  if (s) s.value = start; if (e) e.value = end;
  renderDqCur();
}
/* 区间过滤助手：ABS 接通后，各板块真实数据按所选区间过滤（ISO 日期字符串直接比较） */
function filterByRange(rows, dateField) {
  const r = queryRange();
  if (!r || !r.start || !r.end || !Array.isArray(rows)) return rows;
  return rows.filter(x => {
    const d = String(x[dateField] || '').slice(0, 10);
    return d >= r.start && d <= r.end;
  });
}
function presetRange(p) {
  const now = new Date();
  const fmt = d => d.toISOString().slice(0, 10);
  const end = now;
  if (p === 'mtd') { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: fmt(s), end: fmt(end) }; }
  if (p === 'q') { const q = Math.floor(now.getMonth() / 3) * 3; const s = new Date(now.getFullYear(), q, 1); return { start: fmt(s), end: fmt(end) }; }
  if (p === 'y') { const s = new Date(now.getFullYear(), 0, 1); return { start: fmt(s), end: fmt(end) }; }
  const days = parseInt(p, 10) || 30; const s = new Date(now); s.setDate(s.getDate() - days);
  return { start: fmt(s), end: fmt(end) };
}

/* 查询动作：根据当前板块，调用所选区间的真实数据源（ABS 接通后自动出数，绝不填模拟值） */
function boardSource(key) {
  const map = {
    sales: ['CRM / 展厅客流系统', 'pending_crm'],
    service: ['ABS dbo.V_R_Service_25（收银日期）', 'partial'],
    mkt: ['短视频平台 / 公开舆情', 'skill_ready'],
    cs: ['ABS dbo.V_R_Service_25（客户入库日期）', 'partial'],
    adm: ['企业微信通讯录 CSV / 人事台账', 'pending_form'],
    loop: ['本地闭环记录（浏览器本地）', 'live'],
    fin: ['ABS dbo.V_R_Service_25（收银日期）', 'pending_auth'],
    autoflow: ['WorkBuddy 自动化中心（实时导出）', 'live'],
    usedcar: ['ABS V_UC_Stock / Sale / Purchase', 'pending_auth'],
    renew: ['ABS 续保客户视图（保险到期日，待授权）', 'pending_auth'],
    overview: ['ABS dbo.V_R_Service_25（综合窗口）', 'partial'],
    gmbrain: ['ABS dbo.V_R_Service_25（综合窗口）', 'partial']
  };
  return map[key] || ['待接入数据源', 'pending_auth'];
}
function renderQueryStatus(start, end) {
  const el = document.getElementById('dqStatus'); if (!el) return;
  const board = (D.sections || []).find(s => s.key === currentKey);
  const title = board ? board.name : (M[currentKey] && M[currentKey].title) ? M[currentKey].title : currentKey;
  const [src, st] = boardSource(currentKey);
  let stateTxt, cls;
  if (st === 'live' && (currentKey === 'loop' || currentKey === 'autoflow')) { stateTxt = '已调用真实数据'; cls = 'ok'; }
  else if (st === 'partial') { stateTxt = 'ABS 部分已接通，接通后按区间自动出数'; cls = 'warn'; }
  else { stateTxt = '待接通，接通后按所选区间自动调用真实数据'; cls = 'warn'; }
  el.className = 'dq-status ' + cls;
  el.innerHTML = '已确认查询区间 <b>' + E(start) + '</b> ~ <b>' + E(end) + '</b> · 当前板块：<b>' + E(title) + '</b> · 数据源：<b>' + E(src) + '</b> · <span>' + stateTxt + '</span> · <b>仅呈现该区间真实数据</b>';
}
let dqConfirmed = false;  // 是否点击过「确认查询」：决定全站区间横幅措辞
function runQuery() {  // 确认查询：选定区间后由本函数触发，重渲染当前板块并按区间过滤真实数据
  const s = document.getElementById('dqStart').value;
  const e = document.getElementById('dqEnd').value;
  if (!s || !e) { alert('请选择完整的起止日期'); return; }
  if (s > e) { alert('起始日期不能晚于结束日期'); return; }
  setRange(s, e);
  dqConfirmed = true;
  renderQueryStatus(s, e);
  go(currentKey);  // 重渲染当前板块，视图内用 queryRange()/filterByRange() 仅呈现区间真实数据
}
/* 全站区间横幅：确认查询后，每个子菜单顶部一致显示当前生效区间，
 * 让「仅呈现该区间真实数据（接通 ABS 后）」在全工作台可见。 */
function queryRangeBanner() {
  const r = queryRange();
  if (!r || !r.start || !r.end) return '';
  const txt = dqConfirmed
    ? `已确认查询区间 <b>${E(r.start)}</b> ~ <b>${E(r.end)}</b> · 本页仅呈现该区间真实数据（接通 ABS 后自动生效）`
    : `当前默认区间 <b>${E(r.start)}</b> ~ <b>${E(r.end)}</b> · 选择区间后点「确认查询」仅呈现该区间真实数据`;
  return `<div class="dq-range-banner ${dqConfirmed ? 'confirmed' : ''}">📅 ${txt}</div>`;
}

/* 模块有效状态：data.js 中 moduleStatusOverride 可把部分模块在取数后动态翻成 live，
 * 使导航圆点与状态徽标与实际数据一致，无需改模块静态定义。 */
const effStatus = (status, key) => {
  if (D.moduleStatusOverride && D.moduleStatusOverride[key]) return D.moduleStatusOverride[key];
  if (key === 'adm.staff' && D.orgLoop && D.orgLoop.org && (D.orgLoop.org.wecom && D.orgLoop.org.wecom.linked || D.orgLoop.org.imported)) return 'partial';
  if (key === 'adm.org' && D.orgLoop && D.orgLoop.org && D.orgLoop.org.imported) return 'partial';
  return status;
};
const E = CH.esc;

const STATUS_TXT = {
  live: 'ABS 实时真数', partial: '部分真数', pending_auth: '待 ABS 授权',
  pending_crm: '待接 CRM', pending_form: '待台账接入', skill_ready: '工作流已就绪',
  paused: '已暂停', ready: '脚本就绪'
};

const ICONS = {
  gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21a9 9 0 1 0-9-9"/><path d="M12 12l4-4"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17h14M4 17V11l2-5h12l2 5v6"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 0 0 5 5l-9 9a2.8 2.8 0 0 1-4-4l9-9-1 -1z"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11v2l14 5V6L3 11z"/><path d="M17 9a3 3 0 0 1 0 6"/><path d="M7 13v5"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 4a3 3 0 0 0-3 3v0a3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 0V5a3 3 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3v0a3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 0V5a3 3 0 0 1 3-1z"/></svg>',
  headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="6" rx="1.6"/><rect x="17.5" y="13" width="4" height="6" rx="1.6"/><path d="M20 19v1a2 2 0 0 1-2 2h-4"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6"/><path d="M18 20a6.4 6.4 0 0 0-2.4-5"/></svg>',
  coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/><path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/></svg>',
  plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2v6M15 2v6"/><path d="M6 8h12v3a6 6 0 0 1-12 0V8z"/><path d="M12 17v5"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9z"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  loop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
  flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l8-8h8v8l-8 8z"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/></svg>',
  caret: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>'
};

/* ---------- 工具 ---------- */
const num = v => (v == null ? '—' : (+v).toLocaleString('zh-CN'));
const money = v => (v == null ? '—' : Math.round(+v).toLocaleString('zh-CN'));
const wan = v => (v == null ? '—' : (+v / 1e4).toFixed(1));
const pct = (a, b) => (b ? (a / b * 100).toFixed(1) : '0.0');
const maskPhone = p => (!p ? '—' : /^(\d{3})\d{4}(\d{4})$/.test(p) ? p.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : p);
const bdg = s => `<span class="bdg ${s}">${STATUS_TXT[s] || s}</span>`;
const trendHtml = (t, note) => {
  if (t == null) return '';
  const up = t >= 0;
  return `<div class="kpi-tr ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(t).toFixed(1)}%${note ? `<em>${E(note)}</em>` : ''}</div>`;
};
const kpiCard = k => {
  const na = k.value == null;
  return `<div class="kpi ${na ? 'na' : ''}">
    <div class="kpi-lb">${E(k.label)}${na ? bdg(k.status) : ''}</div>
    <div class="kpi-vl ${na ? 'na' : ''}">${na ? '待接入' : money(k.value) + `<u>${E(k.unit || '')}</u>`}</div>
    <div class="kpi-sb">${E(k.sub || '')}</div>
    ${trendHtml(k.trend, k.trendNote)}
  </div>`;
};
const card = (title, body, sub, extra) => `<div class="card">
  <div class="card-hd"><h4>${E(title)}</h4>${extra || ''}${sub ? `<div class="sub">${sub}</div>` : ''}</div>
  <div class="card-bd">${body}</div></div>`;
const secTitle = (t, hint) => `<div class="sec-title"><h3>${E(t)}</h3><div class="ln"></div>${hint ? `<div class="hint">${E(hint)}</div>` : ''}</div>`;
const note = (t, c) => `<div class="note ${c || ''}">${t}</div>`;

/* ---------- 导航 ---------- */
function buildNav() {
  let h = `<div class="nav-item nav-gm" data-go="gmbrain" id="nav-gmbrain">
      <span class="nav-ico">${ICONS.brain}</span>辉达奇瑞经营中枢</div>
    <div class="nav-item" data-go="overview" id="nav-overview">
      <span class="nav-ico">${ICONS.gauge}</span>全店总览驾驶舱</div>
    <div class="nav-item" data-go="datasource" id="nav-datasource">
      <span class="nav-ico">${ICONS.plug}</span>数据接入状态</div>
    <div class="nav-sep"></div>`;
  D.sections.forEach(s => {
    const liveN = s.items.filter(i => effStatus(i.status, i.key) === 'live').length;
    h += `<div class="nav-grp" id="grp-${s.key}">
      <div class="nav-item nav-head" data-grp="${s.key}">
        <span class="nav-ico">${ICONS[s.icon]}</span>${E(s.name)}
        <span class="nav-caret">${ICONS.caret}</span>
      </div>
      <div class="nav-sub">
        ${s.items.map(i => `<div class="nav-sub-item" data-go="${i.key}" id="nav-${i.key}">
            <span class="dot ${effStatus(i.status, i.key)}"></span>${E(i.name)}${i.key === 'loop.board' ? '<span class="nav-badge" id="nav-loop-badge" style="display:none"></span>' : ''}${i.key === 'loop.today' ? '<span class="nav-badge urgent" id="nav-urgent-badge" style="display:none"></span>' : ''}</div>`).join('')}
      </div></div>`;
  });
  document.getElementById('nav').innerHTML = h;
  document.querySelectorAll('[data-grp]').forEach(el => {
    el.onclick = () => document.getElementById('grp-' + el.dataset.grp).classList.toggle('open');
  });
  document.querySelectorAll('[data-go]').forEach(el => {
    el.onclick = () => go(el.dataset.go);
  });
}

/* ---------- 路由 ---------- */
function go(key) {
  currentKey = key;
  location.hash = key;
  document.querySelectorAll('.nav-item,.nav-sub-item').forEach(e => e.classList.remove('on'));
  const n = document.getElementById('nav-' + key);
  if (n) n.classList.add('on');
  const sec = D.sections.find(s => s.items.some(i => i.key === key));
  if (sec) document.getElementById('grp-' + sec.key).classList.add('open');

  let crumbTop = '工作台', crumbMain = '', body = '';
  if (key === 'overview') { crumbMain = '全店总览驾驶舱'; body = VIEWS.overview(); }
  else if (key === 'gmbrain') { crumbMain = '辉达奇瑞经营中枢'; body = VIEWS.gmBrain(); }
  else if (key === 'datasource') { crumbMain = '数据接入状态'; body = VIEWS.datasource(); }
  else {
    const m = M[key];
    if (!m) { crumbMain = '未找到'; body = `<div class="note warn">模块 ${E(key)} 未定义。</div>`; }
    else {
      crumbTop = D.sections.find(s => s.key === m.section)?.name || '工作台';
      crumbMain = m.title;
      body = (m.render && VIEWS[m.render]) ? VIEWS[m.render](m) : VIEWS.pending(m, key);
    }
  }
  const flowBar = (M[key] && !['overview','gmbrain','datasource','loop.board'].includes(key)) ? renderFlowBar(M[key]) : '';
  const banner = queryRangeBanner();
  document.getElementById('crumb').innerHTML = `${E(crumbTop)}<b>${E(crumbMain)}</b>`;
  document.getElementById('content').innerHTML = banner + (flowBar ? flowBar + body : body) + VIEWS.footer();
  document.querySelectorAll('[data-jump]').forEach(el => { el.onclick = () => go(el.dataset.jump); });
  document.querySelectorAll('[data-run-flow]').forEach(b => { b.onclick = () => runWorkflow(b.dataset.flowName, b.dataset.runFlow); });
  refreshLoopBadge();
  refreshUrgentBadge();
  window.scrollTo({ top: 0 });
}

/* ---------- 组织架构与闭环：提醒 / 认领 / 闭环提交 / 验证 ---------- */
const LOOP_KEY = 'cockpit_loops_v1';
const LOOP_FULL_KEY = 'cockpit_loops_full_v1';
const PUSHLOG_KEY = 'cockpit_pushlog_v1';
const ORG_KEY = 'cockpit_org_v1';
const LOOP_STATUS = { open: '待处理', handling: '处理中', verifying: '待验证', closed: '已闭环' };

function loadOrg() {
  let base = D.orgLoop.org;
  try {
    const ov = JSON.parse(localStorage.getItem(ORG_KEY) || 'null');
    if (ov && ov.departments && ov.departments.length) base = Object.assign({}, base, ov, { imported: true });
  } catch (e) {}
  return base;
}
function deptName(id) { const d = loadOrg().departments.find(x => x.id === id); return d ? d.name : id; }
function deptLead(id) { const d = loadOrg().departments.find(x => x.id === id); return d ? d.lead : ''; }
/* 板块 ↔ 责任部门 自动对应：导入组织架构后，按 sectionDeptMap 解析真实部门与责任人，
 * 为后续任务提醒与数据采集提供归属参考。部门不存在时回退到板块默认名。 */
function sectionDeptObj(secKey) {
  const map = (D.orgLoop && D.orgLoop.sectionDeptMap) || {};
  const did = map[secKey];
  if (!did) return null;
  const org = loadOrg();
  const d = org.departments.find(x => x.id === did);
  if (d) return d;
  const sec = D.sections.find(s => s.key === secKey);
  return { id: did, name: sec ? sec.name : did, lead: '—' };
}

function loadLoops() {
  const base = D.orgLoop.loops.samples.map(s => Object.assign({}, s, { history: (s.history || []).slice() }));
  let store = {}, created = [];
  try { store = JSON.parse(localStorage.getItem(LOOP_KEY) || '{}') || {}; } catch (e) {}
  try { created = JSON.parse(localStorage.getItem(LOOP_FULL_KEY) || '[]') || []; } catch (e) {}
  const byId = {};
  base.forEach(l => { const st = store[l.id]; if (st) { l.status = st.status || l.status; if (st.history) l.history = st.history.slice(); } byId[l.id] = l; });
  created.forEach(c => {
    if (byId[c.id]) { const st = store[c.id]; if (st) { byId[c.id].status = st.status || byId[c.id].status; if (st.history) byId[c.id].history = st.history.slice(); } }
    else byId[c.id] = Object.assign({}, c, { status: (store[c.id] && store[c.id].status) || c.status || 'open' });
  });
  return Object.keys(byId).map(id => byId[id]);
}
function saveLoop(id, status, entry) {
  let store = {};
  try { store = JSON.parse(localStorage.getItem(LOOP_KEY) || '{}') || {}; } catch (e) {}
  const cur = store[id] || { status: null, history: [] };
  cur.status = status;
  cur.history = (cur.history || []).concat(entry ? [entry] : []);
  store[id] = cur;
  localStorage.setItem(LOOP_KEY, JSON.stringify(store));
  persistLoopsToServer();
}
function fmtDur(ms) {
  const h = ms / 3600000;
  if (h < 1) return Math.round(h * 60) + ' 分钟';
  if (h < 48) return h.toFixed(1) + ' 小时';
  return (h / 24).toFixed(1) + ' 天';
}
function loopRemind(l) {
  const rem = new Date(l.dueAt).getTime() - Date.now();
  if (rem < 0) return { level: 'over', txt: '已超时 ' + fmtDur(-rem) };
  if (rem < 24 * 3600 * 1000) return { level: 'near', txt: '剩余 ' + fmtDur(rem) };
  return { level: 'ok', txt: '剩余 ' + fmtDur(rem) };
}
function refreshLoopBadge() {
  const n = loadLoops().filter(l => l.status !== 'closed').length;
  const b = document.getElementById('nav-loop-badge');
  if (b) { b.style.display = n ? 'inline-block' : 'none'; b.textContent = n; }
}
function pushLoopReminder(l, level) {
  /* 企微连通(window.__WECOM_READY__)后由 wecom-hub 真实推送；离线仅准备 payload 并落本地 */
  const payload = { to: deptLead(l.dept), level, title: l.title, remind: loopRemind(l).txt, loopId: l.id, src: 'loop' };
  return pushUrgent(payload);
}
/* ---------- 企微推送（window.__WECOM_READY__ 钩子） ---------- */
function pushNotifiedToday(id) {
  try { const p = JSON.parse(localStorage.getItem(PUSHLOG_KEY) || '{}'); return p[id] && (new Date(p[id]).toDateString() === new Date().toDateString()); } catch (e) { return false; }
}
function markPushed(id) {
  try { const p = JSON.parse(localStorage.getItem(PUSHLOG_KEY) || '{}'); p[id] = Date.now(); localStorage.setItem(PUSHLOG_KEY, JSON.stringify(p)); } catch (e) {}
}
function pushUrgent(payload) {
  payload = payload || {};
  const log = (msg) => {
    const el = document.getElementById('wecom-log');
    if (el) { const d = document.createElement('div'); d.className = 'wl'; d.textContent = '[' + new Date().toLocaleTimeString('zh-CN') + '] ' + msg; el.prepend(d); }
  };
  if (window.__WECOM_READY__) {
    if (typeof window.__WECOM_PUSH__ === 'function') { window.__WECOM_PUSH__(payload); log('已推送：' + (payload.title || '')); return payload; }
    fetch('/api/wecom/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      .then(r => { if (r.ok) log('已推送（服务端）：' + (payload.title || '')); else log('服务端拒绝，已本地记录'); })
      .catch(() => log('服务端 /api/wecom/push 不可用（非内网部署），已本地记录待发'));
    return payload;
  }
  log('企微未连通，仅本地记录：' + (payload.title || ''));
  return payload;
}
function toggleWecom() {
  window.__WECOM_READY__ = !window.__WECOM_READY__;
  if (window.__WECOM_READY__) {
    window.__WECOM_PUSH__ = function (p) { toast('[企微推送→' + (p.to || '?') + '] ' + (p.title || '')); };
  } else { window.__WECOM_PUSH__ = null; }
  const st = document.getElementById('wecom-state');
  if (st) { st.textContent = window.__WECOM_READY__ ? '已模拟连通（联调）' : '未连通'; st.className = window.__WECOM_READY__ ? 'chip ok' : 'chip'; }
  const btn = document.getElementById('wecom-toggle');
  if (btn) btn.textContent = window.__WECOM_READY__ ? '断开模拟' : '模拟连通（联调）';
  toast('企微推送：' + (window.__WECOM_READY__ ? '已模拟连通，转闭环/超时将推送' : '已断开'));
}
/* ---------- 闭环服务端持久化（P2）：内网 Node 部署下换设备/换人可见可审计 ---------- */
function persistLoopsToServer() {
  /* 仅在真正的内网服务（存在 /api/loops 且鉴权通过）下推送；静态部署无此接口则静默降级 */
  try {
    const payload = {
      created: JSON.parse(localStorage.getItem(LOOP_FULL_KEY) || '[]'),
      status: JSON.parse(localStorage.getItem(LOOP_KEY) || '{}')
    };
    fetch('/api/loops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      .then(r => { if (!r.ok) {/* 静态部署无此接口，忽略 */} })
      .catch(() => {});
  } catch (e) {}
}
function syncLoopsFromServer() {
  fetch('/api/loops', { credentials: 'same-origin' })
    .then(r => { if (!r.ok) return null; return r.json(); })
    .then(remote => {
      if (!remote || !remote.synced) {
        /* 服务端尚未初始化：若本地已有数据则推送 seed，使其它设备可拉取 */
        const lc = JSON.parse(localStorage.getItem(LOOP_FULL_KEY) || '[]');
        const ls = JSON.parse(localStorage.getItem(LOOP_KEY) || '{}');
        if (lc.length || Object.keys(ls).length) persistLoopsToServer();
        return;
      }
      localStorage.setItem(LOOP_FULL_KEY, JSON.stringify(remote.created || []));
      localStorage.setItem(LOOP_KEY, JSON.stringify(remote.status || {}));
      refreshLoopBadge(); refreshUrgentBadge();
      const cur = location.hash.replace('#', '');
      if (cur === 'loop.board' || cur === 'loop.today') go(cur);
    })
    .catch(() => {});
}
/* 今日必办角标 */
function refreshUrgentBadge() {
  const alerts = (D.overview.alerts || []).filter(a => a.level === 'high' || a.level === 'mid').length;
  const overdue = loadLoops().filter(l => l.status !== 'closed' && loopRemind(l).level !== 'ok').length;
  const n = alerts + overdue;
  const b = document.getElementById('nav-urgent-badge');
  if (b) { b.style.display = n ? 'inline-block' : 'none'; b.textContent = n; }
}
/* 由今日必办聚合器一键转闭环 */
function createLoopFromUrgent(item) {
  if (!item) return;
  let created = [];
  try { created = JSON.parse(localStorage.getItem(LOOP_FULL_KEY) || '[]') || []; } catch (e) {}
  if (created.find(c => c.id === item.id)) { go('loop.board'); return; }
  const now = new Date();
  const due = new Date(now.getTime() + (item.slaHours || 24) * 3600000);
  const loop = {
    id: item.id, tpl: item.from === 'loop' ? (item.tpl || 'T-urgent') : 'T-urgent',
    title: item.title, trigger: (item.src || '今日必办') + ' · ' + (item.desc || '').slice(0, 80),
    dept: item.dept, owner: item.owner, slaHours: item.slaHours || 24, remindHours: [1, 4],
    createdAt: now.toISOString(), dueAt: due.toISOString(), status: 'open', history: []
  };
  created.push(loop);
  try { localStorage.setItem(LOOP_FULL_KEY, JSON.stringify(created)); } catch (e) {}
  saveLoop(item.id, 'open', { at: now.toISOString(), by: item.owner, act: 'create', note: '由今日必办聚合器转入', from: 'urgent' });
  markPushed(item.id);
  pushUrgent({ to: deptLead(item.dept), level: item.level || 'mid', title: item.title, remind: '新转入闭环', loopId: item.id, src: 'urgent' });
  toast('已转入闭环：' + item.title);
  refreshUrgentBadge();
  go('loop.board');
}

function importOrgUI() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        if (!j.departments || !j.departments.length) throw new Error('缺少 departments 字段');
        const org = Object.assign({}, D.orgLoop.org, j, { imported: true, importedAt: new Date().toISOString() });
        localStorage.setItem(ORG_KEY, JSON.stringify(org));
        go('adm.org');
      } catch (err) { alert('导入失败：' + err.message); }
    };
    r.readAsText(f);
  };
  inp.click();
}
function openLoopModal(id) {
  const l = loadLoops().find(x => x.id === id); if (!l) return;
  const ov = document.getElementById('loopModal'); if (ov) ov.remove();
  const div = document.createElement('div');
  div.id = 'loopModal'; div.className = 'modal-ov';
  div.innerHTML = `<div class="modal">
    <div class="modal-hd">提交闭环 · ${E(l.title)}</div>
    <div class="modal-bd">
      <label class="mf">处理结果
        <select id="lm-result"><option>已解决</option><option>部分解决</option><option>需升级</option></select></label>
      <label class="mf">处理备注<textarea id="lm-note" rows="3" placeholder="填写处理过程与结论"></textarea></label>
      <label class="mf">证据 / 链接<textarea id="lm-evd" rows="2" placeholder="企微会话、工单号、照片链接等"></textarea></label>
      <label class="mf">责任人确认<input id="lm-by" value="${E(l.owner)}"></label>
    </div>
    <div class="modal-ft">
      <button class="btn ghost" id="lm-cancel">取消</button>
      <button class="btn primary" id="lm-submit">提交闭环</button>
    </div></div>`;
  document.body.appendChild(div);
  document.getElementById('lm-cancel').onclick = () => div.remove();
  div.onclick = e => { if (e.target === div) div.remove(); };
  document.getElementById('lm-submit').onclick = () => {
    const by = document.getElementById('lm-by').value.trim() || l.owner;
    const note = document.getElementById('lm-note').value.trim();
    const evd = document.getElementById('lm-evd').value.trim();
    const result = document.getElementById('lm-result').value;
    saveLoop(id, 'verifying', { at: new Date().toISOString(), by, act: 'submit', result, note, evd });
    div.remove(); go('loop.board');
  };
}
function loopAct(id, act) {
  const l = loadLoops().find(x => x.id === id); if (!l) return;
  if (act === 'claim') { saveLoop(id, 'handling', { at: new Date().toISOString(), by: l.owner, act: 'claim', note: '已认领，开始处理' }); pushUrgent({ to: deptLead(l.dept), level: 'mid', title: l.title, remind: '已认领', loopId: l.id, src: 'loop' }); }
  else if (act === 'verify') { saveLoop(id, 'closed', { at: new Date().toISOString(), by: deptLead(l.dept), act: 'verify', note: '验证通过，闭环完成' }); pushUrgent({ to: '总经理', level: 'good', title: l.title, remind: '闭环已完成', loopId: l.id, src: 'loop' }); }
  else if (act === 'submit') { openLoopModal(id); return; }
  go('loop.board');
}

/* ---------- 启动 ---------- */
function boot() {
  document.getElementById('topInfo').innerHTML =
    `<span class="chip ok">● ABS 已连通 · ${E(D.meta.absView)}</span>
     <span class="chip">数据截至 ${E(D.meta.dataDate)}</span>
     <span class="chip">刷新于 ${E(D.meta.generatedAt)}</span>`;
  buildNav();
  refreshLoopBadge();
  refreshUrgentBadge();
  syncLoopsFromServer(); /* 内网部署下拉取服务端闭环副本；静态部署自动降级 */
  /* 企微推送联调开关：内网部署时由 server.js 注入 window.__WECOM_READY__=true；本地默认 false */
  if (typeof window.__WECOM_READY__ === 'undefined') window.__WECOM_READY__ = false;
  /* 启动即扫描超时闭环任务，企微连通时自动推送责任人（每日每任务仅一次） */
  loadLoops().forEach(l => {
    if (l.status !== 'closed' && loopRemind(l).level === 'over' && !pushNotifiedToday(l.id)) {
      pushUrgent({ to: deptLead(l.dept), level: 'high', title: l.title, remind: loopRemind(l).txt, loopId: l.id, src: 'overdue' });
      markPushed(l.id);
    }
  });

  /* 日期区间查询：默认覆盖样本月度数据窗口 (2026-05 ~ 数据截至日) */
  const def = loadRange() || { start: '2026-05-01', end: D.meta.dataDate };
  if (!loadRange()) localStorage.setItem(DQ_KEY, JSON.stringify(def));
  const ds = document.getElementById('dqStart'), de = document.getElementById('dqEnd');
  if (ds) ds.value = def.start; if (de) de.value = def.end;
  renderDqCur();
  const btn = document.getElementById('dqQuery');
  if (btn) btn.addEventListener('click', runQuery);
  document.querySelectorAll('#dquery [data-preset]').forEach(b => {
    b.addEventListener('click', () => { const r = presetRange(b.dataset.preset); setRange(r.start, r.end); runQuery(); });
  });
  [ds, de].forEach(inp => { if (inp) inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') runQuery(); }); });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-loop-act]');
    if (a) { loopAct(a.dataset.loopId, a.dataset.loopAct); return; }
    const uc = e.target.closest('[data-urgent-create]');
    if (uc) { const item = (window.__URGENT_ITEMS__ || {})[uc.dataset.urgentId]; if (item) createLoopFromUrgent(item); return; }
    const uv = e.target.closest('[data-urgent-view]');
    if (uv) { go('loop.board'); return; }
    const wt = e.target.closest('[data-wecom-toggle]');
    if (wt) { toggleWecom(); return; }
    if (e.target.closest('[data-org-import]')) { importOrgUI(); return; }
    if (e.target.closest('[data-org-reset]')) { localStorage.removeItem(ORG_KEY); go('adm.org'); return; }
    if (e.target.closest('[data-org-export]')) {
      const blob = new Blob([JSON.stringify({ org: loadOrg(), loops: loadLoops(), exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '闭环记录_' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
      return;
    }
  });
  const h = location.hash.replace('#', '');
  go(h && (h === 'overview' || h === 'gmbrain' || h === 'datasource' || h === 'loop.board' || M[h]) ? h : 'gm.cockpit');
}
/* ---------- 板块内工作流触发（P0-2） ---------- */
function extractWf(text) { const m = String(text || '').match(/WF-\d+/i); return m ? m[0].toUpperCase() : null; }
function matchFlows(text) {
  const wf = extractWf(text); if (!wf) return [];
  return (window.__AUTOFLOWS__ || []).filter(a => a.wf === wf);
}
function sectionFlows(secKey) {
  const out = [], seen = new Set();
  Object.keys(M).forEach(k => {
    const mod = M[k];
    if (!mod || mod.section !== secKey || !mod.workflow) return;
    const flows = matchFlows(mod.workflow);
    if (flows.length) flows.forEach(f => { if (seen.has(f.id)) return; seen.add(f.id); out.push({ wf: f.wf, name: f.name, status: f.status }); });
    else { const wf = extractWf(mod.workflow); if (wf && !seen.has(wf)) { seen.add(wf); out.push({ wf: wf, name: mod.workflow, status: 'independent' }); } }
  });
  return out;
}
function renderFlowBar(m) {
  const flows = sectionFlows(m.section);
  if (!flows.length) return '';
  return `<div class="flow-bar">
    <div class="flow-bar-h"><span class="flow-dot"></span>本板块工作流<span class="muted">点一下即在 WorkBuddy 自动化中心发起对应自动流</span></div>
    <div class="flow-chips">${flows.map(f => `<button class="flow-chip" data-run-flow="${E(f.wf)}" data-flow-name="${E(f.name)}">
      <span class="wf-id">${E(f.wf)}</span>
      <span class="wf-nm">${E(f.name)}</span>
      <span class="wf-st ${f.status === 'ACTIVE' ? 'on' : f.status === 'PAUSED' ? 'off' : ''}">${f.status === 'ACTIVE' ? '运行中' : f.status === 'PAUSED' ? '已暂停' : '独立'}</span>
    </button>`).join('')}</div>
  </div>`;
}
const FLOW_LOG_KEY = 'cockpit_flowlog_v1';
function loadFlowLog() { try { return JSON.parse(localStorage.getItem(FLOW_LOG_KEY) || '[]'); } catch (e) { return []; } }
function saveFlowLog(a) { try { localStorage.setItem(FLOW_LOG_KEY, JSON.stringify(a)); } catch (e) {} }
function toast(msg) {
  let t = document.getElementById('cockpitToast');
  if (!t) { t = document.createElement('div'); t.id = 'cockpitToast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove('show'), 3400);
}
function runWorkflow(flowName, wf) {
  /* 若后端注入了真实触发入口（内网 Node 服务 / WorkBuddy API），优先调用；否则记入本地运行队列 */
  if (typeof window.__RUN_FLOW__ === 'function') {
    try { window.__RUN_FLOW__(wf, flowName); toast('已提交运行：' + flowName); return; } catch (e) {}
  }
  const log = loadFlowLog();
  log.unshift({ wf: wf || '', name: flowName, at: new Date().toISOString(), status: 'queued_local' });
  saveFlowLog(log.slice(0, 60));
  toast('已记入运行队列：' + flowName + '（请在 WorkBuddy 自动化中心确认执行）');
}

window.addEventListener('DOMContentLoaded', boot);
window.addEventListener('hashchange', () => {
  const h = location.hash.replace('#', '');
  if (h) { const cur = document.getElementById('crumb'); if (cur) go(h); }
});
