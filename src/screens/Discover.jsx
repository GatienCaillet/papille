import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Compass, Heart, HelpCircle, ThumbsDown, X } from 'lucide-react';
import { useStore } from '../store.jsx';
import { GROUPS } from '../data/foods.js';
import { discoveries, reasonFor } from '../lib/logic.js';
import { FoodTile, Img, PageHeader, Score } from '../components/ui.jsx';

export default function Discover() {
  const { state, answer, opinion, notify } = useStore();
  const list = useMemo(() => discoveries(state), [state]);
  const [selId, setSelId] = useState(null);
  const top = list.slice(0, 3);
  const sel = top.find(d => d.food.id === selId) || top[0];

  const respond = (food, v) => {
    answer(food.id, v);
    notify(v === 'like' ? `${food.name} rejoint « J’aime ».` : v === 'dislike' ? `${food.name} rejoint « Je n’aime pas ».` : `${food.name} : pas encore goûté.`, { to: '/gouts/listes', label: 'Mes listes' });
    setSelId(null);
  };

  return (
    <>
      <PageHeader title="Découvrir" sub="Des aliments que vous n’avez jamais notés, proches de ce que vous aimez, et de quoi les goûter." />

      {top.length === 0 ? (
        <div className="card empty"><Compass size={30} /><b>Plus rien d’inconnu à proposer pour l’instant.</b><span className="small">Swipez de nouveaux aliments ou aimez des plats pour élargir les suggestions.</span><Link to="/gouts" className="btn btn-sm">Swiper</Link></div>
      ) : (
        <>
          <div className="disc-grid" role="list">
            {top.map(d => {
              const on = sel.food.id === d.food.id;
              return (
                <article key={d.food.id} role="listitem" className={`card disc ${on ? 'is-sel' : ''}`}>
                  <button type="button" className="disc-pick" onClick={() => setSelId(d.food.id)} aria-pressed={on}>
                    <FoodTile food={d.food} size={64} />
                    <span className="stack grow" style={{ gap: 2, alignItems: 'flex-start' }}>
                      <span className="row" style={{ gap: 8 }}><span className="h3">{d.food.name}</span><Score value={d.score.total} /></span>
                      <span className="xs muted">{GROUPS[d.food.group].label}</span>
                    </span>
                  </button>
                  <p className="small" style={{ color: 'var(--ink-2)' }}>{reasonFor(d)}</p>
                  <div className="row" style={{ gap: 6 }}>
                    <button type="button" className="btn btn-sm grow" onClick={() => respond(d.food, 'like')}><Heart size={15} /> J’aime</button>
                    <button type="button" className="btn btn-sm grow" onClick={() => respond(d.food, 'dislike')}><X size={15} /> J’aime pas</button>
                    <button type="button" className="btn btn-sm btn-soft btn-icon" title="Pas encore goûté" aria-label="Pas encore goûté" onClick={() => respond(d.food, 'unsure')}><HelpCircle size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="stack" style={{ gap: 14 }}>
            <h2 className="h2">Pour goûter : {sel.food.name.toLowerCase()}</h2>
            <div className="rgrid">
              {sel.recipes.map(({ r, match }) => {
                const op = state.opinions[r.id];
                return (
                  <article key={r.id} className="card rcard">
                    <Link to={`/recettes/${r.id}`} className="rcard-img"><Img id={r.img} alt="" w={480} /><span className="badge badge-on-photo">{r.type}</span></Link>
                    <div className="rcard-body">
                      <Link to={`/recettes/${r.id}`} className="h3">{r.name}</Link>
                      <span className="rcard-meta"><span><Clock size={14} /> {r.time} min</span><span className="match">{match} % pour vous</span></span>
                      <div className="row" style={{ gap: 6, marginTop: 'auto', paddingTop: 8 }}>
                        <button type="button" className="btn btn-sm op-like" aria-pressed={op === 'like'} onClick={() => opinion(r.id, 'like')}><Heart size={14} /> J’aime</button>
                        <button type="button" className="btn btn-sm op-dislike" aria-pressed={op === 'dislike'} onClick={() => opinion(r.id, 'dislike')}><ThumbsDown size={14} /> J’aime pas</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {list.length > 3 && <p className="small muted">{list.length - 3} autres aliments à découvrir après ceux-ci.</p>}
        </>
      )}
    </>
  );
}
