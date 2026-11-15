// Aliments de démonstration (sous-ensemble fictif inspiré de CIQUAL).
// n = valeurs pour 100 g : [kcal, protéines g, glucides g, lipides g, fibres g, fer mg, calcium mg, magnésium mg, vit C mg, vit D µg, vit B12 µg]

export const GROUPS = {
  legume: { label: 'Légumes', icon: 'Salad' },
  racine: { label: 'Légumes racines', icon: 'Carrot' },
  fruit: { label: 'Fruits', icon: 'Apple' },
  feculent: { label: 'Féculents', icon: 'Wheat' },
  legumineuse: { label: 'Légumineuses', icon: 'Bean' },
  viande: { label: 'Viandes et volailles', icon: 'Drumstick' },
  poisson: { label: 'Poissons', icon: 'Fish' },
  laitier: { label: 'Produits laitiers et œufs', icon: 'Milk' },
  epice: { label: 'Herbes et épices', icon: 'Leaf' },
  champignon: { label: 'Champignons', icon: 'Sprout' },
};

const F = (id, name, group, extra = {}) => ({ id, name, group, ...extra });

export const FOODS = [
  F('carotte', 'Carotte', 'racine', { n: [36, .8, 6.6, .3, 2.7, .3, 33, 12, 4, 0, 0] }),
  F('panais', 'Panais', 'racine'),
  F('topinambour', 'Topinambour', 'racine'),
  F('betterave', 'Betterave', 'racine'),
  F('pomme-de-terre', 'Pomme de terre', 'feculent'),
  F('patate-douce', 'Patate douce', 'feculent'),
  F('riz', 'Riz', 'feculent'),
  F('pates', 'Pâtes', 'feculent'),
  F('boulgour', 'Boulgour', 'feculent'),
  F('quinoa', 'Quinoa', 'feculent'),
  F('flocons-avoine', 'Flocons d’avoine', 'feculent', { n: [367, 13.5, 58.7, 7, 10, 4.3, 54, 130, 0, 0, 0] }),
  F('pain-complet', 'Pain complet', 'feculent', { n: [240, 9, 41, 2.5, 7, 2.3, 50, 80, 0, 0, 0] }),
  F('tomate', 'Tomate', 'legume', { n: [19, .9, 2.9, .2, 1.2, .2, 9, 10, 14, 0, 0] }),
  F('epinard', 'Épinard', 'legume', { n: [23, 3, 1.4, .4, 2.6, 2.1, 120, 70, 9, 0, 0] }),
  F('potiron', 'Potiron', 'legume'),
  F('courgette', 'Courgette', 'legume'),
  F('aubergine', 'Aubergine', 'legume'),
  F('poivron', 'Poivron', 'legume'),
  F('poireau', 'Poireau', 'legume'),
  F('haricot-vert', 'Haricot vert', 'legume'),
  F('petits-pois', 'Petits pois', 'legume'),
  F('avocat', 'Avocat', 'legume'),
  F('chou-rouge', 'Chou rouge', 'legume'),
  F('fenouil', 'Fenouil', 'legume'),
  F('endive', 'Endive', 'legume'),
  F('oignon', 'Oignon', 'legume'),
  F('ail', 'Ail', 'epice'),
  F('piment', 'Piment', 'epice'),
  F('olive', 'Olive noire', 'legume'),
  F('pomme', 'Pomme', 'fruit', { n: [53, .3, 11.6, .2, 2.3, .1, 5, 5, 4.6, 0, 0] }),
  F('banane', 'Banane', 'fruit', { n: [90, 1.1, 20, .3, 2.6, .3, 6, 30, 8.7, 0, 0] }),
  F('poire', 'Poire', 'fruit', { n: [50, .4, 10.9, .1, 3.1, .2, 9, 7, 3, 0, 0] }),
  F('citron', 'Citron', 'fruit'),
  F('lentille-corail', 'Lentille corail', 'legumineuse', { n: [116, 9, 17, .4, 4.5, 2.4, 20, 36, 1, 0, 0] }),
  F('pois-chiche', 'Pois chiche', 'legumineuse'),
  F('haricot-rouge', 'Haricot rouge', 'legumineuse', { n: [115, 8.7, 13.6, .5, 8.7, 2.3, 35, 45, 1, 0, 0] }),
  F('tofu', 'Tofu', 'legumineuse'),
  F('poulet', 'Poulet', 'viande'),
  F('boeuf', 'Bœuf', 'viande'),
  F('saumon', 'Saumon', 'poisson'),
  F('sardine', 'Sardine à l’huile', 'poisson', { n: [220, 24, 0, 13.7, 0, 2.4, 380, 40, 0, 7.3, 8.9] }),
  F('maquereau', 'Maquereau', 'poisson'),
  F('lait', 'Lait demi-écrémé', 'laitier', { n: [46, 3.3, 4.8, 1.6, 0, .03, 120, 11, 1, .02, .3] }),
  F('yaourt', 'Yaourt nature', 'laitier', { n: [61, 4.2, 5.4, 2.5, 0, .1, 150, 13, 1, .05, .3] }),
  F('oeuf', 'Œuf', 'laitier', { n: [140, 12.7, .3, 9.8, 0, 1.8, 56, 12, 0, 1.9, 1.2] }),
  F('parmesan', 'Parmesan', 'laitier'),
  F('lait-coco', 'Lait de coco', 'legume'),
  F('champignon', 'Champignon de Paris', 'champignon'),
  F('coriandre', 'Coriandre', 'epice'),
  F('basilic', 'Basilic', 'epice'),
];

export const FOOD = Object.fromEntries(FOODS.map(f => [f.id, f]));

// Réponses de départ du profil fictif
export const INITIAL_ANSWERS = {
  carotte: 'like', 'lentille-corail': 'like', poulet: 'like', pomme: 'like', 'pomme-de-terre': 'like', tomate: 'like', riz: 'like', pates: 'like',
  champignon: 'dislike', betterave: 'dislike', endive: 'dislike', olive: 'dislike',
  fenouil: 'unsure', aubergine: 'unsure', tofu: 'unsure',
};
