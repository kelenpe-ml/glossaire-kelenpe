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
