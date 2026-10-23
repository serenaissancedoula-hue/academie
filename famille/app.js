/* Académie Sérénaissance — appli Famille (parents et doulas).
   Données dans Supabase (tables fam_*), protégées par RLS : une famille ne voit que son dossier, une doula que ses familles.
   Les photos et minuteurs restent sur l'appareil. */
const SB_URL='https://zeptirfcwstufcpgvkzx.supabase.co';
const SB_CLE='sb_publishable_OBeZ61m6gGF5tGPUokeS_A_nCZvpdpl';
const VAPID='BA1eSxrp55R_nk6-rHpCI0Pi6OjPh-0MIOmlG2XZOLEptXG0xFUS4eB9aKAl3qQelLJqfouEq3FXWkYf02YhKMc';
const sb=window.supabase.createClient(SB_URL,SB_CLE,window.SereSecurite?SereSecurite.options():undefined);

let S={role:null,tab:'accueil',sub:'',dtab:'accueil',dsub:'',parent:blankParent(),doula:{},logs:[],clients:[],timer:null,kick:null,contrActive:null,showContr:false};
let MOI=null, FAM=null, DOULA=null, ME_DOULA=null;
let MSGS=[], RDV=[], DOCS=[], MOT=null, NONLUS={}, CRDV=[], CDOCS={}, CMSGS={}, CMOTS={};
function blankParent(){return {prenom:'',partenaire:'',ddr:'',cycle:28,echoDate:'',echoSA:'',echoJ:'',dpaEquipe:'',lieu:'',prof:'',allergies:'',
  naissance:{date:'',heure:'',lieu:'',prenomBebe:'',poids:'',taille:'',pers:'',type:''},recit:{},plan:{},soins:{},planF:{},cahier:{},peurs:{},peursT:{},prep:{},valise:{},contacts:{},qpro:{},qproR:{},quarante:{},quaranteQui:{},quaranteT:{},firsts:{},avis:{},avisT:{},retour:{date:'',heures:8,check:{}},situ:{},moral:{},questions:[],affFav:{}}}
function doulaNomP(){return DOULA?[DOULA.prenom,DOULA.nom].filter(Boolean).join(' ')||'Ma doula':'Ma doula'}
function deepMerge(base,o){if(!o||typeof o!=='object')return base;for(const k in o){if(o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k])&&base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k]))base[k]=deepMerge(base[k],o[k]);else base[k]=o[k]}return base}
const LOCAL=()=> 'sere-fam-'+(MOI&&MOI.courriel||'x');
function saveLocal(){try{localStorage.setItem(LOCAL(),JSON.stringify({timer:S.timer,kick:S.kick,contrActive:S.contrActive}))}catch(e){}}
function loadLocal(){try{const o=JSON.parse(localStorage.getItem(LOCAL())||'{}');S.timer=o.timer||null;S.kick=o.kick||null;S.contrActive=o.contrActive||null}catch(e){}}

/* ================== ENREGISTREMENT ================== */
let tP=null,tC={},tD=null;
function save(){saveLocal();
  if(S.role==='parent'){clearTimeout(tP);tP=setTimeout(saveParent,700)}
  else if(S.role==='doula'){if(S.openClient){const id=S.openClient;clearTimeout(tC[id]);tC[id]=setTimeout(()=>saveClient(id),700)}clearTimeout(tD);tD=setTimeout(saveDoula,900)}}
async function saveParent(){if(!FAM)return;const p=S.parent;const upd={parent_data:p};
  if(p.naissance&&p.naissance.date)upd.naissance=p.naissance.date;else if(FAM.naissance&&!(p.naissance&&p.naissance.date))upd.naissance=null;
  if(p.naissance&&p.naissance.prenomBebe)upd.bebe=p.naissance.prenomBebe;
  const {error}=await sb.from('fam_familles').update(upd).eq('id',FAM.id);if(error)toast('Pas enregistré : vérifiez votre connexion');else{FAM.naissance=upd.naissance??FAM.naissance}}
const ALIAS=['id','prenom','nomFamille','nom','courriel','tel','partenaire','dpa','naiss','bebe','lieu','prof','forfait','statut','parent_user','invite_envoyee','conserver_jusqu','parent_data','created_at','archivee_le'];
function buildClient(f,dossier){return Object.assign({},dossier||{},{id:f.id,prenom:f.prenom||'',nomFamille:f.nom||'',nom:[f.prenom,f.nom].filter(Boolean).join(' ')||f.courriel,courriel:f.courriel,tel:f.telephone||'',partenaire:f.partenaire||'',dpa:f.dpa||'',naiss:f.naissance||'',bebe:f.bebe||'',lieu:f.lieu||'',prof:f.professionnel||'',forfait:f.forfait||'',statut:f.statut,parent_user:f.parent_user,invite_envoyee:f.invite_envoyee,conserver_jusqu:f.conserver_jusqu,parent_data:f.parent_data||{},created_at:f.created_at,archivee_le:f.archivee_le})}
async function saveClient(id){const c=S.clients.find(x=>x.id===id);if(!c)return;
  const cols={prenom:c.prenom||null,nom:c.nomFamille||null,telephone:c.tel||null,partenaire:c.partenaire||null,dpa:c.dpa||null,naissance:c.naiss||null,bebe:c.bebe||null,lieu:c.lieu||null,professionnel:c.prof||null,forfait:c.forfait||null,statut:c.statut};
  const dos={};for(const k in c)if(!ALIAS.includes(k))dos[k]=c[k];
  const [a,b]=await Promise.all([sb.from('fam_familles').update(cols).eq('id',id),sb.from('fam_dossiers').upsert({famille_id:id,data:dos,updated_at:new Date().toISOString()})]);
  if(a.error||b.error)toast('Pas enregistré : '+((a.error||b.error).message||'erreur'))}
async function saveDoula(){if(!ME_DOULA)return;const D=S.doula;const parts=String(D.nom||'').trim().split(/\s+/);
  const mod=Object.assign({},ME_DOULA.modeles||{},{outils:{sac:D.sac||{},retour:D.retour||{},indispo:D.indispo||''},assurance:D.assurance||''});
  const {error}=await sb.from('fam_doulas').update({prenom:parts[0]||null,nom:parts.slice(1).join(' ')||null,telephone:D.tel||null,region:D.region||null,adresse:D.adresse||null,remplacante_nom:D.rempNom||null,remplacante_tel:D.rempTel||null,tvh:D.tvh||null,modeles:mod}).eq('id',ME_DOULA.id);
  if(!error)ME_DOULA.modeles=mod}

/* ================== CHARGEMENT ================== */
async function chargerParent(){const id=MOI.familles[0];
  const {data:f}=await sb.from('fam_familles').select('*').eq('id',id).single();FAM=f;
  const {data:d}=await sb.from('fam_doulas').select('id,prenom,nom,telephone,courriel,remplacante_nom,remplacante_tel').eq('id',f.doula_id).maybeSingle();DOULA=d;
  S.parent=deepMerge(blankParent(),f.parent_data||{});
  if(!S.parent.prenom&&f.prenom)S.parent.prenom=f.prenom;if(!S.parent.partenaire&&f.partenaire)S.parent.partenaire=f.partenaire;
  if(!S.parent.lieu&&f.lieu)S.parent.lieu=f.lieu;if(!S.parent.prof&&f.professionnel)S.parent.prof=f.professionnel;
  if(!S.parent.ddr&&!S.parent.echoDate&&!S.parent.dpaEquipe&&f.dpa)S.parent.dpaEquipe=f.dpa;
  if(f.naissance&&!S.parent.naissance.date)S.parent.naissance.date=f.naissance;if(f.bebe&&!S.parent.naissance.prenomBebe)S.parent.naissance.prenomBebe=f.bebe;
  const depuis=new Date(Date.now()-120*DAY).toISOString();
  const {data:j}=await sb.from('fam_journal').select('*').eq('famille_id',id).gte('t',depuis).order('t');S.logs=(j||[]).map(r=>Object.assign({},r.data,{id:r.id,t:new Date(r.t).getTime(),type:r.type}));
  await chargerEchanges()}
async function chargerEchanges(){if(!FAM)return;const id=FAM.id;
  const [m,r,d,mo]=await Promise.all([sb.from('fam_messages').select('*').eq('famille_id',id).order('created_at'),sb.from('fam_rdv').select('*').eq('famille_id',id).order('debut'),sb.from('fam_documents').select('*').eq('famille_id',id).order('created_at',{ascending:false}),sb.from('fam_mots').select('*').eq('famille_id',id).eq('jour',iso(new Date())).maybeSingle()]);
  MSGS=m.data||[];RDV=r.data||[];DOCS=d.data||[];MOT=mo.data||null}
async function chargerDoula(){ME_DOULA=MOI.doula;const D=ME_DOULA,o=(D.modeles||{}).outils||{};
  S.doula={nom:[D.prenom,D.nom].filter(Boolean).join(' '),tel:D.telephone||'',courriel:D.courriel,region:D.region||'',adresse:D.adresse||'',rempNom:D.remplacante_nom||'',rempTel:D.remplacante_tel||'',tvh:D.tvh||'',assurance:(D.modeles||{}).assurance||'',sac:o.sac||{},retour:o.retour||{},indispo:o.indispo||''};
  const {data:fs}=await sb.from('fam_familles').select('*').eq('doula_id',D.id).order('created_at',{ascending:false});
  const ids=(fs||[]).map(f=>f.id);let dos=[],rdv=[],nl=[],docs=[];
  if(ids.length){const r=await Promise.all([sb.from('fam_dossiers').select('*').in('famille_id',ids),sb.from('fam_rdv').select('*').in('famille_id',ids).order('debut'),sb.from('fam_messages').select('famille_id').in('famille_id',ids).eq('de_doula',false).eq('lu',false),sb.from('fam_documents').select('id,famille_id,titre,statut,type,created_at').in('famille_id',ids)]);dos=r[0].data||[];rdv=r[1].data||[];nl=r[2].data||[];docs=r[3].data||[]}
  S.clients=(fs||[]).map(f=>buildClient(f,(dos.find(x=>x.famille_id===f.id)||{}).data));
  CRDV=rdv;NONLUS={};nl.forEach(x=>NONLUS[x.famille_id]=(NONLUS[x.famille_id]||0)+1);CDOCS={};docs.forEach(d=>(CDOCS[d.famille_id]=CDOCS[d.famille_id]||[]).push(d))}
async function chargerClientDetail(id){const [m,d,mo,j]=await Promise.all([sb.from('fam_messages').select('*').eq('famille_id',id).order('created_at'),sb.from('fam_documents').select('*').eq('famille_id',id).order('created_at',{ascending:false}),sb.from('fam_mots').select('*').eq('famille_id',id).gte('jour',iso(addD(new Date(),-1))).order('jour'),sb.from('fam_journal').select('*').eq('famille_id',id).gte('t',new Date(Date.now()-8*DAY).toISOString()).order('t')]);
  CMSGS[id]=m.data||[];CDOCS[id]=d.data||[];CMOTS[id]=mo.data||[];const c=S.clients.find(x=>x.id===id);if(c)c._journal=(j.data||[]).map(r=>Object.assign({},r.data,{id:r.id,t:new Date(r.t).getTime(),type:r.type}))}

/* ================== CONNEXION ================== */
function ecranConnexion(msg){$('#tabs').innerHTML='';$('#roleSw').hidden=true;
  $('#app').innerHTML='<div class="card" style="max-width:460px;margin:0 auto;width:100%"><div class="hero"><div class="stack" style="gap:6px"><span class="script">Bienvenue</span><h1>Mon espace Sérénaissance</h1><p class="sub" style="font-family:var(--f-display);font-style:italic;color:var(--accent)">Pour les familles et leur doula</p></div><div class="blob"><img src="/parents.jpg" alt="Parents avec leur bébé"></div></div>'+(msg?'<div class="banner acc">'+icon('fa-circle-info')+'<div class="small">'+msg+'</div></div>':'')+
  '<form id="fLogin" class="stack"><label class="f">Courriel<input type="email" id="lCourriel" autocomplete="email" required></label><label class="f">Mot de passe<input type="password" id="lMdp" autocomplete="current-password"></label><button class="btn" type="submit">Me connecter</button></form><hr><p class="small">Pas encore de mot de passe, ou oublié ? Entrez votre courriel ci-dessus et recevez un lien de connexion.</p><button class="btn ghost" data-act="lienConnexion">'+icon('fa-envelope')+'Recevoir un lien de connexion</button><p class="xs muted">Votre doula vous inscrit : vous recevez un courriel pour finaliser votre inscription. Doulas : votre compte est créé par l\'Académie.</p></div>';
  $('#fLogin').addEventListener('submit',async e=>{e.preventDefault();const em=$('#lCourriel').value.trim(),pw=$('#lMdp').value;if(!pw){toast('Entrez votre mot de passe, ou demandez un lien');return}
    const {error}=await sb.auth.signInWithPassword({email:em,password:pw});if(error){toast('Courriel ou mot de passe incorrect');return}demarrer()})}
async function demarrer(){
  const q=new URLSearchParams(location.search);
  if(q.get('token_hash')){const {error}=await sb.auth.verifyOtp({token_hash:q.get('token_hash'),type:q.get('type')||'magiclink'});history.replaceState(null,'',location.pathname+location.hash);
    if(error){ecranConnexion('Ce lien a expiré ou a déjà servi. Entrez votre courriel pour en recevoir un nouveau.');return}S.nouveauCompte=q.get('type')==='invite'}
  const {data:{session}}=await sb.auth.getSession();if(!session){ecranConnexion(q.get('inactivite')?'Vous avez été déconnectée après une période sans activité.':'');return}
  $('#app').innerHTML='<p class="small muted" style="text-align:center;padding:40px">Chargement de votre espace…</p>';
  const {data,error}=await sb.rpc('fam_moi');if(error){ecranConnexion('Une erreur est survenue : '+esc(error.message));return}MOI=data;
  if(window.SereSecurite)SereSecurite.surveiller({sb,minutes:30,apres:'/famille/'});
  const peutDoula=!!MOI.doula,peutParent=(MOI.familles||[]).length>0;
  if(!peutDoula&&!peutParent){$('#app').innerHTML='<div class="card" style="max-width:480px;margin:0 auto"><h2>Aucun espace pour '+esc(MOI.courriel)+'</h2><p class="small">Votre doula doit d\'abord vous inscrire avec cette adresse courriel. Si elle l\'a fait, vérifiez que c\'est la même adresse.</p><button class="btn ghost" data-act="deconnexion">Me déconnecter</button></div>';return}
  let role=null;try{role=localStorage.getItem('sere-fam-role')}catch(e){}
  S.role=(role==='doula'&&peutDoula)||(!peutParent)?'doula':'parent';
  $('#roleSw').hidden=!(peutDoula&&peutParent);
  loadLocal();await charger();routeHash();render();
  if(S.nouveauCompte)motDePasseSheet(true);
  if(navigator.serviceWorker)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.type==='push')rafraichir()});
}
async function charger(){if(S.role==='parent')await chargerParent();else await chargerDoula()}
async function rafraichir(){if(!MOI)return;try{if(S.role==='parent'){await chargerEchanges()}else{await chargerDoula();if(S.openClient)await chargerClientDetail(S.openClient)}if(!$('#layer').innerHTML)render()}catch(e){}}
function routeHash(){const h=location.hash.slice(1);if(!h)return;
  if(S.role==='parent'){if(h==='messages'){S.tab='madoula';S.seg='messages'}else if(h==='rdv'){S.tab='madoula';S.seg='rdv'}else if(h==='documents'){S.tab='madoula';S.seg='docs'}}
  else if(h[0]==='f'&&h.length>30){S.dtab='clientes';S.openClient=h.slice(1);S.ctab='messages';chargerClientDetail(S.openClient).then(render)}}
function motDePasseSheet(bienvenue){sheet(bienvenue?'Bienvenue ! Choisissez votre mot de passe':'Mon mot de passe','<p class="small">'+(bienvenue?'Votre inscription est presque terminée. Choisissez un mot de passe pour vous reconnecter facilement.':'Changez votre mot de passe.')+'</p><label class="f">Nouveau mot de passe (8 caractères ou plus)<input type="password" id="mdp1" autocomplete="new-password"></label><label class="f">Confirmez<input type="password" id="mdp2" autocomplete="new-password"></label><button class="btn" data-act="saveMdp">Enregistrer</button>')}

/* ================== RENDU ================== */
const DTABS=[['accueil','fa-house','Tableau'],['clientes','fa-users','Familles'],['agenda','fa-calendar-days','Agenda'],['outils','fa-toolbox','Outils'],['ressources','fa-book-medical','Ressources']];
const PTABS2=[['accueil','fa-house','Accueil'],['suivi','fa-calendar-days','Suivi'],['journal','fa-book-open','Journal'],['madoula','fa-comments','Ma doula'],['preparer','fa-clipboard-list','Préparer'],['infos','fa-book-medical','Infos']];
function render(){if(!S.role)return;
  $('#roleParent').classList.toggle('on',S.role==='parent');$('#roleDoula').classList.toggle('on',S.role==='doula');
  const tabs=S.role==='parent'?PTABS2:DTABS,cur=S.role==='parent'?S.tab:S.dtab;
  const nl=S.role==='parent'?MSGS.filter(m=>m.de_doula&&!m.lu).length+DOCS.filter(d=>d.statut==='a_remplir').length:Object.values(NONLUS).reduce((a,b)=>a+b,0);
  $('#tabs').innerHTML='<div class="tabs-in" style="--n:'+tabs.length+'">'+tabs.map(t=>{const badge=((S.role==='parent'&&t[0]==='madoula')||(S.role==='doula'&&t[0]==='clientes'))&&nl?'<span class="badge">'+nl+'</span>':'';return '<button data-act="tab" data-v="'+t[0]+'" class="'+(cur===t[0]?'on':'')+'" aria-label="'+t[2]+'">'+icon(t[1])+'<span>'+t[2]+'</span>'+badge+'</button>'}).join('')+'</div>';
  let h='';
  try{if(S.role==='parent')h+=({accueil:pAccueil,suivi:pSuivi,journal:pJournal,madoula:pMaDoula,preparer:pPreparer,souvenirs:pSouvenirs,infos:pInfos}[S.tab]||pAccueil)();
    else h+=({accueil:dAccueil,clientes:dClientes,agenda:dAgenda,outils:dOutils,ressources:dRessources}[S.dtab]||dAccueil)();
  }catch(err){console.error(err);h+='<div class="banner bad">'+icon('fa-triangle-exclamation')+'<div>Cette page n\'a pas pu s\'afficher. <button class="btn sm ghost" data-act="tab" data-v="accueil">Retour à l\'accueil</button></div></div>'}
  h+='<div class="card flat" style="gap:8px"><span class="eyebrow">Mon compte · '+esc(MOI.courriel)+'</span><div id="rg"></div><div class="row"><button class="btn sm ghost" data-act="mdp">'+icon('fa-key')+'Mot de passe</button><button class="btn sm ghost" data-act="deconnexion">'+icon('fa-right-from-bracket')+'Me déconnecter</button></div></div>';
  h+='<p class="foot"><span class="script">Sérénaissance</span>Académie Sérénaissance · academiesere.ca<br>Information générale : ne remplace pas l\'avis de votre équipe de soins.</p>';
  $('#app').innerHTML=h;
  if(window.Reglages&&$('#rg'))try{Reglages.monter($('#rg'),{sb,vapid:VAPID,admin:false,surPush:rafraichir})}catch(e){}
  if(S.role==='parent'&&S.tab==='souvenirs'&&!S.sub)fillPhotos();
  const fil=$('#fil');if(fil)fil.scrollTop=fil.scrollHeight;
  document.querySelectorAll('canvas.sig').forEach(initSig);
}

/* ================== PARENTS · NOUVEAUTÉS ================== */
function motDuJour(){if(MOT)return MOT.texte;const st=stage(),p=S.parent;const n=Math.floor(Date.now()/DAY);let L=MOTS_GROSSESSE;
  if(st.k==='pp')L=MOTS_POSTPARTUM;else if(st.k==='preg'&&st.g.w>=37)L=MOTS_FIN;
  return L[n%L.length].replace(/\{p\}/g,p.prenom||FAM.prenom||'').replace(/\{b\}/g,p.naissance.prenomBebe||'bébé').replace(/^, /,'')}
function hautAccueil(){let h='';const nl=MSGS.filter(m=>m.de_doula&&!m.lu).length,ar=DOCS.filter(d=>d.statut==='a_remplir');
  h+='<div class="card mot"><div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:14px"><div class="av">'+esc(((DOULA&&DOULA.prenom)||'S')[0])+'</div><div style="min-width:0"><span class="eyebrow acc">Mot du jour · '+fmtD(new Date(),{weekday:'long',day:'numeric',month:'long'})+'</span><p class="mot-t">'+esc(motDuJour())+'</p><p class="xs muted">— '+esc(DOULA?DOULA.prenom||doulaNomP():'ta doula')+'</p></div></div></div>';
  if(nl||ar.length)h+='<button class="cl" data-act="tab" data-v="madoula" style="border-color:var(--accent)"><div class="av">'+icon(ar.length?'fa-file-signature':'fa-comments')+'</div><div style="flex:1;min-width:0"><b>'+[nl?nl+' nouveau'+(nl>1?'x':'')+' message'+(nl>1?'s':''):'',ar.length?ar.length+' document'+(ar.length>1?'s':'')+' à remplir':''].filter(Boolean).join(' · ')+'</b><p class="xs muted">De '+esc(doulaNomP())+'</p></div>'+icon('fa-chevron-right','var(--muted)')+'</button>';
  const nx=RDV.filter(r=>r.statut!=='annule'&&new Date(r.debut)>new Date()).sort((a,b)=>new Date(a.debut)-new Date(b.debut))[0];
  if(nx)h+='<div class="card"><div class="li" style="padding:0;border:0"><div class="ic">'+icon('fa-calendar-check')+'</div><div class="tx"><span class="eyebrow acc">'+(nx.statut==='demande'?'Rendez-vous demandé (en attente)':'Prochain rendez-vous')+'</span><b>'+esc(nx.type)+'</b><span>'+quand(nx.debut)+(nx.lieu?' · '+esc(nx.lieu):'')+'</span></div></div></div>';
  return h}
function quand(t){const d=new Date(t);return d.toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long'})+' à '+pad(d.getHours())+' h '+pad(d.getMinutes())}
function pMaDoula(){const seg=S.seg||'messages';let h=sh(esc(doulaNomP()),'Messages, rendez-vous, documents et questions','Ma doula');
  const ar=DOCS.filter(d=>d.statut==='a_remplir').length,nl=MSGS.filter(m=>m.de_doula&&!m.lu).length;
  h+='<div class="seg">'+[['messages','Messages'+(nl?' ('+nl+')':'')],['rdv','Rendez-vous'],['docs','Documents'+(ar?' ('+ar+')':'')],['questions','Mes questions']].map(x=>'<button class="chip '+(seg===x[0]?'on':'')+'" data-act="seg" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
  if(seg==='messages'){if(nl)sb.rpc('fam_marquer_lus',{p_famille:FAM.id}).then(()=>{MSGS.forEach(m=>{if(m.de_doula)m.lu=true})});h+=filMessages(MSGS,false)+'<div class="card"><label class="f">Écrire à '+esc(DOULA&&DOULA.prenom||'ma doula')+'<textarea id="msgTxt" style="min-height:70px" placeholder="Votre message"></textarea></label><button class="btn" data-act="envoyerMsg">'+icon('fa-paper-plane')+'Envoyer</button><p class="xs muted">Votre doula reçoit une notification. Urgence : 911 ou votre hôpital d\'abord. Le soir et la nuit, appelez-la si le travail commence.</p></div>'}
  if(seg==='rdv'){const fut=RDV.filter(r=>r.statut!=='annule'&&new Date(r.debut)>Date.now()-3600e3),pas=RDV.filter(r=>r.statut!=='annule'&&new Date(r.debut)<=Date.now()-3600e3);
    h+='<div class="card"><div class="row between"><span class="eyebrow acc">Mes rendez-vous</span><button class="btn sm" data-act="rdvDemander">'+icon('fa-plus')+'Demander un rendez-vous</button></div>'+(fut.length?'<div class="list">'+fut.map(r=>'<div class="li"><div class="ic">'+icon('fa-calendar-check')+'</div><div class="tx"><b>'+esc(r.type)+'</b><span>'+quand(r.debut)+(r.lieu?' · '+esc(r.lieu):'')+(r.note?' · '+esc(r.note):'')+'</span></div>'+(r.statut==='demande'?'<span class="pill gold">En attente</span>':'<span class="pill sage">Confirmé</span>')+'<button class="icon-btn" data-act="rdvAnnulerP" data-id="'+r.id+'" aria-label="Annuler">'+icon('fa-xmark')+'</button></div>').join('')+'</div>':'<p class="small muted">Aucun rendez-vous à venir.</p>')+'<p class="xs muted">Vous recevez un rappel 24 heures avant chaque rendez-vous confirmé.</p></div>';
    if(pas.length)h+='<details class="acc"><summary>Rendez-vous passés ('+pas.length+')<i class="fa-solid fa-chevron-down chev"></i></summary><div class="body"><div class="list">'+pas.reverse().map(r=>'<div class="li"><div class="tx"><b>'+esc(r.type)+'</b><span>'+quand(r.debut)+'</span></div></div>').join('')+'</div></div></details>'}
  if(seg==='docs'){h+=DOCS.length?DOCS.filter(d=>d.statut!=='annule').map(d=>docLigne(d,false)).join(''):'<div class="card dash small muted">Votre doula déposera ici votre contrat et vos formulaires à remplir et signer. Ils restent toujours disponibles ici.</div>'}
  if(seg==='questions'){const Q=S.parent.questions||[];h+='<div class="card"><span class="eyebrow acc">Mes questions</span><p class="xs muted">Notez-les au fur et à mesure, pour votre doula ou pour votre médecin ou sage-femme.</p><label class="f">Nouvelle question<textarea id="qTxt" style="min-height:60px"></textarea></label><div class="row"><button class="btn sm" data-act="qAjout" data-v="doula">Pour ma doula</button><button class="btn sm ghost" data-act="qAjout" data-v="pro">Pour mon médecin / sage-femme</button></div></div>';
    ['doula','pro'].forEach(k=>{const L=Q.filter(q=>q.pour===k);if(!L.length)return;h+='<div class="card"><span class="eyebrow acc">'+(k==='doula'?'Pour ma doula':'Pour mon médecin ou ma sage-femme')+'</span>'+L.map(q=>{const i=Q.indexOf(q);return '<div class="soft"><label class="check" style="padding:0"><input type="checkbox" data-act="chkQ" data-i="'+i+'" '+(q.fait?'checked':'')+'><span><b>'+esc(q.texte)+'</b></span></label>'+ui.text('parent.questions.'+i+'.reponse','Réponse','text','Notez la réponse')+'<div class="row">'+(k==='doula'&&!q.envoyee?'<button class="btn sm" data-act="qEnvoyer" data-i="'+i+'">'+icon('fa-paper-plane')+'Envoyer à ma doula</button>':k==='doula'?'<span class="pill sage">Envoyée</span>':'')+'<button class="btn sm ghost" data-act="qSuppr" data-i="'+i+'">Retirer</button></div></div>'}).join('')+'</div>'})}
  return h}
function filMessages(L,doula){if(!L.length)return '<div class="card dash small muted" style="text-align:center">Aucun message pour l\'instant.</div>';
  return '<div class="card fil" id="fil">'+L.map(m=>{const moi=doula?m.de_doula:!m.de_doula;return '<div class="bulle '+(moi?'moi':'')+'"><div>'+esc(m.texte).replace(/\n/g,'<br>')+'</div><span class="xs">'+(m.type==='document'?'📄 ':m.type==='rdv'?'📅 ':'')+fmtS(new Date(m.created_at))+' · '+hm(new Date(m.created_at).getTime())+'</span></div>'}).join('')+'</div>'}
const STATUT_DOC={a_remplir:['À remplir et signer','gold'],a_signer_doula:['En attente de la doula','acc'],signe:['Signé','sage'],annule:['Annulé','line']};
function docLigne(d,doula){const st=STATUT_DOC[d.statut]||['','line'];const action=doula?(d.statut==='a_signer_doula'?'Signer':'Ouvrir'):(d.statut==='a_remplir'?'Remplir et signer':'Ouvrir');
  return '<button class="cl" data-act="docOuvrir" data-id="'+d.id+'"><div class="av">'+icon('fa-file-signature')+'</div><div style="flex:1;min-width:0"><b>'+esc(d.titre)+'</b><p class="xs muted">Déposé le '+fmtS(new Date(d.created_at))+'</p></div><span class="pill '+st[1]+'">'+st[0]+'</span><span class="sr">'+action+'</span></button>'}
function rendreTexte(t){return esc(t).split(/\n/).map(l=>l.startsWith('## ')?'<h3 class="doc-h">'+l.slice(3)+'</h3>':l.trim()?'<p>'+l+'</p>':'').join('')}
function docVue(d,doula){const lect=doula||d.statut!=='a_remplir';const R=d.reponses||{};let h='<div class="doc" id="docImp"><div class="row between" style="flex-wrap:nowrap"><div style="min-width:0"><h2>'+esc(d.titre)+'</h2></div><img src="/logo.png" alt="" style="height:36px;width:auto;flex:none"></div>'+rendreTexte(d.contenu);
  const C=d.champs||[];if(C.length){h+='<div class="stack" style="gap:10px;margin-top:10px">'+C.map(c=>{if(c.g)return '<p class="grp-t">'+esc(c.g)+'</p>';const v=R[c.k];
    if(lect)return c.type==='case'?'<p class="small">'+(v?'☑':'☐')+' '+esc(c.t)+'</p>':'<p class="small"><b>'+esc(c.t)+' :</b> '+(v?esc(v):'<span class="muted">—</span>')+'</p>';
    if(c.type==='case')return '<label class="check"><input type="checkbox" class="dch" data-k="'+c.k+'"><span>'+esc(c.t)+'</span></label>';
    if(c.type==='area')return '<label class="f">'+esc(c.t)+'<textarea class="dch" data-k="'+c.k+'" style="min-height:60px"></textarea></label>';
    if(c.type==='choix')return '<label class="f">'+esc(c.t)+'<select class="dch" data-k="'+c.k+'"><option value="">Choisir…</option>'+c.o.map(o=>'<option>'+esc(o)+'</option>').join('')+'</select></label>';
    return '<label class="f">'+esc(c.t)+(c.req?' *':'')+'<input type="'+(c.type==='date'?'date':'text')+'" class="dch" data-k="'+c.k+'"></label>'}).join('')+'</div>'}
  const sig=(s,qui)=>s?'<div class="sigbox"><img src="'+esc(s.image||'')+'" alt="Signature"><p class="xs"><b>'+esc(s.nom)+'</b> · '+qui+' · signé le '+fmtD(new Date(s.le))+' à '+hm(new Date(s.le).getTime())+'</p></div>':'';
  h+='<div class="grid2 resp" style="margin-top:12px">'+sig(d.signature_parent,'Parent')+sig(d.signature_doula,'Doula')+'</div></div>';
  return h}
function sigPad(lbl){return '<div class="stack" style="gap:6px"><label class="f">'+lbl+'<input type="text" id="sigNom" placeholder="Votre nom complet"></label><span class="xs muted">Signez avec le doigt dans le cadre</span><canvas class="sig" id="sigC" width="600" height="180"></canvas><button class="btn sm ghost" data-act="sigEff" style="align-self:flex-start">Effacer</button></div>'}
function initSig(cv){if(cv._ok)return;cv._ok=1;const x=cv.getContext('2d');x.lineWidth=3;x.lineCap='round';x.strokeStyle='#2c221e';let dn=false;cv._vide=true;
  const pos=e=>{const r=cv.getBoundingClientRect();const p=e.touches?e.touches[0]:e;return [(p.clientX-r.left)*cv.width/r.width,(p.clientY-r.top)*cv.height/r.height]};
  const st=e=>{dn=true;const [a,b]=pos(e);x.beginPath();x.moveTo(a,b);e.preventDefault()},mv=e=>{if(!dn)return;const [a,b]=pos(e);x.lineTo(a,b);x.stroke();cv._vide=false;e.preventDefault()},en=()=>{dn=false};
  cv.addEventListener('pointerdown',st);cv.addEventListener('pointermove',mv);window.addEventListener('pointerup',en);cv.style.touchAction='none'}
function lireSig(){const cv=$('#sigC'),nom=($('#sigNom')||{}).value||'';if(!nom.trim()){toast('Écrivez votre nom');return null}if(!cv||cv._vide){toast('Signez dans le cadre');return null}return {nom:nom.trim(),image:cv.toDataURL('image/png'),appareil:navigator.userAgent.slice(0,120)}}
function ouvrirDoc(id){const d=(S.role==='parent'?DOCS:(CDOCS[S.openClient]||[])).find(x=>x.id===id);if(!d)return;
  let b=docVue(d,S.role==='doula');
  if(S.role==='parent'&&d.statut==='a_remplir')b+=(d.sig_parent_requise?sigPad('Votre nom (signature)'):'')+'<label class="check"><input type="checkbox" id="sigOk"><span>J\'ai lu ce document et je l\'accepte.</span></label><button class="btn" data-act="docSignerP" data-id="'+d.id+'">'+icon('fa-signature')+(d.sig_parent_requise?'Signer et envoyer':'Envoyer')+'</button>';
  if(S.role==='doula'&&d.statut==='a_signer_doula')b+=sigPad('Votre nom (signature de la doula)')+'<button class="btn" data-act="docSignerD" data-id="'+d.id+'">'+icon('fa-signature')+'Signer</button>';
  if(d.statut==='signe'||d.statut==='a_signer_doula')b+='<button class="btn ghost" data-act="imprimer">'+icon('fa-print')+'Imprimer ou enregistrer en PDF</button>';
  if(S.role==='doula'&&d.statut==='a_remplir')b+='<button class="btn sm danger" data-act="docAnnuler" data-id="'+d.id+'" style="align-self:flex-start">Retirer ce document</button>';
  sheet(esc(d.titre),b);document.querySelectorAll('canvas.sig').forEach(initSig)}

/* ================== DOULA · NOUVEAUTÉS ================== */
function statutCard(c){const st={invitee:['Invitée · inscription à finaliser','gold'],active:['Active','sage'],archivee:['Archivée','line'],non_retenue:['N\'a pas retenu mes services','line']}[c.statut]||['','line'];
  return '<div class="card"><div class="row between"><span class="eyebrow acc">Compte de la famille</span><span class="pill '+st[1]+'">'+st[0]+'</span></div><p class="small">'+icon('fa-envelope','var(--accent)')+' '+esc(c.courriel)+(c.parent_user?' · <b>inscription finalisée</b>':c.invite_envoyee?' · invitation envoyée le '+fmtS(new Date(c.invite_envoyee)):' · invitation pas encore envoyée')+'</p>'+
   (c.parent_user?'':'<button class="btn sm" data-act="inviter" data-id="'+c.id+'">'+icon('fa-paper-plane')+(c.invite_envoyee?'Renvoyer l\'invitation':'Envoyer l\'invitation')+'</button>')+
   '<div class="row">'+(c.statut==='active'||c.statut==='invitee'?'<button class="btn sm ghost" data-act="statut" data-id="'+c.id+'" data-v="archivee">Archiver (fin de l\'accompagnement)</button><button class="btn sm ghost" data-act="statut" data-id="'+c.id+'" data-v="non_retenue">N\'a pas retenu mes services</button>':'<button class="btn sm ghost" data-act="statut" data-id="'+c.id+'" data-v="active">Réactiver</button>')+'</div>'+
   '<p class="xs muted">Conservé au moins jusqu\'au '+fmtD(parseD(c.conserver_jusqu))+'. Les dossiers restent dans l\'appli au moins un an, même si la famille ne va pas de l\'avant.</p></div>'}
function cMessages(c){const L=CMSGS[c.id]||[];if(NONLUS[c.id]){sb.rpc('fam_marquer_lus',{p_famille:c.id});NONLUS[c.id]=0}
  return filMessages(L,true)+'<div class="card"><label class="f">Modèle de message<select id="modSel" data-act="modSel"><option value="">Choisir un modèle (facultatif)…</option>'+MESSAGES.map((m,k)=>'<option value="'+k+'">'+esc(m[0])+'</option>').join('')+'<option value="fin">Lettre de fin d\'accompagnement</option></select></label><label class="f">Message à '+esc(c.prenom||'la famille')+'<textarea id="msgTxt" style="min-height:110px"></textarea></label><button class="btn" data-act="envoyerMsgD" data-id="'+c.id+'">'+icon('fa-paper-plane')+'Envoyer dans l\'appli</button><p class="xs muted">'+(c.parent_user?'La famille reçoit une notification sur son téléphone (ou un courriel si elle n\'a pas activé les notifications).':'La famille n\'a pas encore finalisé son inscription : elle verra le message à sa première connexion.')+'</p></div>'}
function cRdvs(c){const L=CRDV.filter(r=>r.famille_id===c.id).sort((a,b)=>new Date(b.debut)-new Date(a.debut));
  let h='<div class="row between"><span class="eyebrow acc">Rendez-vous</span><button class="btn sm" data-act="rdvNouveau" data-id="'+c.id+'">'+icon('fa-plus')+'Nouveau rendez-vous</button></div>';
  if(!L.length)h+='<div class="card dash small muted">Aucun rendez-vous. La famille reçoit une notification et un courriel, puis un rappel 24 h avant.</div>';
  L.forEach(r=>{const pass=new Date(r.debut)<Date.now();h+='<div class="card"><div class="row between"><b>'+esc(r.type)+'</b>'+({demande:'<span class="pill gold">Demandé par la famille</span>',confirme:'<span class="pill sage">Confirmé</span>',annule:'<span class="pill line">Annulé</span>'}[r.statut])+'</div><p class="small">'+quand(r.debut)+' · '+r.duree_min+' min'+(r.lieu?' · '+esc(r.lieu):'')+'</p>'+(r.note?'<p class="xs muted">'+esc(r.note)+'</p>':'')+(r.statut!=='annule'&&!pass?'<div class="row">'+(r.statut==='demande'?'<button class="btn sm" data-act="rdvConfirmer" data-id="'+r.id+'">Confirmer</button>':'')+'<button class="btn sm ghost" data-act="rdvModifier" data-id="'+r.id+'">Changer l\'heure</button><button class="btn sm danger" data-act="rdvAnnulerD" data-id="'+r.id+'">Annuler</button></div>':'')+(r.rappel_24h?'<p class="xs muted">Rappel 24 h envoyé</p>':'')+'</div>'});return h}
function cDocs(c){const L=(CDOCS[c.id]||[]).filter(d=>d.statut!=='annule');let h='<div class="card"><span class="eyebrow acc">Envoyer un document à remplir et signer</span><div class="tiles">'+Object.entries(DOC_TYPES).map(([k,t])=>'<button class="tile" data-act="docPreparer" data-id="'+c.id+'" data-v="'+k+'" style="box-shadow:none"><span class="ti">'+icon(k==='contrat'?'fa-file-contract':k==='accueil'?'fa-clipboard-user':k==='photos'?'fa-camera':k==='autre'?'fa-file-pen':'fa-user-shield')+'</span><b>'+(k==='autre'?'Autre document':t.titre)+'</b><span>'+(t.sigD?'Signé par la famille, puis par vous':'Rempli et signé par la famille')+'</span></button>').join('')+'</div></div>';
  h+=L.length?L.map(d=>docLigne(d,true)).join(''):'<div class="card dash small muted">Aucun document envoyé.</div>';return h}
function remplirModele(t,c){const D=S.doula,F=FORFAITS[c.forfait];const v={doula_nom:D.nom,doula_adresse:D.adresse||'[adresse]',doula_tel:D.tel,doula_courriel:D.courriel,doula_region:D.region||'[ma région]',parent_nom:c.nom,partenaire:c.partenaire||'',partenaire_et:c.partenaire?' et '+c.partenaire:'',parent_courriel:c.courriel,parent_tel:c.tel||'',dpa:c.dpa?fmtD(parseD(c.dpa)):'[date prévue]',lieu:c.lieu||'[lieu]',professionnel:c.prof||'[professionnel]',forfait:c.forfait||'[forfait]',prix:F?money(F.prix):'[prix]',date:fmtD(new Date()),assurance:D.assurance||'aucune pour le moment'};
  return t.replace(/\{\{(\w+)\}\}/g,(m,k)=>v[k]!=null?v[k]:m)}
function modeleTexte(k){const m=(ME_DOULA&&ME_DOULA.modeles||{}).docs||{};return m[k]!=null?m[k]:DOC_TYPES[k].texte}
function cSuivi(c){const p=deepMerge(blankParent(),c.parent_data||{});const J=c._journal||[];let h='';
  if(!c.parent_user)return '<div class="card dash small muted">La famille n\'a pas encore finalisé son inscription. Son suivi apparaîtra ici.</div>';
  const c24=Date.now()-DAY,j24=J.filter(l=>l.t>=c24);
  if(cStage(c).k==='pp'){h+='<div class="card"><span class="eyebrow acc">Dernières 24 heures (journal de la famille)</span><div class="grid3"><div class="stat"><b>'+j24.filter(l=>l.type==='sein'||l.type==='biberon').length+'</b><span>boires</span></div><div class="stat"><b>'+j24.filter(l=>l.type==='couche'&&l.pipi).length+'</b><span>couches mouillées</span></div><div class="stat"><b>'+j24.filter(l=>l.type==='couche'&&l.selle).length+'</b><span>selles</span></div></div></div>'}
  const hum=J.filter(l=>l.type==='humeur').slice(-1)[0];const moral=Object.values(p.moral||{}).some(Boolean);
  h+='<div class="card"><span class="eyebrow acc">Moral</span>'+(hum?'<p class="small">Dernière humeur notée : <b>'+MOODS[hum.v][1]+'</b>'+(hum.note?' · « '+esc(hum.note)+' »':'')+' ('+fmtS(new Date(hum.t))+')</p>':'<p class="small muted">Aucune humeur notée cette semaine.</p>')+(moral?'<div class="banner gold">'+icon('fa-comments')+'<div class="small">A répondu oui à au moins une des deux questions sur le moral. Poursuivre la discussion et suggérer une évaluation (médecin, CLSC, 811).</div></div>':'')+'</div>';
  const hi=PEURS.filter(x=>(p.peurs||{})[x]>=3);if(Object.keys(p.peurs||{}).length)h+='<div class="card"><span class="eyebrow acc">Peurs et besoins</span><p class="small">'+(hi.length?'À 3 ou 4 : <b>'+esc(hi.join(', '))+'</b>':'Aucune peur à 3 ou 4.')+'</p>'+(p.peursT&&p.peursT.peur?'<p class="small">« '+esc(p.peursT.peur)+' »</p>':'')+'</div>';
  const plan=Object.keys(p.plan||{}).filter(k=>p.plan[k]);h+='<details class="acc"><summary>'+icon('fa-clipboard-list','var(--accent)')+'Plan de naissance ('+plan.length+' choix)<i class="fa-solid fa-chevron-down chev"></i></summary><div class="body">'+(plan.length?'<ul class="clean small">'+plan.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p class="small muted">Pas encore rempli.</p>')+((p.planF||{}).important1?'<p class="small"><b>Le plus important :</b> '+esc(p.planF.important1)+'</p>':'')+((p.planF||{}).codeword?'<p class="small"><b>Mot de code :</b> '+esc(p.planF.codeword)+'</p>':'')+'</div></details>';
  const Q=(p.questions||[]).filter(q=>!q.fait);if(Q.length)h+='<div class="card"><span class="eyebrow acc">Ses questions en attente</span><ul class="clean small">'+Q.map(q=>'<li>'+esc(q.texte)+' <span class="muted xs">('+(q.pour==='pro'?'pour son professionnel':'pour vous')+')</span></li>').join('')+'</ul></div>';
  const val=Object.values(VALISE).flat();h+='<div class="card"><span class="eyebrow acc">Préparation</span><div class="grid3"><div class="stat"><b>'+ui.count2(p.prep,PREP)+'/'+PREP.length+'</b><span>préparer ma naissance</span></div><div class="stat"><b>'+ui.count2(p.valise,val)+'/'+val.length+'</b><span>valise</span></div><div class="stat"><b>'+Object.values(p.cahier||{}).filter(Boolean).length+'/10</b><span>cahier de préparation</span></div></div></div>';
  if(J.length)h+='<details class="acc"><summary>'+icon('fa-book-open','var(--accent)')+'Journal des 7 derniers jours ('+J.length+')<i class="fa-solid fa-chevron-down chev"></i></summary><div class="body"><div class="list">'+J.slice().reverse().slice(0,60).map(l=>'<div class="li"><div class="ic">'+icon((LOGMETA[l.type]||['fa-pen'])[0])+'</div><div class="tx"><b>'+(LOGMETA[l.type]||['','Note'])[1]+' · '+fmtS(new Date(l.t))+' '+fmtT(l.t)+'</b><span>'+logText(l)+'</span></div></div>').join('')+'</div></div></details>';
  return h}
ui.count2=(o,arr)=>arr.filter(x=>(o||{})[x]).length;
function cMots(c){const L=CMOTS[c.id]||[];return '<div class="card"><span class="eyebrow acc">Mot du jour personnalisé</span><p class="xs muted">Chaque matin, la famille reçoit une notification et un mot adapté à son étape (grossesse, fin de grossesse ou post-partum), signé de votre prénom. Écrivez votre propre mot pour une date précise : il remplace le mot automatique ce jour-là.</p><div class="grid2">'+'<label class="f">Date<input type="date" id="motJour" value="'+iso(addD(new Date(),1))+'"></label></div><label class="f">Mon mot<textarea id="motTxt" style="min-height:80px" placeholder="Ex. : Bonne chance pour ton écho demain, je pense à toi !"></textarea></label><button class="btn sm" data-act="motSave" data-id="'+c.id+'">'+icon('fa-feather')+'Enregistrer le mot</button></div>'+(L.length?'<div class="card"><span class="eyebrow acc">Mots prévus</span><div class="list">'+L.map(m=>'<div class="li"><div class="tx"><b>'+fmtD(parseD(m.jour),{weekday:'long',day:'numeric',month:'long'})+'</b><span>'+esc(m.texte)+'</span></div><button class="icon-btn" data-act="motSuppr" data-id="'+c.id+'" data-r="'+m.id+'" aria-label="Retirer">'+icon('fa-trash')+'</button></div>').join('')+'</div></div>':'')}
DSUB.modeles=function(){const k=S.modK||'contrat';let h=sh('Mes modèles de documents','Ceux de Sabrina sont des exemples : modifiez le texte à votre image. Il sera rempli avec les informations de chaque famille.');
  h+='<div class="seg">'+Object.entries(DOC_TYPES).filter(e=>e[0]!=='autre').map(([kk,t])=>'<button class="chip '+(k===kk?'on':'')+'" data-act="modK" data-v="'+kk+'">'+t.titre+'</button>').join('')+'</div>';
  h+='<div class="card"><p class="xs muted">Titres de section : commencez la ligne par « ## ». Variables : {{doula_nom}} {{doula_adresse}} {{doula_tel}} {{doula_courriel}} {{doula_region}} {{parent_nom}} {{partenaire_et}} {{parent_courriel}} {{parent_tel}} {{dpa}} {{lieu}} {{professionnel}} {{forfait}} {{prix}} {{assurance}} {{date}}</p><textarea id="modTxt" style="min-height:380px;font-size:.85rem">'+esc(modeleTexte(k))+'</textarea><div class="row"><button class="btn" data-act="modSave" data-v="'+k+'">Enregistrer mon modèle</button><button class="btn ghost sm" data-act="modReset" data-v="'+k+'">Revenir au modèle de Sabrina</button></div>'+(DOC_TYPES[k].champs.length?'<p class="xs muted">Champs remplis par la famille : '+DOC_TYPES[k].champs.filter(c=>!c.g).map(c=>c.t).join(' · ')+'</p>':'')+'</div>';return h};
DSUB.profil=function(){return sh('Mon profil de doula','Utilisé dans les contrats, les messages, la lettre à l\'équipe et les reçus')+'<div class="card"><div class="grid2 resp">'+ui.text('doula.nom','Mon nom')+ui.text('doula.tel','Mon téléphone','tel')+'<label class="f">Mon courriel (lié au compte)<input type="email" value="'+esc(S.doula.courriel)+'" disabled></label>'+ui.text('doula.region','Ma région (ex. Campbellton)')+ui.text('doula.adresse','Mon adresse d\'affaires')+ui.text('doula.rempNom','Ma remplaçante')+ui.text('doula.rempTel','Téléphone de la remplaçante','tel')+ui.text('doula.tvh','No de TVH (ou « non inscrite »)')+ui.text('doula.assurance','Assurance responsabilité (assureur, no de police)')+'</div><p class="xs muted">Les familles voient votre nom, votre téléphone et votre remplaçante.</p></div>'};
DSUB.doulas=function(){if(!MOI.admin)return '<p class="small">Réservé à l\'administration.</p>';let h=sh('Les doulas de l\'Académie','Ajoutez une doula : elle reçoit un courriel pour finaliser son inscription');
  h+='<div class="card"><div class="grid2 resp"><label class="f">Prénom<input type="text" id="ndPrenom"></label><label class="f">Nom<input type="text" id="ndNom"></label><label class="f">Courriel<input type="email" id="ndCourriel"></label></div><button class="btn" data-act="doulaAjout">'+icon('fa-user-plus')+'Ajouter et inviter</button></div><div id="listeDoulas" class="card"><p class="small muted">Chargement…</p></div>';
  setTimeout(async()=>{const {data}=await sb.from('fam_doulas').select('id,prenom,nom,courriel,user_id,actif,invite_envoyee').order('created_at');const el=$('#listeDoulas');if(el)el.innerHTML='<div class="list">'+(data||[]).map(d=>'<div class="li"><div class="ic">'+icon('fa-user')+'</div><div class="tx"><b>'+esc([d.prenom,d.nom].filter(Boolean).join(' ')||d.courriel)+'</b><span>'+esc(d.courriel)+' · '+(d.user_id?'inscription finalisée':d.invite_envoyee?'invitée le '+fmtS(new Date(d.invite_envoyee)):'pas encore invitée')+(d.actif?'':' · désactivée')+'</span></div>'+(d.user_id?'':'<button class="btn sm ghost" data-act="doulaInviter" data-id="'+d.id+'">Inviter</button>')+'<button class="btn sm ghost" data-act="doulaActif" data-id="'+d.id+'" data-v="'+(d.actif?'0':'1')+'">'+(d.actif?'Désactiver':'Réactiver')+'</button></div>').join('')+'</div>'},0);return h};
if(!DOUT.find(x=>x[0]==='doulas'))DOUT.push(['doulas','fa-users-gear','Les doulas (admin)','Ajouter et inviter des doulas']);
const _dOutils=dOutils;dOutils=function(){if(!S.dsub&&!MOI.admin){const k=DOUT.findIndex(x=>x[0]==='doulas');if(k>=0)DOUT.splice(k,1)}return _dOutils()};
const _dAgenda=dAgenda;dAgenda=function(){const fut=CRDV.filter(r=>r.statut!=='annule'&&new Date(r.debut)>Date.now()-3600e3).sort((a,b)=>new Date(a.debut)-new Date(b.debut));
  let h='<div class="card"><span class="eyebrow acc">Mes rendez-vous à venir</span>'+(fut.length?'<div class="list">'+fut.map(r=>{const c=S.clients.find(x=>x.id===r.famille_id);return '<button class="li" data-act="clientOpen" data-id="'+r.famille_id+'" style="background:none;border-left:0;border-right:0;border-top:0;width:100%;text-align:left;cursor:pointer;color:inherit"><div class="ic">'+icon(r.statut==='demande'?'fa-hourglass-half':'fa-calendar-check')+'</div><div class="tx"><b>'+esc(c?c.nom:'Famille')+' · '+esc(r.type)+'</b><span>'+quand(r.debut)+(r.statut==='demande'?' · demande à confirmer':'')+'</span></div></button>'}).join('')+'</div>':'<p class="small muted">Aucun rendez-vous à venir.</p>')+'</div>';
  return _dAgenda().replace('</div>',  '</div>'+h)};
const _dAccueil=dAccueil;dAccueil=function(){const dem=CRDV.filter(r=>r.statut==='demande'&&new Date(r.debut)>Date.now());const nl=Object.entries(NONLUS).filter(e=>e[1]);const sig=Object.values(CDOCS).flat().filter(d=>d.statut==='a_signer_doula');
  let h='';if(nl.length||dem.length||sig.length)h='<div class="card" style="border-color:var(--accent)"><span class="eyebrow acc">À traiter</span><div class="list">'+nl.map(([id,n])=>{const c=S.clients.find(x=>x.id===id);return c?'<button class="li" data-act="clientOpen" data-id="'+id+'" data-v="messages" style="background:none;border-left:0;border-right:0;border-top:0;width:100%;text-align:left;cursor:pointer;color:inherit"><div class="ic">'+icon('fa-comments')+'</div><div class="tx"><b>'+esc(c.nom)+'</b><span>'+n+' message'+(n>1?'s':'')+' non lu'+(n>1?'s':'')+'</span></div></button>':''}).join('')+dem.map(r=>{const c=S.clients.find(x=>x.id===r.famille_id);return '<button class="li" data-act="clientOpen" data-id="'+r.famille_id+'" data-v="rdvs" style="background:none;border-left:0;border-right:0;border-top:0;width:100%;text-align:left;cursor:pointer;color:inherit"><div class="ic">'+icon('fa-hourglass-half')+'</div><div class="tx"><b>'+esc(c?c.nom:'')+'</b><span>Demande de rendez-vous : '+quand(r.debut)+'</span></div></button>'}).join('')+sig.map(d=>{const c=S.clients.find(x=>x.id===d.famille_id);return '<button class="li" data-act="clientOpen" data-id="'+d.famille_id+'" data-v="docs" style="background:none;border-left:0;border-right:0;border-top:0;width:100%;text-align:left;cursor:pointer;color:inherit"><div class="ic">'+icon('fa-signature')+'</div><div class="tx"><b>'+esc(c?c.nom:'')+'</b><span>À signer : '+esc(d.titre)+'</span></div></button>'}).join('')+'</div></div>';
  return h+_dAccueil()};
const _cStatsTag=stageTag;


/* ================== ILLUSTRATIONS ================== */
function fig(n,cap,credit){return '<figure class="illu"><img src="/famille/img/'+n+'.jpg" alt="'+esc(cap)+'" loading="lazy" data-act="zoom" data-v="'+n+'"><figcaption>'+esc(cap)+(credit?' · Illustration © @la.doula, utilisée sous licence par l\'Académie Sérénaissance':'')+'</figcaption></figure>'}
function insererApresTitre(h,x){const i=h.indexOf('<div class="card');return i<0?h+x:h.slice(0,i)+x+h.slice(i)}
const _pPart=PSUB.partenaire;PSUB.partenaire=()=>insererApresTitre(_pPart(),fig('partenaire-soutien','Le soutien du partenaire',1)+'<div class="illus">'+fig('massages-doux','Massages doux et stimuli agréables',1)+fig('massages-profonds','Massages profonds et acupression (avec un cours Bonapace)',1)+'</div>');
const _pPos=PSUB.positions;PSUB.positions=()=>insererApresTitre(_pPos(),'<div class="illus">'+fig('positions-travail','Positions pendant le travail')+fig('positions-repos','Positions de repos et ballon-arachide')+fig('positions-physiologiques','Positions qui ouvrent le bassin',1)+fig('positions-peridurale','Bouger avec une péridurale',1)+'</div>');
/* respiration guidée */
let breathT=null;
function startBreath(){let ph=0,n=4;const tick=()=>{const e=$('#breath');if(!e){clearInterval(breathT);breathT=null;S.breath=false;return}e.textContent=(ph===0?'Inspirez… ':'Expirez… ')+n;n--;if(n<=0){ph=1-ph;n=ph===0?4:6}};tick();breathT=setInterval(tick,1000)}
document.addEventListener('click',e=>{const z=e.target.closest('[data-act=zoom]');if(!z)return;sheet('Illustration','<img src="/famille/img/'+z.dataset.v+'.jpg" alt="" style="width:100%;border-radius:16px">')},true);

/* ================== ÉVÉNEMENTS ================== */
async function logPush(o){if(S.role!=='parent'){o.id=uid();S.logs.push(o);return}
  const {id,t,type,...data}=o;const {data:r,error}=await sb.from('fam_journal').insert({famille_id:FAM.id,t:new Date(t||Date.now()).toISOString(),type,data}).select('id').single();
  if(error){toast('Pas enregistré : vérifiez votre connexion');return}o.id=r.id;S.logs.push(o)}
async function addLog(o){o.t=o.t||Date.now();await logPush(o);close();render();toast('Ajouté au journal')}
async function inviter(id){toast('Envoi de l\'invitation…');const {data,error}=await sb.functions.invoke('fam-inviter',{body:{famille:id}});
  if(error||!data||!data.ok){toast((data&&data.erreur)||'L\'invitation n\'a pas pu partir');return false}const c=S.clients.find(x=>x.id===id);if(c)c.invite_envoyee=new Date().toISOString();toast('Invitation envoyée à '+data.courriel);render();return true}
function rdvSheet(fid,r,parent){const d=r?new Date(r.debut):addD(new Date(),3);const di=iso(d),hr=r?pad(d.getHours())+':'+pad(d.getMinutes()):'10:00';
  sheet(parent?'Demander un rendez-vous':r?'Changer l\'heure':'Nouveau rendez-vous','<div class="grid2"><label class="f">Date<input type="date" id="rvDate" value="'+di+'"></label><label class="f">Heure<input type="time" id="rvHeure" value="'+hr+'"></label></div>'+(r?'':'<label class="f">Type<select id="rvType">'+(parent?['Rencontre avec ma doula','Appel téléphonique','Visio','Visite postnatale']:['Rencontre de connaissance','Prénatale 1 · Faire connaissance','Prénatale 2 · La naissance','Prénatale 3 · Préparer le jour J','Visite postnatale','Séance de retour sur la naissance','Appel téléphonique','Visio','Rencontre']).map(x=>'<option>'+x+'</option>').join('')+'</select></label>'+(parent?'':'<div class="grid2"><label class="f">Durée (minutes)<input type="number" id="rvDuree" value="90"></label><label class="f">Lieu ou lien<input type="text" id="rvLieu" placeholder="Domicile, bureau, lien visio…"></label></div>')+'<label class="f">'+(parent?'Message pour ma doula':'Note')+'<input type="text" id="rvNote"></label>')+'<button class="btn" data-act="'+(parent?'rdvEnvoyerP':r?'rdvChanger':'rdvCreer')+'" data-id="'+(r?r.id:fid)+'">'+(parent?'Envoyer la demande':'Enregistrer')+'</button>'+(parent?'<p class="xs muted">Votre doula confirme ou propose une autre heure. Heure de l\'Atlantique.</p>':'<p class="xs muted">La famille reçoit une notification et un courriel, puis un rappel 24 h avant.</p>'))}
function lireRdv(){const d=$('#rvDate').value,h=$('#rvHeure').value;if(!d||!h){toast('Choisissez la date et l\'heure');return null}const t=new Date(d+'T'+h);if(t<new Date()){toast('Cette date est passée');return null}return t}

document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v,id=b.dataset.id;
  if(['INPUT','SELECT','TEXTAREA'].includes(b.tagName))return;
  if(a==='closeBg'&&e.target!==b)return;
  const C=()=>S.clients.find(c=>c.id===(id||S.openClient));
  try{switch(a){
  case 'lienConnexion':{const em=($('#lCourriel')||{}).value;if(!em){toast('Entrez votre courriel');return}const {error}=await sb.auth.signInWithOtp({email:em.trim(),options:{shouldCreateUser:false,emailRedirectTo:location.origin+'/famille/'}});toast(error?'Aucun compte avec ce courriel. Votre doula doit d\'abord vous inscrire.':'Lien envoyé : regardez vos courriels');return}
  case 'deconnexion':await sb.auth.signOut();location.href='/famille/';return;
  case 'mdp':motDePasseSheet(false);return;
  case 'saveMdp':{const p1=$('#mdp1').value,p2=$('#mdp2').value;if(p1.length<8){toast('8 caractères ou plus');return}if(p1!==p2){toast('Les deux mots de passe diffèrent');return}const {error}=await sb.auth.updateUser({password:p1});if(error){toast(error.message);return}close();toast('Mot de passe enregistré');return}
  case 'role':if(v===S.role)return;S.role=v;try{localStorage.setItem('sere-fam-role',v)}catch(x){}S.openClient=null;$('#app').innerHTML='<p class="small muted" style="text-align:center;padding:40px">Chargement…</p>';await charger();scrollTo(0,0);render();return;
  case 'tab':if(S.role==='parent'){S.tab=v;S.sub=''}else{S.dtab=v;S.dsub='';S.openClient=null}scrollTo(0,0);break;
  case 'go':{const [t,s]=v.split('|');S.tab=t;S.sub=s||'';scrollTo(0,0);break}
  case 'dgo':{const [t,s]=v.split('|');S.dtab=t;S.dsub=s||'';S.openClient=null;scrollTo(0,0);break}
  case 'sub':S.sub=v;scrollTo(0,0);break;
  case 'dsub':S.dsub=v;scrollTo(0,0);break;
  case 'seg':S.seg=v;break;
  case 'close':case 'closeBg':close();return;
  case 'pick':{setP(b.dataset.p,getP(b.dataset.p)===v?'':v);if(b.closest('.sheet')){b.parentNode.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b&&getP(b.dataset.p)===v));return}break}
  case 'peur':S.parent.peurs[b.dataset.k]=+v;break;
  case 'cpeur':{const c=C();(c.peurs=c.peurs||{})[b.dataset.k]=+v;break}
  case 'planV':S.planV=v;break;
  case 'aff':S.affI=(((S.affI||0)+(+v))%AFFIRM.length+AFFIRM.length)%AFFIRM.length;break;
  case 'breath':if(breathT){clearInterval(breathT);breathT=null;S.breath=false;render()}else{S.breath=true;render();startBreath()}return;
  case 'humeur':case 'symptome':case 'biberon':case 'tirage':case 'couche':case 'sommeil':case 'poids':case 'soin':case 'note':case 'feed':FORMS[a]();return;
  case 'pickMood':document.querySelectorAll('[data-act=pickMood]').forEach(x=>x.classList.toggle('on',x===b));return;
  case 'toggleChip':b.classList.toggle('on');return;
  case 'saveMood':{const on=document.querySelector('[data-act=pickMood].on');if(!on){toast('Choisissez une humeur');return}await addLog({type:'humeur',v:+on.dataset.v,note:$('#m_note').value,t:getT()});return}
  case 'saveSym':{const l=[...document.querySelectorAll('.sheet [data-act=toggleChip].on')].map(x=>x.textContent);if(!l.length&&!$('#m_note').value){toast('Choisissez au moins un symptôme');return}await addLog({type:'symptome',list:l,note:$('#m_note').value,t:getT()});return}
  case 'saveBib':await addLog({type:'biberon',ml:+$('#m_ml').value||0,lait:$('#m_lait').value,t:getT()});return;
  case 'saveTir':await addLog({type:'tirage',ml:+$('#m_ml').value||0,dest:$('#m_dest').value,t:getT()});return;
  case 'saveCouche':{const p=$('#c_pipi').classList.contains('on'),s=$('#c_selle').classList.contains('on');if(!p&&!s){toast('Choisissez pipi ou selle');return}await addLog({type:'couche',pipi:p,selle:s,couleur:s?$('#m_col').value:'',t:getT()});return}
  case 'saveSleep':await addLog({type:'sommeil',sec:(+$('#m_min').value||0)*60,note:$('#m_note').value,t:getT()});return;
  case 'savePoids':{const g=+$('#m_g').value;if(!g){toast('Entrez le poids en grammes');return}await addLog({type:'poids',g,t:getT()});return}
  case 'saveSoin':case 'saveNote':await addLog({type:a==='saveSoin'?'soin':'note',note:$('#m_note').value,t:getT()});return;
  case 'saveFeed':await addLog({type:'sein',side:$('#m_side').value,sec:(+$('#m_min').value||0)*60,t:getT()});return;
  case 'feedGo':S.timer={side:v,start:Date.now(),t0:Date.now()};close();break;
  case 'feedSwitch':{const T=S.timer;await logPush({type:'sein',side:T.side,sec:Math.round((Date.now()-T.start)/1000),t:T.start});S.timer={side:T.side==='G'?'D':'G',start:Date.now(),t0:T.t0};toast('Sein '+(T.side==='G'?'droit':'gauche'));break}
  case 'feedStop':{const T=S.timer;S.timer=null;await logPush({type:'sein',side:T.side,sec:Math.round((Date.now()-T.start)/1000),t:T.start});toast('Tétée enregistrée');break}
  case 'feedCancel':S.timer=null;break;
  case 'kickStart':S.kick={start:Date.now(),count:0};if(S.tab!=='journal')S.tab='accueil';break;
  case 'kickAdd':S.kick.count++;break;
  case 'kickStop':{const K=S.kick;S.kick=null;if(K.count)await logPush({type:'mvt',count:K.count,sec:Math.round((Date.now()-K.start)/1000),t:K.start});break}
  case 'contr':S.showContr=true;break;
  case 'contrHide':S.showContr=false;S.contrActive=null;break;
  case 'contrStart':S.contrActive=Date.now();S.showContr=true;break;
  case 'contrEnd':{const st=S.contrActive;S.contrActive=null;await logPush({type:'contraction',t:st,sec:Math.round((Date.now()-st)/1000)});break}
  case 'delLog':{if(S.role==='parent'){const {error}=await sb.from('fam_journal').delete().eq('id',id);if(error){toast('Pas supprimé');return}}S.logs=S.logs.filter(l=>String(l.id)!==String(id));toast('Supprimé');break}
  case 'jf':S.jf=v;break;
  case 'birthForm':birthForm();return;
  case 'saveBirth':{const d=$('#b_date').value;if(!d){toast('Entrez la date');return}Object.assign(S.parent.naissance,{date:d,heure:$('#b_h').value,prenomBebe:$('#b_pre').value,lieu:$('#b_lieu').value,poids:$('#b_p').value,taille:$('#b_t').value});if($('#b_p').value)await logPush({type:'poids',g:+$('#b_p').value,t:parseD(d).getTime()+12*3600e3});S.tab='accueil';S.sub='';S.kick=null;close();await saveParent();
    sb.from('fam_messages').insert({famille_id:FAM.id,de_doula:false,texte:'👶 '+(S.parent.naissance.prenomBebe||'Bébé')+' est né(e) le '+fmtD(parseD(d))+(S.parent.naissance.heure?' à '+S.parent.naissance.heure:'')+' !'}).then(()=>{});toast('Félicitations !');break}
  case 'unBirth':S.parent.naissance.date='';close();break;
  case 'copyEl':{const el=$('#'+v);if(el)copy(el.textContent,el);return}
  case 'copyTxt':copy(b.dataset.t);return;
  case 'sendAvis':{const p=S.parent;const t='VOTRE AVIS COMPTE\n'+AVIS.map((x,i)=>'- '+x+' : '+((p.avis||{})[i]||'—')).join('\n')+'\n\nCe qui m\'a le plus aidée : '+(p.avisT.aide||'')+'\nÀ améliorer : '+(p.avisT.ameliorer||'')+'\nTémoignage : '+(p.avisT.temoignage||'')+'\nPublication : '+(p.avisT.pub||'—');await sb.from('fam_messages').insert({famille_id:FAM.id,de_doula:false,texte:t});await chargerEchanges();toast('Envoyé à votre doula. Merci !');break}
  case 'phOpen':{const p=photosCache.find(x=>x.id===id);if(!p)return;sheet('Photo','<img src="'+p.src+'" alt="" style="border-radius:16px;width:100%"><label class="f">Légende<input type="text" id="ph_cap" value="'+esc(p.cap)+'"></label><div class="row"><button class="btn" data-act="phSave" data-id="'+id+'">Enregistrer</button><button class="btn danger" data-act="phDel" data-id="'+id+'">Supprimer</button></div>');return}
  case 'phSave':{const p=photosCache.find(x=>x.id===id);p.cap=$('#ph_cap').value;await putPhoto(p);close();fillPhotos();return}
  case 'phDel':if(b.dataset.c!=='1'){b.dataset.c='1';b.textContent='Confirmer la suppression';return}await delPhoto(id);close();fillPhotos();toast('Photo supprimée');return;
  /* parents · ma doula */
  case 'envoyerMsg':{const t=$('#msgTxt').value.trim();if(!t)return;b.disabled=true;const {error}=await sb.from('fam_messages').insert({famille_id:FAM.id,de_doula:false,texte:t});if(error){toast('Pas envoyé : '+error.message);b.disabled=false;return}await chargerEchanges();toast('Message envoyé');break}
  case 'rdvDemander':rdvSheet(FAM.id,null,true);return;
  case 'rdvEnvoyerP':{const t=lireRdv();if(!t)return;const {error}=await sb.from('fam_rdv').insert({famille_id:FAM.id,debut:t.toISOString(),type:$('#rvType').value,note:$('#rvNote').value||null,statut:'demande',demande_par:'parent'});if(error){toast('Pas envoyé : '+error.message);return}close();await chargerEchanges();toast('Demande envoyée à votre doula');break}
  case 'rdvAnnulerP':if(b.dataset.c!=='1'){b.dataset.c='1';b.innerHTML='Annuler ?';toast('Touchez encore pour annuler ce rendez-vous');return}{const {error}=await sb.rpc('fam_rdv_annuler',{p_id:+id});if(error){toast(error.message);return}await chargerEchanges();toast('Rendez-vous annulé');break}
  case 'docOuvrir':ouvrirDoc(id);return;
  case 'sigEff':{const cv=$('#sigC');cv.getContext('2d').clearRect(0,0,cv.width,cv.height);cv._vide=true;return}
  case 'docSignerP':{const d=DOCS.find(x=>x.id===id);const rep={};let manque=null;document.querySelectorAll('.sheet .dch').forEach(el=>{rep[el.dataset.k]=el.type==='checkbox'?el.checked:el.value});(d.champs||[]).forEach(c=>{if(c.req&&!rep[c.k])manque=c.t});if(manque){toast('À remplir : '+manque);return}
    if(!$('#sigOk').checked){toast('Cochez « J\'ai lu ce document »');return}let sig=null;if(d.sig_parent_requise){sig=lireSig();if(!sig)return}b.disabled=true;
    const {error}=await sb.rpc('fam_doc_parent',{p_id:id,p_reponses:rep,p_signature:sig});if(error){toast(error.message);b.disabled=false;return}close();await chargerEchanges();toast('Document envoyé à votre doula');break}
  case 'imprimer':{const el=$('#docImp');if(!el)return;const w=document.createElement('div');w.id='impression';w.innerHTML=el.outerHTML;document.body.appendChild(w);document.body.classList.add('imp');window.print();setTimeout(()=>{w.remove();document.body.classList.remove('imp')},500);return}
  case 'qAjout':{const t=$('#qTxt').value.trim();if(!t)return;(S.parent.questions=S.parent.questions||[]).push({texte:t,pour:v,fait:false});break}
  case 'qSuppr':S.parent.questions.splice(+b.dataset.i,1);break;
  case 'qEnvoyer':{const q=S.parent.questions[+b.dataset.i];await sb.from('fam_messages').insert({famille_id:FAM.id,de_doula:false,texte:'❓ Ma question : '+q.texte});q.envoyee=true;await chargerEchanges();toast('Question envoyée');break}
  /* doula */
  case 'clientNew':S.dtab='clientes';S.openClient=null;render();clientForm();return;
  case 'clientEdit':clientForm(C());return;
  case 'saveClient':{const o=S.tmp;if(!o||!String(o.prenom||'').trim()){toast('Entrez le prénom');return}if(!/^\S+@\S+\.\S+$/.test(String(o.courriel||'').trim())){toast('Entrez un courriel valide');return}if(!o.dpa&&o.ddr)o.dpa=iso(addD(parseD(o.ddr),280));
    if(id){const c=S.clients.find(x=>x.id===id);Object.assign(c,o);c.nom=[c.prenom,c.nomFamille].filter(Boolean).join(' ');close();await saveClient(id);toast('Dossier enregistré');break}
    const inv=$('#k_inviter')&&$('#k_inviter').checked;
    const {data:f,error}=await sb.from('fam_familles').insert({doula_id:ME_DOULA.id,courriel:o.courriel.trim().toLowerCase(),prenom:o.prenom.trim(),nom:o.nomFamille||null,telephone:o.tel||null,partenaire:o.partenaire||null,dpa:o.dpa||null,lieu:o.lieu||null,professionnel:o.prof||null,forfait:o.forfait||null}).select('*').single();
    if(error){toast('Pas enregistré : '+error.message);return}
    const dos={};for(const k in o)if(!ALIAS.includes(k)&&!['ddr'].includes(k))dos[k]=o[k];dos.parcours={contact:iso(new Date())};dos.docs={};dos.rdv=[];dos.comms=[];dos.paie=[];
    await sb.from('fam_dossiers').insert({famille_id:f.id,data:dos});S.clients.unshift(buildClient(f,dos));S.openClient=f.id;S.ctab='resume';close();render();toast('Famille ajoutée');if(inv)await inviter(f.id);return}
  case 'inviter':await inviter(id);return;
  case 'statut':{const c=C();c.statut=v;await saveClient(c.id);await chargerDoula();toast(v==='active'?'Dossier réactivé':'Dossier archivé : conservé au moins un an');break}
  case 'clientOpen':S.openClient=id;S.dtab='clientes';S.ctab=v||'resume';scrollTo(0,0);render();await chargerClientDetail(id);break;
  case 'clientBack':S.openClient=null;break;
  case 'ctab':S.ctab=v;if(S.openClient&&['messages','docs','suivi','mots'].includes(v))await chargerClientDetail(S.openClient);break;
  case 'modSel':return;
  case 'envoyerMsgD':{const t=$('#msgTxt').value.trim();if(!t)return;b.disabled=true;const {error}=await sb.from('fam_messages').insert({famille_id:id,de_doula:true,texte:t});if(error){toast('Pas envoyé : '+error.message);b.disabled=false;return}await chargerClientDetail(id);toast('Message déposé dans l\'appli de la famille');break}
  case 'rdvNouveau':rdvSheet(id,null,false);return;
  case 'rdvCreer':{const t=lireRdv();if(!t)return;const {error}=await sb.from('fam_rdv').insert({famille_id:id,debut:t.toISOString(),type:$('#rvType').value,duree_min:+$('#rvDuree').value||90,lieu:$('#rvLieu').value||null,note:$('#rvNote').value||null,statut:'confirme',demande_par:'doula'});if(error){toast('Pas enregistré : '+error.message);return}close();await chargerDoula();toast('Rendez-vous inscrit : la famille est avisée');break}
  case 'rdvConfirmer':{const {error}=await sb.from('fam_rdv').update({statut:'confirme'}).eq('id',+id);if(error){toast(error.message);return}await chargerDoula();toast('Rendez-vous confirmé');break}
  case 'rdvModifier':rdvSheet(null,CRDV.find(r=>r.id===+id),false);return;
  case 'rdvChanger':{const t=lireRdv();if(!t)return;const {error}=await sb.from('fam_rdv').update({debut:t.toISOString(),statut:'confirme'}).eq('id',+id);if(error){toast(error.message);return}close();await chargerDoula();toast('Nouvelle heure envoyée à la famille');break}
  case 'rdvAnnulerD':if(b.dataset.c!=='1'){b.dataset.c='1';b.textContent='Confirmer l\'annulation';return}{const {error}=await sb.rpc('fam_rdv_annuler',{p_id:+id});if(error){toast(error.message);return}await chargerDoula();toast('Rendez-vous annulé : la famille est avisée');break}
  case 'docPreparer':{const c=C();const T=DOC_TYPES[v];const txt=v==='autre'?'':remplirModele(modeleTexte(v),c);
    sheet('Envoyer · '+(v==='autre'?'Autre document':T.titre),'<label class="f">Titre<input type="text" id="dTitre" value="'+esc(v==='autre'?'':T.titre)+'"></label><label class="f">Texte (déjà rempli avec les informations de la famille; modifiez au besoin)<textarea id="dTxt" style="min-height:300px;font-size:.84rem">'+esc(txt)+'</textarea></label>'+(T.champs.length?'<p class="xs muted">La famille remplira aussi : '+T.champs.filter(x=>!x.g).map(x=>x.t).join(' · ')+'</p>':'')+'<label class="check"><input type="checkbox" id="dSigD" '+(T.sigD?'checked':'')+'><span>Je signe aussi ce document après la famille</span></label><button class="btn" data-act="docEnvoyer" data-id="'+c.id+'" data-v="'+v+'">'+icon('fa-paper-plane')+'Déposer dans l\'appli de la famille</button>');return}
  case 'docEnvoyer':{const T=DOC_TYPES[v];const titre=$('#dTitre').value.trim()||T.titre;b.disabled=true;
    const {error}=await sb.from('fam_documents').insert({famille_id:id,type:v,titre,contenu:$('#dTxt').value,champs:T.champs,sig_parent_requise:true,sig_doula_requise:$('#dSigD').checked,statut:'a_remplir'});
    if(error){toast('Pas envoyé : '+error.message);b.disabled=false;return}close();await chargerClientDetail(id);await chargerDoula();toast('Document déposé : la famille est avisée');break}
  case 'docSignerD':{const sig=lireSig();if(!sig)return;b.disabled=true;const {error}=await sb.rpc('fam_doc_doula',{p_id:id,p_signature:sig});if(error){toast(error.message);b.disabled=false;return}close();await chargerClientDetail(S.openClient);await chargerDoula();toast('Document signé des deux côtés');break}
  case 'docAnnuler':{const {error}=await sb.from('fam_documents').update({statut:'annule'}).eq('id',id);if(error){toast(error.message);return}close();await chargerClientDetail(S.openClient);break}
  case 'motSave':{const j=$('#motJour').value,t=$('#motTxt').value.trim();if(!j||!t){toast('Choisissez la date et écrivez le mot');return}const {error}=await sb.from('fam_mots').upsert({famille_id:id,jour:j,texte:t},{onConflict:'famille_id,jour'});if(error){toast(error.message);return}await chargerClientDetail(id);toast('Mot enregistré');break}
  case 'motSuppr':{await sb.from('fam_mots').delete().eq('id',+b.dataset.r);await chargerClientDetail(id);break}
  case 'modK':S.modK=v;break;
  case 'modSave':case 'modReset':{const m=Object.assign({},ME_DOULA.modeles||{});m.docs=Object.assign({},m.docs||{});if(a==='modSave')m.docs[v]=$('#modTxt').value;else delete m.docs[v];const {error}=await sb.from('fam_doulas').update({modeles:m}).eq('id',ME_DOULA.id);if(error){toast(error.message);return}ME_DOULA.modeles=m;toast(a==='modSave'?'Modèle enregistré':'Modèle de Sabrina rétabli');break}
  case 'doulaAjout':{const em=$('#ndCourriel').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(em)){toast('Courriel invalide');return}const {data:d,error}=await sb.from('fam_doulas').insert({courriel:em,prenom:$('#ndPrenom').value.trim()||null,nom:$('#ndNom').value.trim()||null}).select('id').single();if(error){toast(error.message);return}const r=await sb.functions.invoke('fam-inviter',{body:{doula:d.id}});toast(r.data&&r.data.ok?'Doula ajoutée et invitée':'Doula ajoutée; l\'invitation n\'a pas pu partir');break}
  case 'doulaInviter':{const r=await sb.functions.invoke('fam-inviter',{body:{doula:id}});toast(r.data&&r.data.ok?'Invitation envoyée':'L\'invitation n\'a pas pu partir');break}
  case 'doulaActif':{const {error}=await sb.from('fam_doulas').update({actif:v==='1'}).eq('id',id);if(error){toast(error.message);return}break}
  case 'rdvNew':rdvForm(id);return;
  case 'rdvEdit':rdvForm(id,(C().rdv||[]).find(r=>r.id===b.dataset.r));return;
  case 'rdvSave':{const c=C(),o=S.tmp;if(!o.type){toast('Choisissez le type de rencontre');return}c.rdv=c.rdv||[];if(o.id){const k=c.rdv.findIndex(r=>r.id===o.id);c.rdv[k]=o}else{o.id=uid();c.rdv.push(o)}if(!(c.parcours||{}).prenatal&&/Prénatale/.test(o.type))(c.parcours=c.parcours||{}).prenatal=o.date;close();toast('Fiche enregistrée');break}
  case 'rdvDel':{const c=C();c.rdv=c.rdv.filter(r=>r.id!==b.dataset.r);break}
  case 'commNew':S.tmp={mode:'A'};sheet('Noter une communication','<label class="f">Date et heure<input type="datetime-local" id="m_t" value="'+nowLocal()+'"></label><span class="small"><b>Mode</b></span>'+ui.pick('tmp.mode',['A','T','M','C'])+'<p class="xs muted">A = appel · T = texto · M = Messenger · C = courriel</p>'+ui.text('tmp.duree','Durée')+ui.area('tmp.motif','Motif, ce qui a été dit, mes observations','',80)+ui.text('tmp.orient','Orientation / suivi')+'<button class="btn" data-act="commSave" data-id="'+id+'">Enregistrer</button>');return;
  case 'commSave':{const c=C();(c.comms=c.comms||[]).push(Object.assign({id:uid(),t:getT()},S.tmp));close();break}
  case 'commDel':{const c=C();c.comms=c.comms.filter(m=>m.id!==b.dataset.r);break}
  case 'appelNew':{const s=cStage(C());S.tmp={ans:{}};sheet('Appel pendant le travail','<p class="xs muted">'+esc(cName(C()))+(s.k==='preg'?' · '+s.w+' + '+s.d+' sem.':'')+'</p><label class="f">Date et heure<input type="datetime-local" id="m_t" value="'+nowLocal()+'"></label>'+APPEL_TRAVAIL.map((q,k)=>ui.text('tmp.ans.q'+k,q)).join('')+'<div class="banner bad">'+icon('fa-truck-medical')+'<div class="small"><b>Orienter vers l\'hôpital ou le 911 sans attendre :</b> '+APPEL_ROUGE+'</div></div><span class="small"><b>Décision</b></span><div class="stack" style="gap:6px">'+ui.pick('tmp.decision',DECISIONS)+'</div>'+ui.text('tmp.conseils','Conseils donnés · heures')+'<p class="xs muted">Aucune évaluation médicale : en cas de doute, j\'oriente vers l\'hôpital.</p><button class="btn" data-act="appelSave" data-id="'+id+'">Enregistrer</button>');return}
  case 'appelSave':{const c=C();(c.appels=c.appels||[]).push(Object.assign({id:uid(),t:getT()},S.tmp));(c.parcours=c.parcours||{}).travail=c.parcours.travail||iso(new Date());close();break}
  case 'appelDel':{const c=C();c.appels=c.appels.filter(x=>x.id!==b.dataset.r);break}
  case 'momentNow':{const c=C();(c.moments=c.moments||{})[b.dataset.k]=hm(Date.now());break}
  case 'hpdNew':S.tmp={};sheet('Heure par heure','<label class="f">Heure<input type="datetime-local" id="m_t" value="'+nowLocal()+'"></label>'+ui.area('tmp.quoi','Ce qui se passe (faits observés)','',60)+ui.text('tmp.confort','Confort offert')+ui.text('tmp.aide','Ce qui a aidé')+'<button class="btn" data-act="hpdSave" data-id="'+id+'">Ajouter</button>');return;
  case 'hpdSave':{const c=C();(c.hpd=c.hpd||[]).push(Object.assign({id:uid(),t:getT()},S.tmp));close();break}
  case 'hpdDel':{const c=C();c.hpd=c.hpd.filter(x=>x.id!==b.dataset.r);break}
  case 'visiteNew':{const c=C(),s=cStage(c);S.tmp={date:iso(new Date()),jours:s.k==='pp'?String(s.day):'',mere:{},bebe:{}};sheet('Visite postnatale','<div class="grid2">'+ui.text('tmp.date','Date','date')+ui.text('tmp.jours','Jours de vie','number')+'</div><p class="grp-t">Repérage · la mère</p>'+ui.checks('tmp.mere',REPERAGE_MERE)+'<p class="grp-t">Repérage · le bébé</p>'+ui.checks('tmp.bebe',REPERAGE_BEBE)+ui.text('tmp.orient','Orientée vers')+ui.area('tmp.alim','Allaitement / alimentation (observé et montré)','',60)+ui.area('tmp.recup','Récupération, moral, partenaire et fratrie','',60)+ui.area('tmp.obs','Mes observations','',60)+'<p class="xs muted">Observer et référer, jamais diagnostiquer · 911 / 988 si danger.</p><button class="btn" data-act="visiteSave" data-id="'+id+'">Enregistrer</button>');return}
  case 'visiteSave':{const c=C();(c.visites=c.visites||[]).push(Object.assign({id:uid()},S.tmp));(c.parcours=c.parcours||{}).postnatal=c.parcours.postnatal||S.tmp.date;close();break}
  case 'visiteDel':{const c=C();c.visites=c.visites.filter(x=>x.id!==b.dataset.r);break}
  case 'paieNew':{S.tmp={date:iso(new Date()),mode:'Virement Interac',no:String((S.clients.reduce((n,x)=>n+(x.paie||[]).length,0)+1)).padStart(3,'0')};sheet('Nouveau versement','<div class="grid2">'+ui.text('tmp.date','Date','date')+ui.text('tmp.montant','Montant ($)','number')+ui.text('tmp.no','No de reçu')+'</div><span class="small"><b>Mode</b></span>'+ui.pick('tmp.mode',['Stripe','Virement Interac','Autre'])+'<button class="btn" data-act="paieSave" data-id="'+id+'">Enregistrer</button>');return}
  case 'paieSave':{const c=C();if(!(+S.tmp.montant)){toast('Entrez le montant');return}(c.paie=c.paie||[]).push(Object.assign({id:uid()},S.tmp));(c.docs=c.docs||{})['Reçus de paiement']=true;close();toast('Versement enregistré');break}
  case 'paieDel':{const c=C();c.paie=c.paie.filter(x=>x.id!==b.dataset.r);break}
  case 'recu':{const c=C(),p=c.paie.find(x=>x.id===b.dataset.r),D=S.doula;const k=c.paie.indexOf(p)+1;const solde=cPrice(c)-c.paie.slice(0,k).reduce((s,x)=>s+(+x.montant||0),0);
   const t='REÇU no '+(p.no||'')+'\nAcadémie Sérénaissance · '+D.nom+' · '+D.region+'\n'+D.tel+' · '+D.courriel+'\n\nDate : '+fmtD(parseD(p.date))+'\nReçu de : '+cName(c)+(c.partenaire?' et '+c.partenaire:'')+'\nDescription : forfait '+(c.forfait||'')+', versement '+k+' de '+c.paie.length+'\nMontant : '+money(p.montant)+'\nPaiement : '+(p.mode||'')+'\nSolde restant : '+money(Math.max(0,solde))+'\nNo de TVH : '+(D.tvh||'non inscrite');
   sheet('Reçu','<pre class="msg" id="recuT">'+esc(t)+'</pre><div class="row"><button class="btn" data-act="recuEnvoyer" data-id="'+c.id+'">'+icon('fa-paper-plane')+'Déposer dans l\'appli de la famille</button><button class="btn ghost" data-act="copyEl" data-v="recuT">'+icon('fa-copy')+'Copier</button></div>');return}
  case 'recuEnvoyer':{const t=$('#recuT').textContent;await sb.from('fam_messages').insert({famille_id:id,de_doula:true,type:'document',texte:t});close();await chargerClientDetail(id);toast('Reçu déposé dans l\'appli');return}
  case 'copyTransm':{const c=C(),T=c.transm||{};copy('TRANSMISSION À LA REMPLAÇANTE · CONFIDENTIEL\n'+TRANSMISSION.map(x=>x[1]+' : '+(T[x[0]]||'')).join('\n')+'\nAutorisation photos : '+(T.photos||'—')+'\nLes parents te connaissent : '+(T.connait||''));return}
  case 'lettre':S.msgClient=id;S.dtab='outils';S.dsub='lettre';S.openClient=null;scrollTo(0,0);break;
  case 'sacReset':S.doula.sac={};break;
  default:return}
  }catch(err){console.error(err);toast('Une erreur est survenue. Réessayez.')}
  save();render()});
document.addEventListener('change',async e=>{const t=e.target,a=t.dataset.act;if(!a)return;
  if(a==='chk'){const o=getP(t.dataset.p)||{};o[t.dataset.k]=t.checked;setP(t.dataset.p,o);if(!t.closest('.sheet')){save();render()}return}
  if(a==='chkQ'){S.parent.questions[+t.dataset.i].fait=t.checked;save();return}
  if(a==='txt'){setP(t.dataset.p,t.value);if(!t.closest('.sheet')){save();if(t.dataset.rr||t.type==='date'||t.tagName==='SELECT')render()}return}
  if(a==='msgSel'){S.msgClient=t.value;render();return}
  if(a==='modSel'){const c=S.clients.find(x=>x.id===S.openClient);const v=t.value;let txt='';if(v==='fin'){txt='Chère '+cFirst(c)+',\n\nNotre accompagnement se termine aujourd\'hui, et je tenais à vous dire merci. Merci de m\'avoir ouvert la porte de votre histoire et de votre maison.\n\nJ\'ai été témoin de votre courage, de votre douceur et de tout l\'amour qui entoure '+(c.bebe||'votre bébé')+'. Ces souvenirs resteront précieux pour moi.\n\nRappelez-vous que vous n\'avez pas à tout savoir : demander de l\'aide est un geste de force.\n\nMa porte reste ouverte. Si vous avez besoin de parler, d\'une marraine d\'allaitement ou d\'une référence, écrivez-moi.\n\n'+S.doula.nom}else if(v!=='')txt=fillMsg(MESSAGES[+v][1],c);$('#msgTxt').value=txt;return}
  if(a==='phAdd'){const files=[...t.files];if(!files.length)return;toast('Ajout de '+files.length+' photo(s)…');for(const f of files){try{await putPhoto({id:uid(),t:Date.now(),src:await shrink(f),cap:''})}catch(x){toast('Une image n\'a pas pu être lue')}}fillPhotos();return}
});
document.addEventListener('input',e=>{const t=e.target,a=t.dataset.act;
  if(a==='txt'&&t.type!=='date'&&t.tagName!=='SELECT'){setP(t.dataset.p,t.value);if(!t.closest('.sheet'))save();return}
  if(a==='cq'){S.cq=t.value;render();const q=$('#cq');if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}return}
  if(a==='wkSel'){S.wkSel=+t.value;render();const r=$('#wkRange');if(r)r.focus()}
  if(a==='ppSel'){S.ppSel=+t.value;render();const r=$('#ppRange');if(r)r.focus()}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')rafraichir()});
setInterval(()=>{const el=$('#tick');if(el)el.textContent=mmss((Date.now()-(+el.dataset.start))/1000)},1000);
setInterval(()=>{if(document.visibilityState==='visible'&&((S.role==='parent'&&S.tab==='madoula')||(S.role==='doula'&&S.ctab==='messages'&&S.openClient)))rafraichir()},30000);
openDB();demarrer();
