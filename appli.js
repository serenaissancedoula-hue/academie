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
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  function L(fr, en) { return EN ? en : fr; }
  var ADMIN = /admin/.test(location.pathname);
  function langueAppli() { try { return localStorage.getItem('sere-langue') || (EN ? 'en' : 'fr'); } catch (e) { return EN ? 'en' : 'fr'; } }

  var css = document.createElement('style');
  css.textContent =
    '.bloc-appli{background:linear-gradient(135deg,#efe6dc 0%,#f7f1ea 100%);border:1px solid #e3d5c8;border-radius:18px;padding:18px 20px;margin:0 0 20px;display:flex;gap:16px;align-items:center}' +
    '.bloc-appli[hidden]{display:none!important}' +
    '.bloc-appli img{width:58px;height:58px;border-radius:14px;flex-shrink:0;box-shadow:0 4px 12px rgba(44,34,30,.12)}' +
    '.bloc-appli > div > strong{display:block;font-size:1rem;margin-bottom:2px;color:#2c221e}.bloc-appli .etapes strong{display:inline}' +
    '.bloc-appli p{margin:0;font-size:.86rem;color:#5a4a42;line-height:1.5}' +
    '.bloc-appli .etapes{margin:6px 0 0;padding-left:18px;font-size:.86rem;color:#5a4a42;line-height:1.55}' +
    '.bloc-appli button.installer{margin-top:10px;background:#a85743;color:#fff;border:0;border-radius:50px;padding:10px 20px;font:inherit;font-weight:700;cursor:pointer}' +
    '.bloc-appli .langues{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px;font-size:.84rem;color:#5a4a42}' +
    '.bloc-appli .langues button{background:#fff;border:1px solid #a85743;color:#a85743;border-radius:50px;padding:5px 12px;font:inherit;font-weight:700;cursor:pointer}' +
    '.bloc-appli .langues button[aria-pressed="true"]{background:#a85743;color:#fff}' +
    '.bloc-appli .fermer{margin-left:auto;align-self:flex-start;background:none;border:0;font-size:1.1rem;color:#7a685e;cursor:pointer}';
  document.head.appendChild(css);

  function etapes() {
    if (EN) {
      if (ios) return '<ol class="etapes"><li>Tap the <strong>Share</strong> button <span aria-hidden="true">⬆️</span> (at the bottom in Safari, at the top right in Chrome or Edge).</li><li>Choose <strong>“Add to Home Screen”</strong>, then <strong>Add</strong>.</li></ol>';
      if (android) return '<ol class="etapes"><li>In <strong>Chrome</strong>, tap the <strong>⋮</strong> menu at the top right.</li><li>Choose <strong>“Install app”</strong> or <strong>“Add to Home screen”</strong>.</li></ol>';
      if (safariMac) return '<ol class="etapes"><li>In Safari, open the <strong>File</strong> menu.</li><li>Choose <strong>“Add to Dock”</strong>.</li></ol>';
      if (firefox) return '<p style="margin-top:6px;">Firefox cannot install the app: open this site in <strong>Chrome</strong>, <strong>Edge</strong> or <strong>Safari</strong> to install it, or simply continue here.</p>';
      return '<ol class="etapes"><li>In <strong>Chrome</strong> or <strong>Edge</strong>, click the install icon <strong>⊕</strong> on the right of the address bar.</li><li>Click <strong>Install</strong>.</li></ol>';
    }
    if (ios) return '<ol class="etapes"><li>Touche le bouton <strong>Partager</strong> <span aria-hidden="true">⬆️</span> (en bas dans Safari, en haut à droite dans Chrome ou Edge).</li><li>Choisis <strong>« Sur l\'écran d\'accueil »</strong>, puis <strong>Ajouter</strong>.</li></ol>';
    if (android) return '<ol class="etapes"><li>Dans <strong>Chrome</strong>, touche le menu <strong>⋮</strong> en haut à droite.</li><li>Choisis <strong>« Installer l\'application »</strong> ou <strong>« Ajouter à l\'écran d\'accueil »</strong>.</li></ol>';
    if (safariMac) return '<ol class="etapes"><li>Dans Safari, ouvre le menu <strong>Fichier</strong>.</li><li>Choisis <strong>« Ajouter au Dock »</strong>.</li></ol>';
    if (firefox) return '<p style="margin-top:6px;">Firefox ne permet pas d\'installer l\'appli : ouvre ce site dans <strong>Chrome</strong>, <strong>Edge</strong> ou <strong>Safari</strong> pour l\'installer, ou continue simplement ici.</p>';
    return '<ol class="etapes"><li>Dans <strong>Chrome</strong> ou <strong>Edge</strong>, clique sur l\'icône d\'installation <strong>⊕</strong> à droite de la barre d\'adresse.</li><li>Clique sur <strong>Installer</strong>.</li></ol>';
  }
  function choixLangue() {
    if (ADMIN) return '';
    var l = langueAppli();
    return '<div class="langues"><span>🌐 ' + L('Langue de l\'appli :', 'App language:') + '</span>' +
      '<button type="button" data-appli-l="fr" aria-pressed="' + (l === 'fr') + '">Français</button>' +
      '<button type="button" data-appli-l="en" aria-pressed="' + (l === 'en') + '">English</button></div>';
  }
  function remplir() {
    var ferme = false; try { ferme = localStorage.getItem('appli-bandeau-ferme') === '1'; } catch (e) {}
    document.querySelectorAll('.bloc-appli').forEach(function (b) {
      if (installee || (ferme && !b.hasAttribute('data-toujours'))) { b.hidden = true; return; }
      b.hidden = false;
      b.innerHTML = '<img src="/icones/icone-192.png" alt=""><div><strong>' + L('📲 Installe l\'appli de l\'Académie', '📲 Install the Académie app') + '</strong>' +
        '<p>' + L('Tes cours en un toucher, sur ton cellulaire, ta tablette ou ton ordinateur, sans passer par l\'App Store ni Google Play.', 'Your courses in one tap on your phone, tablet or computer, without going through the App Store or Google Play.') + '</p>' +
        choixLangue() +
        (invite ? '<button type="button" class="installer">' + L('Installer l\'appli', 'Install the app') + '</button>' : etapes()) + '</div>' +
        (b.hasAttribute('data-toujours') ? '' : '<button type="button" class="fermer" aria-label="' + L('Masquer', 'Dismiss') + '">✕</button>');
      b.querySelectorAll('[data-appli-l]').forEach(function (x) {
        x.addEventListener('click', function () {
          var l = x.getAttribute('data-appli-l');
          try { localStorage.setItem('sere-langue', l); } catch (e) {}
          b.querySelectorAll('[data-appli-l]').forEach(function (y) { y.setAttribute('aria-pressed', String(y === x)); });
          if (window.SereLangue && SereLangue.surChangement) try { SereLangue.surChangement(l); } catch (e) {}
        });
      });
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
