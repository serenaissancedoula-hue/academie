/* Académie Sérénaissance — bandeau « Cohorte fondatrice » (formation de base de doula).
   Code Stripe FONDATRICE : 500 $ (333 € en zone euro) de rabais, 5 places, jusqu'au 30 novembre 2026 à 23 h 59 (heure de l'Atlantique).
   Le bandeau disparaît tout seul après la date de fin ; fermé par la visiteuse, il revient après 3 jours.
   Les éléments [data-fondatrice] de la page sont affichés seulement pendant l'offre. */
(function () {
  'use strict';
  var FIN = new Date('2026-12-01T03:59:00Z');
  var CLE = 'sere-fondatrice-ferme';
  var actif = new Date() < FIN;
  function montrerBlocs() {
    document.querySelectorAll('[data-fondatrice]').forEach(function (el) { el.hidden = !actif; });
  }
  function bandeau() {
    if (!actif) return;
    if (/\/(espace|admin|admin-doula|formatrice)\.html$/.test(location.pathname)) return;
    try { var f = parseInt(localStorage.getItem(CLE) || '0', 10); if (f && Date.now() - f < 3 * 864e5) return; } catch (e) {}
    var euro = window.SereDevise && window.SereDevise.euro;
    var st = document.createElement('style');
    st.textContent = '.fondatrice-bandeau{background:#2c221e;color:#fff;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:.88rem;line-height:1.45;padding:10px 44px 10px 16px;text-align:center;position:relative}' +
      '.fondatrice-bandeau a{color:#f6d9cc;font-weight:700;white-space:nowrap}.fondatrice-bandeau strong{color:#f6d9cc}' +
      '.fondatrice-bandeau button{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;color:#fff;font-size:1.1rem;cursor:pointer;padding:6px;line-height:1}';
    document.head.appendChild(st);
    var d = document.createElement('div');
    d.className = 'fondatrice-bandeau'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Offre cohorte fondatrice');
    d.innerHTML = '🌸 <strong>Cohorte fondatrice</strong> · formation de doula : <strong>' + (euro ? '333\u00a0€' : '500\u00a0$') + ' de rabais</strong> avec le code <strong>FONDATRICE</strong> · 5 places seulement, jusqu\'au 30 novembre. ' +
      '<a href="/formation-doula-de-base/">En profiter →</a><button type="button" aria-label="Fermer">✕</button>';
    d.querySelector('button').addEventListener('click', function () { d.remove(); try { localStorage.setItem(CLE, String(Date.now())); } catch (e) {} });
    document.body.insertBefore(d, document.body.firstChild);
  }
  function go() { montrerBlocs(); bandeau(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
