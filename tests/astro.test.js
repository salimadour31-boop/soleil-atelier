// Unit tests (plain Node, no dependencies): node tests/astro.test.js
// Sun and moon events vs. an independent implementation (reference-astral.json, generated once with the Python
// "astral" 3.2 package — see tests/make-reference.py), time-zone helpers (DST days of 23 / 25 h), polar day / night,
// shadows, moon phases, alignment finder, settings / URL hash, lens field of view and i18n completeness.
const assert = require('assert');
const A = require('../js/astro.js'), ST = require('../js/settings.js'), I = require('../js/i18n.js'), C = require('../js/cities.js'), REF = require('./reference-astral.json');
let n = 0, failed = 0;
function test(name, fn) { try { fn(); n++; console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n    ' + (e.stack || e).toString().split('\n').slice(0, 3).join('\n    ')); } }
const near = (a, b, eps, msg) => assert(Math.abs(a - b) <= eps, `${msg || ''} expected ${b} ± ${eps}, got ${a}`);
const MIN = 60000;

console.log('Sun & moon vs. reference (7 places × 5 dates)');
test('sunrise, sunset, solar noon, civil / nautical / astronomical twilight within 2.5 min', () => {
  for (const r of REF) {
    const e = A.sunDay(r.lat, r.lon, r.tz, ...r.date), tag = `${r.place} ${r.date.join('-')}`;
    for (const [k, ref] of [['sunrise', r.sunrise], ['sunset', r.sunset], ['noon', r.noon], ['civilDawn', r.civilDawn], ['civilDusk', r.civilDusk], ['nauticalDawn', r.nauticalDawn], ['astroDusk', r.astroDusk]]) {
      if (ref === null) { assert(e[k] === null || r.place === 'Reykjavik', `${tag} ${k} should be null`); continue; }
      near(e[k] / MIN, ref / MIN, 2.5, `${tag} ${k}`);
    }
  }
});
test('golden hour (−4°…+6°) and blue hour (−6°…−4°) within 2.5 min', () => {
  for (const r of REF) {
    const e = A.sunDay(r.lat, r.lon, r.tz, ...r.date), tag = `${r.place} ${r.date.join('-')}`;
    // astral returns the previous day's morning golden hour for zones far east of UTC (Sydney): skip that one case.
    if (r.goldenMorning && r.place !== 'Sydney') { near(e.blueMorningEnd / MIN, r.goldenMorning[0] / MIN, 2.5, tag + ' golden am start'); near(e.goldenMorningEnd / MIN, r.goldenMorning[1] / MIN, 2.5, tag + ' golden am end'); }
    if (r.goldenEvening) { near(e.goldenEveningStart / MIN, r.goldenEvening[0] / MIN, 2.5, tag + ' golden pm start'); near(e.blueEveningStart / MIN, r.goldenEvening[1] / MIN, 2.5, tag + ' golden pm end'); }
    if (r.blueEvening) { near(e.blueEveningStart / MIN, r.blueEvening[0] / MIN, 2.5, tag + ' blue pm start'); near(e.civilDusk / MIN, r.blueEvening[1] / MIN, 2.5, tag + ' blue pm end'); }
  }
});
test('solar azimuth / elevation at local noon within 0.05°', () => {
  for (const r of REF) {
    const p = A.sunPosition(r.probe, r.lat, r.lon);
    near(A.angDiff(p.az, r.probeAz), 0, 0.05, r.place + ' az'); near(p.alt, r.probeEl, 0.05, r.place + ' el');
  }
});
test('moonrise / moonset within 3 min (where the reference has one)', () => {
  let checked = 0;
  for (const r of REF) {
    const m = A.moonDay(r.lat, r.lon, r.tz, ...r.date);
    if (r.moonrise !== null && m.rise !== null) { near(m.rise / MIN, r.moonrise / MIN, 3, `${r.place} ${r.date} rise`); checked++; }
    if (r.moonset !== null && m.set !== null) { near(m.set / MIN, r.moonset / MIN, 3, `${r.place} ${r.date} set`); checked++; }
  }
  assert(checked >= 55, 'checked ' + checked);
});
test('moon age agrees with the reference within 1 day (astral uses a mean-phase approximation)', () => {
  for (const r of REF) {
    const [y, m, d] = r.date, age = A.moonIllumination(Date.UTC(y, m - 1, d)).age, ref = (r.moonPhase / 27.99) * 29.530589;
    near(A.angDiff((age / 29.530589) * 360, (ref / 29.530589) * 360) / 360 * 29.53, 0, 1, r.place + ' ' + r.date);
  }
});
test('Sydney 17 Oct 2026: moonrise found every day (9:22, 10:15, 11:12 local), smooth progression', () => {
  const t = [16, 17, 18].map((d) => A.moonDay(-33.8688, 151.2093, 'Australia/Sydney', 2026, 10, d).rise);
  t.forEach((x) => assert(x !== null));
  const loc = t.map((x) => { const p = A.partsIn('Australia/Sydney', x); return p.h * 60 + p.mi; });
  near(loc[0], 9 * 60 + 22, 3); near(loc[1], 10 * 60 + 15, 4); near(loc[2], 11 * 60 + 12, 3);
});

console.log('Time zones');
test('tzOffset: Algiers +60, Paris +120 in summer / +60 in winter, New York −240 / −300, UTC 0', () => {
  assert.strictEqual(A.tzOffset('Africa/Algiers', Date.UTC(2026, 6, 1)), 60);
  assert.strictEqual(A.tzOffset('Europe/Paris', Date.UTC(2026, 6, 1)), 120);
  assert.strictEqual(A.tzOffset('Europe/Paris', Date.UTC(2026, 0, 1)), 60);
  assert.strictEqual(A.tzOffset('America/New_York', Date.UTC(2026, 6, 1)), -240);
  assert.strictEqual(A.tzOffset('America/New_York', Date.UTC(2026, 0, 1)), -300);
  assert.strictEqual(A.tzOffset('UTC', Date.UTC(2026, 3, 3, 12)), 0);
});
test('dayBounds: 24 h normally, 23 h on the spring change and 25 h on the autumn change (Paris 2026)', () => {
  const h = (b) => (b.end - b.start) / 3600000;
  assert.strictEqual(h(A.dayBounds('Europe/Paris', 2026, 6, 10)), 24);
  assert.strictEqual(h(A.dayBounds('Europe/Paris', 2026, 3, 29)), 23);
  assert.strictEqual(h(A.dayBounds('Europe/Paris', 2026, 10, 25)), 25);
  assert.strictEqual(A.dayBounds('Africa/Algiers', 2026, 10, 17).start, Date.UTC(2026, 9, 16, 23));
});
test('zonedTime ↔ partsIn round trip, including the DST change days', () => {
  for (const [tz, y, m, d] of [['Europe/Paris', 2026, 3, 29], ['Europe/Paris', 2026, 10, 25], ['Australia/Sydney', 2026, 4, 5], ['Asia/Kolkata', 2026, 1, 1]]) {
    for (const [hh, mi] of [[0, 0], [5, 30], [12, 15], [23, 59]]) {
      const p = A.partsIn(tz, A.zonedTime(tz, y, m, d, hh, mi));
      assert.deepStrictEqual([p.y, p.m, p.d, p.h, p.mi], [y, m, d, hh, mi], `${tz} ${hh}:${mi}`);
    }
  }
});
test('validTz accepts IANA zones and rejects junk', () => {
  assert(A.validTz('Africa/Algiers')); assert(A.validTz('UTC')); assert(!A.validTz('Mars/Olympus')); assert(!A.validTz('x'));
});

console.log('Polar cases, shadows, phases');
test('Tromsø: midnight sun on 21 June, polar night on 21 December, ordinary day in October', () => {
  const j = A.sunDay(69.6492, 18.9553, 'Europe/Oslo', 2026, 6, 21), d = A.sunDay(69.6492, 18.9553, 'Europe/Oslo', 2026, 12, 21), o = A.sunDay(69.6492, 18.9553, 'Europe/Oslo', 2026, 10, 10);
  assert.strictEqual(j.polar, 'up'); assert.strictEqual(j.sunrise, null); near(j.dayLength / 3600000, 24, 1e-6);
  assert.strictEqual(d.polar, 'down'); assert.strictEqual(d.dayLength, 0); assert(d.civilDawn !== null, 'civil twilight still happens');
  assert.strictEqual(o.polar, null); assert(o.sunrise < o.noon && o.noon < o.sunset);
});
test('event order is chronological on an ordinary day', () => {
  const e = A.sunDay(36.7538, 3.0588, 'Africa/Algiers', 2026, 10, 17);
  const seq = ['astroDawn', 'nauticalDawn', 'civilDawn', 'blueMorningEnd', 'sunrise', 'goldenMorningEnd', 'noon', 'goldenEveningStart', 'sunset', 'blueEveningStart', 'civilDusk', 'nauticalDusk', 'astroDusk'].map((k) => e[k]);
  for (let i = 1; i < seq.length; i++) assert(seq[i] > seq[i - 1], 'index ' + i);
  near(e.dayLength / 3600000, 11.2, 0.05);
  near(e.noonAlt, 90 - 36.7538 + A.sunPosition(e.noon, 36.75, 3.06).dec, 0.05);
});
test('equinox: sun rises ≈ east (90°) and sets ≈ west (270°) everywhere; solstice azimuths mirror', () => {
  for (const c of [C[0], C[23], C[46]]) {
    const e = A.sunDay(c.lat, c.lon, c.tz, 2026, 3, 20);
    near(e.riseAz, 90, 1.5, c.name); near(e.setAz, 270, 1.5, c.name);
  }
  const jun = A.sunDay(36.75, 3.06, 'Africa/Algiers', 2026, 6, 21), dec = A.sunDay(36.75, 3.06, 'Africa/Algiers', 2026, 12, 21);
  near(jun.riseAz + dec.riseAz, 180, 1.5); near(jun.riseAz, 60, 1.5);
});
test('shadow: 45° → length = height, 30° → √3 × height, direction opposite the sun, none below the horizon', () => {
  near(A.shadow(2, 45, 100).length, 2, 1e-9); near(A.shadow(1, 30, 200).length, Math.sqrt(3), 1e-9);
  assert.strictEqual(A.shadow(1, 30, 200).dir, 20); assert.strictEqual(A.shadow(1, -2, 250).length, Infinity);
});
test('refraction ≈ 34′ at the horizon, ≈ 0 at the zenith', () => {
  near(A.refraction(0) * 60, 29, 6); near(A.refraction(90) * 60, 0, 0.05); assert.strictEqual(A.refraction(-5), 0);
});
test('nextPhase: full moon is ≥ 99.5 % lit, new moon ≤ 0.5 %, quarters ≈ 50 %, intervals ≈ 29.5 days', () => {
  const t0 = Date.UTC(2026, 9, 17), full = A.nextPhase(t0, 180), nw = A.nextPhase(t0, 0), q1 = A.nextPhase(t0, 90);
  assert(A.moonIllumination(full).fraction > 0.995); assert(A.moonIllumination(nw).fraction < 0.005); near(A.moonIllumination(q1).fraction, 0.5, 0.02);
  const full2 = A.nextPhase(full + 86400000, 180); near((full2 - full) / 86400000, 29.5, 1);
  near(full / MIN, Date.UTC(2026, 9, 26, 4, 12) / MIN, 20, 'full moon 26 Oct 2026 ≈ 04:12 UTC');
  assert.strictEqual(A.phaseKey(180), 'fullMoon'); assert.strictEqual(A.phaseKey(359), 'newMoon'); assert.strictEqual(A.phaseKey(95), 'firstQ');
});
test('lightPhase thresholds and phase segments cover the whole day without gaps', () => {
  assert.deepStrictEqual([10, 6, 0, -4, -5, -6, -10, -13, -20].map(A.lightPhase), ['day', 'day', 'golden', 'golden', 'blue', 'blue', 'nautical', 'astro', 'night']);
  const b = A.dayBounds('Africa/Algiers', 2026, 10, 17), segs = A.phaseSegments(36.75, 3.06, b.start, b.end);
  assert.strictEqual(segs[0].a, b.start); assert.strictEqual(segs[segs.length - 1].b, b.end);
  for (let i = 1; i < segs.length; i++) assert.strictEqual(segs[i].a, segs[i - 1].b);
  assert.deepStrictEqual(segs.map((x) => x.phase), ['night', 'astro', 'nautical', 'blue', 'golden', 'day', 'golden', 'blue', 'nautical', 'astro', 'night']);
});
test('alignments: in Algiers the sun sets due west (270° ± 1°) only around the equinoxes', () => {
  const res = A.alignments(36.7538, 3.0588, 'Africa/Algiers', 2026, 1, 1, { target: 270, tol: 1, events: ['set'], days: 365 });
  assert(res.length >= 2 && res.length <= 8, 'count ' + res.length);
  for (const r of res) { assert(r.m === 3 || r.m === 9, 'month ' + r.m); assert(Math.abs(r.diff) <= 1); }
  const moon = A.alignments(36.7538, 3.0588, 'Africa/Algiers', 2026, 1, 1, { target: 90, tol: 3, body: 'moon', events: ['rise'], days: 120 });
  assert(moon.length >= 2); assert(moon.every((r) => r.fraction >= 0 && r.fraction <= 1));
});

console.log('Settings, lens, i18n, cities');
test('sanitize clamps and rejects bad values; hash round trip keeps everything', () => {
  const s = ST.sanitize({ lat: 123, lon: -500, tz: 'Nope/Zone', date: '2026-13-40', time: '25:00', fov: 1000, days: 9, lang: 'xx', objH: -3 }, A.validTz);
  assert.strictEqual(s.lat, 89.99); assert.strictEqual(s.lon, -180); assert.strictEqual(s.tz, 'Africa/Algiers'); assert.strictEqual(s.date, null);
  assert.strictEqual(s.time, null); assert.strictEqual(s.fov, 140); assert.strictEqual(s.days, 7); assert.strictEqual(s.lang, 'fr'); assert.strictEqual(s.objH, 0.1);
  const a = ST.sanitize({ lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris', place: 'Paris', date: '2026-06-21', time: '21:30', cam: false, bearing: 300, fov: 40, focal: 50, objH: 12.5, days: 14, lang: 'kab' }, A.validTz);
  assert.deepStrictEqual(ST.fromHash(ST.toHash(a), A.validTz), a);
  assert.strictEqual(ST.fromHash('', A.validTz), null);
});
test('lens: 35 mm full frame ≈ 54.4°, 50 mm ≈ 39.6°, and focalFromFov inverts it', () => {
  near(ST.fovFromFocal(35), 54.43, 0.05); near(ST.fovFromFocal(50), 39.6, 0.05); near(ST.focalFromFov(ST.fovFromFocal(85)), 85, 1e-9);
});
test('i18n: every entry has FR / EN / Kabyle texts with the same placeholders; Tifinagh keeps tags and placeholders', () => {
  for (const [k, v] of Object.entries(I.S)) {
    assert(Array.isArray(v) && v.length === 3, k);
    if (k === 'months') continue;
    v.forEach((x) => assert(typeof x === 'string' && x.length, k));
    const ph = (x) => (x.match(/\{\w+\}/g) || []).sort().join();
    assert.strictEqual(ph(v[1]), ph(v[0]), k); assert.strictEqual(ph(v[2]), ph(v[0]), k);
  }
  assert.strictEqual(I.t('shadowOf', 'kab', { l: 3, d: 'x' }, true), '3 m ⵖⴻⵔ x');
  assert.strictEqual(I.toTifinagh('<b>Ass</b> {n}'), '<b>ⴰⵙⵙ</b> {n}');
  assert.strictEqual(I.t('months', 'kab').split(',').length, 12);
  assert.strictEqual(I.t('dirNames', 'fr').split(',').length, 16); assert.strictEqual(I.t('dirNames', 'kab').split(',').length, 16);
});
test('cities: valid coordinates and time zones, unique names', () => {
  assert(C.length >= 40);
  assert.strictEqual(new Set(C.map((c) => c.name)).size, C.length);
  for (const c of C) { assert(Math.abs(c.lat) < 90 && Math.abs(c.lon) <= 180, c.name); assert(A.validTz(c.tz), c.tz); }
});

console.log(`\n${n} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
