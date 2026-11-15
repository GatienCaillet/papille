# Papille

Manger ce qu’on aime, sans jamais risquer ce qu’on ne peut pas manger.

Application web (téléphone et ordinateur) hébergée sur GitHub Pages, avec Supabase pour les comptes et les données.

## Étape en cours : wireframes

Trois propositions de structure, chacune montrant tous les écrans en version téléphone et ordinateur :

- **A · Tableau de bord** : `wireframes/a.html`
- **B · Vitrine gourmande** : `wireframes/b.html`
- **C · Carnet éditorial** : `wireframes/c.html`

Ouvrir `index.html` pour les comparer. Un seul écran : `wireframes/a.html?ecran=journal`.

En local :

```bash
npx --yes http-server@14.1.1 . -p 4322 -c-1
```

## Fonctionnalités prévues

- Compte : inscription, connexion par mot de passe, déconnexion (Supabase Auth).
- Profil : 14 allergènes UE, régimes, aliments interdits, besoins caloriques (Mifflin-St Jeor) et références par nutriment.
- Sécurité : exclusion des recettes dont un ingrédient, même caché (pesto, bouillon), touche le profil ; recettes non vérifiables masquées par défaut, avertissement rouge sinon.
- Swipe des goûts : 200 aliments de base puis tout CIQUAL.
- Mes goûts : 4 listes, score par aliment propagé aux ingrédients et au groupe.
- Recettes, recherche web, découvertes, journal des apports, liste de courses.
