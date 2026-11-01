/* Académie Sérénaissance — menu hamburger sur téléphone et tablette (pages avec <header class="entete"><nav>).
   Ajoute un bouton ☰ qui ouvre et ferme le menu, comme sur la page d'accueil. */
(function () {
  var entete = document.querySelector('header.entete');
  var nav = entete && entete.querySelector('nav');
  if (!nav || entete.querySelector('.burger')) return;

  var css = document.createElement('style');
  css.textContent =
    '.entete .burger{display:none;width:44px;height:44px;border:1px solid var(--border,#e3d5c8);border-radius:50%;background:var(--card,#fffbf8);cursor:pointer;flex-direction:column;justify-content:center;align-items:center;gap:4px;padding:0;flex-shrink:0}' +
    '.entete .burger span{display:block;width:18px;height:2px;background:var(--text,#2c221e);border-radius:2px;transition:transform .25s,opacity .25s}' +
    '.entete .burger.ouvert span:nth-child(1){transform:translateY(6px) rotate(45deg)}' +
    '.entete .burger.ouvert span:nth-child(2){opacity:0}' +
    '.entete .burger.ouvert span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}' +
    '@media (max-width:950px){' +
      'header.entete{position:relative}' +
      'header.entete .enveloppe{flex-wrap:nowrap!important;justify-content:space-between!important;padding-top:8px!important;padding-bottom:8px!important}' +
      'header.entete .logo img{height:46px!important}' +
      'header.entete .burger{display:flex}' +
      'header.entete nav{display:none;position:absolute;top:100%;left:0;right:0;z-index:60;background:var(--bg,#f7f1ea);border-bottom:1px solid var(--border,#e3d5c8);box-shadow:0 10px 24px rgba(44,34,30,.10);padding:6px 24px 18px}' +
      'header.entete nav.ouvert{display:block}' +
      'header.entete nav ul{flex-direction:column!important;align-items:stretch!important;gap:0!important;font-size:1rem!important}' +
      'header.entete nav li{border-bottom:1px solid var(--border,#e3d5c8)}' +
      'header.entete nav li:last-child{border-bottom:0;padding-top:12px}' +
      'header.entete nav a{display:block;padding:13px 2px!important}' +
      'header.entete nav a.compte{display:inline-block;margin:12px 0 2px;padding:10px 22px!important}' +
    '}';
  document.head.appendChild(css);

  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'burger';
  b.setAttribute('aria-label', 'Ouvrir le menu');
  b.setAttribute('aria-expanded', 'false');
  b.innerHTML = '<span></span><span></span><span></span>';
  nav.parentNode.insertBefore(b, nav);

  function basculer(ouvrir) {
    nav.classList.toggle('ouvert', ouvrir);
    b.classList.toggle('ouvert', ouvrir);
    b.setAttribute('aria-expanded', ouvrir ? 'true' : 'false');
    var en = (document.documentElement.lang || '').indexOf('en') === 0;
    b.setAttribute('aria-label', ouvrir ? (en ? 'Close menu' : 'Fermer le menu') : (en ? 'Open menu' : 'Ouvrir le menu'));
  }
  b.addEventListener('click', function (e) { e.stopPropagation(); basculer(!nav.classList.contains('ouvert')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) basculer(false); });
  document.addEventListener('click', function (e) { if (!entete.contains(e.target)) basculer(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') basculer(false); });
  if (document.documentElement.lang && document.documentElement.lang.indexOf('en') === 0) b.setAttribute('aria-label', 'Open menu');
})();
