---
name: Papille
description: Recettes sûres pour votre profil, triées selon vos goûts.
colors:
  ground: "#f2f4ee"
  ground-2: "#e8ece3"
  surface: "#ffffff"
  sage: "#e3ebdf"
  sage-2: "#d3dfcd"
  ink: "#18261e"
  ink-2: "#48554c"
  muted: "#6c776f"
  line: "#e0e4da"
  line-2: "#cfd5c8"
  brand: "#1f4d38"
  brand-deep: "#173d2c"
  brand-ink: "#f4f8f2"
  brand-soft: "#e1ebe2"
  ok: "#2b7347"
  ok-soft: "#e0f0e4"
  warn: "#a8670f"
  warn-bar: "#d1912c"
  warn-soft: "#fbefd9"
  bad: "#b8382a"
  bad-soft: "#fbe7e3"
typography:
  display:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 680
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 620
    lineHeight: 1.3
  figure:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 720
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "tnum"
rounded:
  badge: "8px"
  control: "12px"
  card: "18px"
  hero: "22px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  page-x: "44px"
  page-x-mobile: "16px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.pill}"
    height: "42px"
    padding: "0 18px"
  button-primary-hover:
    backgroundColor: "{colors.brand-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "42px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 14px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
  nav-item-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-ink}"
    rounded: "{rounded.control}"
  badge-safety-bad:
    backgroundColor: "{colors.bad-soft}"
    textColor: "{colors.bad}"
    rounded: "{rounded.badge}"
---

# Papille

## Overview

Une cuisine bien rangée : chaque écran tient une tâche du quotidien (choisir une recette, noter un goût, suivre ses apports, cocher ses courses). Fond sauge très pâle, cartes blanches arrondies, un vert forêt plein pour la navigation active et l'action principale. Les photos de plats portent l'appétit ; tout le reste reste calme pour que la sécurité alimentaire se lise d'un coup d'œil. Mode Operate : composants web standards, pas de décor.

Coquille : barre latérale de 248 px sur ordinateur (logo, 5 sections, encart « À surveiller », profil), barre d'onglets fixe en bas sur téléphone (moins de 900 px). Thème clair uniquement : usage de jour, en cuisine ou en magasin.

## Colors

- **Fond** `ground` sauge pâle ; `ground-2` pour les zones en retrait (segments, pistes de jauge, survols).
- **Surfaces** blanches pour les cartes, les champs et les puces.
- **Marque** `brand` vert forêt : navigation active, bouton principal, interrupteurs, cases cochées, besoin calorique. `brand-soft` pour les en-têtes de colonnes (Ingrédients, Par portion) et les badges de marque. `sage` pour les encarts d'aide (À surveiller dans la barre latérale, note de sécurité du profil, progression des courses).
- **États**, jamais décoratifs : `ok` vert (vérifié, aimé, apport ≥ 90 %), `warn` ambre (70 à 89 %, « pas sûr »), `bad` rouge (allergie, impossible à vérifier, apport < 70 %, « je n'aime pas »).
- **Familles d'aliments** : dix teintes pâles avec une encre assortie (`--g-legume`, `--g-racine`, `--g-fruit`, `--g-feculent`, `--g-legumineuse`, `--g-viande`, `--g-poisson`, `--g-laitier`, `--g-epice`, `--g-champignon`) pour les vignettes d'aliments CIQUAL, qui n'ont pas de photo.

## Typography

Une seule famille, Figtree Variable, auto-hébergée via @fontsource. Titres de page à 34 px (28 px sur téléphone), graisse 700, interlettrage −0,03em. Titres de carte à 19 px / 680. Corps à 15 px. Les chiffres (kcal, grammes, pourcentages, quantités) passent en chiffres tabulaires (`.num`). Les grands chiffres (besoin calorique, kcal du jour) à 40 px / 720. Pas de surtitre au-dessus des titres.

## Layout

Contenu limité à 1 320 px, marges 44 px sur ordinateur, 16 px sur téléphone, 24 px entre blocs (18 px sur téléphone). Grilles : recettes en `auto-fill minmax(260px, 1fr)` (une colonne en liste horizontale sur téléphone) ; Mes goûts en 4 colonnes (2 sous 1 200 px, onglets sur téléphone) ; journal et courses en contenu + colonne latérale collante de 340 à 400 px, empilées sous 1 100 px. Points de rupture : 900 px (coquille), 1 100 px et 1 200 px (colonnes).

## Elevation & Depth

Presque plat. Cartes : bordure `line` + ombre très douce (`0 1px 2px`). Au survol d'une carte recette ou d'un bouton rond : ombre de profondeur 2 (`0 10px 28px -14px`). Ombre 3 réservée à ce qui flotte : carte de swipe en cours de glissement, menus de recherche, toast.

## Shapes

Rayons : 8 px badges, 12 px champs et liens de navigation, 18 px cartes, 22 px grandes images et encart « À surveiller », pilule pour boutons, puces, segments et pas-à-pas. Vignettes d'aliments carrées arrondies (12 px), rondes dans les pastilles.

## Components

- **Boutons** pilule 42 px : principal vert plein, secondaire blanc bordé, doux (`ground-2`), fantôme. Les boutons d'avis (J'aime / J'aime pas) prennent la couleur d'état quand ils sont actifs.
- **Puces** pilule 36 px ; sélectionnées en encre pleine. Puces supprimables avec une croix.
- **Segments** sur fond `ground-2`, l'onglet actif en blanc avec ombre légère.
- **Carte recette** : photo 16/10, badge de type posé sur la photo, origine, nom, temps et kcal, pied « Pour vous » avec jauge et pourcentage. Non vérifiable : bordure rouge 1,5 px et bandeau rouge avec la raison.
- **Alertes** pleine largeur avec icône : verte « Vérifiée pour votre profil » (ce qui a été vérifié et contre quoi), rouge bordée « Exclue » ou « Impossible à vérifier ».
- **Jauges** de nutriment 6 à 8 px, couleur selon le seuil, toujours accompagnées d'une pastille et du chiffre (jamais la couleur seule).
- **Carte de swipe** : s'incline en suivant le doigt, se teinte et affiche un tampon (J'aime vert, Je n'aime pas rouge, Je ne sais pas ambre) ; trois boutons ronds en dessous, le cœur le plus grand.
- **Icônes** Lucide, trait 1,75 à 1,8.

## Do's and Don'ts

- Faire : écrire la raison d'une exclusion ou d'un doute, en texte, à côté de la couleur.
- Faire : garder rouge, ambre et vert pour les états uniquement.
- Faire : photos réelles pour les plats, vignettes teintées pour les aliments.
- Ne pas faire : surtitres au-dessus des titres, numéros de section décoratifs, émoji à la place d'icônes.
- Ne pas faire : masquer une recette non vérifiable sans le dire ; elle est comptée et peut être affichée.
- Ne pas faire : thème sombre ou dégradés décoratifs sans nouvelle décision de design.
