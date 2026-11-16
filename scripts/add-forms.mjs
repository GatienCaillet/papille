// Écrit la forme de chaque ingrédient (cru, cuit, fondu ou gratiné, en sauce…) dans
// public/data/recettes.json, sans le dossier source du catalogue Bouchée :
//
//   node scripts/add-forms.mjs
//
// build-recipes.mjs et add-papille-recipes.mjs le font déjà à la conversion ; ce script sert après
// une modification des règles de src/lib/forms.js. Une forme écrite à la main dans le fichier
// (champ `fo` d'une ligne, marqué par `foManuel`) est conservée.

import { readFileSync, writeFileSync } from 'node:fs';
import { lineForms } from './recipe-convert.mjs';

const OUT = new URL('../public/data/', import.meta.url);
const { aliments } = JSON.parse(readFileSync(new URL('aliments.json', OUT), 'utf8'));
const FOOD = Object.fromEntries(aliments.map(a => [a.id, a]));
const data = JSON.parse(readFileSync(new URL('recettes.json', OUT), 'utf8'));

const counts = {};
let lines = 0;
for (const r of data.recettes) {
  const forms = lineForms(r, FOOD, r.ing.map(i => (i.foManuel ? i.fo : null)));
  r.ing.forEach((i, k) => {
    if (forms[k]) { i.fo = forms[k]; lines++; for (const f of Object.values(forms[k])) counts[f] = (counts[f] || 0) + 1; } else delete i.fo;
  });
}
writeFileSync(new URL('recettes.json', OUT), JSON.stringify(data));
console.log(`${lines} lignes avec une forme sur ${data.recettes.reduce((s, r) => s + r.ing.length, 0)}`);
console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
