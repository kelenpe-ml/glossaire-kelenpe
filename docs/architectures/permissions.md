# Rôles, modules et permissions vérifiés côté serveur

## Objectif

Décider **qui peut faire quoi**, et le vérifier là où l'utilisateur ne peut pas tricher : sur le serveur, ou dans le processus principal d'une application de bureau. L'interface, elle, ne fait que cacher ce qui ne sert à rien.

## La carte

![L'interface masque les boutons, par confort ; toute demande arrive à un point d'entrée protégé qui vérifie la session et le module, grâce à la session et à la table des accès, puis exécute la commande ou refuse](/diagrams/archi-permissions.svg)

## Décisions

- **Où vérifier :** au point d'entrée de chaque action, côté serveur ou processus principal.
  - Une interface peut être modifiée, rechargée, ou contournée par un appel direct.
  - Le filtrage de l'interface reste utile, mais seulement pour le confort.
- **Refus par défaut :**
  - une action qui n'est pas déclarée dans la table des accès est refusée ;
  - un test vérifie que chaque action exposée y figure.
- **Une table centrale action → module ou rôle,** plutôt que des vérifications éparpillées dans le code : on relit toutes les permissions en un coup d'œil.
- **Rôle plus modules :** un rôle (patron, employé) et, pour les employés, des modules cochés (ventes, stock…). Plus fin qu'un rôle seul, plus simple qu'une permission par action.
- **L'auteur vient de la session.** Aucune fonction exposée ne reçoit « qui fait l'action » en paramètre : sinon, n'importe qui pourrait signer au nom d'un autre.
- **Lectures sensibles protégées aussi :** ne pas protéger que les écritures. Un rapport de chiffre d'affaires ou une liste de clients est aussi sensible qu'une modification.
- **Refus prévus :** ils produisent une erreur simple, notée comme avertissement, avec un message court qui ne révèle rien de plus.

## Pièges connus

- **Nouvelle action oubliée dans la table :**
  - avec un refus par défaut, on le voit tout de suite ;
  - sans lui, c'est une faille silencieuse.
- **Paramètre « auteur » ou « rôle » envoyé par l'interface :** il suffit de le changer pour devenir patron.
- **Permissions gardées en cache par l'interface :** un employé dont on retire un module garde ses boutons jusqu'au rechargement. Le serveur, lui, doit refuser dès le retrait.
- **Messages de refus trop bavards :** « ce compte existe mais n'a pas le module stock » en dit plus qu'il ne faut.

## Exemple : Boutik

État : **construit** (mis à jour le 28 septembre 2026).

- **La table des accès :** chaque canal IPC d'écriture ou de lecture sensible passe par `gererProtege` (`src/main/ipc-protege.ts`), et reçoit son module ou `"patron"` dans `src/main/acces.ts`.
- **L'auteur :** il vient de la session (`src/main/session.ts`, `auteurDepuisSession()`).
- **Le filtrage de l'interface :** `src/renderer/src/acces.ts`, confort seulement.
- **Les vérifications :**
  - `tests/acces.test.ts` ;
  - le scénario `npm run test:e2e` : 56 vérifications, dont des appels directs refusés par le main.

## Termes liés

[RBAC](/backend/#rbac-role-based-access-control) · [Permissions et modules](/backend/#permissions-et-modules) · [Canal IPC](/backend/#canal-ipc-ipc-channel) · [Défense en profondeur](/backend/#defense-en-profondeur-defense-in-depth) · [Validation côté serveur / côté client](/backend/#validation-cote-serveur-cote-client-server-side-client-side-validation)
