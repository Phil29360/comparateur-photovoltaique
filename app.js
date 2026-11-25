"use strict";

/* ================= DONNÉES PAR DÉFAUT ================= */

const DEFAULT_PROFILE = {
  anConstruction: "2022",
  surface: "140",
  orientation: "Plein sud",
  pente: "40",
  chauffage: "Pompe à chaleur (chauffage + eau chaude)",
  occupants: "2",
  ve: "non",
  piscine: "non",
  consoAnnuelle: "5000",
  departement: "",
  objectifs: "Autoconsommation, système évolutif (batterie plus tard), pas de sous-traitance"
};

const DEFAULT_PARAMS = {
  productivite: 1300,
  prixElec: 0.2516,
  rachatSurplus: 0.04,
  primeUnit: 80,
  tacSansBatterie: 30,
  tacAvecBatterie: 60,
  batterieCible: 5,
  poids: { prix: 30, materiel: 25, garanties: 20, evolutivite: 15, installation: 10 }
};

const PREMIUM_PANELS = ["sunpower","maxeon","winaico","q cells","qcells","meyer burger","rec alpha","ies synergy"];
const TIER1_PANELS = ["jinko","ja solar","longi","canadian solar","trina","axitec","phono","seraphim","risen","solarwatt","dualsun","viking"];
const PREMIUM_INV = ["solaredge","fronius","sma"];
const GOOD_INV = ["enphase","huawei","goodwe","hoymiles","apsystems"];
const MID_INV = ["growatt","solis","saj","deye","solax","sungrow"];

/* Champs d'une proposition ; `q` = question à envoyer à l'installateur si le champ est vide. */
const PROPOSAL_FIELDS = [
  { sec: "Général", fields: [
    { k: "dateDevis", l: "Date du devis" },
    { k: "prixTTC", l: "Prix total TTC (€)", t: "number", q: "pouvez-vous confirmer le prix total TTC, détaillé pièce par pièce (matériel / pose / démarches / mise en service) ?" },
    { k: "mode", l: "Modalité", t: "select", o: ["", "Achat", "Location / leasing", "Crédit", "À préciser"], q: "s'agit-il d'un achat ferme, d'une location ou d'un financement ? Merci de détailler l'échéancier et les conditions (propriété du matériel, fin de contrat, rétractation)." },
    { k: "delai", l: "Délai d'intervention (semaines)", t: "number", q: "quel est le délai d'intervention ferme, et prévoyez-vous des pénalités en cas de retard ?" }
  ]},
  { sec: "Panneaux", fields: [
    { k: "panneauMarque", l: "Marque des panneaux", q: "quelle est la marque et la référence exacte des panneaux (fiche technique jointe au devis) ?" },
    { k: "panneauModele", l: "Modèle / référence" },
    { k: "panneauWc", l: "Puissance unitaire (Wc)", t: "number" },
    { k: "nbPanneaux", l: "Nombre de panneaux", t: "number", q: "combien de panneaux, de quelle puissance unitaire (Wc), pour quelle puissance totale (kWc) ?" },
    { k: "tier1", l: "Classement Tier 1 BNEF", t: "select", o: ["", "Oui", "Non", "Documenté (preuve datée fournie)"], q: "les panneaux sont-ils classés Tier 1 BloombergNEF ? Merci de fournir une source datée, ainsi que les certifications IEC 61215 et 61730." },
    { k: "garProduit", l: "Garantie produit panneaux (années)", t: "number", q: "quelle est la durée de la garantie produit des panneaux ? Une extension est-elle possible et à quel prix ?" },
    { k: "garPerfPct", l: "Garantie performance : % restant", t: "number", q: "quelle est la garantie de performance (x % de puissance restante à x ans), linéaire ou non, transférable en cas de revente de la maison ?" },
    { k: "garPerfAns", l: "… à échéance (années)", t: "number" }
  ]},
  { sec: "Onduleur & pilotage", fields: [
    { k: "ondType", l: "Type", t: "select", o: ["", "Onduleur central (string)", "Micro-onduleurs", "Onduleur hybride (prêt pour batterie)"], q: "l'onduleur est-il central (string), en micro-onduleurs, ou hybride ? Marque, modèle, nombre de MPPT, puissance AC ?" },
    { k: "ondMarque", l: "Marque de l'onduleur", q: "quelles sont la marque et la référence exactes de l'onduleur (ou des micro-onduleurs) ?" },
    { k: "ondModele", l: "Modèle / référence" },
    { k: "ondPac", l: "Puissance AC onduleur (kW)", t: "number" },
    { k: "garOnduleur", l: "Garantie onduleur (années)", t: "number", q: "quelle est la durée de garantie de l'onduleur : pièce seule, ou pièce + main-d'œuvre + déplacement ? Une extension est-elle proposée ?" },
    { k: "garMainOeuvre", l: "Garantie main-d'œuvre (années)", t: "number", q: "quelle est la durée de la garantie de pose / main-d'œuvre, et qui intervient en cas de problème, sous quel délai ?" },
    { k: "monitoring", l: "Monitoring", t: "select", o: ["", "Application incluse, gratuite", "Payant / abonnement", "Non prévu"], q: "le suivi de production (monitoring) : quelle application, quelles données, gratuit à vie ou par abonnement ?" }
  ]},
  { sec: "Installation & mise en œuvre", fields: [
    { k: "poseInterne", l: "Réalisation de la pose", t: "select", o: ["", "Salariés de l'entreprise", "Sous-traitance", "À préciser"], q: "la pose sera-t-elle réalisée par vos salariés ou par un sous-traitant ? Si sous-traitance : quelle entreprise, et qui porte les garanties ?" },
    { k: "rge", l: "Qualification RGE (QualiPV)", t: "select", o: ["", "Oui + numéro fourni", "Oui", "Non"], q: "pouvez-vous communiquer le numéro de qualification RGE (QualiPV) et les attestations d'assurance décennale et RC pro en cours de validité ?" },
    { k: "assurance", l: "Assurances", t: "select", o: ["", "Attestations jointes au devis", "Sur demande", "Non communiquées"], q: "les attestations d'assurance (décennale et RC pro) seront-elles annexées au devis ?" },
    { k: "poseType", l: "Type de pose", t: "select", o: ["", "Surimposé", "Intégration au bâti", "À préciser"], q: "la pose est-elle surimposée ou intégrée au bâti ? Quel impact sur la garantie d'étanchéité du toit et sur la ventilation des panneaux ?" },
    { k: "fixationMarque", l: "Marque des fixations / rails", q: "quelle est la marque du système de fixation (garantie mécanique, matériaux certifiés) ?" },
    { k: "TPE", l: "Étanchéité passage de câbles (TPE)", t: "select", o: ["", "TPE certifié", "Autre système", "Non précisé"], q: "quel système d'étanchéité pour le passage des câbles en toiture (TPE) ? Quelle garantie sur l'étanchéité du toit, qui intervient en cas de fuite et sous quel délai ?" },
    { k: "references", l: "Références locales visitables", t: "select", o: ["", "Oui (adresses fournies)", "Non"], q: "avez-vous des références d'installations comparables, récentes et proches de chez moi, à visiter ou contacter ?" }
  ]},
  { sec: "Administratif & contrats", fields: [
    { k: "demarches", l: "Démarches administratives", t: "select", o: ["", "Tout inclus (CONSUEL, EDF OA, Enedis, mairie)", "Partiellement inclus", "Non inclus"], q: "qui prend en charge : l'attestation CONSUEL, le contrat EDF OA (rachat du surplus + prime), le raccordement Enedis et la déclaration préalable en mairie ?" },
    { k: "primeChiffree", l: "Prime autoconsommation", t: "select", o: ["", "Chiffrée dans le devis", "Non mentionnée"], q: "la prime à l'autoconsommation est-elle chiffrée dans le devis ? Quel montant, versée par qui, sous quel délai ? Le prix affiché est-il net de prime ?" },
    { k: "tvaTaux", l: "TVA appliquée", t: "select", o: ["", "10 %", "20 %"], q: "quel taux de TVA s'applique, et est-il cohérent avec la puissance installée et l'ancienneté du logement ?" }
  ]},
  { sec: "Batterie & évolutivité", fields: [
    { k: "ondHybride", l: "Compatibilité batterie future", t: "select", o: ["", "Onduleur hybride (prêt)", "Batterie AC ajoutable plus tard", "Non prévu", "À préciser"], q: "l'onduleur est-il hybride (prêt pour une batterie) ou permet-il d'ajouter une batterie AC plus tard ? Quel impact sur les garanties et le monitoring si j'ajoute une batterie dans 2-3 ans ?" },
    { k: "batteriePrevue", l: "Batterie dans la proposition", t: "select", o: ["", "Incluse", "Option chiffrée", "Non prévue"], q: "pouvez-vous chiffrer dès maintenant l'option batterie (capacité, marque, prix ferme valable 24 mois), même si je ne l'installe pas tout de suite ?" },
    { k: "batteriePrix", l: "Prix option batterie (€)", t: "number" },
    { k: "batterieKwh", l: "Capacité batterie (kWh)", t: "number" },
    { k: "slotsRoof", l: "Panneaux ajoutables plus tard (nombre)", t: "number", q: "peut-on ajouter des panneaux plus tard avec le même onduleur ? Quelle puissance reste disponible (onduleur et toiture) ?" },
    { k: "emplacementBat", l: "Emplacement batterie", t: "select", o: ["", "Réservé + câbles prévus", "Non prévu"], q: "un emplacement et un passage de câbles pour la future batterie sont-ils prévus dès l'installation initiale ?" }
  ]},
  { sec: "Commercial", fields: [
    { k: "acompte", l: "Acompte demandé (€)", t: "number", q: "quel est l'échéancier de paiement (acompte, solde à la livraison) ? Merci de le rendre conforme à la réglementation sur les avances trop élevées." },
    { k: "optionsCachees", l: "Frais non écrits possibles", t: "select", o: ["", "Aucune (confirmé par écrit)", "À creuser"], q: "existe-t-il des frais ou options non écrits au devis (renfort de charpente, ligne supplémentaire, déplacements, remplacement de matériel) ?" }
  ]}
];

const QUESTIONS = [
  ["Matériel", "Marque et référence exacte des panneaux, fiche technique jointe au devis ?"],
  ["Matériel", "Panneaux classés Tier 1 BNEF (source datée), certifiés IEC 61215 / 61730 ?"],
  ["Matériel", "Onduleur : marque, modèle, string ou micro-onduleurs, nombre de MPPT, puissance AC ?"],
  ["Matériel", "Monitoring : quelle application, quelles données, gratuit à vie ?"],
  ["Matériel", "Marque des fixations, matériaux certifiés, garantie mécanique ?"],
  ["Matériel", "Zones d'ombre (cheminée, arbres, rampants) : comment sont-elles traitées ?"],
  ["Garanties", "Garantie produit des panneaux : durée, extension possible et à quel prix ?"],
  ["Garanties", "Garantie de performance : x % à x ans, linéaire, transférable en cas de vente ?"],
  ["Garanties", "Garantie onduleur : pièce seule ou pièce + main-d'œuvre + déplacement ? Extension 20-25 ans ?"],
  ["Garanties", "Garantie pose / étanchéité toiture : durée, qui intervient en cas de fuite, sous quel délai ?"],
  ["Garanties", "En cas de défaillance du fabricant, qui reprend la garantie ? Assurance dédiée ?"],
  ["Installation", "Pose réalisée par vos salariés ou en sous-traitance ? Si sous-traitance : par qui ?"],
  ["Installation", "Numéro RGE (QualiPV) + attestations décennale et RC pro en cours de validité ?"],
  ["Installation", "Références d'installations comparables, récentes, visitables près de chez moi ?"],
  ["Installation", "Visite technique avant devis : ombres, état de la couverture, emplacement de l'onduleur ?"],
  ["Installation", "Délai ferme d'intervention, durée du chantier, pénalités en cas de retard ?"],
  ["Administratif", "Qui gère CONSUEL, contrat EDF OA (rachat + prime), raccordement Enedis, mairie ?"],
  ["Administratif", "Prime à l'autoconsommation : montant, versée par qui, sous quel délai ? Prix net de prime ?"],
  ["Administratif", "TVA : 10 % ou 20 % ? Cohérente avec la puissance et l'âge du logement ?"],
  ["Administratif", "Échéancier de paiement : acompte, solde à la livraison, conformité réglementaire ?"],
  ["Administratif", "Achat ferme, location ou financement ? Tous les documents fournis avant signature ?"],
  ["Batterie", "Onduleur hybride ou compatible batterie ? Coût de transformation si je change d'avis ?"],
  ["Batterie", "Batterie AC ajoutable dans 2-3 ans : laquelle, à quel prix, impact sur les garanties ?"],
  ["Batterie", "Ajout de panneaux plus tard : possible ? Puissance restante sur l'onduleur et le toit ?"],
  ["Batterie", "Emplacement batterie + passage de câbles prévus dès l'installation initiale ?"],
  ["Commercial", "Tout est inclus dans le prix TTC : matériel, pose, démarches, monitoring, mise en service ?"],
  ["Commercial", "Options ou frais non écrits au devis (renfort charpente, ligne en plus, déplacements) ?"],
  ["Commercial", "Rétractation de 14 jours : à partir de quand ? CGV fournies avant signature ?"],
  ["Commercial", "Qui porte les garanties : l'entreprise ou le fabricant ? Que se passe-t-il en cas de faillite ?"]
];

/* ================= ÉTAT ================= */

/* Seed pré-rempli à partir des devis réellement reçus (Nov. 2025, OCR) */
const SEED = {
 "profile": {
  "anConstruction": "2022",
  "surface": "140",
  "orientation": "Plein sud",
  "pente": "40",
  "chauffage": "Pompe à chaleur (chauffage + eau chaude)",
  "occupants": "2",
  "ve": "non",
  "piscine": "non",
  "consoAnnuelle": "5000",
  "departement": "29 (Finistère)",
  "objectifs": "Autoconsommation, système évolutif (batterie plus tard), pas de sous-traitance"
 },
 "params": null,
 "proposals": [
  {
   "id": "adekwatt",
   "name": "Adekwatt",
   "vals": {
    "dateDevis": "19/10/2025",
    "prixTTC": "10000",
    "mode": "Achat",
    "panneauMarque": "TCL Solar (à confirmer)",
    "panneauModele": "500 Wc n-type bifacial verre-verre cadre noir",
    "panneauWc": "500",
    "nbPanneaux": "4",
    "garPerfPct": "87.4",
    "garPerfAns": "30",
    "ondType": "Onduleur hybride (prêt pour batterie)",
    "ondMarque": "Deye (à confirmer)",
    "ondModele": "Hybride 6 kW mono, 2 MPPT, IP65, secours intégré",
    "ondPac": "6",
    "garOnduleur": "10",
    "monitoring": "Application incluse, gratuite",
    "poseInterne": "Salariés de l'entreprise",
    "rge": "Oui + numéro fourni",
    "assurance": "Sur demande",
    "poseType": "Surimposé",
    "fixationMarque": "K2 Systems",
    "demarches": "Tout inclus (CONSUEL, EDF OA, Enedis, mairie)",
    "tvaTaux": "20 %",
    "ondHybride": "Onduleur hybride (prêt)",
    "batteriePrevue": "Incluse",
    "batteriePrix": "1188",
    "batterieKwh": "2",
    "acompte": "3000",
    "optionsCachees": "À creuser"
   },
   "checks": {}
  },
  {
   "id": "artyseo",
   "name": "Artyseo",
   "vals": {
    "dateDevis": "21/10/2025",
    "prixTTC": "6289.06",
    "mode": "Achat",
    "panneauMarque": "DMEGC Solar",
    "panneauModele": "DM500M10RT-B60HBT",
    "panneauWc": "500",
    "nbPanneaux": "6",
    "garProduit": "25",
    "garPerfAns": "30",
    "ondType": "Micro-onduleurs",
    "ondMarque": "ATMOC",
    "ondModele": "MI-1000-2M (2 MPPT)",
    "garOnduleur": "25",
    "poseInterne": "À préciser",
    "rge": "Oui",
    "assurance": "Sur demande",
    "poseType": "Surimposé",
    "fixationMarque": "K2 Systems (SolidRail/MiniRail)",
    "demarches": "Tout inclus (CONSUEL, EDF OA, Enedis, mairie)",
    "tvaTaux": "20 %",
    "batteriePrevue": "Non prévue",
    "acompte": "1886.72",
    "optionsCachees": "À creuser"
   },
   "checks": {}
  },
  {
   "id": "sunology",
   "name": "Sunology",
   "vals": {
    "prixTTC": "7955",
    "mode": "Achat",
    "panneauMarque": "DMEGC Solar",
    "panneauModele": "DM400M10-54HBB/V",
    "panneauWc": "400",
    "nbPanneaux": "7",
    "garProduit": "20",
    "garPerfAns": "25",
    "ondType": "Micro-onduleurs",
    "ondMarque": "Hoymiles",
    "ondModele": "HM400",
    "garOnduleur": "25",
    "poseType": "Surimposé",
    "fixationMarque": "Renusol FS PRO",
    "batteriePrevue": "Incluse",
    "batterieKwh": "4.4"
   },
   "checks": {}
  },
  {
   "id": "hellio",
   "name": "Hellio",
   "vals": {
    "dateDevis": "19/11/2025",
    "prixTTC": "5512",
    "mode": "Achat",
    "panneauMarque": "Jinko Solar",
    "panneauModele": "Tiger Neo 54HL4M-BDV",
    "panneauWc": "500",
    "nbPanneaux": "6",
    "ondType": "Micro-onduleurs",
    "ondMarque": "ATMOC",
    "ondModele": "MI-1000-2M",
    "batteriePrevue": "Non prévue"
   },
   "checks": {}
  },
  {
   "id": "edf (en ",
   "name": "EDF (en attente)",
   "vals": {},
   "checks": {}
  }
 ]
};


const STORE_KEY = "pv-comparateur-v1";
let state = load();
let selectedId = state.proposals.length ? state.proposals[0].id : null;

function uid(){ return Math.random().toString(36).slice(2, 9); }

function defaultProposal(name){
  const vals = {};
  PROPOSAL_FIELDS.forEach(s => s.fields.forEach(f => { vals[f.k] = ""; }));
  return { id: uid(), name: name || "Nouvelle proposition", values: vals, checks: {} };
}

function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {
    profile: Object.assign({}, DEFAULT_PROFILE, SEED.profile),
    params: JSON.parse(JSON.stringify(DEFAULT_PARAMS)),
    proposals: SEED.proposals.map(sp => {
      const p = defaultProposal(sp.name);
      p.id = sp.id;
      p.values = Object.assign(p.values, sp.vals);
      p.checks = sp.checks || {};
      return p;
    })
  };
}
function save(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch(e){} }

/* ================= CALCULS ================= */

function num(v){ const n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isNaN(n) ? null : n; }
function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
function fmtInt(n){ return (n === null || isNaN(n)) ? "?" : Math.round(n).toLocaleString("fr-FR"); }

function deriveProp(p){
  const v = p.values;
  let kwc = num(v.kwc);
  const w = num(v.panneauWc), nb = num(v.nbPanneaux);
  const kwcCalc = (w !== null && nb !== null) ? w * nb / 1000 : null;
  if(kwc === null) kwc = kwcCalc;
  const prix = num(v.prixTTC);
  const euWc = (prix !== null && kwc) ? prix / (kwc * 1000) : null;
  const prod = kwc ? kwc * state.params.productivite : null;
  const prime = kwc ? Math.min(kwc, 9) * state.params.primeUnit : null;
  const avecBat = v.batteriePrevue === "Incluse";
  const tac = (avecBat ? state.params.tacAvecBatterie : state.params.tacSansBatterie) / 100;
  let gains = null;
  if(prod !== null) gains = prod * tac * state.params.prixElec + prod * (1 - tac) * state.params.rachatSurplus;
  const net = (prix !== null && prime !== null) ? prix - prime : prix;
  const retour = (net !== null && gains !== null && gains > 0) ? net / gains : null;
  return { kwc, kwcCalc, prix, euWc, prod, prime, gains, retour, avecBat };
}

function scorePrix(d){
  if(d.euWc === null) return null;
  return clamp(Math.round(100 * (3.3 - d.euWc) / (3.3 - 1.9)), 0, 100);
}

function scoreMateriel(p){
  const v = p.values;
  const brand = (v.panneauMarque || "").toLowerCase();
  let sPan = 55;
  if(v.tier1 === "Documenté (preuve datée fournie)") sPan = 92;
  else if(PREMIUM_PANELS.some(b => brand.indexOf(b) !== -1)) sPan = 88;
  else if(v.tier1 === "Oui") sPan = 78;
  else if(TIER1_PANELS.some(b => brand.indexOf(b) !== -1)) sPan = 74;
  else if(v.tier1 === "Non") sPan = 35;
  const ib = ((v.ondMarque || "") + " " + (v.ondModele || "")).toLowerCase();
  let sInv = 40;
  if(ib.indexOf("enphase") !== -1) sInv = 96;
  else if(PREMIUM_INV.some(b => ib.indexOf(b) !== -1 && ib.indexOf("onduleur sma") === -1)) sInv = 86;
  else if(GOOD_INV.some(b => ib.indexOf(b) !== -1)) sInv = 74;
  else if((v.ondType || "").indexOf("Micro") === 0) sInv = Math.max(sInv, 72);
  else if(MID_INV.some(b => ib.indexOf(b) !== -1)) sInv = 55;
  const monBonus = v.monitoring === "Application incluse, gratuite" ? 8 : 0;
  return clamp(Math.round(0.45 * sPan + 0.47 * sInv + monBonus), 0, 100);
}

function scoreGaranties(p){
  const v = p.values;
  const g = num(v.garProduit), gp = num(v.garPerfPct), go = num(v.garOnduleur);
  const sProduit = g !== null ? clamp(Math.round(g / 25 * 100), 0, 100) : null;
  const sPerf = gp !== null ? clamp(Math.round((gp - 78) / 10.5 * 100), 0, 100) : null;
  const sOnd = go !== null ? clamp(Math.round(go / 20 * 100), 0, 100) : null;
  const parts = [sProduit, sPerf, sOnd].filter(x => x !== null);
  if(!parts.length) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

function scoreEvolutivite(p){
  const v = p.values;
  let sHybr = 30;
  if(v.ondHybride === "Onduleur hybride (prêt)") sHybr = 100;
  else if(v.ondHybride === "Batterie AC ajoutable plus tard") sHybr = 80;
  else if(v.ondHybride === "À préciser") sHybr = 50;
  const sOpt = v.batteriePrevue === "Option chiffrée" ? 100 : (v.batteriePrevue === "Incluse" ? 85 : (v.batteriePrevue === "Non prévue" ? 20 : null));
  const slots = num(v.slotsRoof);
  const sSlots = slots !== null ? clamp(Math.round(slots / 4 * 100), 0, 100) : null;
  const sEmp = v.emplacementBat === "Réservé + câbles prévus" ? 100 : (v.emplacementBat === "Non prévu" ? 0 : null);
  const parts = [[sHybr, 45], [sOpt, 20], [sSlots, 20], [sEmp, 15]].filter(x => x[0] !== null);
  if(!parts.length) return null;
  const tw = parts.reduce((a, x) => a + x[1], 0);
  return Math.round(parts.reduce((a, x) => a + x[0] * x[1], 0) / tw);
}

function scoreInstallation(p){
  const v = p.values;
  const sPose = v.poseInterne === "Salariés de l'entreprise" ? 100 : (v.poseInterne === "Sous-traitance" ? 20 : null);
  const sRge = v.rge === "Oui + numéro fourni" ? 100 : (v.rge === "Oui" ? 80 : (v.rge === "Non" ? 0 : null));
  const sAss = v.assurance === "Attestations jointes au devis" ? 100 : (v.assurance === "Sur demande" ? 70 : (v.assurance === "Non communiquées" ? 0 : null));
  const sRef = v.references === "Oui (adresses fournies)" ? 100 : (v.references === "Non" ? 30 : null);
  const parts = [[sPose, 40], [sRge, 25], [sAss, 15], [sRef, 20]].filter(x => x[0] !== null);
  if(!parts.length) return null;
  const tw = parts.reduce((a, x) => a + x[1], 0);
  return Math.round(parts.reduce((a, x) => a + x[0] * x[1], 0) / tw);
}

function criticalMissing(p){
  const v = p.values, need = [];
  if(num(v.prixTTC) === null) need.push("prix TTC");
  if(!deriveProp(p).kwc) need.push("puissance (kWc ou nb panneaux × Wc)");
  if(!v.panneauMarque) need.push("marque des panneaux");
  if(!v.ondMarque) need.push("marque de l'onduleur");
  if(!v.poseInterne) need.push("pose interne ou sous-traitance");
  if(!v.ondHybride) need.push("compatibilité batterie future");
  if(num(v.garProduit) === null) need.push("garantie produit panneaux");
  if(!v.demarches) need.push("démarches administratives");
  return need;
}

function redFlags(p, d){
  const v = p.values, out = [];
  if(d.euWc !== null && d.euWc < 1.4) out.push("Prix très bas (" + d.euWc.toFixed(2) + " €/Wc) : vérifier le contenu exact (marques, garanties, pose)");
  if(d.euWc !== null && d.euWc > 3.2) out.push("Prix élevé (" + d.euWc.toFixed(2) + " €/Wc) : demander une justification ou une remise");
  if(v.poseInterne === "Sous-traitance") out.push("Sous-traitance annoncée : à encadrer ou refuser (critère important pour vous)");
  if(v.mode === "Location / leasing") out.push("Modalité location : comparer en équivalent achat avant toute décision");
  const gp = num(v.garProduit);
  if(gp !== null && gp < 12) out.push("Garantie produit panneaux faible (" + gp + " ans) : le marché courant est à 15-25 ans");
  const go = num(v.garOnduleur);
  if(go !== null && go < 10) out.push("Garantie onduleur inférieure à 10 ans");
  if(v.monitoring === "Non prévu") out.push("Pas de monitoring prévu");
  if(v.TPE === "Non précisé") out.push("Étanchéité du passage de câbles en toiture (TPE) non précisée");
  const bp = num(v.batteriePrix), bk = num(v.batterieKwh);
  if(bp !== null && bk && bp / bk > 1000) out.push("Option batterie chère (" + Math.round(bp / bk) + " €/kWh) : ordre de grandeur attendu 500-800 €/kWh posée");
  const ondAc = num(v.ondPac);
  if(ondAc && d.kwc && d.kwc / ondAc > 1.6) out.push("Onduleur probablement sous-dimensionné (rapport DC/AC > 1,6)");
  return out;
}

function computeScores(p){
  const d = deriveProp(p);
  const w = state.params.poids;
  const parts = [
    ["prix", scorePrix(d), Number(w.prix) || 0],
    ["materiel", scoreMateriel(p), Number(w.materiel) || 0],
    ["garanties", scoreGaranties(p), Number(w.garanties) || 0],
    ["evolutivite", scoreEvolutivite(p), Number(w.evolutivite) || 0],
    ["installation", scoreInstallation(p), Number(w.installation) || 0]
  ];
  const sc = {};
  parts.forEach(x => { sc[x[0]] = x[1]; });
  const active = parts.filter(x => x[1] !== null && x[2] > 0);
  const total = active.length ? Math.round(active.reduce((a, x) => a + x[1] * x[2], 0) / active.reduce((a, x) => a + x[2], 0)) : null;
  return { d, scores: sc, total, missing: criticalMissing(p), flags: redFlags(p, d) };
}

function missingQuestionsText(p){
  const v = p.values, lines = [];
  PROPOSAL_FIELDS.forEach(s => s.fields.forEach(f => { if(f.q && !v[f.k]) lines.push("• " + f.q); }));
  return lines;
}

/* ================= UI ================= */

const content = document.getElementById("content");
let currentTab = "profil";

document.getElementById("tabs").addEventListener("click", e => {
  const b = e.target.closest("button");
  if(!b) return;
  currentTab = b.dataset.tab;
  document.querySelectorAll("#tabs button").forEach(x => x.classList.toggle("active", x === b));
  render();
});

function bar(score){
  if(score === null) return '<span class="miss">données manquantes</span>';
  const col = score >= 75 ? "var(--green)" : (score >= 50 ? "var(--amber)" : "var(--red)");
  return '<div class="barcell"><div class="bar"><i style="width:' + score + '%;background:' + col + '"></i></div><span class="score-now">' + score + '</span></div>';
}
function esc(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

function fieldHtml(scope, k, label, type, options, value){
  const id = scope + "-" + k;
  const ds = ' data-scope="' + scope + '" data-key="' + esc(k) + '"';
  if(type === "select"){
    return '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '"' + ds + '>'
      + (options || []).map(o => '<option value="' + esc(o) + '"' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>').join("") + '</select></div>';
  }
  if(type === "textarea"){
    return '<div class="field"><label for="' + id + '">' + label + '</label><textarea rows="2" id="' + id + '"' + ds + '>' + esc(value) + '</textarea></div>';
  }
  return '<div class="field"><label for="' + id + '">' + label + '</label><input type="' + (type || "text") + '" step="any" id="' + id + '" value="' + esc(value) + '"' + ds + '></div>';
}

/* ---- Onglet Profil ---- */
function renderProfil(){
  const prof = state.profile;
  const f = [
    ["anConstruction", "Année de construction", "text"],
    ["surface", "Surface habitable (m²)", "number"],
    ["orientation", "Orientation du toit", "text"],
    ["pente", "Pente du toit (°)", "number"],
    ["chauffage", "Chauffage / ECS", "text"],
    ["occupants", "Nombre d’occupants", "number"],
    ["ve", "Véhicule électrique", "select", ["oui", "non"]],
    ["piscine", "Piscine", "select", ["oui", "non"]],
    ["consoAnnuelle", "Consommation annuelle (kWh)", "number"],
    ["departement", "Département", "text"],
    ["objectifs", "Objectifs", "textarea"]
  ];
  const conso = num(prof.consoAnnuelle) || 5000;
  const prod = state.params.productivite;
  const p3 = Math.round(3 * prod), p6 = Math.round(6 * prod), p9 = Math.round(9 * prod);
  const pct6 = Math.min(999, Math.round(p6 / conso * 100));
  return '<div class="card"><h2>🏠 Profil de votre maison</h2>'
    + '<p class="sub">Base commune à la comparaison de toutes les propositions. Pré-rempli avec votre situation.</p>'
    + '<div class="grid">' + f.map(x => fieldHtml("profile", x[0], x[1], x[2], x[3], prof[x[0]])).join("") + '</div></div>'
    + '<div class="card"><h2>📏 Dimensionnement recommandé pour votre cas</h2><ul class="tight">'
    + '<li><b>Consommation</b> : valeur par défaut ' + conso + ' kWh/an (maison 2022 très bien isolée, PAC chauffage + eau chaude, 2 personnes, pas de VE ni piscine). <b>Corrigez avec vos relevés Linky réels sur 12 mois</b> : c’est l’entrée la plus importante pour ne pas surdimensionner.</li>'
    + '<li><b>Productivité</b> : plein sud + pente 40° est proche de l’optimum en France (≈ ' + prod + ' kWh/kWc/an selon la région ; 30-35° aurait été légèrement mieux, mais rien de dramatique). À affiner dans Paramètres selon votre département.</li>'
    + '<li><b>Ordres de grandeur</b> : 3 kWc → ~' + p3 + ' kWh/an · 6 kWc → ~' + p6 + ' kWh/an (≈ ' + pct6 + ' % de votre consommation) · 9 kWc → ~' + p9 + ' kWh/an.</li>'
    + '<li><b>Recommandation</b> : pour 2 personnes sans VE ni piscine, la zone 3 à 6 kWc est la plus rationnelle. Au-delà, vous produisez surtout du surplus revendu ≈ ' + (state.params.rachatSurplus * 100).toFixed(1) + ' c€/kWh : rentable, mais moins que l’autoconsommation. Une puissance supérieure ne se justifie vraiment que si un véhicule électrique arrive plus tard — auquel cas exigez justement l’évolutivité.</li>'
    + '<li><b>Batterie</b> : pour 2 personnes, ≈ ' + state.params.batterieCible + ' kWh suffisent. Exigez dès maintenant un <b>onduleur hybride ou la compatibilité batterie AC, par écrit au devis</b> : c’est LE point qui rendra l’ajout facile et bon marché plus tard.</li>'
    + '<li><b>Aides en jeu</b> : prime à l’autoconsommation (≈ ' + state.params.primeUnit + ' €/kWc jusqu’à 9 kWc, révisée chaque trimestre), rachat du surplus par EDF OA (contrat d’accessibilité), TVA réduite selon la puissance — vérifiez le taux appliqué, ligne par ligne, dans chaque devis.</li>'
    + '</ul></div>';
}

/* ---- Onglet Propositions ---- */
function renderPropositions(){
  const p = state.proposals.find(x => x.id === selectedId) || state.proposals[0];
  if(!p) return '<div class="card"><p>Aucune proposition.</p><button class="btn" onclick="addProposal()">+ Ajouter une proposition</button></div>';

  const sidebar = '<div class="proplist">'
    + state.proposals.map(x => {
      const sc = computeScores(x);
      return '<div class="item' + (x.id === selectedId ? ' sel' : '') + '" onclick="selectId(\'' + x.id + '\')">'
        + '<b>' + esc(x.name) + '</b><small>'
        + (sc.total !== null ? 'Score ' + sc.total + '/100 · ' : 'à compléter · ')
        + (sc.missing.length ? sc.missing.length + ' info(s) manquante(s)' : 'données complètes')
        + '</small></div>';
    }).join("")
    + '<button class="btn ghost small" onclick="addProposal()">+ Ajouter</button>'
    + '<button class="btn ghost small" onclick="removeProposal()">🗑 Supprimer la sélection</button></div>';

  const sections = PROPOSAL_FIELDS.map(s =>
    '<details open><summary>' + esc(s.sec) + '</summary><div class="grid">'
    + s.fields.map(f => fieldHtml("prop", f.k, f.l, f.t, f.o, p.values[f.k])).join("")
    + '</div></details>').join("");

  const manq = missingQuestionsText(p);
  const manqHtml = manq.length
    ? '<div class="card" style="border-color:#e6cf85;background:#fdf3d7"><h2>📝 ' + manq.length + ' information(s) à demander à ' + esc(p.name) + '</h2><ul class="tight">'
      + manq.map(m => '<li>' + esc(m) + '</li>').join("")
      + '</ul><button class="btn small" onclick="copyModele(\'' + p.id + '\')">📋 Copier le mail de demande</button> <span id="copied"></span></div>'
    : '<div class="card"><span class="pill ok">✅ Données clés complètes pour ' + esc(p.name) + '</span></div>';

  const d = deriveProp(p);
  return '<div class="layout"><div>' + sidebar + '</div><div>'
    + '<div class="card"><div class="row" style="justify-content:space-between;gap:12px">'
    + '<input type="text" value="' + esc(p.name) + '" data-scope="propname" style="flex:1;min-width:150px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-weight:600;font-size:15px">'
    + '<span class="pill info">' + (d.kwc ? d.kwc.toFixed(2) + ' kWc' : 'kWc ?') + '</span>'
    + (d.euWc !== null ? '<span class="pill ' + (d.euWc <= 2.4 ? 'ok' : (d.euWc <= 3.0 ? 'warn' : 'bad')) + '">' + d.euWc.toFixed(2) + ' €/Wc</span>' : '<span class="pill warn">€/Wc ?</span>')
    + '</div></div>'
    + manqHtml
    + '<div class="card">' + sections
    + '<p class="hint">Astuce : si le champ kWc dédié est vide, la puissance est recalculée automatiquement à partir de « nombre de panneaux × puissance unitaire ». Tout est enregistré automatiquement dans ce navigateur.</p></div>'
    + '</div></div>';
}

/* ---- Onglet Comparatif ---- */
function renderComparatif(){
  if(!state.proposals.length) return '<div class="card">Aucune proposition à comparer.</div>';
  const scored = state.proposals
    .map(p => ({ p, s: computeScores(p) }))
    .sort((a, b) => (b.s.total === null ? -1 : b.s.total) - (a.s.total === null ? -1 : a.s.total));
  const best = scored[0];

  const rankHtml = '<div class="rank">' + scored.map((x, i) =>
    '<div class="cand' + (i === 0 && x.s.total !== null ? ' first' : '') + '">'
    + '<small>' + (i === 0 ? '🏆 1er' : 'N°' + (i + 1)) + '</small>'
    + '<div class="scorebig">' + (x.s.total !== null ? x.s.total : '—') + '</div>'
    + '<small>' + esc(x.p.name) + '</small>'
    + (x.s.d.euWc !== null ? '<small>' + x.s.d.euWc.toFixed(2) + ' €/Wc</small>' : '<small class="miss">prix non saisi</small>')
    + '</div>').join("") + '</div>';

  const rows = [];
  const row = (label, fn, fn2) => rows.push('<tr><td>' + label + '</td>'
    + scored.map(x => {
      const main = fn(x);
      const extra = fn2 ? fn2(x) : '';
      return '<td>' + main + (extra ? '<br>' + extra : '') + '</td>';
    }).join("") + '</tr>');
  const th = '<th>Critère</th>' + scored.map(x => '<th>' + esc(x.p.name)
    + (x.s.total !== null ? '<br><span class="pill ' + (x.s.total >= 75 ? 'ok' : (x.s.total >= 50 ? 'warn' : 'bad')) + '">' + x.s.total + '/100</span>' : '<br><span class="pill warn">non renseigné</span>')
    + '</th>').join("");

  row('Prix TTC', x => x.s.d.prix !== null ? fmtInt(x.s.d.prix) + ' €' : '<span class="miss">à saisir</span>',
      x => x.p.values.mode ? esc(x.p.values.mode) : (x.p.values.prixTTC ? '<span class="miss">mode ?</span>' : ''));
  row('Puissance', x => x.s.d.kwc ? x.s.d.kwc.toFixed(2) + ' kWc' : '<span class="miss">?</span>',
      x => (num(x.p.values.panneauWc) !== null && num(x.p.values.nbPanneaux) !== null) ? num(x.p.values.panneauWc) + ' Wc × ' + num(x.p.values.nbPanneaux) : '');
  row('Prix / Wc', x => x.s.d.euWc !== null ? x.s.d.euWc.toFixed(2) + ' €/Wc' : '',
      x => x.s.d.euWc !== null ? (x.s.d.euWc <= 2.4 ? '<span class="pill ok">bon</span>' : (x.s.d.euWc <= 3.0 ? '<span class="pill warn">standard</span>' : '<span class="pill bad">cher</span>')) : '');
  row('Panneaux', x => esc((x.p.values.panneauMarque || '?') + (x.p.values.panneauModele ? ' ' + x.p.values.panneauModele : '')),
      x => x.p.values.tier1 ? 'Tier 1 : ' + esc(x.p.values.tier1) : '');
  row('Onduleur', x => esc((x.p.values.ondMarque || '?') + (x.p.values.ondModele ? ' ' + x.p.values.ondModele : '')),
      x => x.p.values.ondType ? esc(x.p.values.ondType) : '');
  row('Garantie panneaux', x => x.p.values.garProduit ? esc(x.p.values.garProduit) + ' ans (produit)' : '<span class="miss">?</span>',
      x => x.p.values.garPerfPct ? esc(x.p.values.garPerfPct) + '% @ ' + esc(x.p.values.garPerfAns || '?') + ' ans' : '');
  row('Garantie onduleur', x => x.p.values.garOnduleur ? esc(x.p.values.garOnduleur) + ' ans' : '<span class="miss">?</span>',
      x => x.p.values.garMainOeuvre ? 'main-d’œuvre : ' + esc(x.p.values.garMainOeuvre) + ' ans' : '');
  row('Batterie', x => esc(x.p.values.batteriePrevue || '?'),
      x => { const b = num(x.p.values.batteriePrix); return b !== null ? fmtInt(b) + ' € (' + esc(x.p.values.batterieKwh || '?') + ' kWh)' : ''; });
  row('Prêt pour batterie plus tard', x => esc(x.p.values.ondHybride || '?'),
      x => { const s = num(x.p.values.slotsRoof); return s !== null ? s + ' panneau(x) ajoutable(s)' : ''; });
  row('Pose', x => esc(x.p.values.poseInterne || '?'), x => esc(x.p.values.poseType || ''));
  row('Démarches / TVA', x => esc(x.p.values.demarches || '?'), x => x.p.values.tvaTaux ? 'TVA ' + esc(x.p.values.tvaTaux) : '');
  row('Production estimée / an', x => x.s.d.prod ? fmtInt(x.s.d.prod) + ' kWh' : '',
      x => x.s.d.prod ? '≈ ' + Math.round(x.s.d.prod / (num(state.profile.consoAnnuelle) || 5000) * 100) + '% de votre conso' : '');
  row('Prime autoconsommation (est.)', x => x.s.d.prime ? '≈ ' + fmtInt(x.s.d.prime) + ' €' : '', null);
  row('Économie annuelle (est.)', x => x.s.d.gains ? fmtInt(x.s.d.gains) + ' €/an' : '', null);
  row('Retour sur investissement (est.)', x => x.s.d.retour ? Math.round(x.s.d.retour) + ' ans' : '', null);
  [['💰 Score prix','prix'],['🔧 Score matériel','materiel'],['🛡️ Score garanties','garanties'],['🔋 Score évolutivité (batterie)','evolutivite'],['👷 Score installation / sans sous-traitance','installation']]
    .forEach(r => rows.push('<tr><td>' + r[0] + '</td>' + scored.map(x => '<td>' + bar(x.s.scores[r[1]]) + '</td>').join("") + '</tr>'));

  const table = '<div class="wrap"><table><thead><tr>' + th + '</tr></thead><tbody>' + rows.join("") + '</tbody></table></div>';

  const flagsHtml = scored.map(x => x.s.flags.length
    ? '<div class="card"><h2>🚩 Points de vigilance — ' + esc(x.p.name) + '</h2>'
      + x.s.flags.map(f => '<div class="flag">⚠️ ' + esc(f) + '</div>').join("") + '</div>'
    : '').join("");

  const missAll = scored.filter(x => x.s.missing.length);
  const missHtml = missAll.length
    ? '<div class="card" style="background:var(--amber-soft)"><h2>📥 Informations manquantes</h2><ul class="tight">'
      + missAll.map(x => '<li><b>' + esc(x.p.name) + '</b> : ' + esc(x.s.missing.join(', ')) + '</li>').join('')
      + '</ul><p class="hint">Complétez dans l’onglet Propositions, ou demandez par écrit via le bouton « Copier le mail de demande ».</p></div>'
    : '';

  const rankingNote = (best.s.total !== null)
    ? '<div class="card" style="background:var(--green-soft)"><b>📊 En l’état des données saisies, ' + esc(best.p.name) + ' arrive en tête avec ' + best.s.total + '/100.</b><br><span class="sub" style="margin:6px 0 0;display:block">Le classement évoluera à mesure que vous complétez les informations manquantes. Pondérations ajustables dans Paramètres.</span></div>'
    : '';

  return '<div class="no-print row" style="margin-bottom:12px">'
    + '<button class="btn secondary small" onclick="window.print()">🖨 Imprimer / PDF</button>'
    + '<button class="btn ghost small" onclick="copyComparatif()">📋 Copier le comparatif (texte)</button>'
    + '<span id="copied2"></span></div>'
    + rankingNote + rankHtml
    + '<div class="card">' + table + '</div>' + flagsHtml + missHtml
    + '<div class="card"><h2>✅ Rappels spécifiques à votre projet</h2><ul class="tight">'
    + '<li><b>Pas de sous-traitance</b> : exigez par écrit l’identité des poseurs et le fait qu’ils soient salariés. Un devis « sous-traitance » est sanctionné dans le score installation.</li>'
    + '<li><b>Comparabilité</b> : ne comparez que des devis qui incluent la même chose (matériel, pose, TPE/étanchéité, démarches, monitoring). Sinon vous comparez des choux et des carottes.</li>'
    + '<li><b>Batterie plus tard</b> : exigez l’onduleur hybride ou la compatibilité batterie AC, écrit, avec prix ferme de l’option pour 24 mois.</li>'
    + '</ul></div>';
}

/* ---- Onglet Questions ---- */
function renderQuestions(){
  const cats = [...new Set(QUESTIONS.map(q => q[0]))];
  const progress = state.proposals.map(p => {
    const done = QUESTIONS.filter(q => p.checks[q[0] + '|' + q[1]]).length;
    return '<span class="pill ' + (done === QUESTIONS.length ? 'ok' : 'info') + '">' + esc(p.name) + ' : ' + done + '/' + QUESTIONS.length + '</span>';
  }).join(' ');
  const catHtml = cats.map(c =>
    '<div class="card"><h3>' + esc(c) + '</h3>' + QUESTIONS.filter(q => q[0] === c).map(q => {
      const key = q[0] + '|' + q[1];
      return '<div class="qrow"><div>' + esc(q[1]) + '</div><div class="qchecks">'
        + state.proposals.map(p => '<label><input type="checkbox" data-pid="' + p.id + '" data-q="' + esc(key) + '"' + (p.checks[key] ? ' checked' : '') + '> ' + esc(p.name.split(' ')[0]) + '</label>').join('')
        + '</div></div>';
    }).join('') + '</div>').join('');
  return '<div class="card"><h2>❓ Grille de questions — la même pour les 5 installateurs</h2>'
    + '<p class="sub">Cochez quand vous avez la réponse <b>par écrit</b> (dans le devis ou par mail : la parole n’engage pas). Une grille identique pour tous = des devis comparables.</p>'
    + '<p>' + progress + '</p></div>'
    + catHtml
    + '<div class="card no-print"><button class="btn secondary" onclick="window.print()">🖨 Imprimer la grille</button></div>';
}

/* ---- Onglet Batterie ---- */
function renderBatterie(){
  const p = state.params;
  const conso = num(state.profile.consoAnnuelle) || 5000;
  const prod6 = Math.round(6 * p.productivite);
  const gainBat = Math.round(prod6 * ((p.tacAvecBatterie - p.tacSansBatterie) / 100) * p.prixElec);
  return '<div class="card"><h2>🔋 Stratégie « batterie plus tard » — comment ne pas se piéger</h2><ul class="tight">'
    + '<li><b>Règle n°1 : onduleur hybride OU compatibilité batterie AC, écrit au devis.</b> Un onduleur hybride acceptera une batterie plus tard sans rien remplacer. Sinon, une batterie « AC » (Marstek Venus, Anker Solix, Tesla Powerwall…) se raccorde côté maison, mais vérifiez l’impact sur les garanties et le monitoring.</li>'
    + '<li><b>Taille cible : ~' + p.batterieCible + ' kWh</b> pour 2 personnes + PAC. Une grosse batterie (10 kWh et plus) serait surdimensionnée et plomberait le budget sans gain réel.</li>'
    + '<li><b>Ordre de prix</b> : ≈ 500 à 800 €/kWh posée, soit ' + p.batterieCible + ' kWh ≈ 2 500-4 000 €. Au-delà, négociez — ou achetez la batterie séparément (prix public) et faites-la simplement raccorder.</li>'
    + '<li><b>Gain attendu</b> : passer de ' + p.tacSansBatterie + '% à ' + p.tacAvecBatterie + '% d’autoconsommation sur ~' + fmtInt(prod6) + ' kWh/an produits (6 kWc) et ' + fmtInt(conso) + ' kWh/an consommés ≈ <b>' + fmtInt(gainBat) + ' €/an</b>. La batterie ne se justifie que si ce gain ramène le retour sur investissement sous ~8-10 ans.</li>'
    + '<li><b>À exiger dès maintenant dans CHAQUE devis</b> : option batterie chiffrée (prix ferme 24 mois), emplacement + passage de câbles prévus, puissance onduleur restante pour des panneaux supplémentaires, procédure d’ajout d’une batterie AC indépendante.</li>'
    + '<li><b>Moins cher qu’une batterie</b> : piloter la PAC et le chauffe-eau (délestage,  pilotage via l’application de l’onduleur ou un programmateur connecté) consomme votre surplus sur place — l’équivalent d’une demi-batterie, pour très peu cher.</li>'
    + '</ul></div>'
    + '<div class="card"><h2>⚠️ Pièges classiques à éviter</h2><ul class="tight">'
    + '<li>« Vous installerez la batterie plus tard, pas de souci » → sans prix ferme écrit, l’ajout coûte souvent 30 à 50 % plus cher après coup.</li>'
    + '<li>Onduleur non hybride + batterie uniquement de la même marque/installateur → reprise de garantie floue, lock-in.</li>'
    + '<li>Location de batterie ou abonnement : calculez toujours le coût total sur la durée de garantie.</li>'
    + '<li>Grosse installation « parce que c’est proposé » : au-delà de 6 kWc pour 2 personnes, c’est principalement du surplus vendu bon marché.</li>'
    + '</ul></div>';
}

/* ---- Onglet Paramètres ---- */
function renderParametres(){
  const p = state.params, w = p.poids;
  return '<div class="card"><h2>⚙️ Hypothèses de calcul</h2>'
    + '<p class="sub">Ajustez selon votre région (productivité) et les tarifs du trimestre en cours (prime + rachat : arrêtés S21, révisés chaque trimestre — vérifiez sur le site EDF OA au moment de la signature).</p>'
    + '<div class="grid">'
    + fieldHtml("param", "productivite", "Productivité (kWh/kWc/an)", "number", null, p.productivite)
    + fieldHtml("param", "prixElec", "Prix électricité (€/kWh TTC)", "number", null, p.prixElec)
    + fieldHtml("param", "rachatSurplus", "Rachat du surplus (€/kWh)", "number", null, p.rachatSurplus)
    + fieldHtml("param", "primeUnit", "Prime autoconsommation (€/kWc)", "number", null, p.primeUnit)
    + fieldHtml("param", "tacSansBatterie", "Autoconsommation sans batterie (%)", "number", null, p.tacSansBatterie)
    + fieldHtml("param", "tacAvecBatterie", "Autoconsommation avec batterie (%)", "number", null, p.tacAvecBatterie)
    + fieldHtml("param", "batterieCible", "Batterie cible (kWh)", "number", null, p.batterieCible)
    + '</div>'
    + '<h3>Pondérations des scores (0-100)</h3><div class="grid">'
    + ["prix", "materiel", "garanties", "evolutivite", "installation"].map(k => fieldHtml("poids", k, k, "number", null, w[k])).join("")
    + '</div>'
    + '<p class="hint">Somme actuelle : ' + ["prix","materiel","garanties","evolutivite","installation"].reduce((a, k) => a + (Number(w[k]) || 0), 0) + ' (conseillé : 100 ; les scores s’adaptent automatiquement). Prix : 1,9 €/Wc → 100/100, 3,3 €/Wc → 0/100.</p></div>'
    + '<div class="card"><h2>💾 Sauvegarde / export</h2>'
    + '<div class="row"><button class="btn secondary" onclick="exportJson()">⬇️ Exporter mes données (JSON)</button>'
    + '<label class="btn ghost" style="cursor:pointer;position:relative">⬆️ Importer un JSON<input type="file" accept=".json" id="impjson" style="display:none"></label>'
    + '<button class="btn ghost" onclick="resetAll()">♻️ Tout réinitialiser</button></div>'
    + '<p class="hint">Vos données restent dans ce navigateur (localStorage). L’export JSON permet de les sauvegarder, les partager ou les changer d’ordinateur.</p></div>';
}

/* ---- Actions ---- */
window.selectId = function(id){ selectedId = id; render(); };
window.addProposal = function(){
  const p = defaultProposal();
  state.proposals.push(p); selectedId = p.id; save(); render();
};
window.removeProposal = function(){
  const p = state.proposals.find(x => x.id === selectedId);
  if(!p) return;
  if(confirm("Supprimer « " + p.name + " » ?")){
    state.proposals = state.proposals.filter(x => x.id !== p.id);
    selectedId = state.proposals.length ? state.proposals[0].id : null;
    save(); render();
  }
};
window.copyModele = function(id){
  const p = state.proposals.find(x => x.id === id);
  if(!p) return;
  const lines = missingQuestionsText(p);
  const txt = "Bonjour,\n\nPour affiner votre proposition et la comparer à d’autres sur une base identique, merci de me préciser les points suivants (par écrit, idéalement directement dans le devis) :\n\n"
    + lines.join("\n") + "\n\nMerci d’avance,\nCordialement";
  navigator.clipboard.writeText(txt).then(() => {
    const el = document.getElementById("copied");
    if(el) el.innerHTML = '<span class="pill ok">copié !</span>';
  }).catch(() => { alert(txt); });
};
window.copyComparatif = function(){
  const scored = state.proposals
    .map(p => ({ p, s: computeScores(p) }))
    .sort((a, b) => (b.s.total === null ? -1 : b.s.total) - (a.s.total === null ? -1 : a.s.total));
  const txt = "COMPARATIF PHOTOVOLTAÏQUE — " + new Date().toLocaleDateString("fr-FR") + "\n"
    + "Maison : " + state.profile.surface + " m², " + state.profile.orientation + ", pente " + state.profile.pente + "°, PAC, " + state.profile.occupants + " occupants, conso de référence " + state.profile.consoAnnuelle + " kWh/an\n\n"
    + scored.map(x => {
      const d = x.s.d;
      return "== " + x.p.name + " ==" + (x.s.total !== null ? " (score " + x.s.total + "/100)" : "") + "\n"
        + "Prix : " + (d.prix !== null ? d.prix + " € TTC (mode : " + (x.p.values.mode || "?") + ")" : "non communiqué")
        + (d.kwc ? " | " + d.kwc.toFixed(2) + " kWc" : "")
        + (d.euWc !== null ? " | " + d.euWc.toFixed(2) + " €/Wc" : "") + "\n"
        + "Panneaux : " + (x.p.values.panneauMarque || "?") + " (garantie produit " + (x.p.values.garProduit || "?") + " ans ; performance " + (x.p.values.garPerfPct || "?") + "% @ " + (x.p.values.garPerfAns || "?") + " ans)\n"
        + "Onduleur : " + (x.p.values.ondMarque || "?") + " [" + (x.p.values.ondType || "?") + "] (garantie " + (x.p.values.garOnduleur || "?") + " ans)\n"
        + "Batterie : " + (x.p.values.batteriePrevue || "?")
        + " | Prêt pour batterie plus tard : " + (x.p.values.ondHybride || "?") + "\n"
        + "Pose : " + (x.p.values.poseInterne || "?") + " | Démarches : " + (x.p.values.demarches || "?") + " | TVA : " + (x.p.values.tvaTaux || "?") + "\n"
        + "Production estimée : " + (d.prod ? Math.round(d.prod) + " kWh/an" : "?")
        + (d.retour ? " | Retour sur investissement : " + Math.round(d.retour) + " ans" : "") + "\n"
        + (x.s.flags.length ? "Vigilance : " + x.s.flags.join(" ; ") : "")
        + (x.s.missing.length ? "\nInfos manquantes : " + x.s.missing.join(", ") : "");
    }).join("\n\n");
  navigator.clipboard.writeText(txt).then(() => {
    const el = document.getElementById("copied2");
    if(el) el.innerHTML = '<span class="pill ok">copié !</span>';
  }).catch(() => { alert(txt); });
};
window.exportJson = function(){
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "comparateur-photovoltaique.json";
  a.click();
};
window.resetAll = function(){
  if(confirm("Effacer TOUTES les données saisies et repartir de zéro ?")){
    localStorage.removeItem(STORE_KEY);
    state = load();
    selectedId = state.proposals[0].id;
    render();
  }
};

/* ---- Événements de saisie ---- */
document.getElementById("content").addEventListener("input", e => {
  const t = e.target;
  const s = t.dataset ? t.dataset.scope : null;
  if(!s) return;
  if(s === "profile"){ state.profile[t.dataset.key] = t.value; save(); return; }
  if(s === "propname"){
    const p = state.proposals.find(x => x.id === selectedId);
    if(p){ p.name = t.value; save(); }
    return;
  }
  if(s === "param"){ state.params[t.dataset.key] = num(t.value) === null ? 0 : num(t.value); save(); return; }
  if(s === "poids"){ state.params.poids[t.dataset.key] = num(t.value) === null ? 0 : num(t.value); save(); return; }
  if(s === "prop"){
    const p = state.proposals.find(x => x.id === selectedId);
    if(p){ p.values[t.dataset.key] = t.value; save(); }
  }
});
document.getElementById("content").addEventListener("change", e => {
  const t = e.target;
  if(t.tagName === "SELECT" && t.dataset && t.dataset.scope === "prop"){
    const p = state.proposals.find(x => x.id === selectedId);
    if(p){ p.values[t.dataset.key] = t.value; save(); render(); }
  }
  if(t.tagName === "SELECT" && t.dataset && t.dataset.scope === "profile"){ state.profile[t.dataset.key] = t.value; save(); render(); }
  if(t.id === "impjson" && t.files && t.files[0]){
    const r = new FileReader();
    r.onload = () => {
      try{ state = JSON.parse(r.result); save(); selectedId = state.proposals[0].id; render(); }
      catch(err){ alert("Fichier JSON invalide"); }
    };
    r.readAsText(t.files[0]);
  }
});
document.addEventListener("click", e => {
  if(e.target.dataset && e.target.dataset.pid && e.target.dataset.q !== undefined){
    const p = state.proposals.find(x => x.id === e.target.dataset.pid);
    if(p){
      p.checks[e.target.dataset.q] = e.target.checked;
      save();
      if(currentTab === "questions") render();
    }
  }
});

/* ---- Rendu principal ---- */
function render(){
  if(currentTab === "profil") content.innerHTML = renderProfil();
  else if(currentTab === "propositions") content.innerHTML = renderPropositions();
  else if(currentTab === "comparatif") content.innerHTML = renderComparatif();
  else if(currentTab === "questions") content.innerHTML = renderQuestions();
  else if(currentTab === "batterie") content.innerHTML = renderBatterie();
  else content.innerHTML = renderParametres();
}

render();
