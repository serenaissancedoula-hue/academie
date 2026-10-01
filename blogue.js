/* Académie Sérénaissance — le blogue (partagé par l'accueil FR/EN et les pages /blogue/ et /en/blog/).
   window.SereBlogue = { rendre(texte) → html, charger() → Promise<articles>, dateLongue(iso, langue) }
   - rendre() : rendu SÛR d'un texte simple. Tout est d'abord échappé (aucun HTML brut accepté), puis seules ces balises
     sont reconstruites : paragraphes (ligne vide), « ## » h2, « ### » h3, lignes « - » en liste, **gras**, *italique*,
     [texte](https://lien) (https seulement, rel="noopener" target="_blank").
   - charger() : articles publiés (lecture anonyme de la table « articles »), du plus récent au plus ancien.
     Ne rejette jamais : renvoie [] s'il y a une erreur réseau.
   - Auto-initialisation : #accueil-blogue (section de l'accueil, cachée s'il n'y a aucun article) et #blogue-app (pages du blogue). */
(function () {
  'use strict';
  var SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co', SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
  var SITE = 'https://academiesere.ca';
  var MOIS = {
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };
  var T = {
    fr: { base: '/blogue/', autre: '/en/blog/', titre: 'Le blogue', soustitre: 'Des articles pour traverser la grossesse, la naissance et le post-partum avec confiance.',
      lire: "Lire l'article →", tous: 'Tous les articles', retour: '← Tous les articles', chargement: 'Chargement…',
      aucun: 'Les articles ne sont pas disponibles pour le moment. Reviens bientôt !', introuvable: "Cet article est introuvable ou n'est pas disponible en français.",
      autres: 'À lire aussi', avis: "Cet article est informatif : il ne remplace pas l'avis d'une professionnelle ou d'un professionnel de la santé. En cas de doute ou d'urgence, consulte ou appelle sans tarder.",
      pageTitre: 'Le blogue · Académie Sérénaissance', pageDesc: 'Articles de Sabrina Chavanel, doula à Campbellton (N.-B.) : 4ᵉ trimestre, post-partum, allaitement et santé mentale périnatale.' },
    en: { base: '/en/blog/', autre: '/blogue/', titre: 'Blog', soustitre: 'Articles to help you move through pregnancy, birth and postpartum with confidence.',
      lire: 'Read the article →', tous: 'All articles', retour: '← All articles', chargement: 'Loading…',
      aucun: 'Articles are not available right now. Please check back soon!', introuvable: 'This article could not be found or is not available in English.',
      autres: 'Keep reading', avis: 'This article is for information only: it does not replace the advice of a health professional. If in doubt or in an emergency, get help right away.',
      pageTitre: 'Blog · Académie Sérénaissance', pageDesc: 'Articles by Sabrina Chavanel, doula in Campbellton, N.B.: the fourth trimester, postpartum, breastfeeding and perinatal mental health.' }
  };

  function langue() { return (document.documentElement.lang || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr'; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Rendu sûr ----------
  function emphase(s) {
    s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    return s.replace(/(^|[^*])\*([^*\s][^*\n]*?)\*(?!\*)/g, '$1<em>$2</em>');
  }
  function enLigne(brut) {
    var s = esc(String(brut).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ''));
    var liens = [];
    s = s.replace(/\[([^\]\n]+)\]\((https:\/\/[^\s()]+)\)/g, function (m, t, u) {
      liens.push({ t: t, u: u });
      return '\u0001' + (liens.length - 1) + '\u0002';
    });
    s = emphase(s);
    return s.replace(/\u0001(\d+)\u0002/g, function (m, i) {
      var l = liens[+i];
      return '<a href="' + l.u + '" target="_blank" rel="noopener">' + emphase(l.t) + '</a>';
    });
  }
  function rendre(texte) {
    var lignes = String(texte == null ? '' : texte).replace(/\r\n?/g, '\n').split('\n');
    var html = [], para = [], liste = [], m;
    function viderPara() { if (para.length) { html.push('<p>' + enLigne(para.join(' ')) + '</p>'); para = []; } }
    function viderListe() { if (liste.length) { html.push('<ul>' + liste.map(function (x) { return '<li>' + enLigne(x) + '</li>'; }).join('') + '</ul>'); liste = []; } }
    lignes.forEach(function (l) {
      var t = l.replace(/\s+$/, '');
      if (!t.trim()) { viderPara(); viderListe(); return; }
      if ((m = /^###\s+(.+)$/.exec(t))) { viderPara(); viderListe(); html.push('<h3>' + enLigne(m[1]) + '</h3>'); return; }
      if ((m = /^##\s+(.+)$/.exec(t))) { viderPara(); viderListe(); html.push('<h2>' + enLigne(m[1]) + '</h2>'); return; }
      if ((m = /^-\s+(.+)$/.exec(t))) { viderPara(); liste.push(m[1]); return; }
      viderListe(); para.push(t.trim());
    });
    viderPara(); viderListe();
    return html.join('\n');
  }

  // ---------- Dates ----------
  function dateLongue(iso, lang) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    if (!m) return '';
    var l = lang === 'en' ? 'en' : 'fr', an = +m[1], mo = +m[2] - 1, j = +m[3];
    if (mo < 0 || mo > 11) return '';
    if (l === 'en') return MOIS.en[mo] + ' ' + j + ', ' + an;
    return (j === 1 ? '1er' : j) + ' ' + MOIS.fr[mo] + ' ' + an;
  }

  // ---------- Données ----------
  var promesse = null;
  function charger() {
    if (promesse) return promesse;
    var url = SB_URL + '/rest/v1/articles?select=slug,titre,titre_en,resume,resume_en,contenu,contenu_en,image,date_publication&publie=eq.true&order=date_publication.desc';
    promesse = fetch(url, { headers: { apikey: SB_CLE } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (d) {
        return Array.isArray(d) ? d.filter(function (a) { return a && typeof a.slug === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(a.slug); }) : [];
      })
      .catch(function () { return []; });
    return promesse;
  }
  function pourLangue(articles, l) {
    return articles.filter(function (a) { return l === 'en' ? (a.titre_en && a.contenu_en) : (a.titre && a.contenu); });
  }
  function champ(a, nom, l) { return l === 'en' ? a[nom + '_en'] : a[nom]; }
  function cheminImage(src) {
    src = String(src || '');
    return /^\/[^\/]/.test(src) || /^https:\/\//.test(src) ? src : '';
  }

  // ---------- Styles (cartes et contenu) ----------
  function styles() {
    if (document.getElementById('style-blogue')) return;
    var st = document.createElement('style'); st.id = 'style-blogue';
    st.textContent =
      '.sb-grille{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin:0 0 26px;padding:0;list-style:none}' +
      '.sb-carte{background:var(--card-bg,#fffbf8);border:1px solid var(--border-color,#e3d5c8);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 5px 20px rgba(0,0,0,.03);min-width:0}' +
      '.sb-carte img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block;background:#efe6dc}' +
      '.sb-corps{padding:18px 20px 22px;display:flex;flex-direction:column;flex:1;text-align:left}' +
      '.sb-date{font-size:.8rem;font-weight:600;color:var(--text-muted,#7a685e);margin:0 0 6px;letter-spacing:.02em}' +
      '.sb-carte h2,.sb-carte h3{font-family:"Playfair Display",Georgia,serif;font-size:1.2rem;line-height:1.3;margin:0 0 8px;color:var(--text-dark,#2c221e)}' +
      '.sb-carte h2 a,.sb-carte h3 a{color:inherit;text-decoration:none}' +
      '.sb-carte h2 a:hover,.sb-carte h3 a:hover{color:var(--accent-terracotta,#a85743)}' +
      '.sb-resume{font-size:.95rem;color:#555;margin:0 0 14px}' +
      '.sb-lire{margin-top:auto;font-weight:700;font-size:.92rem;color:var(--accent-terracotta,#a85743);text-decoration:none}' +
      '.sb-lire:hover{text-decoration:underline}' +
      '.sb-carte a:focus-visible,.sb-bouton:focus-visible{outline:3px solid var(--accent-terracotta,#a85743);outline-offset:3px;border-radius:6px}' +
      '.sb-centre{text-align:center}' +
      '.sb-bouton{display:inline-flex;align-items:center;justify-content:center;border:2px solid var(--border-color,#e3d5c8);border-radius:50px;padding:13px 26px;font-weight:600;font-size:.95rem;color:var(--text-dark,#2c221e);text-decoration:none;background:transparent;transition:all .3s}' +
      '.sb-bouton:hover{border-color:var(--accent-terracotta,#a85743);color:var(--accent-terracotta,#a85743)}' +
      '.blogue-contenu{font-size:1.06rem;line-height:1.75;color:#3a2f2a;overflow-wrap:break-word}' +
      '.blogue-contenu p{margin:0 0 1.1em}' +
      '.blogue-contenu h2{font-family:"Playfair Display",Georgia,serif;font-size:1.55rem;line-height:1.25;margin:1.7em 0 .5em;color:var(--text-dark,#2c221e)}' +
      '.blogue-contenu h3{font-size:1.15rem;margin:1.4em 0 .4em;color:var(--text-dark,#2c221e)}' +
      '.blogue-contenu ul{margin:0 0 1.2em 1.3em}' +
      '.blogue-contenu li{margin-bottom:.45em;padding-left:.2em}' +
      '.blogue-contenu a{color:var(--accent-terracotta,#a85743);text-underline-offset:3px;word-break:break-word}' +
      '@media(max-width:900px){.sb-grille{grid-template-columns:1fr 1fr}}' +
      '@media(max-width:600px){.sb-grille{grid-template-columns:1fr;gap:18px}.blogue-contenu{font-size:1.02rem}.blogue-contenu h2{font-size:1.35rem}}';
    (document.head || document.documentElement).appendChild(st);
  }

  // ---------- Cartes ----------
  function carte(a, l, niveau) {
    var t = T[l], lien = t.base + '?a=' + encodeURIComponent(a.slug), img = cheminImage(a.image);
    var li = document.createElement('li'); li.className = 'sb-carte';
    var h = '';
    if (img) h += '<a href="' + esc(lien) + '" tabindex="-1" aria-hidden="true"><img src="' + esc(img) + '" alt="" loading="lazy" width="640" height="400"></a>';
    h += '<div class="sb-corps"><p class="sb-date">' + esc(dateLongue(a.date_publication, l)) + '</p>' +
      '<h' + niveau + '><a href="' + esc(lien) + '">' + esc(champ(a, 'titre', l)) + '</a></h' + niveau + '>';
    var r = champ(a, 'resume', l);
    if (r) h += '<p class="sb-resume">' + esc(r) + '</p>';
    h += '<a class="sb-lire" href="' + esc(lien) + '">' + esc(t.lire) + '</a></div>';
    li.innerHTML = h;
    return li;
  }
  function grille(articles, l, niveau) {
    var ul = document.createElement('ul'); ul.className = 'sb-grille';
    articles.forEach(function (a) { ul.appendChild(carte(a, l, niveau)); });
    return ul;
  }

  // ---------- Section de l'accueil ----------
  function initAccueil(el) {
    var l = langue(), t = T[l];
    charger().then(function (tous) {
      var liste = pourLangue(tous, l).slice(0, 3);
      if (!liste.length) return;
      styles();
      el.setAttribute('aria-labelledby', 'titre-blogue-accueil');
      el.innerHTML = '<div class="section-header-centered" style="margin-bottom:24px"><h2 id="titre-blogue-accueil">' + esc(t.titre) + '</h2><p>' + esc(t.soustitre) + '</p></div>';
      el.appendChild(grille(liste, l, 3));
      var p = document.createElement('p'); p.className = 'sb-centre';
      p.innerHTML = '<a class="sb-bouton" href="' + esc(t.base) + '">' + esc(t.tous) + '</a>';
      el.appendChild(p);
      el.hidden = false;
    });
  }

  // ---------- Pages du blogue ----------
  function meta(sel, creer, attr, val) {
    var e = document.querySelector(sel);
    if (!e && creer) { e = document.createElement(creer.tag); Object.keys(creer.attrs).forEach(function (k) { e.setAttribute(k, creer.attrs[k]); }); document.head.appendChild(e); }
    if (e) e.setAttribute(attr, val);
  }
  function referencer(titre, desc, canonique, image) {
    document.title = titre;
    meta('meta[name="description"]', { tag: 'meta', attrs: { name: 'description' } }, 'content', desc);
    meta('link[rel="canonical"]', { tag: 'link', attrs: { rel: 'canonical' } }, 'href', canonique);
    meta('meta[property="og:title"]', { tag: 'meta', attrs: { property: 'og:title' } }, 'content', titre);
    meta('meta[property="og:description"]', { tag: 'meta', attrs: { property: 'og:description' } }, 'content', desc);
    meta('meta[property="og:url"]', { tag: 'meta', attrs: { property: 'og:url' } }, 'content', canonique);
    meta('meta[property="og:image"]', { tag: 'meta', attrs: { property: 'og:image' } }, 'content', image || SITE + '/og-image.jpg');
  }
  function jsonLd(obj) {
    var anc = document.getElementById('jsonld-article');
    if (anc) anc.remove();
    if (!obj) return;
    var s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'jsonld-article';
    s.textContent = JSON.stringify(obj).replace(/</g, '\\u003c');
    document.head.appendChild(s);
  }
  function lienLangue(l, slug, articlesAutre) {
    // lien FR | EN croisé : garde l'article seulement s'il existe dans l'autre langue
    var a = document.getElementById('lien-autre-langue');
    if (!a) return;
    var autre = l === 'fr' ? 'en' : 'fr', ok = slug && articlesAutre && articlesAutre.some(function (x) { return x.slug === slug; });
    a.href = T[autre].base + (ok ? '?a=' + encodeURIComponent(slug) : '');
    a.addEventListener('click', function () { try { localStorage.setItem('sere-langue', autre); } catch (e) {} });
  }

  function initPage(app) {
    var l = langue(), t = T[l], slug = new URLSearchParams(location.search).get('a');
    app.innerHTML = '<p class="sb-centre" role="status">' + esc(t.chargement) + '</p>';
    styles();
    charger().then(function (tous) {
      var liste = pourLangue(tous, l), autreL = l === 'fr' ? 'en' : 'fr';
      lienLangue(l, slug, pourLangue(tous, autreL));
      var art = slug ? liste.filter(function (a) { return a.slug === slug; })[0] : null;
      app.innerHTML = '';
      if (slug && art) return vueArticle(app, art, liste, l);
      jsonLd(null);
      referencer(t.pageTitre, t.pageDesc, SITE + t.base, null);
      if (slug) {
        app.innerHTML = '<h1 class="sb-h1">' + esc(t.titre) + '</h1><p class="sb-centre">' + esc(t.introuvable) + '</p><p class="sb-centre"><a class="sb-bouton" href="' + esc(t.base) + '">' + esc(t.tous) + '</a></p>';
        return;
      }
      app.innerHTML = '<h1 class="sb-h1">' + esc(t.titre) + '</h1><p class="sb-intro">' + esc(t.soustitre) + '</p>';
      if (!liste.length) { var p = document.createElement('p'); p.className = 'sb-centre'; p.textContent = t.aucun; app.appendChild(p); return; }
      app.appendChild(grille(liste, l, 2));
    });
  }

  function vueArticle(app, a, liste, l) {
    var t = T[l], titre = champ(a, 'titre', l), resume = champ(a, 'resume', l) || '', img = cheminImage(a.image);
    var canon = SITE + t.base + '?a=' + encodeURIComponent(a.slug);
    var imgAbs = img ? (img.charAt(0) === '/' ? SITE + img : img) : SITE + '/og-image.jpg';
    var desc = (resume || String(champ(a, 'contenu', l)).replace(/[#*\[\]\n]+/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 300);
    referencer(titre + ' · ' + (l === 'en' ? 'Blog' : 'Blogue') + ' · Sérénaissance', desc, canon, imgAbs);
    jsonLd({
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: titre, description: desc, inLanguage: l,
      image: [imgAbs], datePublished: String(a.date_publication || '').slice(0, 10), dateModified: String(a.date_publication || '').slice(0, 10),
      mainEntityOfPage: { '@type': 'WebPage', '@id': canon },
      author: { '@type': 'Person', name: 'Sabrina Chavanel', jobTitle: l === 'en' ? 'Doula' : 'Doula, intervenante en relation d\'aide' },
      publisher: { '@type': 'Organization', name: 'Académie Sérénaissance', logo: { '@type': 'ImageObject', url: SITE + '/logo.jpg' } }
    });
    var art = document.createElement('article'); art.className = 'sb-article';
    art.innerHTML = '<p class="sb-retour"><a href="' + esc(t.base) + '">' + esc(t.retour) + '</a></p>' +
      '<h1 class="sb-h1 sb-h1-article">' + esc(titre) + '</h1>' +
      '<p class="sb-date"><time datetime="' + esc(String(a.date_publication || '').slice(0, 10)) + '">' + esc(dateLongue(a.date_publication, l)) + '</time> · Sabrina Chavanel</p>' +
      (img ? '<img class="sb-image" src="' + esc(img) + '" alt="" width="1000" height="625">' : '') +
      '<div class="blogue-contenu">' + rendre(champ(a, 'contenu', l)) + '</div>' +
      '<p class="sb-avis">' + esc(t.avis) + '</p>';
    app.appendChild(art);
    var autres = liste.filter(function (x) { return x.slug !== a.slug; }).slice(0, 3);
    if (autres.length) {
      var sec = document.createElement('section'); sec.className = 'sb-autres'; sec.setAttribute('aria-labelledby', 'titre-autres');
      sec.innerHTML = '<h2 id="titre-autres" class="sb-h2">' + esc(t.autres) + '</h2>';
      sec.appendChild(grille(autres, l, 3));
      app.appendChild(sec);
    }
    window.scrollTo(0, 0);
  }

  window.SereBlogue = { rendre: rendre, charger: charger, dateLongue: dateLongue };

  function demarrer() {
    var a = document.getElementById('accueil-blogue'); if (a) initAccueil(a);
    var p = document.getElementById('blogue-app'); if (p) initPage(p);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
