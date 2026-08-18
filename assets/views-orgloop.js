/* 视图渲染层 —— 组织架构管理（行政子菜单） + 闭环看板（独立板块） */

/* ---------- 组织架构管理：行政板块子菜单 ---------- */
VIEWS.adminOrg = function (m) {
  const OL = D.orgLoop, org = loadOrg();
  let h = '';

  /* 导语 + 导入 */
  h += `<div class="gm-hero" style="background:linear-gradient(120deg,#0b2545,#134e4a 60%,#0e7490)">
    <div class="gm-hero-ic" style="color:#5eead4;background:rgba(94,234,212,.14)">${ICONS.users}</div>
    <div>
      <div class="gm-hero-t">组织架构管理 ${bdg(effStatus(m.status, m.key))}</div>
      <div class="gm-hero-s">${E(OL.clarityNote)}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" data-org-import>导入真实组织架构</button>
        <button class="btn ghost" data-org-reset>恢复示例</button>
        <span class="chip ${org.imported ? 'ok' : ''}" style="align-self:center">${org.imported ? '已导入 · ' + (org.importedAt || '').slice(0, 10) : '当前：示例架构'}</span>
      </div>
    </div></div>`;

  /* 企业微信关联状态条 */
  const w = org.wecom || {};
  h += `<div class="wecom-bar ${w.linked ? 'on' : 'off'}">
    <span class="wb-ic">${ICONS.plug}</span>
    <div><b>企业微信关联：</b>${E(w.corp || '—')} / ${E(w.dept || '—')}
      ${w.linked ? '<span class="chip ok">已连通 · 真实架构</span>' : '<span class="chip warn">待接通</span>'}
      ${w.linked ? '' : '<div class="wb-err">' + E(w.linkError || '企业微信机器人未授权通讯录权限') + '</div>'}
      <div class="wb-hint">→ 管理后台导出通讯录 CSV，运行 scripts/import_org_csv.py 自动填充部门与人员</div>
    </div></div>`;

  /* 组织架构树 */
  h += secTitle('组织架构（按部门职责）', '导入后责任人与闭环任务自动按此实例化');
  const root = org.departments.find(d => !d.parent);
  h += `<div class="org-tree">
    <div class="org-root">${E(root.name)}<small>${E(root.lead)}</small></div>
    <div class="org-depts">${org.departments.filter(d => d.parent).map(d => `
      <div class="org-card">
        <div class="org-card-hd">${E(d.name)}<small>${E(d.lead)}</small></div>
        <div class="org-duties">${d.duties.map(x => `<span class="fchip">${E(x)}</span>`).join('')}</div>
      </div>`).join('')}    </div></div>`;

  /* 人员清单（已导入真实花名册） */
  const ms = org.members || [];
  h += secTitle('店面人员清单（已导入 ' + ms.length + ' 人）', '来源：' + E(org.source || '花名册') + ' · 按部门/子组归责，为任务提醒与数据采集做参考');
  h += `<div class="card"><div class="card-bd" style="padding:0;overflow:auto">
    <table class="tbl">
      <thead><tr><th>部门</th><th>人数</th><th>人员（姓名 · 子组 · 入职日期）</th></tr></thead>
      <tbody>${org.departments.map(d => {
        const list = ms.filter(x => x.dept === d.id);
        if (!list.length) return `<tr><td><b>${E(d.name)}</b></td><td>0</td><td class="muted">— 花名册未含 —</td></tr>`;
        const chips = list.map(x => `<span class="fchip">${E(x.name)}${x.sub ? ' · ' + E(x.sub) : ''}${x.hire ? ' · ' + E(x.hire) : ''}</span>`).join(' ');
        return `<tr><td><b>${E(d.name)}</b></td><td>${list.length}</td><td style="line-height:2.0">${chips}</td></tr>`;
      }).join('')}</tbody>
    </table></div></div>`;
  h += `<div class="note" style="margin-top:10px">说明：花名册仅含「部门 / 子组 / 姓名 / 入职日期」，无职位与手机号，故责任部门负责人暂以岗位角色（销售经理 / 服务经理…）表示。补充含「职位 / 手机号」的花名册后，可将闭环任务与提醒精确指派到具体人员，并启用企业微信按人推送。</div>`;

  /* 部门职责矩阵 */
  h += secTitle('部门职责矩阵', '每一块业务 → 责任部门 + 责任人 + SLA');
  h += `<div class="card"><div class="card-bd" style="padding:0;overflow:auto">
    <table class="tbl">
      <thead><tr><th>业务/指标</th><th>关联工作流</th><th>责任部门</th><th>责任人</th><th>SLA</th></tr></thead>
      <tbody>${OL.dutyMatrix.map(r => `<tr>
        <td>${E(r.scope)}</td><td><span class="wf-id">${E(r.wf)}</span></td>
        <td>${E(deptName(r.dept))}</td><td>${E(r.owner)}</td><td>${E(r.sla)}</td></tr>`).join('')}</tbody>
    </table></div></div>`;

  /* 板块 ↔ 责任部门（导入组织架构后自动对应，为任务提醒与数据采集做参考） */
  h += secTitle('板块 ↔ 责任部门（自动对应）', '导入店面人员与职位后，按部门归属自动解析责任人与提醒接收人');
  h += `<div class="card"><div class="card-bd" style="padding:0;overflow:auto">
    <table class="tbl">
      <thead><tr><th>业务板块</th><th>责任部门</th><th>责任人</th><th>接通状态</th></tr></thead>
      <tbody>${D.sections.map(s => {
        const d = sectionDeptObj(s.key);
        const liveN = s.items.filter(i => effStatus(i.status, i.key) === 'live').length;
        const tag = liveN === s.items.length ? '<span class="chip ok">已出数</span>'
          : liveN ? '<span class="chip warn">部分出数</span>' : '<span class="chip">待接入</span>';
        return `<tr>
          <td><b>${E(s.name)}</b></td>
          <td>${E(d ? d.name : '—')}</td>
          <td>${E(d ? d.lead : '—')}</td>
          <td>${tag}</td></tr>`;
      }).join('')}</tbody>
    </table></div></div>
    <div class="note" style="margin-top:10px">说明：责任部门与责任人取自已导入的组织架构（企业微信通讯录 / 后台导出 CSV）。你后续导入真实人员与职位后，本表与部门职责矩阵会自动按导入结果更新；闭环任务提醒与数据采集归属均以本表为准。</div>`;

  return h;
};

/* ---------- 闭环看板：独立板块「闭环管理」 ---------- */
VIEWS.loopBoard = function (m) {
  const OL = D.orgLoop, loops = loadLoops();
  const pending = loops.filter(l => l.status !== 'closed').length;
  let h = '';

  h += `<div class="gm-hero" style="background:linear-gradient(120deg,#4c1d95,#7c3aed 55%,#0891b2)">
    <div class="gm-hero-ic" style="color:#ddd6fe;background:rgba(221,214,254,.16)">${ICONS.loop}</div>
    <div>
      <div class="gm-hero-t">闭环看板 ${bdg(effStatus(m.status, m.key))}</div>
      <div class="gm-hero-s">提醒 → 处理 → 提交 → 验证：超时自动升级，提交与验证记录本地持久化，可导出审计，便于监督结果。</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="btn ghost" data-org-export>导出闭环记录</button>
        <span class="chip ${pending ? 'warn' : 'ok'}" style="align-self:center">待办闭环 ${pending} 项</span>
      </div>
    </div></div>`;

  /* 闭环看板 */
  h += secTitle('闭环看板（提醒 → 处理 → 提交 → 验证）', '超时自动升级提示；提交记录本地持久化，可导出审计');
  const cols = ['open', 'handling', 'verifying', 'closed'];
  const colTxt = { open: '待处理', handling: '处理中', verifying: '待验证', closed: '已闭环' };
  h += `<div class="loop-board">${cols.map(c => {
    const list = loops.filter(l => l.status === c);
    return `<div class="loop-col">
      <div class="loop-col-h ${c}">${colTxt[c]}<span class="loop-cnt">${list.length}</span></div>
      ${list.length ? list.map(l => loopCard(l)).join('') : '<div class="loop-empty">—</div>'}
    </div>`;
  }).join('')}</div>`;

  /* 闭环任务模板（自动流实例化来源） */
  h += secTitle('闭环任务模板（接通数据后由自动流实例化）', '对应工作流触发即生成闭环任务并指派责任部门');
  h += `<div class="grid g2">${OL.loops.templates.map(t => `
    <div class="card"><div class="card-bd">
      <div style="font-weight:700;font-size:13.5px;margin-bottom:6px">${E(t.title)}</div>
      <div class="note" style="margin-bottom:8px"><b>触发：</b>${E(t.trigger)}</div>
      <div style="display:flex;gap:10px;font-size:11.5px;color:var(--ink-3)">
        <span>责任：<b style="color:var(--ink-1)">${E(deptName(t.dept))} / ${E(t.owner)}</b></span>
        <span>SLA：<b style="color:var(--ink-1)">${t.slaHours}h</b></span>
      </div>
    </div></div>`).join('')}</div>`;

  /* 提醒机制说明 */
  h += `<div class="note" style="margin-top:14px">提醒机制：当前为<b>离线可视化提醒</b>（超时/临期角标 + 导航待办数）。企微连通后，每条超时/临期闭环任务将通过 <b>wecom-hub</b> 自动推送责任人与部门负责人（pushLoopReminder 已预留钩子，置 <code>window.__WECOM_READY__=true</code> 即启用真实推送）。</div>`;

  return h;
};

function loopCard(l) {
  const rm = loopRemind(l);
  const rmb = rm.level === 'over' ? 'over' : rm.level === 'near' ? 'near' : 'ok';
  const last = l.history[l.history.length - 1];
  let acts = '';
  if (l.status === 'open') acts = `<button class="btn tiny primary" data-loop-act="claim" data-loop-id="${l.id}">认领</button>
    <button class="btn tiny" data-loop-act="submit" data-loop-id="${l.id}">提交闭环</button>`;
  else if (l.status === 'handling') acts = `<button class="btn tiny" data-loop-act="submit" data-loop-id="${l.id}">提交闭环</button>`;
  else if (l.status === 'verifying') acts = `<button class="btn tiny ok" data-loop-act="verify" data-loop-id="${l.id}">验证通过</button>`;
  else acts = `<span class="loop-closed">✓ 已闭环</span>`;
  const upgrade = (rm.level === 'over' && l.status !== 'closed')
    ? `<div class="loop-up">⚠ 已超时，建议升级至 ${E(deptLead(l.dept))}</div>` : '';
  const tplTag = /示例/.test(l.title) ? '<span class="fchip sm">示例</span>' : '';
  return `<div class="loop-card ${l.status}">
    <div class="loop-card-hd">${E(l.title)} ${tplTag}</div>
    <div class="loop-meta"><span>${E(deptName(l.dept))} / ${E(l.owner)}</span><span class="loop-rm ${rmb}">${rm.txt}</span></div>
    <div class="loop-trg">${E(l.trigger)}</div>
    ${last ? `<div class="loop-last">最近：${E(last.act === 'claim' ? '认领' : last.act === 'submit' ? '提交' : last.act === 'verify' ? '验证' : last.act)} · ${E((last.at || '').slice(5, 16))}${last.note ? ' · ' + E(last.note) : ''}</div>` : ''}
    ${upgrade}
    <div class="loop-acts">${acts}</div>
  </div>`;
}
