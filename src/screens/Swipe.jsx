import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, HelpCircle, Undo2 } from 'lucide-react';
import { useStore } from '../store.jsx';
import { BASE_COUNT, FAMILLES, FOOD, FOODS, imageOf, isBase } from '../data/foods.js';
import { RECIPE } from '../data/recipes.js';
import { catalog, foodAllowed, foodFormName, isScore, listFr, rkey, scoreTone, scoreWord, splitKey, UNSURE, usedForms } from '../lib/logic.js';
import { commonsAt, FoodTile, PageHeader, RatingBadge, RatingScale, RecipeVisual, Switch } from '../components/ui.jsx';

export function TasteTabs() {
  return (
    <nav className="seg" aria-label="Mes goûts">
      <NavLink end to="/gouts" className={({ isActive }) => (isActive ? 'on' : '')}>Noter</NavLink>
      <NavLink to="/gouts/listes" className={({ isActive }) => (isActive ? 'on' : '')}>Mes listes</NavLink>
    </nav>
  );
}

// Glissé horizontal : la distance donne la note (court : 7 ou 3, long : 10 ou 0). Vertical : je ne sais pas.
const STEP = 26;
const MIN_X = 52;
const MIN_Y = 100;
const scoreAt = x => 5 + Math.sign(x) * Math.min(5, Math.floor(Math.abs(x) / STEP));
const cardKey = c => (c ? `${c.kind}:${c.ref}:${c.form || ''}` : '');

export default function Swipe() {
  const { state, swipe, undoSwipe } = useStore();
  const [all, setAll] = useState(false);
  const [refine, setRefine] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false, out: null });
  const [pick, setPick] = useState({ key: null, form: undefined });
  const start = useRef(null);

  const { deck, refineCount, rated, pool } = useMemo(() => {
    const { ratings } = state;
    // Aliments : une carte par forme utilisée dans les recettes (gruyère nature, gruyère fondu…),
    // une seule carte pour un aliment qui n'a qu'une forme. Une note générale (« toutes les formes »,
    // ou reprise d'un ancien J'aime) peut ensuite être affinée forme par forme.
    const foods = [];
    const refining = [];
    const poolFoods = FOODS.filter(f => (all || isBase(f)) && foodAllowed(f, state.profile));
    for (const f of poolFoods) {
      const forms = usedForms(f.id);
      if (!forms.length) { if (ratings[f.id] === undefined) foods.push({ kind: 'food', ref: f.id, form: null }); continue; }
      const pending = forms.filter(x => ratings[rkey(f.id, x.id)] === undefined);
      if (!pending.length) continue;
      const pend = pending.map(x => x.id);
      if (ratings[f.id] === undefined) foods.push({ kind: 'food', ref: f.id, form: pend[0], pending: pend });
      else if (forms.length > 1) refining.push({ kind: 'food', ref: f.id, form: pend[0], pending: pend, refine: true });
    }
    // Ordre stable (plat, aliment, plat…) ; ce qui est déjà noté sort du paquet
    const dishes = catalog(state).visible.filter(x => state.opinions[x.r.id] === undefined).map(x => ({ kind: 'dish', ref: x.r.id }));
    const out = [];
    for (let i = 0; i < Math.max(foods.length, dishes.length); i++) {
      if (dishes[i]) out.push(dishes[i]);
      if (foods[i]) out.push(foods[i]);
    }
    const ratedIds = new Set(Object.keys(ratings).map(k => splitKey(k).id));
    return {
      deck: refine && refining.length ? [...refining, ...out] : out,
      refineCount: refining.length,
      rated: poolFoods.filter(f => ratedIds.has(f.id)).length,
      pool: poolFoods.length,
    };
  }, [state, all, refine]);

  const card = deck[0];
  const key = cardKey(card);
  // Forme notée : celle de la carte, ou une autre choisie sous la carte (null : toutes les formes)
  const form = card?.kind === 'food' ? (pick.key === key ? pick.form : card.form) : null;
  // Derrière : la forme suivante du même aliment s'il en reste une, sinon la carte suivante
  const nextForm = card?.kind === 'food' && form && card.pending?.find(x => x !== form);
  const next = nextForm ? { ...card, form: nextForm } : deck[1];
  const forms = card?.kind === 'food' ? usedForms(card.ref) : [];

  const commit = useCallback(value => {
    if (!card || drag.out) return;
    const dir = value === UNSURE ? { x: 0, y: -700 } : { x: value >= 5 ? 600 : -600, y: 40 };
    setDrag({ ...dir, active: false, out: value });
    const target = card.kind === 'food' ? { kind: 'food', ref: card.ref, form } : card;
    setTimeout(() => { swipe(target, value); setDrag({ x: 0, y: 0, active: false, out: null }); }, 260);
  }, [card, drag.out, swipe, form]);

  useEffect(() => {
    const onKey = e => {
      if (e.target?.closest?.('input, textarea, select, button')) return;
      if (/^[0-9]$/.test(e.key)) commit(Number(e.key));
      else if (e.key === 'ArrowRight') commit(8);
      else if (e.key === 'ArrowLeft') commit(2);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); commit(UNSURE); }
      else if (e.key === 'Backspace') undoSwipe();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commit, undoSwipe]);

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
    if (Math.abs(x) >= MIN_X && Math.abs(x) >= Math.abs(y)) commit(scoreAt(x));
    else if (Math.abs(y) > MIN_Y) commit(UNSURE);
    else setDrag({ x: 0, y: 0, active: false, out: null });
  };

  // Ce que le geste en cours donnerait
  const preview = drag.out ?? (Math.abs(drag.x) >= STEP && Math.abs(drag.x) >= Math.abs(drag.y) ? scoreAt(drag.x) : Math.abs(drag.y) > 50 ? UNSURE : null);
  const intent = preview === null ? null : preview === UNSURE ? 'unsure' : preview > 5 ? 'like' : preview < 5 ? 'dislike' : 'mid';
  const strength = Math.min(1, Math.max(Math.abs(drag.x) / (STEP * 5), Math.abs(drag.y) / MIN_Y));

  const last = state.swipeLog.slice(-5).reverse();

  return (
    <>
      <PageHeader title="Notez vos goûts" sub="De 0 à 10, à l’instinct. Un aliment peut avoir une note par forme : cru, cuit, fondu…" />
      <div className="row between row-wrap" style={{ gap: 12 }}>
        <TasteTabs />
      </div>

      <div className="swipe-layout">
        <section className="swipe-stage">
          <div className="card card-pad deck-progress">
            <div className="row between row-wrap small" style={{ gap: 8 }}>
              <span><b>{all ? 'Tous les aliments' : `Les ${BASE_COUNT} de base`}</b> · <span className="num">{rated}</span> notés sur <span className="num">{pool.toLocaleString('fr-FR')}</span></span>
              <Switch checked={all} onChange={setAll}>Tous ({FOODS.length.toLocaleString('fr-FR')})</Switch>
            </div>
            <span className="bar c-brand"><i style={{ width: `${(rated / Math.max(1, pool)) * 100}%` }} /></span>
            {refineCount > 0 && (
              <div className="row between row-wrap small" style={{ gap: 8 }}>
                <span className="muted">{refineCount} aliment{refineCount > 1 ? 's' : ''} noté{refineCount > 1 ? 's' : ''} toutes formes confondues</span>
                <Switch checked={refine} onChange={setRefine}>Affiner par forme</Switch>
              </div>
            )}
          </div>

          <div className="deck" aria-live="polite">
            {next && <SwipeCard item={next} behind />}
            {card ? (
              <div
                key={key}
                className={`swipe-card card ${drag.active ? 'is-drag' : ''} ${intent ? `intent-${intent}` : ''}`}
                style={{ transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 18}deg)`, '--s': strength }}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
                onDragStart={e => e.preventDefault()}
              >
                <SwipeCard item={card} form={form} ratings={state.ratings} />
                {preview !== null && (
                  <span className={`stamp stamp-${intent}`}>
                    {preview === UNSURE ? 'Je ne sais pas encore' : <><b className="num">{preview}</b><span>/10 · {scoreWord(preview)}</span></>}
                  </span>
                )}
              </div>
            ) : (
              <div className="card empty swipe-card" style={{ position: 'relative' }}>
                <Heart size={28} />
                <b>Tout est noté ici.</b>
                <span className="small">Activez « Tous » pour continuer{refineCount ? ', ou « Affiner par forme »' : ''}, ou notez un aliment depuis vos listes.</span>
              </div>
            )}
          </div>

          {card?.kind === 'food' && forms.length > 0 && (
            <div className="form-pick" role="group" aria-label="Forme notée">
              <span className="xs muted">Vous notez :</span>
              {forms.map(x => (
                <button key={x.id} type="button" className="chip chip-sm" aria-pressed={form === x.id} onClick={() => setPick({ key, form: x.id })}>{x.label}</button>
              ))}
              <button type="button" className="chip chip-sm" aria-pressed={form === null} onClick={() => setPick({ key, form: null })}>Toutes les formes</button>
            </div>
          )}

          <RatingScale size="lg" value={null} onChange={v => v !== null && commit(v)} disabled={!card} label="Votre note" />
          <div className="swipe-labels small"><span>0 · je n’aime pas</span><span>10 · j’adore</span></div>

          <div className="swipe-actions">
            <button type="button" className="btn" onClick={() => commit(UNSURE)} disabled={!card}><HelpCircle size={17} /> Je ne sais pas encore</button>
            <button type="button" className="btn btn-soft" onClick={undoSwipe} disabled={!state.swipeLog.length}><Undo2 size={15} /> Annuler</button>
          </div>
          <p className="swipe-hint small muted">Glissez à droite pour une bonne note, à gauche pour une mauvaise : plus vous allez loin, plus elle est forte. En haut ou en bas : je ne sais pas encore. Au clavier : chiffres 0 à 9, flèches.</p>
        </section>

        <aside className="card card-pad stack swipe-side">
          <h2>Dernières notes</h2>
          {last.length === 0 && <p className="small muted">Vos notes apparaîtront ici, avec leur effet sur vos goûts.</p>}
          <ul className="list">
            {last.map((l, i) => {
              const name = l.card.kind === 'food' ? foodFormName(l.card.ref, l.card.form) : RECIPE[l.card.ref]?.name;
              const delta = isScore(l.value) ? Math.round((l.value - 5) * 1.6) : 0;
              return (
                <li key={i} className="last-row">
                  <div className="row between" style={{ gap: 8 }}><span className="small b">{name}</span><RatingBadge value={l.value} /></div>
                  {l.card.kind === 'dish' && delta !== 0 && (
                    <span className="xs muted">{delta > 0 ? '+' : '−'}{Math.abs(delta)} sur {listFr((RECIPE[l.card.ref]?.main || []).map(m => FOOD[m]?.nom.toLowerCase()).filter(Boolean))}</span>
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

function SwipeCard({ item, behind, form, ratings }) {
  if (behind) return <div className="swipe-card card is-behind" aria-hidden="true"><SwipeCard item={item} form={item.form} /></div>;
  if (item.kind === 'dish') {
    const r = RECIPE[item.ref];
    return (
      <>
        <div className="sc-media"><RecipeVisual r={r} eager /></div>
        <div className="sc-body">
          <span className="row" style={{ gap: 6 }}><span className="badge badge-brand">Plat</span><span className="xs muted">{r.origin}</span></span>
          <span className="sc-title">{r.name}</span>
          <span className="small muted">{r.ingredients.filter(i => !i.optional).slice(0, 4).map(i => i.name.toLowerCase()).join(', ')}</span>
        </div>
      </>
    );
  }
  const f = FOOD[item.ref];
  const img = imageOf(f.id);
  const x = usedForms(f.id).find(u => u.id === form);
  const general = ratings?.[f.id];
  return (
    <>
      {img
        ? <div className="sc-media"><img src={commonsAt(img, 640)} alt={f.nom} loading="eager" decoding="async" draggable="false" /></div>
        : <div className="sc-media sc-food" style={{ background: `var(--g-${FAMILLES[f.famille]?.tint || 'legume'})` }}><FoodTile food={f} size={132} /></div>}
      <div className="sc-body">
        <span className="row" style={{ gap: 6 }}><span className="badge">Aliment</span><span className="xs muted">{FAMILLES[f.famille]?.label}</span></span>
        <span className="sc-title">{f.nom}{x && <span className="sc-form"> · {x.label.toLowerCase()}</span>}</span>
        <span className="small muted">
          {x ? x.hint : form === null && usedForms(f.id).length ? 'Toutes les formes à la fois' : FOOD[f.parent] ? `Famille : ${FOOD[f.parent].nom.toLowerCase()}` : ' '}
          {item.refine && general !== undefined && <> · note générale : <b className={`t-${scoreTone(general)}`}>{isScore(general) ? `${general}/10` : 'je ne sais pas'}</b></>}
        </span>
      </div>
    </>
  );
}
