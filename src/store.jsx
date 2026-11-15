import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { INITIAL_ANSWERS } from './data/foods.js';
import { INITIAL_OPINIONS } from './data/recipes.js';
import { addDays, dayKey, norm, profileValid, today } from './lib/logic.js';
import { frError, supabase } from './lib/supabase.js';
import { cloud, loadUserData } from './lib/cloud.js';

const KEY = 'papille-demo-v1';
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const itemKey = (name, unit) => `${norm(name)}|${unit}`;

/* ---------- Données ---------- */
const EMPTY = {
  profile: { allergens: [], regimes: [], forbidden: [], age: '', sex: 'F', weight: '', height: '', activity: 'mod' },
  answers: {},
  opinions: {},
  swipeLog: [],
  journal: {},
  shopping: { recipes: [], manual: [], checked: [], removed: [] },
  always: [],
};

const F = (ref, qty) => ({ kind: 'food', ref, qty });
const R = (ref, qty) => ({ kind: 'recipe', ref, qty });
const HISTORY = [
  [F('32140', 60), F('19041', 200), R('dahl-de-lentilles-corail', 1.5), F('13039', 150), R('brochettes-de-poulet-marinees-au-yaourt', .5), F('19860', 125)],
  [F('32140', 50), F('19041', 200), R('gratin-de-pates-au-brocoli', 1), F('13039', 150), F('19860', 125)],
  [F('7110', 100), F('22000', 100), R('chili-con-carne', 1), F('13005', 120)],
  [F('32140', 60), F('19041', 250), R('brochettes-de-poulet-marinees-au-yaourt', 1), F('13037', 150), R('risotto-au-citron', 1)],
  [F('7110', 80), F('19860', 125), R('dahl-de-lentilles-corail', 1), F('13039', 150), R('ratatouille', 1)],
  [F('32140', 50), F('19041', 200), R('soupe-au-potiron', 1.5), R('pancake', 1), F('13005', 120)],
  [F('7110', 100), F('22000', 50), R('salade-de-boulgour-aux-pois-chiches', 1), R('gratin-de-pates-au-brocoli', 1)],
];

/** Profil fictif de la démo (sans compte). */
function demoData() {
  const t = today();
  const journal = {};
  HISTORY.forEach((entries, i) => { journal[dayKey(addDays(t, -i))] = entries.map(e => ({ ...e, id: newId() })); });
  return {
    ...EMPTY,
    profile: { allergens: ['Fruits à coque', 'Sésame'], regimes: ['Sans porc'], forbidden: ['Coriandre', 'Kiwi'], age: 29, sex: 'F', weight: 62, height: 168, activity: 'mod' },
    answers: { ...INITIAL_ANSWERS },
    opinions: { ...INITIAL_OPINIONS },
    journal,
    shopping: {
      recipes: [{ id: 'dahl-de-lentilles-corail', portions: 4 }, { id: 'ratatouille', portions: 2 }],
      manual: [{ key: newId(), name: 'Pain complet', qty: 1, unit: '', aisle: 'Boulangerie' }],
      checked: ['oignon|', 'tomates concassees|g'],
      removed: [],
    },
    always: [
      { name: 'Lait demi-écrémé', qty: 2, unit: 'L', aisle: 'Frais' }, { name: 'Œufs', qty: 12, unit: '', aisle: 'Frais' },
      { name: 'Yaourts nature', qty: 8, unit: '', aisle: 'Frais' }, { name: 'Bananes', qty: 6, unit: '', aisle: 'Fruits et légumes' },
      { name: 'Pain complet', qty: 1, unit: '', aisle: 'Boulangerie' }, { name: 'Café moulu', qty: 1, unit: 'paquet', aisle: 'Épicerie' },
    ].map(a => ({ ...a, id: newId() })),
  };
}

function loadDemo() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw), mode: 'demo', user: null };
  } catch (e) { /* stockage indisponible */ }
  // En développement, ?auto ouvre directement la démo (captures d'écran)
  if (import.meta.env.DEV && location.search.includes('auto')) return { ...demoData(), mode: 'demo', user: null };
  return null;
}

/* ---------- Store ---------- */
const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => loadDemo() || { ...EMPTY, mode: null, user: null });
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const ref = useRef(state);
  const profileTimer = useRef(null);

  const commit = useCallback(patch => {
    const next = { ...ref.current, ...(typeof patch === 'function' ? patch(ref.current) : patch) };
    ref.current = next;
    setState(next);
    return next;
  }, []);

  const notify = useCallback((text, action) => setToast({ text, action, k: Date.now() }), []);

  // Écrit dans Supabase quand on est connecté ; rien à faire en démo (localStorage).
  const sync = useCallback((fn) => {
    const s = ref.current;
    if (s.mode !== 'cloud' || !s.user) return;
    fn(s.user.id).catch(e => notify(`Non enregistré. ${frError(e)}`));
  }, [notify]);

  // Démo : sauvegarde locale
  useEffect(() => {
    if (state.mode !== 'demo') return;
    try {
      const { mode, user, ...data } = state;
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* ignoré */ }
  }, [state]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  // Session Supabase : charge les données du compte à la connexion
  useEffect(() => {
    let alive = true;
    const apply = async session => {
      const cur = ref.current;
      if (!session) {
        if (cur.mode === 'cloud') commit({ ...EMPTY, mode: null, user: null });
        if (alive) setReady(true);
        return;
      }
      if (cur.mode === 'cloud' && cur.user?.id === session.user.id) { setReady(true); return; }
      setReady(false);
      try {
        const data = await loadUserData(session.user.id);
        if (!alive) return;
        commit({ ...EMPTY, ...data, mode: 'cloud', user: { id: session.user.id, email: session.user.email } });
      } catch (e) {
        notify(`Impossible de charger vos données. ${frError(e)}`);
      }
      // Retire le ?code=… laissé par le lien de confirmation
      if (location.search.includes('code=')) history.replaceState(null, '', `${location.pathname}${location.hash || '#/recettes'}`);
      if (alive) setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Pas d'appel Supabase directement dans ce rappel : on diffère.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(() => apply(session), 0);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [commit, notify]);

  const actions = useMemo(() => {
    const saveShoppingState = () => sync(uid => cloud.saveShoppingState(uid, ref.current.shopping));
    const setFoodAnswer = (foodId, value) => {
      commit(s => { const answers = { ...s.answers }; if (value) answers[foodId] = value; else delete answers[foodId]; return { answers }; });
      sync(uid => cloud.setAnswer(uid, foodId, value));
    };
    const setRecipeOpinion = (recipeId, value) => {
      commit(s => { const opinions = { ...s.opinions }; if (value) opinions[recipeId] = value; else delete opinions[recipeId]; return { opinions }; });
      sync(uid => cloud.setOpinion(uid, recipeId, value));
    };
    const saveProfileSoon = () => {
      clearTimeout(profileTimer.current);
      profileTimer.current = setTimeout(() => {
        // Valeur en cours de saisie (« 17 » pour 177 cm) : on attend qu'elle soit plausible
        if (profileValid(ref.current.profile)) sync(uid => cloud.saveProfile(uid, ref.current.profile));
      }, 700);
    };

    return {
      /* Compte */
      startDemo: () => { commit({ ...demoData(), mode: 'demo', user: null }); setReady(true); },
      signOut: async () => {
        const mode = ref.current.mode;
        commit({ ...EMPTY, mode: null, user: null });
        if (mode === 'demo') { try { localStorage.removeItem(KEY); } catch (e) { /* ignoré */ } }
        if (mode === 'cloud') await supabase.auth.signOut();
      },
      resetDemo: () => commit({ ...demoData(), mode: 'demo', user: null }),
      notify,

      /* Profil */
      setProfile: patch => { commit(s => ({ profile: { ...s.profile, ...patch } })); saveProfileSoon(); },
      toggleProfile: (field, value) => {
        commit(s => {
          const cur = s.profile[field];
          return { profile: { ...s.profile, [field]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] } };
        });
        saveProfileSoon();
      },

      /* Goûts */
      answer: setFoodAnswer,
      opinion: (recipeId, value) => setRecipeOpinion(recipeId, !value || ref.current.opinions[recipeId] === value ? null : value),
      swipe: (card, value) => {
        const s = ref.current;
        const prev = card.kind === 'food' ? s.answers[card.ref] : s.opinions[card.ref];
        commit({ swipeLog: [...s.swipeLog, { card, value, prev }] });
        if (card.kind === 'food') setFoodAnswer(card.ref, value); else setRecipeOpinion(card.ref, value);
      },
      undoSwipe: () => {
        const s = ref.current;
        const last = s.swipeLog[s.swipeLog.length - 1];
        if (!last) return;
        commit({ swipeLog: s.swipeLog.slice(0, -1) });
        if (last.card.kind === 'food') setFoodAnswer(last.card.ref, last.prev || null); else setRecipeOpinion(last.card.ref, last.prev || null);
      },

      /* Journal */
      addEntry: (day, entry) => {
        const e = { ...entry, id: newId() };
        commit(s => ({ journal: { ...s.journal, [day]: [...(s.journal[day] || []), e] } }));
        sync(uid => cloud.addEntry(uid, day, e));
      },
      removeEntry: (day, entryId) => {
        commit(s => ({ journal: { ...s.journal, [day]: (s.journal[day] || []).filter(e => e.id !== entryId) } }));
        sync(uid => cloud.removeEntry(uid, entryId));
      },

      /* Courses */
      addRecipeToShopping: (recipeId, portions) => {
        const s = ref.current;
        const exists = s.shopping.recipes.find(r => r.id === recipeId);
        const total = (exists?.portions || 0) + portions;
        const recipes = exists ? s.shopping.recipes.map(r => (r.id === recipeId ? { ...r, portions: total } : r)) : [...s.shopping.recipes, { id: recipeId, portions }];
        commit({ shopping: { ...s.shopping, recipes, removed: [] } });
        sync(uid => cloud.setShoppingRecipe(uid, recipeId, total));
        saveShoppingState();
      },
      setShoppingPortions: (recipeId, portions) => {
        commit(s => ({ shopping: { ...s.shopping, recipes: portions <= 0 ? s.shopping.recipes.filter(r => r.id !== recipeId) : s.shopping.recipes.map(r => (r.id === recipeId ? { ...r, portions } : r)) } }));
        sync(uid => cloud.setShoppingRecipe(uid, recipeId, portions));
      },
      addManual: item => {
        const it = { ...item, key: newId() };
        commit(s => ({ shopping: { ...s.shopping, manual: [...s.shopping.manual, it], removed: (s.shopping.removed || []).filter(k => k !== itemKey(it.name, it.unit)) } }));
        sync(uid => cloud.addItems(uid, [it]));
        saveShoppingState();
      },
      addAlways: () => {
        const s = ref.current;
        const items = s.always.map(a => ({ key: newId(), name: a.name, qty: a.qty, unit: a.unit, aisle: a.aisle, base: true }));
        const keys = items.map(i => itemKey(i.name, i.unit));
        commit({ shopping: { ...s.shopping, manual: [...s.shopping.manual, ...items], removed: (s.shopping.removed || []).filter(k => !keys.includes(k)) } });
        sync(uid => cloud.addItems(uid, items));
        saveShoppingState();
      },
      toggleChecked: key => {
        commit(s => {
          const c = s.shopping.checked;
          return { shopping: { ...s.shopping, checked: c.includes(key) ? c.filter(k => k !== key) : [...c, key] } };
        });
        saveShoppingState();
      },
      // Retire les articles cochés : les manuels sont supprimés, ceux des recettes sont masqués.
      clearChecked: () => {
        const s = ref.current;
        const keys = s.shopping.checked;
        const gone = s.shopping.manual.filter(m => keys.includes(itemKey(m.name, m.unit)));
        commit({ shopping: { ...s.shopping, manual: s.shopping.manual.filter(m => !gone.includes(m)), removed: [...(s.shopping.removed || []), ...keys], checked: [] } });
        sync(uid => cloud.removeItems(uid, gone.map(m => m.key)));
        saveShoppingState();
      },
      addAlwaysItem: name => {
        const a = { id: newId(), name, qty: 1, unit: '', aisle: 'Autres' };
        commit(s => ({ always: [...s.always, a] }));
        sync(uid => cloud.addAlways(uid, a));
      },
      removeAlwaysItem: id => {
        commit(s => ({ always: s.always.filter(a => a.id !== id) }));
        sync(uid => cloud.removeAlways(uid, id));
      },
    };
  }, [commit, notify, sync]);

  const value = useMemo(() => ({ state, ready, toast, ...actions }), [state, ready, toast, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
