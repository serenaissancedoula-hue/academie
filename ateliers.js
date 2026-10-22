/* Académie Sérénaissance — ateliers en direct (Zoom, Meet…).
   SereAteliers.admin({ sb, toast })            → carte « Ateliers en direct » de l'onglet Outils (admin)
   SereAteliers.chargerAdmin()                   → recharge la liste (admin)
   SereAteliers.etudiante({ sb, etat, en })      → section « Mes ateliers en direct » (appli étudiante)
   Les droits sont vérifiés par Supabase : une étudiante ne reçoit que les ateliers de ses formations. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
  function lienSur(u) { return /^https:\/\/[^\s<>"]+$/i.test(u || '') ? u : ''; }
  var AVANT = 15 * 60000; // le lien s'ouvre 15 minutes avant
  var CAMERA = {
    fr: 'Caméra ouverte obligatoire pendant tout l\'atelier, sauf exception accordée par la direction.',
    en: 'Camera on is required for the whole workshop, unless the school\'s direction grants an exception.'
  };

  var NOMS = {
    fr: { doula: 'Doula de base', '4e-trimestre': '4ᵉ trimestre', marraine: 'Marraine', toutes: 'Toutes les formations' },
    en: { doula: 'Foundational doula', '4e-trimestre': 'Fourth trimester', marraine: 'Peer supporter', toutes: 'All courses' }
  };
  function quand(d, en) {
    var t = new Date(d).toLocaleString(en ? 'en-CA' : 'fr-CA', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function fin(a) { return new Date(new Date(a.debut).getTime() + a.duree_min * 60000); }

  function css() {
    if ($('style-ateliers')) return;
    var s = document.createElement('style'); s.id = 'style-ateliers';
    s.textContent =
      '.at-item{border:1px solid var(--bord);border-radius:14px;padding:14px;margin-bottom:10px;background:#fff}' +
      '.at-item.passe{opacity:.75}' +
      '.at-quand{font-weight:700;color:var(--terra);font-size:.9rem}' +
      '.at-titre{font-weight:700;margin:4px 0 2px}' +
      '.at-detail{font-size:.84rem;color:var(--doux);white-space:pre-line}' +
      '.at-tag{display:inline-block;font-size:.72rem;font-weight:700;background:#f6e7df;color:#8c3f2c;border-radius:50px;padding:2px 9px;margin-right:6px}' +
      '.at-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}' +
      '.at-actions .btn{padding:9px 16px;font-size:.86rem}' +
      '.at-actions .btn[disabled]{opacity:.55;cursor:default}' +
      '.at-gris{background:#fff!important;color:var(--terra)!important;border:1.5px solid var(--terra)!important}' +
      '.at-direct{display:inline-block;font-size:.72rem;font-weight:700;background:#c0392b;color:#fff;border-radius:50px;padding:2px 9px;margin-left:6px}' +
      '.at-pres{display:flex;flex-direction:column;gap:6px;margin-top:10px;border-top:1px dashed var(--bord);padding-top:10px}' +
      '.at-pres label{display:flex;gap:8px;align-items:center;font-size:.88rem}' +
      '.at-pres input{width:auto}' +
      '.at-camera{background:#fbf3ee;border:1px solid #f0d5c8;border-radius:12px;padding:10px 12px;font-size:.84rem;color:#8c3f2c;margin:0 0 12px}' +
      '.at-camera-mini{font-size:.8rem;color:#8c3f2c;margin-top:8px}';
    document.head.appendChild(s);
  }

  /* ---------- Fichier calendrier (.ics) ---------- */
  function ics(a, en) {
    function f(d) { return new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
    function t(x) { return String(x || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
    var compte = 'https://academiesere.ca/' + (en ? 'en/' : '') + 'espace.html#ateliers';
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Academie Serenaissance//Ateliers//FR', 'BEGIN:VEVENT',
      'UID:atelier-' + a.id + '@academiesere.ca', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(a.debut), 'DTEND:' + f(fin(a)),
      'SUMMARY:' + t(a.titre), 'DESCRIPTION:' + t((a.description ? a.description + '\n\n' : '') + '📹 ' + CAMERA[en ? 'en' : 'fr'] + '\n\n' + (en ? 'Join from your account: ' : 'Le lien est dans ton compte : ') + compte),
      'URL:' + compte, 'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:' + t(a.titre), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  function telechargerIcs(a, en) {
    var b = new Blob([ics(a, en)], { type: 'text/calendar;charset=utf-8' });
    var u = URL.createObjectURL(b), l = document.createElement('a');
    l.href = u; l.download = 'atelier-' + a.id + '.ics'; document.body.appendChild(l); l.click();
    setTimeout(function () { URL.revokeObjectURL(u); l.remove(); }, 1000);
  }

  /* ================= Appli étudiante ================= */
  var E = { sb: null, en: false, uid: null, liste: [], pres: {}, noms: {}, formatrices: [], msgs: [], ouverte: null, minuterie: null, branche: false };

  function etudiante(o) {
    E.sb = o.sb; E.en = !!o.en; css();
    var bloc = $('bloc-ateliers'); if (!bloc) return;
    var s = o.etat && o.etat.session; if (!s) { bloc.hidden = true; return; }
    E.uid = s.user.id;
    var depuis = new Date(Date.now() - 30 * 86400000).toISOString();
    Promise.all([
      E.sb.from('ateliers').select('id,formation,titre,description,debut,duree_min,lien,formatrice_id').gte('debut', depuis).order('debut'),
      E.sb.from('presences_ateliers').select('atelier_id,statut,camera_fermee').eq('user_id', s.user.id),
      E.sb.rpc('noms_formatrices')
    ]).then(function (r) {
      E.liste = (r[0] && r[0].data) || [];
      E.pres = {}; ((r[1] && r[1].data) || []).forEach(function (p) { E.pres[p.atelier_id] = p; });
      E.noms = {}; ((r[2] && r[2].data) || []).forEach(function (f) { E.noms[f.id] = (f.prenom + ' ' + (f.nom || '')).trim(); });
      bloc.hidden = !E.liste.length;
      dessinerEtudiante();
      clearInterval(E.minuterie); E.minuterie = setInterval(function () { dessinerEtudiante(); chargerMessagesEtudiante(); }, 30000);
      if (location.hash === '#ateliers' && !bloc.hidden) setTimeout(function () { bloc.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
    }).catch(function () { bloc.hidden = true; });
    formatricesEtudiante();
  }

  function dessinerEtudiante() {
    var en = E.en, n = Date.now(), el = $('liste-ateliers'); if (!el) return;
    var avenir = E.liste.filter(function (a) { return fin(a).getTime() > n; });
    var passes = E.liste.filter(function (a) { return fin(a).getTime() <= n; }).reverse();
    function carte(a, passe) {
      var d = new Date(a.debut).getTime(), enCours = n >= d && n < fin(a).getTime(), ouvert = n >= d - AVANT && !passe;
      var lien = lienSur(a.lien), h = '', fo = a.formatrice_id && E.noms[a.formatrice_id];
      h += '<div class="at-item' + (passe ? ' passe' : '') + '">';
      h += '<div class="at-quand">' + esc(quand(a.debut, en)) + (enCours ? '<span class="at-direct">' + (en ? 'LIVE NOW' : 'EN COURS') + '</span>' : '') + '</div>';
      h += '<div class="at-titre">' + esc(a.titre) + '</div>';
      h += '<div><span class="at-tag">' + esc(NOMS[en ? 'en' : 'fr'][a.formation] || a.formation) + '</span><span class="at-detail">' + a.duree_min + ' min' + (fo ? (en ? ' · with ' : ' · avec ') + esc(fo) : '') + '</span></div>';
      if (a.description) h += '<div class="at-detail" style="margin-top:6px;">' + esc(a.description) + '</div>';
      if (passe) {
        var p = E.pres[a.id];
        if (p) {
          var t = p.statut === 'presente' ? (en ? '✓ Present' : '✓ Présente') : p.statut === 'retard' ? (en ? '⏰ Late' : '⏰ En retard') : (en ? '❌ Absent' : '❌ Absente');
          h += '<div class="at-detail" style="margin-top:6px;font-weight:700;color:' + (p.statut === 'presente' ? 'var(--vert)' : p.statut === 'retard' ? '#9a6a12' : '#c0392b') + ';">' + t +
            (p.camera_fermee ? (en ? ' · camera was off' : ' · caméra fermée') : '') + '</div>';
          if (p.statut !== 'presente' || p.camera_fermee) h += '<div class="at-detail">' + (en ? 'If this is a mistake, write to Sabrina in your Messages.' : 'Si c\'est une erreur, écris à Sabrina dans tes Messages.') + '</div>';
        }
      } else {
        h += '<div class="at-camera-mini">📹 ' + (en ? 'Camera on at all times' : 'Caméra ouverte en tout temps') + '</div>';
        h += '<div class="at-actions">';
        if (lien && ouvert) h += '<a class="btn" href="' + esc(lien) + '" target="_blank" rel="noopener">🎥 ' + (en ? 'Join the workshop' : 'Rejoindre l\'atelier') + '</a>';
        else if (lien) h += '<button class="btn" type="button" disabled>🔒 ' + (en ? 'Link opens 15 min before' : 'Le lien s\'ouvre 15 min avant') + '</button>';
        else h += '<button class="btn" type="button" disabled>' + (en ? 'Link coming soon' : 'Lien à venir') + '</button>';
        h += '<button class="btn at-gris" type="button" data-ics="' + a.id + '">📅 ' + (en ? 'Add to my calendar' : 'Ajouter à mon calendrier') + '</button>';
        h += '</div>';
      }
      return h + '</div>';
    }
    var html = avenir.length ? '<div class="at-camera">📹 <strong>' + (en ? 'Important:' : 'Important :') + '</strong> ' + CAMERA[en ? 'en' : 'fr'] + '</div>' : '';
    if (avenir.length) html += avenir.map(function (a) { return carte(a, false); }).join('');
    else html += '<p class="at-detail" style="margin-bottom:10px;">' + (en ? 'No upcoming workshop for now. You will get a notification as soon as one is scheduled.' : 'Aucun atelier à venir pour l\'instant. Tu recevras une notification dès qu\'un atelier est prévu.') + '</p>';
    if (passes.length) html += '<h3 style="margin:16px 0 8px;font-size:1rem;">' + (en ? 'Past workshops' : 'Ateliers passés') + '</h3>' + passes.map(function (a) { return carte(a, true); }).join('');
    el.innerHTML = html;
  }

  /* ---------- Mes formatrices (messages) ---------- */
  function formatricesEtudiante() {
    var bloc = $('bloc-formatrices'); if (!bloc) return;
    E.sb.rpc('mes_formatrices').then(function (r) {
      E.formatrices = (r && r.data) || [];
      bloc.hidden = !E.formatrices.length;
      if (!E.formatrices.length) return;
      brancherChat();
      chargerMessagesEtudiante().then(function () {
        if (location.hash === '#formatrices') setTimeout(function () { bloc.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (E.formatrices.length === 1) ouvrirChatEtudiante(E.formatrices[0].id); }, 300);
      });
    });
  }
  function chargerMessagesEtudiante() {
    if (!E.formatrices.length) return Promise.resolve();
    return E.sb.from('messages_formatrices').select('*').eq('etudiante', E.uid).order('created_at').then(function (r) {
      E.msgs = (r && r.data) || [];
      dessinerFormatricesEtudiante();
    });
  }
  function dessinerFormatricesEtudiante() {
    var en = E.en, el = $('liste-formatrices-etudiante'); if (!el) return;
    el.innerHTML = '<p class="at-detail" style="margin-bottom:10px;">' + (en ? 'Questions about a workshop or your course? Write to your trainers here. Sabrina can see these conversations.' : 'Une question sur un atelier ou ta formation ? Écris ici à tes formatrices. Sabrina peut consulter ces échanges.') + '</p>' +
      E.formatrices.map(function (f) {
        var mes = E.msgs.filter(function (m) { return m.formatrice_id === f.id; });
        var nonlus = mes.filter(function (m) { return m.de_formatrice && !m.lu; }).length, ouvert = E.ouverte === f.id;
        var h = '<div class="at-item"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">' +
          '<div><div class="at-titre" style="margin:0;">' + esc(f.prenom + ' ' + (f.nom || '')) + '</div><div>' + (f.formations || []).map(function (k) { return '<span class="at-tag">' + esc(NOMS[en ? 'en' : 'fr'][k] || k) + '</span>'; }).join('') + '</div></div>' +
          '<button class="btn' + (ouvert ? ' at-gris' : '') + '" type="button" data-chat-f="' + f.id + '" style="padding:9px 16px;font-size:.86rem;flex-shrink:0;">' + (ouvert ? (en ? 'Close' : 'Fermer') : '💬 ' + (en ? 'Write' : 'Écrire')) + (nonlus && !ouvert ? ' (' + nonlus + ')' : '') + '</button></div>';
        if (ouvert) {
          h += '<div class="at-pres" style="gap:8px;">' + (mes.length ? mes.map(function (m) {
            return '<div class="bulle ' + (m.de_formatrice ? 'elle' : 'moi') + '" style="max-width:88%;">' + esc(m.texte) + '<small>' + esc(new Date(m.created_at).toLocaleString(en ? 'en-CA' : 'fr-CA', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })) + '</small></div>';
          }).join('') : '<div class="at-detail">' + (en ? 'No message yet.' : 'Aucun message pour l\'instant.') + '</div>') +
          '<form data-envoi-f="' + f.id + '" style="flex-direction:row;gap:8px;align-items:flex-end;margin-top:6px;"><textarea rows="1" maxlength="4000" required placeholder="' + (en ? 'Your message…' : 'Ton message…') + '" style="border-radius:18px;"></textarea>' +
          '<button class="btn" type="submit" style="border-radius:50%;width:46px;height:46px;padding:0;flex-shrink:0;" aria-label="' + (en ? 'Send' : 'Envoyer') + '">➤</button></form></div>';
        }
        return h + '</div>';
      }).join('');
  }
  function ouvrirChatEtudiante(fid) {
    E.ouverte = fid; dessinerFormatricesEtudiante();
    if (E.msgs.some(function (m) { return m.formatrice_id === fid && m.de_formatrice && !m.lu; }))
      E.sb.rpc('marquer_lus_formatrice', { p_autre: String(fid) }).then(function () { E.msgs.forEach(function (m) { if (m.formatrice_id === fid && m.de_formatrice) m.lu = true; }); dessinerFormatricesEtudiante(); });
  }
  function brancherChat() {
    if (E.branche) return; E.branche = true;
    var el = $('liste-formatrices-etudiante'); if (!el) return;
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-chat-f]'); if (!b) return;
      var fid = +b.dataset.chatF;
      if (E.ouverte === fid) { E.ouverte = null; dessinerFormatricesEtudiante(); } else ouvrirChatEtudiante(fid);
    });
    el.addEventListener('submit', function (e) {
      var f = e.target.closest('[data-envoi-f]'); if (!f) return; e.preventDefault();
      var t = f.querySelector('textarea'), txt = t.value.trim(); if (!txt) return;
      var bt = f.querySelector('button'); bt.disabled = true;
      E.sb.rpc('ecrire_formatrice', { p_formatrice: +f.dataset.envoiF, p_texte: txt }).then(function (r) {
        bt.disabled = false;
        if (r.error) { alert((E.en ? 'Message not sent: ' : 'Message non envoyé : ') + r.error.message); return; }
        chargerMessagesEtudiante();
      });
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ics]'); if (!b) return;
    var a = E.liste.filter(function (x) { return String(x.id) === b.dataset.ics; })[0] || A.liste.filter(function (x) { return String(x.id) === b.dataset.ics; })[0];
    if (a) telechargerIcs(a, E.en);
  });

  /* ================= Admin ================= */
  var A = { sb: null, toast: function () {}, liste: [], etudiantes: [], formatrices: [], cr: {}, pres: {}, notes: {}, msgs: [], branche: false, edition: null };
  var FORMS = ['doula', '4e-trimestre', 'marraine'];

  function aAcces(lignes, f) {
    if (lignes.some(function (e) { return e.suspendu; })) return false;
    return lignes.some(function (e) {
      var st = (e.statut || '').trim().toLowerCase();
      if (f === 'doula') return e.formation === 'doula' && st === 'doula_valide';
      if (f === '4e-trimestre') return st === 'valide';
      if (f === 'marraine') return !!e.acces_marraine;
      return st === 'valide' || st === 'doula_valide' || !!e.acces_marraine;
    });
  }
  function inscrites(f) {
    var par = {};
    A.etudiantes.forEach(function (e) { if (e.user_id) (par[e.user_id] = par[e.user_id] || []).push(e); });
    return Object.keys(par).filter(function (u) { return aAcces(par[u], f); }).map(function (u) {
      var e = par[u][0]; return { user_id: u, nom: ((e.prenom || '') + ' ' + (e.nom || '')).trim() || e.courriel };
    }).sort(function (x, y) { return x.nom.localeCompare(y.nom, 'fr'); });
  }
  function nomEtudiante(u) {
    var e = A.etudiantes.filter(function (x) { return x.user_id === u; })[0];
    return e ? ((e.prenom || '') + ' ' + (e.nom || '')).trim() : 'Étudiante';
  }
  function nomFormatrice(id) {
    var f = A.formatrices.filter(function (x) { return x.id === id; })[0];
    return f ? (f.prenom + ' ' + (f.nom || '')).trim() : '';
  }
  function localInput(d) {
    var x = new Date(d), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()) + 'T' + p(x.getHours()) + ':' + p(x.getMinutes());
  }
  function court(d) { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); }

  function admin(o) {
    A.sb = o.sb; A.toast = o.toast || A.toast; css();
    if (A.branche || !$('form-atelier')) return; A.branche = true;
    $('form-atelier').addEventListener('submit', function (e) {
      e.preventDefault();
      var titre = $('at-titre').value.trim(), d = $('at-debut').value, lien = $('at-lien').value.trim();
      if (!titre || !d) { A.toast('Écris un titre et choisis la date et l\'heure.'); return; }
      if (lien && !lienSur(lien)) { A.toast('Le lien doit commencer par https://'); return; }
      var debut = new Date(d);
      if (isNaN(debut)) { A.toast('Date invalide.'); return; }
      var rangee = { formation: $('at-formation').value, titre: titre, description: $('at-desc').value.trim() || null,
        debut: debut.toISOString(), duree_min: +$('at-duree').value, lien: lien || null, formatrice_id: +$('at-formatrice').value || null };
      var b = $('at-bouton'); b.disabled = true;
      var req;
      if (A.edition) {
        var ancien = A.liste.filter(function (x) { return x.id === A.edition; })[0];
        if (ancien && new Date(ancien.debut).getTime() !== debut.getTime()) { rangee.rappel_24h = false; rangee.rappel_1h = false; }
        req = A.sb.from('ateliers').update(rangee).eq('id', A.edition);
      } else {
        if (debut.getTime() < Date.now() && !confirm('Cette date est déjà passée. Ajouter quand même l\'atelier ?')) { b.disabled = false; return; }
        if (!confirm('Ajouter cet atelier ? Les étudiantes concernées recevront une notification.')) { b.disabled = false; return; }
        req = A.sb.from('ateliers').insert(rangee);
      }
      req.then(function (r) {
        b.disabled = false;
        if (r.error) { A.toast('Impossible : ' + r.error.message); return; }
        A.toast(A.edition ? '✏️ Atelier modifié' : '🎥 Atelier ajouté');
        annulerEdition(); chargerAdmin();
      });
    });
    $('at-annuler').addEventListener('click', annulerEdition);
    $('liste-ateliers-admin').addEventListener('click', function (e) {
      var t = e.target.closest('[data-at]'); if (!t) return; e.preventDefault();
      var id = +t.dataset.at, a = A.liste.filter(function (x) { return x.id === id; })[0]; if (!a) return;
      var act = t.dataset.action;
      if (act === 'retirer') {
        if (!confirm('Retirer « ' + a.titre + ' » ? Il disparaîtra du compte des étudiantes, avec ses présences et son compte rendu.')) return;
        A.sb.from('ateliers').delete().eq('id', id).then(function (r) { A.toast(r.error ? 'Impossible : ' + r.error.message : 'Atelier retiré'); chargerAdmin(); });
      } else if (act === 'modifier') {
        A.edition = id;
        $('at-formation').value = a.formation; $('at-titre').value = a.titre; $('at-desc').value = a.description || '';
        $('at-debut').value = localInput(a.debut); $('at-duree').value = String(a.duree_min); $('at-lien').value = a.lien || '';
        $('at-formatrice').value = a.formatrice_id ? String(a.formatrice_id) : '';
        $('at-bouton').textContent = '💾 Enregistrer les changements'; $('at-annuler').hidden = false;
        $('form-atelier').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (act === 'cr') {
        var z = $('at-cr-' + id); if (z) z.hidden = !z.hidden;
      } else if (act === 'valider') {
        if (!confirm('Valider ce compte rendu ? Les étudiantes verront leur présence dans leur appli.')) return;
        A.sb.from('comptes_rendus').update({ statut: 'valide', valide_le: new Date().toISOString(), commentaire_admin: null }).eq('atelier_id', id)
          .then(function (r) { A.toast(r.error ? 'Impossible : ' + r.error.message : '✅ Compte rendu validé'); chargerAdmin(); });
      } else if (act === 'revoir') {
        var c = prompt('Quelle correction demandes-tu à la formatrice ?');
        if (c == null) return;
        if (!c.trim()) { A.toast('Écris ce qu\'il faut corriger.'); return; }
        A.sb.from('comptes_rendus').update({ statut: 'a_revoir', commentaire_admin: c.trim().slice(0, 2000) }).eq('atelier_id', id)
          .then(function (r) { A.toast(r.error ? 'Impossible : ' + r.error.message : '✏️ Correction demandée'); chargerAdmin(); });
      }
    });
    if ($('form-formatrice')) {
      $('form-formatrice').addEventListener('submit', function (e) {
        e.preventDefault();
        var f = FORMS.filter(function (k) { return $('ff-' + k).checked; });
        var c = $('ff-courriel').value.trim().toLowerCase();
        if (!$('ff-prenom').value.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)) { A.toast('Écris le prénom et un courriel valide.'); return; }
        if (!f.length) { A.toast('Coche au moins une formation.'); return; }
        A.sb.from('formatrices').insert({ prenom: $('ff-prenom').value.trim(), nom: $('ff-nom').value.trim() || null, courriel: c, formations: f })
          .then(function (r) {
            if (r.error) { A.toast(/duplicate|unique/i.test(r.error.message) ? 'Ce courriel est déjà inscrit.' : 'Impossible : ' + r.error.message); return; }
            A.toast('👩‍🏫 Formatrice ajoutée'); $('form-formatrice').reset(); chargerAdmin();
          });
      });
      $('liste-formatrices').addEventListener('click', function (e) {
        var t = e.target.closest('[data-fo]'); if (!t) return; e.preventDefault();
        var id = +t.dataset.fo, f = A.formatrices.filter(function (x) { return x.id === id; })[0]; if (!f) return;
        if (t.dataset.action === 'actif') {
          if (f.actif && !confirm('Retirer l\'accès de ' + f.prenom + ' ? Elle ne pourra plus se connecter à l\'appli des formatrices.')) return;
          A.sb.from('formatrices').update({ actif: !f.actif }).eq('id', id).then(function (r) { A.toast(r.error ? 'Impossible : ' + r.error.message : (f.actif ? 'Accès retiré' : 'Accès réactivé')); chargerAdmin(); });
        } else if (t.dataset.action === 'echanges') {
          var z = $('fo-msgs-' + id); if (z) z.hidden = !z.hidden;
        } else if (t.dataset.action === 'formations') {
          var choix = prompt('Formations de ' + f.prenom + ' (séparées par des virgules) : doula, 4e-trimestre, marraine', (f.formations || []).join(', '));
          if (choix == null) return;
          var l = choix.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return FORMS.indexOf(x) >= 0; });
          if (!l.length) { A.toast('Aucune formation reconnue.'); return; }
          A.sb.from('formatrices').update({ formations: l }).eq('id', id).then(function (r) { A.toast(r.error ? 'Impossible : ' + r.error.message : 'Formations mises à jour'); chargerAdmin(); });
        }
      });
    }
  }
  function annulerEdition() {
    A.edition = null; $('form-atelier').reset();
    $('at-bouton').textContent = '🎥 Ajouter l\'atelier'; $('at-annuler').hidden = true;
  }

  function vueCR(a) {
    var c = A.cr[a.id], gens = inscrites(a.formation);
    var lignes = gens.map(function (g) {
      var p = A.pres[a.id + '|' + g.user_id], n = A.notes[a.id + '|' + g.user_id];
      var st = !p ? '<span style="color:#c0392b">❌ Absente (non notée)</span>' : p.statut === 'presente' ? '<span style="color:var(--vert,#2f6b2a)">✅ Présente</span>' : p.statut === 'retard' ? '<span style="color:#9a6a12">⏰ En retard</span>' : '<span style="color:#c0392b">❌ Absente</span>';
      return '<tr><td style="padding:6px 4px;border-bottom:1px solid var(--bord);vertical-align:top;"><strong>' + esc(g.nom) + '</strong>' + (n ? '<div class="at-detail"><em>📝 ' + esc(n) + '</em></div>' : '') + '</td>' +
        '<td style="padding:6px 4px;border-bottom:1px solid var(--bord);vertical-align:top;white-space:nowrap;">' + st + (p && p.camera_fermee ? '<br>📷 Caméra fermée' : '') + '</td></tr>';
    }).join('');
    return '<div class="at-pres" id="at-cr-' + a.id + '" hidden>' +
      '<div class="at-detail">Envoyé le ' + esc(court(c.soumis_le)) + (c.statut === 'valide' && c.valide_le ? ' · validé le ' + esc(court(c.valide_le)) : '') + '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:.86rem;margin:6px 0 10px;">' + (lignes || '<tr><td class="at-detail">Aucune étudiante.</td></tr>') + '</table>' +
      '<div><strong>Résumé</strong><div class="at-detail" style="color:inherit;">' + esc(c.resume || '') + '</div></div>' +
      (c.observations ? '<div style="margin-top:8px;"><strong>Observations et suivis</strong><div class="at-detail" style="color:inherit;">' + esc(c.observations) + '</div></div>' : '') +
      (c.statut === 'a_revoir' ? '<div class="at-detail" style="margin-top:8px;color:#c0392b;">✏️ Correction demandée : ' + esc(c.commentaire_admin || '') + '</div>' : '') +
      (c.statut === 'soumis' ? '<div class="at-actions"><a href="#" class="btn" data-at="' + a.id + '" data-action="valider">✅ Valider</a><a href="#" class="btn at-gris" data-at="' + a.id + '" data-action="revoir">✏️ Demander une correction</a></div>' : '') +
      '</div>';
  }

  function chargerAdmin() {
    var el = $('liste-ateliers-admin'); if (!el || !A.sb) return;
    var depuis = new Date(Date.now() - 120 * 86400000).toISOString();
    Promise.all([
      A.sb.from('ateliers').select('*').gte('debut', depuis).order('debut'),
      A.sb.from('comptes_rendus').select('*'),
      A.sb.from('presences_ateliers').select('atelier_id,user_id,statut,camera_fermee'),
      A.sb.from('notes_atelier').select('atelier_id,user_id,note'),
      A.sb.from('etudiantes').select('user_id,prenom,nom,courriel,formation,statut,acces_marraine,suspendu,created_at').order('created_at', { ascending: false }),
      A.sb.from('formatrices').select('*').order('prenom'),
      A.sb.from('messages_formatrices').select('*').order('created_at')
    ]).then(function (r) {
      if (r[0].error) { el.innerHTML = '<div class="vide">Impossible de charger les ateliers : ' + esc(r[0].error.message) + '</div>'; return; }
      A.liste = r[0].data || []; A.etudiantes = (r[4] && r[4].data) || []; A.formatrices = (r[5] && r[5].data) || []; A.msgs = (r[6] && r[6].data) || [];
      A.cr = {}; ((r[1] && r[1].data) || []).forEach(function (c) { A.cr[c.atelier_id] = c; });
      A.pres = {}; ((r[2] && r[2].data) || []).forEach(function (p) { A.pres[p.atelier_id + '|' + p.user_id] = p; });
      A.notes = {}; ((r[3] && r[3].data) || []).forEach(function (n) { A.notes[n.atelier_id + '|' + n.user_id] = n.note; });

      var sel = $('at-formatrice');
      if (sel) { var v = sel.value; sel.innerHTML = '<option value="">Aucune (je m\'en occupe)</option>' + A.formatrices.filter(function (f) { return f.actif; }).map(function (f) { return '<option value="' + f.id + '">' + esc(f.prenom + ' ' + (f.nom || '')) + '</option>'; }).join(''); sel.value = v; }

      var aValider = A.liste.filter(function (a) { return A.cr[a.id] && A.cr[a.id].statut === 'soumis'; }).length;
      if ($('at-a-valider')) { $('at-a-valider').textContent = aValider ? ' · ' + aValider + ' à valider' : ''; }

      var n = Date.now();
      var avenir = A.liste.filter(function (a) { return fin(a).getTime() > n; });
      var passes = A.liste.filter(function (a) { return fin(a).getTime() <= n; }).reverse();
      function carte(a) {
        var gens = inscrites(a.formation), c = A.cr[a.id], fo = nomFormatrice(a.formatrice_id), commence = n >= new Date(a.debut).getTime();
        var etat = !commence ? '' : !c ? '<div class="at-detail" style="margin-top:6px;color:#9a6a12;">⏳ ' + (fo ? 'En attente du compte rendu de ' + esc(fo) : 'Aucune formatrice assignée : pas de compte rendu') + '</div>'
          : c.statut === 'valide' ? '<div class="at-detail" style="margin-top:6px;color:var(--vert,#2f6b2a);font-weight:700;">✓ Compte rendu validé</div>'
          : c.statut === 'a_revoir' ? '<div class="at-detail" style="margin-top:6px;color:#c0392b;font-weight:700;">✏️ Correction demandée</div>'
          : '<div class="at-detail" style="margin-top:6px;color:#34508c;font-weight:700;">📝 Compte rendu reçu : à valider</div>';
        return '<div class="at-item"><div class="at-quand">' + esc(quand(a.debut, false)) + '</div>' +
          '<div class="at-titre">' + esc(a.titre) + '</div>' +
          '<div><span class="at-tag">' + esc(NOMS.fr[a.formation]) + '</span><span class="at-detail">' + a.duree_min + ' min · ' + gens.length + ' étudiante' + (gens.length > 1 ? 's' : '') + (fo ? ' · 👩‍🏫 ' + esc(fo) : '') + '</span></div>' +
          (lienSur(a.lien) ? '<div class="at-detail" style="margin-top:4px;word-break:break-all;">🔗 ' + esc(a.lien) + '</div>' : '<div class="at-detail" style="margin-top:4px;color:#c0392b;">⚠️ Aucun lien pour l\'instant</div>') +
          etat +
          '<div class="at-actions">' +
          (c ? '<a href="#" class="btn' + (c.statut === 'soumis' ? '' : ' at-gris') + '" data-at="' + a.id + '" data-action="cr">📝 Compte rendu</a>' : '') +
          '<a href="#" class="btn at-gris" data-at="' + a.id + '" data-action="modifier">✏️ Modifier</a>' +
          '<a href="#" class="btn at-gris" data-at="' + a.id + '" data-action="retirer">Retirer</a></div>' +
          (c ? vueCR(a) : '') + '</div>';
      }
      el.innerHTML = (avenir.length ? '<h4 style="margin:4px 0 8px;">À venir</h4>' + avenir.map(carte).join('') : '<div class="vide" style="padding:10px;">Aucun atelier à venir.</div>') +
        (passes.length ? '<h4 style="margin:14px 0 8px;">Passés</h4>' + passes.map(carte).join('') : '');
      dessinerFormatrices();
    });
  }

  function dessinerFormatrices() {
    var el = $('liste-formatrices'); if (!el) return;
    el.innerHTML = A.formatrices.length ? A.formatrices.map(function (f) {
      var mes = A.msgs.filter(function (m) { return m.formatrice_id === f.id; }), par = {};
      mes.forEach(function (m) { (par[m.etudiante] = par[m.etudiante] || []).push(m); });
      var convs = Object.keys(par).map(function (u) {
        return '<div style="margin-top:8px;"><strong style="font-size:.86rem;">' + esc(nomEtudiante(u)) + '</strong>' + par[u].map(function (m) {
          return '<div class="at-detail" style="margin:3px 0;' + (m.de_formatrice ? 'color:#8c3f2c;' : 'color:inherit;') + '">' + (m.de_formatrice ? esc(f.prenom) : esc(nomEtudiante(u).split(' ')[0])) + ' · ' + esc(court(m.created_at)) + ' : ' + esc(m.texte) + '</div>';
        }).join('') + '</div>';
      }).join('');
      return '<div class="at-item' + (f.actif ? '' : ' passe') + '"><div class="at-titre">' + esc(f.prenom + ' ' + (f.nom || '')) + (f.actif ? '' : ' <span class="at-detail">(accès retiré)</span>') + '</div>' +
        '<div class="at-detail">' + esc(f.courriel) + '</div>' +
        '<div style="margin-top:4px;">' + (f.formations || []).map(function (k) { return '<span class="at-tag">' + esc(NOMS.fr[k] || k) + '</span>'; }).join('') + '</div>' +
        '<div class="at-actions">' +
        '<a href="#" class="btn at-gris" data-fo="' + f.id + '" data-action="echanges">💬 Échanges (' + mes.length + ')</a>' +
        '<a href="#" class="btn at-gris" data-fo="' + f.id + '" data-action="formations">📚 Formations</a>' +
        '<a href="#" class="btn at-gris" data-fo="' + f.id + '" data-action="actif">' + (f.actif ? 'Retirer l\'accès' : 'Réactiver') + '</a></div>' +
        '<div class="at-pres" id="fo-msgs-' + f.id + '" hidden>' + (convs || '<div class="at-detail">Aucun échange pour l\'instant.</div>') + '</div></div>';
    }).join('') : '<div class="vide" style="padding:10px;">Aucune formatrice inscrite pour l\'instant.</div>';
  }

  window.SereAteliers = { admin: admin, chargerAdmin: chargerAdmin, etudiante: etudiante };
})();
