// Ajoute (ou met à jour) les recettes rédigées pour Papille dans public/data/recettes.json,
// sans avoir besoin du dossier source du catalogue Bouchée :
//
//   node scripts/add-papille-recipes.mjs
//
// Les recettes Papille déjà présentes (auteurs « Papille ») sont remplacées par celles de
// scripts/recettes-papille.mjs ; le reste du fichier est conservé tel quel.
// Vérifie au passage que chaque ingrédient cité existe dans le référentiel et a des nutriments.

import { readFileSync, writeFileSync } from 'node:fs';
import { makeConverter } from './recipe-convert.mjs';
import { LICENCE, PAPILLE_RECIPES } from './recettes-papille.mjs';

const OUT = new URL('../public/data/', import.meta.url);
const { aliments } = JSON.parse(readFileSync(new URL('aliments.json', OUT), 'utf8'));
const data = JSON.parse(readFileSync(new URL('recettes.json', OUT), 'utf8'));
const { convert, FOOD } = makeConverter(aliments);

// Contrôles : identifiants connus, pas de doublon d'identifiant ni de nom avec le catalogue
const errors = [];
const others = data.recettes.filter(r => r.src?.a !== 'Papille');
const ids = new Set(others.map(r => r.id));
const names = new Set(others.map(r => r.name.toLowerCase()));
for (const r of PAPILLE_RECIPES) {
  if (ids.has(r.id)) errors.push(`${r.id} : identifiant déjà pris`);
  if (names.has(r.titre.toLowerCase())) errors.push(`${r.titre} : nom déjà présent dans le catalogue`);
  for (const l of r.lignes) for (const id of l.ingredients) {
    if (!FOOD[id]) errors.push(`${r.titre} : ingrédient inconnu « ${id} »`);
    else if (FOOD[id].categorie) errors.push(`${r.titre} : « ${id} » est une catégorie, pas un aliment précis`);
  }
}
if (new Set(PAPILLE_RECIPES.map(r => r.id)).size !== PAPILLE_RECIPES.length) errors.push('identifiants en double dans recettes-papille.mjs');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const added = PAPILLE_RECIPES.map(convert);
data.recettes = [...others, ...added];
data.licence = LICENCE;
data.genere_le = new Date().toISOString();
writeFileSync(new URL('recettes.json', OUT), JSON.stringify(data));

console.log(`${added.length} recettes Papille, ${data.recettes.length} au total`);
for (const r of added) console.log(`${r.type.padEnd(15)} ${String(Math.round(r.n[0])).padStart(4)} kcal  couverture ${Math.round(r.cov * 100)} %  ${r.name}  [${r.main.join(', ')}]`);
