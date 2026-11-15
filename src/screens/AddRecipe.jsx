import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Download, ExternalLink, Link2, Loader2, SearchX, ShieldCheck, TriangleAlert, Users } from 'lucide-react';
import { useStore } from '../store.jsx';
import { FOOD } from '../data/foods.js';
import { checkRecipe, dislikedIn, unknownIn } from '../lib/logic.js';
import { READ_SITES, SEARCH_SITES, readWeb, searchWeb, toRecipe } from '../lib/web.js';
import { Chip, PageHeader, RecipeVisual, SearchInput, Segmented } from '../components/ui.jsx';

// Mots exclus ajoutés à la requête, déduits du profil
const NEG = {
  'Fruits à coque': ['noix', 'noisette', 'amande', 'cajou', 'pistache', 'pécan'], 'Sésame': ['sésame', 'tahini'], 'Arachides': ['cacahuète', 'arachide'],
  'Gluten': ['blé', 'farine'], 'Lait': ['lait', 'crème', 'fromage', 'beurre'], 'Œufs': ['œuf', 'oeufs'], 'Poissons': ['poisson', 'saumon', 'thon', 'cabillaud'],
  'Crustacés': ['crevette', 'crabe', 'homard'], 'Mollusques': ['moule', 'calamar', 'huître'], 'Soja': ['soja', 'tofu'], 'Céleri': ['céleri'], 'Moutarde': ['moutarde'],
  'Sans porc': ['porc', 'jambon', 'lardons', 'chorizo', 'bacon'], 'Sans alcool': ['vin', 'bière', 'rhum'], 'Végétarien': ['viande', 'poulet', 'bœuf', 'porc', 'poisson'],
  'Végétalien': ['viande', 'poulet', 'poisson', 'œuf', 'lait', 'fromage'], 'Sans viande': ['viande', 'poulet', 'bœuf', 'porc'], 'Sans gluten': ['farine', 'pâtes'], 'Sans lait': ['lait', 'crème', 'fromage'],
};

/** Vérifie une recette convertie contre le profil et les goûts. */
function analyze(recipe, state) {
  const check = checkRecipe(recipe, state.profile);
  return { recipe, check, disliked: dislikedIn(recipe, state.answers), unknown: unknownIn(recipe, state.answers), unrecognized: recipe.ingredients.filter(i => !i.foods.length).length };
}

function Badges({ a }) {
  if (!a.check.safe) return <span className="badge badge-bad"><TriangleAlert size={12} /> exclue : {a.check.reasons[0].label.toLowerCase()}</span>;
  return (
    <span className="row row-wrap" style={{ gap: 4 }}>
      {a.check.unverifiable ? <span className="badge badge-bad"><TriangleAlert size={12} /> impossible à vérifier</span> : <span className="badge badge-ok"><Check size={12} /> compatible</span>}
      {a.disliked.length > 0 && <span className="badge badge-warn">je n’aime pas : {a.disliked.join(', ').toLowerCase()}</span>}
      {a.unknown.length > 0 && <span className="badge">{a.unknown.length} inconnu{a.unknown.length > 1 ? 's' : ''} : {a.unknown.slice(0, 3).join(', ').toLowerCase()}</span>}
    </span>
  );
}

function LineMark({ ing, answers }) {
  if (!ing.foods.length) return <span className="badge badge-warn">non reconnu</span>;
  const a = ing.foods.map(f => answers[f]).find(Boolean);
  if (a === 'dislike') return <span className="badge badge-warn">je n’aime pas</span>;
  if (a === 'like') return <span className="badge badge-ok">aimé</span>;
  if (ing.foods.length === 1 && FOOD[ing.foods[0]]?.composants) return <span className="badge badge-brand">composé, vérifié</span>;
  if (!a && ing.foods.length === 1 && !FOOD[ing.foods[0]]?.categorie) return <span className="badge">inconnu</span>;
  return null;
}

function Preview({ a, onImport, imported }) {
  const { state } = useStore();
  const r = a.recipe;
  return (
    <aside className="card stack preview" style={{ gap: 0, overflow: 'hidden' }}>
      {r.photo && <div className="preview-img"><RecipeVisual r={r} full /></div>}
      <div className="card-pad stack" style={{ gap: 12 }}>
        <span className="small muted">Aperçu avant import</span>
        <h2>{r.name}</h2>
        <span className="row row-wrap small muted" style={{ gap: 12 }}>
          {r.source.url && <a className="row" style={{ gap: 4 }} href={r.source.url} target="_blank" rel="noreferrer">{r.source.authors} <ExternalLink size={12} /></a>}
          <span className="row" style={{ gap: 4 }}><Users size={13} /> {r.portions} portions</span>
          {r.time && <span className="row" style={{ gap: 4 }}><Clock size={13} /> {r.time} min</span>}
        </span>
        {!a.check.safe ? (
          <div className="alert alert-bad"><TriangleAlert size={18} /><div><b>Exclue par votre profil.</b><ul>{a.check.reasons.slice(0, 4).map((x, i) => <li key={i}>{x.kind} « {x.label} » : {x.where}</li>)}</ul></div></div>
        ) : a.check.unverifiable ? (
          <div className="alert alert-bad"><TriangleAlert size={18} /><div><b>Impossible à vérifier :</b> {a.check.why}. Importée, elle restera masquée par défaut.</div></div>
        ) : (
          <div className="alert alert-ok"><ShieldCheck size={18} /><div><b>Compatible avec votre profil.</b> {r.ingredients.length} ingrédients vérifiés.</div></div>
        )}
        <ul className="list">
          {r.ingredients.map((i, k) => (
            <li key={k} className="row between ing" style={{ gap: 8 }}>
              <span className="small">{i.text}</span>
              <LineMark ing={i} answers={state.answers} />
            </li>
          ))}
        </ul>
        {r.steps.length > 0 && <span className="xs muted">{r.steps.length} étape{r.steps.length > 1 ? 's' : ''} de préparation</span>}
        <button type="button" className="btn btn-primary btn-block" disabled={!a.check.safe || imported} onClick={onImport}>
          {imported ? <><Check size={17} /> Déjà dans vos recettes</> : <><Download size={17} /> Importer dans mes recettes</>}
        </button>
      </div>
    </aside>
  );
}

export default function AddRecipe() {
  const { state, importRecipe, notify } = useStore();
  const nav = useNavigate();
  const p = state.profile;
  const [mode, setMode] = useState('web');
  const [q, setQ] = useState('');
  const negAll = useMemo(() => [...new Set([...p.allergens, ...p.regimes].flatMap(k => NEG[k] || []).concat(p.forbidden.map(f => f.toLowerCase())))], [p]);
  const [dropped, setDropped] = useState([]);
  const [sources, setSources] = useState(SEARCH_SITES.map(s => s[0]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null); // [{ title, url, site, status, a, error }]
  const [removed, setRemoved] = useState([]);
  const [sel, setSel] = useState(null);
  const [url, setUrl] = useState('');
  const [single, setSingle] = useState(null);
  const [manual, setManual] = useState({ name: '', portions: 4, minutes: '', ingredients: '', steps: '' });
  const run = useRef(0);
  const neg = negAll.filter(n => !dropped.includes(n));
  const importedUrls = new Set(state.imported.map(r => r.source?.url).filter(Boolean));

  const doImport = a => {
    if (!importRecipe(a.recipe)) return notify('Cette recette est déjà dans vos recettes.');
    notify(`« ${a.recipe.name} » ajoutée à vos recettes.`, { to: `/recettes/${a.recipe.id}`, label: 'Voir' });
  };

  const search = async e => {
    e.preventDefault();
    if (!q.trim()) return;
    const id = ++run.current;
    setBusy(true); setError(''); setResults(null); setRemoved([]); setSel(null);
    try {
      const data = await searchWeb(q.trim(), neg, sources);
      if (id !== run.current) return;
      setRemoved(data.removed || []);
      const list = data.results.map(r => ({ ...r, status: 'reading' }));
      setResults(list);
      // Lecture et vérification de chaque recette, 4 à la fois
      const queue = list.map((_, i) => i);
      const worker = async () => {
        while (queue.length) {
          const i = queue.shift();
          try {
            const page = await readWeb(list[i].url);
            const a = analyze(toRecipe(page), state);
            if (id === run.current) setResults(cur => cur && cur.map((x, k) => (k === i ? { ...x, status: 'ok', a } : x)));
          } catch (err) {
            if (id === run.current) setResults(cur => cur && cur.map((x, k) => (k === i ? { ...x, status: 'error', error: err.message } : x)));
          }
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
    } catch (err) {
      if (id === run.current) setError(err.message);
    } finally {
      if (id === run.current) setBusy(false);
    }
  };

  const readUrl = async e => {
    e.preventDefault();
    setBusy(true); setError(''); setSingle(null);
    try { setSingle(analyze(toRecipe(await readWeb(url.trim())), state)); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const readManual = e => {
    e.preventDefault();
    const lines = s => s.split('\n').map(x => x.trim()).filter(Boolean);
    if (!manual.name.trim() || !lines(manual.ingredients).length) return setError('Donnez au moins un nom et un ingrédient.');
    setError('');
    setSingle(analyze(toRecipe({ name: manual.name.trim(), yield: Number(manual.portions) || 4, minutes: Number(manual.minutes) || null, ingredients: lines(manual.ingredients), steps: lines(manual.steps) }, 'manual'), state));
  };

  const shown = (results || []).filter(r => r.status === 'reading' || (r.status === 'ok' && r.a.check.safe));
  const excluded = (results || []).filter(r => r.status === 'ok' && !r.a.check.safe);
  const unreadable = (results || []).filter(r => r.status === 'error');
  const picked = results?.[sel]?.a;

  return (
    <>
      <Link to="/recettes" className="back small"><ArrowLeft size={16} /> Recettes</Link>
      <PageHeader title="Ajouter une recette" sub="Cherchez sur Marmiton et 750g : chaque recette trouvée est lue et vérifiée contre votre profil avant de vous être proposée." />
      <div className="mode-tabs"><Segmented label="Mode d’ajout" value={mode} onChange={v => { setMode(v); setSingle(null); setError(''); }} options={[['web', 'Chercher sur le web'], ['url', 'Coller un lien'], ['manual', 'À la main']]} /></div>

      {mode === 'web' && (
        <div className="add-grid">
          <div className="stack" style={{ gap: 16 }}>
            <form className="card card-pad stack" onSubmit={search}>
              <div className="row" style={{ gap: 8 }}>
                <div className="grow"><SearchInput value={q} onChange={setQ} placeholder="Un plat, un ingrédient : lasagnes, curry…" /></div>
                <button className="btn btn-primary" type="submit" disabled={!q.trim() || busy}>{busy ? <Loader2 size={17} className="spin" /> : null} Chercher</button>
              </div>
              {negAll.length > 0 && (
                <div className="stack" style={{ gap: 8 }}>
                  <span className="small b">Mots exclus, d’après votre profil</span>
                  <div className="row row-wrap" style={{ gap: 6 }}>
                    {negAll.map(n => <Chip key={n} small removable={!dropped.includes(n)} on={false} onClick={() => setDropped(d => (d.includes(n) ? d.filter(x => x !== n) : [...d, n]))}><span style={{ textDecoration: dropped.includes(n) ? 'line-through' : 'none', opacity: dropped.includes(n) ? 0.5 : 1 }}>-{n}</span></Chip>)}
                  </div>
                </div>
              )}
              <div className="row row-wrap" style={{ gap: 6 }}>
                <span className="small b" style={{ marginRight: 4 }}>Sources</span>
                {SEARCH_SITES.map(([d, l]) => <Chip small key={d} on={sources.includes(d)} onClick={() => setSources(s => (s.includes(d) ? (s.length > 1 ? s.filter(x => x !== d) : s) : [...s, d]))}>{l}</Chip>)}
              </div>
            </form>

            {error && <div className="alert alert-bad" role="alert"><TriangleAlert size={18} /><div>{error}</div></div>}

            {results && (
              <section className="stack" style={{ gap: 10 }} aria-label="Résultats" aria-busy={busy}>
                {results.length === 0 && <div className="card empty"><SearchX size={28} /><b>Aucune recette trouvée.</b><span className="small">Essayez un autre mot, ou collez directement un lien.</span></div>}
                {shown.map(r => {
                  const i = results.indexOf(r);
                  const unv = r.status === 'ok' && r.a.check.unverifiable;
                  return (
                    <button key={r.url} type="button" className={`card result ${unv ? 'is-unverified' : ''} ${sel === i ? 'is-sel' : ''}`} onClick={() => r.status === 'ok' && setSel(i)} disabled={r.status !== 'ok'}>
                      <span className="result-ic">{r.status === 'ok' ? <RecipeVisual r={r.a.recipe} /> : <Loader2 size={20} className={r.status === 'reading' ? 'spin' : ''} />}</span>
                      <span className="stack grow" style={{ gap: 5, alignItems: 'flex-start' }}>
                        <span className="h3">{r.status === 'ok' ? r.a.recipe.name : r.title}</span>
                        <span className="xs muted">{r.site}{r.status === 'ok' && r.a.recipe.time ? ` · ${r.a.recipe.time} min` : ''}{importedUrls.has(r.url) ? ' · déjà importée' : ''}</span>
                        {r.status === 'reading' && <span className="xs muted">Lecture et vérification…</span>}
                        {r.status === 'error' && <span className="xs" style={{ color: 'var(--bad)' }}>Lecture impossible : {r.error}</span>}
                        {r.status === 'ok' && <Badges a={r.a} />}
                      </span>
                    </button>
                  );
                })}
                {(excluded.length > 0 || removed.length > 0) && (
                  <p className="small muted">
                    {excluded.length + removed.length} recette{excluded.length + removed.length > 1 ? 's' : ''} retirée{excluded.length + removed.length > 1 ? 's' : ''} par votre profil :{' '}
                    {[...removed.map(r => `${r.title} (« ${r.word} » dans le titre)`), ...excluded.map(r => `${r.a.recipe.name} (${r.a.check.reasons[0].label.toLowerCase()} : ${r.a.check.reasons[0].where.toLowerCase()})`)].join(', ')}.
                  </p>
                )}
                {unreadable.length > 0 && <p className="small muted">{unreadable.length} page{unreadable.length > 1 ? 's' : ''} sans recette lisible : {unreadable.map(r => r.title).join(', ')}.</p>}
                {picked && <div className="mobile-only"><Preview a={picked} imported={importedUrls.has(picked.recipe.source.url)} onImport={() => doImport(picked)} /></div>}
              </section>
            )}
          </div>
          <div className="desk-only">{picked && <Preview a={picked} imported={importedUrls.has(picked.recipe.source.url)} onImport={() => doImport(picked)} />}</div>
        </div>
      )}

      {mode === 'url' && (
        <div className="add-grid">
          <form className="card card-pad stack" onSubmit={readUrl} style={{ alignSelf: 'start' }}>
            <label className="field"><span>Adresse de la recette</span>
              <span className="input-wrap"><Link2 size={18} /><input className="input" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.marmiton.org/recettes/…" /></span>
            </label>
            <button className="btn btn-primary" type="submit" disabled={!url.trim() || busy} style={{ alignSelf: 'flex-start' }}>{busy && <Loader2 size={17} className="spin" />} Lire la recette</button>
            <p className="xs muted">Sites pris en charge : {READ_SITES}. Les ingrédients sont lus, reliés au référentiel et vérifiés contre votre profil avant l’import.</p>
            {error && <div className="alert alert-bad" role="alert"><TriangleAlert size={18} /><div>{error}</div></div>}
          </form>
          {single && <Preview a={single} imported={importedUrls.has(single.recipe.source.url)} onImport={() => doImport(single)} />}
        </div>
      )}

      {mode === 'manual' && (
        <div className="add-grid">
          <form className="card card-pad stack" onSubmit={readManual} style={{ alignSelf: 'start' }}>
            <label className="field"><span>Nom</span><input className="input" value={manual.name} onChange={e => setManual(m => ({ ...m, name: e.target.value }))} placeholder="Gratin de ma grand-mère" /></label>
            <label className="field"><span>Ingrédients, un par ligne</span><textarea className="input textarea" rows={7} value={manual.ingredients} onChange={e => setManual(m => ({ ...m, ingredients: e.target.value }))} placeholder={'500 g de pommes de terre\n20 cl de crème\n1 gousse d’ail'} /></label>
            <label className="field"><span>Étapes, une par ligne</span><textarea className="input textarea" rows={5} value={manual.steps} onChange={e => setManual(m => ({ ...m, steps: e.target.value }))} /></label>
            <div className="row" style={{ gap: 8 }}>
              <label className="field grow"><span>Portions</span><input className="input" type="number" value={manual.portions} onChange={e => setManual(m => ({ ...m, portions: e.target.value }))} /></label>
              <label className="field grow"><span>Temps (min)</span><input className="input" type="number" value={manual.minutes} onChange={e => setManual(m => ({ ...m, minutes: e.target.value }))} /></label>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>Vérifier</button>
          </form>
          {single && <Preview a={single} imported={false} onImport={() => { doImport(single); nav(`/recettes/${single.recipe.id}`); }} />}
        </div>
      )}
    </>
  );
}
