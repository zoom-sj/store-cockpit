/* 财务板块 · 月度厂家政策核算（商务政策分析能力植入）
 * 数据源：window.__POLICY__（data/policy-2026-08.js）+ 可导入的月度厂家政策表（添加文件）
 * 能力：①各车型 110% 档单台综合返利政策库（支持导入当月政策表）②月度返利达成核对计算器 ③台阶专项达成明细 ④月度选择查询各月返利 */
const FP_MONTH_KEY = 'cockpit_finpolicy_month_v1';
let FP_MONTH = (function () { try { return localStorage.getItem(FP_MONTH_KEY) || ''; } catch (e) { return ''; } })();
VIEWS.finPolicy = function (m) {
  const P = fpPolicy();
  const models = P.models || [];
  const tiers = P.tiers || {};
  const dealer = P.dealerTier || null;
  const fmt = v => (v == null ? '—' : Math.round(+v).toLocaleString('zh-CN'));

  let h = moduleHero(m);

  /* ---------- 月度政策与查询（添加文件 + 月度选择） ---------- */
  const monthOpts = ['<option value="">全部月份</option>'].concat(
    Array.from({ length: 12 }, (_, i) => { const mm = '2026-' + String(i + 1).padStart(2, '0'); return '<option value="' + mm + '">' + mm + '</option>'; })
  ).join('');
  h += secTitle('月度政策与查询', '导入当月厂家政策表（添加文件）覆盖政策库；选择月份查询该月返利（与导入台账联动）');
  h += `<div class="card"><div class="card-bd">
    <div class="fp-bar" style="flex-wrap:wrap;gap:10px">
      <label class="fp-lb">查询月份
        <select id="fpMonth" class="fp-sel">${monthOpts}</select></label>
      <label class="fp-lb">月度厂家政策表（添加文件）
        <input id="fpPolFile" class="fp-in" type="file" accept=".xlsx,.xls,.csv"></label>
      <button class="dq-btn primary" id="fpPolParse">解析政策表</button>
      <button class="dq-btn ghost" id="fpPolTpl">下载模板</button>
      <button class="dq-btn ghost" id="fpPolClear">清除导入</button>
    </div>
    <div class="note" style="margin-top:8px">政策表列建议：<b>车系 / 车型 / 版型 / 基本折让K / 实销奖励M / 实销专项Q / 万能红包S / 新媒体U</b>。导入后该月政策库即以你导入的表为准（台阶专项阈值沿用内置库）。不导入则使用内置 2026-08 政策库。</div>
    <div id="fpPolStatus" class="note" style="margin-top:8px"></div>
  </div></div>`;

  /* ---------- 口径速览 ---------- */
  const tieredN = models.filter(x => x.tier).length;
  const comps = models.map(x => x.comp110).filter(v => v > 0);
  const minC = comps.length ? Math.min.apply(null, comps) : 0;
  const maxC = comps.length ? Math.max.apply(null, comps) : 0;
  h += secTitle('口径速览', P.month + ' · 110% 档口径');
  h += `<div class="grid g4">
    ${kpiCard({ label: '在售车型/版型', value: models.length, unit: '个', status: 'live', sub: '覆盖在售版型+版型精简' })}
    ${kpiCard({ label: '台阶专项车型', value: tieredN, unit: '款', status: 'live', sub: '返利随实销量 T 分档' })}
    ${kpiCard({ label: '单台综合返利(110%档)区间', value: null, unit: '元', status: 'live', sub: fmt(minC) + ' ~ ' + fmt(maxC) })}
    ${kpiCard({ label: '全系增幅专项', value: null, unit: '', status: 'live', sub: dealer ? '经销商层面·按 T 与 S 计奖' : '—' })}
  </div>`;
  h += `<div class="note" style="margin-top:10px"><b>口径：</b>${E(P.note || '')} 提车档位按 <b>110% 档</b> 计算返利；台阶达成车型在单一车型后列明各档对应返利。</div>`;

  /* ---------- 月度返利达成核对 ---------- */
  h += secTitle('月度返利达成核对', '选择车型与版型，填入当月提车完成率 R / 实销量 T，实时测算综合返利达成与拿满率');
  const opts = models.map(x => `<option value="${E(x.id)}">${E(x.model)}${x.sub ? ' · ' + E(x.sub) : ''}</option>`).join('');
  h += `<div class="card"><div class="card-bd">
    <div class="fp-bar">
      <label class="fp-lb">车型 / 版型
        <select id="fpModel" class="fp-sel">${opts}</select></label>
      <label class="fp-lb">提车完成率 R（%）
        <input id="fpR" class="fp-in" type="number" min="0" step="1" value="110"></label>
      <label class="fp-lb" id="fpTlb">全月实销量 T（台）
        <input id="fpT" class="fp-in" type="number" min="0" step="1" value="0"></label>
    </div>
    <div id="fpBreak" class="fp-break"></div>
    <div id="fpResult"></div>
    <div class="note" style="margin-top:10px">测算说明：基本折让 K 固定计足；实销奖励 M、实销专项 Q 按完成率 R 线性估算（≥110% 计满，100–110% 按 (R−100)/10 插值，<100% 计 0）；万能红包 S、新媒体 U 为条件性政策，达成即满。精确核算以配套 Excel 月度返利达成核对(模板) 为准。</div>
  </div></div>`;

  /* ---------- 各车型返利政策库（110%档） ---------- */
  h += secTitle('各车型返利政策库（110% 档）', '基本折让K + 实销奖励M + 实销专项Q + 万能红包/星火燎原S + 新媒体U = 单台综合返利(110%档)');
  h += `<div class="card"><div class="card-bd" style="padding:0">
    <div class="fp-search"><input id="fpSearch" class="fp-in" placeholder="搜索车系 / 车型 / 版型…" style="max-width:320px"></div>
    <div style="overflow:auto;max-height:460px">
    <table class="tbl" id="fpLib">
      <thead><tr><th>车系</th><th>车型</th><th>型号/动力</th><th>K</th><th>M(110%)</th><th>Q</th><th>S</th><th>U</th><th>综合(110%)</th><th>台阶</th></tr></thead>
      <tbody id="fpLibBody">${fpPolicyLibRows(P)}</tbody>
    </table></div>
  </div></div>`;

  /* ---------- 台阶专项达成明细 ---------- */
  h += secTitle('台阶专项达成明细', '单车型的实销台阶专项（按车型实销量 T 分档）+ 全系实销增幅专项（经销商层面）');
  const tierCards = Object.keys(tiers).map(k => {
    const g = tiers[k];
    const rows = g.rows.map(r => `<tr><td>${E(r.t)}</td><td><b>${fmt(r.v)}</b> 元/台</td></tr>`).join('');
    return `<div class="card"><div class="card-hd"><h4>${E(k)}</h4></div>
      <div class="card-bd"><div class="sub" style="margin-bottom:8px">${E(g.name)}</div>
      <div class="kv"><b>考核基准</b><span>${E(g.basis)}</span></div>
      <table class="tbl" style="margin-top:8px"><thead><tr><th>台阶(T)</th><th>对应返利</th></tr></thead><tbody>${rows}</tbody></table>
    </div></div>`;
  }).join('');
  h += `<div class="grid g2">${tierCards}</div>`;

  if (dealer) {
    const drows = dealer.rows.map(r => `<tr><td>${E(r.t)}</td><td><b>${E(r.v)}</b></td></tr>`).join('');
    h += `<div class="card" style="margin-top:12px"><div class="card-hd"><h4>${E(dealer.name)}</h4></div>
      <div class="card-bd">
        <div class="kv"><b>考核基准</b><span>${E(dealer.basis)}</span></div>
        <div class="kv"><b>说明</b><span>${E(dealer.note || '')}</span></div>
        <div class="fp-bar" style="margin:12px 0 6px">
          <label class="fp-lb">全店全系实销量 T（台）
            <input id="fpDT" class="fp-in" type="number" min="0" step="1" value="60"></label>
          <label class="fp-lb">增幅系数 S（=8月/7月，封顶1.3）
            <input id="fpDS" class="fp-in" type="number" min="0" step="0.01" value="1.1"></label>
        </div>
        <div id="fpDResult"></div>
        <table class="tbl" style="margin-top:8px"><thead><tr><th>台阶(T)</th><th>对应返利(元/台)</th></tr></thead><tbody>${drows}</tbody></table>
      </div></div>`;
  }

  /* ---------- 月度实际销售台账导入与单台返利核算 ---------- */
  h += secTitle('月度销售台账导入 · 单台返利核算', '导入当月实际销售台账（Excel/CSV），自动按车型匹配厂家政策库，逐台核算总返利；并随顶栏查询区间过滤');
  h += `<div class="card"><div class="card-bd">
    <div class="fp-bar" style="flex-wrap:wrap;gap:10px">
      <label class="fp-lb">月度实际销售台账
        <input id="fpLedgerFile" class="fp-in" type="file" accept=".xlsx,.xls,.csv"></label>
      <button class="dq-btn primary" id="fpLedgerParse">解析并核算</button>
      <button class="dq-btn ghost" id="fpLedgerTpl">下载模板</button>
      <button class="dq-btn ghost" id="fpLedgerClear">清除导入</button>
    </div>
    <div class="note" style="margin-top:8px">台账列建议：<b>交车日期 / 车系 / 车型 / 版型 / VIN / 客户 / 成交价 / 是否金融 / 是否保险 / 是否置换 / 是否大客户</b>。系统按「车型+版型」模糊匹配厂家政策库；条件返利按下列配置计入每台总返利。</div>
    <div class="fp-bar" style="margin-top:10px;flex-wrap:wrap;gap:10px">
      <label class="fp-lb">金融单台返利(元)<input id="fpCfgFin" class="fp-in" type="number" min="0" step="100" value="0"></label>
      <label class="fp-lb">保险单台返利(元)<input id="fpCfgIns" class="fp-in" type="number" min="0" step="100" value="0"></label>
      <label class="fp-lb">置换单台返利(元)<input id="fpCfgTrade" class="fp-in" type="number" min="0" step="100" value="20000"></label>
      <label class="fp-lb">大客户单台返利(元)<input id="fpCfgBig" class="fp-in" type="number" min="0" step="100" value="0"></label>
      <label class="fp-lb">提车完成率R(%)<input id="fpCfgR" class="fp-in" type="number" min="0" step="1" value="110"></label>
      <label class="fp-lb">增幅系数S(封顶1.3)<input id="fpCfgS" class="fp-in" type="number" min="0" step="0.01" value="1.1"></label>
    </div>
    <div id="fpLedgerStatus" class="note" style="margin-top:10px"></div>
    <div id="fpLedgerResult"></div>
  </div></div>`;

  h += `<div class="note" style="margin-top:12px"><b>重要前提：</b>综合返利含新媒体专项(约 400 元，前提本地通消耗≥10 万) 与万能红包，属条件性政策；个贷贴息 / 置换为金融与置换支持，不计入纯返利。实际返利以厂家政策正文及当月实销 / 提车数据为准。本页数据由《关于2026年8月艾虎各产品营销政策的通知》+ 基础政策简明表解析生成（${E(P.source || '')}）。</div>`;

  /* 渲染后挂载交互（innerHTML 注入的脚本不执行，故用 setTimeout 在 DOM 就绪后绑定） */
  setTimeout(initFinPolicy, 0);
  return h;
};

/* ---------- 交互逻辑 ---------- */
function matchTier(t, T) {
  t = String(t).trim();
  if (t.indexOf('≥') >= 0) { const n = parseFloat(t.split('≥')[1]); return T >= n; }
  if (t.indexOf('≤') >= 0 && t.indexOf('<') >= 0) { const m = t.match(/(\d+)\s*≤\s*T\s*<\s*(\d+)/); if (m) return T >= +m[1] && T < +m[2]; }
  if (t.indexOf('T<') === 0) { return T < parseFloat(t.slice(2)); }
  if (t.indexOf('T=') === 0) { return T === parseFloat(t.slice(2)); }
  return false;
}
function fpModelById(id) {
  const P = fpPolicy();
  return (P.models || []).find(x => x.id === id) || null;
}
function initFinPolicy() {
  const P = fpPolicy();
  const fmt = v => (v == null ? '—' : Math.round(+v).toLocaleString('zh-CN'));
  const sel = document.getElementById('fpModel');
  const rEl = document.getElementById('fpR');
  const tEl = document.getElementById('fpT');
  const brk = document.getElementById('fpBreak');
  const res = document.getElementById('fpResult');
  const tlb = document.getElementById('fpTlb');
  if (!sel) return;

  function renderBreak() {
    const x = fpModelById(sel.value);
    if (!x) return;
    brk.innerHTML = `<div class="fp-grid">
      <div><span>基本折让 K</span><b>${fmt(x.K)}</b></div>
      <div><span>实销奖励 M(110%)</span><b>${fmt(x.M)}</b></div>
      <div><span>实销专项 Q</span><b>${fmt(x.Q)}</b></div>
      <div><span>万能红包/星火燎原 S</span><b>${fmt(x.S)}</b></div>
      <div><span>新媒体 U</span><b>${fmt(x.U)}</b></div>
      <div class="hl"><span>单台综合(110%档)</span><b>${fmt(x.comp110)}</b></div>
    </div>` + (x.tier ? `<div class="note" style="margin-top:8px">该车型为<b>台阶专项</b>（${E(x.tier)}）：实销量 T 决定返利档位，见下方结果。</div>` : '');
    if (tlb) tlb.style.display = x.tier ? '' : 'none';
    if (tEl && !x.tier) tEl.value = 0;
  }
  function calc() {
    const x = fpModelById(sel.value);
    if (!x) return;
    const R = parseFloat(rEl ? rEl.value : '0') || 0;
    const T = parseFloat(tEl ? tEl.value : '0') || 0;
    const K = x.K, M = x.M, Q = x.Q, S = x.S, U = x.U;
    const Kact = K;
    const fact = R >= 110 ? 1 : (R >= 100 ? (R - 100) / 10 : 0);
    const Mact = Math.round(M * fact);
    const Qact = Math.round(Q * fact);
    const Sact = S, Uact = U;
    let tierV = 0, tierTxt = '—';
    if (x.tier && P.tiers[x.tier]) {
      const row = P.tiers[x.tier].rows.find(r => matchTier(r.t, T));
      if (row) { tierV = +row.v; tierTxt = row.t + ' → ' + fmt(row.v) + ' 元/台'; }
      else tierTxt = '未达档（T=' + T + '）';
    }
    const sumBase = Kact + Mact + Qact + Sact + Uact;
    const ref = (K + M + Q + S + U) || 1;
    const rate = Math.round(sumBase / ref * 100);
    const rows = [
      ['基本折让 K', Kact, K, '固定'],
      ['实销奖励 M(110%)', Mact, M, R >= 110 ? '计满' : (R >= 100 ? '估算 ' + (fact * 100).toFixed(0) + '%' : '未达')],
      ['实销专项 Q', Qact, Q, R >= 110 ? '计满' : (R >= 100 ? '估算 ' + (fact * 100).toFixed(0) + '%' : '未达')],
      ['万能红包/星火燎原 S', Sact, S, '条件达成'],
      ['新媒体 U', Uact, U, '条件达成']
    ];
    let ht = `<table class="tbl" style="margin-top:10px"><thead><tr><th>返利构成</th><th>实际达成</th><th>110%档参考</th><th>状态</th></tr></thead><tbody>`;
    rows.forEach(r => { ht += `<tr><td>${r[0]}</td><td><b>${fmt(r[1])}</b></td><td>${fmt(r[2])}</td><td>${r[3]}</td></tr>`; });
    if (x.tier) ht += `<tr><td>台阶专项(${E(x.tier)})</td><td><b>${fmt(tierV)}</b></td><td>按 T 分档</td><td>${tierTxt}</td></tr>`;
    ht += `</tbody></table>`;
    ht += `<div class="fp-sum"><div class="fp-sum-b"><span>综合返利达成(不含台阶)</span><b>${fmt(sumBase)}</b> 元/台</div>
      <div class="fp-sum-b hl"><span>110%档拿满率</span><b>${rate}%</b></div>
      ${x.tier ? `<div class="fp-sum-b"><span>含台阶综合</span><b>${fmt(sumBase + tierV)}</b> 元/台</div>` : ''}
    </div>`;
    res.innerHTML = ht;
  }
  function calcDealer() {
    const dt = document.getElementById('fpDT'), ds = document.getElementById('fpDS'), out = document.getElementById('fpDResult');
    if (!dt || !out || !P.dealerTier) return;
    const T = parseFloat(dt.value) || 0;
    let S = parseFloat(ds.value) || 0; if (S > 1.3) S = 1.3;
    const row = P.dealerTier.rows.find(r => matchTier(r.t, T));
    const base = row ? parseFloat(String(row.v).split('×')[0]) : 0;
    const unit = Math.round(base * S);
    out.innerHTML = `<div class="fp-sum"><div class="fp-sum-b hl"><span>全系增幅专项(单台)</span><b>${fmt(unit)}</b> 元/台</div>
      <div class="fp-sum-b"><span>取值</span><b>${row ? E(row.t) : '未达档'} × S(${S})</b></div></div>`;
  }

  sel.onchange = function () { renderBreak(); calc(); };
  if (rEl) rEl.oninput = calc;
  if (tEl) tEl.oninput = calc;
  const dt = document.getElementById('fpDT'), ds = document.getElementById('fpDS');
  if (dt) dt.oninput = calcDealer;
  if (ds) ds.oninput = calcDealer;
  const sch = document.getElementById('fpSearch');
  if (sch) sch.oninput = function () {
    const q = sch.value.trim().toLowerCase();
    document.querySelectorAll('#fpLib tbody tr').forEach(tr => {
      tr.style.display = (!q || tr.getAttribute('data-k').indexOf(q) >= 0) ? '' : 'none';
    });
  };
  renderBreak(); calc(); calcDealer();
  fpBindMonth();
  fpBindPolicyImport();
  fpBindLedger();
  fpRenderLedger();
}

/* ============ 月度实际销售台账导入 + 单台返利核算 ============ */
const FP_LEDGER_KEY = 'cockpit_ledger_v1';
const FP_CFG_KEY = 'cockpit_ledger_cfg_v1';
function fpLoadLedger() { try { return JSON.parse(localStorage.getItem(FP_LEDGER_KEY) || 'null'); } catch (e) { return null; } }
function fpSaveLedger(rows) { try { localStorage.setItem(FP_LEDGER_KEY, JSON.stringify(rows)); } catch (e) {} }
function fpLoadCfg() {
  try { return Object.assign({ fin:0, ins:0, trade:20000, big:0, r:110, s:1.1 }, JSON.parse(localStorage.getItem(FP_CFG_KEY) || '{}')); } catch (e) { return { fin:0, ins:0, trade:20000, big:0, r:110, s:1.1 }; }
}
function fpSaveCfg(c) { try { localStorage.setItem(FP_CFG_KEY, JSON.stringify(c)); } catch (e) {} }
function fpNorm(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ''); }
function fpNormDate(v) {
  if (v == null) return '';
  if (typeof v === 'number') { const d = new Date((v - 25569) * 86400 * 1000); if (!isNaN(d)) return d.toISOString().slice(0, 10); return ''; }
  let s = String(v).trim().replace(/[./]/g, '-').replace(/年|月/g, '-').replace(/日/g, '');
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  m = s.match(/(\d{4})(\d{2})(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  return '';
}
function fpIsTrue(v) { const s = fpNorm(v); return s !== '' && /是|有|含|y|t|1|ok|true/.test(s); }
function fpMatchPolicy(str) {
  const P = fpPolicy();
  const q = fpNorm(str); if (!q) return null;
  let best = null, bestScore = 0;
  (P.models || []).forEach(m => {
    const cand = fpNorm((m.series || '') + ' ' + (m.model || '') + ' ' + (m.sub || ''));
    if (!cand) return;
    let score = 0;
    if (cand.indexOf(q) >= 0) score = q.length;
    else if (q.indexOf(cand) >= 0) score = cand.length;
    const mm = fpNorm(m.model);
    if (mm && q.indexOf(mm) >= 0) score = Math.max(score, mm.length);
    if (score > bestScore) { bestScore = score; best = m; }
  });
  return bestScore >= 2 ? best : null;
}
function fpHeadMap(headers) {
  const map = {};
  const defs = {
    date: ['交车日期', '日期', '开票日期', '销售日期', '过账日期', '台账日期', '上牌日期'],
    series: ['车系'], model: ['车型'], sub: ['版型', '型号', '配置', '规格', '描述'],
    vin: ['vin', '车架号', '底盘号', '底盘'], customer: ['客户', '购车人', '姓名', '车主'],
    price: ['成交价', '实际成交价', '售价', '金额', '实收'],
    fin: ['是否金融', '金融', '按揭', '贷款', '分期'], ins: ['是否保险', '保险', '投保'],
    trade: ['是否置换', '置换', '换购', '二手车'], big: ['是否大客户', '大客户', '批售', '集团', '政企']
  };
  headers.forEach(h => { const n = fpNorm(h); for (const k in defs) { if (defs[k].some(kw => n.indexOf(fpNorm(kw)) >= 0)) { if (!map[k]) map[k] = h; break; } } });
  return map;
}
function fpParseLedgerFile(file, cb) {
  const reader = new FileReader();
  reader.onload = e => { try { const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' }); const ws = wb.Sheets[wb.SheetNames[0]]; cb(null, XLSX.utils.sheet_to_json(ws, { defval: '' })); } catch (err) { cb(err); } };
  reader.onerror = () => cb(new Error('文件读取失败'));
  reader.readAsArrayBuffer(file);
}
function fpBuildLedger(rawRows) {
  const headers = rawRows.length ? Object.keys(rawRows[0]) : [];
  const hm = fpHeadMap(headers);
  if (!hm.model && !hm.series) return { error: '未识别到「车型/车系」列，请检查台账表头（参考模板）' };
  return {
    error: null, hm,
    rows: rawRows.map((r, i) => {
      const get = k => (hm[k] ? r[hm[k]] : '');
      const modelStr = [get('series'), get('model'), get('sub')].filter(Boolean).join(' ');
      const pol = fpMatchPolicy(modelStr);
      return { idx: i + 1, date: fpNormDate(get('date')), modelStr: modelStr || '(空)',
        policyId: pol ? pol.id : null, policyName: pol ? (pol.model + (pol.sub ? ' · ' + pol.sub : '')) : '未匹配',
        vin: get('vin'), customer: get('customer'), price: parseFloat(get('price')) || 0,
        fin: fpIsTrue(get('fin')), ins: fpIsTrue(get('ins')), trade: fpIsTrue(get('trade')), big: fpIsTrue(get('big')) };
    })
  };
}
function fpComputeLedger() {
  const rows = fpLoadLedger(); if (!rows || !rows.length) return { empty: true };
  const cfg = fpLoadCfg();
  const P = fpPolicy();
  const rg = queryRange();
  const inRange = !!(rg && rg.start && rg.end);
  let view = filterByRange(rows, 'date');
  if (FP_MONTH) view = view.filter(x => x.date && x.date.slice(0, 7) === FP_MONTH);
  const f = (+cfg.r) >= 110 ? 1 : ((+cfg.r) >= 100 ? ((+cfg.r) - 100) / 10 : 0);
  let sumBase = 0, sumCond = 0, unmatched = 0; const byModel = {};
  const computed = view.map(x => {
    const pol = x.policyId ? (P.models || []).find(m => m.id === x.policyId) : null;
    const K = pol ? pol.K : 0, M = pol ? pol.M : 0, Q = pol ? pol.Q : 0, S = pol ? pol.S : 0, U = pol ? pol.U : 0;
    const base = K + Math.round(M * f) + Math.round(Q * f) + S + U;
    const cond = (x.fin ? (+cfg.fin) : 0) + (x.ins ? (+cfg.ins) : 0) + (x.trade ? (+cfg.trade) : 0) + (x.big ? (+cfg.big) : 0);
    const total = base + cond;
    if (!pol) unmatched++;
    sumBase += base; sumCond += cond;
    const key = x.policyId || ('__un_' + x.modelStr);
    if (!byModel[key]) byModel[key] = { name: x.policyName, n: 0, rebate: 0 };
    byModel[key].n++; byModel[key].rebate += total;
    return Object.assign({}, x, { base, cond, total, matched: !!pol });
  });
  let tierSum = 0;
  Object.keys(byModel).forEach(k => {
    if (k.indexOf('__un_') === 0) return;
    const pol = (P.models || []).find(m => m.id === k);
    if (pol && pol.tier && P.tiers[pol.tier]) {
      const row = P.tiers[pol.tier].rows.find(r => matchTier(r.t, byModel[k].n));
      if (row) tierSum += byModel[k].n * (+row.v);
    }
  });
  let dealerSum = 0;
  if (P.dealerTier) {
    const T = computed.length; let S = +cfg.s; if (S > 1.3) S = 1.3;
    const row = P.dealerTier.rows.find(r => matchTier(r.t, T));
    if (row) { const b = parseFloat(String(row.v).split('×')[0]) || 0; dealerSum = Math.round(b * S * T); }
  }
  const grand = sumBase + sumCond + tierSum + dealerSum;
  return { empty: false, inRange, rg, month: FP_MONTH, view: computed, total: computed.length, all: rows.length,
    sumBase, sumCond, unmatched, tierSum, dealerSum, grand, byModel };
}
function fpRenderLedger() {
  const el = document.getElementById('fpLedgerResult'); if (!el) return;
  const st = document.getElementById('fpLedgerStatus');
  const data = fpComputeLedger();
  const fmt = v => (v == null ? '—' : Math.round(+v).toLocaleString('zh-CN'));
  if (data.empty) {
    el.innerHTML = '<div class="note">尚未导入台账。点击「解析并核算」导入当月实际销售台账（Excel/CSV），或先「下载模板」查看列格式。</div>';
    if (st) st.innerHTML = '当前未导入台账，下方将随导入自动核算每台车总返利。';
    return;
  }
  let banner = '';
  if (data.month) banner += '<div class="note ok" style="margin-bottom:6px">已按<b>月份 ' + E(data.month) + '</b>过滤返利（' + data.total + ' 台）。</div>';
  banner += data.inRange
    ? '<div class="note ok" style="margin-bottom:10px"><b>已按查询区间 ' + E(data.rg.start) + ' ~ ' + E(data.rg.end) + ' 过滤：</b>命中 ' + data.total + ' 台 / 全部 ' + data.all + ' 台。切换顶栏「确认查询」区间将实时重算。</div>'
    : '<div class="note" style="margin-bottom:10px">未限定查询区间，展示全部 ' + data.all + ' 台。可在顶栏选择区间后点「确认查询」仅看该区间真实数据。</div>';
  const trows = data.view.map(x => '<tr class="' + (x.matched ? '' : 'warn-row') + '">' +
    '<td>' + x.idx + '</td><td>' + E(x.date) + '</td><td>' + E(x.modelStr) + '</td>' +
    '<td>' + (x.matched ? E(x.policyName) : '<span class="bdg warn">未匹配</span>') + '</td>' +
    '<td class="r">' + fmt(x.base) + '</td><td class="r">' + fmt(x.cond) + '</td><td class="r"><b>' + fmt(x.total) + '</b></td>' +
    '<td>' + (x.fin ? '金融 ' : '') + (x.ins ? '保险 ' : '') + (x.trade ? '置换 ' : '') + (x.big ? '大客户' : '') + '</td></tr>').join('');
  const mrows = Object.keys(data.byModel).map(k => '<tr><td>' + E(data.byModel[k].name) + '</td><td class="r">' + data.byModel[k].n + '</td><td class="r">' + fmt(data.byModel[k].rebate) + '</td></tr>').join('');
  el.innerHTML = banner + `
  <div class="grid g4" style="margin-bottom:12px">
    ${kpiCard({ label: '区间/全部台数', value: data.total, unit: '台', sub: '全部 ' + data.all + ' 台', status: 'live' })}
    ${kpiCard({ label: '单台综合+条件返利合计', value: data.sumBase + data.sumCond, unit: '元', status: 'live', sub: '单台综合 ' + fmt(data.sumBase) + ' + 条件 ' + fmt(data.sumCond) })}
    ${kpiCard({ label: '台阶+增幅专项合计', value: data.tierSum + data.dealerSum, unit: '元', status: 'live', sub: '月度专项(按 T/S 分档)' })}
    ${kpiCard({ label: '月度返利总额', value: data.grand, unit: '元', status: 'live', sub: '含专项 · ' + (data.unmatched ? data.unmatched + ' 台未匹配车型' : '车型全匹配') })}
  </div>
  <div class="fp-bar" style="margin-bottom:8px"><button class="dq-btn ghost" id="fpLedgerExport">导出核算结果(CSV)</button>${data.unmatched ? '<span class="bdg warn">' + data.unmatched + ' 台未匹配车型，请核对台账车型写法或补充政策库</span>' : ''}</div>
  <div style="overflow:auto;max-height:420px"><table class="tbl" id="fpLedgerTbl">
    <thead><tr><th>#</th><th>交车日期</th><th>车系/车型/版型</th><th>匹配政策</th><th class="r">单台综合</th><th class="r">条件返利</th><th class="r">每台总返利</th><th>条件标记</th></tr></thead>
    <tbody>${trows}</tbody></table></div>
  <div class="card" style="margin-top:12px"><div class="card-hd"><h4>按车型汇总</h4></div><div class="card-bd" style="padding:0">
    <table class="tbl"><thead><tr><th>车型(匹配政策)</th><th class="r">台数</th><th class="r">返利合计(元)</th></tr></thead><tbody>${mrows}</tbody></table>
  </div></div>`;
  const ex = document.getElementById('fpLedgerExport'); if (ex) ex.onclick = fpExportLedger;
}
function fpExportLedger() {
  const d = fpComputeLedger(); if (d.empty) return;
  const head = ['序号', '交车日期', '车系车型版型', '匹配政策', '单台综合', '条件返利', '每台总返利', '金融', '保险', '置换', '大客户'];
  const lines = d.view.map(x => [x.idx, x.date, x.modelStr, x.policyName, x.base, x.cond, x.total, x.fin ? '是' : '', x.ins ? '是' : '', x.trade ? '是' : '', x.big ? '是' : ''].join(','));
  const csv = '﻿' + [head.join(','), ...lines].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = '返利核算_' + (d.rg && d.rg.start ? d.rg.start + '_' + d.rg.end : new Date().toISOString().slice(0, 10)) + '.csv'; a.click();
}
function fpDownloadLedgerTpl() {
  const head = ['交车日期', '车系', '车型', '版型', 'VIN', '客户', '成交价', '是否金融', '是否保险', '是否置换', '是否大客户'];
  const s1 = ['2026-08-03', '瑞虎9系', '全新一代瑞虎9', '豪享版 / 2.0T-7DCT', 'LVVxxxxx1', '张三', '135000', '是', '是', '否', '否'];
  const s2 = ['2026-08-15', '瑞虎5x', '瑞虎5x 高能版', '豪华型', 'LVVxxxxx2', '李四', '98000', '否', '是', '是', '否'];
  const csv = '﻿' + [head.join(','), s1.join(','), s2.join(',')].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = '月度销售台账模板.csv'; a.click();
}
function fpBindLedger() {
  const cfg = fpLoadCfg();
  ['fpCfgFin', 'fpCfgIns', 'fpCfgTrade', 'fpCfgBig', 'fpCfgR', 'fpCfgS'].forEach(id => { const el = document.getElementById(id); const key = id.slice(5).toLowerCase(); if (el && cfg[key] != null) el.value = cfg[key]; });
  const file = document.getElementById('fpLedgerFile');
  const parse = document.getElementById('fpLedgerParse');
  const tpl = document.getElementById('fpLedgerTpl');
  const clr = document.getElementById('fpLedgerClear');
  if (parse && file) parse.onclick = () => {
    if (!file.files || !file.files[0]) { alert('请先选择台账文件（Excel/CSV）'); return; }
    fpParseLedgerFile(file.files[0], (err, raw) => {
      if (err) { alert('解析失败：' + err.message); return; }
      const built = fpBuildLedger(raw || []);
      if (built.error) { alert(built.error); return; }
      fpSaveLedger(built.rows);
      fpRenderLedger();
      const st = document.getElementById('fpLedgerStatus');
      if (st) st.innerHTML = '已导入 <b>' + built.rows.length + '</b> 台，自动匹配厂家政策库并核算每台总返利。修改条件返利或完成率 R 后实时重算。';
    });
  };
  if (tpl) tpl.onclick = fpDownloadLedgerTpl;
  if (clr) clr.onclick = () => { if (!confirm('确认清除已导入的台账？')) return; localStorage.removeItem(FP_LEDGER_KEY); fpRenderLedger(); const st = document.getElementById('fpLedgerStatus'); if (st) st.innerHTML = '已清除导入台账。'; };
  ['fpCfgFin', 'fpCfgIns', 'fpCfgTrade', 'fpCfgBig', 'fpCfgR', 'fpCfgS'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = () => {
      const c = fpLoadCfg();
      c.fin = +document.getElementById('fpCfgFin').value || 0;
      c.ins = +document.getElementById('fpCfgIns').value || 0;
      c.trade = +document.getElementById('fpCfgTrade').value || 0;
      c.big = +document.getElementById('fpCfgBig').value || 0;
      c.r = +document.getElementById('fpCfgR').value || 0;
      c.s = +document.getElementById('fpCfgS').value || 0;
      fpSaveCfg(c); fpRenderLedger();
    };
  });
}

/* ============ 月度政策表导入（添加文件）+ 月度选择 ============ */
function fpPolicyKey(m) { return 'cockpit_policy_' + (m || 'default') + '.json'; }
function fpLoadPolicy(m) { try { const raw = localStorage.getItem(fpPolicyKey(m)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function fpSavePolicy(m, data) { try { localStorage.setItem(fpPolicyKey(m), JSON.stringify(data)); } catch (e) {} }
function fpPolicy() {
  const def = window.__POLICY__ || { models: [], tiers: {}, dealerTier: null, month: '', source: '', note: '' };
  if (FP_MONTH) {
    const imp = fpLoadPolicy(FP_MONTH);
    if (imp && imp.models && imp.models.length) {
      return { month: FP_MONTH, source: imp.source || ('导入政策·' + FP_MONTH), note: imp.note || '',
        models: imp.models, tiers: imp.tiers || def.tiers, dealerTier: imp.dealerTier || def.dealerTier };
    }
  }
  return { month: def.month || '', source: def.source || '', note: def.note || '', models: def.models || [], tiers: def.tiers || {}, dealerTier: def.dealerTier || null };
}
function fpPolHeadMap(headers) {
  const map = {};
  const defs = {
    series: ['车系', '系列'], model: ['车型'], sub: ['版型', '型号', '配置', '规格', '描述'],
    K: ['基本折让', '折让', 'k'], M: ['实销奖励', '奖励', 'm'], Q: ['实销专项', '专项', 'q'],
    S: ['万能红包', '星火燎原', '红包', 's'], U: ['新媒体', 'u'], tier: ['台阶', 'tier']
  };
  headers.forEach(h => { const n = fpNorm(h); for (const k in defs) { if (defs[k].some(kw => n.indexOf(fpNorm(kw)) >= 0)) { if (!map[k]) map[k] = h; break; } } });
  return map;
}
function fpBuildPolicyTable(rawRows) {
  const headers = rawRows.length ? Object.keys(rawRows[0]) : [];
  const hm = fpPolHeadMap(headers);
  if (!hm.model && !hm.series) return { error: '未识别到「车型/车系」列，请检查政策表表头（参考模板）' };
  const rows = rawRows.map((r, i) => {
    const get = k => (hm[k] ? r[hm[k]] : '');
    const num = k => { const v = hm[k] ? parseFloat(String(r[hm[k]]).replace(/[%,¥￥\s]/g, '')) : NaN; return isNaN(v) ? 0 : v; };
    const s = String(get('series') || '').trim(), mo = String(get('model') || '').trim(), su = String(get('sub') || '').trim();
    const K = num('K'), M = num('M'), Q = num('Q'), S = num('S'), U = num('U');
    return { id: 'imp_' + i, series: s, model: mo, sub: su, K, M, Q, S, U, comp110: K + M + Q + S + U,
      tier: get('tier') ? String(get('tier')).trim() : null, name: (mo + (su ? ' · ' + su : '')) };
  }).filter(x => x.model || x.series);
  if (!rows.length) return { error: '政策表中没有有效的车型行' };
  return { error: null, rows };
}
function fpPolicyLibRows(P) {
  const models = P.models || [];
  const fmt = v => (v == null ? '—' : Math.round(+v).toLocaleString('zh-CN'));
  return models.map(x => `<tr data-k="${E((x.series + ' ' + x.model + ' ' + x.sub).toLowerCase())}">
    <td>${E(x.series)}</td><td>${E(x.model)}</td><td>${E(x.sub)}</td>
    <td>${fmt(x.K)}</td><td>${fmt(x.M)}</td><td>${fmt(x.Q)}</td><td>${fmt(x.S)}</td><td>${fmt(x.U)}</td>
    <td><b>${fmt(x.comp110)}</b></td><td>${x.tier ? '<span class="bdg live">' + E(x.tier) + '</span>' : '—'}</td>
  </tr>`).join('');
}
function fpDownloadPolTpl() {
  const head = ['车系', '车型', '版型', '基本折让K', '实销奖励M', '实销专项Q', '万能红包S', '新媒体U'];
  const s1 = ['瑞虎9系', '全新一代瑞虎9', '豪享版 / 2.0T-7DCT', 7000, 3000, 2000, 500, 400];
  const s2 = ['瑞虎5x', '瑞虎5x 高能版', '豪华型', 4500, 1800, 1200, 300, 200];
  const csv = '﻿' + [head.join(','), s1.join(','), s2.join(',')].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = '月度厂家政策表模板.csv'; a.click();
}
function fpBindMonth() {
  const sel = document.getElementById('fpMonth');
  if (!sel) return;
  sel.value = FP_MONTH;
  sel.onchange = () => { FP_MONTH = sel.value; try { localStorage.setItem(FP_MONTH_KEY, FP_MONTH); } catch (e) {} go(currentKey); };
}
function fpBindPolicyImport() {
  const file = document.getElementById('fpPolFile');
  const parse = document.getElementById('fpPolParse');
  const tpl = document.getElementById('fpPolTpl');
  const clr = document.getElementById('fpPolClear');
  const st = document.getElementById('fpPolStatus');
  if (st) {
    const imp = FP_MONTH ? fpLoadPolicy(FP_MONTH) : null;
    st.innerHTML = (imp && imp.models && imp.models.length)
      ? '当前月份 <b>' + (FP_MONTH || '全部') + '</b> 已导入政策库（' + imp.models.length + ' 个车型），以此核算返利。'
      : '当前使用内置 2026-08 政策库。选择月份并导入政策表可覆盖该月政策。';
  }
  if (parse && file) parse.onclick = () => {
    if (!file.files || !file.files[0]) { alert('请先选择政策表文件（Excel/CSV）'); return; }
    fpParseLedgerFile(file.files[0], (err, raw) => {
      if (err) { alert('解析失败：' + err.message); return; }
      const built = fpBuildPolicyTable(raw || []);
      if (built.error) { alert(built.error); return; }
      const m = FP_MONTH || (new Date().toISOString().slice(0, 7));
      fpSavePolicy(m, { month: m, source: '导入政策·' + m, models: built.rows, tiers: {}, dealerTier: null });
      if (st) st.innerHTML = '已导入 <b>' + built.rows.length + '</b> 个车型政策（月份 ' + m + '）。选择该月即以此表核算返利。';
      go(currentKey);
    });
  };
  if (tpl) tpl.onclick = fpDownloadPolTpl;
  if (clr) clr.onclick = () => {
    const m = FP_MONTH;
    if (!m) { alert('请先在「查询月份」选择要清除的月份'); return; }
    if (!confirm('确认清除 ' + m + ' 的导入政策？将回退到内置政策库')) return;
    try { localStorage.removeItem(fpPolicyKey(m)); } catch (e) {}
    if (st) st.innerHTML = '已清除 ' + m + ' 的导入政策，回退内置库。';
    go(currentKey);
  };
}
