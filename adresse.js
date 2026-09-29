/* Académie Sérénaissance — adresse avec suggestions (pour éviter les erreurs d'envoi du certificat).
   Utilise Photon (OpenStreetMap), gratuit et mondial. Usage :
     AdresseAuto.brancher(champTexte, { codePostal: champCP, appartement: champApp, confirmation: caseACocher })
   AdresseAuto.valide(champTexte) → true si une suggestion a été choisie ou si la case « mon adresse n'apparaît pas » est cochée. */
(function () {
  'use strict';
  var css = document.createElement('style');
  css.textContent =
    '.adr-boite{position:relative}' +
    '.adr-liste{position:absolute;left:0;right:0;top:100%;z-index:50;background:#fff;border:1px solid #e3d5c8;border-radius:12px;margin-top:4px;box-shadow:0 10px 24px rgba(44,34,30,.12);overflow:hidden;list-style:none;padding:0}' +
    '.adr-liste li{padding:10px 14px;font-size:.9rem;cursor:pointer;border-bottom:1px solid #f3ebe3;line-height:1.35;color:#2c221e}' +
    '.adr-liste li:last-child{border-bottom:0}' +
    '.adr-liste li:hover,.adr-liste li.actif{background:#f7f1ea}' +
    '.adr-liste li small{display:block;color:#7a685e;font-size:.78rem}' +
    '.adr-etat{font-size:.8rem;margin-top:4px;color:#7a685e}' +
    '.adr-etat.ok{color:#2f6b2a}';
  document.head.appendChild(css);

  var PROVINCES = { 'New Brunswick': 'Nouveau-Brunswick', 'Nova Scotia': 'Nouvelle-Écosse', 'Prince Edward Island': 'Île-du-Prince-Édouard',
    'Newfoundland and Labrador': 'Terre-Neuve-et-Labrador', 'British Columbia': 'Colombie-Britannique', 'Northwest Territories': 'Territoires du Nord-Ouest' };

  function ligne(p) {
    var rue = [p.housenumber, p.street || (p.type === 'street' ? p.name : '')].filter(Boolean).join(' ');
    var nom = (!p.street && p.type !== 'street' && p.name && p.name !== p.city) ? p.name : '';
    var ville = p.city || p.town || p.village || p.district || p.county || '';
    var region = PROVINCES[p.state] || p.state || '';
    return {
      principal: [nom, rue].filter(Boolean).join(', ') || ville,
      complet: [nom, rue, ville, region, p.postcode, p.country].filter(Boolean).join(', '),
      cp: p.postcode || ''
    };
  }

  function brancher(champ, options) {
    options = options || {};
    var boite = document.createElement('div'); boite.className = 'adr-boite';
    champ.parentNode.insertBefore(boite, champ); boite.appendChild(champ);
    var liste = document.createElement('ul'); liste.className = 'adr-liste'; liste.hidden = true; boite.appendChild(liste);
    var etat = document.createElement('div'); etat.className = 'adr-etat';
    etat.textContent = 'Commence à écrire ton adresse, puis choisis-la dans la liste.';
    boite.appendChild(etat);
    champ.setAttribute('autocomplete', 'off');
    champ.dataset.adresseChoisie = champ.value ? '1' : '';
    if (champ.value) { etat.textContent = '✓ Adresse enregistrée'; etat.className = 'adr-etat ok'; }
    var minuterie = null, resultats = [], actif = -1, requete = 0;

    function fermer() { liste.hidden = true; actif = -1; }
    function choisir(r) {
      champ.value = r.complet;
      champ.dataset.adresseChoisie = '1';
      if (options.codePostal && r.cp && !options.codePostal.value) options.codePostal.value = r.cp;
      etat.textContent = '✓ Adresse sélectionnée. Ajoute ton numéro d\'appartement au besoin.';
      etat.className = 'adr-etat ok';
      fermer();
      champ.dispatchEvent(new Event('change'));
    }
    function afficher() {
      liste.innerHTML = '';
      if (!resultats.length) { fermer(); return; }
      resultats.forEach(function (r, i) {
        var li = document.createElement('li');
        li.innerHTML = '<span></span><small></small>';
        li.firstChild.textContent = r.principal;
        li.lastChild.textContent = r.complet;
        li.addEventListener('mousedown', function (e) { e.preventDefault(); choisir(r); });
        liste.appendChild(li);
      });
      liste.hidden = false;
    }
    champ.addEventListener('input', function () {
      champ.dataset.adresseChoisie = '';
      etat.textContent = 'Choisis ton adresse dans la liste pour qu\'elle soit validée.'; etat.className = 'adr-etat';
      clearTimeout(minuterie);
      var q = champ.value.trim();
      if (q.length < 4) { fermer(); return; }
      minuterie = setTimeout(function () {
        var n = ++requete;
        fetch('https://photon.komoot.io/api/?limit=6&lang=fr&q=' + encodeURIComponent(q))
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (n !== requete) return;
            var vus = {};
            resultats = (d.features || []).map(function (f) { return ligne(f.properties || {}); })
              .filter(function (r) { if (!r.complet || vus[r.complet]) return false; vus[r.complet] = 1; return true; });
            afficher();
          }).catch(function () { etat.textContent = 'Les suggestions ne sont pas disponibles pour le moment : écris ton adresse complète et coche la case ci-dessous.'; });
      }, 300);
    });
    champ.addEventListener('keydown', function (e) {
      var items = liste.querySelectorAll('li');
      if (liste.hidden || !items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        actif = (actif + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach(function (li, i) { li.classList.toggle('actif', i === actif); });
      } else if (e.key === 'Enter' && actif >= 0) { e.preventDefault(); choisir(resultats[actif]); }
      else if (e.key === 'Escape') fermer();
    });
    champ.addEventListener('blur', function () { setTimeout(fermer, 150); });
    champ._adresseOptions = options;
  }

  function valide(champ) {
    var o = champ._adresseOptions || {};
    return champ.dataset.adresseChoisie === '1' || !!(o.confirmation && o.confirmation.checked);
  }

  function composer(champ) {
    var o = champ._adresseOptions || {};
    var app = o.appartement && o.appartement.value.trim();
    var cp = o.codePostal && o.codePostal.value.trim().toUpperCase();
    var a = champ.value.trim();
    if (app) a = 'App. ' + app + ', ' + a;
    if (cp && a.toUpperCase().indexOf(cp.replace(/\s/g, '').slice(0, 3)) < 0) a += ', ' + cp;
    return a;
  }

  window.AdresseAuto = { brancher: brancher, valide: valide, composer: composer };
})();
