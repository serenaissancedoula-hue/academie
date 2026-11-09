/* Académie Sérénaissance — admin : cohortes de la formation en visio.
   SereAdminVisio.init({ sb, toast })  → ajoute la carte « Formation en visio : cohortes, cahiers et quiz » dans l'onglet Outils
   SereAdminVisio.charger()            → recharge (appelée à l'ouverture de l'onglet Outils)
   Une seule source pour les dates : modifie une date ici et l'ouverture des cahiers et des quiz suit toute seule.
   Les étudiantes déjà terminées gardent leur cohorte (et leur accès pendant « mois d'accès ») ; une nouvelle cohorte n'y touche pas. */
(function () {
  'use strict';
  var V = { travaux: [], sb: null, toast: function (m) { alert(m); }, pret: false, cohortes: [], jours: [], liens: [], etu: [], res: [], quiz: [] };
  function $(id) { return document.getElementById(id); }
  function esc(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
  function dh(d) { try { return new Date(d).toLocaleString('fr-CA', { timeZone: 'America/Moncton', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }

  function construire() {
    var ancre = $('carte-ateliers'); if (!ancre || $('carte-visio-admin')) return;
    var c = document.createElement('div'); c.className = 'carte'; c.id = 'carte-visio-admin';
    c.innerHTML = '<h3 style="margin-bottom:6px;">🎥 Formation en visio · cohortes, cahiers et quiz</h3>' +
      '<p style="font-size:.8rem;color:var(--doux);margin-bottom:10px;">Chaque journée, le cahier et le texte à lire s\'ouvrent <b>24 h avant</b> le cours, puis le cahier de révision et le quiz à la <b>fin de la journée</b>. Change une date ici : tout se déplace automatiquement. Une nouvelle cohorte ne ferme jamais l\'accès des étudiantes d\'une cohorte précédente.</p>' +
      '<div id="vv-cohortes">Chargement…</div>' +
      '<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">➕ Créer une nouvelle cohorte</summary><form id="vv-nouvelle" style="display:flex;flex-direction:column;gap:8px;margin-top:10px">' +
      '<label class="champ">Nom<input id="vv-nom" maxlength="80" placeholder="Ex. Cohorte visio · avril 2027"></label>' +
      '<label class="champ">Mois d\'accès après le dernier jour<input id="vv-mois" type="number" min="0" max="60" value="12"></label>' +
      '<div class="champ">Les 14 journées + l\'examen (jour 15) : <span style="font-weight:400">choisis les dates</span><div id="vv-dates-nouvelle" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;margin-top:6px"></div></div>' +
      '<button class="btn" type="submit">Créer la cohorte</button></form></details>' +
      '<h4 style="margin:16px 0 6px">Étudiantes en visio</h4><div id="vv-etudiantes"></div>' +
      '<h4 style="margin:16px 0 6px">Résultats des quiz</h4><div id="vv-resultats"></div>' +
      '<h4 style="margin:16px 0 6px">Notes d\'étude (études de cas et journal)</h4><p style="font-size:.78rem;color:var(--doux);margin-bottom:6px">Elles ne comptent pas dans l\'examen final : elles servent au mentorat. Le journal reste confidentiel (on voit seulement qu\'il est fait).</p><div id="vv-travaux"></div>';
    ancre.insertAdjacentElement('afterend', c);
    if (window.SereRepliable) SereRepliable.appliquer('#carte-visio-admin');
    var h = ''; for (var i = 1; i <= 15; i++) h += '<label style="font-size:.78rem">' + (i === 15 ? 'Examen (jour 15)' : 'Jour ' + i) + '<input type="date" data-j="' + i + '" style="width:100%"></label>';
    $('vv-dates-nouvelle').innerHTML = h;
    $('vv-nouvelle').addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = $('vv-nom').value.trim(); if (!nom) { V.toast('Écris le nom de la cohorte.'); return; }
      var dates = []; $('vv-dates-nouvelle').querySelectorAll('input').forEach(function (x) { dates.push({ jour: +x.dataset.j, date: x.value }); });
      if (dates.some(function (d) { return !d.date; })) { V.toast('Choisis les 15 dates (tu pourras les modifier ensuite).'); return; }
      V.sb.from('cohortes_visio').insert({ nom: nom, acces_mois: +$('vv-mois').value || 12, ouverte: false }).select().single().then(function (r) {
        if (r.error) { V.toast('Erreur : ' + r.error.message); return; }
        V.sb.from('jours_visio').insert(dates.map(function (d) { return { cohorte_id: r.data.id, jour: d.jour, date_cours: d.date }; })).then(function (r2) {
          if (r2.error) { V.toast('Erreur : ' + r2.error.message); return; }
          V.toast('Cohorte créée. Active « Ouverte aux nouvelles inscriptions » quand tu veux y inscrire les nouvelles étudiantes.'); $('vv-nom').value = ''; charger();
        });
      });
    });
  }

  function charger() {
    if (!V.sb) return; construire();
    Promise.all([
      V.sb.from('cohortes_visio').select('*').order('cree_le'),
      V.sb.from('jours_visio').select('*').order('jour'),
      V.sb.from('cohorte_etudiantes').select('*'),
      V.sb.from('etudiantes').select('prenom,nom,courriel,statut,option_paiement,suspendu').like('option_paiement', 'doula-%v').order('created_at', { ascending: false }),
      V.sb.from('resultats_visio').select('*').order('cree_le', { ascending: false }).limit(500),
      V.sb.from('quiz_visio').select('*').order('jour').order('ordre'),
      V.sb.rpc('visio_travaux_admin')
    ]).then(function (r) {
      V.travaux = (r[6] && r[6].data) || [];
      V.cohortes = r[0].data || []; V.jours = r[1].data || []; V.liens = r[2].data || []; V.etu = r[3].data || []; V.res = r[4].data || []; V.quiz = r[5].data || [];
      if (r[0].error) { $('vv-cohortes').textContent = 'Erreur : ' + r[0].error.message; return; }
      dessinerCohortes(); dessinerEtudiantes(); dessinerResultats(); dessinerTravaux();
    });
  }

  function dessinerCohortes() {
    var el = $('vv-cohortes');
    if (!V.cohortes.length) { el.innerHTML = '<p class="vide">Aucune cohorte pour le moment.</p>'; return; }
    el.innerHTML = V.cohortes.map(function (c) {
      var js = V.jours.filter(function (j) { return j.cohorte_id === c.id; });
      var n = V.liens.filter(function (l) { return l.cohorte_id === c.id; }).length;
      return '<details class="vv-coh" data-id="' + c.id + '" style="border:1px solid var(--bord);border-radius:12px;padding:10px 12px;margin-bottom:8px;background:#fff"><summary style="cursor:pointer"><b>' + esc(c.nom) + '</b> · ' + n + ' étudiante(s)' + (c.ouverte ? ' · <span style="color:var(--vert);font-weight:700">ouverte aux nouvelles inscriptions</span>' : '') + '</summary>' +
        '<div style="display:flex;gap:14px;flex-wrap:wrap;margin:10px 0;align-items:center"><label style="font-size:.85rem"><input type="checkbox" class="vv-ouverte"' + (c.ouverte ? ' checked' : '') + '> Ouverte aux nouvelles inscriptions</label>' +
        '<label style="font-size:.85rem">Mois d\'accès après le dernier jour <input type="number" class="vv-mois" min="0" max="60" value="' + c.acces_mois + '" style="width:70px"></label></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">' + js.map(function (j) {
          return '<div style="font-size:.8rem"><b>' + (j.jour === 15 ? 'Examen · jour 15' : 'Jour ' + j.jour) + '</b><br><input type="date" class="vv-date" data-j="' + j.jour + '" value="' + j.date_cours + '"> ' +
            '<input type="time" class="vv-debut" data-j="' + j.jour + '" value="' + String(j.debut).slice(0, 5) + '" style="width:92px"> – <input type="time" class="vv-fin" data-j="' + j.jour + '" value="' + String(j.fin).slice(0, 5) + '" style="width:92px"></div>';
        }).join('') + '</div><p style="font-size:.76rem;color:var(--doux);margin-top:8px">Si tu repousses une date, les documents de cette journée se referment tant que la nouvelle heure n\'est pas arrivée (sauf pour les étudiantes qui les ont déjà ouverts).</p></details>';
    }).join('');
    el.querySelectorAll('.vv-coh').forEach(function (d) {
      var id = d.dataset.id;
      d.querySelector('.vv-ouverte').onchange = function (e) {
        V.sb.from('cohortes_visio').update({ ouverte: e.target.checked }).eq('id', id).then(function (r) { V.toast(r.error ? 'Erreur : ' + r.error.message : (e.target.checked ? 'Les nouvelles inscrites iront dans cette cohorte.' : 'Cohorte fermée aux nouvelles inscriptions.')); charger(); });
      };
      d.querySelector('.vv-mois').onchange = function (e) {
        V.sb.from('cohortes_visio').update({ acces_mois: Math.max(0, +e.target.value || 0) }).eq('id', id).then(function (r) { V.toast(r.error ? 'Erreur : ' + r.error.message : 'Durée d\'accès enregistrée.'); });
      };
      function sauver(sel, champ) {
        d.querySelectorAll(sel).forEach(function (inp) {
          inp.onchange = function () {
            if (!inp.value) return; var o = {}; o[champ] = inp.value;
            V.sb.from('jours_visio').update(o).eq('cohorte_id', id).eq('jour', +inp.dataset.j).then(function (r) { V.toast(r.error ? 'Erreur : ' + r.error.message : '✓ Jour ' + inp.dataset.j + ' mis à jour : l\'ouverture suit automatiquement.'); });
          };
        });
      }
      sauver('.vv-date', 'date_cours'); sauver('.vv-debut', 'debut'); sauver('.vv-fin', 'fin');
    });
  }

  function dessinerEtudiantes() {
    var el = $('vv-etudiantes');
    var l = V.etu.filter(function (e) { return (e.statut || '').trim().toLowerCase() === 'doula_valide'; });
    if (!l.length) { el.innerHTML = '<p class="vide">Aucune étudiante en visio validée pour le moment. Elles arrivent ici automatiquement après leur paiement.</p>'; return; }
    el.innerHTML = '<table style="width:100%;font-size:.84rem;border-collapse:collapse">' + l.map(function (e) {
      var lien = V.liens.filter(function (x) { return x.courriel === String(e.courriel || '').toLowerCase(); })[0];
      return '<tr style="border-bottom:1px solid var(--bord)"><td style="padding:6px 4px">' + esc((e.prenom || '') + ' ' + (e.nom || '')) + '<br><span style="color:var(--doux);font-size:.76rem">' + esc(e.courriel) + '</span></td><td><select class="vv-coh-sel" data-c="' + esc(String(e.courriel || '').toLowerCase()) + '"><option value="">— aucune cohorte —</option>' +
        V.cohortes.map(function (c) { return '<option value="' + c.id + '"' + (lien && lien.cohorte_id === c.id ? ' selected' : '') + '>' + esc(c.nom) + '</option>'; }).join('') + '</select></td></tr>';
    }).join('') + '</table>';
    el.querySelectorAll('.vv-coh-sel').forEach(function (s) {
      s.onchange = function () {
        var req = s.value ? V.sb.from('cohorte_etudiantes').upsert({ courriel: s.dataset.c, cohorte_id: s.value }) : V.sb.from('cohorte_etudiantes').delete().eq('courriel', s.dataset.c);
        req.then(function (r) { V.toast(r.error ? 'Erreur : ' + r.error.message : '✓ Cohorte enregistrée'); charger(); });
      };
    });
  }

  function dessinerResultats() {
    var el = $('vv-resultats');
    var nomC = {}; V.cohortes.forEach(function (c) { nomC[c.id] = c.nom; });
    var qs = {}; V.quiz.forEach(function (q) { qs[q.id] = q; });
    var banque = '<details style="margin-top:10px"><summary style="cursor:pointer;font-weight:700">📚 Voir les questions et les bonnes réponses de chaque journée</summary>' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(function (j) {
        var l = V.quiz.filter(function (q) { return q.jour === j; }); if (!l.length) return '';
        return '<details style="margin:6px 0 0 10px"><summary>Jour ' + j + ' · ' + l.length + ' questions</summary><ol style="font-size:.82rem;padding-left:20px">' + l.map(function (q) {
          return '<li style="margin:6px 0">' + esc(q.question) + '<ul style="margin:2px 0 0;padding-left:16px">' + q.choix.map(function (c, i) { return '<li' + (i === q.bonne ? ' style="color:var(--vert);font-weight:700"' : '') + '>' + esc(c) + (i === q.bonne ? ' ✓' : '') + '</li>'; }).join('') + '</ul></li>';
        }).join('') + '</ol></details>';
      }).join('') + '</details>';
    if (!V.res.length) { el.innerHTML = '<p class="vide">Aucun quiz fait pour le moment.</p>' + banque; return; }
    el.innerHTML = '<div style="overflow:auto"><table style="width:100%;font-size:.82rem;border-collapse:collapse"><tr style="text-align:left"><th>Étudiante</th><th>Cohorte</th><th>Jour</th><th>Note</th><th>Quand</th><th></th></tr>' +
      V.res.map(function (r, i) {
        var pct = r.total ? Math.round(100 * r.score / r.total) : 0;
        return '<tr style="border-top:1px solid var(--bord)"><td style="padding:5px 4px">' + esc(r.nom || r.courriel) + '</td><td>' + esc(nomC[r.cohorte_id] || '') + '</td><td>' + r.jour + '</td><td><b style="color:' + (pct >= 80 ? 'var(--vert)' : pct >= 60 ? 'var(--jaune)' : 'var(--rouge)') + '">' + r.score + ' / ' + r.total + '</b></td><td>' + esc(dh(r.cree_le)) + '</td><td><button class="btn" style="padding:4px 10px;font-size:.74rem" data-i="' + i + '">Détails</button></td></tr>';
      }).join('') + '</table></div>' + banque;
    el.querySelectorAll('button[data-i]').forEach(function (b) {
      b.onclick = function () {
        var r = V.res[+b.dataset.i]; var rep = r.reponses || {};
        var lignes = V.quiz.filter(function (q) { return q.jour === r.jour; }).map(function (q) {
          var ch = rep[q.id]; var ok = ch === q.bonne;
          return '<div style="margin:0 0 10px"><b>' + esc(q.question) + '</b><br><span style="color:' + (ok ? 'var(--vert)' : 'var(--rouge)') + '">Réponse de l\'étudiante : ' + (ch == null ? '(aucune)' : esc(q.choix[ch])) + (ok ? ' ✓' : ' ✗') + '</span>' + (ok ? '' : '<br><span style="color:var(--vert)">Bonne réponse : ' + esc(q.choix[q.bonne]) + '</span>') + '</div>';
        }).join('');
        var v = document.createElement('div'); v.style.cssText = 'position:fixed;inset:0;background:rgba(40,28,22,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:12px';
        v.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:720px;width:100%;max-height:90vh;overflow:auto;padding:18px;font-size:.88rem"><div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:10px"><b>' + esc(r.nom || r.courriel) + ' · Jour ' + r.jour + ' · ' + r.score + '/' + r.total + '</b><button class="btn" id="vv-x">Fermer</button></div>' + lignes + '</div>';
        document.body.appendChild(v); v.querySelector('#vv-x').onclick = function () { v.remove(); };
      };
    });
  }

  function dessinerTravaux() {
    var el = $('vv-travaux'); if (!el) return;
    var nomC = {}; V.cohortes.forEach(function (c) { nomC[c.id] = c.nom; });
    if (!V.travaux.length) { el.innerHTML = '<p class="vide">Aucune note d\'étude pour le moment.</p>'; return; }
    var NOMS = { cas1: 'Étude de cas 1', cas2: 'Étude de cas 2', journal: 'Journal' };
    el.innerHTML = '<div style="overflow:auto"><table style="width:100%;font-size:.82rem;border-collapse:collapse"><tr style="text-align:left"><th>Étudiante</th><th>Jour</th><th>Travail</th><th>Mots</th><th>Modifié</th><th></th></tr>' +
      V.travaux.map(function (t, i) {
        return '<tr style="border-top:1px solid var(--bord)"><td style="padding:5px 4px">' + esc(t.nom || t.courriel) + '</td><td>' + t.jour + '</td><td>' + NOMS[t.type] + '</td><td>' + (t.mots || 0) + '</td><td>' + esc(dh(t.maj)) + '</td><td>' +
          (t.type === 'journal' ? (t.mots > 0 ? '<span style="color:var(--vert);font-weight:700">✓ fait</span>' : '<span style="color:var(--doux)">vide</span>') : '<button class="btn" style="padding:4px 10px;font-size:.74rem" data-t="' + i + '">Lire</button>') + '</td></tr>';
      }).join('') + '</table></div>';
    el.querySelectorAll('button[data-t]').forEach(function (b) {
      b.onclick = function () {
        var t = V.travaux[+b.dataset.t];
        var v = document.createElement('div'); v.style.cssText = 'position:fixed;inset:0;background:rgba(40,28,22,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:12px';
        v.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:720px;width:100%;max-height:90vh;overflow:auto;padding:18px;font-size:.9rem"><div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:10px"><b>' + esc(t.nom || t.courriel) + ' · Jour ' + t.jour + ' · ' + NOMS[t.type] + '</b><button class="btn" id="vv-x2">Fermer</button></div><div style="white-space:pre-wrap">' + esc(t.texte || '') + '</div></div>';
        document.body.appendChild(v); v.querySelector('#vv-x2').onclick = function () { v.remove(); };
      };
    });
  }

  function init(o) { V.sb = o.sb; if (o.toast) V.toast = o.toast; V.pret = true; }
  window.SereAdminVisio = { init: init, charger: charger };
})();
