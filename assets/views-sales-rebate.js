/* 销售板块 · 保险返利概况 + 置换补贴核算
 * 复用「导入政策表 + 订单录入自动套用算返利」范式（与金融返利概况同一引擎）
 * 统一公式：本单返利/补贴 = 固定(元/台或元/单) + 基数(贷款/保费/车价) × 费率(%) ÷ 100
 * 数据源：用户导入的月度政策表（Excel/CSV）+ 订单录入时选定的渠道与基数，不预置任何模拟返利 */
(function () {
  function makeRebateModule(cfg) {
    const PKEY = cfg.policyKey, OKEY = cfg.orderKey, PFX = cfg.prefix;

    function norm(s) { return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ''); }
    function loadPolicy() { try { return JSON.parse(localStorage.getItem(PKEY) || 'null'); } catch (e) { return null; } }
    function savePolicy(r) { try { localStorage.setItem(PKEY, JSON.stringify(r)); } catch (e) {} }
    function loadOrders() { try { return JSON.parse(localStorage.getItem(OKEY) || '[]'); } catch (e) { return []; } }
    function saveOrders(r) { try { localStorage.setItem(OKEY, JSON.stringify(r)); } catch (e) {} }

    function headMap(headers) {
      const map = {};
      const defs = {
        channel: ['渠道', '银行', '保险', '公司', '厂家', '品牌', '机构', '名称'],
        product: ['产品', '险种', '方案', '车型', '版型'],
        rate: ['费率', '点数', '比例', '返点', '贴息率', '补贴比'],
        fixed: ['固定返利', '固定返点', '每台返利', '单台返利', '返利金额', '补贴金额', '每台补贴'],
        note: ['备注', '说明', '注释']
      };
      headers.forEach(h => {
        const n = norm(h);
        for (const k in defs) { if (defs[k].some(kw => n.indexOf(norm(kw)) >= 0)) { if (!map[k]) map[k] = h; break; } }
      });
      return map;
    }

    function parseFile(file, cb) {
      const r = new FileReader();
      r.onload = e => { try { const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' }); const ws = wb.Sheets[wb.SheetNames[0]]; cb(null, XLSX.utils.sheet_to_json(ws, { defval: '' })); } catch (err) { cb(err); } };
      r.onerror = () => cb(new Error('文件读取失败'));
      r.readAsArrayBuffer(file);
    }

    function buildPolicy(raw) {
      const headers = raw.length ? Object.keys(raw[0]) : [];
      const hm = headMap(headers);
      if (!hm.channel) return { error: '未识别到「渠道/厂家」列，请检查政策表表头（参考模板）' };
      const map = {};
      raw.forEach(r => {
        const ch = String(r[hm.channel] == null ? '' : r[hm.channel]).trim();
        if (!ch) return;
        const g = map[ch] || { channel: ch, product: '', rate: 0, fixed: 0, note: '' };
        const num = k => { const v = hm[k] ? parseFloat(String(r[hm[k]]).replace(/[%,¥￥\s]/g, '')) : NaN; return isNaN(v) ? 0 : v; };
        const prod = hm.product ? String(r[hm.product] || '').trim() : '';
        if (prod) g.product = prod;
        g.rate = hm.rate ? num('rate') : (g.rate || 0);
        g.fixed = hm.fixed ? num('fixed') : (g.fixed || 0);
        g.note = hm.note ? String(r[hm.note] || '').trim() : g.note;
        map[ch] = g;
      });
      const rows = Object.keys(map).map(ch => { const g = map[ch]; return { channel: ch, product: g.product || '—', rate: g.rate, fixed: g.fixed, note: g.note || '' }; });
      if (!rows.length) return { error: '政策表中没有有效的渠道行' };
      return { error: null, rows };
    }

    function compute(p, base) {
      const fixed = +p.fixed || 0;
      const rate = +p.rate || 0;
      const rateAmt = base * rate / 100;
      const rebate = fixed + rateAmt;
      const parts = [];
      if (fixed) parts.push('固定 ' + Math.round(fixed).toLocaleString('zh-CN') + ' 元');
      if (rate) parts.push(rate + '% × ' + Math.round(base).toLocaleString('zh-CN') + ' = ' + Math.round(rateAmt).toLocaleString('zh-CN') + ' 元');
      return { rebate, breakTxt: parts.length ? parts.join(' ＋ ') : '该渠道未配置返利(费率/固定均为0)' };
    }

    function renderPolicy() {
      const el = document.getElementById(PFX + 'PolicyTable'); if (!el) return;
      const st = document.getElementById(PFX + 'PolicyStatus');
      const data = loadPolicy();
      const fmt = v => (v == null || v === 0 ? '—' : Math.round(+v).toLocaleString('zh-CN'));
      if (!data || !data.length) {
        el.innerHTML = '<div class="note">尚未导入' + cfg.policyName + '。点击「解析并呈现」导入当月各渠道政策（Excel/CSV），或先「下载模板」查看列格式。</div>';
        if (st) st.innerHTML = '当前无渠道政策，订单录入下拉为空；导入后自动填充。';
        return;
      }
      const rows = data.map(p => `<tr><td class="nm">${E(p.channel)}</td><td>${E(p.product)}</td><td class="r">${p.rate ? p.rate + cfg.rateSuffix : '—'}</td><td class="r">${fmt(p.fixed)}</td><td>${E(p.note)}</td></tr>`).join('');
      el.innerHTML = `<div style="overflow:auto;max-height:420px;margin-top:10px"><table class="tbl" id="${PFX}PolicyTbl">
        <thead><tr><th>${cfg.channelLabel}</th><th>${cfg.productLabel}</th><th class="r">${cfg.rateLabel}</th><th class="r">${cfg.fixedLabel}</th><th>备注</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
        <div class="note ok" style="margin-top:8px">已加载 <b>${data.length}</b> 个${cfg.channelLabel}政策，订单录入下拉已自动填充。修改政策后重新导入即可覆盖。</div>`;
    }

    function renderOrders() {
      const el = document.getElementById(PFX + 'OrderResult'); if (!el) return;
      const st = document.getElementById(PFX + 'OrderStatus');
      const pol = loadPolicy();
      const all = loadOrders();
      const fmt = v => (v == null ? '—' : Math.round(+v).toLocaleString('zh-CN'));
      const rg = queryRange();
      const inRange = !!(rg && rg.start && rg.end);
      const view = filterByRange(all, 'date');
      let sum = 0, n = 0; const byCh = {};
      view.forEach(o => { sum += o.rebate; n++; if (!byCh[o.channel]) byCh[o.channel] = { n: 0, rebate: 0 }; byCh[o.channel].n++; byCh[o.channel].rebate += o.rebate; });
      const mrows = Object.keys(byCh).map(c => `<tr><td>${E(c)}</td><td class="r">${byCh[c].n}</td><td class="r">${fmt(byCh[c].rebate)}</td></tr>`).join('');
      if (!all.length) {
        el.innerHTML = '<div class="note">尚未录入订单。选择' + cfg.channelLabel + '、填入' + cfg.baseLabel + '后点击「添加订单并计提」，逐单累积月度' + cfg.unitName + '。</div>';
        if (st) st.innerHTML = !pol ? '请先导入政策表，订单录入才能选择渠道并套用政策。' : '已就绪：导入了 ' + pol.length + ' 个渠道政策，可开始录入订单。';
        return;
      }
      let banner = inRange
        ? '<div class="note ok" style="margin-bottom:10px"><b>已按查询区间 ' + E(rg.start) + ' ~ ' + E(rg.end) + ' 过滤：</b>命中 ' + n + ' 单 / 全部 ' + all.length + ' 单。切换顶栏「确认查询」区间将实时重算。</div>'
        : '<div class="note" style="margin-bottom:10px">未限定查询区间，展示全部 ' + all.length + ' 单。可在顶栏选择区间后点「确认查询」仅看该区间真实数据。</div>';
      const trows = view.map(o => `<tr>
        <td>${E(o.date)}</td>
        <td class="nm">${E(o.channel)}</td>
        <td>${E(o.model || '—')}</td>
        <td class="r">${fmt(o.base)}</td>
        <td class="r"><b>${fmt(o.rebate)}</b></td>
        <td><button class="dq-btn ghost sm" data-${PFX}-del="${o.id}">删除</button></td>
      </tr>`).join('');
      el.innerHTML = banner + `<div class="grid g4" style="margin-bottom:12px">
        ${kpiCard({ label: '区间/全部' + cfg.unitName + '台数', value: n, unit: '单', sub: '全部 ' + all.length + ' 单', status: 'live' })}
        ${kpiCard({ label: '月度' + cfg.unitName + '合计', value: sum, unit: '元', status: 'live', sub: cfg.fixedLabel.replace(/\(.*\)/, '') + ' + ' + cfg.rateLabel + '计提' })}
        ${kpiCard({ label: cfg.channelLabel + '数', value: Object.keys(byCh).length, unit: '个', status: 'live', sub: '分布' })}
        ${kpiCard({ label: '平均单笔' + cfg.unitName, value: n ? Math.round(sum / n) : 0, unit: '元', status: 'live', sub: '合计÷台数' })}
      </div>
      <div style="overflow:auto;max-height:420px"><table class="tbl" id="${PFX}OrderTbl">
        <thead><tr><th>业务日期</th><th>${cfg.channelLabel}</th><th>车型/客户</th><th class="r">${cfg.baseLabel}</th><th class="r">本单${cfg.unitName}</th><th>操作</th></tr></thead>
        <tbody>${trows}</tbody></table></div>
      <div class="card" style="margin-top:12px"><div class="card-hd"><h4>按${cfg.channelLabel}汇总${cfg.unitName}</h4></div><div class="card-bd" style="padding:0">
        <table class="tbl"><thead><tr><th>${cfg.channelLabel}</th><th class="r">台数</th><th class="r">${cfg.unitName}合计(元)</th></tr></thead><tbody>${mrows || '<tr><td colspan="3" style="text-align:center;color:var(--ink-3)">暂无数据</td></tr>'}</tbody></table>
      </div></div>`;
      el.querySelectorAll('[data-' + PFX + '-del]').forEach(b => b.onclick = () => {
        const id = b.getAttribute('data-' + PFX + '-del');
        const rest = loadOrders().filter(o => o.id !== id);
        saveOrders(rest); renderOrders();
        const s = document.getElementById(PFX + 'OrderStatus'); if (s) s.innerHTML = '已删除 1 笔订单。';
      });
    }

    function refreshChPolicy() {
      const sel = document.getElementById(PFX + 'Channel');
      const box = document.getElementById(PFX + 'RebateBox');
      const polBox = document.getElementById(PFX + 'ChPolicy');
      const rebEl = document.getElementById(PFX + 'Rebate');
      const breakEl = document.getElementById(PFX + 'RebateBreak');
      const baseEl = document.getElementById(PFX + 'Base');
      if (!sel) return;
      const pol = loadPolicy();
      const p = pol ? pol.find(x => x.channel === sel.value) : null;
      if (!p) {
        if (polBox) { polBox.className = 'note'; polBox.innerHTML = '请先导入政策并选择' + cfg.channelLabel + '。'; }
        if (box) box.style.display = 'none';
        return;
      }
      if (polBox) {
        polBox.className = 'note ok';
        polBox.innerHTML = '已选' + cfg.channelLabel + '：<b>' + E(p.channel) + '</b>（' + E(p.product) + '）· ' + cfg.rateLabel + ' <b>' + (p.rate ? p.rate + cfg.rateSuffix : '—') + '</b> · ' + cfg.fixedLabel + ' <b>' + (p.fixed ? Math.round(p.fixed).toLocaleString('zh-CN') + ' 元' : '—') + '</b>。公式：' + cfg.unitName + ' = ' + cfg.fixedLabel + ' + ' + cfg.baseLabel + ' × ' + cfg.rateLabel + '÷100。';
      }
      const base = parseFloat(baseEl ? baseEl.value : '0') || 0;
      const c = compute(p, base);
      if (box) box.style.display = 'flex';
      if (rebEl) rebEl.textContent = Math.round(c.rebate).toLocaleString('zh-CN');
      if (breakEl) breakEl.textContent = c.breakTxt;
    }

    function init() {
      const pol = loadPolicy();
      const dEl = document.getElementById(PFX + 'Date');
      if (dEl && !dEl.value) dEl.value = new Date().toISOString().slice(0, 10);
      const sel = document.getElementById(PFX + 'Channel');
      if (sel) {
        if (pol && pol.length) sel.innerHTML = '<option value="">— 请选择' + cfg.channelLabel + ' —</option>' + pol.map(p => `<option value="${E(p.channel)}">${E(p.channel)}${p.product && p.product !== '—' ? ' · ' + E(p.product) : ''}</option>`).join('');
        sel.onchange = refreshChPolicy;
      }
      const baseEl = document.getElementById(PFX + 'Base');
      if (baseEl) baseEl.oninput = refreshChPolicy;

      const file = document.getElementById(PFX + 'PolicyFile');
      const parse = document.getElementById(PFX + 'PolicyParse');
      const tpl = document.getElementById(PFX + 'PolicyTpl');
      const clr = document.getElementById(PFX + 'PolicyClear');
      const add = document.getElementById(PFX + 'AddOrder');
      const clrO = document.getElementById(PFX + 'ClearOrders');
      const expO = document.getElementById(PFX + 'ExportOrders');

      if (parse && file) parse.onclick = () => {
        if (!file.files || !file.files[0]) { alert('请先选择政策表（Excel/CSV）'); return; }
        parseFile(file.files[0], (err, raw) => {
          if (err) { alert('解析失败：' + err.message); return; }
          const built = buildPolicy(raw || []);
          if (built.error) { alert(built.error); return; }
          savePolicy(built.rows); renderPolicy(); renderOrders();
          const s2 = document.getElementById(PFX + 'Channel');
          if (s2) s2.innerHTML = '<option value="">— 请选择' + cfg.channelLabel + ' —</option>' + built.rows.map(p => `<option value="${E(p.channel)}">${E(p.channel)}${p.product && p.product !== '—' ? ' · ' + E(p.product) : ''}</option>`).join('');
          const st = document.getElementById(PFX + 'PolicyStatus');
          if (st) st.innerHTML = '已导入 <b>' + built.rows.length + '</b> 个' + cfg.channelLabel + '政策并呈现明细，订单录入下拉已填充。';
        });
      };
      if (tpl) tpl.onclick = () => {
        const head = cfg.policyHead;
        const csv = '﻿' + [head.join(','), ...cfg.policySample.map(r => r.join(','))].join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = cfg.tplName; a.click();
      };
      if (clr) clr.onclick = () => {
        if (!confirm('确认清除已导入的政策？订单录入下拉将清空。')) return;
        localStorage.removeItem(PKEY); renderPolicy(); renderOrders();
        const s2 = document.getElementById(PFX + 'Channel'); if (s2) s2.innerHTML = '<option value="">— 请先导入政策 —</option>';
        const st = document.getElementById(PFX + 'PolicyStatus'); if (st) st.innerHTML = '已清除政策。';
      };
      if (add) add.onclick = () => {
        const polNow = loadPolicy();
        if (!polNow || !polNow.length) { alert('请先导入政策表'); return; }
        const ch = sel ? sel.value : '';
        if (!ch) { alert('请选择' + cfg.channelLabel); return; }
        const p = polNow.find(x => x.channel === ch);
        const base = parseFloat(baseEl ? baseEl.value : '0') || 0;
        const c = compute(p, base);
        const dEl2 = document.getElementById(PFX + 'Date');
        const model = document.getElementById(PFX + 'Model');
        const orders = loadOrders();
        const id = PFX + Date.now() + Math.floor(Math.random() * 100);
        orders.push({ id, date: dEl2 ? dEl2.value : new Date().toISOString().slice(0, 10), channel: ch, model: model ? model.value.trim() : '', base, rebate: Math.round(c.rebate) });
        saveOrders(orders); renderOrders();
        const st = document.getElementById(PFX + 'OrderStatus');
        if (st) st.innerHTML = '已添加 1 笔订单（' + E(ch) + '），' + cfg.unitName + ' ' + Math.round(c.rebate).toLocaleString('zh-CN') + ' 元，已计入月度合计。';
        if (baseEl) baseEl.value = 0;
        refreshChPolicy();
      };
      if (clrO) clrO.onclick = () => {
        if (!confirm('确认清除全部已录入订单？（不影响已导入政策）')) return;
        saveOrders([]); renderOrders();
        const st = document.getElementById(PFX + 'OrderStatus'); if (st) st.innerHTML = '已清除全部订单。';
      };
      if (expO) expO.onclick = () => {
        const d = loadOrders(); if (!d.length) { alert('暂无订单可导出'); return; }
        const head = ['业务日期', cfg.channelLabel, '车型/客户', cfg.baseLabel, '本单' + cfg.unitName];
        const lines = d.map(o => [o.date, o.channel, o.model, o.base, o.rebate].join(','));
        const csv = '﻿' + [head.join(','), ...lines].join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = cfg.exportName; a.click();
      };

      renderPolicy(); renderOrders(); refreshChPolicy();
    }

    return function (m) {
      let h = moduleHero(m);
      h += secTitle(cfg.title + '口径', cfg.noteShort);
      h += note(cfg.formulaTxt, '');

      h += secTitle('月度' + cfg.policyName + ' · 各渠道政策明细', cfg.policyHint);
      h += `<div class="card"><div class="card-bd">
        <div class="fp-bar" style="flex-wrap:wrap;gap:10px">
          <label class="fp-lb">${cfg.policyName}
            <input id="${PFX}PolicyFile" class="fp-in" type="file" accept=".xlsx,.xls,.csv"></label>
          <button class="dq-btn primary" id="${PFX}PolicyParse">解析并呈现</button>
          <button class="dq-btn ghost" id="${PFX}PolicyTpl">下载模板</button>
          <button class="dq-btn ghost" id="${PFX}PolicyClear">清除政策</button>
        </div>
        <div class="note" style="margin-top:8px">建议列：<b>${cfg.policyHead.join(' / ')}</b>。至少需「${cfg.channelLabel}」+（「${cfg.rateLabel}」或「${cfg.fixedLabel}」其一）。系统按渠道名称去重汇总。</div>
        <div id="${PFX}PolicyStatus" class="note" style="margin-top:10px"></div>
        <div id="${PFX}PolicyTable"></div>
      </div></div>`;

      h += secTitle(cfg.orderTitle, cfg.orderHint);
      h += `<div class="card"><div class="card-bd">
        <div class="fp-bar" style="flex-wrap:wrap;gap:12px;align-items:flex-end">
          <label class="fp-lb">业务日期
            <input id="${PFX}Date" class="fp-in" type="date"></label>
          <label class="fp-lb">${cfg.channelLabel}
            <select id="${PFX}Channel" class="fp-sel"><option value="">— 请先导入政策 —</option></select></label>
          <label class="fp-lb">车型 / 客户（可选）
            <input id="${PFX}Model" class="fp-in" type="text" placeholder="如 瑞虎9 · 张三" style="min-width:180px"></label>
          <label class="fp-lb">${cfg.baseLabel}(${cfg.baseUnit})
            <input id="${PFX}Base" class="fp-in" type="number" min="0" step="1000" value="0" style="width:150px"></label>
        </div>
        <div id="${PFX}ChPolicy" class="note ok" style="margin-top:10px">选择${cfg.channelLabel}后将自动显示该渠道政策与返利公式。</div>
        <div class="fp-sum" id="${PFX}RebateBox" style="display:none">
          <div class="fp-sum-b hl"><span>本单${cfg.unitName}</span><b id="${PFX}Rebate">0</b> 元</div>
          <div class="fp-sum-b"><span>构成</span><b id="${PFX}RebateBreak">—</b></div>
        </div>
        <div class="fp-bar" style="margin-top:12px">
          <button class="dq-btn primary" id="${PFX}AddOrder">添加订单并计提</button>
          <button class="dq-btn ghost" id="${PFX}ClearOrders">清除全部订单</button>
          <button class="dq-btn ghost" id="${PFX}ExportOrders">导出订单(CSV)</button>
        </div>
        <div id="${PFX}OrderStatus" class="note" style="margin-top:10px"></div>
        <div id="${PFX}OrderResult"></div>
      </div></div>`;

      setTimeout(init, 0);
      return h;
    };
  }

  const IR_CFG = {
    prefix: 'ir', policyKey: 'cockpit_ins_policy_v1', orderKey: 'cockpit_ins_orders_v1',
    title: '保险返利概况', unitName: '保险返利', channelLabel: '保险渠道', productLabel: '保险产品',
    rateLabel: '返利点数', rateSuffix: '%', fixedLabel: '固定返利(元/单)', baseLabel: '保费金额', baseUnit: '元',
    policyName: '月度保险政策表', tplName: '月度保险政策表模板.csv', exportName: '保险返利订单_' + new Date().toISOString().slice(0, 10) + '.csv',
    noteShort: '以你导入的当月保险政策为准，绝不预置模拟返利',
    formulaTxt: '保险返利 = 渠道「固定返利(元/单)」+ 保费金额 × 「返利点数(%)」÷ 100。若渠道仅填其一，则只计其一。各渠道政策明细由你导入的月度保险政策表驱动。',
    policyHint: '导入当月各保险渠道政策表（Excel/CSV），自动呈现渠道明细；下拉选择将驱动订单录入自动套用',
    orderTitle: '订单保险返利录入', orderHint: '在录入订单环节选择对应保险渠道、填入保费金额，系统自动套用该渠道政策、即时生成该单保险返利；可逐单累加并随顶栏查询区间过滤',
    policyHead: ['保险渠道', '保险产品', '返利点数(%)', '固定返利(元/单)', '备注'],
    policySample: [['平安产险', '商业险+交强', '15', '300', '常规返点'], ['人保财险', '全险', '12', '200', '大单额外'], ['太保产险', '车险', '10', '0', '纯点数']]
  };

  const TR_CFG = {
    prefix: 'tr', policyKey: 'cockpit_ti_policy_v1', orderKey: 'cockpit_ti_orders_v1',
    title: '置换补贴核算', unitName: '置换补贴', channelLabel: '置换厂家/品牌', productLabel: '车型',
    rateLabel: '补贴比例', rateSuffix: '%', fixedLabel: '补贴金额(元/台)', baseLabel: '新车车价', baseUnit: '元',
    policyName: '月度置换补贴政策表', tplName: '月度置换补贴政策表模板.csv', exportName: '置换补贴订单_' + new Date().toISOString().slice(0, 10) + '.csv',
    noteShort: '以你导入的当月厂家置换补贴政策为准，绝不预置模拟补贴',
    formulaTxt: '置换补贴 = 厂家「补贴金额(元/台)」+ 新车车价 × 「补贴比例(%)」÷ 100。若仅填其一，则只计其一。各厂家/车型补贴政策由你导入的月度置换补贴政策表驱动。',
    policyHint: '导入当月各厂家/品牌置换补贴政策表（Excel/CSV），自动呈现政策明细；下拉选择将驱动订单录入自动套用',
    orderTitle: '订单置换补贴录入', orderHint: '在录入订单环节选择对应置换厂家、填入新车车价，系统自动套用该厂家政策、即时生成该单置换补贴；可逐单累加并随顶栏查询区间过滤',
    policyHead: ['置换厂家/品牌', '车型', '补贴金额(元/台)', '补贴比例(%)', '备注'],
    policySample: [['比亚迪(同品牌)', '全系', '3000', '0', '同品牌置换固定补贴'], ['比亚迪(跨品牌)', '全系', '2000', '0', '异品牌置换'], ['其他品牌', '全系', '0', '3', '按车价3%补贴']]
  };

  VIEWS.salesInsRebate = makeRebateModule(IR_CFG);
  VIEWS.salesTradein = makeRebateModule(TR_CFG);
})();
