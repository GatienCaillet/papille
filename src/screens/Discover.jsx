import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Compass } from 'lucide-react';
import { useStore } from '../store.jsx';
import { FAMILLES } from '../data/foods.js';
import { discoveries, foodFormName, formLabel, isScore, reasonFor, UNSURE } from '../lib/logic.js';
import { FoodTile, PageHeader, RatingScale, Score, RecipeVisual } from '../components/ui.jsx';

const dkey = d => `${d.food.id}@${d.form || ''}`;

export default function Discover() {
  const { state, rate, opinion, notify } = useStore();
  const list = useMemo(() => discoveries(state), [state]);
  const [selKey, setSelKey] = useState(null);
  const top = list.slice(0, 3);
  const sel = top.find(d => dkey(d) === selKey) || top[0];

  const respond = (d, v) => {
    if (v === null) return;
    rate(d.food.id, d.form, v);
    const name = foodFormName(d.food.id, d.form);
    notify(isScore(v) ? `${name} : ${v}/10.` : `${name} : pas encore goûté, il reste à découvrir.`, { to: '/gouts/listes', label: 'Mes listes' });
    setSelKey(null);
  };

  return (
    <>
      <PageHeader title="Découvrir" sub="Des aliments, ou des façons de les préparer, que vous n’avez pas encore notés ou pas encore su noter, proches de ce que vous aimez, et de quoi les goûter." />

      {top.length === 0 ? (
        <div className="card empty"><Compass size={30} /><b>Plus rien d’inconnu à proposer pour l’instant.</b><span className="small">Notez de nouveaux aliments ou des plats pour élargir les suggestions.</span><Link to="/gouts" className="btn btn-sm">Noter</Link></div>
      ) : (
        <>
          <div className="disc-grid" role="list">
            {top.map(d => {
              const on = dkey(sel) === dkey(d);
              return (
                <article key={dkey(d)} role="listitem" className={`card disc ${on ? 'is-sel' : ''}`}>
                  <button type="button" className="disc-pick" onClick={() => setSelKey(dkey(d))} aria-pressed={on}>
                    <FoodTile food={d.food} size={64} />
                    <span className="stack grow" style={{ gap: 2, alignItems: 'flex-start' }}>
                      <span className="row row-wrap" style={{ gap: 8 }}><span className="h3">{d.food.nom}</span><Score value={d.score.total} /></span>
                      <span className="xs muted">{d.form ? formLabel(d.food.id, d.form) : FAMILLES[d.food.famille]?.label}{d.unsure ? ' · vous ne saviez pas encore' : ''}</span>
                    </span>
                  </button>
                  <p className="small" style={{ color: 'var(--ink-2)' }}>{reasonFor(d)}</p>
                  <RatingScale size="sm" value={d.unsure ? UNSURE : undefined} onChange={v => respond(d, v ?? UNSURE)} label={`Votre note : ${foodFormName(d.food.id, d.form, true)}`} />
                </article>
              );
            })}
          </div>

          <section className="stack" style={{ gap: 14 }}>
            <h2 className="h2">Pour goûter : {foodFormName(sel.food.id, sel.form, true)}</h2>
            <div className="rgrid">
              {sel.recipes.map(({ r, match }) => (
                <article key={r.id} className="card rcard">
                  <Link to={`/recettes/${r.id}`} className="rcard-img"><RecipeVisual r={r} /><span className="badge badge-on-photo">{r.discovery?.aliment === sel.food.id && r.discovery.niveau ? `Niveau ${r.discovery.niveau} sur 5` : r.type}</span></Link>
                  <div className="rcard-body">
                    <Link to={`/recettes/${r.id}`} className="h3">{r.name}</Link>
                    {r.discovery?.aliment === sel.food.id && r.discovery.pourquoi && <span className="xs muted">{r.discovery.pourquoi}</span>}
                    <span className="rcard-meta">{r.time && <span><Clock size={14} /> {r.time} min</span>}<span className="match">{match} % pour vous</span></span>
                    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                      <span className="xs muted">Votre note du plat</span>
                      <RatingScale size="sm" unsure={false} value={state.opinions[r.id]} onChange={v => opinion(r.id, v)} label={`Note du plat ${r.name}`} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {list.length > 3 && <p className="small muted">{list.length - 3} autres aliments à découvrir après ceux-ci.</p>}
        </>
      )}
    </>
  );
}
