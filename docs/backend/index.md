# Backend & architecture

Concepts de conception logicielle côté serveur, avec des exemples tirés de **Prodora Backend** (Kotlin/Spring Boot), **Reelforge** (Go, pipeline de transcodage) et **Gift** (microservices Spring Cloud).

[[toc]]

## System design

![Pipeline Reelforge : client, API, S3, SQS, worker GPU, CDN, lecteur](/diagrams/reelforge-pipeline.svg)

**Définition simple** : la discipline qui consiste à concevoir l'architecture globale d'un système logiciel — comment les composants communiquent, où sont les points de défaillance, comment ça scale — avant (ou en parallèle) d'écrire le code lui-même.

**Contexte / exemple concret** : le choix Reelforge de découpler l'API et les Workers via une file SQS (plutôt qu'un appel direct) est une décision de system design : ça permet de scaler les workers GPU indépendamment de l'API, et d'absorber les pics de charge sans faire tomber le service d'upload.

**Termes liés** : [Découplage](#decouplage), [Scalabilité](#scalabilite-scalability), [Microservices](#microservices).

---

## Découplage

**Définition simple** : réduire les dépendances directes entre deux composants pour qu'ils puissent évoluer, tomber en panne ou scaler indépendamment l'un de l'autre — typiquement en passant par une file de messages ou une interface plutôt qu'un appel direct.

**Contexte / exemple concret** : Reelforge formalise ça comme principe "non négociable" : *"Découplage API / Worker — SQS, aucune communication directe."* Si le worker GPU est temporairement saturé, l'API continue d'accepter des uploads sans erreur — les jobs attendent simplement dans la queue.

**Termes liés** : [System design](#system-design), [Message queue](#message-queue-file-de-messages).

---

## Message queue (*File de messages*)

![Message queue avec producteur, consommateur et DLQ](/diagrams/message-queue.svg)

**Définition simple** : un système qui stocke temporairement des messages (souvent des "jobs" à traiter) entre un producteur et un ou plusieurs consommateurs, pour absorber les pics de charge et découpler les composants dans le temps.

**Contexte / exemple concret** : Reelforge utilise SQS (Amazon Simple Queue Service) comme file de jobs entre l'API (qui empile un job à chaque upload) et le pool de workers (qui dépile et traite). En cas d'échec (VMAF < 85, erreur FFmpeg), le job repart vers une **DLQ** (*dead-letter queue* — file "poubelle" pour les messages qui échouent trop de fois) plutôt que d'être perdu.

**Termes liés** : [Découplage](#decouplage), [Worker](#worker).

---

## Worker

**Définition simple** : un processus (souvent stateless, c'est-à-dire sans état conservé entre deux tâches) dédié à consommer des tâches d'une file et à les exécuter, indépendamment de l'API qui les a créées.

**Contexte / exemple concret** : `cmd/worker` chez Reelforge est un binaire séparé de `cmd/api`, déployé sur des nodes Kubernetes avec GPU (NVENC) — il consomme SQS et exécute le pipeline FFmpeg. Étant stateless (`emptyDir` éphémère, pas de disque persistant), on peut scaler horizontalement le nombre de workers selon la charge sans se soucier de migrer un état.

**Termes liés** : [Message queue](#message-queue-file-de-messages), [Scalabilité](#scalabilite-scalability), [Stateless](#stateless).

---

## Stateless

**Définition simple** : un composant qui ne conserve aucune information entre deux requêtes/tâches — chaque exécution part de zéro à partir des données qu'on lui fournit. S'oppose à *stateful* (avec état, ex. une base de données).

**Contexte / exemple concret** : les workers Reelforge sont explicitement stateless — ils repartent d'un stockage éphémère à chaque job, la source de vérité restant toujours S3, jamais le disque local du worker. Ça permet de tuer/relancer un worker à tout moment sans perte de données.

**Termes liés** : [Worker](#worker), [Scalabilité](#scalabilite-scalability).

---

## Scalabilité (*Scalability*)

**Définition simple** : la capacité d'un système à absorber plus de charge en ajoutant des ressources — *horizontale* (ajouter plus d'instances/machines) ou *verticale* (donner plus de puissance à une même machine).

**Contexte / exemple concret** : le pool de workers GPU de Reelforge scale horizontalement (autoscaling via Kubernetes HPA) parce que les workers sont stateless et découplés de l'API par la queue SQS — c'est la combinaison de ces trois choix d'architecture qui rend le scaling possible sans réécriture.

**Termes liés** : [Stateless](#stateless), [Pooling](#pooling), [Microservices](#microservices).

---

## Microservices

![Monolithe vs microservices, exemple Gift](/diagrams/microservices-vs-monolith.svg)

**Définition simple** : découper une application en plusieurs services indépendants, chacun responsable d'un domaine métier précis, communiquant entre eux par API — par opposition à un *monolithe* (une seule application qui fait tout).

**Contexte / exemple concret** : **Gift** (association caritative, Spring Cloud) illustre l'architecture microservices chez Kelenpe : `service-auth`, `service-gateway`, `service-cause`, `service-donation`, `service-activity`, `service-admin` — chaque service a son propre `pom.xml`, sa propre base de code, et communique via le `service-gateway` (voir ci-dessous).

**Termes liés** : [API Gateway](#api-gateway), [Découplage](#decouplage), [System design](#system-design).

---

## API Gateway

![Client vers API Gateway vers services internes](/diagrams/api-gateway.svg)

**Définition simple** : le point d'entrée unique d'une architecture microservices — il reçoit toutes les requêtes externes et les route vers le bon service interne, en centralisant souvent l'authentification, le rate limiting et le logging.

**Contexte / exemple concret** : `service-gateway` chez Gift joue ce rôle : le client (app Flutter) ne parle jamais directement à `service-donation` ou `service-cause`, tout transite par la gateway qui route vers le bon service backend.

**Termes liés** : [Microservices](#microservices).

---

## Middleware

**Définition simple** : une fonction qui s'exécute *entre* la requête entrante et la réponse finale, pour intercepter, modifier ou bloquer le traitement — authentification, logging, rewrite d'URL, headers, etc. — avant que la requête n'atteigne le code métier (ou avant que la réponse ne reparte).

**Contexte / exemple concret** : sur le déploiement Vercel du glossaire, un `middleware.ts` à la racine du projet (Vercel *Routing Middleware*, anciennement *Edge Middleware*) intercepte chaque requête avant de servir les fichiers statiques VitePress, pour exiger une authentification HTTP Basic (login/mot de passe) — gratuit, contrairement à la Password Protection payante de Vercel. Même logique côté Spring Boot (filtres/interceptors) ou Express (`app.use(...)`) : le middleware JWT vérifie le token avant de laisser passer la requête vers le contrôleur.

**Termes liés** : [API Gateway](#api-gateway), [Authentification JWT / Session](#authentification-jwt-session).

---

## Pooling

![Pool fixe de 3 lecteurs video reutilises](/diagrams/pooling.svg)

**Définition simple** : maintenir un ensemble limité de ressources coûteuses à créer (connexions DB, threads, objets lourds) déjà initialisées et réutilisables, plutôt que d'en créer/détruire une à chaque besoin.

**Contexte / exemple concret** : côté lecture vidéo, `VideoPlayerPool.kt` dans Ayena maintient un pool **fixe de 3 lecteurs ExoPlayer** (précédent / courant / suivant) au lieu de créer un nouveau lecteur à chaque vidéo du feed — recréer un `ExoPlayer` est coûteux (init codec, buffers), donc on réassigne les 3 instances existantes selon la position de scroll (`assignedIndex`). Côté backend classique (Spring Boot/Kotlin), le même principe s'applique aux **connection pools** de base de données (ex. HikariCP) : un nombre fixe de connexions PostgreSQL déjà ouvertes, réutilisées entre les requêtes.

**Termes liés** : [Connection pool](#connection-pool), [Preload](/streaming/#preload).

---

## Connection pool

**Définition simple** : cas particulier du pooling appliqué aux connexions réseau (le plus souvent vers une base de données) — ouvrir une connexion TCP + authentifier est lent, donc on garde un stock de connexions déjà établies.

**Contexte / exemple concret** : Prodora Backend (Spring Boot/Kotlin, PostgreSQL) utilise un connection pool (HikariCP par défaut avec Spring Boot) configuré via `application.properties` — dimensionner ce pool correctement (ni trop petit, ni trop grand) est un classique du tuning backend senior.

**Termes liés** : [Pooling](#pooling).

---

## Caching

**Définition simple** : conserver le résultat d'une opération coûteuse (calcul, requête DB, appel réseau) pour le réutiliser directement la prochaine fois qu'il est demandé, au lieu de le recalculer.

**Contexte / exemple concret** : Prodora Backend documente explicitement sa stratégie dans `docs/CACHE_DOCUMENTATION.md`. Côté app Flutter du feed vidéo (Ayena/Deme), le **caching** prend plusieurs formes concrètes : cache des posters/images via le network image provider, cache en mémoire des ratios d'aspect pour stabiliser le layout de la liste, et cache disque progressif des fichiers vidéo eux-mêmes (`progressive_video_cache`, voir [Prefetch](/streaming/#prefetch)).

**Termes liés** : [Pooling](#pooling), [Cache invalidation](#cache-invalidation).

---

## Cache invalidation

**Définition simple** : le mécanisme (et le problème classique) de savoir *quand* une donnée en cache est devenue obsolète et doit être rafraîchie — trop souvent invalidé, le cache ne sert à rien ; pas assez, l'utilisateur voit des données périmées.

**Contexte / exemple concret** : cité comme un des deux "vrais problèmes durs" de l'informatique (avec le nommage des variables) — pertinent dès que Prodora met en cache des données de produits ou de stock qui changent (prix, disponibilité) : il faut invalider le cache au bon moment, pas juste après un délai fixe.

**Termes liés** : [Caching](#caching).

---

## Garbage collector (GC)

**Définition simple** : le mécanisme automatique (présent dans la JVM utilisée par Kotlin/Java, mais aussi en Go, Dart...) qui libère la mémoire occupée par des objets qui ne sont plus référencés par le programme, sans que le développeur ait à le faire manuellement (contrairement à C/C++).

**Contexte / exemple concret** : Prodora Backend tourne sur la JVM (Kotlin/Spring Boot) — le GC y fonctionne en tâche de fond et peut provoquer des micro-pauses ("stop-the-world") si mal configuré, un point de vigilance en production sous charge. Reelforge, écrit en Go, a aussi un GC (concurrent, à faible latence) — un des arguments cités dans sa documentation pour choisir Go côté orchestration plutôt qu'un langage à gestion mémoire manuelle.

**Termes liés** : [Scalabilité](#scalabilite-scalability).

---

## White labeling (*Marque blanche*)

**Définition simple** : concevoir un produit pour qu'il puisse être revendu ou redéployé sous la marque d'un client tiers, en changeant uniquement le branding (logo, couleurs, nom) sans toucher au cœur du produit.

**Contexte / exemple concret** : pertinent pour la stratégie produit de Kelenpe si, par exemple, Prodora (marketplace) ou Boutik (logiciel de caisse) étaient un jour proposés en marque blanche à d'autres entrepreneurs — nécessite dès la conception une séparation claire entre logique métier et éléments de branding (thèmes, assets, config par tenant).

**Termes liés** : [Multi-tenant](#multi-tenant-multi-tenant).

---

## Multi-tenant (*Multi-tenant*)

**Définition simple** : une seule instance d'application qui sert plusieurs clients ("tenants") de façon isolée — chacun voit ses propres données, sans savoir que l'infrastructure est partagée.

**Contexte / exemple concret** : Prodora Backend utilise la notion de "spaces" (voir `SPACES_FEATURE_GUIDE.md`) qui se rapproche d'une logique multi-tenant : chaque vendeur/espace a ses propres produits et données, isolés logiquement au sein de la même base et du même déploiement.

**Termes liés** : [White labeling](#white-labeling-marque-blanche).

---

## Plumbing

**Définition simple** : le code "de tuyauterie" — la logique répétitive et peu glamour qui relie les couches d'une application (sérialisation, mapping DTO ↔ entité, configuration, gestion d'erreurs transverses) sans porter de valeur métier directe, mais indispensable pour que tout communique correctement.

**Contexte / exemple concret** : les nombreux fichiers `AdminImageDtos.kt`, adapters et "ports" (`HttpAdminImageRepository.ts`, `AdminImageRepository.ts`) dans Prodora Admin Hub sont typiques de plumbing — ils ne contiennent pas de logique métier, ils transportent et adaptent la donnée entre le frontend et l'API backend.

**Termes liés** : [Découplage](#decouplage).

---

## Idempotence

**Définition simple** : une opération est idempotente si l'exécuter plusieurs fois produit le même résultat que l'exécuter une seule fois — rejouer la même requête par erreur (retry réseau, double clic) ne casse rien.

**Contexte / exemple concret** : le script de seed de données de `ad-engine-forge` (`make seed`) est explicitement conçu comme idempotent — on peut le relancer à tout moment sans dupliquer les organisations ou les clés API de test. C'est un réflexe à avoir pour toute tâche déclenchée par un retry automatique (webhook, job de queue) : si Reelforge relance un job de transcodage après un timeout réseau côté S3, il ne faut pas que ça produise deux fois la même rendition en double.

**Termes liés** : [Message queue](#message-queue-file-de-messages), [Worker](#worker).

---

## Architecture Electron (Main / Renderer / Preload)

![Main process, preload et renderer communiquant par IPC](/diagrams/electron-architecture.svg)

**Définition simple** : une application Electron (desktop, multiplateforme, basée sur Chromium + Node.js) tourne dans plusieurs processus séparés qui ne partagent pas de mémoire directement : le **process principal** (*main*, Node.js complet, accès disque/OS), le **process de rendu** (*renderer*, l'interface web, sans accès direct à Node pour des raisons de sécurité), et un **script de préchargement** (*preload*) qui fait le pont contrôlé entre les deux.

**Contexte / exemple concret** : **Boutik** (logiciel de caisse desktop Kelenpe, Electron + React + TypeScript) suit exactement cette structure : `src/main/` (accès à la base SQLite locale via `better-sqlite3`, aux ventes, à l'impression), `src/renderer/` (l'interface React que voit le caissier) et `src/preload/` (le pont sécurisé entre les deux, voir IPC ci-dessous).

**Termes liés** : [IPC](#ipc-inter-process-communication).

---

## IPC (*Inter-Process Communication*)

**Définition simple** : le mécanisme par lequel deux processus séparés (qui ne partagent pas de mémoire) s'échangent des messages — indispensable dans Electron où le renderer (interface) ne peut pas appeler directement le code Node.js du main process.

**Contexte / exemple concret** : dans Boutik, `src/preload/index.ts` expose un pont IPC typé (`src/shared/index.ts` partage les types entre les deux côtés) — quand l'interface React veut annuler une vente (`src/main/ventes/annulation.ts`), elle ne modifie pas directement la base SQLite : elle envoie un message IPC au main process, qui seul a le droit d'écrire dans la base.

**Termes liés** : [Architecture Electron (Main / Renderer / Preload)](#architecture-electron-main-renderer-preload).

---

## Authentification JWT / Session

**Définition simple** : deux façons courantes de savoir "qui est connecté" à chaque requête. Un **JWT** (*JSON Web Token*) est un jeton auto-porteur signé (le serveur peut le vérifier sans base de données) contenant les infos de l'utilisateur, envoyé dans l'en-tête `Authorization: Bearer <token>`. Une **session cookie** stocke un identifiant côté client (cookie, idéalement `HttpOnly` pour être inaccessible en JavaScript) qui pointe vers un état gardé côté serveur.

**Contexte / exemple concret** : `admesh`/`ad-engine-forge` (Kelenpe Ad) documente utiliser les deux en parallèle : un cookie de session `HttpOnly` nommé `admesh_session` pour le dashboard web (protège contre le vol de token en JS, typiquement via une attaque XSS), et un JWT via `Authorization: Bearer` pour les appels machine-à-machine (SDK mobile, intégrations serveur à serveur) où un cookie n'a pas de sens.

**Termes liés** : [API Gateway](#api-gateway).

---

## gRPC & Protobuf

**Définition simple** : **Protobuf** (*Protocol Buffers*, format binaire compact créé par Google) décrit la structure des messages échangés entre services dans un fichier `.proto` ; **gRPC** est un framework d'appel de procédure à distance (RPC) qui utilise Protobuf pour des communications inter-services rapides et fortement typées — une alternative à REST/JSON quand la performance et le typage strict comptent plus que la lisibilité humaine directe.

**Contexte / exemple concret** : `ad-engine-forge`/`admesh` définit son contrat inter-services dans `proto/ad.proto` — le moteur d'enchère Rust (chemin critique, latence cible < 100ms) et les autres services génèrent leur code de communication à partir de ce même fichier, garantissant qu'ils restent synchronisés sur le format des messages sans repasser par une doc à jour manuellement.

**Termes liés** : [Microservices](#microservices), [API Gateway](#api-gateway).

---

## Event streaming (*Kafka / Redpanda*)

**Définition simple** : une variante de la message queue (voir plus haut) pensée pour un débit très élevé d'événements bruts (clics, impressions, vues) plutôt que des "jobs" ponctuels — les messages restent dans un log ordonné que plusieurs consommateurs peuvent relire indépendamment, contrairement à une queue classique où un message consommé disparaît.

**Contexte / exemple concret** : `ad-engine-forge` utilise **Redpanda** (compatible avec l'API Kafka, mais sans dépendance à la JVM — argument cité explicitement : "Kafka-compatible sans JVM") pour ingérer en temps réel les événements bruts d'impressions et de clics publicitaires, avant qu'ils soient agrégés dans ClickHouse (voir [OLAP](#oltp-vs-olap)) pour calculer CTR/CPA/ROAS.

**Termes liés** : [Message queue](#message-queue-file-de-messages), [OLTP vs OLAP](#oltp-vs-olap).

---

## OLTP vs OLAP

**Définition simple** : **OLTP** (*Online Transaction Processing*) désigne les bases de données optimisées pour beaucoup de petites lectures/écritures individuelles (ex. PostgreSQL pour "créer une commande", "mettre à jour un stock"). **OLAP** (*Online Analytical Processing*) désigne les bases optimisées pour agréger et analyser de très gros volumes de données en lecture (ex. "le CTR moyen par campagne sur 90 jours") — stockage en colonnes plutôt qu'en lignes, beaucoup plus rapide pour ce type de requête.

**Contexte / exemple concret** : `ad-engine-forge` sépare explicitement les deux : PostgreSQL comme "source de vérité transactionnelle" (hiérarchie campagne → ad set → ad, OLTP), et **ClickHouse** comme moteur d'agrégation temps réel pour les métriques publicitaires — décrit comme "la brique qui rend le dashboard rapide même à des milliards de lignes" (OLAP). Utiliser PostgreSQL seul pour ce second usage serait possible mais beaucoup plus lent à grande échelle.

**Termes liés** : [Event streaming (Kafka / Redpanda)](#event-streaming-kafka-redpanda), [Connection pool](#connection-pool).

---

## Event sourcing (*journal d'événements*)

**Définition simple** : Façon de ranger les données : au lieu de garder seulement l'état actuel (« il reste 12 sacs de riz »), on garde la liste complète de tout ce qui s'est passé (« 20 sacs reçus », « 8 sacs vendus »), dans l'ordre. L'état actuel se recalcule à partir de cette liste, qu'on appelle le journal d'événements.

**Contexte / exemple concret** : C'est la règle n° 1 de Boutik : toute écriture passe par un événement (`writeEvent`, dans `events/store.ts`). Une vente ajoute un événement `VenteEnregistree` ; le stock affiché est calculé à partir de tous les événements du produit. On peut ainsi toujours savoir qui a fait quoi, et quand.

**Termes liés** : [Événement immuable](#evenement-immuable-immutable-event), [Projection](#projection), [Reconstruction d'une projection](#reconstruction-d-une-projection-replay), [Agrégat](#agregat-aggregate), [Source unique de vérité](#source-unique-de-verite-single-source-of-truth).

---

## Événement immuable (*Immutable event*)

**Définition simple** : Un événement est un fait enregistré dans le journal (« vente n° 42 enregistrée à 10 h 12 par Awa »). Immuable veut dire qu'on ne peut plus jamais le modifier ni l'effacer : pour corriger une erreur, on ajoute un nouvel événement qui la corrige.

**Contexte / exemple concret** : Dans Boutik, des déclencheurs SQL refusent toute modification ou suppression dans la table `events`. Une vente erronée n'est pas effacée : on enregistre une annulation (`VenteAnnulee`), et les deux restent visibles dans l'historique.

**Termes liés** : [Event sourcing](#event-sourcing-journal-d-evenements), [Déclencheur](#declencheur-trigger-sql), [Payload](#payload-charge-utile).

---

## Agrégat (*Aggregate*)

**Définition simple** : L'objet métier auquel un événement se rapporte : un produit, un client, une vente… Chaque événement porte le type de l'agrégat et son identifiant, ce qui permet de retrouver toute l'histoire d'un seul objet.

**Contexte / exemple concret** : Dans le journal de Boutik, les colonnes `aggregate_type` (« produit », « client », « image »…) et `aggregate_id` (l'identifiant du produit) rangent les événements. `readByAggregate("produit", id)` rend toute la vie d'un produit : création, modifications, mouvements de stock.

**Termes liés** : [Event sourcing](#event-sourcing-journal-d-evenements), [Événement immuable](#evenement-immuable-immutable-event), [UUID](#uuid-universally-unique-identifier).

---

## Payload (*Charge utile*)

**Définition simple** : Le contenu d'un message ou d'un événement : les données elles-mêmes, par opposition à l'« enveloppe » (qui, quand, quel type). C'est comme le contenu d'une lettre, par opposition à l'adresse et au timbre.

**Contexte / exemple concret** : Un événement `ProduitCree` de Boutik a une enveloppe (identifiant, date, auteur, poste) et un payload en JSON : `{ nom, emoji, prix, unite, seuil, imageId }`. Le payload d'`ImageAjoutee` ne contient que le nom et les dimensions, jamais les octets de l'image.

**Termes liés** : [Événement immuable](#evenement-immuable-immutable-event), [JSON](#json-javascript-object-notation).

---

## Projection

**Définition simple** : Un tableau « prêt à lire », calculé à partir du journal d'événements, pour répondre vite à une question précise (« quel est le stock de chaque produit ? »). La projection n'est qu'une copie de travail : la vérité reste le journal.

**Contexte / exemple concret** : Boutik tient plusieurs projections dans la base : `produits_projection` (stock, prix), `clients_projection`, `ventes_projection`, `ardoise_projection` (dettes des clients), `images_projection`… Chaque nouvel événement les met à jour immédiatement.

**Termes liés** : [Event sourcing](#event-sourcing-journal-d-evenements), [Reconstruction d'une projection](#reconstruction-d-une-projection-replay), [Source unique de vérité](#source-unique-de-verite-single-source-of-truth), [Table](#table).

---

## Reconstruction d'une projection (*Replay*)

**Définition simple** : Effacer une projection puis la recalculer entièrement en « rejouant » tous les événements du journal, du premier au dernier. Si le résultat est identique à l'ancienne projection, on sait qu'elle était juste.

**Contexte / exemple concret** : Chaque projection de Boutik a sa fonction `reconstruire…` (par exemple `reconstruireProjectionProduits`). Le patron peut la lancer après une mise à jour ; les tests comparent l'avant et l'après et vérifient qu'ils sont identiques.

**Termes liés** : [Projection](#projection), [Event sourcing](#event-sourcing-journal-d-evenements), [Instantané](#instantane-snapshot).

---

## Instantané (*Snapshot*)

**Définition simple** : Une photo de l'état à un instant donné, enregistrée pour ne pas avoir à rejouer tout le journal depuis le début : on repart de la photo, puis on rejoue seulement les événements plus récents.

**Contexte / exemple concret** : Boutik n'en a pas encore besoin : rejouer quelques milliers d'événements prend moins d'une seconde. Les instantanés deviendront utiles quand le journal d'une boutique comptera des centaines de milliers d'événements.

**Termes liés** : [Reconstruction d'une projection](#reconstruction-d-une-projection-replay), [Event sourcing](#event-sourcing-journal-d-evenements).

---

## Upsert

**Définition simple** : Mot formé de *update* (mettre à jour) et *insert* (ajouter) : « ajoute cette ligne, ou mets-la à jour si elle existe déjà ». Une seule opération au lieu de deux (vérifier, puis choisir).

**Contexte / exemple concret** : Dans `produits/projection.ts`, la mise à jour d'un produit est un upsert SQL : `INSERT … ON CONFLICT(id) DO UPDATE`. Qu'un événement crée ou modifie le produit, la projection reçoit toujours la bonne ligne.

**Termes liés** : [Requête SQL](#requete-sql-sql-query), [Projection](#projection), [Table](#table).

---

## Source unique de vérité (*Single source of truth*)

**Définition simple** : Principe selon lequel une information n'a qu'un seul endroit « officiel ». Toutes les autres copies en dérivent ; en cas de désaccord, c'est la source qui a raison.

**Contexte / exemple concret** : Dans Boutik, la source unique de vérité est le journal d'événements : les projections n'en sont que des copies, reconstructibles à tout moment. Pour les raccourcis clavier, c'est la liste `shared/raccourcis.ts` : le guide F1 est construit à partir d'elle.

**Termes liés** : [Event sourcing](#event-sourcing-journal-d-evenements), [Projection](#projection).

---

## Horloge logique (*Logical clock, Lamport clock*)

**Définition simple** : Un compteur qui augmente à chaque événement, pour savoir dans quel ordre les choses se sont passées sans se fier à l'heure de l'ordinateur (qui peut être fausse ou différente d'un poste à l'autre). L'horloge de Lamport en est la forme la plus connue : chaque poste garde son compteur et le fait avancer au-delà de celui des messages qu'il reçoit.

**Contexte / exemple concret** : Chaque événement de Boutik porte un `logical_clock`, tenu dans `device.json` par poste (`nextLogicalClock`). Quand les postes se synchroniseront, cette horloge permettra d'ordonner leurs événements même si l'un d'eux a une date système fausse.

**Termes liés** : [Identifiant de poste](#identifiant-de-poste-device-id), [Synchronisation](#synchronisation), [Conflit d'écriture](#conflit-d-ecriture-write-conflict).

---

## Identifiant de poste (*device_id*)

**Définition simple** : Un numéro unique donné à chaque ordinateur où l'application est installée, pour savoir de quel appareil vient chaque action.

**Contexte / exemple concret** : Boutik crée cet identifiant au premier lancement et le garde dans `device.json`. Chaque événement du journal porte le `device_id` du poste qui l'a écrit, ce qui servira à la synchronisation entre caisses.

**Termes liés** : [Horloge logique](#horloge-logique-logical-clock-lamport-clock), [UUID](#uuid-universally-unique-identifier), [Synchronisation](#synchronisation).

---

## UUID (*Universally Unique Identifier*)

**Définition simple** : Un identifiant de 128 bits tiré au hasard, écrit sous la forme `3f2b8c1e-…`. Il y en a tant de possibles que deux ordinateurs peuvent en créer chacun de leur côté sans jamais tomber sur le même, sans se concerter.

**Contexte / exemple concret** : Boutik donne un UUID à chaque produit, client, vente et événement (`randomUUID()`). Deux caisses hors ligne peuvent ainsi créer des produits en même temps sans conflit d'identifiants.

**Termes liés** : [Identifiant de poste](#identifiant-de-poste-device-id), [Agrégat](#agregat-aggregate), [Générateur cryptographique](#generateur-cryptographique-csprng).

---

## Hors ligne d'abord (*Offline-first*)

**Définition simple** : Une application conçue pour fonctionner entièrement sans Internet ; la connexion, si elle existe, ne sert qu'à des extras (synchroniser, mettre à jour). Rien d'essentiel n'en dépend.

**Contexte / exemple concret** : Boutik est 100 % hors ligne : ventes, stock, impression, même les polices de caractères sont embarquées. Une coupure réseau à Bamako n'empêche jamais d'encaisser.

**Termes liés** : [Synchronisation](#synchronisation), [Police embarquée](/frontend/#police-embarquee-embedded-font).

---

## Synchronisation

**Définition simple** : Mettre plusieurs copies des mêmes données d'accord entre elles, par exemple deux caisses d'une même boutique, pour que chacune voie les ventes de l'autre.

**Contexte / exemple concret** : Pas encore faite dans Boutik, mais tout est prévu pour : événements immuables, horloge logique, identifiant de poste. Pour les images, le plan est écrit dans `docs/images.md` : les événements voyagent d'abord, les octets des images ensuite, demandés par leur empreinte.

**Termes liés** : [Pair-à-pair](#pair-a-pair-peer-to-peer-p2p), [Modèle maître/client](#modele-maitre-client-primary-replica), [Conflit d'écriture](#conflit-d-ecriture-write-conflict), [Horloge logique](#horloge-logique-logical-clock-lamport-clock), [Adressage par contenu](#adressage-par-contenu-content-addressing).

---

## Pair-à-pair (*Peer-to-peer, P2P*)

**Définition simple** : Des appareils qui échangent directement entre eux, sans serveur central : chacun est à la fois client et serveur.

**Contexte / exemple concret** : Une piste pour synchroniser les caisses de Boutik sur le réseau local de la boutique, sans Internet ni serveur : chaque poste enverrait aux autres les événements qui leur manquent.

**Termes liés** : [Synchronisation](#synchronisation), [Modèle maître/client](#modele-maitre-client-primary-replica), [LAN](#lan-local-area-network).

---

## Modèle maître/client (*Primary/replica*)

**Définition simple** : Une organisation où un appareil (le maître) détient la version de référence des données ; les autres (les clients) lui envoient leurs changements et reçoivent les siens. Plus simple à raisonner que le pair-à-pair, mais tout dépend du maître.

**Contexte / exemple concret** : Autre piste étudiée pour Boutik : le poste du patron serait le maître, les caisses des employés s'y synchroniseraient quand elles le voient sur le réseau.

**Termes liés** : [Pair-à-pair](#pair-a-pair-peer-to-peer-p2p), [Synchronisation](#synchronisation).

---

## Conflit d'écriture (*Write conflict*)

**Définition simple** : Quand deux personnes modifient la même donnée en même temps sur deux copies différentes, et que les deux changements ne peuvent pas être gardés tels quels. Il faut une règle pour décider.

**Contexte / exemple concret** : Exemple pour Boutik synchronisé : sur deux caisses hors ligne, le prix du riz est changé à 500 et à 550 FCFA. Au moment de synchroniser, il faut choisir. Les ventes, elles, ne sont jamais en conflit : ce sont des ajouts.

**Termes liés** : [Dernier écrit gagne](#dernier-ecrit-gagne-last-write-wins-lww), [Horloge logique](#horloge-logique-logical-clock-lamport-clock), [Synchronisation](#synchronisation).

---

## Dernier écrit gagne (*Last-Write-Wins, LWW*)

**Définition simple** : Règle simple pour régler un conflit : on garde la modification la plus récente et on oublie l'autre. Simple, mais une modification peut être perdue sans que personne le voie.

**Contexte / exemple concret** : Prévue pour les champs simples de Boutik (nom d'une image, prix d'un produit) : le dernier `ImageRenommee`, dans l'ordre du journal, donne le nom.

**Termes liés** : [Conflit d'écriture](#conflit-d-ecriture-write-conflict), [Horloge logique](#horloge-logique-logical-clock-lamport-clock).

---

## FIFO (*First In, First Out*)

**Définition simple** : « Premier entré, premier sorti » : on traite les éléments dans leur ordre d'arrivée, comme une file d'attente au guichet.

**Contexte / exemple concret** : Quand un client règle une partie de son ardoise sans préciser quelle vente il paie, Boutik impute l'argent aux ventes à crédit les plus anciennes d'abord (« Remboursement libre (FIFO) » dans l'écran Créances).

**Termes liés** : [Ardoise](/business/#ardoise-creance-client), [Imputation](/business/#imputation).

---

## Suppression logique (*Soft delete, archivage, tombstone*)

**Définition simple** : Au lieu d'effacer une donnée, on la marque comme « retirée » : elle disparaît de l'usage courant mais reste dans l'historique et peut revenir. Une « pierre tombale » (tombstone) est cette marque, utile en synchronisation pour dire aux autres copies « ceci a été supprimé ».

**Contexte / exemple concret** : Dans Boutik, on n'efface jamais un produit, un client ou un employé : on l'archive (`ProduitArchive`). Il ne s'affiche plus à la caisse mais son historique reste, et on peut le désarchiver. Exception voulue : une image supprimée de la collection est vraiment effacée, seule sa trace reste au journal.

**Termes liés** : [Événement immuable](#evenement-immuable-immutable-event), [Synchronisation](#synchronisation).

---

## Transaction

**Définition simple** : Un groupe d'opérations sur la base de données qui réussissent toutes ensemble ou échouent toutes ensemble. Si une coupure survient au milieu, rien n'est à moitié fait.

**Contexte / exemple concret** : Quand Boutik crée un produit avec un stock de départ, les deux événements (`ProduitCree` et `StockMouvemente`) sont écrits dans une même transaction. L'ajout d'une image écrit ses octets et son événement dans une transaction aussi.

**Termes liés** : [Base de données SQLite](#base-de-donnees-sqlite-sqlite), [Requête SQL](#requete-sql-sql-query).

---

## Déclencheur (*Trigger SQL*)

**Définition simple** : Une règle rangée dans la base de données, qui s'exécute d'elle-même quand une ligne est ajoutée, modifiée ou supprimée. Elle peut vérifier quelque chose, ou refuser l'opération.

**Contexte / exemple concret** : Le journal de Boutik est protégé par des déclencheurs : toute tentative de modifier (`UPDATE`) ou d'effacer (`DELETE`) un événement est refusée par la base elle-même, même si le code se trompait.

**Termes liés** : [Événement immuable](#evenement-immuable-immutable-event), [Table](#table), [Défense en profondeur](#defense-en-profondeur-defense-in-depth).

---

## Index

**Définition simple** : Une table des matières que la base de données tient à jour, pour trouver des lignes sans les lire toutes. Comme l'index à la fin d'un livre.

**Contexte / exemple concret** : Boutik indexe les produits par image (`produits_projection_par_image`) : savoir quels produits utilisent une image est immédiat, même avec des milliers de produits. Les suggestions de saisie ont un index de mots (`saisie_mots`).

**Termes liés** : [Table](#table), [Requête SQL](#requete-sql-sql-query).

---

## Table

**Définition simple** : Dans une base de données, un tableau à colonnes fixes (nom, prix, stock…) où chaque ligne est un enregistrement.

**Contexte / exemple concret** : La base de Boutik contient notamment la table `events` (le journal), les tables de projection (`produits_projection`…) et `images_octets` (les octets des images, hors journal).

**Termes liés** : [Schéma](#schema-schema), [Index](#index), [Base de données SQLite](#base-de-donnees-sqlite-sqlite).

---

## Schéma (*Schema*)

**Définition simple** : La description de la structure d'une base de données : quelles tables, quelles colonnes, de quel type. Par extension, la forme attendue d'un message ou d'un événement.

**Contexte / exemple concret** : Chaque domaine de Boutik a son fichier `schema.ts` qui crée ses tables (`ensureProduitsProjectionSchema`…). La règle du projet : pas de changement de schéma d'événement sans l'annoncer.

**Termes liés** : [Table](#table), [Migration de schéma](#migration-de-schema-schema-migration).

---

## Migration de schéma (*Schema migration*)

**Définition simple** : Faire évoluer la structure d'une base déjà remplie (ajouter une colonne, une table) sans perdre les données existantes.

**Contexte / exemple concret** : Pour les images, Boutik ajoute la colonne `image_id` à la table des produits des bases existantes : le code regarde si elle manque (`PRAGMA table_info`) et l'ajoute (`ALTER TABLE … ADD COLUMN`).

**Termes liés** : [Schéma](#schema-schema), [Table](#table).

---

## Requête SQL (*SQL query*)

**Définition simple** : Une question ou un ordre écrit dans le langage SQL pour une base de données : « donne-moi les produits dont le stock est sous le seuil », « ajoute cette ligne ».

**Contexte / exemple concret** : `SELECT * FROM produits_projection WHERE archive = 0 ORDER BY nom` : la liste des produits actifs, triée par nom, que Boutik affiche dans le Stock.

**Termes liés** : [Table](#table), [Index](#index), [Base de données SQLite](#base-de-donnees-sqlite-sqlite).

---

## Croissance quadratique (*Quadratic growth*)

**Définition simple** : Quand le travail grandit comme le carré de la quantité de données : deux fois plus de données, quatre fois plus de travail ; dix fois plus, cent fois plus. Invisible sur de petits volumes, catastrophique sur les grands.

**Contexte / exemple concret** : Un piège évité dans Boutik : recalculer l'ardoise d'un client en relisant tout son historique à chaque nouvelle vente. Avec 10 ventes, c'est rapide ; avec 5 000, chaque vente relit tout. La projection de l'ardoise est mise à jour pas à pas à la place.

**Termes liés** : [Projection](#projection).

**Calcul** : Pour n éléments, le travail est proportionnel à n × n = n². Avec n = 1 000 : 1 000 000 d'opérations ; avec n = 10 000 : 100 000 000.

---

## Base de données SQLite (*SQLite*)

**Définition simple** : Un moteur de base de données qui tient dans un seul fichier, sans serveur à installer. Très fiable, utilisé dans les téléphones et les navigateurs.

**Contexte / exemple concret** : Toutes les données de Boutik tiennent dans un fichier, `boutik.db`, dans le dossier de l'application. Il est chiffré par SQLCipher.

**Termes liés** : [SQLCipher](#sqlcipher), [Table](#table), [Requête SQL](#requete-sql-sql-query).

---

## SQLCipher

**Définition simple** : Une version de SQLite qui chiffre tout le fichier de la base : sans la clé, le fichier n'est qu'un bruit illisible, même ouvert avec un autre programme.

**Contexte / exemple concret** : Boutik l'utilise via le module `better-sqlite3-multiple-ciphers`, en mode SQLCipher 4 (AES-256 sur chaque page, plus un contrôle d'intégrité HMAC-SHA512). Voir « Chiffrement des données de Boutik » pour la chaîne complète.

**Termes liés** : [Chiffrement des données de Boutik](#chiffrement-des-donnees-de-boutik-encryption-at-rest), [AES-256](#aes-256-advanced-encryption-standard), [Base de données SQLite](#base-de-donnees-sqlite-sqlite), [Clé de chiffrement](#cle-de-chiffrement-encryption-key).

---

## Journal WAL (*Write-Ahead Logging*)

**Définition simple** : Une façon pour SQLite d'enregistrer les modifications : au lieu de réécrire la base à chaque fois, il les ajoute à la suite dans un fichier à part (le « journal WAL »), puis les reporte dans la base de temps en temps. Écrire à la suite coûte moins cher au disque que créer puis effacer un fichier à chaque opération. Un petit fichier d'index (`-shm`) aide à retrouver les pages rangées dans le journal.

**Contexte / exemple concret** : Depuis septembre 2026, Boutik ouvre sa base en mode WAL (`main/base-connexion.ts`) : à côté de `boutik.db` apparaissent `boutik.db-wal` et `boutik.db-shm`. SQLCipher chiffre aussi les pages du journal ; `tests/base-connexion.test.ts` vérifie qu'aucun texte saisi ne s'y lit en clair. Conséquence : une sauvegarde ne copie jamais `boutik.db` seul.

**Termes liés** : [Journal de retour arrière](#journal-de-retour-arriere-rollback-journal), [Report du journal](#report-du-journal-checkpoint), [Écriture synchrone sur le disque](#ecriture-synchrone-sur-le-disque-fsync-pragma-synchronous), [Sauvegarde de la base](#sauvegarde-de-la-base-database-backup), [SQLCipher](#sqlcipher), [Transaction](#transaction).

---

## Journal de retour arrière (*Rollback journal*)

**Définition simple** : Le mode d'enregistrement par défaut de SQLite : avant de modifier la base, il copie les anciennes pages dans un fichier à part ; en cas de coupure, il les remet en place. Ce fichier est créé puis effacé à chaque transaction.

**Contexte / exemple concret** : Boutik utilisait ce mode jusqu'en septembre 2026. Sur la machine Windows de la CI, créer et effacer ce fichier à chaque écriture coûtait plus de 40 ms : 10 000 suggestions ajoutées une par une dépassaient 7 minutes. D'où le passage au journal WAL.

**Termes liés** : [Journal WAL](#journal-wal-write-ahead-logging), [Transaction](#transaction), [Base de données SQLite](#base-de-donnees-sqlite-sqlite).

---

## Report du journal (*Checkpoint*)

**Définition simple** : Le moment où SQLite recopie dans le fichier principal de la base les modifications accumulées dans le journal WAL. Il se fait tout seul de temps en temps et à la fermeture ; on peut aussi le demander, et vider le journal au passage (mode `TRUNCATE`).

**Contexte / exemple concret** : Quand le patron vide les suggestions de saisie ou supprime une image, Boutik demande un report complet (`wal_checkpoint(TRUNCATE)`) : les données effacées ne restent pas dans `boutik.db-wal`, même chiffrées.

**Termes liés** : [Journal WAL](#journal-wal-write-ahead-logging), [Sauvegarde de la base](#sauvegarde-de-la-base-database-backup).

---

## Écriture synchrone sur le disque (*fsync, PRAGMA synchronous*)

**Définition simple** : Obliger le système à vraiment graver les données sur le disque avant de continuer, au lieu de les garder un moment en mémoire. C'est plus lent, mais une coupure de courant juste après ne perd rien de ce qui a été validé.

**Contexte / exemple concret** : Boutik règle SQLite sur `synchronous = FULL` : chaque vente validée est sur le disque avant que la caisse rende la main. C'est important au Mali, où les coupures de courant sont fréquentes.

**Termes liés** : [Journal WAL](#journal-wal-write-ahead-logging), [Transaction](#transaction).

---

## Atomicité (*Atomicity, tout ou rien*)

**Définition simple** : Une opération est atomique quand elle se fait entièrement ou pas du tout, jamais à moitié. Dans une base de données, on l'obtient en mettant toutes les écritures dans une seule transaction.

**Contexte / exemple concret** : L'import de produits de Boutik est atomique depuis septembre 2026 : toutes les lignes sont vérifiées, puis écrites dans une seule transaction. Si le main refuse une ligne, rien n'est importé et l'écran le dit. Avant, chaque ligne était un appel séparé et un import pouvait s'arrêter au milieu.

**Termes liés** : [Transaction](#transaction), [Journal WAL](#journal-wal-write-ahead-logging).

---

## Sauvegarde de la base (*Database backup*)

**Définition simple** : Une copie de la base mise de côté pour la retrouver après une panne, un vol ou une erreur. Pour servir, la copie doit être cohérente : prise à un instant où la base est complète.

**Contexte / exemple concret** : Avec le journal WAL, les dernières écritures de Boutik peuvent être dans `boutik.db-wal`. Une future sauvegarde ne devra donc jamais copier `boutik.db` seul : les trois fichiers ensemble, application fermée, ou l'API de sauvegarde de SQLite (`backup`), qui produit une copie cohérente même base ouverte.

**Termes liés** : [Journal WAL](#journal-wal-write-ahead-logging), [Report du journal](#report-du-journal-checkpoint), [Chiffrement des données de Boutik](#chiffrement-des-donnees-de-boutik-encryption-at-rest).

---

## Chiffrement des données de Boutik (*Encryption at rest*)

**Définition simple** : Comment Boutik protège les données sur le disque (« au repos ») : si quelqu'un vole l'ordinateur ou copie le fichier de la base, il ne peut rien lire.

**Contexte / exemple concret** : La chaîne complète :

1. Au premier lancement, Boutik tire une clé secrète de 256 bits au hasard (générateur cryptographique).
2. Cette clé est rangée dans le fichier `boutik.key`, elle-même chiffrée par le coffre du système : DPAPI sous Windows, le trousseau (libsecret, gnome-keyring ou KWallet) sous Linux, via `safeStorage` d'Electron. Seule la session Windows ou Linux de l'utilisateur peut la relire.
3. La base `boutik.db` est chiffrée par SQLCipher 4 avec cette clé : la clé passe par PBKDF2-HMAC-SHA512 (256 000 tours), puis chaque page du fichier est chiffrée en AES-256 et accompagnée d'un HMAC-SHA512, qui détecte toute altération.
4. Les mots de passe, PIN et codes de secours ne sont pas chiffrés mais hachés avec argon2id : même avec la base ouverte, on ne peut pas les relire.
5. Si le coffre du système manque (Linux sans trousseau), la clé est écrite en clair dans `boutik.key` (lisible par ce seul utilisateur) et un bandeau propose de réparer le coffre.

**Termes liés** : [SQLCipher](#sqlcipher), [AES-256](#aes-256-advanced-encryption-standard), [Clé de chiffrement](#cle-de-chiffrement-encryption-key), [Dérivation de clé](#derivation-de-cle-key-derivation-pbkdf2), [HMAC](#hmac-hash-based-message-authentication-code), [DPAPI](#dpapi-data-protection-api), [Trousseau de clés](#trousseau-de-cles-keyring-secret-service-libsecret-gnome-keyring-kwallet), [safeStorage](#safestorage), [Hachage](#hachage-hash-empreinte), [argon2id](#argon2id).

---

## AES-256 (*Advanced Encryption Standard*)

**Définition simple** : L'algorithme de chiffrement le plus utilisé au monde (banques, téléphones, messageries). Le « 256 » est la taille de la clé en bits : il y a 2²⁵⁶ clés possibles, bien trop pour les essayer toutes.

**Contexte / exemple concret** : C'est l'algorithme avec lequel SQLCipher chiffre chaque page de la base de Boutik.

**Termes liés** : [Chiffrement](#chiffrement-encryption), [SQLCipher](#sqlcipher), [Clé de chiffrement](#cle-de-chiffrement-encryption-key), [Force brute](#force-brute-brute-force).

---

## Chiffrement (*Encryption*)

**Définition simple** : Transformer des données lisibles en données illisibles à l'aide d'une clé ; seul celui qui a la clé peut faire l'opération inverse (déchiffrer). À ne pas confondre avec le hachage, qui ne se défait pas.

**Contexte / exemple concret** : Boutik chiffre toute sa base de données (voir « Chiffrement des données de Boutik »).

**Termes liés** : [Clé de chiffrement](#cle-de-chiffrement-encryption-key), [AES-256](#aes-256-advanced-encryption-standard), [Hachage](#hachage-hash-empreinte), [Chiffrement des données de Boutik](#chiffrement-des-donnees-de-boutik-encryption-at-rest).

---

## Clé de chiffrement (*Encryption key*)

**Définition simple** : Le secret (une suite de bits) qui permet de chiffrer et de déchiffrer. Quiconque a la clé peut lire les données : toute la sécurité repose sur sa protection.

**Contexte / exemple concret** : La clé de la base de Boutik (256 bits tirés au hasard) est dans `boutik.key`, protégée par le coffre du système (DPAPI ou trousseau Linux).

**Termes liés** : [Chiffrement](#chiffrement-encryption), [Chiffrement des données de Boutik](#chiffrement-des-donnees-de-boutik-encryption-at-rest), [safeStorage](#safestorage).

---

## Dérivation de clé (*Key derivation, PBKDF2*)

**Définition simple** : Fabriquer une clé de chiffrement à partir d'un secret (un mot de passe, une phrase) par un calcul volontairement long, répété des centaines de milliers de fois. Pour l'utilisateur, c'est une fraction de seconde ; pour un voleur qui essaie des milliards de secrets, ce sont des siècles. PBKDF2 est la méthode la plus répandue.

**Contexte / exemple concret** : SQLCipher 4 passe le secret de Boutik par PBKDF2-HMAC-SHA512, 256 000 tours, avant de s'en servir pour chiffrer.

**Termes liés** : [Chiffrement des données de Boutik](#chiffrement-des-donnees-de-boutik-encryption-at-rest), [Force brute](#force-brute-brute-force), [HMAC](#hmac-hash-based-message-authentication-code).

---

## HMAC (*Hash-based Message Authentication Code*)

**Définition simple** : Une « signature » calculée avec une clé secrète et une fonction de hachage, collée à des données. Si quelqu'un modifie les données sans avoir la clé, la signature ne correspond plus : l'altération est détectée.

**Contexte / exemple concret** : SQLCipher ajoute un HMAC-SHA512 à chaque page de la base de Boutik : un fichier trafiqué est refusé à l'ouverture au lieu de donner des données fausses.

**Termes liés** : [Hachage](#hachage-hash-empreinte), [Chiffrement des données de Boutik](#chiffrement-des-donnees-de-boutik-encryption-at-rest), [Signature cryptographique](#signature-cryptographique-digital-signature).

---

## Hachage (*Hash, empreinte*)

**Définition simple** : Un calcul qui transforme n'importe quelle donnée (un mot de passe, une photo) en une courte suite de caractères, toujours la même pour la même donnée, qu'on appelle son empreinte. On ne peut pas revenir de l'empreinte à la donnée, et deux données différentes n'ont en pratique jamais la même empreinte.

**Contexte / exemple concret** : Boutik s'en sert de deux façons : pour les mots de passe (argon2id, volontairement lent) et pour identifier les images (SHA-256, rapide) : la même photo donne la même empreinte, donc une seule copie.

**Termes liés** : [argon2id](#argon2id), [Adressage par contenu](#adressage-par-contenu-content-addressing), [Chiffrement](#chiffrement-encryption), [bcrypt](#bcrypt), [SHA-256](#sha-256).

---

## SHA-256

**Définition simple** : Une fonction de hachage très répandue, qui donne une empreinte de 256 bits (64 caractères hexadécimaux) pour n'importe quelle donnée. Rapide : faite pour vérifier des fichiers, pas pour protéger des mots de passe.

**Contexte / exemple concret** : L'identifiant d'une image de Boutik est le SHA-256 de ses octets WebP, par exemple `b1a723a3037f…`.

**Termes liés** : [Hachage](#hachage-hash-empreinte), [Adressage par contenu](#adressage-par-contenu-content-addressing).

---

## argon2id

**Définition simple** : Une fonction de hachage conçue pour les mots de passe : elle est volontairement lente et demande beaucoup de mémoire, ce qui rend très coûteux d'essayer des milliards de mots de passe. Elle a gagné le concours international de 2015 (Password Hashing Competition).

**Contexte / exemple concret** : Boutik hache avec argon2id le mot de passe du patron, le PIN des employés et les codes de secours (module `argon2`, 64 Mo par calcul). Seule l'empreinte est gardée : elle commence par `$argon2id$`.

**Termes liés** : [Hachage](#hachage-hash-empreinte), [bcrypt](#bcrypt), [Force brute](#force-brute-brute-force), [Chiffrement des données de Boutik](#chiffrement-des-donnees-de-boutik-encryption-at-rest).

---

## bcrypt

**Définition simple** : Une fonction de hachage de mots de passe plus ancienne (1999), lente elle aussi, encore très répandue. Elle résiste moins bien qu'argon2id aux attaques avec des cartes graphiques, car elle demande peu de mémoire.

**Contexte / exemple concret** : Envisagée puis écartée pour Boutik au profit d'argon2id.

**Termes liés** : [argon2id](#argon2id), [Hachage](#hachage-hash-empreinte).

---

## Adressage par contenu (*Content addressing*)

**Définition simple** : Identifier une donnée par son empreinte (son hachage) plutôt que par un nom ou un numéro. Deux copies identiques ont forcément le même identifiant, et on peut vérifier qu'une donnée reçue n'a pas été abîmée en recalculant son empreinte.

**Contexte / exemple concret** : Chaque image de Boutik a pour identifiant le SHA-256 de ses octets. Ajouter deux fois la même photo ne crée qu'une image ; plus tard, un poste qui reçoit une image par synchronisation vérifiera qu'elle correspond bien à l'empreinte demandée.

**Termes liés** : [Hachage](#hachage-hash-empreinte), [SHA-256](#sha-256), [Synchronisation](#synchronisation).

---

## Signature cryptographique (*Digital signature*)

**Définition simple** : Une preuve mathématique, faite avec une clé privée, qu'un message vient bien de son auteur et n'a pas été modifié. N'importe qui peut la vérifier avec la clé publique, sans pouvoir la fabriquer.

**Contexte / exemple concret** : Prévue pour les licences de Boutik : Kelenpe signerait chaque fichier de licence ; l'application, qui ne connaît que la clé publique, vérifie la signature hors ligne. Personne ne peut fabriquer une licence sans la clé privée.

**Termes liés** : [Clé publique / clé privée](#cle-publique-cle-privee-public-private-key), [Ed25519](#ed25519), [Licence logicielle](/business/#licence-logicielle-software-license).

---

## Clé publique / clé privée (*Public / private key*)

**Définition simple** : Une paire de clés liées mathématiquement. La clé privée reste secrète chez son propriétaire ; la clé publique peut être donnée à tout le monde. Ce que l'une signe, seule l'autre peut le vérifier.

**Contexte / exemple concret** : Pour les licences de Boutik, la clé privée resterait chez Kelenpe (pour signer), la clé publique serait intégrée à l'application (pour vérifier).

**Termes liés** : [Signature cryptographique](#signature-cryptographique-digital-signature), [Ed25519](#ed25519).

---

## Ed25519

**Définition simple** : Un algorithme moderne de signature cryptographique : rapide, avec des signatures courtes (64 octets), et réputé difficile à mal utiliser.

**Contexte / exemple concret** : Algorithme retenu pour signer les futures licences de Boutik ; Node.js le fournit d'origine (`crypto.sign`), sans dépendance à ajouter.

**Termes liés** : [Signature cryptographique](#signature-cryptographique-digital-signature), [Clé publique / clé privée](#cle-publique-cle-privee-public-private-key).

---

## Entropie (*Entropy*)

**Définition simple** : La mesure de l'imprévisibilité d'un secret, comptée en bits. Chaque bit double le nombre d'essais nécessaires pour le deviner : 40 bits, c'est mille milliards de possibilités ; 80 bits, mille milliards de fois plus.

**Contexte / exemple concret** : Un code de secours de Boutik a 16 caractères tirés parmi 31 symboles, soit environ 79 bits d'entropie : impossible à deviner, même avec des années d'essais.

**Termes liés** : [Force brute](#force-brute-brute-force), [Générateur cryptographique](#generateur-cryptographique-csprng).

**Calcul** : entropie (bits) = nombre de caractères × log₂(nombre de symboles possibles). Pour Boutik : 16 × log₂(31) ≈ 16 × 4,95 ≈ 79 bits.

---

## Générateur cryptographique (*CSPRNG*)

**Définition simple** : Un tireur de nombres au hasard assez imprévisible pour la sécurité : même en connaissant tous les tirages précédents, on ne peut pas deviner le suivant. Le hasard ordinaire d'un programme (celui d'un jeu) ne suffit pas.

**Contexte / exemple concret** : Boutik tire sa clé de base (`randomBytes(32)`), ses UUID et ses codes de secours avec le générateur cryptographique de Node.js.

**Termes liés** : [Entropie](#entropie-entropy), [UUID](#uuid-universally-unique-identifier), [Clé de chiffrement](#cle-de-chiffrement-encryption-key).

---

## Force brute (*Brute force*)

**Définition simple** : Deviner un secret en essayant toutes les possibilités, une par une, le plus vite possible. On s'en protège avec des secrets longs (beaucoup d'entropie), des calculs lents (argon2id) et des attentes entre les essais.

**Contexte / exemple concret** : Contre la force brute sur l'écran de connexion de Boutik : argon2id rend chaque essai coûteux, et les codes de secours imposent une attente croissante après 3 échecs.

**Termes liés** : [Entropie](#entropie-entropy), [argon2id](#argon2id), [Attente croissante](#attente-croissante-backoff).

---

## Attente croissante (*Backoff*)

**Définition simple** : Après chaque échec, on fait attendre plus longtemps avant l'essai suivant (souvent en doublant). Quelques erreurs de frappe ne gênent pas ; des milliers d'essais deviennent impossibles.

**Contexte / exemple concret** : Codes de secours de Boutik (`limiteur-secours.ts`) : aucune attente pour les 3 premiers échecs, puis 30 secondes, qui doublent à chaque nouvel échec.

**Termes liés** : [Force brute](#force-brute-brute-force), [Rate limiting](/devops/#rate-limiting-limitation-de-debit).

**Calcul** : attente = 30 s × 2^(échecs − 4) à partir du 4ᵉ échec : 30 s, 60 s, 2 min, 4 min…

---

## Énumération de comptes (*Account enumeration*)

**Définition simple** : Une fuite d'information qui permet à un attaquant de savoir si un compte existe, par exemple parce que le message d'erreur diffère (« compte inconnu » ou « mauvais mot de passe »). Il sait alors sur qui concentrer ses essais.

**Contexte / exemple concret** : Boutik répond de la même façon, et dans le même temps, que le compte existe ou non (voir « Délai uniformisé »).

**Termes liés** : [Délai uniformisé](#delai-uniformise-timing-attack-protection), [Force brute](#force-brute-brute-force).

---

## Délai uniformisé (*Timing attack protection*)

**Définition simple** : Faire durer une vérification toujours le même temps, qu'elle réussisse ou échoue vite. Sinon, un attaquant qui chronomètre les réponses peut deviner des choses : c'est une attaque temporelle.

**Contexte / exemple concret** : Quand un compte n'existe pas, Boutik calcule quand même un hash argon2id factice (`hashFacticePourDelai` dans `auth.ts`) : la réponse prend le même temps que pour un vrai compte.

**Termes liés** : [Énumération de comptes](#enumeration-de-comptes-account-enumeration), [argon2id](#argon2id).

---

## Défense en profondeur (*Defense in depth*)

**Définition simple** : Empiler plusieurs protections indépendantes, pour qu'une seule faille ne suffise pas. Comme une maison avec une clôture, une porte fermée et un coffre.

**Contexte / exemple concret** : Dans Boutik, l'interface cache les écrans interdits, mais le processus principal revérifie chaque demande (`gererProtege`), et la base refuse elle-même de modifier le journal (déclencheurs). Les règles métier sont vérifiées dans l'interface et à nouveau dans le main.

**Termes liés** : [Surface d'attaque](#surface-d-attaque-attack-surface), [Validation côté serveur / côté client](#validation-cote-serveur-cote-client-server-side-client-side-validation), [Déclencheur](#declencheur-trigger-sql), [Permissions et modules](#permissions-et-modules).

---

## Surface d'attaque (*Attack surface*)

**Définition simple** : L'ensemble des points par lesquels un attaquant peut essayer d'entrer ou d'agir : chaque canal, chaque champ de saisie, chaque dépendance. Moins il y en a, mieux c'est.

**Contexte / exemple concret** : Boutik réduit la sienne : aucun serveur à l'écoute, les outils de développement retirés de l'exécutable, le renderer sans accès direct au système (contextBridge), aucune dépendance ajoutée sans l'annoncer.

**Termes liés** : [Défense en profondeur](#defense-en-profondeur-defense-in-depth), [contextBridge](#contextbridge), [Dépendance](/devops/#dependance-dependency).

---

## Validation côté serveur / côté client (*Server-side / client-side validation*)

**Définition simple** : Vérifier qu'une saisie est correcte. Côté client (l'interface), c'est pour aider l'utilisateur tout de suite ; côté serveur (ici, le processus principal), c'est la vraie protection, car l'interface peut être contournée.

**Contexte / exemple concret** : Dans Boutik, l'écran de vente refuse une quantité négative (confort), et `regles-metier.ts` la refuse aussi dans le main, avant d'écrire le moindre événement (sécurité). L'e2e « validation » vérifie ces refus du main.

**Termes liés** : [Défense en profondeur](#defense-en-profondeur-defense-in-depth), [Architecture Electron](#architecture-electron-main-renderer-preload).

---

## RBAC (*Role-Based Access Control*)

**Définition simple** : Contrôle d'accès par rôle : on ne donne pas des droits personne par personne, mais à des rôles (patron, caissier…), puis on attribue un rôle à chaque personne.

**Contexte / exemple concret** : Boutik combine un rôle (patron ou employé) et des modules (ventes, stock, comptabilité, rapports) : un employé n'accède qu'aux modules cochés pour lui. Voir « Permissions et modules ».

**Termes liés** : [Permissions et modules](#permissions-et-modules), [Authentification JWT / Session](#authentification-jwt-session).

---

## Permissions et modules

**Définition simple** : Dans Boutik, les droits d'un employé sont découpés en modules : ventes, stock, comptabilité, rapports. Le patron a tout ; un employé n'a que les modules qu'on lui a donnés.

**Contexte / exemple concret** : Chaque canal IPC sensible est rattaché à un module dans `main/acces.ts` (par exemple `boutik:images:ajouter` → `stock`) et vérifié par `gererProtege`. Un caissier sans le module stock voit les images à la caisse, mais ne peut pas ouvrir la collection.

**Termes liés** : [RBAC](#rbac-role-based-access-control), [Canal IPC](#canal-ipc-ipc-channel), [Défense en profondeur](#defense-en-profondeur-defense-in-depth).

---

## Phone-home

**Définition simple** : Quand un logiciel « appelle la maison » : il contacte, souvent en arrière-plan, un serveur de son éditeur (vérifier une licence, envoyer des statistiques).

**Contexte / exemple concret** : Boutik n'en fait pas : aucune connexion Internet n'est nécessaire, et les licences prévues se vérifient hors ligne par signature.

**Termes liés** : [Hors ligne d'abord](#hors-ligne-d-abord-offline-first), [Signature cryptographique](#signature-cryptographique-digital-signature).

---

## Backoffice

**Définition simple** : L'outil interne de l'éditeur, invisible pour les clients, qui sert à gérer l'activité : clients, licences, paiements, support.

**Contexte / exemple concret** : Prévu pour Kelenpe : émettre et révoquer les licences de Boutik, suivre les postes facturables.

**Termes liés** : [Licence logicielle](/business/#licence-logicielle-software-license), [Révocation de licence](/business/#revocation-de-licence-license-revocation).

---

## API (*Application Programming Interface*)

**Définition simple** : Une liste d'opérations qu'un programme met à disposition d'autres programmes, avec la façon de les appeler. C'est un contrat : « appelle-moi comme ceci, je te réponds comme cela ».

**Contexte / exemple concret** : Dans Boutik, `window.boutik` est l'API que le processus principal offre à l'interface : `boutik.produits.creerProduit(…)`, `boutik.images.lister(…)`… Son contrat est écrit dans `preload/index.d.ts`.

**Termes liés** : [IPC](#ipc-inter-process-communication), [Canal IPC](#canal-ipc-ipc-channel), [contextBridge](#contextbridge).

---

## Canal IPC (*IPC channel*)

**Définition simple** : Un nom de message, comme une ligne téléphonique dédiée, sur lequel l'interface envoie une demande au processus principal et attend la réponse.

**Contexte / exemple concret** : Boutik nomme ses canaux `boutik:domaine:action` : `boutik:produits:creer`, `boutik:images:supprimer`… Chaque canal d'écriture est déclaré dans `acces.ts` avec le module qu'il exige.

**Termes liés** : [IPC](#ipc-inter-process-communication), [Handler](#handler-gestionnaire), [Permissions et modules](#permissions-et-modules).

---

## Handler (*Gestionnaire*)

**Définition simple** : La fonction qui « prend en charge » un message ou un événement quand il arrive : on l'enregistre une fois, et le système l'appelle chaque fois que le message se présente.

**Contexte / exemple concret** : Dans `main/index.ts`, `gererProtege("boutik:images:ajouter", (_event, octets, nom) => ajouterImage(…))` enregistre le handler du canal : il vérifie les droits, puis traite la demande.

**Termes liés** : [Canal IPC](#canal-ipc-ipc-channel), [Boucle d'événements et tâche bloquante](#boucle-d-evenements-et-tache-bloquante-event-loop-blocking-task).

---

## contextBridge

**Définition simple** : L'outil d'Electron qui permet au preload d'exposer à l'interface quelques fonctions choisies, et rien d'autre. Le code de la page ne voit ni Node.js ni les fichiers : seulement ce pont.

**Contexte / exemple concret** : Le preload de Boutik expose `window.boutik` avec `contextBridge.exposeInMainWorld`. Même si une page était compromise, elle ne pourrait appeler que ces fonctions, toutes revérifiées par le main.

**Termes liés** : [Architecture Electron](#architecture-electron-main-renderer-preload), [Surface d'attaque](#surface-d-attaque-attack-surface), [API](#api-application-programming-interface).

---

## Asynchrone / synchrone (*Asynchronous / synchronous*)

**Définition simple** : Une opération synchrone bloque tout jusqu'à ce qu'elle soit finie, comme attendre au téléphone. Une opération asynchrone est lancée, et le programme continue ; on est prévenu quand elle se termine, comme un SMS qui arrive plus tard.

**Contexte / exemple concret** : Dans Boutik, l'impression d'un ticket est asynchrone : la caisse reste utilisable pendant que le ticket part. L'essai d'impression sous Windows a montré le piège inverse : un appel synchrone bloquait Node pendant 6 secondes.

**Termes liés** : [Promesse et await](#promesse-et-await-promise), [Boucle d'événements et tâche bloquante](#boucle-d-evenements-et-tache-bloquante-event-loop-blocking-task).

---

## Promesse et await (*Promise*)

**Définition simple** : Une promesse est une valeur « à venir » : le résultat d'une opération asynchrone pas encore terminée. `await` veut dire « attends ici que la promesse soit tenue, puis continue », sans bloquer le reste du programme.

**Contexte / exemple concret** : `const resultat = await boutik.images.ajouter(octets, nom)` : l'interface attend que le main ait préparé l'image, sans figer l'écran, qui affiche « Préparation de l'image… ».

**Termes liés** : [Asynchrone / synchrone](#asynchrone-synchrone-asynchronous-synchronous), [Boucle d'événements et tâche bloquante](#boucle-d-evenements-et-tache-bloquante-event-loop-blocking-task).

---

## Fil d'exécution (*Thread*)

**Définition simple** : Une « ligne de travail » dans un programme. Un programme peut en avoir plusieurs qui avancent en parallèle, sur plusieurs cœurs du processeur.

**Contexte / exemple concret** : JavaScript n'a qu'un fil principal par processus : un calcul long y bloque tout. Les essais de détourage de Boutik ont limité le moteur à 2 fils pour simuler un PC modeste.

**Termes liés** : [Worker](#worker), [Boucle d'événements et tâche bloquante](#boucle-d-evenements-et-tache-bloquante-event-loop-blocking-task), [utilityProcess](#utilityprocess).

---

## utilityProcess

**Définition simple** : Un processus secondaire qu'Electron sait lancer, pour faire un travail lourd hors du processus principal sans le bloquer ; il communique par messages.

**Contexte / exemple concret** : Piste pour Boutik si le traitement des images (≈ 0,6 s par grande photo) devait gêner : le déplacer dans un utilityProcess.

**Termes liés** : [Worker](#worker), [Fil d'exécution](#fil-d-execution-thread), [Architecture Electron](#architecture-electron-main-renderer-preload).

---

## Boucle d'événements et tâche bloquante (*Event loop, blocking task*)

**Définition simple** : JavaScript traite ses travaux un par un dans une boucle : un clic, une réponse, un minuteur… Si une tâche dure longtemps (une « tâche bloquante »), tout le reste attend derrière : l'écran se fige. Au-delà de 50 ms, on parle de tâche longue (*long task*).

**Contexte / exemple concret** : Pour la grille de 1 000 images, Boutik mesure les tâches longues et les a réduites à 106 ms au pire, en n'affichant que 60 vignettes à la fois et en découpant le rendu.

**Termes liés** : [Asynchrone / synchrone](#asynchrone-synchrone-asynchronous-synchronous), [Fil d'exécution](#fil-d-execution-thread).

---

## Délai d'attente (*Timeout*)

**Définition simple** : Le temps maximum qu'on accepte d'attendre une réponse ; passé ce délai, on abandonne et on signale l'échec au lieu d'attendre indéfiniment.

**Contexte / exemple concret** : Quand Boutik envoie un ticket à une imprimante réseau éteinte, un délai d'attente évite de bloquer : la vente est enregistrée, et le bouton « Réessayer » apparaît.

**Termes liés** : [Asynchrone / synchrone](#asynchrone-synchrone-asynchronous-synchronous), [TCP](#tcp-transmission-control-protocol).

---

## Fonction pure (*Pure function*)

**Définition simple** : Une fonction qui, pour les mêmes entrées, donne toujours le même résultat, et ne touche à rien d'autre (ni fichier, ni écran, ni base). Facile à tester et à comprendre.

**Contexte / exemple concret** : `shared/` de Boutik ne contient que des fonctions pures, comme `detecterFormatImage` ou la construction des octets d'un ticket (`ticket.ts`), testée contre des fichiers de référence.

**Termes liés** : [Test unitaire](/devops/#test-unitaire-unit-test), [Fichier de référence](/devops/#fichier-de-reference-golden-file).

---

## Refactorisation (*Refactor*)

**Définition simple** : Réorganiser du code pour qu'il soit plus clair ou plus facile à faire évoluer, sans changer ce qu'il fait pour l'utilisateur.

**Contexte / exemple concret** : Exemple dans Boutik : extraire la grille d'images dans un composant `GrilleImages` réutilisé par l'onglet Images et la fenêtre de choix.

**Termes liés** : [Code mort](#code-mort-dead-code), [Test de régression](/devops/#test-de-regression-regression-test).

---

## Code mort (*Dead code*)

**Définition simple** : Du code qui n'est plus jamais exécuté ni utilisé. Il encombre, trompe la lecture, et peut cacher des failles.

**Contexte / exemple concret** : Quand la collection d'images est arrivée, l'ancienne compression dans l'interface (`image-produit.ts`) est devenue du code mort : elle a été supprimée. Les outils de dev sont retirés de l'exécutable comme du code mort (voir « Build de développement / de production »).

**Termes liés** : [Refactorisation](#refactorisation-refactor), [Build de développement / de production](/devops/#build-de-developpement-de-production-development-production-build).

---

## TCP (*Transmission Control Protocol*)

**Définition simple** : La règle de communication de base d'Internet et des réseaux locaux pour échanger des données de façon fiable : tout arrive, dans l'ordre, ou l'erreur est signalée.

**Contexte / exemple concret** : Une imprimante de tickets réseau reçoit les octets ESC/POS de Boutik par TCP, sur le port 9100.

**Termes liés** : [Port](#port), [Socket](#socket), [Adresse IP](#adresse-ip-ip-address).

---

## Port

**Définition simple** : Un numéro (de 0 à 65 535) qui désigne un service précis sur un appareil. L'adresse IP indique l'immeuble, le port indique l'appartement.

**Contexte / exemple concret** : Les imprimantes de tickets écoutent sur le port 9100 ; l'émulateur de développement de Boutik affiche les tickets reçus sur le port 8089.

**Termes liés** : [TCP](#tcp-transmission-control-protocol), [Adresse IP](#adresse-ip-ip-address), [Socket](#socket).

---

## Socket

**Définition simple** : Un point de connexion ouvert par un programme pour échanger des données sur le réseau : un « combiné téléphonique » branché sur une adresse IP et un port.

**Contexte / exemple concret** : Pour imprimer sur une imprimante réseau, Boutik ouvre un socket TCP vers son adresse et le port 9100, écrit les octets du ticket, puis le ferme.

**Termes liés** : [TCP](#tcp-transmission-control-protocol), [Port](#port).

---

## Adresse IP (*IP address*)

**Définition simple** : Le numéro qui identifie un appareil sur un réseau, par exemple `192.168.1.50` sur le réseau local de la boutique.

**Contexte / exemple concret** : Dans Réglages → Imprimante, on donne l'adresse IP de l'imprimante réseau ; en développement, `127.0.0.1` désigne l'ordinateur lui-même (où tourne l'émulateur).

**Termes liés** : [Port](#port), [LAN](#lan-local-area-network), [TCP](#tcp-transmission-control-protocol).

---

## SNMP (*Simple Network Management Protocol*)

**Définition simple** : Un protocole pour interroger l'état d'un appareil réseau (imprimante, routeur) : en ligne, à court de papier, capot ouvert…

**Contexte / exemple concret** : Windows l'utilise pour surveiller les imprimantes réseau ; les tests d'impression Windows de Boutik créent leurs ports sans SNMP, car leur faux serveur n'y répond pas.

**Termes liés** : [Port](#port), [File d'impression](/devops/#file-d-impression-print-spooler).

---

## mDNS (*Multicast DNS*)

**Définition simple** : Une façon, pour les appareils d'un réseau local, de s'annoncer et de se trouver par leur nom (« imprimante-caisse.local ») sans serveur central.

**Contexte / exemple concret** : Piste pour Boutik : découvrir automatiquement les imprimantes, ou les autres caisses pour la synchronisation, sans taper d'adresse IP.

**Termes liés** : [LAN](#lan-local-area-network), [Adresse IP](#adresse-ip-ip-address).

---

## LAN (*Local Area Network*)

**Définition simple** : Le réseau local : les appareils reliés au même routeur ou au même Wi-Fi, dans la boutique ou la maison, sans passer par Internet.

**Contexte / exemple concret** : L'imprimante réseau et, plus tard, les caisses synchronisées de Boutik communiquent sur le réseau local de la boutique.

**Termes liés** : [Adresse IP](#adresse-ip-ip-address), [mDNS](#mdns-multicast-dns), [Pair-à-pair](#pair-a-pair-peer-to-peer-p2p).

---

## WebSocket

**Définition simple** : Une connexion qui reste ouverte entre deux programmes pour échanger des messages dans les deux sens, à tout moment, sans redemander à chaque fois.

**Contexte / exemple concret** : Les tests e2e de Boutik pilotent l'application par une connexion WebSocket vers Chromium (le Chrome DevTools Protocol).

**Termes liés** : [Chrome DevTools Protocol](/devops/#chrome-devtools-protocol-cdp), [Socket](#socket).

---

## Bluetooth SPP (*Serial Port Profile*)

**Définition simple** : Un mode Bluetooth qui imite un câble série : l'appareil (une petite imprimante de tickets) apparaît comme un port série sans fil, dans lequel on écrit des octets.

**Contexte / exemple concret** : Certaines imprimantes thermiques portables le proposent ; Boutik s'en tient pour l'instant au réseau et à l'USB (via la file d'impression Windows).

**Termes liés** : [Imprimante thermique](/media/#imprimante-thermique-thermal-printer), [ESC/POS](/media/#esc-pos).

---

## DPAPI (*Data Protection API*)

**Définition simple** : Le coffre de Windows : il chiffre un secret de telle sorte que seule la même session Windows (le même utilisateur sur le même PC) peut le déchiffrer.

**Contexte / exemple concret** : Sous Windows, la clé de la base de Boutik est protégée par DPAPI, via `safeStorage` d'Electron.

**Termes liés** : [safeStorage](#safestorage), [Trousseau de clés](#trousseau-de-cles-keyring-secret-service-libsecret-gnome-keyring-kwallet), [Chiffrement des données de Boutik](#chiffrement-des-donnees-de-boutik-encryption-at-rest).

---

## Trousseau de clés (*Keyring, Secret Service, libsecret, gnome-keyring, KWallet*)

**Définition simple** : Le coffre à secrets de Linux, ouvert avec la session de l'utilisateur. Secret Service est la norme qui permet aux applications de lui parler, libsecret la bibliothèque qui l'utilise ; gnome-keyring (GNOME) et KWallet (KDE) sont deux coffres qui la respectent.

**Contexte / exemple concret** : Sous Linux, `safeStorage` range la clé de la base de Boutik dans ce trousseau. S'il manque (fréquent sous Hyprland), Boutik affiche un bandeau et propose de l'installer (commande passée par pkexec).

**Termes liés** : [safeStorage](#safestorage), [DPAPI](#dpapi-data-protection-api), [D-Bus](/devops/#d-bus), [polkit / pkexec](/devops/#polkit-pkexec).

---

## safeStorage

**Définition simple** : L'outil d'Electron qui chiffre une petite donnée avec le coffre du système : DPAPI sous Windows, le trousseau sous Linux, le Trousseau d'accès sous macOS.

**Contexte / exemple concret** : `safeStorage.encryptString(cle)` protège la clé de la base de Boutik dans `boutik.key`. `isEncryptionAvailable()` dit si le coffre est là ; sinon, repli sur une clé en clair et bandeau d'avertissement.

**Termes liés** : [DPAPI](#dpapi-data-protection-api), [Trousseau de clés](#trousseau-de-cles-keyring-secret-service-libsecret-gnome-keyring-kwallet), [Chiffrement des données de Boutik](#chiffrement-des-donnees-de-boutik-encryption-at-rest).

---

## JSON (*JavaScript Object Notation*)

**Définition simple** : Un format de texte très répandu pour écrire des données structurées : `{ "nom": "Riz", "prix": 500 }`. Lisible par un humain et par tous les langages.

**Contexte / exemple concret** : Le payload des événements de Boutik est stocké en JSON, comme les réglages du poste (`imprimante.json`, `affichage.json`, `suggestions.json`).

**Termes liés** : [Payload](#payload-charge-utile).

---

## WebAssembly (*Wasm*)

**Définition simple** : Un format de programme compact que les navigateurs et Node.js exécutent presque aussi vite que du code natif, sur tous les systèmes, sans rien compiler chez l'utilisateur.

**Contexte / exemple concret** : Boutik encode ses images en WebP avec libwebp compilée en WebAssembly (`@jsquash/webp`) : le même fichier `.wasm` sert sous Windows et Linux, sans module natif.

**Termes liés** : [Module natif](/devops/#module-natif-native-module), [SIMD](#simd-single-instruction-multiple-data), [Dépendance](/devops/#dependance-dependency).

---

## SIMD (*Single Instruction, Multiple Data*)

**Définition simple** : Des instructions du processeur qui traitent plusieurs nombres d'un coup (par exemple 4 pixels à la fois) : bien plus rapide pour les images et le son. Les vieux processeurs ne les ont pas toutes.

**Contexte / exemple concret** : `@jsquash/webp` fournit deux encodeurs, avec et sans SIMD ; Boutik teste le processeur (`wasm-feature-detect`) et prend le bon.

**Termes liés** : [WebAssembly](#webassembly-wasm).

---

## Protocole personnalisé (*Custom protocol*)

**Définition simple** : Une adresse d'un genre inventé par l'application (comme `https://`, mais à elle), que l'application sert elle-même au lieu d'aller sur Internet.

**Contexte / exemple concret** : Boutik sert ses images par `boutik-image://miniature/<empreinte>` : le processus principal lit les octets dans la base chiffrée et les renvoie, seulement si quelqu'un est connecté.

**Termes liés** : [Architecture Electron](#architecture-electron-main-renderer-preload), [Cache HTTP](#cache-http-http-cache-cache-control).

---

## Cache HTTP (*HTTP cache, Cache-Control*)

**Définition simple** : Les copies de fichiers que le navigateur garde pour ne pas les redemander. Le serveur indique, par un en-tête `Cache-Control`, si et combien de temps le fichier peut être gardé ; `no-store` interdit toute copie.

**Contexte / exemple concret** : Chromium range son cache sur le disque, non chiffré. Boutik envoie donc ses images avec `cache-control: no-store` : une image supprimée de la collection ne survit nulle part.

**Termes liés** : [Caching](#caching), [Protocole personnalisé](#protocole-personnalise-custom-protocol), [Chiffrement des données de Boutik](#chiffrement-des-donnees-de-boutik-encryption-at-rest).

---

## Effacement sécurisé (*secure_delete*)

**Définition simple** : Réglage de SQLite qui écrase par des zéros le contenu effacé, au lieu de simplement marquer la place comme libre (où l'ancien contenu resterait lisible jusqu'à être recouvert).

**Contexte / exemple concret** : Activé par Boutik (`PRAGMA secure_delete = ON`) : supprimer une image de la collection efface vraiment ses octets du fichier. Un test unitaire le vérifie sur une base non chiffrée.

**Termes liés** : [Base de données SQLite](#base-de-donnees-sqlite-sqlite), [Suppression logique](#suppression-logique-soft-delete-archivage-tombstone).

---

## Pagination

**Définition simple** : Découper une longue liste en pages qu'on demande l'une après l'autre, au lieu de tout charger d'un coup.

**Contexte / exemple concret** : La collection d'images de Boutik arrive par pages de 60 : la suivante est demandée quand on approche du bas de la grille.

**Termes liés** : [Chargement progressif](/frontend/#chargement-progressif-lazy-loading), [Défilement infini](/frontend/#defilement-infini-infinite-scroll).

---

## Déduplication (*Deduplication*)

**Définition simple** : Repérer les copies identiques d'une même donnée pour n'en garder qu'une.

**Contexte / exemple concret** : Boutik reconnaît une photo déjà ajoutée à son empreinte : l'ajouter une seconde fois (même depuis une autre fiche) reprend l'image existante, sans copie.

**Termes liés** : [Adressage par contenu](#adressage-par-contenu-content-addressing), [Hachage](#hachage-hash-empreinte).

---

## CORS (*Cross-Origin Resource Sharing*)

**Définition simple** : La règle des navigateurs qui empêche une page de lire des données venant d'une autre « origine » (un autre site, un autre protocole), sauf si celle-ci l'autorise par un en-tête (`Access-Control-Allow-Origin`). Sans cette autorisation, la page peut afficher une image, mais pas en lire les pixels.

**Contexte / exemple concret** : Le protocole `boutik-image://` de Boutik envoie cet en-tête : l'interface peut relire les pixels d'une image (les tests vérifient ainsi la transparence d'un détourage). Rien ne sort pour autant de l'application, et une session reste exigée.

**Termes liés** : [Protocole personnalisé](#protocole-personnalise-custom-protocol), [Content Security Policy](/frontend/#content-security-policy-csp).

---

## Tenseur (*Tensor*)

**Définition simple** : Un tableau de nombres à plusieurs dimensions, la forme dans laquelle un modèle d'IA reçoit et rend ses données. Une image en couleur devient par exemple un tenseur « 1 image × 3 couleurs × 320 lignes × 320 colonnes » (on note NCHW).

**Contexte / exemple concret** : Avant le détourage, Boutik transforme la photo réduite à 320 × 320 en tenseur de 307 200 nombres (`tenseurEntree`, dans `detourage/calcul.ts`) ; le modèle rend un tenseur de 320 × 320 valeurs, qui devient le masque.

**Termes liés** : [Modèle d'IA](/media/#modele-d-ia-ai-model-reseau-de-neurones), [Inférence](/media/#inference-inference), [Masque](/media/#masque-mask).

**Calcul** : nombre de valeurs = images × couleurs × hauteur × largeur. Pour U²-Net p : 1 × 3 × 320 × 320 = 307 200.

---

## Réserve mémoire (*Memory arena*)

**Définition simple** : Une grande zone de mémoire qu'un moteur réserve d'avance et garde pour lui, afin d'aller plus vite ensuite. Le prix : la mémoire reste occupée même quand le calcul est fini.

**Contexte / exemple concret** : Boutik désactive la réserve mémoire d'onnxruntime (`enableCpuMemArena: false`), comme dans l'essai de détourage ; de toute façon, le processus de calcul est arrêté après chaque image, ce qui rend toute sa mémoire.

**Termes liés** : [onnxruntime](/media/#onnxruntime), [utilityProcess](#utilityprocess).

---

## ClipboardItem

**Définition simple** : Un « paquet » pour le presse-papiers qui contient la même donnée sous un ou plusieurs formats (texte, image PNG…), à la manière de l'API du navigateur. Depuis Electron 44, le presse-papiers d'Electron se lit et s'écrit ainsi, de façon asynchrone.

**Contexte / exemple concret** : Le test Ctrl+V de Boutik met une image dans le presse-papiers avec `clipboard.write([new ClipboardItem({ "image/png": … })])` ; l'ancien `clipboard.writeImage` n'existe plus en Electron 44.

**Termes liés** : [Presse-papiers](/frontend/#presse-papiers-clipboard), [Format de presse-papiers](/frontend/#format-de-presse-papiers-clipboard-format), [Asynchrone / synchrone](#asynchrone-synchrone-asynchronous-synchronous).

---

## Fin de session Windows (*query-session-end*)

**Définition simple** : Le moment où Windows s'éteint, redémarre ou déconnecte l'utilisateur : il demande à chaque application si elle peut se fermer. Une application qui refuse apparaît dans l'écran « Ces applications empêchent l'arrêt ».

**Contexte / exemple concret** : Si un ticket est en cours, Boutik refuse cette fermeture (événement `query-session-end` d'Electron) et affiche sa confirmation : le commerçant choisit de rester ou de fermer.

**Termes liés** : [Fenêtre modale](/frontend/#fenetre-modale-modal-dialog), [Délai d'attente](#delai-d-attente-timeout).

---

## Traitement par lot (*Batch processing*)

**Définition simple** : Faire beaucoup d'opérations d'un coup plutôt qu'une par une : le coût fixe de chaque opération (appel, vérification, écriture sur le disque) n'est payé qu'une fois.

**Contexte / exemple concret** : L'import de produits de Boutik envoie toutes les lignes en un seul appel, écrites dans une seule transaction. Sur la CI Windows, l'ancienne méthode (une écriture par ligne) prenait 35,6 s pour 500 produits, soit 71 ms par produit.

**Termes liés** : [Transaction](#transaction), [Atomicité](#atomicite-atomicity-tout-ou-rien), [Journal WAL](#journal-wal-write-ahead-logging).

---

## Trace d'appels (*Stack trace*)

**Définition simple** : La liste des fonctions en cours au moment d'une erreur, de la plus profonde à la plus haute, avec pour chacune le fichier et la ligne. Elle montre le chemin qui a mené au problème.

**Contexte / exemple concret** : Quand un test de Boutik échoue, `node --test` affiche la trace : l'erreur EBUSY du job Windows pointait vers `tests/base-connexion.test.ts:63`. Une trace ne doit jamais contenir de secret, car elle finit souvent dans un journal.

**Termes liés** : [Journal d'erreurs](/devops/#journal-d-erreurs-log), [Caviardage des données sensibles](#caviardage-des-donnees-sensibles-redaction).

---

## Caviardage des données sensibles (*Redaction*)

**Définition simple** : Retirer ou masquer une donnée sensible (mot de passe, code, empreinte) avant de l'afficher, de l'envoyer ou de l'écrire dans un journal, pour qu'elle ne fuie pas par ce chemin.

**Contexte / exemple concret** : Toute lecture d'événement dans Boutik passe par `rowToEvent`, qui retire les champs de `CHAMPS_SENSIBLES` (`secretHash`, `hashes`). Le test e2e des codes de secours vérifie que ni les lectures de l'interface ni les journaux de l'app ne contiennent de code ou d'empreinte.

**Termes liés** : [Journal d'erreurs](/devops/#journal-d-erreurs-log), [Trace d'appels](#trace-d-appels-stack-trace).

---

## Erreur non rattrapée (*Uncaught exception*)

**Définition simple** : Une erreur qu'aucun morceau de code n'a prévu d'attraper (pas de `try … catch` autour). Elle remonte jusqu'au programme entier, qui peut s'arrêter ou continuer dans un état douteux.

**Contexte / exemple concret** : Boutik écoute ces erreurs dans le processus principal (`process.on("uncaughtException")`) et dans l'interface (`window.onerror`) : chacune est écrite dans le journal des erreurs avec sa trace d'appels, au lieu de disparaître.

**Termes liés** : [Promesse rejetée sans traitement](#promesse-rejetee-sans-traitement-unhandled-rejection), [Trace d'appels](#trace-d-appels-stack-trace), [Journal d'erreurs](/devops/#journal-d-erreurs-log).

---

## Promesse rejetée sans traitement (*Unhandled rejection*)

**Définition simple** : Une opération asynchrone (une promesse) qui échoue sans que personne n'attende son résultat ni ne traite l'échec. L'erreur est silencieuse : rien ne s'affiche, mais quelque chose n'a pas été fait.

**Contexte / exemple concret** : Boutik les capte dans le main (`unhandledRejection`) et dans l'interface (`unhandledrejection`) pour les écrire dans le journal des erreurs : c'est souvent la seule trace d'un enregistrement ou d'une impression qui n'a pas eu lieu.

**Termes liés** : [Promesse et await](#promesse-et-await-promise), [Erreur non rattrapée](#erreur-non-rattrapee-uncaught-exception).

---

## Lignes JSON (*JSON Lines*)

**Définition simple** : Un fichier où chaque ligne est un petit document JSON complet. On peut y ajouter une ligne sans relire le reste, et un programme peut le relire ligne par ligne, même si la dernière est abîmée.

**Contexte / exemple concret** : Le journal des erreurs de Boutik (`logs/boutik.log`) est en lignes JSON : date, niveau, source, message, contexte, trace. Le rapport de problème les relit ; plus tard, l'envoi direct au support pourra les reprendre telles quelles.

**Termes liés** : [JSON](#json-javascript-object-notation), [Journal d'erreurs](/devops/#journal-d-erreurs-log), [Rotation des journaux](/devops/#rotation-des-journaux-log-rotation).

---

## Identifiant technique (*Technical identifier*)

**Définition simple** : Un code sans signification (comme `3f2a9c10-1b2c-…`) qui désigne un objet de façon unique : il permet de le retrouver sans rien révéler de lui, contrairement à son nom.

**Contexte / exemple concret** : Le journal des erreurs de Boutik désigne produits, ventes et clients par leur identifiant technique, jamais par leur nom : le support peut suivre un problème sans voir qui a acheté quoi.

**Termes liés** : [UUID](#uuid-universally-unique-identifier), [Caviardage des données sensibles](#caviardage-des-donnees-sensibles-redaction), [Journal d'erreurs](/devops/#journal-d-erreurs-log).

---

## État incertain d'un processus (*Undefined state after an uncaught exception*)

**Définition simple** : Après une erreur non rattrapée, un programme a pu s'arrêter au milieu d'une opération : une donnée à moitié modifiée, une ressource restée ouverte. La documentation de Node prévient qu'il n'est alors plus sûr de continuer comme si de rien n'était.

**Contexte / exemple concret** : Quand le processus principal de Boutik rencontre une erreur non rattrapée, il l'écrit dans le journal puis conseille au commerçant de redémarrer (« Un problème est survenu. Nous vous conseillons de redémarrer Boutik. »), avec insistance si cela se répète trois fois en dix minutes.

**Termes liés** : [Erreur non rattrapée](#erreur-non-rattrapee-uncaught-exception), [Redémarrage contrôlé](#redemarrage-controle-controlled-restart).

---

## Redémarrage contrôlé (*Controlled restart*)

**Définition simple** : Relancer un programme proprement, par le même chemin qu'une fermeture normale : on prévient si un travail serait perdu, on laisse la possibilité de rester, puis on ferme et on relance.

**Contexte / exemple concret** : Le bouton « Redémarrer » de Boutik ferme la fenêtre comme la croix : si un ticket ou une saisie est en cours, la confirmation habituelle demande « Redémarrer Boutik ? » et « Rester dans Boutik » annule tout. Sinon l'exécutable se ferme et se relance ; un nouveau démarrage apparaît dans le journal.

**Termes liés** : [État incertain d'un processus](#etat-incertain-d-un-processus-undefined-state-after-an-uncaught-exception), [Erreur non rattrapée](#erreur-non-rattrapee-uncaught-exception).

---
