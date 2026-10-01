/* Académie Sérénaissance — écrans de bienvenue et d'au revoir.
   - Bienvenue : environ 6 secondes à l'ouverture (une fois par session), puis s'efface pour laisser place à la connexion.
     Étudiantes : « Bienvenue dans ton espace d'étude » ; admin (data-mode="admin" sur la balise) : message pour Sabrina.
   - Au revoir : après une déconnexion (?deconnectee=1) ou avec SereAccueil.auRevoir(suite) : « belle et merveilleuse journée ».
   On peut toujours passer l'écran en touchant l'écran ou le bouton. */
(function () {
  'use strict';
  var SCRIPT = document.currentScript;
  var ADMIN = !!(SCRIPT && SCRIPT.getAttribute('data-mode') === 'admin');
  var EN = !ADMIN && ((document.documentElement.lang || '').slice(0, 2) === 'en' || location.pathname.indexOf('/en/') === 0);
  var DUREE = 6000;
  var CLE = ADMIN ? 'sere-accueil-admin-vu' : 'sere-accueil-vu';
  var auRevoirDemande = /[?&]deconnectee=1/.test(location.search) && !/[?&]inactivite=1/.test(location.search);
  var dejaVu = false;
  try { dejaVu = sessionStorage.getItem(CLE) === '1'; } catch (e) {}
  var bienvenue = !auRevoirDemande && !dejaVu && !/[?&#](access_token|token_hash|type=recovery|inactivite)/.test(location.href);
  if (bienvenue) { try { sessionStorage.setItem(CLE, '1'); } catch (e) {} }
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heure = new Date().getHours();
  var salut = EN ? (heure < 12 ? 'Good morning' : heure < 18 ? 'Good afternoon' : 'Good evening')
                 : (heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir');

  var css = document.createElement('style');
  css.textContent =
    '#sere-accueil{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:24px;' +
    'background:radial-gradient(circle at 30% 20%,#fffbf8 0%,#f7f1ea 45%,#efe2d6 100%);font-family:"Plus Jakarta Sans",Arial,sans-serif;color:#2c221e;text-align:center;cursor:pointer;transition:opacity .7s ease}' +
    '#sere-accueil.part{opacity:0;pointer-events:none}' +
    '#sere-accueil .boite{max-width:440px}' +
    '#sere-accueil img{width:120px;height:auto;mix-blend-mode:darken;margin-bottom:10px}' +
    '#sere-accueil .script{font-family:"Great Vibes","Brush Script MT",cursive;font-size:2.4rem;color:#a85743;line-height:1.1;margin:0}' +
    '#sere-accueil h1{font-family:"Playfair Display",Georgia,serif;font-size:1.55rem;margin:6px 0 12px;line-height:1.25}' +
    '#sere-accueil p{color:#5a4a42;line-height:1.6;margin:0 0 8px;font-size:1rem}' +
    '#sere-accueil .citation{font-family:"Playfair Display",Georgia,serif;font-style:italic;color:#a85743;margin-top:14px}' +
    '#sere-accueil .barre{height:4px;background:#e3d5c8;border-radius:4px;overflow:hidden;margin:22px auto 14px;max-width:220px}' +
    '#sere-accueil .barre i{display:block;height:100%;width:0;background:#a85743;border-radius:4px}' +
    '#sere-accueil button{background:none;border:1px solid #a85743;color:#a85743;border-radius:50px;padding:8px 20px;font:inherit;font-weight:700;cursor:pointer}' +
    '#sere-accueil button:focus-visible{outline:2px solid #a85743;outline-offset:3px}' +
    (reduit ? '' : '#sere-accueil .boite{animation:sereMonte .9s ease both}@keyframes sereMonte{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}');
  document.head.appendChild(css);

  function ecran(type) {
    var d = document.createElement('div');
    d.id = 'sere-accueil';
    d.setAttribute('role', 'dialog');
    var t;
    if (type === 'aurevoir') t = {
      script: EN ? 'Thank you' : 'Merci',
      titre: EN ? 'See you soon! 🌸' : 'À bientôt ! 🌸',
      texte: ADMIN ? 'Tu es bien déconnectée. Je te souhaite une belle et merveilleuse journée, Sabrina ! ✨'
           : (EN ? 'You are now logged out. I wish you a beautiful and wonderful day!' : 'Tu es bien déconnectée. Je te souhaite une belle et merveilleuse journée !'),
      citation: EN ? 'Be proud of every step you take.' : 'Sois fière de chaque pas que tu fais.',
      bouton: EN ? 'Close' : 'Fermer'
    };
    else if (ADMIN) t = {
      script: salut + ' Sabrina',
      titre: 'Bienvenue dans ton espace administratrice ✨',
      texte: 'Tes étudiantes, tes marraines, tes messages et ton académie t\'attendent. Prends un bon café et une grande respiration : tu fais un travail magnifique.',
      citation: '« Chaque famille mérite d\'être accompagnée avec douceur. »',
      bouton: 'Continuer →'
    };
    else t = {
      script: salut,
      titre: EN ? 'Welcome to your study space 🌸' : 'Bienvenue dans ton espace d\'étude 🌸',
      texte: EN ? 'Take a deep breath and settle in comfortably: this is your time to learn, at your own pace.'
                : 'Prends une grande respiration et installe-toi confortablement : c\'est ton moment pour apprendre, à ton rythme.',
      citation: EN ? '“Every family deserves to be supported with gentleness.”' : '« Chaque famille mérite d\'être accompagnée avec douceur. »',
      bouton: EN ? 'Continue →' : 'Continuer →'
    };
    d.setAttribute('aria-label', t.titre);
    d.innerHTML = '<div class="boite">' +
      '<img src="/logo.jpg" alt="Académie Sérénaissance">' +
      '<p class="script">' + t.script + '</p>' +
      '<h1>' + t.titre + '</h1>' +
      '<p>' + t.texte + '</p>' +
      '<p class="citation">' + t.citation + (type === 'aurevoir' || ADMIN ? '' : '<br><span style="font-style:normal;font-size:.9rem;color:#7a685e;">— Sabrina</span>') + '</p>' +
      '<div class="barre"><i></i></div>' +
      '<button type="button">' + t.bouton + '</button>' +
      '</div>';
    return d;
  }
  function montrer(type, duree, suite) {
    var d = ecran(type), fini = false;
    function fermer() {
      if (fini) return; fini = true;
      d.classList.add('part');
      setTimeout(function () {
        if (d.parentNode) d.remove();
        if (suite) return suite();
        var c = document.querySelector('#vue-connexion:not([hidden]) input'); if (c) try { c.focus({ preventScroll: true }); } catch (e) {}
      }, 700);
    }
    var aller = function () {
      var ancien = document.getElementById('sere-accueil'); if (ancien) ancien.remove();
      document.body.appendChild(d);
      var b = d.querySelector('.barre i');
      if (b) { b.style.transition = 'width ' + duree + 'ms linear'; requestAnimationFrame(function () { requestAnimationFrame(function () { b.style.width = '100%'; }); }); }
      d.addEventListener('click', fermer);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter') fermer(); }, { once: true });
      setTimeout(function () { var bt = d.querySelector('button'); if (bt) try { bt.focus({ preventScroll: true }); } catch (e) {} }, 50);
      setTimeout(fermer, duree);
    };
    if (document.body) aller(); else document.addEventListener('DOMContentLoaded', aller);
  }
  // À appeler au moment de la déconnexion : affiche le message d'au revoir, puis continue (redirection)
  window.SereAccueil = { auRevoir: function (suite) { montrer('aurevoir', 3500, suite); } };
  if (auRevoirDemande) {
    montrer('aurevoir', 4500);
  } else if (bienvenue) montrer('bienvenue', DUREE);
})();
