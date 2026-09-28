# Sauvegarde chiffrée sans serveur

## Objectif

Mettre les données à l'abri d'une panne, d'un vol ou d'un incendie :

- par des copies chiffrées, déposées ailleurs que sur l'ordinateur (téléphone, stockage en ligne) ;
- restaurables sur un poste neuf avec le mot de passe ou un code de secours ;
- sans serveur de l'éditeur, qui ne voit jamais rien.

## La carte

![La base est copiée à part en un instantané cohérent, chiffrée par une clé de sauvegarde que des enveloppes (mot de passe, codes) ouvrent, puis déposée sur le téléphone, un stockage en ligne ou l'application mobile ; la restauration vérifie tout, construit une base neuve à part, puis bascule](/diagrams/archi-sauvegarde-chiffree.svg)

## Décisions

- **Que copier ?** La source de vérité (le journal d'événements, les octets à part, les préférences utiles), pas les tables qu'on sait reconstruire. Une copie plus petite, qu'on vérifie en reconstruisant.
- **Copie cohérente :**
  - lire dans une transaction, qui donne un instantané de la base ;
  - ou passer par l'API de sauvegarde de la base ;
  - jamais une copie du fichier pendant que l'application écrit.
- **Hors du processus principal :** chiffrer et compresser prennent du temps ; les faire dans un processus séparé, pour que l'interface ne gèle pas.
- **Clé de sauvegarde et enveloppes :**
  - une clé de sauvegarde aléatoire chiffre les copies ;
  - elle est enfermée dans des enveloppes, chacune ouverte par un secret (le mot de passe, chaque code de secours), avec une dérivation lente (argon2id) ;
  - on prépare les enveloppes au moment où le secret est en clair (création, changement). Les copies automatiques n'ont alors besoin d'aucun secret.
- **Chiffrement authentifié** (AES-256-GCM) : une copie abîmée ou modifiée est refusée, pas restaurée à moitié.
- **Copies incrémentales :** découper en objets repérés par l'empreinte de leur contenu ; une copie ne réécrit que ce qui a changé.
- **Destinations :** choisir ce que les utilisateurs ont déjà.
  - Un téléphone par câble : sans internet, sans compte.
  - Un stockage en ligne : hors du bâtiment.
  - Une application compagnon.

  Plusieurs destinations valent mieux qu'une seule parfaite.
- **Rotation et rythme :**
  - garder un nombre fixe de copies ;
  - une copie automatique par jour au plus, jamais pendant une opération en cours ;
  - un rappel visible si aucune copie n'existe.
- **Restauration :**
  - tout vérifier avant d'écrire ;
  - construire une base neuve à part, puis basculer, avec un marqueur qui permet de reprendre après une coupure ;
  - ne jamais effacer la base remplacée ; la mettre de côté.

## Pièges connus

- **Copier la base seule** alors qu'elle est en journal WAL : les dernières écritures sont dans un autre fichier. Il faut les fichiers ensemble, application fermée, ou l'API de sauvegarde.
- **Fichier verrouillé sous Windows :** un fichier ouvert ne se renomme ni ne s'efface. Fermer, attendre, réessayer, et prévoir la reprise.
- **Calcul lent dans le processus principal** (argon2id, chiffrement de gros fichiers) : l'interface ne répond plus, et le système propose de tuer l'application.
- **Coupure au milieu d'une restauration :** sans marqueur de reprise, on démarre sur une base à moitié écrite.
- **Téléphone en « recharge seule »** : le poste ne le voit pas, et seul le propriétaire peut changer ce réglage, sur le téléphone. Il faut l'expliquer par une image.
- **Commandes qui échouent si le dossier existe déjà** (sur certains protocoles comme MTP) : tester sur un vrai appareil.
- **Rotation trop gourmande :** elle ne doit supprimer que ses propres copies, reconnues par leur nom, jamais les autres fichiers du dossier.
- **Secret demandé pour une copie automatique :** personne n'est là pour le taper. D'où les enveloppes préparées à l'avance.

## Exemple : Boutik

État (mis à jour le 28 septembre 2026) :

- **Téléphone par câble : construit.** Il est vérifié sur un vrai Samsung Galaxy S9.
- **Stockage en ligne (Google Drive) et application mobile : prévus.** Le manifeste de chaque copie porte déjà des `annexes`, pour une vue prête à afficher sur le téléphone.

Mise en œuvre :

- **Le code :** `src/main/sauvegarde/` :
  - `processus-copie.ts` : `utilityProcess`, un par copie, sur une connexion en lecture seule, dans une transaction ;
  - `format.ts`, `contenu.ts` ;
  - `coffre.ts` : enveloppes argon2id, dans `sauvegarde.key` ;
  - `bascule.ts` : marqueur `restauration-en-cours.json` ;
  - `destinations.ts`, `telephone.ts`, `telephone-windows.ps1` : Shell de Windows par PowerShell, `gio` sous Linux.
- **Le rythme :** 10 copies gardées ; une copie automatique par jour, jamais pendant un ticket en cours.
- **La documentation :** `docs/sauvegarde.md`, et `docs/etude-destinations-sauvegarde.md` pour le choix des destinations.
- **Les vérifications :**
  - `npm run test:e2e:sauvegarde`, `test:e2e:sauvegarde-telephone`, `test:e2e:sauvegarde-fluidite`, `test:e2e:restauration-interrompue` ;
  - sur le vrai téléphone, `npm run test:telephone-reel`.

## Termes liés

[Sauvegarde de la base](/backend/#sauvegarde-de-la-base-database-backup) · [Sauvegarde incrémentale](/backend/#sauvegarde-incrementale-incremental-backup) · [Chiffrement authentifié](/backend/#chiffrement-authentifie-authenticated-encryption-aes-gcm) · [Enveloppe de clé](/backend/#enveloppe-de-cle-key-wrapping) · [argon2id](/backend/#argon2id) · [Instantané](/backend/#instantane-snapshot) · [Journal WAL](/backend/#journal-wal-write-ahead-logging) · [utilityProcess](/backend/#utilityprocess) · [Rotation des copies](/devops/#rotation-des-copies-backup-rotation) · [MTP](/backend/#mtp-media-transfer-protocol) · [Mode recharge seule / transfert de fichiers](/devops/#mode-recharge-seule-transfert-de-fichiers-usb-charging-only-file-transfer) · [Verrouillage de fichier sous Windows](/devops/#verrouillage-de-fichier-sous-windows-file-locking)
