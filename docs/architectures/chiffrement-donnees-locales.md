# Chiffrement des données locales

## Objectif

Rendre illisibles les données enregistrées sur l'ordinateur (« au repos ») pour qui vole la machine, copie le disque ou emporte le fichier de la base, sans rien demander de plus à l'utilisateur à chaque démarrage.

## La carte

![Une clé tirée au hasard chiffre chaque page de la base ; elle est rangée dans le coffre du système, que seule la session de l'utilisateur ouvre ; un disque volé ou un fichier copié reste illisible ; les secrets des comptes sont hachés, pas chiffrés](/diagrams/archi-chiffrement-donnees-locales.svg)

## Décisions

- **Chiffrer tout le fichier ou seulement certains champs ?**
  - Tout le fichier (chiffrement de la base page par page) : rien n'est oublié, index et fichiers temporaires compris, et le code métier n'a pas à y penser.
  - Chiffrer champ par champ laisse toujours passer quelque chose.
- **Où garder la clé ?** Trois options :
  1. **Coffre du système** (Windows DPAPI, trousseau Linux, trousseau macOS) : invisible pour l'utilisateur, lié à sa session.
  2. **Clé dérivée d'un mot de passe tapé à chaque démarrage :** plus fort contre un voleur qui a aussi la session, mais pénible, et oublier le mot de passe fait tout perdre.
  3. **Clé en clair à côté de la base :** ne protège presque rien.

  Pour un poste de travail partagé et sans service informatique, le coffre du système est le bon compromis.
- **Clé tirée au hasard** par un générateur cryptographique, pas dérivée d'une donnée connue (nom, date).
- **Coffre absent** (Linux sans trousseau) : prévoir un repli explicite et visible (clé lisible par ce seul utilisateur, et un bandeau qui propose de réparer), plutôt qu'un refus de démarrer.
- **Secrets des comptes :** hachés avec une fonction lente (argon2id), jamais chiffrés. Même la base ouverte ne permet pas de les relire.
- **Sauvegardes :**
  - la clé de la base ne voyage jamais avec une copie ;
  - la copie a son propre chiffrement et ses propres clés (voir [Sauvegarde chiffrée sans serveur](./sauvegarde-chiffree)).

## Pièges connus

- **Fichiers annexes en clair :** journal WAL, fichiers temporaires, exports. Vérifier qu'ils sont chiffrés eux aussi, par un test qui cherche un texte connu dans les octets.
- **Clé liée à la session :**
  - une restauration sur un autre ordinateur est impossible avec le seul fichier de la base ;
  - une réinstallation de Windows fait perdre la clé.

  Sans sauvegarde indépendante, c'est une perte totale.
- **Montée de version du moteur** (Electron, bibliothèque de chiffrement) : le format de stockage de la clé peut changer. Tester la réouverture d'une base créée par la version précédente.
- **Données en clair ailleurs :** journaux d'erreurs, rapports, presse-papiers peuvent contenir ce que la base protège.
- **Copier le fichier de la base seul** pendant que l'application tourne : la copie est incohérente (voir [Journal WAL](/backend/#journal-wal-write-ahead-logging)).

## Exemple : Boutik

État : **construit** (mis à jour le 28 septembre 2026). La chaîne complète :

1. Au premier lancement, Boutik tire une clé secrète de 256 bits au hasard (générateur cryptographique).
2. Cette clé est rangée dans le fichier `boutik.key`, lui-même chiffré par le coffre du système : DPAPI sous Windows, le trousseau (libsecret, gnome-keyring ou KWallet) sous Linux, via `safeStorage` d'Electron. Seule la session Windows ou Linux de l'utilisateur peut la relire.
3. La base `boutik.db` est chiffrée par SQLCipher 4 avec cette clé : la clé passe par PBKDF2-HMAC-SHA512 (256 000 tours), puis chaque page du fichier est chiffrée en AES-256 et accompagnée d'un HMAC-SHA512, qui détecte toute altération. Le fichier `boutik.db-wal` est chiffré lui aussi.
4. Les mots de passe, PIN et codes de secours ne sont pas chiffrés mais hachés avec argon2id : même avec la base ouverte, on ne peut pas les relire.
5. Si le coffre du système manque (Linux sans trousseau), la clé est écrite en clair dans `boutik.key` (lisible par ce seul utilisateur), et un bandeau propose de réparer le coffre (`src/main/linux-vault-repair.ts`).

Le code est dans `src/main/db-key.ts` et `src/main/base-connexion.ts`. Il est vérifié par :

- `tests/base-connexion.test.ts` : le fichier WAL est bien chiffré ;
- `npm run test:e2e:mesures` ;
- `npm run test:e2e:mise-a-jour` : une base créée sous Electron 37 est rouverte, avec sa clé, ses données, ses images, ses codes de secours et son PIN.

## Termes liés

[Chiffrement au repos](/backend/#chiffrement-au-repos-encryption-at-rest) · [SQLCipher](/backend/#sqlcipher) · [AES-256](/backend/#aes-256-advanced-encryption-standard) · [Clé de chiffrement](/backend/#cle-de-chiffrement-encryption-key) · [Dérivation de clé](/backend/#derivation-de-cle-key-derivation-pbkdf2) · [HMAC](/backend/#hmac-hash-based-message-authentication-code) · [DPAPI](/backend/#dpapi-data-protection-api) · [Trousseau de clés](/backend/#trousseau-de-cles-keyring-secret-service-libsecret-gnome-keyring-kwallet) · [safeStorage](/backend/#safestorage) · [argon2id](/backend/#argon2id) · [Journal WAL](/backend/#journal-wal-write-ahead-logging)
