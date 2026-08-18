/* 客服板块 + 保客 + 保险 + 人效 真数视图 */

/* ---------- 售后保客管理 ---------- */
VIEWS.serviceRetention = function (m) {
  const o = D.overview, c = o.cohort, mtd = o.months[3];
  const seriesVins = o.series.reduce((s, x) => s + x.vins, 0);
  let h = moduleHero(m);

  h += secTitle('保客基盘指标');
  h += `<div class="grid g4">
    ${kpiCard({ label: '累计保有 VIN', value: c.base.vins, unit: '台', sub: c.base.since + ' 至今去重车架号', trend: null })}
    ${kpiCard({ label: '累计保有客户', value: c.base.customers, unit: '人', sub: '累计 ' + num(c.base.totalOrders) + ' 工单', trend: null })}
    ${kpiCard({ label: '近90天活跃台次', value: c.cur.vins, unit: '台', sub: '基盘渗透率 ' + pct(c.cur.vins, c.base.vins) + '%', trend: (c.cur.vins - c.prev.vins) / c.prev.vins * 100, trendNote: '对比上期90天' })}
    ${kpiCard({ label: '8月MTD 回厂台次', value: mtd.vins, unit: '台', sub: '月度渗透率 ' + pct(mtd.vins, c.base.vins) + '%', trend: null })}
  </div>`;

  h += secTitle('基盘活跃度双窗口对比', '滚动 90 天去重口径，非月度加总');
  h += `<div class="grid g2">
    ${card('本期 vs 上期', `<table class="tb"><thead><tr>
      <th>指标</th><th class="r">${E(c.cur.label)}</th><th class="r">${E(c.prev.label)}</th><th class="r">变化</th>
      </tr></thead><tbody>
      ${[['活跃客户数', c.cur.customers, c.prev.customers, '人'],
         ['活跃台次', c.cur.vins, c.prev.vins, '台'],
         ['工单数', c.cur.orders, c.prev.orders, '单'],
         ['营收', c.cur.revenue, c.prev.revenue, '元']].map(([k, a, b, u]) => {
        const d = (a - b) / b * 100;
        return `<tr><td class="nm">${k}</td><td class="r">${money(a)}</td><td class="r">${money(b)}</td>
          <td class="r ${d >= 0 ? 'pos' : 'neg'}">${d >= 0 ? '+' : ''}${d.toFixed(1)}%</td></tr>`;
      }).join('')}
      <tr><td class="nm">单客产值</td>
        <td class="r">${money(c.cur.revenue / c.cur.customers)}</td>
        <td class="r">${money(c.prev.revenue / c.prev.customers)}</td>
        <td class="r pos">+${(((c.cur.revenue / c.cur.customers) - (c.prev.revenue / c.prev.customers)) / (c.prev.revenue / c.prev.customers) * 100).toFixed(1)}%</td></tr>
      </tbody></table>
      <div class="note warn" style="margin-top:12px"><b>关键反差：</b>活跃客户少了 ${c.prev.customers - c.cur.customers} 人（-${((c.prev.customers - c.cur.customers) / c.prev.customers * 100).toFixed(1)}%），营收却增长 ${((c.cur.revenue - c.prev.revenue) / c.prev.revenue * 100).toFixed(1)}% —— 靠单客产值（+${(((c.cur.revenue / c.cur.customers) - (c.prev.revenue / c.prev.customers)) / (c.prev.revenue / c.prev.customers) * 100).toFixed(1)}%）撑住了大盘。这是<b>高风险结构</b>：一旦事故大单波动，营收会立刻塌下来。根子问题是基盘客户在流失。</div>`)}
    ${card('进厂频次分层（近90天）', CH.hbars(o.frequency, {
      k: 'bucket', v: 'customers', lw: 66, rh: 38,
      colorBy: (d, i) => ['#d92c2c', '#e8890c', '#00a870', '#1e5eff'][i],
      fmt: d => d.customers + '人 · ' + (d.revenue / 1e4).toFixed(1) + '万'
    }) + `<div style="height:8px"></div><table class="tb"><thead><tr>
      <th>频次档</th><th class="r">客户数</th><th class="r">占比</th><th class="r">营收(元)</th><th class="r">单客产值</th>
      </tr></thead><tbody>${o.frequency.map(f => `<tr>
        <td class="nm">${E(f.bucket)}</td><td class="r">${num(f.customers)}</td>
        <td class="r">${pct(f.customers, c.cur.customers)}%</td>
        <td class="r">${money(f.revenue)}</td><td class="r">${money(f.revenue / f.customers)}</td></tr>`).join('')}
      </tbody></table>`)}
  </div>`;

  h += secTitle('车系保有结构', D.meta.windowMain + ' 回厂车系分布');
  h += card('车系回厂台次', `<table class="tb"><thead><tr>
    <th>车系</th><th class="r">回厂台次</th><th class="r">占比</th><th class="r">工单数</th><th class="r">单车进厂次数</th><th class="r">单车产值(元)</th><th style="width:110px">分布</th>
    </tr></thead><tbody>${o.series.map(s => `<tr>
      <td class="nm">${E(s.name)}</td><td class="r">${num(s.vins)}</td>
      <td class="r">${pct(s.vins, seriesVins)}%</td><td class="r">${num(s.orders)}</td>
      <td class="r">${(s.orders / s.vins).toFixed(2)}</td><td class="r">${money(s.revenue / s.vins)}</td>
      <td><div class="mini-bar"><i style="width:${s.vins / o.series[0].vins * 100}%"></i></div></td></tr>`).join('')}
    </tbody><tfoot><tr><td>合计</td><td class="r">${num(seriesVins)}</td><td class="r">100%</td>
      <td class="r">${num(o.series.reduce((s, x) => s + x.orders, 0))}</td><td class="r">—</td><td class="r">—</td><td>—</td></tr></tfoot></table>`);

  h += secTitle('保客管理判断');
  h += `<div>
    <div class="alert high"><div class="alert-ic">!</div><div class="alert-bd"><div class="alert-tx">
      <b>基盘渗透率仅 ${pct(c.cur.vins, c.base.vins)}%</b>：累计 ${num(c.base.vins)} 台保有车，近 90 天只回来 ${num(c.cur.vins)} 台。行业健康的季度回厂率通常在 20%~30%，当前明显偏低。
      即便扣除已过保、已置换、已迁出的车辆，仍有大量可挽回空间。
    </div><div class="alert-mt"><a data-jump="cs.churn">前往流失客户挽回 →</a></div></div></div>
    <div class="alert mid"><div class="alert-ic">·</div><div class="alert-bd"><div class="alert-tx">
      <b>高价值客户极少</b>：近 90 天进厂 3 次以上的客户仅 148 人（占 8.7%），其中 5 次以上仅 9 人。说明「常客」群体尚未形成，客户黏性主要依赖单次事故维修而非长期养护关系。
    </div><div class="alert-mt"><a data-jump="cs.active">前往活跃客户管理 →</a></div></div></div>
    <div class="alert low"><div class="alert-ic">i</div><div class="alert-bd"><div class="alert-tx">
      <b>完整保客名单需夜间任务</b>：按 ABS 护栏（单查询跨度 ≤92 天、避开 08:30–18:30 营业高峰），全量 3 年保客的「最后进厂日期 + 流失分层 + 应招揽名单」需分段扫描后合并，已排入 21:00 后批量任务。届时本页将补充可导出的招揽名单（经 PII 脱敏）。
    </div></div></div>
  </div>`;
  return h;
};

/* ---------- 客户总数管理 ---------- */
VIEWS.csTotal = function (m) {
  const o = D.overview, c = o.cohort;
  let h = moduleHero(m);
  h += secTitle('客户基盘总量');
  h += `<div class="grid g4">
    ${kpiCard({ label: '累计客户数', value: c.base.customers, unit: '人', sub: c.base.since + ' 至今去重客户ID', trend: null })}
    ${kpiCard({ label: '累计保有 VIN', value: c.base.vins, unit: '台', sub: '车客比 ' + (c.base.vins / c.base.customers).toFixed(3), trend: null })}
    ${kpiCard({ label: '累计服务工单', value: c.base.totalOrders, unit: '单', sub: '人均 ' + (c.base.totalOrders / c.base.customers).toFixed(1) + ' 单', trend: null })}
    ${kpiCard({ label: '近90天活跃客户', value: c.cur.customers, unit: '人', sub: '占基盘 ' + pct(c.cur.customers, c.base.customers) + '%', trend: (c.cur.customers - c.prev.customers) / c.prev.customers * 100, trendNote: '对比上期90天' })}
  </div>`;

  h += secTitle('月度服务客户趋势');
  h += `<div class="grid g23">
    ${card('月度客户数与台次', CH.bars(o.months, { x: 'm', id: 'ct1', h: 250, series: [
      { key: 'customers', name: '服务客户数', color: '#8b5cf6' }, { key: 'vins', name: '进厂台次', color: '#1e5eff' }] }), '8月为 MTD（13天）')}
    ${card('客户构成说明', `
      <div class="kv"><b>统计口径</b><span>ABS 售后结算明细中出现过的去重「客户ID」</span></div>
      <div class="kv"><b>起始时间</b><span>${E(c.base.since)}（ABS 该视图最早数据）</span></div>
      <div class="kv"><b>车客比</b><span>${(c.base.vins / c.base.customers).toFixed(3)} —— 略大于 1，存在少量一客多车</span></div>
      <div class="kv"><b>累计工单</b><span>${num(c.base.totalOrders)} 单，人均 ${(c.base.totalOrders / c.base.customers).toFixed(1)} 单</span></div>
      <div class="note warn" style="margin-top:12px">${E(m.gap)}</div>`)}
  </div>`;

  h += secTitle('客户分层视图');
  h += `<div class="grid g2">
    ${card('近90天进厂频次分层', CH.donut(o.frequency, { k: 'bucket', v: 'customers', size: 208, center: num(c.cur.customers), centerSub: '活跃客户(人)' }))}
    ${card('基盘活跃状态拆解', `
      <div class="grid g2" style="gap:10px">
        <div class="kpi"><div class="kpi-lb">近90天活跃</div><div class="kpi-vl">${num(c.cur.customers)}<u>人</u></div><div class="kpi-sb">${pct(c.cur.customers, c.base.customers)}% 的基盘</div></div>
        <div class="kpi na"><div class="kpi-lb">90天以上未进厂</div><div class="kpi-vl">${num(c.base.customers - c.cur.customers)}<u>人</u></div><div class="kpi-sb">${pct(c.base.customers - c.cur.customers, c.base.customers)}% 待唤醒</div></div>
      </div>
      <div style="height:12px"></div>
      <div class="note">这 ${num(c.base.customers - c.cur.customers)} 人中包含已置换、已迁出、已过保自行养护等自然流失，也包含<b>可挽回的沉睡客户</b>。精确分层（6/12/24 个月未进厂）需夜间全量扫描任务。</div>
      <div style="height:10px"></div>
      <div class="watch-item"><b>下一步</b><span>接入 V_UC_NewCar 后，可将「购车但从未回厂」客户单独识别 —— 这是最高价值的首保招揽名单。</span></div>`)}
  </div>`;
  return h;
};

/* ---------- 活跃客户管理 ---------- */
VIEWS.csActive = function (m) {
  const o = D.overview, c = o.cohort, f = o.frequency;
  const hv = f[2].customers + f[3].customers;
  const hvRev = f[2].revenue + f[3].revenue;
  let h = moduleHero(m);

  h += secTitle('活跃度核心指标', c.cur.label);
  h += `<div class="grid g4">
    ${kpiCard({ label: '近90天活跃客户', value: c.cur.customers, unit: '人', sub: '基盘渗透 ' + pct(c.cur.customers, c.base.customers) + '%', trend: (c.cur.customers - c.prev.customers) / c.prev.customers * 100, trendNote: '对比上期90天' })}
    ${kpiCard({ label: '活跃客户营收', value: c.cur.revenue, unit: '元', sub: '单客 ' + money(c.cur.revenue / c.cur.customers) + ' 元', trend: (c.cur.revenue - c.prev.revenue) / c.prev.revenue * 100, trendNote: '对比上期90天' })}
    ${kpiCard({ label: '高价值客户(3次+)', value: hv, unit: '人', sub: '占活跃 ' + pct(hv, c.cur.customers) + '% · 贡献 ' + pct(hvRev, c.cur.revenue) + '% 营收', trend: null })}
    ${kpiCard({ label: '单次到店客户', value: f[0].customers, unit: '人', sub: '占活跃 ' + pct(f[0].customers, c.cur.customers) + '% —— 转化重点', trend: null })}
  </div>`;

  h += secTitle('进厂频次分层');
  h += `<div class="grid g23">
    ${card('分层客户数与营收', CH.bars(f, { x: 'bucket', id: 'ca1', h: 250, series: [
      { key: 'customers', name: '客户数(人)', color: '#8b5cf6' }] }) +
      CH.bars(f, { x: 'bucket', id: 'ca2', h: 200, series: [{ key: 'revenue', name: '营收(元)', color: '#1e5eff' }] }), c.cur.label)}
    ${card('分层价值对照', `<table class="tb"><thead><tr>
      <th>频次档</th><th class="r">客户数</th><th class="r">客户占比</th><th class="r">营收(元)</th><th class="r">营收占比</th><th class="r">单客产值</th>
      </tr></thead><tbody>${f.map(x => `<tr>
        <td class="nm">${E(x.bucket)}</td><td class="r">${num(x.customers)}</td>
        <td class="r">${pct(x.customers, c.cur.customers)}%</td>
        <td class="r">${money(x.revenue)}</td><td class="r">${pct(x.revenue, c.cur.revenue)}%</td>
        <td class="r ${x.revenue / x.customers > 3000 ? 'pos' : ''}">${money(x.revenue / x.customers)}</td></tr>`).join('')}
      </tbody><tfoot><tr><td>合计</td><td class="r">${num(c.cur.customers)}</td><td class="r">100%</td>
        <td class="r">${money(c.cur.revenue)}</td><td class="r">100%</td>
        <td class="r">${money(c.cur.revenue / c.cur.customers)}</td></tr></tfoot></table>
      <div class="note" style="margin-top:12px"><b>结构判断：</b>「仅1次」客户 ${num(f[0].customers)} 人贡献 ${pct(f[0].revenue, c.cur.revenue)}% 营收，单客 ${money(f[0].revenue / f[0].customers)} 元 —— 单客产值最高，因为其中混入了大额事故维修单。这意味着<b>很多客户是「出事才来」</b>，不是常规养护客户。
      </div>`)}
  </div>`;

  h += secTitle('活跃度提升策略', '基于分层的差异化动作');
  h += `<div class="grid g3">
    ${card('仅1次 → 2次（' + num(f[0].customers) + '人）', `
      <div class="watch-item"><b>目标</b><span>把「出事才来」转成「养护也来」</span></div>
      <div style="height:8px"></div>
      <div class="watch-item"><b>动作</b><span>结算后 30 天内回访 + 赠下次保养工时抵扣券（有效期 6 个月）</span></div>
      <div style="height:8px"></div>
      <div class="watch-item"><b>测算</b><span>若转化 20%（约 203 人），按定保单单 793 元估算，可增营收约 16 万元</span></div>`, '最大杠杆')}
    ${card('2次 → 常客（' + num(f[1].customers) + '人）', `
      <div class="watch-item"><b>目标</b><span>建立固定保养周期与顾问绑定关系</span></div>
      <div style="height:8px"></div>
      <div class="watch-item"><b>动作</b><span>推保养套餐（2~4 次打包）、绑定专属服务顾问、生日/车龄关怀</span></div>
      <div style="height:8px"></div>
      <div class="watch-item"><b>测算</b><span>套餐客户年均进厂次数可提升至 2.5~3 次</span></div>`, '稳固基本盘')}
    ${card('高价值客户（' + hv + '人）', `
      <div class="watch-item"><b>目标</b><span>保住不流失，并做转介绍与置换</span></div>
      <div style="height:8px"></div>
      <div class="watch-item"><b>动作</b><span>纳入 VIP 名单、优先排单、免费取送车、转介绍奖励</span></div>
      <div style="height:8px"></div>
      <div class="watch-item"><b>联动</b><span>车龄 3~6 年的高价值客户直接进置换线索池（hdhr-owner-mining 可直接跑）</span></div>`, '守住 + 挖增量')}
  </div>`;

  h += `<div style="height:14px"></div><div class="note warn">
    <b>执行前提：</b>以上动作涉及客户联系信息，须经 <b>hdhr-pii-guard</b> 脱敏后方可流转；D15 合规基线达成前，名单仅限内部使用，禁止自动对客发送。
  </div>`;
  return h;
};

/* ---------- 流失客户挽回 ---------- */
VIEWS.csChurn = function (m) {
  const o = D.overview, c = o.cohort;
  const lost = c.prev.customers - c.cur.customers;
  const sleeping = c.base.customers - c.cur.customers;
  let h = moduleHero(m);

  h += secTitle('流失监测指标');
  h += `<div class="grid g4">
    ${kpiCard({ label: '活跃客户净减少', value: lost, unit: '人', sub: '本期90天 vs 上期90天', trend: -((lost) / c.prev.customers * 100), trendNote: '活跃基盘缩水' })}
    ${kpiCard({ label: '90天以上未进厂', value: sleeping, unit: '人', sub: '占累计基盘 ' + pct(sleeping, c.base.customers) + '%', trend: null })}
    ${kpiCard({ label: '当前活跃客户', value: c.cur.customers, unit: '人', sub: '渗透率 ' + pct(c.cur.customers, c.base.customers) + '%', trend: null })}
    ${kpiCard({ label: '单客产值(活跃)', value: Math.round(c.cur.revenue / c.cur.customers), unit: '元', sub: '上期 ' + money(c.prev.revenue / c.prev.customers) + ' 元', trend: ((c.cur.revenue / c.cur.customers) - (c.prev.revenue / c.prev.customers)) / (c.prev.revenue / c.prev.customers) * 100, trendNote: '对比上期90天' })}
  </div>`;

  h += secTitle('流失结构分析');
  h += `<div class="grid g2">
    ${card('基盘活跃 vs 沉睡', CH.donut([
      { k: '近90天活跃', v: c.cur.customers },
      { k: '90天以上未进厂', v: sleeping }
    ], { k: 'k', v: 'v', size: 208, center: num(c.base.customers), centerSub: '累计客户(人)' }) +
    `<div class="note warn" style="margin-top:12px"><b>注意：</b>沉睡 ${num(sleeping)} 人不等于全部可挽回。其中包含已置换车辆、已迁出惠州、车辆已报废、以及过保后自行找修理厂的客户。真实可挽回池需按「车龄 + 最后进厂日期 + 历史消费」三维筛选，由夜间任务产出。</div>`)}
    ${card('双窗口流失对照', `<table class="tb"><thead><tr>
      <th>指标</th><th class="r">上期90天</th><th class="r">本期90天</th><th class="r">变化</th>
      </tr></thead><tbody>
      <tr><td class="nm">活跃客户</td><td class="r">${num(c.prev.customers)}</td><td class="r">${num(c.cur.customers)}</td><td class="r neg">-${lost}（-${(lost / c.prev.customers * 100).toFixed(1)}%）</td></tr>
      <tr><td class="nm">活跃台次</td><td class="r">${num(c.prev.vins)}</td><td class="r">${num(c.cur.vins)}</td><td class="r neg">-${c.prev.vins - c.cur.vins}（-${((c.prev.vins - c.cur.vins) / c.prev.vins * 100).toFixed(1)}%）</td></tr>
      <tr><td class="nm">工单数</td><td class="r">${num(c.prev.orders)}</td><td class="r">${num(c.cur.orders)}</td><td class="r neg">-${c.prev.orders - c.cur.orders}（-${((c.prev.orders - c.cur.orders) / c.prev.orders * 100).toFixed(1)}%）</td></tr>
      <tr><td class="nm">营收</td><td class="r">${money(c.prev.revenue)}</td><td class="r">${money(c.cur.revenue)}</td><td class="r pos">+${((c.cur.revenue - c.prev.revenue) / c.prev.revenue * 100).toFixed(1)}%</td></tr>
      <tr><td class="nm">单客产值</td><td class="r">${money(c.prev.revenue / c.prev.customers)}</td><td class="r">${money(c.cur.revenue / c.cur.customers)}</td><td class="r pos">+${(((c.cur.revenue / c.cur.customers) - (c.prev.revenue / c.prev.customers)) / (c.prev.revenue / c.prev.customers) * 100).toFixed(1)}%</td></tr>
      </tbody></table>
      <div class="note warn" style="margin-top:12px"><b>核心风险：</b>客户数、台次、工单数三项全线下滑，营收却上升 —— 全靠单客产值（大额事故单）拉动。这种结构<b>不可持续</b>：事故车来源不可控，一旦推修渠道波动，营收将直接暴露基盘萎缩的真实情况。</div>`)}
  </div>`;

  h += secTitle('挽回执行方案');
  h += `<div class="grid g3">
    ${card('第一层：3~6 个月未进厂', `
      <div class="watch-item"><b>判定</b><span>刚过一个保养周期，最容易召回</span></div>
      <div style="height:7px"></div>
      <div class="watch-item"><b>动作</b><span>企微/电话保养到期提醒 + 工时折扣券</span></div>
      <div style="height:7px"></div>
      <div class="watch-item"><b>预期</b><span>召回率通常 25%~40%</span></div>`, '优先级最高')}
    ${card('第二层：6~12 个月未进厂', `
      <div class="watch-item"><b>判定</b><span>已开始流向外部修理厂</span></div>
      <div style="height:7px"></div>
      <div class="watch-item"><b>动作</b><span>免费检测 + 空调/油液专项活动，重建接触</span></div>
      <div style="height:7px"></div>
      <div class="watch-item"><b>预期</b><span>召回率 10%~20%，需组合优惠</span></div>`, '需要力度')}
    ${card('第三层：12 个月以上', `
      <div class="watch-item"><b>判定</b><span>大概率已流失或已置换</span></div>
      <div style="height:7px"></div>
      <div class="watch-item"><b>动作</b><span>转向<b>置换线索</b>而非售后召回（车龄 3~6 年优先）</span></div>
      <div style="height:7px"></div>
      <div class="watch-item"><b>工具</b><span>hdhr-owner-mining 可直接从已授权 ABS 视图产出置换池，零成本、今日可跑</span></div>`, '转换思路')}
  </div>`;

  h += `<div style="height:14px"></div>`;
  h += card('夜间批量任务说明', `
    <ol class="steps">
      <li>按 ABS 护栏将 2020-11 至今拆为多个 ≤92 天窗口，分段扫描每个客户ID 的最后进厂日期与累计消费</li>
      <li>合并分段结果，计算「距今未进厂天数」，落入 3~6 / 6~12 / 12~24 / 24 个月以上四层</li>
      <li>叠加车龄与历史消费额，剔除已置换（可由 V_UC_Sale 授权后判定）与低价值客户</li>
      <li>经 <b>hdhr-pii-guard</b> 脱敏后输出分层挽回名单，推送至企微对应岗位</li>
      <li>执行时段固定 21:00 后，避开 08:30–18:30 营业高峰，单次查询 30s 超时保护</li>
    </ol>
    <div class="note" style="margin-top:12px">该任务可挂为 WorkBuddy 定时自动化，每周一次全量刷新，日常只看增量变化。</div>`,
    '按 ABS 护栏合规执行');
  return h;
};
