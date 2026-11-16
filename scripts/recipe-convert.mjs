// Conversion d'une recette au format source (catalogue Bouchée, ou recettes Papille de scripts/recettes-papille.mjs)
// vers le format de public/data/recettes.json : type de plat et origine estimés, nutriments par portion
// estimés à partir des quantités, ingrédients principaux, rayon de chaque ligne pour les courses.
// Utilisé par build-recipes.mjs et add-papille-recipes.mjs.
// Forme de chaque ingrédient (cru, cuit, fondu…) : déduite des étapes par src/lib/forms.js, ou
// imposée par la recette source (champ `forme` d'une ligne : « fondu », ou { gruyere: 'fondu' }).

import { inferForms, modelForms } from '../src/lib/forms.js';

/** Formes des lignes d'une recette convertie (champ `fo` de chaque ligne), explicites d'abord. */
export function lineForms(r, FOOD, explicit = []) {
  const inferred = inferForms({ name: r.name, type: r.type, steps: r.steps, lines: r.ing.map(i => ({ text: i.t, foods: i.f })) }, FOOD);
  return r.ing.map((l, k) => {
    const e = explicit[k];
    const out = { ...inferred[k] };
    for (const id of l.f) {
      const want = typeof e === 'string' ? e : e?.[id];
      if (want && modelForms(id, FOOD).some(x => x.id === want)) out[id] = want;
    }
    return Object.keys(out).length ? out : null;
  });
}

export function makeConverter(aliments) {
  const FOOD = Object.fromEntries(aliments.map(a => [a.id, a]));
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/[’`]/g, "'");
  const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

  /* ---------- Ancêtres (pour reconnaître viande, poisson…) ---------- */
  const ancestors = id => { const out = []; let x = FOOD[id]; while (x) { out.push(x.id); x = FOOD[x.parent]; } return out; };
  const famille = id => FOOD[id]?.famille;

  /* ---------- Type de plat ---------- */
  const SWEET = ['sucre', 'sucre_glace', 'cassonade', 'sucre_roux', 'sucre_vanille', 'miel', 'chocolat', 'chocolat_noir', 'chocolat_au_lait', 'vanille', 'sirop_d_erable', 'confiture'];
  const SAVORY_ROOTS = ['oignon', 'ail', 'echalote', 'viande', 'poisson', 'fruit_de_mer', 'poivre', 'bouillon', 'moutarde', 'fromage'];
  function typeOf(r, ids) {
    const t = norm(r.titre);
    // Le titre commence par la préparation (« Pesto », « Sauce tomate »), pas « Agneau au pesto »
    if (/^(sauce|bechamel|mayonnaise|vinaigrette|pesto|tapenade|anchoiade|houmous|caviar d|chutney|amlou|beurre (blanc|monte|d'escargot)|fond de|bouillon de|pate (brisee|feuilletee|sablee|a pizza|a crepe|a choux)|boeuf hache|marinade)\b/.test(t)) return 'Sauce et base';
    const sweet = ids.some(i => SWEET.some(s => ancestors(i).includes(s)));
    const savory = ids.some(i => ancestors(i).some(a => SAVORY_ROOTS.includes(a)) || ['viandes', 'poissons-fruits-de-mer'].includes(famille(i)));
    if (sweet && !savory) return 'Dessert';
    if (/\b(soupe|veloute|potage|bortsch|gaspacho|minestrone|chorba|harira|bouillabaisse|garbure)\b/.test(t)) return 'Soupe';
    if (/^salade|\btaboule\b|coleslaw/.test(t)) return 'Salade';
    if (/\b(acras|beignets? de|samoussas?|nems|bricks?|terrine|rillettes|tapas|bouchees|verrines?|toasts?|bruschetta|feuillete)\b/.test(t)) return 'Entrée';
    if (/\b(roti(e)?s?|poele(e)?s?|saute(e)?s?|vapeur|puree|gratin dauphinois|frites|confit(e)?s?|braise(e)?s?)\b/.test(t) && !ids.some(i => ['viandes', 'poissons-fruits-de-mer'].includes(famille(i)))) return 'Accompagnement';
    return 'Plat';
  }

  /* ---------- Origine (mots-clés du titre ; sinon non précisée) ---------- */
  const ORIGINS = [
    ['Italienne', /\b(risotto|lasagnes?|spaghetti|penne|tagliatelles?|pizza|pesto|bolognaise|carbonara|minestrone|osso|gnocchis?|polenta|tiramisu|panna cotta|bruschetta|focaccia|a l'italienne|parmigiana|arancini)\b/],
    ['Indienne', /\b(curry|dahl|dal|masala|tandoori|tikka|biryani|naan|chutney|raita|korma|samoussas?|barfi|pakoras?|lassi|paneer)\b/],
    ['Asiatique', /\b(wok|nems|bo bun|pho|ramen|sushis?|bakmi|nasi|goreng|pad thai|teriyaki|nouilles|kimchi|dim sum|gyoza|tofu|miso|riz cantonais|bawoin)\b/],
    ['Maghrébine', /\b(tajine|tagine|couscous|harira|chorba|batbout|baghrir|bestels|pastilla|merguez|chakchouka|makrout|amlou|loubia|msemen|zaalouk)\b/],
    ['Latino-américaine', /\b(chili|tacos|fajitas|guacamole|burritos?|quesadillas?|enchiladas?|bienmesabe|empanadas?|ceviche|arepas?)\b/],
    ['Espagnole', /\b(paella|gaspacho|tortilla|churros|a la catalane|patatas|chorizo)\b/],
    ['Europe centrale et de l’Est', /\b(bortsch|bigos|goulash|beetenbartsch|berliner|pierogi|strudel|spatzle|kartoffel|blinis?)\b/],
    ['Française', /\b(axoa|aligot|cassoulet|ratatouille|tian|bourguignon|blanquette|quiche|galettes? de sarrasin|crepes?|bouillabaisse|flammenkuche|potee|pot-au-feu|provencal(e)?|nicoise|lyonnaise|normande|beurre blanc|soupe a l'oignon|boles de picolat|bougnette|bourriol|tartiflette|gratin dauphinois|croque|clafoutis|far breton|kouign|madeleines?|creme brulee|ile flottante|piperade|garbure|daube|navarin|choucroute|beerawecka|bescoins|avisances|bouballe)\b/],
  ];
  const originOf = r => ORIGINS.find(([, re]) => re.test(norm(r.titre)))?.[0] || 'Non précisée';

  /* ---------- Grammes d'une ligne (pour les nutriments) ---------- */
  const UNIT_G = {
    g: 1, kg: 1000, mg: 0.001, ml: 1, cl: 10, dl: 100, l: 1000, 'c. à soupe': 15, 'c. à café': 5, cuillère: 10, pincée: 0.5,
    gousse: 5, tasse: 240, verre: 200, sachet: 10, tranche: 30, filet: 5, noix: 10, feuille: 1, branche: 2, brin: 1, botte: 250,
    bouquet: 30, morceau: 30, boîte: 400, pavé: 150, boule: 125, zeste: 2, poignée: 30, bol: 250, barquette: 250, tablette: 100, rouleau: 250,
  };
  const PIECE_G = {
    oeuf: 55, jaune_d_oeuf: 18, blanc_d_oeuf: 33, oignon: 100, echalote: 25, ail: 5, carotte: 100, pomme_de_terre: 150, tomate: 120,
    citron: 100, citron_vert: 60, orange: 180, courgette: 200, aubergine: 250, poivron: 150, pomme: 150, poire: 150, banane: 120,
    poireau: 150, concombre: 300, avocat: 150, navet: 120, patate_douce: 200, betterave: 120, fenouil: 250, chou_fleur: 800,
    brocoli: 400, artichaut: 250, mangue: 300, peche: 150, abricot: 45, kiwi: 80, piment: 10, cotelette_d_agneau: 80,
    blanc_de_poulet: 150, cuisse_de_poulet: 200, tortilla_de_ble: 60, tortilla_de_mais: 30, pain_burger: 70, pain_pita: 70,
    saucisse_de_strasbourg: 50, steak_hache: 100, saucisse: 70, merguez: 50, pave_de_saumon: 130, filet_de_poisson: 130,
  };
  const FAMILY_PIECE_G = { legumes: 120, fruits: 120, viandes: 150, 'poissons-fruits-de-mer': 130 };
  const NEGLIGIBLE = ['sel', 'poivre', 'eau', 'glacon'];

  function gramsOf(line, id) {
    const q = line.quantite_max ? (line.quantite + line.quantite_max) / 2 : line.quantite;
    if (q == null) return null;
    if (line.unite) return UNIT_G[line.unite] != null ? q * UNIT_G[line.unite] : null;
    const anc = ancestors(id);
    const piece = anc.map(a => PIECE_G[a]).find(v => v != null) ?? FAMILY_PIECE_G[famille(id)];
    return piece != null ? q * piece : null;
  }

  /* ---------- Rayon ---------- */
  const FRESH_HERBS = ['persil', 'coriandre', 'basilic', 'menthe', 'ciboulette', 'aneth', 'estragon', 'cerfeuil', 'thym_frais'];
  function aisleOf(id) {
    const anc = ancestors(id);
    const f = famille(id);
    if (anc.some(a => /^(pain|baguette|brioche|croissant)/.test(a))) return 'Boulangerie';
    if (f === 'legumes' || f === 'fruits') return 'Fruits et légumes';
    if (f === 'herbes-epices' && anc.some(a => FRESH_HERBS.some(h => a.startsWith(h)))) return 'Fruits et légumes';
    if (f === 'viandes' || f === 'poissons-fruits-de-mer') return 'Boucherie et poisson';
    if (f === 'produits-laitiers-oeufs' || anc.includes('beurre') || anc.includes('creme')) return 'Frais';
    return 'Épicerie';
  }

  const UNIT_LABEL = { 'c. à soupe': 'c. à s.', 'c. à café': 'c. à c.', l: 'L' };
  /** « 200 g de morue salée » → « Morue salée » */
  function displayName(line) {
    const units = Object.keys(UNIT_G).concat(['gousses', 'tranches', 'sachets', 'boîtes', 'bottes', 'feuilles', 'branches', 'brins', 'morceaux', 'verres', 'tasses', 'filets', 'pavés', 'boules', 'pincées', 'cuillères', 'quelques', 'un peu']);
    const re = new RegExp(`^\\s*(environ\\s+)?[\\d.,/½¼¾]+(\\s*(à|-)\\s*[\\d.,]+)?\\s*(${units.map(u => u.replace(/[.]/g, '\\.')).sort((a, b) => b.length - a.length).join('|')})?\\s*(de |d'|d’)?`, 'i');
    const rest = line.texte.replace(re, '').trim();
    return cap(rest || FOOD[line.ingredients[0]]?.nom || line.texte);
  }

  /* ---------- Ingrédients principaux ---------- */
  const STOP_MAIN = /^(sel|poivre|eau|sucre|farine|levure|bicarbonate|huile|beurre|vinaigre|bouillon|glacon)/;

  /* ---------- Conversion ---------- */
  const NUTRI = 11;
  let partial = 0;
  function convert(r) {
    const ids = [...new Set(r.lignes.flatMap(l => l.ingredients))];
    const total = new Array(NUTRI).fill(0);
    let covered = 0;
    const weights = new Map();
    const lines = r.lignes.map(l => {
      const grams = l.ingredients.length === 1 ? gramsOf(l, l.ingredients[0]) : null;
      const negligible = l.ingredients.every(i => NEGLIGIBLE.some(n => ancestors(i).includes(n)));
      if (grams != null) {
        const n = FOOD[l.ingredients[0]]?.n;
        // facteur_nutri : l'aliment CIQUAL est décrit dans un autre état (sec, déshydraté) que celui de la recette
        const gn = grams * (l.facteur_nutri ?? 1);
        if (n) { n.forEach((v, k) => { total[k] += ((v || 0) * gn) / 100; }); covered++; }
        weights.set(l.ingredients[0], (weights.get(l.ingredients[0]) || 0) + grams);
      } else if (negligible) covered++;
      const o = { t: displayName(l), f: l.ingredients };
      const q = l.quantite_max ? (l.quantite + l.quantite_max) / 2 : l.quantite;
      if (q != null) o.q = Math.round(q * 100) / 100;
      if (l.unite) o.u = UNIT_LABEL[l.unite] || l.unite;
      o.a = aisleOf(l.ingredients[0]);
      if (l.facultatif) o.opt = 1;
      if (l.confiance < 1) o.c = l.confiance;
      return o;
    });
    const coverage = r.lignes.length ? covered / r.lignes.length : 0;
    if (coverage < 0.7) partial++;
    // Ingrédients principaux : les plus lourds, hors assaisonnements, matières grasses, boissons et sauces
    // (sinon le lait de coco passe devant les lentilles du dahl)
    const base = ids.filter(i => FOOD[i] && !FOOD[i].categorie && !STOP_MAIN.test(i) && !['herbes-epices', 'matieres-grasses'].includes(famille(i)));
    const solid = base.filter(i => !['sucres-boissons', 'condiments-sauces'].includes(famille(i)));
    const eligible = solid.length ? solid : base;
    const main = (weights.size ? [...eligible].sort((a, b) => (weights.get(b) || 0) - (weights.get(a) || 0)) : eligible).slice(0, 3);
    const portions = r.portions || 4;
    const recipe = {
      // « Ratatouille3 » : variantes numérotées dans la source
      id: r.id, name: r.titre.replace(/(\D)\d+$/, '$1').trim(), portions, time: Number(r.temps_total) || null,
      // Une recette Papille peut imposer son type et son origine
      type: r.type || typeOf(r, ids), origin: r.origine || originOf(r),
      main: main.length ? main : ids.slice(0, 1),
      n: total.map(v => Math.round((v / portions) * 10) / 10), cov: Math.round(coverage * 100) / 100,
      ing: lines, steps: r.etapes,
      src: { t: r.source.titre, u: r.source.url, h: r.source.historique, a: r.source.auteurs, l: r.source.licence, m: r.source.modifications },
    };
    // Au-delà de 1 500 kcal par portion, les portions de la source sont sans doute fausses : on n'affiche pas d'estimation
    if (recipe.n[0] > 1500) { recipe.nko = 1; partial++; }
    if (/Bouchée|Papille/.test(r.source.auteurs || '')) recipe.gen = 1; // rédigée pour l'app, pas encore testée en cuisine
    if (r.photo) recipe.photo = { thumb: r.photo.vignette, full: r.photo.image, page: r.photo.page, a: r.photo.auteur, l: r.photo.licence };
    if (r.decouverte) recipe.disc = r.decouverte;
    lineForms(recipe, FOOD, r.lignes.map(l => l.forme)).forEach((fo, k) => { if (fo) recipe.ing[k].fo = fo; });
    return recipe;
  }
  return { convert, partial: () => partial, FOOD };
}
