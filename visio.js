/* Académie Sérénaissance — formation de doula EN VISIO : cahiers et quiz de chaque journée.
   SereVisio.etudiante({ sb, etat })  → section « Ma formation en visio » dans Mes cours.
   Tout est décidé par Supabase (fonction visio_mon_espace) : heure d'ouverture de chaque journée,
   cohorte de l'étudiante, fin d'accès. Les documents sont chiffrés ; la clé n'est remise qu'à l'heure d'ouverture.
   Chaque PDF reçoit en plus un filigrane au nom de l'étudiante. Les quiz sont corrigés par le serveur. */
(function () {
  'use strict';
  var ZONE = 'America/Moncton';
  var PDFLIB = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
  function $(id) { return document.getElementById(id); }
  function esc(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
  function quand(iso) {
    try { return new Date(iso).toLocaleString('fr-CA', { timeZone: ZONE, day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).replace(':00', ' h').replace(/(\d)\s?:\s?(\d\d)/, '$1 h $2'); }
    catch (e) { return ''; }
  }
  function dateJour(d) {
    try { var p = String(d).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; }
  }
  var CAS = {"1": ["Jasmine, une vidéo, une visio et un texto de nuit", "Sarah et le petit Noah"], "2": ["Farah et le déclenchement, dans une autre langue", "Camille, une communication à ajuster"], "3": ["Mélanie, gestatrice pour Raj et Thomas", "Mariam, une décision qui se prend en famille"], "4": ["Amira et le bébé en siège", "Harpreet, le bassin, les poignets et l'huile de la belle-mère"], "5": ["Daniela, au neuvième jour", "Hodan et Abdi, un plan dans une autre langue"], "6": ["Nadia, « Seulement 4 cm! »", "Le placenta de Gaëlle"], "7": ["Anaïs, du foyer à la maison de naissance", "Le silence de Fatoumata"], "8": ["Chloé, vingt heures de travail et une décision à prendre", "Amira, Youssef et l'écran du moniteur"], "9": ["Nour, Samir et l'interprète", "Mélissa et Jordan, un transfert à Winnipeg"], "10": ["Mia et la honte de parler de ses fuites", "Fatou, mère solo après une césarienne"], "11": ["Mylène, deux jours après une césarienne", "« Mon amie dit qu'il a un frein de langue »"], "12": ["Le texto de minuit", "Sophie et les onze semaines"], "13": ["Dans la chambre, après la naissance", "Layla et sa fille de 10 ans"], "14": ["« Pouvez-vous vérifier ma dilatation ? »", "La proposition de Chantal"]};
  var AVIS_NOTES = 'Ces notes sont un outil d\'étude personnel : elles <b>ne comptent pas dans ton examen final</b>. Elles servent seulement à t\'aider à apprendre et à permettre à tes formatrices de t\'offrir un bon mentorat. Tes réponses sont enregistrées automatiquement. <b>Ton journal reste confidentiel</b> : on voit seulement qu\'il est fait.';
  var cssFait = false;
  function css() {
    if (cssFait) return; cssFait = true;
    var s = document.createElement('style');
    s.textContent = [
      '.visio-jour{border:1px solid #e6d9cf;border-radius:14px;background:#fff;margin:0 0 10px;overflow:hidden}',
      '.visio-jour>summary{cursor:pointer;list-style:none;padding:14px 16px;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}',
      '.visio-jour>summary::-webkit-details-marker{display:none}',
      '.visio-jour h3{margin:0;font-size:1.02rem}',
      '.visio-jour .vj-sous{font-size:.82rem;color:#7a685e;margin:2px 0 0}',
      '.visio-jour .vj-corps{padding:0 16px 14px;border-top:1px solid #f0e6de}',
      '.visio-jour.aujourdhui{border-color:#a85a45;box-shadow:0 2px 10px rgba(168,90,69,.15)}',
      '.vj-groupe{margin:12px 0 0}',
      '.vj-groupe h4{margin:0 0 6px;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:#7a685e}',
      '.vj-ligne{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed #efe5dd;flex-wrap:wrap}',
      '.vj-ligne:last-child{border-bottom:0}',
      '.vj-ligne .vj-nom{font-weight:600;font-size:.93rem}',
      '.vj-ligne .vj-etat{font-size:.8rem;color:#7a685e}',
      '.vj-btn{border:0;border-radius:999px;padding:8px 16px;font-weight:700;font-size:.85rem;cursor:pointer;background:#a85a45;color:#fff}',
      '.vj-btn[disabled]{background:#e9e0d8;color:#8d7b70;cursor:default}',
      '.vj-badge{font-size:.75rem;border-radius:999px;padding:3px 10px;background:#f3e9e1;color:#7a5a4a;font-weight:700}',
      '.vj-badge.ok{background:#e4f1e3;color:#2f6a35}',
      '.vj-voile{position:fixed;inset:0;background:rgba(40,28,22,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:10px}',
      '.vj-modal{background:#fff;border-radius:16px;max-width:880px;width:100%;max-height:94vh;display:flex;flex-direction:column;overflow:hidden}',
      '.vj-modal header{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #eee;flex-wrap:wrap}',
      '.vj-modal header strong{font-size:1rem}',
      '.vj-modal .vj-contenu{padding:14px 16px;overflow:auto;flex:1}',
      '.vj-modal iframe{width:100%;height:78vh;border:0}',
      '.vj-q{margin:0 0 16px}',
      '.vj-q p{margin:0 0 6px;font-weight:600}',
      '.vj-q label{display:block;padding:8px 10px;border:1px solid #e6d9cf;border-radius:10px;margin:0 0 6px;cursor:pointer;font-size:.92rem}',
      '.vj-q label.juste{border-color:#3d8b45;background:#eaf6e8}',
      '.vj-q label.faux{border-color:#c0392b;background:#fdecea}',
      '.vj-q .vj-expl{font-size:.84rem;color:#5a4a42;margin:4px 0 0}',
      '.vj-notes textarea{width:100%;min-height:120px;border:1px solid #e6d9cf;border-radius:10px;padding:10px;font:inherit;font-size:.92rem;resize:vertical;box-sizing:border-box}',
      '.vj-notes label{display:block;font-weight:700;font-size:.9rem;margin:12px 0 4px}',
      '.vj-notes .vj-save{font-size:.76rem;color:#7a685e;min-height:1em}',
      '.vj-avis{font-size:.82rem;background:#fbf3ee;border:1px solid #f0d5c8;border-radius:10px;padding:9px 11px;color:#7a4a3a;margin:8px 0}',
      '.vj-note{font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#a85a45;margin:0 0 10px}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- documents chiffrés + filigrane ---------- */
  function b64(s) { var b = atob(s), o = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; }
  function chargerPdfLib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    return new Promise(function (ok, ko) {
      var s = document.createElement('script'); s.src = PDFLIB; s.onload = function () { window.PDFLib ? ok(window.PDFLib) : ko(new Error('pdf-lib')); }; s.onerror = function () { ko(new Error('pdf-lib')); };
      document.head.appendChild(s);
    });
  }
  function dechiffrer(fichier, cle) {
    return fetch('/Formation/visio/' + fichier).then(function (r) { if (!r.ok) throw new Error('fichier'); return r.arrayBuffer(); }).then(function (buf) {
      var o = new Uint8Array(buf);
      return crypto.subtle.importKey('raw', b64(cle), 'AES-GCM', false, ['decrypt']).then(function (k) {
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: o.slice(0, 12) }, k, o.slice(12));
      });
    });
  }
  function latin(t) { return String(t || '').replace(/[^\x20-\xFF]/g, '').trim(); }
  function filigrane(donnees, ligne) {
    return chargerPdfLib().then(function (P) {
      return P.PDFDocument.load(donnees).then(function (pdf) {
        return pdf.embedFont(P.StandardFonts.Helvetica).then(function (font) {
          var txt = latin(ligne) || 'Étudiante Sérénaissance';
          pdf.getPages().forEach(function (p) {
            var w = p.getWidth(), h = p.getHeight();
            var taille = 30, largeur = font.widthOfTextAtSize(txt, taille);
            for (var y = -h * 0.1; y < h * 1.1; y += h / 4) {
              p.drawText(txt, { x: w * 0.5 - largeur * 0.35, y: y, size: taille, font: font, color: P.rgb(0.55, 0.35, 0.3), opacity: 0.13, rotate: P.degrees(35) });
            }
            p.drawText(latin(ligne) + ' · usage personnel · reproduction interdite', { x: 28, y: 14, size: 7.5, font: font, color: P.rgb(0.45, 0.35, 0.3), opacity: 0.8 });
          });
          return pdf.save();
        });
      });
    });
  }
  function fermer() { var v = document.querySelector('.vj-voile'); if (v) { var f = v.querySelector('iframe'); if (f && f.dataset.url) try { URL.revokeObjectURL(f.dataset.url); } catch (e) {} v.remove(); } }
  function fenetre(titre, corps) {
    fermer();
    var v = document.createElement('div'); v.className = 'vj-voile';
    v.innerHTML = '<div class="vj-modal" role="dialog" aria-modal="true"><header><strong>' + esc(titre) + '</strong><span><span class="vj-extra"></span><button type="button" class="vj-btn vj-x" style="background:#7a685e">Fermer</button></span></header><div class="vj-contenu">' + (corps || '') + '</div></div>';
    document.body.appendChild(v);
    v.querySelector('.vj-x').onclick = fermer;
    v.addEventListener('click', function (e) { if (e.target === v) fermer(); });
    return v;
  }
  function ouvrirDoc(doc, ligne) {
    var v = fenetre(doc.titre, '<p class="vj-sous">Ouverture du document…</p>');
    dechiffrer(doc.fichier, doc.cle).then(function (d) { return filigrane(d, ligne); }).then(function (octets) {
      var url = URL.createObjectURL(new Blob([octets], { type: 'application/pdf' }));
      var c = v.querySelector('.vj-contenu'); c.style.padding = '0';
      c.innerHTML = '<iframe title="' + esc(doc.titre) + '"></iframe>';
      var f = c.querySelector('iframe'); f.dataset.url = url; f.src = url;
      v.querySelector('.vj-extra').innerHTML = '<a class="vj-btn" style="text-decoration:none;display:inline-block;margin-right:6px" target="_blank" rel="noopener" href="' + url + '">Ouvrir en plein écran</a>';
    }).catch(function () {
      v.querySelector('.vj-contenu').innerHTML = '<p>Impossible d\'ouvrir le document pour le moment. Vérifie ta connexion et réessaie. Si ça continue, écris à <a href="mailto:sc@academiesere.ca">sc@academiesere.ca</a>.</p>';
    });
  }

  /* ---------- quiz corrigé par le serveur ---------- */
  function melanger(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ouvrirQuiz(sb, jour, rafraichir) {
    var v = fenetre('Quiz · Jour ' + jour, '<p class="vj-sous">Chargement…</p>');
    sb.rpc('visio_quiz', { p_jour: jour }).then(function (r) {
      var c = v.querySelector('.vj-contenu');
      if (r.error || !r.data || !r.data.length) { c.innerHTML = '<p>Le quiz n\'est pas disponible pour le moment.</p>'; return; }
      var qs = r.data;
      c.innerHTML = '<div class="vj-avis" style="font-size:.92rem"><b>ℹ️ Ce quiz ne compte pas pour ton examen final.</b><br>C\'est seulement un aide-mémoire pour t\'aider à réviser et permettre à tes formatrices de t\'offrir un bon mentorat. Réponds à toutes les questions : l\'application les corrige. Tu peux le refaire autant de fois que tu veux.</div><form id="vj-form">' +
        qs.map(function (q, qi) {
          var ordre = melanger(q.choix.map(function (_, i) { return i; }));
          return '<div class="vj-q" data-id="' + q.id + '"><p>' + (qi + 1) + '. ' + esc(q.question) + '</p>' +
            ordre.map(function (i) { return '<label data-i="' + i + '"><input type="radio" name="q' + q.id + '" value="' + i + '"> ' + esc(q.choix[i]) + '</label>'; }).join('') + '<div class="vj-expl" hidden></div></div>';
        }).join('') + '<button type="submit" class="vj-btn">Corriger mon quiz</button></form>';
      $('vj-form').onsubmit = function (e) {
        e.preventDefault();
        var rep = {}; qs.forEach(function (q) { var x = c.querySelector('input[name="q' + q.id + '"]:checked'); if (x) rep[q.id] = +x.value; });
        var btn = c.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Correction…';
        sb.rpc('visio_corriger', { p_jour: jour, p_reponses: rep }).then(function (res) {
          if (res.error || !res.data) { btn.disabled = false; btn.textContent = 'Corriger mon quiz'; alert('Une erreur est survenue. Réessaie dans un instant.'); return; }
          var d = res.data;
          d.details.forEach(function (x) {
            var bloc = c.querySelector('.vj-q[data-id="' + x.id + '"]');
            bloc.querySelectorAll('label').forEach(function (l) {
              var i = +l.dataset.i; l.querySelector('input').disabled = true;
              if (i === x.bonne) l.classList.add('juste'); else if (i === x.choisie) l.classList.add('faux');
            });
            var ex = bloc.querySelector('.vj-expl'); ex.hidden = false;
            ex.textContent = (x.juste ? '✓ Bonne réponse. ' : (x.choisie < 0 ? 'Sans réponse. ' : '✗ Pas tout à fait. ')) + (x.explication || '');
          });
          btn.remove();
          var note = document.createElement('div');
          note.innerHTML = '<p class="vj-note">' + d.score + ' / ' + d.total + '</p><button type="button" class="vj-btn">Recommencer</button>';
          c.insertBefore(note, c.firstChild); c.scrollTop = 0;
          note.querySelector('button').onclick = function () { fermer(); ouvrirQuiz(sb, jour, rafraichir); };
          if (rafraichir) rafraichir();
        });
      };
    });
  }

  /* ---------- section « Ma formation en visio » ---------- */
  function etudiante(o) {
    css();
    var sb = o.sb, etat = o.etat;
    if (!etat || !etat.doulaOk) return;
    var ancre = $('bloc-ateliers');
    var bloc = $('bloc-visio');
    if (!bloc) { bloc = document.createElement('div'); bloc.id = 'bloc-visio'; bloc.hidden = true; ancre.parentNode.insertBefore(bloc, ancre); }
    function charger() {
      Promise.all([sb.rpc('visio_mon_espace'), sb.rpc('visio_mes_travaux')]).then(function (rr) {
        var r = rr[0], mesTravaux = (rr[1] && rr[1].data) || {};
        var d = r && r.data;
        if (!d || d.acces === false && d.raison !== 'sans-cohorte' && d.raison !== 'termine') { bloc.hidden = true; return; }
        bloc.hidden = false;
        if (d.acces === false) {
          bloc.innerHTML = '<h2>🎥 Ma formation en visio</h2><div class="message info">' + (d.raison === 'termine'
            ? 'Ton accès aux cahiers et aux quiz de la formation en visio est terminé. Écris à <a href="mailto:sc@academiesere.ca">sc@academiesere.ca</a> si tu en as encore besoin.'
            : 'Ta cohorte n\'est pas encore confirmée. Sabrina te l\'attribue très bientôt : tes cahiers apparaîtront ici.') + '</div>';
          return;
        }
        var nom = ((etat.dossier && (etat.dossier.prenom || '') + ' ' + (etat.dossier.nom || '')) || '').trim();
        var courriel = (etat.session && etat.session.user && etat.session.user.email) || (etat.dossier && etat.dossier.courriel) || '';
        var ligne = nom + ' · ' + courriel;
        var maintenant = Date.now(), cible = null;
        d.jours.forEach(function (j) { if (cible === null && new Date(j.ouvre_apres).getTime() + 86400000 > maintenant) cible = j.jour; });
        bloc.innerHTML = '<h2>🎥 Ma formation en visio</h2><p class="sous" style="margin-top:0">' + esc(d.cohorte) + '. Chaque journée : le cahier et le texte à lire s\'ouvrent 24 h avant le cours, puis le cahier de révision et le quiz à la fin de la journée.</p>' +
          d.jours.map(function (j) {
            var avant = j.docs.filter(function (x) { return x.type !== 'apres'; }), apres = j.docs.filter(function (x) { return x.type === 'apres'; })[0];
            function ligneDoc(x) {
              return '<div class="vj-ligne"><div><div class="vj-nom">' + esc(x.titre) + '</div>' + (x.ouvert ? '' : '<div class="vj-etat">🔒 S\'ouvre le ' + esc(quand(x.type === 'apres' ? j.ouvre_apres : j.ouvre_avant)) + '</div>') + '</div>' +
                '<button type="button" class="vj-btn" data-doc="' + esc(x.fichier) + '"' + (x.ouvert ? '' : ' disabled') + '>' + (x.ouvert ? 'Ouvrir' : 'Bientôt') + '</button></div>';
            }
            var q = j.quiz;
            var quizLigne = '<div class="vj-ligne"><div><div class="vj-nom">Quiz de la journée (' + q.questions + ' questions)</div>' +
              (q.ouvert ? (q.meilleur != null ? '<div class="vj-etat">Meilleur résultat : ' + q.meilleur + ' / ' + q.total + '</div>' : '') : '<div class="vj-etat">🔒 S\'ouvre le ' + esc(quand(j.ouvre_apres)) + '</div>') + '</div>' +
              '<button type="button" class="vj-btn" data-quiz="' + j.jour + '"' + (q.ouvert ? '' : ' disabled') + '>' + (q.ouvert ? (q.meilleur != null ? 'Refaire' : 'Commencer') : 'Bientôt') + '</button></div>';
            var notes = '<details class="vj-notes" style="margin-top:10px"><summary style="cursor:pointer;font-weight:700">✍️ Mes notes d\'étude : études de cas et journal</summary>' + (q.ouvert ?
              '<div class="vj-avis">' + AVIS_NOTES + '</div><p class="vj-etat" style="font-size:.8rem;color:#7a685e;margin:4px 0">Les questions sont à la fin de ton cahier « Réviser après la journée ».</p>' +
              [['cas1', 'Étude de cas 1 · ' + ((CAS[j.jour] || [])[0] || '')], ['cas2', 'Étude de cas 2 · ' + ((CAS[j.jour] || [])[1] || '')], ['journal', 'Mon journal de réflexion (confidentiel)']].map(function (t) {
                return '<label for="vt-' + j.jour + '-' + t[0] + '">' + esc(t[1]) + '</label><textarea id="vt-' + j.jour + '-' + t[0] + '" data-jour="' + j.jour + '" data-type="' + t[0] + '" maxlength="30000" placeholder="Écris ici…">' + esc(mesTravaux[j.jour + '-' + t[0]] || '') + '</textarea><div class="vj-save"></div>';
              }).join('')
              : '<p class="vj-etat" style="font-size:.85rem;color:#7a685e">🔒 S\'ouvre le ' + esc(quand(j.ouvre_apres)) + '</p>') + '</details>';
            var tousOuverts = avant.every(function (x) { return x.ouvert; });
            return '<details class="visio-jour' + (j.jour === cible ? ' aujourdhui' : '') + '"' + (j.jour === cible ? ' open' : '') + '><summary><div><h3>Jour ' + j.jour + ' · ' + esc(dateJour(j.date)) + '</h3><p class="vj-sous">' + esc(j.module || '') + ' · de ' + String(j.debut).slice(0, 2) + ' h à ' + String(j.fin).slice(0, 2) + ' h</p></div>' +
              (q.meilleur != null ? '<span class="vj-badge ok">Quiz ' + q.meilleur + '/' + q.total + '</span>' : (tousOuverts ? '<span class="vj-badge ok">Ouvert</span>' : '<span class="vj-badge">À venir</span>')) + '</summary>' +
              '<div class="vj-corps"><div class="vj-groupe"><h4>Avant la journée</h4>' + avant.map(ligneDoc).join('') + '</div>' +
              '<div class="vj-groupe"><h4>Après la journée</h4>' + (apres ? ligneDoc(apres) : '') + quizLigne + '</div>' + notes + '</div></details>';
          }).join('') +
          '<p class="vj-sous" style="margin-top:10px">Ces documents sont personnels et portent ton nom : merci de ne pas les partager.</p>';
        bloc.querySelectorAll('[data-doc]').forEach(function (b) {
          b.onclick = function () {
            var doc = null; d.jours.forEach(function (j) { j.docs.forEach(function (x) { if (x.fichier === b.dataset.doc) doc = x; }); });
            if (doc && doc.cle) ouvrirDoc(doc, ligne);
          };
        });
        bloc.querySelectorAll('.vj-notes textarea').forEach(function (ta) {
          var etatEl = ta.nextElementSibling, minuterie = null, dernier = ta.value;
          function sauver() {
            if (ta.value === dernier) return; var v = ta.value; etatEl.textContent = 'Enregistrement…';
            sb.rpc('visio_sauver_travail', { p_jour: +ta.dataset.jour, p_type: ta.dataset.type, p_texte: v }).then(function (x) {
              if (x.error) { etatEl.textContent = '⚠ Non enregistré : réessaie dans un instant.'; return; }
              dernier = v; etatEl.textContent = '✓ Enregistré';
            });
          }
          ta.addEventListener('input', function () { clearTimeout(minuterie); etatEl.textContent = ''; minuterie = setTimeout(sauver, 1200); });
          ta.addEventListener('blur', function () { clearTimeout(minuterie); sauver(); });
        });
        bloc.querySelectorAll('[data-quiz]').forEach(function (b) { b.onclick = function () { ouvrirQuiz(sb, +b.dataset.quiz, charger); }; });
      });
    }
    charger();
  }
  window.SereVisio = { etudiante: etudiante };
})();
