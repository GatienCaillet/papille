import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Compass, ExternalLink, Flame, FlaskConical, Heart, NotebookPen, ShieldCheck, ShoppingBasket, Sparkles, ThumbsDown, Trash2, TriangleAlert } from 'lucide-react';
import { useStore } from '../store.jsx';
import { RECIPE } from '../data/recipes.js';
import { FOOD } from '../data/foods.js';
import { checkRecipe, dayKey, fmt, fmtQty, listFr, needs, NUTRIENTS, recipeMatch, today } from '../lib/logic.js';
import { RecipeVisual, recipeImage, Stepper } from '../components/ui.jsx';

function Mark({ ing, answers }) {
  const foods = ing.foods || [];
  if (!foods.length) return <span className="badge badge-bad"><TriangleAlert size={12} /> non vérifiable</span>;
  if (foods.length === 1 && FOOD[foods[0]]?.composants) return <span className="badge badge-brand">composé, vérifié</span>;
  const a = foods.map(f => answers[f]).find(Boolean);
  if (a === 'like') return <span className="badge badge-ok"><Heart size={11} /> aimé</span>;
  if (a === 'unsure') return <span className="badge badge-warn">pas sûr</span>;
  if (foods.length === 1 && FOOD[foods[0]] && !FOOD[foods[0]].categorie && !a) return <span className="badge">inconnu</span>;
  return null;
}

const contents = ing => {
  const f = ing.foods?.length === 1 ? FOOD[ing.foods[0]] : null;
  return f?.composants?.length ? f.composants.map(c => FOOD[c]?.nom.toLowerCase() || c).join(', ') : null;
};

export default function RecipeDetail() {
  const { id } = useParams();
  const { state, opinion, addEntry, addRecipeToShopping, removeImported, notify } = useStore();
  const nav = useNavigate();
  const r = RECIPE[id];
  const [portions, setPortions] = useState(r?.portions ?? 2);
  if (!r) return <div className="card empty"><b>Cette recette n’existe pas.</b><Link className="btn btn-sm" to="/recettes">Retour aux recettes</Link></div>;

  const check = checkRecipe(r, state.profile);
  const match = recipeMatch(r, state.answers, state.opinions);
  const ref = needs(state.profile);
  const op = state.opinions[r.id];
  const k = portions / r.portions;
  const wiki = /wikibooks/.test(r.source.url || '');
  const img = recipeImage(r);

  const setOp = v => {
    opinion(r.id, v);
    if (op !== v) notify(v === 'like' ? `Noté : vous aimez. ${listFr(r.main.map(m => FOOD[m]?.nom.toLowerCase()).filter(Boolean))} montent.` : 'Noté : vous n’aimez pas ce plat.');
  };

  const safety = !check.safe ? (
    <div className="alert alert-bad" role="alert">
      <TriangleAlert size={20} />
      <div><b>Exclue par votre profil.</b><ul>{check.reasons.map((x, i) => <li key={i}>{x.kind} « {x.label} » : {x.where}</li>)}</ul></div>
    </div>
  ) : check.unverifiable ? (
    <div className="alert alert-bad" role="alert">
      <TriangleAlert size={20} />
      <div><b>Impossible à vérifier.</b> {check.why}. Précisez l’ingrédient avant de cuisiner ; cette recette reste masquée par défaut.</div>
    </div>
  ) : (
    <div className="alert alert-ok">
      <ShieldCheck size={20} />
      <div>
        <b>Vérifiée pour votre profil.</b> {r.ingredients.length} lignes d’ingrédients{check.composed.length ? `, dont ${check.composed.length} composée${check.composed.length > 1 ? 's' : ''} décomposée${check.composed.length > 1 ? 's' : ''}` : ''}.
        {(state.profile.allergens.length + state.profile.regimes.length + state.profile.forbidden.length) > 0
          ? <> Rien de : {listFr([...state.profile.allergens, ...state.profile.regimes, ...state.profile.forbidden].map(x => x.toLowerCase()))}.</>
          : <> Votre profil ne contient encore ni allergie, ni régime, ni interdit.</>}
      </div>
    </div>
  );

  const actions = (
    <div className="row row-wrap" style={{ gap: 8 }}>
      <button type="button" className="btn btn-primary" disabled={!check.safe}
        onClick={() => { addEntry(dayKey(today()), { kind: 'recipe', ref: r.id, qty: 1 }); notify('1 portion ajoutée au journal d’aujourd’hui.', { to: '/journal', label: 'Voir' }); }}>
        <NotebookPen size={17} /> Ajouter au journal
      </button>
      <button type="button" className="btn" disabled={!check.safe}
        onClick={() => { addRecipeToShopping(r.id, portions); notify(`Ingrédients pour ${portions} portions ajoutés.`, { to: '/courses', label: 'Voir la liste' }); }}>
        <ShoppingBasket size={17} /> Aux courses
      </button>
    </div>
  );

  return (
    <>
      <Link to="/recettes" className="back small"><ArrowLeft size={16} /> Recettes</Link>

      <div className="rd-top">
        <div className="rd-img">
          <RecipeVisual r={r} full eager />
          {img?.kind === 'ingredient' && <span className="badge badge-on-photo rd-img-note">Illustration : {img.food.nom.toLowerCase()}, ingrédient principal</span>}
        </div>
        <div className="stack" style={{ gap: 16 }}>
          <div className="row row-wrap" style={{ gap: 6 }}>
            <span className="badge badge-brand">{r.type}</span>
            {r.origin !== 'Non précisée' && <span className="badge">{r.origin}</span>}
            {r.generated && <span className="badge badge-warn"><FlaskConical size={12} /> pas encore testée</span>}
            {r.imported && <span className="badge">{r.imported === 'manual' ? 'Saisie par vous' : 'Importée'}</span>}
          </div>
          <h1 className="rd-title">{r.name}</h1>
          {r.source.url ? (
            <a className="small muted row" style={{ gap: 4 }} href={r.source.url} target="_blank" rel="noreferrer">
              {wiki ? 'Livre de cuisine, Wikibooks' : r.imported ? r.source.authors : 'Recette rédigée pour Bouchée'} <ExternalLink size={13} />
            </a>
          ) : <span className="small muted">{r.source.authors === 'Papille' ? 'Recette de base rédigée pour Papille' : 'Recette personnelle'}</span>}
          <div className="rd-stats">
            <div><Clock size={17} /><b className="num">{r.time ? `${r.time} min` : '—'}</b><span>au total</span></div>
            <div><Flame size={17} /><b className="num">{r.nutritionUnsure ? '—' : `${Math.round(r.n[0])} kcal`}</b><span>par portion (estimé)</span></div>
            <div><Sparkles size={17} /><b className="num">{match} %</b><span>pour vous</span></div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span className="small muted">Votre avis</span>
            <button type="button" className="btn btn-sm op-like" aria-pressed={op === 'like'} onClick={() => setOp('like')}><Heart size={15} /> J’aime</button>
            <button type="button" className="btn btn-sm op-dislike" aria-pressed={op === 'dislike'} onClick={() => setOp('dislike')}><ThumbsDown size={15} /> J’aime pas</button>
          </div>
          {safety}
          {r.discovery && (
            <div className="alert alert-disc">
              <Compass size={20} />
              <div><b>Parcours découverte : {FOOD[r.discovery.aliment]?.nom.toLowerCase() || r.discovery.aliment}{r.discovery.niveau ? `, niveau ${r.discovery.niveau} sur 5` : ''}.</b> {r.discovery.pourquoi || r.discovery.conseil}</div>
            </div>
          )}
          {actions}
        </div>
      </div>

      <section className="card card-pad rd-body">
        <div className="row between row-wrap" style={{ gap: 12 }}>
          <h2>Pour <span className="num">{portions}</span> portion{portions > 1 ? 's' : ''}</h2>
          <Stepper label="Portions" value={portions} onChange={setPortions} min={1} max={24} />
        </div>
        <div className="rd-cols">
          <div>
            <h3 className="rd-sub">Ingrédients</h3>
            <ul className="list">
              {r.ingredients.map((i, n) => (
                <li key={n} className="ing">
                  <div className="row between" style={{ gap: 10 }}>
                    <span className="row row-wrap" style={{ gap: 8 }}>{i.name}{i.optional && <span className="xs muted">(facultatif)</span>} <Mark ing={i} answers={state.answers} /></span>
                    {i.qty != null && <span className="small muted num nowrap">{fmtQty(i.qty * k, i.unit)}</span>}
                  </div>
                  {contents(i) && <span className="xs muted">Contient : {contents(i)}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="rd-sub">Par portion <span className="muted" style={{ fontWeight: 500 }}>· part de votre besoin</span></h3>
            {r.nutritionUnsure ? (
              <p className="small muted" style={{ padding: '10px 2px' }}>Valeurs non estimables : les portions ou les quantités de la source semblent erronées.</p>
            ) : (
              <>
                <ul className="list">
                  {NUTRIENTS.filter(n => ['kcal', 'prot', 'fib', 'fer', 'mg', 'vitc', 'vitd'].includes(n.key)).map(n => (
                    <li key={n.key} className="row between ing">
                      <span>{n.label}</span>
                      <span className="row" style={{ gap: 14 }}><b className="num small">{fmt(r.n[n.i])} {n.unit}</b><span className="small muted num" style={{ width: 40, textAlign: 'right' }}>{Math.round((r.n[n.i] / ref[n.i]) * 100)} %</span></span>
                    </li>
                  ))}
                </ul>
                <p className="xs muted" style={{ marginTop: 8 }}>
                  Estimé à partir des quantités et de la table Ciqual 2025{r.coverage < 0.7 ? ` ; seules ${Math.round(r.coverage * 100)} % des lignes ont pu être chiffrées, les valeurs sont donc sous-estimées` : ''}.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="stack" style={{ gap: 14 }}>
        <h2 className="h2">Préparation</h2>
        <ol className="steps">
          {r.steps.map((s, i) => <li key={i} className="card"><span className="step-n num">{i + 1}</span><p>{s}</p></li>)}
        </ol>
      </section>

      {r.imported && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}
          onClick={() => { removeImported(r.id); notify(`« ${r.name} » retirée de vos recettes.`); nav('/recettes'); }}>
          <Trash2 size={15} /> Retirer de mes recettes
        </button>
      )}

      <section className="credits xs muted">
        <p>
          <b>Source :</b> {r.source.url ? <a href={r.source.url} target="_blank" rel="noreferrer">{r.source.title}</a> : r.source.title}
          {r.source.history ? <> · <a href={r.source.history} target="_blank" rel="noreferrer">auteurs ({r.source.authors})</a></> : r.source.authors ? ` · ${r.source.authors}` : ''}
          {' '}· licence {r.source.licence}.
          {r.source.changes ? ` ${r.source.changes}` : ''}
        </p>
        {img?.credit && (
          <p><b>{img.kind === 'ingredient' ? 'Illustration' : 'Photo'} :</b> <a href={img.credit.page} target="_blank" rel="noreferrer">{img.credit.author}</a>, {img.credit.licence}, via Wikimedia Commons.</p>
        )}
        {img?.kind === 'own' && (r.imported
          ? <p><b>Photo :</b> {r.photo.l}, affichée depuis la page d’origine.</p>
          : <p><b>Photo :</b> <a href={r.photo.page} target="_blank" rel="noreferrer">{r.photo.a}</a>, {r.photo.l}, via Wikimedia Commons.</p>)}
      </section>
    </>
  );
}
