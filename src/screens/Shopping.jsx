import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ListPlus, Plus, ShoppingBasket, Trash2, X } from 'lucide-react';
import { useStore } from '../store.jsx';
import { RECIPE } from '../data/recipes.js';
import { AISLES, buildShopping, fmtQty } from '../lib/logic.js';
import { Img, PageHeader, Stepper } from '../components/ui.jsx';

export default function Shopping() {
  const { state, toggleChecked, clearChecked, addManual, addAlways, setShoppingPortions, setAlways, notify } = useStore();
  const groups = useMemo(() => buildShopping(state.shopping, RECIPE), [state.shopping]);
  const all = groups.flatMap(g => g.items);
  const done = all.filter(i => i.checked).length;
  const [name, setName] = useState('');
  const [aisle, setAisle] = useState('Épicerie');
  const [newAlways, setNewAlways] = useState('');

  const add = e => {
    e.preventDefault();
    if (!name.trim()) return;
    addManual({ name: name.trim()[0].toUpperCase() + name.trim().slice(1), qty: 1, unit: '', aisle });
    setName('');
  };

  const tools = (
    <div className="row row-wrap" style={{ gap: 8 }}>
      <button type="button" className="btn btn-primary" onClick={() => { addAlways(); notify(`${state.always.length} articles de base ajoutés.`); }}><ListPlus size={17} /> Toujours acheter ({state.always.length})</button>
      <button type="button" className="btn" disabled={!done} onClick={() => { clearChecked(); notify(`${done} article${done > 1 ? 's' : ''} retiré${done > 1 ? 's' : ''}.`); }}><Trash2 size={16} /> Vider les cochés{done ? ` (${done})` : ''}</button>
    </div>
  );

  return (
    <>
      <PageHeader title="Liste de courses" sub="Les ingrédients de vos recettes, ajustés aux portions et fusionnés." actions={tools} />
      <div className="mobile-only">{tools}</div>

      <div className="shop-grid">
        <div className="stack" style={{ gap: 16 }}>
          <div className="card card-pad stack" style={{ gap: 10, background: 'var(--sage)', borderColor: 'transparent' }}>
            <div className="row between small"><b className="row" style={{ gap: 6, color: 'var(--brand)' }}><Check size={16} /> <span className="num">{done}</span> sur <span className="num">{all.length}</span> dans le panier</b><span className="num" style={{ color: 'var(--brand)' }}>{all.length ? Math.round((done / all.length) * 100) : 0} %</span></div>
            <span className="bar c-brand" style={{ background: 'rgba(255,255,255,.7)' }}><i style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} /></span>
          </div>

          <form className="add-item" onSubmit={add}>
            <input className="input grow" value={name} onChange={e => setName(e.target.value)} placeholder="Ajouter un article…" aria-label="Nouvel article" />
            <select className="input" value={aisle} onChange={e => setAisle(e.target.value)} aria-label="Rayon">{AISLES.map(a => <option key={a}>{a}</option>)}</select>
            <button className="btn" type="submit" disabled={!name.trim()}><Plus size={17} /> Ajouter</button>
          </form>

          {groups.length === 0 ? (
            <div className="card empty"><ShoppingBasket size={28} /><b>Liste vide.</b><span className="small">Ajoutez une recette, un article, ou votre liste de base.</span></div>
          ) : groups.map(g => (
            <section key={g.aisle} className="card aisle">
              <header className="row between"><h2 className="h3">{g.aisle}</h2><span className="xs muted num">{g.items.filter(i => !i.checked).length} restant{g.items.filter(i => !i.checked).length > 1 ? 's' : ''}</span></header>
              <ul className="list">
                {g.items.map(it => (
                  <li key={it.key}>
                    <label className={`item ${it.checked ? 'is-done' : ''}`}>
                      <input type="checkbox" checked={it.checked} onChange={() => toggleChecked(it.key)} />
                      <span className="box" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
                      <span className="stack grow" style={{ gap: 0 }}>
                        <span className="item-name">{it.name}</span>
                        {it.sources.length > 0 && <span className="xs muted">{it.sources.length > 1 ? `Fusionné · ${it.sources.join(' + ')}` : it.sources[0]}</span>}
                      </span>
                      <span className="small muted num nowrap">{fmtQty(it.qty, it.unit, true)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card card-pad stack">
            <h2 className="h3">Depuis vos recettes</h2>
            {state.shopping.recipes.length === 0 && <p className="small muted">Ajoutez une recette depuis sa fiche.</p>}
            <ul className="list">
              {state.shopping.recipes.map(({ id, portions }) => {
                const r = RECIPE[id];
                return (
                  <li key={id} className="shop-recipe">
                    <Link to={`/recettes/${id}`} className="entry-img"><Img id={r.img} alt="" w={96} /></Link>
                    <span className="stack grow" style={{ gap: 4 }}>
                      <Link to={`/recettes/${id}`} className="small b">{r.name}</Link>
                      <span className="row" style={{ gap: 8 }}><Stepper label={`Portions de ${r.name}`} value={portions} min={0} max={20} onChange={v => setShoppingPortions(id, v)} /><span className="xs muted">portions</span></span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card card-pad stack">
            <h2 className="h3">Toujours acheter</h2>
            <p className="xs muted">Votre liste de base, ajoutée en un geste.</p>
            <div className="row row-wrap" style={{ gap: 6 }}>
              {state.always.map(a => (
                <span key={a.name} className="chip chip-sm chip-static">{a.name}
                  <button type="button" className="x" aria-label={`Retirer ${a.name}`} onClick={() => setAlways(state.always.filter(x => x.name !== a.name))}><X size={13} /></button>
                </span>
              ))}
            </div>
            <form className="row" onSubmit={e => { e.preventDefault(); if (!newAlways.trim()) return; setAlways([...state.always, { name: newAlways.trim(), qty: 1, unit: '', aisle: 'Autres' }]); setNewAlways(''); }}>
              <input className="input grow" style={{ height: 38 }} value={newAlways} onChange={e => setNewAlways(e.target.value)} placeholder="Ajouter à la base" aria-label="Ajouter à la liste de base" />
              <button className="btn btn-sm" type="submit" disabled={!newAlways.trim()}>Ajouter</button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
