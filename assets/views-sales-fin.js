/* 销售板块 · 金融返利概况
 * 能力：①导入月度金融政策表 → 呈现各银行/金融渠道政策明细（返利费率/固定返利/贴息/首付期限）
 *      ②订单录入环节：选择金融渠道 + 输入贷款金额 → 自动套用政策生成单笔金融返利，可累加月度金融返利合计
 * 数据源：用户导入的月度金融政策表（Excel/CSV）+ 订单录入时选定的渠道与贷款金额，不预置任何模拟返利 */
VIEWS.salesFinRebate = function (m) {
  let h = moduleHero(m);

  /* ---------- 口径提示 ---------- */
  h += secTitle('金融返利口径', '以你导入的当月金融政策为准，绝不预置模拟返利');
  h += note('金融返利 = 渠道「固定返利(元/台)」+ 贷款金额 × 「返利费率(%)」÷ 100。若渠道仅填其一，则只计其一；贴息为额外一次性支持，单独列示。各渠道政策明细由你导入的月度金融政策表驱动。', '');

  /* ---------- 月度金融政策导入与渠道明细 ---------- */
  h += secTitle('月度金融政策导入 · 各渠道政策明细', '导入当月各银行/金融渠道政策表（Excel/CSV），自动呈现渠道明细；下拉选择将驱动订单录入自动套用');
  h += `<div class="card"><div class="card-bd">
    <div class="fp-bar" style="flex-wrap:wrap;gap:10px">
      <label class="fp-lb">月度金融政策表
        <input id="frPolicyFile" class="fp-in" type="file" accept=".xlsx,.xls,.csv"></label>
      <button class="dq-btn primary" id="frPolicyParse">解析并呈现</button>
      <button class="dq-btn ghost" id="frPolicyTpl">下载模板</button>
      <button class="dq-btn ghost" id="frPolicyClear">清除政策</button>
    </div>
    <div class="note" style="margin-top:8px">建议列：<b>渠道名称 / 金融产品 / 首付比例(%) / 期限(月) / 返利费率(%) / 固定返利(元/台) / 贴息(元) / 备注</b>。至少需「渠道名称」+（「返利费率」或「固定返利」其一）。系统按渠道名称去重汇总。</div>
    <div id="frPolicyStatus" class="note" style="margin-top:10px"></div>
    <div id="frPolicyTable"></div>
  </div></div>`;

  /* ---------- 订单金融返利录入（录入订单环节） ---------- */
  h += secTitle('订单金融返利录入', '在录入订单环节选择对应金融渠道、填入贷款金额，系统自动套用该渠道政策、即时生成该单金融返利；可逐单累加并随顶栏查询区间过滤');
  h += `<div class="card"><div class="card-bd">
    <div class="fp-bar" style="flex-wrap:wrap;gap:12px;align-items:flex-end">
      <label class="fp-lb">业务日期
        <input id="frDate" class="fp-in" type="date"></label>
      <label class="fp-lb">金融渠道
        <select id="frChannel" class="fp-sel"><option value="">— 请先导入金融政策 —</option></select></label>
      <label class="fp-lb">车型 / 客户（可选）
        <input id="frModel" class="fp-in" type="text" placeholder="如 瑞虎9 · 张三" style="min-width:180px"></label>
      <label class="fp-lb">贷款金额(元)
        <input id="frLoan" class="fp-in" type="number" min="0" step="1000" value="0" style="width:150px"></label>
    </div>
    <div id="frChPolicy" class="note ok" style="margin-top:10px">选择金融渠道后将自动显示该渠道政策与返利公式。</div>
    <div class="fp-sum" id="frRebateBox" style="display:none">
      <div class="fp-sum-b hl"><span>本单金融返利</span><b id="frRebate">0</b> 元</div>
      <div class="fp-sum-b"><span>构成</span><b id="frRebateBreak">—</b></div>
    </div>
    <div class="fp-bar" style="margin-top:12px">
      <button class="dq-btn primary" id="frAddOrder">添加订单并计提返利</button>
      <button class="dq-btn ghost" id="frClearOrders">清除全部订单</button>
      <button class="dq-btn ghost" id="frExportOrders">导出订单(CSV)</button>
    </div>
    <div id="frOrderStatus" class="note" style="margin-top:10px"></div>
    <div id="frOrderResult"></div>
  </div></div>`;

  setTimeout(frInit, 0);
  return h;
};

/* ============ 交互逻辑 ============ */
const FR_POLICY_KEY = 'cockpit_fin_policy_v1';
const FR_ORDER_KEY = 'cockpit_fin_orders_v1';
function frNorm(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ''); }
function frLoadPolicy() { try { return JSON.parse(localStorage.getItem(FR_POLICY_KEY) || 'null'); } catch (e) { return null; } }
function frSavePolicy(rows) { try { localStorage.setItem(FR_POLICY_KEY, JSON.stringify(rows)); } catch (e) {} }
function frLoadOrders() { try { return JSON.parse(localStorage.getItem(FR_ORDER_KEY) || '[]'); } catch (e) { return []; } }
function frSaveOrders(rows) { try { localStorage.setItem(FR_ORDER_KEY, JSON.stringify(rows)); } catch (e) {} }
function frHeadMap(headers) {
  const map = {};
  const defs = {
    channel: ['渠道', '银行', '金融公司', '机构', '名称'],
    product: ['产品', '方案', '金融方案', '贴息方案', '项目'],
    down: ['首付比例', '首付', '首付%', '首付款比例'],
    term: ['期限', '期数', '月数', '贷款期限', '分期'],
    rate: ['返利费率', '费率', '返利比例', '佣金率', '返点率', '返利率'],
    fixed: ['固定返利', '固定返点', '每台返利', '单台返利', '返利(元)', '返利金额'],
    subsidy: ['贴息', '贴息金额', '厂家贴息', '利息补贴'],
    note: ['备注', '说明', '注释']
  };
  headers.forEach(h => { const n = frNorm(h); for (const k in defs) { if (defs[k].some(kw => n.indexOf(frNorm(kw)) >= 0)) { if (!map[k]) map[k] = h; break; } } });
  return map;
}
function frParsePolicyFile(file, cb) {
  const reader = new FileReader();
  reader.onload = e => { try { const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' }); const ws = wb.Sheets[wb.SheetNames[0]]; cb(null, XLSX.utils.sheet_to_json(ws, { defval: '' })); } catch (err) { cb(err); } };
  reader.onerror = () => cb(new Error('文件读取失败'));
  reader.readAsArrayBuffer(file);
}
function frBuildPolicy(rawRows) {
  const headers = rawRows.length ? Object.keys(rawRows[0]) : [];
  const hm = frHeadMap(headers);
  if (!hm.channel) return { error: '未识别到「渠道名称/银行」列，请检查政策表表头（参考模板）' };
  const map = {};
  rawRows.forEach(r => {
    const ch = String(r[hm.channel] == null ? '' : r[hm.channel]).trim();
    if (!ch) return;
    const g = map[ch] || { channel: ch, products: [], down: '', term: '', rate: 0, fixed: 0, subsidy: 0, note: '' };
    const num = (k) => { const v = hm[k] ? parseFloat(String(r[hm[k]]).replace(/[%,¥￥\s]/g, '')) : NaN; return isNaN(v) ? 0 : v; };
    const prod = hm.product ? String(r[hm.product] || '').trim() : '';
    if (prod) g.products.push(prod);
    g.down = hm.down ? String(r[hm.down] || '').trim() : g.down;
    g.term = hm.term ? String(r[hm.term] || '').trim() : g.term;
    g.rate = hm.rate ? num('rate') : (g.rate || 0);
    g.fixed = hm.fixed ? num('fixed') : (g.fixed || 0);
    g.subsidy = hm.subsidy ? num('subsidy') : (g.subsidy || 0);
    g.note = hm.note ? String(r[hm.note] || '').trim() : g.note;
    map[ch] = g;
  });
  const rows = Object.keys(map).map(ch => {
    const g = map[ch];
    return { channel: ch, product: g.products.join(' / ') || '—', down: g.down || '—', term: g.term || '—',
      rate: g.rate, fixed: g.fixed, subsidy: g.subsidy, note: g.note || '' };
  });
  if (!rows.length) return { error: '政策表中没有有效的渠道行' };
  return { error: null, rows };
}
function frComputeRebate(policy, loan) {
  const fixed = +policy.fixed || 0;
  const rate = +policy.rate || 0;
  const rateAmt = loan * rate / 100;
  const rebate = fixed + rateAmt;
  const parts = [];
  if (fixed) parts.push('固定 ' + Math.round(fixed).toLocaleString('zh-CN') + ' 元');
  if (rate) parts.push(rate + '% × ' + Math.round(loan).toLocaleString('zh-CN') + ' = ' + Math.round(rateAmt).toLocaleString('zh-CN') + ' 元');
  return { rebate, breakTxt: parts.length ? parts.join(' ＋ ') : '该渠道未配置返利(费率/固定均为0)' };
}
function frRenderPolicy() {
  const el = document.getElementById('frPolicyTable'); if (!el) return;
  const st = document.getElementById('frPolicyStatus');
  const data = frLoadPolicy();
  const fmt = v => (v == null || v === 0 ? '—' : Math.round(+v).toLocaleString('zh-CN'));
  if (!data || !data.length) {
    el.innerHTML = '<div class="note">尚未导入金融政策表。点击「解析并呈现」导入当月各银行/渠道政策（Excel/CSV），或先「下载模板」查看列格式。</div>';
    if (st) st.innerHTML = '当前无渠道政策，订单录入下拉为空；导入后自动填充。';
    return;
  }
  const rows = data.map(p => `<tr>
    <td class="nm">${E(p.channel)}</td>
    <td>${E(p.product)}</td>
    <td class="r">${E(p.down)}</td>
    <td class="r">${E(p.term)}</td>
    <td class="r">${p.rate ? p.rate + '%' : '—'}</td>
    <td class="r">${fmt(p.fixed)}</td>
    <td class="r">${fmt(p.subsidy)}</td>
    <td>${E(p.note)}</td>
  </tr>`).join('');
  el.innerHTML = `<div style="overflow:auto;max-height:420px;margin-top:10px"><table class="tbl" id="frPolicyTbl">
    <thead><tr><th>渠道/银行</th><th>金融产品</th><th class="r">首付比例</th><th class="r">期限(月)</th><th class="r">返利费率</th><th class="r">固定返利(元/台)</th><th class="r">贴息(元)</th><th>备注</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <div class="note ok" style="margin-top:8px">已加载 <b>${data.length}</b> 个金融渠道/银行政策，订单录入下拉已自动填充。修改政策后重新导入即可覆盖。</div>`;
}
function frRenderOrders() {
  const el = document.getElementById('frOrderResult'); if (!el) return;
  const st = document.getElementById('frOrderStatus');
  const pol = frLoadPolicy();
  const all = frLoadOrders();
  const fmt = v => (v == null ? '—' : Math.round(+v).toLocaleString('zh-CN'));
  const rg = queryRange();
  const inRange = !!(rg && rg.start && rg.end);
  const view = filterByRange(all, 'date');
  let sumRebate = 0, sumSubsidy = 0, finN = 0; const byCh = {};
  view.forEach(o => {
    sumRebate += o.rebate; sumSubsidy += o.subsidy || 0; finN++;
    if (!byCh[o.channel]) byCh[o.channel] = { n: 0, rebate: 0 };
    byCh[o.channel].n++; byCh[o.channel].rebate += o.rebate;
  });
  const mrows = Object.keys(byCh).map(c => `<tr><td>${E(c)}</td><td class="r">${byCh[c].n}</td><td class="r">${fmt(byCh[c].rebate)}</td></tr>`).join('');
  if (!all.length) {
    el.innerHTML = '<div class="note">尚未录入订单。选择金融渠道、填入贷款金额后点击「添加订单并计提返利」，逐单累积月度金融返利。</div>';
    if (st) st.innerHTML = !pol ? '请先导入金融政策表，订单录入才能选择渠道并套用政策。' : '已就绪：导入了 ' + pol.length + ' 个渠道政策，可开始录入订单。';
    return;
  }
  let banner = inRange
    ? '<div class="note ok" style="margin-bottom:10px"><b>已按查询区间 ' + E(rg.start) + ' ~ ' + E(rg.end) + ' 过滤：</b>命中 ' + finN + ' 单 / 全部 ' + all.length + ' 单。切换顶栏「确认查询」区间将实时重算。</div>'
    : '<div class="note" style="margin-bottom:10px">未限定查询区间，展示全部 ' + all.length + ' 单。可在顶栏选择区间后点「确认查询」仅看该区间真实数据。</div>';
  const trows = view.map(o => `<tr>
    <td>${E(o.date)}</td>
    <td class="nm">${E(o.channel)}</td>
    <td>${E(o.model || '—')}</td>
    <td class="r">${fmt(o.loan)}</td>
    <td class="r"><b>${fmt(o.rebate)}</b></td>
    <td class="r">${fmt(o.subsidy)}</td>
    <td><button class="dq-btn ghost sm" data-fr-del="${o.id}">删除</button></td>
  </tr>`).join('');
  el.innerHTML = banner + `<div class="grid g4" style="margin-bottom:12px">
    ${kpiCard({ label: '区间/全部金融台数', value: finN, unit: '单', sub: '全部 ' + all.length + ' 单', status: 'live' })}
    ${kpiCard({ label: '月度金融返利合计', value: sumRebate, unit: '元', status: 'live', sub: '固定+费率计提' })}
    ${kpiCard({ label: '渠道贴息合计', value: sumSubsidy, unit: '元', status: 'live', sub: '额外一次性支持' })}
    ${kpiCard({ label: '金融渠道数', value: Object.keys(byCh).length, unit: '个', status: 'live', sub: '返利渠道分布' })}
  </div>
  <div style="overflow:auto;max-height:420px"><table class="tbl" id="frOrderTbl">
    <thead><tr><th>业务日期</th><th>金融渠道</th><th>车型/客户</th><th class="r">贷款金额</th><th class="r">本单金融返利</th><th class="r">贴息</th><th>操作</th></tr></thead>
    <tbody>${trows}</tbody></table></div>
  <div class="card" style="margin-top:12px"><div class="card-hd"><h4>按渠道汇总金融返利</h4></div><div class="card-bd" style="padding:0">
    <table class="tbl"><thead><tr><th>金融渠道</th><th class="r">台数</th><th class="r">金融返利合计(元)</th></tr></thead><tbody>${mrows || '<tr><td colspan="3" style="text-align:center;color:var(--ink-3)">暂无数据</td></tr>'}</tbody></table>
  </div></div>`;
  el.querySelectorAll('[data-fr-del]').forEach(b => b.onclick = () => {
    const id = b.getAttribute('data-fr-del');
    const rest = frLoadOrders().filter(o => o.id !== id);
    frSaveOrders(rest); frRenderOrders();
    const s = document.getElementById('frOrderStatus'); if (s) s.innerHTML = '已删除 1 笔订单。';
  });
}
function frRefreshChPolicy() {
  const sel = document.getElementById('frChannel');
  const box = document.getElementById('frRebateBox');
  const polBox = document.getElementById('frChPolicy');
  const rebEl = document.getElementById('frRebate');
  const breakEl = document.getElementById('frRebateBreak');
  const loanEl = document.getElementById('frLoan');
  if (!sel) return;
  const pol = frLoadPolicy();
  const p = pol ? pol.find(x => x.channel === sel.value) : null;
  if (!p) {
    if (polBox) polBox.className = 'note';
    if (polBox) polBox.innerHTML = '请先导入金融政策并选择渠道。';
    if (box) box.style.display = 'none';
    return;
  }
  if (polBox) {
    polBox.className = 'note ok';
    polBox.innerHTML = '已选渠道：<b>' + E(p.channel) + '</b>（' + E(p.product) + '）· 首付 ' + E(p.down) + ' · 期限 ' + E(p.term) +
      ' 月 · 返利费率 <b>' + (p.rate ? p.rate + '%' : '—') + '</b> · 固定返利 <b>' + (p.fixed ? Math.round(p.fixed).toLocaleString('zh-CN') + ' 元/台' : '—') + '</b>' +
      (p.subsidy ? ' · 贴息 ' + Math.round(p.subsidy).toLocaleString('zh-CN') + ' 元' : '') + '。公式：金融返利 = 固定返利 + 贷款金额 × 费率%。';
  }
  const loan = parseFloat(loanEl ? loanEl.value : '0') || 0;
  const c = frComputeRebate(p, loan);
  if (box) box.style.display = 'flex';
  if (rebEl) rebEl.textContent = Math.round(c.rebate).toLocaleString('zh-CN');
  if (breakEl) breakEl.textContent = c.breakTxt;
}
function frInit() {
  const pol = frLoadPolicy();
  // 默认日期
  const dEl = document.getElementById('frDate');
  if (dEl && !dEl.value) dEl.value = new Date().toISOString().slice(0, 10);
  // 渠道下拉
  const sel = document.getElementById('frChannel');
  if (sel) {
    if (pol && pol.length) {
      sel.innerHTML = '<option value="">— 请选择金融渠道 —</option>' + pol.map(p => `<option value="${E(p.channel)}">${E(p.channel)}${p.product && p.product !== '—' ? ' · ' + E(p.product) : ''}</option>`).join('');
    }
    sel.onchange = frRefreshChPolicy;
  }
  const loanEl = document.getElementById('frLoan');
  if (loanEl) loanEl.oninput = frRefreshChPolicy;

  const file = document.getElementById('frPolicyFile');
  const parse = document.getElementById('frPolicyParse');
  const tpl = document.getElementById('frPolicyTpl');
  const clr = document.getElementById('frPolicyClear');
  const add = document.getElementById('frAddOrder');
  const clrO = document.getElementById('frClearOrders');
  const expO = document.getElementById('frExportOrders');

  if (parse && file) parse.onclick = () => {
    if (!file.files || !file.files[0]) { alert('请先选择金融政策表（Excel/CSV）'); return; }
    frParsePolicyFile(file.files[0], (err, raw) => {
      if (err) { alert('解析失败：' + err.message); return; }
      const built = frBuildPolicy(raw || []);
      if (built.error) { alert(built.error); return; }
      frSavePolicy(built.rows);
      frRenderPolicy(); frRenderOrders();
      const sel2 = document.getElementById('frChannel');
      if (sel2) { sel2.innerHTML = '<option value="">— 请选择金融渠道 —</option>' + built.rows.map(p => `<option value="${E(p.channel)}">${E(p.channel)}${p.product && p.product !== '—' ? ' · ' + E(p.product) : ''}</option>`).join(''); }
      const st = document.getElementById('frPolicyStatus');
      if (st) st.innerHTML = '已导入 <b>' + built.rows.length + '</b> 个金融渠道/银行政策并呈现明细，订单录入下拉已填充。';
    });
  };
  if (tpl) tpl.onclick = () => {
    const head = ['渠道名称', '金融产品', '首付比例(%)', '期限(月)', '返利费率(%)', '固定返利(元/台)', '贴息(元)', '备注'];
    const s1 = ['奇瑞金融', '贴息方案A', '30', '24', '3', '2000', '1500', '厂家贴息+返利'];
    const s2 = ['工商银行', '信用卡分期', '40', '36', '1.5', '0', '0', '纯费率返利'];
    const s3 = ['平安银行', '新车贷', '20', '12', '2.5', '800', '0', '短期低费率'];
    const csv = '﻿' + [head.join(','), s1.join(','), s2.join(','), s3.join(',')].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = '月度金融政策表模板.csv'; a.click();
  };
  if (clr) clr.onclick = () => {
    if (!confirm('确认清除已导入的金融政策？订单录入下拉将清空。')) return;
    localStorage.removeItem(FR_POLICY_KEY);
    frRenderPolicy(); frRenderOrders();
    const sel2 = document.getElementById('frChannel'); if (sel2) sel2.innerHTML = '<option value="">— 请先导入金融政策 —</option>';
    const st = document.getElementById('frPolicyStatus'); if (st) st.innerHTML = '已清除金融政策。';
  };
  if (add) add.onclick = () => {
    const polNow = frLoadPolicy();
    if (!polNow || !polNow.length) { alert('请先导入金融政策表'); return; }
    const ch = sel ? sel.value : '';
    if (!ch) { alert('请选择金融渠道'); return; }
    const p = polNow.find(x => x.channel === ch);
    const loan = parseFloat(loanEl ? loanEl.value : '0') || 0;
    const c = frComputeRebate(p, loan);
    const dEl2 = document.getElementById('frDate');
    const model = document.getElementById('frModel');
    const orders = frLoadOrders();
    const id = 'F' + Date.now() + Math.floor(Math.random() * 100);
    orders.push({ id, date: dEl2 ? dEl2.value : new Date().toISOString().slice(0, 10), channel: ch, model: model ? model.value.trim() : '', loan, rebate: Math.round(c.rebate), subsidy: p ? (+p.subsidy || 0) : 0 });
    frSaveOrders(orders);
    frRenderOrders();
    const st = document.getElementById('frOrderStatus'); if (st) st.innerHTML = '已添加 1 笔订单（' + E(ch) + '），金融返利 ' + Math.round(c.rebate).toLocaleString('zh-CN') + ' 元，已计入月度合计。';
    if (loanEl) loanEl.value = 0;
    frRefreshChPolicy();
  };
  if (clrO) clrO.onclick = () => {
    if (!confirm('确认清除全部已录入订单？（不影响已导入的金融政策）')) return;
    frSaveOrders([]); frRenderOrders();
    const st = document.getElementById('frOrderStatus'); if (st) st.innerHTML = '已清除全部订单。';
  };
  if (expO) expO.onclick = () => {
    const d = frLoadOrders(); if (!d.length) { alert('暂无订单可导出'); return; }
    const head = ['业务日期', '金融渠道', '车型/客户', '贷款金额', '本单金融返利', '贴息'];
    const lines = d.map(o => [o.date, o.channel, o.model, o.loan, o.rebate, o.subsidy].join(','));
    const csv = '﻿' + [head.join(','), ...lines].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = '金融返利订单_' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
  };

  frRenderPolicy(); frRenderOrders(); frRefreshChPolicy();
}
