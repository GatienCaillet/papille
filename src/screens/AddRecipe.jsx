import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, CookingPot, Download, Link2, TriangleAlert } from 'lucide-react';
import { useStore } from '../store.jsx';
import { Chip, PageHeader, SearchInput, Segmented } from '../components/ui.jsx';

const SOURCES = [['marmiton.org', 'Marmiton'], ['750g.com', '750g'], ['cuisineaz.com', 'Cuisine AZ'], ['journaldesfemmes.fr', 'Journal des Femmes'], ['ricardocuisine.com', 'Ricardo']];

// Mots exclus ajoutés à la requête, déduits du profil
const NEG = {
  'Fruits à coque': ['noix', 'noisette', 'amande', 'cajou', 'pistache'], 'Sésame': ['sésame', 'tahini'], 'Arachides': ['cacahuète', 'arachide'],
  'Gluten': ['blé', 'farine'], 'Lait': ['lait', 'crème', 'fromage'], 'Œufs': ['œuf'], 'Poissons': ['poisson'], 'Crustacés': ['crevette', 'crabe'],
  'Sans porc': ['porc', 'jambon', 'lardons'], 'Sans alcool': ['vin', 'bière'], 'Végétarien': ['viande', 'poisson'], 'Végétalien': ['viande', 'poisson', 'œuf', 'lait'],
  'Sans viande': ['viande'], 'Sans gluten': ['farine', 'blé'], 'Sans lait': ['lait', 'crème'],
};

const RESULTS = [
  { id: 1, name: 'Lasagnes végétariennes', src: 'marmiton.org', time: 70, status: 'ok', unknown: ['ricotta'], ingredients: [['Feuilles de lasagne', 'like'], ['Ricotta', 'unknown'], ['Épinards', 'unknown'], ['Sauce tomate maison', 'comp'], ['Mozzarella', 'like']] },
  { id: 2, name: 'Lasagnes à la bolognaise', src: '750g.com', time: 90, status: 'ok', unknown: [], ingredients: [['Feuilles de lasagne', 'like'], ['Bœuf haché', 'like'], ['Tomates concassées', 'like'], ['Béchamel', 'comp'], ['Oignon', 'like']] },
  { id: 3, name: 'Lasagnes aux champignons', src: 'cuisineaz.com', time: 60, status: 'dislike', disliked: ['champignon de Paris'], unknown: [], ingredients: [['Feuilles de lasagne', 'like'], ['Champignons de Paris', 'dislike'], ['Béchamel', 'comp'], ['Parmesan', '']] },
  { id: 4, name: 'Lasagnes express', src: 'journaldesfemmes.fr', time: 30, status: 'unv', why: '« sauce tomate cuisinée » du commerce, composition inconnue', ingredients: [['Feuilles de lasagne', 'like'], ['Sauce tomate cuisinée', 'unv'], ['Emmental', '']] },
];
const REMOVED = [['Lasagnes au jambon', 'porc'], ['Lasagnes pesto et noix', 'fruits à coque'], ['Lasagnes carbonara', 'porc']];

function Mark({ m }) {
  if (m === 'like') return <span className="badge badge-ok">aimé</span>;
  if (m === 'unknown') return <span className="badge">inconnu</span>;
  if (m === 'dislike') return <span className="badge badge-warn">je n’aime pas</span>;
  if (m === 'comp') return <span className="badge badge-brand">composé, vérifié</span>;
  if (m === 'unv') return <span className="badge badge-bad">non vérifiable</span>;
  return null;
}

export default function AddRecipe() {
  const { state, notify } = useStore();
  const p = state.profile;
  const [mode, setMode] = useState('web');
  const [q, setQ] = useState('lasagnes');
  const negAll = useMemo(() => [...new Set([...p.allergens, ...p.regimes].flatMap(k => NEG[k] || []).concat(p.forbidden.map(f => f.toLowerCase())))], [p]);
  const [dropped, setDropped] = useState([]);
  const [sources, setSources] = useState(SOURCES.slice(0, 3).map(s => s[0]));
  const [searched, setSearched] = useState(true);
  const [sel, setSel] = useState(1);
  const neg = negAll.filter(n => !dropped.includes(n));
  const query = `${q} ${neg.map(n => `-${n}`).join(' ')} ${sources.map(s => `site:${s}`).join(' OR ')}`;
  const picked = RESULTS.find(r => r.id === sel);

  const preview = picked && (
    <aside className="card card-pad stack preview">
      <span className="small muted">Aperçu avant import</span>
      <h2>{picked.name}</h2>
      <span className="small muted">{picked.src} · {picked.time} min</span>
      {picked.status === 'unv' && <div className="alert alert-bad"><TriangleAlert size={18} /><div>Impossible à vérifier : {picked.why}. Importée, elle restera masquée par défaut.</div></div>}
      <ul className="list">
        {picked.ingredients.map(([n, m]) => <li key={n} className="row between ing"><span>{n}</span><Mark m={m} /></li>)}
      </ul>
      <button type="button" className="btn btn-primary btn-block" onClick={() => notify(`« ${picked.name} » importée (maquette).`, { to: '/recettes', label: 'Recettes' })}>
        <Download size={17} /> Importer dans mes recettes
      </button>
    </aside>
  );

  return (
    <>
      <Link to="/recettes" className="back small"><ArrowLeft size={16} /> Recettes</Link>
      <PageHeader title="Ajouter une recette" sub="Cherchez sur les sites de cuisine : vos contraintes partent avec la requête." />
      <div className="mode-tabs"><Segmented label="Mode d’ajout" value={mode} onChange={setMode} options={[['web', 'Chercher sur le web'], ['url', 'Coller un lien'], ['manual', 'À la main']]} /></div>

      {mode === 'web' && (
        <div className="add-grid">
          <div className="stack" style={{ gap: 16 }}>
            <form className="card card-pad stack" onSubmit={e => { e.preventDefault(); setSearched(true); }}>
              <div className="row" style={{ gap: 8 }}>
                <div className="grow"><SearchInput value={q} onChange={setQ} placeholder="Un plat, un ingrédient…" /></div>
                <button className="btn btn-primary" type="submit" disabled={!q.trim()}>Chercher</button>
              </div>
              <div className="stack" style={{ gap: 8 }}>
                <span className="small b">Ajouté à la requête, d’après votre profil</span>
                <div className="row row-wrap" style={{ gap: 6 }}>
                  {negAll.map(n => <Chip key={n} small removable={!dropped.includes(n)} on={false} onClick={() => setDropped(d => (d.includes(n) ? d.filter(x => x !== n) : [...d, n]))}><span style={{ textDecoration: dropped.includes(n) ? 'line-through' : 'none', opacity: dropped.includes(n) ? .5 : 1 }}>-{n}</span></Chip>)}
                </div>
              </div>
              <div className="row row-wrap" style={{ gap: 6 }}>
                <span className="small b" style={{ marginRight: 4 }}>Sources</span>
                {SOURCES.map(([d, l]) => <Chip small key={d} on={sources.includes(d)} onClick={() => setSources(s => (s.includes(d) ? s.filter(x => x !== d) : [...s, d]))}>{l}</Chip>)}
              </div>
              <p className="query num" aria-label="Requête envoyée">{query}</p>
            </form>

            {searched && (
              <section className="stack" style={{ gap: 10 }} aria-label="Résultats">
                <span className="small muted">Résultats d’exemple (maquette)</span>
                {RESULTS.map(r => (
                  <button key={r.id} type="button" className={`card result ${r.status === 'unv' ? 'is-unverified' : ''} ${sel === r.id ? 'is-sel' : ''}`} onClick={() => setSel(r.id)}>
                    <span className="result-ic"><CookingPot size={22} /></span>
                    <span className="stack grow" style={{ gap: 6, alignItems: 'flex-start' }}>
                      <span className="h3">{r.name}</span>
                      <span className="xs muted">{r.src} · {r.time} min</span>
                      <span className="row row-wrap" style={{ gap: 4 }}>
                        {r.status !== 'unv' && <span className="badge badge-ok"><Check size={12} /> compatible</span>}
                        {r.unknown?.length > 0 && <span className="badge">{r.unknown.length} inconnu : {r.unknown.join(', ')}</span>}
                        {r.disliked && <span className="badge badge-warn">je n’aime pas : {r.disliked.join(', ')}</span>}
                        {r.status === 'unv' && <span className="badge badge-bad"><TriangleAlert size={12} /> impossible à vérifier</span>}
                      </span>
                    </span>
                  </button>
                ))}
                <p className="small muted">{REMOVED.length} résultats retirés par votre profil : {REMOVED.map(([n, w]) => `${n} (${w})`).join(', ')}.</p>
                <div className="mobile-only">{preview}</div>
              </section>
            )}
          </div>
          <div className="desk-only">{preview}</div>
        </div>
      )}

      {mode === 'url' && (
        <form className="card card-pad stack" style={{ maxWidth: 640 }} onSubmit={e => { e.preventDefault(); notify('Analyse du lien (maquette).'); }}>
          <label className="field"><span>Adresse de la recette</span>
            <span className="input-wrap"><Link2 size={18} /><input className="input" type="url" placeholder="https://www.marmiton.org/recettes/…" /></span>
          </label>
          <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>Analyser la recette</button>
          <p className="xs muted">Les ingrédients sont lus, décomposés et vérifiés contre votre profil avant l’import.</p>
        </form>
      )}

      {mode === 'manual' && (
        <form className="card card-pad stack" style={{ maxWidth: 640 }} onSubmit={e => { e.preventDefault(); notify('Recette enregistrée (maquette).'); }}>
          <label className="field"><span>Nom</span><input className="input" placeholder="Gratin de ma grand-mère" /></label>
          <label className="field"><span>Ingrédients, un par ligne</span><textarea className="input textarea" rows={6} placeholder={'500 g de pommes de terre\n20 cl de crème\n1 gousse d’ail'} /></label>
          <div className="row" style={{ gap: 8 }}><label className="field grow"><span>Portions</span><input className="input" type="number" defaultValue={4} /></label><label className="field grow"><span>Temps (min)</span><input className="input" type="number" defaultValue={45} /></label></div>
          <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>Vérifier et enregistrer</button>
        </form>
      )}
    </>
  );
}
