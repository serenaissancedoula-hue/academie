/* Académie Sérénaissance — appli installable (ordinateur, Android, iPhone/iPad), sans passer par les magasins d'applications.
   - Enregistre le service worker (sw.js).
   - Remplit chaque élément .bloc-appli avec un bouton « Installer l'appli » ou les étapes selon l'appareil. */
(function () {
  'use strict';
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var android = /Android/.test(ua);
  var safariMac = !ios && /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua);
  var firefox = /Firefox/.test(ua);
  var installee = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var invite = null;

  var css = document.createElement('style');
  css.textContent =
    '.bloc-appli{background:linear-gradient(135deg,#efe6dc 0%,#f7f1ea 100%);border:1px solid #e3d5c8;border-radius:18px;padding:18px 20px;margin:0 0 20px;display:flex;gap:16px;align-items:center}' +
    '.bloc-appli[hidden]{display:none!important}' +
    '.bloc-appli img{width:58px;height:58px;border-radius:14px;flex-shrink:0;box-shadow:0 4px 12px rgba(44,34,30,.12)}' +
    '.bloc-appli strong{display:block;font-size:1rem;margin-bottom:2px;color:#2c221e}' +
    '.bloc-appli p{margin:0;font-size:.86rem;color:#5a4a42;line-height:1.5}' +
    '.bloc-appli .etapes{margin:6px 0 0;padding-left:18px;font-size:.86rem;color:#5a4a42;line-height:1.55}' +
    '.bloc-appli button.installer{margin-top:10px;background:#a85743;color:#fff;border:0;border-radius:50px;padding:10px 20px;font:inherit;font-weight:700;cursor:pointer}' +
    '.bloc-appli .fermer{margin-left:auto;align-self:flex-start;background:none;border:0;font-size:1.1rem;color:#7a685e;cursor:pointer}';
  document.head.appendChild(css);

  function etapes() {
    if (ios) return '<ol class="etapes"><li>Touche le bouton <strong>Partager</strong> <span aria-hidden="true">⬆️</span> (en bas dans Safari, en haut à droite dans Chrome ou Edge).</li><li>Choisis <strong>« Sur l\'écran d\'accueil »</strong>, puis <strong>Ajouter</strong>.</li></ol>';
    if (android) return '<ol class="etapes"><li>Dans <strong>Chrome</strong>, touche le menu <strong>⋮</strong> en haut à droite.</li><li>Choisis <strong>« Installer l\'application »</strong> ou <strong>« Ajouter à l\'écran d\'accueil »</strong>.</li></ol>';
    if (safariMac) return '<ol class="etapes"><li>Dans Safari, ouvre le menu <strong>Fichier</strong>.</li><li>Choisis <strong>« Ajouter au Dock »</strong>.</li></ol>';
    if (firefox) return '<p style="margin-top:6px;">Firefox ne permet pas d\'installer l\'appli : ouvre ce site dans <strong>Chrome</strong>, <strong>Edge</strong> ou <strong>Safari</strong> pour l\'installer, ou continue simplement ici.</p>';
    return '<ol class="etapes"><li>Dans <strong>Chrome</strong> ou <strong>Edge</strong>, clique sur l\'icône d\'installation <strong>⊕</strong> à droite de la barre d\'adresse.</li><li>Clique sur <strong>Installer</strong>.</li></ol>';
  }
  function remplir() {
    var ferme = false; try { ferme = localStorage.getItem('appli-bandeau-ferme') === '1'; } catch (e) {}
    document.querySelectorAll('.bloc-appli').forEach(function (b) {
      if (installee || (ferme && !b.hasAttribute('data-toujours'))) { b.hidden = true; return; }
      b.hidden = false;
      b.innerHTML = '<img src="/icones/icone-192.png" alt=""><div><strong>📲 Installe l\'appli de l\'Académie</strong>' +
        '<p>Tes cours en un toucher, sur ton cellulaire, ta tablette ou ton ordinateur, sans passer par l\'App Store ni Google Play.</p>' +
        (invite ? '<button type="button" class="installer">Installer l\'appli</button>' : etapes()) + '</div>' +
        (b.hasAttribute('data-toujours') ? '' : '<button type="button" class="fermer" aria-label="Masquer">✕</button>');
      var i = b.querySelector('.installer');
      if (i) i.addEventListener('click', function () {
        invite.prompt();
        invite.userChoice.then(function (r) { if (r.outcome === 'accepted') { installee = true; remplir(); } invite = null; });
      });
      var f = b.querySelector('.fermer');
      if (f) f.addEventListener('click', function () { try { localStorage.setItem('appli-bandeau-ferme', '1'); } catch (e) {} b.hidden = true; });
    });
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); invite = e; remplir(); });
  window.addEventListener('appinstalled', function () { installee = true; remplir(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', remplir); else remplir();
  window.AppliSere = { remplir: remplir, installee: function () { return installee; } };
})();
