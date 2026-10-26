/* Académie Sérénaissance — prix et liens de paiement Stripe (un seul endroit à modifier).
   Utilisé par le site (inscription) et par l'appli Admin (liens envoyés aux étudiantes). */
(function () {
  'use strict';
  var OFFRE_FIN = new Date('2026-10-05T12:00:00-03:00');   // fin de l'offre de lancement (5 oct. à midi, heure de l'Atlantique)
  var OFFRE_ACTIVE = false;                                  // offre de lancement terminée le 5 octobre 2026

  var T = {
    'doula': {
      nom: 'Formation de base de doula · 400 h',
      court: 'Doula 400 h',
      en: { nom: 'Foundational doula training · 400 h', court: 'Doula 400 h' },
      diplome: false, marraine: false, cohorte: 'en continu', places: null,
      prixRegulier: '1 950 $',
      options: {
        '1': { prix: '1 950 $', detail: 'paiement complet', en: { prix: '$1,950', detail: 'full payment' }, lien: 'https://buy.stripe.com/fZueV6e1O7J6esQbzIffy0v' },
        '3': { prix: '3 × 650 $', detail: '3 versements', en: { prix: '3 × $650', detail: '3 instalments' }, lien: 'https://buy.stripe.com/14A6oA5vifby1G4avEffy0w' },
        '6': { prix: '6 × 325 $', detail: '6 versements aux 2 semaines', en: { prix: '6 × $325', detail: '6 instalments every 2 weeks' }, lien: 'https://buy.stripe.com/28EcMYe1Oe7u84sdHQffy0x' }
      }
    },
    '4e-trimestre': {
      nom: 'Accompagnement de pointe du 4ᵉ trimestre',
      court: '4ᵉ trimestre',
      en: { nom: 'Advanced Fourth Trimester Support', court: 'Fourth trimester' },
      diplome: true, marraine: false,
      options: {
        '1': { prix: '550 $', detail: 'paiement complet', en: { prix: '$550', detail: 'full payment' }, lien: 'https://buy.stripe.com/00wcMYg9W0gE3OccDMffy0y' },
        '2': { prix: '2 × 275 $', detail: '2 versements', en: { prix: '2 × $275', detail: '2 instalments' }, lien: 'https://buy.stripe.com/9B69AMaPC2oMacA1Z8ffy04' },
        '4': { prix: '4 × 137,50 $', detail: '4 versements aux 2 semaines', en: { prix: '4 × $137.50', detail: '4 instalments every 2 weeks' }, lien: 'https://buy.stripe.com/9B6aEQbTG4wUesQeLUffy05' }
      }
    },
    'marraine': {
      nom: "Marraine d'allaitement",
      court: 'Marraine',
      en: { nom: 'Breastfeeding Peer Supporter', court: 'Peer supporter' },
      diplome: false, marraine: true,
      options: {
        '1': { prix: '175 $', detail: 'paiement complet', en: { prix: '$175', detail: 'full payment' }, lien: 'https://buy.stripe.com/7sY5kw7Dq0gE0C047gffy06' }
      }
    },
    'combo': {
      nom: "Combo : 4ᵉ trimestre + marraine d'allaitement",
      court: 'Combo (les 2)',
      en: { nom: 'Bundle: Fourth Trimester + Breastfeeding Peer Supporter', court: 'Bundle (both)' },
      diplome: true, marraine: true,
      options: {
        '1': { prix: '725 $', detail: 'paiement complet', en: { prix: '$725', detail: 'full payment' }, lien: 'https://buy.stripe.com/8x2fZa3nabZm4SgbzIffy07' },
        '2': { prix: '2 × 362,50 $', detail: '2 versements', en: { prix: '2 × $362.50', detail: '2 instalments' }, lien: 'https://buy.stripe.com/00w9AMcXKgfC98w9rAffy08' },
        '4': { prix: '4 × 181,25 $', detail: '4 versements aux 2 semaines', en: { prix: '4 × $181.25', detail: '4 instalments every 2 weeks' }, lien: 'https://buy.stripe.com/9B67sEcXKfby3OccDMffy09' }
      }
    }
  };

  window.TarifsSere = {
    formations: T,
    // Texte dans la langue voulue : TarifsSere.t(objet, 'nom', 'en')
    t: function (o, champ, langue) { return langue === 'en' && o.en && o.en[champ] != null ? o.en[champ] : o[champ]; },
    offreActive: function () { return OFFRE_ACTIVE && new Date() < OFFRE_FIN; },
    // Formation enregistrée dans le dossier (l'accès marraine est ouvert par Sabrina à la validation)
    formationDossier: function (cle) { return cle === 'marraine' ? 'marraine' : cle === 'doula' ? 'doula' : '4e-trimestre'; },
    // Statut d'une étudiante de doula dont la place est confirmée (n'ouvre PAS le 4e trimestre)
    STATUT_DOULA: 'doula_valide',
    // Le dossier donne-t-il droit à la formation de marraine en plus du 4e trimestre ?
    inclutMarraine: function (optionPaiement) { var o = String(optionPaiement || ''); return o.indexOf('doula') !== 0 && /combo|cadeau|offre/.test(o); }
  };
})();
