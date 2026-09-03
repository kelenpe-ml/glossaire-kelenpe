# Backend & architecture

Concepts de conception logicielle côté serveur, avec des exemples tirés de **Prodora Backend** (Kotlin/Spring Boot), **Reelforge** (Go, pipeline de transcodage) et **Gift** (microservices Spring Cloud).

[[toc]]

## System design

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

**Définition simple** : découper une application en plusieurs services indépendants, chacun responsable d'un domaine métier précis, communiquant entre eux par API — par opposition à un *monolithe* (une seule application qui fait tout).

**Contexte / exemple concret** : **Gift** (association caritative, Spring Cloud) illustre l'architecture microservices chez Kelenpe : `service-auth`, `service-gateway`, `service-cause`, `service-donation`, `service-activity`, `service-admin` — chaque service a son propre `pom.xml`, sa propre base de code, et communique via le `service-gateway` (voir ci-dessous).

**Termes liés** : [API Gateway](#api-gateway), [Découplage](#decouplage), [System design](#system-design).

---

## API Gateway

**Définition simple** : le point d'entrée unique d'une architecture microservices — il reçoit toutes les requêtes externes et les route vers le bon service interne, en centralisant souvent l'authentification, le rate limiting et le logging.

**Contexte / exemple concret** : `service-gateway` chez Gift joue ce rôle : le client (app Flutter) ne parle jamais directement à `service-donation` ou `service-cause`, tout transite par la gateway qui route vers le bon service backend.

**Termes liés** : [Microservices](#microservices).

---

## Pooling

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
