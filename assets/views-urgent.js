/* 紧急事项聚合器：跨板块紧急信号 → 今日必办 → 一键转闭环，并接企微推送钩子 */
window.VIEWS = window.VIEWS || {};

/* 预警模块 → 责任部门 / 责任人 / SLA / 关联工作流（基于已导入组织架构与 dutyMatrix） */
window.ALERT_DUTY = {
  'service.margin':    { dept: 'service', owner: '服务经理', sla: '日跟进', wf: 'WF-01' },
  'cs.churn':          { dept: 'cs', owner: '客服主管', sla: 'L1 2h / L2 4h', wf: 'WF-06' },
  'cs.active':         { dept: 'cs', owner: '客服主管', sla: '周招揽', wf: 'WF-05' },
  'service.reception': { dept: 'service', owner: '服务经理', sla: '日跟进', wf: '—' },
  'service.output':    { dept: 'service', owner: '服务经理', sla: '日跟进', wf: 'WF-01' },
  'adm.efficiency':   { dept: 'adm', owner: '行政人事经理', sla: '月', wf: 'WF-02' }
};

VIEWS.urgentBoard = function (m) {
  const OL = D.orgLoop;
  window.__URGENT_ITEMS__ = {};

  /* A. ABS 真数预警（high / mid）→ 今日必办 */
  const alerts = (D.overview.alerts || []).filter(a => a.level === 'high' || a.level === 'mid');
  const alertItems = alerts.map(a => {
    const duty = window.ALERT_DUTY[a.module] || { dept: a.module.split('.')[0], owner: deptLead(a.module.split('.')[0]) || '—', sla: '—', wf: '—' };
    const id = 'U-' + a.module;
    const item = {
      id, from: 'alert', src: 'ABS 真数预警', section: duty.dept, level: a.level,
      title: (M[a.module] && M[a.module].title) || a.module, desc: a.text,
      dept: duty.dept, owner: duty.owner, sla: duty.sla, wf: duty.wf, slaHours: 24
    };
    window.__URGENT_ITEMS__[id] = item;
    return item;
  });

  /* B. 超时 / 临期闭环任务（真实或示例）→ 今日必办 */
  const loops = loadLoops();
  const overdue = loops.filter(l => l.status !== 'closed' && loopRemind(l).level !== 'ok');
  const loopItems = overdue.map(l => {
    const id = l.id;
    const item = {
      id, from: 'loop', loopId: l.id, tpl: l.tpl, src: deptName(l.dept) + ' 闭环', section: l.dept,
      level: loopRemind(l).level === 'over' ? 'high' : 'mid', title: l.title,
      desc: '闭环任务' + (loopRemind(l).level === 'over' ? '已超时' : '临期') + '：' + loopRemind(l).txt,
      dept: l.dept, owner: l.owner, sla: l.slaHours + 'h', wf: '—', slaHours: l.slaHours
    };
    window.__URGENT_ITEMS__[id] = item;
    return item;
  });

  /* C. 待实例化模板（数据接通后由自动流实例化，仅展示覆盖度，不计入今日必办） */
  const tplItems = (OL.loops.templates || []).map(t => ({
    id: 'T-' + t.id, from: 'tpl', tpl: t.id, src: '闭环模板', section: t.dept, level: 'mid',
    title: t.title, desc: '触发：' + t.trigger, dept: t.dept, owner: t.owner, sla: t.slaHours + 'h', wf: t.wf || '—', slaHours: t.slaHours
  }));

  const items = alertItems.concat(loopItems);
  const highN = items.filter(i => i.level === 'high').length;
  const midN = items.filter(i => i.level === 'mid').length;
  const dueN = items.filter(i => /超时|临期/.test(i.desc)).length;

  let h = '';
  h += `<div class="gm-hero" style="background:linear-gradient(120deg,#7f1d1d,#b45309 55%,#0891b2)">
    <div class="gm-hero-ic" style="color:#fecaca;background:rgba(254,202,202,.16)">${ICONS.bell}</div>
    <div>
      <div class="gm-hero-t">今日必办 · 紧急事项聚合 ${bdg(effStatus(m.status, m.key))}</div>
      <div class="gm-hero-s">跨板块紧急信号自动汇聚成一张待办清单，一键转入闭环、指派责任部门、企微推送责任人。当前数据源：ABS 真数预警 + 本地闭环记录；客诉 / 差评 / 库存 D 类预警 / 到期证照等其余信号，待对应 ABS 视图或企微台账接通后由自动流自动实例化进本清单。</div>
    </div></div>`;

  /* KPI 条 */
  h += `<div class="kpi-grid">
    ${kpiCard({ label: '紧急事项总数', value: items.length, unit: '项' })}
    ${kpiCard({ label: '高优（红）', value: highN, unit: '项' })}
    ${kpiCard({ label: '中优（橙）', value: midN, unit: '项' })}
    ${kpiCard({ label: '今日到期/超时', value: dueN, unit: '项' })}
  </div>`;

  /* 聚合清单 */
  h += secTitle('今日必办（按紧急度排序）', '点「转闭环」即生成闭环任务并指派责任部门；已转过的显示「查看闭环」');
  if (!items.length) h += `<div class="note ok">🎉 当前无紧急事项，各板块运转正常。</div>`;
  else {
    const sorted = items.slice().sort((a, b) => (a.level === 'high' ? 0 : 1) - (b.level === 'high' ? 0 : 1));
    h += `<div class="urgent-list">${sorted.map(i => urgentCard(i)).join('')}</div>`;
  }

  /* 待实例化模板（覆盖度） */
  h += secTitle('闭环模板覆盖（数据接通后自动实例化）', '对应工作流触发即生成闭环任务，当前为待实例化说明');
  h += `<div class="grid g2">${tplItems.map(t => `
    <div class="urgent-card mid">
      <div class="uc-hd"><span class="lv mid">待实例化</span>${E(t.title)}</div>
      <div class="uc-desc">${E(t.desc)}</div>
      <div class="uc-meta"><span>${E(deptName(t.dept))} / ${E(t.owner)}</span><span>SLA ${E(t.sla)}</span>${t.wf && t.wf !== '—' ? `<span class="wf-id">${E(t.wf)}</span>` : ''}</div>
    </div>`).join('')}</div>`;

  /* 企微推送联调 */
  h += secTitle('企业微信推送（真实推送钩子）', '内网部署时由 server.js 注入 window.__WECOM_READY__=true 即真实推送；本地可点「模拟连通」验证推送链路');
  const ready = !!window.__WECOM_READY__;
  h += `<div class="wecom-push-card">
    <div class="wpc-top"><span>推送状态：</span><span id="wecom-state" class="chip ${ready ? 'ok' : ''}">${ready ? '已模拟连通（联调）' : '未连通'}</span>
      <button class="btn tiny" id="wecom-toggle" data-wecom-toggle>${ready ? '断开模拟' : '模拟连通（联调）'}</button></div>
    <div class="wpc-sub">转闭环 / 认领 / 超时升级 时，payload 会按 window.__WECOM_READY__ 真实推送责任人；未连通时仅本地记录，不丢事项。</div>
    <div id="wecom-log" class="wecom-log"></div>
  </div>`;

  h += `<div class="note" style="margin-top:12px">数据说明：预警来自 <b>ABS 真数（overview.alerts）</b> 与 <b>本地闭环记录</b>，均为真实或示例数据，未编造任何经营数字。客诉 / 差评 / 库存 D 类预警 / 到期证照等其余信号，待对应 ABS 视图或企微台账接通后，由自动流自动实例化进本清单（届时角标与待办数会随真实数据增长）。</div>`;

  return h;
};

function urgentCard(i) {
  window.__URGENT_ITEMS__ = window.__URGENT_ITEMS__ || {};
  window.__URGENT_ITEMS__[i.id] = i;
  const converted = i.from !== 'loop' && loadLoops().some(l => l.id === i.id);
  const lvTxt = i.level === 'high' ? '高优' : '中优';
  const btn = (i.from === 'loop' || converted)
    ? `<button class="btn tiny ok" data-urgent-view="${i.id}">查看闭环</button>`
    : `<button class="btn tiny primary" data-urgent-create="${i.id}">转闭环</button>`;
  return `<div class="urgent-card ${i.level}">
    <div class="uc-hd"><span class="lv ${i.level}">${lvTxt}</span>${E(i.title)}
      <span class="uc-src">${E(i.src)}</span></div>
    <div class="uc-desc">${E(i.desc)}</div>
    <div class="uc-meta">
      <span>责任：<b>${E(deptName(i.dept))} / ${E(i.owner)}</b></span>
      <span>SLA：<b>${E(i.sla)}</b></span>
      ${i.wf && i.wf !== '—' ? `<span class="wf-id">${E(i.wf)}</span>` : ''}
    </div>
    <div class="uc-acts">${btn}</div>
  </div>`;
}
