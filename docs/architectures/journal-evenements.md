# Journal d'événements et projections

## Objectif

Garder comme seule vérité la **liste de tout ce qui s'est passé** (les événements), jamais effacée ni modifiée, et en tirer des tables pratiques à lire (les projections). On obtient l'historique complet, des données qu'on peut toujours reconstruire, et une base naturelle pour copier ou synchroniser.

## La carte

![Une commande passe les règles métier puis ajoute un événement au journal ; les projections A, B et C en sont tirées et servent aux lectures des écrans ; copies et synchronisation lisent le journal](/diagrams/archi-journal-evenements.svg)

## Décisions

- **Événements ou état courant ?**
  - Un journal d'événements vaut son coût quand l'historique compte (audit, litiges), quand plusieurs copies doivent se mettre d'accord (hors ligne, plusieurs postes), ou quand on veut pouvoir corriger une erreur de calcul en recalculant tout.
  - Pour un simple carnet d'adresses, une table modifiée en place suffit.
- **Événements métier, pas techniques.** « Vente enregistrée » ou « Prix modifié » restent compréhensibles dans dix ans ; « ligne 42 mise à jour » ne dit rien et change avec le schéma des tables.
- **Immuabilité imposée par la base** (déclencheurs qui refusent toute modification ou suppression), pas par une simple convention : une convention finit toujours par être contournée « juste une fois ».
- **Métadonnées sur chaque événement :**
  - identifiant unique tiré au hasard ;
  - type et identifiant de l'objet concerné ;
  - auteur (pris dans la session, jamais fourni par l'interface) ;
  - poste d'origine, compteur logique, date, version du schéma.

  Elles coûtent presque rien à l'écriture, mais il est impossible de les ajouter après coup aux anciens événements.
- **Projections :**
  - mises à jour dans la même transaction que l'événement : les écrans voient tout de suite le résultat, et aucune panne ne laisse l'un sans l'autre ;
  - l'alternative asynchrone n'a d'intérêt qu'à grande échelle.
- **Évolution :**
  - chaque événement porte sa version de schéma ;
  - les lecteurs savent lire les anciennes versions ;
  - on ne réécrit jamais le passé.
- **Exceptions écrites noir sur blanc :** ce qui n'a rien à faire dans le journal (préférences du poste, octets volumineux, secrets en clair) est listé, avec la raison.

## Pièges connus

- **Écrire « juste une fois » directement dans une projection.** Elle ne peut plus être reconstruite, et la prochaine reconstruction efface la correction.
- **Compteurs tenus à part** (numéro de facture dans une table séparée) :
  - ils ne se déduisent pas du journal ;
  - ils entrent en collision dès que deux postes numérotent chacun de leur côté.
- **Se fier à l'heure de l'ordinateur pour ordonner.** Elle peut être fausse, reculée, différente d'un poste à l'autre : il faut un compteur logique.
- **Secrets dans les événements** (empreintes de mots de passe) : ils sortent par la première fonction de lecture qui oublie de les filtrer. Filtrer à un seul endroit, pour toutes les lectures.
- **Gros octets dans le journal** (photos) : le journal devient lourd à copier et à synchroniser. Garder les octets à part, et ne mettre dans le journal qu'une référence par empreinte.
- **Suppression réelle impossible :** le journal n'oublie rien. Prévoir dès le départ ce qui doit pouvoir être vraiment effacé, et le garder hors du journal.
- **Journal qui grossit :** la reconstruction devient longue. Mesurer ; si besoin, partir d'un instantané de projection.

## Exemple : Boutik

État : **construit** (mis à jour le 29 septembre 2026).

- **Le journal :**
  - table `events` : `id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload`, `author_id`, `device_id`, `occurred_at`, `logical_clock`, `schema_version` ;
  - modification et suppression refusées par deux déclencheurs SQL (`src/main/events/schema.ts`) ;
  - toute écriture passe par `writeEvent` (`src/main/events/store.ts`) ;
  - l'auteur vient de la session (`auteurDepuisSession()`).
- **Les projections :** une par domaine (`produits/`, `clients/`, `ventes/`, `fournisseurs/`, `comptes/`), chacune avec sa fonction `reconstruire*`.
- **Les secrets :** les lectures passent par `rowToEvent` (`src/main/events/row.ts`), qui retire les champs sensibles (`CHAMPS_SENSIBLES`). Cela vaut aussi sur une connexion à part : le processus d'export lit le journal par `src/main/events/lecture-seule.ts`, contrôlé par le même test.
- **Exceptions voulues :**
  - les tables `saisie_*` des suggestions de saisie ;
  - les octets des images (`images_octets`, repérés par leur SHA-256, le journal ne portant que la référence).
- **Reste à faire :** le compteur de factures (`compteur_factures`, `src/main/ventes/commands.ts`) est encore tenu à part. Il devra devenir dérivable du journal avant la synchronisation entre postes.

## Termes liés

[Event sourcing](/backend/#event-sourcing-journal-d-evenements) · [Événement immuable](/backend/#evenement-immuable-immutable-event) · [Projection](/backend/#projection) · [Reconstruction d'une projection](/backend/#reconstruction-d-une-projection-replay) · [Horloge logique](/backend/#horloge-logique-logical-clock-lamport-clock) · [Identifiant de poste](/backend/#identifiant-de-poste-device-id) · [UUID](/backend/#uuid-universally-unique-identifier) · [Adressage par contenu](/backend/#adressage-par-contenu-content-addressing) · [Synchronisation multi-poste](./synchronisation-multi-poste)
