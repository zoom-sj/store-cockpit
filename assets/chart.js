/* 轻量 SVG 图表引擎 —— 零依赖，离线可用 */
const CH = (() => {
  const PAL = ['#1e5eff','#00a870','#ff6a00','#8b5cf6','#0891b2','#d4a017','#e8890c','#d92c2c',
               '#5b8def','#2bb673','#ffa04d','#a78bfa','#22d3ee','#eab308','#f97316'];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmtK = v => {
    const a = Math.abs(v);
    if (a >= 1e8) return (v / 1e8).toFixed(2) + '亿';
    if (a >= 1e4) return (v / 1e4).toFixed(1) + '万';
    if (a >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    return Math.round(v).toString();
  };
  const nice = m => {
    if (m <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(m)));
    const r = m / p;
    return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * p;
  };

  /* 多系列折线/面积图 */
  function line(data, opts = {}) {
    const W = opts.w || 700, H = opts.h || 250;
    const P = { t: 18, r: 16, b: 30, l: 52 };
    const iw = W - P.l - P.r, ih = H - P.t - P.b;
    const series = opts.series || [];
    const labels = data.map(d => d[opts.x]);
    let max = 0;
    series.forEach(s => data.forEach(d => { if (+d[s.key] > max) max = +d[s.key]; }));
    max = nice(max * 1.12) || 1;
    const px = i => P.l + (data.length === 1 ? iw / 2 : i * iw / (data.length - 1));
    const py = v => P.t + ih - (v / max) * ih;

    let g = '';
    for (let i = 0; i <= 4; i++) {
      const y = P.t + ih - i * ih / 4, v = max * i / 4;
      g += `<line x1="${P.l}" y1="${y.toFixed(1)}" x2="${W - P.r}" y2="${y.toFixed(1)}" stroke="#eef1f6" stroke-width="1"/>`;
      g += `<text x="${P.l - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="10.5" fill="#8794ab">${fmtK(v)}</text>`;
    }
    const step = Math.ceil(data.length / 9);
    labels.forEach((l, i) => {
      if (i % step === 0 || i === data.length - 1)
        g += `<text x="${px(i).toFixed(1)}" y="${H - 9}" text-anchor="middle" font-size="10.5" fill="#8794ab">${esc(l)}</text>`;
    });

    series.forEach((s, si) => {
      const c = s.color || PAL[si % PAL.length];
      const pts = data.map((d, i) => `${px(i).toFixed(1)},${py(+d[s.key]).toFixed(1)}`).join(' ');
      if (s.area) {
        g += `<defs><linearGradient id="ag${si}${opts.id||''}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${c}" stop-opacity=".22"/><stop offset="1" stop-color="${c}" stop-opacity="0"/>
        </linearGradient></defs>`;
        g += `<polygon points="${P.l},${P.t + ih} ${pts} ${W - P.r},${P.t + ih}" fill="url(#ag${si}${opts.id||''})"/>`;
      }
      g += `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
      data.forEach((d, i) => {
        g += `<circle cx="${px(i).toFixed(1)}" cy="${py(+d[s.key]).toFixed(1)}" r="3.2" fill="#fff" stroke="${c}" stroke-width="2"><title>${esc(labels[i])} · ${esc(s.name)}: ${(+d[s.key]).toLocaleString()}</title></circle>`;
      });
    });
    const lg = series.map((s, i) => `<span><i style="background:${s.color || PAL[i % PAL.length]}"></i>${esc(s.name)}</span>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${g}</svg><div class="lg">${lg}</div>`;
  }

  /* 分组柱状图 */
  function bars(data, opts = {}) {
    const W = opts.w || 700, H = opts.h || 250;
    const P = { t: 18, r: 16, b: 30, l: 52 };
    const iw = W - P.l - P.r, ih = H - P.t - P.b;
    const series = opts.series || [];
    let max = 0;
    series.forEach(s => data.forEach(d => { if (+d[s.key] > max) max = +d[s.key]; }));
    max = nice(max * 1.12) || 1;
    const bw = iw / data.length, gw = bw * .62, sw = gw / series.length;

    let g = '';
    for (let i = 0; i <= 4; i++) {
      const y = P.t + ih - i * ih / 4, v = max * i / 4;
      g += `<line x1="${P.l}" y1="${y.toFixed(1)}" x2="${W - P.r}" y2="${y.toFixed(1)}" stroke="#eef1f6"/>`;
      g += `<text x="${P.l - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="10.5" fill="#8794ab">${fmtK(v)}</text>`;
    }
    data.forEach((d, i) => {
      const cx = P.l + i * bw + bw / 2;
      g += `<text x="${cx.toFixed(1)}" y="${H - 9}" text-anchor="middle" font-size="10.5" fill="#8794ab">${esc(d[opts.x])}</text>`;
      series.forEach((s, si) => {
        const v = +d[s.key], h = Math.max((v / max) * ih, v > 0 ? 1.5 : 0);
        const x = cx - gw / 2 + si * sw, y = P.t + ih - h;
        const c = s.color || PAL[si % PAL.length];
        g += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(sw - 2.5).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${c}" ${d.partial ? 'opacity=".55"' : ''}><title>${esc(d[opts.x])} · ${esc(s.name)}: ${v.toLocaleString()}</title></rect>`;
      });
    });
    const lg = series.map((s, i) => `<span><i style="background:${s.color || PAL[i % PAL.length]}"></i>${esc(s.name)}</span>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${g}</svg><div class="lg">${lg}</div>`;
  }

  /* 横向条形图（排名） */
  function hbars(data, opts = {}) {
    const rows = data.slice(0, opts.top || 12);
    const W = opts.w || 700, rh = opts.rh || 30, lw = opts.lw || 96;
    const H = rows.length * rh + 10;
    const max = Math.max(...rows.map(d => +d[opts.v])) || 1;
    const iw = W - lw - 84;
    let g = '';
    rows.forEach((d, i) => {
      const y = i * rh + 5, v = +d[opts.v];
      const w = Math.max((v / max) * iw, v > 0 ? 2 : 0);
      const c = opts.colorBy ? opts.colorBy(d, i) : PAL[i % PAL.length];
      g += `<text x="${lw - 9}" y="${y + rh / 2 + 4}" text-anchor="end" font-size="11.5" fill="#16202f" font-weight="600">${esc(d[opts.k])}</text>`;
      g += `<rect x="${lw}" y="${y + 6}" width="${iw}" height="${rh - 15}" rx="4" fill="#f2f5fa"/>`;
      g += `<rect x="${lw}" y="${y + 6}" width="${w.toFixed(1)}" height="${rh - 15}" rx="4" fill="${c}"><title>${esc(d[opts.k])}: ${v.toLocaleString()}</title></rect>`;
      g += `<text x="${lw + iw + 8}" y="${y + rh / 2 + 4}" font-size="11.5" fill="#4a5871" font-weight="600">${opts.fmt ? opts.fmt(d) : fmtK(v)}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${g}</svg>`;
  }

  /* 环形图 */
  function donut(data, opts = {}) {
    const size = opts.size || 200, cx = size / 2, cy = size / 2;
    const R = size / 2 - 6, r = R * (opts.inner || .62);
    const total = data.reduce((s, d) => s + +d[opts.v], 0) || 1;
    let a = -Math.PI / 2, g = '';
    data.forEach((d, i) => {
      const v = +d[opts.v]; if (v <= 0) return;
      const ang = v / total * Math.PI * 2, a2 = a + ang;
      const big = ang > Math.PI ? 1 : 0;
      const c = PAL[i % PAL.length];
      const p = [
        `M ${(cx + R * Math.cos(a)).toFixed(2)} ${(cy + R * Math.sin(a)).toFixed(2)}`,
        `A ${R} ${R} 0 ${big} 1 ${(cx + R * Math.cos(a2)).toFixed(2)} ${(cy + R * Math.sin(a2)).toFixed(2)}`,
        `L ${(cx + r * Math.cos(a2)).toFixed(2)} ${(cy + r * Math.sin(a2)).toFixed(2)}`,
        `A ${r} ${r} 0 ${big} 0 ${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)} Z'`
      ].join(' ').replace("Z'", 'Z');
      g += `<path d="${p}" fill="${c}"><title>${esc(d[opts.k])}: ${v.toLocaleString()} (${(v / total * 100).toFixed(1)}%)</title></path>`;
      a = a2;
    });
    if (opts.center)
      g += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="19" font-weight="800" fill="#16202f">${esc(opts.center)}</text>
            <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10.5" fill="#8794ab">${esc(opts.centerSub || '')}</text>`;
    const lg = data.map((d, i) => `<span><i style="background:${PAL[i % PAL.length]}"></i>${esc(d[opts.k])} ${(+d[opts.v] / total * 100).toFixed(1)}%</span>`).join('');
    return `<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      <svg viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px;flex:0 0 ${size}px">${g}</svg>
      <div class="lg" style="flex-direction:column;gap:7px;align-items:flex-start">${lg}</div></div>`;
  }

  return { line, bars, hbars, donut, PAL, fmtK, esc };
})();
