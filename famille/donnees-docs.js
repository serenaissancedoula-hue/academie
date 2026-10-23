/* Académie Sérénaissance — appli Famille : modèles de documents à signer et mots du jour.
   Les modèles sont ceux de Sabrina, à titre d'exemple : chaque doula peut modifier le texte dans « Mes modèles ».
   Variables remplacées à l'envoi : {{doula_nom}} {{doula_adresse}} {{doula_tel}} {{doula_courriel}} {{doula_region}}
   {{parent_nom}} {{partenaire}} {{parent_courriel}} {{parent_tel}} {{dpa}} {{lieu}} {{professionnel}} {{forfait}} {{prix}} {{date}} */

const CONTRAT_DEFAUT = `## Les parties
ENTRE : {{doula_nom}}, faisant affaire sous le nom Académie Sérénaissance, {{doula_adresse}}, {{doula_tel}}, {{doula_courriel}} (ci-après « la Doula »);
ET : {{parent_nom}}{{partenaire_et}} (ensemble « les Parents »), {{parent_courriel}}, {{parent_tel}}.
Date prévue d'accouchement : {{dpa}} · Lieu prévu : {{lieu}} · Professionnel de santé responsable : {{professionnel}}.

## Article 1 · Objet
La Doula offre aux Parents un soutien émotionnel, physique et informationnel non médical pendant la grossesse, l'accouchement et le post-partum, selon le forfait choisi à l'annexe A.

## Article 2 · Forfait choisi
{{forfait}} · {{prix}}. Le détail des services, des prix et des modalités de paiement figure à l'annexe A, qui fait partie du présent contrat.

## Article 3 · Nature et limites du rôle
La Doula n'est pas une professionnelle de la santé et n'effectue aucun acte médical, clinique ou infirmier. Elle ne pose aucun diagnostic, ne prend aucune décision médicale et ne parle pas au nom des Parents auprès de l'équipe soignante. Les Parents demeurent seuls responsables de leurs décisions et de leur suivi médical. L'annexe B précise ces limites.

## Article 4 · Période de garde
À partir de 38 semaines de grossesse et jusqu'à l'accouchement, la Doula est de garde 24 heures sur 24, 7 jours sur 7. Les Parents l'appellent (et non par texto seulement) dès le début du travail, à la rupture des membranes, ou lorsqu'ils partent vers le lieu de naissance. Si l'accouchement survient avant 37 semaines, la Doula fera tous les efforts raisonnables pour être présente, sans garantie.

## Article 5 · Présence à l'accouchement
La Doula se rend auprès des Parents dans un délai raisonnable après l'appel, selon la distance et les conditions routières. Elle reste jusqu'à environ 2 heures après la naissance pour le post-partum immédiat. Après 18 heures de présence continue, elle peut faire appel à sa doula remplaçante pour se reposer, afin de garder un soutien sécuritaire. Les règles de l'établissement priment; si elles empêchent la présence de la Doula, le soutien se poursuit à distance et la portion accouchement est traitée selon l'article 9.

## Article 6 · Communications
Les Parents peuvent joindre la Doula dans l'appli Sérénaissance, par courriel, texto, Messenger ou téléphone. Hors période de garde, la Doula répond habituellement en moins de 24 heures. En cas d'urgence, les Parents composent d'abord le 911 ou joignent leur professionnel de santé.

## Article 7 · Doula remplaçante
Si la Doula ne peut être présente (maladie, deux naissances simultanées, force majeure), elle propose une doula remplaçante de confiance, liée par une entente de confidentialité. Les Parents sont libres de l'accepter ou non. S'ils refusent, ou si aucune remplaçante n'est disponible, la portion accouchement leur est remboursée.

## Article 8 · Accouchement rapide ou non signalé
Si les Parents n'ont pas appelé la Doula à temps pour qu'elle puisse se rendre, la portion accouchement reste due. La Doula offre alors une rencontre postnatale supplémentaire.

## Article 9 · Annulation et remboursement
Les Parents peuvent résilier le contrat en tout temps par avis écrit (un courriel ou un message dans l'appli suffit). Avant la première rencontre : remboursement complet, sans frais. Après la première rencontre : les Parents paient la valeur des services rendus, plus une pénalité égale au plus petit de 50 $ ou de 10 % de la valeur des services non rendus. Le remboursement est fait dans les 10 jours suivant l'avis écrit, par le même moyen de paiement. La Doula peut mettre fin au contrat, avec un avis écrit motivé, si sa sécurité est menacée, en cas de comportement abusif, de non-paiement après rappel écrit, ou si les Parents demandent un acte hors de son rôle; les sommes payées pour des services non rendus sont alors remboursées, sans pénalité.

## Article 10 · Perte de grossesse ou situation imprévue
En cas de deuil périnatal, de césarienne planifiée ou de transfert de soins, la Doula offre de poursuivre son accompagnement sous une forme adaptée. Si les Parents préfèrent mettre fin au contrat, seuls les services rendus sont payables, sans pénalité.

## Article 11 · Confidentialité
La Doula garde confidentiels tous les renseignements reçus, conformément au consentement signé. Elle ne peut les communiquer qu'avec le consentement des Parents, sauf si la loi l'exige (notamment l'obligation de signaler une situation où la sécurité d'un enfant est compromise) ou en cas de danger grave et imminent pour la vie d'une personne.

## Article 12 · Responsabilité et assurance
La Doula n'est pas responsable des décisions médicales, des résultats de l'accouchement ni des actes de l'équipe soignante. Rien dans le présent contrat ne limite la responsabilité de la Doula pour sa propre faute, ni les droits que la loi accorde aux Parents. Assurance responsabilité : {{assurance}}.

## Article 13 · Déplacements
Les déplacements sont inclus dans un rayon de 50 km de {{doula_region}}. Au-delà, des frais de 0,55 $/km aller-retour s'appliquent, annoncés avant la signature.

## Article 14 · Dispositions générales
Le présent contrat, avec ses annexes, constitue l'entente complète entre les parties. Toute modification doit être faite par écrit. Il est régi par les lois du Nouveau-Brunswick et les lois fédérales du Canada; il n'enlève aucun droit accordé par la loi de la province de résidence des Parents, notamment la Loi sur la protection du consommateur du Québec. Les parties tentent d'abord de régler tout différend à l'amiable.

## Annexe A · Forfaits et paiement
Accompagnement des Parents · 1 450 $ : 3 rencontres prénatales, accouchement, post-partum immédiat, 2 rencontres postnatales. Valeur : accouchement 725 $, chaque rencontre 145 $. Versements : 1 × 1 450 $, 2 × 725 $ ou 4 × 362,50 $.
Soutien au Couple · 1 150 $ : 1 rencontre prénatale, accouchement, post-partum immédiat, 1 rencontre postnatale. Valeur : accouchement 575 $, chaque rencontre 287,50 $. Versements : 1 × 1 150 $ ou 2 × 575 $.
Arrivée de Bébé · 850 $ : rencontre de connaissance, accouchement, post-partum immédiat. Valeur : accouchement 425 $, rencontre 425 $. Versements : 1 × 850 $ ou 2 × 425 $.
Inclus dans tous les forfaits : plan de naissance, liste d'hôpital, cahier de naissance, soutien illimité dans l'appli, par courriel, texto, Messenger ou téléphone, garde 24/7 dès 38 semaines.
Prix en dollars canadiens. TVH ajoutée seulement si la Doula est inscrite. Paiement par Stripe, virement Interac ou autre mode convenu. Solde complet dû au plus tard à 36 semaines. Aucuns frais de crédit ni intérêts. Retard de plus de 14 jours : rappel écrit; la garde peut être suspendue jusqu'au paiement. Un reçu est remis pour chaque paiement.

## Annexe B · Rôle et limites de la doula
La Doula applique le principe « Observer et référer ».
LA DOULA PEUT : offrir un soutien émotionnel, du réconfort et de l'écoute; proposer des positions, la respiration, des massages et des mesures de confort; fournir de l'information fondée sur des sources reconnues; aider les Parents à formuler leurs questions à l'équipe soignante; soutenir l'allaitement et les premiers soins au bébé; reconnaître des signaux d'alerte et orienter vers les ressources.
LA DOULA NE PEUT PAS : faire un examen vaginal, prendre la tension ou écouter le cœur du bébé; poser un diagnostic ou interpréter un résultat médical; recommander ou administrer un médicament, une plante ou un produit naturel; parler ou décider à la place des Parents; remplacer une sage-femme, une infirmière, une IBCLC ou un médecin; retarder une consultation ou un appel au 911.
NOS ENGAGEMENTS : nous avons un suivi médical ou sage-femme régulier pendant la grossesse; nous informerons la Doula de tout élément de santé pouvant influencer l'accompagnement; en cas d'urgence, nous appelons d'abord le 911 ou notre professionnel de santé; nous restons seuls responsables de nos décisions médicales.`;

const CONSENTEMENT_DEFAUT = `## Ce que je recueille et pourquoi
Vos coordonnées et des renseignements sur votre grossesse, votre santé et votre famille, uniquement pour vous accompagner, tenir un dossier et vous facturer. Ils sont conservés dans l'appli Sérénaissance (accès protégé par mot de passe). Certains outils peuvent conserver des données à l'extérieur du Canada, notamment aux États-Unis.

## Combien de temps
Le temps de l'accompagnement, puis au moins un an, avant une destruction sécuritaire, sauf les documents de paiement conservés 6 ans pour l'impôt.

## Exceptions prévues par la loi
La Doula doit communiquer certains renseignements sans consentement lorsque la sécurité ou le développement d'un enfant peut être compromis (obligation de signalement au N.-B. et au Québec), ou en cas de danger grave et imminent pour la vie d'une personne.

## Mes droits
Consulter, corriger ou faire supprimer mes renseignements, et retirer mon consentement, en écrivant à {{doula_courriel}} (réponse en 30 jours). Plainte possible au Commissariat à la protection de la vie privée du Canada ou, au Québec, à la Commission d'accès à l'information. Conforme à la LPRPDE (Canada) et, pour les résidentes du Québec, à la Loi 25. Chaque autorisation est distincte et peut être retirée en tout temps.`;

const PHOTOS_DEFAUT = `Entièrement facultative : la refuser ne change rien à votre accompagnement.

## Conditions
Aucune nudité ni image intime ne sera publiée. La Doula vous montre chaque image ou texte avant publication. Aucune rémunération n'est versée. Vous pouvez retirer cette autorisation en tout temps par écrit; le contenu est retiré dans les 7 jours des plateformes de l'Académie Sérénaissance (les partages déjà faits par d'autres ne peuvent être garantis). Les règles de l'établissement sur les photos sont toujours respectées. Endroits possibles : academiesere.ca, Facebook, Instagram, infolettre.`;

const ACCUEIL_DEFAUT = `Ce formulaire m'aide à adapter mon soutien. Répondez seulement à ce que vous êtes à l'aise de partager; chaque question est facultative sauf les coordonnées.`;

/* Types de documents : champs fixes, texte modifiable par la doula */
const DOC_TYPES = {
  contrat: { titre: 'Contrat de services de doula', texte: CONTRAT_DEFAUT, sigP: true, sigD: true,
    champs: [{ k: 'adresse', t: 'Adresse des parents', type: 'text' }, { k: 'paiement', t: 'Calendrier de paiement choisi', type: 'choix', o: ['1 versement', '2 versements', '4 versements'] }] },
  accueil: { titre: 'Formulaire d\'accueil confidentiel', texte: ACCUEIL_DEFAUT, sigP: true, sigD: false,
    champs: [
      { g: 'Coordonnées' }, { k: 'nom', t: 'Nom de la personne enceinte', type: 'text', req: true }, { k: 'pronoms', t: 'Pronoms (facultatif)', type: 'text' }, { k: 'partenaire', t: 'Partenaire / personne de soutien', type: 'text' }, { k: 'adresse', t: 'Adresse', type: 'text' }, { k: 'tel', t: 'Téléphone · courriel', type: 'text', req: true }, { k: 'urgence', t: 'Personne à joindre en cas d\'urgence', type: 'text' }, { k: 'langue', t: 'Langue préférée', type: 'text' },
      { g: 'Grossesse et suivi' }, { k: 'dpa', t: 'Date prévue d\'accouchement', type: 'date' }, { k: 'anterieurs', t: 'Grossesses et accouchements antérieurs', type: 'area' }, { k: 'prof', t: 'Professionnel de suivi (nom, clinique)', type: 'text' }, { k: 'lieu', t: 'Lieu de naissance prévu', type: 'text' }, { k: 'grossesse', t: 'Grossesse', type: 'choix', o: ['Simple', 'Multiple'] }, { k: 'sante', t: 'Conditions de santé à signaler', type: 'area' }, { k: 'allergies', t: 'Allergies (dont huiles essentielles, latex)', type: 'text' },
      { g: 'Vécu et préférences' }, { k: 'precedent', t: 'Comment s\'est passé votre accouchement précédent ?', type: 'area' }, { k: 'peurs', t: 'Peurs ou expériences difficiles à connaître', type: 'area' }, { k: 'apaise', t: 'Ce qui vous apaise (toucher, musique, silence, encouragements)', type: 'area' }, { k: 'eviter', t: 'Touchers ou mots à éviter', type: 'area' }, { k: 'alim', t: 'Projet d\'alimentation', type: 'choix', o: ['Allaitement', 'Préparation commerciale', 'Mixte', 'À décider'] }, { k: 'culture', t: 'Pratiques culturelles, spirituelles ou familiales', type: 'area' }, { k: 'presents', t: 'Qui sera présent à la naissance et au retour à la maison ?', type: 'area' }, { k: 'attentes', t: 'Ce que vous attendez le plus de votre doula', type: 'area' },
      { g: 'Santé mentale (facultatif)' }, { k: 'mental', t: 'Avez-vous déjà vécu de l\'anxiété, une dépression ou un autre défi de santé mentale ? Cette information aide à repérer plus tôt les signes post-partum.', type: 'area' }, { k: 'vivevoix', t: 'Je préfère en parler de vive voix', type: 'case' }
    ] },
  consentement: { titre: 'Consentement aux renseignements personnels', texte: CONSENTEMENT_DEFAUT, sigP: true, sigD: false,
    champs: [{ g: 'Mes autorisations' }, { k: 'a1', t: 'Recueillir et conserver les renseignements de mon formulaire d\'accueil', type: 'case' }, { k: 'a2', t: 'Communiquer avec moi par l\'appli, texto, Messenger et courriel', type: 'case' }, { k: 'a3', t: 'Échanger avec mon équipe soignante, à ma demande seulement', type: 'case' }, { k: 'a3n', t: 'Nom du professionnel', type: 'text' }, { k: 'a4', t: 'Transmettre mon dossier à la doula remplaçante si elle me remplace', type: 'case' }, { k: 'a5', t: 'Discuter de mon accompagnement, de façon anonyme, en supervision', type: 'case' }] },
  photos: { titre: 'Autorisation photos, vidéos et témoignages', texte: PHOTOS_DEFAUT, sigP: true, sigD: false,
    champs: [{ g: 'J\'autorise l\'Académie Sérénaissance à…' }, { k: 'p1', t: 'Prendre des photos pendant le travail ou la naissance, pour nous seulement', type: 'case' }, { k: 'p2', t: 'Publier une photo où personne n\'est reconnaissable (mains, pieds du bébé)', type: 'case' }, { k: 'p3', t: 'Publier une photo où notre famille est reconnaissable', type: 'case' }, { k: 'p4', t: 'Publier notre témoignage avec nos prénoms', type: 'case' }, { k: 'p5', t: 'Publier notre témoignage de façon anonyme (initiales)', type: 'case' }, { k: 'p6', t: 'Utiliser notre histoire, anonymisée, dans la formation de l\'Académie', type: 'case' }, { k: 'parent2', t: 'Nom du 2e parent (s\'il y a lieu)', type: 'text' }] },
  autre: { titre: 'Document', texte: '', sigP: true, sigD: true, champs: [] }
};

/* Mots du jour : un mot personnel, différent chaque jour, selon l'étape. {p} = prénom de la maman, {b} = bébé */
const MOTS_GROSSESSE = [
  '{p}, prends un moment aujourd\'hui pour poser tes mains sur ton ventre et respirer avec ton bébé. Ce lien se construit déjà.',
  'Ton corps fait un travail immense, même quand tu te reposes. Tu as le droit de ralentir aujourd\'hui, {p}.',
  'Une question te trotte dans la tête ? Note-la dans « Mes questions » : on en parle à la prochaine rencontre.',
  'Bois un grand verre d\'eau et mange une collation nourrissante. Prendre soin de toi, c\'est prendre soin de ton bébé.',
  'Tu n\'as pas à tout savoir d\'avance, {p}. On avance une étape à la fois, ensemble.',
  'Pense à quelque chose qui te fait du bien et offre-le-toi aujourd\'hui : une marche, un bain tiède, une sieste.',
  'Ton intuition compte. Si quelque chose ne te semble pas normal, appelle ton professionnel : il vaut mieux appeler pour rien.',
  'Respire lentement : inspire par le nez en comptant 4, expire longuement en comptant 6. Trois fois. Voilà.',
  'Parle à ton bébé aujourd\'hui. Il reconnaît déjà ta voix et celle des gens qui l\'attendent.',
  'Les émotions en montagnes russes sont normales pendant la grossesse. Tu peux m\'écrire quand tu veux, {p}.',
  'Repose-toi sur le côté quand tu t\'allonges. Ton bébé et toi serez plus confortables.',
  'Qui peut t\'aider après la naissance ? Pense à une personne à qui tu pourrais confier un repas ou une lessive.',
  'Tu es la bonne mère pour ce bébé, {p}. Il n\'y a pas de façon parfaite d\'attendre un enfant.',
  'Un petit pas aujourd\'hui : coche un élément de ta liste « Préparer ma naissance ».',
  'Ton partenaire a peut-être des questions aussi. Prenez cinq minutes ensemble ce soir pour en parler.'
];
const MOTS_FIN = [
  'On approche, {p}. Garde mon numéro près de toi et appelle-moi dès les premiers signes, aux eaux ou au départ.',
  'Ton corps sait comment faire. Une contraction à la fois, une respiration à la fois.',
  'Ta valise est-elle prête ? Ajoute ton plan de naissance et tes cartes d\'affirmations.',
  'Repose-toi le plus possible ces jours-ci. Chaque sieste est une réserve d\'énergie pour le grand jour.',
  'Je suis de garde pour toi, jour et nuit. Tu n\'es pas seule, {p}.'
];
const MOTS_POSTPARTUM = [
  'Bonjour {p} ! Comment s\'est passée la nuit ? Note les tétées et les couches de {b}, et écris-moi si quelque chose t\'inquiète.',
  'Le repos n\'est pas un luxe, c\'est un besoin. Dors quand {b} dort, même 20 minutes.',
  'Accepte l\'aide qu\'on t\'offre aujourd\'hui. Laisser quelqu\'un faire la vaisselle, c\'est te permettre de prendre soin de toi.',
  'Les larmes faciles des premiers jours sont fréquentes. Si la tristesse dure plus de deux semaines, parle-m\'en, {p}.',
  'Peau à peau avec {b} : ça calme, ça réchauffe et ça aide l\'allaitement. Profite de ces moments.',
  'Mange chaud et nourrissant. Un bouillon, une soupe, un repas simple : ton corps récupère.',
  'Tu apprends à connaître {b}, et {b} apprend à te connaître. Il n\'y a pas d\'examen à réussir.',
  'Une douleur qui dure à l\'allaitement n\'est pas normale. Demande de l\'aide : je suis là, et les marraines aussi.',
  'Garde les visites courtes et choisies. Ta bulle avec {b} est précieuse.',
  'Bois un grand verre d\'eau à chaque tétée. Ton corps travaille fort.',
  'Tu fais un travail extraordinaire, {p}, même dans les moments où tu doutes.',
  'Comment va ton moral, vraiment ? Tu peux me répondre ici, sans filtre.'
];
