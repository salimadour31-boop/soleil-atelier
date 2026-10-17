/* cities.js — Soleil Atelier offline city presets (coordinates rounded to ~1 km, IANA time zones). MIT licence.
 * Grouped by region; the first entry is the default location. Public geographic facts, compiled for this project. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CITIES = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // [name, latitude, longitude, time zone, group]
  const L = [
    ['Alger', 36.7538, 3.0588, 'Africa/Algiers', 'dz'], ['Tizi Ouzou', 36.7169, 4.0497, 'Africa/Algiers', 'dz'], ['Béjaïa', 36.7509, 5.0567, 'Africa/Algiers', 'dz'],
    ['Bouira', 36.3749, 3.902, 'Africa/Algiers', 'dz'], ['Sétif', 36.1898, 5.4108, 'Africa/Algiers', 'dz'], ['Constantine', 36.365, 6.6147, 'Africa/Algiers', 'dz'],
    ['Annaba', 36.9, 7.7667, 'Africa/Algiers', 'dz'], ['Oran', 35.6971, -0.6308, 'Africa/Algiers', 'dz'], ['Tlemcen', 34.8828, -1.3167, 'Africa/Algiers', 'dz'],
    ['Batna', 35.5559, 6.1741, 'Africa/Algiers', 'dz'], ['Ghardaïa', 32.4909, 3.6735, 'Africa/Algiers', 'dz'], ['Biskra', 34.8504, 5.7281, 'Africa/Algiers', 'dz'],
    ['Djanet', 24.5547, 9.4847, 'Africa/Algiers', 'dz'], ['Tamanrasset', 22.785, 5.5228, 'Africa/Algiers', 'dz'],
    ['Rabat', 34.0209, -6.8416, 'Africa/Casablanca', 'mag'], ['Casablanca', 33.5731, -7.5898, 'Africa/Casablanca', 'mag'], ['Marrakech', 31.6295, -7.9811, 'Africa/Casablanca', 'mag'],
    ['Agadir', 30.4278, -9.5981, 'Africa/Casablanca', 'mag'], ['Tunis', 36.8065, 10.1815, 'Africa/Tunis', 'mag'], ['Djerba', 33.8076, 10.8451, 'Africa/Tunis', 'mag'],
    ['Tripoli', 32.8872, 13.1913, 'Africa/Tripoli', 'mag'], ['Le Caire', 30.0444, 31.2357, 'Africa/Cairo', 'mag'], ['Dakar', 14.7167, -17.4677, 'Africa/Dakar', 'mag'],
    ['Paris', 48.8566, 2.3522, 'Europe/Paris', 'eu'], ['Marseille', 43.2965, 5.3698, 'Europe/Paris', 'eu'], ['Lyon', 45.764, 4.8357, 'Europe/Paris', 'eu'],
    ['Bruxelles', 50.8503, 4.3517, 'Europe/Brussels', 'eu'], ['Genève', 46.2044, 6.1432, 'Europe/Zurich', 'eu'], ['Londres', 51.5072, -0.1276, 'Europe/London', 'eu'],
    ['Madrid', 40.4168, -3.7038, 'Europe/Madrid', 'eu'], ['Lisbonne', 38.7223, -9.1393, 'Europe/Lisbon', 'eu'], ['Rome', 41.9028, 12.4964, 'Europe/Rome', 'eu'],
    ['Berlin', 52.52, 13.405, 'Europe/Berlin', 'eu'], ['Istanbul', 41.0082, 28.9784, 'Europe/Istanbul', 'eu'], ['Reykjavik', 64.1466, -21.9426, 'Atlantic/Reykjavik', 'eu'],
    ['Tromsø', 69.6492, 18.9553, 'Europe/Oslo', 'eu'],
    ['Montréal', 45.5019, -73.5674, 'America/Toronto', 'am'], ['New York', 40.7128, -74.006, 'America/New_York', 'am'], ['Los Angeles', 34.0522, -118.2437, 'America/Los_Angeles', 'am'],
    ['Mexico', 19.4326, -99.1332, 'America/Mexico_City', 'am'], ['São Paulo', -23.5558, -46.6396, 'America/Sao_Paulo', 'am'], ['Buenos Aires', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires', 'am'],
    ['Dubaï', 25.2048, 55.2708, 'Asia/Dubai', 'as'], ['Mumbai', 19.076, 72.8777, 'Asia/Kolkata', 'as'], ['Tokyo', 35.6762, 139.6503, 'Asia/Tokyo', 'as'],
    ['Sydney', -33.8688, 151.2093, 'Australia/Sydney', 'as'], ['Le Cap', -33.9249, 18.4241, 'Africa/Johannesburg', 'as'],
  ];
  return L.map(([name, lat, lon, tz, group]) => ({ name, lat, lon, tz, group }));
});
