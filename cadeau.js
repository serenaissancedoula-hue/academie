/* Académie Sérénaissance — cartes-cadeaux.
   1) Encadré « Offrir une formation » (dans #offrir-cadeau) : formulaire, puis paiement Stripe.
      Sabrina vérifie le paiement et envoie la carte depuis son admin (le code part par courriel).
   2) SereCadeau.verifier(code) → Promise<{ok, formation}> pour l'inscription avec une carte-cadeau.
   L'encadré reste caché tant que les liens Stripe des cartes-cadeaux ne sont pas réglés dans l'admin. */
(function () {
  'use strict';
  var SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co', SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  function L(fr, en) { return EN ? en : fr; }
  function rpc(nom, args) {
    return fetch(SB_URL + '/rest/v1/rpc/' + nom, { method: 'POST', headers: { apikey: SB_CLE, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error((d && d.message) || 'Erreur'); return d; }); });
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function css() {
    if (document.getElementById('style-cadeau')) return;
    var s = document.createElement('style'); s.id = 'style-cadeau';
    s.textContent =
      '.cad-boite{max-width:1100px;margin:40px auto 0;background:linear-gradient(135deg,#f6e7df 0%,#fffbf8 100%);border:1px solid var(--border-color,#e3d5c8);border-radius:22px;padding:28px 24px;display:flex;gap:22px;align-items:center;flex-wrap:wrap}' +
      '.cad-boite .cad-ic{font-size:2.6rem}.cad-boite h3{font-family:"Playfair Display",Georgia,serif;font-size:1.4rem;margin:0 0 6px}.cad-boite p{margin:0;color:#5a4a42;line-height:1.6}' +
      '.cad-boite .cad-txt{flex:1;min-width:220px}' +
      '.cad-fond{position:fixed;inset:0;background:rgba(44,34,30,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}' +
      '.cad-modal{background:#fffbf8;border-radius:22px;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;padding:26px 22px;position:relative;font-family:"Plus Jakarta Sans",Arial,sans-serif;color:#2c221e}' +
      '.cad-modal h3{font-family:"Playfair Display",Georgia,serif;font-size:1.35rem;margin:0 0 6px}.cad-modal .cad-x{position:absolute;top:10px;right:14px;background:none;border:0;font-size:1.4rem;cursor:pointer;color:#7a685e}' +
      '.cad-modal form{display:flex;flex-direction:column;gap:10px;margin-top:12px}.cad-modal label{font-size:.85rem;font-weight:600;display:flex;flex-direction:column;gap:4px}' +
      '.cad-modal input,.cad-modal select,.cad-modal textarea{font:inherit;padding:10px 12px;border:1px solid #d9cbbd;border-radius:10px;background:#fff}' +
      '.cad-modal .cad-case{flex-direction:row;align-items:flex-start;gap:8px;font-weight:400;font-size:.82rem;line-height:1.5}' +
      '.cad-modal .cad-choix{display:flex;gap:14px;flex-wrap:wrap;font-weight:400}.cad-modal .cad-choix label{flex-direction:row;align-items:center;gap:6px;font-weight:400}' +
      '.cad-msg{font-size:.85rem;color:#a5482f}.cad-note{font-size:.78rem;color:#7a685e;line-height:1.5}';
    document.head.appendChild(s);
  }

  function ouvrir(liens) {
    css();
    var f = document.createElement('div'); f.className = 'cad-fond';
    f.innerHTML = '<div class="cad-modal" role="dialog" aria-modal="true" aria-labelledby="cad-titre">' +
      '<button type="button" class="cad-x" aria-label="' + L('Fermer', 'Close') + '">✕</button>' +
      '<h3 id="cad-titre">🎁 ' + L('Offrir une formation', 'Give a course as a gift') + '</h3>' +
      '<p class="cad-note">' + L('Après le paiement sécurisé avec Stripe, la carte-cadeau (avec son code) est envoyée par courriel, habituellement en moins de 24 heures. Elle n\'expire pas.', 'After the secure Stripe payment, the gift card (with its code) is sent by email, usually within 24 hours. It does not expire.') + '</p>' +
      '<form>' +
      '<label>' + L('Formation offerte', 'Course') + '<select name="formation">' +
        (liens.cadeau_4e ? '<option value="4e-trimestre">' + L('Accompagnement de pointe du 4ᵉ trimestre — 550 $', 'Advanced Fourth Trimester Support — $550') + '</option>' : '') +
        (liens.cadeau_marraine ? '<option value="marraine">' + L('Marraine d\'allaitement — 175 $', 'Breastfeeding Peer Supporter — $175') + '</option>' : '') +
      '</select></label>' +
      '<p class="cad-note" data-note4e>' + L('La formation du 4ᵉ trimestre s\'adresse aux doulas diplômées : le diplôme sera demandé à l\'inscription.', 'The fourth trimester course is for certified doulas: a diploma is requested at registration.') + '</p>' +
      '<label>' + L('Ton nom', 'Your name') + '<input name="anom" required maxlength="80" autocomplete="name"></label>' +
      '<label>' + L('Ton courriel', 'Your email') + '<input name="acourriel" type="email" required maxlength="120" autocomplete="email"></label>' +
      '<label>' + L('Nom de la personne qui reçoit le cadeau', 'Name of the person receiving the gift') + '<input name="dnom" required maxlength="80"></label>' +
      '<div class="cad-choix" role="radiogroup" aria-label="' + L('Envoi de la carte', 'Card delivery') + '"><label><input type="radio" name="envoi" value="destinataire" checked> ' + L('L\'envoyer directement à elle', 'Send it directly to her') + '</label><label><input type="radio" name="envoi" value="acheteur"> ' + L('Me l\'envoyer pour que je la remette', 'Send it to me to give in person') + '</label></div>' +
      '<label data-dcourriel>' + L('Son courriel', 'Her email') + '<input name="dcourriel" type="email" maxlength="120"></label>' +
      '<label>' + L('Petit mot (facultatif)', 'A short message (optional)') + '<textarea name="message" rows="2" maxlength="500"></textarea></label>' +
      '<label class="cad-case"><input type="checkbox" name="ok" required> <span>' + L('Je confirme avoir le droit de donner le courriel de cette personne : il sert seulement à lui envoyer la carte-cadeau. J\'accepte les <a href="#" data-cond>conditions de vente</a> (cartes-cadeaux).', 'I confirm I may share this person\'s email: it is used only to send the gift card. I accept the <a href="#" data-cond>terms of sale</a> (gift cards).') + '</span></label>' +
      '<div class="cad-msg" aria-live="polite"></div>' +
      '<button type="submit" class="btn-action" style="justify-content:center;width:100%;">' + L('Continuer vers le paiement →', 'Continue to payment →') + '</button>' +
      '</form></div>';
    document.body.appendChild(f);
    var form = f.querySelector('form'), msg = f.querySelector('.cad-msg');
    function fermer() { f.remove(); document.removeEventListener('keydown', echap); }
    function echap(e) { if (e.key === 'Escape') fermer(); }
    document.addEventListener('keydown', echap);
    f.addEventListener('click', function (e) { if (e.target === f || e.target.closest('.cad-x')) fermer(); });
    f.querySelector('[data-cond]').addEventListener('click', function (e) { e.preventDefault(); fermer(); if (window.switchPage) switchPage('conditions', null, null); });
    function maj() {
      var dest = form.envoi.value === 'destinataire';
      f.querySelector('[data-dcourriel]').style.display = dest ? '' : 'none';
      form.dcourriel.required = dest;
      f.querySelector('[data-note4e]').style.display = form.formation.value === '4e-trimestre' ? '' : 'none';
    }
    form.addEventListener('change', maj); maj();
    setTimeout(function () { form.anom.focus(); }, 50);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var b = form.querySelector('button[type=submit]'); b.disabled = true; msg.textContent = '';
      rpc('demander_carte_cadeau', {
        p_formation: form.formation.value, p_acheteur_nom: form.anom.value, p_acheteur_courriel: form.acourriel.value,
        p_destinataire_nom: form.dnom.value, p_destinataire_courriel: form.envoi.value === 'destinataire' ? form.dcourriel.value : null,
        p_message: form.message.value, p_envoyer_a: form.envoi.value, p_langue: EN ? 'en' : 'fr'
      }).then(function (id) {
        var lien = form.formation.value === 'marraine' ? liens.cadeau_marraine : liens.cadeau_4e;
        window.location.href = lien + (lien.indexOf('?') >= 0 ? '&' : '?') + 'client_reference_id=CC-' + encodeURIComponent(id);
      }).catch(function (err) { b.disabled = false; msg.textContent = err.message + ' ' + L('Réessaie, ou écris à serenaissance.doula@gmail.com.', 'Please try again, or write to serenaissance.doula@gmail.com.'); });
    });
  }

  function encadre(liens) {
    var zone = document.getElementById('offrir-cadeau');
    if (!zone || (!liens.cadeau_4e && !liens.cadeau_marraine)) return;
    css();
    zone.innerHTML = '<div class="cad-boite"><div class="cad-ic" aria-hidden="true">🎁</div><div class="cad-txt"><h3>' + L('Offrir une formation', 'Give a course as a gift') + '</h3>' +
      '<p>' + L('Pour une doula, une future marraine ou une amie qui a le cœur au post-partum : offre-lui une formation avec une carte-cadeau. Elle n\'expire pas.', 'For a doula, a future peer supporter or a friend who cares about postpartum: give her a course with a gift card. It does not expire.') + '</p></div>' +
      '<button type="button" class="btn-action">' + L('Offrir une carte-cadeau →', 'Give a gift card →') + '</button></div>';
    zone.hidden = false;
    zone.querySelector('button').addEventListener('click', function () { ouvrir(liens); });
  }

  window.SereCadeau = {
    verifier: function (code) { return rpc('verifier_carte_cadeau', { p_code: String(code || '').trim().toUpperCase() }); },
    utiliser: function (code, courriel) { return rpc('utiliser_carte_cadeau', { p_code: String(code || '').trim().toUpperCase(), p_courriel: courriel }); }
  };
  function demarrer() { rpc('liens_publics').then(encadre).catch(function () {}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
