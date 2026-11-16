import { Link, NavLink } from 'react-router-dom';
import { Apple, Bean, Candy, Carrot, Clock, Droplet, Drumstick, Fish, Flame, HelpCircle, Leaf, Milk, Minus, Plus, Salad, Search, Soup, Sprout, TriangleAlert, Wheat, X } from 'lucide-react';
import { FAMILLES, FOOD, IMAGES, imageOf, imageOfCiqual } from '../data/foods.js';

const Icons = { Apple, Bean, Candy, Carrot, Droplet, Drumstick, Fish, Leaf, Milk, Salad, Soup, Sprout, Wheat };
const TINT_ICON = { legume: 'Carrot', fruit: 'Apple', feculent: 'Wheat', legumineuse: 'Bean', viande: 'Drumstick', poisson: 'Fish', laitier: 'Milk', epice: 'Leaf', sauce: 'Soup', sucre: 'Candy', gras: 'Droplet' };
import { photo } from '../data/recipes.js';
import { useStore } from '../store.jsx';
import { isScore, SCORES, scoreTone, scoreWord, UNSURE } from '../lib/logic.js';

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

/** Agrandit une vignette Commons (480 px) : Special:FilePath plafonne à la taille d'origine. */
export const commonsAt = (img, w) => {
  const file = img?.page?.split('/File:')[1];
  return file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${w}` : img?.thumb;
};

/** Vignette d'aliment : photo (Wikipédia/Commons) si elle existe, sinon aplat teinté de la famille.
 *  `food` : aliment du référentiel ; `code` + `tint` : aliment CIQUAL du journal. */
export function FoodTile({ food, code, tint, size = 44 }) {
  const img = food ? imageOf(food.id) : code ? imageOfCiqual(code) : null;
  if (img) {
    return (
      <span className="ftile ftile-img" style={{ width: size, height: size }} aria-hidden="true">
        <img src={size > 100 ? commonsAt(img, 640) : img.thumb} alt="" loading="lazy" decoding="async" draggable="false" />
      </span>
    );
  }
  const t = tint || FAMILLES[food?.famille]?.tint || 'legume';
  const Icon = Icons[(food && FAMILLES[food.famille]?.icon) || TINT_ICON[t]] || Leaf;
  return (
    <span className="ftile" style={{ width: size, height: size, background: `var(--g-${t})`, color: `var(--g-${t}-ink)` }} aria-hidden="true">
      <Icon />
    </span>
  );
}

export function Score({ value }) {
  const cls = value > 0 ? 'badge-ok' : value < 0 ? 'badge-bad' : '';
  return <span className={`badge num ${cls}`}>{value > 0 ? '+' : ''}{value}</span>;
}

/** Note de 0 à 10 en un toucher, et « je ne sais pas encore ». Toucher la note déjà donnée l'efface
 *  (onChange(null)). size : 'sm' (listes, cartes), 'md', 'lg' (swipe). */
export function RatingScale({ value, onChange, size = 'md', unsure = true, label = 'Note sur 10', disabled }) {
  const pick = v => onChange(value === v ? null : v);
  return (
    <div className={`scale scale-${size}`}>
      <div className="scale-row" role="radiogroup" aria-label={label}>
        {SCORES.map(n => (
          <button key={n} type="button" role="radio" aria-checked={value === n} disabled={disabled}
            aria-label={`${n} sur 10, ${scoreWord(n).toLowerCase()}`} title={scoreWord(n)}
            className={`scale-b t-${scoreTone(n)}`} onClick={() => pick(n)}>{n}</button>
        ))}
      </div>
      {size !== 'lg' && <div className="scale-ends xs muted" aria-hidden="true"><span>0 · je n’aime pas</span><span>10 · j’adore</span></div>}
      {size !== 'lg' && unsure && (
        <button type="button" className="scale-unsure" aria-pressed={value === UNSURE} disabled={disabled} onClick={() => pick(UNSURE)}><HelpCircle size={13} /> Je ne sais pas encore</button>
      )}
    </div>
  );
}

/** Note affichée : « 8/10 », « ? » pour je ne sais pas encore, rien si pas notée (sauf `empty`). */
export function RatingBadge({ value, prefix, empty }) {
  if (value === undefined || value === null) return empty ? <span className="badge">{prefix ? `${prefix} : ` : ''}{empty}</span> : null;
  const t = scoreTone(value);
  return (
    <span className={`badge num ${t === 'ok' ? 'badge-ok' : t === 'bad' ? 'badge-bad' : t === 'warn' ? 'badge-warn' : ''}`} title={scoreWord(value)}>
      {prefix ? `${prefix} : ` : ''}{isScore(value) ? `${value}/10` : 'je ne sais pas'}
    </span>
  );
}

export function Bar({ pct, tone }) {
  return <span className={`bar c-${tone}`} role="presentation"><i style={{ width: `${Math.min(100, pct)}%` }} /></span>;
}

/** D'où vient l'illustration d'une recette : la photo du plat choisie dans Commons (scripts/build-recipe-photos.mjs),
 *  sinon sa photo d'origine, sinon son ingrédient principal. */
export function recipeImage(r) {
  if (!r) return null;
  const dish = !r.imported && IMAGES.recipes[r.id];
  // Vignette : l'adresse directe (upload.wikimedia.org, 500 px) évite une redirection par image dans les listes
  if (dish) return { kind: 'dish', src: commonsAt(dish, 1024), thumb: dish.thumb?.startsWith('https://upload.') ? dish.thumb : commonsAt(dish, 640), credit: dish };
  if (r.photo) return { kind: 'own', src: r.photo.full, thumb: r.photo.full.replace(/width=\d+/, 'width=640') };
  for (const id of r.main || []) {
    const img = imageOf(id);
    if (img) return { kind: 'ingredient', src: commonsAt(img, 1024), thumb: commonsAt(img, 640), credit: img, food: FOOD[img.of] };
  }
  return null;
}

/** Illustration d'une recette ; sans aucune image, un aplat teinté de la famille de l'ingrédient principal. */
export function RecipeVisual({ r, full, eager }) {
  const img = recipeImage(r);
  // La grande image passe par commons.wikimedia.org (redirection) : si elle échoue, on garde la vignette directe
  const fallback = e => { if (img.thumb && e.currentTarget.src !== img.thumb) e.currentTarget.src = img.thumb; };
  if (img) return <img src={full ? img.src : img.thumb} onError={fallback} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" draggable="false" />;
  const f = FOOD[r?.main?.[0]];
  const t = FAMILLES[f?.famille]?.tint || 'sauce';
  const Icon = Icons[FAMILLES[f?.famille]?.icon] || Soup;
  return <span className="rv" style={{ background: `var(--g-${t})`, color: `var(--g-${t}-ink)` }} aria-hidden="true"><Icon /></span>;
}

export function Img({ id, alt, w = 640, eager }) {
  return <img src={photo(id, w)} srcSet={`${photo(id, w)} 1x, ${photo(id, w * 2)} 2x`} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable="false" />;
}

export function RecipeCard({ row, unverified }) {
  const { r, match, check } = row;
  return (
    <Link to={`/recettes/${r.id}`} className={`card rcard ${unverified ? 'is-unverified' : ''}`}>
      <div className="rcard-img">
        <RecipeVisual r={r} />
        <span className="badge badge-on-photo">{r.type}</span>
      </div>
      <div className="rcard-body">
        <span className="xs muted">{r.origin === 'Non précisée' ? r.type : r.origin}{r.generated ? ' · non testée' : ''}{r.imported ? ' · importée' : ''}</span>
        <span className="h3">{r.name}</span>
        <span className="rcard-meta">
          {r.time && <span><Clock size={14} /> {r.time} min</span>}
          {!r.nutritionUnsure && <span><Flame size={14} /> {Math.round(r.n[0])} kcal</span>}
        </span>
        {unverified ? (
          <span className="unv-banner"><TriangleAlert size={15} /> Impossible à vérifier : {check.why}.</span>
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
