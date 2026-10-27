/* =========================================================
   Foundational doula training 450 h (English) — menu, locks, quizzes, exams
   Evaluation names sent to the Académie stay in French ('Quiz 1.1', 'Examen du module 1').
   ========================================================= */
(function () {
  'use strict';

  var CONF = window.MODULE_CONF || { num: '1', chapters: [] };
  var MN = String(CONF.num), CH = CONF.chapters || [], NCH = CH.length, LASTCH = CH[NCH - 1];
  var LASTMOD = 12;
  var PREFIX = 'd' + MN + ':';
  function url(type, id) { return type + '-' + MN + '-' + id.split('.')[1] + '.html'; }
  var MENTORAT = 'mailto:sc@academiesere.ca?subject=Mentoring';
  // modules available in English; the others open in French
  var EN_MODS = [1];
  function modUrl(n) { return EN_MODS.indexOf(+n) >= 0 ? '../module-' + n + '/index.html' : '/Formation/doula/module-' + n + '/index.html'; }
  var H = 3600 * 1000;

  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(PREFIX + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} }
  };
  var PASS = 0.8;

  /* ---------- 📊 Envoi des résultats à l'Académie (Supabase) ---------- */
  var SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co';
  var SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
  var SB_JETON = 'sb-zeptirfcwstufcpgvkzx-auth-token';
  var FILE_ATTENTE = 'resultats-a-envoyer';
  function lireSession() { try { return JSON.parse(sessionStorage.getItem(SB_JETON)); } catch (e) { return null; } }
  function rafraichirSession(s) {
    if (!s || !s.refresh_token) return Promise.resolve(null);
    return fetch(SB_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { 'apikey': SB_CLE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (n) { if (!n || !n.access_token) return null; try { sessionStorage.setItem(SB_JETON, JSON.stringify(n)); } catch (e) {} return n; })
      .catch(function () { return null; });
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
      if (!s || !s.user) return;
      var lignes = file.map(function (r) { r.user_id = s.user.id; r.courriel = s.user.email; return r; });
      fetch(SB_URL + '/rest/v1/resultats', {
        method: 'POST',
        headers: { 'apikey': SB_CLE, 'Authorization': 'Bearer ' + s.access_token, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(lignes)
      }).then(function (r) { if (r.ok) ecrireFile([]); }).catch(function () {});
    });
  }
  function enregistrerResultat(evaluation, score, total) {
    var file = lireFile();
    file.push({ formation: 'doula', module: 'module-' + MN, evaluation: evaluation, score: score, total: total,
                pourcentage: Math.round(score / total * 100), reussi: score / total >= PASS, created_at: new Date().toISOString() });
    ecrireFile(file); envoyerFile();
  }
  envoyerFile();

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function heures(ms) { var h = Math.ceil(ms / H); return h > 1 ? h + ' hours' : 'less than an hour'; }

  /* ---------- scores ---------- */
  function passed(id) { var r = store.get('score:' + id); return !!(r && r.score / r.total >= PASS); }
  function isRead(id) { return !!store.get('read:' + id); }
  function aRelire() { return store.get('arelire') || []; }
  function doitRelire(id) { return aRelire().indexOf(id) >= 0; }
  function paintScores() {
    document.querySelectorAll('[data-score]').forEach(function (e) {
      var r = store.get('score:' + e.dataset.score);
      if (!r) { e.textContent = ''; return; }
      e.textContent = r.score + '/' + r.total;
      e.classList.toggle('fail', r.score / r.total < PASS);
    });
    var dc = document.getElementById('doneCount');
    if (dc) dc.textContent = CH.filter(passed).length + '/' + NCH;
  }

  /* ---------- délais après un échec ---------- */
  // quiz : nouvelle tentative 24 h après un échec ; examen : 48 h
  function attente(cle, delai) {
    var f = store.get(cle);
    if (!f || !f.t) return 0;
    var reste = f.t + delai - Date.now();
    return reste > 0 ? reste : 0;
  }

  /* ---------- verrous ---------- */
  function keyOf(href) {
    var f = (href || '').split('/').pop().split('#')[0].split('?')[0];
    var m = f.match(new RegExp('^chapitre-' + MN + '-(\\d+)\\.html$')); if (m) return { type: 'chap', id: MN + '.' + m[1] };
    m = f.match(new RegExp('^quiz-' + MN + '-(\\d+)\\.html$')); if (m) return { type: 'quiz', id: MN + '.' + m[1] };
    if (f === 'examen.html') return { type: 'exam' };
    return null;
  }
  function lockReason(k) {
    if (!k) return null;
    if (k.type === 'chap') {
      var i = CH.indexOf(k.id);
      if (i <= 0 || passed(CH[i - 1])) return null;
      return { msg: 'Pass quiz ' + CH[i - 1] + ' first (80% or higher) to unlock chapter ' + k.id + '.', href: url('quiz', CH[i - 1]), label: 'Go to quiz ' + CH[i - 1] };
    }
    if (k.type === 'quiz') {
      var r = lockReason({ type: 'chap', id: k.id });
      if (r) return r;
      if (isRead(k.id)) return null;
      return { msg: 'Finish reading chapter ' + k.id + ' first to unlock its quiz.', href: url('chapitre', k.id), label: 'Read chapter ' + k.id };
    }
    if (k.type === 'exam') {
      var miss = CH.filter(function (id) { return !passed(id); });
      if (miss.length) return { msg: 'Pass all ' + NCH + ' quizzes in the module first to unlock the exam. Still to do: quiz ' + miss.join(', ') + '.', href: url('quiz', miss[0]), label: 'Continue the pathway' };
      var relire = aRelire();
      if (relire.length && !passed('exam')) return { msg: 'Before retaking the exam, reread ' + (relire.length > 1 ? 'chapters ' : 'chapter ') + relire.join(', ') + ' all the way through and click “I\'ve finished reading.”', href: url('chapitre', relire[0]), label: 'Reread chapter ' + relire[0] };
      return null;
    }
    return null;
  }
  var modLock = null;
  if (+MN > 1) {
    var pm = +MN - 1, pe = null;
    try { pe = JSON.parse(localStorage.getItem('d' + pm + ':score:exam')); } catch (e) {}
    if (!pe || pe.score / pe.total < PASS)
      modLock = { msg: 'Module ' + MN + ' unlocks when the module ' + pm + ' exam is passed (80% or higher).', href: modUrl(pm), label: 'Go to module ' + pm };
  }
  var toastEl;
  function toast(msg, icone) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = (icone || '🔒') + ' ' + msg;
    toastEl.classList.add('show'); clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 3800);
  }
  function applyLocks() {
    if (modLock) {
      document.querySelectorAll('.sidebar a, .chap-grid a, .hero a, .quiz-cta a').forEach(function (a) {
        if (a.classList.contains('all-modules') || /\.\.\/(annexe|documents)\.html$/.test(a.getAttribute('href') || '')) return;
        a.classList.add('is-locked'); a.setAttribute('aria-disabled', 'true'); a.dataset.lockMsg = modLock.msg;
      });
      return;
    }
    document.querySelectorAll('a[href]').forEach(function (a) {
      var r = lockReason(keyOf(a.getAttribute('href')));
      a.classList.toggle('is-locked', !!r);
      if (r) { a.setAttribute('aria-disabled', 'true'); a.dataset.lockMsg = r.msg; } else { a.removeAttribute('aria-disabled'); delete a.dataset.lockMsg; }
    });
    document.querySelectorAll('.chap-card').forEach(function (c) {
      var a = c.querySelector('h3 a'); var k = a && keyOf(a.getAttribute('href'));
      c.classList.toggle('is-locked', !!lockReason(k));
      c.classList.toggle('is-done', !!(k && passed(k.id)));
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.is-locked');
    if (a) { e.preventDefault(); toast(a.dataset.lockMsg || 'Locked content.'); }
  }, true);

  function pageVerrouillee(lock, img) {
    var main = document.querySelector('.main'); var toc = document.getElementById('toc');
    if (toc) toc.remove();
    if (!main) return;
    var keep = main.querySelector('.footer');
    main.innerHTML = '';
    var box = el('section', 'lock-page');
    box.innerHTML = '<img src="../assets/img/' + (img || 'cadenas.svg') + '" alt="" width="96" height="96"><h1></h1><p></p><div class="actions"><a class="btn"></a>' +
      (modLock ? '<a class="btn-ghost" href="../index.html">Training home</a>' : '<a class="btn-ghost" href="index.html">Module home</a>') + '</div>';
    box.querySelector('h1').textContent = lock.titre || 'Locked content';
    box.querySelector('p').innerHTML = lock.html || '';
    if (!lock.html) box.querySelector('p').textContent = lock.msg;
    box.querySelector('.btn').textContent = lock.label + ' →';
    box.querySelector('.btn').href = lock.href;
    main.appendChild(box);
    if (keep) main.appendChild(keep);
  }
  var pageKey = keyOf(location.pathname);
  var pageLock = modLock || lockReason(pageKey);
  if (pageLock) pageVerrouillee(pageLock);

  /* ---------- fin de lecture ---------- */
  var readBtn = document.getElementById('readDone'), quizGo = document.getElementById('quizGo');
  if (readBtn && !pageLock) {
    var cid = readBtn.dataset.chap, hint = document.getElementById('readHint');
    var setRead = function () { readBtn.hidden = true; if (hint) hint.hidden = true; quizGo.hidden = false; };
    if (doitRelire(cid)) {
      var ban = el('div', 'callout caution');
      ban.innerHTML = '<p><strong>📖 Rereading requested.</strong> Reread this chapter all the way through and click “I\'ve finished reading” at the bottom of the page so you can retake the exam.</p>';
      var art = document.querySelector('.content'); if (art) art.insertBefore(ban, art.firstChild);
    }
    if (isRead(cid) && !doitRelire(cid)) setRead();
    else {
      readBtn.disabled = true;
      var check = function () {
        var h = document.documentElement;
        if (h.scrollTop + h.clientHeight >= document.getElementById('endCta').offsetTop + 40) {
          readBtn.disabled = false;
          if (hint) hint.textContent = 'You\'ve scrolled to the end: you can confirm your reading.';
          window.removeEventListener('scroll', check);
        }
      };
      window.addEventListener('scroll', check, { passive: true }); check();
      readBtn.addEventListener('click', function () {
        store.set('read:' + cid, true);
        store.set('arelire', aRelire().filter(function (x) { return x !== cid; }));
        setRead(); applyLocks();
        toast('Reading confirmed: quiz ' + cid + ' is unlocked!', '✅');
      });
    }
  }

  /* ---------- menu mobile, progression de lecture, sommaire ---------- */
  var btn = document.getElementById('menuBtn');
  if (btn) btn.addEventListener('click', function () { document.body.classList.toggle('menu-open'); });
  var ov = document.getElementById('overlay');
  if (ov) ov.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
  var bar = document.getElementById('progress');
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  var secs = tocLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    var cur = 0;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 140) cur = i; });
    tocLinks.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- outils communs ---------- */
  var LETTERS = ['a', 'b', 'c', 'd', 'e'];
  function ring(score, total) {
    var pct = score / total, r = 60, c = 2 * Math.PI * r, color = pct >= PASS ? '#5f8570' : '#b4654a';
    return '<div class="ring"><svg width="140" height="140"><circle cx="70" cy="70" r="' + r + '" fill="none" stroke="#ece3d9" stroke-width="10"/>' +
      '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (c * pct) + ' ' + c + '"/></svg><span>' + Math.round(pct * 100) + '%</span></div>';
  }
  // prépare une question : options mélangées (sauf vrai ou faux)
  function preparer(d) {
    var idx = d.o.map(function (_, i) { return i; });
    if (!d.vf) shuffle(idx);
    return { q: d.q, o: idx.map(function (k) { return d.o[k]; }), a: idx.indexOf(d.a), e: d.e || '', s: d.s || '', src: d };
  }
  function questionCard(q, label, src) {
    var card = el('div', 'q-card'), head = el('div', 'q-head');
    head.appendChild(el('span', 'q-num', label));
    if (src) head.appendChild(el('span', 'q-src', src));
    card.appendChild(head);
    card.appendChild(el('p', 'q-text', q.q));
    var opts = el('div', 'opts');
    q.o.forEach(function (txt, i) {
      var b = el('button', 'opt'); b.type = 'button'; b.dataset.i = i;
      b.appendChild(el('span', 'letter', LETTERS[i])); b.appendChild(el('span', null, txt));
      opts.appendChild(b);
    });
    card.appendChild(opts);
    return card;
  }

  /* ---------- tentatives, délais et blocage (vérifiés dans le compte, sur le serveur) ----------
     Quiz : nouvelle tentative 24 h après un échec ; après 3 échecs, bloqué jusqu'au déblocage par Sabrina.
     Examen : nouvelle tentative 48 h après un échec ; après 2 échecs, bloqué jusqu'au déblocage par Sabrina. */
  function etatTentatives(evaluation, cleLocale, seuil, delai) {
    var local = store.get(cleLocale) || { n: 0 };
    var enAttente = lireFile().filter(function (r) { return r.formation === 'doula' && r.evaluation === evaluation; });
    function calcul(lignes, debloque) {
      if (lignes.some(function (r) { return r.reussi; })) return { echecs: 0, bloque: false, reste: 0, reussi: true };
      var depuis = debloque ? new Date(debloque).getTime() : 0;
      var echecs = lignes.filter(function (r) { return !r.reussi && new Date(r.created_at).getTime() > depuis; });
      var dernier = echecs.length ? Math.max.apply(null, echecs.map(function (r) { return new Date(r.created_at).getTime(); })) : 0;
      var reste = dernier ? Math.max(0, dernier + delai - Date.now()) : 0;
      return { echecs: echecs.length, bloque: echecs.length >= seuil, reste: reste };
    }
    return sessionValide().then(function (s) {
      if (!s || !s.access_token) throw new Error('hors ligne');
      var h = { 'apikey': SB_CLE, 'Authorization': 'Bearer ' + s.access_token };
      var ev = encodeURIComponent(evaluation);
      return Promise.all([
        fetch(SB_URL + '/rest/v1/resultats?select=reussi,created_at&formation=eq.doula&evaluation=eq.' + ev + '&order=created_at.asc', { headers: h }).then(function (r) { if (!r.ok) throw new Error('r'); return r.json(); }),
        fetch(SB_URL + '/rest/v1/deblocages?select=created_at&evaluation=eq.' + ev + '&order=created_at.desc&limit=1', { headers: h }).then(function (r) { return r.ok ? r.json() : []; })
      ]).then(function (x) {
        var deb = x[1] && x[1][0] ? x[1][0].created_at : null;
        var et = calcul(x[0].concat(enAttente), deb);
        store.set(cleLocale, { n: et.echecs, t: et.reste ? Date.now() - (delai - et.reste) : 0 });
        return et;
      });
    }).catch(function () {
      var reste = local.t ? Math.max(0, local.t + delai - Date.now()) : 0;
      return { echecs: local.n || 0, bloque: (local.n || 0) >= seuil, reste: reste };
    });
  }
  function noterEchec(cleLocale) {
    var f = store.get(cleLocale) || { n: 0 };
    store.set(cleLocale, { n: (f.n || 0) + 1, t: Date.now() });
  }
  var MSG_BLOQUE = function (quoi, nb) {
    return '<strong>Meeting required.</strong> After ' + nb + ' unsuccessful attempts, ' + quoi + ' is locked until your meeting with Sabrina. ' +
      'She has been notified. Book your meeting here: <a href="' + MENTORAT + '">book a meeting</a>. ' +
      'After the meeting, Sabrina will unlock your next attempt.';
  };
  function retirerQuestions(conteneur) {
    conteneur.querySelectorAll('.q-card, .exam-part, .card.case').forEach(function (n) { n.remove(); });
  }

  /* ---------- quiz de chapitre : une question par thème, correction à la fin ---------- */
  var quizEl = document.getElementById('quiz');
  if (quizEl && window.QUIZ_DATA && !pageLock) {
    var id = quizEl.dataset.quiz, data = window.QUIZ_DATA[id], EVQ = 'Quiz ' + id;
    var attenteQ = el('p', 'meta', 'Checking your attempts…'); quizEl.appendChild(attenteQ);
    etatTentatives(EVQ, 'qfail:' + id, 3, 24 * H).then(function (et) {
      attenteQ.remove();
      if (passed(id)) et = { echecs: 0, bloque: false, reste: 0 };
      if (et.bloque) {
        pageVerrouillee({ titre: 'Quiz ' + id + ' locked', html: MSG_BLOQUE('this quiz', et.echecs), href: url('chapitre', id), label: 'Reread chapter ' + id }, 'cadenas.svg');
        return;
      }
      if (et.reste) {
        pageVerrouillee({ titre: 'New attempt soon', html: 'You can retake this quiz in ' + heures(et.reste) + ', with different questions. Use the time to reread chapter ' + id + ', especially the sections listed in your result.' +
          (et.echecs === 2 ? '<br><br><strong>Note:</strong> this is your last attempt before a mandatory meeting with Sabrina.' : ''),
          href: url('chapitre', id), label: 'Reread chapter ' + id }, 'quiz.svg');
        return;
      }
      lancerQuiz(et);
    });
  }

  function lancerQuiz(et) {
    var id = quizEl.dataset.quiz, data = window.QUIZ_DATA[id];
    var vues = store.get('qv:' + id) || [];
    var themes = data.themes.map(function (t, ti) { return ti; });
    if (themes.length > 14) themes = shuffle(themes).slice(0, 12).sort(function (a, b) { return a - b; });
    var tirage = themes.map(function (ti) {
      var t = data.themes[ti];
      var choix = t.v.map(function (_, i) { return i; }).filter(function (i) { return vues.indexOf(ti + ':' + i) < 0; });
      if (!choix.length) choix = t.v.map(function (_, i) { return i; });
      var k = choix[Math.floor(Math.random() * choix.length)];
      return { ti: ti, k: k, theme: t.t, q: preparer(t.v[k]) };
    });
    store.set('qv:' + id, tirage.map(function (x) { return x.ti + ':' + x.k; }));
    var NQ = tirage.length, items = [];
    if (et.echecs === 2) {
      var av = el('div', 'callout caution');
      av.innerHTML = '<p><strong>Last attempt before a mandatory meeting.</strong> If you don\'t pass this quiz, it will be locked until your meeting with Sabrina.</p>';
      quizEl.appendChild(av);
    }
    tirage.forEach(function (x, n) {
      var card = questionCard(x.q, 'Question ' + (n + 1) + ' / ' + NQ, x.theme);
      var item = { q: x.q, card: card, choice: null };
      card.querySelectorAll('.opt').forEach(function (b) {
        b.addEventListener('click', function () {
          card.querySelectorAll('.opt').forEach(function (z) { z.classList.remove('selected'); });
          b.classList.add('selected'); item.choice = +b.dataset.i; card.classList.remove('missing'); maj();
        });
      });
      items.push(item); quizEl.appendChild(card);
    });
    var qbar = el('div', 'exam-bar');
    qbar.innerHTML = '<span class="count">0 / ' + NQ + ' answered</span><div class="track"><i></i></div>';
    var envoyer = el('button', 'btn', 'Submit my answers'); envoyer.type = 'button'; qbar.appendChild(envoyer);
    quizEl.appendChild(qbar);
    var result = el('div', 'result'); quizEl.appendChild(result);
    function maj() {
      var c = items.filter(function (x) { return x.choice !== null; }).length;
      qbar.querySelector('.count').textContent = c + ' / ' + NQ + ' answered';
      qbar.querySelector('.track i').style.width = (c / NQ * 100) + '%';
    }
    envoyer.addEventListener('click', function () {
      var manque = items.filter(function (x) { return x.choice === null; });
      if (manque.length) {
        manque.forEach(function (x) { x.card.classList.add('missing'); });
        manque[0].card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        qbar.querySelector('.count').textContent = manque.length + ' question' + (manque.length > 1 ? 's' : '') + ' unanswered';
        return;
      }
      var good = 0, sections = [];
      items.forEach(function (x) {
        if (x.choice === x.q.a) good++;
        else { var lab = x.q.s || ('chapter ' + id); if (sections.indexOf(lab) < 0) sections.push(lab); }
      });
      var prev = store.get('score:' + id);
      if (!prev || good >= prev.score) store.set('score:' + id, { score: good, total: NQ });
      enregistrerResultat('Quiz ' + id, good, NQ);
      var ok = good / NQ >= PASS, seuil = Math.ceil(NQ * PASS - 1e-9);
      if (!ok && !passed(id)) noterEchec('qfail:' + id);
      if (ok) store.set('qfail:' + id, { n: 0 });
      var echecs = (et.echecs || 0) + (ok ? 0 : 1);
      var next = id === LASTCH ? 'examen.html' : url('chapitre', CH[CH.indexOf(id) + 1]);
      retirerQuestions(quizEl); qbar.remove();
      result.innerHTML = ring(good, NQ) + '<h3>' + (ok ? 'Well done, quiz passed!' : 'Not passed yet') + '</h3>' +
        '<p>' + good + ' correct answer' + (good !== 1 ? 's' : '') + ' out of ' + NQ + ' (passing score: ' + seuil + ' out of ' + NQ + '). ' +
        (ok ? (id === LASTCH ? 'All the module\'s quizzes are passed: the module exam is unlocked. Remember to review with the practice workbook.' : 'The next chapter is unlocked.')
            : (passed(id) ? 'You had already passed this quiz: your best score is kept.'
               : (echecs >= 3 ? 'This quiz is now locked until your meeting with Sabrina (she has been notified): <a href="' + MENTORAT + '">book a meeting</a>.'
                              : 'Reread the sections below. You can retake the quiz in 24 hours, with different questions.' + (echecs === 2 ? ' Note: after a 3rd unsuccessful attempt, a meeting with Sabrina will be mandatory.' : '')))) + '</p>' +
        (!ok && sections.length ? '<div class="a-relire"><strong>To reread:</strong><ul class="bullets">' + sections.map(function (s) { return '<li>' + s.replace(/</g, '&lt;') + '</li>'; }).join('') + '</ul></div>' : '') +
        '<div class="actions">' + (passed(id) ? '<a class="btn" href="' + next + '">' + (id === LASTCH ? 'Go to the module exam →' : 'Next chapter →') + '</a>'
                                              : '<a class="btn" href="' + url('chapitre', id) + '">Reread chapter ' + id + '</a>') + '</div>';
      result.classList.add('show');
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      paintScores(); applyLocks();
    });
  }

  /* ---------- examen du module ---------- */
  var examEl = document.getElementById('exam'), intro = document.getElementById('examIntro'), startBtn = document.getElementById('examStart');
  var etatExam = { echecs: 0 };
  if (examEl && window.EXAM_DATA && startBtn && !pageLock) {
    var best = store.get('score:exam');
    if (best) {
      var info = el('div', 'callout ' + (passed('exam') ? 'note' : 'caution'));
      info.innerHTML = '<p><strong>' + (passed('exam') ? 'Exam passed ✓' : 'Best result') + ':</strong> ' + best.score + ' / ' + best.total + '.' +
        (passed('exam') && +MN < LASTMOD ? ' Module ' + (+MN + 1) + ' is unlocked.' : '') + '</p>';
      intro.insertBefore(info, intro.firstChild.nextSibling);
    }
    if (passed('exam')) {
      startBtn.disabled = true; startBtn.textContent = 'Exam passed ✓';
    } else {
      startBtn.disabled = true; startBtn.textContent = 'Checking your attempts…';
      etatTentatives('Examen du module ' + MN, 'efail', 2, 48 * H).then(function (et) {
        etatExam = et;
        var w = el('div', 'callout caution');
        if (et.bloque) {
          startBtn.textContent = '🔒 Exam locked';
          w.innerHTML = '<p>' + MSG_BLOQUE('the module ' + MN + ' exam', et.echecs) + '</p>';
          intro.appendChild(w); return;
        }
        if (et.reste) {
          startBtn.textContent = 'New attempt possible in ' + heures(et.reste);
          w.innerHTML = '<p>A new attempt is possible 48 hours after an unsuccessful one, with a new set of questions. In the meantime, reread the sections listed in your result.' +
            (et.echecs === 1 ? ' <strong>Note:</strong> after a 2nd unsuccessful attempt, a meeting with Sabrina will be mandatory before the next attempt.' : '') + '</p>';
          intro.appendChild(w); return;
        }
        if (et.echecs === 1) { w.innerHTML = '<p><strong>Last attempt before a mandatory meeting.</strong> If you don\'t pass the exam, it will be locked until your meeting with Sabrina.</p>'; intro.appendChild(w); }
        startBtn.disabled = false; startBtn.textContent = 'Start the exam';
      });
    }
    startBtn.addEventListener('click', function () {
      if (startBtn.disabled) return;
      if (!confirm('Start the exam now? The timer starts as soon as you confirm.')) return;
      intro.hidden = true; examEl.hidden = false;
      lancerExamen();
    });
  }

  function lancerExamen() {
    var D = window.EXAM_DATA, vues = store.get('exam:vues') || [], TIRAGE = [];
    D.chap.forEach(function (c) {
      var l = shuffle(c.q.slice());
      l.sort(function (a, b) { return (vues.indexOf(a.q) >= 0 ? 1 : 0) - (vues.indexOf(b.q) >= 0 ? 1 : 0); });
      l.slice(0, Math.min(c.n, l.length)).forEach(function (d) { TIRAGE.push({ d: d, c: c.c, t: c.t }); });
    });
    var cas = null;
    if (D.cas && D.cas.length) {
      var dernier = store.get('exam:cas');
      var choix = D.cas.filter(function (x) { return x.id !== dernier; });
      if (!choix.length) choix = D.cas;
      cas = choix[Math.floor(Math.random() * choix.length)];
      store.set('exam:cas', cas.id);
    }
    store.set('exam:vues', TIRAGE.map(function (x) { return x.d.q; }));
    var all = [], total = TIRAGE.length + (cas ? cas.q.length : 0), n = 0, lastC = null;
    TIRAGE.forEach(function (x) {
      if (x.c !== lastC) {
        lastC = x.c;
        var part = el('h2', 'exam-part'); part.textContent = 'Chapter ' + x.c + ' '; part.appendChild(el('small', null, x.t)); examEl.appendChild(part);
      }
      ajouter(x.d, 'Chapter ' + x.c, x.c);
    });
    if (cas) {
      var p = el('h2', 'exam-part'); p.textContent = 'Scenario '; p.appendChild(el('small', null, cas.t)); examEl.appendChild(p);
      var recit = el('div', 'card case');
      recit.innerHTML = '<div class="card-tag">Case to read</div>';
      cas.r.split(/\n\n+/).forEach(function (para) { recit.appendChild(el('p', null, para)); });
      examEl.appendChild(recit);
      cas.q.forEach(function (d) { ajouter(d, 'Scenario', null); });
    }
    function ajouter(d, src, c) {
      n++;
      var q = preparer(d), card = questionCard(q, 'Question ' + n + ' / ' + total, src);
      var item = { q: q, card: card, choice: null, c: c };
      card.querySelectorAll('.opt').forEach(function (b) {
        b.addEventListener('click', function () {
          if (item.fini) return;
          card.querySelectorAll('.opt').forEach(function (z) { z.classList.remove('selected'); });
          b.classList.add('selected'); item.choice = +b.dataset.i; card.classList.remove('missing'); update();
        });
      });
      all.push(item); examEl.appendChild(card);
    }
    var ebar = el('div', 'exam-bar');
    ebar.innerHTML = '<span class="count">0 / ' + all.length + ' answered</span><span class="timer" id="timer"></span><div class="track"><i></i></div>';
    var submit = el('button', 'btn', 'Submit my exam'); submit.type = 'button'; ebar.appendChild(submit);
    examEl.appendChild(ebar);
    var eresult = el('div', 'result'); examEl.appendChild(eresult);
    function update() {
      var c = all.filter(function (x) { return x.choice !== null; }).length;
      ebar.querySelector('.count').textContent = c + ' / ' + all.length + ' answered';
      ebar.querySelector('.track i').style.width = (c / all.length * 100) + '%';
    }
    var fin = Date.now() + (CONF.examMinutes || 45) * 60000, timerEl = ebar.querySelector('#timer'), fini = false;
    var tick = setInterval(function () {
      var r = Math.max(0, fin - Date.now()), m = Math.floor(r / 60000), s = Math.floor(r % 60000 / 1000);
      timerEl.textContent = '⏱ ' + m + ':' + (s < 10 ? '0' : '') + s;
      timerEl.classList.toggle('urgent', r < 5 * 60000);
      if (r <= 0) { clearInterval(tick); corriger(true); }
    }, 1000);
    // quitter la page pendant l'examen compte comme une tentative remise
    window.addEventListener('beforeunload', function (e) { if (!fini) { e.preventDefault(); e.returnValue = ''; } });
    window.addEventListener('pagehide', function () { if (!fini) corriger(false, true); });
    submit.addEventListener('click', function () {
      var missing = all.filter(function (x) { return x.choice === null; });
      if (missing.length) {
        missing.forEach(function (x) { x.card.classList.add('missing'); });
        missing[0].card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ebar.querySelector('.count').textContent = missing.length + ' question' + (missing.length > 1 ? 's' : '') + ' unanswered';
        return;
      }
      corriger(false);
    });
    function corriger(tempsEcoule, quitte) {
      if (fini) return; fini = true; clearInterval(tick);
      var score = 0, aRevoir = [], chapsRates = [];
      all.forEach(function (x) {
        if (x.choice === x.q.a) { score++; return; }
        var lab = x.q.s || (x.c ? 'chapter ' + x.c : '');
        if (lab && aRevoir.indexOf(lab) < 0) aRevoir.push(lab);
        var cs = (x.q.s || '').match(new RegExp('\\b' + MN + '\\.(\\d+)\\.\\d+', 'g')) || [];
        cs.forEach(function (sx) { var k = MN + '.' + sx.split('.')[1]; if (CH.indexOf(k) >= 0 && chapsRates.indexOf(k) < 0) chapsRates.push(k); });
        if (x.c && chapsRates.indexOf(x.c) < 0) chapsRates.push(x.c);
      });
      var tot = all.length, ok = score / tot >= PASS;
      chapsRates.sort(function (a, b) { return +a.split('.')[1] - +b.split('.')[1]; });
      var prev = store.get('score:exam');
      if (!prev || score >= prev.score) store.set('score:exam', { score: score, total: tot });
      enregistrerResultat('Examen du module ' + MN, score, tot);
      if (ok) { store.set('efail', { n: 0 }); store.set('arelire', []); }
      else { noterEchec('efail'); store.set('arelire', chapsRates); }
      if (quitte) return;
      var echecs = (etatExam.echecs || 0) + (ok ? 0 : 1);
      var nextMod = +MN + 1;
      ebar.style.display = 'none';
      retirerQuestions(examEl);
      eresult.innerHTML = ring(score, tot) +
        '<h3>' + (ok ? 'Congratulations, module ' + MN + ' passed!' : 'Module ' + MN + ' not passed yet') + '</h3>' +
        (tempsEcoule ? '<p><strong>Time is up:</strong> your answers were submitted automatically.</p>' : '') +
        '<p>Your score: ' + score + ' / ' + tot + ' (passing score: ' + Math.ceil(tot * PASS - 1e-9) + ' / ' + tot + ').' +
        (ok ? (nextMod <= LASTMOD ? ' Module ' + nextMod + ' is now unlocked' + (EN_MODS.indexOf(nextMod) < 0 ? ' (in French for now).' : '.') : ' All 12 modules are passed! Sabrina will contact you to set the date of your live final exam (camera on), your final case study and the validation of your practicums.')
            : (echecs >= 2 ? ' The exam is now locked until your meeting with Sabrina (she has been notified): <a href="' + MENTORAT + '">book a meeting</a>. In the meantime, reread the sections below.'
                           : ' Reread the sections listed below. You can retake the exam in 48 hours, with a new set of questions. Note: after a 2nd unsuccessful attempt, a meeting with Sabrina will be mandatory.')) + '</p>' +
        (aRevoir.length && !ok ? '<div class="a-relire"><strong>To reread:</strong><ul class="bullets">' + aRevoir.map(function (s) { return '<li>' + s.replace(/</g, '&lt;') + '</li>'; }).join('') + '</ul></div>' : '') +
        '<div class="actions">' + (ok ? (nextMod <= LASTMOD ? '<a class="btn" href="' + modUrl(nextMod) + '">Go to module ' + nextMod + ' →</a>' : '<a class="btn" href="../index.html">Training home</a>')
                                     : (chapsRates.length ? '<a class="btn" href="' + url('chapitre', chapsRates[0]) + '">Reread chapter ' + chapsRates[0] + ' →</a>' : '<a class="btn" href="index.html">Review the module</a>')) + '</div>';
      eresult.classList.add('show');
      examEl.insertBefore(eresult, examEl.firstChild);
      eresult.scrollIntoView({ behavior: 'smooth', block: 'start' });
      paintScores(); applyLocks();
    }
  }

  paintScores();
  applyLocks();
})();
