/* 渲染自检：在 Node 中 mock 最小 DOM，逐个渲染 26 个模块页，捕获运行时错误 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

const els = {};
const mkEl = id => (els[id] = els[id] || { id, innerHTML: '', classList: { add(){}, remove(){}, toggle(){} }, dataset: {}, set onclick(f){} });
const sandbox = {
  console,
  document: {
    getElementById: mkEl,
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  window: { addEventListener: () => {}, scrollTo: () => {} },
  location: { hash: '' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  Date, JSON, Object, Array, Math, FileReader: function(){}, Blob: function(){}, URL: { createObjectURL: () => '' }
};
sandbox.window.document = sandbox.document;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

const files = [
  'data/data.js', 'data/autoflows.js', 'data/modules-sales-service.js', 'data/modules-mkt-cs.js', 'data/modules-adm-fin.js', 'data/modules-usedcar.js',
  'assets/chart.js', 'assets/app.js', 'assets/views.js',
  'assets/views-service.js', 'assets/views-sales.js', 'assets/views-cs.js', 'assets/views-mixed.js',
  'assets/views-gmbrain.js', 'assets/views-orgloop.js', 'assets/views-autoflow.js', 'assets/views-usedcar.js'
];
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('✗ 加载失败 ' + f + ': ' + e.message); process.exit(1); }
}

/* VIEWS 是 views.js 顶层的 const，挂在 vm context 的词法作用域里（不是 sandbox 的属性），
   必须用 runInContext 求值取回；D/M 挂在 window 上，可直接取。 */
const D = sandbox.window.__COCKPIT__, M = sandbox.window.__MODULES__, V = vm.runInContext('VIEWS', ctx);
let pass = 0, fail = 0, warn = [];

/* 1. 结构完整性 */
const navKeys = D.sections.flatMap(s => s.items.map(i => i.key));
console.log('板块数: ' + D.sections.length + ' / 子模块数: ' + navKeys.length);
navKeys.forEach(k => { if (!M[k]) { console.log('✗ 导航项 ' + k + ' 缺少模块定义'); fail++; } });

/* 2. 状态一致性：导航有效状态须与模块有效状态一致
 * （生效状态需考虑 data.js 的 moduleStatusOverride，拉数点亮后 nav 与模块都走 override） */
const eff = (key, fallback) => (D.moduleStatusOverride && D.moduleStatusOverride[key]) || fallback;
D.sections.forEach(s => s.items.forEach(i => {
  const navS = eff(i.key, i.status);
  const modS = eff(i.key, M[i.key] ? M[i.key].status : i.status);
  if (navS !== modS)
    warn.push('状态不一致 ' + i.key + ': nav=' + navS + ' vs module=' + modS);
}));

/* 3. 逐个渲染 */
const render = (name, fn) => {
  try {
    const html = fn();
    if (!html || html.length < 200) { console.log('✗ ' + name + ' 输出过短 (' + (html || '').length + ')'); fail++; return; }
    if (/undefined|NaN|\[object Object\]/.test(html)) {
      const m = html.match(/.{0,60}(undefined|NaN|\[object Object\]).{0,60}/);
      console.log('✗ ' + name + ' 含异常值: ...' + m[0].replace(/\s+/g, ' ') + '...');
      fail++; return;
    }
    pass++;
  } catch (e) { console.log('✗ ' + name + ' 渲染异常: ' + e.message); fail++; }
};

render('overview 总览驾驶舱', () => V.overview());
render('gmbrain 总经理大脑', () => V.gmBrain());
render('adm.staff 全店人员信息管理', () => V.adminStaff(M['adm.staff']));
render('adm.org 组织架构管理', () => V.adminOrg(M['adm.org']));
render('loop.board 闭环看板', () => V.loopBoard(M['loop.board']));
render('loop.today 今日必办聚合', () => V.urgentBoard(M['loop.today']));
render('datasource 数据接入状态', () => V.datasource());
navKeys.forEach(k => {
  const m = M[k];
  render(k + ' ' + m.title, () => (m.render && V[m.render]) ? V[m.render](m) : V.pending(m, k));
});
render('footer', () => V.footer());

/* 4. live 分支冒烟：在内存中注入 mock serviceStatus 再渲染两个目标模块
 * （不写入文件，仅验证"拉数即点亮"后的渲染不报错、无异常值） */
D.serviceStatus = {
  status: 'live', asOf: '2026-08-13',
  inRepair: {
    total: 9, overdue: { d15: 3, d30: 1, d60: 0 },
    byNode: [
      { node: '维修中', cnt: 5, avgStayDays: 8.3 },
      { node: '等配件', cnt: 4, avgStayDays: 21.5 }
    ],
    topStuck: [
      { order_no: 'G2026X001', vin: 'L6T7X', node: '等配件', stayDays: 42, estRepair: 5800, unpaid: 3000, reason: '等配件' }
    ]
  },
  insurance: {
    openTotal: 7, byNode: [ { node: '理赔回款中', cnt: 5 } ],
    assessAmt: 42000, received: 15000, estRepair: 58000, unpaid: 43000,
    claimAging: [
      { bucket: '30天内', cnt: 3 }, { bucket: '30-60天', cnt: 2 },
      { bucket: '60-90天', cnt: 1 }, { bucket: '90天+', cnt: 0 }
    ]
  },
  alerts: []
};
render('serviceInsurance LIVE', () => V.serviceInsurance(M['service.insurance']));
render('finRisk LIVE', () => V.finRisk(M['fin.risk']));

console.log('\n渲染通过: ' + pass + ' / 失败: ' + fail);
if (warn.length) { console.log('\n警告:'); warn.forEach(w => console.log('  ! ' + w)); }

/* 4. 数据校验：真数一致性 */
const o = D.overview;
const catRev = o.categories.reduce((s, x) => s + x.revenue, 0);
const advRev = o.advisors.reduce((s, x) => s + x.revenue, 0);
const serRev = o.series.reduce((s, x) => s + x.revenue, 0);
console.log('\n真数交叉校验（同窗口 7/1-8/13，三种维度求和应一致）:');
console.log('  业务类别合计: ' + catRev.toFixed(2));
console.log('  服务顾问合计: ' + advRev.toFixed(2));
console.log('  车系合计:     ' + serRev.toFixed(2));
const dev = (Math.max(catRev, advRev, serRev) - Math.min(catRev, advRev, serRev)) / catRev * 100;
console.log('  最大偏差: ' + dev.toFixed(3) + '%' + (dev < 0.5 ? '  ✓ 一致' : '  ! 需核查'));

const monRev = o.months[2].revenue + o.months[3].revenue;
const monDev = Math.abs(monRev - catRev);
console.log('  7月全月+8月MTD: ' + monRev.toFixed(2) + '（与上面三项同窗口，应相等）' + (monDev < 1 ? ' ✓ 一致' : ' ! 不一致 偏差 ' + monDev.toFixed(2)));

process.exit(fail ? 1 : 0);
