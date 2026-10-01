/* Académie Sérénaissance — carrousel de témoignages de l'accueil (FR et EN).
   Données : rpc « temoignages_publics » → [{categorie:'etudiante'|'famille', nom, role, role_en, texte, texte_en, note}].
   La section #temoignages reste cachée s'il n'y a aucune donnée ou en cas d'erreur réseau (aucun message au public).
   Défilement automatique (defilement.js : pause au toucher, au survol et au clavier, bouton pause) + glisser au doigt (scroll-snap) + flèches + points. */
(function () {
  'use strict';
  var SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co', SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
  var l = (document.documentElement.lang || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr';
  var T = {
    fr: { etudiante: 'Ce que disent nos étudiantes', famille: 'Ce que disent les familles', region: 'Témoignages', prec: 'Témoignage précédent', suiv: 'Témoignage suivant',
      lire: 'Lire la suite', replier: 'Réduire', point: function (i, n) { return 'Aller au témoignage ' + i + ' sur ' + n; }, slide: function (i, n) { return 'Témoignage ' + i + ' sur ' + n; },
      note: function (n) { return 'Note : ' + n + ' sur 5'; }, perm: 'Témoignages publiés avec la permission de leurs autrices.', enFr: '' },
    en: { etudiante: 'What our students say', famille: 'What families say', region: 'Testimonials', prec: 'Previous testimonial', suiv: 'Next testimonial',
      lire: 'Read more', replier: 'Show less', point: function (i, n) { return 'Go to testimonial ' + i + ' of ' + n; }, slide: function (i, n) { return 'Testimonial ' + i + ' of ' + n; },
      note: function (n) { return 'Rating: ' + n + ' out of 5'; }, perm: "Testimonials published with their authors' permission.", enFr: ' (in French)' }
  }[l];
  var reduit = false;
  try { reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function styles() {
    if (document.getElementById('style-temoignages')) return;
    var st = document.createElement('style'); st.id = 'style-temoignages';
    st.textContent =
      '.tem{max-width:1100px;margin:0 auto 40px;min-width:0}' +
      '.tem-onglets{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:0 0 20px}' +
      '.tem-onglet{font:600 .92rem/1.2 "Plus Jakarta Sans",sans-serif;padding:10px 18px;border-radius:50px;border:2px solid var(--border-color,#e3d5c8);background:transparent;color:var(--text-dark,#2c221e);cursor:pointer;transition:all .25s}' +
      '.tem-onglet:hover{border-color:var(--accent-terracotta,#a85743);color:var(--accent-terracotta,#a85743)}' +
      '.tem-onglet[aria-selected="true"]{background:var(--accent-terracotta,#a85743);border-color:var(--accent-terracotta,#a85743);color:#fff}' +
      '.tem-titre-seul{font-family:"Playfair Display",Georgia,serif;font-size:1.3rem;text-align:center;margin:0 0 20px;color:var(--text-dark,#2c221e)}' +
      '.tem-scene{position:relative}' +
      '.tem-piste{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:6px 2px 14px;margin:0;list-style:none;scrollbar-width:none;overscroll-behavior-x:contain}' +
      '.tem-piste::-webkit-scrollbar{display:none}' +
      '.tem-piste:focus-visible,.tem-onglet:focus-visible,.tem-fleche:focus-visible,.tem-point:focus-visible,.tem-plus:focus-visible{outline:3px solid var(--accent-terracotta,#a85743);outline-offset:3px}' +
      '.tem-carte{flex:0 0 86%;scroll-snap-align:start;background:var(--card-bg,#fffbf8);border:1px solid var(--border-color,#e3d5c8);border-radius:20px;padding:24px 22px 20px;box-shadow:0 5px 20px rgba(0,0,0,.03);display:flex;flex-direction:column;min-width:0;position:relative}' +
      '.tem-guill{font-family:"Playfair Display",Georgia,serif;font-size:3.2rem;line-height:.6;height:26px;color:var(--accent-terracotta,#a85743);opacity:.55;margin:0 0 4px;user-select:none}' +
      '.tem-etoiles{color:var(--accent-terracotta,#a85743);letter-spacing:2px;font-size:.95rem;margin:0 0 8px}' +
      '.tem-texte{font-size:.98rem;line-height:1.6;color:#4a3c35;margin:0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:8;line-clamp:8;overflow:hidden;white-space:pre-line;overflow-wrap:break-word}' +
      '.tem-carte.ouvert .tem-texte{display:block;-webkit-line-clamp:unset;line-clamp:unset;overflow:visible}' +
      '.tem-plus{align-self:flex-start;background:none;border:0;padding:8px 0 2px;margin-top:4px;font:700 .88rem "Plus Jakarta Sans",sans-serif;color:var(--accent-terracotta,#a85743);cursor:pointer;text-decoration:underline;text-underline-offset:3px;border-radius:6px}' +
      '.tem-qui{margin-top:auto;padding-top:16px}' +
      '.tem-nom{display:block;font-weight:700;color:var(--text-dark,#2c221e);font-size:1rem}' +
      '.tem-role{display:block;font-size:.85rem;color:var(--text-muted,#7a685e)}' +
      '.tem-barre{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:6px}' +
      '.tem-fleche{width:44px;height:44px;border-radius:50%;border:2px solid var(--border-color,#e3d5c8);background:var(--card-bg,#fffbf8);color:var(--text-dark,#2c221e);font-size:1.15rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s;flex:0 0 auto}' +
      '.tem-fleche:hover:not([disabled]){border-color:var(--accent-terracotta,#a85743);color:var(--accent-terracotta,#a85743)}' +
      '.tem-fleche[disabled]{opacity:.35;cursor:default}' +
      '.tem-points{display:flex;flex-wrap:wrap;justify-content:center;gap:2px;max-width:60%}' +
      '.tem-point{width:24px;height:24px;border:0;background:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:50%}' +
      '.tem-point::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--border-color,#e3d5c8);border:1px solid #cdb9a8;transition:all .25s}' +
      '.tem-point[aria-current="true"]::before{background:var(--accent-terracotta,#a85743);border-color:var(--accent-terracotta,#a85743);transform:scale(1.25)}' +
      '.tem-perm{text-align:center;font-size:.8rem;color:var(--text-muted,#7a685e);margin:16px 0 0}' +
      '.tem-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
      '@media(min-width:700px){.tem-carte{flex-basis:calc((100% - 16px)/2)}}' +
      '@media(min-width:1000px){.tem-carte{flex-basis:calc((100% - 32px)/3)}}';
    (document.head || document.documentElement).appendChild(st);
  }

  function construire(sec, donnees) {
    var cats = ['etudiante', 'famille'].filter(function (c) { return donnees[c].length; });
    styles();
    sec.setAttribute('role', 'region');
    sec.setAttribute('aria-roledescription', 'carousel');
    sec.setAttribute('aria-label', T.region);
    sec.className = 'tem';
    sec.innerHTML = '';
    var entete = el('div', 'section-header-centered'); entete.style.marginBottom = '22px';
    var titreSection = el('h2', null, cats.length === 1 ? T[cats[0]] : (l === 'en' ? 'Testimonials' : 'Témoignages'));
    titreSection.id = 'titre-temoignages';
    entete.appendChild(titreSection);
    sec.appendChild(entete);

    var onglets = null, courante = cats[0];
    if (cats.length > 1) {
      onglets = el('div', 'tem-onglets'); onglets.setAttribute('role', 'tablist'); onglets.setAttribute('aria-labelledby', 'titre-temoignages');
      cats.forEach(function (c) {
        var b = el('button', 'tem-onglet', T[c]); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'tem-onglet-' + c; b.dataset.cat = c;
        b.setAttribute('aria-controls', 'tem-panneau'); b.setAttribute('aria-selected', c === courante ? 'true' : 'false'); b.tabIndex = c === courante ? 0 : -1;
        onglets.appendChild(b);
      });
      sec.appendChild(onglets);
    } else {
      entete.querySelector('h2').textContent = T[cats[0]];
    }

    var panneau = el('div', 'tem-scene'); panneau.id = 'tem-panneau';
    if (onglets) { panneau.setAttribute('role', 'tabpanel'); panneau.setAttribute('aria-labelledby', 'tem-onglet-' + courante); }
    var piste = el('ul', 'tem-piste'); piste.tabIndex = 0; piste.setAttribute('aria-live', 'off');
    piste.setAttribute('aria-label', T.region);
    panneau.appendChild(piste);
    var barre = el('div', 'tem-barre');
    var prec = el('button', 'tem-fleche', '‹'); prec.type = 'button'; prec.setAttribute('aria-label', T.prec);
    var suiv = el('button', 'tem-fleche', '›'); suiv.type = 'button'; suiv.setAttribute('aria-label', T.suiv);
    var points = el('div', 'tem-points');
    barre.appendChild(prec); barre.appendChild(points); barre.appendChild(suiv);
    panneau.appendChild(barre);
    sec.appendChild(panneau);
    sec.appendChild(el('p', 'tem-perm', T.perm));

    var cartes = [], actif = 0, raf = 0;

    function pas() {
      var c = piste.querySelector('.tem-carte'); if (!c) return piste.clientWidth;
      var g = parseFloat(getComputedStyle(piste).columnGap || getComputedStyle(piste).gap) || 16;
      return c.getBoundingClientRect().width + g;
    }
    function maj() {
      raf = 0;
      var max = piste.scrollWidth - piste.clientWidth, x = piste.scrollLeft;
      var i = Math.round(x / (pas() || 1));
      if (max > 0 && x >= max - 2) i = cartes.length - 1;
      i = Math.max(0, Math.min(cartes.length - 1, i));
      actif = i;
      var pts = points.children;
      for (var k = 0; k < pts.length; k++) { if (k === i) pts[k].setAttribute('aria-current', 'true'); else pts[k].removeAttribute('aria-current'); }
      prec.disabled = x <= 2;
      suiv.disabled = max <= 2 || x >= max - 2;
      var fleches = max > 2; barre.style.display = '';
      prec.style.visibility = suiv.style.visibility = fleches ? '' : 'hidden';
    }
    function aller(i) {
      i = Math.max(0, Math.min(cartes.length - 1, i));
      piste.scrollTo({ left: cartes[i].offsetLeft - piste.offsetLeft - 2, behavior: reduit ? 'auto' : 'smooth' });
    }
    function mesurer() {
      cartes.forEach(function (c) {
        var t = c.querySelector('.tem-texte'), b = c.querySelector('.tem-plus');
        if (c.classList.contains('ouvert')) { b.hidden = false; return; }
        b.hidden = !(t.scrollHeight > t.clientHeight + 1);
      });
    }

    function afficher(cat) {
      courante = cat; cartes = []; piste.innerHTML = ''; points.innerHTML = '';
      var liste = donnees[cat];
      liste.forEach(function (d, i) {
        var li = el('li', 'tem-carte'); li.setAttribute('role', 'group'); li.setAttribute('aria-roledescription', 'slide'); li.setAttribute('aria-label', T.slide(i + 1, liste.length));
        li.appendChild(el('div', 'tem-guill', '“')).setAttribute('aria-hidden', 'true');
        var n = parseInt(d.note, 10);
        if (n >= 1 && n <= 5) {
          var et = el('div', 'tem-etoiles', '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n)); et.setAttribute('aria-hidden', 'true'); li.appendChild(et);
          li.appendChild(el('span', 'tem-sr', T.note(n)));
        }
        var q = el('blockquote'); q.style.margin = '0';
        var texte = l === 'en' ? (d.texte_en && String(d.texte_en).trim() ? d.texte_en : null) : d.texte;
        var tp = el('p', 'tem-texte', texte != null ? texte : (d.texte + T.enFr)); tp.id = 'tem-t-' + cat + '-' + i;
        if (l === 'en' && texte == null) tp.setAttribute('lang', 'fr');
        q.appendChild(tp); li.appendChild(q);
        var plus = el('button', 'tem-plus', T.lire); plus.type = 'button'; plus.hidden = true;
        plus.setAttribute('aria-expanded', 'false'); plus.setAttribute('aria-controls', tp.id);
        plus.addEventListener('click', function () {
          var ouvert = li.classList.toggle('ouvert');
          plus.textContent = ouvert ? T.replier : T.lire; plus.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
        });
        li.appendChild(plus);
        var qui = el('div', 'tem-qui');
        qui.appendChild(el('span', 'tem-nom', d.nom || ''));
        var role = l === 'en' ? (d.role_en || d.role) : d.role;
        if (role) qui.appendChild(el('span', 'tem-role', role));
        li.appendChild(qui);
        piste.appendChild(li); cartes.push(li);
        var pt = el('button', 'tem-point'); pt.type = 'button'; pt.setAttribute('aria-label', T.point(i + 1, liste.length));
        pt.addEventListener('click', function () { aller(i); });
        points.appendChild(pt);
      });
      piste.scrollLeft = 0;
      mesurer(); maj();
    }

    prec.addEventListener('click', function () { piste.scrollBy({ left: -pas(), behavior: reduit ? 'auto' : 'smooth' }); });
    suiv.addEventListener('click', function () { piste.scrollBy({ left: pas(), behavior: reduit ? 'auto' : 'smooth' }); });
    piste.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(maj); }, { passive: true });
    window.addEventListener('resize', function () { mesurer(); maj(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { mesurer(); maj(); });

    if (onglets) {
      var btns = Array.prototype.slice.call(onglets.querySelectorAll('button'));
      function choisir(b, focus) {
        btns.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); x.tabIndex = x === b ? 0 : -1; });
        panneau.setAttribute('aria-labelledby', b.id);
        afficher(b.dataset.cat); if (focus) b.focus();
      }
      btns.forEach(function (b, i) {
        b.addEventListener('click', function () { choisir(b, false); });
        b.addEventListener('keydown', function (e) {
          var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? btns.length - 1 : -1;
          if (j < 0) return; e.preventDefault(); choisir(btns[(j + btns.length) % btns.length], true);
        });
      });
    }
    sec.hidden = false;
    afficher(courante);
    requestAnimationFrame(function () { mesurer(); maj(); });
    if (window.SereDefilement) SereDefilement.activer(piste, { delai: 6000, conteneur: panneau, langue: l, placerBouton: function (b) { sec.insertBefore(b, sec.querySelector('.tem-perm')); } });
  }

  function demarrer() {
    var sec = document.getElementById('temoignages'); if (!sec) return;
    fetch(SB_URL + '/rest/v1/rpc/temoignages_publics', {
      method: 'POST', headers: { 'apikey': SB_CLE, 'Content-Type': 'application/json' }, body: '{}'
    }).then(function (r) { return r.ok ? r.json() : []; }).then(function (d) {
      if (!Array.isArray(d)) return;
      var par = { etudiante: [], famille: [] };
      d.forEach(function (x) {
        if (x && par[x.categorie] && x.nom && x.texte) par[x.categorie].push(x);
      });
      if (!par.etudiante.length && !par.famille.length) return;
      construire(sec, par);
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
