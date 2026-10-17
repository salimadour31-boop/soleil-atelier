/* render.js — Soleil Atelier canvas drawings (sky diagram, 24 h light strip, elevation chart, year chart, moon disc).
 * Pure functions of (ctx, size, data); no DOM lookups, so the same code draws on screen and for PNG exports. MIT licence. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Render = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const RAD = Math.PI / 180;
  /** Light-phase colours (original palette, readable on dark and light themes). */
  const PHASE = { night: '#0a1230', astro: '#172760', nautical: '#2b4a98', blue: '#4474e6', golden: '#f6a62a', day: '#ffe9ad' };
  const SUN = '#ffb82e', SUN_CORE = '#fff4cf', MOON = '#c9d3e6', CAM = '#ff7a45';

  /** Equidistant zenith projection: centre = zenith, circle of radius R = horizon. */
  function project(cx, cy, R, alt, az) {
    const r = (R * (90 - Math.max(alt, 0))) / 90;
    return [cx + r * Math.sin(az * RAD), cy - r * Math.cos(az * RAD)];
  }
  /** Moon disc showing the lit fraction (lit limb on the right when waxing, as seen from the northern hemisphere). */
  function moonDisc(ctx, x, y, r, fraction, waxing, dark = '#2a3142', lit = MOON) {
    ctx.save();
    ctx.translate(x, y);
    if (!waxing) ctx.scale(-1, 1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill();
    const f = Math.max(0, Math.min(1, fraction));
    if (f > 0.005) {
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
      ctx.ellipse(0, 0, Math.max(0.01, r * Math.abs(1 - 2 * f)), r, 0, Math.PI / 2, -Math.PI / 2, f < 0.5);
      ctx.closePath(); ctx.fillStyle = lit; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.lineWidth = Math.max(1, r / 10); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
    ctx.restore();
  }
  function strokePath(ctx, pts, cx, cy, R, style) {
    ctx.save(); Object.assign(ctx, style);
    if (style.dash) ctx.setLineDash(style.dash);
    ctx.beginPath();
    let pen = false;
    for (const p of pts) {
      if (p.alt < 0) { pen = false; continue; }
      const [x, y] = project(cx, cy, R, p.alt, p.az);
      if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      pen = true;
    }
    ctx.stroke(); ctx.restore();
  }
  /** Sky diagram. d: { bg (optional fill, else transparent), theme, labels, paths{today, jun, dec, eq, moon}, hours, sun, moon, riseAz, setAz, moonRiseAz, moonSetAz, cam, shadow, hover }. */
  function drawSky(ctx, size, d) {
    const k = size / 600, th = d.theme, cx = size / 2, cy = size / 2, R = size / 2 - 40 * k;
    ctx.save();
    if (d.bg) { ctx.fillStyle = d.bg; ctx.fillRect(0, 0, size, size); } else ctx.clearRect(0, 0, size, size);
    // disc with a soft gradient (sky colour reflects the current light phase)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, th.skyTop); g.addColorStop(1, th.skyEdge);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    // camera field wedge
    if (d.cam && d.cam.on) {
      const a0 = (d.cam.bearing - d.cam.fov / 2 - 90) * RAD, a1 = (d.cam.bearing + d.cam.fov / 2 - 90) * RAD;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
      ctx.fillStyle = 'rgba(255,122,69,.16)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,122,69,.75)'; ctx.lineWidth = 1.5 * k; ctx.setLineDash([6 * k, 4 * k]); ctx.stroke(); ctx.setLineDash([]);
      const [bx, by] = project(cx, cy, R, 0, d.cam.bearing);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.strokeStyle = CAM; ctx.lineWidth = 2 * k; ctx.stroke();
    }
    // altitude rings and azimuth ticks
    ctx.strokeStyle = th.grid; ctx.lineWidth = 1 * k; ctx.fillStyle = th.mute; ctx.font = `${11 * k}px ${th.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const a of [15, 30, 45, 60, 75]) {
      ctx.beginPath(); ctx.arc(cx, cy, (R * (90 - a)) / 90, 0, Math.PI * 2); ctx.setLineDash(a % 30 ? [2 * k, 4 * k] : []); ctx.stroke();
      if (a % 30 === 0) ctx.fillText(a + '°', cx + 3 * k, cy - (R * (90 - a)) / 90 - 7 * k);
    }
    ctx.setLineDash([]);
    for (let az = 0; az < 360; az += 10) {
      const long = az % 30 === 0, [x1, y1] = project(cx, cy, R, 0, az), x2 = cx + (R + (long ? 9 : 5) * k) * Math.sin(az * RAD), y2 = cy - (R + (long ? 9 : 5) * k) * Math.cos(az * RAD);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = th.mute; ctx.stroke();
      if (long && az % 90) {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.strokeStyle = th.grid; ctx.stroke();
      }
    }
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.strokeStyle = th.grid; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.strokeStyle = th.ink; ctx.lineWidth = 1.6 * k; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const L = d.labels;
    [[0, L.N], [90, L.E], [180, L.S], [270, L.W]].forEach(([az, s]) => {
      const x = cx + (R + 24 * k) * Math.sin(az * RAD), y = cy - (R + 24 * k) * Math.cos(az * RAD);
      ctx.font = `700 ${16 * k}px ${th.font}`; ctx.fillStyle = az === 0 ? th.accent : th.ink; ctx.fillText(s, x, y);
    });
    ctx.font = `${10 * k}px ${th.font}`; ctx.fillStyle = th.mute;
    for (let az = 30; az < 360; az += 30) if (az % 90) {
      const x = cx + (R + 21 * k) * Math.sin(az * RAD), y = cy - (R + 21 * k) * Math.cos(az * RAD);
      ctx.fillText(az + '°', x, y);
    }
    // reference paths
    const P = d.paths;
    if (P.jun) strokePath(ctx, P.jun, cx, cy, R, { strokeStyle: th.ref, lineWidth: 1.4 * k, dash: [7 * k, 5 * k] });
    if (P.dec) strokePath(ctx, P.dec, cx, cy, R, { strokeStyle: th.ref, lineWidth: 1.4 * k, dash: [7 * k, 5 * k] });
    if (P.eq) strokePath(ctx, P.eq, cx, cy, R, { strokeStyle: th.ref, lineWidth: 1.2 * k, dash: [1.5 * k, 4 * k] });
    // rise / set directions
    const ray = (az, color, dash) => {
      if (az == null) return;
      const [x, y] = project(cx, cy, R, 0, az);
      ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.strokeStyle = color; ctx.lineWidth = 1.6 * k; ctx.setLineDash(dash); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 4 * k, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.restore();
    };
    ray(d.riseAz, '#ffcf6b', [3 * k, 3 * k]); ray(d.setAz, '#ff8f4d', [3 * k, 3 * k]);
    ray(d.moonRiseAz, 'rgba(201,211,230,.8)', [1.5 * k, 4 * k]); ray(d.moonSetAz, 'rgba(201,211,230,.8)', [1.5 * k, 4 * k]);
    // moon path
    if (P.moon) strokePath(ctx, P.moon, cx, cy, R, { strokeStyle: 'rgba(201,211,230,.85)', lineWidth: 1.6 * k, dash: [4 * k, 4 * k] });
    // today's sun path, coloured by light phase
    if (P.today) {
      ctx.lineCap = 'round';
      for (let i = 1; i < P.today.length; i++) {
        const a = P.today[i - 1], b = P.today[i];
        if (a.alt < 0 || b.alt < 0) continue;
        const [x1, y1] = project(cx, cy, R, a.alt, a.az), [x2, y2] = project(cx, cy, R, b.alt, b.az);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = b.alt < 6 ? PHASE.golden : SUN; ctx.lineWidth = 4 * k; ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
    // hour marks
    ctx.font = `600 ${10 * k}px ${th.font}`;
    for (const h of d.hours || []) {
      const [x, y] = project(cx, cy, R, h.alt, h.az);
      ctx.beginPath(); ctx.arc(x, y, 3.2 * k, 0, Math.PI * 2); ctx.fillStyle = th.ink; ctx.fill();
      const ox = x - cx, oy = y - cy, n = Math.hypot(ox, oy) || 1;
      ctx.fillStyle = th.ink; ctx.fillText(h.label, x + (ox / n) * 12 * k + (n < 2 ? 12 * k : 0), y + (oy / n) * 12 * k);
    }
    // shadow of a pole standing at the zenith point (top view)
    if (d.shadow && isFinite(d.shadow.ratio)) {
      const len = Math.min(d.shadow.ratio, 4) / 4 * R * 0.55, a = d.shadow.dir * RAD;
      ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + len * Math.sin(a), cy - len * Math.cos(a));
      ctx.strokeStyle = th.shadow; ctx.lineWidth = 6 * k; ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, 4.5 * k, 0, Math.PI * 2); ctx.fillStyle = th.ink; ctx.fill();
    }
    // moon now
    if (d.moon) {
      const up = d.moon.alt >= 0, [x, y] = project(cx, cy, R, up ? d.moon.alt : 0, d.moon.az);
      ctx.globalAlpha = up ? 1 : 0.45;
      moonDisc(ctx, x, y, 11 * k, d.moon.fraction, d.moon.waxing);
      ctx.globalAlpha = 1;
    }
    // sun now
    if (d.sun) {
      const up = d.sun.alt >= -0.833, [x, y] = project(cx, cy, R, Math.max(0, d.sun.app), d.sun.az);
      if (up) {
        const gl = ctx.createRadialGradient(x, y, 0, x, y, 34 * k);
        gl.addColorStop(0, 'rgba(255,214,110,.75)'); gl.addColorStop(1, 'rgba(255,214,110,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 34 * k, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 12 * k, 0, Math.PI * 2); ctx.fillStyle = SUN; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 6 * k, 0, Math.PI * 2); ctx.fillStyle = SUN_CORE; ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(x, y, 10 * k, 0, Math.PI * 2); ctx.strokeStyle = SUN; ctx.lineWidth = 2.5 * k; ctx.setLineDash([3 * k, 3 * k]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // hover crosshair readout
    if (d.hover) {
      ctx.font = `600 ${12 * k}px ${th.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = th.ink;
      ctx.fillText(d.hover, 8 * k, 8 * k);
    }
    ctx.restore();
  }
  /** Inverse projection: canvas point → {alt, az} (null outside the horizon circle). */
  function unproject(size, x, y) {
    const k = size / 600, R = size / 2 - 40 * k, dx = x - size / 2, dy = y - size / 2, r = Math.hypot(dx, dy);
    if (r > R) return null;
    return { alt: 90 - (r / R) * 90, az: ((Math.atan2(dx, -dy) / RAD) + 360) % 360 };
  }
  /** Plot area of the time-based charts (shared by drawing and pointer mapping). */
  const plotX = (w, k) => ({ x0: 34 * k, x1: w - 12 * k });
  /** 24 h light strip. d: { theme, segs, start, end, ticks[{t,label}], now, marks[{t,color}], moonUp[{a,b}] }. */
  function drawTimeline(ctx, w, h, d, k = 1) {
    const th = d.theme, { x0, x1 } = plotX(w, k), X = (t) => x0 + ((t - d.start) / (d.end - d.start)) * (x1 - x0);
    const y0 = 6 * k, bh = h - 40 * k;
    ctx.clearRect(0, 0, w, h);
    for (const s of d.segs) { ctx.fillStyle = PHASE[s.phase]; ctx.fillRect(X(s.a), y0, Math.max(1, X(s.b) - X(s.a) + 0.5), bh); }
    // moon-above-horizon band
    ctx.fillStyle = 'rgba(201,211,230,.9)';
    for (const m of d.moonUp || []) ctx.fillRect(X(m.a), y0 + bh + 3 * k, Math.max(1, X(m.b) - X(m.a)), 4 * k);
    ctx.strokeStyle = th.line; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, bh - 1);
    ctx.font = `${11 * k}px ${th.font}`; ctx.fillStyle = th.mute; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const tk of d.ticks) {
      const x = X(tk.t);
      ctx.fillRect(x, y0 + bh + 8 * k, 1, tk.major ? 6 * k : 3 * k);
      if (tk.label) ctx.fillText(tk.label, x, y0 + bh + 16 * k);
    }
    for (const m of d.marks || []) { ctx.fillStyle = m.color; ctx.fillRect(X(m.t) - 1, y0, 2, bh); }
    if (d.now != null) {
      const x = X(d.now);
      ctx.fillStyle = th.ink; ctx.fillRect(x - 1.5 * k, y0 - 4 * k, 3 * k, bh + 8 * k);
      ctx.beginPath(); ctx.moveTo(x - 6 * k, y0 - 5 * k); ctx.lineTo(x + 6 * k, y0 - 5 * k); ctx.lineTo(x, y0 + 3 * k); ctx.closePath(); ctx.fill();
    }
  }
  /** Elevation chart. d: { theme, sun[{t,alt}], moon[{t,alt}], start, end, ticks, now, sunNow, moonNow, labels{golden, blue} }. */
  function drawElevation(ctx, w, h, d, k = 1) {
    const th = d.theme, { x0, x1 } = plotX(w, k), top = 8 * k, bot = h - 24 * k;
    const lo = -30, hi = Math.max(60, Math.ceil((Math.max(...d.sun.map((p) => p.alt), ...(d.moon || []).map((p) => p.alt)) + 5) / 15) * 15);
    const X = (t) => x0 + ((t - d.start) / (d.end - d.start)) * (x1 - x0), Y = (a) => bot - ((Math.max(lo, Math.min(hi, a)) - lo) / (hi - lo)) * (bot - top);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(246,166,42,.20)'; ctx.fillRect(x0, Y(6), x1 - x0, Y(-4) - Y(6));
    ctx.fillStyle = 'rgba(68,116,230,.24)'; ctx.fillRect(x0, Y(-4), x1 - x0, Y(-6) - Y(-4));
    ctx.font = `${10 * k}px ${th.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let a = lo; a <= hi; a += 15) {
      ctx.fillStyle = th.mute; ctx.fillText(a + '°', x0 - 4 * k, Y(a));
      ctx.fillStyle = a === 0 ? th.ink : th.grid; ctx.fillRect(x0, Math.round(Y(a)), x1 - x0, a === 0 ? 1.5 * k : 1);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = th.mute;
    for (const tk of d.ticks) { if (tk.major) ctx.fillRect(X(tk.t), top, 1, bot - top); if (tk.label) ctx.fillText(tk.label, X(tk.t), bot + 6 * k); }
    const line = (pts, color, width, dash) => {
      ctx.save(); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.alt)) : ctx.moveTo(X(p.t), Y(p.alt))));
      ctx.strokeStyle = color; ctx.lineWidth = width; if (dash) ctx.setLineDash(dash); ctx.stroke(); ctx.restore();
    };
    if (d.moon) line(d.moon, 'rgba(160,175,205,.95)', 2 * k, [5 * k, 4 * k]);
    line(d.sun, SUN, 3 * k);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `600 ${10 * k}px ${th.font}`;
    ctx.fillStyle = '#d0841a'; ctx.fillText(d.labels.golden, x0 + 4 * k, Y(1));
    ctx.fillStyle = '#4474e6'; ctx.fillText(d.labels.blue, x0 + 4 * k, Y(-5));
    if (d.now != null) {
      ctx.fillStyle = th.ink; ctx.fillRect(X(d.now) - 1, top, 2, bot - top);
      if (d.moonNow) { ctx.beginPath(); ctx.arc(X(d.now), Y(d.moonNow.alt), 4.5 * k, 0, Math.PI * 2); ctx.fillStyle = MOON; ctx.fill(); }
      if (d.sunNow) { ctx.beginPath(); ctx.arc(X(d.now), Y(d.sunNow.alt), 6 * k, 0, Math.PI * 2); ctx.fillStyle = SUN; ctx.fill(); ctx.strokeStyle = th.ink; ctx.lineWidth = 1.5 * k; ctx.stroke(); }
    }
  }
  /** Year chart. d: { theme, grid (Uint8Array days×rows of phase indices), days, rows, monthStarts[{i,label}], todayIndex, hourLabels }. */
  const PHASE_ORDER = ['night', 'astro', 'nautical', 'blue', 'golden', 'day'];
  function drawYear(ctx, w, h, d, k = 1) {
    const th = d.theme, x0 = 38 * k, x1 = w - 10 * k, y0 = 8 * k, y1 = h - 26 * k;
    ctx.clearRect(0, 0, w, h);
    const img = new ImageData(d.days, d.rows), rgb = PHASE_ORDER.map((p) => [1, 3, 5].map((i) => parseInt(PHASE[p].slice(i, i + 2), 16)));
    for (let x = 0; x < d.days; x++) for (let y = 0; y < d.rows; y++) {
      const c = rgb[d.grid[x * d.rows + y]], o = (y * d.days + x) * 4;
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
    }
    const off = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(d.days, d.rows) : Object.assign(document.createElement('canvas'), { width: d.days, height: d.rows });
    off.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, x0, y0, x1 - x0, y1 - y0);
    ctx.imageSmoothingEnabled = true;
    ctx.font = `${10 * k}px ${th.font}`; ctx.fillStyle = th.mute; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let hr = 0; hr <= 24; hr += 3) {
      const y = y0 + (hr / 24) * (y1 - y0);
      ctx.fillText(String(hr).padStart(2, '0') + ':00', x0 - 4 * k, y);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0, Math.round(y), x1 - x0, 1); ctx.fillStyle = th.mute;
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    for (const m of d.monthStarts) {
      const x = x0 + (m.i / d.days) * (x1 - x0);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(Math.round(x), y0, 1, y1 - y0);
      ctx.fillStyle = th.mute; ctx.fillText(m.label, x + 3 * k, y1 + 6 * k);
    }
    if (d.todayIndex != null && d.todayIndex >= 0) {
      const x = x0 + ((d.todayIndex + 0.5) / d.days) * (x1 - x0);
      ctx.fillStyle = CAM; ctx.fillRect(x - 1.5 * k, y0, 3 * k, y1 - y0);
    }
    ctx.strokeStyle = th.line; ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
  }
  return { PHASE, PHASE_ORDER, SUN, MOON, CAM, project, unproject, moonDisc, drawSky, drawTimeline, drawElevation, drawYear, plotX };
});
