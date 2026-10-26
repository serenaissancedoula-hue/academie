/* Académie Sérénaissance — prix en euros pour les visiteuses de la zone euro.
   Stripe facture déjà en euros dans la zone euro (liens CAD + EUR) ; ce script affiche
   les mêmes montants sur le site. Le pays est estimé avec le fuseau horaire de l'appareil
   (aucune donnée envoyée à un service externe). Seules la formation de base de doula et
   le 4e trimestre (paiement complet seulement) ont un prix en euros : les autres montants restent en dollars canadiens.
   Une page (ou un bloc) avec l'attribut data-devise-fixe n'est pas modifiée. */
(function () {
  'use strict';
  var ZONE_EURO = /^(Europe\/(Paris|Brussels|Luxembourg|Monaco|Berlin|Busingen|Madrid|Rome|Vatican|San_Marino|Amsterdam|Vienna|Lisbon|Dublin|Helsinki|Mariehamn|Athens|Tallinn|Riga|Vilnius|Bratislava|Ljubljana|Malta|Zagreb|Nicosia|Andorra|Podgorica)|Atlantic\/(Madeira|Azores|Canary)|Africa\/Ceuta|Indian\/(Reunion|Mayotte)|America\/(Martinique|Guadeloupe|Cayenne|St_Barthelemy|Marigot|Miquelon))$/;
  var fuseau = '';
  try { fuseau = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var forcee = null;
  try { forcee = new URLSearchParams(location.search).get('devise'); } catch (e) {}
  var euro = forcee ? forcee.toLowerCase() === 'eur' : ZONE_EURO.test(fuseau);
  window.SereDevise = { euro: euro };
  if (!euro) return;

  // Montant canadien (sans espaces) → montant en euros, version française et anglaise
  var FR = { '1950': '1 300 €', '650': '433,33 €', '325': '216,67 €', '550': '370 €' };
  var EN = { '1,950': '€1,300', '650': '€433.33', '325': '€216.67', '550': '€370' };
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
