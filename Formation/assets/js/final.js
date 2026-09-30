(function () {
  'use strict';
  var PASS = 0.8, LETTERS = ['a', 'b', 'c', 'd'];
  var PREFIX = 'final:';
  /* ---------- 📊 Envoi des résultats à l'Académie (conservés dans Supabase) ---------- */
  var SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co';
  var SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
  var SB_JETON = 'sb-zeptirfcwstufcpgvkzx-auth-token';
  var FILE_ATTENTE = 'resultats-a-envoyer';
  var FORMATION = PREFIX === 'marraine:' ? 'marraine' : '4e-trimestre';

  function lireSession() {
    try { return JSON.parse(sessionStorage.getItem(SB_JETON)); } catch (e) { return null; }
  }
  function rafraichirSession(s) {
    if (!s || !s.refresh_token) return Promise.resolve(null);
    return fetch(SB_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'apikey': SB_CLE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (n) {
        if (!n || !n.access_token) return null;
        try { sessionStorage.setItem(SB_JETON, JSON.stringify(n)); } catch (e) {}
        return n;
      }).catch(function () { return null; });
  }
  function sessionValide() {
    var s = lireSession();
    if (!s || !s.access_token) return Promise.resolve(null);
    var expire = s.expires_at ? s.expires_at * 1000 : 0;
    if (expire && expire - Date.now() < 60000) return rafraichirSession(s);
    return Promise.resolve(s);
  }
  function lireFile() { try { return JSON.parse(localStorage.getItem(FILE_ATTENTE)) || []; } catch (e) { return []; } }
  function ecrireFile(f) { try { localStorage.setItem(FILE_ATTENTE, JSON.stringify(f.slice(-200))); } catch (e) {} }

  function envoyerFile() {
    var file = lireFile();
    if (!file.length) return;
    sessionValide().then(function (s) {
      if (!s || !s.user) return;             // pas connectée : on garde pour plus tard
      var lignes = file.map(function (r) { r.user_id = s.user.id; r.courriel = s.user.email; return r; });
      fetch(SB_URL + '/rest/v1/resultats', {
        method: 'POST',
        headers: { 'apikey': SB_CLE, 'Authorization': 'Bearer ' + s.access_token,
                   'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(lignes)
      }).then(function (r) { if (r.ok) ecrireFile([]); }).catch(function () {});
    });
  }
  function enregistrerResultat(evaluation, score, total, seuil) {
    var file = lireFile();
    file.push({
      formation: FORMATION, module: FORMATION === 'marraine' ? 'marraine' : 'examen-final',
      evaluation: evaluation, score: score, total: total,
      pourcentage: Math.round(score / total * 100), reussi: score / total >= seuil,
      created_at: new Date().toISOString()
    });
    ecrireFile(file);
    envoyerFile();
  }
  envoyerFile();   // envoie ce qui serait resté en attente
  function get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function ok(r) { return !!(r && r.score / r.total >= PASS); }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var box = document.getElementById('final');
  var missing = [1, 2, 3, 4, 5].filter(function (n) { return !ok(get('m' + n + ':score:exam')); });
  if (missing.length) {
    box.innerHTML = '<section class="lock-page"><img src="assets/img/cadenas.svg" alt="" width="96" height="96"><h1>Examen verrouillé</h1>' +
      '<p>Le grand examen final s\'ouvre lorsque les examens des cinq modules sont réussis. Il vous reste : Module ' + missing.join(', Module ') + '.</p>' +
      '<div class="actions"><a class="btn" href="module-' + missing[0] + '/index.html">Aller au Module ' + missing[0] + ' →</a><a class="btn-ghost" href="index.html">Accueil de la formation</a></div></section>';
    return;
  }
  // Relecture demandée après un échec : chapitres à relire dans les modules
  var relire = [];
  [1, 2, 3, 4, 5].forEach(function (n) { (get('m' + n + ':arelire') || []).forEach(function (c) { relire.push({ m: n, c: c }); }); });
  if (relire.length) {
    box.innerHTML = '<section class="lock-page"><img src="assets/img/cadenas.svg" alt="" width="96" height="96"><h1>Relecture avant la reprise</h1>' +
      '<p>Avant de repasser le grand examen final, relisez jusqu\'au bout ' + (relire.length > 1 ? 'les chapitres ' : 'le chapitre ') +
      relire.map(function (x) { return x.c; }).join(', ') + ' et cliquez sur « J\'ai terminé ma lecture » à la fin de chacun. La prochaine tentative comportera d\'autres questions.</p>' +
      '<div class="actions"><a class="btn" href="module-' + relire[0].m + '/chapitre-' + relire[0].c.replace('.', '-') + '.html">Relire le chapitre ' + relire[0].c + ' →</a><a class="btn-ghost" href="index.html">Accueil de la formation</a></div></section>';
    return;
  }
  var items = [];
  // Tirage : la moitié des questions de chaque module, en évitant celles de la tentative précédente
  var parMod = {}, vus = get('final:vues') || [], qs = [];
  window.FINAL_DATA.forEach(function (d) { (parMod[d.m] = parMod[d.m] || []).push(d); });
  Object.keys(parMod).sort().forEach(function (m) {
    var l = shuffle(parMod[m].slice());
    l.sort(function (a, b) { return (vus.indexOf(a.q) >= 0 ? 1 : 0) - (vus.indexOf(b.q) >= 0 ? 1 : 0); });
    qs = qs.concat(l.slice(0, Math.max(1, Math.round(l.length / 2))));
  });
  set('final:vues', qs.map(function (d) { return d.q; }));
  qs = shuffle(qs);
  qs.forEach(function (d, n) {
    var order = shuffle([0, 1, 2, 3]);
    var q = { o: order.map(function (k) { return d.o[k]; }), a: order.indexOf(0) };
    var card = el('div', 'q-card');
    var head = el('div', 'q-head');
    head.appendChild(el('span', 'q-num', 'Question ' + (n + 1) + ' / ' + qs.length));
    head.appendChild(el('span', 'q-src', 'Module ' + d.m));
    card.appendChild(head);
    card.appendChild(el('p', 'q-text', d.q));
    var opts = el('div', 'opts');
    q.o.forEach(function (t, i) {
      var b = el('button', 'opt'); b.type = 'button'; b.dataset.i = i;
      b.appendChild(el('span', 'letter', LETTERS[i])); b.appendChild(el('span', null, t));
      b.addEventListener('click', function () {
        opts.querySelectorAll('.opt').forEach(function (x) { x.classList.remove('selected'); });
        b.classList.add('selected'); it.choice = i; card.classList.remove('missing'); update();
      });
      opts.appendChild(b);
    });
    card.appendChild(opts);
    var fb = el('div', 'feedback'); card.appendChild(fb);
    var ex = el('p', 'explain', d.e); card.appendChild(ex);
    var it = { q: q, card: card, fb: fb, ex: ex, m: d.m, e: d.e || '', choice: null };
    items.push(it);
    box.appendChild(card);
  });
  var bar = el('div', 'exam-bar');
  bar.innerHTML = '<span class="count">0 / ' + items.length + ' répondues</span><div class="track"><i></i></div>';
  var submit = el('button', 'btn', 'Valider mes réponses'); submit.type = 'button'; bar.appendChild(submit);
  box.appendChild(bar);
  var res = el('div', 'result'); box.appendChild(res);
  function update() {
    var c = items.filter(function (x) { return x.choice !== null; }).length;
    bar.querySelector('.count').textContent = c + ' / ' + items.length + ' répondues';
    bar.querySelector('.track i').style.width = (c / items.length * 100) + '%';
  }
  submit.addEventListener('click', function () {
    var miss = items.filter(function (x) { return x.choice === null; });
    if (miss.length) {
      miss.forEach(function (x) { x.card.classList.add('missing'); });
      miss[0].card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      bar.querySelector('.count').textContent = miss.length + ' question' + (miss.length > 1 ? 's' : '') + ' sans réponse';
      return;
    }
    var score = 0, per = {};
    items.forEach(function (x) {
      per[x.m] = per[x.m] || [0, 0]; per[x.m][1]++;
      var btns = x.card.querySelectorAll('.opt');
      btns.forEach(function (b) { b.disabled = true; b.classList.remove('selected'); });
      btns[x.q.a].classList.add('correct');
      if (x.choice === x.q.a) { score++; per[x.m][0]++; x.fb.textContent = '✓ Bonne réponse'; x.fb.className = 'feedback show ok'; }
      else { btns[x.choice].classList.add('wrong'); x.fb.textContent = '✗ La bonne réponse est ' + LETTERS[x.q.a] + ')'; x.fb.className = 'feedback show ko'; }
      x.ex.classList.add('show');
    });
    var total = items.length, pass = score / total >= PASS;
    var prev = get('final:score');
    if (!prev || score >= prev.score) set('final:score', { score: score, total: total });
    enregistrerResultat('Grand examen final', score, total, PASS);
    var aRelire = {};
    if (!pass) {
      items.forEach(function (x) {
        if (x.choice === x.q.a) return;
        var ref = (x.e.match(/\((\d)\.(\d+)(?:\.\d+)?\)/) || []);
        var c = ref[1] ? ref[1] + '.' + ref[2] : null;
        if (c && ref[1] === String(x.m)) { aRelire[x.m] = aRelire[x.m] || []; if (aRelire[x.m].indexOf(c) < 0) aRelire[x.m].push(c); }
      });
      Object.keys(aRelire).forEach(function (m) { set('m' + m + ':arelire', aRelire[m]); });
    }
    var listeRelire = [];
    Object.keys(aRelire).sort().forEach(function (m) { listeRelire = listeRelire.concat(aRelire[m]); });
    var pct = score / total, r = 60, c = 2 * Math.PI * r;
    var detail = Object.keys(per).sort().map(function (m) { return '<li>Module ' + m + ' : ' + per[m][0] + ' / ' + per[m][1] + '</li>'; }).join('');
    bar.style.display = 'none';
    res.innerHTML = '<div class="ring"><svg width="140" height="140"><circle cx="70" cy="70" r="60" fill="none" stroke="#ece3d9" stroke-width="10"/>' +
      '<circle cx="70" cy="70" r="60" fill="none" stroke="' + (pass ? '#5f8570' : '#b4654a') + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (c * pct) + ' ' + c + '"/></svg><span>' + Math.round(pct * 100) + ' %</span></div>' +
      '<h3>' + (pass ? 'Félicitations, formation réussie !' : 'Examen final non réussi pour le moment') + '</h3>' +
      '<p>Votre note : ' + score + ' / ' + total + '. Seuil de réussite : 80 % (' + Math.ceil(total * PASS) + ' / ' + total + ').' +
      (pass ? ' Vous avez terminé la formation Accompagnement de pointe du 4e trimestre.' : ' Consultez les explications ci-dessous. Pour repasser l\'examen, relisez d\'abord ' + (listeRelire.length ? (listeRelire.length > 1 ? 'les chapitres ' : 'le chapitre ') + listeRelire.join(', ') : 'les modules où vous avez perdu des points') + ' : la prochaine tentative comportera d\'autres questions.') + '</p>' +
      '<ul class="per-module">' + detail + '</ul>' +
      '<div class="actions">' + (pass ? '<button class="btn-ghost" type="button" onclick="location.reload()">Recommencer l\'examen</button>' : '') + '<a class="btn" href="index.html">Accueil de la formation</a></div>';
    res.classList.add('show');
    box.insertBefore(res, box.firstChild);
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
