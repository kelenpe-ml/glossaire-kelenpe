# Backoffice et gestion des clés de signature

## Objectif

Donner à l'éditeur un outil interne pour gérer clients, paiements, licences et mises à jour, et **garder les clés privées de signature là où une fuite ferait le moins de dégâts**, avec de quoi changer de clé sans réactiver chaque client.

## La carte

![L'éditeur, depuis un ordinateur ou un téléphone, utilise le backoffice, qui signe licences et codes avec la clé de licence du serveur et note chaque signature ; la clé des mises à jour, sur l'ordinateur de l'éditeur, signe les mises à jour que le backoffice publie ; l'application vérifie les deux ; clé de réserve et copies chiffrées des clés sont gardées hors ligne](/diagrams/archi-backoffice-cles.svg)

## Décisions

- **Même dépôt que l'application :**
  - le code qui fabrique une licence et celui qui la vérifie sont les mêmes fichiers ;
  - un test signe avec l'un et vérifie avec l'autre.
- **Deux clés, deux lieux :**
  - la clé de licence, sur le serveur, lisible par le seul backoffice ;
  - la clé des mises à jour, sur l'ordinateur de l'éditeur, jamais sur le serveur.

  Une fuite du serveur permet au pire de fabriquer des licences, pas de diffuser un faux programme.
- **Une clé de réserve pour chacune des deux,** dont la clé publique est embarquée dès la première version, et que l'on garde hors ligne, ailleurs que la clé en service.
- **Jamais une clé privée dans le code, dans Git ou dans les variables de la CI.**
- **Chaque signature journalisée :** qui, quand, pour quel client, quel contenu.
- **Copies des clés privées :**
  - chiffrées, hors ligne, dans deux lieux ;
  - protégées par une longue [phrase de passe](/backend/#phrase-de-passe-passphrase), elle-même gardée à deux endroits distincts des copies (un gestionnaire de mots de passe, et du papier).

  Aucune perte ni aucun vol isolé ne suffit.
- **Base séparée :** une base et un utilisateur à part, même sur un serveur partagé avec un autre projet.
- **Sauvegarde de la base :** copie chiffrée quotidienne hors du serveur, et essai de restauration régulier. Une sauvegarde jamais restaurée n'est qu'un espoir.
- **Paiement :**
  - d'abord constaté par l'éditeur, qui valide d'un clic, ce qui fabrique la licence ;
  - plus tard automatisé, sans changer ce que voit le client ;
  - le backoffice détecte les doublons de référence de paiement et tient le parrainage.
- **Identité du client pour les actions sensibles :** le numéro du propriétaire est enregistré à l'achat. Un déblocage de compte n'est accordé qu'après avoir rappelé ce numéro.
- **Transferts automatiques** dans la limite annuelle ; au-delà, décision de l'éditeur.
- **Découvertes** lancées depuis le backoffice, pour certains clients ou tous.
- **Utilisable depuis un téléphone.**

## Pièges connus

- **Clé « temporairement » dans un fichier du dépôt :** elle reste dans l'historique de Git pour toujours.
- **Un seul administrateur, sans copie des clés :** une panne de disque ou une perte d'ordinateur arrête toute émission.
- **Phrase de passe rangée avec les copies :** une seule perte suffit alors à tout exposer.
- **Base du backoffice sauvegardée mais jamais restaurée :** on découvre le jour J que la copie est inutilisable.
- **Signatures non journalisées :** impossible de savoir, après une fuite, quelles licences sont légitimes.
- **Formats qui divergent** entre backoffice et application, découverts chez le client.

## Exemple : Boutik

État : **conçu, pas construit** (mis à jour le 29 septembre 2026).

- **Le backoffice prévu :**
  - en TypeScript, dans le dépôt de Boutik, sur le serveur de Prodora ;
  - PostgreSQL, avec une base et un utilisateur séparés de ceux de Prodora ;
  - une copie chiffrée chaque jour hors du serveur, et une restauration essayée chaque mois.
- **Ses fonctions :**
  - boutiques, formules, numéro du patron ;
  - paiements Orange Money, Wave et espèces ;
  - parrainages ;
  - codes signés : activation, ajout de poste, transfert, déblocage, nouvel essai, correction d'horloge ;
  - essais ;
  - découvertes ;
  - publication des mises à jour.
- **La phrase de passe** des copies de clés est gardée dans un gestionnaire de mots de passe et sur papier chez Drissa.
- **Ordre de construction :** troisième étape.

Tout est décrit dans `docs/licence.md`.

## Termes liés

[Backoffice](/backend/#backoffice) · [Clé publique / clé privée](/backend/#cle-publique-cle-privee-public-private-key) · [Signature cryptographique](/backend/#signature-cryptographique-digital-signature) · [Clé de réserve](/backend/#cle-de-reserve-backup-key-rotation-de-cle) · [Phrase de passe](/backend/#phrase-de-passe-passphrase) · [Référence de paiement](/business/#reference-de-paiement-payment-reference) · [Parrainage bilatéral](/business/#parrainage-bilateral-two-sided-referral) · [Licence logicielle hors ligne](./licence-hors-ligne) · [Mises à jour d'une application hors ligne](./mises-a-jour-hors-ligne)
