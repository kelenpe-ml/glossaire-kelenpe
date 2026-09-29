# Codes de secours et récupération d'un compte hors ligne

## Objectif

Permettre au propriétaire d'un compte de retrouver l'accès après un oubli de mot de passe, **sans internet ni serveur**, grâce à quelques codes remis une seule fois, sans ouvrir une porte dérobée à un voleur.

## La carte

![Création : une série de codes tirée au hasard est montrée une seule fois, à noter sur papier, et gardée hachée. Récupération : le code saisi passe une attente croissante, est comparé aux empreintes et rend l'accès en étant consommé ; si tous les codes sont perdus, recours hors ligne par un code signé de l'éditeur](/diagrams/archi-codes-de-secours.svg)

## Décisions

- **Qui peut récupérer ?** Le compte principal (propriétaire, patron). Les comptes secondaires (employés) sont réinitialisés par lui : un seul chemin de récupération à protéger.
- **Format des codes :**
  - assez longs pour ne pas se deviner (environ 80 bits) ;
  - dans un alphabet sans caractères ambigus (ni 0/O, ni 1/I/L), groupés par 4 pour se recopier sans erreur ;
  - 5 à 10 codes par série.
- **Usage unique :** un code accepté est marqué utilisé, dans la même transaction que le changement de mot de passe.
- **Stockage :** les codes sont hachés comme des mots de passe ; les codes en clair ne sont montrés qu'une fois, jamais écrits ni journalisés.
- **Attente croissante après les échecs**, plutôt qu'un blocage définitif. Un blocage définitif permettrait à n'importe qui de verrouiller le propriétaire hors de chez lui.
- **Renouvellement :** une nouvelle série remplace l'ancienne entièrement, sous le mot de passe actuel.
- **Copie par le presse-papiers :** marquée sensible (exclue des historiques et du nuage), puis effacée après un court délai.
- **Recours ultime** quand tous les codes sont perdus : un code signé de l'éditeur. Il n'est jamais accordé sur simple demande (ne jamais faire confiance à l'utilisateur).
  - L'éditeur rappelle le numéro enregistré à l'achat.
  - Le code est valable peu de temps, une seule fois, sur ce poste.
  - Le déblocage est inscrit au journal et signalé au propriétaire à sa connexion suivante, et les codes de secours sont renouvelés.
  - Le code ne donne à l'éditeur aucun accès aux données ni aux sauvegardes.

## Pièges connus

- **Code consommé trop tôt :** si le code est marqué utilisé avant que le nouveau mot de passe ne soit accepté, un mot de passe refusé fait perdre le code. Vérifier le nouveau mot de passe d'abord.
- **Deux essais simultanés avec le même code :** revérifier dans la transaction que le code est toujours inutilisé.
- **Presse-papiers :** l'historique de Windows (Win+V), la synchronisation dans le nuage ou un gestionnaire de presse-papiers Linux gardent une copie. Il faut les formats d'exclusion, et l'effacement.
- **Codes dans les journaux d'erreurs ou les rapports :** filtrer à l'écriture, et relire les journaux recueillis par les tests.
- **Codes jamais notés :** proposer de les copier ou de les imprimer au bon moment (juste après la création du compte), et rappeler combien il en reste.

## Exemple : Boutik

État : **construit** (mis à jour le 29 septembre 2026). Le recours auprès de Drissa est **conçu** (`docs/licence.md`) : rappel du numéro du patron enregistré à l'achat, code valable 24 h, une seule fois, sur cet ordinateur.

- **Les codes :** 5 codes de 16 caractères en 4 groupes, sur un alphabet de 31 symboles (environ 79 bits), dans `src/main/comptes/codes-secours.ts`.
- **L'attente :** aucune pendant 3 échecs, puis 30 s qui doublent à chaque échec (`src/main/comptes/limiteur-secours.ts`).
- **La récupération :** `recupererAvecCode` (`src/main/comptes/secours.ts`) vérifie le nouveau mot de passe, puis, dans une transaction, s'assure que le code n'a pas déjà servi, le marque utilisé et change le secret.
- **Le presse-papiers :** `src/main/presse-papiers.ts` (formats d'exclusion sous Windows, `wl-copy --sensitive` sous Wayland, effacement après 2 minutes).
- **Les codes et la sauvegarde :** ils ouvrent aussi les copies de sauvegarde, par une enveloppe de clé.
- **Les vérifications :** `npm run test:e2e:secours`, et le job CI « Presse-papiers Windows ».

## Termes liés

[argon2id](/backend/#argon2id) · [Hachage](/backend/#hachage-hash-empreinte) · [Enveloppe de clé](/backend/#enveloppe-de-cle-key-wrapping) · [Presse-papiers](/frontend/#presse-papiers-clipboard) · [Signature cryptographique](/backend/#signature-cryptographique-digital-signature) · [Licence logicielle hors ligne](./licence-hors-ligne)
