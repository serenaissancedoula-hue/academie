/* Académie Sérénaissance — courriels bilingues (français en premier, anglais en dessous) envoyés avec EmailJS.
   SereCourriel.html({ prenom, fr: {...}, en: {...}, desabonnement }) construit le courriel complet ;
   SereCourriel.envoyer({ courriel, sujet, prenom, fr, en, desabonnement }) l'envoie (modèle EmailJS « template_infolettre » = {{{html}}}).
   Courriel dans UNE seule langue (étudiantes) : { langue: 'en', en: {...} } ou { langue: 'fr', fr: {...} }.
   Chaque langue : { accroche, titre, message, details, etapes, bouton, lien, bouton2, lien2, image } (message : paragraphes séparés par une ligne vide). */
(function () {
  'use strict';
  var EJ = { service: 'service_82vfhfg', modele: 'template_infolettre', cle: 'HNvKdORRpRy_vT_FI' };
  var ADRESSE = 'Académie Sérénaissance · Sabrina Chavanel · 43 Tingley Cres., Campbellton (N.-B.) E3N 2S1 · Canada';
  var POLICE = "font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;";
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function paragraphes(t) {
    return String(t || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p style="margin:0 0 14px;">' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  function bouton(texte, lien, secondaire) {
    if (!texte || !lien) return '';
    var l = esc(lien);
    return '<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:' + (secondaire ? '12px' : '26px') + ' auto 6px;"><tr><td align="center" bgcolor="' + (secondaire ? '#ffffff' : '#a85743') + '" style="border-radius:50px;' + (secondaire ? 'border:2px solid #a85743;' : '') + '">' +
      '<a href="' + l + '" target="_blank" style="display:inline-block;padding:14px 30px;' + POLICE + 'font-size:15px;font-weight:700;color:' + (secondaire ? '#a85743' : '#ffffff') + ';text-decoration:none;border-radius:50px;">' + esc(texte) + '</a></td></tr></table>';
  }
  function lienSecours(lien, en) {
    if (!lien) return '';
    return '<p style="' + POLICE + 'font-size:12px;line-height:1.6;color:#7a685e;margin:4px 0 0;word-break:break-all;">' + (en ? 'If the button doesn’t work, copy this link into your browser:' : 'Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :') +
      '<br><a href="' + esc(lien) + '" style="color:#a85743;">' + esc(lien) + '</a></p>';
  }
  function bloc(c, en, prenom, etiquette) {
    if (!c) return '';
    return '<tr><td style="background-color:#fffbf8;border:1px solid #e3d5c8;border-radius:24px;padding:38px 32px;text-align:center;">' +
      (en && etiquette ? '<div style="' + POLICE + 'font-size:11px;letter-spacing:2px;color:#7a685e;margin:0 0 10px;">ENGLISH</div>' : '') +
      (c.accroche ? '<div style="font-family:\'Great Vibes\',\'Brush Script MT\',cursive;font-size:32px;line-height:1.2;color:#a85743;margin:0 0 6px;">' + esc(c.accroche) + '</div>' : '') +
      (c.titre ? '<h1 style="font-family:\'Playfair Display\',Georgia,\'Times New Roman\',serif;font-size:24px;line-height:1.3;font-weight:800;color:#2c221e;margin:0 0 18px;">' + esc(c.titre) + '</h1>' : '') +
      '<div style="width:50px;height:2px;background:#a85743;margin:0 auto 22px;">&nbsp;</div>' +
      (c.image ? '<img src="' + esc(c.image) + '" alt="" width="480" style="display:block;width:100%;max-width:480px;height:auto;border-radius:16px;margin:0 auto 18px;border:0;">' : '') +
      '<div style="' + POLICE + 'font-size:15px;line-height:1.7;color:#3d312b;text-align:left;">' +
        (prenom ? '<p style="margin:0 0 14px;">' + (en ? 'Hello ' : 'Bonjour ') + esc(prenom) + ',</p>' : '') +
        paragraphes(c.message) + paragraphes(c.details) + paragraphes(c.etapes) +
      '</div>' +
      bouton(c.bouton, c.lien) + bouton(c.bouton2, c.lien2, true) + lienSecours(c.lien, en) +
      '<p style="font-family:\'Playfair Display\',Georgia,serif;font-style:italic;font-size:16px;line-height:1.5;color:#a85743;margin:26px 0 4px;">' +
        (en ? '“Every family deserves to be supported with gentleness.”' : '« Chaque famille mérite d\'être accompagnée avec douceur. »') + '</p>' +
      '<p style="' + POLICE + 'font-size:14px;line-height:1.6;color:#3d312b;margin:10px 0 0;">' + (en ? 'Warmly,' : 'Avec douceur,') + '<br>' +
        '<span style="font-family:\'Great Vibes\',cursive;font-size:26px;color:#2c221e;">Sabrina</span><br>' +
        '<span style="font-size:12px;color:#7a685e;">' + (en ? 'Doula &amp; founder · Académie Sérénaissance' : 'Doula &amp; fondatrice · Académie Sérénaissance') + '</span></p>' +
      '</td></tr>';
  }
  function html(o) {
    var d = o.desabonnement, seul = o.langue === 'en' || o.langue === 'fr' ? o.langue : null;
    var corps = seul === 'en' ? bloc(o.en, true, o.prenom, false)
      : seul === 'fr' ? bloc(o.fr, false, o.prenom, false)
      : (o.en ? '<tr><td align="center" style="' + POLICE + 'font-size:12px;color:#7a685e;padding:0 0 12px;">🇬🇧 English version below · Version anglaise ci-dessous</td></tr>' : '') +
        bloc(o.fr, false, o.prenom, false) + (o.en ? '<tr><td style="height:22px;line-height:22px;font-size:0;">&nbsp;</td></tr>' + bloc(o.en, true, o.prenom, true) : '');
    var desa = !d ? '' : seul === 'en' ? '<br><br>You are receiving this email because you subscribed to the Académie Sérénaissance newsletter.<br><a href="' + esc(d.en) + '" style="color:#a85743;">Unsubscribe</a>'
      : seul === 'fr' ? '<br><br>Tu reçois ce courriel parce que tu t\'es inscrite à l\'infolettre de l\'Académie Sérénaissance.<br><a href="' + esc(d.fr) + '" style="color:#a85743;">Me désabonner</a>'
      : '<br><br>Tu reçois ce courriel parce que tu t\'es inscrite à l\'infolettre de l\'Académie Sérénaissance. · You are receiving this email because you subscribed to the Académie Sérénaissance newsletter.' +
        '<br><a href="' + esc(d.fr) + '" style="color:#a85743;">Me désabonner</a> · <a href="' + esc(d.en) + '" style="color:#a85743;">Unsubscribe</a>';
    return '<!DOCTYPE html><html lang="' + (seul === 'en' ? 'en' : 'fr') + '"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&family=Plus+Jakarta+Sans:wght@400;700&family=Great+Vibes&display=swap" rel="stylesheet"></head>' +
      '<body style="margin:0;padding:0;background-color:#f7f1ea;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f1ea;"><tr><td align="center" style="padding:30px 14px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">' +
      '<tr><td align="center" style="padding-bottom:20px;"><img src="https://academiesere.ca/logo.jpg" alt="Académie Sérénaissance" width="150" style="display:block;width:150px;max-width:150px;height:auto;border:0;"></td></tr>' +
      corps +
      '<tr><td align="center" style="padding:24px 10px 0;' + POLICE + 'font-size:12px;line-height:1.7;color:#7a685e;">' +
        '<span style="font-weight:700;color:#a85743;">Sérénaissance ♥ Campbellton</span><br>' +
        '<a href="https://academiesere.ca' + (seul === 'en' ? '/en/' : '') + '" style="color:#7a685e;">academiesere.ca</a> · 506-759-2044 · serenaissance.doula@gmail.com<br>' + esc(seul === 'en' ? ADRESSE.replace('(N.-B.)', 'NB') : ADRESSE) + desa +
      '</td></tr></table></td></tr></table></body></html>';
  }
  function envoyer(o) {
    if (!window.emailjs) return Promise.reject(new Error('EmailJS non chargé'));
    return window.emailjs.send(EJ.service, EJ.modele, { courriel: o.courriel, sujet: o.sujet, prenom: o.prenom || '', html: html(o) }, EJ.cle);
  }
  window.SereCourriel = { html: html, envoyer: envoyer, ADRESSE: ADRESSE };
})();
