/* Académie Sérénaissance — cartes repliables : on clique sur le titre pour dérouler la section.
   SereRepliable.appliquer('#vue-outils > .carte, #vue-parametres > .carte') — le 1er h3 de chaque carte devient le bouton.
   Fermées par défaut ; l'état reste mémorisé pendant la session. data-ouvert sur une carte = ouverte au départ. */
(function () {
  'use strict';
  var CLE = 'sere-repli';
  function etats() { try { return JSON.parse(sessionStorage.getItem(CLE) || '{}'); } catch (e) { return {}; } }
  function garder(id, ouvert) { var e = etats(); e[id] = ouvert; try { sessionStorage.setItem(CLE, JSON.stringify(e)); } catch (x) {} }
  function css() {
    if (document.getElementById('style-repli')) return;
    var s = document.createElement('style'); s.id = 'style-repli';
    s.textContent = '.repli-titre{cursor:pointer;display:flex !important;align-items:center;justify-content:space-between;gap:10px;user-select:none;margin-bottom:0 !important}' +
      '.repli-titre::after{content:"▾";font-size:1rem;color:var(--terra,#a85743);transition:transform .2s;flex-shrink:0}' +
      '.repli-ferme .repli-titre::after{transform:rotate(-90deg)}' +
      '.repli-corps{margin-top:10px}.repli-ferme .repli-corps{display:none}' +
      '.repli-titre:focus-visible{outline:2px solid var(--terra,#a85743);outline-offset:3px;border-radius:6px}';
    document.head.appendChild(s);
  }
  function appliquer(selecteur) {
    css();
    var e = etats();
    document.querySelectorAll(selecteur).forEach(function (carte, i) {
      if (carte.classList.contains('repli-ok')) return;
      var h = carte.querySelector(':scope > h3'); if (!h) return;
      carte.classList.add('repli-ok');
      var id = carte.id || (h.textContent || '').trim().slice(0, 40) || ('c' + i);
      var corps = document.createElement('div'); corps.className = 'repli-corps';
      var n = h.nextSibling;
      while (n) { var suiv = n.nextSibling; corps.appendChild(n); n = suiv; }
      carte.appendChild(corps);
      h.classList.add('repli-titre'); h.setAttribute('role', 'button'); h.setAttribute('tabindex', '0');
      var ouvert = id in e ? e[id] : carte.hasAttribute('data-ouvert');
      carte.classList.toggle('repli-ferme', !ouvert); h.setAttribute('aria-expanded', String(ouvert));
      function basculer() {
        var o = carte.classList.toggle('repli-ferme') === false;
        h.setAttribute('aria-expanded', String(o)); garder(id, o);
      }
      h.addEventListener('click', basculer);
      h.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); basculer(); } });
    });
  }
  function ouvrir(carte) { if (carte && carte.classList.contains('repli-ferme')) { var h = carte.querySelector('.repli-titre'); if (h) h.click(); } }
  window.SereRepliable = { appliquer: appliquer, ouvrir: ouvrir };
})();
