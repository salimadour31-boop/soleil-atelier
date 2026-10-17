/* settings.js — Soleil Atelier defaults, validation and shareable URL hash (#lat=…&lon=…&tz=…&d=…&t=…). MIT licence. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Settings = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const DEFAULTS = { lat: 36.7538, lon: 3.0588, tz: 'Africa/Algiers', place: 'Alger', date: null, time: null, cam: true, bearing: 270, fov: 54, focal: 35, objH: 1.8, days: 7, lang: 'fr' };
  const clamp = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/, TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  /** Sanitize an arbitrary object into valid settings (unknown keys dropped). validTz checks time zones. */
  function sanitize(o, validTz) {
    o = o && typeof o === 'object' ? o : {};
    const s = { ...DEFAULTS };
    s.lat = clamp(o.lat, -89.99, 89.99, DEFAULTS.lat);
    s.lon = clamp(o.lon, -180, 180, DEFAULTS.lon);
    s.tz = typeof o.tz === 'string' && (!validTz || validTz(o.tz)) ? o.tz : DEFAULTS.tz;
    s.place = typeof o.place === 'string' ? o.place.slice(0, 80) : '';
    s.date = typeof o.date === 'string' && DATE_RE.test(o.date) && !isNaN(Date.parse(o.date + 'T00:00Z')) ? o.date : null;
    s.time = typeof o.time === 'string' && TIME_RE.test(o.time) ? o.time : null;
    s.cam = o.cam === undefined ? DEFAULTS.cam : o.cam === true || o.cam === 1 || o.cam === '1';
    s.bearing = Math.round(clamp(o.bearing, 0, 359, DEFAULTS.bearing));
    s.fov = Math.round(clamp(o.fov, 5, 140, DEFAULTS.fov));
    s.focal = Math.round(clamp(o.focal, 8, 800, DEFAULTS.focal));
    s.objH = Math.round(clamp(o.objH, 0.1, 500, DEFAULTS.objH) * 100) / 100;
    s.days = [7, 14, 30].includes(Number(o.days)) ? Number(o.days) : DEFAULTS.days;
    s.lang = ['fr', 'en', 'kab'].includes(o.lang) ? o.lang : DEFAULTS.lang;
    return s;
  }
  const KEYS = { lat: 'lat', lon: 'lon', tz: 'tz', place: 'p', date: 'd', time: 't', cam: 'cam', bearing: 'b', fov: 'fov', focal: 'f', objH: 'h', days: 'n', lang: 'l' };
  function toHash(s) {
    const q = [];
    for (const [k, short] of Object.entries(KEYS)) {
      let v = s[k];
      if (v === null || v === undefined || v === '') continue;
      if (k === 'cam') v = v ? 1 : 0;
      if (k === 'lat' || k === 'lon') v = Number(v).toFixed(4);
      q.push(short + '=' + encodeURIComponent(v));
    }
    return '#' + q.join('&');
  }
  function fromHash(hash, validTz) {
    const o = {};
    const inv = Object.fromEntries(Object.entries(KEYS).map(([a, b]) => [b, a]));
    for (const part of String(hash || '').replace(/^#/, '').split('&')) {
      const [k, v] = part.split('=');
      if (!k || v === undefined || !inv[k]) continue;
      try { o[inv[k]] = decodeURIComponent(v); } catch (e) { /* ignore malformed pieces */ }
    }
    if (o.cam !== undefined) o.cam = o.cam === '1';
    return Object.keys(o).length ? sanitize(o, validTz) : null;
  }
  /** Horizontal field of view (degrees) of a rectilinear lens on a sensor of the given width (mm, 36 = full frame). */
  const fovFromFocal = (f, sensor = 36) => (2 * Math.atan(sensor / (2 * f)) * 180) / Math.PI;
  const focalFromFov = (fov, sensor = 36) => sensor / (2 * Math.tan((fov * Math.PI) / 360));
  return { DEFAULTS, sanitize, toHash, fromHash, fovFromFocal, focalFromFov };
});
