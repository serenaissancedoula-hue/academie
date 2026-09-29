/* Académie Sérénaissance — accès protégé aux formations.
   Le contenu des cours est chiffré. Il n'est déchiffré que pour une étudiante
   connectée dont l'accès a été validé (clé remise par Supabase selon ses droits). */
(function () {
  'use strict';
  var SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co';
  var SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
  var SB_JETON = 'sb-zeptirfcwstufcpgvkzx-auth-token';
  var SITE = 'https://academiesere.ca/';

  var bloc = document.getElementById('contenu-chiffre');
  if (!bloc) return;
  var FORMATION = bloc.getAttribute('data-f');
  var NOMS = { '4e-trimestre': "l'Accompagnement de pointe du 4ᵉ trimestre", 'marraine': "la formation de marraine d'allaitement" };

  function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function lireSession() { try { return JSON.parse(localStorage.getItem(SB_JETON)); } catch (e) { return null; } }
  function rafraichir(s) {
    if (!s || !s.refresh_token) return Promise.resolve(null);
    return fetch(SB_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { 'apikey': SB_CLE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (n) {
      if (!n || !n.access_token) return null;
      try { localStorage.setItem(SB_JETON, JSON.stringify(n)); } catch (e) {}
      return n;
    }).catch(function () { return null; });
  }
  function session() {
    var s = lireSession();
    if (!s || !s.access_token) return Promise.resolve(null);
    if (s.expires_at && s.expires_at * 1000 - Date.now() < 60000) return rafraichir(s);
    return Promise.resolve(s);
  }
  function obtenirCle() {
    var cache = null;
    try { cache = sessionStorage.getItem('cle:' + FORMATION); } catch (e) {}
    if (cache) return Promise.resolve(cache);
    return session().then(function (s) {
      if (!s) return { raison: 'deconnectee' };
      return fetch(SB_URL + '/rest/v1/cles_formation?select=cle&formation=eq.' + encodeURIComponent(FORMATION), {
        headers: { 'apikey': SB_CLE, 'Authorization': 'Bearer ' + s.access_token }
      }).then(function (r) { return r.ok ? r.json() : []; }).then(function (l) {
        if (!l || !l.length) return { raison: 'sans-acces' };
        try { sessionStorage.setItem('cle:' + FORMATION, l[0].cle); } catch (e) {}
        return l[0].cle;
      });
    });
  }
  var cleCrypto = null;
  function importer(cle) { return crypto.subtle.importKey('raw', b64(cle), 'AES-GCM', false, ['decrypt']); }
  function dechiffrer(octets) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: octets.slice(0, 12) }, cleCrypto, octets.slice(12));
  }
  function texte(buf) { return new TextDecoder('utf-8').decode(buf); }

  function refus(raison) {
    try { sessionStorage.removeItem('cle:' + FORMATION); } catch (e) {}
    var connectee = raison === 'sans-acces';
    document.body.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f7f1ea;font-family:Inter,Arial,sans-serif;">' +
      '<div style="max-width:480px;background:#fffbf8;border:1px solid #e3d5c8;border-radius:22px;padding:36px 28px;text-align:center;color:#2c221e;">' +
      '<div style="font-size:42px;margin-bottom:8px;">🔒</div>' +
      '<h1 style="font-family:Fraunces,Georgia,serif;font-size:1.5rem;margin:0 0 12px;">Contenu réservé aux étudiantes</h1>' +
      '<p style="color:#5a4a42;line-height:1.6;margin:0 0 22px;">' +
      (connectee
        ? 'Ton compte n\'a pas encore accès à ' + NOMS[FORMATION] + '. Si tu viens de t\'inscrire, ton accès sera ouvert sous 24 à 48 heures après la vérification de ton dossier.'
        : 'Cette page fait partie de ' + NOMS[FORMATION] + '. Connecte-toi à ton compte pour continuer ta formation.') +
      '</p>' +
      '<a href="' + SITE + '#compte" style="display:inline-block;background:#a85743;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:50px;margin:4px;">' + (connectee ? 'Mon compte' : 'Me connecter') + '</a>' +
      '<a href="' + SITE + '#formations" style="display:inline-block;color:#a85743;text-decoration:none;font-weight:700;padding:12px 22px;border:1px solid #a85743;border-radius:50px;margin:4px;">Voir les formations</a>' +
      '</div></div>';
  }

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
          return new Promise(function (ok) {
            nouveau.src = src; nouveau.onload = ok; nouveau.onerror = ok;
            ancien.parentNode.replaceChild(nouveau, ancien);
          });
        }
        nouveau.text = ancien.text; ancien.parentNode.replaceChild(nouveau, ancien);
      });
    }, Promise.resolve());
  }

  // Documents protégés (PDF, Excel) : déchiffrés au clic
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-protege]');
    if (!a || !cleCrypto) return;
    e.preventDefault();
    var nom = a.getAttribute('data-nom') || 'document';
    fetch(a.getAttribute('href')).then(function (r) { return r.arrayBuffer(); })
      .then(function (buf) { return dechiffrer(new Uint8Array(buf)); })
      .then(function (clair) {
        var url = URL.createObjectURL(new Blob([clair], { type: a.getAttribute('data-protege') }));
        var lien = document.createElement('a');
        lien.href = url;
        lien.download = nom;
        document.body.appendChild(lien); lien.click(); lien.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      }).catch(function () { alert("Le document n'a pas pu être ouvert. Réessaie dans un instant."); });
  });

  obtenirCle().then(function (cle) {
    if (typeof cle !== 'string') return refus(cle.raison);
    return importer(cle).then(function (k) {
      cleCrypto = k;
      return dechiffrer(b64(bloc.textContent.trim()));
    }).then(function (buf) {
      document.body.innerHTML = texte(buf);
      if (location.hash) { var c = document.getElementById(location.hash.slice(1)); if (c) c.scrollIntoView(); }
      return executerScripts();
    }).catch(function () {
      try { sessionStorage.removeItem('cle:' + FORMATION); } catch (e) {}
      refus('deconnectee');
    });
  }).catch(function () { refus('deconnectee'); });
})();
