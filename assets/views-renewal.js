/* 视图渲染层 —— 续保中心板块（比亚迪多店统筹）
 * 全部为 design state：ABS 未接通，仅展示接入路径、三级提醒闭环设计与参考表头结构。
 * 红线：不填模拟值。接通后由 refresh_cockpit.js 自动翻 live 并实例化三级闭环任务。 */
VIEWS.renewTasks = function (m) {
  let h = moduleHero(m);

  /* ---- 多店统筹说明 ---- */
  h += secTitle('多店统筹视图', '参考《新环怡店续保管控表》骨架，按「店面」维度归集比亚迪多家店续保客户');
  h += card('比亚迪多店续保客户池', `
    <p style="font-size:12.9px;color:var(--ink-2);line-height:1.75">续保中心以「店面」为一级维度，统筹比亚迪旗下各店的续保客户。每一家店的续保专员在自己的客户池内作业，总经理在此跨店对比战力、下钻战败、统一调度资源。</p>
    <div class="note" style="margin-top:10px">接入后「店面」列驱动跨店汇总与店级渗透率对比（见「续保中心战力分析」）。</div>
  `, '统筹维度：店面 → 客户 → 跟进人');

  /* ---- 三级提醒闭环（核心）---- */
  h += secTitle('三级提醒闭环设计', '以保险到期日倒推，接入 ABS 后自动实例化任务并指派各店续保专员');
  const levels = [
    { code: 'T-renew-2m', when: '到期前 2 个月', tag: '首触邀约', color: '#0ea5e9',
      task: '核实客户信息与上年承保方案，首次触达邀约，发送续保权益预告',
      measure: '电话 / 企微首触；确认联系方式；标记客户类别(A/B/C)；录入跟进记录 1',
      fallback: '未接通自动转「二次触达」任务，3 日内再触达' },
    { code: 'T-renew-1m', when: '到期前 1 个月', tag: '二次促成', color: '#f59e0b',
      task: '方案对比报价、竞品防御、促成续保',
      measure: '出具续保方案书；A 类客户经理直跟；价格异议处理话术；录入跟进记录 2–4',
      fallback: '价格敏感客户标记「战败预警」，转专员 + 主管联合跟进' },
    { code: 'T-renew-15d', when: '到期前 15 天', tag: '临期冲刺', color: '#ef4444',
      task: '临期兜底、领导介入、锁定缴费',
      measure: '最后通牒式提醒；主管协访；线上缴费引导；录入跟进记录 5–8',
      fallback: '仍未续转客户归档为「战败」，进入「续保战败分析」复盘' }
  ];
  h += `<div class="grid g3">${levels.map(L => `
    <div class="card" style="border-top:3px solid ${L.color}">
      <div class="card-hd">
        <h4 style="color:${L.color}">${E(L.when)}</h4>
        <span class="bdg pending_auth">${E(L.tag)}</span>
      </div>
      <div class="card-bd">
        <div class="kv"><b>闭环模板</b><span style="font-family:var(--mono)">${E(L.code)}</span></div>
        <div style="height:9px"></div>
        <div class="kv"><b>跟进任务</b><span>${E(L.task)}</span></div>
        <div style="height:9px"></div>
        <div class="kv"><b>标准措施</b><span>${E(L.measure)}</span></div>
        <div style="height:9px"></div>
        <div class="kv"><b>兜底升级</b><span style="color:${L.color}">${E(L.fallback)}</span></div>
      </div>
    </div>`).join('')}</div>`;

  h += `<div class="note" style="margin-top:13px">
    <b>闭环机制：</b>每一条任务进入「待处理 → 处理中 → 待验证 → 已闭环」四态流转，超时未跟进按层级逐级升级提醒（参考闭环引擎）。A 类高价值客户在 T-renew-1m 即强制经理直跟，降低战败。
  </div>`;

  /* ---- 接入后字段预览 ---- */
  h += secTitle('接入后字段预览（参考表头结构，不取真实数据）', 'ABS 续保视图授权后自动填充');
  h += card('续保跟进表 · 字段（按店 / 客户 / 保单 / 结果 / 跟进）', `
    <div class="field-chips">${['店面','客户','车牌','VIN','车型','上年保险公司','客户类别(A/B/C)','保险到期日','跟进人','是否续回','是否战败','战败原因','跟进记录1–8']
      .map(f => `<span class="fchip">${E(f)}</span>`).join('')}</div>
    <div class="note" style="margin-top:12px">「保险到期日」是三级提醒闭环的触发源；「是否续回 / 是否战败」驱动续回率与战败分析；「跟进记录1–8」沉淀每条客户的跟进轨迹。</div>
  `);

  return h;
};

VIEWS.renewFollow = function (m) {
  let h = moduleHero(m);
  h += secTitle('当月续保跟进分析（接入后字段）', '总到期 / 续回 / 续回率 / 战败 / 车均保费 / 利润');
  const kpis = [
    { label: '总到期客户', value: null, unit: '人', status: 'pending_auth', sub: '当月保险到期全集' },
    { label: '续回数', value: null, unit: '人', status: 'pending_auth', sub: '已成功续保' },
    { label: '续回率', value: null, unit: '%', status: 'pending_auth', sub: '续回 / 总到期' },
    { label: '战败数', value: null, unit: '人', status: 'pending_auth', sub: '未续保流失' },
    { label: '车均保费', value: null, unit: '元', status: 'pending_auth', sub: '保费 / 续回数' },
    { label: '续保利润', value: null, unit: '元', status: 'pending_auth', sub: '佣金 / 返点汇总' }
  ];
  h += `<div class="kpi-grid">${kpis.map(kpiCard).join('')}</div>`;

  h += secTitle('下钻维度', '保险公司 × 客户类别(A/B/C) 交叉分析');
  h += `<div class="grid g2">
    ${card('按保险公司', `<div class="field-chips">${['人保','平安','太保','国寿','中华','其他'].map(f => `<span class="fchip">${E(f)}</span>`).join('')}</div><div class="note" style="margin-top:10px">识别各保险公司续回率差异，指导渠道策略与专员分配。</div>`, '续回率 / 战败率')}
    ${card('按客户类别', `<div class="field-chips">${['A 类（高价值）','B 类（中）','C 类（低）'].map(f => `<span class="fchip">${E(f)}</span>`).join('')}</div><div class="note" style="margin-top:10px">A 类客户续回率与战败率单独监控，是续保利润的核心。</div>`, '续回率 / 战败率')}
  </div>`;

  h += secTitle('与三级闭环的关联', null);
  h += card('数据回流', `<div class="kv"><b>来源</b><span>ABS 续保视图 + 续保跟进台账</span></div>
    <div class="kv"><b>闭环联动</b><span>续回率低于店目标 → 自动生成闭环任务提醒续保负责人</span></div>
    <div class="kv"><b>多店</b><span>按「店面」汇总各店续回率，强弱店对比见「续保中心战力分析」</span></div>`);
  return h;
};

VIEWS.renewLost = function (m) {
  let h = moduleHero(m);
  h += secTitle('战败原因分布（结构化，接入后字段）', '价格 / 竞品 / 脱保 / 服务 / 自然流失');
  h += `<div class="field-chips">${['价格','竞品','脱保','服务不满','自然流失','其他'].map(f => `<span class="fchip">${E(f)}</span>`).join('')}</div>`;

  h += secTitle('战败分析维度', '定位可挽回 vs 不可挽回');
  h += `<div class="grid g3">
    ${card('按店面', `<div class="note">各店战败率对比，识别管理短板店。</div>`, '战败率')}
    ${card('按客户类别', `<div class="note">A 类高价值战败列为重点挽回对象，单独建闭环。</div>`, 'A 类战败')}
    ${card('按保险公司', `<div class="note">竞品挖角集中的保险公司，针对性防御。</div>`, '竞品占比')}
  </div>`;

  h += secTitle('与三级闭环的关联', null);
  h += card('战败复盘闭环', `<div class="kv"><b>来源</b><span>ABS 续保视图 + 战败标记台账（战败原因结构化录入）</span></div>
    <div class="kv"><b>闭环联动</b><span>战败率超阈值 → 提醒续保负责人 + 抽样进入「战败复盘」闭环；A 类战败 → 重点挽回闭环</span></div>
    <div class="kv"><b>数据回流</b><span>战败客户次年是否回流，验证挽回措施有效性</span></div>`);
  return h;
};

VIEWS.renewAccident = function (m) {
  let h = moduleHero(m);
  h += secTitle('事故赔付比（派生自 ABS 理赔视图）', '赔付比 = 理赔金额 / 保费');
  const kpis = [
    { label: '续保保费规模', value: null, unit: '元', status: 'pending_auth', sub: '续保客户保费汇总' },
    { label: '事故出险件数', value: null, unit: '件', status: 'pending_auth', sub: '保单年度内出险' },
    { label: '赔付总额', value: null, unit: '元', status: 'pending_auth', sub: '理赔金额汇总' },
    { label: '赔付率', value: null, unit: '%', status: 'pending_auth', sub: '理赔 / 保费' },
    { label: '案均赔款', value: null, unit: '元', status: 'pending_auth', sub: '赔付总额 / 件数' },
    { label: '出险频度', value: null, unit: '件/千台', status: 'pending_auth', sub: '出险件数 / 承保台数' }
  ];
  h += `<div class="kpi-grid">${kpis.map(kpiCard).join('')}</div>`;

  h += secTitle('与三级闭环的关联', null);
  h += card('赔付质量监控', `<div class="kv"><b>来源</b><span>ABS 保险理赔视图（理赔金额 / 出险日期）关联保费视图</span></div>
    <div class="kv"><b>闭环联动</b><span>赔付率超行业警戒线 → 提醒核保 / 续保负责人复核承保策略；高赔付客户次年续保单独定价风控</span></div>
    <div class="kv"><b>多店</b><span>按「店面」对比赔付率，识别高风险店业务结构</span></div>`);
  return h;
};

VIEWS.renewPower = function (m) {
  let h = moduleHero(m);
  h += secTitle('续保中心战力看板（接入后字段）', '跨比亚迪多店对比');
  const kpis = [
    { label: '到期数', value: null, unit: '人', status: 'pending_auth', sub: '各店保险到期' },
    { label: '次新车续保率', value: null, unit: '%', status: 'pending_auth', sub: '次新车续回 / 到期' },
    { label: '续转续保率', value: null, unit: '%', status: 'pending_auth', sub: '续转续 / 到期' },
    { label: '到期续保率', value: null, unit: '%', status: 'pending_auth', sub: '渗透率核心指标' },
    { label: '续保目标', value: null, unit: '%', status: 'pending_auth', sub: '店级目标' },
    { label: '达成率', value: null, unit: '%', status: 'pending_auth', sub: '实际 / 目标' }
  ];
  h += `<div class="kpi-grid">${kpis.map(kpiCard).join('')}</div>`;

  h += secTitle('多店战力对比', '强弱店一目了然，识别人力缺口');
  h += card('战力维度', `
    <div class="field-chips">${['店面','到期数','次新车续保率','续转续保率','到期续保率','目标','达成率','续保专员数'].map(f => `<span class="fchip">${E(f)}</span>`).join('')}</div>
    <div class="note" style="margin-top:12px">「到期续保率（渗透率）」是战力核心；「续保专员人均产能」用于人力编制与激励测算。达成率低于目标自动提醒续保中心负责人并下钻到店级闭环。</div>
  `, '统筹维度');

  h += secTitle('与三级闭环的关联', null);
  h += card('战力 → 闭环', `<div class="kv"><b>来源</b><span>ABS 续保视图 + 各店目标台账</span></div>
    <div class="kv"><b>闭环联动</b><span>达成率低于目标 → 提醒续保中心负责人 + 店级闭环下钻；人力缺口 → 行政板块「全店人员信息管理」联动</span></div>`);
  return h;
};
