import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { useStore } from '../store.jsx';
import { CIQUAL, FOODS, ciqualTint } from '../data/foods.js';
import { RECIPE } from '../data/recipes.js';
import { addDays, catalog, dayKey, entryVector, fmt, fmtDay, foodAllowed, journalFood, level, needs, norm, NUTRIENTS, profileComplete, sumVectors, today } from '../lib/logic.js';
import { Bar, FoodTile, Img, PageHeader, SearchInput, Segmented, RecipeVisual } from '../components/ui.jsx';
import { useWatch } from '../components/Layout.jsx';

/** Recherche dans toute la table CIQUAL : tous les mots doivent y être ; les noms qui commencent par la saisie d'abord. */
function searchCiqual(q) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const first = words[0];
  return Object.values(CIQUAL)
    .map(c => ({ c, n: norm(c.nom) }))
    .filter(x => words.every(w => x.n.includes(w)))
    .sort((a, b) => Number(!a.n.startsWith(first)) - Number(!b.n.startsWith(first)) || a.n.length - b.n.length)
    .slice(0, 8)
    .map(x => ({ id: x.c.code, name: x.c.nom, ciqual: x.c }));
}

function AddEntry({ day }) {
  const { state, addEntry, notify } = useStore();
  const [kind, setKind] = useState('food');
  const [q, setQ] = useState('');
  const [pick, setPick] = useState(null);
  const [qty, setQty] = useState('');
  const recipes = useMemo(() => catalog(state).visible.map(x => x.r), [state]);
  const results = useMemo(() => {
    if (!q || pick) return [];
    if (kind === 'food') return searchCiqual(q);
    return recipes.filter(r => norm(r.name).includes(norm(q))).slice(0, 5).map(r => ({ id: r.id, name: r.name, recipe: r }));
  }, [q, pick, kind, recipes]);

  const submit = e => {
    e.preventDefault();
    const n = Number(String(qty).replace(',', '.'));
    if (!pick || !n) return;
    addEntry(day, { kind: kind === 'food' ? 'food' : 'recipe', ref: pick.id, qty: n });
    notify(`${pick.name} ajouté${kind === 'food' ? ` (${fmt(n)} g)` : ` (${fmt(n)} portion${n > 1 ? 's' : ''})`}.`);
    setQ(''); setPick(null); setQty('');
  };

  return (
    <form className="card card-pad stack add-entry" onSubmit={submit}>
      <div className="row between row-wrap" style={{ gap: 10 }}>
        <h2>Ajouter</h2>
        <Segmented label="Type d’ajout" value={kind} onChange={v => { setKind(v); setPick(null); setQ(''); setQty(''); }} options={[['food', 'Un aliment'], ['recipe', 'Une recette']]} />
      </div>
      <div className="add-row">
        <div className="grow" style={{ position: 'relative' }}>
          <SearchInput value={pick ? pick.name : q} onChange={v => { setPick(null); setQ(v); }} placeholder={kind === 'food' ? 'Pomme, flocons d’avoine…' : 'Curry, chili…'} />
          {results.length > 0 && (
            <ul className="card search-pop">
              {results.map(o => (
                <li key={o.id}>
                  <button type="button" className="row pop-item" onClick={() => { setPick(o); setQty(kind === 'food' ? '100' : '1'); }}>
                    {o.ciqual ? <FoodTile code={o.ciqual.code} tint={ciqualTint(o.ciqual.groupe)} size={30} /> : <span className="pop-img"><RecipeVisual r={o.recipe} /></span>}
                    <span className="stack" style={{ gap: 0 }}>
                      <span className="small">{o.name}</span>
                      {o.ciqual && <span className="xs muted">{o.ciqual.sousGroupe || o.ciqual.groupe} · {fmt(o.ciqual.n[0] ?? 0)} kcal / 100 g</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className="input-wrap qty">
          <span className="sr-only">Quantité</span>
          <input className="input num" style={{ paddingLeft: 14, paddingRight: 64 }} inputMode="decimal" value={qty} onChange={e => setQty(e.target.value)} placeholder={kind === 'food' ? '150' : '1'} />
          <span className="suffix">{kind === 'food' ? 'g' : 'portion'}</span>
        </label>
        <button className="btn btn-primary" type="submit" disabled={!pick || !qty}><Plus size={17} /> Ajouter</button>
      </div>
    </form>
  );
}

export default function Journal() {
  const { state, removeEntry } = useStore();
  const t = today();
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState('day');
  const day = addDays(t, offset);
  const key = dayKey(day);
  const entries = state.journal[key] || [];
  const ref = needs(state.profile);
  const watch = useWatch();

  const totals = useMemo(() => sumVectors(entries.map(e => entryVector(e, null, RECIPE))), [entries]);
  const week = useMemo(() => {
    const vs = Array.from({ length: 7 }, (_, i) => sumVectors((state.journal[dayKey(addDays(day, -i))] || []).map(e => entryVector(e, null, RECIPE))));
    return sumVectors(vs).map(v => v / 7);
  }, [state.journal, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = view === 'day' ? totals : week;
  const strip = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));

  const kcalPct = Math.round((shown[0] / ref[0]) * 100);
  const suggest = useMemo(() => {
    const recipes = catalog(state).visible;
    return watch.slice(0, 3).map(w => {
      // Aliments courants (présents dans les recettes), sûrs pour le profil et pas « je n'aime pas »
      // (pas les herbes ni les condiments : riches pour 100 g, mais on en mange quelques grammes)
      const ranked = FOODS.filter(f => f.rang && f.n && f.n[w.i] != null && !['herbes-epices', 'condiments-sauces'].includes(f.famille)).filter(f => foodAllowed(f, state.profile) && state.answers[f.id] !== 'dislike').sort((a, b) => b.n[w.i] - a.n[w.i]);
      const best = ranked[0]?.n[w.i] || 0;
      return {
      ...w,
      // seuls les aliments vraiment riches (au moins 20 % du meilleur) sont proposés
      foods: ranked.filter(f => f.n[w.i] > 0 && f.n[w.i] >= best * 0.2).slice(0, 3),
      recipes: [...recipes].sort((a, b) => b.r.n[w.i] - a.r.n[w.i]).slice(0, 2).map(x => x.r),
      };
    });
  }, [watch, state]);

  return (
    <>
      <PageHeader
        title={offset === 0 ? 'Aujourd’hui' : fmtDay(day)}
        sub={offset === 0 ? fmtDay(day) : 'Journal'}
        actions={(
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn btn-sm btn-icon" onClick={() => setOffset(o => o - 1)} aria-label="Jour précédent"><ChevronLeft size={17} /></button>
            <button type="button" className="btn btn-sm" onClick={() => setOffset(0)} disabled={offset === 0}>Aujourd’hui</button>
            <button type="button" className="btn btn-sm btn-icon" onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={offset === 0} aria-label="Jour suivant"><ChevronRight size={17} /></button>
          </div>
        )}
      />

      <div className="days" role="tablist" aria-label="Sept derniers jours">
        {strip.map((d, i) => {
          const o = i - 6;
          const k = dayKey(d);
          const kc = sumVectors((state.journal[k] || []).map(e => entryVector(e, null, RECIPE)))[0];
          return (
            <button key={k} type="button" role="tab" aria-selected={o === offset} className="day" onClick={() => setOffset(o)}>
              <span className="day-w">{d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span>
              <span className="day-n num">{d.getDate()}</span>
              <span className="day-dot" style={{ opacity: kc ? 1 : 0 }} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="journal-grid">
        <div className="stack" style={{ gap: 16 }}>
          <AddEntry day={key} />
          <section className="card">
            <header className="row between card-pad" style={{ paddingBottom: 8 }}>
              <h2>Mangé ce jour</h2>
              <span className="small muted num">{fmt(Math.round(totals[0]))} kcal</span>
            </header>
            {entries.length === 0 ? (
              <div className="empty"><UtensilsCrossed size={26} /><span className="small">Rien de noté pour ce jour.</span></div>
            ) : (
              <ul className="list entries">
                {entries.map(e => {
                  const isFood = e.kind === 'food';
                  const f = isFood ? journalFood(e.ref) : null;
                  const r = isFood ? null : RECIPE[e.ref];
                  const name = isFood ? (f?.nom || `Aliment ${e.ref}`) : (r?.name || 'Recette supprimée');
                  return (
                    <li key={e.id} className="row" style={{ gap: 12 }}>
                      {isFood ? <FoodTile code={e.ref} tint={ciqualTint(f?.groupe)} size={40} /> : <span className="entry-img"><RecipeVisual r={r} /></span>}
                      <span className="stack grow" style={{ gap: 0 }}>
                        <span className="small b">{name}</span>
                        <span className="xs muted num">{isFood ? `${fmt(e.qty)} g` : `${fmt(e.qty)} portion${e.qty > 1 ? 's' : ''}`}</span>
                      </span>
                      <span className="small num">{fmt(Math.round(entryVector(e, null, RECIPE)[0]))} kcal</span>
                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => removeEntry(key, e.id)} aria-label={`Retirer ${name}`}><Trash2 size={15} /></button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <section className="card card-pad stack apports" aria-label="Apports">
          <div className="row between row-wrap" style={{ gap: 10 }}>
            <h2>Apports</h2>
            <Segmented label="Période" value={view} onChange={setView} options={[['day', 'Ce jour'], ['week', 'Moyenne 7 jours']]} />
          </div>
          {!profileComplete(state.profile) && (
            <p className="small" style={{ color: 'var(--warn)' }}>Besoins estimés pour un adulte type. <Link className="link" to="/profil">Complétez votre profil</Link> pour des repères exacts.</p>
          )}
          <div className="kcal">
            <span className="kcal-num num">{fmt(Math.round(shown[0]))}</span>
            <span className="small muted num">sur {fmt(ref[0])} kcal · {kcalPct} %</span>
          </div>
          <Bar pct={kcalPct} tone={level(kcalPct)} />
          <ul className="nutri">
            {NUTRIENTS.slice(1).map(n => {
              const pct = Math.round((shown[n.i] / ref[n.i]) * 100);
              const lv = level(pct);
              return (
                <li key={n.key}>
                  <div className="row between small">
                    <span className="row" style={{ gap: 7 }}><i className={`dot dot-${lv}`} aria-hidden="true" />{n.label}</span>
                    <span className="num"><b>{fmt(Math.round(shown[n.i] * 10) / 10)}</b> <span className="muted">/ {fmt(ref[n.i])} {n.unit}</span></span>
                  </div>
                  <Bar pct={pct} tone={lv} />
                  <span className="sr-only">{pct} % du besoin</span>
                </li>
              );
            })}
          </ul>
          <div className="legend xs"><span><i className="dot dot-bad" /> moins de 70 %</span><span><i className="dot dot-warn" /> 70 à 89 %</span><span><i className="dot dot-ok" /> 90 % et plus</span></div>
          <p className="xs muted">Nutriments : Table Ciqual 2025, Anses (Licence Ouverte). Une valeur non mesurée compte pour zéro.</p>
        </section>
      </div>

      {suggest.length > 0 && (
        <section className="watch" aria-labelledby="watch-h">
          <div className="row between row-wrap" style={{ gap: 8 }}>
            <h2 id="watch-h" className="h2">À surveiller</h2>
            <span className="small muted">Moyenne des 7 derniers jours, sous 70 % du besoin</span>
          </div>
          <div className="watch-grid">
            {suggest.map(w => (
              <article key={w.key} className="card card-pad stack watch-card">
                <div className="row between"><span className="h3">{w.label}</span><span className="badge badge-bad num">{w.pct} %</span></div>
                <span className="xs muted">Aliments</span>
                <div className="row row-wrap" style={{ gap: 6 }}>
                  {w.foods.map(f => <span key={f.id} className="food-pill"><FoodTile food={f} size={22} />{f.nom}</span>)}
                </div>
                <span className="xs muted">Recettes</span>
                <div className="stack" style={{ gap: 6 }}>
                  {w.recipes.map(r => <Link key={r.id} to={`/recettes/${r.id}`} className="small b link">{r.name} <ArrowRight size={13} /></Link>)}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
