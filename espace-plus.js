/* Académie Sérénaissance — compte étudiante (français et anglais)
   1) Entente de formation et code d'éthique : à signer avant d'ouvrir les cours
   2) Questionnaire de fin de formation (+ témoignage avec permission de publier)
   3) Mes évaluations : mises en situation corrigées, validation de Sabrina, entente signée
   SereEspacePlus.cours({ sb, etat })  → appelée à chaque affichage de « Mes cours »
   SereEspacePlus.evaluations({ sb, etat }) → remplit la vue « Mes évaluations » */
(function () {
  'use strict';
  var EN = (document.documentElement.lang || 'fr').slice(0, 2) === 'en';
  function L(fr, en) { return EN ? en : fr; }
  function $(id) { return document.getElementById(id); }
  function esc(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
  function jour(d) { return d ? new Date(d).toLocaleDateString(EN ? 'en-CA' : 'fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; }
  function heure(d) { return d ? new Date(d).toLocaleTimeString(EN ? 'en-CA' : 'fr-CA', { hour: '2-digit', minute: '2-digit' }) : ''; }
  var NOMS = { '4e-trimestre': L('Accompagnement de pointe du 4ᵉ trimestre', 'Advanced Fourth Trimester and Deep Postpartum Support'),
               'marraine': L('Formation de marraine d\'allaitement', 'Breastfeeding Peer Supporter course') };
  var VERSION = { '4e-trimestre': 'entente-4e-v1', 'marraine': 'entente-marraine-v1' };
  function version(f) { return VERSION[f] + (EN ? '-en' : ''); }

  function css() {
    if ($('style-espace-plus')) return;
    var s = document.createElement('style'); s.id = 'style-espace-plus';
    s.textContent =
      '.ep-carte{background:#fff;border:2px solid var(--terra,#a85743);border-radius:18px;padding:22px;margin:0 0 16px}' +
      '.ep-carte h3{margin:0 0 8px;font-size:1.1rem}.ep-carte p{font-size:.92rem;line-height:1.6;margin:0 0 10px}' +
      '.ep-texte{white-space:pre-wrap;font-size:.86rem;line-height:1.6;max-height:340px;overflow-y:auto;background:#fbf7f2;border:1px solid var(--bord,#e3d5c8);border-radius:12px;padding:14px 16px;margin:6px 0 14px}' +
      '.ep-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px}' +
      '.ep-signee{font-size:.84rem;color:var(--doux,#7a685e);margin:-4px 0 12px}.ep-signee a,.ep-lien{color:var(--terra,#a85743);font-weight:700;cursor:pointer;text-decoration:underline;background:none;border:0;font:inherit;font-size:inherit;padding:0}' +
      '.ep-q{margin:14px 0 6px;font-weight:600;font-size:.94rem}.ep-etoiles{display:flex;gap:4px;flex-wrap:wrap}' +
      '.ep-etoiles label{cursor:pointer;font-size:1.6rem;line-height:1;color:#d9cbbd;user-select:none}.ep-etoiles input{position:absolute;opacity:0;width:1px;height:1px}' +
      '.ep-etoiles label.on{color:#e0a43c}.ep-etoiles input:focus-visible+span{outline:2px solid var(--terra,#a85743);border-radius:4px}' +
      '.ep-choix{display:flex;flex-wrap:wrap;gap:8px}.ep-choix label{display:flex;gap:6px;align-items:center;border:1px solid var(--bord,#e3d5c8);border-radius:50px;padding:7px 14px;font-size:.88rem;cursor:pointer;background:#fff}' +
      '.ep-choix input{width:auto;margin:0}.ep-carte textarea{width:100%;box-sizing:border-box;min-height:90px}' +
      '.ev-liste{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px}' +
      '.ev-liste li{background:#fff;border:1px solid var(--bord,#e3d5c8);border-radius:16px;padding:16px 18px}' +
      '.ev-haut{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start}.ev-haut h3{font-size:1rem;margin:0 0 2px}' +
      '.ev-haut small{display:block;color:var(--doux,#7a685e);font-size:.78rem}' +
      '.ev-statut{font-size:.76rem;font-weight:800;border-radius:50px;padding:4px 10px;white-space:nowrap}' +
      '.ev-statut.a_valider{background:#fff4e0;color:#7a5a20}.ev-statut.validee{background:#eef5ec;color:#3f7a57}.ev-statut.a_reprendre{background:#fbeeea;color:#8c4434}.ev-statut.formatif{background:#f3ede6;color:#6b5d55}' +
      '.ev-note{font-size:.88rem;margin-top:8px}.ev-com{font-size:.88rem;background:#fbf7f2;border-left:3px solid var(--terra,#a85743);border-radius:8px;padding:8px 12px;margin-top:8px;white-space:pre-wrap}' +
      '.ev-detail{margin-top:8px;font-size:.86rem}.ev-detail summary{cursor:pointer;color:var(--terra,#a85743);font-weight:700}' +
      '.ev-detail .r{white-space:pre-wrap;background:#fbf7f2;border-radius:8px;padding:8px 10px;margin:4px 0 8px}.ev-detail .ok{color:#3f7a57}.ev-detail .ko{color:#a5482f}';
    document.head.appendChild(s);
  }

  /* ---------- données en cache ---------- */
  var cache = { ententes: null, questionnaires: null, textes: {} };
  function chargerEntentes(sb) {
    if (cache.ententes) return Promise.resolve(cache.ententes);
    return sb.from('ententes').select('*').order('signee_le', { ascending: false }).then(function (r) { cache.ententes = (r && r.data) || []; return cache.ententes; });
  }
  function chargerQuestionnaires(sb) {
    if (cache.questionnaires) return Promise.resolve(cache.questionnaires);
    return sb.from('questionnaires_fin').select('formation,created_at').then(function (r) { cache.questionnaires = (r && r.data) || []; return cache.questionnaires; });
  }
  function texte(sb, v) {
    if (cache.textes[v]) return Promise.resolve(cache.textes[v]);
    return sb.from('textes_consentement').select('texte').eq('version', v).maybeSingle().then(function (r) {
      var t = r && r.data && r.data.texte; if (t) cache.textes[v] = t; return t || '';
    });
  }
  function imprimer(titre, corps) {
    var w = window.open('', '_blank'); if (!w) return;
    w.document.write('<!DOCTYPE html><html lang="' + (EN ? 'en' : 'fr') + '"><head><meta charset="UTF-8"><title>' + esc(titre) + '</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:30px auto;padding:0 20px;color:#2c221e;line-height:1.55;font-size:13px}pre{white-space:pre-wrap;font-family:inherit}.sig{margin-top:24px;border-top:2px solid #a85743;padding-top:12px}</style></head><body><img src="/logo.png" alt="" style="width:130px"><pre>' + esc(corps.texte) + '</pre>' +
      (corps.signature ? '<div class="sig">' + corps.signature + '</div>' : '') + '<script>setTimeout(function(){print()},400)<\/script></body></html>');
    w.document.close();
  }

  /* ---------- 1) Entente ---------- */
  function carteEntente(o, f, bloc, liste) {
    var sb = o.sb, d = o.etat.dossier || {};
    var c = document.createElement('div'); c.className = 'ep-carte'; c.id = 'entente-' + f;
    c.innerHTML = '<h3>📜 ' + L('Avant de commencer : ton entente de formation', 'Before you start: your training agreement') + '</h3>' +
      '<p>' + L('Pour ouvrir « ' + esc(NOMS[f]) + ' », lis et signe ton entente de formation. Elle explique ce que l\'Académie s\'engage à t\'offrir, comment tu es évaluée, tes droits (annulation, remboursement, renseignements personnels, plaintes) et le code d\'éthique de l\'étudiante.',
        'To open "' + esc(NOMS[f]) + '", read and sign your training agreement. It explains what the Academy commits to provide, how you are assessed, your rights (cancellation, refund, personal information, complaints) and the student code of ethics.') + '</p>' +
      '<div class="ep-texte" tabindex="0">' + L('Chargement…', 'Loading…') + '</div>' +
      '<label class="case"><input type="checkbox" class="ep-lu"> <span>' + L('J\'ai lu et compris l\'entente, y compris le code d\'éthique, et je l\'accepte.', 'I have read and understood the agreement, including the code of ethics, and I accept it.') + '</span></label>' +
      '<label style="display:block;margin-top:10px;font-size:.9rem;font-weight:600;">' + L('Ta signature : écris ton prénom et ton nom', 'Your signature: type your first and last name') +
      '<input type="text" class="ep-nom" maxlength="120" autocomplete="name" style="margin-top:6px;" value="' + esc(((d.prenom || '') + ' ' + (d.nom || '')).trim()) + '"></label>' +
      '<div class="ep-actions"><button type="button" class="btn ep-signer">✍️ ' + L('Je signe l\'entente', 'I sign the agreement') + '</button>' +
      '<button type="button" class="ep-lien ep-imprimer">🖨️ ' + L('Imprimer', 'Print') + '</button></div><div class="ep-msg"></div>';
    bloc.insertBefore(c, liste);
    liste.hidden = true;
    var v = version(f);
    texte(sb, v).then(function (t) { c.querySelector('.ep-texte').textContent = t || L('Le texte n\'a pas pu être chargé. Rafraîchis la page.', 'The text could not be loaded. Refresh the page.'); });
    c.querySelector('.ep-imprimer').addEventListener('click', function () { texte(sb, v).then(function (t) { imprimer(NOMS[f], { texte: t }); }); });
    c.querySelector('.ep-signer').addEventListener('click', function () {
      var msg = c.querySelector('.ep-msg'), nom = c.querySelector('.ep-nom').value.trim().replace(/\s+/g, ' ');
      if (!c.querySelector('.ep-lu').checked) { msg.innerHTML = '<div class="message erreur">' + L('Coche la case pour confirmer que tu as lu l\'entente.', 'Tick the box to confirm you have read the agreement.') + '</div>'; return; }
      if (nom.length < 4 || nom.indexOf(' ') < 0) { msg.innerHTML = '<div class="message erreur">' + L('Écris ton prénom et ton nom au complet.', 'Type your full first and last name.') + '</div>'; return; }
      var b = this; b.disabled = true;
      sb.rpc('signer_entente', { p_version: v, p_nom: nom, p_appareil: (navigator.userAgent || '').slice(0, 200) }).then(function (r) {
        b.disabled = false;
        if (r.error) { msg.innerHTML = '<div class="message erreur">' + esc(r.error.message) + '</div>'; return; }
        cache.ententes = null;
        try { sessionStorage.removeItem('cle:' + f); } catch (e) {}
        c.remove(); liste.hidden = false; cours(o);
        var ok = document.createElement('div'); ok.className = 'message ok';
        ok.innerHTML = '✅ ' + L('Entente signée. Une copie vient de t\'être envoyée par courriel. Bonne formation ! 🌸', 'Agreement signed. A copy has just been sent to you by email. Enjoy your course! 🌸');
        bloc.insertBefore(ok, bloc.children[1] || null);
      });
    });
  }
  function ligneSignee(e, bloc, liste) {
    if (bloc.querySelector('.ep-signee')) return;
    var p = document.createElement('p'); p.className = 'ep-signee';
    p.innerHTML = '📜 ' + L('Entente signée le ', 'Agreement signed on ') + esc(jour(e.signee_le)) + ' · ' + L('copie envoyée par courriel', 'copy sent by email');
    bloc.insertBefore(p, liste);
  }

  /* ---------- 2) Questionnaire de fin ---------- */
  function etoiles(nom) {
    var h = '<div class="ep-etoiles" role="radiogroup">';
    for (var i = 1; i <= 5; i++) h += '<label title="' + i + '/5"><input type="radio" name="' + nom + '" value="' + i + '"><span aria-hidden="true">★</span><span class="sr" style="position:absolute;left:-9999px">' + i + '/5</span></label>';
    return h + '</div>';
  }
  function choix(nom, opts) {
    return '<div class="ep-choix">' + opts.map(function (o) { return '<label><input type="radio" name="' + nom + '" value="' + o[0] + '"> ' + o[1] + '</label>'; }).join('') + '</div>';
  }
  function carteQuestionnaire(o, f, bloc) {
    var sb = o.sb, d = o.etat.dossier || {};
    var c = document.createElement('div'); c.className = 'ep-carte'; c.id = 'questionnaire-' + f;
    var p = 'q' + f.replace(/\W/g, '');
    var initiale = (d.nom || '').trim().charAt(0);
    c.innerHTML = '<h3>🎓 ' + L('Félicitations ! Ton avis sur la formation', 'Congratulations! Your feedback on the course') + '</h3>' +
      '<p>' + L('Ce court questionnaire (3 minutes) aide Sabrina à améliorer la formation. Tes réponses restent confidentielles ; seul le témoignage peut être publié, et seulement si tu le permets.', 'This short survey (3 minutes) helps Sabrina improve the course. Your answers stay confidential; only the testimonial may be published, and only if you allow it.') + '</p>' +
      '<form class="ep-form">' +
      '<div class="ep-q">' + L('Ta note globale pour la formation', 'Your overall rating of the course') + '</div>' + etoiles(p + 'globale') +
      '<div class="ep-q">' + L('Le contenu était clair et bien organisé', 'The content was clear and well organized') + '</div>' + etoiles(p + 'clarte') +
      '<div class="ep-q">' + L('Le contenu est utile pour ma pratique', 'The content is useful for my practice') + '</div>' + etoiles(p + 'utilite') +
      '<div class="ep-q">' + L('Les évaluations (quiz, examens, mises en situation) étaient justes', 'The assessments (quizzes, exams, case scenarios) were fair') + '</div>' + etoiles(p + 'evaluations') +
      '<div class="ep-q">' + L('Le soutien et les réponses de la formatrice', 'The instructor\'s support and answers') + '</div>' + etoiles(p + 'soutien') +
      '<div class="ep-q">' + L('La plateforme (site, appli) est facile à utiliser', 'The platform (website, app) is easy to use') + '</div>' + etoiles(p + 'plateforme') +
      '<div class="ep-q">' + L('As-tu atteint les objectifs de la formation ?', 'Did you reach the course objectives?') + '</div>' + choix(p + 'objectifs', [['oui', L('Oui', 'Yes')], ['partie', L('En partie', 'Partly')], ['non', L('Non', 'No')]]) +
      '<div class="ep-q">' + L('Combien d\'heures environ y as-tu consacrées ?', 'About how many hours did you spend on it?') + '</div><input type="number" class="ep-heures" min="1" max="300" step="1" style="max-width:140px;">' +
      '<div class="ep-q">' + L('Recommanderais-tu cette formation ?', 'Would you recommend this course?') + '</div>' + choix(p + 'recommande', [['oui', L('Oui', 'Yes')], ['non', L('Non', 'No')]]) +
      '<div class="ep-q">' + L('Ce que tu as le plus aimé', 'What you liked most') + '</div><textarea class="ep-aime" maxlength="1500"></textarea>' +
      '<div class="ep-q">' + L('Ce qui pourrait être amélioré', 'What could be improved') + '</div><textarea class="ep-ameliorer" maxlength="1500"></textarea>' +
      '<div class="ep-q">💬 ' + L('Ton témoignage (facultatif)', 'Your testimonial (optional)') + '</div>' +
      '<p class="note" style="margin:0 0 6px;">' + L('Quelques phrases sur ton expérience, pour les futures étudiantes.', 'A few sentences about your experience, for future students.') + '</p>' +
      '<textarea class="ep-temoignage" maxlength="1500"></textarea>' +
      '<label class="case" style="margin-top:10px;"><input type="checkbox" class="ep-permission"> <span>' + L('J\'autorise l\'Académie Sérénaissance à publier mon témoignage sur son site Web (et sa traduction anglaise), sans contrepartie. Je peux retirer cette permission en tout temps dans mon compte ; il est alors retiré du site.', 'I allow Académie Sérénaissance to publish my testimonial on its website (and its French or English translation), without compensation. I can withdraw this permission at any time in my account; it is then removed from the website.') + '</span></label>' +
      '<div class="ep-q">' + L('Nom affiché avec ton témoignage', 'Name shown with your testimonial') + '</div>' +
      choix(p + 'affichage', [['initiale', esc((d.prenom || L('Prénom', 'First name')) + (initiale ? ' ' + initiale + '.' : ''))], ['prenom', esc(d.prenom || L('Prénom seulement', 'First name only'))], ['anonyme', L('Anonyme (« Une étudiante »)', 'Anonymous ("A student")')]]) +
      '<div class="ep-actions"><button type="submit" class="btn">' + L('Envoyer mon questionnaire', 'Submit my survey') + '</button></div><div class="ep-msg"></div></form>';
    bloc.appendChild(c);
    c.querySelector('[name="' + p + 'affichage"][value="initiale"]').checked = true;
    c.querySelectorAll('.ep-etoiles').forEach(function (g) {
      g.addEventListener('change', function () { var v = +(g.querySelector('input:checked') || {}).value || 0; g.querySelectorAll('label').forEach(function (l, i) { l.classList.toggle('on', i < v); }); });
    });
    c.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = c.querySelector('.ep-msg');
      function val(n) { var x = c.querySelector('[name="' + p + n + '"]:checked'); return x ? x.value : null; }
      var rep = { globale: val('globale'), clarte: val('clarte'), utilite: val('utilite'), evaluations: val('evaluations'), soutien: val('soutien'), plateforme: val('plateforme'),
        objectifs: val('objectifs'), recommande: val('recommande'), heures: c.querySelector('.ep-heures').value || null,
        aime: c.querySelector('.ep-aime').value.trim().slice(0, 1500), ameliorer: c.querySelector('.ep-ameliorer').value.trim().slice(0, 1500) };
      if (!rep.globale) { msg.innerHTML = '<div class="message erreur">' + L('Donne au moins ta note globale (les étoiles du haut).', 'Please give at least your overall rating (the top stars).') + '</div>'; return; }
      var t = c.querySelector('.ep-temoignage').value.trim(), perm = c.querySelector('.ep-permission').checked, aff = val('affichage');
      if (t && t.length < 20) { msg.innerHTML = '<div class="message erreur">' + L('Ton témoignage est très court : écris au moins une phrase complète, ou laisse-le vide.', 'Your testimonial is very short: write at least one full sentence, or leave it empty.') + '</div>'; return; }
      var nom = aff === 'anonyme' ? L('Une étudiante', 'A student') : aff === 'prenom' ? (d.prenom || '') : ((d.prenom || '') + (initiale ? ' ' + initiale + '.' : ''));
      var b = c.querySelector('button[type=submit]'); b.disabled = true;
      sb.rpc('soumettre_questionnaire_fin', { p_formation: f, p_reponses: rep, p_commentaires: [rep.aime, rep.ameliorer].filter(Boolean).join('\n\n'), p_temoignage: t || null, p_permission: perm, p_nom_affiche: nom, p_langue: EN ? 'en' : 'fr' }).then(function (r) {
        b.disabled = false;
        if (r.error) { msg.innerHTML = '<div class="message erreur">' + esc(r.error.message) + '</div>'; return; }
        cache.questionnaires = null;
        c.innerHTML = '<h3>💕 ' + L('Merci du fond du cœur !', 'Thank you so much!') + '</h3><p>' + L('Ton questionnaire est bien reçu. Sabrina le lit personnellement.', 'Your survey has been received. Sabrina reads every one personally.') +
          (t ? ' ' + (perm ? L('Ton témoignage sera publié après sa relecture. Tu peux retirer ta permission en tout temps dans « Mes évaluations ».', 'Your testimonial will be published after she reviews it. You can withdraw your permission at any time in "My evaluations".')
                           : L('Ton témoignage restera privé, puisque tu n\'as pas donné la permission de le publier.', 'Your testimonial will stay private, since you did not give permission to publish it.')) : '') + '</p>';
      });
    });
  }

  /* ---------- appelée à chaque affichage de « Mes cours » ---------- */
  function reussi(etat, cle) { try { var r = JSON.parse(etat.progression[cle]); return !!(r && r.score / r.total >= 0.8); } catch (e) { return false; } }
  function cours(o) {
    css();
    var sb = o.sb, etat = o.etat;
    var formations = [];
    if (etat.valide) formations.push({ f: '4e-trimestre', bloc: $('bloc-4e'), liste: $('liste-4e'), fini: reussi(etat, 'final:score') });
    if (etat.marraine) formations.push({ f: 'marraine', bloc: $('bloc-marraine'), liste: $('liste-marraine'), fini: reussi(etat, 'marraine:score:exam') });
    if (!formations.length) return;
    Promise.all([chargerEntentes(sb), chargerQuestionnaires(sb)]).then(function (x) {
      var ententes = x[0], qs = x[1];
      formations.forEach(function (F) {
        if (!F.bloc || !F.liste) return;
        var e = ententes.filter(function (y) { return y.formation === F.f; })[0];
        if (!e) { if (!$('entente-' + F.f)) carteEntente(o, F.f, F.bloc, F.liste); return; }
        F.liste.hidden = false; ligneSignee(e, F.bloc, F.liste);
        var fait = qs.some(function (y) { return y.formation === F.f; });
        if (F.fini && !fait && !$('questionnaire-' + F.f)) carteQuestionnaire(o, F.f, F.bloc);
      });
    });
  }

  /* ---------- 3) Mes évaluations ---------- */
  var STATUTS = { a_valider: L('En attente de Sabrina', 'Waiting for Sabrina'), validee: L('Validée', 'Approved'), a_reprendre: L('À reprendre', 'To redo') };
  function evaluations(o) {
    css();
    var sb = o.sb, boite = $('ev-contenu'); if (!boite) return;
    boite.innerHTML = '<p class="note">' + L('Chargement…', 'Loading…') + '</p>';
    cache.ententes = null;
    Promise.all([
      sb.from('mises_en_situation').select('id,evaluation,type,titre,situation,reponses,score_auto,total,statut,score_final,commentaire,validee_le,created_at').order('created_at', { ascending: false }).limit(200),
      chargerEntentes(sb),
      sb.from('temoignages').select('id,texte,permission,publie,created_at').eq('source', 'questionnaire')
    ]).then(function (x) {
      var mes = (x[0] && x[0].data) || [], ententes = x[1] || [], tem = (x[2] && x[2].data) || [];
      var h = '';
      // Témoignage
      if (tem.length) {
        var t = tem[0];
        h += '<h2 style="font-size:1.15rem;margin:0 0 10px;">💬 ' + L('Mon témoignage', 'My testimonial') + '</h2><ul class="ev-liste" style="margin-bottom:22px;"><li><div class="ev-com" style="margin-top:0;">' + esc(t.texte) + '</div>' +
          '<p class="note" style="margin-top:8px;">' + (t.permission ? (t.publie ? L('✅ Publié sur le site.', '✅ Published on the website.') : L('⏳ Permission donnée ; en attente de publication.', '⏳ Permission given; waiting to be published.')) : L('🔒 Privé (pas de permission de publier).', '🔒 Private (no permission to publish).')) + '</p>' +
          (t.permission ? '<button type="button" class="btn fantome" style="padding:8px 16px;font-size:.84rem;margin-top:6px;" id="ep-retirer">' + L('Retirer ma permission de publier', 'Withdraw my permission to publish') + '</button>' : '') + '</li></ul>';
      }
      // Mises en situation
      h += '<h2 style="font-size:1.15rem;margin:0 0 10px;">🧩 ' + L('Mes mises en situation et études de cas', 'My case scenarios and case studies') + '</h2>';
      h += mes.length ? '<ul class="ev-liste">' + mes.map(function (m) {
        var statut = m.type === 'formatif' ? '<span class="ev-statut formatif">' + L('Exercice', 'Practice') + '</span>' : '<span class="ev-statut ' + m.statut + '">' + esc(STATUTS[m.statut] || m.statut) + '</span>';
        var note = m.total > 0 ? L('Correction automatique : ', 'Automatic marking: ') + m.score_auto + ' / ' + m.total : '';
        if (m.score_final != null) note += (note ? ' · ' : '') + '<strong>' + L('Note de Sabrina : ', 'Sabrina\'s mark: ') + m.score_final + ' / ' + m.total + '</strong>';
        var rep = (m.reponses || []).map(function (r) {
          return '<p style="margin:6px 0 2px;"><strong>' + esc(r.q) + '</strong></p><div class="r">' + esc(r.reponse) + '</div>' +
            ((r.criteres || []).length ? '<div>' + r.criteres.map(function (k) { return '<div class="' + (k.ok ? 'ok' : 'ko') + '">' + (k.ok ? '✓ ' : '✗ ') + esc(k.idee) + '</div>'; }).join('') + '</div>' : '');
        }).join('');
        return '<li><div class="ev-haut"><div><h3>' + esc(m.titre || m.evaluation) + '</h3><small>' + esc(m.evaluation) + ' · ' + esc(jour(m.created_at)) + '</small></div>' + statut + '</div>' +
          (note ? '<div class="ev-note">' + note + '</div>' : '') +
          (m.commentaire ? '<div class="ev-com"><strong>' + L('Commentaire de Sabrina', 'Sabrina\'s comment') + ' :</strong>\n' + esc(m.commentaire) + '</div>' : '') +
          (m.statut === 'a_reprendre' ? '<p class="note" style="margin-top:6px;">' + L('Relis le commentaire, puis repasse l\'examen du module : une nouvelle mise en situation te sera proposée.', 'Read the comment, then retake the module exam: a new case scenario will be given to you.') + '</p>' : '') +
          '<details class="ev-detail"><summary>' + L('Voir mes réponses', 'See my answers') + '</summary>' + rep + '</details></li>';
      }).join('') + '</ul>' : '<p class="note">' + L('Tes mises en situation apparaîtront ici après tes examens de module.', 'Your case scenarios will appear here after your module exams.') + '</p>';
      boite.innerHTML = h;
      var rt = $('ep-retirer');
      if (rt) rt.addEventListener('click', function () {
        if (!confirm(L('Retirer ta permission ? Ton témoignage sera retiré du site.', 'Withdraw your permission? Your testimonial will be removed from the website.'))) return;
        sb.rpc('retirer_permission_temoignage').then(function (r) { if (!r.error) evaluations(o); });
      });
    });
  }

  window.SereEspacePlus = { cours: cours, evaluations: evaluations };
})();
