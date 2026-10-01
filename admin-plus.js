/* Académie Sérénaissance — admin : évaluations, témoignages, questionnaires, ententes, blogue.
   SereAdminPlus.init({ sb, toast, traduire })
   SereAdminPlus.evaluations()  → onglet « Évaluations » (mises en situation à valider, questionnaires, ententes)
   SereAdminPlus.outils()       → cartes « Témoignages » et « Blogue » de l'onglet Outils */
(function () {
  'use strict';
  var sb, toast, traduire;
  function $(id) { return document.getElementById(id); }
  function esc(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
  function jour(d) { return d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
  function jourLong(d) { return d ? new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; }
  var etudiantes = {};

  function css() {
    if ($('style-admin-plus')) return;
    var s = document.createElement('style'); s.id = 'style-admin-plus';
    s.textContent =
      '.ap-filtres{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 12px}.ap-filtres button{border:1px solid var(--bord);background:#fff;border-radius:50px;padding:6px 12px;font:inherit;font-size:.78rem;font-weight:700;cursor:pointer;color:var(--doux)}' +
      '.ap-filtres button.actif{background:var(--terra);color:#fff;border-color:var(--terra)}' +
      '.ap-item{border:1px solid var(--bord);border-radius:14px;padding:14px;margin-bottom:10px;background:#fff}' +
      '.ap-item h4{margin:0 0 2px;font-size:.95rem}.ap-item small{color:var(--doux);font-size:.76rem}' +
      '.ap-sit{background:#fbf5ef;border-radius:10px;padding:10px 12px;font-size:.84rem;line-height:1.55;margin:8px 0;white-space:pre-wrap}' +
      '.ap-rep{white-space:pre-wrap;background:#f7f3ee;border-left:3px solid var(--terra);border-radius:8px;padding:8px 10px;font-size:.86rem;margin:4px 0 6px}' +
      '.ap-crit{font-size:.8rem;margin:0 0 8px}.ap-crit .ok{color:#3f7a57}.ap-crit .ko{color:#a5482f}' +
      '.ap-ligne{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-top:8px}.ap-ligne .champ{flex:1;min-width:120px}' +
      '.ap-badge{display:inline-block;font-size:.7rem;font-weight:800;border-radius:50px;padding:3px 9px;margin-left:4px}' +
      '.ap-badge.a_valider{background:#fff4e0;color:#7a5a20}.ap-badge.validee,.ap-badge.publie{background:#eef5ec;color:#3f7a57}.ap-badge.a_reprendre,.ap-badge.prive{background:#fbeeea;color:#8c4434}.ap-badge.attente{background:#f3ede6;color:#6b5d55}' +
      '.ap-moy{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:6px 0 12px}.ap-moy div{background:#fbf5ef;border-radius:12px;padding:10px;text-align:center}.ap-moy b{display:block;font-size:1.3rem;color:var(--terra)}.ap-moy span{font-size:.74rem;color:var(--doux)}' +
      '.ap-apercu{border:1px dashed var(--bord);border-radius:12px;padding:12px 14px;margin-top:8px;font-size:.9rem;line-height:1.6;max-height:420px;overflow:auto;background:#fffdfb}' +
      '.ap-apercu h2{font-size:1.1rem;margin:12px 0 6px}.ap-apercu h3{font-size:1rem;margin:10px 0 4px}';
    document.head.appendChild(s);
  }
  function chargerNoms() {
    return sb.from('etudiantes').select('user_id,prenom,nom,courriel').then(function (r) {
      ((r && r.data) || []).forEach(function (e) { if (e.user_id) etudiantes[e.user_id] = ((e.prenom || '') + ' ' + (e.nom || '')).trim() || e.courriel; });
    });
  }

  /* ================= Mises en situation ================= */
  var filtreMes = 'a_valider', mesListe = [];
  function chargerMes() {
    var b = $('ap-mes'); if (!b) return;
    b.innerHTML = 'Chargement…';
    var q = sb.from('mises_en_situation').select('*').order('created_at', { ascending: false }).limit(300);
    Promise.all([q, chargerNoms()]).then(function (x) {
      var r = x[0];
      if (r.error) { b.innerHTML = '<p class="infos-ligne ko">Impossible : ' + esc(r.error.message) + '</p>'; return; }
      mesListe = r.data || [];
      var n = mesListe.filter(function (m) { return m.type === 'examen' && m.statut === 'a_valider'; }).length;
      $('ap-mes-nb').textContent = n ? '(' + n + ' à valider)' : '';
      var tab = document.querySelector('.onglets-bas button[data-v="evaluations"] span'); if (tab) tab.setAttribute('data-nb', n || '');
      afficherMes();
    });
  }
  function afficherMes() {
    var b = $('ap-mes');
    var l = mesListe.filter(function (m) {
      if (filtreMes === 'formatif') return m.type === 'formatif';
      if (filtreMes === 'tout') return m.type === 'examen';
      return m.type === 'examen' && m.statut === filtreMes;
    });
    if (!l.length) { b.innerHTML = '<p class="infos-ligne" style="color:var(--doux);">' + (filtreMes === 'a_valider' ? '🎉 Aucune mise en situation à valider pour le moment.' : 'Rien ici pour le moment.') + '</p>'; return; }
    b.innerHTML = l.map(function (m) {
      var nom = etudiantes[m.user_id] || m.courriel || 'Étudiante';
      var rep = (m.reponses || []).map(function (r, i) {
        return '<p style="margin:8px 0 2px;font-size:.86rem;"><strong>' + (i + 1) + '. ' + esc(r.q) + '</strong>' + (r.max ? ' <small>(' + r.pts + ' / ' + r.max + ' auto)</small>' : '') + '</p>' +
          '<div class="ap-rep">' + esc(r.reponse) + '</div>' +
          ((r.criteres || []).length ? '<div class="ap-crit">' + r.criteres.map(function (k) { return '<div class="' + (k.ok ? 'ok' : 'ko') + '">' + (k.ok ? '✓ ' : '✗ ') + esc(k.idee) + ' (' + (k.pts || 1) + ' pt)</div>'; }).join('') + '</div>' : '');
      }).join('');
      var pct = m.total ? Math.round(m.score_auto / m.total * 100) : null;
      return '<div class="ap-item" data-mes="' + m.id + '"><h4>' + esc(nom) + ' · ' + esc(m.titre || m.scenario_id) +
        (m.type === 'examen' ? '<span class="ap-badge ' + m.statut + '">' + ({ a_valider: 'À valider', validee: 'Validée', a_reprendre: 'À reprendre' }[m.statut]) + '</span>' : '<span class="ap-badge attente">Exercice</span>') + '</h4>' +
        '<small>' + esc(m.evaluation) + ' · ' + esc(jour(m.created_at)) + (m.langue === 'en' ? ' · 🇬🇧 en anglais' : '') + (m.tentative > 1 ? ' · tentative ' + m.tentative : '') + '</small>' +
        '<details style="margin-top:6px;"><summary style="cursor:pointer;font-size:.82rem;color:var(--terra);font-weight:700;">Voir la mise en situation</summary><div class="ap-sit">' + esc(m.situation) + '</div></details>' +
        rep +
        '<div style="font-size:.86rem;">Correction automatique : <strong>' + m.score_auto + ' / ' + m.total + (pct != null ? ' (' + pct + ' %)' : '') + '</strong></div>' +
        (m.type === 'examen' ? '<div class="ap-ligne"><label class="champ" style="max-width:130px;">Ta note / ' + m.total + '<input type="number" class="ap-note" min="0" max="' + m.total + '" step="0.5" value="' + (m.score_final != null ? m.score_final : m.score_auto) + '"></label>' +
          '<label class="champ">Commentaire pour l\'étudiante<textarea class="ap-com" rows="2" maxlength="2000">' + esc(m.commentaire || '') + '</textarea></label></div>' +
          '<div class="actions" style="margin-top:8px;"><button class="btn" type="button" data-act="validee">✅ Valider</button><button class="btn gris" type="button" data-act="a_reprendre">✏️ À reprendre</button>' +
          (m.langue === 'en' ? '<button class="btn gris" type="button" data-act="traduire">🌐 Traduire les réponses en français</button>' : '') + '</div>' : '') +
        '</div>';
    }).join('');
  }
  function brancherMes() {
    $('ap-mes-filtres').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      filtreMes = b.dataset.f;
      this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('actif', x === b); });
      afficherMes();
    });
    $('ap-mes').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var it = b.closest('[data-mes]'), m = mesListe.filter(function (x) { return String(x.id) === it.dataset.mes; })[0]; if (!m) return;
      if (b.dataset.act === 'traduire') {
        b.disabled = true;
        Promise.all(it.querySelectorAll('.ap-rep').length ? Array.prototype.map.call(it.querySelectorAll('.ap-rep'), function (d) {
          return traduire(d.textContent, 'en|fr').then(function (t) { d.innerHTML = esc(d.textContent) + '<div style="margin-top:6px;color:var(--doux);">🇫🇷 ' + esc(t) + '</div>'; });
        }) : []).then(function () { b.remove(); }, function () { b.disabled = false; toast('Traduction impossible pour le moment'); });
        return;
      }
      var note = parseFloat(it.querySelector('.ap-note').value), com = it.querySelector('.ap-com').value.trim();
      if (isNaN(note) || note < 0 || note > m.total) { toast('La note doit être entre 0 et ' + m.total); return; }
      if (b.dataset.act === 'a_reprendre' && !com) { toast('Écris un commentaire pour expliquer quoi revoir.'); return; }
      b.disabled = true;
      sb.from('mises_en_situation').update({ statut: b.dataset.act, score_final: note, commentaire: com || null, validee_le: new Date().toISOString() }).eq('id', m.id).then(function (r) {
        b.disabled = false;
        if (r.error) { toast('Erreur : ' + r.error.message); return; }
        m.statut = b.dataset.act; m.score_final = note; m.commentaire = com;
        toast(b.dataset.act === 'validee' ? '✅ Validée — l\'étudiante est avisée' : '✏️ Envoyée à reprendre — l\'étudiante est avisée');
        chargerMes();
      });
    });
  }

  /* ================= Questionnaires de fin ================= */
  var LIB = { globale: 'Note globale', clarte: 'Clarté', utilite: 'Utilité', evaluations: 'Évaluations justes', soutien: 'Soutien', plateforme: 'Plateforme' };
  function chargerQuestionnaires() {
    var b = $('ap-questionnaires'); if (!b) return;
    Promise.all([sb.from('questionnaires_fin').select('*').order('created_at', { ascending: false }), chargerNoms()]).then(function (x) {
      var l = (x[0] && x[0].data) || [];
      if (!l.length) { b.innerHTML = '<p class="infos-ligne" style="color:var(--doux);">Aucun questionnaire reçu pour le moment. Il s\'ouvre pour l\'étudiante après la réussite de l\'examen final.</p>'; return; }
      var moy = Object.keys(LIB).map(function (k) {
        var v = l.map(function (q) { return +q.reponses[k]; }).filter(function (n) { return n >= 1; });
        return '<div><b>' + (v.length ? (v.reduce(function (a, c) { return a + c; }, 0) / v.length).toFixed(1) : '–') + ' / 5</b><span>' + LIB[k] + '</span></div>';
      }).join('');
      var reco = l.filter(function (q) { return q.reponses.recommande === 'oui'; }).length, obj = l.filter(function (q) { return q.reponses.objectifs === 'oui'; }).length;
      var h = l.map(function (q) { return +q.reponses.heures; }).filter(function (n) { return n > 0; });
      b.innerHTML = '<div class="ap-moy">' + moy + '<div><b>' + Math.round(reco / l.length * 100) + ' %</b><span>la recommandent</span></div><div><b>' + Math.round(obj / l.length * 100) + ' %</b><span>objectifs atteints</span></div>' +
        (h.length ? '<div><b>' + Math.round(h.reduce(function (a, c) { return a + c; }, 0) / h.length) + ' h</b><span>temps moyen</span></div>' : '') + '</div>' +
        '<div class="actions" style="margin-bottom:10px;"><button class="btn gris" type="button" id="ap-q-csv">⬇️ Exporter (CSV)</button></div>' +
        l.map(function (q) {
          var r = q.reponses || {};
          return '<div class="ap-item"><h4>' + esc(etudiantes[q.user_id] || 'Étudiante') + ' · ' + (q.formation === 'marraine' ? 'Marraine' : '4ᵉ trimestre') + '</h4><small>' + esc(jour(q.created_at)) + (q.langue === 'en' ? ' · 🇬🇧' : '') + '</small>' +
            '<div style="font-size:.84rem;margin-top:6px;">' + Object.keys(LIB).map(function (k) { return LIB[k] + ' : <b>' + (r[k] || '–') + '</b>'; }).join(' · ') +
            '<br>Objectifs : <b>' + esc(r.objectifs || '–') + '</b> · Recommande : <b>' + esc(r.recommande || '–') + '</b>' + (r.heures ? ' · ' + esc(r.heures) + ' h' : '') + '</div>' +
            (r.aime ? '<div class="ap-rep"><b>A aimé :</b> ' + esc(r.aime) + '</div>' : '') + (r.ameliorer ? '<div class="ap-rep"><b>À améliorer :</b> ' + esc(r.ameliorer) + '</div>' : '') + '</div>';
        }).join('');
      $('ap-q-csv').addEventListener('click', function () {
        var cols = ['date', 'etudiante', 'formation'].concat(Object.keys(LIB), ['objectifs', 'recommande', 'heures', 'aime', 'ameliorer']);
        var lignes = [cols.join(';')].concat(l.map(function (q) {
          var r = q.reponses || {};
          return [q.created_at.slice(0, 10), etudiantes[q.user_id] || '', q.formation].concat(Object.keys(LIB).map(function (k) { return r[k] || ''; }), [r.objectifs || '', r.recommande || '', r.heures || '', r.aime || '', r.ameliorer || ''])
            .map(function (v) { return '"' + String(v).replace(/"/g, '""').replace(/\n/g, ' ') + '"'; }).join(';');
        }));
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lignes.join('\n')], { type: 'text/csv' })); a.download = 'questionnaires-fin-formation.csv'; a.click();
      });
    });
  }

  /* ================= Ententes signées ================= */
  function chargerEntentes() {
    var b = $('ap-ententes'); if (!b) return;
    sb.from('ententes').select('*').order('signee_le', { ascending: false }).then(function (r) {
      var l = (r && r.data) || [];
      b.innerHTML = l.length ? l.map(function (e) {
        return '<div class="infos-ligne">✍️ <b>' + esc(e.nom_signature) + '</b> (' + esc(e.courriel || '') + ') · ' + (e.formation === 'marraine' ? 'Marraine' : '4ᵉ trimestre') + ' · ' + esc(new Date(e.signee_le).toLocaleString('fr-CA')) + ' · ' + esc(e.version) + '</div>';
      }).join('') : '<p class="infos-ligne" style="color:var(--doux);">Aucune entente signée pour le moment. Chaque étudiante la signe dans son compte avant d\'ouvrir ses cours.</p>';
    });
  }

  /* ================= Témoignages ================= */
  var temListe = [];
  function chargerTemoignages() {
    var b = $('ap-tem'); if (!b) return;
    sb.from('temoignages').select('*').order('publie', { ascending: true }).order('ordre').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) { b.innerHTML = '<p class="infos-ligne ko">' + esc(r.error.message) + '</p>'; return; }
      temListe = r.data || [];
      var pub = temListe.filter(function (t) { return t.publie; }).length;
      $('ap-tem-resume').textContent = pub + ' publié(s) sur le site · ' + (temListe.length - pub) + ' en attente';
      b.innerHTML = temListe.map(function (t) {
        var etat = t.publie ? '<span class="ap-badge publie">Publié</span>' : (t.source === 'questionnaire' && !t.permission ? '<span class="ap-badge prive">Privé : pas de permission</span>' : '<span class="ap-badge attente">En attente</span>');
        return '<div class="ap-item" data-tem="' + t.id + '"><h4>' + esc(t.nom_affiche) + etat + '</h4><small>' + (t.categorie === 'famille' ? '👪 Famille' : '🎓 Étudiante') + ' · ' + esc(t.role || '') +
          (t.source === 'questionnaire' ? ' · reçu par le questionnaire le ' + esc(jour(t.created_at)) + (t.permission ? ' · ✔ permission donnée le ' + esc(jour(t.permission_date)) : '') : '') + (t.note ? ' · ' + '★'.repeat(t.note) : '') + '</small>' +
          '<details style="margin-top:6px;"><summary style="cursor:pointer;font-size:.82rem;color:var(--terra);font-weight:700;">Lire / modifier</summary>' +
          '<div class="ap-ligne"><label class="champ">Nom affiché<input class="t-nom" maxlength="60" value="' + esc(t.nom_affiche) + '"></label><label class="champ">Rôle<input class="t-role" maxlength="80" value="' + esc(t.role || '') + '"></label>' +
          '<label class="champ" style="max-width:150px;">Catégorie<select class="t-cat"><option value="etudiante"' + (t.categorie === 'etudiante' ? ' selected' : '') + '>Étudiante</option><option value="famille"' + (t.categorie === 'famille' ? ' selected' : '') + '>Famille</option></select></label></div>' +
          '<label class="champ" style="margin-top:6px;">Texte (français)<textarea class="t-texte" rows="4" maxlength="2000">' + esc(t.texte) + '</textarea></label>' +
          '<div class="ap-ligne"><label class="champ">Rôle en anglais<input class="t-role-en" maxlength="80" value="' + esc(t.role_en || '') + '"></label></div>' +
          '<label class="champ" style="margin-top:6px;">Texte anglais (pour le site anglais) <button type="button" class="btn gris t-trad" style="padding:3px 10px;font-size:.72rem;">🌐 Traduire</button><textarea class="t-texte-en" rows="4" maxlength="2500">' + esc(t.texte_en || '') + '</textarea></label>' +
          '<div class="actions" style="margin-top:8px;"><button class="btn gris" type="button" data-t="sauver">💾 Enregistrer</button><button class="btn gris" type="button" data-t="effacer">🗑️ Effacer</button></div></details>' +
          '<div class="actions" style="margin-top:8px;">' + (t.publie ? '<button class="btn gris" type="button" data-t="retirer">🙈 Retirer du site</button>'
            : (t.source === 'questionnaire' && !t.permission ? '' : '<button class="btn" type="button" data-t="publier">🌐 Publier sur le site</button>')) + '</div></div>';
      }).join('') || '<p class="infos-ligne">Aucun témoignage.</p>';
    });
  }
  function brancherTemoignages() {
    $('ap-tem').addEventListener('click', function (e) {
      var b = e.target.closest('[data-t], .t-trad'); if (!b) return;
      var it = b.closest('[data-tem]'), t = temListe.filter(function (x) { return String(x.id) === it.dataset.tem; })[0]; if (!t) return;
      if (b.classList.contains('t-trad')) {
        b.disabled = true;
        traduire(it.querySelector('.t-texte').value, 'fr|en').then(function (x) { it.querySelector('.t-texte-en').value = x.trim(); b.disabled = false; toast('Traduction ajoutée : relis-la puis Enregistrer'); }, function () { b.disabled = false; toast('Traduction impossible pour le moment'); });
        return;
      }
      var act = b.dataset.t, maj = null;
      if (act === 'sauver') maj = { nom_affiche: it.querySelector('.t-nom').value.trim(), role: it.querySelector('.t-role').value.trim() || null, role_en: it.querySelector('.t-role-en').value.trim() || null,
        categorie: it.querySelector('.t-cat').value, texte: it.querySelector('.t-texte').value.trim(), texte_en: it.querySelector('.t-texte-en').value.trim() || null };
      if (act === 'publier') {
        if (t.source !== 'questionnaire' && !t.permission && !confirm('Confirmes-tu que ' + t.nom_affiche + ' t\'a donné sa permission (par écrit, un message suffit) de publier ce témoignage sur ton site ?\n\nLa loi (Loi sur la concurrence, Loi 25) exige un témoignage réel et une permission. Garde une copie de cette permission.')) return;
        maj = { publie: true, publie_le: new Date().toISOString(), permission: true, permission_date: t.permission_date || new Date().toISOString() };
      }
      if (act === 'retirer') maj = { publie: false };
      if (act === 'effacer') {
        if (!confirm('Effacer définitivement ce témoignage ?')) return;
        sb.from('temoignages').delete().eq('id', t.id).then(function (r) { if (r.error) toast('Erreur : ' + r.error.message); else { toast('Témoignage effacé'); chargerTemoignages(); } });
        return;
      }
      if (!maj) return;
      if (maj.texte !== undefined && maj.texte.length < 10) { toast('Le texte est trop court.'); return; }
      sb.from('temoignages').update(maj).eq('id', t.id).then(function (r) {
        if (r.error) { toast('Erreur : ' + r.error.message); return; }
        toast(act === 'publier' ? '🌐 Publié sur le site' : act === 'retirer' ? 'Retiré du site' : '💾 Enregistré'); chargerTemoignages();
      });
    });
    $('ap-tem-ajouter').addEventListener('click', function () {
      var nom = prompt('Nom affiché (ex. : Marie L.)'); if (!nom) return;
      var txt = prompt('Texte du témoignage (tu pourras le modifier ensuite)'); if (!txt || txt.trim().length < 10) return;
      var fam = confirm('Est-ce un témoignage de FAMILLE (accompagnement, cours prénataux) ?\n\nOK = famille · Annuler = étudiante');
      sb.from('temoignages').insert({ nom_affiche: nom.trim().slice(0, 60), texte: txt.trim(), categorie: fam ? 'famille' : 'etudiante', role: fam ? 'Maman' : 'Étudiante', role_en: fam ? 'Mother' : 'Student', source: 'admin' })
        .then(function (r) { if (r.error) toast('Erreur : ' + r.error.message); else { toast('Ajouté en attente : traduis-le puis publie-le'); chargerTemoignages(); } });
    });
  }

  /* ================= Blogue ================= */
  var artListe = [], artEdit = null;
  function slug(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); }
  function chargerArticles() {
    var b = $('ap-art'); if (!b) return;
    sb.from('articles').select('*').order('date_publication', { ascending: false }).then(function (r) {
      artListe = (r && r.data) || [];
      b.innerHTML = artListe.length ? artListe.map(function (a) {
        return '<div class="ap-item"><h4>' + esc(a.titre) + (a.publie ? '<span class="ap-badge publie">Publié</span>' : '<span class="ap-badge attente">Brouillon</span>') + (a.titre_en ? ' <span class="ap-badge attente">🇬🇧</span>' : '') + '</h4>' +
          '<small>' + esc(jourLong(a.date_publication)) + ' · /blogue/?a=' + esc(a.slug) + '</small>' +
          '<div class="actions" style="margin-top:8px;"><button class="btn gris" type="button" data-art="' + a.id + '" data-a="modifier">✏️ Modifier</button>' +
          (a.publie ? '<a class="btn gris" href="/blogue/?a=' + encodeURIComponent(a.slug) + '" target="_blank" rel="noopener">👀 Voir</a><button class="btn gris" type="button" data-art="' + a.id + '" data-a="depublier">🙈 Dépublier</button>'
                    : '<button class="btn" type="button" data-art="' + a.id + '" data-a="publier">🌐 Publier</button>') + '</div></div>';
      }).join('') : '<p class="infos-ligne">Aucun article pour le moment.</p>';
    });
  }
  function ouvrirEditeur(a) {
    artEdit = a || null; var f = $('form-art'); f.hidden = false;
    $('art-titre').value = a ? a.titre : ''; $('art-slug').value = a ? a.slug : ''; $('art-date').value = a ? a.date_publication : new Date().toISOString().slice(0, 10);
    $('art-image').value = a ? (a.image || '') : ''; $('art-resume').value = a ? (a.resume || '') : ''; $('art-contenu').value = a ? a.contenu : '';
    $('art-titre-en').value = a ? (a.titre_en || '') : ''; $('art-resume-en').value = a ? (a.resume_en || '') : ''; $('art-contenu-en').value = a ? (a.contenu_en || '') : '';
    $('art-apercu').hidden = true; f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function brancherBlogue() {
    $('ap-art-nouveau').addEventListener('click', function () { ouvrirEditeur(null); });
    $('art-titre').addEventListener('input', function () { if (!artEdit) $('art-slug').value = slug(this.value); });
    $('ap-art').addEventListener('click', function (e) {
      var b = e.target.closest('[data-art]'); if (!b) return;
      var a = artListe.filter(function (x) { return String(x.id) === b.dataset.art; })[0]; if (!a) return;
      if (b.dataset.a === 'modifier') return ouvrirEditeur(a);
      sb.from('articles').update({ publie: b.dataset.a === 'publier', updated_at: new Date().toISOString() }).eq('id', a.id).then(function (r) {
        if (r.error) toast('Erreur : ' + r.error.message); else { toast(b.dataset.a === 'publier' ? '🌐 Article publié' : 'Article dépublié'); chargerArticles(); }
      });
    });
    $('art-traduire').addEventListener('click', function () {
      var b = this; b.disabled = true; b.textContent = '🌐 Traduction…';
      Promise.all([traduire($('art-titre').value), traduire($('art-resume').value), traduire($('art-contenu').value)]).then(function (x) {
        $('art-titre-en').value = x[0].trim(); $('art-resume-en').value = x[1].trim(); $('art-contenu-en').value = x[2].trim();
        b.disabled = false; b.textContent = '🌐 Traduire automatiquement en anglais'; toast('Traduction ajoutée : jette un œil avant d\'enregistrer');
      }, function () { b.disabled = false; b.textContent = '🌐 Traduire automatiquement en anglais'; toast('Traduction impossible pour le moment'); });
    });
    $('art-voir').addEventListener('click', function () {
      var ap = $('art-apercu'); ap.hidden = false;
      ap.innerHTML = '<h2>' + esc($('art-titre').value) + '</h2>' + (window.SereBlogue ? SereBlogue.rendre($('art-contenu').value) : esc($('art-contenu').value));
    });
    $('art-annuler').addEventListener('click', function () { $('form-art').hidden = true; artEdit = null; });
    $('form-art').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = { titre: $('art-titre').value.trim(), slug: slug($('art-slug').value || $('art-titre').value), date_publication: $('art-date').value, image: $('art-image').value.trim() || null,
        resume: $('art-resume').value.trim() || null, contenu: $('art-contenu').value.trim(), titre_en: $('art-titre-en').value.trim() || null,
        resume_en: $('art-resume-en').value.trim() || null, contenu_en: $('art-contenu-en').value.trim() || null, updated_at: new Date().toISOString() };
      if (d.slug.length < 3) { toast('Titre trop court'); return; }
      if (d.image && !/^(\/[\w\-\/.]+|https:\/\/[^\s"'<>]+)$/.test(d.image)) { toast('Image : un chemin comme /bebe.jpg ou une adresse https://'); return; }
      var req = artEdit ? sb.from('articles').update(d).eq('id', artEdit.id) : sb.from('articles').insert(d);
      req.then(function (r) {
        if (r.error) { toast(/duplicate|unique/i.test(r.error.message) ? 'Un autre article a déjà cette adresse : change le titre ou l\'adresse.' : 'Erreur : ' + r.error.message); return; }
        toast('💾 Article enregistré' + (artEdit && artEdit.publie ? ' (déjà publié : la mise à jour est en ligne)' : ' en brouillon : clique « Publier » quand il est prêt'));
        $('form-art').hidden = true; artEdit = null; chargerArticles();
      });
    });
  }

  var branche = false;
  function init(o) { sb = o.sb; toast = o.toast; traduire = o.traduire; css(); }
  function brancherUneFois() {
    if (branche) return; branche = true;
    if ($('ap-mes-filtres')) brancherMes();
    if ($('ap-tem')) brancherTemoignages();
    if ($('ap-art')) brancherBlogue();
  }
  function evaluations() { brancherUneFois(); chargerMes(); chargerQuestionnaires(); chargerEntentes(); }
  function outils() { brancherUneFois(); chargerTemoignages(); chargerArticles(); }
  function compter() {
    sb.from('mises_en_situation').select('id').eq('type', 'examen').eq('statut', 'a_valider').then(function (r) {
      var n = ((r && r.data) || []).length, s = document.querySelector('.onglets-bas button[data-v="evaluations"] .compteur');
      if (s) { s.textContent = n; s.hidden = !n; }
    });
  }
  window.SereAdminPlus = { init: init, evaluations: evaluations, outils: outils, compter: compter };
})();
