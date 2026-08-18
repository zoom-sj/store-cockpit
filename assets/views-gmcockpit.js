/* 总经理驾驶舱 —— 一人看全局：9 板块聚合 + 部门健康度对比 + 全局接通率 + 预警/闭环实时汇总 */
VIEWS.gmCockpit = function () {
  const D0 = D, sections = D0.sections;

  /* ---- 全局模块接通统计 ---- */
  let total = 0, live = 0, partial = 0, pending = 0;
  const secStats = sections.map(s => {
    let sl = 0, sp = 0, spd = 0, st = 0;
    s.items.forEach(it => {
      st++; total++;
      const st0 = (D0.moduleStatusOverride && D0.moduleStatusOverride[it.key]) || it.status;
      if (st0 === 'live') { live++; sl++; }
      else if (st0 === 'partial') { partial++; sp++; }
      else { pending++; spd++; }
    });
    return { s, sl, sp, spd, st, rate: st ? Math.round(sl / st * 100) : 0 };
  });
  const connRate = total ? Math.round(live / total * 100) : 0;

  /* ---- 关键 KPI（仅已接通真数） ---- */
  const kpis = D0.overview.kpis || [];

  /* ---- 预警 / 今日必办 ---- */
  const alertsN = (D0.overview.alerts || []).filter(a => a.level === 'high' || a.level === 'mid').length;
  const loops = (typeof loadLoops === 'function') ? loadLoops() : [];
  const overdueN = loops.filter(l => l.status !== 'closed' && loopRemind(l).level !== 'ok').length;
  const urgentN = alertsN + overdueN;

  /* ---- 自动流 ---- */
  const flows = window.__AUTOFLOWS__ || [];
  const fActive = flows.filter(f => f.status === 'ACTIVE').length;
  const fPaused = flows.filter(f => f.status === 'PAUSED').length;
  const fOnce = flows.filter(f => f.status === 'ONCE').length;

  /* ---- 闭环状态 ---- */
  const lOpen = loops.filter(l => l.status === 'open').length;
  const lHandle = loops.filter(l => l.status === 'handling').length;
  const lVerify = loops.filter(l => l.status === 'verifying').length;
  const lClosed = loops.filter(l => l.status === 'closed').length;
  const lOver = loops.filter(l => l.status !== 'closed' && loopRemind(l).level === 'over').length;

  /* ---- 部门数据健康度 ---- */
  const members = D0.orgLoop.org.members || [];
  const depts = D0.orgLoop.org.departments || [];
  const deptRows = depts.map(d => {
    const hc = members.filter(mm => mm.dept === d.id).length;
    const sec = sections.find(s => s.key === d.id);
    let dl = 0, dt = 0;
    if (sec) sec.items.forEach(it => { dt++; const st0 = (D0.moduleStatusOverride && D0.moduleStatusOverride[it.key]) || it.status; if (st0 === 'live') dl++; });
    return { d, hc, dl, dt, rate: dt ? Math.round(dl / dt * 100) : 0 };
  }).sort((a, b) => b.rate - a.rate);

  let h = '';
  h += `<div class="gm-head">
    <div class="gm-title">总经理驾驶舱 · 一屏看全局</div>
    <div class="gm-sub">${E(D0.meta.storeShort)} · 数据截至 ${E(D0.meta.dataDate)} · 一人统管多部门 · 紧急闭环一览</div>
  </div>`;

  /* 全局接通率 */
  h += `<div class="grid g4">
    ${kpiCard({ label: '板块数据接通率', value: connRate, unit: '%', sub: live + '/' + total + ' 模块已接通真实数据', status: 'live', trend: null })}
    ${kpiCard({ label: '已接通模块', value: live, unit: '个', sub: 'live 真实出数', status: 'live' })}
    ${kpiCard({ label: '部分接通', value: partial, unit: '个', sub: 'partial 待补全视图', status: 'partial' })}
    ${kpiCard({ label: '待接通模块', value: pending, unit: '个', sub: '待 ABS/CRM/台账授权', status: 'pending' })}
  </div>`;

  /* 9 板块健康度总览 */
  h += secTitle('9 大板块健康度总览', '点击任一块直达其首个模块；绿=已接通真实数据，黄=部分，灰=待接通');
  h += `<div class="grid g3">${secStats.map(x => {
    const s = x.s;
    const firstKey = s.items[0] ? s.items[0].key : '';
    const statusCls = x.sl > 0 ? (x.spd > 0 || x.sp > 0 ? 'mix' : 'on') : (x.sp > 0 ? 'part' : 'off');
    return `<div class="sec-card" ${firstKey ? `data-jump="${firstKey}"` : ''} style="--sc:${s.color}">
      <div class="sec-card-h"><span class="sec-ic" style="background:${s.color}"></span><b>${E(s.name)}</b><span class="sec-rate ${statusCls}">${x.rate}%</span></div>
      <div class="bar"><span style="width:${x.rate}%"></span></div>
      <div class="sec-card-f">接通 ${x.sl}/${x.st} · 部分 ${x.sp} · 待 ${x.spd}</div>
    </div>`;
  }).join('')}</div>`;

  /* 关键 KPI 一屏 */
  h += secTitle('关键经营指标一屏', '售后线为 ABS 实时真数；销售/财务/二手车待视图授权（不填模拟值）');
  h += `<div class="grid g4">${kpis.map(kpiCard).join('')}</div>`;

  /* 部门健康度对比 */
  h += secTitle('部门数据健康度对比', '横条=板块数据接通率，括号=在册人数；灰条=尚未接通，绿条=已接通');
  h += `<div class="dept-cmp">${deptRows.map(r => `
    <div class="dept-row">
      <div class="dept-name">${E(r.d.name)}<span class="dept-hc">${r.hc}人</span></div>
      <div class="dept-bar"><span style="width:${r.rate}%;background:${r.rate > 0 ? '#00a870' : '#c7cedb'}"></span></div>
      <div class="dept-val">${r.rate}%<em>${r.dl}/${r.dt} 模块</em></div>
    </div>`).join('')}</div>`;

  /* 预警 + 今日必办 */
  h += secTitle('预警中枢与今日必办', '全部由 ABS 真数或闭环任务派生');
  h += `<div class="grid g2">
    ${card('经营预警（高/中优）', `<div class="big-num ${alertsN ? 'warn' : ''}">${alertsN}</div><div class="muted">条待关注预警，点击前往今日必办处理</div>`, 'ABS 真数派生', `<a class="btn ghost sm" data-jump="loop.today">进入今日必办 →</a>`)}
    ${card('紧急事项 / 今日必办', `<div class="big-num ${urgentN ? 'warn' : ''}">${urgentN}</div><div class="muted">预警 ${alertsN} + 超时闭环 ${overdueN}</div>`, '实时聚合', `<a class="btn ghost sm" data-jump="loop.today">去处理 →</a>`)}
  </div>`;

  /* 自动流 + 闭环 */
  h += secTitle('自动流与闭环状态', 'WorkBuddy 真实自动流 + 当前闭环任务');
  h += `<div class="grid g2">
    ${card('自动流运行概览', `<div class="flow-stats"><span class="on">运行中 ${fActive}</span><span class="off">已暂停 ${fPaused}</span><span class="once">单次 ${fOnce}</span></div><div class="muted">共 ${flows.length} 条真实自动流</div>`, 'WorkBuddy 自动化中心', `<a class="btn ghost sm" data-jump="autoflow.projects">查看清单 →</a>`)}
    ${card('闭环任务状态', `<div class="loop-stats"><span>待处理 ${lOpen}</span><span>处理中 ${lHandle}</span><span>待验证 ${lVerify}</span><span class="done">已闭环 ${lClosed}</span>${lOver ? `<span class="over">超时 ${lOver}</span>` : ''}</div>`, '点击前往闭环看板', `<a class="btn ghost sm" data-jump="loop.board">看板 →</a>`)}
  </div>`;

  h += `<div class="note" style="margin-top:14px">诚信红线：本驾驶舱所有数字均来自已接通的真实数据源（ABS 售后真数、企微、真实花名册、WorkBuddy 自动流导出）。未接通板块一律标注「待接通」，绝不填入模拟值。闭环记录在内网 Node 部署下已支持服务端持久化（换设备/换人可见可审计）。</div>`;
  return h;
};
