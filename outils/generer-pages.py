#!/usr/bin/env python3
"""Génère une page statique par section du site (/faq/, /formatrices/, /en/trainers/, …).

Chaque copie est index.html (ou en/index.html) avec son propre titre, sa description,
son adresse canonique et la bonne section ouverte. Les moteurs de recherche voient
donc une vraie page par adresse, et le site s'ouvre sur la bonne section.

À relancer après toute modification de index.html ou en/index.html :
    python3 outils/generer-pages.py
Les dossiers générés (accompagnements/, formations/, marraines/, faq/, formatrices/,
a-propos/, conditions/, confidentialite/ et leurs équivalents dans en/) ne se modifient
jamais à la main.
"""
import html, json, os, re, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAINE = 'https://academiesere.ca'
SOURCES = {'fr': ('index.html', '/'), 'en': ('en/index.html', '/en/')}

def lire(f):
    with open(os.path.join(RACINE, f), encoding='utf-8') as fh:
        return fh.read()

def pages_seo(src):
    m = re.search(r'const PAGES_SEO = (\{.*?\});\n        const ADRESSE_ACCUEIL', src, re.S)
    return json.loads(m.group(1))

def meta(src, motif, valeur):
    return re.sub(motif, lambda m: m.group(1) + html.escape(valeur, quote=True) + m.group(2), src, count=1)

def generer(lang):
    fichier, accueil = SOURCES[lang]
    src = lire(fichier)
    pages = pages_seo(src)
    autre = 'en' if lang == 'fr' else 'fr'
    src_autre = lire(SOURCES[autre][0])
    pages_autre = pages_seo(src_autre)
    sorties = []
    for pid, p in pages.items():
        s = src
        url = DOMAINE + p['chemin']
        # <base> : les liens relatifs (images, scripts) restent ceux de l'accueil
        s = s.replace('<head>', '<head>\n    <base href="%s">' % accueil, 1)
        s = meta(s, r'(<title>)[^<]*(</title>)', p['titre'])
        s = meta(s, r'(<meta name="description" content=")[^"]*(")', p['description'])
        s = meta(s, r'(<meta property="og:title" content=")[^"]*(")', p['titre'])
        s = meta(s, r'(<meta property="og:description" content=")[^"]*(")', p['description'])
        s = meta(s, r'(<meta property="og:url" content=")[^"]*(")', url)
        s = meta(s, r'(<meta name="twitter:title" content=")[^"]*(")', p['titre'])
        s = meta(s, r'(<meta name="twitter:description" content=")[^"]*(")', p['description'])
        s = meta(s, r'(<link rel="canonical" href=")[^"]*(")', url)
        eq = pages_autre[pid]['chemin']
        fr_url, en_url = (url, DOMAINE + eq) if lang == 'fr' else (DOMAINE + eq, url)
        s = meta(s, r'(<link rel="alternate" hreflang="fr" href=")[^"]*(")', fr_url)
        s = meta(s, r'(<link rel="alternate" hreflang="en" href=")[^"]*(")', en_url)
        s = meta(s, r'(<link rel="alternate" hreflang="x-default" href=")[^"]*(")', fr_url)
        # La bonne section est déjà ouverte au chargement (pas de flash de l'accueil)
        s = s.replace('<div id="page-accueil" class="page-section active">', '<div id="page-accueil" class="page-section">', 1)
        s = s.replace('<div id="page-%s" class="page-section">' % pid, '<div id="page-%s" class="page-section active">' % pid, 1)
        s = s.replace('class="active" id="nav-accueil"', 'id="nav-accueil"', 1)
        s = re.sub(r'(<a href="[^"]*" onclick="switchPage\(\'%s\'[^>]*?)( id="nav-%s")' % (pid, pid), r'\1 class="active"\2', s, count=1)
        dossier = os.path.join(RACINE, p['chemin'].strip('/'))
        os.makedirs(dossier, exist_ok=True)
        with open(os.path.join(dossier, 'index.html'), 'w', encoding='utf-8') as fh:
            fh.write(s)
        sorties.append(p['chemin'])
    return sorties

if __name__ == '__main__':
    for l in ('fr', 'en'):
        for c in generer(l):
            print('✓', c)
