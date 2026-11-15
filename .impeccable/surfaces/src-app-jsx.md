---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: []
---

# Papille · app (maquette React)

Scope : toute l'application (10 écrans), mode Operate. Code-led.
Audience et tâche : une personne qui choisit quoi cuisiner, note ses goûts, suit ses apports, fait ses courses ; téléphone d'abord.
Scène physique : en plein jour, cuisine ou supermarché, téléphone tenu d'une main ; le soir sur ordinateur pour planifier. Donc fond clair.

## Direction contract

THESIS: Une cuisine bien rangée : chaque jour tient dans un écran, la sécurité est écrite noir sur blanc. Refuse le site de recettes à grille infinie et le tableau de bord gris à un seul accent.

OWN-WORLD: Fond sauge très pâle, cartes blanches arrondies (18 px), vert forêt plein pour la navigation active et l'action principale, vert sauge pour les zones d'aide. Rouge, ambre, vert réservés aux états (sécurité, apports). Figtree, chiffres tabulaires. Icônes Lucide trait 1,75. Photos réelles pour les plats ; vignettes teintées par groupe pour les aliments CIQUAL.

STORY: L'utilisateur voit tout de suite ce qu'il peut manger sans risque, ce qui lui plaît le plus, et ce qui lui manque cette semaine. Il agit en un geste.

FIRST VIEWPORT: Ordinateur : barre latérale 248 px (logo, 5 sections, encart À surveiller, profil), contenu : titre de page, outils, grille de cartes. Téléphone : titre, contenu, barre d'onglets fixe en bas, 5 entrées. Action principale en haut à droite (ordi) ou bouton plein sous le titre (téléphone).

FORM: Structure du wireframe A, retenue par l'utilisatrice. seed: none (pinned) — « On part sur la A, fais la maquette HTML », Vite + React. Geste signature : la carte de swipe qui s'incline et se teinte selon la réponse (vert, rouge, ambre) en suivant le doigt.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
