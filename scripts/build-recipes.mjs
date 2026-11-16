// Construit public/data/recettes.json à partir de l'export du catalogue Bouchée.
//
//   node scripts/build-recipes.mjs <dossier-sources>
//
// À lancer après build-foods.mjs (il lit public/data/aliments.json pour les nutriments).
// Ajoute à chaque recette : type de plat et origine (estimés), nutriments par portion (estimés à
// partir des quantités), ingrédients principaux, rayon de chaque ligne pour les courses.
// Les recettes restent sous CC BY-SA : chaque fichier garde sa source, ses auteurs et sa licence.
// Les recettes rédigées pour Papille (scripts/recettes-papille.mjs) sont ajoutées à la suite ;
// pour les mettre à jour sans le dossier source : node scripts/add-papille-recipes.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeConverter } from './recipe-convert.mjs';
import { LICENCE, PAPILLE_RECIPES } from './recettes-papille.mjs';

const SRC = process.argv[2];
if (!SRC) { console.error('Usage : node scripts/build-recipes.mjs <dossier-sources>'); process.exit(1); }
const OUT = new URL('../public/data/', import.meta.url);

const { aliments } = JSON.parse(readFileSync(new URL('aliments.json', OUT), 'utf8'));
const recettes = JSON.parse(readFileSync(join(SRC, 'recettes.json'), 'utf8')).recettes;

const { convert, partial } = makeConverter(aliments);
// Catalogue Bouchée, puis les recettes rédigées pour Papille (scripts/recettes-papille.mjs)
const out = [...recettes, ...PAPILLE_RECIPES].map(convert);

writeFileSync(new URL('recettes.json', OUT), JSON.stringify({
  genere_le: new Date().toISOString(),
  licence: LICENCE,
  recettes: out,
}));

const count = k => Object.entries(out.reduce((m, r) => ({ ...m, [r[k]]: (m[r[k]] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
console.log(`${out.length} recettes, ${out.filter(r => r.photo).length} avec photo, ${partial()} avec nutriments partiels (< 70 % des lignes)`);
console.log('Types :', count('type').map(([k, v]) => `${k} ${v}`).join(', '));
console.log('Origines :', count('origin').map(([k, v]) => `${k} ${v}`).join(', '));
