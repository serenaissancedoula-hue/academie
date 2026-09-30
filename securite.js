/* Académie Sérénaissance — sécurité des sessions.
   - La session vit seulement dans l'onglet (ou l'appli) ouvert : fermer l'onglet ou quitter l'appli déconnecte.
   - Déconnexion automatique après une période sans activité (avertissement 60 s avant).
   Utilisation : SereSecurite.options() pour createClient ; SereSecurite.surveiller({ sb, minutes, avant, apres }) */
(function () {
  'use strict';
  var CLE = 'sb-zeptirfcwstufcpgvkzx-auth-token';
  var DERNIERE = 'sere-derniere-activite';

  // Ancien stockage permanent : on l'efface (les sessions ne doivent plus survivre à la fermeture)
  try { localStorage.removeItem(CLE); localStorage.removeItem(CLE + '-code-verifier'); } catch (e) {}

  function options() {
    return { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } };
  }
  function lire(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  function surveiller(o) {
    var delai = (o.minutes || 5) * 60000, minuterie = null, avert = null, bandeau = null, fini = false;
    function maintenant() { return Date.now(); }
    function derniere() { return +lire(DERNIERE) || maintenant(); }
    function sortir() {
      if (fini) return; fini = true;
      var suite = function () {
        try { sessionStorage.removeItem(CLE); } catch (e) {}
        location.href = (o.apres || '/espace.html') + '?deconnectee=1&inactivite=1';
      };
      Promise.resolve(o.avant ? o.avant() : null).catch(function () {}).then(function () {
        return o.sb && o.sb.auth ? o.sb.auth.signOut() : null;
      }).catch(function () {}).then(suite, suite);
    }
    function montrerAvertissement() {
      if (bandeau) return;
      bandeau = document.createElement('div');
      bandeau.setAttribute('role', 'alertdialog');
      bandeau.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;background:#2c221e;color:#fff;border-radius:16px;padding:14px 18px;box-shadow:0 10px 30px rgba(0,0,0,.25);font:500 .92rem/1.4 Arial,sans-serif;display:flex;gap:12px;align-items:center;max-width:92vw';
      var en = (document.documentElement.lang || '').slice(0, 2) === 'en';
      bandeau.innerHTML = '<span>' + (en ? '🔒 For your security, you will be logged out in one minute due to inactivity.' : '🔒 Par sécurité, tu seras déconnectée dans une minute faute d\'activité.') + '</span>';
      var b = document.createElement('button'); b.type = 'button'; b.textContent = en ? 'Stay logged in' : 'Rester connectée';
      b.style.cssText = 'background:#a85743;color:#fff;border:0;border-radius:50px;padding:9px 16px;font:700 .88rem Arial,sans-serif;cursor:pointer;white-space:nowrap';
      b.addEventListener('click', activite);
      bandeau.appendChild(b); document.body.appendChild(bandeau);
    }
    function planifier() {
      clearTimeout(minuterie); clearTimeout(avert);
      var reste = delai - (maintenant() - derniere());
      if (reste <= 0) return sortir();
      avert = setTimeout(montrerAvertissement, Math.max(0, reste - 60000));
      minuterie = setTimeout(verifier, reste);
    }
    function verifier() {
      // une vidéo en lecture (iframe active) compte comme de l'activité
      if (document.activeElement && document.activeElement.tagName === 'IFRAME' && document.visibilityState === 'visible') { activite(); return; }
      if (maintenant() - derniere() >= delai) sortir(); else planifier();
    }
    var dernierEcrit = 0;
    function activite() {
      if (fini) return;
      var t = maintenant();
      if (t - dernierEcrit > 5000) { ecrire(DERNIERE, String(t)); dernierEcrit = t; }
      if (bandeau) { bandeau.remove(); bandeau = null; }
      planifier();
    }
    // À l'ouverture : si la dernière activité date de trop longtemps (appli restée en arrière-plan), on déconnecte
    if (lire(DERNIERE) && maintenant() - derniere() >= delai) return sortir();
    ecrire(DERNIERE, String(maintenant()));
    ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel', 'mousemove'].forEach(function (ev) {
      window.addEventListener(ev, activite, { passive: true, capture: true });
    });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') verifier(); });
    window.addEventListener('focus', verifier);
    planifier();
    return { arreter: function () { fini = true; clearTimeout(minuterie); clearTimeout(avert); } };
  }

  window.SereSecurite = { options: options, surveiller: surveiller, CLE: CLE };
})();
