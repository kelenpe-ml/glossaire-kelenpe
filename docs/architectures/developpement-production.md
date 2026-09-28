# Séparation développement / production

## Objectif

Un même code produit deux programmes :

- **en développement :** avec des outils de test, des pannes simulées et des données jetables ;
- **en production :** celui livré aux clients, où ces outils n'existent tout simplement pas.

Les deux ne partagent ni outils ni données.

## La carte

![Un seul code source passe par un indicateur fixé à la compilation : le build de développement garde outils de test et dossier de données à part, le build de production n'en contient aucun ; une vérification cherche les outils de dev dans l'exécutable livré](/diagrams/archi-developpement-production.svg)

## Décisions

- **Indicateur fixé à la compilation, plutôt qu'une variable lue au lancement.**
  - Avec une variable lue au lancement, le code de test reste dans le fichier livré : un utilisateur curieux peut l'activer.
  - Avec un indicateur remplacé à la compilation, l'outil qui assemble le programme (le bundler) supprime purement et simplement ce code.
- **Dossiers de données distincts :** par exemple `MonApp` et `MonApp-dev`. Un essai ne peut jamais toucher les vraies données d'un poste.
- **Outils de dev regroupés :** un seul fichier de canaux de dev, et côté interface un seul point d'ajout. On sait où regarder, et on vérifie facilement qu'ils disparaissent.
- **Pannes simulées par des variables d'environnement, lues seulement en dev :** échec de la n-ième opération, téléphone simulé, rythme accéléré. Elles rendent testables des cas rares, sans rien laisser dans le produit.
- **Délais réels dans le produit :** un délai réduit pour les tests (effacement du presse-papiers, par exemple) n'existe qu'en dev ; en production, on vérifie le vrai délai.
- **Vérification finale :** un test cherche les noms des outils de dev dans l'exécutable livré, et doit n'en trouver aucun.

## Pièges connus

- **Condition cachée :** une condition écrite indirectement (dans un bloc `try`, dans une fonction, dans une variable intermédiaire) empêche le bundler de prouver que le code est mort, et il le garde. Écrire l'indicateur en toutes lettres, au plus près du code à retirer.
- **Variable d'environnement héritée :** une variable posée par l'éditeur de code change le comportement du programme lancé, sans que rien ne le montre.
- **Test lancé sur les vraies données**, parce que le dossier n'a pas été remplacé : toujours partir d'un dossier jetable, et refuser de démarrer si une vraie base est trouvée.
- **Outil de dev présent dans le produit** parce qu'il était importé ailleurs : seul le test sur l'exécutable le révèle.

## Exemple : Boutik

État : **construit** (mis à jour le 28 septembre 2026).

- **L'indicateur :** `MODE_DEV = import.meta.env.DEV` (`src/main/mode.ts`), écrit en toutes lettres, hors d'un bloc `try`.
- **Les outils de dev :**
  - côté main, dans `src/main/canaux-dev.ts` et `src/main/ipc-dev.ts` ;
  - côté preload, dans `avecOutilsDev`.
- **Les données :** dans `~/.config/Boutik-dev/` (Linux) ou `%APPDATA%\Boutik-dev\` (Windows) en dev.
- **Les pannes simulées :** `BOUTIK_DETOURAGE_SIMULER`, `BOUTIK_TELEPHONE_SIMULE`, `BOUTIK_SAUVEGARDE_INTERVALLE_MS`.
- **Les scénarios e2e :** ils lancent l'application sur un `XDG_CONFIG_HOME` temporaire, ou sur une jonction jetable sous Windows.

## Termes liés

[Build de développement / de production](/devops/#build-de-developpement-de-production-development-production-build) · [app.isPackaged](/devops/#app-ispackaged) · [Rollup](/devops/#rollup) · [Variable d'environnement](/devops/#variable-d-environnement-environment-variable) · [Injection de panne](/devops/#injection-de-panne-fault-injection)
