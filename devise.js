/* Académie Sérénaissance — pays de la visiteuse et prix en euros (Europe) ou en dollars américains (États-Unis).
   Stripe facture déjà en euros et en $ US (liens CAD + EUR + USD) ; ce script affiche
   les mêmes montants sur le site. Le pays est estimé avec le fuseau horaire de l'appareil
   (aucune donnée envoyée à un service externe). Seules la formation de base de doula et
   le 4e trimestre (paiement complet seulement) ont un prix en euros : les autres montants restent en dollars canadiens.
   Une page (ou un bloc) avec l'attribut data-devise-fixe n'est pas modifiée. */
(function () {
  'use strict';
  var ZONE_EURO = /^(Europe\/(Paris|Brussels|Luxembourg|Monaco|Berlin|Busingen|Madrid|Rome|Vatican|San_Marino|Amsterdam|Vienna|Lisbon|Dublin|Helsinki|Mariehamn|Athens|Tallinn|Riga|Vilnius|Bratislava|Ljubljana|Malta|Zagreb|Nicosia|Andorra|Podgorica)|Atlantic\/(Madeira|Azores|Canary)|Africa\/Ceuta|Indian\/(Reunion|Mayotte)|America\/(Martinique|Guadeloupe|Cayenne|St_Barthelemy|Marigot|Miquelon))$/;
  var ZONE_SUISSE = /^Europe\/(Zurich|Vaduz)$/;
  var ZONE_USA = /^(America\/(New_York|Detroit|Chicago|Denver|Phoenix|Los_Angeles|Anchorage|Juneau|Sitka|Metlakatla|Yakutat|Nome|Adak|Boise|Menominee|Puerto_Rico|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu|US\/.+)$/;
  var fuseau = '';
  try { fuseau = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}

  // Pays : choix de la visiteuse (?pays=fr|be|ch|us|ca, gardé en mémoire), sinon estimé avec le fuseau horaire
  var choisi = null;
  try {
    var q = new URLSearchParams(location.search);
    choisi = (q.get('pays') || '').toUpperCase() || null;
    if (choisi) localStorage.setItem('sere-pays', choisi); else choisi = localStorage.getItem('sere-pays');
    var dv = (q.get('devise') || '').toLowerCase();
    if (!choisi && dv) choisi = dv === 'eur' ? 'FR' : dv === 'usd' ? 'US' : 'CA';
  } catch (e) {}
  var pays = choisi && /^(CA|FR|BE|CH|US|EU)$/.test(choisi) ? choisi
    : ZONE_USA.test(fuseau) ? 'US'
    : /^Europe\/Brussels$/.test(fuseau) ? 'BE'
    : ZONE_SUISSE.test(fuseau) ? 'CH'
    : /^(Europe\/Paris|Indian\/(Reunion|Mayotte)|America\/(Martinique|Guadeloupe|Cayenne|St_Barthelemy|Marigot|Miquelon))$/.test(fuseau) ? 'FR'
    : ZONE_EURO.test(fuseau) ? 'EU' : 'CA';
  // La Suisse paie en euros (même lien Stripe que la zone euro)
  var euro = pays === 'FR' || pays === 'BE' || pays === 'EU' || pays === 'CH';
  var usd = pays === 'US';
  window.SereDevise = { euro: euro, usd: usd, pays: pays, devise: euro ? 'EUR' : usd ? 'USD' : 'CAD' };
  document.documentElement.setAttribute('data-pays', pays);

  // Contenu selon le pays : [data-si-pays="FR,BE"] affiché seulement pour ces pays, [data-sauf-pays="CA"] caché pour ces pays.
  // En Europe, les liens vers la formation de base de doula mènent à la page du pays (même formation, prix en euros).
  var PAGE_EUROPE = { FR: '/formation-doula-france/', EU: '/formation-doula-france/', BE: '/formation-doula-belgique/', CH: '/formation-doula-suisse/' }[pays];
  var LIENS_DOULA = /^\/(formations\/doula-de-base|formation-doula-de-base)\/?$/;
  function adapter() {
    document.querySelectorAll('[data-si-pays]').forEach(function (el) {
      el.hidden = el.getAttribute('data-si-pays').toUpperCase().split(/[ ,]+/).indexOf(pays) < 0;
    });
    document.querySelectorAll('[data-sauf-pays]').forEach(function (el) {
      if (el.getAttribute('data-sauf-pays').toUpperCase().split(/[ ,]+/).indexOf(pays) >= 0) el.hidden = true;
    });
  }
  if (PAGE_EUROPE && (document.documentElement.lang || 'fr').indexOf('fr') === 0) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var chemin = '';
      try { chemin = new URL(a.getAttribute('href'), location.href).pathname; } catch (x) { return; }
      if (!LIENS_DOULA.test(chemin) || location.pathname === PAGE_EUROPE) return;
      e.preventDefault(); e.stopImmediatePropagation();
      location.href = PAGE_EUROPE;
    }, true);
  }
  // Petit choix du pays en bas de page (pour une personne en voyage ou un appareil mal réglé)
  function choixPays() {
    var pied = document.querySelector('footer');
    if (!pied || document.getElementById('choix-pays')) return;
    var en = (document.documentElement.lang || '').indexOf('en') === 0;
    var NOMS = en ? { CA: 'Canada ($ CAD)', US: 'United States (US$)', FR: 'France (€)', BE: 'Belgium (€)', CH: 'Switzerland (€)' }
                  : { CA: 'Canada ($ CA)', US: 'États-Unis ($ US)', FR: 'France (€)', BE: 'Belgique (€)', CH: 'Suisse (€)' };
    var p = document.createElement('p');
    p.style.cssText = 'text-align:center;font-size:.8rem;margin:14px 0 0;opacity:.85';
    var sel = '<select id="choix-pays" aria-label="' + (en ? 'Country' : 'Pays') + '" style="font:inherit;font-size:.8rem;padding:3px 6px;border-radius:8px;border:1px solid currentColor;background:transparent;color:inherit">';
    Object.keys(NOMS).forEach(function (k) { sel += '<option value="' + k + '"' + ((pays === k || (pays === 'EU' && k === 'FR')) ? ' selected' : '') + '>' + NOMS[k] + '</option>'; });
    p.innerHTML = '🌍 ' + (en ? 'Prices shown for: ' : 'Prix affichés pour : ') + sel + '</select>';
    pied.appendChild(p);
    p.querySelector('select').addEventListener('change', function () {
      try { localStorage.setItem('sere-pays', this.value); } catch (e) {}
      var u = new URL(location.href); u.searchParams.delete('pays'); u.searchParams.delete('devise');
      location.href = u.toString();
    });
  }
  function auChargement() { adapter(); choixPays(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auChargement); else auChargement();
  if (!euro && !usd) return;

  // Montant canadien (sans espaces) → montant en euros ou en dollars américains, version française et anglaise
  var FR = euro ? { '1950': '1 300 €', '650': '433,33 €', '325': '216,67 €', '550': '370 €' }
                : { '1950': '1 400 $ US', '650': '466,67 $ US', '325': '233,33 $ US', '550': '395 $ US', '500': '360 $ US', '1450': '1 040 $ US' };
  var EN = euro ? { '1,950': '€1,300', '650': '€433.33', '325': '€216.67', '550': '€370' }
                : { '1,950': 'US$1,400', '650': 'US$466.67', '325': 'US$233.33', '550': 'US$395', '500': 'US$360', '1,450': 'US$1,040' };
  var ESP = '[\\u0020\\u00a0\\u202f]';
  // Le nombre est lu en entier (« 1 550 $ » ne devient jamais « 1 370 € »)
  var RE_FR = new RegExp('(\\d{1,3}(?:' + ESP + '\\d{3})*(?:,\\d{2})?)' + ESP + '?\\$(?:' + ESP + '?CA)?', 'g');
  var RE_EN = /(?:CA)?\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:\s?CAD)?(?!\d)/g;

  function convertir(t) {
    if (t.indexOf('$') < 0) return t;
    t = t.replace(RE_FR, function (m, n) {
      var cle = n.replace(/[   ]/g, '');
      return FR[cle] || m;
    });
    return t.replace(RE_EN, function (m, n) { return EN[n] || m; });
  }
  function exclu(el) {
    for (; el && el.nodeType === 1; el = el.parentNode) {
      var n = el.nodeName;
      if (n === 'SCRIPT' || n === 'STYLE' || n === 'TEXTAREA' || n === 'NOSCRIPT') return true;
      if (el.hasAttribute('data-devise-fixe')) return true;
    }
    return false;
  }
  function parcourir(racine) {
    if (!racine) return;
    if (racine.nodeType === 3) {
      if (!exclu(racine.parentNode)) { var v = convertir(racine.nodeValue); if (v !== racine.nodeValue) racine.nodeValue = v; }
      return;
    }
    if (racine.nodeType !== 1 || exclu(racine)) return;
    var w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, null), n, liste = [];
    while ((n = w.nextNode())) liste.push(n);
    liste.forEach(function (x) {
      if (exclu(x.parentNode)) return;
      var v = convertir(x.nodeValue);
      if (v !== x.nodeValue) x.nodeValue = v;
    });
  }
  function demarrer() {
    if (document.documentElement.hasAttribute('data-devise-fixe')) return;
    parcourir(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') parcourir(m.target);
        else m.addedNodes.forEach(parcourir);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
