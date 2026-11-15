// Aliments de Papille : référentiel d'ingrédients (catalogue Bouchée) + nutriments CIQUAL 2025.
// Chargé une fois au démarrage (public/data/aliments.json). La table CIQUAL complète
// (public/data/ciqual.json) n'est chargée que pour le journal.

const BASE = import.meta.env.BASE_URL;

export const FAMILLES = {
  legumes: { label: 'Légumes', icon: 'Carrot', tint: 'legume' },
  fruits: { label: 'Fruits', icon: 'Apple', tint: 'fruit' },
  'cereales-feculents': { label: 'Céréales et féculents', icon: 'Wheat', tint: 'feculent' },
  'legumineuses-fruits-a-coque-graines': { label: 'Légumineuses, fruits à coque et graines', icon: 'Bean', tint: 'legumineuse' },
  viandes: { label: 'Viandes', icon: 'Drumstick', tint: 'viande' },
  'poissons-fruits-de-mer': { label: 'Poissons et fruits de mer', icon: 'Fish', tint: 'poisson' },
  'produits-laitiers-oeufs': { label: 'Produits laitiers et œufs', icon: 'Milk', tint: 'laitier' },
  'herbes-epices': { label: 'Herbes et épices', icon: 'Leaf', tint: 'epice' },
  'condiments-sauces': { label: 'Condiments et sauces', icon: 'Soup', tint: 'sauce' },
  'sucres-boissons': { label: 'Sucres et boissons', icon: 'Candy', tint: 'sucre' },
  'matieres-grasses': { label: 'Matières grasses', icon: 'Droplet', tint: 'gras' },
};

/** Libellés du profil → codes d'allergènes du référentiel */
export const ALLERGEN_CODE = {
  'Gluten': 'gluten', 'Crustacés': 'crustaces', 'Œufs': 'oeufs', 'Poissons': 'poissons', 'Arachides': 'arachides', 'Soja': 'soja',
  'Lait': 'lait', 'Fruits à coque': 'fruits_a_coque', 'Céleri': 'celeri', 'Moutarde': 'moutarde', 'Sésame': 'sesame',
  'Sulfites': 'sulfites', 'Lupin': 'lupin', 'Mollusques': 'mollusques',
};

// Liaisons vivantes : remplies par loadFoods() avant le premier rendu
export let FOOD = {};          // tous les ingrédients, catégories comprises
export let FOODS = [];         // les aliments « réels » (swipables), triés par usage
export let BASE_COUNT = 200;
export let SOURCES = [];

export async function loadFoods() {
  const res = await fetch(`${BASE}data/aliments.json`);
  if (!res.ok) throw new Error(`Données d’aliments introuvables (${res.status})`);
  const data = await res.json();
  FOOD = Object.fromEntries(data.aliments.map(a => [a.id, { ...a, nom: cap(a.nom) }]));
  FOODS = Object.values(FOOD)
    .filter(a => !a.categorie)
    .sort((a, b) => (a.rang || 1e6) - (b.rang || 1e6) || a.nom.localeCompare(b.nom, 'fr'));
  SOURCES = data.sources;
  cache.clear();
  childrenIndex = null;
}

/* ---------- Photos (Wikipédia / Commons), public/data/images.json ---------- */
export let IMAGES = { foods: {}, recipes: {} };
let byCiqual = null;
export async function loadImages() {
  try {
    const res = await fetch(`${BASE}data/images.json`);
    if (res.ok) IMAGES = await res.json();
  } catch (e) { /* sans photos, l'app garde ses pictogrammes */ }
}
/** Photo d'un aliment, ou celle de son parent (« blanc de poulet » → poulet). */
export function imageOf(id) {
  for (let x = FOOD[id], depth = 0; x && depth < 4; x = FOOD[x.parent], depth++) {
    if (IMAGES.foods[x.id]) return { ...IMAGES.foods[x.id], of: x.id };
  }
  return null;
}
/** Photo pour un aliment CIQUAL du journal, via l'ingrédient du référentiel qui porte ce code. */
export function imageOfCiqual(code) {
  if (!byCiqual) byCiqual = new Map(Object.values(FOOD).filter(f => f.ciqual).map(f => [String(f.ciqual), f.id]));
  const id = byCiqual.get(String(code));
  return id ? imageOf(id) : null;
}

export const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const isBase = f => !!f.rang && f.rang <= BASE_COUNT;

/* ---------- Dépliage : catégories parentes + composants, récursivement ---------- */
const cache = new Map();
/** Ensemble des identifiants « contenus » par un ingrédient : lui-même, ses parents, ses composants (et les leurs). */
export function expand(id) {
  if (cache.has(id)) return cache.get(id);
  const out = new Set();
  const visit = x => {
    if (!x || out.has(x)) return;
    out.add(x);
    const f = FOOD[x];
    if (!f) return;
    visit(f.parent);
    for (const c of f.composants || []) visit(c);
  };
  visit(id);
  cache.set(id, out);
  return out;
}
/** Descendants d'une catégorie (« huile » → huile d'olive, huile d'arachide…). */
let childrenIndex = null;
export function descendants(id) {
  if (!childrenIndex) {
    childrenIndex = new Map();
    for (const f of Object.values(FOOD)) if (f.parent) (childrenIndex.get(f.parent) || childrenIndex.set(f.parent, []).get(f.parent)).push(f.id);
  }
  const out = [];
  const visit = x => { for (const c of childrenIndex.get(x) || []) { out.push(c); visit(c); } };
  visit(id);
  return out;
}
export const allergensOf = id => new Set([...expand(id)].flatMap(x => FOOD[x]?.allergenes || []));
export const namesOf = id => [...expand(id)].flatMap(x => (FOOD[x] ? [FOOD[x].nom, ...(FOOD[x].alias || [])] : []));

/* ---------- Table CIQUAL complète (journal) ---------- */
let ciqualPromise = null;
export let CIQUAL = {}; // code → { code, nom, groupe, sousGroupe, n }
export function loadCiqual() {
  if (!ciqualPromise) {
    ciqualPromise = fetch(`${BASE}data/ciqual.json`)
      .then(r => { if (!r.ok) throw new Error(`Table CIQUAL introuvable (${r.status})`); return r.json(); })
      .then(d => {
        CIQUAL = Object.fromEntries(d.aliments.map(([code, nom, groupe, sousGroupe, ...n]) => [code, { code, nom, groupe, sousGroupe, n }]));
        return CIQUAL;
      })
      .catch(e => { ciqualPromise = null; throw e; });
  }
  return ciqualPromise;
}

/** Teinte d'un aliment CIQUAL d'après son groupe (pour la vignette) */
export function ciqualTint(groupe = '') {
  const g = groupe.toLowerCase();
  if (/viande|poisson|œuf|oeuf/.test(g)) return 'viande';
  if (/lait|fromage/.test(g)) return 'laitier';
  if (/céréal|cereal/.test(g)) return 'feculent';
  if (/sucr|boisson|glace/.test(g)) return 'sucre';
  if (/matière|matiere/.test(g)) return 'gras';
  if (/plats|entrées|aides/.test(g)) return 'sauce';
  return 'legume';
}

// Réponses de départ du profil de démonstration
export const INITIAL_ANSWERS = {
  carotte: 'like', lentille_corail: 'like', poulet: 'like', pomme: 'like', pomme_de_terre: 'like', tomate: 'like', riz: 'like', penne: 'like',
  champignon_de_paris: 'dislike', betterave: 'dislike', endive: 'dislike', olive_noire: 'dislike',
  fenouil: 'unsure', aubergine: 'unsure', tofu: 'unsure',
};
