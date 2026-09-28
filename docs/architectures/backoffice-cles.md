# Backoffice et gestion des clés de signature

## Objectif

Donner à l'éditeur un outil interne pour gérer clients, paiements, licences et mises à jour, et **garder les clés privées de signature là où une fuite ferait le moins de dégâts**, avec de quoi changer de clé sans réactiver chaque client.

## La carte

![L'éditeur, depuis un ordinateur ou un téléphone, utilise le backoffice, qui signe licences et codes avec la clé de licence du serveur et note chaque signature ; la clé des mises à jour, sur l'ordinateur de l'éditeur, signe les mises à jour que le backoffice publie ; l'application vérifie les deux ; clé de réserve et copies chiffrées des clés sont gardées hors ligne](/diagrams/archi-backoffice-cles.svg)

## Décisions

- **Même dépôt que l'application :**
  - le code qui fabrique une licence et celui qui la vérifie sont les mêmes fichiers ;
  - un test signe avec l'un et vérifie avec l'autre : un format qui divergerait est vu avant de bloquer un client.
- **Deux clés, deux lieux :**
  - la **clé de licence** sur le serveur, lisible par le seul backoffice ;
  - la **clé des mises à jour** sur l'ordinateur de l'éditeur, jamais sur le serveur.

  Une fuite du serveur permet au pire de fabriquer des licences, pas de diffuser un faux programme.
- **Jamais une clé privée dans le code, dans Git ou dans les variables de la CI.**
- **Chaque signature journalisée :** qui, quand, pour quelle boutique, quel contenu. En cas de doute, on sait ce qui a été émis.
- **Clé de réserve :**
  - l'application embarque dès la première version la clé publique d'une seconde clé de licence, gardée hors ligne ;
  - en cas de fuite, une mise à jour retire l'ancienne, et la réserve prend le relais.
- **Copies des clés privées :** chiffrées, hors ligne, dans deux lieux différents.
- **Paiement :**
  - d'abord constaté par l'éditeur, qui valide d'un clic (ce qui fabrique la licence) ;
  - plus tard, automatisé par un service de paiement, sans changer ce que voit le client.
- **Utilisable depuis un téléphone :** l'éditeur répond souvent en déplacement.

## Pièges connus

- **Clé « temporairement » dans un fichier du dépôt :** elle reste dans l'historique de Git pour toujours.
- **Un seul administrateur, sans copie des clés :** une panne de disque ou une perte d'ordinateur arrête toute émission.
- **Base du backoffice sans sauvegarde :** on perd la liste des clients et des licences émises.
- **Signatures non journalisées :** impossible de savoir, après une fuite, quelles licences sont légitimes.
- **Formats qui divergent** entre le backoffice et l'application, découverts chez le client.

## Exemple : Boutik

État : **conçu, pas construit** (mis à jour le 28 septembre 2026).

- **Le backoffice prévu :**
  - en TypeScript, dans le dépôt de Boutik ;
  - sur le serveur de Prodora, avec une base PostgreSQL séparée si Prodora en utilise une (sinon, à discuter).
- **Ses fonctions :**
  - boutiques et formules ;
  - paiements (Orange Money, Moov Money, espèces) ;
  - codes : activation, ajout de poste, transfert, déblocage du mot de passe ;
  - essais et leur durée ;
  - fonctionnalités à la carte et « découvertes » ;
  - publication des mises à jour.

Tout est décrit dans `docs/licence.md` (sections « Backoffice » et « Clés »).

## Termes liés

[Backoffice](/backend/#backoffice) · [Clé publique / clé privée](/backend/#cle-publique-cle-privee-public-private-key) · [Signature cryptographique](/backend/#signature-cryptographique-digital-signature) · [Clé de réserve](/backend/#cle-de-reserve-backup-key-rotation-de-cle) · [Référence de paiement](/business/#reference-de-paiement-payment-reference) · [Licence logicielle hors ligne](./licence-hors-ligne) · [Mises à jour d'une application hors ligne](./mises-a-jour-hors-ligne)
