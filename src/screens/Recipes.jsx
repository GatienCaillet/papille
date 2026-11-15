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
  const [showUnv, setShowUnv] = useState(false);
  const [why, setWhy] = useState(false);

  const cat = useMemo(() => catalog(state), [state]);
  const pass = x => {
    const r = x.r;
    if (q && !norm(`${r.name} ${r.ingredients.map(i => i.name).join(' ')}`).includes(norm(q))) return false;
    if (time && r.time > time) return false;
    if (type && r.type !== type) return false;
    if (origin && r.origin !== origin) return false;
    if (onlyLiked && !allLiked(r, state.answers)) return false;
    return true;
  };
  const rows = cat.visible.filter(pass);
  const unv = showUnv ? cat.unverifiable.filter(pass) : [];
  const hidden = cat.excluded.length + cat.withDisliked.length;
  const filtersOn = q || time || type || origin || onlyLiked;

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
          {filtersOn && <button type="button" className="btn btn-sm" onClick={() => { setQ(''); setTime(null); setType(''); setOrigin(''); setOnlyLiked(false); }}>Effacer les filtres</button>}
        </div>
      ) : (
        <div className="rgrid">
          {rows.map(x => <RecipeCard key={x.r.id} row={x} />)}
          {unv.map(x => <RecipeCard key={x.r.id} row={x} unverified />)}
        </div>
      )}

      <section className="card excluded">
        <button type="button" className="excluded-head" onClick={() => setWhy(w => !w)} aria-expanded={why}>
          <ShieldCheck size={19} />
          <span className="grow"><b>{hidden} recettes écartées</b> <span className="muted">· allergies, régime, interdits ou aliments que vous n’aimez pas</span></span>
          <ChevronDown size={18} style={{ transform: why ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
        </button>
        {why && (
          <ul className="list excluded-list">
            {cat.excluded.map(x => (
              <li key={x.r.id}>
                <span className="small b">{x.r.name}</span>
                <span className="small muted">{x.check.reasons.map(rs => `${rs.kind.toLowerCase()} ${rs.label} : ${rs.where}`).join(' · ')}</span>
              </li>
            ))}
            {cat.withDisliked.map(x => (
              <li key={x.r.id}><span className="small b">{x.r.name}</span><span className="small muted">vous n’aimez pas : {x.disliked.join(', ').toLowerCase()}</span></li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
