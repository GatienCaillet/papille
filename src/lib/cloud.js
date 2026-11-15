import { supabase } from './supabase.js';

const num = v => (v === null || v === undefined ? '' : Number(v));

/** Charge toutes les données d'un utilisateur et les met au format du store. */
export async function loadUserData(userId) {
  const q = t => supabase.from(t).select('*').eq('user_id', userId);
  const [profile, answers, opinions, journal, shopRecipes, shopItems, shopState, always] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    q('food_answers'), q('recipe_opinions'),
    q('journal_entries').order('created_at'),
    q('shopping_recipes'), q('shopping_items').order('created_at'),
    supabase.from('shopping_state').select('*').eq('user_id', userId).maybeSingle(),
    q('always_buy').order('created_at'),
  ]);
  const failed = [profile, answers, opinions, journal, shopRecipes, shopItems, shopState, always].find(r => r.error);
  if (failed) throw failed.error;

  const p = profile.data || {};
  const byDay = {};
  for (const e of journal.data) (byDay[e.day] ||= []).push({ id: e.id, kind: e.kind, ref: e.ref, qty: Number(e.qty) });

  return {
    profile: {
      allergens: p.allergens || [], regimes: p.regimes || [], forbidden: p.forbidden || [],
      age: num(p.age), sex: p.sex || 'F', weight: num(p.weight), height: num(p.height), activity: p.activity || 'mod',
    },
    answers: Object.fromEntries(answers.data.map(r => [r.food_id, r.answer])),
    opinions: Object.fromEntries(opinions.data.map(r => [r.recipe_id, r.opinion])),
    journal: byDay,
    shopping: {
      recipes: shopRecipes.data.map(r => ({ id: r.recipe_id, portions: Number(r.portions) })),
      manual: shopItems.data.map(r => ({ key: r.id, name: r.name, qty: Number(r.qty), unit: r.unit, aisle: r.aisle, base: r.base })),
      checked: shopState.data?.checked || [],
      removed: shopState.data?.removed || [],
    },
    always: always.data.map(r => ({ id: r.id, name: r.name, qty: Number(r.qty), unit: r.unit, aisle: r.aisle })),
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
  setAnswer: (uid, foodId, value) => check(value
    ? supabase.from('food_answers').upsert({ user_id: uid, food_id: foodId, answer: value, updated_at: new Date().toISOString() })
    : supabase.from('food_answers').delete().eq('user_id', uid).eq('food_id', foodId)),
  setOpinion: (uid, recipeId, value) => check(value
    ? supabase.from('recipe_opinions').upsert({ user_id: uid, recipe_id: recipeId, opinion: value, updated_at: new Date().toISOString() })
    : supabase.from('recipe_opinions').delete().eq('user_id', uid).eq('recipe_id', recipeId)),
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
};
