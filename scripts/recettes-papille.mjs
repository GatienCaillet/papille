// Recettes rédigées pour Papille : cuissons de base et recettes salées très simples, populaires chez
// les 20-25 ans (peu d'ingrédients, peu de matériel, moins de 30 minutes pour la plupart).
// Même format que l'export du catalogue Bouchée ; converties par recipe-convert.mjs.
// Chaque ligne cite les identifiants du référentiel d'aliments (public/data/aliments.json) :
// c'est sur eux que repose la vérification des allergies et régimes, ils doivent être exacts.

export const LICENCE = 'Recettes adaptées du Livre de cuisine de Wikibooks (CC BY-SA), rédigées pour Bouchée (CC BY-SA 4.0) et pour Papille (CC BY-SA 4.0). Source, auteurs et licence dans chaque recette.';

const l = (texte, ingredients, quantite = null, unite = null, facultatif = false) =>
  ({ texte, ingredients: [].concat(ingredients), quantite, unite, ...(facultatif ? { facultatif: true } : {}) });
const opt = (texte, ingredients, quantite, unite) => l(texte, ingredients, quantite, unite, true);
/** Ligne dont l'aliment CIQUAL est décrit dans un autre état (sec, déshydraté…) : les nutriments sont
 *  calculés sur quantité × facteur. L'aliment reste le bon pour la vérification des allergies. */
const ajuste = (ligne, facteur, raison) => ({ ...ligne, facteur_nutri: facteur, raison_facteur: raison });
const SEL = l('Sel', 'sel');
const POIVRE = l('Poivre', 'poivre');

/** id, titre, portions, temps total (min), type de plat, lignes, étapes, origine (facultative) */
const R = (id, titre, portions, temps, type, lignes, etapes, origine) => ({
  id, titre, portions, temps_total: temps, type, ...(origine ? { origine } : {}), lignes, etapes,
  source: {
    titre, url: null, historique: null, auteurs: 'Papille', licence: 'CC BY-SA 4.0',
    modifications: 'Recette de base rédigée pour Papille ; quantités et temps indicatifs.',
  },
});

export const PAPILLE_RECIPES = [
  /* ---------- Cuissons de base ---------- */
  R('papille-riz-blanc', 'Riz blanc', 2, 20, 'Accompagnement', [
    l('150 g de riz basmati', 'riz', 150, 'g'),
    l('225 ml d’eau', 'eau', 225, 'ml'),
    SEL,
  ], [
    'Rincer le riz à l’eau froide dans une passoire jusqu’à ce que l’eau soit presque claire.',
    'Le mettre dans une casserole avec l’eau (une fois et demie son volume) et une pincée de sel.',
    'Porter à ébullition, couvrir, baisser à feu très doux et laisser cuire 12 minutes sans soulever le couvercle.',
    'Couper le feu et laisser reposer 5 minutes à couvert, puis égrainer à la fourchette.',
  ]),
  R('papille-quinoa', 'Quinoa nature', 2, 20, 'Accompagnement', [
    l('120 g de quinoa', 'quinoa', 120, 'g'),
    l('240 ml d’eau', 'eau', 240, 'ml'),
    SEL,
  ], [
    'Rincer le quinoa dans une passoire fine pour enlever son amertume.',
    'Le mettre dans une casserole avec deux fois son volume d’eau et une pincée de sel.',
    'Porter à ébullition, couvrir et cuire 12 à 15 minutes à feu doux, jusqu’à ce que l’eau soit absorbée.',
    'Laisser reposer 5 minutes à couvert puis égrainer à la fourchette.',
  ]),
  R('papille-semoule-express', 'Semoule express', 2, 10, 'Accompagnement', [
    l('120 g de semoule de blé', 'semoule_de_ble', 120, 'g'),
    l('150 ml d’eau bouillante', 'eau', 150, 'ml'),
    l('1 c. à soupe d’huile d’olive', 'huile_d_olive', 1, 'c. à soupe'),
    SEL,
  ], [
    'Verser la semoule dans un saladier avec l’huile et une pincée de sel, mélanger du bout des doigts.',
    'Verser l’eau bouillante, couvrir d’une assiette et laisser gonfler 5 minutes.',
    'Égrainer à la fourchette avant de servir.',
  ], 'Maghrébine'),
  R('papille-pates-beurre-parmesan', 'Pâtes au beurre et au parmesan', 2, 15, 'Plat', [
    l('200 g de pâtes', 'pates_seches', 200, 'g'),
    l('20 g de beurre', 'beurre', 20, 'g'),
    l('30 g de parmesan râpé', 'parmesan', 30, 'g'),
    SEL, POIVRE,
  ], [
    'Porter une grande casserole d’eau à ébullition, saler (environ 10 g de sel par litre).',
    'Cuire les pâtes le temps indiqué sur le paquet, en remuant de temps en temps.',
    'Garder une louche d’eau de cuisson, puis égoutter.',
    'Remettre les pâtes dans la casserole hors du feu avec le beurre, le parmesan et un peu d’eau de cuisson ; mélanger jusqu’à ce que ce soit crémeux. Poivrer.',
  ], 'Italienne'),
  R('papille-oeufs-au-plat', 'Œufs au plat', 1, 5, 'Plat', [
    l('2 œufs', 'oeuf', 2),
    l('10 g de beurre', 'beurre', 10, 'g'),
    SEL, POIVRE,
  ], [
    'Faire fondre le beurre dans une poêle à feu moyen.',
    'Casser les œufs dans la poêle sans crever les jaunes.',
    'Cuire 3 à 4 minutes, jusqu’à ce que le blanc soit pris et le jaune encore coulant. Saler, poivrer et servir aussitôt.',
  ]),
  R('papille-oeuf-coque-mouillettes', 'Œuf à la coque et mouillettes', 1, 10, 'Plat', [
    l('2 œufs', 'oeuf', 2),
    l('2 tranches de pain de campagne', 'pain_de_campagne', 2, 'tranche'),
    l('10 g de beurre', 'beurre', 10, 'g'),
    SEL,
  ], [
    'Porter une petite casserole d’eau à ébullition.',
    'Y déposer délicatement les œufs (sortis du réfrigérateur) avec une cuillère et cuire exactement 3 minutes.',
    'Pendant ce temps, griller le pain, le beurrer et le couper en bâtonnets.',
    'Poser les œufs dans des coquetiers, couper le haut et tremper les mouillettes dans le jaune.',
  ]),
  R('papille-oeufs-mollets', 'Œufs mollets', 2, 10, 'Plat', [
    l('4 œufs', 'oeuf', 4),
    SEL,
  ], [
    'Porter une casserole d’eau à ébullition.',
    'Y plonger délicatement les œufs et cuire 6 minutes.',
    'Les passer aussitôt sous l’eau froide pour arrêter la cuisson, puis les écaler doucement.',
    'Servir avec du sel, sur une salade, des pâtes ou une tartine.',
  ]),
  R('papille-steak-hache-poele', 'Steak haché poêlé', 2, 10, 'Plat', [
    l('2 steaks hachés (250 g)', 'boeuf_hache', 250, 'g'),
    l('1 c. à café d’huile', 'huile_de_tournesol', 1, 'c. à café'),
    SEL, POIVRE,
  ], [
    'Sortir les steaks du réfrigérateur 10 minutes avant.',
    'Chauffer l’huile dans une poêle à feu vif.',
    'Cuire les steaks 2 à 3 minutes par face pour un steak à point, sans les écraser. Pour un enfant, une personne enceinte ou fragile, les cuire à cœur.',
    'Saler et poivrer en fin de cuisson.',
  ]),
  R('papille-blanc-de-poulet-poele', 'Blanc de poulet poêlé', 2, 20, 'Plat', [
    l('2 blancs de poulet', 'blanc_de_poulet', 2),
    l('1 c. à soupe d’huile d’olive', 'huile_d_olive', 1, 'c. à soupe'),
    l('1 c. à café de paprika', 'paprika', 1, 'c. à café'),
    SEL, POIVRE,
  ], [
    'Aplatir légèrement les blancs avec la paume pour qu’ils aient la même épaisseur partout.',
    'Les frotter avec le paprika, le sel et le poivre.',
    'Chauffer l’huile dans une poêle à feu moyen et cuire 6 à 7 minutes par face.',
    'Vérifier la cuisson en coupant au plus épais : la chair doit être blanche et sans trace rosée. Laisser reposer 2 minutes avant de trancher.',
  ]),
  R('papille-pave-saumon-poele', 'Pavé de saumon à la poêle', 2, 15, 'Plat', [
    l('2 pavés de saumon', 'saumon', 2, 'pavé'),
    l('1 c. à café d’huile d’olive', 'huile_d_olive', 1, 'c. à café'),
    opt('1/2 citron', 'citron', 0.5),
    SEL, POIVRE,
  ], [
    'Éponger les pavés avec du papier absorbant.',
    'Chauffer l’huile dans une poêle à feu moyen-vif et poser les pavés côté peau.',
    'Cuire 5 à 6 minutes sans les bouger, jusqu’à ce que la peau soit croustillante, puis retourner et cuire encore 2 minutes.',
    'Saler, poivrer et arroser d’un peu de jus de citron.',
  ]),
  R('papille-tofu-croustillant', 'Tofu croustillant à la sauce soja', 2, 20, 'Plat', [
    l('200 g de tofu ferme', 'tofu', 200, 'g'),
    l('1 c. à soupe d’huile', 'huile_de_tournesol', 1, 'c. à soupe'),
    l('2 c. à soupe de sauce soja', 'sauce_soja', 2, 'c. à soupe'),
    opt('1 c. à café de graines de sésame', 'graine_de_sesame', 1, 'c. à café'),
  ], [
    'Égoutter le tofu, le presser entre deux torchons pour enlever un maximum d’eau, puis le couper en cubes.',
    'Chauffer l’huile dans une poêle à feu moyen-vif et y dorer les cubes 8 à 10 minutes en les retournant.',
    'Verser la sauce soja, remuer 1 minute pour l’enrober, puis parsemer de sésame.',
  ], 'Asiatique'),

  /* ---------- Légumes et accompagnements ---------- */
  R('papille-pommes-de-terre-sautees', 'Pommes de terre sautées', 3, 30, 'Accompagnement', [
    l('600 g de pommes de terre', 'pomme_de_terre', 600, 'g'),
    l('2 c. à soupe d’huile d’olive', 'huile_d_olive', 2, 'c. à soupe'),
    l('2 gousses d’ail', 'ail', 2, 'gousse'),
    opt('Quelques brins de persil', 'persil', 5, 'g'),
    SEL,
  ], [
    'Éplucher les pommes de terre (ou les laver si elles ont la peau fine) et les couper en cubes de 2 cm.',
    'Les cuire 5 minutes dans l’eau bouillante salée, puis bien les égoutter.',
    'Chauffer l’huile dans une grande poêle et faire dorer les cubes 15 minutes à feu moyen en remuant de temps en temps.',
    'Ajouter l’ail écrasé et le persil haché 2 minutes avant la fin. Saler.',
  ]),
  R('papille-potatoes-au-four', 'Potatoes au four', 3, 45, 'Accompagnement', [
    l('600 g de pommes de terre', 'pomme_de_terre', 600, 'g'),
    l('2 c. à soupe d’huile d’olive', 'huile_d_olive', 2, 'c. à soupe'),
    l('1 c. à café de paprika', 'paprika', 1, 'c. à café'),
    l('1 c. à café d’herbes de Provence', 'herbes_de_provence', 1, 'c. à café'),
    SEL,
  ], [
    'Préchauffer le four à 210 °C.',
    'Laver les pommes de terre sans les éplucher et les couper en quartiers dans la longueur.',
    'Les mélanger dans un saladier avec l’huile, le paprika, les herbes et le sel.',
    'Les étaler sur une plaque couverte de papier cuisson, sans qu’elles se chevauchent, et cuire 35 minutes en les retournant à mi-cuisson.',
  ]),
  R('papille-frites-au-four', 'Frites au four', 3, 45, 'Accompagnement', [
    l('600 g de pommes de terre', 'pomme_de_terre', 600, 'g'),
    l('2 c. à soupe d’huile', 'huile_de_tournesol', 2, 'c. à soupe'),
    SEL,
  ], [
    'Préchauffer le four à 220 °C.',
    'Éplucher les pommes de terre et les tailler en bâtonnets d’1 cm.',
    'Les rincer à l’eau froide puis les sécher soigneusement dans un torchon.',
    'Les mélanger avec l’huile, les étaler sur une plaque couverte de papier cuisson et cuire 30 à 35 minutes en les retournant à mi-cuisson. Saler à la sortie du four.',
  ]),
  R('papille-pommes-de-terre-four-fromage-blanc', 'Pommes de terre au four, fromage frais et ciboulette', 2, 60, 'Plat', [
    l('4 pommes de terre moyennes', 'pomme_de_terre', 4),
    l('100 g de fromage frais', 'fromage_frais', 100, 'g'),
    l('1/2 botte de ciboulette', 'ciboulette', 10, 'g'),
    SEL, POIVRE,
  ], [
    'Préchauffer le four à 200 °C.',
    'Laver les pommes de terre, les piquer plusieurs fois à la fourchette et les envelopper dans du papier aluminium.',
    'Les cuire 50 minutes à 1 heure : la pointe d’un couteau doit s’enfoncer sans résistance.',
    'Mélanger le fromage frais avec la ciboulette ciselée, du sel et du poivre.',
    'Ouvrir les pommes de terre en deux et garnir de fromage frais.',
  ]),
  R('papille-patate-douce-au-four', 'Patate douce au four', 2, 45, 'Accompagnement', [
    l('2 patates douces', 'patate_douce', 2),
    l('1 c. à soupe d’huile d’olive', 'huile_d_olive', 1, 'c. à soupe'),
    l('1/2 c. à café de paprika', 'paprika', 0.5, 'c. à café'),
    SEL,
  ], [
    'Préchauffer le four à 200 °C.',
    'Laver les patates douces et les couper en deux dans la longueur.',
    'Badigeonner la chair d’huile, saupoudrer de paprika et de sel.',
    'Cuire 35 à 40 minutes, face coupée vers le haut, jusqu’à ce que la chair soit fondante.',
  ]),
  R('papille-brocoli-vapeur', 'Brocoli vapeur', 2, 15, 'Accompagnement', [
    l('400 g de brocoli', 'brocoli', 400, 'g'),
    l('1 c. à soupe d’huile d’olive', 'huile_d_olive', 1, 'c. à soupe'),
    opt('1/2 citron', 'citron', 0.5),
    SEL,
  ], [
    'Détailler le brocoli en petits bouquets et rincer.',
    'Les cuire 6 à 8 minutes à la vapeur (ou dans une casserole avec 2 cm d’eau, couvercle fermé) : ils doivent rester verts et un peu fermes.',
    'Assaisonner d’huile, de sel et d’un filet de citron.',
  ]),
  R('papille-haricots-verts-beurre', 'Haricots verts au beurre', 2, 20, 'Accompagnement', [
    l('400 g de haricots verts', 'haricot_vert', 400, 'g'),
    l('15 g de beurre', 'beurre', 15, 'g'),
    l('1 gousse d’ail', 'ail', 1, 'gousse'),
    SEL, POIVRE,
  ], [
    'Équeuter les haricots et les rincer.',
    'Les cuire 8 à 10 minutes dans une grande casserole d’eau bouillante salée, puis égoutter.',
    'Faire fondre le beurre dans une poêle avec l’ail haché, ajouter les haricots et les faire revenir 2 minutes. Saler, poivrer.',
  ]),
  R('papille-champignons-creme', 'Champignons à la crème', 2, 20, 'Accompagnement', [
    l('300 g de champignons de Paris', 'champignon_de_paris', 300, 'g'),
    l('10 g de beurre', 'beurre', 10, 'g'),
    l('1 gousse d’ail', 'ail', 1, 'gousse'),
    l('100 g de crème fraîche', 'creme_fraiche', 100, 'g'),
    opt('Quelques brins de persil', 'persil', 5, 'g'),
    SEL, POIVRE,
  ], [
    'Nettoyer les champignons avec un papier humide et les couper en lamelles.',
    'Les faire revenir 8 minutes dans le beurre à feu vif, jusqu’à ce que leur eau soit évaporée.',
    'Ajouter l’ail haché, puis la crème ; laisser épaissir 2 minutes. Saler, poivrer, parsemer de persil.',
    'Servir avec des pâtes, du riz ou sur une tartine grillée.',
  ]),
  R('papille-edamame-sel', 'Edamame au sel', 2, 10, 'Entrée', [
    ajuste(l('300 g d’edamame surgelés', 'edamame', 300, 'g'), 0.28, 'CIQUAL : soja sec (441 kcal) ; edamame cuits ≈ 125 kcal'),
    l('1 c. à café de gros sel', 'sel', 1, 'c. à café'),
  ], [
    'Plonger les edamame dans une casserole d’eau bouillante et cuire 4 à 5 minutes.',
    'Égoutter et saupoudrer de gros sel.',
    'Se mangent avec les doigts : on presse la cosse entre les dents pour sortir les fèves.',
  ], 'Asiatique'),

  /* ---------- Pâtes, riz, nouilles ---------- */
  R('papille-coquillettes-jambon', 'Coquillettes au jambon', 2, 15, 'Plat', [
    l('200 g de coquillettes', 'pates_seches', 200, 'g'),
    l('2 tranches de jambon cuit', 'jambon_cuit', 2, 'tranche'),
    l('15 g de beurre', 'beurre', 15, 'g'),
    l('40 g de fromage râpé', 'fromage_rape', 40, 'g'),
    SEL, POIVRE,
  ], [
    'Cuire les coquillettes dans une grande casserole d’eau bouillante salée le temps indiqué sur le paquet.',
    'Pendant ce temps, couper le jambon en petits morceaux.',
    'Égoutter les pâtes, les remettre dans la casserole avec le beurre, le jambon et le fromage, et mélanger jusqu’à ce que le fromage fonde. Poivrer.',
  ], 'Française'),
  R('papille-pates-lardons-creme', 'Pâtes aux lardons et à la crème', 2, 20, 'Plat', [
    l('200 g de pâtes', 'pates_seches', 200, 'g'),
    l('100 g de lardons', 'lardon', 100, 'g'),
    l('1/2 oignon', 'oignon', 0.5),
    l('100 g de crème fraîche', 'creme_fraiche', 100, 'g'),
    opt('20 g de fromage râpé', 'fromage_rape', 20, 'g'),
    SEL, POIVRE,
  ], [
    'Cuire les pâtes dans une grande casserole d’eau bouillante salée.',
    'Pendant ce temps, faire dorer les lardons à sec dans une poêle 5 minutes, puis ajouter l’oignon émincé et le laisser fondre 3 minutes.',
    'Ajouter la crème et un peu d’eau de cuisson des pâtes, laisser frémir 1 minute.',
    'Égoutter les pâtes, les mélanger à la sauce, poivrer et parsemer de fromage.',
  ]),
  R('papille-pates-chorizo-tomate', 'Pâtes au chorizo et à la tomate', 2, 20, 'Plat', [
    l('200 g de pâtes', 'pates_seches', 200, 'g'),
    l('60 g de chorizo', 'chorizo', 60, 'g'),
    l('250 g de sauce tomate', 'sauce_tomate', 250, 'g'),
    l('1 gousse d’ail', 'ail', 1, 'gousse'),
    opt('Quelques feuilles de basilic', 'basilic', 3, 'g'),
    SEL,
  ], [
    'Cuire les pâtes dans une grande casserole d’eau bouillante salée.',
    'Couper le chorizo en petits dés et le faire revenir 2 minutes à sec dans une poêle : il rend son huile.',
    'Ajouter l’ail haché puis la sauce tomate, et laisser mijoter 5 minutes.',
    'Mélanger avec les pâtes égouttées et le basilic.',
  ]),
  R('papille-one-pot-pasta-tomate-mozzarella', 'One pot pasta tomate et mozzarella', 2, 20, 'Plat', [
    l('200 g de pâtes longues', 'pates_seches', 200, 'g'),
    l('200 g de tomates cerises', 'tomate_cerise', 200, 'g'),
    l('1 gousse d’ail', 'ail', 1, 'gousse'),
    l('500 ml d’eau', 'eau', 500, 'ml'),
    l('1 c. à soupe d’huile d’olive', 'huile_d_olive', 1, 'c. à soupe'),
    l('1 boule de mozzarella', 'mozzarella', 1, 'boule'),
    opt('Quelques feuilles de basilic', 'basilic', 3, 'g'),
    SEL, POIVRE,
  ], [
    'Mettre dans une grande poêle ou une sauteuse les pâtes crues, les tomates coupées en deux, l’ail émincé, l’huile, l’eau et une pincée de sel.',
    'Porter à ébullition et cuire 10 à 12 minutes en remuant souvent, jusqu’à ce que les pâtes soient cuites et l’eau presque absorbée (ajouter un peu d’eau si besoin).',
    'Hors du feu, ajouter la mozzarella en morceaux et le basilic. Poivrer et servir aussitôt.',
  ], 'Italienne'),
  R('papille-mac-and-cheese', 'Mac and cheese', 2, 25, 'Plat', [
    l('200 g de macaronis', 'pates_seches', 200, 'g'),
    l('15 g de beurre', 'beurre', 15, 'g'),
    l('1 c. à soupe de farine', 'farine_de_ble', 1, 'c. à soupe'),
    l('250 ml de lait', 'lait', 250, 'ml'),
    l('100 g de cheddar râpé', 'cheddar', 100, 'g'),
    SEL, POIVRE,
  ], [
    'Cuire les macaronis dans une grande casserole d’eau bouillante salée, en les gardant un peu fermes, puis égoutter.',
    'Dans la même casserole, faire fondre le beurre, ajouter la farine et remuer 1 minute.',
    'Verser le lait petit à petit en fouettant, et laisser épaissir 3 minutes à feu doux.',
    'Hors du feu, ajouter le cheddar, puis les pâtes. Saler, poivrer et bien mélanger.',
  ]),
  R('papille-gnocchis-poeles', 'Gnocchis poêlés au parmesan', 2, 15, 'Plat', [
    l('400 g de gnocchis', 'gnocchi', 400, 'g'),
    l('20 g de beurre', 'beurre', 20, 'g'),
    l('20 g de parmesan râpé', 'parmesan', 20, 'g'),
    POIVRE,
  ], [
    'Faire fondre le beurre dans une grande poêle à feu moyen.',
    'Y verser les gnocchis directement, sans les cuire à l’eau, et les faire dorer 8 à 10 minutes en remuant souvent.',
    'Parsemer de parmesan et de poivre avant de servir.',
  ], 'Italienne'),
  R('papille-gnocchis-tomate-mozzarella', 'Gnocchis à la tomate et à la mozzarella', 2, 25, 'Plat', [
    l('400 g de gnocchis', 'gnocchi', 400, 'g'),
    l('300 g de sauce tomate', 'sauce_tomate', 300, 'g'),
    l('1 boule de mozzarella', 'mozzarella', 1, 'boule'),
    opt('Quelques feuilles de basilic', 'basilic', 3, 'g'),
    SEL,
  ], [
    'Préchauffer le four en position gril.',
    'Faire chauffer la sauce tomate dans une poêle, ajouter les gnocchis et cuire 5 minutes en remuant.',
    'Verser dans un plat allant au four, couvrir de mozzarella en tranches.',
    'Passer 5 à 8 minutes sous le gril, jusqu’à ce que la mozzarella soit fondue et dorée. Ajouter le basilic.',
  ], 'Italienne'),
  R('papille-riz-saute-oeuf', 'Riz sauté à l’œuf', 2, 15, 'Plat', [
    l('300 g de riz cuit (de la veille)', 'riz_cuit', 300, 'g'),
    l('2 œufs', 'oeuf', 2),
    l('1 c. à soupe d’huile', 'huile_de_tournesol', 1, 'c. à soupe'),
    l('2 c. à soupe de sauce soja', 'sauce_soja', 2, 'c. à soupe'),
    l('2 oignons nouveaux', 'oignon_nouveau', 30, 'g'),
  ], [
    'Chauffer l’huile dans une grande poêle ou un wok à feu vif.',
    'Battre les œufs, les verser dans la poêle et les brouiller 1 minute, puis les pousser sur le côté.',
    'Ajouter le riz froid et le faire sauter 4 à 5 minutes en l’écrasant pour séparer les grains.',
    'Mélanger avec les œufs, la sauce soja et les oignons nouveaux émincés.',
  ], 'Asiatique'),
  R('papille-ramen-express-oeuf', 'Ramen express à l’œuf', 2, 15, 'Soupe', [
    l('160 g de nouilles de blé', 'nouilles_de_ble', 160, 'g'),
    ajuste(l('600 ml de bouillon de volaille', 'bouillon_de_volaille', 600, 'ml'), 0.025, 'CIQUAL : bouillon déshydraté ; bouillon prêt à boire ≈ 5 kcal/100 ml'),
    l('2 c. à soupe de sauce soja', 'sauce_soja', 2, 'c. à soupe'),
    l('2 œufs', 'oeuf', 2),
    l('2 oignons nouveaux', 'oignon_nouveau', 30, 'g'),
    opt('1 c. à café d’huile de sésame', 'huile_de_sesame', 1, 'c. à café'),
  ], [
    'Cuire les œufs 6 minutes dans l’eau bouillante, les refroidir sous l’eau froide et les écaler.',
    'Porter le bouillon à ébullition avec la sauce soja.',
    'Y cuire les nouilles le temps indiqué sur le paquet.',
    'Répartir dans deux bols, ajouter les œufs coupés en deux, les oignons nouveaux émincés et quelques gouttes d’huile de sésame.',
  ], 'Asiatique'),

  /* ---------- Bowls et salades ---------- */
  R('papille-burrito-bowl', 'Burrito bowl', 2, 25, 'Plat', [
    l('150 g de riz basmati', 'riz', 150, 'g'),
    ajuste(l('250 g de haricots rouges en boîte, égouttés', 'haricot_rouge', 250, 'g'), 0.32, 'CIQUAL : haricots secs (314 kcal) ; en boîte ≈ 100 kcal'),
    l('140 g de maïs', 'mais_doux', 140, 'g'),
    l('1 avocat', 'avocat', 1),
    l('2 tomates', 'tomate', 2),
    l('1 citron vert', 'citron_vert', 1),
    l('1 c. à café de cumin', 'cumin', 1, 'c. à café'),
    opt('40 g de fromage râpé', 'fromage_rape', 40, 'g'),
    SEL,
  ], [
    'Cuire le riz (voir « Riz blanc ») et le mélanger avec le jus d’un demi citron vert.',
    'Réchauffer les haricots rouges 5 minutes dans une casserole avec le cumin et une pincée de sel.',
    'Couper l’avocat et les tomates en dés, les arroser du reste de citron vert.',
    'Répartir dans deux bols : riz, haricots, maïs, tomates, avocat, puis le fromage.',
  ]),
  R('papille-poke-bowl-saumon-fume', 'Poke bowl au saumon fumé', 2, 25, 'Plat', [
    l('150 g de riz', 'riz', 150, 'g'),
    l('150 g de saumon fumé', 'saumon_fume', 150, 'g'),
    l('1 avocat', 'avocat', 1),
    l('1/2 concombre', 'concombre', 0.5),
    ajuste(l('100 g d’edamame décortiqués', 'edamame', 100, 'g'), 0.28, 'CIQUAL : soja sec (441 kcal) ; edamame cuits ≈ 125 kcal'),
    l('3 c. à soupe de sauce soja', 'sauce_soja', 3, 'c. à soupe'),
    opt('1 c. à café de graines de sésame', 'graine_de_sesame', 1, 'c. à café'),
  ], [
    'Cuire le riz, puis le laisser tiédir.',
    'Cuire les edamame 4 minutes dans l’eau bouillante et les égoutter.',
    'Couper le saumon en lanières, l’avocat et le concombre en dés.',
    'Répartir le riz dans deux bols, disposer les garnitures par-dessus, arroser de sauce soja et parsemer de sésame.',
  ], 'Asiatique'),
  R('papille-salade-cesar', 'Salade César', 2, 25, 'Salade', [
    l('1 laitue romaine (200 g)', 'laitue', 200, 'g'),
    l('2 blancs de poulet', 'blanc_de_poulet', 2),
    l('2 tranches de pain', 'pain_de_campagne', 2, 'tranche'),
    l('30 g de parmesan', 'parmesan', 30, 'g'),
    l('4 c. à soupe de sauce César', 'sauce_pour_salade_cesar', 4, 'c. à soupe'),
    l('1 c. à soupe d’huile d’olive', 'huile_d_olive', 1, 'c. à soupe'),
    SEL, POIVRE,
  ], [
    'Cuire les blancs de poulet à la poêle dans l’huile, 6 à 7 minutes par face, jusqu’à ce qu’ils soient bien cuits à cœur ; les trancher.',
    'Couper le pain en cubes et les dorer 3 minutes dans la même poêle pour faire des croûtons.',
    'Laver et essorer la salade, la couper en morceaux.',
    'Mélanger la salade avec la sauce, ajouter le poulet, les croûtons et des copeaux de parmesan.',
  ]),
  R('papille-salade-tomate-mozzarella', 'Salade tomate mozzarella', 2, 10, 'Salade', [
    l('3 tomates', 'tomate', 3),
    l('1 boule de mozzarella', 'mozzarella', 1, 'boule'),
    l('Quelques feuilles de basilic', 'basilic', 5, 'g'),
    l('2 c. à soupe d’huile d’olive', 'huile_d_olive', 2, 'c. à soupe'),
    opt('1 c. à café de vinaigre balsamique', 'vinaigre_balsamique', 1, 'c. à café'),
    SEL, POIVRE,
  ], [
    'Couper les tomates et la mozzarella en tranches.',
    'Les disposer en les alternant sur une assiette, glisser les feuilles de basilic entre elles.',
    'Arroser d’huile d’olive et de vinaigre balsamique, saler et poivrer.',
  ], 'Italienne'),

  /* ---------- Sandwichs, wraps, tortillas ---------- */
  R('papille-croque-madame-poele', 'Croque-madame à la poêle', 2, 15, 'Plat', [
    l('4 tranches de pain de mie', 'pain_de_mie', 4, 'tranche'),
    l('2 tranches de jambon cuit', 'jambon_cuit', 2, 'tranche'),
    l('60 g d’emmental râpé', 'emmental', 60, 'g'),
    l('20 g de beurre', 'beurre', 20, 'g'),
    l('2 œufs', 'oeuf', 2),
  ], [
    'Beurrer une face de chaque tranche de pain.',
    'Garnir deux tranches (côté non beurré) de jambon et de fromage, refermer avec les deux autres, face beurrée à l’extérieur.',
    'Cuire 3 à 4 minutes par face dans une poêle à feu moyen, jusqu’à ce que le pain soit doré et le fromage fondu.',
    'Cuire les œufs au plat dans la même poêle et en poser un sur chaque croque.',
  ], 'Française'),
  R('papille-grilled-cheese', 'Grilled cheese', 2, 10, 'Plat', [
    l('4 tranches de pain de mie', 'pain_de_mie', 4, 'tranche'),
    l('80 g de cheddar en tranches', 'cheddar', 80, 'g'),
    l('20 g de beurre', 'beurre', 20, 'g'),
  ], [
    'Beurrer une face de chaque tranche de pain.',
    'Poser le cheddar sur deux tranches, côté non beurré, et refermer avec les deux autres, face beurrée à l’extérieur.',
    'Cuire 3 minutes par face dans une poêle à feu moyen, en appuyant légèrement avec une spatule, jusqu’à ce que le fromage file.',
  ]),
  R('papille-sandwich-thon-mayo', 'Sandwich thon mayo', 2, 10, 'Plat', [
    l('4 tranches de pain de mie', 'pain_de_mie', 4, 'tranche'),
    l('1 boîte de thon au naturel (140 g)', 'thon_en_boite', 140, 'g'),
    l('2 c. à soupe de mayonnaise', 'mayonnaise', 2, 'c. à soupe'),
    l('1 tomate', 'tomate', 1),
    l('Quelques feuilles de laitue', 'laitue', 20, 'g'),
    POIVRE,
  ], [
    'Égoutter le thon et l’émietter à la fourchette avec la mayonnaise. Poivrer.',
    'Couper la tomate en rondelles.',
    'Garnir deux tranches de pain avec la laitue, la tomate et le thon, puis refermer.',
  ]),
  R('papille-club-sandwich-poulet', 'Club sandwich au poulet', 2, 25, 'Plat', [
    l('6 tranches de pain de mie', 'pain_de_mie', 6, 'tranche'),
    l('1 blanc de poulet', 'blanc_de_poulet', 1),
    l('4 tranches de bacon', 'bacon', 4, 'tranche'),
    l('1 tomate', 'tomate', 1),
    l('Quelques feuilles de laitue', 'laitue', 30, 'g'),
    l('2 c. à soupe de mayonnaise', 'mayonnaise', 2, 'c. à soupe'),
    SEL, POIVRE,
  ], [
    'Cuire le blanc de poulet à la poêle 6 à 7 minutes par face, jusqu’à ce qu’il soit bien cuit à cœur, puis le trancher finement.',
    'Faire griller le bacon dans la même poêle 2 minutes par face. Griller les tranches de pain.',
    'Tartiner les tranches de mayonnaise. Sur une tranche : laitue, poulet ; recouvrir d’une tranche, puis tomate et bacon ; refermer.',
    'Couper chaque sandwich en deux triangles, en les maintenant avec des pique-olives.',
  ]),
  R('papille-quesadillas-fromage', 'Quesadillas au fromage', 2, 15, 'Plat', [
    l('4 tortillas de blé', 'tortilla_de_ble', 4),
    l('120 g de fromage râpé', 'fromage_rape', 120, 'g'),
    opt('80 g de maïs', 'mais_doux', 80, 'g'),
    opt('1 pincée de piment en poudre', 'piment_en_poudre', 1, 'pincée'),
  ], [
    'Répartir le fromage (et le maïs) sur deux tortillas, ajouter le piment, couvrir avec les deux autres.',
    'Cuire chaque quesadilla 2 à 3 minutes par face dans une poêle sèche à feu moyen, jusqu’à ce que le fromage soit fondu.',
    'Couper en quartiers et servir chaud.',
  ]),
  R('papille-quesadillas-poulet', 'Quesadillas au poulet', 2, 25, 'Plat', [
    l('4 tortillas de blé', 'tortilla_de_ble', 4),
    l('1 blanc de poulet', 'blanc_de_poulet', 1),
    l('1 poivron', 'poivron', 1),
    l('100 g de fromage râpé', 'fromage_rape', 100, 'g'),
    l('1 c. à café de paprika', 'paprika', 1, 'c. à café'),
    l('1 c. à café d’huile', 'huile_de_tournesol', 1, 'c. à café'),
    SEL,
  ], [
    'Couper le poulet et le poivron en fines lanières.',
    'Les faire revenir 8 à 10 minutes dans l’huile avec le paprika et le sel, jusqu’à ce que le poulet soit bien cuit.',
    'Répartir la garniture et le fromage sur deux tortillas et couvrir avec les deux autres.',
    'Cuire 2 à 3 minutes par face dans une poêle sèche, puis couper en quartiers.',
  ]),
  R('papille-pizza-tortilla', 'Pizza tortilla', 2, 15, 'Plat', [
    l('2 tortillas de blé', 'tortilla_de_ble', 2),
    l('80 g de sauce tomate', 'sauce_tomate', 80, 'g'),
    l('1 boule de mozzarella', 'mozzarella', 1, 'boule'),
    opt('2 tranches de jambon cuit', 'jambon_cuit', 2, 'tranche'),
    opt('1 pincée d’origan', 'origan', 1, 'pincée'),
  ], [
    'Préchauffer le four à 220 °C.',
    'Poser les tortillas sur une plaque couverte de papier cuisson, les tartiner de sauce tomate.',
    'Ajouter le jambon en morceaux, la mozzarella en tranches et l’origan.',
    'Cuire 8 à 10 minutes, jusqu’à ce que le bord soit croustillant et le fromage fondu.',
  ], 'Italienne'),
  R('papille-tacos-boeuf', 'Tacos au bœuf haché', 3, 25, 'Plat', [
    ajuste(l('6 petites tortillas de maïs', 'tortilla_de_mais', 6), 0.45, 'CIQUAL : chips de maïs (499 kcal) ; tortilla souple ≈ 220 kcal'),
    l('250 g de bœuf haché', 'boeuf_hache', 250, 'g'),
    l('1 oignon', 'oignon', 1),
    l('1 c. à café de cumin', 'cumin', 1, 'c. à café'),
    l('1 c. à café de paprika', 'paprika', 1, 'c. à café'),
    l('1 tomate', 'tomate', 1),
    l('Quelques feuilles de laitue', 'laitue', 40, 'g'),
    opt('60 g de fromage râpé', 'fromage_rape', 60, 'g'),
    l('1 c. à café d’huile', 'huile_de_tournesol', 1, 'c. à café'),
    SEL,
  ], [
    'Faire revenir l’oignon haché 3 minutes dans l’huile.',
    'Ajouter le bœuf, le cumin, le paprika et le sel, et cuire 6 à 8 minutes en émiettant la viande, jusqu’à ce qu’elle ne soit plus rosée.',
    'Réchauffer les tortillas 30 secondes de chaque côté dans une poêle sèche.',
    'Garnir chaque tortilla de viande, de laitue émincée, de tomate en dés et de fromage.',
  ]),
  R('papille-hot-dog-maison', 'Hot-dog maison', 2, 15, 'Plat', [
    l('4 pains à hot-dog', 'pain_burger', 4),
    l('4 saucisses de Strasbourg', 'saucisse_de_strasbourg', 4),
    l('2 c. à soupe de moutarde', 'moutarde_de_dijon', 2, 'c. à soupe'),
    l('2 c. à soupe de ketchup', 'ketchup', 2, 'c. à soupe'),
    opt('2 c. à soupe d’oignons frits', 'oignon_frit', 2, 'c. à soupe'),
  ], [
    'Chauffer les saucisses 5 minutes dans une casserole d’eau frémissante (sans faire bouillir, elles éclateraient).',
    'Ouvrir les pains et les passer 2 minutes au four ou au grille-pain.',
    'Glisser une saucisse dans chaque pain, ajouter moutarde, ketchup et oignons frits.',
  ]),
  R('papille-kebab-maison-poulet', 'Kebab maison au poulet', 2, 30, 'Plat', [
    l('2 pains pita', 'pain_pita', 2),
    l('2 blancs de poulet', 'blanc_de_poulet', 2),
    l('1 c. à café de cumin', 'cumin', 1, 'c. à café'),
    l('1 c. à café de paprika', 'paprika', 1, 'c. à café'),
    l('1 c. à soupe d’huile', 'huile_de_tournesol', 1, 'c. à soupe'),
    l('150 g de yaourt grec', 'yaourt_grec', 150, 'g'),
    l('1 gousse d’ail', 'ail', 1, 'gousse'),
    l('1 tomate', 'tomate', 1),
    l('Quelques feuilles de laitue', 'laitue', 40, 'g'),
    l('1/2 oignon', 'oignon', 0.5),
    SEL,
  ], [
    'Couper le poulet en fines lanières et le mélanger avec le cumin, le paprika, le sel et l’huile.',
    'Le cuire 8 à 10 minutes dans une poêle bien chaude, jusqu’à ce qu’il soit doré et cuit à cœur.',
    'Mélanger le yaourt avec l’ail écrasé et une pincée de sel pour faire la sauce blanche.',
    'Réchauffer les pains pita, les ouvrir et les garnir de poulet, laitue, tomate, oignon émincé et sauce.',
  ]),
  R('papille-nuggets-poulet-four', 'Nuggets de poulet au four', 2, 30, 'Plat', [
    l('2 blancs de poulet (300 g)', 'blanc_de_poulet', 300, 'g'),
    l('30 g de farine', 'farine_de_ble', 30, 'g'),
    l('1 œuf', 'oeuf', 1),
    l('60 g de chapelure', 'chapelure', 60, 'g'),
    l('1 c. à café de paprika', 'paprika', 1, 'c. à café'),
    l('1 c. à soupe d’huile', 'huile_de_tournesol', 1, 'c. à soupe'),
    SEL,
  ], [
    'Préchauffer le four à 200 °C.',
    'Couper le poulet en morceaux de la taille d’une bouchée et les saler.',
    'Préparer trois assiettes : la farine, l’œuf battu, la chapelure mélangée au paprika. Passer chaque morceau dans les trois, dans cet ordre.',
    'Les poser sur une plaque couverte de papier cuisson, arroser d’un filet d’huile et cuire 15 à 18 minutes en les retournant à mi-cuisson, jusqu’à ce qu’ils soient dorés et cuits à cœur.',
  ]),
  R('papille-pommes-de-terre-lardons-oignons', 'Poêlée de pommes de terre, lardons et oignons', 3, 35, 'Plat', [
    l('600 g de pommes de terre', 'pomme_de_terre', 600, 'g'),
    l('150 g de lardons', 'lardon', 150, 'g'),
    l('1 oignon', 'oignon', 1),
    l('1 c. à soupe d’huile', 'huile_de_tournesol', 1, 'c. à soupe'),
    POIVRE,
  ], [
    'Couper les pommes de terre en cubes et les cuire 5 minutes dans l’eau bouillante salée ; égoutter.',
    'Faire dorer les lardons à sec dans une grande poêle, les réserver.',
    'Dans la même poêle, ajouter l’huile et faire dorer les pommes de terre 15 minutes à feu moyen.',
    'Ajouter l’oignon émincé et les lardons, cuire encore 5 minutes. Poivrer (les lardons sont déjà salés).',
  ]),

  /* ---------- Sauces et à-côtés ---------- */
  R('papille-guacamole', 'Guacamole', 3, 10, 'Sauce et base', [
    l('2 avocats bien mûrs', 'avocat', 2),
    l('1 citron vert', 'citron_vert', 1),
    l('1 tomate', 'tomate', 1),
    l('1/4 d’oignon', 'oignon', 0.25),
    opt('Quelques brins de coriandre', 'coriandre_feuille', 5, 'g'),
    SEL,
  ], [
    'Écraser la chair des avocats à la fourchette avec le jus du citron vert.',
    'Ajouter la tomate en petits dés, l’oignon très finement haché et la coriandre ciselée.',
    'Saler et servir aussitôt, avec des chips de maïs, dans des tacos ou sur une tartine.',
  ], 'Latino-américaine'),
  R('papille-vinaigrette', 'Vinaigrette maison', 4, 5, 'Sauce et base', [
    l('1 c. à café de moutarde', 'moutarde_de_dijon', 1, 'c. à café'),
    l('1 c. à soupe de vinaigre de vin', 'vinaigre_de_vin', 1, 'c. à soupe'),
    l('3 c. à soupe d’huile', 'huile_de_tournesol', 3, 'c. à soupe'),
    SEL, POIVRE,
  ], [
    'Dans un bol, mélanger la moutarde, le vinaigre, le sel et le poivre.',
    'Ajouter l’huile en fouettant à la fourchette jusqu’à ce que la sauce soit liée.',
    'Se garde une semaine au réfrigérateur dans un bocal fermé : secouer avant usage.',
  ], 'Française'),
  R('papille-sauce-blanche-yaourt', 'Sauce blanche au yaourt', 4, 5, 'Sauce et base', [
    l('150 g de yaourt grec', 'yaourt_grec', 150, 'g'),
    l('1 c. à soupe de mayonnaise', 'mayonnaise', 1, 'c. à soupe'),
    l('1 gousse d’ail', 'ail', 1, 'gousse'),
    opt('Un peu de ciboulette', 'ciboulette', 5, 'g'),
    SEL,
  ], [
    'Écraser ou râper finement l’ail.',
    'Le mélanger avec le yaourt, la mayonnaise, la ciboulette ciselée et une pincée de sel.',
    'Laisser reposer 10 minutes au frais. Parfaite avec un kebab, des frites ou des légumes crus.',
  ]),
];
