/* astro.js — Soleil Atelier astronomy core (no DOM, MIT licence, written for this project).
 * Sun position: NOAA / Meeus low-precision solar coordinates (≈0.01°), apparent sidereal time.
 * Moon position: truncated Meeus lunar theory (main periodic terms, ≈0.1–0.2°), topocentric altitude.
 * Events (sunrise, twilights, golden / blue hours, moonrise…) are found by sampling the altitude over the
 * local civil day of an IANA time zone and refining every threshold crossing by bisection (≈1 s), so polar
 * days / nights and days with two crossings are handled naturally. All angles in degrees, times in epoch ms. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Astro = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const RAD = Math.PI / 180, DEG = 180 / Math.PI, DAY = 86400000;
  const sin = (d) => Math.sin(d * RAD), cos = (d) => Math.cos(d * RAD), tan = (d) => Math.tan(d * RAD);
  const asin = (x) => Math.asin(Math.max(-1, Math.min(1, x))) * DEG, atan2 = (y, x) => Math.atan2(y, x) * DEG;
  const norm360 = (a) => ((a % 360) + 360) % 360;
  /** Signed smallest difference a − b in (−180, 180]. */
  const angDiff = (a, b) => { const d = norm360(a - b); return d > 180 ? d - 360 : d; };
  const julian = (ms) => ms / DAY + 2440587.5;

  /** Standard altitudes (geometric, degrees) used for the events. Golden hour = −4…+6°, blue hour = −6…−4°. */
  const H = { rise: -0.833, golden: 6, blue: -4, civil: -6, nautical: -12, astro: -18 };

  // ---------------------------------------------------------------- Sun
  /** Geocentric apparent solar coordinates at time ms: right ascension, declination, distance (AU), ecliptic longitude. */
  function sunCoords(ms) {
    const T = (julian(ms) - 2451545) / 36525;
    const L0 = norm360(280.46646 + T * (36000.76983 + T * 0.0003032));
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C = sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) + sin(2 * M) * (0.019993 - 0.000101 * T) + sin(3 * M) * 0.000289;
    const nu = M + C, R = (1.000001018 * (1 - e * e)) / (1 + e * cos(nu));
    const om = 125.04 - 1934.136 * T, lambda = L0 + C - 0.00569 - 0.00478 * sin(om);
    const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * cos(om);
    return { ra: norm360(atan2(cos(eps) * sin(lambda), cos(lambda))), dec: asin(sin(eps) * sin(lambda)), dist: R, lon: norm360(lambda), eps };
  }
  /** Greenwich mean sidereal time (degrees). */
  function gmst(ms) {
    const jd = julian(ms), T = (jd - 2451545) / 36525;
    return norm360(280.46061837 + 360.98564736629 * (jd - 2451545) + T * T * (0.000387933 - T / 38710000));
  }
  /** Horizontal coordinates from equatorial ones: altitude (geometric) and azimuth (from north, clockwise). */
  function horizontal(ra, dec, lat, lon, ms) {
    const ha = gmst(ms) + lon - ra;
    const alt = asin(sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(ha));
    const az = norm360(atan2(sin(ha), cos(ha) * sin(lat) - tan(dec) * cos(lat)) + 180);
    return { alt, az, ha: angDiff(ha, 0) };
  }
  /** Atmospheric refraction (degrees) to add to a geometric altitude (Sæmundsson, standard conditions). */
  function refraction(alt) {
    if (alt < -1.5) return 0;
    const h = Math.max(alt, -1.5);
    return 1.02 / Math.tan((h + 10.3 / (h + 5.11)) * RAD) / 60;
  }
  /** Sun position at ms for an observer: alt (geometric), app (apparent, with refraction), az, dec, dist. */
  function sunPosition(ms, lat, lon) {
    const c = sunCoords(ms), h = horizontal(c.ra, c.dec, lat, lon, ms);
    return { alt: h.alt, app: h.alt + refraction(h.alt), az: h.az, dec: c.dec, ra: c.ra, dist: c.dist, lon: c.lon };
  }

  // ---------------------------------------------------------------- Moon
  /** Geocentric lunar coordinates (truncated Meeus ch. 47): ecliptic lon / lat, distance (km), RA, Dec. */
  function moonCoords(ms) {
    const d = julian(ms) - 2451545, T = d / 36525;
    const Lp = 218.3164477 + 481267.88123421 * T, D = 297.8501921 + 445267.1114034 * T;
    const M = 357.5291092 + 35999.0502909 * T, Mp = 134.9633964 + 477198.8675055 * T, F = 93.272095 + 483202.0175233 * T;
    const lonT = [[6.288774, 0, 0, 1, 0], [1.274027, 2, 0, -1, 0], [0.658314, 2, 0, 0, 0], [0.213618, 0, 0, 2, 0], [-0.185116, 0, 1, 0, 0],
      [-0.114332, 0, 0, 0, 2], [0.058793, 2, 0, -2, 0], [0.057066, 2, -1, -1, 0], [0.053322, 2, 0, 1, 0], [0.045758, 2, -1, 0, 0],
      [-0.040923, 0, 1, -1, 0], [-0.034720, 1, 0, 0, 0], [-0.030383, 0, 1, 1, 0], [0.015327, 2, 0, 0, -2], [-0.012528, 0, 0, 1, 2],
      [0.010980, 0, 0, 1, -2], [0.010675, 4, 0, -1, 0], [0.010034, 0, 0, 3, 0], [0.008548, 4, 0, -2, 0], [-0.007888, 2, 1, -1, 0],
      [-0.006766, 2, 1, 0, 0], [-0.005163, 1, 0, -1, 0], [0.004987, 1, 1, 0, 0], [0.004036, 2, -1, 1, 0], [0.003994, 2, 0, 2, 0]];
    const latT = [[5.128122, 0, 0, 0, 1], [0.280602, 0, 0, 1, 1], [0.277693, 0, 0, 1, -1], [0.173237, 2, 0, 0, -1], [0.055413, 2, 0, -1, 1],
      [0.046271, 2, 0, -1, -1], [0.032573, 2, 0, 0, 1], [0.017198, 0, 0, 2, 1], [0.009266, 2, 0, 1, -1], [0.008822, 0, 0, 2, -1]];
    const distT = [[-20905.355, 0, 0, 1, 0], [-3699.111, 2, 0, -1, 0], [-2955.968, 2, 0, 0, 0], [-569.925, 0, 0, 2, 0], [48.888, 0, 1, 0, 0],
      [-3.149, 0, 0, 0, 2], [246.158, 2, 0, -2, 0], [-152.138, 2, -1, -1, 0], [-170.733, 2, 0, 1, 0], [-204.586, 2, -1, 0, 0], [-129.620, 0, 1, -1, 0],
      [108.743, 1, 0, 0, 0], [104.755, 0, 1, 1, 0], [79.661, 0, 0, 1, -2], [48.888, 0, 1, 0, 0]];
    const arg = (t) => t[1] * D + t[2] * M + t[3] * Mp + t[4] * F;
    let l = Lp, b = 0, r = 385000.56;
    for (const t of lonT) l += t[0] * sin(arg(t));
    for (const t of latT) b += t[0] * sin(arg(t));
    for (let i = 0; i < distT.length - 1; i++) r += distT[i][0] * cos(arg(distT[i]));
    const eps = 23.4392911 - 0.0130042 * T;
    l = norm360(l);
    const ra = norm360(atan2(sin(l) * cos(eps) - tan(b) * sin(eps), cos(l))), dec = asin(sin(b) * cos(eps) + cos(b) * sin(eps) * sin(l));
    return { lon: l, lat: b, dist: r, ra, dec };
  }
  /** Moon position: topocentric altitude (parallax removed), apparent altitude, azimuth, distance, horizontal parallax. */
  function moonPosition(ms, lat, lon) {
    const c = moonCoords(ms), h = horizontal(c.ra, c.dec, lat, lon, ms);
    const par = asin(6378.14 / c.dist), alt = h.alt - par * cos(h.alt);
    return { alt, app: alt + refraction(alt), az: h.az, dist: c.dist, parallax: par, ra: c.ra, dec: c.dec, lon: c.lon };
  }
  /** Moon illumination: fraction lit (0–1), elongation-based phase angle (0 = new, 180 = full), waxing flag and age in days. */
  function moonIllumination(ms) {
    const s = sunCoords(ms), m = moonCoords(ms);
    const psi = Math.acos(Math.max(-1, Math.min(1, sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)))) * DEG;
    const i = atan2(s.dist * 149597870.7 * sin(psi), m.dist - s.dist * 149597870.7 * cos(psi));
    const elong = norm360(m.lon - s.lon); // 0 new → 90 first quarter → 180 full → 270 last quarter
    return { fraction: (1 + cos(i)) / 2, phase: elong, waxing: elong < 180, age: (elong / 360) * 29.530589 };
  }
  /** Phase name key from the elongation (8 classical phases). */
  function phaseKey(elong) {
    const names = ['newMoon', 'waxCres', 'firstQ', 'waxGib', 'fullMoon', 'wanGib', 'lastQ', 'wanCres'];
    return names[Math.floor(norm360(elong + 22.5) / 45) % 8];
  }
  /** Next instant after ms where the Moon−Sun elongation reaches target (0 new, 90, 180 full, 270). */
  function nextPhase(ms, target) {
    const f = (t) => angDiff(moonIllumination(t).phase, target);
    let a = ms, fa = f(a);
    for (let t = ms + 6 * 3600000; t < ms + 31 * DAY; t += 6 * 3600000) {
      const ft = f(t);
      if (fa < 0 && ft >= 0 && ft - fa < 90) return bisect(f, a, t, fa);
      a = t; fa = ft;
    }
    return null;
  }

  // ---------------------------------------------------------------- Time zones (Intl)
  const fmts = {};
  function validTz(tz) { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; } }
  function partsIn(tz, ms) {
    const f = fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' }));
    const o = {};
    for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value;
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: o.weekday };
  }
  /** UTC offset (minutes, east positive) of zone tz at instant ms. */
  function tzOffset(tz, ms) {
    const p = partsIn(tz, ms), t = Math.floor(ms / 1000) * 1000;
    return Math.round((Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - t) / 60000);
  }
  /** Instant (ms) of local wall-clock time y-m-d h:mi in zone tz (DST gaps resolve forward). */
  function zonedTime(tz, y, m, d, h = 0, mi = 0) {
    const wall = Date.UTC(y, m - 1, d, h, mi);
    let t = wall - tzOffset(tz, wall) * 60000;
    t = wall - tzOffset(tz, t) * 60000;
    return t;
  }
  /** Start / end instants of the local civil day y-m-d (23, 24 or 25 h long). */
  function dayBounds(tz, y, m, d) {
    const n = new Date(Date.UTC(y, m - 1, d + 1));
    return { start: zonedTime(tz, y, m, d), end: zonedTime(tz, n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate()) };
  }

  // ---------------------------------------------------------------- Events
  function bisect(f, a, b, fa) {
    if (fa === undefined) fa = f(a);
    for (let i = 0; i < 40 && b - a > 500; i++) {
      const m = (a + b) / 2, fm = f(m);
      if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m;
    }
    return Math.round((a + b) / 2);
  }
  /** All crossings of altitude function alt(t) through level h in [start, end]: [{t, rising}]. */
  function crossings(alt, h, start, end, step = 600000) {
    const out = [], f = (t) => alt(t) - h;
    let a = start, fa = f(a);
    for (let t = Math.min(start + step, end); ; t = Math.min(t + step, end)) {
      const ft = f(t);
      if ((fa < 0) !== (ft < 0)) out.push({ t: bisect(f, a, t, fa), rising: ft >= 0 });
      a = t; fa = ft;
      if (t >= end) break;
    }
    return out;
  }
  /** Time of maximum (or minimum) of f in [start, end] by sampling + golden-section refinement. */
  function extremum(f, start, end, max = true, step = 600000) {
    let best = start, bv = max ? -Infinity : Infinity;
    for (let t = start; t <= end; t += step) { const v = f(t); if (max ? v > bv : v < bv) { bv = v; best = t; } }
    let a = Math.max(start, best - step), b = Math.min(end, best + step);
    const g = (Math.sqrt(5) - 1) / 2, sg = max ? -1 : 1;
    for (let i = 0; i < 40 && b - a > 1000; i++) {
      const c = b - g * (b - a), d = a + g * (b - a);
      if (sg * f(c) < sg * f(d)) b = d; else a = c;
    }
    const t = Math.round((a + b) / 2);
    return { t, v: f(t) };
  }
  const first = (list, rising) => { const e = list.find((c) => c.rising === rising); return e ? e.t : null; };
  const last = (list, rising) => { const e = list.filter((c) => c.rising === rising).pop(); return e ? e.t : null; };

  /** Sun events of the local day: dawn / dusk at every twilight, sunrise / sunset, golden & blue hours,
   *  solar noon (transit) with max altitude, day length and polar status ('up' | 'down' | null). */
  function sunDay(lat, lon, tz, y, m, d) {
    const { start, end } = dayBounds(tz, y, m, d), alt = (t) => sunPosition(t, lat, lon).alt;
    const c = {};
    for (const k of Object.keys(H)) c[k] = crossings(alt, H[k], start, end);
    const noon = extremum(alt, start, end, true), nadir = extremum(alt, start, end, false);
    const ev = {
      start, end, noon: noon.t, noonAlt: noon.v, noonAz: sunPosition(noon.t, lat, lon).az, nadir: nadir.t, nadirAlt: nadir.v,
      astroDawn: first(c.astro, true), nauticalDawn: first(c.nautical, true), civilDawn: first(c.civil, true), blueMorningEnd: first(c.blue, true),
      sunrise: first(c.rise, true), goldenMorningEnd: first(c.golden, true), goldenEveningStart: last(c.golden, false), sunset: last(c.rise, false),
      blueEveningStart: last(c.blue, false), civilDusk: last(c.civil, false), nauticalDusk: last(c.nautical, false), astroDusk: last(c.astro, false),
      polar: null, crossings: c,
    };
    if (ev.sunrise === null && ev.sunset === null) ev.polar = noon.v > H.rise ? 'up' : 'down';
    ev.riseAz = ev.sunrise !== null ? sunPosition(ev.sunrise, lat, lon).az : null;
    ev.setAz = ev.sunset !== null ? sunPosition(ev.sunset, lat, lon).az : null;
    ev.dayLength = daylight(alt, start, end, c.rise);
    return ev;
  }
  /** Total time above the sunrise altitude within [start, end] (ms), from the crossing list. */
  function daylight(alt, start, end, list) {
    let up = alt(start) > H.rise, t0 = start, total = 0;
    for (const c of list) { if (up) total += c.t - t0; up = c.rising; t0 = c.t; }
    if (up) total += end - t0;
    return total;
  }
  /** Moon events of the local day: moonrise / moonset (upper limb, topocentric, refraction), transit, illumination at noon. */
  function moonDay(lat, lon, tz, y, m, d) {
    const { start, end } = dayBounds(tz, y, m, d);
    // Upper limb on the refracted horizon: topocentric altitude + semi-diameter (≈ 0.2725 × parallax) + 34′ refraction = 0.
    const g = (t) => { const p = moonPosition(t, lat, lon); return p.alt + 0.2725 * p.parallax + 0.5667; };
    const list = crossings(g, 0, start, end, 900000);
    const tr = extremum((t) => moonPosition(t, lat, lon).alt, start, end, true, 900000);
    const rise = first(list, true), set = last(list, false), mid = (start + end) / 2, ill = moonIllumination(mid);
    return {
      rise, set, transit: tr.t, transitAlt: tr.v, riseAz: rise !== null ? moonPosition(rise, lat, lon).az : null, setAz: set !== null ? moonPosition(set, lat, lon).az : null,
      fraction: ill.fraction, phase: ill.phase, age: ill.age, waxing: ill.waxing, phaseKey: phaseKey(ill.phase),
      polar: rise === null && set === null ? (g(mid) > 0 ? 'up' : 'down') : null,
    };
  }
  /** Light phase of a geometric sun altitude: day, golden, blue, nautical-or-civil twilight, astronomical, night. */
  function lightPhase(alt) {
    if (alt >= H.golden) return 'day';
    if (alt >= H.blue) return 'golden';
    if (alt >= H.civil) return 'blue';
    if (alt >= H.nautical) return 'nautical';
    if (alt >= H.astro) return 'astro';
    return 'night';
  }
  /** Contiguous light-phase segments over [start, end] sampled every stepMin minutes: [{phase, a, b}]. */
  function phaseSegments(lat, lon, start, end, stepMin = 1) {
    const segs = [], step = stepMin * 60000;
    let cur = null;
    for (let t = start; t <= end; t += step) {
      const p = lightPhase(sunPosition(t, lat, lon).alt);
      if (!cur || cur.phase !== p) { if (cur) cur.b = t; cur = { phase: p, a: t, b: t }; segs.push(cur); }
    }
    if (cur) cur.b = end;
    return segs;
  }
  /** Sun path (positions every stepMin minutes) between two instants. */
  function sunPath(lat, lon, start, end, stepMin = 10) {
    const pts = [];
    for (let t = start; t <= end + 1; t += stepMin * 60000) { const p = sunPosition(t, lat, lon); pts.push({ t, alt: p.alt, app: p.app, az: p.az }); }
    return pts;
  }
  function moonPath(lat, lon, start, end, stepMin = 15) {
    const pts = [];
    for (let t = start; t <= end + 1; t += stepMin * 60000) { const p = moonPosition(t, lat, lon); pts.push({ t, alt: p.alt, app: p.app, az: p.az }); }
    return pts;
  }
  /** Shadow of a vertical object of height h at apparent sun altitude app: length (same unit as h) and direction. */
  function shadow(h, app, az) {
    if (!(app > 0.05)) return { length: Infinity, dir: norm360(az + 180), ratio: Infinity };
    const ratio = 1 / Math.tan(app * RAD);
    return { length: h * ratio, dir: norm360(az + 180), ratio };
  }
  /** Calendar days from y-m-d (count days): [{y, m, d}]. */
  function dayList(y, m, d, count) {
    const out = [];
    for (let i = 0; i < count; i++) { const n = new Date(Date.UTC(y, m - 1, d + i)); out.push({ y: n.getUTCFullYear(), m: n.getUTCMonth() + 1, d: n.getUTCDate() }); }
    return out;
  }
  /** Dates in the next `days` days where the sun (or moon) rises / sets within tol degrees of the target azimuth. */
  function alignments(lat, lon, tz, y, m, d, opt) {
    const { target, tol = 2, body = 'sun', events = ['rise', 'set'], days = 366 } = opt;
    const out = [];
    for (const day of dayList(y, m, d, days)) {
      const ev = body === 'sun' ? sunDay(lat, lon, tz, day.y, day.m, day.d) : moonDay(lat, lon, tz, day.y, day.m, day.d);
      for (const kind of events) {
        const t = body === 'sun' ? (kind === 'rise' ? ev.sunrise : ev.sunset) : (kind === 'rise' ? ev.rise : ev.set);
        const az = kind === 'rise' ? ev.riseAz : ev.setAz;
        if (t === null || az === null) continue;
        const diff = angDiff(az, target);
        if (Math.abs(diff) <= tol) out.push({ ...day, kind, t, az, diff, fraction: body === 'moon' ? ev.fraction : undefined });
      }
    }
    return out;
  }
  return { RAD, DEG, DAY, H, norm360, angDiff, julian, sunCoords, gmst, horizontal, refraction, sunPosition, moonCoords, moonPosition,
    moonIllumination, phaseKey, nextPhase, validTz, partsIn, tzOffset, zonedTime, dayBounds, crossings, extremum, sunDay, moonDay,
    lightPhase, phaseSegments, sunPath, moonPath, shadow, dayList, alignments };
});
