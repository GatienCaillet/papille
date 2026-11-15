# Papille

Manger ce qu’on aime, sans jamais risquer ce qu’on ne peut pas manger.

Application web (téléphone et ordinateur) en Vite + React, publiée sur GitHub Pages. Supabase servira aux comptes et aux données.

- Maquette : https://gatiencaillet.github.io/papille/
- Wireframes (étape 1) : https://gatiencaillet.github.io/papille/wireframes/

## Étape en cours : maquette cliquable

Proposition A « Tableau de bord » en haute fidélité, avec des données fictives : connexion, profil, swipe, mes goûts, recettes et filtres, fiche recette, recherche web, découvrir, journal et apports, liste de courses. Tout est interactif et reste dans le navigateur (localStorage) ; aucune donnée n’est envoyée. « Réinitialiser la démo » dans le Profil remet les données de départ.

Déjà réel dans la maquette : la vérification de sécurité (allergènes, régimes, interdits, ingrédients composés comme le pesto ou le bouillon), les recettes non vérifiables masquées, le score des aliments, le calcul Mifflin-St Jeor, les apports du jour et sur 7 jours, la fusion des courses.

Encore simulé : comptes Supabase, recherche web (résultats d’exemple), import de recettes, table CIQUAL complète.

## Développer

```bash
npm install
npm run dev
```

Puis http://localhost:5173/papille/ (ajouter `?auto` pour arriver déjà connecté en développement).

Chaque push sur `main` construit et publie le site (`.github/workflows/deploy.yml`).

## Repères

- `PRODUCT.md` : le produit, ses règles, ses contraintes.
- `DESIGN.md` : le système visuel (couleurs, typo, composants).
- `src/lib/logic.js` : sécurité, goûts, nutrition, courses.
- `src/data/` : aliments et recettes de démonstration.
- `public/wireframes/` : les trois wireframes de l’étape 1.

Photos de plats : Unsplash (licence Unsplash).
