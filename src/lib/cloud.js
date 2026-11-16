import { supabase } from './supabase.js';
import { rkey, UNSURE } from './logic.js';

// Note : 0 à 10, ou null en base pour « je ne sais pas encore » (migration 20261116130902_papille_ratings)
const toScore = v => (v === null || v === undefined ? UNSURE : Number(v));
const toDb = v => (v === UNSURE ? null : v);
const num = v => (v === null || v === undefined ? '' : Number(v));

/** Charge toutes les données d'un utilisateur et les met au format du store. */
export async function loadUserData(userId) {
  const q = t => supabase.from(t).select('*').eq('user_id', userId);
  const [profile, ratings, opinions, journal, shopRecipes, shopItems, shopState, always, imported] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    q('food_ratings'), q('recipe_ratings'),
    q('journal_entries').order('created_at'),
    q('shopping_recipes'), q('shopping_items').order('created_at'),
    supabase.from('shopping_state').select('*').eq('user_id', userId).maybeSingle(),
    q('always_buy').order('created_at'),
    q('user_recipes').order('created_at', { ascending: false }),
  ]);
  const failed = [profile, ratings, opinions, journal, shopRecipes, shopItems, shopState, always, imported].find(r => r.error);
  if (failed) throw failed.error;

  const p = profile.data || {};
  const byDay = {};
  for (const e of journal.data) (byDay[e.day] ||= []).push({ id: e.id, kind: e.kind, ref: e.ref, qty: Number(e.qty) });

  return {
    profile: {
      allergens: p.allergens || [], regimes: p.regimes || [], forbidden: p.forbidden || [],
      age: num(p.age), sex: p.sex || 'F', weight: num(p.weight), height: num(p.height), activity: p.activity || 'mod',
    },
    ratings: Object.fromEntries(ratings.data.map(r => [rkey(r.food_id, r.form || null), toScore(r.score)])),
    opinions: Object.fromEntries(opinions.data.map(r => [r.recipe_id, toScore(r.score)])),
    journal: byDay,
    shopping: {
      recipes: shopRecipes.data.map(r => ({ id: r.recipe_id, portions: Number(r.portions) })),
      manual: shopItems.data.map(r => ({ key: r.id, name: r.name, qty: Number(r.qty), unit: r.unit, aisle: r.aisle, base: r.base })),
      checked: shopState.data?.checked || [],
      removed: shopState.data?.removed || [],
    },
    always: always.data.map(r => ({ id: r.id, name: r.name, qty: Number(r.qty), unit: r.unit, aisle: r.aisle })),
    imported: imported.data.map(r => ({ ...r.recipe, id: r.id })),
  };
}

/* ---------- Écritures (une fonction par changement du store) ---------- */
const check = async p => { const { error } = await p; if (error) throw error; };
const orNull = v => (v === '' || v === undefined ? null : v);

export const cloud = {
  saveProfile: (uid, p) => check(supabase.from('profiles').upsert({
    user_id: uid, allergens: p.allergens, regimes: p.regimes, forbidden: p.forbidden,
    age: orNull(p.age), sex: p.sex, weight: orNull(p.weight), height: orNull(p.height), activity: p.activity, updated_at: new Date().toISOString(),
  })),
  // value null : la note est effacée ; form null : note générale (form = '' en base)
  setRating: (uid, foodId, form, value) => check(value !== null
    ? supabase.from('food_ratings').upsert({ user_id: uid, food_id: foodId, form: form || '', score: toDb(value), updated_at: new Date().toISOString() })
    : supabase.from('food_ratings').delete().eq('user_id', uid).eq('food_id', foodId).eq('form', form || '')),
  setOpinion: (uid, recipeId, value) => check(value !== null
    ? supabase.from('recipe_ratings').upsert({ user_id: uid, recipe_id: recipeId, score: toDb(value), updated_at: new Date().toISOString() })
    : supabase.from('recipe_ratings').delete().eq('user_id', uid).eq('recipe_id', recipeId)),
  addEntry: (uid, day, e) => check(supabase.from('journal_entries').insert({ id: e.id, user_id: uid, day, kind: e.kind, ref: e.ref, qty: e.qty })),
  removeEntry: (uid, id) => check(supabase.from('journal_entries').delete().eq('user_id', uid).eq('id', id)),
  setShoppingRecipe: (uid, recipeId, portions) => check(portions > 0
    ? supabase.from('shopping_recipes').upsert({ user_id: uid, recipe_id: recipeId, portions })
    : supabase.from('shopping_recipes').delete().eq('user_id', uid).eq('recipe_id', recipeId)),
  addItems: (uid, items) => check(supabase.from('shopping_items').insert(items.map(i => ({ id: i.key, user_id: uid, name: i.name, qty: i.qty, unit: i.unit, aisle: i.aisle, base: !!i.base })))),
  removeItems: (uid, ids) => (ids.length ? check(supabase.from('shopping_items').delete().eq('user_id', uid).in('id', ids)) : Promise.resolve()),
  saveShoppingState: (uid, s) => check(supabase.from('shopping_state').upsert({ user_id: uid, checked: s.checked, removed: s.removed || [] })),
  addAlways: (uid, a) => check(supabase.from('always_buy').insert({ id: a.id, user_id: uid, name: a.name, qty: a.qty, unit: a.unit, aisle: a.aisle })),
  removeAlways: (uid, id) => check(supabase.from('always_buy').delete().eq('user_id', uid).eq('id', id)),
  addRecipe: (uid, r) => check(supabase.from('user_recipes').insert({ id: r.id, user_id: uid, source_url: r.source?.url || null, recipe: r })),
  removeRecipe: (uid, id) => check(supabase.from('user_recipes').delete().eq('user_id', uid).eq('id', id)),
};
