/* 销售板块视图：销售顾问战力表（pending_auth，名单真实、数值待 ABS） */
VIEWS.salesAdvisor = function (m) {
  const org = (D.orgLoop && D.orgLoop.org) || {};
  const members = org.members || [];
  const advisors = members.filter(x => x.dept === 'sales').map(x => ({ name: x.name, sub: x.sub || '' }));
  const imported = !!org.imported;
  const st = effStatus(m.status, m.key);
  let h = moduleHero(m);

  h += secTitle('战力核心指标（待接通）', 'ABS 新车视图 dbo.V_UC_NewCar 授权后自动填充真实战力');
  h += `<div class="grid g4">
    ${kpiCard({ label: '在册销售顾问', value: advisors.length, unit: '人', status: st })}
    ${kpiCard({ label: '接待批次', value: null, unit: '批', status: st })}
    ${kpiCard({ label: '订单数', value: null, unit: '单', status: st })}
    ${kpiCard({ label: '总营收', value: null, unit: '元', status: st })}
  </div>`;

  h += note('当前为 <b>待接通</b> 态：销售顾问名单取自已导入花名册（真实），但战力数值（接待批次 / 线索转化 / 订单 / 营收 / 单车毛利 / 战败率）需 ABS 新车视图 V_UC_NewCar 授权后由 refresh_cockpit.js 自动汇总填充并翻 live。绝不以模拟值填充。', 'warn');

  h += secTitle('销售顾问战力表（真实名单 · 数值待 ABS）', imported ? ('名单来源：' + E(org.source || '导入花名册')) : '名单来源：待导入店面人员');
  h += `<div class="card"><div class="card-bd" style="padding:0;overflow:auto"><table class="tb"><thead><tr>
    <th>排名</th><th>销售顾问</th><th>所属子组</th><th class="r">接待批次</th>
    <th class="r">线索转化率</th><th class="r">订单数</th><th class="r">营收(元)</th>
    <th class="r">单车毛利</th><th class="r">战败率</th><th class="r">战力评分</th>
    </tr></thead><tbody>${
      advisors.length ? advisors.map((a, i) => `<tr>
        <td class="r">${i + 1}</td>
        <td class="nm">${E(a.name)}</td>
        <td>${E(a.sub)}</td>
        <td class="r">待接通</td><td class="r">待接通</td><td class="r">待接通</td>
        <td class="r">待接通</td><td class="r">待接通</td><td class="r">待接通</td><td class="r">待接通</td>
      </tr>`).join('') : `<tr><td colspan="10" style="text-align:center;color:var(--ink-3)">尚未导入销售顾问名单，请导入含「销售部」的花名册</td></tr>`
    }</tbody></table></div></div>`;

  h += secTitle('接通后自动出数的指标');
  h += `<div class="note">战力表接通 ABS 后将按月/所选查询区间自动计算并排名：
    <b>① 接待批次与留档率</b>（展厅到店+电销外呼）、<b>② 线索→订单转化率</b>（按渠道拆分）、
    <b>③ 订单数与交车数</b>、<b>④ 营收与单车毛利</b>（成交价−成本）、<b>⑤ 战败率与竞品流向</b>、
    <b>⑥ 战力综合评分</b>（营收/毛利/订单/战败加权）。顾问名单保持真实（来自花名册），仅补数值、不改人名。</div>`;
  return h;
};

/* 销售板块视图：销售库存管理（pending_auth，含「新车存货跌价」设计态，数据源=ABS 接通后实际整车库存跌价数据） */
VIEWS.salesStock = function (m) {
  const st = effStatus(m.status, m.key);
  let h = moduleHero(m);

  /* ---------- 库存核心指标（待接通） ---------- */
  h += secTitle('库存核心指标（待接通）', 'ABS 整车/二手车库存视图授权后自动填充真实库存');
  h += `<div class="grid g4">
    ${kpiCard({ label: '在库台数', value: null, unit: '台', status: st })}
    ${kpiCard({ label: '库存资金占用', value: null, unit: '元', status: st })}
    ${kpiCard({ label: '90天以上滞销车', value: null, unit: '台', status: st })}
    ${kpiCard({ label: '库存周转天数', value: null, unit: '天', status: st })}
  </div>`;
  h += note('当前为 <b>待接通</b> 态：库存结构、库龄、资金占用、滞销预警等数值需 ABS 整车/二手车库存视图（V_UC_Stock / V_UC_NewCar）授权后由 refresh_cockpit.js 自动汇总填充并翻 live。绝不以模拟值填充。', 'warn');

  /* ---------- 新车存货跌价（ABS 实际数据） ---------- */
  h += secTitle('新车存货跌价（待 ABS 接通）', '数据源：ABS 接通后的实际整车库存跌价数据，按成本与可变现净值差额计提');
  h += `<div class="grid g4">
    ${kpiCard({ label: '跌价计提总额', value: null, unit: '元', status: st, sub: '成本 vs 可变现净值差额合计' })}
    ${kpiCard({ label: '跌价率', value: null, unit: '%', status: st, sub: '跌价计提 ÷ 库存成本' })}
    ${kpiCard({ label: '跌价涉及台数', value: null, unit: '台', status: st, sub: '可变现净值<成本车辆数' })}
    ${kpiCard({ label: '库龄>90天跌价', value: null, unit: '元', status: st, sub: '长库龄车跌价集中区' })}
  </div>`;
  h += `<div class="note" style="margin-top:10px"><b>口径：</b>新车存货跌价以 ABS 整车库存的<b>实际成本</b>与<b>可变现净值（当前挂牌价−必要销售费用）</b>的差额计提，随库龄与市场价格波动动态调整。接通后自动生成「新车存货跌价计提明细」（按车系/车型/库龄分层），并对库龄超阈值车辆给出跌价预警，经企微推送销售经理与财务。</div>`;
  h += `<div class="card" style="margin-top:12px"><div class="card-bd" style="padding:0">
    <table class="tbl"><thead><tr><th>新车存货跌价明细（接通后呈现）</th><th class="r">成本</th><th class="r">可变现净值</th><th class="r">跌价计提</th><th class="r">库龄</th></tr></thead>
    <tbody><tr><td colspan="5" style="text-align:center;color:var(--ink-3)">尚未接通 ABS 整车库存跌价数据，明细将以真实数据自动填充，不预置模拟值</td></tr></tbody></table>
  </div></div>`;

  /* ---------- 本模块要盯的指标 ---------- */
  if (m.watch) {
    h += secTitle('本模块要盯的指标', '接通后自动出数');
    h += `<div class="watch-list">${m.watch.map((w, i) => `<div class="watch-item"><b>${String(i + 1).padStart(2, '0')}</b><span>${E(w)}</span></div>`).join('')}</div>`;
  }

  /* ---------- 接入所需数据 ---------- */
  if (m.requires) {
    h += secTitle('接入所需数据');
    h += `<div class="grid g2">
      ${card('数据来源', `<div class="kv"><b>系统/来源</b><span>${E(m.requires.source)}</span></div>
        <div class="kv"><b>模块编码</b><span style="font-family:var(--mono)">${E(m.key)}</span></div>`)}
      ${card('必需字段', `<div class="field-chips">${m.requires.fields.map(f =>
        `<span class="fchip${/建议补|待/.test(f) ? ' opt' : ''}">${E(f)}</span>`).join('')}</div>`)}
    </div>`;
  }

  /* ---------- 打通步骤 ---------- */
  if (m.actions) {
    h += secTitle('打通步骤', '按顺序执行即可点亮本模块');
    h += card('落地路径', `<ol class="steps">${m.actions.map(a => `<li>${E(a)}</li>`).join('')}</ol>`);
  }
  return h;
};
