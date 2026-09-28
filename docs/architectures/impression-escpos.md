# Impression de tickets ESC/POS

## Objectif

Imprimer un ticket de caisse sur une imprimante thermique, et ouvrir le tiroir-caisse, **sans jamais mettre la vente en danger**. Une imprimante absente ou sans papier ne doit jamais faire perdre une vente.

## La carte

![La vente est enregistrée d'abord ; la mise en page produit les octets du ticket par une fonction pure ; l'envoi part vers une imprimante réseau ou USB, qui ouvre aussi le tiroir-caisse, et rend toujours un statut affiché à l'écran ; les tests comparent les octets à des fichiers de référence](/diagrams/archi-impression-escpos.svg)

## Décisions

- **Enregistrer, puis imprimer.** La vente est écrite avant que le ticket ne parte ; l'impression ne peut donc jamais l'annuler.
- **Octets construits par le programme** (commandes ESC/POS), plutôt qu'une page HTML confiée au pilote :
  - le résultat est le même sur toutes les imprimantes compatibles, et rapide ;
  - une fonction pure donne toujours les mêmes octets pour la même vente, ce qui les rend testables.
- **Encodage :** les accents passent par une page de codes de l'imprimante (souvent CP850 ou CP858). Il faut convertir le texte, sinon les « é » deviennent des symboles.
- **Largeur :** 58 ou 80 mm, soit 32 ou 48 caractères par ligne : un réglage du poste, pas du code.
- **Envoi :**
  - imprimante réseau : les octets bruts sur le port 9100 ;
  - Windows : la file d'impression en mode RAW, pour que le pilote ne transforme rien ;
  - Linux : CUPS.
- **Un statut, jamais une exception :** « imprimé », « imprimante injoignable », « sans réponse ». L'écran affiche la raison et propose de réimprimer.
- **L'impression n'écrit rien au journal d'événements :** réimprimer n'est pas un fait métier.
- **Tiroir-caisse :** une impulsion envoyée à l'imprimante, qui l'ouvre.
- **En-tête du ticket :** tiré des données de la boutique (nom, adresse), pas écrit dans le code.

## Pièges connus

- **Pilote Windows qui convertit le ticket en image :** le texte sort flou, ou pas du tout. Il faut le mode RAW.
- **Imprimante débranchée :** sans délai maximal, l'envoi attend indéfiniment et bloque la caisse.
- **Accents mal convertis :** ils ne se voient que sur une vraie imprimante, ou dans un émulateur.
- **Tests sans imprimante :**
  - comparer les octets à des fichiers de référence ;
  - utiliser un émulateur qui affiche le ticket ;
  - en CI, une file d'impression virtuelle.
- **Dépendance d'émulation dans le produit :** elle n'a rien à faire dans le paquet livré.

## Exemple : Boutik

État : **construit** (mis à jour le 28 septembre 2026).

- **Le code :** `src/main/impression/` :
  - `ticket.ts` : octets ESC/POS, fonction pure, testée contre `tests/references/*.bin` ;
  - `cp850.ts` : encodage des accents ;
  - `envoi-reseau.ts` et `envoi-windows.ps1` : l'envoi ;
  - `vente.ts` : rend un statut, jamais une exception.
- **L'en-tête :** projection `boutique`.
- **L'émulateur en dev :** `gilbertfl/escpos-netprinter` (Docker), jamais dans le paquet.
- **Les vérifications :**
  - `npm run test:e2e:imprimante` et `test:e2e:caisse` ;
  - le job CI « Impression Windows (RAW) », qui compare octet pour octet ;
  - `docs/impression-windows.md`.

## Termes liés

[ESC/POS](/media/#esc-pos) · [Imprimante thermique](/media/#imprimante-thermique-thermal-printer) · [Mode RAW](/devops/#mode-raw) · [File d'impression](/devops/#file-d-impression-print-spooler) · [CUPS](/devops/#cups-common-unix-printing-system) · [Pilote](/devops/#pilote-driver) · [Fichier de référence](/devops/#fichier-de-reference-golden-file) · [Émulateur](/devops/#emulateur-emulator)
