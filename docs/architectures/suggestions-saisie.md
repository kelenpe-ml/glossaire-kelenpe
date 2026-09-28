# Suggestions de saisie

## Objectif

Proposer, pendant la frappe, ce que l'utilisateur a déjà saisi ou ce qui existe déjà (noms de produits, catégories, villes), pour taper moins et écrire toujours de la même façon, **sans jamais mémoriser un secret**.

## La carte

![Le début tapé dans un champ est cherché, sans accents ni casse, dans les données existantes et dans les termes mémorisés, puis présenté en liste classée ; un terme n'est ajouté qu'après une commande réussie et un filtre qui exclut secrets et nombres ; ce sont des préférences du poste, hors journal](/diagrams/archi-suggestions-saisie.svg)

## Décisions

- **Deux sources :**
  - les **données existantes**, pour les champs qui désignent un objet (un client, un produit) ;
  - des **termes mémorisés**, pour le texte libre répété (catégories, unités, villes).
- **Qui mémorise ?** Le serveur (ou processus principal), après une commande réussie, jamais l'interface. Seule une valeur acceptée par les règles métier devient une suggestion, pas une faute de frappe abandonnée.
- **Exclusions :** jamais un champ secret, jamais un nombre (prix, quantité, téléphone). Une liste blanche de catégories de champs vaut mieux qu'une liste noire.
- **Recherche :**
  - insensible aux accents et à la casse ;
  - par début de mot, avec un index des mots pour rester rapide à dix mille termes et plus.
- **Classement :** par fréquence et récence d'usage.
- **Préférences du poste, pas des données métier :** hors du journal d'événements, jamais synchronisées, vraiment supprimables par le propriétaire.
- **Activation par poste,** désactivable.
- **Clavier :** Tab ou flèches pour choisir, Entrée pour valider, et une touche pour oublier une suggestion ; la liste s'ouvre vers le haut si elle sortirait de l'écran.

## Pièges connus

- **Mémoriser pendant la frappe :** les fautes et les brouillons deviennent des suggestions.
- **Secret saisi dans le mauvais champ** (un mot de passe tapé dans « nom ») : sans filtre côté serveur, il réapparaît dans une liste.
- **Lenteur :** au-delà de quelques milliers de termes, une recherche par balayage se sent à chaque touche. Il faut un index.
- **Liste qui masque le bouton suivant, ou vole la touche Entrée :** tester au clavier seul.
- **Synchroniser les suggestions :** les préférences d'un poste deviennent le bruit d'un autre.

## Exemple : Boutik

État : **construit** (mis à jour le 28 septembre 2026).

- **Le code :**
  - `src/main/saisie/` : tables `saisie_termes`, index `saisie_mots`, usages `saisie_usages` ;
  - `src/shared/saisie.ts` : `CATEGORIES_SAISIE`, `estTermeMemorisable` ;
  - le composant `ChampSuggestions`.
- **La mémorisation :** par `memoriserApresValidation`, dans `src/main/index.ts`.
- **L'activation par poste :** `suggestions.json`.
- **Les vérifications :**
  - `tests/saisie.test.ts` ;
  - `npm run test:e2e:suggestions` : 10 000 termes, clavier, contraste.

## Termes liés

[Autocomplétion](/frontend/#autocompletion-autocomplete) · [Validation côté serveur / côté client](/backend/#validation-cote-serveur-cote-client-server-side-client-side-validation) · [Journal d'événements et projections](./journal-evenements)
