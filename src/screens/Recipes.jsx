import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Plus, SearchX, ShieldCheck } from 'lucide-react';
import { useStore } from '../store.jsx';
import { ORIGINS, TYPES } from '../data/recipes.js';
import { allLiked, catalog, norm } from '../lib/logic.js';
import { Chip, PageHeader, RecipeCard, SearchInput, Switch } from '../components/ui.jsx';

const TIMES = [[15, '15 min'], [30, '30 min'], [45, '45 min']];

export default function Recipes() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [time, setTime] = useState(null);
  const [type, setType] = useState('');
  const [origin, setOrigin] = useState('');
  const [onlyLiked, setOnlyLiked] = useState(false);
  const [mine, setMine] = useState(false);
  const [showUnv, setShowUnv] = useState(false);
  const [why, setWhy] = useState(false);
  const [limit, setLimit] = useState(24);

  const cat = useMemo(() => catalog(state), [state]);
  const pass = x => {
    const r = x.r;
    if (q && !norm(`${r.name} ${r.ingredients.map(i => i.name).join(' ')}`).includes(norm(q))) return false;
    if (time && (!r.time || r.time > time)) return false;
    if (type && r.type !== type) return false;
    if (origin && r.origin !== origin) return false;
    if (onlyLiked && !allLiked(r, state.ratings)) return false;
    if (mine && !r.imported) return false;
    return true;
  };
  const rows = cat.visible.filter(pass);
  const unv = showUnv ? cat.unverifiable.filter(pass) : [];
  const hidden = cat.excluded.length + cat.withDisliked.length;
  const filtersOn = q || time || type || origin || onlyLiked || mine;

  const add = <Link to="/recettes/ajouter" className="btn btn-primary"><Plus size={17} /> Ajouter une recette</Link>;

  return (
    <>
      <PageHeader title="Recettes" sub={`${cat.visible.length} recettes sûres pour votre profil, triées selon vos goûts.`} actions={add} />
      <div className="mobile-only">{add}</div>

      <section className="filters" aria-label="Filtres">
        <div className="filters-top">
          <div className="grow"><SearchInput value={q} onChange={setQ} placeholder="Une recette, un ingrédient…" /></div>
          <select className="input" value={type} onChange={e => setType(e.target.value)} aria-label="Type de plat">
            <option value="">Tous les types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="input" value={origin} onChange={e => setOrigin(e.target.value)} aria-label="Origine">
            <option value="">Toutes origines</option>
            {ORIGINS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="row row-wrap between" style={{ gap: 10 }}>
          <div className="row row-wrap" style={{ gap: 6 }}>
            <span className="small muted">Moins de</span>
            {TIMES.map(([v, l]) => <Chip small key={v} on={time === v} onClick={() => setTime(time === v ? null : v)}>{l}</Chip>)}
            {state.imported.length > 0 && <Chip small on={mine} onClick={() => setMine(m => !m)}>Mes recettes ({state.imported.length})</Chip>}
          </div>
          <div className="row row-wrap" style={{ gap: 18 }}>
            <Switch checked={onlyLiked} onChange={setOnlyLiked}>Que des aliments que j’aime</Switch>
            <Switch checked={showUnv} onChange={setShowUnv}>Non vérifiables ({cat.unverifiable.length})</Switch>
          </div>
        </div>
      </section>

      {rows.length + unv.length === 0 ? (
        <div className="card empty">
          <SearchX size={30} />
          <b>Aucune recette ne passe ces filtres.</b>
          {filtersOn && <button type="button" className="btn btn-sm" onClick={() => { setQ(''); setTime(null); setType(''); setOrigin(''); setOnlyLiked(false); setMine(false); }}>Effacer les filtres</button>}
        </div>
      ) : (
        <>
          <p className="small muted">{rows.length.toLocaleString('fr-FR')} recette{rows.length > 1 ? 's' : ''}{filtersOn ? ' pour ces filtres' : ''}</p>
          <div className="rgrid">
            {rows.slice(0, limit).map(x => <RecipeCard key={x.r.id} row={x} />)}
            {rows.length < limit && unv.slice(0, limit - rows.length).map(x => <RecipeCard key={x.r.id} row={x} unverified />)}
          </div>
          {rows.length + unv.length > limit && (
            <button type="button" className="btn" style={{ alignSelf: 'center' }} onClick={() => setLimit(l => l + 24)}>
              Voir plus de recettes <span className="muted">· {(rows.length + unv.length - limit).toLocaleString("fr-FR")} restantes</span>
            </button>
          )}
        </>
      )}

      <section className="card excluded">
        <button type="button" className="excluded-head" onClick={() => setWhy(w => !w)} aria-expanded={why}>
          <ShieldCheck size={19} />
          <span className="grow"><b>{hidden} recettes écartées</b> <span className="muted">· allergies, régime, interdits ou aliments que vous n’aimez pas</span></span>
          <ChevronDown size={18} style={{ transform: why ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
        </button>
        {why && (
          <ul className="list excluded-list">
            {[...cat.excluded, ...cat.withDisliked].slice(0, 40).map(x => (
              <li key={x.r.id}>
                <Link to={`/recettes/${x.r.id}`} className="small b">{x.r.name}</Link>
                <span className="small muted">
                  {x.check.safe
                    ? `vous n’aimez pas : ${x.disliked.join(', ').toLowerCase()}`
                    : x.check.reasons.slice(0, 3).map(rs => `${rs.kind.toLowerCase()} ${rs.label} : ${rs.where}`).join(' · ')}
                </span>
              </li>
            ))}
            {hidden > 40 && <li><span className="small muted">… et {hidden - 40} autres.</span></li>}
          </ul>
        )}
      </section>
    </>
  );
}
