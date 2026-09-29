# Architectures

Une page par **système** : pas un mot isolé, mais un ensemble de pièces qui travaillent ensemble (un journal d'événements, une sauvegarde, une licence…). Chaque page est écrite pour **n'importe quel logiciel**, puis montre comment Boutik le met en œuvre.

Chaque page suit le même plan :

1. **Objectif** : à quoi sert le système, en une ou deux phrases.
2. **La carte** : les pièces et leurs liens, sans détail technique.
3. **Décisions** : les choix à faire, les options, et pourquoi.
4. **Pièges connus** : ce qui a déjà coûté cher.
5. **Exemple : Boutik** : la mise en œuvre, son état et la date de mise à jour.
6. **Termes liés** : les entrées du glossaire à relire.

Les principes de quatre de ces systèmes sont aussi repris dans des skills personnels de Claude Code, pour les réutiliser dans d'autres logiciels : `journal-evenements-hors-ligne`, `licence-logicielle-hors-ligne`, `sauvegarde-chiffree-sans-serveur`, `synchronisation-multi-poste` (dossier `~/.claude/skills/`).

## Les systèmes

| Système | État dans Boutik |
|---|---|
| [Journal d'événements et projections](./journal-evenements) | Construit |
| [Rôles, modules et permissions vérifiés côté serveur](./permissions) | Construit |
| [Séparation développement / production](./developpement-production) | Construit |
| [Chiffrement des données locales](./chiffrement-donnees-locales) | Construit |
| [Codes de secours et récupération d'un compte hors ligne](./codes-de-secours) | Construit (recours auprès de l'éditeur : conçu) |
| [Sauvegarde chiffrée sans serveur](./sauvegarde-chiffree) | Câble construit ; Google Drive et application mobile prévus |
| [Impression de tickets ESC/POS](./impression-escpos) | Construit |
| [Suppression de fond d'image hors ligne](./suppression-fond-image) | Construit |
| [Suggestions de saisie](./suggestions-saisie) | Construit |
| [Journal des erreurs et rapport de problème](./journal-erreurs) | Construit |
| [Vérification sous Windows sans PC Windows](./verification-windows) | Construit |
| [Licence logicielle hors ligne](./licence-hors-ligne) | Cœur construit (clés de test) ; activation et serveur à venir |
| [Mises à jour d'une application hors ligne](./mises-a-jour-hors-ligne) | Conçu, pas construit |
| [Backoffice et gestion des clés de signature](./backoffice-cles) | Conçu, pas construit |
| [Synchronisation multi-poste pair-à-pair](./synchronisation-multi-poste) | Conçu, pas construit |

États : **construit** (le code existe et est testé), **conçu** (décisions arrêtées, pas de code), **prévu** (voulu, pas encore conçu).
