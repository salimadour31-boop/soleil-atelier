/* app.js — Soleil Atelier interface: place / date / time controls, live readouts, sky diagram, 24 h strip,
 * elevation chart, next-days table, year chart, alignment finder, exports (PNG, CSV, ICS, JSON) and shareable link.
 * Depends on Astro, CITIES, Settings, I18N, Render (plain scripts). Original code, MIT licence. */
(function () {
  'use strict';
  const A = window.Astro, C = window.CITIES, ST = window.Settings, I = window.I18N, R = window.Render;
  const $ = (id) => document.getElementById(id);
  const MIN = 60000;

  // ------------------------------------------------------------ state
  const state = {
    s: ST.sanitize({}, A.validTz), y: 0, m: 0, d: 0, min: 0, // min = minutes since the local day start
    tfng: false, theme: 'dark', anim: null, day: null, moon: null, tab: 'days', yearKey: '', yearData: null, align: [], ready: false,
  };
  const s = () => state.s;
  const tr = (k, vars) => I.t(k, s().lang, vars, state.tfng);
  const pad = (n) => String(n).padStart(2, '0');

  // ------------------------------------------------------------ formatting
  /** Local HH:MM, rounded to the nearest minute. */
  function hm(ms) { if (ms == null) return tr('noEvent'); const p = A.partsIn(s().tz, ms + 30000); return pad(p.h) + ':' + pad(p.mi); }
  function dur(ms) {
    const neg = ms < 0, tot = Math.round(Math.abs(ms) / MIN), h = Math.floor(tot / 60), m = tot % 60;
    const txt = h ? tr('hm', { h, m: pad(m) }) : tr('minutes', { n: m });
    return (neg ? '−' : '') + txt;
  }
  function locale() { return s().lang === 'en' ? 'en-GB' : 'fr-FR'; }
  function monthName(m, short) {
    if (s().lang === 'kab') { const n = tr('months').split(',')[m - 1]; return short ? n.slice(0, 3) : n; }
    return new Intl.DateTimeFormat(locale(), { month: short ? 'short' : 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m - 1, 15)));
  }
  function dateLabel(y, m, d, withYear = true) {
    if (s().lang === 'kab') return `${d} ${monthName(m)}${withYear ? ' ' + y : ''}`;
    return new Intl.DateTimeFormat(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
  }
  const isoDate = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  function dirName(az) { const names = tr('dirNames').split(','); return names[Math.round(A.norm360(az) / 22.5) % 16]; }
  const deg = (v, n = 1) => (v == null ? '—' : v.toFixed(n).replace('.', s().lang === 'en' ? '.' : ',') + '°');
  const num = (v, n = 1) => v.toFixed(n).replace('.', s().lang === 'en' ? '.' : ',');
  function offsetLabel(ms) { const o = A.tzOffset(s().tz, ms), sg = o < 0 ? '−' : '+', a = Math.abs(o); return tr('utcOffset', { o: sg + pad(Math.floor(a / 60)) + (a % 60 ? ':' + pad(a % 60) : '') }); }
  const PHASE_EMOJI = { newMoon: '🌑', waxCres: '🌒', firstQ: '🌓', waxGib: '🌔', fullMoon: '🌕', wanGib: '🌖', lastQ: '🌗', wanCres: '🌘' };

  // ------------------------------------------------------------ theme colours for canvases
  function theme() {
    const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim();
    return { ink: v('--ink'), mute: v('--mute'), line: v('--line'), grid: v('--grid'), accent: v('--accent'), ref: v('--ref'), shadow: v('--shadow'), skyTop: v('--sky-top'), skyEdge: v('--sky-edge'), font: 'system-ui, sans-serif', bg: v('--card') };
  }

  // ------------------------------------------------------------ i18n
  function applyLang() {
    document.documentElement.lang = s().lang === 'kab' ? 'kab' : s().lang;
    document.body.classList.toggle('tfng', s().lang === 'kab' && state.tfng);
    $('tfngWrap').hidden = s().lang !== 'kab';
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = tr(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = tr(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = tr(el.dataset.i18nTitle); el.setAttribute('aria-label', el.title); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', tr(el.dataset.i18nAria)));
    $('animBtn').lastElementChild.textContent = tr(state.anim ? 'stopAnim' : 'animate');
    buildCitySelect();
    $('phaseLegend').innerHTML = R.PHASE_ORDER.slice().reverse().map((p) => `<li><i style="background:${R.PHASE[p]}"></i>${tr('ph_' + p)}</li>`).join('') + `<li><i style="background:${R.MOON};height:4px"></i>${tr('moon')}</li>`;
  }

  // ------------------------------------------------------------ selects
  function buildCitySelect() {
    const sel = $('city'), groups = { dz: 'grpDz', mag: 'grpMag', eu: 'grpEu', am: 'grpAm', as: 'grpAs' };
    let html = `<option value="-1">${tr('custom')}</option>`;
    for (const [g, key] of Object.entries(groups)) {
      html += `<optgroup label="${tr(key)}">` + C.map((c, i) => (c.group === g ? `<option value="${i}">${c.name}</option>` : '')).join('') + '</optgroup>';
    }
    sel.innerHTML = html;
    sel.value = String(cityIndex());
  }
  function cityIndex() { return C.findIndex((c) => Math.abs(c.lat - s().lat) < 1e-3 && Math.abs(c.lon - s().lon) < 1e-3 && c.tz === s().tz); }
  function buildTzSelect() {
    let zones = [];
    try { zones = Intl.supportedValuesOf('timeZone'); } catch (e) { zones = [...new Set(C.map((c) => c.tz))].sort(); }
    if (!zones.includes('UTC')) zones.push('UTC');
    if (!zones.includes(s().tz)) zones.push(s().tz);
    $('tz').innerHTML = zones.map((z) => `<option>${z}</option>`).join('');
  }

  // ------------------------------------------------------------ core computation
  function setDate(y, m, d) { state.y = y; state.m = m; state.d = d; }
  function dateFromInstant(ms) { const p = A.partsIn(s().tz, ms); setDate(p.y, p.m, p.d); return p; }
  function instant() { return state.day.start + state.min * MIN; }
  /** Recompute everything that depends on place and date (events, paths, segments). */
  function computeDay() {
    const { lat, lon, tz } = s(), { y, m, d } = state;
    const day = A.sunDay(lat, lon, tz, y, m, d);
    const prevD = new Date(Date.UTC(y, m - 1, d - 1)), prev = A.sunDay(lat, lon, tz, prevD.getUTCFullYear(), prevD.getUTCMonth() + 1, prevD.getUTCDate());
    day.prevLength = prev.dayLength;
    const sol = (mm, dd) => { const b = A.dayBounds(tz, y, mm, dd); return A.sunPath(lat, lon, b.start, b.end, 10); };
    day.paths = { today: A.sunPath(lat, lon, day.start, day.end, 5), jun: sol(6, 21), dec: sol(12, 21), eq: sol(3, 20), moon: A.moonPath(lat, lon, day.start, day.end, 10) };
    day.segs = A.phaseSegments(lat, lon, day.start, day.end, 1);
    day.hours = [];
    day.ticks = [];
    for (let t = day.start; t < day.end - MIN; t += MIN * 60) {
      const p = A.partsIn(tz, t);
      if (p.mi !== 0) continue;
      day.ticks.push({ t, major: p.h % 3 === 0, label: p.h % 3 === 0 ? pad(p.h) : '' });
      const sp = A.sunPosition(t, lat, lon);
      if (sp.alt > 0) day.hours.push({ alt: sp.alt, az: sp.az, label: String(p.h) });
    }
    day.ticks.push({ t: day.end, major: true, label: '24' });
    const moon = A.moonDay(lat, lon, tz, y, m, d);
    moon.up = [];
    let cur = null;
    for (const p of day.paths.moon) { if (p.alt >= 0) { if (!cur) moon.up.push(cur = { a: p.t, b: p.t }); cur.b = p.t; } else cur = null; }
    moon.nextFull = A.nextPhase(day.start, 180); moon.nextNew = A.nextPhase(day.start, 0);
    state.day = day; state.moon = moon;
    const len = Math.round((day.end - day.start) / MIN);
    $('time').max = String(len - 1);
    state.min = Math.min(state.min, len - 1);
  }

  // ------------------------------------------------------------ rendering
  function fitCanvas(c, cssH) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5), w = c.clientWidth || 300, h = cssH || c.clientHeight || 150;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    return { w: c.width, h: c.height, k: dpr };
  }
  let hoverText = '';
  function skyData(t, th) {
    const { lat, lon } = s(), day = state.day, moon = state.moon, sp = A.sunPosition(t, lat, lon), mp = A.moonPosition(t, lat, lon), ill = A.moonIllumination(t);
    return {
      theme: th, labels: { N: tr('N'), E: tr('E'), S: tr('S'), W: tr('W') }, paths: day.paths, hours: day.hours, sun: sp,
      moon: { alt: mp.alt, az: mp.az, fraction: ill.fraction, waxing: ill.waxing }, riseAz: day.riseAz, setAz: day.setAz,
      moonRiseAz: moon.riseAz, moonSetAz: moon.setAz, cam: { on: s().cam, bearing: s().bearing, fov: s().fov }, shadow: A.shadow(s().objH, sp.app, sp.az), hover: hoverText,
    };
  }
  function drawAll() {
    if (!state.day) return;
    const th = theme(), t = instant(), day = state.day, { lat, lon } = s();
    const sky = $('sky'), sz = fitCanvas(sky, sky.clientWidth);
    R.drawSky(sky.getContext('2d'), Math.min(sz.w, sz.h), skyData(t, th));
    const tl = $('timeline'), a = fitCanvas(tl);
    R.drawTimeline(tl.getContext('2d'), a.w, a.h, { theme: th, segs: day.segs, start: day.start, end: day.end, ticks: day.ticks, now: t, moonUp: state.moon.up,
      marks: [day.sunrise, day.sunset].filter((x) => x != null).map((x) => ({ t: x, color: 'rgba(0,0,0,.45)' })) }, a.k);
    const el = $('elev'), b = fitCanvas(el);
    R.drawElevation(el.getContext('2d'), b.w, b.h, { theme: th, sun: day.paths.today, moon: day.paths.moon, start: day.start, end: day.end, ticks: day.ticks, now: t,
      sunNow: A.sunPosition(t, lat, lon), moonNow: A.moonPosition(t, lat, lon), labels: { golden: tr('ph_golden'), blue: tr('ph_blue') } }, b.k);
    const mi = $('moonIcon'), ill = A.moonIllumination(t), mc = mi.getContext('2d');
    mc.clearRect(0, 0, 44, 44); R.moonDisc(mc, 22, 22, 19, ill.fraction, ill.waxing);
    if (state.tab === 'year') drawYear();
  }

  // ------------------------------------------------------------ readouts
  function updateNow() {
    const t = instant(), { lat, lon } = s(), sp = A.sunPosition(t, lat, lon), mp = A.moonPosition(t, lat, lon), ill = A.moonIllumination(t);
    $('timeOut').textContent = hm(t);
    $('time').value = String(state.min);
    $('tzOff').textContent = '(' + offsetLabel(t) + ')';
    $('sunAz').textContent = deg(sp.az) + ' ' + dirName(sp.az).split('-').map((x) => x[0].toUpperCase()).join('');
    $('sunEl').textContent = deg(sp.app);
    const ph = A.lightPhase(sp.alt);
    $('sunPhase').innerHTML = `<span class="phasepill"><i style="background:${R.PHASE[ph]}"></i>${tr('ph_' + ph)}</span>`;
    const sh = A.shadow(s().objH, sp.app, sp.az);
    $('sunShadow').textContent = isFinite(sh.length) ? tr('shadowOf', { l: num(Math.min(sh.length, 9999), sh.length < 10 ? 1 : 0), d: dirName(sh.dir) }) : tr('shadowInf');
    // camera relation
    const ci = $('camInfo');
    if (s().cam && sp.alt > -0.833) {
      const diff = Math.abs(A.angDiff(sp.az, s().bearing));
      const inFrame = diff <= s().fov / 2;
      ci.className = 'caminfo' + (inFrame ? ' in' : '');
      ci.textContent = (inFrame ? tr('inFrame') + ' — ' + tr('backlit') : diff >= 120 ? tr('frontlit') : diff <= 60 ? tr('backlit') : tr('sidelit')) + ` (${Math.round(diff)}°)`;
    } else { ci.textContent = ''; ci.className = 'caminfo'; }
    $('moonAz').textContent = deg(mp.az);
    $('moonEl').textContent = deg(mp.app) + (mp.alt < 0 ? '' : '');
    $('moonIll').textContent = `${Math.round(ill.fraction * 100)} % · ${tr(A.phaseKey(ill.phase))}`;
    $('moonDist').textContent = Math.round(mp.dist).toLocaleString(locale()) + ' km';
    const mo = state.moon;
    $('moonNext').textContent = `${tr('ageDays', { n: num(ill.age, 1) })} · ${tr('nextFull')} : ${mo.nextFull ? shortDateTime(mo.nextFull) : '—'} · ${tr('nextNew')} : ${mo.nextNew ? shortDateTime(mo.nextNew) : '—'}`;
    highlightEvent(t);
    drawAll();
  }
  function shortDateTime(ms) { const p = A.partsIn(s().tz, ms); return dateLabel(p.y, p.m, p.d, false) + ' ' + pad(p.h) + ':' + pad(p.mi); }

  const EVENT_ORDER = [['astroDawn', 'astro'], ['nauticalDawn', 'nautical'], ['civilDawn', 'blue'], ['blueMorningEnd', 'golden'], ['sunrise', 'golden'], ['goldenMorningEnd', 'day'],
    ['noon', 'day'], ['goldenEveningStart', 'golden'], ['sunset', 'golden'], ['blueEveningStart', 'blue'], ['civilDusk', 'nautical'], ['nauticalDusk', 'astro'], ['astroDusk', 'night']];
  function renderEvents() {
    const day = state.day, moon = state.moon, rows = [], realNow = Date.now(), isToday = realNow >= day.start && realNow < day.end;
    for (const [k, ph] of EVENT_ORDER) {
      const t = day[k];
      if (t == null) continue;
      let extra = '';
      if (k === 'sunrise') extra = ` · ${deg(day.riseAz, 0)} ${dirName(day.riseAz)}`;
      if (k === 'sunset') extra = ` · ${deg(day.setAz, 0)} ${dirName(day.setAz)}`;
      if (k === 'noon') extra = ` · ${deg(day.noonAlt + A.refraction(day.noonAlt))}`;
      rows.push({ t, html: `<i style="background:${R.PHASE[ph]}"></i>${tr('ev_' + k)}<span class="mute small">${extra}</span>`, cls: '' });
    }
    if (moon.rise != null) rows.push({ t: moon.rise, html: `<i style="background:${R.MOON}"></i>${tr('ev_moonrise')}<span class="mute small"> · ${deg(moon.riseAz, 0)} ${dirName(moon.riseAz)}</span>`, cls: 'moonrow' });
    if (moon.set != null) rows.push({ t: moon.set, html: `<i style="background:${R.MOON}"></i>${tr('ev_moonset')}<span class="mute small"> · ${deg(moon.setAz, 0)} ${dirName(moon.setAz)}</span>`, cls: 'moonrow' });
    rows.sort((a, b) => a.t - b.t);
    $('events').innerHTML = rows.map((r) => {
      const rel = isToday ? (r.t >= realNow ? tr('nextIn', { d: dur(r.t - realNow) }) : tr('agoBy', { d: dur(realNow - r.t) })) : '';
      return `<tr class="${r.cls}" data-t="${r.t}" tabindex="0"><td class="t">${hm(r.t)}</td><td>${r.html}</td><td class="rel">${rel}</td></tr>`;
    }).join('');
    const pol = $('polar');
    pol.hidden = !day.polar; pol.textContent = day.polar ? tr(day.polar === 'up' ? 'polarUp' : 'polarDown') : '';
    const diff = day.dayLength - day.prevLength;
    $('dayLen').innerHTML = `<b>${tr('dayLength')} :</b> ${dur(day.dayLength)} <span class="mute">(${tr('vsYesterday', { d: (diff >= 0 ? '+' : '−') + Math.abs(Math.round(diff / 1000 / 6) / 10).toFixed(1).replace('.', s().lang === 'en' ? '.' : ',') + ' min' })})</span>`;
    const gm = day.blueMorningEnd != null && day.goldenMorningEnd != null ? day.goldenMorningEnd - day.blueMorningEnd : null;
    const ge = day.goldenEveningStart != null && day.blueEveningStart != null ? day.blueEveningStart - day.goldenEveningStart : null;
    $('goldenTotal').textContent = gm != null || ge != null ? tr('goldenTotal', { a: gm != null ? dur(gm) : '—', b: ge != null ? dur(ge) : '—' }) : '';
  }
  function highlightEvent(t) {
    let best = null, bd = Infinity;
    document.querySelectorAll('#events tr').forEach((tr_) => { const d = Math.abs(+tr_.dataset.t - t); tr_.classList.remove('cur'); if (d < bd) { bd = d; best = tr_; } });
    if (best && bd <= 5 * MIN) best.classList.add('cur');
  }

  // ------------------------------------------------------------ next days table
  function daysRows() {
    const { lat, lon, tz, days } = s();
    return A.dayList(state.y, state.m, state.d, days).map((dd) => {
      const e = A.sunDay(lat, lon, tz, dd.y, dd.m, dd.d), mo = A.moonIllumination((e.start + e.end) / 2);
      return { ...dd, e, moon: mo };
    });
  }
  const DAY_COLS = ['colDate', 'colDawn', 'colRise', 'colGm', 'colNoon', 'colGe', 'colSet', 'colDusk', 'colLen', 'colMoon'];
  function renderDays() {
    $('daysHead').innerHTML = DAY_COLS.map((c) => `<th>${tr(c)}</th>`).join('');
    state.daysCache = daysRows();
    $('daysBody').innerHTML = state.daysCache.map((r, i) => `<tr class="${i === 0 ? 'sel' : ''}"><td>${dateLabel(r.y, r.m, r.d)}</td><td>${hm(r.e.civilDawn)}</td><td>${hm(r.e.sunrise)}</td><td>${hm(r.e.goldenMorningEnd)}</td><td>${hm(r.e.noon)}</td><td>${hm(r.e.goldenEveningStart)}</td><td>${hm(r.e.sunset)}</td><td>${hm(r.e.civilDusk)}</td><td>${dur(r.e.dayLength)}</td><td>${PHASE_EMOJI[A.phaseKey(r.moon.phase)]} ${Math.round(r.moon.fraction * 100)} %</td></tr>`).join('');
  }

  // ------------------------------------------------------------ year chart
  function computeYear() {
    const { lat, lon, tz } = s(), key = [lat, lon, tz, state.y].join('|');
    if (state.yearKey === key) return state.yearData;
    const days = A.dayList(state.y, 1, 1, (state.y % 4 === 0 && state.y % 100 !== 0) || state.y % 400 === 0 ? 366 : 365), rows = 144, grid = new Uint8Array(days.length * rows);
    const order = R.PHASE_ORDER;
    days.forEach((dd, i) => {
      const { start } = A.dayBounds(tz, dd.y, dd.m, dd.d);
      for (let r = 0; r < rows; r++) grid[i * rows + r] = order.indexOf(A.lightPhase(A.sunPosition(start + (r + 0.5) * 10 * MIN, lat, lon).alt));
    });
    state.yearKey = key;
    state.yearData = { grid, days: days.length, rows, monthStarts: days.map((dd, i) => ({ dd, i })).filter((o) => o.dd.d === 1) };
    return state.yearData;
  }
  function yearDrawData(th) {
    const yd = computeYear(), doy = Math.round((Date.UTC(state.y, state.m - 1, state.d) - Date.UTC(state.y, 0, 1)) / 864e5);
    return { theme: th, grid: yd.grid, days: yd.days, rows: yd.rows, todayIndex: doy, monthStarts: yd.monthStarts.map((o) => ({ i: o.i, label: monthName(o.dd.m, true) })) };
  }
  function drawYear() { const c = $('year'), a = fitCanvas(c); R.drawYear(c.getContext('2d'), a.w, a.h, yearDrawData(theme()), a.k); }

  // ------------------------------------------------------------ alignment finder
  function runAlign() {
    const target = A.norm360(Number($('alTarget').value) || 0), tol = Math.min(15, Math.max(0.2, Number($('alTol').value) || 1.5));
    const kind = $('alKind').value, body = $('alBody').value, { lat, lon, tz } = s();
    const res = A.alignments(lat, lon, tz, state.y, state.m, state.d, { target, tol, body, events: kind === 'both' ? ['rise', 'set'] : [kind], days: 366 });
    state.align = res;
    $('alHead').innerHTML = ['colDate', 'colEvent', 'colTime', 'colAz', 'colDiff'].map((c) => `<th>${tr(c)}</th>`).join('') + (body === 'moon' ? `<th>${tr('illum')}</th>` : '') + '<th></th>';
    $('alBody2').innerHTML = res.map((r, i) => `<tr><td>${dateLabel(r.y, r.m, r.d)}</td><td>${tr(r.kind)}</td><td>${hm(r.t)}</td><td>${deg(r.az)}</td><td>${(r.diff >= 0 ? '+' : '') + deg(r.diff)}</td>${body === 'moon' ? `<td>${Math.round(r.fraction * 100)} %</td>` : ''}<td><button class="btn small" type="button" data-go="${i}">${tr('goDay')}</button></td></tr>`).join('');
    $('alStatus').textContent = res.length ? tr('matches', { n: res.length }) : tr('noMatch');
    return res;
  }

  // ------------------------------------------------------------ state changes
  function syncInputs() {
    $('lat').value = s().lat; $('lon').value = s().lon; $('tz').value = s().tz; $('city').value = String(cityIndex());
    $('date').value = isoDate(state.y, state.m, state.d);
    $('cam').checked = s().cam; $('bearing').value = s().bearing; $('bearingOut').textContent = s().bearing + '° ' + dirName(s().bearing);
    $('fov').value = s().fov; $('focal').value = s().focal; $('objH').value = s().objH; $('days').value = String(s().days); $('lang').value = s().lang;
  }
  let hashTimer = 0;
  function saveHash() {
    clearTimeout(hashTimer);
    hashTimer = setTimeout(() => {
      const t = instant(), p = A.partsIn(s().tz, t);
      s().date = isoDate(state.y, state.m, state.d); s().time = pad(p.h) + ':' + pad(p.mi);
      history.replaceState(null, '', ST.toHash(s()));
    }, 250);
  }
  function refreshDay() { computeDay(); renderEvents(); if (state.tab === 'days') renderDays(); syncInputs(); updateNow(); saveHash(); }
  function setTimeOfDay(h, mi) { state.min = Math.max(0, Math.min(+$('time').max, Math.round((A.zonedTime(s().tz, state.y, state.m, state.d, h, mi) - state.day.start) / MIN))); }
  function goInstant(ms) {
    const p = dateFromInstant(ms);
    computeDay(); renderEvents(); if (state.tab === 'days') renderDays();
    state.min = Math.round((ms - state.day.start) / MIN); syncInputs(); updateNow(); saveHash();
    return p;
  }
  function shiftDay(n) {
    const t = instant(), p = A.partsIn(s().tz, t), dd = new Date(Date.UTC(state.y, state.m - 1, state.d + n));
    setDate(dd.getUTCFullYear(), dd.getUTCMonth() + 1, dd.getUTCDate());
    computeDay(); setTimeOfDay(p.h, p.mi); renderEvents(); if (state.tab === 'days') renderDays(); syncInputs(); updateNow(); saveHash();
  }
  function setPlace(lat, lon, tz, place) {
    const t = instant(), keep = state.day ? A.partsIn(s().tz, t) : null;
    s().lat = lat; s().lon = lon; if (tz && A.validTz(tz)) s().tz = tz; s().place = place || '';
    computeDay(); if (keep) setTimeOfDay(keep.h, keep.mi); refreshDay();
  }
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600); }

  // ------------------------------------------------------------ exports
  function download(name, data, type) {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const slug = () => (s().place || `${s().lat.toFixed(2)}_${s().lon.toFixed(2)}`).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  const placeText = () => `${s().place ? s().place + ' — ' : ''}${s().lat.toFixed(4)}°, ${s().lon.toFixed(4)}° · ${s().tz}`;
  function exportSkyPng() {
    const W = 1600, head = 150, foot = 150, c = document.createElement('canvas'); c.width = W; c.height = W + head + foot;
    const ctx = c.getContext('2d'), th = { ...theme(), ink: '#eef1f8', mute: '#95a1bf', grid: 'rgba(255,255,255,.12)', line: '#26335a', accent: '#ffb82e', ref: 'rgba(255,233,173,.55)', shadow: 'rgba(5,8,20,.85)', skyTop: '#24407f', skyEdge: '#0f1a3c' };
    ctx.fillStyle = '#0a0f1f'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#ffb82e'; ctx.font = '700 46px system-ui, sans-serif'; ctx.fillText('Soleil Atelier — ' + tr('sky'), 50, 70);
    ctx.fillStyle = '#eef1f8'; ctx.font = '28px system-ui, sans-serif'; ctx.fillText(`${placeText()} · ${dateLabel(state.y, state.m, state.d)} ${hm(instant())} (${offsetLabel(instant())})`, 50, 118);
    ctx.save(); ctx.translate(0, head); hoverText = ''; R.drawSky(ctx, W, { ...skyData(instant(), th), bg: '#0a0f1f' }); ctx.restore();
    const d = state.day, items = [['ev_sunrise', d.sunrise, d.riseAz], ['ev_sunset', d.sunset, d.setAz], ['ev_goldenEveningStart', d.goldenEveningStart], ['ev_civilDusk', d.civilDusk]];
    ctx.font = '26px system-ui, sans-serif'; ctx.fillStyle = '#eef1f8';
    items.forEach(([k, t, az], i) => ctx.fillText(`${tr('ev_' + k.slice(3))}: ${hm(t)}${az != null ? ' · ' + deg(az, 0) : ''}`, 50 + (i % 2) * 780, W + head + 40 + Math.floor(i / 2) * 42));
    ctx.fillStyle = '#95a1bf'; ctx.font = '20px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('salimadour31-boop.github.io/soleil-atelier', W - 40, c.height - 16);
    return new Promise((res) => c.toBlob((b) => { download(`soleil-${slug()}-${isoDate(state.y, state.m, state.d)}.png`, b); res(c); }, 'image/png'));
  }
  function exportYearPng() {
    const W = 2000, H = 1100, c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'), th = { ...theme(), ink: '#eef1f8', mute: '#c5cde0', line: '#26335a' };
    ctx.fillStyle = '#0a0f1f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffb82e'; ctx.font = '700 44px system-ui, sans-serif'; ctx.fillText(`Soleil Atelier — ${tr('tabYear')} ${state.y}`, 50, 66);
    ctx.fillStyle = '#eef1f8'; ctx.font = '26px system-ui, sans-serif'; ctx.fillText(placeText(), 50, 108);
    ctx.save(); ctx.translate(20, 140); R.drawYear(ctx, W - 40, H - 230, yearDrawData(th), 2.4); ctx.restore();
    ctx.font = '24px system-ui, sans-serif'; let x = 60;
    for (const p of R.PHASE_ORDER.slice().reverse()) { ctx.fillStyle = R.PHASE[p]; ctx.fillRect(x, H - 52, 30, 22); ctx.fillStyle = '#eef1f8'; const lbl = tr('ph_' + p); ctx.fillText(lbl, x + 40, H - 33); x += 60 + ctx.measureText(lbl).width; }
    return new Promise((res) => c.toBlob((b) => { download(`soleil-annee-${slug()}-${state.y}.png`, b); res(c); }, 'image/png'));
  }
  function csvText() {
    const rows = daysRows(), q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const head = ['date', 'astro_dawn', 'nautical_dawn', 'civil_dawn', 'golden_am_start', 'sunrise', 'golden_am_end', 'solar_noon', 'noon_elevation_deg', 'golden_pm_start', 'sunset', 'golden_pm_end', 'civil_dusk', 'nautical_dusk', 'astro_dusk', 'day_length_min', 'sunrise_az_deg', 'sunset_az_deg', 'moon_illumination_pct'];
    const H24 = (ms) => (ms == null ? '' : hm(ms));
    const lines = [head.join(','), ...rows.map((r) => [isoDate(r.y, r.m, r.d), H24(r.e.astroDawn), H24(r.e.nauticalDawn), H24(r.e.civilDawn), H24(r.e.blueMorningEnd), H24(r.e.sunrise), H24(r.e.goldenMorningEnd), H24(r.e.noon), r.e.noonAlt.toFixed(2), H24(r.e.goldenEveningStart), H24(r.e.sunset), H24(r.e.blueEveningStart), H24(r.e.civilDusk), H24(r.e.nauticalDusk), H24(r.e.astroDusk), Math.round(r.e.dayLength / MIN), r.e.riseAz == null ? '' : r.e.riseAz.toFixed(1), r.e.setAz == null ? '' : r.e.setAz.toFixed(1), Math.round(r.moon.fraction * 100)].map(q).join(','))];
    return '\ufeff# ' + placeText() + '\r\n' + lines.join('\r\n') + '\r\n';
  }
  function icsText() {
    const rows = daysRows(), z = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
    const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//salimadour31-boop//Soleil Atelier//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + esc('Soleil Atelier — ' + (s().place || placeText()))];
    const stamp = z(Date.now());
    for (const r of rows) {
      const e = r.e, list = [['icsBlueAm', e.civilDawn, e.blueMorningEnd], ['icsGoldenAm', e.blueMorningEnd, e.goldenMorningEnd], ['icsGoldenPm', e.goldenEveningStart, e.blueEveningStart], ['icsBluePm', e.blueEveningStart, e.civilDusk]];
      for (const [k, a, b] of list) {
        if (a == null || b == null || b <= a) continue;
        out.push('BEGIN:VEVENT', `UID:${isoDate(r.y, r.m, r.d)}-${k}-${s().lat.toFixed(3)}_${s().lon.toFixed(3)}@soleil-atelier`, 'DTSTAMP:' + stamp, 'DTSTART:' + z(a), 'DTEND:' + z(b),
          'SUMMARY:' + esc(I.t(k, s().lang)), 'LOCATION:' + esc(placeText()), 'GEO:' + s().lat.toFixed(4) + ';' + s().lon.toFixed(4), 'TRANSP:TRANSPARENT', 'END:VEVENT');
      }
    }
    out.push('END:VCALENDAR');
    return out.map(foldLine).join('\r\n') + '\r\n';
  }
  /** RFC 5545 line folding at 75 octets. */
  function foldLine(line) {
    const enc = new TextEncoder(), parts = [];
    let cur = '';
    for (const ch of line) { if (enc.encode(cur + ch).length > (parts.length ? 74 : 75)) { parts.push(cur); cur = ch; } else cur += ch; }
    parts.push(cur);
    return parts.join('\r\n ');
  }
  function jsonText() {
    const d = state.day, iso = (ms) => (ms == null ? null : new Date(ms).toISOString());
    const ev = {}; for (const [k] of EVENT_ORDER) ev[k] = iso(d[k]);
    return JSON.stringify({ app: 'soleil-atelier', version: 1, settings: { ...s(), date: isoDate(state.y, state.m, state.d), time: hm(instant()) },
      day: { ...ev, dayLengthMin: Math.round(d.dayLength / MIN), sunriseAz: d.riseAz, sunsetAz: d.setAz, noonElevation: d.noonAlt, moonrise: iso(state.moon.rise), moonset: iso(state.moon.set), moonIllumination: state.moon.fraction } }, null, 2);
  }
  function importJson(text) {
    let o;
    try { o = JSON.parse(text); } catch (e) { toast(tr('importFail')); return false; }
    if (!o || o.app !== 'soleil-atelier' || !o.settings) { toast(tr('importFail')); return false; }
    applySettings(ST.sanitize(o.settings, A.validTz));
    toast(tr('imported'));
    return true;
  }
  function applySettings(ns) {
    state.s = ns;
    if (ns.date) { const [y, m, d] = ns.date.split('-').map(Number); setDate(y, m, d); } else dateFromInstant(Date.now());
    buildTzSelect(); applyLang(); computeDay();
    if (ns.time) { const [h, mi] = ns.time.split(':').map(Number); setTimeOfDay(h, mi); } else state.min = Math.round((Math.min(Math.max(Date.now(), state.day.start), state.day.end - MIN) - state.day.start) / MIN);
    state.yearKey = '';
    refreshDay();
  }

  // ------------------------------------------------------------ animation
  function toggleAnim() {
    if (state.anim) { cancelAnimationFrame(state.anim); state.anim = null; }
    else {
      let last = performance.now();
      const step = (now) => {
        const dt = Math.min(100, now - last); last = now;
        state.min = (state.min + dt * 0.12) % (+$('time').max + 1); // a whole day in ≈ 12 s
        updateNow();
        state.anim = requestAnimationFrame(step);
      };
      state.anim = requestAnimationFrame(step);
    }
    $('animBtn').setAttribute('aria-pressed', String(!!state.anim));
    $('animBtn').firstChild.textContent = state.anim ? '❚❚ ' : '▶ ';
    $('animBtn').lastElementChild.textContent = tr(state.anim ? 'stopAnim' : 'animate');
    if (!state.anim) { state.min = Math.round(state.min); updateNow(); saveHash(); }
  }

  // ------------------------------------------------------------ events
  function chartPointer(canvas) {
    const set = (e) => {
      const r = canvas.getBoundingClientRect(), k = canvas.width / r.width, { x0, x1 } = R.plotX(canvas.width, k);
      const f = Math.max(0, Math.min(1, ((e.clientX - r.left) * k - x0) / (x1 - x0)));
      state.min = Math.round(f * +$('time').max); updateNow(); saveHash();
    };
    canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); set(e); });
    canvas.addEventListener('pointermove', (e) => { if (canvas.hasPointerCapture(e.pointerId)) set(e); });
  }
  function bind() {
    $('lang').addEventListener('change', () => { s().lang = $('lang').value; localStorage.setItem('soleil-lang', s().lang); applyLang(); refreshDay(); if (state.align.length) runAlign(); });
    $('tfng').addEventListener('change', () => { state.tfng = $('tfng').checked; applyLang(); refreshDay(); });
    $('themeBtn').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = state.theme; localStorage.setItem('soleil-theme', state.theme); drawAll(); });
    $('helpBtn').addEventListener('click', () => $('help').showModal());
    $('city').addEventListener('change', () => { const i = +$('city').value; if (i >= 0) setPlace(C[i].lat, C[i].lon, C[i].tz, C[i].name); });
    const coord = () => { const lat = Number($('lat').value), lon = Number($('lon').value); if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) < 90 && Math.abs(lon) <= 180) setPlace(lat, lon, s().tz, ''); };
    $('lat').addEventListener('change', coord); $('lon').addEventListener('change', coord);
    $('tz').addEventListener('change', () => setPlace(s().lat, s().lon, $('tz').value, cityIndex() >= 0 ? s().place : ''));
    $('geoBtn').addEventListener('click', () => {
      if (!navigator.geolocation) return toast(tr('geoFail'));
      navigator.geolocation.getCurrentPosition((p) => {
        setPlace(Math.round(p.coords.latitude * 1e4) / 1e4, Math.round(p.coords.longitude * 1e4) / 1e4, Intl.DateTimeFormat().resolvedOptions().timeZone, '');
        toast(tr('geoOk'));
      }, () => toast(tr('geoFail')), { timeout: 10000, maximumAge: 600000 });
    });
    $('date').addEventListener('change', () => {
      const v = $('date').value; if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
      const t = A.partsIn(s().tz, instant()), [y, m, d] = v.split('-').map(Number); setDate(y, m, d); computeDay(); setTimeOfDay(t.h, t.mi); refreshDay();
    });
    $('prevDay').addEventListener('click', () => shiftDay(-1));
    $('nextDay').addEventListener('click', () => shiftDay(1));
    $('todayBtn').addEventListener('click', () => { const t = A.partsIn(s().tz, instant()), p = A.partsIn(s().tz, Date.now()); setDate(p.y, p.m, p.d); computeDay(); setTimeOfDay(t.h, t.mi); refreshDay(); });
    $('nowBtn').addEventListener('click', () => goInstant(Date.now()));
    $('time').addEventListener('input', () => { state.min = +$('time').value; updateNow(); saveHash(); });
    $('animBtn').addEventListener('click', toggleAnim);
    $('cam').addEventListener('change', () => { s().cam = $('cam').checked; updateNow(); saveHash(); });
    $('bearing').addEventListener('input', () => { s().bearing = +$('bearing').value; $('bearingOut').textContent = s().bearing + '° ' + dirName(s().bearing); updateNow(); saveHash(); });
    $('focal').addEventListener('change', () => { const f = Math.min(800, Math.max(8, +$('focal').value || 35)); s().focal = f; s().fov = Math.round(ST.fovFromFocal(f)); syncInputs(); updateNow(); saveHash(); });
    $('fov').addEventListener('change', () => { const v = Math.min(140, Math.max(5, +$('fov').value || 54)); s().fov = v; s().focal = Math.round(ST.focalFromFov(v)); syncInputs(); updateNow(); saveHash(); });
    $('objH').addEventListener('change', () => { s().objH = Math.min(500, Math.max(0.1, +$('objH').value || 1.8)); syncInputs(); updateNow(); saveHash(); });
    $('days').addEventListener('change', () => { s().days = +$('days').value; renderDays(); saveHash(); });
    $('events').addEventListener('click', (e) => { const r = e.target.closest('tr'); if (r) { state.min = Math.round((+r.dataset.t - state.day.start) / MIN); updateNow(); saveHash(); } });
    $('events').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.closest('tr') && e.target.closest('tr').click(); });
    // tabs
    document.querySelectorAll('[role=tab]').forEach((b) => b.addEventListener('click', () => {
      state.tab = b.id.slice(4);
      document.querySelectorAll('[role=tab]').forEach((x) => { const on = x === b; x.setAttribute('aria-selected', String(on)); $(x.getAttribute('aria-controls')).hidden = !on; });
      if (state.tab === 'days') renderDays();
      if (state.tab === 'year') drawYear();
      if (state.tab === 'align' && !$('alHead').innerHTML) $('alHead').innerHTML = '';
    }));
    $('alUseCam').addEventListener('click', () => { $('alTarget').value = s().bearing; });
    $('alGo').addEventListener('click', () => { $('alStatus').textContent = '…'; setTimeout(runAlign, 20); });
    $('alBody2').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) goInstant(state.align[+b.dataset.go].t); });
    // charts
    chartPointer($('timeline')); chartPointer($('elev'));
    $('timeline').addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { /* handled globally */ } });
    const sky = $('sky');
    sky.addEventListener('pointermove', (e) => {
      const r = sky.getBoundingClientRect(), k = sky.width / r.width, p = R.unproject(sky.width, (e.clientX - r.left) * k, (e.clientY - r.top) * k);
      hoverText = p ? `${tr('az')} ${deg(p.az, 0)} · ${tr('elev')} ${deg(p.alt, 0)}` : '';
      if (e.buttons && p && s().cam) { s().bearing = Math.round(p.az) % 360; syncInputs(); updateNow(); saveHash(); } else drawAll();
    });
    sky.addEventListener('pointerleave', () => { hoverText = ''; drawAll(); });
    sky.addEventListener('pointerdown', (e) => {
      const r = sky.getBoundingClientRect(), k = sky.width / r.width, p = R.unproject(sky.width, (e.clientX - r.left) * k, (e.clientY - r.top) * k);
      if (p) { s().cam = true; s().bearing = Math.round(p.az) % 360; syncInputs(); updateNow(); saveHash(); }
    });
    // exports
    $('exSky').addEventListener('click', exportSkyPng);
    $('exYear').addEventListener('click', exportYearPng);
    $('exCsv').addEventListener('click', () => download(`soleil-${slug()}-${isoDate(state.y, state.m, state.d)}-${s().days}j.csv`, csvText(), 'text/csv;charset=utf-8'));
    $('exIcs').addEventListener('click', () => download(`soleil-${slug()}-${isoDate(state.y, state.m, state.d)}.ics`, icsText(), 'text/calendar;charset=utf-8'));
    $('exJson').addEventListener('click', () => download(`soleil-${slug()}.json`, jsonText(), 'application/json'));
    $('imJson').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) importJson(await f.text()); e.target.value = ''; });
    $('copyLink').addEventListener('click', async () => {
      clearTimeout(hashTimer); const p = A.partsIn(s().tz, instant()); s().date = isoDate(state.y, state.m, state.d); s().time = pad(p.h) + ':' + pad(p.mi); history.replaceState(null, '', ST.toHash(s()));
      try { await navigator.clipboard.writeText(location.href); toast(tr('copied')); } catch (err) { toast(tr('copyFail')); }
    });
    // keyboard (ignored while typing in a field)
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, select, textarea, dialog') || e.ctrlKey || e.metaKey || e.altKey) return;
      const max = +$('time').max;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { state.min = Math.max(0, Math.min(max, state.min + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 60 : 10))); updateNow(); saveHash(); e.preventDefault(); }
      else if (e.key === 'PageUp') { shiftDay(-1); e.preventDefault(); }
      else if (e.key === 'PageDown') { shiftDay(1); e.preventDefault(); }
      else if (e.key === 't' || e.key === 'T') $('todayBtn').click();
      else if (e.key === ' ' && !e.target.closest('button')) { toggleAnim(); e.preventDefault(); }
    });
    window.addEventListener('hashchange', () => { const ns = ST.fromHash(location.hash, A.validTz); if (ns) applySettings(ns); });
    new ResizeObserver(() => drawAll()).observe(document.querySelector('.results'));
  }

  // ------------------------------------------------------------ start
  function init() {
    state.theme = localStorage.getItem('soleil-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = state.theme;
    const fromHash = ST.fromHash(location.hash, A.validTz);
    const ns = fromHash || ST.sanitize({ ...ST.DEFAULTS, lang: localStorage.getItem('soleil-lang') || ((navigator.language || 'fr').startsWith('en') ? 'en' : 'fr') }, A.validTz);
    bind();
    applySettings(ns);
    state.ready = true;
  }
  window.SoleilApp = { state, tr, computeDay, runAlign, csvText, icsText, jsonText, importJson, exportSkyPng, exportYearPng, goInstant, instant: () => instant() };
  init();
})();
