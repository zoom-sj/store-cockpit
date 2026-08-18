/* 视图渲染层 —— 总经理大脑 · 全链路自动流中枢 */
(function () {
  const G = D.gmBrain;

  function wfChip(s) {
    const map = {
      live: '<span class="dot live"></span>运行中',
      partial: '<span class="dot partial"></span>部分运行',
      pending_crm: '<span class="dot pending_crm"></span>待 CRM',
      pending_auth: '<span class="dot pending_auth"></span>待授权',
      skill_ready: '<span class="dot skill_ready"></span>技能就绪',
      paused: '<span class="dot paused"></span>已暂停',
      ready: '<span class="dot ready"></span>脚本就绪'
    };
    return map[s] || `<span class="dot pending_form"></span>${s}`;
  }

  VIEWS.gmBrain = function () {
    const o = D.overview;
    let h = '';

    /* 顶部导语 */
    h += `<div class="gm-hero">
      <div class="gm-hero-ic">${ICONS.brain}</div>
      <div>
        <div class="gm-hero-t">辉达奇瑞经营中枢</div>
        <div class="gm-hero-s">${E(G.intro)}</div>
      </div>
    </div>`;

    /* 经营总览 KPI 带（真数） */
    h += secTitle('经营总览（实时真数）', '数据源 dbo.V_R_Service_25 · 环比 7 月同期');
    h += `<div class="grid g4">${o.kpis.map(kpiCard).join('')}</div>`;

    /* 全链路工作流矩阵 */
    h += secTitle('全链路工作流矩阵（WF-01 ~ WF-06 + 自动刷新）', '任一数据源接通即触发对应自动流');
    h += `<div class="wf-grid">${G.workflows.map(w => `
      <div class="wf-card ${w.status}">
        <div class="wf-top">
          <span class="wf-id">${E(w.id)}</span>
          ${wfChip(w.status)}
          ${w.autoFlow ? '<span class="wf-auto">自动流</span>' : '<span class="wf-auto off">暂停</span>'}
        </div>
        <div class="wf-name">${E(w.name)}</div>
        <div class="wf-meta">
          <span><b>负责</b>${E(w.owner)}</span>
          <span><b>节奏</b>${E(w.cadence)}</span>
          <span><b>触发</b>${E(w.trigger)}</span>
          <span><b>最近运行</b>${E(w.lastRun || '—')}</span>
        </div>
        <div class="wf-note">${E(w.note)}</div>
      </div>`).join('')}</div>`;

    /* 数据闸门与自动流映射 */
    h += secTitle('数据闸门 · 自动流映射', '每个数据源接通后自动点亮的模块与触发方式');
    h += `<div class="grid g2">${G.dataGating.map(g => `
      <div class="card"><div class="card-bd">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          ${bdg(g.status)}<b style="font-size:13.5px">${E(g.source)}</b>
        </div>
        <div style="font-size:11.5px;color:var(--ink-3);margin-bottom:6px">接通后点亮</div>
        <div class="field-chips" style="margin-bottom:10px">
          ${g.lights.map(l => `<span class="fchip">${E(l)}</span>`).join('')}
        </div>
        <div class="note"><b>自动流：</b>${E(g.autoFlow)}</div>
      </div></div>`).join('')}</div>`;

    /* 自动流编排链路 */
    h += secTitle('自动流编排链路', '闭环：接通 → 拉取 → 校验 → 翻 live → 推送 → 下游触发');
    h += `<div class="flow-chain">${G.autoFlowChain.map((s, i) => `
      <div class="flow-step">
        <div class="flow-num">${i + 1}</div>
        <div class="flow-tx">${E(s)}</div>
      </div>${i < G.autoFlowChain.length - 1 ? '<div class="flow-arrow">→</div>' : ''}`).join('')}</div>`;

    /* 组织与闭环入口 */
    h += secTitle('组织与闭环（企业清晰化管理）', '责任到部门 · 提醒到个人 · 闭环可审计');
    const pendLoops = (typeof loadLoops === 'function') ? loadLoops().filter(l => l.status !== 'closed').length : 0;
    h += `<div class="card" style="cursor:pointer" data-jump="loop.board"><div class="card-bd" style="display:flex;align-items:center;gap:12px">
      <div class="gm-hero-ic" style="color:#ddd6fe;background:rgba(124,58,237,.16)">${ICONS.loop}</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13.5px">闭环看板（提醒与监督）</div>
        <div class="note" style="margin:0">当前待办闭环 <b>${pendLoops}</b> 项 · 点击进入四态看板，按部门认领、提交与验证闭环结果（组织架构见「行政板块 → 组织架构管理」）</div>
      </div>
      <span class="nav-ico" style="color:var(--ink-3)">${ICONS.caret}</span>
    </div></div>`;

    /* 自动流项目入口 */
    const afCount = (window.__AUTOFLOWS__ || []).length;
    const afActive = (window.__AUTOFLOWS__ || []).filter(a => a.status === 'ACTIVE').length;
    h += `<div class="card" style="cursor:pointer;margin-top:12px" data-jump="autoflow.projects"><div class="card-bd" style="display:flex;align-items:center;gap:12px">
      <div class="gm-hero-ic" style="color:#7dd3fc;background:rgba(14,165,233,.16)">${ICONS.flow}</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13.5px">自动流项目清单（关联 WorkBuddy 自动化中心）</div>
        <div class="note" style="margin:0">当前 ${afCount} 条自动流 · 运行中 <b>${afActive}</b> 条 · 点击查看与 WF 工作流的对应及触发节奏</div>
      </div>
      <span class="nav-ico" style="color:var(--ink-3)">${ICONS.caret}</span>
    </div></div>`;

    /* 预警中枢（复用总览告警） */
    h += secTitle('预警中枢', '全部由 ABS 真数按规则派生，点击可跳转对应模块');
    h += `<div>${o.alerts.map(a => `
      <div class="alert ${a.level}">
        <div class="alert-ic">${a.level === 'high' ? '!' : a.level === 'good' ? '✓' : a.level === 'mid' ? '·' : 'i'}</div>
        <div class="alert-bd">
          <div class="alert-tx">${E(a.text)}</div>
          <div class="alert-mt">${bdg(M[a.module] ? M[a.module].status : 'live')} <a data-jump="${a.module}">前往 ${E(M[a.module] ? M[a.module].title : a.module)} →</a></div>
        </div></div>`).join('')}</div>`;

    /* 未接通保持说明 */
    h += `<div class="note" style="margin-top:14px">说明：当前仅 ABS 售后真数已接通，未接入板块（销售/财务/行政/部分客服与营销）保持 <b>pending</b> 状态、不填充模拟值；ABS/CRM/企微台账任一接通后，对应模块按上方「数据闸门 · 自动流映射」自动出数，无需人工触发。</div>`;

    return h;
  };
})();
