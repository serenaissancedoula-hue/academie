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
  var E = { sb: null, en: false, liste: [], pres: {}, minuterie: null };

  function etudiante(o) {
    E.sb = o.sb; E.en = !!o.en; css();
    var bloc = $('bloc-ateliers'); if (!bloc) return;
    var s = o.etat && o.etat.session; if (!s) { bloc.hidden = true; return; }
    var depuis = new Date(Date.now() - 30 * 86400000).toISOString();
    Promise.all([
      E.sb.from('ateliers').select('id,formation,titre,description,debut,duree_min,lien').gte('debut', depuis).order('debut'),
      E.sb.from('presences_ateliers').select('atelier_id,present').eq('user_id', s.user.id)
    ]).then(function (r) {
      E.liste = (r[0] && r[0].data) || [];
      E.pres = {}; ((r[1] && r[1].data) || []).forEach(function (p) { E.pres[p.atelier_id] = p.present; });
      bloc.hidden = !E.liste.length;
      dessinerEtudiante();
      clearInterval(E.minuterie); E.minuterie = setInterval(dessinerEtudiante, 30000);
      if (location.hash === '#ateliers' && !bloc.hidden) setTimeout(function () { bloc.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
    }).catch(function () { bloc.hidden = true; });
  }

  function dessinerEtudiante() {
    var en = E.en, n = Date.now(), el = $('liste-ateliers'); if (!el) return;
    var avenir = E.liste.filter(function (a) { return fin(a).getTime() > n; });
    var passes = E.liste.filter(function (a) { return fin(a).getTime() <= n; }).reverse();
    function carte(a, passe) {
      var d = new Date(a.debut).getTime(), enCours = n >= d && n < fin(a).getTime(), ouvert = n >= d - AVANT && !passe;
      var lien = lienSur(a.lien), h = '';
      h += '<div class="at-item' + (passe ? ' passe' : '') + '">';
      h += '<div class="at-quand">' + esc(quand(a.debut, en)) + (enCours ? '<span class="at-direct">' + (en ? 'LIVE NOW' : 'EN COURS') + '</span>' : '') + '</div>';
      h += '<div class="at-titre">' + esc(a.titre) + '</div>';
      h += '<div><span class="at-tag">' + esc(NOMS[en ? 'en' : 'fr'][a.formation] || a.formation) + '</span><span class="at-detail">' + a.duree_min + ' min</span></div>';
      if (a.description) h += '<div class="at-detail" style="margin-top:6px;">' + esc(a.description) + '</div>';
      if (passe) {
        var p = E.pres[a.id];
        if (p === true) h += '<div class="at-detail" style="margin-top:6px;color:var(--vert);font-weight:700;">✓ ' + (en ? 'Attendance recorded' : 'Présence notée') + '</div>';
        else if (p === false) h += '<div class="at-detail" style="margin-top:6px;">' + (en ? 'Marked absent. If this is a mistake, write to Sabrina in your Messages.' : 'Absence notée. Si c\'est une erreur, écris à Sabrina dans tes Messages.') + '</div>';
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

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ics]'); if (!b) return;
    var a = E.liste.filter(function (x) { return String(x.id) === b.dataset.ics; })[0] || A.liste.filter(function (x) { return String(x.id) === b.dataset.ics; })[0];
    if (a) telechargerIcs(a, E.en);
  });

  /* ================= Admin ================= */
  var A = { sb: null, toast: function () {}, liste: [], etudiantes: [], branche: false, edition: null };

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
  function localInput(d) {
    var x = new Date(d), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()) + 'T' + p(x.getHours()) + ':' + p(x.getMinutes());
  }

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
        debut: debut.toISOString(), duree_min: +$('at-duree').value, lien: lien || null };
      var b = $('at-bouton'); b.disabled = true;
      var req;
      if (A.edition) {
        var ancien = A.liste.filter(function (x) { return x.id === A.edition; })[0];
        if (ancien && ancien.debut !== rangee.debut) { rangee.rappel_24h = false; rangee.rappel_1h = false; }
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
      if (t.dataset.action === 'retirer') {
        if (!confirm('Retirer « ' + a.titre + ' » ? Il disparaîtra du compte des étudiantes, avec ses présences.')) return;
        A.sb.from('ateliers').delete().eq('id', id).then(function (r) { A.toast(r.error ? 'Impossible : ' + r.error.message : 'Atelier retiré'); chargerAdmin(); });
      } else if (t.dataset.action === 'modifier') {
        A.edition = id;
        $('at-formation').value = a.formation; $('at-titre').value = a.titre; $('at-desc').value = a.description || '';
        $('at-debut').value = localInput(a.debut); $('at-duree').value = String(a.duree_min); $('at-lien').value = a.lien || '';
        $('at-bouton').textContent = '💾 Enregistrer les changements'; $('at-annuler').hidden = false;
        $('form-atelier').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (t.dataset.action === 'presences') {
        var z = $('at-pres-' + id); if (z) z.hidden = !z.hidden;
      }
    });
    $('liste-ateliers-admin').addEventListener('change', function (e) {
      var c = e.target; if (!c.dataset || !c.dataset.presence) return;
      var p = c.dataset.presence.split('|');
      A.sb.from('presences_ateliers').upsert({ atelier_id: +p[0], user_id: p[1], present: c.checked }, { onConflict: 'atelier_id,user_id' })
        .then(function (r) { if (r.error) { c.checked = !c.checked; A.toast('Impossible : ' + r.error.message); } else A.toast(c.checked ? '✓ Présente' : 'Absente'); });
    });
  }
  function annulerEdition() {
    A.edition = null; $('form-atelier').reset();
    $('at-bouton').textContent = '🎥 Ajouter l\'atelier'; $('at-annuler').hidden = true;
  }

  function chargerAdmin() {
    var el = $('liste-ateliers-admin'); if (!el || !A.sb) return;
    var depuis = new Date(Date.now() - 90 * 86400000).toISOString();
    Promise.all([
      A.sb.from('ateliers').select('*').gte('debut', depuis).order('debut'),
      A.sb.from('presences_ateliers').select('atelier_id,user_id,present'),
      A.sb.from('etudiantes').select('user_id,prenom,nom,courriel,formation,statut,acces_marraine,suspendu,created_at').order('created_at', { ascending: false })
    ]).then(function (r) {
      if (r[0].error) { el.innerHTML = '<div class="vide">Impossible de charger les ateliers : ' + esc(r[0].error.message) + '</div>'; return; }
      A.liste = r[0].data || []; A.etudiantes = (r[2] && r[2].data) || [];
      var pres = {}; ((r[1] && r[1].data) || []).forEach(function (p) { pres[p.atelier_id + '|' + p.user_id] = p.present; });
      var n = Date.now();
      var avenir = A.liste.filter(function (a) { return fin(a).getTime() > n; });
      var passes = A.liste.filter(function (a) { return fin(a).getTime() <= n; }).reverse();
      function carte(a) {
        var gens = inscrites(a.formation), notes = gens.filter(function (g) { return pres[a.id + '|' + g.user_id] === true; }).length;
        var h = '<div class="at-item"><div class="at-quand">' + esc(quand(a.debut, false)) + '</div>' +
          '<div class="at-titre">' + esc(a.titre) + '</div>' +
          '<div><span class="at-tag">' + esc(NOMS.fr[a.formation]) + '</span><span class="at-detail">' + a.duree_min + ' min · ' + gens.length + ' étudiante' + (gens.length > 1 ? 's' : '') + ' · ' + notes + ' présence' + (notes > 1 ? 's' : '') + ' notée' + (notes > 1 ? 's' : '') + '</span></div>' +
          (lienSur(a.lien) ? '<div class="at-detail" style="margin-top:4px;word-break:break-all;">🔗 ' + esc(a.lien) + '</div>' : '<div class="at-detail" style="margin-top:4px;color:#c0392b;">⚠️ Aucun lien pour l\'instant</div>') +
          '<div class="at-actions">' +
          '<a href="#" class="btn at-gris" data-at="' + a.id + '" data-action="presences">✅ Présences</a>' +
          '<a href="#" class="btn at-gris" data-at="' + a.id + '" data-action="modifier">✏️ Modifier</a>' +
          '<a href="#" class="btn at-gris" data-at="' + a.id + '" data-action="retirer">Retirer</a></div>' +
          '<div class="at-pres" id="at-pres-' + a.id + '" hidden>' +
          (gens.length ? gens.map(function (g) {
            return '<label><input type="checkbox" data-presence="' + a.id + '|' + g.user_id + '"' + (pres[a.id + '|' + g.user_id] === true ? ' checked' : '') + '> ' + esc(g.nom) + '</label>';
          }).join('') : '<div class="at-detail">Aucune étudiante n\'a encore accès à cette formation.</div>') +
          '</div></div>';
        return h;
      }
      el.innerHTML = (avenir.length ? '<h4 style="margin:4px 0 8px;">À venir</h4>' + avenir.map(carte).join('') : '<div class="vide" style="padding:10px;">Aucun atelier à venir.</div>') +
        (passes.length ? '<h4 style="margin:14px 0 8px;">Passés (90 derniers jours)</h4>' + passes.map(carte).join('') : '');
    });
  }

  window.SereAteliers = { admin: admin, chargerAdmin: chargerAdmin, etudiante: etudiante };
})();
