/* 售后板块真数视图 */

/* 通用：模块页头 */
function moduleHero(m) {
  return `<div class="pend-hero" style="margin-bottom:4px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
      <b style="font-size:16px">${E(m.title)}</b>${bdg(effStatus(m.status, m.key))}
    </div>
    <p>${E(m.desc)}</p>
    ${m.source ? `<div style="margin-top:11px;font-size:11.8px;color:var(--ink-3);font-family:var(--mono)">数据源：${E(m.source)}</div>` : ''}
    ${m.partialNote ? `<div class="note" style="margin-top:12px"><b>当前状态：</b>${E(m.partialNote)}</div>` : ''}
    ${m.gap ? `<div class="note warn" style="margin-top:10px"><b>口径说明：</b>${E(m.gap)}</div>` : ''}
  </div>`;
}

/* ---------- 售后产值管理 ---------- */
VIEWS.serviceOutput = function (m) {
  const o = D.overview, mtd = o.months[3], jul = o.months[2], same = o.lastYearSame;
  const forecast = mtd.revenue / mtd.days * 31;
  const rev = o.categories.reduce((s, x) => s + x.revenue, 0);
  let h = moduleHero(m);

  h += secTitle('产值核心指标', o.mtdLabel + ' vs ' + same.label);
  h += `<div class="grid g4">
    ${kpiCard({ label: '8月MTD 实际营收', value: mtd.revenue, unit: '元', sub: '13 天 · 日均 ' + money(mtd.revenue / mtd.days) + ' 元', trend: (mtd.revenue - same.revenue) / same.revenue * 100, trendNote: '对比7月同期' })}
    ${kpiCard({ label: '8月MTD 实际毛利', value: mtd.profit, unit: '元', sub: '毛利率 ' + pct(mtd.profit, mtd.revenue) + '%（7月同期 ' + pct(same.profit, same.revenue) + '%）', trend: (mtd.profit - same.profit) / same.profit * 100, trendNote: '对比7月同期' })}
    ${kpiCard({ label: '进厂台次', value: mtd.vins, unit: '台', sub: '日均 ' + (mtd.vins / mtd.days).toFixed(1) + ' 台', trend: (mtd.vins - same.vins) / same.vins * 100, trendNote: '对比7月同期' })}
    ${kpiCard({ label: '单车产值', value: Math.round(mtd.revenue / mtd.vins), unit: '元/台', sub: '7月同期 ' + Math.round(same.revenue / same.vins) + ' 元', trend: (mtd.revenue / mtd.vins - same.revenue / same.vins) / (same.revenue / same.vins) * 100, trendNote: '对比7月同期' })}
  </div>`;
  h += `<div style="height:14px"></div><div class="grid g4">
    ${kpiCard({ label: '8月全月预测', value: Math.round(forecast), unit: '元', sub: '按当前日均线性外推 · 7月实际 ' + wan(jul.revenue) + '万', trend: (forecast - jul.revenue) / jul.revenue * 100, trendNote: '对比7月全月' })}
    ${kpiCard({ label: '工单数', value: mtd.orders, unit: '单', sub: '客单工单 ' + (mtd.orders / mtd.customers).toFixed(2) + ' 单/人', trend: (mtd.orders - same.orders) / same.orders * 100, trendNote: '对比7月同期' })}
    ${kpiCard({ label: '7月实际营收', value: jul.revenue, unit: '元', sub: '毛利 ' + wan(jul.profit) + '万 · 毛利率 ' + pct(jul.profit, jul.revenue) + '%', trend: null })}
    ${kpiCard({ label: '近3个月累计营收', value: o.months.slice(0, 3).reduce((s, x) => s + x.revenue, 0), unit: '元', sub: '5–7月 · 毛利 ' + wan(o.months.slice(0, 3).reduce((s, x) => s + x.profit, 0)) + '万', trend: null })}
  </div>`;

  h += secTitle('趋势分析');
  h += `<div class="grid g23">
    ${card('周度营收与毛利', CH.line(o.weeks, { x: 'w', id: 'so1', h: 260, series: [
      { key: 'revenue', name: '实际营收(元)', color: '#1e5eff', area: true },
      { key: 'profit', name: '实际毛利(元)', color: '#00a870', area: true }] }), '近 14 周')}
    ${card('周度台次与工单', CH.line(o.weeks, { x: 'w', id: 'so2', h: 260, series: [
      { key: 'orders', name: '工单数', color: '#ff6a00' },
      { key: 'vins', name: '进厂台次', color: '#8b5cf6' }] }), '近 14 周')}
  </div>`;

  h += secTitle('业务类别产值结构', D.meta.windowMain);
  h += `<div class="grid g23">
    ${card('营收构成', CH.donut(o.categories.filter(x => x.revenue > 0), { k: 'name', v: 'revenue', size: 210, center: CH.fmtK(rev), centerSub: '总营收(元)' }))}
    ${card('类别明细', `<table class="tb"><thead><tr>
      <th>业务类别</th><th class="r">工单数</th><th class="r">营收(元)</th><th class="r">占比</th><th class="r">毛利(元)</th><th class="r">毛利率</th><th class="r">单单产值</th>
      </tr></thead><tbody>${o.categories.map(c => `<tr>
        <td class="nm">${E(c.name)}</td>
        <td class="r">${num(c.orders)}</td>
        <td class="r">${money(c.revenue)}</td>
        <td class="r">${pct(c.revenue, rev)}%</td>
        <td class="r">${money(c.profit)}</td>
        <td class="r ${c.revenue > 0 && c.profit / c.revenue < .25 ? 'neg' : ''}">${c.revenue > 0 ? pct(c.profit, c.revenue) + '%' : '—'}</td>
        <td class="r">${c.orders ? money(c.revenue / c.orders) : '—'}</td></tr>`).join('')}
      </tbody><tfoot><tr><td>合计</td>
        <td class="r">${num(o.categories.reduce((s, x) => s + x.orders, 0))}</td>
        <td class="r">${money(rev)}</td><td class="r">100%</td>
        <td class="r">${money(o.categories.reduce((s, x) => s + x.profit, 0))}</td>
        <td class="r">${pct(o.categories.reduce((s, x) => s + x.profit, 0), rev)}%</td><td class="r">—</td></tr></tfoot></table>`)}
  </div>`;

  h += secTitle('车系产值贡献');
  h += card('车系明细（按营收降序）', `<table class="tb"><thead><tr>
    <th>车系</th><th class="r">工单数</th><th class="r">台次</th><th class="r">营收(元)</th><th class="r">占比</th><th class="r">毛利(元)</th><th class="r">毛利率</th><th class="r">单车产值</th><th style="width:110px">贡献度</th>
    </tr></thead><tbody>${o.series.map(s => {
      const maxR = o.series[0].revenue;
      return `<tr><td class="nm">${E(s.name)}</td>
        <td class="r">${num(s.orders)}</td><td class="r">${num(s.vins)}</td>
        <td class="r">${money(s.revenue)}</td><td class="r">${pct(s.revenue, rev)}%</td>
        <td class="r">${money(s.profit)}</td><td class="r">${pct(s.profit, s.revenue)}%</td>
        <td class="r">${money(s.revenue / s.vins)}</td>
        <td><div class="mini-bar"><i style="width:${s.revenue / maxR * 100}%"></i></div></td></tr>`;
    }).join('')}</tbody></table>`, D.meta.windowMain);

  h += secTitle('产值提升机会', '基于真数的结构性判断');
  h += `<div>
    <div class="alert mid"><div class="alert-ic">·</div><div class="alert-bd"><div class="alert-tx">
      <b>衍生业务几乎空白</b>：精品销售 17 单 5,746 元 + 美容 1 单 400 元，合计占营收仅 0.4%。行业健康水位应在 5%~8%。按当前 304 台次/半月的进厂量，若精品渗透率提到 15%、单台 800 元，月增营收约 7 万元、毛利约 3 万元。
    </div><div class="alert-mt"><a data-jump="service.margin">查看毛利结构 →</a></div></div></div>
    <div class="alert mid"><div class="alert-ic">·</div><div class="alert-bd"><div class="alert-tx">
      <b>事故维修依赖度高</b>：事故维修 106 单贡献 62.9 万营收（占 43.4%），但仅 105 台次，单台 5,992 元。事故车来源不稳定（全部记为「主动到店」），一旦推修渠道波动，产值将大幅震荡。建议建立保险公司/交警/拖车渠道的推修合作台账。
    </div><div class="alert-mt"><a data-jump="service.insurance">查看保险车辆管理 →</a></div></div></div>
    <div class="alert mid"><div class="alert-ic">·</div><div class="alert-bd"><div class="alert-tx">
      <b>定保是基本盘但单价偏低</b>：定保维修 492 单占工单数 42%，营收 39.0 万，单单仅 793 元。提升路径是「保养 + 深化项目」组合（空调清洗、四轮定位、油液升级），而非降价促量。
    </div><div class="alert-mt"><a data-jump="cs.campaign">查看招揽活动 →</a></div></div></div>
  </div>`;
  return h;
};

/* ---------- 售后接待管理 ---------- */
VIEWS.serviceReception = function (m) {
  const o = D.overview, mtd = o.months[3], same = o.lastYearSame;
  const tot = o.advisors.reduce((a, x) => ({ o: a.o + x.orders, v: a.v + x.vins, r: a.r + x.revenue, p: a.p + x.profit }), { o: 0, v: 0, r: 0, p: 0 });
  let h = moduleHero(m);

  h += secTitle('接待核心指标', o.mtdLabel);
  h += `<div class="grid g4">
    ${kpiCard({ label: '8月MTD 工单数', value: mtd.orders, unit: '单', sub: '日均 ' + (mtd.orders / mtd.days).toFixed(1) + ' 单', trend: (mtd.orders - same.orders) / same.orders * 100, trendNote: '对比7月同期' })}
    ${kpiCard({ label: '进厂台次', value: mtd.vins, unit: '台', sub: '去重 VIN', trend: (mtd.vins - same.vins) / same.vins * 100, trendNote: '对比7月同期' })}
    ${kpiCard({ label: '接待客户数', value: mtd.customers, unit: '人', sub: '去重客户ID', trend: (mtd.customers - same.customers) / same.customers * 100, trendNote: '对比7月同期' })}
    ${kpiCard({ label: '客单工单数', value: (mtd.orders / mtd.customers).toFixed(2), unit: '单/人', sub: '一次进厂开多单的比例', trend: null })}
  </div>`;

  h += secTitle('服务顾问产能', D.meta.windowMain + ' · 5 名在岗结算顾问');
  h += `<div class="grid g23">
    ${card('顾问营收排名', CH.hbars(o.advisors, { k: 'name', v: 'revenue', lw: 66, rh: 36, fmt: d => (d.revenue / 1e4).toFixed(1) + '万' }))}
    ${card('顾问工单量对比', CH.bars(o.advisors, { x: 'name', id: 'sr1', h: 240, series: [
      { key: 'orders', name: '工单数', color: '#ff6a00' }, { key: 'vins', name: '台次', color: '#8b5cf6' }] }))}
  </div>`;

  h += `<div style="height:14px"></div>`;
  h += card('顾问产能明细', `<table class="tb"><thead><tr>
    <th>服务顾问</th><th class="r">工单数</th><th class="r">台次</th><th class="r">营收(元)</th><th class="r">占比</th>
    <th class="r">毛利(元)</th><th class="r">毛利率</th><th class="r">单车产值</th><th class="r">单单产值</th>
    </tr></thead><tbody>${o.advisors.map(a => `<tr>
      <td class="nm">${E(a.name)}</td>
      <td class="r">${num(a.orders)}</td><td class="r">${num(a.vins)}</td>
      <td class="r">${money(a.revenue)}</td><td class="r">${pct(a.revenue, tot.r)}%</td>
      <td class="r">${money(a.profit)}</td><td class="r">${pct(a.profit, a.revenue)}%</td>
      <td class="r ${a.revenue / a.vins > 4000 ? 'pos' : ''}">${money(a.revenue / a.vins)}</td>
      <td class="r">${money(a.revenue / a.orders)}</td></tr>`).join('')}
    </tbody><tfoot><tr><td>合计 / 平均</td>
      <td class="r">${num(tot.o)}</td><td class="r">${num(tot.v)}</td>
      <td class="r">${money(tot.r)}</td><td class="r">100%</td>
      <td class="r">${money(tot.p)}</td><td class="r">${pct(tot.p, tot.r)}%</td>
      <td class="r">${money(tot.r / tot.v)}</td><td class="r">${money(tot.r / tot.o)}</td></tr></tfoot></table>`,
    D.meta.windowMain);

  h += secTitle('接待管理发现');
  h += `<div>
    <div class="alert high"><div class="alert-ic">!</div><div class="alert-bd"><div class="alert-tx">
      <b>顾问分工严重两极化</b>：吴文诗 380 单 / 颜珍香 372 单 / 马振宇 297 单，属「量型」（单车产值 1,140~1,199 元，做定保与一般维修）；王玉成 56 单 / 赖辉婵 51 单属「值型」（单车产值 5,921 / 5,951 元，专攻事故车）。
      两类顾问不可用同一套考核指标 —— 量型考台次与客户满意度，值型考事故车产值与理赔回款周期。
    </div><div class="alert-mt"><a data-jump="adm.efficiency">查看人均效能 →</a></div></div></div>
    <div class="alert mid"><div class="alert-ic">·</div><div class="alert-bd"><div class="alert-tx">
      <b>零营收工单需清理</b>：「其他」类 62 单营收 0 元、毛利 -120 元。这类挂单会污染台次与单车产值口径，需服务经理逐单核销（判断是内部车、返修、还是未结算挂账）。
    </div><div class="alert-mt"><a data-jump="service.output">查看产值结构 →</a></div></div></div>
    <div class="alert low"><div class="alert-ic">i</div><div class="alert-bd"><div class="alert-tx">
      <b>接待环节前置数据缺失</b>：当前数据来自结算明细，只能看到「已收银」的工单，看不到<b>预约量、到店未成交、等待时长、客户流失在哪个环节</b>。补齐需 ABS 工单状态视图或前台预约表。
    </div><div class="alert-mt"><a data-jump="datasource">查看接入路线 →</a></div></div></div>
  </div>`;
  return h;
};

/* ---------- 售后毛利管理 ---------- */
VIEWS.serviceMargin = function (m) {
  const o = D.overview;
  const rev = o.categories.reduce((s, x) => s + x.revenue, 0);
  const pft = o.categories.reduce((s, x) => s + x.profit, 0);
  const cats = o.categories.filter(x => x.revenue > 0).map(c => ({ ...c, rate: c.profit / c.revenue * 100 }));
  const mtd = o.months[3], same = o.lastYearSame;
  let h = moduleHero(m);

  h += secTitle('毛利核心指标', o.mtdLabel + ' / ' + D.meta.windowMain);
  h += `<div class="grid g4">
    ${kpiCard({ label: '8月MTD 实际毛利', value: mtd.profit, unit: '元', sub: '日均 ' + money(mtd.profit / mtd.days) + ' 元', trend: (mtd.profit - same.profit) / same.profit * 100, trendNote: '对比7月同期' })}
    ${kpiCard({ label: '8月MTD 毛利率', value: pct(mtd.profit, mtd.revenue), unit: '%', sub: '7月同期 ' + pct(same.profit, same.revenue) + '%', trend: (mtd.profit / mtd.revenue - same.profit / same.revenue) / (same.profit / same.revenue) * 100, trendNote: '毛利率变化' })}
    ${kpiCard({ label: '区间总毛利', value: pft, unit: '元', sub: D.meta.windowMain, trend: null })}
    ${kpiCard({ label: '区间毛利率', value: pct(pft, rev), unit: '%', sub: '营收 ' + wan(rev) + '万', trend: null })}
  </div>`;

  h += secTitle('各业务类别毛利率', '红色为低于 25% 的预警项');
  h += `<div class="grid g23">
    ${card('毛利率排名', CH.hbars(cats.slice().sort((a, b) => b.rate - a.rate), {
      k: 'name', v: 'rate', lw: 76, rh: 34,
      colorBy: d => d.rate < 25 ? '#d92c2c' : d.rate < 40 ? '#e8890c' : '#00a870',
      fmt: d => d.rate.toFixed(1) + '%'
    }), '按毛利率降序')}
    ${card('毛利额贡献', CH.donut(cats.filter(c => c.profit > 0), { k: 'name', v: 'profit', size: 210, center: CH.fmtK(pft), centerSub: '总毛利(元)' }))}
  </div>`;

  h += `<div style="height:14px"></div>`;
  h += card('毛利明细对照', `<table class="tb"><thead><tr>
    <th>业务类别</th><th class="r">工单数</th><th class="r">营收(元)</th><th class="r">毛利(元)</th>
    <th class="r">毛利率</th><th class="r">毛利占比</th><th class="r">单单毛利</th><th>健康度</th>
    </tr></thead><tbody>${cats.slice().sort((a, b) => b.profit - a.profit).map(c => {
      const ok = c.rate >= 40, warn = c.rate >= 25 && c.rate < 40;
      return `<tr><td class="nm">${E(c.name)}</td>
        <td class="r">${num(c.orders)}</td><td class="r">${money(c.revenue)}</td>
        <td class="r">${money(c.profit)}</td>
        <td class="r ${c.rate < 25 ? 'neg' : ok ? 'pos' : ''}">${c.rate.toFixed(1)}%</td>
        <td class="r">${pct(c.profit, pft)}%</td>
        <td class="r">${money(c.profit / c.orders)}</td>
        <td><span class="bdg ${ok ? 'live' : warn ? 'partial' : 'pending_auth'}">${ok ? '健康' : warn ? '偏低' : '预警'}</span></td></tr>`;
    }).join('')}</tbody><tfoot><tr><td>合计</td>
      <td class="r">${num(cats.reduce((s, x) => s + x.orders, 0))}</td>
      <td class="r">${money(rev)}</td><td class="r">${money(pft)}</td>
      <td class="r">${pct(pft, rev)}%</td><td class="r">100%</td><td class="r">—</td><td>—</td></tr></tfoot></table>`,
    D.meta.windowMain);

  h += secTitle('车系毛利率对比');
  h += card('车系毛利明细', `<table class="tb"><thead><tr>
    <th>车系</th><th class="r">台次</th><th class="r">营收(元)</th><th class="r">毛利(元)</th><th class="r">毛利率</th><th class="r">单车毛利</th><th style="width:110px">毛利率水位</th>
    </tr></thead><tbody>${o.series.slice().sort((a, b) => (b.profit / b.revenue) - (a.profit / a.revenue)).map(s => {
      const r = s.profit / s.revenue * 100;
      return `<tr><td class="nm">${E(s.name)}</td>
        <td class="r">${num(s.vins)}</td><td class="r">${money(s.revenue)}</td>
        <td class="r">${money(s.profit)}</td>
        <td class="r ${r >= 50 ? 'pos' : r < 42 ? 'neg' : ''}">${r.toFixed(1)}%</td>
        <td class="r">${money(s.profit / s.vins)}</td>
        <td><div class="mini-bar"><i style="width:${r}%;background:${r >= 50 ? '#00a870' : r < 42 ? '#d92c2c' : '#1e5eff'}"></i></div></td></tr>`;
    }).join('')}</tbody></table>`, '按毛利率降序 · ' + D.meta.windowMain);

  h += secTitle('毛利改善重点');
  h += `<div>
    <div class="alert high"><div class="alert-ic">!</div><div class="alert-bd"><div class="alert-tx">
      <b>原厂索赔毛利率仅 17.8%，是全店最大失血点</b>：155 单、营收 15.5 万、毛利仅 2.76 万，单单毛利 178 元。而全店平均毛利率 46.6%。
      索赔业务毛利低有其行业属性（厂家核定工时与配件价格），但 17.8% 明显低于正常水位（通常 25%~35%）。
      核查方向：① 索赔工时是否按厂家标准工时足额申报；② 配件加价率是否被压；③「索赔差异」字段是否存在大量核减未追回；④ 是否有索赔单被误挂成本。
    </div><div class="alert-mt"><a data-jump="fin.cash">关联资金管理（索赔应收） →</a></div></div></div>
    <div class="alert good"><div class="alert-ic">✓</div><div class="alert-bd"><div class="alert-tx">
      <b>定保维修毛利率 62.2% 表现优秀</b>：492 单贡献 24.3 万毛利，是毛利额第一来源（占 45.6%）。定保是最健康的业务结构，应作为保客招揽的主推项。
    </div><div class="alert-mt"><a data-jump="cs.campaign">前往招揽活动 →</a></div></div></div>
    <div class="alert mid"><div class="alert-ic">·</div><div class="alert-bd"><div class="alert-tx">
      <b>事故维修毛利率 42.1% 偏低于一般维修</b>：一般维修 62.1%、定保 62.2%，而事故维修仅 42.1%。事故车外包（钣喷外协）与配件成本高是主因，需核对外包成本占比与钣喷产能自给率。
    </div><div class="alert-mt"><a data-jump="service.insurance">前往保险车辆管理 →</a></div></div></div>
  </div>`;
  return h;
};

/* ---------- 服务顾问战力表 ---------- */
VIEWS.serviceAdvisor = function (m) {
  const o = D.overview;
  const advs = (o.advisors || []).slice();
  const tot = advs.reduce((a, x) => ({ o: a.o + (x.orders || 0), v: a.v + (x.vins || 0), r: a.r + (x.revenue || 0), p: a.p + (x.profit || 0) }), { o: 0, v: 0, r: 0, p: 0 });

  /* 战力指数：对 营收/毛利/工单/台次 做 0-100 归一化后加权（40/30/20/10） */
  const max = k => Math.max.apply(null, advs.map(a => a[k] || 0));
  const min = k => Math.min.apply(null, advs.map(a => a[k] || 0));
  const norm = (v, k) => { const mx = max(k), mn = min(k); return mx === mn ? 100 : (v - mn) / (mx - mn) * 100; };
  const scored = advs.map(a => {
    const score = Math.round(
      norm(a.revenue, 'revenue') * 0.4 +
      norm(a.profit, 'profit') * 0.3 +
      norm(a.orders, 'orders') * 0.2 +
      norm(a.vins, 'vins') * 0.1
    );
    const perCar = a.vins ? a.revenue / a.vins : 0;
    const layer = perCar >= 4000 ? '值型' : '量型';
    return Object.assign({}, a, { score, perCar, margin: a.revenue ? a.profit / a.revenue : 0, layer });
  }).sort((a, b) => b.score - a.score);

  let h = moduleHero(m);

  h += secTitle('战力核心指标', o.mtdLabel + ' · 数据源 dbo.V_R_Service_25（已授权）');
  h += `<div class="grid g4">
    ${kpiCard({ label: '在岗结算顾问', value: scored.length, unit: '人', status: 'live' })}
    ${kpiCard({ label: '总工单数', value: tot.o, unit: '单', status: 'live' })}
    ${kpiCard({ label: '总营收', value: Math.round(tot.r), unit: '元', status: 'live' })}
    ${kpiCard({ label: '总毛利', value: Math.round(tot.p), unit: '元', status: 'live' })}
  </div>`;

  h += secTitle('服务顾问战力榜（按战力指数排名）', D.meta.windowMain + ' · 真实 ABS 数据');
  h += `<div class="grid g23">
    ${card('战力指数排名', CH.hbars(scored, { k: 'name', v: 'score', lw: 66, rh: 40, fmt: d => d.score + ' 分' }))}
    ${card('营收排名', CH.hbars(advs.slice().sort((a, b) => b.revenue - a.revenue), { k: 'name', v: 'revenue', lw: 66, rh: 40, fmt: d => (d.revenue / 1e4).toFixed(1) + '万' }))}
  </div>`;

  h += `<div style="height:14px"></div>`;
  h += card('战力明细（排名 · 量/值分层 · 综合指数）', `<table class="tb"><thead><tr>
    <th>排名</th><th>服务顾问</th><th class="r">工单</th><th class="r">台次</th>
    <th class="r">营收(元)</th><th class="r">占比</th><th class="r">毛利(元)</th>
    <th class="r">毛利率</th><th class="r">单车产值</th><th class="r">战力指数</th><th>分层</th>
    </tr></thead><tbody>${scored.map((a, i) => `<tr>
      <td class="r">${i + 1}</td>
      <td class="nm">${E(a.name)}</td>
      <td class="r">${num(a.orders)}</td><td class="r">${num(a.vins)}</td>
      <td class="r">${money(a.revenue)}</td><td class="r">${pct(a.revenue, tot.r)}%</td>
      <td class="r">${money(a.profit)}</td><td class="r">${pct(a.profit, a.revenue)}%</td>
      <td class="r ${a.perCar > 4000 ? 'pos' : ''}">${money(a.perCar)}</td>
      <td class="r"><b>${a.score}</b></td>
      <td><span class="chip ${a.layer === '值型' ? 'warn' : ''}">${a.layer}</span></td>
    </tr>`).join('')}
    </tbody><tfoot><tr><td colspan="2">合计 / 平均</td>
      <td class="r">${num(tot.o)}</td><td class="r">${num(tot.v)}</td>
      <td class="r">${money(tot.r)}</td><td class="r">100%</td>
      <td class="r">${money(tot.p)}</td><td class="r">${pct(tot.p, tot.r)}%</td>
      <td class="r">${money(tot.r / tot.v)}</td><td class="r">—</td><td>—</td>
    </tr></tfoot></table>`,
    D.meta.windowMain);

  h += secTitle('战力结构判断');
  h += `<div>
    <div class="alert mid"><div class="alert-ic">·</div><div class="alert-bd"><div class="alert-tx">
      <b>量型 vs 值型两极化</b>：单车产值 ≥4000 元归「值型」（主攻事故车/高单价，台次少但产值高），＜4000 元归「量型」（主攻定保/一般维修，台次多）。两类顾问考核口径应拆分——量型看台次与客户满意度，值型看事故车产值与理赔回款周期。
    </div><div class="alert-mt"><a data-jump="adm.efficiency">查看人均效能 →</a></div></div></div>
    <div class="alert low"><div class="alert-ic">i</div><div class="alert-bd"><div class="alert-tx">
      <b>战力指数口径</b>：对营收(40%)、毛利(30%)、工单(20%)、台次(10%) 做归一化加权，仅用于在岗顾问间横向比较，不代表绝对产能高低；事故车占比高的顾问指数天然偏低，需结合「值型」标签解读。
    </div><div class="alert-mt"><a data-jump="datasource">查看接入路线 →</a></div></div></div>
  </div>`;
  return h;
};
