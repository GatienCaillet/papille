// Analyse d'une ligne d'ingrédient en français (« 2 gousses d'ail ») et rapprochement avec le référentiel.
// Ne devine pas : une ligne sans aliment reconnu reste sans aliment, et la recette sera « impossible à vérifier ».

import { FOOD } from '../data/foods.js';

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/[’`]/g, "'");

/* ---------- Unités ---------- */
// [formes reconnues (normalisées), unité affichée, grammes par unité]
const UNITS = [
  [['kg', 'kilo', 'kilos', 'kilogramme', 'kilogrammes'], 'kg', 1000],
  [['g', 'gr', 'grs', 'gramme', 'grammes'], 'g', 1],
  [['mg'], 'mg', 0.001],
  [['l', 'litre', 'litres'], 'L', 1000],
  [['dl', 'decilitre', 'decilitres'], 'dl', 100],
  [['cl', 'centilitre', 'centilitres'], 'cl', 10],
  [['ml', 'millilitre', 'millilitres'], 'ml', 1],
  [['cuillere a soupe', 'cuilleres a soupe', 'cuillerees a soupe', 'cuilleree a soupe', 'c. a soupe', 'c.a soupe', 'c a soupe', 'cuil. a soupe', 'c. a s.', 'c.a.s', 'cas', 'cs', 'c. s.', 'cuill. a soupe'], 'c. à s.', 15],
  [['cuillere a cafe', 'cuilleres a cafe', 'cuilleree a cafe', 'cuillerees a cafe', 'c. a cafe', 'c.a cafe', 'c a cafe', 'cuil. a cafe', 'c. a c.', 'c.a.c', 'cac', 'cc', 'c. c.', 'cuill. a cafe'], 'c. à c.', 5],
  [['pincee', 'pincees'], 'pincée', 0.5],
  [['gousse', 'gousses'], 'gousse', 5],
  [['tranche', 'tranches'], 'tranche', 30],
  [['sachet', 'sachets'], 'sachet', 10],
  [['boite', 'boites'], 'boîte', 400],
  // « verre à moutarde » est une mesure, pas de la moutarde
  [['verre a moutarde', 'verres a moutarde', 'verre', 'verres'], 'verre', 200],
  [['tasse', 'tasses'], 'tasse', 240],
  [['botte', 'bottes'], 'botte', 250],
  [['bouquet', 'bouquets'], 'bouquet', 30],
  [['branche', 'branches'], 'branche', 2],
  [['brin', 'brins'], 'brin', 1],
  [['feuille', 'feuilles'], 'feuille', 1],
  [['morceau', 'morceaux'], 'morceau', 30],
  [['filet', 'filets'], 'filet', 5],
  [['pave', 'paves'], 'pavé', 150],
  [['zeste', 'zestes'], 'zeste', 2],
  [['paquet', 'paquets'], 'paquet', 250],
  [['poignee', 'poignees'], 'poignée', 30],
  [['bol', 'bols'], 'bol', 250],
  [['barquette', 'barquettes'], 'barquette', 250],
  [['noix'], 'noix', 10],
];
const UNIT_FORMS = UNITS.flatMap(([forms, label, g]) => forms.map(f => [f, label, g])).sort((a, b) => b[0].length - a[0].length);

const PIECE_G = {
  oeuf: 55, jaune_d_oeuf: 18, blanc_d_oeuf: 33, oignon: 100, echalote: 25, ail: 5, carotte: 100, pomme_de_terre: 150, tomate: 120,
  citron: 100, citron_vert: 60, orange: 180, courgette: 200, aubergine: 250, poivron: 150, pomme: 150, poire: 150, banane: 120,
  poireau: 150, concombre: 300, avocat: 150, navet: 120, patate_douce: 200, betterave: 120, fenouil: 250,
};
const FAMILY_PIECE_G = { legumes: 120, fruits: 120, viandes: 150, 'poissons-fruits-de-mer': 130 };

/* ---------- Index des noms du référentiel ---------- */
let index = null;
function buildIndex() {
  const m = new Map();
  for (const f of Object.values(FOOD)) {
    for (const n of [f.nom, ...(f.alias || [])]) {
      const k = norm(n).replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (k.length < 2) continue;
      // Un nom porté par plusieurs aliments : on garde l'aliment « réel » plutôt que la catégorie
      const cur = m.get(k);
      if (!cur || (FOOD[cur].categorie && !f.categorie)) m.set(k, f.id);
    }
  }
  return [...m.entries()].sort((a, b) => b[0].length - a[0].length);
}

const NUM = /^(?:(½|¼|¾)|(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|huit|dix|douze)\b)/;
const WORDS = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, huit: 8, dix: 10, douze: 12 };
const toNumber = s => {
  if (!s) return null;
  if (s in WORDS) return WORDS[s];
  if (s === '½') return 0.5;
  if (s === '¼') return 0.25;
  if (s === '¾') return 0.75;
  const f = s.match(/(\d+)\s*\/\s*(\d+)/);
  if (f) return Number(f[1]) / Number(f[2]);
  return Number(s.replace(',', '.'));
};

/** « 2 gousses d'ail hachées » → { qty: 2, unit: 'gousse', name: 'Ail hachées', foods: ['ail'], grams: 10 } */
export function parseIngredient(text) {
  if (!index) index = buildIndex();
  const raw = text.replace(/\s+/g, ' ').trim();
  let s = norm(raw);
  let qty = null;
  let unit = '';
  let gPerUnit = null;

  const n = s.match(NUM);
  if (n) {
    qty = toNumber(n[1] || n[2]);
    s = s.slice(n[0].length).trim();
    const range = s.match(/^(?:a|-)\s*(\d+(?:[.,]\d+)?)\b/);
    if (range) { qty = (qty + toNumber(range[1])) / 2; s = s.slice(range[0].length).trim(); }
  }
  s = s.replace(/^(grosse|gros|petite|petit|belle|bonne|grande|demi)\s+/, '');
  // « une noix de beurre », « des noisettes de beurre » : des mesures, pas des fruits à coque
  const knob = s.match(/^(noix|noisettes?)\s+(?:de |d')(?=(beurre|margarine|creme|saindoux)\b)/);
  if (knob) {
    unit = 'noix';
    gPerUnit = knob[1] === 'noix' ? 10 : 5;
    s = s.slice(knob[0].length);
    if (qty === null) qty = 1;
  }
  const u = knob ? null : UNIT_FORMS.find(([form]) => s === form || s.startsWith(`${form} `) || s.startsWith(`${form}.`) || (form.length <= 2 && new RegExp(`^${form.replace(/\./g, '\\.')}(?=\\b|\\d)`).test(s)));
  if (u && (qty !== null || !['noix', 'feuille', 'filet', 'zeste'].includes(u[1]))) {
    unit = u[1];
    gPerUnit = u[2];
    s = s.slice(u[0].length).replace(/^\.?\s*/, '');
  }
  s = s.replace(/^(de |d'|des |du )/, '').trim();

  // Aliments reconnus : plus longs noms d'abord, mots entiers, sans chevauchement
  const words = ` ${s.replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ')} `;
  let rest = words;
  const foods = [];
  for (const [k, id] of index) {
    const re = new RegExp(`[ ']${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|x)?(?= )`);
    if (re.test(rest)) {
      if (!foods.includes(id)) foods.push(id);
      rest = rest.replace(re, ' '.repeat(k.length + 1));
      if (foods.length >= 3) break;
    }
  }
  // « sel et poivre », « huile d'olive » : on garde l'aliment le plus précis quand l'un est le parent de l'autre
  const kept = foods.filter(id => !foods.some(o => o !== id && FOOD[o]?.parent === id));

  const nameStart = raw.length - raw.replace(/^[\d.,/½¼¾\s]+/, '').length;
  let name = raw.slice(nameStart).trim();
  name = name.replace(/^(grosses?|gros|petites?|petits?|belles?|bonnes?|grandes?)\s+(?=(noix|noisettes?)\s)/i, '');
  if (unit) name = name.replace(new RegExp(`^[^\\s]+(?:\\s+(?:à|a)\\s+(?:soupe|café))?\\.?\\s*`, 'i'), '');
  name = name.replace(/^(quelques |un peu de |un peu d'|du |de la |de l'|de |d'|d’|des )/i, '').trim() || (kept[0] ? FOOD[kept[0]].nom : raw);
  name = name[0].toUpperCase() + name.slice(1);

  let grams = null;
  if (qty !== null && kept.length === 1) {
    if (gPerUnit !== null) grams = qty * gPerUnit;
    else {
      const f = FOOD[kept[0]];
      let x = f; let piece = null;
      while (x && piece === null) { piece = PIECE_G[x.id] ?? null; x = FOOD[x.parent]; }
      grams = qty * (piece ?? FAMILY_PIECE_G[f.famille] ?? NaN);
      if (Number.isNaN(grams)) grams = null;
    }
  }
  return { text: raw, qty, unit, name, foods: kept, grams };
}

/* ---------- Rayon ---------- */
export function aisleOf(id) {
  const f = FOOD[id];
  if (!f) return 'Autres';
  if (/^(pain|baguette|brioche|croissant)/.test(id)) return 'Boulangerie';
  if (f.famille === 'legumes' || f.famille === 'fruits') return 'Fruits et légumes';
  if (f.famille === 'viandes' || f.famille === 'poissons-fruits-de-mer') return 'Boucherie et poisson';
  if (f.famille === 'produits-laitiers-oeufs') return 'Frais';
  return 'Épicerie';
}
