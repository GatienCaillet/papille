# Papille

Manger ce qu’on aime, sans jamais risquer ce qu’on ne peut pas manger.

Application web (téléphone et ordinateur) en Vite + React, publiée sur GitHub Pages. Supabase servira aux comptes et aux données.

- Maquette : https://gatiencaillet.github.io/papille/
- Wireframes (étape 1) : https://gatiencaillet.github.io/papille/wireframes/

## État actuel

Proposition A « Tableau de bord » : connexion, profil, swipe, mes goûts, recettes et filtres, fiche recette, recherche web, découvrir, journal et apports, liste de courses.

- **Compte réel (Supabase)** : inscription, connexion par mot de passe, déconnexion. Profil, goûts, avis sur les plats, journal, liste de courses et liste de base sont enregistrés sur le compte (tables protégées par RLS : chacun ne voit que ses lignes).
- **Démo sans compte** : bouton « Essayer la démo » sur l’écran de connexion, profil fictif gardé dans le navigateur.
- **Déjà réel** : vérification de sécurité (allergènes, régimes, interdits, ingrédients composés comme le pesto ou le bouillon), recettes non vérifiables masquées, scores des aliments, Mifflin-St Jeor, apports du jour et sur 7 jours, fusion des courses.
- **Aliments réels** : 1 003 ingrédients du référentiel Bouchée (allergènes hérités, composants cachés, taxonomie) avec leurs nutriments CIQUAL 2025 ; base du swipe = les 200 ingrédients les plus utilisés dans les 1 010 recettes du catalogue ; journal sur toute la table CIQUAL (3 484 aliments).
- **Recettes réelles** : les 1 010 recettes du catalogue Bouchée, vérifiées une à une contre le profil (ingrédients composés et lignes vagues compris : une ligne « huile » sans précision rend la recette « impossible à vérifier » si une variante heurte le profil). Type de plat, origine et nutriments par portion sont estimés par le script de conversion ; 548 recettes rédigées pour Bouchée sont signalées « pas encore testées ».
- **Recettes simples Papille** : 48 recettes salées très simples rédigées pour l’app (`scripts/recettes-papille.mjs`) : cuissons de base (riz, quinoa, œufs, steak, poulet, saumon, légumes) et classiques rapides des 20-25 ans (coquillettes jambon, quesadillas, croque-madame, kebab maison, ramen express, poke bowl…). Elles passent par la même vérification et sont aussi signalées « pas encore testées ».
- **Recherche web et import** : Edge Function Supabase `recettes-web` (code dans `supabase/functions/`). La recherche interroge les moteurs internes de Marmiton et 750g (les moteurs généralistes comme DuckDuckGo et Bing bloquent les serveurs) ; les mots exclus du profil retirent les titres concernés, puis chaque recette trouvée est lue (données schema.org) et vérifiée ingrédient par ingrédient. « Coller un lien » lit aussi Cuisine AZ, Journal des Femmes et Ricardo. Les recettes importées sont enregistrées dans la table `user_recipes` (copie privée pour usage personnel, lien vers la source conservé).
- **À savoir avant une ouverture au public** : relire les conditions d’utilisation des sites lus par la fonction.

## Données d’aliments et de recettes

`public/data/aliments.json`, `public/data/ciqual.json` et `public/data/recettes.json` sont générés par :

```bash
node scripts/build-foods.mjs <dossier-sources>
node scripts/build-recipes.mjs <dossier-sources>
```

`build-recipes.mjs` ajoute à la fin les recettes rédigées pour Papille. Pour ne mettre à jour qu’elles, sans le dossier source : `node scripts/add-papille-recipes.mjs` (contrôle aussi que chaque ingrédient cité existe dans le référentiel). Quand un aliment CIQUAL est décrit dans un autre état que dans la recette (haricots secs pour des haricots en boîte, bouillon déshydraté…), la ligne porte un facteur qui corrige seulement le calcul des nutriments.

Le dossier contient la table « Table Ciqual 2025_FR_2025_11_03.xlsx » décompressée dans `xlsx/` (Anses, Licence Ouverte 2.0, doi:10.57745/RDMHWY) et `ingredients.json` + `recettes.json` de https://gatiencaillet.github.io/bouchee-catalogue/v1/. Les codes CIQUAL 2020 absents de la version 2025 ont un équivalent choisi dans le script.

## Supabase

- Projet `eccernutbnunvydpfybt`. Schéma : `supabase/migrations/`.
- La clé publiable est dans `src/lib/supabase.js` : elle est publique par conception, la sécurité repose sur les règles RLS.
- Réglages à faire dans le tableau de bord (Authentication → URL Configuration) : Site URL `https://gatiencaillet.github.io/papille/`, Redirect URLs `https://gatiencaillet.github.io/papille/**` et `http://localhost:5173/papille/**`.

## Développer

```bash
npm install
npm run dev
```

Puis http://localhost:5173/papille/ (ajouter `?auto` pour ouvrir directement la démo en développement).

Chaque push sur `main` construit et publie le site (`.github/workflows/deploy.yml`).

## Repères

- `PRODUCT.md` : le produit, ses règles, ses contraintes.
- `DESIGN.md` : le système visuel (couleurs, typo, composants).
- `src/lib/logic.js` : sécurité, goûts, nutrition, courses.
- `src/data/` : chargement des aliments, de la table CIQUAL et des recettes (`public/data/`).
- `scripts/` : conversion des sources (CIQUAL, catalogue Bouchée) en données de l’app.
- `public/wireframes/` : les trois wireframes de l’étape 1.

## Sources et licences

- Recettes : adaptations du *Livre de cuisine* de Wikibooks (CC BY-SA 3.0 ou 4.0 selon la révision) et recettes rédigées pour Bouchée (CC BY-SA 4.0), via le catalogue Bouchée. `public/data/recettes.json` reste sous CC BY-SA ; chaque fiche de l’app cite sa source, ses auteurs, sa licence et ses modifications.
- Photos : Wikipédia et Wikimedia Commons (`public/data/images.json`) ; auteur et licence sur chaque fiche et dans la page Crédits de l’app.
  - Aliments : `node scripts/build-images.mjs` (article Wikipédia de l’aliment). Dessins et planches botaniques écartés ; homonymes corrigés à la main dans le script.
  - Plats : `node scripts/build-recipe-photos.mjs` (à lancer ensuite) cherche une photo du plat lui-même pour chaque recette, avec des requêtes écrites par famille de recettes dans `scripts/recipe-queries.mjs` (« velouté de poireaux » → *leek soup*) ; chaque recette a sa propre photo. Les choix faits à la relecture (photo imposée, photo écartée, photo d’origine remplacée) sont dans `scripts/recipe-photos.json`. `--review` écrit une planche contact `scripts/.cache/review.html` ; `--fast` limite les recherches (Commons n’accepte qu’une dizaine de recherches par minute sans compte). Une recette sans aucune photo trouvée reste illustrée par son ingrédient principal, et la fiche le dit.
- Nutriments : Table Ciqual 2025, Anses (Licence Ouverte 2.0).
- Photo de l’écran de connexion : Unsplash (licence Unsplash).
