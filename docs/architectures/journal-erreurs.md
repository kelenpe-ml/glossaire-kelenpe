# Journal des erreurs et rapport de problème

## Objectif

Comprendre après coup ce qui s'est mal passé sur un poste qu'on ne voit pas, grâce à des fichiers d'erreurs bornés et filtrés, et un rapport que l'utilisateur transmet lui-même, **sans jamais révéler ses données**.

## La carte

![Le processus principal, l'interface et les processus séparés journalisent au même point ; le caviardage masque le sensible ; les fichiers ont une taille bornée et tournent ; une erreur grave conseille de redémarrer ; le rapport, montré tel quel, est copié ou enregistré par l'utilisateur](/diagrams/archi-journal-erreurs.svg)

## Décisions

- **Un seul point d'entrée :** une fonction `journaliser(niveau, source, message, contexte)`, et tous les points d'entrée d'actions passent par la même enveloppe, qui journalise les erreurs d'office.
  - Un refus prévu (règle métier) devient un avertissement.
  - Toute autre erreur est notée avec sa pile d'appels.
- **Format :** une ligne JSON par entrée, facile à relire et à filtrer.
- **Taille bornée :** quelques fichiers de taille fixe qui tournent. Un poste qui se remplit de journaux finit par ne plus démarrer.
- **Rien de sensible, à la source et à l'écriture :**
  - on désigne les objets par leur identifiant technique, jamais par un nom ;
  - jamais de montant ni de secret ;
  - un filtre (caviardage) masque en plus, à l'écriture, ce qui ressemble à un code, une clé, un hachage ou un nombre.
- **Erreurs de l'interface remontées :** chaque écran a son écran de secours ; une erreur non rattrapée est envoyée au processus principal pour être journalisée.
- **Erreur grave du processus principal :**
  - elle est journalisée, puis un message conseille de redémarrer ;
  - le message insiste si ces erreurs se répètent ;
  - le redémarrage passe par la fermeture normale.
- **Rapport de problème :**
  - composé par le processus principal (versions, système, dernières erreurs) ;
  - montré tel quel à l'utilisateur, qui le copie ou l'enregistre lui-même ;
  - rien ne part tout seul.
- **Un seul endroit pour le contact du support,** dans le code.

## Pièges connus

- **Un nom, un téléphone ou un montant dans un message d'erreur :** relire automatiquement tous les journaux recueillis par les tests.
- **Boucle d'erreurs :** une même erreur répétée mille fois par seconde remplit les fichiers en quelques minutes. La rotation et la taille bornée protègent le disque.
- **Continuer après une erreur non rattrapée :** le processus est dans un état incertain. Conseiller le redémarrage plutôt que faire comme si de rien n'était.
- **Rapport modifié après affichage :** ce qui part doit être exactement ce que l'utilisateur a vu.
- **Point d'entrée qui échappe à l'enveloppe commune :** un test vérifie qu'aucun n'est déclaré ailleurs.

## Exemple : Boutik

État : **construit** (mis à jour le 28 septembre 2026).

- **Le code :** `src/main/diagnostic/` :
  - `journal.ts`, `fichiers.ts` : `logs/boutik.log` à `boutik.4.log`, 5 × 1 Mo ;
  - `caviardage.ts` ;
  - `erreurs-graves.ts` : insistance à partir de 3 en 10 minutes ;
  - `rapport.ts` : fonction pure.
- **L'interface :**
  - `lib/erreurs-interface.ts` et `SecoursEcran` ;
  - `AlerteErreurGrave.tsx` ;
  - le rapport, dans Réglages › Aide et diagnostic ;
  - le numéro du support : `NUMERO_SUPPORT` (`src/shared/diagnostic.ts`).
- **La règle :** tout canal IPC passe par `gerer` ou `gererProtege` (`tests/diagnostic.test.ts`).
- **Les vérifications :** `npm run test:e2e:journal`, puis `test:e2e:journaux-sensibles`, qui relit tous les journaux e2e (fait en dernier par le job E2E Windows) ; voir aussi `docs/journal-erreurs.md`.

## Termes liés

[Journal d'erreurs](/devops/#journal-d-erreurs-log) · [Niveau de journalisation](/devops/#niveau-de-journalisation-log-level) · [Rotation des journaux](/devops/#rotation-des-journaux-log-rotation) · [Caviardage des données sensibles](/backend/#caviardage-des-donnees-sensibles-redaction) · [Erreur non rattrapée](/backend/#erreur-non-rattrapee-uncaught-exception) · [Écran de secours en cas de plantage](/frontend/#ecran-de-secours-en-cas-de-plantage-error-boundary) · [Redémarrage contrôlé](/backend/#redemarrage-controle-controlled-restart)
