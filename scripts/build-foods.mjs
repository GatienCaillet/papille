// Construit les données d'aliments de Papille.
//
//   node scripts/build-foods.mjs <dossier-sources>
//
// <dossier-sources> contient :
//   - xlsx/          : « Table Ciqual 2025_FR_2025_11_03.xlsx » décompressé (Anses, Licence Ouverte 2.0,
//                      doi:10.57745/RDMHWY)
//   - ingredients.json, recettes.json : export du catalogue Bouchée
//                      (https://gatiencaillet.github.io/bouchee-catalogue/v1/)
//
// Produit :
//   - public/data/aliments.json : les ingrédients du référentiel (allergènes, composants, taxonomie),
//     leurs nutriments CIQUAL et leur rang d'usage dans les recettes (les 200 premiers = base du swipe) ;
//   - public/data/ciqual.json : toute la table CIQUAL (nom, groupe, nutriments) pour le journal.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2];
if (!SRC) { console.error('Usage : node scripts/build-foods.mjs <dossier-sources>'); process.exit(1); }
const OUT = new URL('../public/data/', import.meta.url);
mkdirSync(OUT, { recursive: true });

/* ---------- Lecture xlsx (sans dépendance) ---------- */
const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
function readSheet(dir) {
  const ss = readFileSync(join(dir, 'xl/sharedStrings.xml'), 'utf8');
  const strings = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]).join('')));
  const xml = readFileSync(join(dir, 'xl/worksheets/sheet1.xml'), 'utf8');
  const rows = [];
  for (const r of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const col = c[1].split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const v = c[3] ? (c[3].match(/<v>([\s\S]*?)<\/v>/) || c[3].match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1] : undefined;
      if (v !== undefined) row[col] = /t="s"/.test(c[2]) ? strings[Number(v)] : decode(v);
    }
    rows.push(row);
  }
  return rows;
}

/* ---------- CIQUAL ---------- */
const rows = readSheet(join(SRC, 'xlsx'));
const head = rows[0].map(h => (h || '').replace(/\s+/g, ' ').trim());
const col = (re, label) => {
  const i = head.findIndex(h => re.test(h));
  if (i < 0) throw new Error(`Colonne introuvable : ${label}`);
  return i;
};
// Même ordre que NUTRIENTS dans src/lib/logic.js
const NUT = [
  col(/^Energie, Règlement UE N° 1169 2011 \(kcal/, 'énergie kcal'),
  col(/^Protéines, N x facteur de Jones/, 'protéines'),
  col(/^Glucides/, 'glucides'),
  col(/^Lipides/, 'lipides'),
  col(/^Fibres alimentaires/, 'fibres'),
  col(/^Fer /, 'fer'),
  col(/^Calcium/, 'calcium'),
  col(/^Magnésium/, 'magnésium'),
  col(/^Vitamine C /, 'vitamine C'),
  col(/^Vitamine D \(/, 'vitamine D'),
  col(/^Vitamine B12/, 'vitamine B12'),
];
const C = { grp: col(/^alim_grp_nom_fr$/, 'groupe'), ssgrp: col(/^alim_ssgrp_nom_fr$/, 'sous-groupe'), code: col(/^alim_code$/, 'code'), nom: col(/^alim_nom_fr$/, 'nom') };

// « 1,3 » → 1.3 ; « traces » → 0 ; « < 0,5 » → moitié du seuil ; « - » → null (non mesuré)
function val(s) {
  if (s === undefined || s === null) return null;
  const t = String(s).trim().replace(',', '.');
  if (t === '-' || t === '') return null;
  if (/^traces$/i.test(t)) return 0;
  const lt = t.match(/^<\s*([\d.]+)/);
  if (lt) return Math.round((Number(lt[1]) / 2) * 1000) / 1000;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
const round = v => (v === null ? null : Math.round(v * 100) / 100);

const ciqual = new Map();
for (const r of rows.slice(1)) {
  const code = r[C.code];
  if (!code) continue;
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  ciqual.set(String(code), { code: String(code), nom: clean(r[C.nom]), groupe: clean(r[C.grp]), sousGroupe: clean(r[C.ssgrp]), n: NUT.map(i => round(val(r[i]))) });
}

/* ---------- Référentiel et recettes du catalogue ---------- */
const cat = JSON.parse(readFileSync(join(SRC, 'ingredients.json'), 'utf8'));
const recettes = JSON.parse(readFileSync(join(SRC, 'recettes.json'), 'utf8')).recettes;
const ingredients = cat.ingredients;
const parents = new Set(ingredients.map(i => i.parent).filter(Boolean));
// Catégorie abstraite (« légume », « viande ») : a des enfants et pas d'équivalent CIQUAL.
// La pomme de terre a des enfants (fécule) mais reste un aliment.
const isCategory = i => parents.has(i.id) && !i.ciqual;

// Usage : nombre de recettes où l'ingrédient apparaît
const usage = new Map();
for (const r of recettes) {
  const ids = new Set(r.lignes.flatMap(l => l.ingredients || []));
  for (const id of ids) usage.set(id, (usage.get(id) || 0) + 1);
}
// Pas de swipe sur les assaisonnements de base ni sur les catégories
const STOP = /^(eau|sel|poivre|sucre|farine|levure|bicarbonate|fecule|vinaigre|huile|glacon|gelatine|colorant|arome)/;
const ranked = ingredients
  .filter(i => !isCategory(i) && !STOP.test(i.id) && i.famille !== 'matieres-grasses' && usage.get(i.id))
  .sort((a, b) => usage.get(b.id) - usage.get(a.id) || a.nom.localeCompare(b.nom, 'fr'));
const rank = new Map(ranked.map((i, k) => [i.id, k + 1]));

// Codes du référentiel (CIQUAL 2020) absents de CIQUAL 2025 : équivalent 2025 choisi à la main.
// Les rares restants (amidon, nougat, margarine…) n'ont pas d'équivalent clair et restent sans nutriments.
const CODE_2025 = {
  tomate: '20385', coulis_de_tomate: '20260', salsa: '20260', asperge: '20279', boisson_a_l_avoine: '18899',
  brioche: '7746', croissant: '7603', chevre_frais: '12805', gambas: '10061', gnocchi: '25510',
  huile_de_palme: '16150', lentille: '20360', lentille_beluga: '20360', mais: '20066', mie_de_pain: '7111',
  nectarine: '13399', noix_de_grenoble: '15005', pate_feuilletee: '23424', raisin: '13395',
  bouillon_de_viande: '25930', fromage_a_pate_dure: '12100', filet_mignon_de_porc: '28204', wakame: '20999',
  flocons_de_mais: '32005', ble: '9060',
};

let withNut = 0;
const aliments = ingredients.map(i => {
  const code = ciqual.has(String(i.ciqual)) ? String(i.ciqual) : CODE_2025[i.id];
  const c = code ? ciqual.get(code) : null;
  if (c) withNut++;
  const o = { id: i.id, nom: i.nom, famille: i.famille };
  if (i.parent) o.parent = i.parent;
  if (i.alias?.length) o.alias = i.alias;
  if (i.allergenes?.length) o.allergenes = i.allergenes;
  if (i.composants?.length) o.composants = i.composants;
  if (i.composition_variable) o.composition_variable = true;
  if (i.sensoriel) o.sensoriel = i.sensoriel;
  if (isCategory(i)) o.categorie = true;
  if (c) { o.ciqual = c.code; o.n = c.n; }
  if (usage.get(i.id)) o.usage = usage.get(i.id);
  if (rank.get(i.id)) o.rang = rank.get(i.id);
  return o;
});

const meta = {
  genere_le: new Date().toISOString(),
  sources: [
    'Table de composition nutritionnelle des aliments Ciqual 2025, Anses (Licence Ouverte 2.0), doi:10.57745/RDMHWY',
    'Référentiel d’ingrédients du catalogue Bouchée (github.com/GatienCaillet/bouchee-catalogue)',
  ],
  nutriments: ['kcal', 'prot', 'gluc', 'lip', 'fib', 'fer', 'ca', 'mg', 'vitc', 'vitd', 'b12'],
};

writeFileSync(new URL('aliments.json', OUT), JSON.stringify({ ...meta, allergenes: cat.allergenes, aliments }));
writeFileSync(new URL('ciqual.json', OUT), JSON.stringify({ ...meta, aliments: [...ciqual.values()].map(c => [c.code, c.nom, c.groupe, c.sousGroupe, ...c.n]) }));

console.log(`CIQUAL : ${ciqual.size} aliments`);
console.log(`Référentiel : ${aliments.length} ingrédients, ${withNut} avec nutriments, ${ranked.length} classés par usage`);
console.log(`Base (200) : ${ranked.slice(0, 200).map(i => i.nom).slice(0, 40).join(', ')}…`);
