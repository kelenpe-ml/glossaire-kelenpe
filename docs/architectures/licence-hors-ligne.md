# Licence logicielle hors ligne

## Objectif

Vendre un droit d'usage (essai, abonnement, nombre de postes) et le faire respecter **sans que l'ordinateur du client ait jamais besoin d'internet**, sans jamais bloquer son travail en cours ni prendre ses données en otage.

## La carte

![Cycle de vie : essai, puis licence active après paiement, rappels sans bloquer, grâce, et lecture seule où les données restent libres ; renouveler ramène à la licence active. Le poste envoie un code de demande à l'éditeur, par connexion ou par code, qui renvoie une licence signée vérifiée sans réseau ; clés publiques embarquées (en service et réserve) et horloge contrôlée par le dernier événement](/diagrams/archi-licence-hors-ligne.svg)

## Décisions

- **Licence = fichier signé, vérifié sur le poste.** L'éditeur signe (boutique, postes, date de fin, formule, fonctionnalités) avec sa clé privée ; l'application vérifie avec la clé publique qu'elle embarque.
  - Aucun serveur n'est nécessaire au quotidien.
  - Une licence falsifiée est refusée.
- **Deux chemins pour l'obtenir :**
  1. une connexion courte (quelques kilo-octets, un partage de connexion du téléphone suffit) ;
  2. en secours, un **code de demande** propre au poste, envoyé par messagerie, et un **code de réponse signé**, saisi à la main.
- **Essai sans inscription ni moyen de paiement, sans internet au départ :**
  - il s'enregistre discrètement quand une connexion apparaît ;
  - sans enregistrement, une trace locale décourage la réinstallation ;
  - cette protection est volontairement dissuasive, pas inviolable : une protection inviolable coûterait plus aux clients honnêtes qu'elle ne rapporterait.
- **Fin de licence en douceur :**
  1. rappels de plus en plus fréquents, jamais bloquants ;
  2. quelques jours de grâce ;
  3. lecture seule : consultation et export restent possibles, seules les nouvelles opérations principales (les ventes) s'arrêtent.
- **Renouveler en avance ne fait perdre aucun jour :** la nouvelle période commence à la fin de l'ancienne.
- **Changement d'ordinateur :** quelques transferts automatiques par an, au-delà par l'éditeur. Assez souple pour une panne, assez strict contre le partage.
- **Horloge :** la date de l'ordinateur ne peut pas être antérieure au dernier événement enregistré. Le journal d'événements sert de témoin, sans serveur de temps.
- **Facturer le poste, pas la personne :** les identifiants sont illimités, pour que chacun garde son propre compte (et sa traçabilité).
- **Clés :** une clé de licence en service et une de réserve, les deux clés publiques embarquées dès la première version (voir [Backoffice et gestion des clés de signature](./backoffice-cles)).

## Pièges connus

- **Code de réponse trop long :** une signature courante fait 64 octets, soit une centaine de caractères à recopier. Le format du code est une décision à part entière.
- **Horloge avancée par erreur, puis corrigée :** le dernier événement est « dans le futur », et l'heure juste paraît reculée. Prévoir une tolérance et un déblocage.
- **Identité de machine fragile :** une réinstallation ou une restauration de sauvegarde peut changer l'identifiant du poste, et compter comme un transfert.
- **Révocation hors ligne impossible :** un poste retiré continue de fonctionner jusqu'à la fin de sa licence. C'est une limite à accepter, pas un défaut à cacher.
- **Blocage au mauvais moment :** jamais au milieu d'une vente, jamais au démarrage d'une journée sans prévenir.
- **Données en otage :** la lecture seule doit laisser l'export complet, sinon la confiance, et le bouche-à-oreille, disparaissent.
- **Émetteur et vérificateur qui divergent :** partager le code, et tester qu'une licence signée par l'un est acceptée par l'autre.

## Exemple : Boutik

État : **conçu, pas construit** (mis à jour le 28 septembre 2026).

Les décisions propres à Boutik sont dans `docs/licence.md` :

- **Essai :** un mois.
- **Rappels :** à 14 jours, 7 jours, puis chaque jour ; 7 jours de grâce.
- **Transferts :** 2 automatiques par an.
- **Formules :** Solo, Duo et Boutique ; paiement à l'année ou au trimestre.
- **Canal de secours :** WhatsApp.

Ce qui existe déjà et servira :

- le journal d'événements (dates et horloge logique) ;
- `device.json` (identifiant de poste) ;
- la lecture seule, à construire sur les permissions existantes.

Le document liste aussi 22 questions ouvertes, dont la longueur du code et l'identité du poste.

## Termes liés

[Licence logicielle](/business/#licence-logicielle-software-license) · [Licence annuelle](/business/#licence-annuelle-annual-license) · [Période d'essai](/business/#periode-d-essai-trial-period) · [Formules de licence](/business/#formules-de-licence-license-tiers) · [Poste facturable](/business/#poste-facturable-billable-seat) · [Appairage d'un poste](/business/#appairage-d-un-poste-device-pairing) · [Révocation de licence](/business/#revocation-de-licence-license-revocation) · [Lecture seule](/backend/#lecture-seule-read-only-mode) · [Signature cryptographique](/backend/#signature-cryptographique-digital-signature) · [Clé de réserve](/backend/#cle-de-reserve-backup-key-rotation-de-cle) · [Horloge logique](/backend/#horloge-logique-logical-clock-lamport-clock) · [Hors ligne d'abord](/backend/#hors-ligne-d-abord-offline-first)
