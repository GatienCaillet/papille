import { useMemo, useState } from 'react';
import { ChevronDown, Heart, HelpCircle, X } from 'lucide-react';
import { useStore } from '../store.jsx';
import { FAMILLES, FOOD, FOODS } from '../data/foods.js';
import { foodAllowed, foodScore, norm } from '../lib/logic.js';
import { FoodTile, PageHeader, Score, SearchInput } from '../components/ui.jsx';
import { TasteTabs } from './Swipe.jsx';

const LISTS = [
  ['like', 'J’aime'],
  ['dislike', 'Je n’aime pas'],
  ['unsure', 'Je ne sais pas'],
  ['unknown', 'Inconnu'],
];

function AnswerButtons({ id, current, onAnswer }) {
  const b = (v, Icon, label, cls) => (
    <button type="button" className={`btn btn-sm btn-icon ${cls}`} aria-pressed={current === v} aria-label={label} title={label} onClick={() => onAnswer(id, current === v ? null : v)}>
      <Icon size={15} />
    </button>
  );
  return (
    <span className="row" style={{ gap: 4 }}>
      {b('like', Heart, 'J’aime', 'ans-like')}
      {b('dislike', X, 'Je n’aime pas', 'ans-dislike')}
      {b('unsure', HelpCircle, 'Je ne sais pas', 'ans-unsure')}
    </span>
  );
}

function FoodRow({ food, s, open, onToggle, onAnswer, current }) {
  return (
    <li className="food-row">
      <div className="row" style={{ gap: 12 }}>
        <FoodTile food={food} size={38} />
        <button type="button" className="grow food-name" onClick={onToggle} aria-expanded={open}>
          <span className="small b">{food.nom}</span>
          <span className="xs muted">{FAMILLES[food.famille]?.label}</span>
        </button>
        <Score value={s.total} />
        <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={onToggle} aria-label="Détail du score"><ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} /></button>
      </div>
      {open && (
        <div className="score-detail">
          <dl>
            <div><dt>Votre réponse</dt><dd className="num">{s.direct > 0 ? '+' : ''}{s.direct}</dd></div>
            {s.dishes.map(d => <div key={d.name}><dt>Plat noté : {d.name}</dt><dd className="num">{d.delta > 0 ? '+' : '−'}{Math.abs(d.delta)}</dd></div>)}
            <div><dt>Famille « {(s.parent || FAMILLES[food.famille]?.label || '').toLowerCase()} »</dt><dd className="num">{s.group > 0 ? '+' : s.group < 0 ? '−' : ''}{Math.abs(s.group)}</dd></div>
          </dl>
          <div className="row between row-wrap" style={{ gap: 8 }}>
            <span className="xs muted">Déplacer vers</span>
            <AnswerButtons id={food.id} current={current} onAnswer={onAnswer} />
          </div>
        </div>
      )}
    </li>
  );
}

export default function Tastes() {
  const { state, answer, notify } = useStore();
  const [tab, setTab] = useState('like');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [more, setMore] = useState(12);

  const scored = useMemo(() => FOODS.filter(f => foodAllowed(f, state.profile)).map(f => ({ food: f, s: foodScore(f.id, state.answers, state.opinions), a: state.answers[f.id] || 'unknown' })), [state]);
  const lists = useMemo(() => Object.fromEntries(LISTS.map(([k]) => [k, scored.filter(x => x.a === k).sort((a, b) => (k === 'dislike' ? a.s.total - b.s.total : b.s.total - a.s.total))])), [scored]);
  // Recherche dans les noms et les autres appellations (« patate » trouve la pomme de terre)
  const results = q.trim().length > 1
    ? scored.filter(x => [x.food.nom, ...(x.food.alias || [])].some(n => norm(n).includes(norm(q))))
      .sort((a, b) => Number(!norm(a.food.nom).startsWith(norm(q))) - Number(!norm(b.food.nom).startsWith(norm(q))))
      .slice(0, 6)
    : [];

  const onAnswer = (id, v) => {
    answer(id, v);
    const name = FOOD[id].nom;
    notify(v ? `${name} → ${LISTS.find(l => l[0] === v)[1]}` : `${name} → Inconnu`);
  };

  const column = ([k, label]) => {
    const items = k === 'unknown' ? lists[k].slice(0, more) : lists[k];
    return (
    <section key={k} className={`taste-col card ${k === tab ? 'is-current' : ''}`} aria-label={label}>
      <header className="row between"><h2 className="h3">{label}</h2><span className="small muted num">{lists[k].length.toLocaleString('fr-FR')}</span></header>
      {lists[k].length === 0 ? <p className="small muted" style={{ padding: '8px 0' }}>Rien ici pour l’instant.</p> : (
        <ul className="list">
          {items.map(x => (
            <FoodRow key={x.food.id} food={x.food} s={x.s} current={state.answers[x.food.id]} open={open === x.food.id} onToggle={() => setOpen(open === x.food.id ? null : x.food.id)} onAnswer={onAnswer} />
          ))}
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
      <PageHeader title="Mes goûts" sub="Quatre listes, un score par aliment. Un plat aimé fait monter ses ingrédients, et leur famille en profite un peu." />
      <div className="row between row-wrap" style={{ gap: 12 }}>
        <TasteTabs />
        <div className="taste-search">
          <SearchInput value={q} onChange={setQ} placeholder="Classer un aliment : panais, fenouil…" />
          {results.length > 0 && (
            <ul className="card search-pop">
              {results.map(x => (
                <li key={x.food.id} className="row" style={{ gap: 10 }}>
                  <FoodTile food={x.food} size={32} />
                  <span className="grow small"><b>{x.food.nom}</b> <span className="muted">· {FAMILLES[x.food.famille]?.label}</span></span>
                  <AnswerButtons id={x.food.id} current={state.answers[x.food.id]} onAnswer={(id, v) => { onAnswer(id, v); setQ(''); }} />
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
