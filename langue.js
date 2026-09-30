/* Académie Sérénaissance — choix de la langue (français / English).
   - La préférence est gardée sur l'appareil (localStorage « sere-langue ») et, pour les étudiantes, dans leur dossier.
   - SereLangue.page() : langue de la page ouverte ; SereLangue.choisie() : préférence enregistrée (ou null).
   - SereLangue.aller(l) : enregistre la préférence et ouvre la même page dans l'autre langue.
   - SereLangue.bouton(el) : affiche le sélecteur FR | EN dans el.
   - Les pages avec data-langue-auto sur <html> suivent automatiquement la préférence (espace, formations). */
(function () {
  'use strict';
  var CLE = 'sere-langue';
  // Pages publiques dont le chemin change d'une langue à l'autre
  var PAIRES = [
    ['/formation-doula-post-partum/', '/en/postpartum-doula-training/'],
    ['/formation-marraine-allaitement/', '/en/breastfeeding-peer-supporter-training/'],
    ['/academie-serenaissance/', '/en/academie-serenaissance/'],
    ['/doula-campbellton/', '/en/doula-campbellton/']
  ];
  function page() { return (document.documentElement.lang || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr'; }
  function choisie() { try { var v = localStorage.getItem(CLE); return v === 'en' || v === 'fr' ? v : null; } catch (e) { return null; } }
  function enregistrer(l) { try { localStorage.setItem(CLE, l); } catch (e) {} }
  function equivalent(l, chemin) {
    chemin = chemin || location.pathname;
    if (chemin === '/' || chemin === '') chemin = '/index.html';
    for (var i = 0; i < PAIRES.length; i++) {
      var fr = PAIRES[i][0], en = PAIRES[i][1];
      if (l === 'en' && chemin.indexOf(fr) === 0) return en + chemin.slice(fr.length);
      if (l === 'fr' && chemin.indexOf(en) === 0) return fr + chemin.slice(en.length);
    }
    var estEn = chemin.indexOf('/en/') === 0 || chemin.indexOf('/Formation/en/') === 0;
    if (l === 'en' && !estEn) return chemin.indexOf('/Formation/') === 0 ? chemin.replace('/Formation/', '/Formation/en/') : '/en' + chemin;
    if (l === 'fr' && estEn) return chemin.indexOf('/Formation/en/') === 0 ? chemin.replace('/Formation/en/', '/Formation/') : chemin.slice(3);
    return chemin;
  }
  function aller(l) {
    enregistrer(l);
    if (window.SereLangue.surChangement) try { window.SereLangue.surChangement(l); } catch (e) {}
    if (l === page()) return;
    var dest = equivalent(l);
    if (/\/index\.html$/.test(dest)) dest = dest.replace(/index\.html$/, '');
    location.href = dest + location.search + location.hash;
  }
  function bouton(el) {
    if (!el) return;
    var l = page();
    el.classList.add('choix-langue');
    el.innerHTML = '<button type="button" data-l="fr" lang="fr" aria-label="Français"' + (l === 'fr' ? ' aria-current="true"' : '') + '>FR</button>' +
      '<span aria-hidden="true">|</span><button type="button" data-l="en" lang="en" aria-label="English"' + (l === 'en' ? ' aria-current="true"' : '') + '>EN</button>';
    el.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { aller(b.dataset.l); }); });
  }
  if (!document.getElementById('style-langue')) {
    var st = document.createElement('style'); st.id = 'style-langue';
    st.textContent = '.choix-langue{display:inline-flex;align-items:center;gap:2px;font:700 .8rem/1 Arial,sans-serif;color:#7a685e;white-space:nowrap}' +
      '.choix-langue button{background:none;border:0;padding:6px 5px;font:inherit;color:#7a685e;cursor:pointer;border-radius:6px;letter-spacing:.04em}' +
      '.choix-langue button[aria-current]{color:#a85743;text-decoration:underline;text-underline-offset:3px}' +
      '.choix-langue button:hover{color:#a85743}';
    (document.head || document.documentElement).appendChild(st);
  }
  // Pages qui suivent la préférence (espace étudiante, formations)
  var auto = document.documentElement.hasAttribute('data-langue-auto');
  var pref = choisie();
  if (auto && pref && pref !== page()) {
    var d = equivalent(pref);
    if (d !== location.pathname) location.replace(d + location.search + location.hash);
  }
  window.SereLangue = { page: page, choisie: choisie, enregistrer: enregistrer, aller: aller, bouton: bouton, equivalent: equivalent, surChangement: null };
  function monter() { document.querySelectorAll('[data-choix-langue]').forEach(bouton); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter); else monter();
})();
