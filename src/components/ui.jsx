import { Link, NavLink } from 'react-router-dom';
import { Apple, Bean, Carrot, Clock, Drumstick, Fish, Flame, Leaf, Milk, Minus, Plus, Salad, Search, Sprout, TriangleAlert, Wheat, X } from 'lucide-react';

const Icons = { Apple, Bean, Carrot, Drumstick, Fish, Leaf, Milk, Salad, Sprout, Wheat };
import { GROUPS } from '../data/foods.js';
import { photo } from '../data/recipes.js';
import { useStore } from '../store.jsx';

export function PageHeader({ title, sub, actions }) {
  return (
    <header className="ph">
      <div className="grow">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <div className="ph-actions">
        {actions && <div className="desk-only row">{actions}</div>}
        <Link to="/profil" className="avatar mobile-only" aria-label="Profil">GC</Link>
      </div>
    </header>
  );
}

export function Chip({ on, onClick, children, small, removable }) {
  return (
    <button type="button" className={`chip ${small ? 'chip-sm' : ''}`} aria-pressed={!!on} onClick={onClick}>
      {children}
      {removable && <span className="x"><X size={14} /></span>}
    </button>
  );
}

export function Segmented({ options, value, onChange, block, label }) {
  return (
    <div className={`seg ${block ? 'seg-block' : ''}`} role="tablist" aria-label={label}>
      {options.map(o => {
        const [v, l] = Array.isArray(o) ? o : [o, o];
        return <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)}>{l}</button>;
      })}
    </div>
  );
}

export function Switch({ checked, onChange, children }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="track" aria-hidden="true" />
      {children}
    </label>
  );
}

export function Stepper({ value, onChange, min = 1, max = 20, step = 1, label }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} aria-label="Moins"><Minus size={16} /></button>
      <output aria-live="polite">{String(value).replace('.', ',')}</output>
      <button type="button" onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} aria-label="Plus"><Plus size={16} /></button>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, autoFocus, onKeyDown }) {
  return (
    <label className="input-wrap">
      <Search size={18} />
      <span className="sr-only">{placeholder}</span>
      <input className="input" type="search" value={value} placeholder={placeholder} autoFocus={autoFocus} onKeyDown={onKeyDown} onChange={e => onChange(e.target.value)} />
    </label>
  );
}

export function FoodTile({ food, size = 44 }) {
  const g = GROUPS[food.group];
  const Icon = Icons[g.icon] || Icons.Leaf;
  return (
    <span className="ftile" style={{ width: size, height: size, background: `var(--g-${food.group})`, color: `var(--g-${food.group}-ink)` }} aria-hidden="true">
      <Icon />
    </span>
  );
}

export function Score({ value }) {
  const cls = value > 0 ? 'badge-ok' : value < 0 ? 'badge-bad' : '';
  return <span className={`badge num ${cls}`}>{value > 0 ? '+' : ''}{value}</span>;
}

export function Bar({ pct, tone }) {
  return <span className={`bar c-${tone}`} role="presentation"><i style={{ width: `${Math.min(100, pct)}%` }} /></span>;
}

export function Img({ id, alt, w = 640, eager }) {
  return <img src={photo(id, w)} srcSet={`${photo(id, w)} 1x, ${photo(id, w * 2)} 2x`} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable="false" />;
}

export function RecipeCard({ row, unverified }) {
  const { r, match, check } = row;
  return (
    <Link to={`/recettes/${r.id}`} className={`card rcard ${unverified ? 'is-unverified' : ''}`}>
      <div className="rcard-img">
        <Img id={r.img} alt="" w={480} />
        <span className="badge badge-on-photo">{r.type}</span>
      </div>
      <div className="rcard-body">
        <span className="xs muted">{r.origin}</span>
        <span className="h3">{r.name}</span>
        <span className="rcard-meta">
          <span><Clock size={14} /> {r.time} min</span>
          <span><Flame size={14} /> {r.n[0]} kcal</span>
        </span>
        {unverified ? (
          <span className="unv-banner"><TriangleAlert size={15} /> Impossible à vérifier : « {check.unknown} », composition inconnue.</span>
        ) : (
          <span className="rcard-foot">
            <span className="muted">Pour vous</span>
            <span className="match"><Bar pct={match} tone="brand" />{match} %</span>
          </span>
        )}
      </div>
    </Link>
  );
}

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.k}>
      <span>{toast.text}</span>
      {toast.action && <NavLink to={toast.action.to}>{toast.action.label}</NavLink>}
    </div>
  );
}
