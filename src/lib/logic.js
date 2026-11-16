import { ALLERGEN_CODE, CIQUAL, FAMILLES, FOOD, FOODS, allergensOf, descendants, expand, namesOf } from '../data/foods.js';
import { FORM_USE, RECIPE, RECIPES } from '../data/recipes.js';
import { formLabel as formLabelOf, inferForms, modelForms } from './forms.js';

/* ---------- Texte ---------- */
export const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/’/g, "'").trim();
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
export const fmt = n => nf.format(n);
const PLURAL = new Set(['gousse', 'boîte', 'tranche', 'sachet', 'bouquet', 'pincée', 'botte', 'feuille', 'branche', 'brin', 'morceau', 'verre', 'tasse', 'filet', 'pavé', 'boule', 'zeste', 'cuillère', 'poignée', 'barquette', 'tablette', 'rouleau', 'bol', 'paquet']);
const MEASURED = ['g', 'cl', 'ml', 'dl', 'kg', 'L', 'c. à s.', 'c. à c.'];
/** Quantité lisible. `buy` arrondit au-dessus ce qui s'achète à l'unité (1,5 oignon → 2). */
export function fmtQty(qty, unit, buy = false) {
  const measured = MEASURED.includes(unit);
  const q = measured
    ? (unit === 'kg' || unit === 'L' ? Math.round(qty * 10) / 10 : unit.startsWith('c.') ? Math.round(qty * 2) / 2 : Math.round(qty))
    : buy ? Math.ceil(qty - 0.01) : Math.round(qty * 2) / 2;
  const u = unit && PLURAL.has(unit) && q > 1 ? (unit === 'morceau' ? 'morceaux' : `${unit}s`) : unit;
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

/** Vérifie une recette contre le profil, ingrédients composés compris.
 *  - exclue (`safe: false`) : un ingrédient heurte le profil à coup sûr ;
 *  - impossible à vérifier (`unverifiable`) : une ligne vague (« huile ») peut désigner une variante
 *    qui le heurte (huile d'amande douce), ou une ligne n'a pas d'ingrédient reconnu.
 *  `why` explique le doute en une phrase. */
export function checkRecipe(recipe, profile) {
  const reasons = [];
  const doubts = [];
  let unknown = null;
  const seen = new Set();
  const push = (list, h, where) => { const k = `${h.kind}|${h.label}|${where}`; if (!seen.has(k)) { seen.add(k); list.push({ ...h, where }); } };
  for (const ing of recipe.ingredients) {
    const foods = ing.foods || (ing.food ? [ing.food] : []);
    if (!foods.length) { if (!unknown) unknown = ing.name; continue; }
    for (const food of foods) {
      const direct = hits({ name: ing.name, food }, profile);
      for (const h of direct) push(reasons, h, ing.name);
      if (!direct.length && FOOD[food]?.categorie) {
        for (const d of descendants(food)) {
          const hs = hits({ name: FOOD[d].nom, food: d }, profile);
          if (hs.length) { push(doubts, { ...hs[0], variant: FOOD[d].nom.toLowerCase(), category: FOOD[food].nom.toLowerCase() }, ing.name); break; }
        }
      }
    }
  }
  const composed = recipe.ingredients.filter(i => (i.foods || []).some(f => FOOD[f]?.composants));
  const safe = reasons.length === 0;
  const unverifiable = safe && (!!unknown || doubts.length > 0);
  const why = !unverifiable ? null
    : doubts.length ? `« ${cap(doubts[0].category)} » sans précision : peut être ${doubts[0].variant} (${doubts[0].kind.toLowerCase()} ${doubts[0].label.toLowerCase()})`
    : `« ${unknown} » : ingrédient non reconnu`;
  return { safe, reasons, doubts, unverifiable, unknown: unknown || doubts[0]?.where || null, why, composed };
}
const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function foodAllowed(food, profile) {
  return hits({ name: food.nom, food: food.id }, profile).length === 0;
}

/* ---------- Notes (0 à 10) et formes ---------- */
// Une note vaut pour un aliment en général (clé « gruyere ») ou pour une de ses formes
// (« gruyere@fondu »). Valeur : 0 à 10, ou UNSURE (« je ne sais pas encore »).
// La note d'une forme passe avant la note générale ; ni l'une ni l'autre ne touche à la sécurité.
export const UNSURE = 'unsure';
export const LIKE_MIN = 7;     // à partir de 7 : « j'aime »
export const DISLIKE_MAX = 2;  // jusqu'à 2 : « je n'aime pas », les recettes qui en contiennent sont masquées
export const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const isScore = v => typeof v === 'number';
export const rkey = (id, form) => (form ? `${id}@${form}` : id);
export const splitKey = k => { const [id, form = null] = k.split('@'); return { id, form }; };
export function ratingFor(ratings, id, form) {
  if (form) { const v = ratings[rkey(id, form)]; if (v !== undefined) return v; }
  return ratings[id];
}
export const scoreWord = v => (v === UNSURE ? 'Je ne sais pas encore' : !isScore(v) ? 'Pas encore noté'
  : v === 0 ? 'Je déteste' : v <= 2 ? 'Je n’aime pas' : v <= 4 ? 'Bof' : v === 5 ? 'Neutre' : v === 6 ? 'Ça va' : v <= 8 ? 'J’aime' : 'J’adore');
export const scoreTone = v => (v === UNSURE ? 'warn' : !isScore(v) ? '' : v >= LIKE_MIN ? 'ok' : v <= DISLIKE_MAX ? 'bad' : 'mid');
/** Ancien avis (J'aime / J'aime pas / Je ne sais pas) → note. Une note reste telle quelle. */
export const fromLegacy = v => (v === 'like' ? 8 : v === 'dislike' ? 2 : v === 'unsure' ? UNSURE : isScore(v) ? Math.max(0, Math.min(10, Math.round(v))) : undefined);
export const migrateRatings = (obj = {}) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fromLegacy(v)]).filter(([, v]) => v !== undefined));

/** Toutes les formes d'un aliment (modèle de sa famille) ; vide s'il n'en a qu'une. */
export const formsOf = id => modelForms(id, FOOD);
/** Formes à proposer au swipe et dans Découvrir : celles qu'utilise au moins une recette du catalogue. */
export const usedForms = id => formsOf(id).filter(x => FORM_USE[rkey(id, x.id)]);
export const formLabel = (id, form) => formLabelOf(id, form, FOOD);
/** « Gruyère · fondu ou gratiné », ou dans une phrase « gruyère, fondu ou gratiné » (le libellé de la
 *  forme reste à part : « tomate cuit » ne s'accorderait pas). */
export const foodFormName = (id, form, lower = false) => {
  const n = FOOD[id]?.nom || id;
  if (!form) return lower ? n.toLowerCase() : n;
  const l = formLabel(id, form).toLowerCase();
  return lower ? `${n.toLowerCase()}, ${l}` : `${n} · ${l}`;
};

const inferred = new WeakMap();
/** Forme d'un aliment dans une ligne de recette : écrite dans les données, sinon déduite des étapes
 *  (recettes importées). null : l'aliment n'a qu'une forme. */
export function formIn(recipe, ing, id) {
  if (ing.forms) return ing.forms[id] || null;
  let fs = inferred.get(recipe);
  if (!fs) {
    fs = inferForms({ name: recipe.name, type: recipe.type, steps: recipe.steps, lines: recipe.ingredients.map(i => ({ text: i.text || i.name, foods: i.foods || [] })) }, FOOD);
    inferred.set(recipe, fs);
  }
  return fs[recipe.ingredients.indexOf(ing)]?.[id] || null;
}
/** Forme d'un aliment dans une recette (première ligne qui le cite). */
export function mainForm(recipe, id) {
  const ing = recipe.ingredients.find(i => (i.foods || []).includes(id));
  return ing ? formIn(recipe, ing, id) : null;
}
/** Forme d'un aliment caché dans un ingrédient composé (la tomate d'une sauce tomate). */
const hiddenForm = id => { const fs = formsOf(id).map(x => x.id); return fs.includes('mixe') ? 'mixe' : fs.includes('incorpore') ? 'incorpore' : null; };

/** Notes numériques par aliment, toutes formes confondues (pour les familles). */
const byFoodCache = new WeakMap();
function scoresByFood(ratings) {
  let m = byFoodCache.get(ratings);
  if (!m) {
    m = new Map();
    for (const [k, v] of Object.entries(ratings)) if (isScore(v)) { const { id } = splitKey(k); (m.get(id) || m.set(id, []).get(id)).push(v); }
    byFoodCache.set(ratings, m);
  }
  return m;
}
const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
const affinity = v => (v - 5) / 5; // −1 (0/10) à +1 (10/10)

/** Aliment qu'on n'aime sous aucune forme notée (note générale ou toutes ses formes notées 0 à 2). */
export function foodDisliked(ratings, id) {
  const v = [ratings[id], ...formsOf(id).map(x => ratings[rkey(id, x.id)])].filter(isScore);
  return v.length > 0 && v.every(x => x <= DISLIKE_MAX);
}

/* ---------- Goûts ---------- */
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

/** Score d'un aliment (sous une forme) de −100 à +100, et son détail :
 *  - la note (forme, sinon générale) : 0/10 → −60, 5/10 → 0, 10/10 → +60 ;
 *  - les plats notés dont il est un ingrédient principal (jusqu'à ±8 chacun) ;
 *  - sans note pour cette forme, les notes de ses autres formes (jusqu'à ±25) ;
 *  - les aliments de la même famille (jusqu'à ±15). */
export function foodScore(id, ratings, opinions, form = null) {
  const rating = ratingFor(ratings, id, form);
  const direct = isScore(rating) ? Math.round((rating - 5) * 12) : 0;
  const dishes = [];
  // On parcourt les avis (peu nombreux), pas les 1 058 recettes
  for (const [rid, op] of Object.entries(opinions)) {
    const r = RECIPE[rid];
    if (!r || !r.main.includes(id) || !isScore(op) || op === 5) continue;
    dishes.push({ name: r.name, value: op, delta: Math.round((op - 5) * 1.6) });
  }
  const otherForms = isScore(rating) ? [] : formsOf(id).filter(x => x.id !== form && isScore(ratings[rkey(id, x.id)])).map(x => ({ form: x.id, label: x.label, value: ratings[rkey(id, x.id)] }));
  const forms = otherForms.length ? Math.round(avg(otherForms.map(x => affinity(x.value))) * 25) : 0;
  const scores = scoresByFood(ratings);
  const peers = siblings(id).filter(f => f.id !== id && scores.has(f.id)).map(f => ({ nom: f.nom, value: avg(scores.get(f.id)) }));
  const group = peers.length ? Math.round(avg(peers.map(p => affinity(p.value))) * 15) : 0;
  const total = Math.max(-100, Math.min(100, direct + dishes.reduce((s, d) => s + d.delta, 0) + forms + group));
  return { total, rating, direct, dishes, forms, otherForms, group, likedPeers: peers.filter(p => p.value >= LIKE_MIN).map(p => p.nom), parent: FOOD[FOOD[id]?.parent]?.nom };
}

/** « Pour vous », de 0 à 100 %. Chaque ingrédient principal compte avec le score de sa forme dans
 *  la recette (le gruyère d'une pizza compte « fondu »), les autres ingrédients notés comptent moins.
 *  Une note basse pèse une fois et demie plus qu'une note haute : un ingrédient qu'on n'aime pas
 *  gâche plus un plat qu'un ingrédient aimé ne le sauve. Une note donnée au plat lui-même domine. */
export function recipeMatch(recipe, ratings, opinions) {
  const parts = recipe.main.map(id => [foodScore(id, ratings, opinions, mainForm(recipe, id)).total, 1]);
  for (const ing of recipe.ingredients) for (const id of ing.foods || []) {
    if (recipe.main.includes(id)) continue;
    const v = ratingFor(ratings, id, formIn(recipe, ing, id));
    if (isScore(v) && v !== 5) parts.push([(v - 5) * 12, 0.35]);
  }
  let sum = 0, weight = 0;
  for (const [s, w] of parts) { const k = s < 0 ? w * 1.5 : w; sum += s * k; weight += k; }
  let m = 50 + (weight ? sum / weight : 0) * 0.6;
  const op = opinions[recipe.id];
  if (isScore(op)) m = m * 0.4 + op * 10 * 0.6;
  return Math.max(0, Math.min(100, Math.round(m)));
}

/** Aliments notés 0 à 2 (sous la forme où la recette les utilise), y compris cachés dans un
 *  ingrédient composé (sauce tomate → tomate en sauce) ou désignés par leur famille. */
export function dislikedIn(recipe, ratings) {
  const out = new Map();
  for (const ing of recipe.ingredients) for (const id of ing.foods || []) {
    const seen = new Set();
    const visit = (x, form) => {
      if (!x || seen.has(x) || !FOOD[x]) return;
      seen.add(x);
      const v = ratingFor(ratings, x, form);
      if (!FOOD[x].categorie && isScore(v) && v <= DISLIKE_MAX) out.set(rkey(x, form), foodFormName(x, ratings[rkey(x, form)] !== undefined ? form : null));
      visit(FOOD[x].parent, form);
      for (const c of FOOD[x].composants || []) visit(c, hiddenForm(c));
    };
    visit(id, formIn(recipe, ing, id));
  }
  return [...out.values()];
}
export const unknownIn = (recipe, ratings) => [...new Set(recipe.main.filter(f => ratingFor(ratings, f, mainForm(recipe, f)) === undefined))].map(f => FOOD[f]?.nom || f);
export const allLiked = (recipe, ratings) => recipe.main.every(f => { const v = ratingFor(ratings, f, mainForm(recipe, f)); return isScore(v) && v >= LIKE_MIN; });
/** Note qui s'applique à une ligne de recette, et la forme concernée (pour l'affichage). */
export function lineRating(recipe, ing, ratings) {
  for (const id of ing.foods || []) {
    const form = formIn(recipe, ing, id);
    const v = ratingFor(ratings, id, form);
    if (v !== undefined) return { id, form, value: v, specific: !!form && ratings[rkey(id, form)] !== undefined };
  }
  return null;
}

/** Recettes visibles : sûres, sans aliment noté 0 à 2. Mémorisé : recalculé seulement si
 *  le profil, les notes ou les avis changent (1 058 recettes vérifiées à chaque fois). */
let memo = null;
export function catalog(state) {
  const { profile, ratings, opinions } = state;
  if (memo && memo.profile === profile && memo.ratings === ratings && memo.opinions === opinions && memo.recipes === RECIPES) return memo.value;
  const rows = RECIPES.map(r => ({ r, check: checkRecipe(r, profile), disliked: dislikedIn(r, ratings), match: recipeMatch(r, ratings, opinions) }));
  const value = {
    visible: rows.filter(x => x.check.safe && !x.check.unverifiable && x.disliked.length === 0).sort((a, b) => b.match - a.match),
    unverifiable: rows.filter(x => x.check.unverifiable && x.disliked.length === 0),
    excluded: rows.filter(x => !x.check.safe),
    withDisliked: rows.filter(x => x.check.safe && x.disliked.length > 0),
  };
  memo = { profile, ratings, opinions, recipes: RECIPES, value };
  return value;
}

/** Aliments (ou formes d'aliment) pas encore notés, ou marqués « je ne sais pas encore », proches
 *  des goûts, avec des recettes sûres qui les utilisent sous cette forme. Une entrée par aliment :
 *  sa forme la plus prometteuse. Les parcours de découverte du catalogue (niveaux 1 à 5) passent
 *  en premier, puis les recettes où l'aliment est un ingrédient principal. */
export function discoveries(state) {
  const { profile, ratings, opinions } = state;
  const { visible } = catalog(state);
  const byKey = new Map();
  for (const x of visible) {
    const keys = new Set();
    for (const ing of x.r.ingredients) for (const id of ing.foods || []) {
      const form = formIn(x.r, ing, id);
      keys.add(rkey(id, usedForms(id).some(u => u.id === form) ? form : null));
    }
    for (const k of keys) (byKey.get(k) || byKey.set(k, []).get(k)).push(x);
  }
  const rank = (x, id) => (x.r.discovery?.aliment === id ? x.r.discovery.niveau : 10) * 1000 + (x.r.main.includes(id) ? 0 : 500) - x.match;
  const out = [];
  for (const f of FOODS) {
    if (!foodAllowed(f, profile)) continue;
    const forms = usedForms(f.id);
    let best = null;
    for (const form of forms.length ? forms.map(x => x.id) : [null]) {
      const v = ratingFor(ratings, f.id, form);
      if (v !== undefined && v !== UNSURE) continue;
      const recipes = byKey.get(rkey(f.id, form));
      if (!recipes) continue;
      const score = foodScore(f.id, ratings, opinions, form);
      // Un aliment marqué « je ne sais pas » reste proposé tant que rien ne dit qu'on ne l'aimera pas
      if (score.total <= 0 && !(v === UNSURE && score.total === 0)) continue;
      if (!best || score.total > best.score.total) best = { food: f, form, unsure: v === UNSURE, score, recipes };
    }
    if (best) out.push({ ...best, recipes: [...best.recipes].sort((a, b) => rank(a, f.id) - rank(b, f.id)).slice(0, 6) });
  }
  return out.sort((a, b) => b.score.total - a.score.total || Number(b.unsure) - Number(a.unsure));
}

export function reasonFor(d) {
  const liked = d.score.otherForms.filter(x => x.value >= LIKE_MIN);
  if (liked.length) return `Vous aimez déjà ${foodFormName(d.food.id, liked[0].form, true)} (${liked[0].value}/10).`;
  if (d.score.likedPeers.length) return `Même famille que ${listFr(d.score.likedPeers.slice(0, 2).map(n => n.toLowerCase()))}, que vous aimez.`;
  const dishes = d.score.dishes.filter(x => x.delta > 0);
  if (dishes.length) return `Dans ${dishes.length} plat${dishes.length > 1 ? 's' : ''} que vous aimez.`;
  if (d.unsure) return 'Vous ne saviez pas encore : voici de quoi goûter sans risque.';
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
    for (const i of r.ingredients) {
      if (i.foods?.length === 1 && i.foods[0] === 'eau') continue;
      // Nom du référentiel quand la ligne désigne un seul aliment : « 2 oignons » et « 1 oignon » fusionnent
      const name = i.foods?.length === 1 && FOOD[i.foods[0]] ? FOOD[i.foods[0]].nom : i.name;
      add(name, ((i.qty ?? 0) * portions) / r.portions, i.unit, i.aisle, r.name);
    }
  }
  for (const m of shopping.manual) add(m.name, m.qty, m.unit, m.aisle, m.base ? 'Toujours acheter' : 'Ajout manuel');
  const removed = shopping.removed || [];
  const items = [...map.values()].filter(it => !removed.includes(it.key)).map(it => ({ ...it, checked: shopping.checked.includes(it.key) }));
  return AISLES.map(a => ({ aisle: a, items: items.filter(i => i.aisle === a) })).filter(g => g.items.length);
}
