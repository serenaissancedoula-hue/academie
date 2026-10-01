/* Académie Sérénaissance — réglages des notifications (appli Admin et comptes étudiantes).
   Reglages.monter(element, { sb, vapid, admin, surPush })
   Reglages.sonner()  → petit carillon au volume choisi (quand l'appli est ouverte) + vibration */
(function () {
  'use strict';
  var CLE = 'sere-reglages';
  var opts = null, racine = null, audio = null;
  var APPLI = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  function L(fr, en) { return EN ? en : fr; }
  var IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function lire() {
    var d = { son: true, vibration: true, volume: 70 };
    try { var x = JSON.parse(localStorage.getItem(CLE) || '{}'); for (var k in x) d[k] = x[k]; } catch (e) {}
    return d;
  }
  function ecrire(d) { try { localStorage.setItem(CLE, JSON.stringify(d)); } catch (e) {} }
  function cleVapid(b) {
    var p = '='.repeat((4 - b.length % 4) % 4), s = atob((b + p).replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }
  function q(sel) { return racine.querySelector(sel); }

  /* ---- Son dans l'appli (volume réglable) ---- */
  function sonner(forcer) {
    var d = lire();
    if (!forcer && !d.son) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      var vol = Math.max(0, Math.min(1, (d.volume || 0) / 100)) * 0.5, t = audio.currentTime;
      [[880, 0], [1318.5, 0.14]].forEach(function (n) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, t + n[1]);
        g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + n[1] + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + 0.5);
        o.connect(g); g.connect(audio.destination); o.start(t + n[1]); o.stop(t + n[1] + 0.55);
      });
    } catch (e) {}
    if (d.vibration && navigator.vibrate) try { navigator.vibrate([120, 60, 120]); } catch (e) {}
  }

  /* ---- Abonnement de cet appareil ---- */
  function abonnementActuel() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return Promise.resolve(null);
    return navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).catch(function () { return null; });
  }
  function enregistrer(ab) {
    var d = lire();
    return opts.sb.rpc('enregistrer_abonnement', { p_endpoint: ab.endpoint, p_abonnement: ab.toJSON(), p_appareil: navigator.userAgent, p_prefs: { son: !!d.son, vibration: !!d.vibration } });
  }

  function etat() {
    var e = q('.rg-etat'), act = q('.rg-activer'), reg = q('.rg-reglages'), off = q('.rg-desactiver');
    act.hidden = true; off.hidden = true; reg.hidden = false;
    var nom = opts.admin ? 'l\'appli Admin' : L('l\'appli de l\'Académie', 'the Académie app');
    if (IOS && !APPLI) {
      e.innerHTML = L('Sur iPhone et iPad, les notifications fonctionnent seulement dans <strong>' + nom + ' installée</strong> sur ton écran d\'accueil. Installe-la (voir plus bas), ouvre-la, puis reviens ici.',
        'On iPhone and iPad, notifications only work in <strong>' + nom + ' installed</strong> on your Home Screen. Install it (see below), open it, then come back here.');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { e.textContent = L('Cet appareil ou ce navigateur ne permet pas les notifications. Les réglages de son s\'appliquent quand l\'appli est ouverte.', 'This device or browser does not support notifications. Sound settings apply while the app is open.'); return; }
    if (Notification.permission === 'denied') { e.innerHTML = L('Les notifications sont <strong>bloquées</strong> pour cet appareil. Sur iPhone : Réglages → Notifications → ' + (opts.admin ? 'Admin Séré' : 'Académie') + ' → Autoriser. Sur Android ou ordinateur : réglages du site dans le navigateur.',
      'Notifications are <strong>blocked</strong> on this device. On iPhone: Settings → Notifications → Académie → Allow. On Android or a computer: the site settings in your browser.'); return; }
    abonnementActuel().then(function (ab) {
      if (ab && Notification.permission === 'granted') {
        e.innerHTML = opts.admin ? '✅ <strong>Activées sur cet appareil.</strong> Tu es avertie des inscriptions, documents de stage, examens, fiches de marraine et messages.'
          : L('✅ <strong>Activées sur cet appareil.</strong> Tu es avertie quand Sabrina t\'écrit.', '✅ <strong>On for this device.</strong> You are notified when Sabrina writes to you.');
        off.hidden = false; enregistrer(ab);
      } else {
        e.textContent = opts.admin
          ? 'Reçois une alerte à chaque inscription, document de stage, examen, fiche de marraine ou message.'
          : L('Reçois une alerte sur ton cellulaire quand Sabrina te répond.', 'Get an alert on your phone when Sabrina replies.');
        act.hidden = false;
      }
    });
  }

  function monter(el, o) {
    opts = o; racine = el;
    var d = lire();
    el.innerHTML =
      '<h3 style="margin-bottom:6px;">🔔 Notifications</h3>' +
      '<p class="rg-etat" style="font-size:.88rem;color:var(--doux,#7a685e);margin-bottom:10px;"></p>' +
      '<div class="rg-actions" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px;"><button type="button" class="btn rg-activer" hidden>' + L('Activer les notifications', 'Turn on notifications') + '</button></div>' +
      '<div class="rg-reglages" style="display:flex;flex-direction:column;gap:12px;margin-top:8px;">' +
        '<label class="rg-ligne"><span><strong>' + L('Son', 'Sound') + '</strong><small>' + L('Un petit carillon à chaque notification', 'A little chime with each notification') + '</small></span><input type="checkbox" class="rg-son" role="switch"' + (d.son ? ' checked' : '') + '></label>' +
        '<label class="rg-ligne"><span><strong>Vibration</strong><small>' + L('Quand le téléphone le permet', 'When the phone supports it') + '</small></span><input type="checkbox" class="rg-vib" role="switch"' + (d.vibration ? ' checked' : '') + '></label>' +
        '<label class="rg-ligne rg-vol"><span><strong>' + L('Volume dans l\'appli', 'In-app volume') + '</strong><small>' + L('Quand l\'appli est ouverte', 'While the app is open') + '</small></span><input type="range" class="rg-volume" min="0" max="100" step="5" value="' + (d.volume == null ? 70 : d.volume) + '"></label>' +
        '<p style="font-size:.78rem;color:var(--doux,#7a685e);">' + L('Appli fermée : le volume suit celui de ton téléphone. ', 'When the app is closed, the volume follows your phone. ') + (IOS ? L('Sur iPhone, tu peux aussi choisir le style d\'alerte dans Réglages → Notifications.', 'On iPhone, you can also choose the alert style in Settings → Notifications.') : '') + '</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;"><button type="button" class="btn gris rg-test">' + L('Essayer', 'Test') + '</button><button type="button" class="btn gris rg-desactiver" hidden>' + L('Désactiver sur cet appareil', 'Turn off on this device') + '</button></div>' +
      '</div>';
    // Carte repliable comme les autres sections (on clique sur « Notifications » pour la dérouler)
    if (window.SereRepliable && el.id) setTimeout(function () { SereRepliable.appliquer('#' + el.id); }, 0);
    if (!document.getElementById('rg-style')) {
      var st = document.createElement('style'); st.id = 'rg-style';
      st.textContent = '.rg-actions [hidden],.rg-reglages [hidden],.rg-reglages[hidden]{display:none!important}.rg-ligne{display:flex;align-items:center;justify-content:space-between;gap:14px;cursor:pointer}.rg-ligne span{display:flex;flex-direction:column;font-size:.92rem}.rg-ligne small{color:var(--doux,#7a685e);font-size:.78rem}' +
        '.rg-ligne input[type=checkbox]{appearance:none;-webkit-appearance:none;width:48px;height:28px;border-radius:50px;background:#d8cbbf;position:relative;cursor:pointer;flex-shrink:0;transition:background .2s;padding:0;border:0}' +
        '.rg-ligne input[type=checkbox]::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .2s}' +
        '.rg-ligne input[type=checkbox]:checked{background:var(--terra,#a85743)}.rg-ligne input[type=checkbox]:checked::after{left:23px}' +
        '.rg-ligne input[type=range]{width:45%;max-width:200px;accent-color:var(--terra,#a85743);padding:0;border:0;background:none}';
      document.head.appendChild(st);
    }
    function sauver(ch) {
      var x = lire(); for (var k in ch) x[k] = ch[k]; ecrire(x);
      abonnementActuel().then(function (ab) { if (ab && Notification.permission === 'granted') enregistrer(ab); });
    }
    q('.rg-son').addEventListener('change', function () { sauver({ son: this.checked }); if (this.checked) sonner(); });
    q('.rg-vib').addEventListener('change', function () { sauver({ vibration: this.checked }); if (this.checked && navigator.vibrate) navigator.vibrate(150); });
    q('.rg-volume').addEventListener('change', function () { sauver({ volume: +this.value }); sonner(true); });
    q('.rg-activer').addEventListener('click', function () {
      Notification.requestPermission().then(function (p) {
        if (p !== 'granted') { etat(); return; }
        return navigator.serviceWorker.ready.then(function (reg) {
          return reg.pushManager.getSubscription().then(function (ab) { return ab || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleVapid(opts.vapid) }); });
        }).then(enregistrer).then(function (r) {
          if (r && r.error) alert(L('Abonnement non enregistré : ', 'Subscription not saved: ') + r.error.message);
          etat();
        });
      }).catch(function (e) { alert(L('Impossible d\'activer : ', 'Could not turn on: ') + e.message); });
    });
    q('.rg-desactiver').addEventListener('click', function () {
      abonnementActuel().then(function (ab) {
        if (!ab) return etat();
        return opts.sb.rpc('retirer_abonnement', { p_endpoint: ab.endpoint }).then(function () { return ab.unsubscribe(); }).then(etat);
      });
    });
    q('.rg-test').addEventListener('click', function () {
      var x = lire();
      sonner();
      if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
        var icone = opts.admin ? '/icones/admin-192.png' : '/icones/icone-192.png', o = { body: L('Voici à quoi ressemblent tes notifications.', 'This is what your notifications look like.'), icon: icone, badge: icone, silent: !x.son };
        if (x.vibration) o.vibrate = [120, 60, 120];
        navigator.serviceWorker.ready.then(function (reg) { reg.showNotification('🌸 Test', o); });
      }
    });
    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (ev) {
      if (ev.data && ev.data.type === 'push') { if (document.visibilityState === 'visible') sonner(); if (opts.surPush) opts.surPush(ev.data.donnees || {}); }
    });
    etat();
  }

  window.Reglages = { monter: monter, sonner: sonner, lire: lire };
})();
