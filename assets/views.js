/* 视图渲染层 —— 总览 / 数据源 / 各业务模块 */
const VIEWS = {};

/* ==================== 全店总览驾驶舱 ==================== */
VIEWS.overview = function () {
  const o = D.overview, c = o.cohort;
  const mtd = o.months[o.months.length - 1];
  const totalRev = o.categories.reduce((s, x) => s + x.revenue, 0);
  const totalPft = o.categories.reduce((s, x) => s + x.profit, 0);

  let h = secTitle('核心经营指标', o.mtdLabel + ' · 环比口径对齐 7 月同期（7/1–7/13）');
  h += `<div class="grid g4">${o.kpis.map(kpiCard).join('')}</div>`;

  /* 告警 */
  h += secTitle('经营预警与机会', '全部由 ABS 真数按规则派生，点击可跳转对应模块');
  h += `<div>${o.alerts.map(a => `
    <div class="alert ${a.level}">
      <div class="alert-ic">${a.level === 'high' ? '!' : a.level === 'good' ? '✓' : a.level === 'mid' ? '·' : 'i'}</div>
      <div class="alert-bd">
        <div class="alert-tx">${E(a.text)}</div>
        <div class="alert-mt">${bdg(M[a.module] ? M[a.module].status : 'live')} <a data-jump="${a.module}">前往 ${E(M[a.module] ? M[a.module].title : a.module)} →</a></div>
      </div></div>`).join('')}</div>`;

  /* 趋势 */
  h += secTitle('售后经营趋势', '数据源 dbo.V_R_Service_25 · ' + D.meta.windowTrend);
  h += `<div class="grid g23">
    ${card('周度营收与毛利走势', CH.line(o.weeks, {
      x: 'w', id: 'ow', h: 256,
      series: [{ key: 'revenue', name: '实际营收(元)', color: '#1e5eff', area: true },
               { key: 'profit', name: '实际毛利(元)', color: '#00a870', area: true }]
    }), '近 14 周 · 元')}
    ${card('月度营收 / 毛利', CH.bars(o.months, {
      x: 'm', id: 'om', h: 256,
      series: [{ key: 'revenue', name: '营收', color: '#1e5eff' }, { key: 'profit', name: '毛利', color: '#00a870' }]
    }), '8月为 MTD（13天，浅色）')}
  </div>`;

  /* 区间经营指标（按所选日期区间汇总示例月度数据） */
  const rq = (typeof queryRange === 'function') ? queryRange() : { start: '', end: '' };
  const inRange = o.months.filter(mo => {
    if (!rq.start || !rq.end) return false;
    const y = +mo.m.slice(0, 4), mn = +mo.m.slice(5, 7);
    const ms = new Date(y, mn - 1, 1), me = new Date(y, mn, 0);
    const rs = new Date(rq.start), re = new Date(rq.end);
    return ms <= re && me >= rs;
  });
  const sumRev = inRange.reduce((s, x) => s + x.revenue, 0);
  const sumPft = inRange.reduce((s, x) => s + x.profit, 0);
  const sumOrd = inRange.reduce((s, x) => s + x.orders, 0);
  h += secTitle('区间经营指标', '按所选查询区间（' + (rq.start || '—') + ' ~ ' + (rq.end || '—') + '）汇总示例月度数据');
  if (inRange.length) {
    h += `<div class="grid g4">
      ${kpiCard({ label: '区间营收合计', value: Math.round(sumRev), unit: '元', status: 'live' })}
      ${kpiCard({ label: '区间毛利合计', value: Math.round(sumPft), unit: '元', status: 'live' })}
      ${kpiCard({ label: '区间订单数', value: sumOrd, unit: '单', status: 'live' })}
      ${kpiCard({ label: '覆盖月数', value: inRange.length, unit: '个', status: 'live' })}
    </div>`;
    h += `<div class="card"><div class="card-bd" style="padding:0;overflow:auto"><table class="tbl">
      <thead><tr><th>月份</th><th>订单数</th><th>营收(元)</th><th>毛利(元)</th><th>天数</th></tr></thead>
      <tbody>${inRange.map(mo => `<tr><td>${mo.m}</td><td>${num(mo.orders)}</td><td>${money(mo.revenue)}</td><td>${money(mo.profit)}</td><td>${mo.days}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="note" style="margin-top:8px">示例口径：以上为 2026-05~2026-08 的示例月度数据，仅用于演示「日期区间查询」能力；ABS/CRM 接通真实日级数据后，将按所选区间精确出数（含日级经营指标）。区间含 8 月 MTD（13 天）为部分月。</div></div>`;
  } else {
    h += `<div class="note">所选区间（${rq.start || '—'} ~ ${rq.end || '—'}）暂无示例月度数据。ABS/CRM 接通真实日级数据后，将按所选区间精确出数。</div>`;
  }

  /* 结构 */
  h += secTitle('业务结构与产能分布', D.meta.windowMain);
  h += `<div class="grid g23">
    ${card('业务类别营收构成', CH.donut(o.categories.filter(x => x.revenue > 0), {
      k: 'name', v: 'revenue', size: 208, center: CH.fmtK(totalRev), centerSub: '总营收(元)'
    }), '共 ' + o.categories.reduce((s, x) => s + x.orders, 0) + ' 单')}
    ${card('服务顾问产值排名', CH.hbars(o.advisors, {
      k: 'name', v: 'revenue', lw: 66, rh: 34,
      fmt: d => (d.revenue / 1e4).toFixed(1) + '万'
    }), '按实际营收 · 元')}
  </div>`;

  h += `<div style="height:14px"></div><div class="grid g23">
    ${card('车系产值贡献 TOP10', CH.hbars(o.series.filter(x => !x.isRest), {
      k: 'name', v: 'revenue', top: 10, lw: 92, rh: 30,
      fmt: d => (d.revenue / 1e4).toFixed(1) + '万'
    }), '按实际营收（已剔除"其余小众车系"汇总项）')}
    ${card('客户基盘与活跃度', `
      <div class="grid g2" style="gap:10px">
        <div class="kpi"><div class="kpi-lb">累计保有客户</div><div class="kpi-vl">${num(c.base.customers)}<u>人</u></div><div class="kpi-sb">${E(c.base.since)} 至今 · ${num(c.base.vins)} 台 VIN</div></div>
        <div class="kpi"><div class="kpi-lb">近90天活跃客户</div><div class="kpi-vl">${num(c.cur.customers)}<u>人</u></div><div class="kpi-sb">渗透率 ${pct(c.cur.customers, c.base.customers)}%</div>
          ${trendHtml((c.cur.customers - c.prev.customers) / c.prev.customers * 100, '对比上期90天')}</div>
      </div>
      <div style="height:12px"></div>
      ${CH.hbars(o.frequency, { k: 'bucket', v: 'customers', lw: 62, rh: 30, fmt: d => d.customers + '人 / ' + (d.revenue / 1e4).toFixed(1) + '万' })}
      <div class="note" style="margin-top:10px">近 90 天 <b>${pct(o.frequency[0].customers, c.cur.customers)}%</b> 的客户仅进厂 1 次 —— 二次到店转化是本季最大增长杠杆。</div>
    `, '双窗口去重口径')}
  </div>`;

  /* 板块完成度 */
  h += secTitle('六大板块数据接通进度', '共 ' + D.sections.reduce((s, x) => s + x.items.length, 0) + ' 个子模块');
  h += `<div class="grid g3">${D.sections.map(s => {
    const t = s.items.length;
    const cnt = k => s.items.filter(i => i.status === k).length;
    const live = cnt('live'), part = cnt('partial'), sk = cnt('skill_ready');
    const pend = t - live - part - sk;
    return `<div class="card"><div class="card-bd">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:11px">
        <span style="width:26px;height:26px;border-radius:8px;background:${s.color}18;color:${s.color};display:grid;place-items:center">
          <span style="width:15px;height:15px;display:block">${ICONS[s.icon]}</span></span>
        <b style="font-size:13.5px">${E(s.name)}</b>
        <span style="margin-left:auto;font-size:11.5px;color:var(--ink-3)">${live + part}/${t} 已出数</span>
      </div>
      <div class="pbar">
        ${live ? `<i class="live" style="width:${live / t * 100}%"></i>` : ''}
        ${part ? `<i class="partial" style="width:${part / t * 100}%"></i>` : ''}
        ${sk ? `<i class="skill_ready" style="width:${sk / t * 100}%"></i>` : ''}
        ${pend ? `<i class="pend" style="width:${pend / t * 100}%"></i>` : ''}
      </div>
      <div style="margin-top:11px;display:flex;flex-direction:column;gap:5px">
        ${s.items.map(i => `<div style="display:flex;align-items:center;gap:7px;font-size:12.3px;cursor:pointer" data-jump="${i.key}">
          <span class="dot ${i.status}" style="background:${i.status === 'live' ? 'var(--live)' : i.status === 'partial' ? 'var(--part)' : i.status === 'skill_ready' ? 'var(--skill)' : '#fbbf24'}"></span>
          <span style="flex:1;color:var(--ink-2)">${E(i.name)}</span>
          <span style="font-size:10.5px;color:var(--ink-3)">${STATUS_TXT[i.status]}</span>
        </div>`).join('')}
      </div>
    </div></div>`;
  }).join('')}</div>`;
  return h;
};

/* ==================== 数据接入状态 ==================== */
VIEWS.datasource = function () {
  const all = D.sections.flatMap(s => s.items);
  const n = k => all.filter(i => i.status === k).length;
  let h = secTitle('数据源健康度', 'ABS / CRM / 企微 / 台账');
  h += `<div class="grid g4">
    ${kpiCard({ label: '已出真数模块', value: n('live') + n('partial'), unit: '个', sub: `全真数 ${n('live')} + 部分真数 ${n('partial')}`, trend: null })}
    ${kpiCard({ label: '工作流已就绪', value: n('skill_ready'), unit: '个', sub: 'WorkBuddy 侧开发完成，等数据回流', trend: null })}
    ${kpiCard({ label: '待数据接入', value: n('pending_auth') + n('pending_crm') + n('pending_form'), unit: '个', sub: '视图授权 / CRM / 台账', trend: null })}
    ${kpiCard({ label: '子模块总数', value: all.length, unit: '个', sub: '6 大板块', trend: null })}
  </div>`;

  h += secTitle('数据源清单');
  h += card('接入明细', D.datasources.map(d => `
    <div class="ds-row">
      ${bdg(d.status)}
      <div class="ds-nm"><b>${E(d.name)}</b><span>${E(d.object)}</span></div>
      <div class="ds-meta">${E(d.rows)}${d.vin !== '—' ? ' · ' + E(d.vin) : ''}</div>
      <div class="ds-note">${E(d.note)}</div>
    </div>`).join(''));

  h += secTitle('打通优先级建议', '按「投入产出比」排序');
  h += `<div class="grid g2">
    ${card('第一优先：ABS 工单状态视图', `
      <p style="font-size:12.9px;color:var(--ink-2);line-height:1.75">一次授权同时点亮 <b>售后保险车辆维修进度</b> 与 <b>财务在修车风险管理</b> 两个模块，且该视图<b>不含客户 PII</b>，审批阻力最小。</p>
      <div style="height:10px"></div>
      <div class="field-chips">${['工单号','VIN','进厂日期','当前状态','完工时间','交车时间','定损金额','预估维修款','已收金额'].map(f => `<span class="fchip">${f}</span>`).join('')}</div>
      <div style="height:12px"></div><div class="note">建议话术：「只要工单状态和时间戳，不要客户姓名电话，用于车间进度看板与滞留车风险管控。」</div>
    `, '解锁 2 个模块')}
    ${card('第二优先：V_UC_NewCar 整车销售视图', `
      <p style="font-size:12.9px;color:var(--ink-2);line-height:1.75">点亮 <b>销售订单管理</b>、<b>留存订单进度管理</b>，并让 <b>客户总数管理</b> 的基盘从「有售后记录客户」扩展为「全量客户」。</p>
      <div style="height:10px"></div>
      <div class="field-chips">
        ${['订单号','开单日期','客户ID','车系','车型','成交价','销售顾问','线索来源'].map(f => `<span class="fchip">${f}</span>`).join('')}
        ${['订单状态','交车日期','定金金额','回款状态'].map(f => `<span class="fchip opt">${f}（建议补）</span>`).join('')}
      </div>
      <div style="height:12px"></div><div class="note warn">客户 PII 须由 ABS 侧先行脱敏，明文不得入只读视图。</div>
    `, '解锁 2~3 个模块')}
  </div>`;

  h += `<div style="height:14px"></div><div class="grid g2">
    ${card('第三优先：企微智能表格台账（零成本）', `
      <p style="font-size:12.9px;color:var(--ink-2);line-height:1.75">企业微信<b>已连通</b>，无需任何审批即可起步。用智能表格承接没有系统数据源的台账，工作台每日自动拉取汇总。</p>
      <ol class="steps" style="margin-top:12px">
        <li>展厅接待登记表 → 点亮「销售接待管理」</li>
        <li>战败原因登记表 → 点亮「销售战败管理」</li>
        <li>在修车进度看板 → 补齐「在修车风险管理」</li>
        <li>人员主台账 / 固定资产台账 / 招聘需求台账 → 点亮行政板块 3 个模块</li>
        <li>资金周报表（汇总口径）→ 点亮「店面资金管理」</li>
      </ol>
    `, '今日可启动')}
    ${card('第四优先：CRM / 微盛 SCRM 连接', `
      <p style="font-size:12.9px;color:var(--ink-2);line-height:1.75">连接器中心当前仅 <b>企业微信</b> 处于已连接状态。以下连接可显著提升营销与线索板块的自动化程度：</p>
      <div style="height:10px"></div>
      <div class="kv"><b>微盛企微管家</b><span>全员营销素材分发、转发追踪、绩效简报（weisheng-distributor 已开发）</span></div>
      <div class="kv"><b>销售易 CRM</b><span>线索、接待、战败、订单全链路（若店内已采购）</span></div>
      <div class="kv"><b>抖音开放平台</b><span>短视频数据回流与线索归因</span></div>
      <div style="height:12px"></div><div class="note">未连接期间，相关工作流以「人工录入 + 工作台聚合」方式先跑起来，不阻塞业务。</div>
    `, '提升自动化')}
  </div>`;

  h += secTitle('ABS 访问护栏', '所有查询强制遵守，违反即中止');
  h += card('查询安全约束', `<div class="grid g3" style="gap:10px">
    ${[['只读','仅 SELECT，绝不执行任何写操作'],
       ['日期范围','必须带收银日期 BETWEEN，单程跨度 ≤ 92 天'],
       ['NOLOCK','所有表/视图加 WITH (NOLOCK)，避免锁表影响营业'],
       ['限行','默认 TOP 5000 或分页，单次不超 5000 行'],
       ['超时','单次查询 30s 超时，超时中断并缩小跨度重试'],
       ['时段','全量回测/月报避开 08:30–18:30，排 07:00 前或 21:00 后']]
      .map(([a, b]) => `<div class="watch-item"><b>${a}</b><span>${b}</span></div>`).join('')}
  </div>`);
  return h;
};

/* ==================== 待接入模块通用视图 ==================== */
VIEWS.pending = function (m, key) {
  let h = `<div class="pend-hero">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
      <b style="font-size:16px">${E(m.title)}</b>${bdg(m.status)}
    </div>
    <p>${E(m.desc)}</p>
    ${m.partialNote ? `<div class="note" style="margin-top:12px"><b>当前状态：</b>${E(m.partialNote)}</div>` : ''}
  </div>`;

  if (m.ready) {
    h += secTitle('WorkBuddy 侧已就绪的能力', '开发完成，等数据回流即可全流程运行');
    h += card('已具备的工作流与技能', `
      <div>${m.ready.skills.map(s => `<span class="skill-tag">${E(s)}</span>`).join('')}</div>
      <div class="note" style="margin-top:12px">${E(m.ready.note)}</div>
      ${m.rules ? `<div style="height:14px"></div><div style="font-size:12.5px;font-weight:700;margin-bottom:8px">强制执行规范</div>
        ${m.rules.map(r => `<div class="watch-item" style="margin-bottom:7px"><b>◆</b><span>${E(r)}</span></div>`).join('')}` : ''}
    `, m.workflow ? E(m.workflow) : '');
  }

  if (m.watch) {
    h += secTitle('本模块要盯的指标', '接通后自动出数');
    h += `<div class="watch-list">${m.watch.map((w, i) => `
      <div class="watch-item"><b>${String(i + 1).padStart(2, '0')}</b><span>${E(w)}</span></div>`).join('')}</div>`;
  }

  if (m.requires) {
    h += secTitle('接入所需数据');
    h += `<div class="grid g2">
      ${card('数据来源', `<div class="kv"><b>系统/来源</b><span>${E(m.requires.source)}</span></div>
        ${m.workflow ? `<div class="kv"><b>关联工作流</b><span>${E(m.workflow)}</span></div>` : ''}
        <div class="kv"><b>模块编码</b><span style="font-family:var(--mono)">${E(key)}</span></div>`)}
      ${card('必需字段', `<div class="field-chips">${m.requires.fields.map(f =>
        `<span class="fchip${/建议补|待/.test(f) ? ' opt' : ''}">${E(f)}</span>`).join('')}</div>`)}
    </div>`;
  }

  if (m.actions) {
    h += secTitle('打通步骤', '按顺序执行即可点亮本模块');
    h += card('落地路径', `<ol class="steps">${m.actions.map(a => `<li>${E(a)}</li>`).join('')}</ol>`);
  }

  if (m.workflow) {
    const fl = matchFlows(m.workflow);
    const wf = extractWf(m.workflow);
    h += secTitle('运行本模块工作流', '点一下即在 WorkBuddy 自动化中心发起对应自动流');
    h += `<div class="flow-mod">
      <div class="flow-mod-tx">${E(m.workflow)}</div>
      <div class="flow-mod-acts">${fl.length
        ? fl.map(f => `<button class="btn primary sm" data-run-flow="${E(f.wf)}" data-flow-name="${E(f.name)}">运行 · ${E(f.name)}</button>`).join('')
        : `<button class="btn primary sm" data-run-flow="${E(wf || '')}" data-flow-name="${E(m.workflow)}">运行 · ${E(wf || m.workflow)}</button>`}
        <span class="muted" style="align-self:center">运行记录见「自动流项目」</span>
      </div>
    </div>`;
  }
  return h;
};

VIEWS.footer = function () {
  return `<div class="footer">
    <b>${E(D.meta.store)}</b> · 全店运营管理工作台　|　数据源：${E(D.meta.absServer)}　|　主视图：${E(D.meta.absView)}<br>
    真数窗口：${E(D.meta.windowMain)}（趋势 ${E(D.meta.windowTrend)}）　|　快照生成：${E(D.meta.generatedAt)}<br>
    ${E(D.meta.note)} 未接通模块一律不填充模拟数值，仅展示接入路径。
  </div>`;
};
