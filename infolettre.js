/* Académie Sérénaissance — fenêtre d'accueil : promotion en cours + inscription à l'infolettre.
   - Consentement exprès (Loi canadienne anti-pourriel, Loi 25, RGPD) : case non cochée d'avance, expéditrice identifiée,
     désabonnement possible en tout temps (lien dans chaque courriel).
   - S'affiche une seule fois (après quelques secondes ou en faisant défiler), puis plus avant 14 jours si elle est fermée,
     et plus jamais une fois inscrite. SereInfolettre.ouvrir() la rouvre (lien « Infolettre » du pied de page). */
(function () {
  'use strict';
  var SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co', SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
  var EN = (document.documentElement.lang || 'fr').slice(0, 2) === 'en';
  var CLE = 'sere-infolettre';
  var ADRESSE = 'Sabrina Chavanel, Académie Sérénaissance, 43 Tingley Cres., Campbellton (N.-B.) E3N 2S1';
  var T = EN ? {
    titre: 'Stay in the loop 🌸',
    texte: 'Join the Académie Sérénaissance newsletter: new courses, promotions and postpartum tips. About 2 emails a month.',
    offre: '✨ Launch offer: the Fourth Trimester course for <strong>$250</strong> instead of $550, plus the Breastfeeding Peer Supporter course as a gift · until October 5 at noon',
    places: function (n) { return n + (n > 1 ? ' spots left' : ' spot left'); },
    voir: 'See the offer →', prenom: 'First name (optional)', courriel: 'Your email address',
    accord: 'I agree to receive the Académie Sérénaissance newsletter (' + ADRESSE.replace('(N.-B.)', 'NB') + '). I can unsubscribe at any time using the link in each email.',
    confid: 'Privacy policy', bouton: 'Sign me up', fermer: 'Close', envoi: 'Sending…',
    ok: '💕 Thank you! You are now subscribed to the newsletter.', deja: '💕 You were already subscribed. Thank you!',
    erreur: 'Something went wrong. Please try again in a moment.', invalide: 'Enter a valid email address.', coche: 'Check the box to give your consent.',
    lienOffre: '/en/courses/', lienConfid: '/en/privacy/'
  } : {
    titre: 'Reste au courant 🌸',
    texte: 'Inscris-toi à l\'infolettre de l\'Académie Sérénaissance : nouvelles formations, promotions et conseils sur le post-partum. Environ 2 courriels par mois.',
    offre: '✨ Offre de lancement : la formation du 4ᵉ trimestre à <strong>250 $</strong> au lieu de 550 $, et la formation de marraine d\'allaitement en cadeau · jusqu\'au 5 octobre à midi',
    places: function (n) { return n + (n > 1 ? ' places restantes' : ' place restante'); },
    voir: 'Voir l\'offre →', prenom: 'Prénom (facultatif)', courriel: 'Ton adresse courriel',
    accord: 'J\'accepte de recevoir l\'infolettre de l\'Académie Sérénaissance (' + ADRESSE + '). Je peux me désabonner en tout temps grâce au lien dans chaque courriel.',
    confid: 'Politique de confidentialité', bouton: 'Je m\'inscris', fermer: 'Fermer', envoi: 'Envoi…',
    ok: '💕 Merci ! Tu es maintenant inscrite à l\'infolettre.', deja: '💕 Tu étais déjà inscrite. Merci !',
    erreur: 'Oups, ça n\'a pas fonctionné. Réessaie dans un instant.', invalide: 'Entre une adresse courriel valide.', coche: 'Coche la case pour donner ton consentement.',
    lienOffre: '/formations/', lienConfid: '/confidentialite/'
  };
  // Pages de formation (FR) : la fenêtre offre le mini-cours gratuit (inscription + courriels automatiques du mini-cours)
  var MC = !EN && !/^\/(accompagnements|doula-campbellton|marraines|mini-cours-doula)\//.test(location.pathname);
  var MCT = {
    titre: 'Ton mini-cours gratuit 🌸',
    texte: 'Tu rêves de devenir doula ? Reçois mon mini-cours « Les 3 erreurs à éviter quand on commence comme doula », avec 3 exercices pratiques et une version PDF.',
    accord: 'J\'accepte de recevoir le mini-cours et l\'infolettre de l\'Académie Sérénaissance (' + ADRESSE + '). Je peux me désabonner en tout temps grâce au lien dans chaque courriel.',
    bouton: 'Je veux le mini-cours',
    ok: '💕 Merci ! Ton mini-cours t\'attend ici : <a href="/mini-cours-doula/#section-cours" style="color:#a85743;font-weight:700">lire le mini-cours</a>. Je te l\'envoie aussi par courriel.'
  };
  var NOMS = EN ? { 'relation-aide': 'Helping relationship · 300 h', yoga: 'Prenatal and postnatal yoga · 85 h' } : { 'relation-aide': 'Relation d\'aide · 300 h', yoga: 'Yoga prénatal et postnatal · 85 h' };
  var A = EN ? {
    titre: 'Waiting list 🌸', texte: 'Leave your email and you will be among the first to hear when registration opens. Dates and prices will be announced soon.',
    accord: 'I agree that Académie Sérénaissance may email me when these courses open and send me its newsletter (' + ADRESSE.replace('(N.-B.)', 'NB') + '). I can unsubscribe at any time using the link in each email.',
    bouton: 'Join the waiting list', ok: '💕 Noted! You are on the waiting list. I will email you as soon as registration opens.', aucune: 'Choose at least one course.'
  } : {
    titre: 'Liste d\'attente 🌸', texte: 'Laisse-moi ton courriel : tu seras parmi les premières prévenues quand les inscriptions ouvriront. Les dates et les prix seront annoncés bientôt.',
    accord: 'J\'accepte que l\'Académie Sérénaissance m\'écrive à l\'ouverture de ces formations et m\'envoie son infolettre (' + ADRESSE + '). Je peux me désabonner en tout temps grâce au lien dans chaque courriel.',
    bouton: 'Me mettre sur la liste', ok: '💕 C\'est noté ! Tu es sur la liste d\'attente : je t\'écris dès l\'ouverture.', aucune: 'Choisis au moins une formation.'
  };
  function casesAttente(choisie) {
    return Object.keys(NOMS).map(function (k) {
      return '<label class="il-case"><input type="checkbox" name="att-' + k + '"' + (k === choisie ? ' checked' : '') + '> <span><strong>' + NOMS[k] + '</strong></span></label>';
    }).join('');
  }
  function lire() { try { return JSON.parse(localStorage.getItem(CLE) || '{}'); } catch (e) { return {}; } }
  function ecrire(o) { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {} }
  function offreActive() {
    if (window.TarifsSere && TarifsSere.offreActive) return TarifsSere.offreActive();
    return new Date() < new Date('2026-10-05T12:00:00-03:00');
  }
  function rpc(nom, corps) {
    return fetch(SB_URL + '/rest/v1/rpc/' + nom, { method: 'POST', headers: { 'apikey': SB_CLE, 'Content-Type': 'application/json' }, body: JSON.stringify(corps) })
      .then(function (r) { return r.text().then(function (t) { var d = null; try { d = JSON.parse(t); } catch (e) { d = t; } if (!r.ok) throw new Error((d && d.message) || 'erreur'); return d; }); });
  }
  // Avertit Sabrina par courriel (au cas où la personne était déjà abonnée à l'infolettre) ; sans effet si EmailJS n'est pas chargé
  function prevenirSabrina(courriel, prenom, cles) {
    try {
      if (typeof emailjs === 'undefined') return;
      var noms = cles.map(function (k) { return NOMS[k]; }).join(' ; ');
      emailjs.send('service_82vfhfg', 'template_arhnc1s', {
        name: prenom || courriel, nom: prenom || courriel, email: courriel, courriel: courriel,
        sujet: 'Liste d\'attente : ' + noms, title: 'Liste d\'attente : ' + noms,
        message: 'Nouvelle inscription à la liste d\'attente.\nFormation(s) : ' + noms + '\nCourriel : ' + courriel + (prenom ? '\nPrénom : ' + prenom : '') + '\nLangue : ' + (EN ? 'anglais' : 'français'),
        time: new Date().toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })
      }, 'HNvKdORRpRy_vT_FI');
    } catch (e) {}
  }
  var fond = null;
  function css() {
    if (document.getElementById('style-infolettre')) return;
    var s = document.createElement('style'); s.id = 'style-infolettre';
    s.textContent =
      '.il-fond{position:fixed;inset:0;z-index:100000;background:rgba(44,34,30,.45);display:flex;align-items:center;justify-content:center;padding:16px;animation:ilApparait .25s ease}' +
      '@keyframes ilApparait{from{opacity:0}to{opacity:1}}' +
      '.il-boite{position:relative;width:100%;max-width:440px;max-height:92vh;overflow-y:auto;background:#fffbf8;border:1px solid #e3d5c8;border-radius:24px;padding:30px 24px 22px;box-shadow:0 20px 60px rgba(44,34,30,.3);font-family:"Plus Jakarta Sans",Arial,sans-serif;color:#2c221e;text-align:center}' +
      '.il-boite img.il-logo{width:120px;height:auto;margin:0 auto 6px;display:block;mix-blend-mode:darken}' +
      '.il-boite h2{font-family:"Playfair Display",Georgia,serif;font-size:1.5rem;margin:4px 0 8px}' +
      '.il-boite p{font-size:.92rem;line-height:1.55;color:#5a4a42;margin:0 0 12px}' +
      '.il-offre{background:linear-gradient(135deg,#efe6dc,#f7f1ea);border:1px solid #e3d5c8;border-radius:16px;padding:12px 14px;font-size:.88rem;line-height:1.5;margin:0 0 14px;color:#2c221e}' +
      '.il-offre a{display:inline-block;margin-top:6px;color:#a85743;font-weight:700;text-decoration:none}.il-offre .il-places{display:block;font-weight:700;color:#a85743;margin-top:2px}' +
      '.il-boite form{display:flex;flex-direction:column;gap:9px;text-align:left}' +
      '.il-boite input[type=email],.il-boite input[type=text]{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #e3d5c8;border-radius:12px;font:inherit;font-size:.95rem;background:#fff}' +
      '.il-boite label.il-case{display:flex;gap:8px;align-items:flex-start;font-size:.78rem;line-height:1.45;color:#5a4a42;cursor:pointer}' +
      '.il-boite label.il-case input{margin-top:2px;flex-shrink:0;width:16px;height:16px;accent-color:#a85743}' +
      '.il-boite button.il-envoyer{background:#a85743;color:#fff;border:0;border-radius:50px;padding:13px 20px;font:inherit;font-weight:700;font-size:.95rem;cursor:pointer;margin-top:2px}' +
      '.il-boite button.il-envoyer:disabled{opacity:.6;cursor:wait}' +
      '.il-fermer{position:absolute;top:10px;right:12px;background:none;border:0;font-size:1.3rem;color:#7a685e;cursor:pointer;padding:6px;line-height:1}' +
      '.il-msg{font-size:.86rem;margin-top:4px;min-height:1em}.il-msg.ko{color:#a33b2b}.il-msg.ok{color:#3d7a4a;font-weight:600;text-align:center}' +
      '.il-petit{font-size:.72rem;color:#7a685e;text-align:center;margin-top:6px}.il-petit a{color:#7a685e}' +
      '@media (max-width:520px){.il-boite{padding:20px 16px 14px;border-radius:20px}.il-boite img.il-logo{display:none}.il-boite h2{font-size:1.2rem;margin:0 26px 6px}' +
      '.il-offre{font-size:.8rem;padding:9px 11px;margin-bottom:10px}.il-boite p{font-size:.82rem;margin-bottom:9px}.il-boite input[type=email],.il-boite input[type=text]{padding:10px 12px;font-size:16px}' +
      '.il-boite label.il-case{font-size:.72rem}.il-boite button.il-envoyer{padding:11px 18px}}';
    document.head.appendChild(s);
  }
  function fermer() {
    if (!fond) return;
    var e = lire(); if (!e.inscrite) { e.ferme = Date.now(); ecrire(e); }
    fond.remove(); fond = null; document.removeEventListener('keydown', echap);
  }
  function echap(ev) { if (ev.key === 'Escape') fermer(); }
  function ouvrir(opts) {
    if (fond) return;
    var att = opts && opts.attente ? opts.attente : null;
    css();
    fond = document.createElement('div'); fond.className = 'il-fond'; fond.setAttribute('role', 'dialog'); fond.setAttribute('aria-modal', 'true'); fond.setAttribute('aria-labelledby', 'il-titre');
    var offre = !att && offreActive();
    fond.innerHTML = '<div class="il-boite">' +
      '<button type="button" class="il-fermer" aria-label="' + T.fermer + '">✕</button>' +
      '<img class="il-logo" src="/logo.png" alt="Académie Sérénaissance">' +
      '<h2 id="il-titre">' + (att ? A.titre : MC ? MCT.titre : T.titre) + '</h2>' +
      (offre ? '<div class="il-offre">' + T.offre + '<span class="il-places" hidden></span><a href="' + T.lienOffre + '">' + T.voir + '</a></div>' : '') +
      '<p>' + (att ? A.texte : MC ? MCT.texte : T.texte) + '</p>' +
      '<form novalidate>' +
        '<input type="text" name="prenom" autocomplete="given-name" maxlength="60" placeholder="' + T.prenom + '" aria-label="' + T.prenom + '">' +
        '<input type="email" name="courriel" autocomplete="email" maxlength="200" required placeholder="' + T.courriel + '" aria-label="' + T.courriel + '">' +
        (att ? casesAttente(att) : '') +
        '<label class="il-case"><input type="checkbox" name="accord"> <span>' + (att ? A.accord : MC ? MCT.accord : T.accord) + '</span></label>' +
        '<button type="submit" class="il-envoyer">' + (att ? A.bouton : MC ? MCT.bouton : T.bouton) + '</button>' +
        '<div class="il-msg" role="status"></div>' +
      '</form>' +
      '<div class="il-petit"><a href="' + T.lienConfid + '">' + T.confid + '</a></div>' +
      '</div>';
    document.body.appendChild(fond);
    fond.addEventListener('click', function (ev) { if (ev.target === fond) fermer(); });
    fond.querySelector('.il-fermer').addEventListener('click', fermer);
    fond.querySelectorAll('.il-offre a, .il-petit a').forEach(function (a) { a.addEventListener('click', function () { fermer(); }); });
    document.addEventListener('keydown', echap);
    if (offre) rpc('places_offre_restantes', {}).then(function (n) {
      var el = fond && fond.querySelector('.il-places'); n = parseInt(n, 10);
      if (el && n > 0 && n <= 10) { el.textContent = T.places(n); el.hidden = false; }
    }).catch(function () {});
    var f = fond.querySelector('form'), msg = fond.querySelector('.il-msg'), b = fond.querySelector('.il-envoyer');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var c = f.courriel.value.trim().toLowerCase();
      msg.className = 'il-msg ko';
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(c)) { msg.textContent = T.invalide; f.courriel.focus(); return; }
      var choix = att ? Object.keys(NOMS).filter(function (k) { return f['att-' + k] && f['att-' + k].checked; }) : [];
      if (att && !choix.length) { msg.textContent = A.aucune; return; }
      if (!f.accord.checked) { msg.textContent = T.coche; return; }
      b.disabled = true; b.textContent = T.envoi; msg.textContent = '';
      var mc = MC && !att;
      (mc ? rpc('inscrire_mini_cours', { p_courriel: c, p_prenom: f.prenom.value.trim(), p_consentement: MCT.accord }) :
      rpc('abonner_infolettre', { p_courriel: c, p_prenom: f.prenom.value.trim(), p_langue: EN ? 'en' : 'fr', p_source: att ? ('attente-' + choix.join('+')).slice(0, 60) : (location.pathname || '/').slice(0, 60), p_consentement: att ? A.accord : T.accord }))
        .then(function (r) {
          ecrire({ inscrite: Date.now() });
          if (mc) { try { localStorage.setItem('sere-mini-cours', '1'); } catch (x) {} f.innerHTML = '<div class="il-msg ok">' + MCT.ok + '</div>'; return; }
          if (att) prevenirSabrina(c, f.prenom.value.trim(), choix);
          f.innerHTML = '<div class="il-msg ok">' + (att ? A.ok : (r === 'deja' ? T.deja : T.ok)) + '</div>';
          setTimeout(fermer, 3500);
        }).catch(function (e) {
          b.disabled = false; b.textContent = att ? A.bouton : MC ? MCT.bouton : T.bouton;
          msg.textContent = e && e.message && e.message !== 'erreur' ? e.message : T.erreur;
        });
    });
    setTimeout(function () { var i = fond && fond.querySelector('input[name=courriel]'); if (i && window.matchMedia('(min-width: 700px)').matches) i.focus(); }, 300);
  }
  function peutAfficher() {
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) return false;
    var e = lire();
    if (e.inscrite) return false;
    if (/^\/mini-cours-doula\//.test(location.pathname)) return false;
    if (e.ferme && Date.now() - e.ferme < 14 * 864e5) return false;
    try { if (localStorage.getItem('sere-admin') === '1') return false; } catch (x) {}
    return true;
  }
  function programmer() {
    if (!peutAfficher()) return;
    var fait = false;
    function go() { if (fait) return; fait = true; window.removeEventListener('scroll', defil); if (!document.querySelector('.modal-fond.ouvert, .modal-fond[style*="flex"], .cad-fond, #sere-accueil')) ouvrir(); }
    function defil() { var h = document.documentElement; if ((h.scrollTop + innerHeight) / h.scrollHeight > 0.45) go(); }
    setTimeout(go, 9000);
    window.addEventListener('scroll', defil, { passive: true });
  }
  window.SereInfolettre = { ouvrir: ouvrir, attente: function (cle) { ouvrir({ attente: cle }); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', programmer); else programmer();
})();
