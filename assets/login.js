/* 登录门脚本：同时服务 登录页(login.html) 与 应用页(index.html)
 * 三种运行环境：
 *  1) 服务端鉴权（内网 Node server.js）：/api/config 返回 ok -> 走服务端访问码/企微登录
 *  2) 纯静态托管 + 配置了演示口令（如 CloudStudio 公网）：非 localhost -> 显示演示口令软屏障
 *  3) 本地开发（localhost / 127.0.0.1，无服务端）：直接放行，不阻塞
 */
(function () {
  'use strict';

  function api(path, opts) {
    return fetch(path, Object.assign({ credentials: 'same-origin' }, opts))
      .catch(() => null);
  }

  function isLocalhost() {
    var h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '::1';
  }

  // 渲染服务端登录表单到容器
  function mountServerForm(container, opts) {
    var wecom = opts.wecom, corpid = opts.corpid;
    if (wecom) {
      var ru = encodeURIComponent(location.origin + '/api/wecom/callback');
      var href = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + corpid +
        '&redirect_uri=' + ru + '&response_type=code&scope=snsapi_base&state=1#wechat_redirect';
      container.innerHTML = '<a class="lg-btn primary" href="' + href + '">使用企业微信登录</a>';
    } else {
      container.innerHTML =
        '<input id="lgCode" class="lg-input" type="password" placeholder="请输入访问码" autofocus>' +
        '<button id="lgSubmit" class="lg-btn primary">进入工作台</button>' +
        '<p id="lgErr" class="lg-err"></p>';
      var submit = function () {
        var code = document.getElementById('lgCode').value.trim();
        api('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code })
        }).then(function (r) {
          if (r && r.ok) location.href = '/';
          else document.getElementById('lgErr').textContent =
            (r && r.status === 403) ? '访问码错误' : '登录失败，请重试';
        });
      };
      document.getElementById('lgSubmit').onclick = submit;
      document.getElementById('lgCode').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submit();
      });
    }
  }

  // 演示口令软屏障；onSuccess 在通过或无需口令时调用
  function passcodeGate(container, onSuccess) {
    var cfg = window.__DEPLOY__ || {};
    var pc = cfg.passcode;
    if (!pc) { onSuccess(); return; }
    if (sessionStorage.getItem('demo_ok') === pc) { onSuccess(); return; }
    container.innerHTML =
      '<input id="lgCode" class="lg-input" type="password" placeholder="' + (cfg.label || '演示口令') + '" autofocus>' +
      '<button id="lgSubmit" class="lg-btn primary">进入工作台</button>' +
      '<p id="lgErr" class="lg-err"></p>';
    var submit = function () {
      var v = document.getElementById('lgCode').value.trim();
      if (v === pc) { sessionStorage.setItem('demo_ok', pc); onSuccess(); }
      else document.getElementById('lgErr').textContent = '口令错误';
    };
    document.getElementById('lgSubmit').onclick = submit;
    document.getElementById('lgCode').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });
  }

  function buildOverlayShell() {
    var gate = document.getElementById('loginGate');
    if (!gate) {
      gate = document.createElement('div');
      gate.id = 'loginGate';
      gate.innerHTML = '<div class="lg-card"><div class="lg-logo">辉达</div>' +
        '<h1>全店运营管理工作台</h1>' +
        '<p class="lg-sub">惠州市辉达惠瑞汽车有限公司 · 管理层入口</p>' +
        '<div id="lgForm"></div>' +
        '<p class="lg-foot">仅限授权管理层访问 · 数据保密</p></div>';
      document.body.appendChild(gate);
    }
    return gate.querySelector('#lgForm');
  }

  function removeOverlay() {
    var g = document.getElementById('loginGate');
    if (g) g.remove();
  }

  function injectAppBar(user, mode) {
    var box = document.getElementById('topInfo');
    if (!box || box.querySelector('.lg-out')) return;
    var who = document.createElement('span');
    who.className = 'lg-who';
    who.textContent = (mode === 'wecom' ? '企微·' : '') + user;
    var out = document.createElement('a');
    out.className = 'lg-out';
    out.textContent = '退出';
    out.href = '/api/logout';
    box.appendChild(who);
    box.appendChild(out);
  }

  var isLoginPage = !!document.getElementById('lgForm') && !document.getElementById('topInfo');

  function initLoginPage() {
    fetch('/api/config', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) {
        if (c && (c.wecom || c.corpid || c.serverMode)) {
          mountServerForm(document.getElementById('lgForm'), { wecom: c.wecom, corpid: c.corpid, serverMode: c.serverMode });
        } else if (!isLocalhost() && window.__DEPLOY__ && window.__DEPLOY__.passcode) {
          passcodeGate(document.getElementById('lgForm'), function () { location.href = '/'; });
        } else {
          // 本地静态无口令：直接进入（仅本地开发用）
          location.href = '/';
        }
      })
      .catch(function () {
        if (!isLocalhost() && window.__DEPLOY__ && window.__DEPLOY__.passcode) {
          passcodeGate(document.getElementById('lgForm'), function () { location.href = '/'; });
        } else {
          location.href = '/';
        }
      });
  }

  function initAppGate() {
    api('/api/config').then(function (cfgRes) {
      if (cfgRes && cfgRes.ok) {
        // 服务端鉴权模式
        api('/api/me').then(function (me) {
          if (me && me.ok) {
            me.json().then(function (d) { injectAppBar(d.user, d.mode); });
            return;
          }
          api('/api/config').then(function (cRes) {
            var wecom = false, corpid = '';
            if (cRes && cRes.ok) cRes.json().then(function (c) { wecom = c.wecom; corpid = c.corpid; });
            mountServerForm(buildOverlayShell(), { wecom: wecom, corpid: corpid });
          });
        });
        return;
      }
      // 纯静态 / 本地开发模式
      if (isLocalhost()) return; // 本地开发直接放行
      if (window.__DEPLOY__ && window.__DEPLOY__.passcode) {
        passcodeGate(buildOverlayShell(), removeOverlay);
      }
    });
  }

  if (isLoginPage) initLoginPage();
  else initAppGate();
})();
