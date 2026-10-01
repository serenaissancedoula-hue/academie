/* Académie Sérénaissance — défilement automatique des carrousels (témoignages, photos).
   SereDefilement.activer(piste, { delai: 5000, conteneur: el, langue: 'fr'|'en' })
   - avance tout seul toutes les 5 secondes et revient au début à la fin ;
   - on peut toujours glisser au doigt ou utiliser les flèches : le défilement s'arrête pendant
     qu'on touche, survole ou utilise le clavier, puis reprend quelques secondes après ;
   - s'arrête quand le carrousel n'est pas à l'écran ou que l'onglet est caché ;
   - bouton ⏸ / ▶ pour mettre en pause (accessibilité WCAG 2.2.2). */
(function () {
  'use strict';
  function activer(piste, o) {
    o = o || {};
    if (!piste || piste.dataset.auto === '1') return piste && piste._auto;
    piste.dataset.auto = '1';
    var delai = o.delai || 5000, EN = o.langue === 'en';
    var reduit = false;
    try { reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var minuterie = 0, enPause = false, occupe = false, visible = true, reprise = 0;

    function elements() { return Array.prototype.filter.call(piste.children, function (x) { return x.offsetWidth > 0; }); }
    function suivant() {
      var max = piste.scrollWidth - piste.clientWidth;
      if (max <= 4) return;
      var els = elements(), x = piste.scrollLeft, cible = null;
      for (var i = 0; i < els.length; i++) {
        var g = els[i].offsetLeft - piste.offsetLeft - (els[0].offsetLeft - piste.offsetLeft);
        if (g > x + 8) { cible = g; break; }
      }
      if (cible === null || x >= max - 4) cible = 0;
      piste.scrollTo({ left: Math.min(cible, max), behavior: reduit ? 'auto' : 'smooth' });
    }
    function planifier() {
      clearTimeout(minuterie);
      if (enPause || occupe || !visible || document.hidden) return;
      minuterie = setTimeout(function () { suivant(); planifier(); }, delai);
    }
    function interaction() {
      occupe = true; clearTimeout(minuterie); clearTimeout(reprise);
      reprise = setTimeout(function () { occupe = false; planifier(); }, 5000);
    }
    var zone = o.conteneur || piste;
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (ev) { zone.addEventListener(ev, interaction, { passive: true }); });
    zone.addEventListener('mouseenter', function () { occupe = true; clearTimeout(minuterie); });
    zone.addEventListener('mouseleave', function () { occupe = false; planifier(); });
    zone.addEventListener('focusin', function () { occupe = true; clearTimeout(minuterie); });
    zone.addEventListener('focusout', function (e) { if (!zone.contains(e.relatedTarget)) { occupe = false; planifier(); } });
    document.addEventListener('visibilitychange', planifier);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (l) { visible = l[0].isIntersecting; planifier(); }, { threshold: 0.3 }).observe(piste);
    }
    // bouton pause / lecture
    var bouton = document.createElement('button');
    bouton.type = 'button'; bouton.className = 'defil-pause';
    bouton.style.cssText = 'display:block;margin:8px auto 0;background:none;border:1px solid currentColor;border-radius:50px;padding:4px 14px;font:inherit;font-size:.78rem;color:#7a685e;cursor:pointer;opacity:.85';
    function etiquette() {
      bouton.textContent = enPause ? (EN ? '▶ Play' : '▶ Lecture') : (EN ? '⏸ Pause' : '⏸ Pause');
      bouton.setAttribute('aria-label', enPause ? (EN ? 'Resume automatic scrolling' : 'Reprendre le défilement automatique') : (EN ? 'Pause automatic scrolling' : 'Mettre en pause le défilement automatique'));
    }
    bouton.addEventListener('click', function () { enPause = !enPause; etiquette(); if (!enPause) { occupe = false; } planifier(); });
    etiquette();
    if (o.placerBouton) o.placerBouton(bouton); else (o.conteneur || piste.parentNode).appendChild(bouton);
    planifier();
    piste._auto = { pause: function () { enPause = true; etiquette(); clearTimeout(minuterie); }, reprendre: function () { enPause = false; etiquette(); planifier(); }, recommencer: planifier };
    return piste._auto;
  }
  window.SereDefilement = { activer: activer };
})();
