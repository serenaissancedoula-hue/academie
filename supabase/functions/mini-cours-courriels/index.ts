// Académie Sérénaissance — courriels du mini-cours « 3 erreurs à éviter quand on commence comme doula ».
// Appelée par public.lancer_mini_cours() (à l'inscription, puis toutes les 30 minutes par pg_cron) avec l'en-tête x-secret.
// Étape 0 → courriel 1 tout de suite (le mini-cours), étape 1 → courriel 2 après 2 jours, étape 2 → courriel 3 après 4 jours.
// Aucun envoi si la personne s'est désabonnée de l'infolettre. Corps { test: "adresse" } : envoie les 3 courriels à cette adresse (vérification).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = "https://academiesere.ca";
const FIN_OFFRE = new Date("2026-12-01T03:59:00Z"); // 30 novembre 2026, 23 h 59 (heure de l'Atlantique)
const JOUR = 86400000;

type Courriel = { sujet: string; titre: string; paragraphes: string[]; bouton?: [string, string]; bouton2?: [string, string] };

function esc(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
// **gras** seulement, après échappement
function para(t: string) {
  return '<p style="margin:0 0 14px;">' + esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>") + "</p>";
}
function bouton(b: [string, string] | undefined, secondaire = false) {
  if (!b) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:${secondaire ? "10px" : "24px"} auto 4px;"><tr><td align="center" bgcolor="${secondaire ? "#ffffff" : "#a85743"}" style="border-radius:50px;${secondaire ? "border:2px solid #a85743;" : ""}"><a href="${esc(b[1])}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${secondaire ? "#a85743" : "#ffffff"};text-decoration:none;border-radius:50px;">${esc(b[0])}</a></td></tr></table>`;
}
function html(c: Courriel, prenom: string | null, jeton: string | null) {
  const desa = jeton ? `${SITE}/desabonnement.html?t=${jeton}` : `${SITE}/desabonnement.html`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f7f1ea;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f1ea;"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td align="center" style="padding-bottom:18px;"><img src="${SITE}/logo.jpg" alt="Académie Sérénaissance" width="150" style="display:block;width:150px;height:auto;border:0;"></td></tr>
<tr><td style="background-color:#fffbf8;border:1px solid #e3d5c8;border-radius:24px;padding:34px 28px;">
<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.3;color:#2c221e;margin:0 0 18px;text-align:center;">${esc(c.titre)}</h1>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#3d312b;">
${para(prenom ? `Bonjour ${prenom},` : "Bonjour,")}${c.paragraphes.map(para).join("")}</div>
${bouton(c.bouton)}${bouton(c.bouton2, true)}
<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#3d312b;margin:22px 0 0;">Avec douceur,<br><strong>Sabrina</strong><br><span style="font-size:12px;color:#7a685e;">Doula et fondatrice · Académie Sérénaissance</span></p>
</td></tr>
<tr><td align="center" style="padding:22px 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#7a685e;">
<a href="${SITE}" style="color:#7a685e;">academiesere.ca</a> · 506-759-2044 · sc@academiesere.ca<br>Académie Sérénaissance · Sabrina Chavanel · 43 Tingley Cres., Campbellton (N.-B.) E3N 2S1 · Canada<br><br>
Tu reçois ce courriel parce que tu t'es inscrite au mini-cours gratuit de l'Académie Sérénaissance.<br><a href="${desa}" style="color:#a85743;">Me désabonner</a>
</td></tr></table></td></tr></table></body></html>`;
}

function courriels(maintenant: Date): Courriel[] {
  const offre = maintenant < FIN_OFFRE;
  return [
    {
      sujet: "Ton mini-cours : les 3 erreurs à éviter quand on commence comme doula",
      titre: "Ton mini-cours est prêt 🌸",
      paragraphes: [
        "Merci de t'être inscrite ! Voici ton mini-cours « Les 3 erreurs à éviter quand on commence comme doula ».",
        "Tu y trouveras :\n• Erreur 1 : sortir de son rôle, et le réflexe « Observer et Référer »\n• Erreur 2 : se lancer sans se protéger\n• Erreur 3 : s'oublier soi-même",
        "Chaque erreur se termine par un petit exercice de 5 minutes. Prends un carnet, installe-toi confortablement, et prends ton temps.",
        "Dans 2 jours, je t'écris pour te parler de la situation qui surprend le plus les nouvelles doulas.",
      ],
      bouton: ["Lire le mini-cours", `${SITE}/mini-cours-doula/`],
      bouton2: ["Télécharger le PDF", `${SITE}/mini-cours-3-erreurs-doula.pdf`],
    },
    {
      sujet: "La situation qui surprend le plus les nouvelles doulas",
      titre: "Quand une maman te demande « Est-ce normal ? »",
      paragraphes: [
        "As-tu eu le temps de faire les exercices du mini-cours ? J'aimerais revenir sur l'erreur 1, parce que c'est celle qui surprend le plus.",
        "Un jour, une maman t'écrira : « J'ai mal à la tête depuis ce matin, est-ce normal ? » Ton premier réflexe sera de la rassurer. C'est humain : tu veux l'aider.",
        "Mais certains signes, comme un mal de tête sévère, un changement soudain de la vision, une enflure qui se généralise aux mains et au visage ou un bébé qui bouge moins, demandent de consulter rapidement. Ce sont des signaux d'alarme reconnus par la santé publique, et ce n'est pas à la doula de décider si c'est grave.",
        "**Ta vraie force, c'est de savoir orienter** : « C'est important que ta sage-femme ou ton médecin le sache. Veux-tu qu'on l'appelle ensemble ? » Tu restes présente, et la maman reçoit les bons soins.",
        "Dans la formation de base de doula, un module entier apprend à reconnaître les signaux d'alerte, avec des mises en situation de la grossesse au post-partum. Tu peux voir le début du premier chapitre gratuitement.",
      ],
      bouton: ["Voir l'aperçu gratuit", `${SITE}/Formation/module-1/apercu.html`],
      bouton2: ["Découvrir la formation", `${SITE}/formation-doula-de-base/`],
    },
    offre
      ? {
        sujet: "Cohorte fondatrice : 500 $ de rabais, seulement 5 places",
        titre: "Deviens doula avec la cohorte fondatrice",
        paragraphes: [
          "Si le mini-cours t'a donné envie d'aller plus loin, j'ai une invitation pour toi.",
          "Je cherche mes **5 premières étudiantes** pour la formation de base de doula : la cohorte fondatrice. Tu profites de **500 $ de rabais** sur la formation de 400 h.",
          "La formation se suit en ligne et à ton rythme : 12 modules, des ateliers en direct avec une consultante en lactation IBCLC et une sage-femme, 4 stages supervisés et 10 h de mentorat.",
          "Pour en profiter, inscris-toi et entre le code **FONDATRICE** au moment du paiement. L'offre se termine le 30 novembre, ou dès que les 5 places sont prises.",
          "Une question avant de te lancer ? Réponds simplement à ce courriel ou écris-moi à sc@academiesere.ca : je te réponds personnellement.",
        ],
        bouton: ["Je réserve ma place", `${SITE}/formation-doula-de-base/`],
      }
      : {
        sujet: "Et si tu devenais doula ?",
        titre: "Prête à faire le grand saut ?",
        paragraphes: [
          "Si le mini-cours t'a donné envie d'aller plus loin, la formation de base de doula est faite pour toi.",
          "Elle se suit en ligne et à ton rythme : 12 modules, des ateliers en direct avec une consultante en lactation IBCLC et une sage-femme, 4 stages supervisés et 10 h de mentorat.",
          "Une question avant de te lancer ? Écris-moi à sc@academiesere.ca : je te réponds personnellement.",
        ],
        bouton: ["Découvrir la formation", `${SITE}/formation-doula-de-base/`],
      },
  ];
}

// Envoi avec EmailJS (même service et même modèle « template_infolettre » que le site : {{{html}}})
async function envoyer(a: string, c: Courriel, prenom: string | null, jeton: string | null) {
  const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: SITE },
    body: JSON.stringify({
      service_id: "service_82vfhfg", template_id: "template_infolettre", user_id: "HNvKdORRpRy_vT_FI",
      template_params: { courriel: a, sujet: c.sujet, prenom: prenom ?? "", html: html(c, prenom, jeton) },
    }),
  });
  if (!r.ok) throw new Error(`EmailJS ${r.status} : ${(await r.text()).slice(0, 300)}`);
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("SECRET_DECLENCHEUR") ?? "";
  if (!secret || req.headers.get("x-secret") !== secret) return new Response("non autorisé", { status: 401 });
  let corps: any = {};
  try { corps = await req.json(); } catch (_) { /* corps vide */ }
  const maintenant = new Date();
  const liste = courriels(maintenant);

  if (typeof corps.test === "string" && corps.test.includes("@")) {
    const res: string[] = [];
    for (const c of liste) {
      try { await envoyer(corps.test, { ...c, sujet: "[TEST] " + c.sujet }, "Sabrina", null); res.push("ok"); } catch (e) { res.push(String(e)); }
    }
    return Response.json({ test: res });
  }

  const { data: inscrites, error } = await sb.from("mini_cours").select("*").lt("etape", 3).limit(200);
  if (error) return new Response("erreur : " + error.message, { status: 500 });
  let envoyes = 0, ignores = 0, echecs = 0;
  for (const p of inscrites ?? []) {
    const age = maintenant.getTime() - new Date(p.inscrit_le).getTime();
    const du = p.etape === 0 || (p.etape === 1 && age >= 2 * JOUR) || (p.etape === 2 && age >= 4 * JOUR);
    if (!du) continue;
    const { data: ab } = await sb.from("abonnes_infolettre").select("actif, jeton").eq("courriel", p.courriel).maybeSingle();
    if (!ab || !ab.actif) { await sb.from("mini_cours").update({ etape: 3, erreur: "désabonnée" }).eq("id", p.id); ignores++; continue; }
    try {
      await envoyer(p.courriel, liste[p.etape], p.prenom, ab.jeton);
      await sb.from("mini_cours").update({ etape: p.etape + 1, dernier_envoi: maintenant.toISOString(), erreur: null }).eq("id", p.id);
      envoyes++;
    } catch (e) {
      await sb.from("mini_cours").update({ erreur: String(e).slice(0, 500) }).eq("id", p.id);
      echecs++;
    }
  }
  return Response.json({ envoyes, ignores, echecs });
});
