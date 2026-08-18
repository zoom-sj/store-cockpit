/* 视图渲染层 —— 自动流项目清单（直接关联 WorkBuddy 自动化中心真实自动流） */
(function () {
  function afDot(a) {
    if (a.status === 'ACTIVE') return '<span class="dot live"></span>运行中';
    if (a.status === 'PAUSED') return '<span class="dot paused"></span>已暂停';
    if (a.scheduleType === 'once') return '<span class="dot skill_ready"></span>单次';
    return '<span class="dot pending_form"></span>' + E(a.status);
  }
  function afRow(a) {
    const wfTag = a.wf ? `<span class="fchip" style="background:#0ea5e918;color:#0ea5e9;border-color:#0ea5e940">${E(a.wf)}</span>` : '';
    const typeTag = a.scheduleType === 'once'
      ? '<span class="fchip">单次触发</span>'
      : '<span class="fchip">周期循环</span>';
    return `<div class="af-row">
      <div class="af-st">${afDot(a)}</div>
      <div class="af-name">${E(a.name)} ${wfTag}</div>
      <div class="af-cad">${E(a.cadence)}</div>
      <div class="af-type">${typeTag}</div>
    </div>`;
  }

  VIEWS.autoFlow = function (m) {
    const list = (window.__AUTOFLOWS__ || []).slice();
    const meta = window.__AUTOFLOWS_META__ || {};
    const total = list.length;
    const active = list.filter(a => a.status === 'ACTIVE').length;
    const paused = list.filter(a => a.status === 'PAUSED').length;
    const once = list.filter(a => a.scheduleType === 'once').length;
    const wfLinks = list.filter(a => a.kind === 'wf');
    const indep = list.filter(a => a.kind === 'independent');

    /* 按 WF 分组（对应工作台工作流） */
    const wfOrder = ['WF-01', 'WF-02', 'WF-05', 'WF-06', 'WF-10', 'WF-11'];
    const wfGroups = wfOrder
      .map(w => ({ w, items: wfLinks.filter(a => a.wf === w) }))
      .filter(g => g.items.length);

    let h = '';
    h += `<div class="gm-hero" style="background:linear-gradient(120deg,#0b2545,#0e7490 60%,#0ea5e9)">
      <div class="gm-hero-ic" style="color:#7dd3fc;background:rgba(125,211,252,.16)">${ICONS.flow}</div>
      <div>
        <div class="gm-hero-t">自动流项目 · 直接关联 WorkBuddy 自动化中心</div>
        <div class="gm-hero-s">${E(m.desc)}</div>
      </div></div>`;

    /* 汇总 */
    h += secTitle('自动流总览', '数据快照来源：' + E(meta.source || 'WorkBuddy 自动化中心') + (meta.syncedAt ? ' · 截至 ' + E(meta.syncedAt) : ''));
    h += `<div class="grid g4">
      ${kpiCard({ label: '自动流总数', value: total, unit: '条', status: 'live' })}
      ${kpiCard({ label: '运行中', value: active, unit: '条', status: 'live' })}
      ${kpiCard({ label: '已暂停', value: paused, unit: '条', status: 'paused' })}
      ${kpiCard({ label: '单次触发', value: once, unit: '条', status: 'skill_ready' })}
    </div>`;

    h += `<div class="note" style="margin:4px 0 14px">说明：下列条目为 <b>WorkBuddy 自动化中心真实导出的自动流</b>（非模拟值）。任一数据源（ABS / CRM / 企微台账）接通后，对应 WF 自动流即驱动工作台模块出数；在自动化中心启停自动流，本清单同步反映。</div>`;

    /* WF 对应自动流 */
    h += secTitle('与工作流对应的自动流（WF-01 ~ WF-11）', '直接驱动工作台对应模块，状态随 WorkBuddy 自动化中心实时同步');
    h += wfGroups.map(g => `
      <div class="card" style="margin-bottom:12px"><div class="card-bd" style="padding:12px 14px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span class="fchip" style="background:#0ea5e918;color:#0ea5e9;border-color:#0ea5e940;font-weight:700">${E(g.w)}</span>
          <b style="font-size:13px">${E((D.gmBrain.workflows.find(w => w.id === g.w) || {}).name || '对应工作流')}</b>
          <span class="note" style="margin:0;padding:0;background:none;color:var(--ink-3)">${g.items.length} 条自动流</span>
        </div>
        <div class="af-list">${g.items.map(afRow).join('')}</div>
      </div></div>`).join('');

    /* 独立自动流 */
    h += secTitle('其他独立业务自动流', '短视频 / 行情 / 竞品 / 发布提醒等，支撑门店日常运营自动化');
    h += `<div class="card"><div class="card-bd" style="padding:12px 14px">
      <div class="af-list">${indep.map(afRow).join('')}</div>
    </div></div>`;

    /* 关联说明 */
    h += secTitle('与工作台自动流的关联', '一个数据源接通 → 一条自动流 → 一组模块出数');
    h += `<div class="card"><div class="card-bd">
      <div class="note" style="margin:0">· <b>WF 对应自动流</b>：名称含 WF 编号的 WorkBuddy 自动流，已按编号关联到本工作台「辉达奇瑞经营中枢」的 WF 工作流矩阵，状态（运行中 / 已暂停）实时一致。</div>
      <div class="note" style="margin:8px 0 0">· <b>独立自动流</b>：短视频生产、行情报告、竞品周报、发布提醒等，是门店运营自动化的执行体，可在自动化中心统一启停与排期。</div>
      <div class="note" style="margin:8px 0 0">· <b>重新同步</b>：在 WorkBuddy 中执行自动化列表导出，替换 <code>data/autoflows.js</code> 即可刷新本清单（含运行状态与触发节奏）。</div>
    </div></div>`;

    return h;
  };
})();
