// Académie Sérénaissance — arrête automatiquement les paiements en versements.
// Stripe appelle cette fonction quand un abonnement est créé (événement customer.subscription.created).
// Si l'abonnement porte la mention « versements » (ex. 3, 4, 6), on fixe sa date de fin
// juste après le dernier versement : plus aucun prélèvement ensuite.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLE_STRIPE = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SECRET_WEBHOOK = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

async function signatureValide(corps: string, entete: string): Promise<boolean> {
  const parties = Object.fromEntries(entete.split(",").map((p) => p.split("=") as [string, string]));
  const t = parties["t"], v1 = parties["v1"];
  if (!t || !v1 || !SECRET_WEBHOOK) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 600) return false;
  const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET_WEBHOOK), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode(`${t}.${corps}`));
  const attendu = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return attendu === v1;
}

// Date du dernier versement = début + (N - 1) périodes ; on ajoute 1 jour de marge.
function dateFin(debut: number, n: number, interval: string, count: number): number {
  const d = new Date(debut * 1000);
  const fois = (n - 1) * count;
  if (interval === "month") d.setUTCMonth(d.getUTCMonth() + fois);
  else if (interval === "year") d.setUTCFullYear(d.getUTCFullYear() + fois);
  else if (interval === "week") d.setUTCDate(d.getUTCDate() + 7 * fois);
  else d.setUTCDate(d.getUTCDate() + fois);
  d.setUTCDate(d.getUTCDate() + 1);
  return Math.floor(d.getTime() / 1000);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("ok");
  const corps = await req.text();
  if (!(await signatureValide(corps, req.headers.get("stripe-signature") ?? ""))) {
    return new Response("signature invalide", { status: 400 });
  }
  const evenement = JSON.parse(corps);
  if (evenement.type !== "customer.subscription.created") return new Response("ignoré");

  const abo = evenement.data.object;
  const n = parseInt(abo.metadata?.versements ?? "", 10);
  if (!n || n < 2) return new Response("pas un paiement en versements");
  if (abo.cancel_at) return new Response("déjà programmé");

  const prix = abo.items?.data?.[0]?.price?.recurring;
  if (!prix) return new Response("prix sans récurrence", { status: 200 });

  const finTs = dateFin(abo.start_date, n, prix.interval, prix.interval_count ?? 1);
  const rep = await fetch(`https://api.stripe.com/v1/subscriptions/${abo.id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${CLE_STRIPE}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ cancel_at: String(finTs), proration_behavior: "none" }),
  });
  if (!rep.ok) {
    console.error("Stripe a refusé", abo.id, await rep.text());
    return new Response("erreur Stripe", { status: 500 }); // Stripe réessaiera
  }
  console.log("Fin programmée", abo.id, n, "versements →", new Date(finTs * 1000).toISOString());
  return new Response("ok");
});
