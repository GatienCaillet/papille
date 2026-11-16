import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../store.jsx';
import { FAMILLES, FOODS } from '../data/foods.js';
import { DISLIKE_MAX, LIKE_MIN, UNSURE, foodAllowed, foodFormName, foodScore, formLabel, formsOf, isScore, norm, rkey, splitKey } from '../lib/logic.js';
import { FoodTile, PageHeader, RatingBadge, RatingScale, Score, SearchInput } from '../components/ui.jsx';
import { TasteTabs } from './Swipe.jsx';

const LISTS = [
  ['like', 'J’aime', `${LIKE_MIN} à 10`],
  ['mid', 'Mitigé', `${DISLIKE_MAX + 1} à ${LIKE_MIN - 1}`],
  ['dislike', 'Je n’aime pas', `0 à ${DISLIKE_MAX}`],
  ['unsure', 'Je ne sais pas encore', ''],
  ['unknown', 'Pas encore noté', ''],
];
const listOf = v => (v === UNSURE ? 'unsure' : !isScore(v) ? 'unknown' : v >= LIKE_MIN ? 'like' : v <= DISLIKE_MAX ? 'dislike' : 'mid');
const noteText = v => (isScore(v) ? `${v}/10` : v === UNSURE ? 'je ne sais pas encore' : 'note effacée');

/** Notes d'un aliment : toutes formes confondues, puis forme par forme (cru, cuit, fondu…). */
export function FoodEditor({ food, onRate }) {
  const { state } = useStore();
  const forms = formsOf(food.id);
  const general = state.ratings[food.id];
  return (
    <div className="food-editor">
      <div className="form-rate">
        <header><span className="small b">{forms.length ? 'Toutes les formes' : 'Votre note'}</span><RatingBadge value={general} /></header>
        <RatingScale size="sm" value={general} onChange={v => onRate(food.id, null, v)} label={`Note de ${food.nom.toLowerCase()}`} />
      </div>
      {forms.map(x => {
        const v = state.ratings[rkey(food.id, x.id)];
        return (
          <div key={x.id} className="form-rate">
            <header>
              <span className="small"><b>{x.label}</b> <span className="xs muted">{x.hint}</span></span>
              {v !== undefined ? <RatingBadge value={v} /> : isScore(general) || general === UNSURE ? <span className="xs muted">comme toutes les formes</span> : null}
            </header>
            <RatingScale size="sm" value={v} onChange={nv => onRate(food.id, x.id, nv)} label={`Note de ${food.nom.toLowerCase()}, ${x.label.toLowerCase()}`} />
          </div>
        );
      })}
    </div>
  );
}

function FoodRow({ e, open, onToggle, onRate }) {
  const { food, form, value, s } = e;
  return (
    <li className="food-row">
      <div className="row" style={{ gap: 12 }}>
        <FoodTile food={food} size={38} />
        <button type="button" className="grow food-name" onClick={onToggle} aria-expanded={open}>
          <span className="small b">{foodFormName(food.id, form)}</span>
          <span className="xs muted">{!form && formsOf(food.id).length && value !== undefined ? 'Toutes les formes' : FAMILLES[food.famille]?.label}</span>
        </button>
        {value !== undefined ? <RatingBadge value={value} /> : <Score value={s.total} />}
        <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={onToggle} aria-label="Détail et notes"><ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} /></button>
      </div>
      {open && (
        <div className="score-detail">
          <dl>
            <div><dt>Votre note{form ? ` (${formLabel(food.id, form).toLowerCase()})` : ''}</dt><dd className="num">{s.direct > 0 ? '+' : ''}{s.direct}</dd></div>
            {s.forms !== 0 && <div><dt>Ses autres formes</dt><dd className="num">{s.forms > 0 ? '+' : '−'}{Math.abs(s.forms)}</dd></div>}
            {s.dishes.map(d => <div key={d.name}><dt>Plat noté {d.value}/10 : {d.name}</dt><dd className="num">{d.delta > 0 ? '+' : '−'}{Math.abs(d.delta)}</dd></div>)}
            <div><dt>Famille « {(s.parent || FAMILLES[food.famille]?.label || '').toLowerCase()} »</dt><dd className="num">{s.group > 0 ? '+' : s.group < 0 ? '−' : ''}{Math.abs(s.group)}</dd></div>
            <div><dt>Score</dt><dd className="num">{s.total > 0 ? '+' : ''}{s.total}</dd></div>
          </dl>
          <FoodEditor food={food} onRate={onRate} />
        </div>
      )}
    </li>
  );
}

export default function Tastes() {
  const { state, rate, notify } = useStore();
  const [tab, setTab] = useState('like');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [sel, setSel] = useState(null);
  const [more, setMore] = useState(12);

  // Une ligne par note donnée (« gruyère, fondu ou gratiné : 9/10 »), une ligne par aliment jamais noté
  const entries = useMemo(() => {
    const keysByFood = new Map();
    for (const k of Object.keys(state.ratings)) { const { id } = splitKey(k); (keysByFood.get(id) || keysByFood.set(id, []).get(id)).push(k); }
    const out = [];
    for (const f of FOODS) {
      if (!foodAllowed(f, state.profile)) continue;
      const keys = keysByFood.get(f.id);
      if (!keys) { out.push({ k: f.id, food: f, form: null, value: undefined, list: 'unknown', s: foodScore(f.id, state.ratings, state.opinions) }); continue; }
      for (const k of keys) {
        const { form } = splitKey(k);
        const value = state.ratings[k];
        out.push({ k, food: f, form, value, list: listOf(value), s: foodScore(f.id, state.ratings, state.opinions, form) });
      }
    }
    return out;
  }, [state]);
  const lists = useMemo(() => Object.fromEntries(LISTS.map(([k]) => [k, entries.filter(e => e.list === k).sort((a, b) =>
    k === 'unknown' ? b.s.total - a.s.total : (k === 'dislike' ? (a.value - b.value) : (b.value - a.value)) || (k === 'dislike' ? a.s.total - b.s.total : b.s.total - a.s.total))])), [entries]);
  // Recherche dans les noms et les autres appellations (« patate » trouve la pomme de terre)
  const results = q.trim().length > 1
    ? FOODS.filter(f => foodAllowed(f, state.profile) && [f.nom, ...(f.alias || [])].some(n => norm(n).includes(norm(q))))
      .sort((a, b) => Number(!norm(a.nom).startsWith(norm(q))) - Number(!norm(b.nom).startsWith(norm(q))))
      .slice(0, 6)
    : [];

  const onRate = (id, form, v) => {
    rate(id, form, v);
    notify(`${foodFormName(id, form)} : ${noteText(v)}`);
  };

  const column = ([k, label, range]) => {
    const items = k === 'unknown' ? lists[k].slice(0, more) : lists[k];
    return (
      <section key={k} className={`taste-col card ${k === tab ? 'is-current' : ''}`} aria-label={label}>
        <header className="row between"><h2 className="h3">{label} {range && <span className="xs muted" style={{ fontWeight: 500 }}>{range}</span>}</h2><span className="small muted num">{lists[k].length.toLocaleString('fr-FR')}</span></header>
        {lists[k].length === 0 ? <p className="small muted" style={{ padding: '8px 0' }}>Rien ici pour l’instant.</p> : (
          <ul className="list">
            {items.map(e => <FoodRow key={e.k} e={e} open={open === e.k} onToggle={() => setOpen(open === e.k ? null : e.k)} onRate={onRate} />)}
          </ul>
        )}
        {items.length < lists[k].length && (
          <button type="button" className="btn btn-ghost btn-sm btn-block" style={{ margin: '4px 0 8px' }} onClick={() => setMore(m => m + 30)}>
            Voir 30 de plus <span className="muted">· {(lists[k].length - items.length).toLocaleString('fr-FR')} restants</span>
          </button>
        )}
      </section>
    );
  };

  return (
    <>
      <PageHeader title="Mes goûts" sub="Une note de 0 à 10 par aliment, ou par forme quand ça change tout (le gruyère fondu sur une pizza, pas en morceau). Un plat bien noté fait monter ses ingrédients, et leur famille en profite un peu." />
      <div className="row between row-wrap" style={{ gap: 12 }}>
        <TasteTabs />
        <div className="taste-search">
          <SearchInput value={q} onChange={v => { setQ(v); setSel(null); }} placeholder="Noter un aliment : panais, fenouil…" />
          {results.length > 0 && (
            <ul className="card search-pop">
              {results.map(f => (
                <li key={f.id} className="stack" style={{ gap: 8 }}>
                  <button type="button" className="row" style={{ gap: 10, textAlign: 'left' }} onClick={() => setSel(sel === f.id ? null : f.id)} aria-expanded={sel === f.id}>
                    <FoodTile food={f} size={32} />
                    <span className="grow small"><b>{f.nom}</b> <span className="muted">· {FAMILLES[f.famille]?.label}</span></span>
                    <RatingBadge value={state.ratings[f.id]} empty={formsOf(f.id).length ? `${formsOf(f.id).length} formes` : 'Noter'} />
                  </button>
                  {sel === f.id && <FoodEditor food={f} onRate={onRate} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mobile-only chip-scroll" role="tablist" aria-label="Liste">
        {LISTS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>
            {l} <span className="num" style={{ opacity: .7 }}>{lists[k].length}</span>
          </button>
        ))}
      </div>
      <div className="taste-board">{LISTS.map(column)}</div>
    </>
  );
}
