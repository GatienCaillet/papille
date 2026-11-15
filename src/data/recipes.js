// Recettes : catalogue Bouchée (Wikibooks, CC BY-SA ; recettes rédigées pour Bouchée, CC BY-SA 4.0),
// converties par scripts/build-recipes.mjs dans public/data/recettes.json.

const BASE = import.meta.env.BASE_URL;

/** Photo Unsplash (écran de connexion uniquement) */
export const photo = (id, w = 800) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

export const TYPE_ORDER = ['Plat', 'Entrée', 'Salade', 'Soupe', 'Accompagnement', 'Dessert', 'Sauce et base'];

// Liaisons vivantes, remplies par loadRecipes() avant le premier rendu
export let RECIPES = [];
export let RECIPE = {};
export let TYPES = [];
export let ORIGINS = [];
export let LICENCE = '';

export async function loadRecipes() {
  const res = await fetch(`${BASE}data/recettes.json`);
  if (!res.ok) throw new Error(`Recettes introuvables (${res.status})`);
  const data = await res.json();
  LICENCE = data.licence;
  RECIPES = data.recettes.map(r => ({
    id: r.id,
    name: r.name,
    portions: r.portions,
    time: r.time,
    type: r.type,
    origin: r.origin,
    main: r.main,
    n: r.n,
    nutritionUnsure: !!r.nko,
    coverage: r.cov,
    ingredients: r.ing.map(i => ({ name: i.t, foods: i.f, food: i.f[0], qty: i.q ?? null, unit: i.u || '', aisle: i.a, optional: !!i.opt, confidence: i.c ?? 1 })),
    steps: r.steps,
    source: { title: r.src.t, url: r.src.u, history: r.src.h, authors: r.src.a, licence: r.src.l, changes: r.src.m },
    generated: !!r.gen,
    photo: r.photo || null,
    discovery: r.disc || null,
  }));
  RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));
  const types = new Set(RECIPES.map(r => r.type));
  TYPES = TYPE_ORDER.filter(t => types.has(t));
  const counts = RECIPES.reduce((m, r) => ({ ...m, [r.origin]: (m[r.origin] || 0) + 1 }), {});
  ORIGINS = Object.keys(counts).filter(o => o !== 'Non précisée').sort((a, b) => counts[b] - counts[a]);
}

/** Ajoute les recettes importées par l'utilisateur au catalogue (remplace les précédentes). */
let catalogOnly = null;
export function setImported(list = []) {
  if (!catalogOnly) catalogOnly = RECIPES;
  RECIPES = [...list, ...catalogOnly];
  RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));
}

// Avis de départ du profil de démonstration
export const INITIAL_OPINIONS = { 'dahl-de-lentilles-corail': 'like', ratatouille: 'like', 'soupe-au-potiron': 'like' };
