import { ALLERGEN_CODE, CIQUAL, FAMILLES, FOOD, FOODS, allergensOf, expand, namesOf } from '../data/foods.js';
import { RECIPES } from '../data/recipes.js';

/* ---------- Texte ---------- */
export const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/’/g, "'").trim();
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
export const fmt = n => nf.format(n);
const PLURAL = new Set(['gousse', 'boîte', 'tranche', 'sachet', 'bouquet']);
const MEASURED = ['g', 'cl', 'ml', 'kg', 'L', 'c. à s.', 'c. à c.'];
/** Quantité lisible. `buy` arrondit au-dessus ce qui s'achète à l'unité (1,5 oignon → 2). */
export function fmtQty(qty, unit, buy = false) {
  const measured = MEASURED.includes(unit);
  const q = measured
    ? (unit === 'kg' || unit === 'L' ? Math.round(qty * 10) / 10 : unit.startsWith('c.') ? Math.round(qty * 2) / 2 : Math.round(qty))
    : buy ? Math.ceil(qty - 0.01) : Math.round(qty * 2) / 2;
  const u = unit && PLURAL.has(unit) && q > 1 ? unit + 's' : unit;
  return u ? `${fmt(q)} ${u}` : fmt(q);
}
export const listFr = a => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} et ${a[a.length - 1]}`);

/* ---------- Profil et sécurité ---------- */
export const ALLERGENS = Object.keys(ALLERGEN_CODE);
export const REGIMES = ['Végétarien', 'Végétalien', 'Sans viande', 'Sans porc', 'Sans alcool', 'Sans gluten', 'Sans lait'];

// Un régime exclut : des catégories du référentiel (et tout ce qui en descend ou les contient),
// des familles entières, des allergènes. `tags` couvre les ingrédients saisis sans lien au référentiel.
const RULES = {
  'Végétarien': { roots: ['viande', 'poisson', 'fruit_de_mer', 'gelatine'], familles: ['viandes', 'poissons-fruits-de-mer'], tags: ['viande', 'poisson'] },
  'Végétalien': { roots: ['viande', 'poisson', 'fruit_de_mer', 'gelatine', 'lait', 'oeuf', 'miel'], familles: ['viandes', 'poissons-fruits-de-mer', 'produits-laitiers-oeufs'], allergens: ['lait', 'oeufs', 'poissons', 'crustaces', 'mollusques'], tags: ['viande', 'poisson', 'animal'] },
  'Sans viande': { roots: ['viande', 'gelatine'], familles: ['viandes'], tags: ['viande'] },
  'Sans porc': { roots: ['porc', 'gelatine'], tags: ['porc'] },
  'Sans alcool': { roots: ['alcool'], tags: ['alcool'] },
  'Sans gluten': { allergens: ['gluten'] },
  'Sans lait': { allergens: ['lait'] },
};

/** Un aliment interdit en texte libre vise un nom exact, ou un nom qui le précise (« coriandre fraîche »),
 *  mais pas un autre aliment qui commence pareil (« pomme » ≠ « pomme de terre »). */
function namesMatch(names, forbidden) {
  const f = norm(forbidden);
  return names.some(n => {
    const x = norm(n);
    if (x === f || x === `${f}s`) return true;
    if (!x.startsWith(`${f} `)) return false;
    return !/^(de|d'|du|des|a|au|aux)\b/.test(x.slice(f.length + 1));
  });
}

/** Ce qui, dans un ingrédient, heurte le profil. */
function hits(item, profile) {
  const out = [];
  const ids = item.food ? expand(item.food) : new Set();
  const allergens = new Set([...(item.food ? allergensOf(item.food) : []), ...(item.allergens || []).map(a => ALLERGEN_CODE[a] || a)]);
  const familles = new Set([...ids].map(x => FOOD[x]?.famille).filter(Boolean));
  const tags = item.tags || [];
  for (const a of profile.allergens) if (allergens.has(ALLERGEN_CODE[a])) out.push({ kind: 'Allergie', label: a });
  for (const r of profile.regimes) {
    const rule = RULES[r];
    if (!rule) continue;
    const bad = (rule.roots || []).some(x => ids.has(x))
      || (rule.familles || []).some(x => familles.has(x))
      || (rule.allergens || []).some(x => allergens.has(x))
      || (rule.tags || []).some(x => tags.includes(x));
    if (bad) out.push({ kind: 'Régime', label: r });
  }
  const names = [item.name, ...(item.food ? namesOf(item.food) : [])].filter(Boolean);
  for (const f of profile.forbidden) if (f && namesMatch(names, f)) out.push({ kind: 'Interdit', label: f });
  return out;
}

/** Vérifie une recette contre le profil, ingrédients composés compris. */
export function checkRecipe(recipe, profile) {
  const reasons = [];
  let unknown = null;
  for (const ing of recipe.ingredients) {
    for (const h of hits(ing, profile)) reasons.push({ ...h, where: ing.name });
    for (const c of ing.contains || []) for (const h of hits(c, profile)) reasons.push({ ...h, where: `${ing.name} (contient ${c.name})` });
    if (ing.unknown && !unknown) unknown = ing.name;
  }
  return { safe: reasons.length === 0, reasons, unverifiable: reasons.length === 0 && !!unknown, unknown, composed: recipe.ingredients.filter(i => i.contains || (i.food && FOOD[i.food]?.composants)) };
}

export function foodAllowed(food, profile) {
  return hits({ name: food.nom, food: food.id }, profile).length === 0;
}

/* ---------- Goûts ---------- */
const ingredientFoods = r => r.ingredients.flatMap(i => [i.food, ...(i.contains || []).map(c => c.food)]).filter(Boolean);

let siblingsIndex = null;
let siblingsFor = null;
/** Aliments frères : même parent dans la taxonomie. */
function siblings(id) {
  if (siblingsFor !== FOODS) {
    siblingsIndex = new Map();
    for (const f of FOODS) if (f.parent) (siblingsIndex.get(f.parent) || siblingsIndex.set(f.parent, []).get(f.parent)).push(f);
    siblingsFor = FOODS;
  }
  const p = FOOD[id]?.parent;
  return p ? siblingsIndex.get(p) || [] : [];
}

/** Score de −100 à +100 et son détail. */
export function foodScore(id, answers, opinions) {
  const a = answers[id];
  const direct = a === 'like' ? 50 : a === 'dislike' ? -50 : 0;
  const dishes = [];
  for (const r of RECIPES) {
    if (!r.main.includes(id) || (opinions[r.id] !== 'like' && opinions[r.id] !== 'dislike')) continue;
    dishes.push({ name: r.name, delta: opinions[r.id] === 'like' ? 8 : -8 });
  }
  const peers = siblings(id).filter(f => f.id !== id && (answers[f.id] === 'like' || answers[f.id] === 'dislike'));
  const group = peers.length ? Math.round((peers.reduce((s, f) => s + (answers[f.id] === 'like' ? 1 : -1), 0) / peers.length) * 15) : 0;
  const total = Math.max(-100, Math.min(100, direct + dishes.reduce((s, d) => s + d.delta, 0) + group));
  return { total, direct, dishes, group, likedPeers: peers.filter(f => answers[f.id] === 'like').map(f => f.nom), parent: FOOD[FOOD[id]?.parent]?.nom };
}

export function recipeMatch(recipe, answers, opinions) {
  const s = recipe.main.map(id => foodScore(id, answers, opinions).total);
  const avg = s.reduce((a, b) => a + b, 0) / s.length;
  const bonus = opinions[recipe.id] === 'like' ? 10 : opinions[recipe.id] === 'dislike' ? -25 : 0;
  return Math.max(0, Math.min(100, Math.round(50 + avg * 0.6 + bonus)));
}

/** Aliments « je n'aime pas » présents, y compris cachés dans un ingrédient composé (sauce tomate → tomate). */
export const dislikedIn = (recipe, answers) => [...new Set(ingredientFoods(recipe).flatMap(f => [...expand(f)]).filter(f => answers[f] === 'dislike'))].map(f => FOOD[f].nom);
export const unknownIn = (recipe, answers) => [...new Set(recipe.main.filter(f => !answers[f]))].map(f => FOOD[f].nom);
export const allLiked = (recipe, answers) => recipe.main.every(f => answers[f] === 'like');

/** Recettes visibles : sûres, sans aliment « je n'aime pas ». */
export function catalog(state) {
  const { profile, answers, opinions } = state;
  const rows = RECIPES.map(r => ({ r, check: checkRecipe(r, profile), disliked: dislikedIn(r, answers), match: recipeMatch(r, answers, opinions) }));
  return {
    visible: rows.filter(x => x.check.safe && !x.check.unverifiable && x.disliked.length === 0 && x.r.img).sort((a, b) => b.match - a.match),
    unverifiable: rows.filter(x => x.check.unverifiable && x.disliked.length === 0),
    excluded: rows.filter(x => !x.check.safe),
    withDisliked: rows.filter(x => x.check.safe && x.disliked.length > 0),
  };
}

/** Aliments inconnus proches des goûts, avec des recettes sûres pour les goûter. */
export function discoveries(state) {
  const { profile, answers, opinions } = state;
  const { visible } = catalog(state);
  return FOODS.filter(f => !answers[f.id] && foodAllowed(f, profile))
    .map(f => {
      const s = foodScore(f.id, answers, opinions);
      const recipes = visible.filter(x => ingredientFoods(x.r).includes(f.id));
      return { food: f, score: s, recipes };
    })
    .filter(x => x.recipes.length && x.score.total > 0)
    .sort((a, b) => b.score.total - a.score.total);
}

export function reasonFor(d) {
  if (d.score.likedPeers.length) return `Même famille que ${listFr(d.score.likedPeers.slice(0, 2).map(n => n.toLowerCase()))}, que vous aimez.`;
  if (d.score.dishes.length) return `Dans ${d.score.dishes.length} plat${d.score.dishes.length > 1 ? 's' : ''} que vous aimez.`;
  return `Proche de vos goûts (${(FAMILLES[d.food.famille]?.label || 'aliments').toLowerCase()}).`;
}

/* ---------- Nutrition ---------- */
export const NUTRIENTS = [
  ['kcal', 'Énergie', 'kcal'], ['prot', 'Protéines', 'g'], ['gluc', 'Glucides', 'g'], ['lip', 'Lipides', 'g'], ['fib', 'Fibres', 'g'],
  ['fer', 'Fer', 'mg'], ['ca', 'Calcium', 'mg'], ['mg', 'Magnésium', 'mg'], ['vitc', 'Vitamine C', 'mg'], ['vitd', 'Vitamine D', 'µg'], ['b12', 'Vitamine B12', 'µg'],
].map(([key, label, unit], i) => ({ key, label, unit, i }));

export const ACTIVITIES = [
  { id: 'sed', label: 'Sédentaire', k: 1.2, hint: 'Peu ou pas de sport' },
  { id: 'light', label: 'Légère', k: 1.375, hint: '1 à 3 séances par semaine' },
  { id: 'mod', label: 'Modérée', k: 1.55, hint: '3 à 5 séances par semaine' },
  { id: 'high', label: 'Intense', k: 1.725, hint: '6 à 7 séances par semaine' },
];

export function bmr(p) {
  return Math.round(10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'F' ? -161 : 5));
}
// Mêmes bornes que les contraintes de la table profiles
export const RANGES = { age: [10, 120], weight: [20, 400], height: [80, 250] };
export const outOfRange = (field, v) => v !== '' && v !== null && v !== undefined && (Number.isNaN(Number(v)) || v < RANGES[field][0] || v > RANGES[field][1]);
export const profileValid = p => Object.keys(RANGES).every(f => !outOfRange(f, p[f]));
export const profileComplete = p => profileValid(p) && [p.age, p.weight, p.height].every(v => typeof v === 'number' && v > 0);

/** Besoins quotidiens. Profil incomplet : valeurs d'un adulte type, en attendant. */
export function needs(profile) {
  const p = profileComplete(profile) ? profile : { ...profile, age: 30, weight: 65, height: 168 };
  const k = ACTIVITIES.find(a => a.id === p.activity)?.k ?? 1.55;
  const kcal = Math.round(bmr(p) * k);
  return [kcal, Math.round(0.83 * p.weight), Math.round((kcal * 0.5) / 4), Math.round((kcal * 0.35) / 9), 30, 11, 950, p.sex === 'F' ? 300 : 380, 110, 15, 4];
}
export const level = pct => (pct < 70 ? 'bad' : pct < 90 ? 'warn' : 'ok');

/** Aliment du journal : code CIQUAL (ou, pour d'anciennes entrées, identifiant du référentiel). */
export const journalFood = ref => CIQUAL[ref] || (FOOD[ref]?.n ? { code: ref, nom: FOOD[ref].nom, groupe: '', n: FOOD[ref].n } : null);

/** Apports d'une entrée du journal. Une valeur non mesurée dans CIQUAL compte pour zéro. */
export function entryVector(e, _foods, recipes) {
  if (e.kind === 'food') {
    const f = journalFood(e.ref);
    return f ? f.n.map(v => ((v || 0) * e.qty) / 100) : new Array(11).fill(0);
  }
  const r = recipes[e.ref];
  return r ? r.n.map(v => v * e.qty) : new Array(11).fill(0);
}
export const sumVectors = vs => vs.reduce((acc, v) => acc.map((x, i) => x + (v[i] || 0)), new Array(11).fill(0));

/* ---------- Dates ---------- */
export const dayKey = d => d.toISOString().slice(0, 10);
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const today = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
export const fmtDay = (d, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => d.toLocaleDateString('fr-FR', opts);

/* ---------- Courses ---------- */
export const AISLES = ['Fruits et légumes', 'Boucherie et poisson', 'Frais', 'Épicerie', 'Boulangerie', 'Autres'];

export function buildShopping(shopping, recipes) {
  const map = new Map();
  const add = (name, qty, unit, aisle, source) => {
    const key = `${norm(name)}|${unit}`;
    const cur = map.get(key) || { key, name, qty: 0, unit, aisle, sources: [] };
    cur.qty += qty;
    if (source && !cur.sources.includes(source)) cur.sources.push(source);
    map.set(key, cur);
  };
  for (const { id, portions } of shopping.recipes) {
    const r = recipes[id];
    if (!r) continue;
    for (const i of r.ingredients) add(i.name, (i.qty * portions) / r.portions, i.unit, i.aisle, r.name);
  }
  for (const m of shopping.manual) add(m.name, m.qty, m.unit, m.aisle, m.base ? 'Toujours acheter' : 'Ajout manuel');
  const removed = shopping.removed || [];
  const items = [...map.values()].filter(it => !removed.includes(it.key)).map(it => ({ ...it, checked: shopping.checked.includes(it.key) }));
  return AISLES.map(a => ({ aisle: a, items: items.filter(i => i.aisle === a) })).filter(g => g.items.length);
}
