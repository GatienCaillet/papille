import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, HelpCircle, Undo2, X } from 'lucide-react';
import { useStore } from '../store.jsx';
import { BASE_COUNT, FAMILLES, FOOD, FOODS, imageOf, isBase } from '../data/foods.js';
import { RECIPE } from '../data/recipes.js';
import { catalog, foodAllowed, listFr } from '../lib/logic.js';
import { commonsAt, FoodTile, Img, PageHeader, Switch, RecipeVisual } from '../components/ui.jsx';

export function TasteTabs() {
  return (
    <nav className="seg" aria-label="Mes goûts">
      <NavLink end to="/gouts" className={({ isActive }) => (isActive ? 'on' : '')}>Swiper</NavLink>
      <NavLink to="/gouts/listes" className={({ isActive }) => (isActive ? 'on' : '')}>Mes listes</NavLink>
    </nav>
  );
}

const LABEL = { like: 'J’aime', dislike: 'Je n’aime pas', unsure: 'Je ne sais pas' };
const THRESHOLD = 110;

export default function Swipe() {
  const { state, swipe, undoSwipe } = useStore();
  const [all, setAll] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false, out: null });
  const start = useRef(null);

  const deck = useMemo(() => {
    // Ordre stable (plat, aliment, plat…) puis on retire ce qui est déjà noté
    // Base : les 200 ingrédients les plus utilisés dans les recettes ; sinon tout le référentiel
    const foods = FOODS.filter(f => (all || isBase(f)) && foodAllowed(f, state.profile)).map(f => ({ kind: 'food', ref: f.id }));
    const dishes = catalog(state).visible.map(x => ({ kind: 'dish', ref: x.r.id }));
    const out = [];
    for (let i = 0; i < Math.max(foods.length, dishes.length); i++) {
      if (dishes[i]) out.push(dishes[i]);
      if (foods[i]) out.push(foods[i]);
    }
    return out.filter(c => !(c.kind === 'food' ? state.answers[c.ref] : state.opinions[c.ref]));
  }, [state, all]);

  const card = deck[0];
  const next = deck[1];
  const pool = all ? FOODS : FOODS.filter(isBase);
  const rated = pool.filter(f => state.answers[f.id]).length;

  const commit = useCallback(value => {
    if (!card || drag.out) return;
    const dir = value === 'like' ? { x: 600, y: 40 } : value === 'dislike' ? { x: -600, y: 40 } : { x: 0, y: -700 };
    setDrag({ ...dir, active: false, out: value });
    setTimeout(() => { swipe(card, value); setDrag({ x: 0, y: 0, active: false, out: null }); }, 260);
  }, [card, drag.out, swipe]);

  useEffect(() => {
    const onKey = e => {
      if (e.target?.closest?.('input, textarea, select, button')) return;
      if (e.key === 'ArrowRight') commit('like');
      else if (e.key === 'ArrowLeft') commit('dislike');
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); commit('unsure'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commit]);

  const onDown = e => {
    if (drag.out || (e.pointerType === 'mouse' && e.button !== 0)) return;
    start.current = { x: e.clientX, y: e.clientY };
    // Certains navigateurs refusent la capture (pointeur déjà relâché) : le glissé marche quand même
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
    setDrag(d => ({ ...d, active: true }));
  };
  const onMove = e => {
    const s = start.current;
    if (!s) return;
    // Calculé tout de suite : la mise à jour d'état peut passer après le relâchement (start.current déjà vidé)
    const x = e.clientX - s.x, y = e.clientY - s.y;
    setDrag(d => ({ ...d, x, y }));
  };
  const onUp = () => {
    if (!start.current) return;
    start.current = null;
    const { x, y } = drag;
    if (x > THRESHOLD) commit('like');
    else if (x < -THRESHOLD) commit('dislike');
    else if (Math.abs(y) > THRESHOLD) commit('unsure');
    else setDrag({ x: 0, y: 0, active: false, out: null });
  };

  const intent = drag.out || (drag.x > 40 ? 'like' : drag.x < -40 ? 'dislike' : Math.abs(drag.y) > 40 ? 'unsure' : null);
  const strength = Math.min(1, Math.max(Math.abs(drag.x), Math.abs(drag.y)) / THRESHOLD);

  const last = state.swipeLog.slice(-5).reverse();

  return (
    <>
      <PageHeader title="Vous aimez ?" sub="Répondez à l’instinct : chaque réponse affine vos recettes." />
      <div className="row between row-wrap" style={{ gap: 12 }}>
        <TasteTabs />
      </div>

      <div className="swipe-layout">
        <section className="swipe-stage">
          <div className="card card-pad deck-progress">
            <div className="row between small">
              <span><b>{all ? 'Tous les aliments' : `Les ${BASE_COUNT} de base`}</b> · <span className="num">{rated}</span> notés sur <span className="num">{pool.length.toLocaleString('fr-FR')}</span></span>
              <Switch checked={all} onChange={setAll}>Tous ({FOODS.length.toLocaleString('fr-FR')})</Switch>
            </div>
            <span className="bar c-brand"><i style={{ width: `${(rated / pool.length) * 100}%` }} /></span>
          </div>

          <div className="deck" aria-live="polite">
            {next && <SwipeCard item={next} behind />}
            {card ? (
              <div
                className={`swipe-card card ${drag.active ? 'is-drag' : ''} ${intent ? `intent-${intent}` : ''}`}
                style={{ transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 18}deg)`, '--s': strength }}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
                onDragStart={e => e.preventDefault()}
              >
                <SwipeCard item={card} />
                {intent && <span className={`stamp stamp-${intent}`}>{LABEL[intent]}</span>}
              </div>
            ) : (
              <div className="card empty swipe-card" style={{ position: 'relative' }}>
                <Heart size={28} />
                <b>Tout est noté dans la base.</b>
                <span className="small">Activez « Tout CIQUAL » pour continuer, ou ajoutez un aliment depuis vos listes.</span>
              </div>
            )}
          </div>

          <p className="swipe-hint small muted">Glissez à droite si vous aimez, à gauche sinon, en haut ou en bas si vous ne savez pas. Les flèches du clavier marchent aussi.</p>

          <div className="swipe-actions">
            <button type="button" className="round round-bad" onClick={() => commit('dislike')} disabled={!card} aria-label="Je n’aime pas"><X size={26} /></button>
            <button type="button" className="round round-warn" onClick={() => commit('unsure')} disabled={!card} aria-label="Je ne sais pas"><HelpCircle size={24} /></button>
            <button type="button" className="round round-ok" onClick={() => commit('like')} disabled={!card} aria-label="J’aime"><Heart size={26} /></button>
          </div>
          <div className="swipe-labels small"><span>Je n’aime pas</span><span>Je ne sais pas</span><span>J’aime</span></div>
          <button type="button" className="btn btn-soft btn-sm" style={{ alignSelf: 'center' }} onClick={undoSwipe} disabled={!state.swipeLog.length}><Undo2 size={15} /> Annuler la dernière réponse</button>
        </section>

        <aside className="card card-pad stack swipe-side">
          <h2>Dernières réponses</h2>
          {last.length === 0 && <p className="small muted">Vos réponses apparaîtront ici, avec leur effet sur vos goûts.</p>}
          <ul className="list">
            {last.map((l, i) => {
              const name = l.card.kind === 'food' ? FOOD[l.card.ref]?.nom : RECIPE[l.card.ref]?.name;
              const tone = l.value === 'like' ? 'ok' : l.value === 'dislike' ? 'bad' : 'warn';
              return (
                <li key={i} className="last-row">
                  <div className="row between"><span className="small b">{name}</span><span className={`badge badge-${tone}`}>{LABEL[l.value]}</span></div>
                  {l.card.kind === 'dish' && l.value !== 'unsure' && (
                    <span className="xs muted">{l.value === 'like' ? '+8' : '−8'} sur {listFr((RECIPE[l.card.ref]?.main || []).map(m => FOOD[m]?.nom.toLowerCase()).filter(Boolean))}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </>
  );
}

function SwipeCard({ item, behind }) {
  if (behind) return <div className="swipe-card card is-behind" aria-hidden="true"><SwipeCard item={item} /></div>;
  if (item.kind === 'dish') {
    const r = RECIPE[item.ref];
    return (
      <>
        <div className="sc-media"><RecipeVisual r={r} eager /></div>
        <div className="sc-body">
          <span className="row" style={{ gap: 6 }}><span className="badge badge-brand">Plat</span><span className="xs muted">{r.origin}</span></span>
          <span className="sc-title">{r.name}</span>
          <span className="small muted">{r.ingredients.filter(i => !i.optional).slice(0, 4).map(i => i.name.toLowerCase()).join(", ")}</span>
        </div>
      </>
    );
  }
  const f = FOOD[item.ref];
  const img = imageOf(f.id);
  return (
    <>
      {img
        ? <div className="sc-media"><img src={commonsAt(img, 640)} alt={f.nom} loading="eager" decoding="async" draggable="false" /></div>
        : <div className="sc-media sc-food" style={{ background: `var(--g-${FAMILLES[f.famille]?.tint || 'legume'})` }}><FoodTile food={f} size={132} /></div>}
      <div className="sc-body">
        <span className="row" style={{ gap: 6 }}><span className="badge">Aliment</span><span className="xs muted">{FAMILLES[f.famille]?.label}</span></span>
        <span className="sc-title">{f.nom}</span>
        <span className="small muted">{FOOD[f.parent] ? `Famille : ${FOOD[f.parent].nom.toLowerCase()}` : ' '}</span>
      </div>
    </>
  );
}
