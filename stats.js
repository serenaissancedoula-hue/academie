/* Académie Sérénaissance — statistiques de visites ANONYMES.
   Aucune adresse IP, aucun nom, aucun courriel n'est enregistré : seulement la page vue, la source (Google, Facebook…),
   une région approximative (d'après le fuseau horaire de l'appareil), le type d'appareil et la langue.
   Respecte « Do Not Track » et « Global Privacy Control ». Les visites de Sabrina ne sont pas comptées. */
(function () {
  'use strict';
  try {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return;
    if (localStorage.getItem('sere-admin') === '1') return;
    if (/^(localhost|127\.)/.test(location.hostname)) return;
  } catch (e) { return; }
  var SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co', SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
  var langue = (document.documentElement.lang || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr';

  function visiteur() {
    var id = null, nouvelle = false;
    try { id = localStorage.getItem('sere-v'); } catch (e) {}
    if (!id || !/^[a-z0-9]{8,40}$/.test(id)) {
      id = ''; var c = 'abcdefghijklmnopqrstuvwxyz0123456789', a = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(a);
      for (var i = 0; i < a.length; i++) id += c[a[i] % c.length];
      nouvelle = true;
      try { localStorage.setItem('sere-v', id); } catch (e) {}
    }
    return { id: id, nouvelle: nouvelle };
  }
  function source() {
    var p = new URLSearchParams(location.search), u = p.get('utm_source');
    if (u) return u.slice(0, 40);
    if (!document.referrer) return null;
    var h = '';
    try { h = new URL(document.referrer).hostname.replace(/^www\./, ''); } catch (e) { return null; }
    if (!h || h === location.hostname.replace(/^www\./, '')) return 'interne';
    if (/google\./.test(h)) return 'Google';
    if (/(^|\.)facebook\.com$|^fb\.|^m\.facebook|^l\.facebook|^lm\.facebook/.test(h)) return 'Facebook';
    if (/instagram\.com$/.test(h)) return 'Instagram';
    if (/bing\.com$/.test(h)) return 'Bing';
    if (/yahoo\./.test(h)) return 'Yahoo';
    if (/duckduckgo\.com$/.test(h)) return 'DuckDuckGo';
    if (/tiktok\.com$/.test(h)) return 'TikTok';
    if (/pinterest\./.test(h)) return 'Pinterest';
    if (/linkedin\.com$/.test(h)) return 'LinkedIn';
    if (/mail\.|outlook\.|gmail/.test(h)) return 'Courriel';
    return h.slice(0, 40);
  }
  function region() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var fr = /^fr/i.test(navigator.language || '');
    var R = {
      'America/Moncton': 'Nouveau-Brunswick', 'America/Halifax': 'Maritimes (N.-B., N.-É., Î.-P.-É.)', 'America/Glace_Bay': 'Nouvelle-Écosse',
      'America/Goose_Bay': 'Terre-Neuve-et-Labrador', 'America/St_Johns': 'Terre-Neuve-et-Labrador',
      'America/Montreal': 'Québec', 'America/Blanc-Sablon': 'Québec', 'America/Winnipeg': 'Manitoba', 'America/Regina': 'Saskatchewan',
      'America/Swift_Current': 'Saskatchewan', 'America/Edmonton': 'Alberta', 'America/Vancouver': 'Colombie-Britannique',
      'America/Whitehorse': 'Yukon', 'America/Yellowknife': 'Territoires du Nord-Ouest', 'America/Iqaluit': 'Nunavut',
      'Europe/Paris': 'France', 'Europe/Brussels': 'Belgique', 'Europe/Zurich': 'Suisse', 'Europe/Luxembourg': 'Luxembourg',
      'Europe/Monaco': 'Monaco', 'Indian/Reunion': 'La Réunion', 'America/Martinique': 'Martinique', 'America/Guadeloupe': 'Guadeloupe',
      'America/Cayenne': 'Guyane', 'Pacific/Noumea': 'Nouvelle-Calédonie', 'Pacific/Tahiti': 'Polynésie française', 'Africa/Casablanca': 'Maroc',
      'Africa/Algiers': 'Algérie', 'Africa/Tunis': 'Tunisie', 'Africa/Dakar': 'Sénégal', 'Africa/Abidjan': "Côte d'Ivoire", 'America/Port-au-Prince': 'Haïti'
    };
    if (tz === 'America/Toronto' || tz === 'America/Nipigon' || tz === 'America/Thunder_Bay') return fr ? 'Québec (probable)' : 'Ontario (probable)';
    if (R[tz]) return R[tz];
    if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana|Kentucky|Boise)/.test(tz) || tz === 'Pacific/Honolulu') return 'États-Unis';
    if (/^Europe\//.test(tz)) return 'Europe (autre)';
    if (/^Africa\//.test(tz)) return 'Afrique';
    if (/^Asia\//.test(tz)) return 'Asie';
    if (/^Australia\//.test(tz)) return 'Australie';
    if (/^America\//.test(tz)) return 'Amériques (autre)';
    return tz ? tz.slice(0, 40) : null;
  }
  function appareil() {
    var ua = navigator.userAgent || '';
    if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'tablette';
    if (/Mobi|iPhone|Android/.test(ua)) return 'cellulaire';
    return 'ordinateur';
  }
  function envoyer() {
    var v = visiteur();
    var corps = JSON.stringify({ p_page: location.pathname, p_source: source(), p_region: region(), p_appareil: appareil(),
      p_langue: langue, p_visiteur: v.id, p_nouvelle: v.nouvelle });
    try {
      fetch(SB_URL + '/rest/v1/rpc/enregistrer_visite', {
        method: 'POST', keepalive: true,
        headers: { 'apikey': SB_CLE, 'Content-Type': 'application/json' },
        body: corps
      }).catch(function () {});
    } catch (e) {}
  }
  if (document.readyState === 'complete') setTimeout(envoyer, 800); else window.addEventListener('load', function () { setTimeout(envoyer, 800); });
})();
