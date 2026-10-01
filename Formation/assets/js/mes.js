/* =========================================================
   Académie Sérénaissance — Mises en situation à réponse écrite
   - Examens (examen de module et grand examen final) : des mises en situation tirées au hasard
     pour chaque étudiante (différentes d'une étudiante et d'une tentative à l'autre), réponses écrites,
     correction automatique à la validation (plusieurs réponses acceptées par idée attendue),
     puis révision et validation par Sabrina (Mon compte → Mes évaluations ; admin → Mises en situation).
   - Chapitres : chaque « Étude de cas » devient interactive : l'étudiante écrit ses réponses,
     valide, reçoit la correction automatique et voit ensuite les éléments de corrigé.

   Données (chiffrées comme les autres banques) :
     window.MES_DATA = [{ id, c, titre, situation, questions: [{ q, criteres: [{ idee, pts, mots: [...] }], modele }] }]
     window.CAS_DATA = { '<id de la section .card.case>': [ { criteres: [...] }, ... une entrée par question ] }
   Règles des « mots » acceptés (sans tenir compte des majuscules ni des accents) :
     « appeler 911 »  → l'expression doit apparaître telle quelle
     « allait* »      → tout mot qui commence par « allait » (allaiter, allaitement…)
     « sage-femme|sage femme » → l'une ou l'autre
     « consentement+ecrit* » → les deux parties doivent apparaître, dans n'importe quel ordre
   ========================================================= */
(function () {
  'use strict';
  var EN = location.pathname.indexOf('/Formation/en/') >= 0;
  function L(fr, en) { return EN ? en : fr; }
  var SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co';
  var SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
  var SB_JETON = 'sb-zeptirfcwstufcpgvkzx-auth-token';
  var FILE = 'mes-a-envoyer';
  var MIN_MOTS = 4;

  /* ---------- outils ---------- */
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function norm(t) {
    return ' ' + String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[’'`]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  }
  function nbMots(t) { return norm(t).trim().split(' ').filter(Boolean).length; }
  function partieTrouvee(texteN, partie) {
    var p = norm(partie).trim(); if (!p) return false;
    // « mot* » : le dernier mot peut se prolonger (allait* → allaitement) ; sinon l'expression doit être entière
    return /\*\s*$/.test(partie) ? texteN.indexOf(' ' + p) >= 0 : texteN.indexOf(' ' + p + ' ') >= 0;
  }
  function expressionTrouvee(texteN, expr) {
    return String(expr).split('|').some(function (alt) {
      return alt.split('+').every(function (partie) { return partieTrouvee(texteN, partie); });
    });
  }
  function corrigerReponse(reponse, criteres) {
    var t = norm(reponse), assez = nbMots(reponse) >= MIN_MOTS, pts = 0, max = 0;
    var det = (criteres || []).map(function (c) {
      var p = +c.pts || 1; max += p;
      var ok = assez && (c.mots || []).some(function (m) { return expressionTrouvee(t, m); });
      if (ok) pts += p;
      return { idee: c.idee, ok: ok, pts: p };
    });
    return { pts: pts, max: max, criteres: det, tropCourt: !assez };
  }
  // hasard reproductible : même étudiante + même tentative = même tirage
  function graine(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hasard(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function melanger(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function lire(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function session() { try { return JSON.parse(sessionStorage.getItem(SB_JETON)); } catch (e) { return null; } }

  /* ---------- envoi à l'Académie (file d'attente si hors ligne) ---------- */
  function envoyerFile() {
    var file = lire(FILE) || [];
    if (!file.length) return;
    var s = session();
    if (!s || !s.access_token || !s.user) return;
    var lignes = file.map(function (r) { r.user_id = s.user.id; r.courriel = s.user.email; return r; });
    fetch(SB_URL + '/rest/v1/mises_en_situation', {
      method: 'POST',
      headers: { 'apikey': SB_CLE, 'Authorization': 'Bearer ' + s.access_token, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(lignes)
    }).then(function (r) { if (r.ok) ecrire(FILE, []); }).catch(function () {});
  }
  function enregistrer(lignes) { var f = (lire(FILE) || []).concat(lignes); ecrire(FILE, f.slice(-60)); envoyerFile(); }

  /* ---------- styles ---------- */
  function css() {
    if (document.getElementById('style-mes')) return;
    var s = el('style'); s.id = 'style-mes';
    s.textContent =
      '.mes-bloc{margin:28px 0 18px}.mes-bloc>h2{font-family:Fraunces,Georgia,serif;font-size:1.35rem;margin:0 0 6px}' +
      '.mes-intro{color:var(--muted,#6b5d55);font-size:14.5px;line-height:1.6;margin:0 0 14px}' +
      '.mes-carte{background:var(--surface,#fff);border:1px solid var(--line,#e6dcd2);border-left:4px solid var(--accent,#b4654a);border-radius:14px;padding:18px 18px 14px;margin:0 0 16px}' +
      '.mes-carte.missing{border-color:#c0392b;box-shadow:0 0 0 2px rgba(192,57,43,.15)}' +
      '.mes-tag{font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:var(--accent-dark,#97503a)}' +
      '.mes-carte h3{margin:4px 0 8px;font-size:1.08rem}.mes-situation{background:var(--accent-soft,#f6e7df);border-radius:10px;padding:12px 14px;line-height:1.65;font-size:15px;margin:0 0 12px}' +
      '.mes-q{margin:12px 0 4px;font-weight:600;line-height:1.5}' +
      '.mes-rep{width:100%;box-sizing:border-box;min-height:96px;border:1px solid var(--line,#d9cbbd);border-radius:10px;padding:10px 12px;font:inherit;font-size:15px;line-height:1.55;resize:vertical;background:#fffdfb}' +
      '.mes-rep:focus{outline:2px solid var(--accent,#b4654a);outline-offset:1px}.mes-rep[readonly]{background:#f8f4f0}' +
      '.mes-compte{font-size:12px;color:var(--muted,#7a6a60);text-align:right;margin-top:2px}' +
      '.mes-correction{margin:8px 0 2px;padding:10px 12px;border-radius:10px;background:#f7f3ee;font-size:14px;line-height:1.55}' +
      '.mes-correction b.note{display:inline-block;margin-bottom:4px}.mes-correction ul{margin:4px 0 0;padding-left:0;list-style:none}' +
      '.mes-correction li{margin:2px 0}.mes-correction .ok{color:#3f7a57}.mes-correction .ko{color:#a5482f}' +
      '.mes-modele{margin-top:8px;border-top:1px dashed #d9cbbd;padding-top:8px}.mes-attente{font-size:13.5px;color:#7a5a20;background:#fff6e0;border-radius:10px;padding:10px 12px;margin-top:10px}' +
      '.mes-valider{margin-top:10px}.mes-msg{font-size:14px;color:#a5482f;margin-top:6px}';
    document.head.appendChild(s);
  }

  function zoneReponse(parent, valeur, place) {
    var ta = el('textarea', 'mes-rep'); ta.rows = 4; ta.maxLength = 3000;
    ta.placeholder = place || L('Écris ta réponse ici, avec tes mots…', 'Write your answer here, in your own words…');
    ta.setAttribute('autocomplete', 'off'); ta.setAttribute('spellcheck', 'true');
    if (valeur) ta.value = valeur;
    var cpt = el('div', 'mes-compte');
    function maj() { var n = nbMots(ta.value); cpt.textContent = n + ' ' + L(n > 1 ? 'mots' : 'mot', n === 1 ? 'word' : 'words'); }
    ta.addEventListener('input', maj); maj();
    ['paste', 'drop'].forEach(function (ev) { ta.addEventListener(ev, function (e) { if (ta.dataset.collerOk) return; e.preventDefault(); afficherMsg(ta, L('Écris ta réponse toi-même : le copier-coller est désactivé dans les évaluations.', 'Please type your own answer: pasting is turned off in evaluations.')); }); });
    parent.appendChild(ta); parent.appendChild(cpt);
    return ta;
  }
  function afficherMsg(apres, txt) {
    var m = apres.parentNode.querySelector('.mes-msg') || el('div', 'mes-msg');
    m.textContent = txt; apres.parentNode.insertBefore(m, apres.nextSibling.nextSibling || null);
    setTimeout(function () { if (m.parentNode) m.remove(); }, 5000);
  }
  function blocCorrection(c, modele) {
    var d = el('div', 'mes-correction');
    var html = '<b class="note">' + L('Correction automatique : ', 'Automatic marking: ') + c.pts + ' / ' + c.max + '</b>';
    if (c.tropCourt) html += '<div class="ko">' + L('Réponse trop courte pour être évaluée (au moins ' + MIN_MOTS + ' mots).', 'Answer too short to be marked (at least ' + MIN_MOTS + ' words).') + '</div>';
    html += '<ul>' + c.criteres.map(function (x) {
      return '<li class="' + (x.ok ? 'ok' : 'ko') + '">' + (x.ok ? '✓ ' : '✗ ') + esc(x.idee) + ' <small>(' + x.pts + ' pt' + (x.pts > 1 ? 's' : '') + ')</small></li>';
    }).join('') + '</ul>';
    if (modele) html += '<div class="mes-modele"><b>' + L('Exemple de réponse complète : ', 'Example of a complete answer: ') + '</b>' + esc(modele) + '</div>';
    d.innerHTML = html;
    return d;
  }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------- 1) Mises en situation dans les examens ---------- */
  function examen() {
    var banque = window.MES_DATA;
    var box = document.getElementById('exam') || document.getElementById('final');
    if (!box || !banque || !banque.length) return;
    var bar = box.querySelector('.exam-bar'); if (!bar) return;
    var submit = bar.querySelector('button'); if (!submit) return;
    css(); envoyerFile();
    var CONF = window.MODULE_CONF || null;
    var finale = !CONF;
    var module = finale ? 'final' : 'module-' + CONF.num;
    var evaluation = finale ? L('Grand examen final', 'Final exam') : L('Examen du module ' + CONF.num, 'Module ' + CONF.num + ' exam');
    var nombre = finale ? 4 : 2;
    var cleT = 'mes:' + module + ':tentative', tentative = (lire(cleT) || 0) + 1;
    var s = session(), uid = s && s.user ? s.user.id : 'anonyme';
    var r = hasard(graine(uid + '|' + module + '|' + tentative));
    // tirage : on évite deux mises en situation du même chapitre (ou du même module pour l'examen final)
    var choisis = [], vus = {};
    melanger(banque, r).forEach(function (sc) { var k = sc.c || sc.m || sc.id; if (choisis.length < nombre && !vus[k]) { vus[k] = 1; choisis.push(sc); } });
    melanger(banque, r).forEach(function (sc) { if (choisis.length < nombre && choisis.indexOf(sc) < 0) choisis.push(sc); });

    var sec = el('section', 'mes-bloc');
    sec.appendChild(el('h2', null, L('Mises en situation', 'Case scenarios')));
    sec.appendChild(el('p', 'mes-intro', L(
      'Réponds par écrit, avec tes propres mots, comme si tu étais sur le terrain. Tes réponses sont corrigées automatiquement quand tu valides l\'examen (plusieurs formulations sont acceptées), puis Sabrina les révise et confirme ta note. Ces mises en situation sont choisies au hasard pour toi : elles ne sont pas les mêmes pour toutes les étudiantes.',
      'Answer in writing, in your own words, as if you were in the field. Your answers are marked automatically when you submit the exam (several ways of saying it are accepted), then Sabrina reviews them and confirms your mark. These scenarios are picked at random for you: they are not the same for every student.')));
    var items = [];
    choisis.forEach(function (sc, n) {
      var carte = el('div', 'mes-carte');
      carte.appendChild(el('div', 'mes-tag', L('Mise en situation ', 'Case scenario ') + (n + 1) + ' / ' + choisis.length + (sc.c ? ' · ' + L('chapitre ', 'chapter ') + sc.c : (sc.m ? ' · module ' + sc.m : ''))));
      carte.appendChild(el('h3', null, sc.titre));
      carte.appendChild(el('div', 'mes-situation', sc.situation));
      var qs = (sc.questions || []).map(function (q, i) {
        carte.appendChild(el('p', 'mes-q', (sc.questions.length > 1 ? (i + 1) + '. ' : '') + q.q));
        var ta = zoneReponse(carte);
        ta.addEventListener('input', function () { carte.classList.remove('missing'); });
        return { q: q, ta: ta };
      });
      items.push({ sc: sc, carte: carte, qs: qs });
      sec.appendChild(carte);
    });
    box.insertBefore(sec, bar);

    function manquantes() { return items.filter(function (it) { return it.qs.some(function (x) { return nbMots(x.ta.value) < MIN_MOTS; }); }); }
    bar.addEventListener('click', function (e) {
      if (!e.target.closest('button') || e.target.closest('button') !== submit) return;
      var m = manquantes();
      if (m.length) {
        e.stopPropagation(); e.preventDefault();
        m.forEach(function (it) { it.carte.classList.add('missing'); });
        m[0].carte.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var c = bar.querySelector('.count');
        if (c) c.textContent = L('Réponds à toutes les mises en situation (au moins ' + MIN_MOTS + ' mots par réponse)', 'Answer every case scenario (at least ' + MIN_MOTS + ' words per answer)');
        return;
      }
      setTimeout(function () { if (bar.style.display === 'none') corriger(); }, 0);
    }, true);

    function corriger() {
      ecrire(cleT, tentative);
      var totP = 0, totM = 0, lignes = [];
      items.forEach(function (it) {
        var pts = 0, max = 0, rep = [];
        it.qs.forEach(function (x) {
          var c = corrigerReponse(x.ta.value, x.q.criteres);
          x.ta.readOnly = true; x.ta.dataset.collerOk = '1';
          x.ta.parentNode.insertBefore(blocCorrection(c, x.q.modele), x.ta.nextSibling.nextSibling);
          pts += c.pts; max += c.max;
          rep.push({ q: x.q.q, reponse: x.ta.value.trim().slice(0, 3000), pts: c.pts, max: c.max, criteres: c.criteres.map(function (k) { return { idee: k.idee, ok: k.ok, pts: k.pts }; }) });
        });
        totP += pts; totM += max;
        var att = el('div', 'mes-attente', L('⏳ En attente de la validation de Sabrina. Sa note finale et son commentaire apparaîtront dans Mon compte → Mes évaluations.', '⏳ Waiting for Sabrina\'s review. Her final mark and comment will appear in My account → My evaluations.'));
        it.carte.appendChild(att);
        lignes.push({ formation: '4e-trimestre', module: module, evaluation: evaluation, type: 'examen', scenario_id: it.sc.id, titre: it.sc.titre,
          situation: String(it.sc.situation).slice(0, 4000), reponses: rep, score_auto: pts, total: max, langue: EN ? 'en' : 'fr', tentative: tentative });
      });
      enregistrer(lignes);
      var res = box.querySelector('.result.show');
      if (res) {
        var p = el('p', null);
        p.innerHTML = '<strong>' + L('Mises en situation : ', 'Case scenarios: ') + totP + ' / ' + totM + ' (' + Math.round(totP / Math.max(1, totM) * 100) + ' %)</strong> — ' +
          L('correction automatique, à confirmer par Sabrina. Relis la correction sous chaque mise en situation.', 'automatic marking, to be confirmed by Sabrina. Read the feedback under each case scenario.');
        var act = res.querySelector('.actions'); res.insertBefore(p, act || null);
      }
    }
  }

  /* ---------- 2) Études de cas interactives dans les chapitres ---------- */
  function etudesDeCas() {
    var cartes = document.querySelectorAll('.card.case');
    if (!cartes.length) return;
    css(); envoyerFile();
    var data = window.CAS_DATA || {};
    var CONF = window.MODULE_CONF || {};
    cartes.forEach(function (carte) {
      var id = carte.id, corps = carte.querySelector('.card-body') || carte;
      var liste = corps.querySelector('ol.steps');
      var corrige = corps.querySelector('details.corrige');
      if (!liste || !id) return;
      var lis = Array.prototype.slice.call(liste.children).filter(function (x) { return x.tagName === 'LI'; });
      if (!lis.length) return;
      var cle = 'cas:' + id, memo = lire(cle) || {};
      var crit = data[id] || [];
      if (corrige && !memo.fait) corrige.hidden = true;
      var tas = lis.map(function (li, i) {
        var zone = el('div'); zone.style.margin = '8px 0 4px';
        var ta = zoneReponse(zone, (memo.rep || [])[i], L('Ta réponse…', 'Your answer…'));
        ta.dataset.collerOk = '1'; ta.rows = 3;
        (li.querySelector('div') || li).appendChild(zone);
        return ta;
      });
      var btn = el('button', 'btn mes-valider', memo.fait ? L('Mettre à jour mes réponses', 'Update my answers') : L('Valider mes réponses', 'Submit my answers'));
      btn.type = 'button';
      liste.parentNode.insertBefore(btn, corrige || liste.nextSibling);
      if (memo.fait) montrer(false);
      btn.addEventListener('click', function () {
        var vide = tas.filter(function (t) { return nbMots(t.value) < 3; });
        if (vide.length) { vide[0].focus(); afficherMsg(vide[0], L('Écris une réponse à chaque question (quelques mots au moins) avant de valider.', 'Write an answer to each question (at least a few words) before submitting.')); return; }
        montrer(true);
      });
      function montrer(envoyer) {
        carte.querySelectorAll('.mes-correction').forEach(function (x) { x.remove(); });
        var pts = 0, max = 0, rep = [];
        tas.forEach(function (ta, i) {
          var c = crit[i] && crit[i].criteres ? corrigerReponse(ta.value, crit[i].criteres) : null;
          if (c) { ta.parentNode.appendChild(blocCorrection(c, null)); pts += c.pts; max += c.max; }
          rep.push({ q: (lis[i].textContent || '').trim().slice(0, 600), reponse: ta.value.trim().slice(0, 3000), pts: c ? c.pts : null, max: c ? c.max : null,
            criteres: c ? c.criteres.map(function (k) { return { idee: k.idee, ok: k.ok, pts: k.pts }; }) : [] });
        });
        if (corrige) { corrige.hidden = false; if (envoyer) corrige.open = true; }
        btn.textContent = L('Mettre à jour mes réponses', 'Update my answers');
        ecrire(cle, { fait: true, rep: tas.map(function (t) { return t.value; }) });
        if (!envoyer) return;
        var titre = (carte.querySelector('h3') || {}).textContent || id;
        enregistrer([{ formation: '4e-trimestre', module: CONF.num ? 'module-' + CONF.num : null, evaluation: L('Étude de cas', 'Case study') + (CONF.num ? ' · module ' + CONF.num : ''),
          type: 'formatif', scenario_id: id, titre: titre.slice(0, 200), situation: ((corps.querySelector('p') || {}).textContent || '').slice(0, 4000),
          reponses: rep, score_auto: pts, total: max, langue: EN ? 'en' : 'fr', tentative: 1 }]);
        if (corrige) corrige.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  window.SereMES = { corrigerReponse: corrigerReponse, norm: norm };
  examen();
  etudesDeCas();
})();
