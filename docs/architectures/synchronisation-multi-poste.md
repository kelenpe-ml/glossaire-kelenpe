# Synchronisation multi-poste pair-à-pair

## Objectif

Faire que plusieurs postes d'un même lieu (plusieurs caisses d'une boutique) voient les mêmes données :

- sur le réseau local, sans internet ;
- sans serveur ni poste maître ;
- avec une règle claire quand deux personnes ont changé la même chose.

## La carte

![Les postes A, B et C du réseau local s'échangent les événements qui leur manquent, sans poste maître ni serveur ; un nouveau poste reçoit l'historique d'un autre poste ; en cas de conflit, la version du patron l'emporte d'office, et entre employés deux versions sont gardées, la plus récente en attendant, avec un badge que le patron tranche ; identifiant de poste et horloge logique sont déjà sur chaque événement](/diagrams/archi-synchronisation-multi-poste.svg)

## Décisions

- **Échanger des événements, pas des tables.** Chaque poste a le journal complet ; synchroniser, c'est envoyer à l'autre les événements qu'il n'a pas. Puis chacun reconstruit ses projections de la même façon.
- **Pair-à-pair plutôt que maître/client.**
  - Avec un maître, tout s'arrête quand le poste du patron est éteint.
  - En pair-à-pair, n'importe quel poste allumé suffit.
- **Réseau local seulement,** sans Bluetooth : le Bluetooth est lent et instable, et appairer des appareils est une source de confusion. Internet n'est pas nécessaire.
- **Un nouveau poste récupère l'historique depuis un autre poste,** jamais depuis un serveur : il n'y a pas de serveur, et les données restent dans le lieu.
- **Ordonner sans l'horloge murale :** chaque événement porte l'identifiant du poste et un compteur logique ; l'ordre se déduit de ces deux valeurs.
- **Conflits réglés selon la personne, pas la machine :**
  1. la version du patron l'emporte automatiquement ;
  2. entre employés, les deux versions sont gardées, la plus récente sert de valeur provisoire, et un badge « conflit en attente » demande au patron d'arbitrer.
- **Les ajouts ne sont jamais en conflit :** une vente, un paiement s'ajoutent simplement. Seules les modifications d'une même valeur (un prix, un nom) peuvent l'être.
- **Identifiants tirés au hasard (UUID) :** deux postes hors ligne créent des objets sans jamais tomber sur le même identifiant.
- **Octets volumineux en second :** les événements voyagent d'abord ; les images sont demandées ensuite, par leur empreinte.

## Pièges connus

- **Compteurs séquentiels** (numéro de facture) : deux postes émettent la même facture n° 42. Il faut un numéro dérivable du journal et propre au poste.
- **Horloge murale fausse :** ordonner par date donne un ordre faux. Le compteur logique est indispensable.
- **Suppressions :** une suppression doit être un événement, sinon l'objet revient à la synchronisation suivante.
- **Découverte des postes sur le réseau :** le pare-feu de Windows bloque souvent les annonces ; il faut une règle, ou une saisie manuelle de l'adresse.
- **Sécurité du réseau local :**
  - n'importe qui sur le Wi-Fi de la boutique pourrait se faire passer pour un poste ;
  - les postes doivent être appairés, et le trafic chiffré.
- **Projections différentes d'un poste à l'autre** si le code de reconstruction n'est pas déterministe : l'ordre de rejeu doit être le même partout.

## Exemple : Boutik

État : **conçu, pas construit** (mis à jour le 28 septembre 2026).

- **Déjà préparé :**
  - chaque événement porte `device_id` et `logical_clock`, tenus dans `device.json` (`src/main/events/device.ts`, `nextLogicalClock`) ;
  - tous les objets ont un UUID ;
  - le plan des images est dans `docs/images.md`.
- **À faire avant :** rendre le compteur de factures (`compteur_factures`, `src/main/ventes/commands.ts`) dérivable du journal.

## Termes liés

[Synchronisation](/backend/#synchronisation) · [Pair-à-pair](/backend/#pair-a-pair-peer-to-peer-p2p) · [Modèle maître/client](/backend/#modele-maitre-client-primary-replica) · [Conflit d'écriture](/backend/#conflit-d-ecriture-write-conflict) · [Dernier écrit gagne](/backend/#dernier-ecrit-gagne-last-write-wins-lww) · [Horloge logique](/backend/#horloge-logique-logical-clock-lamport-clock) · [Identifiant de poste](/backend/#identifiant-de-poste-device-id) · [UUID](/backend/#uuid-universally-unique-identifier) · [LAN](/backend/#lan-local-area-network) · [Journal d'événements et projections](./journal-evenements)
