// Recettes de démonstration. Photos : Unsplash (licence Unsplash), chargées par lien.
// n = valeurs par portion : [kcal, prot, gluc, lip, fibres, fer, Ca, Mg, vit C, vit D, B12]

export const photo = (id, w = 800) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

const I = (name, qty, unit, aisle, extra = {}) => ({ name, qty, unit, aisle, ...extra });
const FL = 'Fruits et légumes', EP = 'Épicerie', FR = 'Frais', BO = 'Boucherie et poisson';

const BOUILLON = I('Bouillon de légumes', 50, 'cl', EP, {
  contains: [{ name: 'carotte', food: 'carotte' }, { name: 'poireau', food: 'poireau' }, { name: 'oignon', food: 'oignon' }, { name: 'céleri', food: 'celeri', allergens: ['Céleri'] }, { name: 'sel' }],
});

export const RECIPES = [
  {
    id: 'curry', name: 'Curry de lentilles corail', img: '1585937421612-70a008356fbe', time: 30, type: 'Plat', origin: 'Indienne',
    source: 'marmiton.org', portions: 4, main: ['lentille_corail', 'tomate', 'epinard', 'lait_de_coco'],
    n: [520, 22, 62, 19, 9, 5.8, 110, 96, 24, 0, 0],
    ingredients: [
      I('Lentilles corail', 300, 'g', EP, { food: 'lentille_corail' }),
      I('Lait de coco', 40, 'cl', EP, { food: 'lait_de_coco' }),
      I('Oignon', 1, '', FL, { food: 'oignon' }),
      I('Ail', 2, 'gousse', FL, { food: 'ail' }),
      I('Tomates concassées', 400, 'g', EP, { food: 'tomate' }),
      I('Pâte de curry', 2, 'c. à s.', EP, { contains: [{ name: 'piment', food: 'piment' }, { name: 'ail', food: 'ail' }, { name: 'citronnelle' }, { name: 'cumin', food: 'cumin' }, { name: 'galanga' }] }),
      BOUILLON,
      I('Épinards frais', 100, 'g', FL, { food: 'epinard' }),
    ],
    steps: [
      'Émincer l’oignon et l’ail, les faire revenir 3 minutes dans une cocotte avec un filet d’huile.',
      'Ajouter la pâte de curry, mélanger 1 minute, puis les lentilles rincées, les tomates, le lait de coco et le bouillon.',
      'Laisser mijoter 20 minutes à feu doux. Incorporer les épinards hors du feu et servir avec du riz.',
    ],
  },
  {
    id: 'veloute', name: 'Velouté de potiron', img: '1476718406336-bb5a9690ee2a', time: 35, type: 'Soupe', origin: 'Française',
    source: '750g.com', portions: 4, main: ['potiron', 'carotte'], n: [210, 4, 22, 11, 4, 1, 60, 30, 15, 0, .1],
    ingredients: [
      I('Potiron', 1, 'kg', FL, { food: 'potiron' }), I('Carotte', 2, '', FL, { food: 'carotte' }), I('Oignon', 1, '', FL, { food: 'oignon' }),
      I('Crème fraîche', 10, 'cl', FR, { food: 'creme_fraiche', allergens: ['Lait'], tags: ['animal'] }), { ...BOUILLON, qty: 75 },
    ],
    steps: ['Éplucher et couper le potiron, les carottes et l’oignon en morceaux.', 'Cuire 25 minutes dans le bouillon frémissant.', 'Mixer avec la crème, rectifier l’assaisonnement.'],
  },
  {
    id: 'poulet', name: 'Poulet grillé aux légumes', img: '1598515214211-89d3c73ae83b', time: 40, type: 'Plat', origin: 'Française',
    source: 'cuisineaz.com', portions: 2, main: ['poulet', 'carotte', 'petit_pois'], n: [450, 42, 25, 18, 6, 2.2, 50, 70, 30, .2, .6],
    ingredients: [
      I('Blancs de poulet', 300, 'g', BO, { food: 'poulet', tags: ['viande', 'animal'] }), I('Petits pois', 150, 'g', FL, { food: 'petit_pois' }),
      I('Carotte', 2, '', FL, { food: 'carotte' }), I('Maïs doux', 100, 'g', EP, { food: 'mais' }), I('Huile d’olive', 2, 'c. à s.', EP, { food: 'huile_d_olive' }), I('Paprika', 1, 'c. à c.', EP, { food: 'paprika' }),
    ],
    steps: ['Mariner le poulet avec l’huile et le paprika 15 minutes.', 'Griller 6 minutes de chaque côté.', 'Faire sauter les légumes 8 minutes et servir ensemble.'],
  },
  {
    id: 'penne', name: 'Penne all’arrabbiata', img: '1621996346565-e3dbc646d9a9', time: 25, type: 'Plat', origin: 'Italienne',
    source: 'marmiton.org', portions: 4, main: ['penne', 'tomate'], n: [560, 18, 90, 12, 6, 2.4, 40, 80, 20, 0, 0],
    ingredients: [
      I('Penne', 400, 'g', EP, { food: 'penne', allergens: ['Gluten'] }), I('Tomates concassées', 800, 'g', EP, { food: 'tomate' }),
      I('Ail', 3, 'gousse', FL, { food: 'ail' }), I('Piment', 1, '', FL, { food: 'piment' }), I('Huile d’olive', 3, 'c. à s.', EP, { food: 'huile_d_olive' }), I('Persil', 1, 'bouquet', FL, { food: 'persil' }),
    ],
    steps: ['Faire revenir l’ail et le piment dans l’huile.', 'Ajouter les tomates, cuire 15 minutes.', 'Mélanger aux penne cuites al dente, parsemer de persil.'],
  },
  {
    id: 'saumon', name: 'Saumon rôti, légumes verts', img: '1519708227418-c8fd9a32b7a2', time: 30, type: 'Plat', origin: 'Méditerranéenne',
    source: '750g.com', portions: 2, main: ['saumon', 'haricot_vert'], n: [480, 34, 10, 32, 5, 1.5, 70, 70, 25, 9, 4.5],
    ingredients: [
      I('Pavés de saumon', 2, '', BO, { food: 'saumon', allergens: ['Poissons'], tags: ['poisson', 'animal'] }), I('Haricots verts', 200, 'g', FL, { food: 'haricot_vert' }),
      I('Courgette', 1, '', FL, { food: 'courgette' }), I('Citron', 1, '', FL, { food: 'citron' }), I('Huile d’olive', 2, 'c. à s.', EP, { food: 'huile_d_olive' }),
    ],
    steps: ['Préchauffer le four à 200 °C.', 'Rôtir le saumon 12 minutes avec le citron.', 'Cuire les légumes à la vapeur 8 minutes.'],
  },
  {
    id: 'bowl', name: 'Bowl de pois chiches rôtis', img: '1512621776951-a57141f2eefd', time: 20, type: 'Salade', origin: 'Méditerranéenne',
    source: 'journaldesfemmes.fr', portions: 2, main: ['pois_chiche', 'avocat', 'carotte'], n: [540, 19, 58, 24, 14, 4.5, 120, 110, 40, 0, 0],
    ingredients: [
      I('Pois chiches', 1, 'boîte', EP, { food: 'pois_chiche' }), I('Avocat', 1, '', FL, { food: 'avocat' }), I('Carotte', 1, '', FL, { food: 'carotte' }),
      I('Chou rouge', 100, 'g', FL, { food: 'chou_rouge' }), I('Tomates cerises', 150, 'g', FL, { food: 'tomate' }),
      I('Vinaigrette maison', 3, 'c. à s.', EP, { contains: [{ name: 'huile d’olive' }, { name: 'vinaigre de cidre' }, { name: 'moutarde', food: 'moutarde', allergens: ['Moutarde'] }] }),
    ],
    steps: ['Rôtir les pois chiches 20 minutes à 200 °C avec des épices.', 'Râper la carotte, émincer le chou, trancher l’avocat.', 'Assembler et napper de vinaigrette.'],
  },
  {
    id: 'risotto', name: 'Risotto crémeux aux poireaux', img: '1476124369491-e7addf5db371', time: 40, type: 'Plat', origin: 'Italienne',
    source: 'marmiton.org', portions: 4, main: ['riz', 'poireau', 'parmesan'], n: [540, 14, 70, 20, 3, 1.2, 180, 40, 6, .2, .5],
    ingredients: [
      I('Riz arborio', 320, 'g', EP, { food: 'riz' }), I('Poireaux', 2, '', FL, { food: 'poireau' }),
      I('Parmesan', 60, 'g', FR, { food: 'parmesan', allergens: ['Lait'], tags: ['animal'] }), I('Vin blanc', 10, 'cl', EP, { food: 'vin_blanc', allergens: ['Sulfites'], tags: ['alcool'] }),
      { ...BOUILLON, qty: 100 }, I('Beurre', 20, 'g', FR, { food: 'beurre', allergens: ['Lait'], tags: ['animal'] }),
    ],
    steps: ['Faire fondre les poireaux émincés dans le beurre.', 'Nacrer le riz, déglacer au vin blanc.', 'Ajouter le bouillon louche par louche pendant 18 minutes, finir au parmesan.'],
  },
  {
    id: 'pancakes', name: 'Pancakes du dimanche', img: '1567620905732-2d1ec7ab7445', time: 25, type: 'Dessert', origin: 'Américaine',
    source: 'cuisineaz.com', portions: 4, main: ['oeuf', 'lait'], n: [420, 12, 60, 14, 2, 1.5, 160, 25, 1, .8, .6],
    ingredients: [
      I('Farine', 250, 'g', EP, { food: 'farine_de_ble', allergens: ['Gluten'] }), I('Lait', 30, 'cl', FR, { food: 'lait', allergens: ['Lait'], tags: ['animal'] }),
      I('Œufs', 2, '', FR, { food: 'oeuf', allergens: ['Œufs'], tags: ['animal'] }), I('Sucre', 30, 'g', EP, { food: 'sucre' }), I('Levure chimique', 1, 'sachet', EP, { food: 'levure_chimique' }), I('Sirop d’érable', 4, 'c. à s.', EP, { food: 'sirop_d_erable' }),
    ],
    steps: ['Mélanger farine, sucre et levure.', 'Ajouter les œufs puis le lait en fouettant.', 'Cuire de petites louches 2 minutes de chaque côté.'],
  },
  {
    id: 'ratatouille', name: 'Ratatouille confite', img: '1572453800999-e8d2d1589b7c', time: 60, type: 'Plat', origin: 'Française',
    source: 'marmiton.org', portions: 4, main: ['aubergine', 'courgette', 'poivron', 'tomate'], n: [180, 3, 15, 11, 5, 1, 40, 35, 45, 0, 0],
    ingredients: [
      I('Aubergine', 1, '', FL, { food: 'aubergine' }), I('Courgette', 2, '', FL, { food: 'courgette' }), I('Poivron', 2, '', FL, { food: 'poivron' }),
      I('Tomate', 4, '', FL, { food: 'tomate' }), I('Oignon', 1, '', FL, { food: 'oignon' }), I('Herbes de Provence', 1, 'c. à s.', EP, { food: 'herbes_de_provence' }),
    ],
    steps: ['Trancher finement tous les légumes.', 'Les disposer en rosace sur une base d’oignon fondu.', 'Cuire 45 minutes à 160 °C, couvert.'],
  },
  {
    id: 'chili', name: 'Chili sin carne', img: '1455619452474-d2be8b1e70cd', time: 45, type: 'Plat', origin: 'Mexicaine',
    source: '750g.com', portions: 4, main: ['haricot_rouge', 'tomate', 'poivron'], n: [480, 20, 70, 10, 16, 6, 110, 120, 30, 0, 0],
    ingredients: [
      I('Haricots rouges', 2, 'boîte', EP, { food: 'haricot_rouge' }), I('Tomates concassées', 400, 'g', EP, { food: 'tomate' }),
      I('Oignon', 1, '', FL, { food: 'oignon' }), I('Poivron', 1, '', FL, { food: 'poivron' }), I('Maïs doux', 150, 'g', EP, { food: 'mais' }),
      I('Épices à chili', 2, 'c. à c.', EP, { contains: [{ name: 'piment', food: 'piment' }, { name: 'cumin' }, { name: 'origan' }, { name: 'ail', food: 'ail' }] }),
      I('Riz', 240, 'g', EP, { food: 'riz' }),
    ],
    steps: ['Faire revenir oignon et poivron.', 'Ajouter épices, tomates, haricots et maïs ; mijoter 30 minutes.', 'Servir avec le riz.'],
  },
  {
    id: 'bobun', name: 'Bo bun express', img: '1504674900247-0877df9cc836', time: 25, type: 'Plat', origin: 'Vietnamienne',
    source: 'journaldesfemmes.fr', portions: 2, main: ['boeuf', 'carotte'], n: [590, 30, 70, 20, 4, 3, 50, 60, 12, 0, 1.8],
    ingredients: [
      I('Vermicelles de riz', 150, 'g', EP, { food: 'vermicelle_de_riz' }), I('Bœuf', 250, 'g', BO, { food: 'boeuf', tags: ['viande', 'animal'] }), I('Carotte', 1, '', FL, { food: 'carotte' }),
      I('Concombre', 1, '', FL, { food: 'concombre' }), I('Cacahuètes', 30, 'g', EP, { food: 'cacahuete_grillee', allergens: ['Arachides'] }),
      I('Sauce nems du commerce', 6, 'c. à s.', EP, { unknown: true }),
    ],
    steps: ['Cuire les vermicelles.', 'Saisir le bœuf mariné.', 'Assembler avec les crudités et la sauce.'],
  },
  // Recettes que le profil exclut (montrées seulement dans « Pourquoi exclues »)
  {
    id: 'pesto', name: 'Pâtes au pesto', time: 15, type: 'Plat', origin: 'Italienne', source: 'marmiton.org', portions: 4, main: ['penne', 'basilic'], n: [600, 18, 80, 24, 5, 2, 150, 70, 4, 0, .2],
    ingredients: [I('Pâtes', 400, 'g', EP, { food: 'penne', allergens: ['Gluten'] }), I('Pesto en pot', 190, 'g', EP, { contains: [{ name: 'basilic', food: 'basilic' }, { name: 'noix de cajou', allergens: ['Fruits à coque'] }, { name: 'parmesan', allergens: ['Lait'] }] })],
    steps: [],
  },
  {
    id: 'houmous', name: 'Houmous et crudités', time: 15, type: 'Entrée', origin: 'Libanaise', source: '750g.com', portions: 4, main: ['pois_chiche'], n: [280, 9, 20, 18, 7, 2.6, 80, 70, 10, 0, 0],
    ingredients: [I('Pois chiches', 1, 'boîte', EP, { food: 'pois_chiche' }), I('Tahini', 3, 'c. à s.', EP, { food: 'tahini', allergens: ['Sésame'] }), I('Citron', 1, '', FL, { food: 'citron' })],
    steps: [],
  },
  {
    id: 'croque', name: 'Croque-monsieur', time: 20, type: 'Plat', origin: 'Française', source: 'cuisineaz.com', portions: 2, main: ['pain_de_mie'], n: [520, 26, 40, 28, 2, 2, 400, 30, 0, .3, 1],
    ingredients: [I('Pain de mie', 4, 'tranche', EP, { food: 'pain_de_mie', allergens: ['Gluten'] }), I('Jambon blanc', 2, 'tranche', BO, { food: 'jambon_cuit', tags: ['porc', 'viande', 'animal'] }), I('Emmental', 80, 'g', FR, { food: 'emmental', allergens: ['Lait'], tags: ['animal'] })],
    steps: [],
  },
];

export const RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));

export const INITIAL_OPINIONS = { curry: 'like', poulet: 'like', bowl: 'like' };

export const TYPES = ['Entrée', 'Plat', 'Salade', 'Soupe', 'Dessert'];
export const ORIGINS = ['Française', 'Italienne', 'Indienne', 'Méditerranéenne', 'Mexicaine', 'Vietnamienne', 'Américaine', 'Libanaise'];
