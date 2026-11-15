import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { INITIAL_ANSWERS } from './data/foods.js';
import { INITIAL_OPINIONS } from './data/recipes.js';
import { addDays, dayKey, norm, today } from './lib/logic.js';

const KEY = 'papille-maquette-v1';

const F = (ref, qty) => ({ kind: 'food', ref, qty });
const R = (ref, qty) => ({ kind: 'recipe', ref, qty });
const HISTORY = [
  [F('flocons-avoine', 60), F('lait', 200), R('curry', 1.5), F('pomme', 150), R('poulet', .5), F('yaourt', 125)],
  [F('flocons-avoine', 50), F('lait', 200), R('penne', 1), F('pomme', 150), F('yaourt', 125)],
  [F('pain-complet', 100), F('oeuf', 100), R('chili', 1), F('banane', 120)],
  [F('flocons-avoine', 60), F('lait', 250), R('poulet', 1), F('poire', 150), R('risotto', 1)],
  [F('pain-complet', 80), F('yaourt', 125), R('curry', 1), F('pomme', 150), R('ratatouille', 1)],
  [F('flocons-avoine', 50), F('lait', 200), R('veloute', 1.5), R('pancakes', 1), F('banane', 120)],
  [F('pain-complet', 100), F('oeuf', 50), R('bowl', 1), R('penne', 1)],
];

let uid = 0;
const id = () => `${Date.now().toString(36)}${(uid++).toString(36)}`;

function initial() {
  const t = today();
  const journal = {};
  HISTORY.forEach((entries, i) => { journal[dayKey(addDays(t, -i))] = entries.map(e => ({ ...e, id: id() })); });
  return {
    // En développement, ?auto ouvre la maquette déjà connectée (captures d'écran)
    signedIn: import.meta.env.DEV && typeof location !== 'undefined' && location.search.includes('auto'),
    profile: { allergens: ['Fruits à coque', 'Sésame'], regimes: ['Sans porc'], forbidden: ['Coriandre', 'Kiwi'], age: 29, sex: 'F', weight: 62, height: 168, activity: 'mod' },
    answers: { ...INITIAL_ANSWERS },
    opinions: { ...INITIAL_OPINIONS },
    swipeLog: [],
    journal,
    shopping: {
      recipes: [{ id: 'curry', portions: 4 }, { id: 'chili', portions: 2 }],
      manual: [{ key: 'm1', name: 'Pain complet', qty: 1, unit: '', aisle: 'Boulangerie' }],
      checked: ['oignon|', 'tomates concassees|g'],
    },
    always: [
      { name: 'Lait demi-écrémé', qty: 2, unit: 'L', aisle: 'Frais' }, { name: 'Œufs', qty: 12, unit: '', aisle: 'Frais' },
      { name: 'Yaourts nature', qty: 8, unit: '', aisle: 'Frais' }, { name: 'Bananes', qty: 6, unit: '', aisle: 'Fruits et légumes' },
      { name: 'Pain complet', qty: 1, unit: '', aisle: 'Boulangerie' }, { name: 'Café moulu', qty: 1, unit: 'paquet', aisle: 'Épicerie' },
    ],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
  } catch (e) { /* stockage indisponible : on repart de la démo */ }
  return initial();
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(load);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignoré */ }
  }, [state]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const up = useCallback(fn => setState(s => ({ ...s, ...fn(s) })), []);

  const actions = useMemo(() => ({
    signIn: () => up(() => ({ signedIn: true })),
    signOut: () => up(() => ({ signedIn: false })),
    reset: () => setState({ ...initial(), signedIn: true }),
    notify: (text, action) => setToast({ text, action, k: Date.now() }),

    setProfile: patch => up(s => ({ profile: { ...s.profile, ...patch } })),
    toggleProfile: (field, value) => up(s => {
      const cur = s.profile[field];
      return { profile: { ...s.profile, [field]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] } };
    }),

    answer: (foodId, value) => up(s => {
      const answers = { ...s.answers };
      if (value) answers[foodId] = value; else delete answers[foodId];
      return { answers };
    }),
    opinion: (recipeId, value) => up(s => {
      const opinions = { ...s.opinions };
      if (!value || opinions[recipeId] === value) delete opinions[recipeId]; else opinions[recipeId] = value;
      return { opinions };
    }),
    swipe: (card, value) => up(s => {
      const field = card.kind === 'food' ? 'answers' : 'opinions';
      const next = { ...s[field] };
      const prev = next[card.ref];
      next[card.ref] = value;
      return { [field]: next, swipeLog: [...s.swipeLog, { card, value, prev }] };
    }),
    undoSwipe: () => up(s => {
      const last = s.swipeLog[s.swipeLog.length - 1];
      if (!last) return {};
      const field = last.card.kind === 'food' ? 'answers' : 'opinions';
      const next = { ...s[field] };
      if (last.prev) next[last.card.ref] = last.prev; else delete next[last.card.ref];
      return { [field]: next, swipeLog: s.swipeLog.slice(0, -1) };
    }),

    addEntry: (day, entry) => up(s => ({ journal: { ...s.journal, [day]: [...(s.journal[day] || []), { ...entry, id: id() }] } })),
    removeEntry: (day, entryId) => up(s => ({ journal: { ...s.journal, [day]: (s.journal[day] || []).filter(e => e.id !== entryId) } })),

    addRecipeToShopping: (recipeId, portions) => up(s => {
      const exists = s.shopping.recipes.find(r => r.id === recipeId);
      const recipes = exists
        ? s.shopping.recipes.map(r => (r.id === recipeId ? { ...r, portions: r.portions + portions } : r))
        : [...s.shopping.recipes, { id: recipeId, portions }];
      return { shopping: { ...s.shopping, recipes, removed: [] } };
    }),
    setShoppingPortions: (recipeId, portions) => up(s => ({
      shopping: { ...s.shopping, recipes: portions <= 0 ? s.shopping.recipes.filter(r => r.id !== recipeId) : s.shopping.recipes.map(r => (r.id === recipeId ? { ...r, portions } : r)) },
    })),
    addManual: item => up(s => ({
      shopping: { ...s.shopping, manual: [...s.shopping.manual, { ...item, key: id() }], removed: (s.shopping.removed || []).filter(k => k !== `${norm(item.name)}|${item.unit}`) },
    })),
    addAlways: () => up(s => {
      const keys = s.always.map(a => `${norm(a.name)}|${a.unit}`);
      return { shopping: { ...s.shopping, manual: [...s.shopping.manual, ...s.always.map(a => ({ ...a, key: id(), base: true }))], removed: (s.shopping.removed || []).filter(k => !keys.includes(k)) } };
    }),
    toggleChecked: key => up(s => {
      const c = s.shopping.checked;
      return { shopping: { ...s.shopping, checked: c.includes(key) ? c.filter(k => k !== key) : [...c, key] } };
    }),
    // Retire les articles cochés : les manuels disparaissent, ceux des recettes sont masqués.
    clearChecked: () => up(s => {
      const keys = s.shopping.checked;
      return {
        shopping: {
          ...s.shopping,
          manual: s.shopping.manual.filter(m => !keys.includes(`${norm(m.name)}|${m.unit}`)),
          removed: [...(s.shopping.removed || []), ...keys],
          checked: [],
        },
      };
    }),
    setAlways: always => up(() => ({ always })),
  }), [up]);

  const value = useMemo(() => ({ state, ...actions, toast }), [state, actions, toast]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
