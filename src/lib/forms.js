// Formes des aliments : on peut aimer le gruyère fondu sur une pizza et pas en morceau, la tomate en
// sauce et pas crue. Chaque aliment reçoit un modèle de formes selon sa famille ; un aliment qui ne
// change pas vraiment de goût selon la préparation (épices, sauces, céréales, charcuterie…) n'en a
// qu'une, et se note d'un seul coup.
//
// Module sans dépendance : utilisé par l'app (src/lib/logic.js) et par les scripts de génération
// (scripts/recipe-convert.mjs), qui écrivent la forme de chaque ingrédient dans recettes.json.
// Chaque fonction reçoit le référentiel `FOOD` (identifiant → aliment) en paramètre.

/** Formes possibles. `hint` donne des exemples ; un modèle peut les préciser. */
const FORM = {
  cru: ['Cru', 'en salade, à croquer'],
  cuit: ['Cuit', 'poêlé, rôti, vapeur, au four'],
  mixe: ['En soupe ou en purée', 'velouté, purée, coulis'],
  nature: ['Nature', 'en morceau, froid, en salade'],
  fondu: ['Fondu ou gratiné', 'pizza, gratin, croque'],
  visible: ['Tel quel', 'dur, au plat, en omelette'],
  incorpore: ['Incorporé', 'dans un gâteau, une pâte, une sauce'],
  grille: ['Grillé ou rôti', 'poêlé, au four, au barbecue'],
  mijote: ['Mijoté ou en sauce', 'ragoût, curry, blanquette'],
  entier: ['En grains', 'en salade, en curry, en ragoût'],
};
const f = (id, hint, label) => ({ id, label: label || FORM[id][0], hint: hint || FORM[id][1] });

export const MODELS = {
  legume: [f('cru'), f('cuit'), f('mixe')],
  legume_cuit: [f('cuit'), f('mixe')],
  cru_cuit: [f('cru'), f('cuit')],
  allium: [f('cru', 'émincé, en salade'), f('cuit', 'revenu, fondu, confit')],
  tomate: [f('cru'), f('cuit', 'rôtie, farcie, à la provençale'), f('mixe', 'sauce tomate, coulis, soupe', 'En sauce')],
  fruit: [f('cru', 'à croquer, en salade de fruits'), f('cuit', 'compote, tarte, crumble')],
  fromage: [f('nature'), f('fondu')],
  oeuf: [f('visible'), f('incorpore')],
  lait: [f('nature', 'à boire, avec des céréales'), f('incorpore', 'béchamel, gâteau, purée', 'En cuisine')],
  viande: [f('grille'), f('mijote')],
  poisson: [f('cuit', 'poêlé, au four, en papillote'), f('cru', 'tartare, sushi, ceviche')],
  legumineuse: [f('entier'), f('mixe', 'houmous, purée, velouté', 'Mixé ou en purée')],
};

/* ---------- Quel modèle pour quel aliment ---------- */
// Produits déjà transformés : une seule forme (la sauce tomate est déjà « en sauce »)
const PROCESSED = /^(jus|zeste|farine|fecule|creme_de|feuille_de)_|_(au_sirop|sec|seche|sechee|sechees|en_boite|en_poudre|confit|confite|a_l_huile|fume|fumee|cuit|cuite)$|^(coulis_de_tomate|tomate_pelee|compote_de_pomme|oeuf_dur|jaune_d_oeuf|blanc_d_oeuf|meringue|choucroute|tapioca|marron_glace|chataigne|marron|truffe|raclette|fromage_fondu|cancoillotte|fromage_frais|cottage_cheese|mascarpone|brousse|fromage_rape|lait_concentre|lait_concentre_sucre|babeurre|kefir|boeuf_a_braiser|blanquette_de_veau)$/;
const BY_ID = {
  tomate: 'tomate', tomate_cerise: 'tomate', tomate_verte: 'cru_cuit',
  oeuf: 'oeuf', oeuf_de_caille: 'oeuf', oeuf_de_cane: 'oeuf',
  lait: 'lait', lait_entier: 'lait', lait_ecreme: 'lait', lait_de_chevre: 'lait', lait_de_soja: 'lait', lait_d_avoine: 'lait', lait_d_amande: 'lait', lait_de_riz: 'lait',
  champignon_de_paris: 'cru_cuit', poivron: 'cru_cuit', endive: 'cru_cuit', chou_rouge: 'cru_cuit', fenouil: 'cru_cuit', celeri_branche: 'cru_cuit',
  epinard: 'legume', blette: 'legume_cuit', poireau: 'legume_cuit', aubergine: 'legume_cuit', artichaut: 'legume_cuit', asperge: 'legume_cuit', asperge_verte: 'legume_cuit', panais: 'legume_cuit',
  chou_vert: 'legume_cuit', chou_de_bruxelles: 'legume_cuit', chou_chinois: 'legume_cuit', pak_choi: 'legume_cuit', chou_kale: 'legume_cuit', romanesco: 'legume_cuit',
  haricot_vert: 'legume_cuit', haricot_beurre: 'legume_cuit', petit_pois: 'legume_cuit', pois_gourmand: 'legume_cuit', feve: 'legume_cuit', edamame: 'legume_cuit',
  pois_chiche: 'legumineuse', lentille: 'legumineuse', feve_seche: 'legumineuse', flageolet: 'legumineuse', pois_casse: 'legumineuse',
  saumon: 'poisson', pave_de_saumon: 'poisson', thon: 'poisson', thon_frais: 'poisson', dorade: 'poisson', bar: 'poisson', maquereau: 'poisson',
};
// Catégories du référentiel (un aliment hérite du modèle de son ancêtre le plus proche)
const BY_CATEGORY = {
  fromage: 'fromage', allium: 'allium', tubercule: 'legume_cuit', courge: 'legume_cuit',
  haricot_sec: 'legumineuse', lentille: 'legumineuse',
  // Une seule forme : feuilles à salade, champignons sauvages (toujours cuits), agrumes (jus, zeste), fruits secs, olives
  legume_feuille: null, champignon: null, agrume: null, fruit_sec: null, olive: null, noix_de_coco: null, poisson: null,
};
const SINGLE_IDS = new Set(['ciboule', 'ail_des_ours', 'radis', 'concombre', 'avocat', 'piment', 'cornichon', 'algue', 'banane_plantain']);
// Charcuterie, abats, graisses : une seule forme
const MEAT_SINGLE = /jambon|lard|bacon|chorizo|saucisse|merguez|pancetta|nduja|rillettes|sobrasada|saindoux|graisse|couenne|crepine|boyau|sang_|os_a_moelle|bouillon|carcasse|foie|gesier|rognon|ris_de|langue|pied_de|corned|viande_sechee|palette|queue/;

const ancestors = (id, FOOD) => { const out = []; for (let x = FOOD[id], d = 0; x && d < 8; x = FOOD[x.parent], d++) out.push(x.id); return out; };

/** Nom du modèle de formes d'un aliment, ou null s'il n'a qu'une forme. */
export function modelOf(id, FOOD) {
  const food = FOOD[id];
  if (!food || food.categorie || PROCESSED.test(id) || SINGLE_IDS.has(id)) return null;
  if (id in BY_ID) return BY_ID[id];
  for (const a of ancestors(id, FOOD).slice(1)) if (a in BY_CATEGORY) return BY_CATEGORY[a];
  if (food.famille === 'viandes') return MEAT_SINGLE.test(id) ? null : 'viande';
  if (food.famille === 'legumes') return 'legume';
  if (food.famille === 'fruits') return 'fruit';
  return null;
}

/** Formes du modèle d'un aliment (tableau vide : une seule forme). */
export const modelForms = (id, FOOD) => MODELS[modelOf(id, FOOD)] || [];

/** Libellé d'une forme pour un aliment (« Fondu ou gratiné »), selon son modèle. */
export function formLabel(id, form, FOOD) {
  if (!form) return '';
  return modelForms(id, FOOD).find(x => x.id === form)?.label || FORM[form]?.[0] || form;
}

/* ---------- Forme d'un ingrédient dans une recette ---------- */
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/[’`]/g, "'");
const COOK = /\b(cuire|cuisson|cuit|cuits|cuite|cuites|precuit|revenir|rissol|faire sauter|sautez|sauter|poel|rotir|roti|rotis|griller|grillez|grille|grilles|four|enfourn|mijot|bouill|frire|frit|friture|braise|braiser|blanchir|etuv|dorer|confire|caramelis|gratin|fondre|vapeur|rechauff|chauff|wok|barbecue|plancha|compote|suer|saisir|saisis|frema|frissonn|ebullition)/;
const MIX = /\b(mix|blender|mouli|robot|puree|ecras|veloute|chinois|coulis|compote|broy|reduire en|hach(er|ez) finement au|houmous|hoummos)/;
const RAW = /\b(cru|crus|crue|crues|tartare|carpaccio|ceviche|sushis?|makis?|gravlax|tataki|poke)\b/;
const SERVE = /(au moment de servir|avant de servir|pour servir|servir avec|servez avec|parsem|decor|garni|accompagn|saupoudr)/;
const MIX_TITLE = /\b(veloute|puree|coulis|compote|gaspacho|gazpacho|houmous|hoummos|caviar d|guacamole|smoothie|creme de|soupe moulinee|tapenade|falafels?)\b/;
const EGG_VISIBLE = /\b(omelettes?|oeufs? (durs?|au plat|mollets?|brouilles?|a la coque|cocotte|poches?|mimosa|frits?|en meurette)|frittata|tortilla|shakshuka|chakchouka|piperade|croque-madame|nids?)\b/;
const STEW = /\b(mijot|braise|braiser|ragout|blanquette|bourguignon|daube|navarin|civet|tajine|tagine|colombo|pot-au-feu|potee|cocotte|curry|chili|bolognaise|hachis|parmentier|goulash|stifado|en sauce)\b/;
const LONG = /couvr.*(\d+ ?h\b|heure|[3-9]\d ?min)|(\d+ ?h\b|heure|[3-9]\d ?min).*couvr/;
const TOMATO_SAUCE = /\b(mijot|reduire|reduction|compot|concass|fondue de tomate|sauce|coulis|ecras|mix)/;
const MELTED = /\b(gratin|gratine|gratinee|gratines|pizzas?|croque|fondue|raclette|tartiflette|quiches?|lasagnes?|souffle|cheeseburger|burgers?|tarte flambee|flammekueche|welsh|aligot|truffade)\b/;
const FLOUR =/farine|levure|pate (brisee|feuilletee|sablee|a crepe)|biscuit|gateau|cake|crepe|gaufre|beignet/;
const STOP = new Set(['fromage', 'sauce', 'huile', 'pate', 'pates', 'jus', 'creme', 'poudre', 'feuille', 'frais', 'fraiche', 'nature', 'entier', 'entiere', 'blanc', 'noir', 'rouge', 'vert', 'verte',
  'tete', 'gousse', 'brin', 'filet', 'pave', 'tranche', 'morceau', 'cuisse', 'aile', 'escalope', 'cote', 'petit', 'petite', 'gros', 'grosse', 'jeune', 'pousse', 'graine', 'zeste', 'des', 'les']);

/** Radicaux qui désignent un aliment dans le texte des étapes (« tomates » → tomate, « gruyère » → gruyere). */
function stemsOf(id, FOOD) {
  const food = FOOD[id];
  // Le nom, et les autres appellations d'un seul mot (« tête d'ail » désignerait la tête, pas l'ail)
  const names = [food.nom, ...(food.alias || []).filter(n => !/[^a-z]/.test(norm(n)))];
  const stems = new Set();
  for (const n of names) {
    const w = norm(n).split(/[^a-z]+/).filter(x => x.length >= 3 && !STOP.has(x))[0];
    if (w) stems.add(w.length > 4 ? w.replace(/(s|x)$/, '') : w);
  }
  // « Le fromage », « les légumes » : renvoi générique vers l'aliment
  const parent = FOOD[food.parent];
  if (parent) { const w = norm(parent.nom).split(/[^a-z]+/)[0]; if (w && w.length >= 4) stems.add(w.replace(/(s|x)$/, '')); }
  if (food.famille === 'legumes') stems.add('legume');
  if (food.famille === 'fruits') stems.add('fruit');
  return [...stems];
}

/** Déduit la forme sous laquelle chaque aliment d'une recette est mangé.
 *  `recipe` : { name, type, steps: [texte], lines: [{ text, foods: [id] }] }.
 *  Renvoie, pour chaque ligne, un objet { idAliment: forme } (vide si l'aliment n'a qu'une forme). */
export function inferForms(recipe, FOOD) {
  const steps = (recipe.steps || []).map(norm);
  const title = norm(recipe.name);
  const all = `${title} ${steps.join(' ')}`;
  const salad = recipe.type === 'Salade';
  const cookedRecipe = steps.some(s => COOK.test(s));
  return (recipe.lines || []).map(line => {
    const out = {};
    const text = norm(line.text || line.name);
    for (const id of line.foods || []) {
      const model = modelOf(id, FOOD);
      if (!model) continue;
      const stems = stemsOf(id, FOOD);
      const mentions = steps.map((s, i) => (stems.some(w => new RegExp(`\\b${w}`).test(s)) ? i : -1)).filter(i => i >= 0);
      const first = mentions.length ? mentions[0] : 0;
      const later = steps.slice(first);
      const direct = mentions.some(i => COOK.test(steps[i]));
      // Parsemé au moment de servir, sans cuisson ensuite : reste cru (persil, parmesan sur des pâtes)
      const servedRaw = mentions.length > 0 && mentions.every(i => SERVE.test(steps[i]) && !COOK.test(steps[i]))
        && !steps.slice(mentions[mentions.length - 1] + 1).some(s => COOK.test(s));
      const cooked = /\b(cuit|cuite|cuits|cuites|grille|grilles|grillee|grillees|roti|rotie|rotis|confit|poele|poelee|precuit)\b/.test(text)
        || direct || (!salad && !servedRaw && cookedRecipe && later.some(s => COOK.test(s)));
      // Mixé : dit dans le titre (purée, velouté), dans une étape qui cite l'aliment, ou en fin de soupe
      const mixed = MIX_TITLE.test(title) || mentions.some(i => MIX.test(steps[i])) || (recipe.type === 'Soupe' && later.some(s => MIX.test(s)));
      let form;
      switch (model) {
        case 'fromage': form = cooked || MELTED.test(title) ? 'fondu' : 'nature'; break;
        case 'oeuf': form = EGG_VISIBLE.test(all) || /\bdurs?\b/.test(text) ? 'visible' : 'incorpore'; break;
        case 'lait': form = !cookedRecipe && !FLOUR.test(all) ? 'nature' : 'incorpore'; break;
        case 'viande': form = recipe.type === 'Soupe' || STEW.test(title) || mentions.some(i => STEW.test(steps[i])) || steps.some(s => LONG.test(s) && COOK.test(s)) ? 'mijote' : 'grille'; break;
        case 'poisson': form = !direct && (RAW.test(title) || RAW.test(text) || mentions.some(i => RAW.test(steps[i]))) ? 'cru' : 'cuit'; break;
        case 'legumineuse': form = mixed ? 'mixe' : 'entier'; break;
        case 'tomate': form = mixed || (cooked && (later.some(s => TOMATO_SAUCE.test(s)) || /sauce|coulis/.test(title))) ? 'mixe' : cooked ? 'cuit' : 'cru'; break;
        case 'legume': form = mixed && (cooked || /gaspacho|gazpacho|guacamole|smoothie|coulis/.test(title)) ? 'mixe' : cooked ? 'cuit' : 'cru'; break;
        case 'legume_cuit': form = mixed ? 'mixe' : 'cuit'; break;
        default: form = cooked ? 'cuit' : 'cru'; // fruit, cru_cuit, allium
      }
      out[id] = form;
    }
    return out;
  });
}
