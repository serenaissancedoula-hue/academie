#!/usr/bin/env python3
"""Académie Sérénaissance — pages statiques du blogue (pour Google).

Lit les articles publiés dans Supabase (lecture publique, comme le site) et écrit :
  - blogue/<slug>/index.html : une vraie page par article (titre, description, image, JSON-LD) ;
  - la liste des articles directement dans blogue/index.html (entre les marqueurs BLOGUE-STATIQUE) ;
  - les adresses des articles dans sitemap.xml (entre les marqueurs BLOGUE-SITEMAP).
Les pages d'articles retirés ou dépubliés sont supprimées.

Utilisation : python3 outils/generer_blogue.py            (lit Supabase)
              python3 outils/generer_blogue.py articles.json (lit un fichier JSON)
Lancé automatiquement par .github/workflows/blogue.yml."""
import html, json, os, re, shutil, sys, urllib.request

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://academiesere.ca'
SB_URL = 'https://zeptirfcwstufcpgvkzx.supabase.co'
SB_CLE = 'sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl'
MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
AVIS = "Cet article est informatif : il ne remplace pas l'avis d'une professionnelle ou d'un professionnel de la santé. En cas de doute ou d'urgence, consulte ou appelle sans tarder."


def charger():
    if len(sys.argv) > 1:
        return json.load(open(sys.argv[1], encoding='utf-8'))
    url = SB_URL + '/rest/v1/articles?select=slug,titre,resume,contenu,image,date_publication&publie=eq.true&order=date_publication.desc'
    req = urllib.request.Request(url, headers={'apikey': SB_CLE, 'Authorization': 'Bearer ' + SB_CLE})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def esc(s):
    return html.escape(str(s or ''), quote=True)


# Même rendu sûr que blogue.js : ## h2, ### h3, lignes « - » en liste, **gras**, *italique*, [texte](https://…)
def en_ligne(brut):
    s = esc(re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', brut))
    liens = []
    def lien(m):
        liens.append((m.group(1), m.group(2)))
        return '\x01%d\x02' % (len(liens) - 1)
    s = re.sub(r'\[([^\]\n]+)\]\((https://[^\s()]+)\)', lien, s)
    def emphase(t):
        t = re.sub(r'\*\*([^*\n]+?)\*\*', r'<strong>\1</strong>', t)
        return re.sub(r'(^|[^*])\*([^*\s][^*\n]*?)\*(?!\*)', r'\1<em>\2</em>', t)
    s = emphase(s)
    return re.sub(r'\x01(\d+)\x02', lambda m: '<a href="%s" target="_blank" rel="noopener">%s</a>' % (liens[int(m.group(1))][1], emphase(liens[int(m.group(1))][0])), s)


def rendre(texte):
    out, para, liste = [], [], []
    def vider_para():
        if para: out.append('<p>' + en_ligne(' '.join(para)) + '</p>'); para.clear()
    def vider_liste():
        if liste: out.append('<ul>' + ''.join('<li>' + en_ligne(x) + '</li>' for x in liste) + '</ul>'); liste.clear()
    for l in str(texte or '').replace('\r\n', '\n').split('\n'):
        t = l.rstrip()
        if not t.strip(): vider_para(); vider_liste(); continue
        m = re.match(r'^###\s+(.+)$', t)
        if m: vider_para(); vider_liste(); out.append('<h3>' + en_ligne(m.group(1)) + '</h3>'); continue
        m = re.match(r'^##\s+(.+)$', t)
        if m: vider_para(); vider_liste(); out.append('<h2>' + en_ligne(m.group(1)) + '</h2>'); continue
        m = re.match(r'^-\s+(.+)$', t)
        if m: vider_para(); liste.append(m.group(1)); continue
        vider_liste(); para.append(t.strip())
    vider_para(); vider_liste()
    return '\n'.join(out)


def date_longue(iso):
    m = re.match(r'(\d{4})-(\d{2})-(\d{2})', str(iso or ''))
    if not m: return ''
    j = int(m.group(3))
    return ('1er' if j == 1 else str(j)) + ' ' + MOIS[int(m.group(2)) - 1] + ' ' + m.group(1)


def image(a):
    i = str(a.get('image') or '')
    if i.startswith('/') and not i.startswith('//'): return i
    if re.match(r'^https://[^\s"\']+\.(jpe?g|png|webp|gif)(\?|$)', i, re.I): return i
    return ''


def carte(a, niveau):
    lien = '/blogue/%s/' % a['slug']
    img = image(a)
    h = '<li class="sb-carte">'
    if img: h += '<a href="%s" tabindex="-1" aria-hidden="true"><img src="%s" alt="" loading="lazy" width="640" height="400"></a>' % (lien, esc(img))
    h += '<div class="sb-corps"><p class="sb-date">%s</p><h%d><a href="%s">%s</a></h%d>' % (esc(date_longue(a.get('date_publication'))), niveau, lien, esc(a['titre']), niveau)
    if a.get('resume'): h += '<p class="sb-resume">%s</p>' % esc(a['resume'])
    return h + '<a class="sb-lire" href="%s">Lire l\'article →</a></div></li>' % lien


def main():
    articles = [a for a in charger() if a.get('slug') and re.match(r'^[a-z0-9][a-z0-9-]*$', a['slug']) and a.get('titre') and a.get('contenu')]
    gabarit = open(os.path.join(RACINE, 'blogue/index.html'), encoding='utf-8').read()

    # 1) Une page par article
    garder = set()
    for a in articles:
        slug = a['slug']; garder.add(slug)
        canon = '%s/blogue/%s/' % (SITE, slug)
        img = image(a)
        img_abs = (SITE + img if img.startswith('/') else img) or SITE + '/og-image.jpg'
        desc = re.sub(r'\s+', ' ', a.get('resume') or re.sub(r'[#*\[\]\n]+', ' ', a['contenu'])).strip()[:300]
        titre = a['titre'] + ' · Blogue · Sérénaissance'
        date = str(a.get('date_publication') or '')[:10]
        ld = {'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': a['titre'], 'description': desc, 'inLanguage': 'fr',
              'image': [img_abs], 'datePublished': date, 'dateModified': date, 'mainEntityOfPage': {'@type': 'WebPage', '@id': canon},
              'author': {'@type': 'Person', 'name': 'Sabrina Chavanel', 'jobTitle': "Doula, intervenante en relation d'aide"},
              'publisher': {'@type': 'Organization', 'name': 'Académie Sérénaissance', 'logo': {'@type': 'ImageObject', 'url': SITE + '/logo.jpg'}}}
        autres = [x for x in articles if x['slug'] != slug][:3]
        corps = ('<div id="blogue-statique" style="max-width:1100px;margin:0 auto;padding:0 16px"><article class="sb-article">'
                 '<p class="sb-retour"><a href="/blogue/">← Tous les articles</a></p>'
                 '<h1 class="sb-h1 sb-h1-article">%s</h1>' % esc(a['titre']) +
                 '<p class="sb-date"><time datetime="%s">%s</time> · Sabrina Chavanel</p>' % (esc(date), esc(date_longue(date))) +
                 ('<img class="sb-image" src="%s" alt="" width="1000" height="625">' % esc(img) if img else '') +
                 '<div class="blogue-contenu">%s</div><p class="sb-avis">%s</p></article>' % (rendre(a['contenu']), esc(AVIS)))
        if autres:
            corps += '<section class="sb-autres" aria-labelledby="titre-autres"><h2 id="titre-autres" class="sb-h2">À lire aussi</h2><ul class="sb-grille">%s</ul></section>' % ''.join(carte(x, 3) for x in autres)
        corps += '</div>'
        p = gabarit
        p = re.sub(r'<title>.*?</title>', '<title>%s</title>' % esc(titre), p, count=1, flags=re.S)
        p = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % esc(desc), p, count=1)
        p = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s">' % canon, p, count=1)
        p = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?', '', p)
        p = re.sub(r'<meta property="og:type" content="[^"]*">', '<meta property="og:type" content="article">', p, count=1)
        p = re.sub(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s">' % canon, p, count=1)
        p = re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % esc(a['titre']), p, count=1)
        p = re.sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="%s">' % esc(desc), p, count=1)
        p = re.sub(r'<meta property="og:image" content="[^"]*">', '<meta property="og:image" content="%s">' % esc(img_abs), p, count=1)
        p = p.replace('</head>', '<script type="application/ld+json">%s</script>\n</head>' % json.dumps(ld, ensure_ascii=False).replace('<', '\\u003c'), 1)
        p = re.sub(r'<!-- BLOGUE-STATIQUE -->.*?<!-- /BLOGUE-STATIQUE -->', '', p, flags=re.S)
        p = re.sub(r'<div id="blogue-app">.*?</div>\n</main>', corps + '\n</main>', p, count=1, flags=re.S)
        p = p.replace('id="lien-autre-langue" href="/en/blog/"', 'id="lien-autre-langue-statique" href="/en/blog/"')
        dossier = os.path.join(RACINE, 'blogue', slug)
        os.makedirs(dossier, exist_ok=True)
        open(os.path.join(dossier, 'index.html'), 'w', encoding='utf-8').write(p)

    for d in os.listdir(os.path.join(RACINE, 'blogue')):
        chemin = os.path.join(RACINE, 'blogue', d)
        if os.path.isdir(chemin) and d not in garder:
            shutil.rmtree(chemin)

    # 2) La liste dans /blogue/ (lisible sans JavaScript ; blogue.js la remplace ensuite)
    liste = '<!-- BLOGUE-STATIQUE --><h1 class="sb-h1">Le blogue</h1><p class="sb-intro">Des articles pour traverser la grossesse, la naissance et le post-partum avec confiance.</p><ul class="sb-grille">%s</ul><!-- /BLOGUE-STATIQUE -->' % ''.join(carte(a, 2) for a in articles)
    g = re.sub(r'<!-- BLOGUE-STATIQUE -->.*?<!-- /BLOGUE-STATIQUE -->', '', gabarit, flags=re.S)
    g = g.replace('<div id="blogue-app">', '<div id="blogue-app">' + liste, 1)
    open(os.path.join(RACINE, 'blogue/index.html'), 'w', encoding='utf-8').write(g)

    # 3) Le plan du site
    sm_chemin = os.path.join(RACINE, 'sitemap.xml')
    sm = open(sm_chemin, encoding='utf-8').read()
    sm = re.sub(r'  <!-- BLOGUE-SITEMAP -->.*?<!-- /BLOGUE-SITEMAP -->\n', '', sm, flags=re.S)
    lignes = ''.join('  <url><loc>%s/blogue/%s/</loc><lastmod>%s</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n' % (SITE, a['slug'], str(a.get('date_publication') or '')[:10]) for a in articles)
    sm = sm.replace('</urlset>', '  <!-- BLOGUE-SITEMAP -->\n' + lignes + '  <!-- /BLOGUE-SITEMAP -->\n</urlset>')
    open(sm_chemin, 'w', encoding='utf-8').write(sm)
    print('%d article(s)' % len(articles))


if __name__ == '__main__':
    main()
