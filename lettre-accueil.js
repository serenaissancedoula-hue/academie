/* Académie Sérénaissance — lettre de bienvenue personnalisée
   Affichée automatiquement la première fois qu'une étudiante ouvre une formation
   (doula, 4e trimestre, marraine d'allaitement), en français ou en anglais.
   Le fait qu'elle a été vue est gardé dans la progression de l'étudiante (synchronisée avec son compte).
   On peut la rouvrir en tout temps avec le bouton 💌 du menu. */
(function () {
  'use strict';

  var CLES = { 'doula': 'd0:lettre', '4e-trimestre': 'm0:lettre', 'marraine': 'marraine:lettre' };

  var TEXTES = {
    fr: {
      'doula': {
        titre: 'Formation de base de doula · 450 h',
        corps: [
          'Bienvenue à l\'Académie Sérénaissance ! Je suis tellement heureuse que tu aies choisi la <strong>Formation de base de doula</strong> pour faire tes premiers pas dans ce beau métier. Merci de ta confiance : elle me touche profondément.',
          'Choisir de devenir doula, c\'est choisir d\'être là pour les familles dans l\'un des moments les plus importants de leur vie. Au fil des 12 modules, tu vas apprendre à accompagner avant, pendant et après la naissance, avec rigueur et douceur, en gardant toujours notre boussole : <em>observer, rassurer, référer</em>. Tu vas aussi apprendre à prendre soin de toi, parce qu\'une doula qui dure est une doula qui se respecte.',
          'Tu n\'es pas seule dans ce parcours. Je t\'accompagne à chaque étape : les ateliers en direct, le mentorat, les simulations et tes stages. Ta mentore et moi sommes là pour répondre à tes questions, t\'encourager et célébrer chacune de tes réussites.'
        ],
        conseils: [
          'Avance à ton rythme, un chapitre à la fois. Lis jusqu\'au bout, puis fais le quiz quand tu te sens prête.',
          'Garde le cahier pratique de chaque module près de toi : c\'est là que la théorie devient ta façon d\'accompagner.',
          'Pratique les phrases à voix haute, seule ou avec une collègue. C\'est ce qui te viendra naturellement le jour J.',
          'Pose tes questions sans gêne, dans tes Messages ou à sc@academiesere.ca. Aucune question n\'est de trop.'
        ],
        fin: 'Félicitations pour ce choix courageux et plein de cœur. J\'ai déjà hâte de voir la doula que tu vas devenir.'
      },
      '4e-trimestre': {
        titre: 'Accompagnement de pointe du 4ᵉ trimestre',
        corps: [
          'Bienvenue à l\'Académie Sérénaissance ! Félicitations d\'avoir choisi l\'<strong>Accompagnement de pointe du 4ᵉ trimestre</strong>. Merci de ta confiance : c\'est un honneur pour moi de t\'accompagner dans cette nouvelle étape de ta pratique.',
          'Le 4ᵉ trimestre, ces premières semaines où une famille apprend à se connaître, est un moment aussi beau que fragile. Au fil des 5 modules, tu vas approfondir la physiologie, l\'allaitement, le soutien à la parentalité, l\'éthique et la communication bienveillante, pour devenir une présence solide et rassurante auprès des familles, toujours dans ton rôle : <em>observer, rassurer, référer</em>.',
          'Tu n\'es pas seule dans ce parcours. Je suis là pour répondre à tes questions, t\'encourager et célébrer chacune de tes réussites, jusqu\'à ton examen final et ton stage.'
        ],
        conseils: [
          'Avance à ton rythme, un chapitre à la fois, et fais les quiz quand tu te sens prête.',
          'Prends des notes sur ce qui te touche : elles nourriront ta façon d\'accompagner.',
          'Télécharge ta trousse de stage tôt, pour voir où tu t\'en vas.',
          'Pose tes questions sans gêne, dans tes Messages ou à sc@academiesere.ca.'
        ],
        fin: 'Félicitations pour ce beau choix. Les familles qui croiseront ta route ont de la chance.'
      },
      'marraine': {
        titre: 'Formation de marraine d\'allaitement',
        corps: [
          'Bienvenue à l\'Académie Sérénaissance ! Félicitations d\'avoir choisi la <strong>formation de marraine d\'allaitement</strong>. Merci de ta confiance et de ton désir d\'offrir ton temps et ton cœur aux mères qui allaitent.',
          'Une marraine, c\'est souvent la voix douce qui fait toute la différence dans les premières semaines. Au fil de la formation, tu vas apprendre à écouter sans juger, à partager une information juste et à orienter vers les bonnes ressources, en restant toujours dans ton rôle de soutien entre pairs.',
          'Tu n\'es pas seule dans ce parcours. Je suis là pour répondre à tes questions et t\'encourager, jusqu\'à ta fiche de marraine certifiée.'
        ],
        conseils: [
          'Avance à ton rythme, un chapitre à la fois, et fais les quiz quand tu te sens prête.',
          'Repense à ta propre histoire avec douceur : elle t\'aide à comprendre, sans jamais devenir la norme pour les autres.',
          'Note les ressources de ta région au fil de ta lecture.',
          'Pose tes questions sans gêne, dans tes Messages ou à sc@academiesere.ca.'
        ],
        fin: 'Félicitations pour ce geste généreux. Les mamans que tu soutiendras s\'en souviendront longtemps.'
      },
      chere: function (p) { return p ? 'Chère ' + p + ',' : 'Chère étudiante,'; },
      conseilsTitre: 'Quelques conseils pour bien commencer',
      signature: 'Avec toute ma douceur,',
      role: 'Fondatrice, Académie Sérénaissance',
      commencer: 'Commencer ma formation',
      imprimer: 'Imprimer ma lettre',
      fermer: 'Fermer',
      menu: 'Ma lettre de bienvenue',
      date: function (d) { return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); }
    },
    en: {
      'doula': {
        titre: 'Foundational doula training · 450 h',
        corps: [
          'Welcome to Académie Sérénaissance! I\'m so happy you chose the <strong>Foundational doula training</strong> to take your first steps in this beautiful work. Thank you for your trust: it truly touches me.',
          'Choosing to become a doula means choosing to be there for families in one of the most important moments of their lives. Over the 12 modules, you\'ll learn to support families before, during and after the birth, with rigour and gentleness, always keeping our compass: <em>observe, reassure, refer</em>. You\'ll also learn to take care of yourself, because a doula who lasts is a doula who respects her own limits.',
          'You are not alone on this path. I\'m with you at every step: the live workshops, mentoring, simulations and your practicums. Your mentor and I are here to answer your questions, encourage you and celebrate each of your successes.'
        ],
        conseils: [
          'Go at your own pace, one chapter at a time. Read all the way through, then take the quiz when you feel ready.',
          'Keep each module\'s practice workbook close: that\'s where theory becomes your own way of supporting families.',
          'Practise the phrases out loud, alone or with a colleague. That\'s what will come naturally on the big day.',
          'Ask your questions freely, in your Messages or at sc@academiesere.ca. No question is too small.'
        ],
        fin: 'Congratulations on this brave, heartfelt choice. I can\'t wait to see the doula you\'re going to become.'
      },
      '4e-trimestre': {
        titre: 'Advanced Fourth Trimester Support',
        corps: [
          'Welcome to Académie Sérénaissance! Congratulations on choosing the <strong>Advanced Fourth Trimester Support program</strong>. Thank you for your trust: it\'s an honour to support you in this new stage of your practice.',
          'The fourth trimester, those first weeks when a family learns to know one another, is as beautiful as it is fragile. Over the 5 modules, you\'ll deepen your understanding of physiology, breastfeeding, parenting support, ethics and caring communication, to become a steady, reassuring presence for families, always within your role: <em>observe, reassure, refer</em>.',
          'You are not alone on this path. I\'m here to answer your questions, encourage you and celebrate each of your successes, all the way to your final exam and practicum.'
        ],
        conseils: [
          'Go at your own pace, one chapter at a time, and take the quizzes when you feel ready.',
          'Take notes on what moves you: they\'ll shape the way you support families.',
          'Download your practicum kit early, so you can see where you\'re headed.',
          'Ask your questions freely, in your Messages or at sc@academiesere.ca.'
        ],
        fin: 'Congratulations on this beautiful choice. The families who cross your path are lucky.'
      },
      'marraine': {
        titre: 'Breastfeeding Peer Supporter course',
        corps: [
          'Welcome to Académie Sérénaissance! Congratulations on choosing the <strong>Breastfeeding Peer Supporter course</strong>. Thank you for your trust and for wanting to give your time and your heart to breastfeeding mothers.',
          'A peer supporter is often the gentle voice that makes all the difference in the first weeks. During this course, you\'ll learn to listen without judging, share accurate information and refer to the right resources, always staying within your role of peer support.',
          'You are not alone on this path. I\'m here to answer your questions and encourage you, all the way to your certified peer supporter profile.'
        ],
        conseils: [
          'Go at your own pace, one chapter at a time, and take the quizzes when you feel ready.',
          'Look back on your own story gently: it helps you understand, without ever becoming the norm for others.',
          'Note your region\'s resources as you read.',
          'Ask your questions freely, in your Messages or at sc@academiesere.ca.'
        ],
        fin: 'Congratulations on this generous step. The mothers you support will remember you for a long time.'
      },
      chere: function (p) { return p ? 'Dear ' + p + ',' : 'Dear student,'; },
      conseilsTitre: 'A few tips to get started',
      signature: 'With all my warmth,',
      role: 'Founder, Académie Sérénaissance',
      commencer: 'Start my course',
      imprimer: 'Print my letter',
      fermer: 'Close',
      menu: 'My welcome letter',
      date: function (d) { return d.toLocaleDateString('en-CA', { day: 'numeric', month: 'long', year: 'numeric' }); }
    }
  };

  function echapper(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var CSS =
    '.sere-lettre-fond{position:fixed;inset:0;z-index:10000;background:rgba(44,34,30,.55);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:28px 14px;animation:sereFondu .35s ease}' +
    '@keyframes sereFondu{from{opacity:0}to{opacity:1}}' +
    '.sere-lettre{position:relative;max-width:640px;width:100%;background:#fffbf6;border-radius:22px;box-shadow:0 24px 60px rgba(44,34,30,.35);padding:44px 44px 34px;color:#2c221e;font-family:Inter,Arial,sans-serif;line-height:1.7;font-size:15.5px;' +
      'background-image:radial-gradient(circle at 100% 0,#f6e2d8 0,#f6e2d8 90px,transparent 91px),radial-gradient(circle at 0 100%,#e3ece5 0,#e3ece5 70px,transparent 71px)}' +
    '.sere-lettre .entete{display:flex;align-items:center;gap:14px;margin-bottom:22px}' +
    '.sere-lettre .entete img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:#f7f1ea;flex:none}' +
    '.sere-lettre .entete strong{display:block;font-family:Fraunces,Georgia,serif;font-size:1.15rem;color:#a85743;font-weight:600}' +
    '.sere-lettre .entete small{color:#7a685e;font-size:.82rem;letter-spacing:.04em;text-transform:uppercase}' +
    '.sere-lettre .date{color:#7a685e;font-size:.9rem;text-align:right;margin:0 0 18px}' +
    '.sere-lettre h2{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.55rem;margin:0 0 14px;color:#2c221e}' +
    '.sere-lettre p{margin:0 0 14px}' +
    '.sere-lettre .conseils{background:#f7efe8;border-left:4px solid #a85743;border-radius:12px;padding:14px 18px 6px;margin:18px 0}' +
    '.sere-lettre .conseils strong{display:block;color:#a85743;font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}' +
    '.sere-lettre .conseils ul{margin:0 0 8px;padding-left:20px}.sere-lettre .conseils li{margin-bottom:6px}' +
    '.sere-lettre .signature{margin-top:22px}' +
    '.sere-lettre .nom{font-family:Fraunces,Georgia,serif;font-style:italic;font-size:1.7rem;color:#a85743;line-height:1.2;margin:4px 0 0}' +
    '.sere-lettre .role{color:#7a685e;font-size:.88rem}' +
    '.sere-lettre .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}' +
    '.sere-lettre .actions button{border-radius:50px;padding:12px 22px;font:700 .95rem Inter,Arial,sans-serif;cursor:pointer;border:1px solid #a85743}' +
    '.sere-lettre .go{background:#a85743;color:#fff}.sere-lettre .imp{background:#fff;color:#a85743}' +
    '.sere-lettre .x{position:absolute;top:14px;right:16px;background:none;border:0;font-size:1.3rem;color:#7a685e;cursor:pointer}' +
    '@media (max-width:600px){.sere-lettre{padding:34px 22px 26px;font-size:15px}.sere-lettre h2{font-size:1.3rem}}' +
    '@media print{html.sere-impression body>*:not(.sere-lettre-fond){display:none!important}' +
      'html.sere-impression .sere-lettre-fond{position:static;background:none;padding:0;overflow:visible}' +
      'html.sere-impression .sere-lettre{box-shadow:none;max-width:none}html.sere-impression .sere-lettre .actions,html.sere-impression .sere-lettre .x{display:none}}';

  function afficher(o) {
    var T = TEXTES[o.en ? 'en' : 'fr'], F = T[o.formation];
    if (!F) return;
    if (!document.getElementById('sere-lettre-css')) { var s = document.createElement('style'); s.id = 'sere-lettre-css'; s.textContent = CSS; document.head.appendChild(s); }
    var vieux = document.querySelector('.sere-lettre-fond'); if (vieux) vieux.remove();
    var fond = document.createElement('div'); fond.className = 'sere-lettre-fond';
    fond.innerHTML =
      '<article class="sere-lettre" role="dialog" aria-modal="true" aria-label="' + echapper(T.menu) + '">' +
      '<button type="button" class="x" aria-label="' + T.fermer + '">✕</button>' +
      '<div class="entete"><img src="/icones/icone-192.png" alt=""><div><strong>Académie Sérénaissance</strong><small>' + F.titre + '</small></div></div>' +
      '<p class="date">' + T.date(o.depuis ? new Date(o.depuis) : new Date()) + '</p>' +
      '<h2>' + echapper(T.chere(o.prenom)) + '</h2>' +
      F.corps.map(function (p) { return '<p>' + p + '</p>'; }).join('') +
      '<div class="conseils"><strong>' + T.conseilsTitre + '</strong><ul>' + F.conseils.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul></div>' +
      '<p>' + F.fin + '</p>' +
      '<div class="signature">' + T.signature + '<div class="nom">Sabrina Chavanel</div><div class="role">' + T.role + '</div></div>' +
      '<div class="actions"><button type="button" class="go">' + T.commencer + ' 🌸</button><button type="button" class="imp">' + T.imprimer + '</button></div>' +
      '</article>';
    function fermer() { fond.remove(); document.removeEventListener('keydown', esc); }
    function esc(e) { if (e.key === 'Escape') fermer(); }
    fond.querySelector('.x').addEventListener('click', fermer);
    fond.querySelector('.go').addEventListener('click', fermer);
    fond.addEventListener('click', function (e) { if (e.target === fond) fermer(); });
    document.addEventListener('keydown', esc);
    fond.querySelector('.imp').addEventListener('click', function () {
      document.documentElement.classList.add('sere-impression');
      window.print();
      setTimeout(function () { document.documentElement.classList.remove('sere-impression'); }, 500);
    });
    document.body.appendChild(fond);
    fond.querySelector('.go').focus();
  }

  function boutonMenu(o) {
    var m = document.querySelector('.sere-menu');
    if (!m || m.querySelector('.sere-lettre-lien')) return;
    var T = TEXTES[o.en ? 'en' : 'fr'];
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sere-lettre-lien'; b.title = T.menu;
    b.innerHTML = '<span class="t">' + T.menu + '</span><span>💌</span>';
    b.addEventListener('click', function () { afficher(o); });
    m.insertBefore(b, m.firstChild);
  }

  /* o = { sb, session, formation, en } */
  function demarrer(o) {
    var cle = CLES[o.formation];
    if (!cle || !TEXTES.fr[o.formation]) return;
    var deja = null; try { deja = localStorage.getItem(cle); } catch (e) {}
    var u = o.session && o.session.user;
    var req = u ? o.sb.from('etudiantes').select('prenom,created_at').or('user_id.eq.' + u.id + ',courriel.ilike.' + (u.email || '').toLowerCase())
      .order('created_at', { ascending: false }).limit(1).then(function (r) { return (r.data && r.data[0]) || {}; }, function () { return {}; }) : Promise.resolve({});
    req.then(function (d) {
      o.prenom = (d.prenom || '').trim();
      o.depuis = deja && !isNaN(Date.parse(deja)) ? deja : null;
      boutonMenu(o);
      if (!deja) {
        var maintenant = new Date().toISOString();
        o.depuis = maintenant;
        try { localStorage.setItem(cle, maintenant); } catch (e) {}
        afficher(o);
      }
    });
  }

  window.SereLettre = { demarrer: demarrer, afficher: afficher };
})();
