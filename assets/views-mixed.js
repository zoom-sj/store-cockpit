/* 部分真数视图：保险车辆维修进度 / 人均效能 / 在修车风险 */

/* ---------- 保险车辆维修进度管理 ---------- */
VIEWS.serviceInsurance = function (m) {
  const o = D.overview;
  const acc = o.categories.find(x => x.name === '事故维修');
  const rev = o.categories.reduce((s, x) => s + x.revenue, 0);
  const days = 44; // 7/1 ~ 8/13
  const ss = D.serviceStatus || { status: 'pending' };
  const live = ss.status === 'live';
  const ins = ss.insurance || {};
  let h = moduleHero(m);

  if (!live) {
    h += `<div class="alert mid"><div class="alert-ic">·</div><div class="alert-bd"><div class="alert-tx">
      <b>最快见效路径：</b>当前仅 ABS 结算真数（事故维修<b>结果</b>）。ABS 管理员执行
      <code style="font-family:var(--mono)">scripts/DDL_V_R_Service_Status.sql</code> 建视图（仅工单号 / VIN / 状态 / 时间 / 金额，<b>不含 PII</b>）→ 我拉数 → 本模块与「在修车风险管理」同时转 <b>live</b>。
    </div><div class="alert-mt"><a data-jump="datasource">查看接入路线 →</a></div></div></div>`;

    h += secTitle('事故车业务实况', D.meta.windowMain + ' · ABS 真数');
    h += `<div class="grid g4">
      ${kpiCard({ label: '事故维修工单', value: acc.orders, unit: '单', sub: '105 台次 · 日均 ' + (acc.orders / days).toFixed(1) + ' 单', trend: null })}
      ${kpiCard({ label: '事故维修营收', value: acc.revenue, unit: '元', sub: '占全店售后 ' + pct(acc.revenue, rev) + '%', trend: null })}
      ${kpiCard({ label: '事故车单车产值', value: Math.round(acc.revenue / 105), unit: '元/台', sub: '全店平均单车 ' + money(rev / o.series.reduce((s, x) => s + x.vins, 0)) + ' 元', trend: null })}
      ${kpiCard({ label: '事故维修毛利率', value: pct(acc.profit, acc.revenue), unit: '%', sub: '毛利 ' + wan(acc.profit) + '万 · 低于定保 62.2%', trend: null })}
    </div>`;

    h += secTitle('待补齐的进度管理能力', '当前只能看「已结算」，看不到「在修中」');
    h += `<div class="grid g2">
      ${card('已具备（ABS 真数）', `
        <div class="kv"><b>事故车产值</b><span>${money(acc.revenue)} 元（${acc.orders} 单 / 105 台次）</span></div>
        <div class="kv"><b>事故车毛利</b><span>${money(acc.profit)} 元，毛利率 ${pct(acc.profit, acc.revenue)}%</span></div>
        <div class="kv"><b>营收占比</b><span>${pct(acc.revenue, rev)}% —— 全店第一大业务类别</div>
        <div class="kv"><b>来源标记</b><span>业务子类全部记为「主动到店」，推修渠道未细分</span></div>
        <div class="note" style="margin-top:12px">事故维修是全店营收第一支柱（${pct(acc.revenue, rev)}%），但目前<b>只有结果没有过程</b> —— 无法回答「现在车间里有几台事故车、卡在哪、押了多少钱」。</div>`,
        '已可用')}
      ${card('缺失（需补数据源）', `
        <div class="field-chips">${m.requires.fields.map(f => `<span class="fchip opt">${E(f)}</span>`).join('')}</div>
        <div style="height:12px"></div>
        <div class="watch-item"><b>影响</b><span>缺「当前节点 + 时间戳」→ 无法算停留天数，无法做滞留预警</span></div>
        <div style="height:7px"></div>
        <div class="watch-item"><b>影响</b><span>缺「定损金额 + 理赔回款日期」→ 无法算保险应收账龄</span></div>
        <div style="height:7px"></div>
        <div class="watch-item"><b>影响</b><span>缺「配件到货时间」→ 无法定位等件滞留车辆</span></div>
        <div style="height:12px"></div>
        <div class="note warn">该视图<b>不含客户 PII</b>（只要工单号/VIN/状态/时间/金额），是六大板块中最容易批下来的一个申请。</div>`,
        '待接入')}
    </div>`;

    h += secTitle('接通后的进度看板设计', '预置指标与预警规则');
    h += `<div class="grid g4">
      ${['进厂待定损', '定损中', '待核价通过', '等配件', '维修中', '待完工检验', '待交车', '待理赔回款']
        .map((s, i) => `<div class="kpi na"><div class="kpi-lb">${s}</div><div class="kpi-vl na">待接入</div><div class="kpi-sb">台数 / 平均停留天数</div></div>`).join('')}
    </div>`;
    h += `<div style="height:14px"></div>`;
    h += card('预警规则（接通即生效）', `<div class="grid g3" style="gap:10px">
      ${[['15天黄牌', '在修停留超 15 天 → 提醒服务经理，要求给出卡点原因'],
         ['30天橙牌', '在修停留超 30 天 → 上报总经理，进入专项跟踪清单'],
         ['60天红牌', '在修停留超 60 天 → 启动法务与书面通知流程，留存证据'],
         ['定损滞留', '进厂超 3 天未完成定损 → 提醒事故车专员催保险公司'],
         ['等件滞留', '配件订单超 7 天未到货 → 提醒配件主管并向客户主动说明'],
         ['理赔账龄', '交车后 30/60/90 天未回款 → 分级催收，超 90 天上报财务经理']]
        .map(([a, b]) => `<div class="watch-item"><b>${a}</b><span>${b}</span></div>`).join('')}
    </div>
    <div class="note" style="margin-top:12px">预警统一经 <b>hdhr-wecom-hub</b> 推送到企业微信对应岗位，无需额外系统。</div>`);

    h += secTitle('要盯的指标');
    h += `<div class="watch-list">${m.watch.map((w, i) => `
      <div class="watch-item"><b>${String(i + 1).padStart(2, '0')}</b><span>${E(w)}</span></div>`).join('')}</div>`;

    h += secTitle('打通步骤');
    h += card('落地路径', `<ol class="steps">${m.actions.map(a => `<li>${E(a)}</li>`).join('')}</ol>
      <div class="note" style="margin-top:12px"><b>联动提示：</b>本模块与「财务板块 → 在修车风险管理」共用同一份工单状态视图，一次授权点亮两个模块。</div>`);
    return h;
  }

  /* ---------- live 分支 ---------- */
  h += secTitle('保险车辆维修进度（ABS 真数）', 'dbo.V_R_Service_Status · 截至 ' + (ss.asOf || D.meta.dataDate));
  h += `<div class="grid g4">
    ${kpiCard({ label: '保险在修台数', value: ins.openTotal, unit: '台', sub: '当前车间在修保险车', trend: null })}
    ${kpiCard({ label: '预估维修款', value: ins.estRepair, unit: '元', sub: '在修未结敞口', trend: null })}
    ${kpiCard({ label: '已收金额', value: ins.received, unit: '元', sub: '定损 ' + money(ins.assessAmt) + ' 元', trend: null })}
    ${kpiCard({ label: '未结金额', value: ins.unpaid, unit: '元', sub: '押款风险', trend: null, status: ins.unpaid > 0 ? 'partial' : null })}
  </div>`;

  h += secTitle('进度结构', '节点分布 + 理赔回款账龄');
  h += `<div class="grid g23">
    ${card('保险在修节点分布', CH.hbars((ins.byNode || []).map(x => ({ name: x.node, v: x.cnt })), {
      k: 'name', v: 'v', lw: 96, rh: 30, fmt: d => d.v + ' 台' }), '按当前节点')}
    ${card('理赔回款账龄', CH.hbars((ins.claimAging || []).map(x => ({ name: x.bucket, v: x.cnt })), {
      k: 'name', v: 'v', lw: 96, rh: 30,
      colorBy: d => (d.name || '').indexOf('90') >= 0 ? '#d92c2c' : '#1e5eff',
      fmt: d => d.v + ' 单' }), '交车后未回款')}
  </div>`;

  const stuck = (ss.inRepair && ss.inRepair.topStuck) || [];
  h += secTitle('超期滞留预警清单', stuck.length ? (stuck.length + ' 台超期，按停留天数降序') : '当前无超期滞留');
  h += card('滞留车辆明细', stuck.length ? `<table class="tb"><thead><tr>
      <th>工单号</th><th>VIN</th><th>当前节点</th><th class="r">停留(天)</th><th class="r">预估维修款</th><th class="r">未结</th><th>滞留原因</th>
    </tr></thead><tbody>${stuck.map(r => `<tr>
      <td class="nm">${E(r.order_no)}</td><td>${E(r.vin)}</td><td>${E(r.node)}</td>
      <td class="r ${r.stayDays >= 30 ? 'neg' : r.stayDays >= 15 ? 'pos' : ''}">${r.stayDays}</td>
      <td class="r">${money(r.estRepair)}</td><td class="r">${money(r.unpaid)}</td>
      <td>${E(r.reason || '—')}</td></tr>`).join('')}</tbody></table>`
    : `<div class="note">暂无超期滞留车辆，状态健康。</div>`, '红/橙为超 30/15 天');

  h += secTitle('预警规则（已生效）', '经 hdhr-wecom-hub 推送');
  h += `<div class="grid g3" style="gap:10px">
    ${[['15天黄牌', '在修停留超 15 天 → 提醒服务经理说明卡点原因'],
       ['30天橙牌', '在修停留超 30 天 → 上报总经理，进专项清单'],
       ['60天红牌', '在修停留超 60 天 → 启动法务与书面通知流程'],
       ['定损滞留', '进厂超 3 天未定损 → 催保险公司'],
       ['等件滞留', '配件超 7 天未到货 → 提醒配件主管并主动向客户说明'],
       ['理赔账龄', '交车后 30/60/90 天未回款 → 分级催收，超 90 天报财务经理']]
      .map(([a, b]) => `<div class="watch-item"><b>${a}</b><span>${b}</span></div>`).join('')}
  </div>`;

  h += secTitle('要盯的指标');
  h += `<div class="watch-list">${m.watch.map((w, i) => `
    <div class="watch-item"><b>${String(i + 1).padStart(2, '0')}</b><span>${E(w)}</span></div>`).join('')}</div>`;

  h += secTitle('数据接入');
  h += card('来源', `<div class="kv"><b>系统/来源</b><span>${E(m.requires.source)}</span></div>
    <div class="kv"><b>关联工作流</b><span>${E(m.workflow)}</span></div>
    <div class="kv"><b>数据截至</b><span>${E(ss.asOf || D.meta.dataDate)}</span></div>
    <div class="note" style="margin-top:12px">本模块与「在修车风险管理」共用同一份工单状态视图，一次授权点亮两个模块。</div>`);
  return h;
};

/* ---------- 人均效能管理 ---------- */
VIEWS.admEfficiency = function (m) {
  const o = D.overview;
  const tot = o.advisors.reduce((a, x) => ({ o: a.o + x.orders, v: a.v + x.vins, r: a.r + x.revenue, p: a.p + x.profit }), { o: 0, v: 0, r: 0, p: 0 });
  const n = o.advisors.length, days = 44;
  let h = moduleHero(m);

  h += secTitle('售后顾问人效（ABS 真数）', D.meta.windowMain + ' · ' + n + ' 名结算顾问');
  h += `<div class="grid g4">
    ${kpiCard({ label: '人均营收', value: Math.round(tot.r / n), unit: '元', sub: n + ' 人 / ' + days + ' 天 · 日均 ' + money(tot.r / n / days) + ' 元', trend: null })}
    ${kpiCard({ label: '人均毛利', value: Math.round(tot.p / n), unit: '元', sub: '毛利率 ' + pct(tot.p, tot.r) + '%', trend: null })}
    ${kpiCard({ label: '人均工单', value: Math.round(tot.o / n), unit: '单', sub: '日均 ' + (tot.o / n / days).toFixed(1) + ' 单/人', trend: null })}
    ${kpiCard({ label: '人均台次', value: Math.round(tot.v / n), unit: '台', sub: '日均 ' + (tot.v / n / days).toFixed(1) + ' 台/人', trend: null })}
  </div>`;

  h += secTitle('顾问人效差异', '识别「量型」与「值型」两类产能结构');
  h += `<div class="grid g23">
    ${card('人均营收 vs 单车产值', CH.bars(o.advisors, { x: 'name', id: 'ae1', h: 250, series: [
      { key: 'revenue', name: '营收(元)', color: '#1e5eff' }] }) +
      CH.hbars(o.advisors.map(a => ({ name: a.name, upv: Math.round(a.revenue / a.vins) })), {
        k: 'name', v: 'upv', lw: 66, rh: 30,
        colorBy: d => d.upv > 4000 ? '#00a870' : '#ff6a00',
        fmt: d => money(d.upv) + ' 元/台'
      }), '上：总营收　下：单车产值')}
    ${card('人效明细', `<table class="tb"><thead><tr>
      <th>顾问</th><th class="r">工单</th><th class="r">台次</th><th class="r">营收(元)</th><th class="r">毛利(元)</th><th class="r">单车产值</th><th>产能类型</th>
      </tr></thead><tbody>${o.advisors.map(a => {
        const upv = a.revenue / a.vins, type = upv > 4000 ? '值型（事故车）' : '量型（定保/一般）';
        return `<tr><td class="nm">${E(a.name)}</td>
          <td class="r">${num(a.orders)}</td><td class="r">${num(a.vins)}</td>
          <td class="r">${money(a.revenue)}</td><td class="r">${money(a.profit)}</td>
          <td class="r ${upv > 4000 ? 'pos' : ''}">${money(upv)}</td>
          <td><span class="bdg ${upv > 4000 ? 'partial' : 'skill_ready'}">${type}</span></td></tr>`;
      }).join('')}</tbody><tfoot><tr><td>平均</td>
        <td class="r">${Math.round(tot.o / n)}</td><td class="r">${Math.round(tot.v / n)}</td>
        <td class="r">${money(tot.r / n)}</td><td class="r">${money(tot.p / n)}</td>
        <td class="r">${money(tot.r / tot.v)}</td><td>—</td></tr></tfoot></table>
      <div class="note warn" style="margin-top:12px"><b>考核建议：</b>量型与值型不可用同一套指标。量型（吴文诗/颜珍香/马振宇）考<b>台次 + 客户满意度 + 定保渗透</b>；值型（王玉成/赖辉婵）考<b>事故车产值 + 理赔回款周期 + 推修渠道维护</b>。当前若只看营收排名，量型顾问会显得"产能低"，实际是分工不同。</div>`)}
  </div>`;

  h += secTitle('待补齐的人效维度');
  h += `<div class="grid g4">
    ${[['全店在职人数', '企微通讯录已连通，今日即可自动拉取'],
       ['技师人均工时', '需 ABS 工时数据，与工单状态视图一并申请'],
       ['销售顾问人均销量', '需 V_UC_NewCar 授权'],
       ['人均薪酬成本', '需财务台账，建议仅店长可见']]
      .map(([a, b]) => `<div class="kpi na"><div class="kpi-lb">${a}</div><div class="kpi-vl na">待接入</div><div class="kpi-sb">${b}</div></div>`).join('')}
  </div>`;
  h += `<div style="height:14px"></div>`;
  h += card('打通步骤', `<ol class="steps">${m.actions.map(a => `<li>${E(a)}</li>`).join('')}</ol>
    <div class="note" style="margin-top:12px"><b>最快见效：</b>只要补「各部门在职人数」一个字段，售后人均产值就从"5 名结算顾问口径"升级为"全售后部门真实人效"，可直接对标行业水位。</div>`);
  return h;
};

/* ---------- 在修车风险管理 ---------- */
VIEWS.finRisk = function (m) {
  const o = D.overview;
  const acc = o.categories.find(x => x.name === '事故维修');
  const other = o.categories.find(x => x.name === '其他');
  const ss = D.serviceStatus || { status: 'pending' };
  const live = ss.status === 'live';
  const ir = ss.inRepair || {};
  let h = moduleHero(m);

  if (!live) {
    h += `<div class="alert mid"><div class="alert-ic">·</div><div class="alert-bd"><div class="alert-tx">
      <b>最快见效路径：</b>ABS 管理员执行
      <code style="font-family:var(--mono)">scripts/DDL_V_R_Service_Status.sql</code> 建视图（不含 PII）→ 我拉数 → 本模块与「保险维修进度」同时转 <b>live</b>，自动算出在修台数、停留天数与未结金额。
    </div><div class="alert-mt"><a data-jump="datasource">查看接入路线 →</a></div></div></div>`;

    h += secTitle('可测算的风险敞口', '基于 ABS 真数的间接推断');
    h += `<div class="grid g4">
      ${kpiCard({ label: '事故车业务量', value: acc.orders, unit: '单', sub: D.meta.windowMain + ' · 滞留主要来源', trend: null })}
      ${kpiCard({ label: '事故车营收规模', value: acc.revenue, unit: '元', sub: '单台 ' + money(acc.revenue / 105) + ' 元，押款风险高', trend: null })}
      ${kpiCard({ label: '零营收异常工单', value: other.orders, unit: '单', sub: '「其他」类营收 0 / 毛利 -120 元', trend: null })}
      ${kpiCard({ label: '在修车台数', value: null, unit: '台', sub: '需工单状态视图', trend: null, status: 'partial' })}
    </div>`;

    h += secTitle('风险来源分析');
    h += `<div class="grid g2">
      ${card('为什么事故车是主要风险源', `
        <p style="font-size:12.9px;color:var(--ink-2);line-height:1.75">事故维修占全店售后营收 <b>${pct(acc.revenue, o.categories.reduce((s, x) => s + x.revenue, 0))}%</b>，单台产值 <b>${money(acc.revenue / 105)}</b> 元（是定保单单 793 元的 7.6 倍）。事故车的资金与法律风险集中在四点：</p>
        <div style="height:11px"></div>
        <div class="watch-item"><b>定损差</b><span>保险公司核定金额低于实际维修成本，差额需客户补或店内承担</span></div>
        <div style="height:7px"></div>
        <div class="watch-item"><b>回款慢</b><span>理赔款账期通常 30~90 天，期间配件与外包成本已垫付</span></div>
        <div style="height:7px"></div>
        <div class="watch-item"><b>客户失联</b><span>修好不来提车，车辆占场地、店内承担保管责任</span></div>
        <div style="height:7px"></div>
        <div class="watch-item"><b>等件滞留</b><span>事故件（钣金件/灯具）到货周期长，车辆长期占用工位</span></div>`)}
      ${card('异常工单信号（已发现）', `
        <div class="alert mid" style="margin:0"><div class="alert-ic">·</div><div class="alert-bd"><div class="alert-tx">
          「其他」类 <b>${other.orders} 单</b>，营收 0 元、毛利 <b>-120 元</b>。这类工单在正常经营中不应存在，可能是：
        </div></div></div>
        <div style="height:11px"></div>
        <div class="watch-item"><b>可能1</b><span>已开单未结算的挂账工单（对应在修车或待收款）</span></div>
        <div style="height:7px"></div>
        <div class="watch-item"><b>可能2</b><span>内部车/试驾车/展车维修，未计收入</span></div>
        <div style="height:7px"></div>
        <div class="watch-item"><b>可能3</b><span>返修/免费索赔单，成本已发生但无收入</span></div>
        <div style="height:12px"></div>
        <div class="note warn"><b>建议动作：</b>让服务经理导出这 ${other.orders} 单明细逐单核销。若其中包含未结算挂账，即为真实的应收风险敞口；若为返修，则需并入客诉与质量分析（WF-06）。</div>`)}
    </div>`;

    h += secTitle('接通后的风险看板', '三级预警规则');
    h += `<div class="grid g3">
      ${[['黄牌 · 15 天', '#e8890c', '在修停留超 15 天。动作：服务经理说明卡点原因，录入滞留原因分类。'],
         ['橙牌 · 30 天', '#ff6a00', '在修停留超 30 天。动作：上报总经理，进专项清单，评估是否垫付催修或退车。'],
         ['红牌 · 60 天', '#d92c2c', '在修停留超 60 天。动作：启动法务流程，书面通知客户并留证，核算场地占用成本。']]
        .map(([t, c, d]) => `<div class="card"><div class="card-bd">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
            <span style="width:10px;height:10px;border-radius:3px;background:${c}"></span>
            <b style="font-size:13.5px">${t}</b></div>
          <p style="font-size:12.6px;color:var(--ink-2);line-height:1.7">${d}</p>
          <div style="height:10px"></div>
          <div class="kpi na" style="padding:11px 12px"><div class="kpi-lb">当前台数</div><div class="kpi-vl na">待接入</div></div>
        </div></div>`).join('')}
    </div>`;

    h += secTitle('要盯的指标');
    h += `<div class="watch-list">${m.watch.map((w, i) => `
      <div class="watch-item"><b>${String(i + 1).padStart(2, '0')}</b><span>${E(w)}</span></div>`).join('')}</div>`;

    h += secTitle('接入所需数据');
    h += `<div class="grid g2">
      ${card('数据来源', `<div class="kv"><b>系统/来源</b><span>${E(m.requires.source)}</span></div>
        <div class="kv"><b>关联工作流</b><span>${E(m.workflow)}</span></div>
        <div class="kv"><b>模块编码</b><span style="font-family:var(--mono)">fin.risk</span></div>`)}
      ${card('必需字段', `<div class="field-chips">${m.requires.fields.map(f => `<span class="fchip">${E(f)}</span>`).join('')}</div>`)}
    </div>`;
    h += `<div style="height:14px"></div>`;
    h += card('打通步骤', `<ol class="steps">${m.actions.map(a => `<li>${E(a)}</li>`).join('')}</ol>`);
    return h;
  }

  /* ---------- live 分支 ---------- */
  h += secTitle('在修车风险敞口（ABS 真数）', 'dbo.V_R_Service_Status · 截至 ' + (ss.asOf || D.meta.dataDate));
  const stayTotal = (ir.byNode || []).reduce((s, x) => s + (x.cnt * (x.avgStayDays || 0)), 0);
  const od = ir.overdue || {};
  h += `<div class="grid g4">
    ${kpiCard({ label: '在修车总台数', value: ir.total, unit: '台', sub: '当前车间在修', trend: null })}
    ${kpiCard({ label: '累计停留天数', value: Math.round(stayTotal), unit: '天', sub: '占用工位总时长', trend: null })}
    ${kpiCard({ label: '未结算金额', value: (ss.insurance ? ss.insurance.unpaid : null), unit: '元', sub: '押款风险', trend: null, status: (ss.insurance && ss.insurance.unpaid > 0) ? 'partial' : null })}
    ${kpiCard({ label: '超 30 天台数', value: od.d30, unit: '台', sub: '橙牌 + 红牌', trend: null, status: (od.d30 > 0) ? 'partial' : null })}
  </div>`;

  h += secTitle('在修节点分布', '各环节台数与平均停留天数（红=超30天 / 橙=超15天）');
  h += card('节点分布', CH.hbars((ir.byNode || []).map(x => ({ name: x.node, v: x.cnt, stay: x.avgStayDays })), {
    k: 'name', v: 'v', lw: 96, rh: 30,
    colorBy: d => (d.stay || 0) >= 30 ? '#d92c2c' : (d.stay || 0) >= 15 ? '#ff6a00' : '#1e5eff',
    fmt: d => d.v + ' 台 · 均 ' + (d.stay || 0).toFixed(1) + ' 天' }), '按当前节点');

  const stuck = ir.topStuck || [];
  h += secTitle('超期滞留预警清单', stuck.length ? (stuck.length + ' 台超期，按停留天数降序') : '当前无超期滞留');
  h += card('滞留车辆明细', stuck.length ? `<table class="tb"><thead><tr>
      <th>工单号</th><th>VIN</th><th>当前节点</th><th class="r">停留(天)</th><th class="r">预估维修款</th><th class="r">未结</th><th>滞留原因</th><th>预警</th>
    </tr></thead><tbody>${stuck.map(r => {
      const lvl = r.stayDays >= 60 ? ['红牌', 'neg'] : r.stayDays >= 30 ? ['橙牌', 'pos'] : r.stayDays >= 15 ? ['黄牌', ''] : ['—', ''];
      return `<tr>
        <td class="nm">${E(r.order_no)}</td><td>${E(r.vin)}</td><td>${E(r.node)}</td>
        <td class="r ${lvl[1]}">${r.stayDays}</td>
        <td class="r">${money(r.estRepair)}</td><td class="r">${money(r.unpaid)}</td>
        <td>${E(r.reason || '—')}</td>
        <td><span class="bdg ${lvl[1] || 'skill_ready'}">${lvl[0]}</span></td></tr>`;
    }).join('')}</tbody></table>`
    : `<div class="note">暂无超期滞留车辆，状态健康。</div>`, '按三级预警着色');

  h += secTitle('三级预警规则（已生效）', '经 hdhr-wecom-hub 推送对应岗位');
  h += `<div class="grid g3">
    ${[['黄牌 · 15 天', '#e8890c', '在修停留超 15 天 → 服务经理说明卡点原因，录入滞留原因分类'],
       ['橙牌 · 30 天', '#ff6a00', '在修停留超 30 天 → 上报总经理，进专项清单，评估垫付催修或退车'],
       ['红牌 · 60 天', '#d92c2c', '在修停留超 60 天 → 启动法务流程，书面通知客户并留证，核算场地占用成本']]
      .map(([t, c, d]) => `<div class="card"><div class="card-bd">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
          <span style="width:10px;height:10px;border-radius:3px;background:${c}"></span>
          <b style="font-size:13.5px">${t}</b></div>
        <p style="font-size:12.6px;color:var(--ink-2);line-height:1.7">${d}</p></div></div>`).join('')}
  </div>`;

  h += secTitle('要盯的指标');
  h += `<div class="watch-list">${m.watch.map((w, i) => `
    <div class="watch-item"><b>${String(i + 1).padStart(2, '0')}</b><span>${E(w)}</span></div>`).join('')}</div>`;

  h += secTitle('接入说明');
  h += card('来源与回滚', `<div class="kv"><b>系统/来源</b><span>${E(m.requires.source)}</span></div>
    <div class="kv"><b>关联工作流</b><span>${E(m.workflow)}</span></div>
    <div class="kv"><b>数据截至</b><span>${E(ss.asOf || D.meta.dataDate)}</span></div>
    <div class="note" style="margin-top:12px">与「保险维修进度」共用同一份工单状态视图，一次授权点亮两个模块；如需回滚，ABS 侧 DROP VIEW 即可。</div>`);
  return h;
};

/* ---------- 全店人员信息管理（企业微信通讯录真实架构） ---------- */
VIEWS.adminStaff = function (m) {
  const org = loadOrg();
  const w = org.wecom || {};
  const linked = !!w.linked;
  const imported = !!org.imported;
  const members = org.members || [];
  const deptMap = {};
  (org.departments || []).forEach(d => { deptMap[d.id] = d.name; });
  const deptCount = {};
  members.forEach(mb => { const dk = mb.dept || mb.deptId; deptCount[dk] = (deptCount[dk] || 0) + 1; });
  const st = effStatus(m.status, m.key);
  const note = (t, c) => '<div class="note ' + (c || '') + '">' + E(t) + '</div>';
  const srcLabel = imported ? '员工花名册（导入）' : (linked ? '企业微信' : '—');
  const real = (imported || linked) && members.length;
  let h = '';
  h += `<div class="gm-hero" style="background:linear-gradient(120deg,#0b2545,#134e4a 60%,#0e7490)">
    <div class="gm-hero-ic" style="color:#5eead4;background:rgba(94,234,212,.14)">${ICONS.users}</div>
    <div>
      <div class="gm-hero-t">${E(m.title)} ${bdg(st)}</div>
      <div class="gm-hero-s">${E(m.desc)}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span class="chip ${real ? 'ok' : ''}">数据来源：${E(srcLabel)}</span>
        <span class="chip ${real ? 'ok' : ''}">${real ? '已导入真实架构（' + members.length + ' 人）' : '待导入'}</span>
        ${imported && !linked ? '<span class="chip">企业微信待接通</span>' : (linked ? '' : '<span class="chip warn">待授权通讯录</span>')}
      </div>
    </div></div>`;
  if (!real) {
    h += note('尚未导入组织架构：请在「组织架构与闭环」页导入真实花名册（企业微信后台导出通讯录 CSV → scripts/import_org_csv.py，或直接导入 xlsx 花名册），即可自动填充真实部门与人员到本模块。', 'warn');
    return h;
  }
  h += secTitle('人员总览', '部门与人员来自' + srcLabel + (imported ? '（Desktop/奇瑞店员工花名册.xlsx）' : '（' + w.corp + ' / ' + w.dept + '）'));
  h += `<div class="kpi-row" style="margin-bottom:14px">
    ${kpiCard({ label: '在职总人数', value: members.length, unit: '人', status: st })}
    ${kpiCard({ label: '部门数', value: org.departments.length, unit: '个', status: st })}
    <div class="kpi"><div class="kpi-lb">数据来源</div><div class="kpi-vl">${E(imported ? '花名册' : '企业微信')}</div><div class="kpi-sb">真实数</div></div>
  </div>`;
  h += secTitle('部门人员分布', '按部门统计在职人数（负责人为岗位角色，具体人名待补职位列后映射）');
  h += `<div class="card"><div class="card-bd" style="padding:0;overflow:auto"><table class="tbl">
    <thead><tr><th>部门</th><th>负责人</th><th>在职人数</th></tr></thead>
    <tbody>${(org.departments || []).map(d => `<tr><td>${E(d.name)}</td><td>${E(d.lead || '待定')}</td><td>${deptCount[d.id] || 0} 人</td></tr>`).join('')}</tbody>
  </table></div></div>`;
  h += secTitle('全店人员清单', '姓名/部门/子组/入职日期来自导入花名册；职位/手机号为可选字段，补录后展示（PII 脱敏）');
  h += `<div class="card"><div class="card-bd" style="padding:0;overflow:auto"><table class="tbl">
    <thead><tr><th>部门</th><th>姓名</th><th>子组</th><th>职位</th><th>入职日期</th><th>手机号</th></tr></thead>
    <tbody>${members.map(mb => { const dk = mb.dept || mb.deptId; return `<tr>
      <td>${E(deptMap[dk] || dk)}</td>
      <td>${E(mb.name)}</td>
      <td>${E(mb.sub || '—')}</td>
      <td>${E(mb.title || '—')}</td>
      <td>${E(mb.hire || '—')}</td>
      <td>${E(maskPhone(mb.phone))}</td>
    </tr>`; }).join('')}</tbody>
  </table></div></div>`;
  h += note(imported
    ? '当前为导入的员工花名册真实部门与人员（' + members.length + ' 人 / ' + org.departments.length + ' 部门）。花名册仅含「部门 / 子组 / 姓名 / 入职日期」，无职位与手机号，故负责人暂以岗位角色表示；补充含「职位 / 手机号」的花名册后可自动映射到具体人员并启用企微按人提醒。合同 / 证照 / 社保等敏感字段待人事台账补录（经 PII 脱敏）后点亮下游模块。'
    : '当前为企业微信通讯录真实部门与人员（部分真数）。合同起止、身份证到期、岗位证照、社保等敏感字段需经 hdhr-pii-guard 脱敏后，由人事台账补录，方可点亮「人均效能 / 资产管理 / 招聘需求」等下游模块。');
  return h;
};

/* 仓库配件管理：关联 ABS 配件库存数据；展示配件类型 / 日期 / D类库存预警等关键信息 */
VIEWS.partsManagement = function (m) {
  const st = effStatus(m.status, m.key);
  const note = (t, c) => '<div class="note ' + (c || '') + '">' + E(t) + '</div>';
  let h = '';
  h += `<div class="gm-hero" style="background:linear-gradient(120deg,#0b2545,#0e7490 60%,#155e75)">
    <div class="gm-hero-ic" style="color:#7dd3fc;background:rgba(125,211,252,.14)">${ICONS.wrench}</div>
    <div>
      <div class="gm-hero-t">${E(m.title)} ${bdg(st)}</div>
      <div class="gm-hero-s">${E(m.desc)}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span class="chip warn">待接通 ABS 配件数据</span>
        <span class="chip">关联：备件库存视图</span>
      </div>
    </div></div>`;
  h += note('本模块待接通 ABS 备件 / 配件库存视图（如 dbo.V_R_Parts_Stock）。接通后自动点亮真实库存与 D 类慢流件预警。下方为「接通后呈现」的数据结构预览（配件类型 / 日期 / D 类库存预警），便于提前对齐口径与采集字段。', 'warn');
  h += secTitle('库存总览（接通后呈现）', '真实 SKU / 金额 / 周转 / 呆滞占比');
  h += `<div class="kpi-row" style="margin-bottom:14px">
    ${kpiCard({ label: '配件 SKU 数', value: null, unit: '种', status: st })}
    ${kpiCard({ label: '库存总额', value: null, unit: '元', status: st })}
    ${kpiCard({ label: 'D类慢流件占比', value: null, unit: '%', status: st })}
    ${kpiCard({ label: '超期预警数', value: null, unit: '条', status: st })}
  </div>`;
  h += secTitle('配件类型分布（接通后呈现）', '按配件类型统计 SKU / 库存金额 / 周转天数');
  h += `<div class="card"><div class="card-bd" style="padding:0;overflow:auto"><table class="tbl">
    <thead><tr><th>配件类型</th><th>SKU 数</th><th>库存金额</th><th>平均周转天数</th><th>说明</th></tr></thead>
    <tbody>${[
      ['保养件', '—', '—', '—', '机油 / 机滤 / 空滤等周期性更换'],
      ['易损件', '—', '—', '—', '雨刮 / 刹车片 / 灯泡 / 电瓶等'],
      ['事故件', '—', '—', '—', '钣金 / 灯具 / 保险杠等碰撞维修'],
      ['油液', '—', '—', '—', '防冻液 / 制动液 / 冷媒等'],
      ['轮胎', '—', '—', '—', '原厂 / 品牌轮胎'],
      ['D类慢流件', '—', '—', '—', '长期无需求 / 超库龄呆滞件（重点预警）']
    ].map(r => `<tr><td>${E(r[0])}</td><td>${E(r[1])}</td><td>${E(r[2])}</td><td>${E(r[3])}</td><td class="muted">${E(r[4])}</td></tr>`).join('')}</tbody>
  </table></div></div>`;
  h += secTitle('D类库存预警（接通后呈现）', 'D类=慢流 / 呆滞件，超库龄阈值即预警，含入库日期与金额占用');
  h += `<div class="card"><div class="card-bd" style="padding:0;overflow:auto"><table class="tbl">
    <thead><tr><th>配件编码</th><th>配件名称</th><th>类型</th><th>入库日期</th><th>库龄天数</th><th>库存金额</th><th>预警级别</th></tr></thead>
    <tbody><tr><td colspan="7" class="muted" style="text-align:center">— 接通 ABS 配件数据后显示真实 D 类慢流件预警清单 —</td></tr></tbody>
  </table></div></div>`;
  h += note('日期口径：入库日期（到货上架）、最近出库日期（动销信号）、盘点日期（账实核对）；D 类判定建议阈值：连续 180 天无出库 或 库龄 ≥ 365 天，按库存金额降序预警，推送配件库管与售后经理处理（降价 / 调拨 / 退供应商）。');
  return h;
};
