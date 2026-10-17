// Headless UI test (Playwright + Chrome/Chromium): node tests/ui.test.js
// Serves the folder locally and runs the interface at 1440 × 900 (desktop) and 390 × 844 (mobile): hash restore,
// non-blank canvases, readouts, city / coordinates / time-zone changes, date navigation, time slider and strip drag,
// event rows, camera wedge + sun-in-frame, three languages (+ Tifinagh), tabs (next days, year chart, alignment
// search), exports (PNG / CSV / ICS / JSON content checked), JSON import, keyboard, animation, theme, help,
// geolocation (fake position), no console errors, no horizontal overflow. Writes the README screenshots.
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(path.resolve(__dirname, '../../node_modules/playwright'))); }
const root = path.resolve(__dirname, '..'), shots = path.join(root, 'screenshots');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0].split('#')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
let checks = 0;
const pngSize = (buf) => ({ sig: buf.subarray(1, 4).toString(), w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });
async function download(page, action) {
  const [dl] = await Promise.all([page.waitForEvent('download'), action()]);
  return { name: dl.suggestedFilename(), buf: fs.readFileSync(await dl.path()) };
}
const canvasStats = (page, id) => page.evaluate((id) => {
  const c = document.getElementById(id), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, seen = new Set();
  let s = 0, s2 = 0, n = 0;
  for (let i = 0; i < d.length; i += 4 * 5) { const y = 0.2 * d[i] + 0.7 * d[i + 1] + 0.1 * d[i + 2]; s += y; s2 += y * y; n++; seen.add((d[i] >> 3) + ',' + (d[i + 1] >> 3) + ',' + (d[i + 2] >> 3)); }
  const m = s / n;
  return { std: Math.sqrt(Math.max(0, s2 / n - m * m)), colours: seen.size, w: c.width, h: c.height };
}, id);
const txt = (page, id) => page.$eval('#' + id, (e) => e.textContent.trim());
const st = (page) => page.evaluate(() => { const a = window.SoleilApp, s = a.state; return { s: { ...s.s }, y: s.y, m: s.m, d: s.d, min: s.min, tab: s.tab, sunrise: s.day.sunrise, start: s.day.start, end: s.day.end, polar: s.day.polar, instant: a.instant() }; });
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

async function run(browser, base, vp, name) {
  const mobile = vp.width < 500;
  const ctx = await browser.newContext({ viewport: vp, acceptDownloads: true, deviceScaleFactor: mobile ? 2 : 1, colorScheme: 'dark', permissions: ['geolocation', 'clipboard-read', 'clipboard-write'], geolocation: { latitude: 36.3749, longitude: 3.902 }, timezoneId: 'Africa/Algiers' });
  const page = await ctx.newPage(), errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  const ok = (m) => { checks++; console.log(`  ✓ [${name}] ${m}`); };

  // 1. hash restore: Algiers, 17 Oct 2026, 17:40, camera to the west
  await page.goto(base + '#lat=36.7538&lon=3.0588&tz=Africa%2FAlgiers&p=Alger&d=2026-10-17&t=17:40&cam=1&b=255&fov=54&f=35&h=1.8&n=7&l=fr', { waitUntil: 'load' });
  await page.waitForFunction(() => window.SoleilApp && window.SoleilApp.state.ready);
  await settle(page);
  let s = await st(page);
  assert.deepStrictEqual([s.y, s.m, s.d], [2026, 10, 17]); assert.strictEqual(await page.$eval('#timeOut', (e) => e.textContent), '17:40');
  assert.strictEqual(await page.$eval('#city', (e) => e.options[e.selectedIndex].text), 'Alger');
  ok('hash restored (place, date, time, camera)');
  for (const id of ['sky', 'timeline', 'elev']) { const c = await canvasStats(page, id); assert(c.std > 12 && c.colours > 12, id + ' ' + JSON.stringify(c)); }
  ok('sky diagram, light strip and elevation chart are drawn');
  const rows = await page.$$eval('#events tr', (r) => r.map((x) => x.textContent));
  assert(rows.length >= 13, 'rows ' + rows.length);
  assert(rows.some((r) => r.startsWith('06:57') && r.includes('Lever du soleil')), 'sunrise 06:57');
  assert(rows.some((r) => r.startsWith('18:09') && r.includes('Coucher du soleil')), 'sunset 18:09');
  ok('event table: ' + rows.length + ' rows, sunrise 06:57, sunset 18:09');
  assert.match(await txt(page, 'sunPhase'), /Heure dorée/);
  assert.match(await txt(page, 'camInfo'), /Soleil dans le champ/);
  assert.match(await txt(page, 'dayLen'), /11 h 12 min/);
  assert.match(await txt(page, 'moonIll'), /%/);
  ok('readouts: golden hour, sun in frame, day length, moon');
  if (!mobile) await page.screenshot({ path: path.join(shots, 'desktop.png') });

  // 2. time slider, strip drag, event row click, keyboard
  await page.$eval('#time', (e) => { e.value = '720'; e.dispatchEvent(new Event('input')); });
  assert.strictEqual(await page.$eval('#timeOut', (e) => e.textContent), '12:00');
  assert.match(await txt(page, 'sunPhase'), /Plein jour/);
  await page.$eval('#timeline', (c) => c.scrollIntoView({ block: 'center' }));
  const box = await page.$eval('#timeline', (c) => { const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await page.mouse.click(box.x + 34 + (box.w - 46) * 0.25, box.y + 20);
  s = await st(page); assert(Math.abs(s.min - 360) <= 4, 'strip click → ' + s.min);
  ok('time slider and 24 h strip set the time');
  await page.click('#events tr:has-text("Coucher du soleil")');
  assert.strictEqual(await page.$eval('#timeOut', (e) => e.textContent), '18:09');
  await page.click('h1');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Shift+ArrowLeft');
  assert.strictEqual(await page.$eval('#timeOut', (e) => e.textContent), '17:19');
  await page.keyboard.press('PageDown');
  s = await st(page); assert.deepStrictEqual([s.y, s.m, s.d], [2026, 10, 18]); assert.strictEqual(await page.$eval('#timeOut', (e) => e.textContent), '17:19');
  await page.click('#prevDay');
  s = await st(page); assert.strictEqual(s.d, 17);
  ok('event click, arrows, PageDown, previous day keep the wall-clock time');

  // 3. city, coordinates, time zone, DST day, polar day
  await page.selectOption('#city', { label: 'Paris' });
  s = await st(page); assert.strictEqual(s.s.tz, 'Europe/Paris'); assert.match(await txt(page, 'tzOff'), /UTC\+02/);
  await page.fill('#date', '2026-10-25'); await page.$eval('#date', (e) => e.dispatchEvent(new Event('change')));
  s = await st(page); assert.strictEqual((s.end - s.start) / 3600000, 25); assert.strictEqual(await page.$eval('#time', (e) => e.max), String(25 * 60 - 1));
  ok('Paris on the 25-hour DST day');
  await page.selectOption('#city', { label: 'Tromsø' });
  await page.fill('#date', '2026-06-21'); await page.$eval('#date', (e) => e.dispatchEvent(new Event('change')));
  assert(!(await page.$eval('#polar', (e) => e.hidden))); assert.match(await txt(page, 'polar'), /Soleil de minuit/);
  ok('Tromsø midnight sun notice');
  await page.fill('#lat', '-33.9249'); await page.fill('#lon', '18.4241'); await page.$eval('#lon', (e) => e.dispatchEvent(new Event('change')));
  await page.selectOption('#tz', 'Africa/Johannesburg');
  assert.strictEqual(await page.$eval('#city', (e) => e.options[e.selectedIndex].text), 'Le Cap');
  s = await st(page); assert(s.sunrise && s.polar === null);
  ok('custom coordinates + time zone (matches the Cape Town preset)');
  // geolocation (fake: Bouira)
  await page.click('#geoBtn');
  await page.waitForFunction(() => Math.abs(window.SoleilApp.state.s.lat - 36.3749) < 1e-3);
  s = await st(page); assert.strictEqual(s.s.tz, 'Africa/Algiers'); assert.strictEqual(await page.$eval('#city', (e) => e.options[e.selectedIndex].text), 'Bouira');
  ok('“My location” uses the browser position and time zone');

  // 4. camera
  await page.selectOption('#city', { label: 'Alger' });
  await page.fill('#date', '2026-10-17'); await page.$eval('#date', (e) => e.dispatchEvent(new Event('change')));
  await page.click('#events tr:has-text("Début de l’heure dorée")');
  await page.fill('#focal', '200'); await page.$eval('#focal', (e) => e.dispatchEvent(new Event('change')));
  assert.strictEqual(await page.$eval('#fov', (e) => e.value), '10');
  await page.$eval('#bearing', (e) => { e.value = '60'; e.dispatchEvent(new Event('input')); });
  assert.match(await txt(page, 'camInfo'), /lumière de face/);
  // clicking the diagram points the camera
  await page.$eval('#sky', (c) => c.scrollIntoView({ block: 'center' }));
  const sk = await page.$eval('#sky', (c) => { const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; });
  await page.mouse.click(sk.x + sk.w / 2, sk.y + sk.w * 0.75);
  s = await st(page); assert(Math.abs(s.s.bearing - 180) <= 1, 'bearing ' + s.s.bearing);
  ok('focal → field of view, front light, click on the diagram sets the bearing to south');

  // 5. languages
  await page.selectOption('#lang', 'en');
  assert.strictEqual(await page.$eval('h2[data-i18n="place"]', (e) => e.textContent), 'Location');
  assert(await page.$eval('#events', (e) => e.textContent.includes('Sunrise')));
  await page.selectOption('#lang', 'kab');
  assert(!(await page.$eval('#tfngWrap', (e) => e.hidden)));
  assert.strictEqual(await page.$eval('h2[data-i18n="place"]', (e) => e.textContent), 'Adig');
  await page.check('#tfng');
  assert.strictEqual(await page.$eval('h2[data-i18n="place"]', (e) => e.textContent), 'ⴰⴷⵉⴳ');
  assert(await page.$eval('body', (e) => e.classList.contains('tfng')));
  if (!mobile) { await page.click('#events tr:has-text("ⵜⴰⵙⵔⴰⴳⵜ")').catch(() => {}); await page.screenshot({ path: path.join(shots, 'kabyle-tifinagh.png') }); }
  await page.uncheck('#tfng'); await page.selectOption('#lang', 'fr');
  ok('English, Taqbaylit and Tifinagh');

  // 6. tabs
  await page.click('#events tr:has-text("Coucher du soleil")');
  await page.selectOption('#days', '30');
  assert.strictEqual(await page.$$eval('#daysBody tr', (r) => r.length), 30);
  await page.click('#tab-year'); await settle(page);
  const yc = await canvasStats(page, 'year'); assert(yc.std > 20 && yc.colours >= 6, 'year ' + JSON.stringify(yc));
  if (!mobile) await page.$eval('#year', (e) => e.closest('.card').scrollIntoView()), await page.locator('#year').locator('xpath=..').screenshot({ path: path.join(shots, 'year.png') });
  await page.click('#tab-align');
  await page.fill('#alTarget', '270'); await page.fill('#alTol', '1'); await page.selectOption('#alKind', 'set');
  await page.click('#alGo');
  await page.waitForFunction(() => /date/.test(document.getElementById('alStatus').textContent));
  const al = await page.$$eval('#alBody2 tr', (r) => r.map((x) => x.textContent));
  assert(al.length >= 2 && al.every((r) => /mars|sept/.test(r)), al.join(' | '));
  await page.click('#alBody2 button');
  s = await st(page); assert(s.m === 3 || s.m === 9);
  if (!mobile) await page.evaluate(() => document.getElementById('toast').classList.remove('show')), await page.locator('#pane-align').locator('xpath=..').screenshot({ path: path.join(shots, 'alignment.png') });
  ok(`next 30 days table, year chart, alignment search (${al.length} sunsets due west)`);

  // 7. exports
  await page.goto(base + '#lat=36.7169&lon=4.0497&tz=Africa%2FAlgiers&p=Tizi%20Ouzou&d=2026-10-17&t=17:30&cam=1&b=250&n=7&l=fr');
  await page.waitForFunction(() => window.SoleilApp.state.ready && window.SoleilApp.state.s.place === 'Tizi Ouzou');
  let f = await download(page, () => page.click('#exSky'));
  let ps = pngSize(f.buf); assert.strictEqual(ps.sig, 'PNG'); assert.deepStrictEqual([ps.w, ps.h], [1600, 1900]); assert.match(f.name, /^soleil-tizi-ouzou-2026-10-17\.png$/);
  if (!mobile) fs.writeFileSync(path.join(shots, 'export-diagram.png'), f.buf);
  f = await download(page, () => page.click('#exYear'));
  ps = pngSize(f.buf); assert.deepStrictEqual([ps.w, ps.h], [2000, 1100]);
  f = await download(page, () => page.click('#exCsv'));
  const csv = f.buf.toString('utf8').split('\r\n');
  assert(csv[1].startsWith('date,astro_dawn')); assert.strictEqual(csv.filter((l) => /^"2026-/.test(l)).length, 7);
  f = await download(page, () => page.click('#exIcs'));
  const ics = f.buf.toString('utf8');
  assert(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.trim().endsWith('END:VCALENDAR'));
  assert.strictEqual((ics.match(/BEGIN:VEVENT/g) || []).length, 28);
  assert(ics.split('\r\n').every((l) => Buffer.byteLength(l) <= 75), 'folded lines');
  assert.match(ics, /SUMMARY:Heure dorée \(soir\)/); assert.match(ics, /DTSTART:2026101\dT\d{6}Z/);
  f = await download(page, () => page.click('#exJson'));
  const js = JSON.parse(f.buf.toString('utf8'));
  assert.strictEqual(js.app, 'soleil-atelier'); assert.strictEqual(js.settings.place, 'Tizi Ouzou'); assert(js.day.sunrise.startsWith('2026-10-17T05:5'));
  ok('PNG diagram 1600×1900, year PNG 2000×1100, CSV (7 days), ICS (28 events, folded), JSON');
  // import: change place, then load the JSON back
  await page.selectOption('#city', { label: 'Tokyo' });
  const tmp = path.join(require('os').tmpdir(), 'soleil-import.json'); fs.writeFileSync(tmp, JSON.stringify(js));
  await page.setInputFiles('#imJson', tmp);
  await page.waitForFunction(() => window.SoleilApp.state.s.place === 'Tizi Ouzou');
  assert.strictEqual(await page.$eval('#timeOut', (e) => e.textContent), '17:30');
  await page.setInputFiles('#imJson', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"nope":1}') });
  await page.waitForFunction(() => document.getElementById('toast').textContent.includes('non reconnu'));
  ok('JSON import restores settings; invalid file is rejected');
  await page.click('#copyLink');
  await page.waitForFunction(() => location.hash.includes('t=17%3A30') || location.hash.includes('t=17:30'));
  ok('copy link writes the settings into the address');

  // 8. animation, theme, help
  await page.click('#animBtn'); await page.waitForTimeout(400); await page.click('#animBtn');
  s = await st(page); assert(s.min !== 17 * 60 + 30, 'animation moved the time');
  await page.click('#themeBtn');
  assert.strictEqual(await page.$eval('html', (e) => e.dataset.theme), 'light');
  if (!mobile) { await page.click('#nowBtn').catch(() => {}); await page.goto(base + '#lat=48.8566&lon=2.3522&tz=Europe%2FParis&p=Paris&d=2026-06-21&t=21:35&cam=1&b=300&n=7&l=fr'); await page.waitForFunction(() => window.SoleilApp.state.ready); await settle(page); await page.evaluate(() => document.getElementById('toast').classList.remove('show')); await page.screenshot({ path: path.join(shots, 'desktop-light.png') }); }
  await page.click('#themeBtn');
  await page.click('#helpBtn'); assert(await page.$eval('#help', (e) => e.open)); await page.keyboard.press('Escape');
  ok('animation, light theme, help dialog');

  // 9. layout
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  assert(sw <= vp.width + 1, 'horizontal overflow ' + sw);
  if (mobile) {
    await page.goto(base + '#lat=36.7538&lon=3.0588&tz=Africa%2FAlgiers&p=Alger&d=2026-10-17&t=17:40&cam=1&b=255&n=7&l=fr'); await page.reload(); await page.waitForFunction(() => window.SoleilApp.state.ready); await settle(page);
    await page.$eval('.readouts', (e) => e.scrollIntoView()); await settle(page);
    await page.screenshot({ path: path.join(shots, 'mobile.png') });
  }
  assert.deepStrictEqual(errors, []);
  ok('no horizontal overflow, no console errors');
  await ctx.close();
}

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const exe = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  fs.mkdirSync(shots, { recursive: true });
  try {
    await run(browser, base, { width: 1440, height: 900 }, 'desktop');
    await run(browser, base, { width: 390, height: 844 }, 'mobile');
    console.log(`\n${checks} UI checks passed`);
  } catch (e) { console.error('\n✗ ' + (e.stack || e)); process.exitCode = 1; }
  await browser.close(); server.close();
})();
