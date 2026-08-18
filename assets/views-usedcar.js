/* 视图渲染层 —— 二手车业务板块 */
VIEWS.usedCarOverview = function (m) {
  let h = moduleHero(m);

  h += `<div class="pend-hero" style="border-left:3px solid var(--pend)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
      <b style="font-size:16px">${E(m.title)}</b>${bdg(m.status)}</div>
    <p>本模块数据来自 ABS 二手车三视图（V_UC_Stock / V_UC_Sale / V_UC_Purchase），当前待授权。授权后自动填充下方「数量 / 销售额 / 毛利」三大核心指标，并联动评估 / 收购 / 出库三条明细。</p>
  </div>`;

  h += secTitle('二手车概况（含数量 / 销售额 / 毛利）', 'ABS 三视图授权后自动填充');
  const kpis = [
    { label: '交易量', value: null, unit: '台', status: 'pending_auth', sub: '评估 / 收购 / 出库台次' },
    { label: '销售额', value: null, unit: '元', status: 'pending_auth', sub: 'V_UC_Sale 成交价汇总' },
    { label: '毛利', value: null, unit: '元', status: 'pending_auth', sub: '成交价 − 收购价 − 费用' }
  ];
  h += `<div class="kpi-grid">${kpis.map(kpiCard).join('')}</div>`;

  h += secTitle('三条明细线（待 ABS 授权）', '各自点亮后提供逐单真数');
  h += `<div class="grid g3">${[
    ['二手车评估明细', '逐单评估价 / 车况 / 评估师 / 是否收购', 'V_UC_Purchase'],
    ['二手车收购明细', '逐单收购价 / 渠道 / 整备成本 / 在库状态', 'V_UC_Purchase + V_UC_Stock'],
    ['二手车出库明细', '逐单成交价 / 毛利 / 置换 / 金融渗透', 'V_UC_Sale']
  ].map(([t, d, src]) => card(t,
    `<div class="note" style="margin-bottom:8px">${E(d)}</div>
     <div class="kv"><b>数据源</b><span style="font-family:var(--mono)">${E(src)}</span></div>
     <div style="margin-top:8px"><span class="bdg pending_auth">待 ABS 授权</span></div>`
  )).join('')}</div>`;

  h += `<div class="note" style="margin-top:14px">数据采集参考：库存超 <b>45 天</b>、单车毛利低于阈值将自动生成闭环任务（T-uc-stock / T-uc-margin），责任部门为「二手车部」，由企业微信关联的真实责任人接收提醒。</div>`;

  return h;
};
