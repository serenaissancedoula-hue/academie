/* =========================================================
   Formation 4e trimestre — Scripts : menu, verrous, quiz, examen final
   ========================================================= */
(function () {
  'use strict';

  var CONF = window.MODULE_CONF || { num: '1', chapters: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6'] };
  var MN = String(CONF.num), CH = CONF.chapters, NCH = CH.length, LASTCH = CH[NCH - 1];
  var PREFIX = 'marraine:';
  function url(type, id) { return type + '-' + MN + '-' + id.split('.')[1] + '.html'; }

  /* ---------- mémoire des résultats (dans le navigateur) ---------- */
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(PREFIX + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} }
  };
  var PASS_QUIZ = 0.8, PASS_EXAM = 0.8;

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
      formation: FORMATION, module: FORMATION === 'marraine' ? 'marraine' : 'module-' + MN,
      evaluation: evaluation, score: score, total: total,
      pourcentage: Math.round(score / total * 100), reussi: score / total >= seuil,
      created_at: new Date().toISOString()
    });
    ecrireFile(file);
    envoyerFile();
  }
  envoyerFile();   // envoie ce qui serait resté en attente

  function paintScores() {
    var done = 0;
    document.querySelectorAll('[data-score]').forEach(function (el) {
      var r = store.get('score:' + el.dataset.score);
      if (!r) { el.textContent = ''; return; }
      el.textContent = r.score + '/' + r.total;
      el.classList.toggle('fail', r.score / r.total < (el.dataset.score === 'exam' ? PASS_EXAM : PASS_QUIZ));
    });
    CH.forEach(function (id) {
      var r = store.get('score:' + id);
      if (r && r.score / r.total >= PASS_QUIZ) done++;
    });
    var dc = document.getElementById('doneCount');
    if (dc) dc.textContent = done + '/' + NCH;
  }

  /* ---------- progression et déverrouillage ----------
     Chapitre 1.1 ouvert au départ.
     Lecture du chapitre terminée  -> quiz du chapitre débloqué.
     Quiz réussi (80 % et plus)     -> chapitre suivant débloqué.
     Tous les quiz réussis             -> examen final débloqué.        */
  function passed(id) { var r = store.get('score:' + id); return !!(r && r.score / r.total >= PASS_QUIZ); }
  function isRead(id) { return !!store.get('read:' + id); }
  function aRelire() { return store.get('arelire') || []; }
  function doitRelire(id) { return aRelire().indexOf(id) >= 0; }
  function keyOf(href) {
    var f = (href || '').split('/').pop().split('#')[0].split('?')[0];
    var m = f.match(new RegExp('^chapitre-' + MN + '-(\\d+)\\.html$')); if (m) return { type: 'chap', id: MN + '.' + m[1] };
    m = f.match(new RegExp('^quiz-' + MN + '-(\\d+)\\.html$')); if (m) return { type: 'quiz', id: MN + '.' + m[1] };
    if (f === 'examen-final.html') return { type: 'exam' };
    return null;
  }
  // Renvoie null si débloqué, sinon la raison du verrouillage.
  function lockReason(k) {
    if (!k) return null;
    if (k.type === 'chap') {
      var i = CH.indexOf(k.id);
      if (i <= 0 || passed(CH[i - 1])) return null;
      return { msg: 'Réussissez d\'abord le quiz ' + CH[i - 1] + ' (80 % et plus) pour débloquer le chapitre ' + k.id + '.', href: url('quiz', CH[i - 1]), label: 'Aller au quiz ' + CH[i - 1] };
    }
    if (k.type === 'quiz') {
      var r = lockReason({ type: 'chap', id: k.id });
      if (r) return r;
      if (isRead(k.id)) return null;
      return { msg: 'Terminez d\'abord la lecture du chapitre ' + k.id + ' pour débloquer son quiz.', href: url('chapitre', k.id), label: 'Lire le chapitre ' + k.id };
    }
    if (k.type === 'exam') {
      var miss = CH.filter(function (id) { return !passed(id); });
      var relire = aRelire();
      if (!miss.length && relire.length) return { msg: 'Avant de repasser l\'examen, relis le' + (relire.length > 1 ? 's chapitres ' : ' chapitre ') + relire.join(', ') + ' jusqu\'au bout et clique sur « J\'ai terminé ma lecture ».', href: url('chapitre', relire[0]), label: 'Relire le chapitre ' + relire[0] };
      if (!miss.length) return null;
      return { msg: 'Réussissez d\'abord les ' + NCH + ' quiz pour débloquer l\'examen final. Il vous reste : quiz ' + miss.join(', ') + '.', href: url('quiz', miss[0]), label: 'Continuer le parcours' };
    }
    return null;
  }

  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = '🔒 ' + msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 3500);
  }

  function applyLocks() {
    if (typeof modLock !== 'undefined' && modLock) {
      document.querySelectorAll('.sidebar a, .chap-grid a, .hero a, .quiz-cta a').forEach(function (a) {
        if (a.classList.contains('all-modules') || a.id === 'resetProgress') return;
        a.classList.add('is-locked'); a.setAttribute('aria-disabled', 'true'); a.dataset.lockMsg = modLock.msg;
      });
      return;
    }
    document.querySelectorAll('a[href]').forEach(function (a) {
      var r = lockReason(keyOf(a.getAttribute('href')));
      a.classList.toggle('is-locked', !!r);
      if (r) { a.setAttribute('aria-disabled', 'true'); a.dataset.lockMsg = r.msg; }
      else { a.removeAttribute('aria-disabled'); delete a.dataset.lockMsg; }
    });
    document.querySelectorAll('.chap-card').forEach(function (c) {
      var a = c.querySelector('h3 a'); var k = a && keyOf(a.getAttribute('href'));
      c.classList.toggle('is-locked', !!lockReason(k));
      c.classList.toggle('is-done', !!(k && passed(k.id)));
    });
    var pc = document.getElementById('progressCount');
    if (pc) pc.textContent = CH.filter(passed).length + '/' + NCH;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.is-locked');
    if (a) { e.preventDefault(); toast(a.dataset.lockMsg || 'Contenu verrouillé.'); }
  }, true);

  // Page ouverte directement alors qu'elle est verrouillée : on masque le contenu.
  var pageKey = keyOf(location.pathname);
  // Verrou du module entier : le module N s'ouvre quand l'examen du module N-1 est réussi.
  var modLock = null;
  if (+MN > 1) {
    var pm = +MN - 1, pe = null;
    try { pe = JSON.parse(localStorage.getItem('m' + pm + ':score:exam')); } catch (e) {}
    if (!pe || pe.score / pe.total < PASS_EXAM)
      modLock = { msg: 'Le Module ' + MN + ' s\'ouvre lorsque l\'examen final du Module ' + pm + ' est réussi (80 % et plus).',
                  href: '../module-' + pm + '/index.html', label: 'Aller au Module ' + pm };
  }
  var pageLock = modLock || lockReason(pageKey);
  if (pageLock) {
    var main = document.querySelector('.main');
    var toc = document.getElementById('toc');
    if (toc) toc.remove();
    if (main) {
      var keep = main.querySelector('.footer');
      main.innerHTML = '';
      var box = document.createElement('section');
      box.className = 'lock-page';
      box.innerHTML = '<img src="assets/img/cadenas.svg" alt="" width="96" height="96"><h1>Contenu verrouillé</h1><p></p>' +
        '<div class="actions"><a class="btn"></a>' + (modLock ? '<a class="btn-ghost" href="../index.html">Accueil de la formation</a>' : '<a class="btn-ghost" href="index.html">Accueil de la formation</a>') + '</div>';
      box.querySelector('p').textContent = pageLock.msg;
      box.querySelector('.btn').textContent = pageLock.label + ' →';
      box.querySelector('.btn').href = pageLock.href;
      main.appendChild(box);
      if (keep) main.appendChild(keep);
    }
  }

  // Fin de lecture d'un chapitre
  var readBtn = document.getElementById('readDone');
  var quizGo = document.getElementById('quizGo');
  if (readBtn && !pageLock) {
    var cid = readBtn.dataset.chap;
    var hint = document.getElementById('readHint');
    var setRead = function () {
      readBtn.hidden = true; if (hint) hint.hidden = true;
      quizGo.hidden = false;
    };
    if (doitRelire(cid)) {
      var ban = document.createElement('div');
      ban.className = 'callout caution';
      ban.innerHTML = '<p><strong>📖 Relecture demandée.</strong> Relis ce chapitre jusqu\'au bout et clique sur « J\'ai terminé ma lecture » en bas de page pour pouvoir repasser l\'examen.</p>';
      var art = document.querySelector('.content'); if (art) art.insertBefore(ban, art.firstChild);
    }
    if (isRead(cid) && !doitRelire(cid)) setRead();
    else {
      readBtn.disabled = true;
      var check = function () {
        var h = document.documentElement;
        if (h.scrollTop + h.clientHeight >= document.getElementById('endCta').offsetTop + 40) {
          readBtn.disabled = false;
          if (hint) hint.textContent = 'Lecture parcourue jusqu\'au bout : vous pouvez valider.';
          window.removeEventListener('scroll', check);
        }
      };
      window.addEventListener('scroll', check, { passive: true });
      check();
      readBtn.addEventListener('click', function () {
        store.set('read:' + cid, true);
        var rl = aRelire().filter(function (x) { return x !== cid; });
        store.set('arelire', rl);
        setRead(); applyLocks();
        toast('Lecture validée : le quiz ' + cid + ' est débloqué !');
      });
    }
  }

  // Réinitialiser la progression
  var reset = document.getElementById('resetProgress');
  if (reset) reset.addEventListener('click', function (e) {
    e.preventDefault();
    if (!confirm('Effacer toute votre progression (lectures, quiz et examen) ?')) return;
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PREFIX) === 0) localStorage.removeItem(k); }); } catch (err) {}
    location.href = 'index.html';
  });

  /* ---------- menu mobile ---------- */
  var btn = document.getElementById('menuBtn');
  if (btn) btn.addEventListener('click', function () { document.body.classList.toggle('menu-open'); });
  var ov = document.getElementById('overlay');
  if (ov) ov.addEventListener('click', function () { document.body.classList.remove('menu-open'); });

  /* ---------- barre de progression + sommaire actif ---------- */
  var bar = document.getElementById('progress');
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  var sections = tocLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    var cur = 0;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 140) cur = i; });
    tocLinks.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- outils communs aux quiz ---------- */
  var LETTERS = ['a', 'b', 'c', 'd'];
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function ring(score, total) {
    var pct = score / total, r = 60, c = 2 * Math.PI * r;
    var color = pct >= PASS_QUIZ ? '#5f8570' : '#b4654a';
    return '<div class="ring"><svg width="140" height="140"><circle cx="70" cy="70" r="' + r + '" fill="none" stroke="#ece3d9" stroke-width="10"/>' +
      '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' +
      (c * pct) + ' ' + c + '"/></svg><span>' + Math.round(pct * 100) + ' %</span></div>';
  }
  function questionCard(q, label, src) {
    var card = el('div', 'q-card');
    var head = el('div', 'q-head');
    head.appendChild(el('span', 'q-num', label));
    if (src) head.appendChild(el('span', 'q-src', src));
    card.appendChild(head);
    card.appendChild(el('p', 'q-text', q.q));
    var opts = el('div', 'opts');
    q.o.forEach(function (txt, i) {
      var b = el('button', 'opt');
      b.type = 'button';
      b.dataset.i = i;
      b.appendChild(el('span', 'letter', LETTERS[i]));
      b.appendChild(el('span', null, txt));
      opts.appendChild(b);
    });
    card.appendChild(opts);
    return card;
  }

  /* ---------- quiz formatif (correction immédiate) ---------- */
  var quizEl = document.getElementById('quiz');
  if (quizEl && window.QUIZ_DATA) {
    var id = quizEl.dataset.quiz, data = window.QUIZ_DATA[id];
    var answered = 0, good = 0;
    var result = el('div', 'result');
    data.questions.forEach(function (q, qi) {
      var card = questionCard(q, 'Question ' + q.n + ' / ' + data.questions.length);
      var fb = el('div', 'feedback');
      card.appendChild(fb);
      card.querySelectorAll('.opt').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = +b.dataset.i;
          card.querySelectorAll('.opt').forEach(function (x) { x.disabled = true; });
          card.querySelectorAll('.opt')[q.a].classList.add('correct');
          if (i === q.a) { good++; fb.textContent = '✓ Bonne réponse'; fb.className = 'feedback show ok'; }
          else { b.classList.add('wrong'); fb.textContent = '✗ La bonne réponse est ' + LETTERS[q.a] + ')'; fb.className = 'feedback show ko'; }
          answered++;
          if (answered === data.questions.length) finish();
        });
      });
      quizEl.appendChild(card);
    });
    quizEl.appendChild(result);

    function finish() {
      var total = data.questions.length;
      var prev = store.get('score:' + id);
      if (!prev || good >= prev.score) store.set('score:' + id, { score: good, total: total });
      enregistrerResultat('Quiz ' + id, good, total, PASS_QUIZ);
      var ok = good / total >= PASS_QUIZ;
      var next = id === LASTCH ? 'examen-final.html' : url('chapitre', CH[CH.indexOf(id) + 1]);
      var unlocked = passed(id);
      var chapUrl = url('chapitre', id);
      result.innerHTML = ring(good, total) +
        '<h3>' + (ok ? 'Bravo, quiz réussi !' : 'Encore un petit effort') + '</h3>' +
        '<p>' + good + ' bonne' + (good > 1 ? 's' : '') + ' réponse' + (good > 1 ? 's' : '') + ' sur ' + total + '. ' +
        (ok ? (id === LASTCH ? 'Le dernier quiz est validé.' : 'Le chapitre suivant est débloqué.')
            : 'Il faut au moins 4 bonnes réponses sur 5 pour débloquer la suite. Relisez le chapitre ' + id + ' puis recommencez.') + '</p>' +
        '<div class="actions"><button class="btn-ghost" type="button" onclick="location.reload()">Recommencer</button>' +
        (unlocked ? '<a class="btn" href="' + next + '">' + (id === LASTCH ? "Passer à l'examen final →" : 'Chapitre suivant →') + '</a>'
                  : '<a class="btn" href="' + chapUrl + '">Relire le chapitre ' + id + '</a>') + '</div>' +
        (ok ? '<p class="corrige-line">' + data.corrige + '</p>' : '');
      result.classList.add('show');
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      paintScores(); applyLocks();
    }
  }

  /* ---------- examen final (questions propres à l'examen, correction à la fin) ---------- */
  var examEl = document.getElementById('exam');
  if (examEl && window.EXAM_DATA) {
    var all = [], TOTALQ = window.EXAM_DATA.length, lastChap = null;
    var shuffle = function (arr) {
      for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
      return arr;
    };
    // Banque de questions : on en tire la moitié par chapitre, en évitant celles de la tentative précédente
    var parChap = {}, ordreChap = [];
    window.EXAM_DATA.forEach(function (d) { if (!parChap[d.c]) { parChap[d.c] = []; ordreChap.push(d.c); } parChap[d.c].push(d); });
    var vus = store.get('exam:vues') || [];
    var TIRAGE = [];
    ordreChap.forEach(function (c) {
      var l = shuffle(parChap[c].slice());
      l.sort(function (a, b) { return (vus.indexOf(a.q) >= 0 ? 1 : 0) - (vus.indexOf(b.q) >= 0 ? 1 : 0); });
      TIRAGE = TIRAGE.concat(l.slice(0, Math.max(1, Math.round(l.length / 2))));
    });
    store.set('exam:vues', TIRAGE.map(function (d) { return d.q; }));
    TOTALQ = TIRAGE.length;
    TIRAGE.forEach(function (d, n) {
      if (d.c !== lastChap) {
        lastChap = d.c;
        var part = el('h2', 'exam-part');
        part.textContent = 'Chapitre ' + d.c + ' ';
        part.appendChild(el('small', null, d.chapter));
        examEl.appendChild(part);
      }
      // mélange des options : l'index 0 des données est la bonne réponse
      var order = shuffle([0, 1, 2, 3]);
      var q = { q: d.q, o: order.map(function (k) { return d.o[k]; }), a: order.indexOf(0) };
      var card = questionCard(q, 'Question ' + (n + 1) + ' / ' + TOTALQ, 'Chapitre ' + d.c);
      var fb = el('div', 'feedback');
      card.appendChild(fb);
      var ex = el('p', 'explain', d.e);
      card.appendChild(ex);
      var item = { q: q, card: card, fb: fb, ex: ex, choice: null, c: d.c };
      card.querySelectorAll('.opt').forEach(function (b) {
        b.addEventListener('click', function () {
          card.querySelectorAll('.opt').forEach(function (x) { x.classList.remove('selected'); });
          b.classList.add('selected');
          item.choice = +b.dataset.i;
          card.classList.remove('missing');
          update();
        });
      });
      all.push(item);
      examEl.appendChild(card);
    });

    var ebar = el('div', 'exam-bar');
    ebar.innerHTML = '<span class="count">0 / ' + all.length + ' répondues</span><div class="track"><i></i></div>';
    var submit = el('button', 'btn', 'Valider mes réponses');
    submit.type = 'button';
    ebar.appendChild(submit);
    examEl.appendChild(ebar);
    var eresult = el('div', 'result');
    examEl.appendChild(eresult);

    function update() {
      var c = all.filter(function (x) { return x.choice !== null; }).length;
      ebar.querySelector('.count').textContent = c + ' / ' + all.length + ' répondues';
      ebar.querySelector('.track i').style.width = (c / all.length * 100) + '%';
    }

    submit.addEventListener('click', function () {
      var missing = all.filter(function (x) { return x.choice === null; });
      if (missing.length) {
        missing.forEach(function (x) { x.card.classList.add('missing'); });
        missing[0].card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ebar.querySelector('.count').textContent = missing.length + ' question' + (missing.length > 1 ? 's' : '') + ' sans réponse';
        return;
      }
      var score = 0;
      all.forEach(function (x) {
        var btns = x.card.querySelectorAll('.opt');
        btns.forEach(function (b) { b.disabled = true; b.classList.remove('selected'); });
        btns[x.q.a].classList.add('correct');
        if (x.choice === x.q.a) { score++; x.fb.textContent = '✓ Bonne réponse'; x.fb.className = 'feedback show ok'; }
        else { btns[x.choice].classList.add('wrong'); x.fb.textContent = '✗ La bonne réponse est ' + LETTERS[x.q.a] + ')'; x.fb.className = 'feedback show ko'; }
        x.ex.classList.add('show');
      });
      var total = all.length, ok = score / total >= PASS_EXAM;
      var chapsRates = [];
      all.forEach(function (x) { if (x.choice !== x.q.a && chapsRates.indexOf(x.c) < 0) chapsRates.push(x.c); });
      if (!ok) store.set('arelire', chapsRates);
      var prev = store.get('score:exam');
      if (!prev || score >= prev.score) store.set('score:exam', { score: score, total: total });
      enregistrerResultat('Examen final', score, total, PASS_EXAM);
      var best = store.get('score:exam'), unlocked = best && best.score / best.total >= PASS_EXAM;
      var nextBtn = unlocked ? '<a class="btn" href="attestation.html">Mon certificat →</a>' : '<a class="btn" href="index.html">Revoir la formation</a>';
      ebar.style.display = 'none';
      eresult.innerHTML = ring(score, total) +
        '<h3>' + (ok ? 'Félicitations, formation réussie !' : 'Examen non réussi pour le moment') + '</h3>' +
        '<p>Votre note : ' + score + ' / ' + total + '. Seuil de réussite : 80 % (' + Math.ceil(total * PASS_EXAM) + ' / ' + total + ').' +
        (ok ? ' Votre certificat de participation vous sera envoyé par la poste : ouvrez votre confirmation de réussite pour savoir comment le recevoir.'
            : ' Relisez les corrections et les explications ci-dessous. Pour repasser l\'examen, relisez d\'abord ' + (chapsRates.length > 1 ? 'les chapitres ' : 'le chapitre ') + chapsRates.join(', ') + ' : la prochaine tentative comportera d\'autres questions.') + '</p>' +
        '<div class="actions">' + (ok ? '<button class="btn-ghost" type="button" onclick="location.reload()">Recommencer l\'examen</button>' + nextBtn
                                     : '<a class="btn" href="' + url('chapitre', chapsRates[0]) + '">Relire le chapitre ' + chapsRates[0] + ' →</a>') + '</div>';
      eresult.classList.add('show');
      examEl.insertBefore(eresult, examEl.firstChild);
      eresult.scrollIntoView({ behavior: 'smooth', block: 'start' });
      paintScores(); applyLocks();
    });
  }

  paintScores();
  applyLocks();
})();
