import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { FOOD, IMAGES } from '../data/foods.js';
import { RECIPE } from '../data/recipes.js';
import { norm } from '../lib/logic.js';
import { PageHeader, SearchInput } from '../components/ui.jsx';

/** Sources des données et crédits de chaque photo (exigés par les licences Creative Commons). */
export default function Credits() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => [
    ...Object.entries(IMAGES.foods).map(([id, img]) => ({ name: FOOD[id]?.nom || id, kind: 'Aliment', img })),
    ...Object.entries(IMAGES.recipes).map(([id, img]) => ({ name: RECIPE[id]?.name || id, kind: 'Plat', img })),
  ].sort((a, b) => a.name.localeCompare(b.name, 'fr')), []);
  const shown = q.trim() ? rows.filter(r => norm(`${r.name} ${r.img.author}`).includes(norm(q))) : rows;

  return (
    <>
      <Link to="/profil" className="back small"><ArrowLeft size={16} /> Profil</Link>
      <PageHeader title="Crédits" sub="D’où viennent les données et les photos de Papille." />

      <section className="card card-pad stack credits-src">
        <h2>Données</h2>
        <ul>
          <li><b>Nutriments</b> : Table de composition nutritionnelle des aliments Ciqual 2025, Anses, Licence Ouverte 2.0 (doi:10.57745/RDMHWY).</li>
          <li><b>Ingrédients et recettes</b> : catalogue Bouchée ; recettes adaptées du <i>Livre de cuisine</i> de Wikibooks (CC BY-SA) et recettes rédigées pour Bouchée (CC BY-SA 4.0). Auteurs et licence sur chaque fiche.</li>
          <li><b>Photos</b> : Wikipédia et Wikimedia Commons, auteur et licence ci-dessous ; photos des recettes Wikibooks indiquées sur chaque fiche. Recettes importées : photo de la page d’origine, usage personnel.</li>
          <li><b>Écran de connexion</b> : photo Unsplash (licence Unsplash).</li>
        </ul>
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <div className="row between row-wrap" style={{ gap: 10 }}>
          <h2 className="h2">Photos <span className="muted num" style={{ fontWeight: 500 }}>· {rows.length.toLocaleString('fr-FR')}</span></h2>
          <div style={{ width: 'min(320px, 100%)' }}><SearchInput value={q} onChange={setQ} placeholder="Un aliment, un plat, un auteur…" /></div>
        </div>
        <ul className="card list credit-list">
          {shown.slice(0, 300).map(r => (
            <li key={`${r.kind}-${r.name}`} className="row" style={{ gap: 12 }}>
              <span className="credit-thumb"><img src={r.img.thumb} alt="" loading="lazy" decoding="async" /></span>
              <span className="stack grow" style={{ gap: 0 }}>
                <span className="small b">{r.name} <span className="xs muted">· {r.kind.toLowerCase()}</span></span>
                <span className="xs muted"><a href={r.img.page} target="_blank" rel="noreferrer">{r.img.author}</a> · {r.img.licence} · <a href={r.img.article} target="_blank" rel="noreferrer">article</a></span>
              </span>
            </li>
          ))}
        </ul>
        {shown.length > 300 && <p className="small muted">{shown.length - 300} autres : affinez la recherche.</p>}
      </section>
    </>
  );
}
