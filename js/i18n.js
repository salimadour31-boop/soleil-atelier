/* i18n.js — Soleil Atelier interface texts: French (default), English, Taqbaylit (Kabyle, Latin script) with
 * optional Tifinagh rendering of the Kabyle texts. Each entry is [fr, en, kab]; placeholders look like {n}.
 * The Kabyle texts are a first draft — corrections are welcome. Original texts, MIT licence. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.I18N = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const S = {
    skip: ['Aller au diagramme', 'Skip to the diagram', 'Ddu ɣer udiyagram'],
    tagline: ['Planificateur de lumière solaire et lunaire pour photo, vidéo et cinéma', 'Sun and moon light planner for photo, video and film', 'Aheggi n tafat n tafukt d wayyur i tewlafin, tavidyut d usinima'],
    language: ['Langue', 'Language', 'Tutlayt'],
    tifinagh: ['Tifinagh', 'Tifinagh', 'Tifinaɣ'],
    uiTheme: ['Interface claire / sombre', 'Light / dark interface', 'Agrudem amellal / aberkan'],
    help: ['Aide', 'Help', 'Tallelt'],
    close: ['Fermer', 'Close', 'Mdel'],
    // place & time
    place: ['Lieu', 'Location', 'Adig'],
    city: ['Ville', 'City', 'Tamdint'],
    custom: ['Coordonnées personnalisées', 'Custom coordinates', 'Imsidag udmawanen'],
    grpDz: ['Algérie', 'Algeria', 'Lezzayer'], grpMag: ['Afrique du Nord et de l’Ouest', 'North & West Africa', 'Tafriqt n ugafa d umalu'],
    grpEu: ['Europe', 'Europe', 'Turuft'], grpAm: ['Amériques', 'Americas', 'Timrikin'], grpAs: ['Asie, Océanie, Afrique australe', 'Asia, Oceania, Southern Africa', 'Asya, Usyanya, Tafriqt n unẓul'],
    lat: ['Latitude (°N)', 'Latitude (°N)', 'Latitude (°N)'],
    lon: ['Longitude (°E)', 'Longitude (°E)', 'Longitude (°E)'],
    tz: ['Fuseau horaire', 'Time zone', 'Tamnaḍt n wakud'],
    myPos: ['Ma position', 'My location', 'Adig-iw'],
    geoFail: ['Position indisponible (autorisation refusée ou absente).', 'Location unavailable (permission denied or missing).', 'Adig ulac-it (ur yettwasireg ara).'],
    geoOk: ['Position trouvée — vérifiez le fuseau horaire.', 'Location found — check the time zone.', 'Adig yettwaf — senqed tamnaḍt n wakud.'],
    date: ['Date', 'Date', 'Azemz'],
    today: ['Aujourd’hui', 'Today', 'Ass-a'],
    prevDay: ['Jour précédent', 'Previous day', 'Ass yezrin'],
    nextDay: ['Jour suivant', 'Next day', 'Ass d-iteddun'],
    time: ['Heure', 'Time', 'Akud'],
    now: ['Maintenant', 'Now', 'Tura'],
    animate: ['Animer la journée', 'Animate the day', 'Ssmussu ass'],
    stopAnim: ['Arrêter l’animation', 'Stop the animation', 'Seḥbes asmussu'],
    utcOffset: ['UTC{o}', 'UTC{o}', 'UTC{o}'],
    // camera & shadow
    camera: ['Caméra et ombre', 'Camera & shadow', 'Takamirat d tili'],
    showCam: ['Afficher l’axe de la caméra', 'Show the camera axis', 'Sken tanila n tkamirat'],
    bearing: ['Direction visée (azimut)', 'Camera bearing (azimuth)', 'Tanila (azimut)'],
    fov: ['Champ horizontal', 'Horizontal field of view', 'Annar n tmuɣli'],
    focal: ['Focale (mm, plein format)', 'Focal length (mm, full frame)', 'Tifukal (mm, full frame)'],
    objH: ['Hauteur de l’objet (m)', 'Object height (m)', 'Teɣzi n tɣawsa (m)'],
    inFrame: ['Soleil dans le champ', 'Sun in frame', 'Tafukt deg wannar'],
    backlit: ['contre-jour', 'backlight', 'tafat seffir'],
    frontlit: ['lumière de face', 'front light', 'tafat s sdat'],
    sidelit: ['lumière latérale', 'side light', 'tafat s yidis'],
    // readouts
    sun: ['Soleil', 'Sun', 'Tafukt'],
    moon: ['Lune', 'Moon', 'Ayyur'],
    az: ['Azimut', 'Azimuth', 'Azimut'],
    elev: ['Élévation', 'Elevation', 'Asawen'],
    lightNow: ['Lumière', 'Light', 'Tafat'],
    shadowLen: ['Ombre', 'Shadow', 'Tili'],
    shadowOf: ['{l} m vers {d}', '{l} m towards {d}', '{l} m ɣer {d}'],
    shadowInf: ['pas d’ombre portée (soleil couché)', 'no cast shadow (sun down)', 'ulac tili (tafukt teɣli)'],
    illum: ['Illumination', 'Illumination', 'Tafat'],
    distance: ['Distance', 'Distance', 'Ameccaq'],
    belowHorizon: ['sous l’horizon', 'below the horizon', 'ddaw yiri n igenni'],
    nextIn: ['dans {d}', 'in {d}', 'deg {d}'],
    agoBy: ['il y a {d}', '{d} ago', 'aya {d}'],
    // phases
    ph_day: ['Plein jour', 'Daylight', 'Ass'],
    ph_golden: ['Heure dorée', 'Golden hour', 'Tasragt n wureɣ'],
    ph_blue: ['Heure bleue', 'Blue hour', 'Tasragt tazegzawt'],
    ph_nautical: ['Crépuscule nautique / civil', 'Nautical / civil twilight', 'Tafrara / tameddit'],
    ph_astro: ['Crépuscule astronomique', 'Astronomical twilight', 'Tafrara tasnallunt'],
    ph_night: ['Nuit', 'Night', 'Iḍ'],
    // events
    events: ['Horaires du jour', 'Today’s times', 'Ikuden n wass'],
    ev_astroDawn: ['Aube astronomique', 'Astronomical dawn', 'Tafrara tasnallunt'],
    ev_nauticalDawn: ['Aube nautique', 'Nautical dawn', 'Tafrara n yilel'],
    ev_civilDawn: ['Aube civile · début heure bleue', 'Civil dawn · blue hour starts', 'Tafrara · tasragt tazegzawt tebda'],
    ev_blueMorningEnd: ['Fin heure bleue · début heure dorée', 'Blue hour ends · golden hour starts', 'Taggara n tsragt tazegzawt · tasragt n wureɣ tebda'],
    ev_sunrise: ['Lever du soleil', 'Sunrise', 'Tulya n tafukt'],
    ev_goldenMorningEnd: ['Fin de l’heure dorée', 'Golden hour ends', 'Taggara n tsragt n wureɣ'],
    ev_noon: ['Midi solaire (culmination)', 'Solar noon (transit)', 'Azal (tafukt d asawen)'],
    ev_goldenEveningStart: ['Début de l’heure dorée', 'Golden hour starts', 'Tasragt n wureɣ tebda'],
    ev_sunset: ['Coucher du soleil', 'Sunset', 'Aɣelluy n tafukt'],
    ev_blueEveningStart: ['Fin heure dorée · début heure bleue', 'Golden hour ends · blue hour starts', 'Taggara n wureɣ · tasragt tazegzawt tebda'],
    ev_civilDusk: ['Crépuscule civil · fin heure bleue', 'Civil dusk · blue hour ends', 'Tameddit · taggara n tsragt tazegzawt'],
    ev_nauticalDusk: ['Crépuscule nautique', 'Nautical dusk', 'Tameddit n yilel'],
    ev_astroDusk: ['Crépuscule astronomique (nuit noire)', 'Astronomical dusk (full dark)', 'Tameddit tasnallunt (iḍ aberkan)'],
    ev_moonrise: ['Lever de la lune', 'Moonrise', 'Tulya n wayyur'],
    ev_moonset: ['Coucher de la lune', 'Moonset', 'Aɣelluy n wayyur'],
    ev_moonTransit: ['Culmination de la lune', 'Moon transit', 'Ayyur d asawen'],
    dayLength: ['Durée du jour', 'Day length', 'Teɣzi n wass'],
    vsYesterday: ['{d} par rapport à la veille', '{d} vs. the day before', '{d} ɣef yiḍelli'],
    polarUp: ['Soleil de minuit : le soleil ne se couche pas ce jour-là.', 'Midnight sun: the sun does not set on this day.', 'Tafukt n wezgen n yiḍ: ur teɣli ara ass-a.'],
    polarDown: ['Nuit polaire : le soleil ne se lève pas ce jour-là.', 'Polar night: the sun does not rise on this day.', 'Iḍ n ugafa: tafukt ur d-tettali ara ass-a.'],
    noEvent: ['—', '—', '—'],
    goldenTotal: ['Heure dorée : {a} le matin, {b} le soir', 'Golden hour: {a} morning, {b} evening', 'Tasragt n wureɣ: {a} taṣebḥit, {b} tameddit'],
    // moon phases
    newMoon: ['Nouvelle lune', 'New moon', 'Ayyur amaynut'], waxCres: ['Premier croissant', 'Waxing crescent', 'Ayyur yettimɣur'],
    firstQ: ['Premier quartier', 'First quarter', 'Rrbeɛ amezwaru'], waxGib: ['Lune gibbeuse croissante', 'Waxing gibbous', 'Ayyur ameqqran yettimɣur'],
    fullMoon: ['Pleine lune', 'Full moon', 'Ayyur yeččuren'], wanGib: ['Lune gibbeuse décroissante', 'Waning gibbous', 'Ayyur ameqqran yettneqqis'],
    lastQ: ['Dernier quartier', 'Last quarter', 'Rrbeɛ aneggaru'], wanCres: ['Dernier croissant', 'Waning crescent', 'Ayyur yettneqqis'],
    nextFull: ['Prochaine pleine lune', 'Next full moon', 'Ayyur yeččuren d-iteddun'],
    nextNew: ['Prochaine nouvelle lune', 'Next new moon', 'Ayyur amaynut d-iteddun'],
    ageDays: ['âge {n} j', 'age {n} d', 'leɛmer {n} n wussan'],
    // diagram
    sky: ['Course du soleil et de la lune', 'Sun and moon path', 'Abrid n tafukt d wayyur'],
    skyAria: ['Diagramme du ciel vu d’en haut : horizon sur le cercle, zénith au centre, nord en haut', 'Sky diagram seen from above: horizon on the circle, zenith in the centre, north up', 'Adiyagram n igenni: yiri d tawinest, asawen di tlemmast, agafa d asawen'],
    lgToday: ['Course du jour', 'Today’s path', 'Abrid n wass'],
    lgSolstices: ['Solstices (juin / décembre)', 'Solstices (June / December)', 'Tizzyiwin n tafukt (Yunyu / Duǧembeṛ)'],
    lgEquinox: ['Équinoxe', 'Equinox', 'Tagnit n wass d yiḍ'],
    lgMoon: ['Lune', 'Moon', 'Ayyur'],
    lgRiseSet: ['Directions lever / coucher', 'Rise / set directions', 'Tinila n tulya / uɣelluy'],
    lgCamera: ['Champ de la caméra', 'Camera field', 'Annar n tkamirat'],
    timeline: ['Lumière sur 24 h', 'Light over 24 h', 'Tafat deg 24 n isragen'],
    timelineAria: ['Frise de la journée : faites glisser pour changer l’heure', 'Day strip: drag to change the time', 'Azrir n wass: zuɣer akken ad tbeddleḍ akud'],
    elevChart: ['Hauteur du soleil et de la lune', 'Sun and moon elevation', 'Asawen n tafukt d wayyur'],
    // tabs
    tabDays: ['Jours suivants', 'Next days', 'Ussan d-iteddun'],
    tabYear: ['Année', 'Year', 'Aseggas'],
    tabAlign: ['Alignement', 'Alignment', 'Aseɣwen'],
    days: ['Nombre de jours', 'Number of days', 'Amḍan n wussan'],
    colDate: ['Date', 'Date', 'Azemz'], colDawn: ['Aube civ.', 'Civil dawn', 'Tafrara'], colRise: ['Lever', 'Sunrise', 'Tulya'],
    colGm: ['Fin dorée', 'Golden ends', 'Taggara n wureɣ'], colNoon: ['Midi', 'Noon', 'Azal'], colGe: ['Début dorée', 'Golden starts', 'Tazwara n wureɣ'],
    colSet: ['Coucher', 'Sunset', 'Aɣelluy'], colDusk: ['Crép. civ.', 'Civil dusk', 'Tameddit'], colLen: ['Durée', 'Length', 'Teɣzi'], colMoon: ['Lune', 'Moon', 'Ayyur'],
    yearAria: ['Graphique annuel : heure locale en ordonnée, mois en abscisse, couleurs = phases de lumière', 'Year chart: local time up, months across, colours = light phases', 'Adiyagram n useggas: akud s ubeddi, ayyuren s uglawi, initen = tafat'],
    yearHint: ['Les sauts d’une heure correspondent aux changements d’heure d’été.', 'One-hour jumps are daylight-saving changes.', 'Ineggizen n usrag d abeddel n wakud n unebdu.'],
    alignIntro: ['Trouvez les dates où le soleil ou la lune se lève / se couche dans une direction précise (derrière un monument, dans l’axe d’une rue…).', 'Find the dates when the sun or moon rises / sets in a given direction (behind a landmark, down a street…).', 'Af izemzen anida tafukt neɣ ayyur ad d-yali / ad yeɣli deg yiwet n tnila (deffir n ubeddi, deg ubrid…).'],
    target: ['Azimut cible (°)', 'Target azimuth (°)', 'Azimut iswi (°)'],
    tol: ['Tolérance (±°)', 'Tolerance (±°)', 'Tafrent (±°)'],
    body: ['Astre', 'Body', 'Itri'],
    eventKind: ['Événement', 'Event', 'Tadyant'],
    rise: ['Lever', 'Rise', 'Tulya'], set: ['Coucher', 'Set', 'Aɣelluy'], both: ['Les deux', 'Both', 'Sin'],
    useBearing: ['Utiliser la direction de la caméra', 'Use the camera bearing', 'Seqdec tanila n tkamirat'],
    search: ['Chercher sur 12 mois', 'Search 12 months', 'Nadi deg 12 n wayyuren'],
    noMatch: ['Aucune date trouvée dans les 12 prochains mois — élargissez la tolérance.', 'No date found in the next 12 months — widen the tolerance.', 'Ulac azemz deg 12 n wayyuren — ssimɣer tafrent.'],
    matches: ['{n} date(s) trouvée(s)', '{n} date(s) found', '{n} n yizemzen ttwafen'],
    colEvent: ['Événement', 'Event', 'Tadyant'], colTime: ['Heure', 'Time', 'Akud'], colAz: ['Azimut', 'Azimuth', 'Azimut'], colDiff: ['Écart', 'Offset', 'Amgired'],
    goDay: ['Voir ce jour', 'Show this day', 'Sken ass-a'],
    // exports
    exports: ['Exporter et partager', 'Export & share', 'Sifeḍ d beṭṭu'],
    exportSky: ['Diagramme PNG', 'Diagram PNG', 'Adiyagram PNG'],
    exportYear: ['Graphique annuel PNG', 'Year chart PNG', 'Aseggas PNG'],
    exportCsv: ['Tableau CSV', 'Table CSV', 'Tafelwit CSV'],
    exportIcs: ['Calendrier .ics (heures dorées et bleues)', 'Calendar .ics (golden & blue hours)', 'Awitay .ics (isragen n wureɣ d uzegzaw)'],
    exportJson: ['Réglages JSON', 'Settings JSON', 'Iɣewwaren JSON'],
    importJson: ['Ouvrir un JSON', 'Open a JSON', 'Ldi JSON'],
    copyLink: ['Copier le lien', 'Copy link', 'Nɣel aseɣwen'],
    copied: ['Lien copié dans le presse-papiers.', 'Link copied to the clipboard.', 'Aseɣwen yettwanɣel.'],
    copyFail: ['Copie impossible — le lien est dans la barre d’adresse.', 'Could not copy — the link is in the address bar.', 'Ur yezmir ara ad yenɣel — aseɣwen deg ufeggag n tansa.'],
    imported: ['Réglages chargés.', 'Settings loaded.', 'Iɣewwaren ttwasulin.'],
    importFail: ['Fichier JSON non reconnu.', 'Unrecognised JSON file.', 'Afaylu JSON ur yettwassen ara.'],
    icsDays: ['Jours dans le calendrier', 'Days in the calendar', 'Ussan deg uwitay'],
    icsGoldenAm: ['Heure dorée (matin)', 'Golden hour (morning)', 'Tasragt n wureɣ (taṣebḥit)'],
    icsGoldenPm: ['Heure dorée (soir)', 'Golden hour (evening)', 'Tasragt n wureɣ (tameddit)'],
    icsBlueAm: ['Heure bleue (matin)', 'Blue hour (morning)', 'Tasragt tazegzawt (taṣebḥit)'],
    icsBluePm: ['Heure bleue (soir)', 'Blue hour (evening)', 'Tasragt tazegzawt (tameddit)'],
    // compass
    N: ['N', 'N', 'N'], E: ['E', 'E', 'E'], S: ['S', 'S', 'S'], W: ['O', 'W', 'W'],
    NE: ['NE', 'NE', 'NE'], SE: ['SE', 'SE', 'SE'], SW: ['SO', 'SW', 'SW'], NW: ['NO', 'NW', 'NW'],
    dirNames: ['nord,nord-nord-est,nord-est,est-nord-est,est,est-sud-est,sud-est,sud-sud-est,sud,sud-sud-ouest,sud-ouest,ouest-sud-ouest,ouest,ouest-nord-ouest,nord-ouest,nord-nord-ouest',
      'north,north-north-east,north-east,east-north-east,east,east-south-east,south-east,south-south-east,south,south-south-west,south-west,west-south-west,west,west-north-west,north-west,north-north-west',
      'agafa,agafa-agafa-asamar,agafa-asamar,asamar-agafa,asamar,asamar-anẓul,anẓul-asamar,anẓul-anẓul-asamar,anẓul,anẓul-anẓul-amalu,anẓul-amalu,amalu-anẓul,amalu,amalu-agafa,agafa-amalu,agafa-agafa-amalu'],
    months: ['', '', 'Yennayer,Fuṛaṛ,Meɣres,Yebrir,Mayyu,Yunyu,Yulyu,Ɣuct,Ctembeṛ,Tubeṛ,Wambeṛ,Dujembeṛ'],
    // help
    helpTitle: ['Comment ça marche', 'How it works', 'Amek iteddu'],
    helpBody: [
      '<p>Choisissez une <b>ville</b> ou saisissez des <b>coordonnées</b> (et le bon fuseau horaire), une <b>date</b>, puis faites glisser l’<b>heure</b> ou la frise de 24 h.</p><p><b>Heure dorée</b> : soleil entre −4° et +6° (lumière chaude et rasante). <b>Heure bleue</b> : soleil entre −6° et −4° (ciel bleu profond, idéal pour les villes éclairées).</p><p>Le <b>diagramme</b> est une carte du ciel vue d’en haut : le cercle extérieur est l’horizon, le centre le zénith, le nord en haut. Le cône orange montre le champ de votre caméra ; l’outil indique si le soleil est dans le cadre, en contre-jour ou de côté. <b>Cliquez ou glissez sur le diagramme</b> pour orienter la caméra.</p><p>Calculs : algorithmes du NOAA / de Meeus (soleil ≈ 1 min, lune ≈ 2–3 min), terrain plat, altitude 0 m. Les reliefs et bâtiments peuvent avancer le coucher réel.</p><p>Raccourcis : <kbd>←</kbd> <kbd>→</kbd> ±10 min (<kbd>Maj</kbd> ±1 h), <kbd>Page préc.</kbd> / <kbd>Page suiv.</kbd> jour précédent / suivant, <kbd>T</kbd> aujourd’hui, <kbd>Espace</kbd> animation.</p>',
      '<p>Pick a <b>city</b> or type <b>coordinates</b> (and the right time zone), a <b>date</b>, then drag the <b>time</b> slider or the 24 h strip.</p><p><b>Golden hour</b>: sun between −4° and +6° (warm, low light). <b>Blue hour</b>: sun between −6° and −4° (deep blue sky, great for lit cityscapes).</p><p>The <b>diagram</b> is a sky map seen from above: the outer circle is the horizon, the centre the zenith, north up. The orange cone shows your camera field; the tool tells you whether the sun is in frame, behind you or to the side. <b>Click or drag on the diagram</b> to aim the camera.</p><p>Maths: NOAA / Meeus algorithms (sun ≈ 1 min, moon ≈ 2–3 min), flat horizon, sea level. Hills and buildings can make the real sunset earlier.</p><p>Shortcuts: <kbd>←</kbd> <kbd>→</kbd> ±10 min (<kbd>Shift</kbd> ±1 h), <kbd>Page Up</kbd> / <kbd>Page Down</kbd> previous / next day, <kbd>T</kbd> today, <kbd>Space</kbd> animation.</p>',
      '<p>Fren <b>tamdint</b> neɣ aru <b>imsidag</b> (d tmnaḍt n wakud), <b>azemz</b>, sakin zuɣer <b>akud</b> neɣ azrir n 24 n isragen.</p><p><b>Tasragt n wureɣ</b>: tafukt gar −4° d +6° (tafat tazɣalt). <b>Tasragt tazegzawt</b>: tafukt gar −6° d −4° (igenni d azegzaw).</p><p><b>Adiyagram</b> d takarḍa n igenni si ufella: tawinest d yiri, talemmast d asawen, agafa d asawen. Annar aččinawi d annar n tkamirat. <b>Sit neɣ zuɣer ɣef udiyagram</b> akken ad tesnileḍ takamirat.</p><p>Asiḍen: NOAA / Meeus (tafukt ≈ 1 tsd, ayyur ≈ 2–3 tsd), akal ilaq ad yili d aqerru.</p><p>Inegzumen: <kbd>←</kbd> <kbd>→</kbd> ±10 tsd (<kbd>Shift</kbd> ±1 n usrag), <kbd>PageUp</kbd> / <kbd>PageDown</kbd> ass yezrin / d-iteddun, <kbd>T</kbd> ass-a, <kbd>Espace</kbd> asmussu.</p>'],
    privacy: ['Tout est calculé dans votre navigateur : aucune donnée envoyée, aucun traceur. La position GPS (facultative) reste sur votre appareil.', 'Everything is computed in your browser: no data sent, no trackers. The (optional) GPS location stays on your device.', 'Kullec yettwasiḍen deg iminig-ik: ulac isefka ttwaznen. Adig GPS yeqqim ɣur-k.'],
    footer: ['Logiciel libre (MIT) — code source sur GitHub', 'Free software (MIT) — source code on GitHub', 'Aseɣzan ilelli (MIT) — tangalt deg GitHub'],
    minutes: ['{n} min', '{n} min', '{n} tsd'],
    hm: ['{h} h {m} min', '{h} h {m} min', '{h} isr {m} tsd'],
  };
  const LANGS = ['fr', 'en', 'kab'];
  const idx = (lang) => Math.max(0, LANGS.indexOf(lang));

  // Kabyle Latin → Tifinagh (neo-Tifinagh as used for Taqbaylit). Acronyms, units and words with digits are kept.
  const TF = { a: 'ⴰ', b: 'ⴱ', c: 'ⵛ', č: 'ⵞ', d: 'ⴷ', ḍ: 'ⴹ', e: 'ⴻ', é: 'ⴻ', ɛ: 'ⵄ', f: 'ⴼ', g: 'ⴳ', ǧ: 'ⴵ', ɣ: 'ⵖ', h: 'ⵀ', ḥ: 'ⵃ', i: 'ⵉ', j: 'ⵊ', k: 'ⴽ', l: 'ⵍ', m: 'ⵎ', n: 'ⵏ',
    o: 'ⵓ', p: 'ⵒ', q: 'ⵇ', r: 'ⵔ', ṛ: 'ⵕ', s: 'ⵙ', ṣ: 'ⵚ', t: 'ⵜ', ṭ: 'ⵟ', u: 'ⵓ', v: 'ⵠ', w: 'ⵡ', x: 'ⵅ', y: 'ⵢ', z: 'ⵣ', ẓ: 'ⵥ' };
  const KEEP = /^(Soleil|Atelier|Latitude|Longitude|NOAA|Meeus|GPS|Shift|Espace|PageUp|PageDown|MIT|GitHub|PNG|CSV|JSON|ics|UTC|full|frame|mm|m|km|N|E|S|W|NE|SE|SW|NW|T)$/;
  function toTifinagh(text) {
    return String(text).replace(/(<[^>]*>)|(\{[^}]*\})|([^<{]+)/g, (m, tag, ph, txt) => tag || ph || txt.replace(/[\p{L}\d-]+/gu, (w) => {
      if (/\d/.test(w) || (w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w)) || KEEP.test(w)) return w;
      return Array.from(w.toLowerCase()).map((ch) => TF[ch] || ch).join('');
    }));
  }
  /** Translate key into lang; vars fill {placeholders}; tfng renders Kabyle in Tifinagh. */
  function t(key, lang = 'fr', vars, tfng = false) {
    const e = S[key];
    let s = e ? e[idx(lang)] : key;
    if (lang === 'kab' && tfng) s = toTifinagh(s);
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }
  return { S, LANGS, t, toTifinagh };
});
