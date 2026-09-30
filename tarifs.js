/* Académie Sérénaissance — prix et liens de paiement Stripe (un seul endroit à modifier).
   Utilisé par le site (inscription) et par l'appli Admin (liens envoyés aux étudiantes). */
(function () {
  'use strict';
  var PROMO_OFFRE = 'SERENAISSANCE300';
  var OFFRE_FIN = new Date('2026-10-05T12:00:00-03:00');   // fin de l'offre de lancement (5 oct. à midi, heure de l'Atlantique)
  var OFFRE_ACTIVE = true;                                   // mettre false pour l'arrêter avant la date

  var T = {
    '4e-trimestre': {
      nom: 'Accompagnement de pointe du 4ᵉ trimestre',
      court: '4ᵉ trimestre',
      diplome: true, marraine: false,
      options: {
        '1': { prix: '550 $', detail: 'paiement complet', lien: 'https://buy.stripe.com/cNi4gAeppg5Y3j73NA7N601' },
        '2': { prix: '2 × 275 $', detail: '2 versements', lien: 'https://buy.stripe.com/28E4gA5ST6vo3j71Fs7N604' },
        '4': { prix: '4 × 137,50 $', detail: '4 versements', lien: 'https://buy.stripe.com/3cI5kE4OPcTM5rf3NA7N603' }
      }
    },
    'marraine': {
      nom: "Marraine d'allaitement",
      court: 'Marraine',
      diplome: false, marraine: true,
      options: {
        '1': { prix: '175 $', detail: 'paiement complet', lien: 'https://buy.stripe.com/aFa28s811f1UcTH97U7N60e' }
      }
    },
    'combo': {
      nom: "Combo : 4ᵉ trimestre + marraine d'allaitement",
      court: 'Combo (les 2)',
      diplome: true, marraine: true,
      options: {
        '1': { prix: '725 $', detail: 'paiement complet', lien: 'https://buy.stripe.com/14AdRa2GH7zscTH4RE7N60h' },
        '2': { prix: '2 × 362,50 $', detail: '2 versements', lien: 'https://buy.stripe.com/8x24gA955dXQcTH97U7N60g' },
        '4': { prix: '4 × 181,25 $', detail: '4 versements aux 2 semaines', lien: 'https://buy.stripe.com/bJe4gAepp5rkdXL3NA7N60f' }
      }
    },
    '4e-cadeau': {
      nom: "4ᵉ trimestre + marraine d'allaitement en cadeau (offre de lancement)",
      court: '4ᵉ trimestre + cadeau',
      diplome: true, marraine: true,
      options: {
        '1': { prix: '250 $', detail: 'paiement complet · code promo appliqué', lien: 'https://buy.stripe.com/cNi4gAeppg5Y3j73NA7N601?prefilled_promo_code=' + PROMO_OFFRE }
      }
    }
  };

  window.TarifsSere = {
    formations: T,
    offreActive: function () { return OFFRE_ACTIVE && new Date() < OFFRE_FIN; },
    // Formation enregistrée dans le dossier (l'accès marraine est ouvert par Sabrina à la validation)
    formationDossier: function (cle) { return cle === 'marraine' ? 'marraine' : '4e-trimestre'; },
    // Le dossier donne-t-il droit à la formation de marraine en plus du 4e trimestre ?
    inclutMarraine: function (optionPaiement) { return /combo|cadeau|offre/.test(String(optionPaiement || '')); }
  };
})();
