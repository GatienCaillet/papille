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
- **Encore simulé** : recherche web (résultats d’exemple), import de recettes, recettes (onze recettes de démonstration).

## Données d’aliments

`public/data/aliments.json` et `public/data/ciqual.json` sont générés par :

```bash
node scripts/build-foods.mjs <dossier-sources>
```

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
- `src/data/` : aliments et recettes de démonstration.
- `public/wireframes/` : les trois wireframes de l’étape 1.

Photos de plats : Unsplash (licence Unsplash).
