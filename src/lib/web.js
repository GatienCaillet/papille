// Recherche et import de recettes du web, via l'Edge Function Supabase « recettes-web ».

import { supabase } from './supabase.js';
import { FOOD } from '../data/foods.js';
import { aisleOf, parseIngredient } from './parseIngredient.js';

// Jeton public (rôle anon) pour la démo sans compte ; connecté, c'est le jeton de session qui part.
const ANON_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjY2VybnV0Ym51bnZ5ZHBmeWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3NTAyMTIsImV4cCI6MjExMDMyNjIxMn0.TAKbYi7pNzZ3I450y-ZdzUw3fdDz8yM4tyrCr9rdCzs';

export const SEARCH_SITES = [['marmiton.org', 'Marmiton'], ['750g.com', '750g']];
export const READ_SITES = 'Marmiton, 750g, Cuisine AZ, Journal des Femmes ou Ricardo';

async function call(body) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('recettes-web', {
    body,
    headers: session ? undefined : { Authorization: `Bearer ${ANON_JWT}` },
  });
  if (error) {
    // Message d'erreur renvoyé par la fonction, s'il y en a un
    let msg = error.message;
    try { msg = (await error.context?.json())?.error || msg; } catch (e) { /* corps illisible */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export const searchWeb = (q, exclude, sites) => call({ action: 'search', q, exclude, sites });
export const readWeb = url => call({ action: 'read', url }).then(d => d.recipe);

/* ---------- Page lue → recette Papille ---------- */
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function typeOf(category, name) {
  const t = `${norm(category)} ${norm(name)}`;
  if (/dessert|gateau|tarte (aux|au|a la) (pomme|poire|fraise|abricot|chocolat|citron)|biscuit|cookie|crumble|mousse au chocolat|cake sucre|confiserie|patisserie/.test(t)) return 'Dessert';
  if (/soupe|veloute|potage/.test(t)) return 'Soupe';
  if (/salade/.test(t)) return 'Salade';
  if (/entree|aperitif|amuse/.test(t)) return 'Entrée';
  if (/accompagnement|garniture/.test(t)) return 'Accompagnement';
  if (/^sauce|\bsauce\b.*recette de base/.test(t)) return 'Sauce et base';
  return 'Plat';
}
function originOf(cuisine, name) {
  const t = `${norm(cuisine)} ${norm(name)}`;
  if (/ital|lasagne|risotto|pizza|pesto|carbonara|bolognaise/.test(t)) return 'Italienne';
  if (/ind(e|ienne)|curry|dahl|tandoori|masala/.test(t)) return 'Indienne';
  if (/asi|chin|japon|thai|vietnam|wok|soja/.test(t)) return 'Asiatique';
  if (/marocain|maghreb|tajine|couscous|oriental/.test(t)) return 'Maghrébine';
  if (/mexic|chili|tacos/.test(t)) return 'Latino-américaine';
  if (/espagn|paella|tortilla/.test(t)) return 'Espagnole';
  if (/fran|french/.test(t)) return 'Française';
  return 'Non précisée';
}

const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/** Transforme une recette lue (ou saisie) en recette Papille : ingrédients reliés, nutriments estimés. */
export function toRecipe(page, origin = 'web') {
  const lines = page.ingredients.map(parseIngredient);
  const portions = page.yield || 4;
  const total = new Array(11).fill(0);
  let covered = 0;
  const weights = new Map();
  for (const l of lines) {
    const id = l.foods.length === 1 ? l.foods[0] : null;
    const n = id && FOOD[id]?.n;
    if (n && l.grams != null) {
      n.forEach((v, k) => { total[k] += ((v || 0) * l.grams) / 100; });
      covered++;
      weights.set(id, (weights.get(id) || 0) + l.grams);
    } else if (id && ['sel', 'poivre', 'eau'].includes(id)) covered++;
  }
  const solid = [...weights.keys()].filter(id => FOOD[id] && !['herbes-epices', 'matieres-grasses', 'sucres-boissons', 'condiments-sauces'].includes(FOOD[id].famille) && !/^(sel|poivre|eau|sucre|farine)/.test(id));
  const main = solid.sort((a, b) => weights.get(b) - weights.get(a)).slice(0, 3);
  const n = total.map(v => Math.round((v / portions) * 10) / 10);
  const site = page.site || 'saisie';
  return {
    id: `web-${slug(page.name) || 'recette'}-${Date.now().toString(36)}`,
    name: page.name,
    portions,
    time: page.minutes || null,
    type: typeOf(page.category, page.name),
    origin: originOf(page.cuisine, page.name),
    main: main.length ? main : lines.flatMap(l => l.foods).slice(0, 1),
    n,
    nutritionUnsure: n[0] > 1500,
    coverage: lines.length ? covered / lines.length : 0,
    ingredients: lines.map(l => ({ name: l.name, text: l.text, foods: l.foods, food: l.foods[0], qty: l.qty, unit: l.unit, aisle: aisleOf(l.foods[0]), optional: false, confidence: 1 })),
    steps: page.steps || [],
    source: origin === 'web'
      ? { title: page.name, url: page.url, authors: site, licence: `© ${site}, copie pour usage personnel`, changes: `Importée de ${site}.` }
      : { title: page.name, url: null, authors: 'Vous', licence: 'Recette personnelle', changes: 'Saisie dans Papille.' },
    generated: false,
    imported: origin,
    photo: page.image ? { thumb: page.image, full: page.image, page: page.url, a: site, l: `© ${site}` } : null,
    discovery: null,
  };
}
