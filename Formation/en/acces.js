/* Académie Sérénaissance — accès protégé aux formations.
   - Le contenu des cours est chiffré ; il n'est déchiffré que pour une étudiante connectée
     dont l'accès est validé (clé remise par Supabase selon ses droits).
   - La progression (lectures, quiz, examens) est propre à chaque étudiante et sauvegardée
     dans son compte : elle la retrouve sur n'importe quel appareil.
   - Un menu « Mon compte » (Mes cours, Mes informations, Documents de stage, Messages, Paramètres, Déconnexion)
   - Un bandeau quand Sabrina annonce une mise à jour prévue des formations
     est visible sur toutes les pages de cours. */
(function () {
  'use strict';
  var SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co';
  var SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
  var EN = location.pathname.indexOf('/Formation/en/') >= 0;
  function L(fr, en) { return EN ? en : fr; }
  // Langue choisie par l'étudiante : on ouvre la même page dans sa langue
  try {
    var pref = localStorage.getItem('sere-langue');
    if (pref === 'en' && !EN && location.pathname.indexOf('/Formation/') === 0) { location.replace(location.pathname.replace('/Formation/', '/Formation/en/') + location.search + location.hash); return; }
    if (pref === 'fr' && EN) { location.replace(location.pathname.replace('/Formation/en/', '/Formation/') + location.search + location.hash); return; }
  } catch (e) {}
  var SCRIPT = document.currentScript && document.currentScript.src;
  var RACINE = SCRIPT ? new URL(EN ? '../../' : '../', SCRIPT).href : 'https://academiesere.ca/';
  var ESPACE = RACINE + (EN ? 'en/' : '') + 'espace.html';
  var PREFIXES = /^(m\d+|marraine|final):/;

  var bloc = document.getElementById('contenu-chiffre');
  if (!bloc) return;
  var FORMATION = bloc.getAttribute('data-f');
  var NOMS = EN ? { '4e-trimestre': 'the Advanced Fourth Trimester Support program', 'marraine': 'the Breastfeeding Peer Supporter course' }
                : { '4e-trimestre': "l'Accompagnement de pointe du 4ᵉ trimestre", 'marraine': "la formation de marraine d'allaitement" };
  var sb = null, session = null, cleCrypto = null;

  function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function texte(buf) { return new TextDecoder('utf-8').decode(buf); }
  function chargerScript(src) {
    return new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------------- Refus d'accès ---------------- */
  function refus(raison) {
    if (!navigator.onLine) {
      document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f7f1ea;font-family:Inter,Arial,sans-serif;"><div style="max-width:440px;background:#fffbf8;border:1px solid #e3d5c8;border-radius:22px;padding:34px 26px;text-align:center;color:#2c221e;"><div style="font-size:42px;">📶</div><h1 style="font-family:Fraunces,Georgia,serif;font-size:1.4rem;">' + L('Pas de connexion Internet', 'No Internet connection') + '</h1><p style="color:#5a4a42;line-height:1.6;">' + L('Reconnecte-toi à Internet pour ouvrir ta formation.', 'Reconnect to the Internet to open your course.') + '</p><button onclick="location.reload()" style="background:#a85743;color:#fff;border:0;border-radius:50px;padding:12px 24px;font-weight:700;cursor:pointer;">' + L('Réessayer', 'Try again') + '</button></div></div>';
      return;
    }
    ss('cle:' + FORMATION, null);
    var connectee = raison === 'sans-acces';
    document.body.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f7f1ea;font-family:Inter,Arial,sans-serif;">' +
      '<div style="max-width:480px;background:#fffbf8;border:1px solid #e3d5c8;border-radius:22px;padding:36px 28px;text-align:center;color:#2c221e;">' +
      '<div style="font-size:42px;margin-bottom:8px;">🔒</div>' +
      '<h1 style="font-family:Fraunces,Georgia,serif;font-size:1.5rem;margin:0 0 12px;">' + L('Contenu réservé aux étudiantes', 'Students only') + '</h1>' +
      '<p style="color:#5a4a42;line-height:1.6;margin:0 0 22px;">' +
      (connectee
        ? L('Ton compte n\'a pas encore accès à ' + NOMS[FORMATION] + '. Si tu viens de t\'inscrire, ton accès sera ouvert sous 24 à 48 heures après la vérification de ton dossier.',
            'Your account does not have access to ' + NOMS[FORMATION] + ' yet. If you just signed up, your access will be opened within 24 to 48 hours once your file has been checked.')
        : L('Cette page fait partie de ' + NOMS[FORMATION] + '. Connecte-toi à ton compte pour continuer ta formation.', 'This page is part of ' + NOMS[FORMATION] + '. Log in to your account to continue your course.')) +
      '</p>' +
      '<a href="' + ESPACE + '" style="display:inline-block;background:#a85743;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:50px;margin:4px;">' + (connectee ? L('Mon compte', 'My account') : L('Me connecter', 'Log in')) + '</a>' +
      (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone ? '' : '<a href="' + RACINE + (EN ? 'en/' : '') + '#formations" style="display:inline-block;color:#a85743;text-decoration:none;font-weight:700;padding:12px 22px;border:1px solid #a85743;border-radius:50px;margin:4px;">' + L('Voir les formations', 'See the courses') + '</a>') +
      '</div></div>';
  }

  /* ---------------- Progression propre à chaque étudiante ---------------- */
  function clesProgression() {
    var l = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (PREFIXES.test(k)) l.push(k); } } catch (e) {}
    return l;
  }
  function instantane() {
    var o = {};
    clesProgression().forEach(function (k) { try { o[k] = localStorage.getItem(k); } catch (e) {} });
    return o;
  }
  var brouillon = false, minuterie = null;
  var setOrig = Storage.prototype.setItem, removeOrig = Storage.prototype.removeItem;
  function envoyerProgression(keepalive) {
    if (!brouillon || !session) return;
    brouillon = false;
    var corps = JSON.stringify({ user_id: session.user.id, donnees: instantane(), updated_at: new Date().toISOString() });
    fetch(SB_URL + '/rest/v1/progression?on_conflict=user_id', {
      method: 'POST', keepalive: !!keepalive,
      headers: { 'apikey': SB_CLE, 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json',
                 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: corps
    }).then(function (r) {
      if (!r.ok) return marquer();
      // le drapeau n'est retiré qu'une fois l'envoi confirmé (sinon la page suivante garderait la version locale)
      if (!brouillon) try { setOrig.call(localStorage, 'progression-a-envoyer', ''); } catch (e) {}
    }).catch(marquer);
  }
  function marquer() {
    brouillon = true;
    try { setOrig.call(localStorage, 'progression-a-envoyer', '1'); } catch (e) {}
    clearTimeout(minuterie);
    minuterie = setTimeout(function () { envoyerProgression(false); }, 1500);
  }
  function surveiller() {
    Storage.prototype.setItem = function (k, v) { setOrig.call(this, k, v); if (this === localStorage && PREFIXES.test(k)) marquer(); };
    Storage.prototype.removeItem = function (k) { removeOrig.call(this, k); if (this === localStorage && PREFIXES.test(k)) marquer(); };
    window.addEventListener('pagehide', function () { envoyerProgression(true); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') envoyerProgression(true); });
  }
  function preparerProgression() {
    var uid = session.user.id;
    var proprio = null; try { proprio = localStorage.getItem('progression-de'); } catch (e) {}
    if (proprio !== uid) {
      // Autre personne sur ce navigateur (ou ancienne progression de test) : on repart à zéro
      clesProgression().forEach(function (k) { try { removeOrig.call(localStorage, k); } catch (e) {} });
      try { setOrig.call(localStorage, 'progression-de', uid); setOrig.call(localStorage, 'progression-a-envoyer', ''); removeOrig.call(localStorage, 'resultats-a-envoyer'); } catch (e) {}
    }
    var enAttente = false; try { enAttente = localStorage.getItem('progression-a-envoyer') === '1'; } catch (e) {}
    return sb.from('progression').select('donnees').eq('user_id', uid).maybeSingle().then(function (r) {
      if (r.error) return;                       // table absente : on garde la progression locale
      if (!r.data) { brouillon = true; return; }   // rien dans le compte : on enverra la version locale
      // Fusion : on ne perd jamais une lecture validée ni un meilleur résultat (autre appareil ou envoi en cours)
      var serveur = r.data.donnees || {}, local = instantane(), fusion = {}, change = false;
      function ratio(v) { try { var o = JSON.parse(v); return o && o.total ? o.score / o.total : -1; } catch (e) { return -1; } }
      Object.keys(serveur).concat(Object.keys(local)).forEach(function (k) {
        if (!PREFIXES.test(k) || k in fusion) return;
        var sv = serveur[k], lv = local[k], v;
        if (sv == null) v = lv;
        else if (lv == null) v = sv;
        else if (/:read:/.test(k)) v = (sv === 'true' || lv === 'true') ? 'true' : sv;
        else if (/:score:/.test(k)) v = ratio(lv) > ratio(sv) ? lv : sv;
        else v = enAttente ? lv : sv;
        fusion[k] = v;
        if (v !== sv) change = true;
      });
      Object.keys(local).forEach(function (k) { if (!(k in fusion)) try { removeOrig.call(localStorage, k); } catch (e) {} });
      Object.keys(fusion).forEach(function (k) { try { if (fusion[k] == null) removeOrig.call(localStorage, k); else setOrig.call(localStorage, k, fusion[k]); } catch (e) {} });
      if (change || enAttente) brouillon = true;
    }).catch(function () {});
  }

  /* ---------------- Menu « Mon compte » sur toutes les pages ---------------- */
  function menu() {
    var css = document.createElement('style');
    css.textContent =
      '.sere-menu{position:fixed;right:14px;top:50%;transform:translateY(-50%);z-index:9000;display:flex;flex-direction:column;gap:8px;font-family:Inter,Arial,sans-serif}' +
      '.sere-menu a,.sere-menu button{display:flex;align-items:center;gap:10px;justify-content:flex-end;background:#fffbf8;color:#2c221e;border:1px solid #e3d5c8;border-radius:50px;padding:9px 12px;font-size:.85rem;font-weight:600;text-decoration:none;cursor:pointer;box-shadow:0 4px 14px rgba(44,34,30,.10);white-space:nowrap}' +
      '.sere-menu a span.t,.sere-menu button span.t{max-width:0;overflow:hidden;transition:max-width .25s}' +
      '.sere-menu:hover a span.t,.sere-menu:hover button span.t,.sere-menu a:focus span.t{max-width:220px}' +
      '.sere-menu .sortir{background:#a85743;color:#fff;border-color:#a85743}' +
      '.sere-menu-bouton{display:none}' +
      '@media (max-width:900px){.sere-menu{top:auto;bottom:16px;right:16px;transform:none;display:none}.sere-menu.ouvert{display:flex}' +
      '.sere-menu a span.t,.sere-menu button span.t{max-width:none}' +
      '.sere-menu-bouton{display:flex;position:fixed;right:16px;bottom:16px;z-index:9001;width:54px;height:54px;border-radius:50%;border:0;background:#a85743;color:#fff;font-size:1.4rem;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(44,34,30,.25);cursor:pointer}' +
      '.sere-menu.ouvert{bottom:82px}}';
    document.head.appendChild(css);
    var m = document.createElement('nav');
    m.className = 'sere-menu'; m.setAttribute('aria-label', L('Mon compte', 'My account'));
    var autre = EN ? location.pathname.replace('/Formation/en/', '/Formation/') : location.pathname.replace('/Formation/', '/Formation/en/');
    var liens = [
      ['📚', L('Mes cours', 'My courses'), ESPACE + '#cours'],
      ['👤', L('Mes informations', 'My information'), ESPACE + '#infos'],
      ['📝', L('Documents de stage', 'Practicum documents'), ESPACE + '#stage'],
      ['💬', 'Messages', ESPACE + '#messages'],
      ['⚙️', L('Paramètres', 'Settings'), ESPACE + '#parametres'],
      ['🌐', L('English', 'Français'), autre + location.hash, EN ? 'fr' : 'en'],
      ['📅', L('Mentorat', 'Mentoring'), 'https://cal.com/sabrina-chavanel-zs5clq/mentorat']
    ];
    if (FORMATION === 'marraine') liens.splice(2, 1);
    liens.forEach(function (l) {
      var a = document.createElement('a'); a.href = l[2]; a.title = l[1];
      if (/^https:\/\/cal/.test(l[2])) { a.target = '_blank'; a.rel = 'noopener'; }
      a.innerHTML = '<span class="t">' + l[1] + '</span><span>' + l[0] + '</span>';
      if (l[3]) a.addEventListener('click', function () {
        try { localStorage.setItem('sere-langue', l[3]); } catch (e) {}
        envoyerProgression(true);
        if (sb) sb.rpc('definir_langue', { p_langue: l[3] }).then(function () {}, function () {});
      });
      m.appendChild(a);
    });
    var sortir = document.createElement('button'); sortir.type = 'button'; sortir.className = 'sortir'; sortir.title = L('Me déconnecter', 'Log out');
    sortir.innerHTML = '<span class="t">' + L('Me déconnecter', 'Log out') + '</span><span>🚪</span>';
    sortir.addEventListener('click', function () {
      envoyerProgression(true);
      ss('cle:4e-trimestre', null); ss('cle:marraine', null);
      sb.auth.signOut().finally(function () { location.href = ESPACE + '?deconnectee=1'; });
    });
    m.appendChild(sortir);
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sere-menu-bouton'; b.setAttribute('aria-label', L('Mon compte', 'My account')); b.textContent = '👤';
    b.addEventListener('click', function () { m.classList.toggle('ouvert'); b.textContent = m.classList.contains('ouvert') ? '✕' : '👤'; });
    document.body.appendChild(m); document.body.appendChild(b);
  }

  /* ---------------- Mise à jour prévue des formations (annonce de Sabrina) ---------------- */
  function bandeauMiseAJour() {
    sb.from('annonces').select('titre,debut,fin').eq('genre', 'maintenance').order('debut', { ascending: true }).then(function (r) {
      var maint = ((r && r.data) || []).filter(function (a) { return a.fin && new Date(a.fin) > new Date() && (!a.debut || new Date(a.debut) - Date.now() < 7 * 864e5); })[0];
      if (!maint) return;
      function q(d) { return EN ? new Date(d).toLocaleString('en-CA', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }) : new Date(d).toLocaleString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).replace(':', ' h '); }
      var enCours = maint.debut && new Date(maint.debut) <= new Date();
      var b = document.createElement('div');
      b.setAttribute('role', 'status');
      b.style.cssText = 'position:sticky;top:0;z-index:8999;background:' + (enCours ? '#fbeeea' : '#fff4e0') + ';color:' + (enCours ? '#8c4434' : '#6b4d12') + ';border-bottom:1px solid ' + (enCours ? '#e3b5a8' : '#e8c98f') + ';padding:10px 44px 10px 16px;font:500 .9rem/1.45 Inter,Arial,sans-serif;text-align:center';
      b.textContent = EN
        ? '🛠️ ' + (enCours ? 'Course update in progress' : 'Scheduled course update') + ': ' + (maint.debut ? 'from ' + q(maint.debut) + ' ' : '') + 'until ' + q(maint.fin) + '. Your progress is saved.'
        : '🛠️ ' + (enCours ? 'Mise à jour des formations en cours' : 'Mise à jour prévue des formations') + ' : ' + (maint.debut ? 'du ' + q(maint.debut) + ' ' : '') + 'jusqu\'au ' + q(maint.fin) + '. Ta progression est conservée.';
      var x = document.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', L('Masquer', 'Dismiss'));
      x.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:0;font-size:1rem;cursor:pointer;color:inherit';
      x.addEventListener('click', function () { b.remove(); });
      b.appendChild(x); document.body.insertBefore(b, document.body.firstChild);
    }).catch(function () {});
  }

  /* ---------------- Déchiffrement et exécution ---------------- */
  function importer(cle) { return crypto.subtle.importKey('raw', b64(cle), 'AES-GCM', false, ['decrypt']); }
  function dechiffrer(octets) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: octets.slice(0, 12) }, cleCrypto, octets.slice(12)); }
  function executerScripts() {
    var anciens = Array.prototype.slice.call(document.body.querySelectorAll('script'));
    return anciens.reduce(function (p, ancien) {
      return p.then(function () {
        var src = ancien.getAttribute('src');
        var nouveau = document.createElement('script');
        if (src && /-data\.js$/.test(src)) {
          return fetch(src + '.enc').then(function (r) { return r.text(); })
            .then(function (t) { return dechiffrer(b64(t.trim())); })
            .then(function (buf) { nouveau.text = texte(buf); ancien.parentNode.replaceChild(nouveau, ancien); });
        }
        if (src) {
          return new Promise(function (ok) { nouveau.src = src; nouveau.onload = ok; nouveau.onerror = ok; ancien.parentNode.replaceChild(nouveau, ancien); });
        }
        nouveau.text = ancien.text; ancien.parentNode.replaceChild(nouveau, ancien);
      });
    }, Promise.resolve());
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-protege]');
    if (!a || !cleCrypto) return;
    e.preventDefault();
    var nom = a.getAttribute('data-nom') || 'document';
    fetch(a.getAttribute('href')).then(function (r) { return r.arrayBuffer(); })
      .then(function (buf) { return dechiffrer(new Uint8Array(buf)); })
      .then(function (clair) {
        var url = URL.createObjectURL(new Blob([clair], { type: a.getAttribute('data-protege') }));
        var lien = document.createElement('a'); lien.href = url; lien.download = nom;
        document.body.appendChild(lien); lien.click(); lien.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      }).catch(function () { alert(L("Le document n'a pas pu être ouvert. Réessaie dans un instant.", 'The document could not be opened. Please try again in a moment.')); });
  });

  function obtenirCle() {
    var cache = ss('cle:' + FORMATION);
    if (cache && cache.indexOf(session.user.id + '|') === 0) return Promise.resolve(cache.split('|')[1]);
    return sb.from('cles_formation').select('cle').eq('formation', FORMATION).maybeSingle().then(function (r) {
      if (r.error || !r.data) return null;
      ss('cle:' + FORMATION, session.user.id + '|' + r.data.cle);
      return r.data.cle;
    });
  }

  chargerScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2').then(function () {
    sb = window.supabase.createClient(SB_URL, SB_CLE, { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
    try { localStorage.removeItem('sb-zeptirfcwstufcpgvkzx-auth-token'); } catch (e) {}
    return sb.auth.getSession();
  }).then(function (r) {
    session = r && r.data && r.data.session;
    if (!session) return refus('deconnectee');
    sb.auth.onAuthStateChange(function (ev, s) { if (s) session = s; });
    return obtenirCle().then(function (cle) {
      if (!cle) return refus('sans-acces');
      return importer(cle).then(function (k) {
        cleCrypto = k;
        return preparerProgression();
      }).then(function () {
        return dechiffrer(b64(bloc.textContent.trim()));
      }).then(function (buf) {
        window.SereCompte = { sb: sb, session: session };   // pour les pages qui ont besoin du dossier (ex. certificat)
        document.body.innerHTML = texte(buf);
        surveiller();
        if (location.hash) { var c = document.getElementById(location.hash.slice(1)); if (c) c.scrollIntoView(); }
        return executerScripts();
      }).then(function () {
        menu();
        bandeauMiseAJour();
        // Déconnexion automatique après 5 minutes sans activité
        chargerScript('/securite.js').then(function () {
          if (window.SereSecurite) SereSecurite.surveiller({ sb: sb, minutes: 5, avant: function () { envoyerProgression(true); ss('cle:4e-trimestre', null); ss('cle:marraine', null); }, apres: ESPACE });
        }).catch(function () {});
        if (brouillon) marquer();
      });
    });
  }).catch(function (e) {
    console.error(e);
    ss('cle:' + FORMATION, null);
    refus('deconnectee');
  });
})();
