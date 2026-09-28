# Vérification sous Windows sans PC Windows

## Objectif

Livrer un logiciel pour Windows quand on développe sous Linux, en faisant tenir le rôle de PC Windows par la CI :

- construire l'installateur ;
- l'installer ;
- tester l'interface réelle à chaque changement ;
- écrire noir sur blanc ce qu'aucune machine ne vérifie.

## La carte

![Le poste de dev Linux pousse sur une branche de vérification ; la CI démarre des machines Windows neuves, qui construisent, installent en silence, font tourner les tests de bout en bout et des jobs ciblés ; vert, on fusionne sur la branche principale ; rouge, on corrige à partir des journaux recueillis ; une liste écrite dit ce qu'aucune machine ne vérifie](/diagrams/archi-verification-windows.svg)

## Décisions

- **Déclencheurs :**
  - chaque push sur la branche principale ;
  - une branche neutre de vérification, pour tester sans rien publier.
- **Qui pousse ?** Le développeur, pas un assistant automatique : pousser est une action visible par d'autres.
- **Jobs ciblés,** pour ce que Linux ne peut pas simuler : impression par la file de Windows, presse-papiers et ses formats d'exclusion, bibliothèques natives.
- **Tests de bout en bout sur l'exécutable installé,** pas sur le code de développement :
  - installation silencieuse, puis les scénarios sur l'interface réelle ;
  - c'est ce que le client aura.
- **Données jetables :** rediriger le dossier de données vers un dossier temporaire (sous Windows, une jonction), et refuser de tourner hors CI si une vraie base existe.
- **Passage entre jobs :** l'installateur passe par le cache des Actions, pas par les artefacts, dont le quota bloque tout quand il est plein.
- **Journaux recueillis pour chaque scénario,** et relus automatiquement à la fin (aucune donnée sensible).
- **Liste écrite de ce qui n'est pas vérifié** (vrai matériel, vraie imprimante, écran de l'utilisateur) : on sait ce qu'il reste à tester à la main.
- **Un lot fusionné dès que sa CI est verte :** les branches ne s'empilent pas.

## Pièges connus

- **Quota de stockage des artefacts atteint :** toute la CI échoue sans qu'aucun test soit en faute ; libérer de la place ne compte qu'après 6 à 12 heures.
- **Fichier verrouillé** (EBUSY) pendant le ménage de fin de test : attendre, réessayer, ou fermer d'abord le processus.
- **Bibliothèques Visual C++ absentes** sur une machine neuve : ce qui marche sur le poste du développeur échoue chez le client.
- **Fins de ligne CRLF, chemins avec des barres obliques inverses, `%APPDATA%` :** autant de différences qui cassent des scripts écrits sous Linux.
- **Tests instables** à cause de délais trop serrés sur des machines partagées : mesurer, et attendre un état plutôt qu'une durée.

## Exemple : Boutik

État : **construit** (mis à jour le 28 septembre 2026).

- **Le workflow :** `.github/workflows/build-windows.yml` (« Build Windows »), lancé par un push sur `main` ou sur `ci/verification`. Il a quatre jobs : « Impression Windows (RAW) », « Presse-papiers Windows », « Windows NSIS » (typecheck, tests, installateur, installation silencieuse, détourage) et « E2E Windows (exécutable installé) ».
- **Les scripts :** `tests/ci/*.mjs`.
- **Les données :** une jonction remplace `%APPDATA%\Boutik`.
- **La liste :** tout ce qu'aucune machine ne vérifie est écrit dans `docs/verification-windows.md`.
- **Qui pousse :** Drissa pousse (`git push origin main:ci/verification`), puis fusionne par pull request.

## Termes liés

[CI/CD](/devops/#ci-cd-integration-continue-deploiement-continu) · [GitHub Actions](/devops/#github-actions) · [Runner](/devops/#runner) · [Branche de vérification](/devops/#branche-de-verification-verification-branch) · [Test e2e](/devops/#test-e2e-end-to-end-test-test-de-bout-en-bout) · [Installation silencieuse](/devops/#installation-silencieuse-silent-install) · [Jonction](/devops/#jonction-junction-directory-junction) · [Cache de GitHub Actions](/devops/#cache-de-github-actions-actions-cache) · [Quota de stockage des artefacts](/devops/#quota-de-stockage-des-artefacts-artifact-storage-quota) · [Test instable](/devops/#test-instable-flaky-test)
