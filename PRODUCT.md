# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React (choix de l'utilisateur). Site statique publié sur GitHub Pages (budget : 0 €), routage par hash, Supabase pour l'authentification et les données (projet `eccernutbnunvydpfybt`, vide au départ). Toute logique serveur (recherche web sur Marmiton, 750g…) passera par une Edge Function Supabase, l'offre gratuite suffisant.

## Users

Une personne, d'abord la créatrice elle-même, qui cuisine chez elle et veut manger ce qu'elle aime tout en respectant des allergies, un régime et des aliments interdits. Elle l'utilise sur téléphone (cuisine, supermarché) et sur ordinateur (planifier, chercher des recettes). Une ouverture au public est envisagée plus tard, sans date.

## Product Purpose

Proposer uniquement des recettes sûres pour le profil, triées selon les goûts appris, aider à découvrir des aliments proches de ce qu'on aime, suivre ses apports nutritionnels jour par jour et préparer la liste de courses. Réussite : on ne voit jamais une recette dangereuse, et on trouve vite quoi cuisiner qui plaît.

## Positioning

La sécurité passe avant tout : une recette est exclue si un ingrédient, même caché dans un ingrédient composé (pesto, bouillon), touche une allergie, un régime ou un interdit ; une recette impossible à vérifier est masquée par défaut et signalée en rouge si on l'affiche. Les goûts s'apprennent par swipe et se propagent (un plat aimé fait monter ses ingrédients et leur groupe).

## Operating Context

Usage quotidien et court : noter quelques aliments, choisir une recette, noter ce qu'on a mangé, cocher des articles en magasin. Données nutritionnelles issues de la table CIQUAL (ANSES). Besoins caloriques par Mifflin-St Jeor ; références par nutriment.

## Capabilities and Constraints

- Compte : inscription, connexion par mot de passe, déconnexion.
- Profil : 14 allergènes UE ; régimes végétarien, végétalien, sans viande, sans porc, sans alcool, sans gluten, sans lait ; interdits en texte libre ; âge, sexe, poids, taille, activité.
- Notation : note de 0 à 10 ou « je ne sais pas encore », au geste (glisser à droite ou à gauche, plus loin = note plus forte ; en haut ou en bas = je ne sais pas) ou par une rangée de boutons 0 à 10 ; 200 aliments de base puis tout le référentiel. Un aliment dont le goût change selon la préparation se note par forme (gruyère nature ou fondu, tomate crue, cuite ou en sauce…), ou d'un coup pour toutes ses formes ; une note générale peut ensuite être affinée forme par forme.
- Mes goûts : cinq listes (J'aime 7 à 10, Mitigé 3 à 6, Je n'aime pas 0 à 2, Je ne sais pas encore, Pas encore noté), notation par recherche, fiche par aliment avec une note par forme et le détail du score.
- Recettes : compatibles et sans ingrédient noté 0 à 2 sous la forme où la recette l'utilise (le gruyère fondu d'une pizza n'est pas le gruyère en morceau), triées par goûts ; filtres texte, temps, type, origine, « que des aliments que j'aime » ; note du plat de 0 à 10.
- Recherche web avec contraintes du profil ajoutées à la requête ; signale les aliments inconnus ou non aimés.
- Découvrir : aliments ou formes pas encore notés, ou marqués « je ne sais pas encore », proches des goûts, puis recettes qui les utilisent sous cette forme.
- Journal : aliment en grammes ou recette en portions ; tableau du jour et moyenne 7 jours ; encadré « À surveiller » sous 70 % du besoin.
- Courses : ingrédients de recettes ajustés aux portions et fusionnés, articles manuels, rayons, liste « toujours acheter », vider les cochés.
- Non décidé : source exacte des 200 aliments de base, moteur de recherche web utilisé.

## Brand Commitments

Nom : Papille. Langue : français. Structure retenue : wireframe A « Tableau de bord » (barre latérale sur ordinateur, barre d'onglets en bas sur téléphone, cartes douces), inspirée des références Sprout et Cookly de la Taste Vault de l'utilisatrice.

## Evidence on Hand

Aucune donnée réelle pour l'instant : la maquette utilise un profil et des recettes fictifs. Photos de plats : Unsplash (licence Unsplash), par lien. Les aliments CIQUAL n'ont pas de photo. Ne pas inventer d'utilisateurs, de témoignages ni de chiffres d'usage.

## Product Principles

1. La sécurité alimentaire n'est jamais un réglage caché : ce qui est exclu, et pourquoi, reste lisible.
2. Une réponse en un geste : noter un goût (un glissé ou un toucher), ajouter au journal, cocher un article.
3. Le téléphone est l'outil principal ; l'ordinateur donne la vue d'ensemble.
4. Les goûts guident, ils n'enferment pas : Découvrir pousse vers l'inconnu proche.
5. Les goûts ne touchent jamais à la sécurité : une note, même 10, ne rend pas sûr un aliment interdit.

## Accessibility & Inclusion

Les informations de sécurité ne reposent jamais sur la couleur seule (icône + texte). Swipe toujours doublé par des boutons (0 à 10, « je ne sais pas encore ») et par le clavier ; chaque note est écrite en chiffres, pas seulement en couleur.
