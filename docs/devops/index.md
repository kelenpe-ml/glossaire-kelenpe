# DevOps & infra

Le vocabulaire du déploiement et de l'exploitation, avec des repères vers l'infra Kelenpe (Coolify pour le PaaS auto-hébergé, Reelforge pour Kubernetes/Terraform).

[[toc]]

## CI/CD (*Intégration continue / Déploiement continu*)

**Définition simple** : l'automatisation des étapes entre "je pousse du code" et "le code tourne en production" — build, tests, puis déploiement — pour réduire les erreurs manuelles et accélérer les livraisons.

**Contexte / exemple concret** : Prodora Backend a un pipeline dans `.github/workflows/ci-cd.yml` qui s'exécute à chaque push — probablement build Kotlin/Maven + tests avant déploiement.

**Termes liés** : [Pipeline](#pipeline).

---

## Pipeline

**Définition simple** : une séquence d'étapes automatisées et enchaînées, chacune ne démarrant que si la précédente a réussi (build → test → package → déploiement, ou probe → transcode → package pour une vidéo).

**Contexte / exemple concret** : deux pipelines très différents chez Kelenpe illustrent le même concept : le pipeline **CI/CD** de Prodora Backend (code → prod), et le pipeline **de transcodage** de Reelforge (`probe → thumbnail → transcode → VMAF → package`, une vidéo brute → un flux streamable).

**Termes liés** : [CI/CD](#ci-cd-integration-continue-deploiement-continu).

---

## Conteneurisation (*Containerization*)

**Définition simple** : empaqueter une application avec toutes ses dépendances (runtime, librairies, config) dans une image portable et isolée (le plus souvent Docker), qui tourne identiquement sur n'importe quelle machine compatible.

**Contexte / exemple concret** : Prodora Backend a un `Dockerfile` et des `docker-compose.postgres.yml` / `docker-compose.redis.yml` pour ses dépendances locales ; Reelforge déploie ses workers via des images conteneurisées sur Kubernetes.

**Termes liés** : [Orchestration](#orchestration).

---

## Orchestration

**Définition simple** : la gestion automatisée du cycle de vie de multiples conteneurs — démarrage, arrêt, remplacement en cas de panne, répartition de charge, scaling — plutôt que de gérer chaque conteneur à la main.

**Contexte / exemple concret** : Reelforge utilise Kubernetes pour orchestrer ses workers GPU, avec un fichier `worker-hpa.yaml` (*Horizontal Pod Autoscaler* — règle qui ajoute/retire automatiquement des workers selon la charge de la queue SQS) et des *node taints* Terraform pour réserver un pool de nodes GPU dédié.

**Termes liés** : [Conteneurisation](#conteneurisation-containerization), [Autoscaling](#autoscaling).

---

## Autoscaling

**Définition simple** : ajuster automatiquement le nombre d'instances (workers, conteneurs) en fonction de la charge réelle, pour ne payer/consommer que ce qui est nécessaire à un instant donné.

**Contexte / exemple concret** : `worker-hpa.yaml` chez Reelforge est la définition Kubernetes de cet autoscaling pour les workers GPU de transcodage — plus il y a de vidéos en file SQS, plus de workers sont créés, dans une limite définie.

**Termes liés** : [Orchestration](#orchestration), [Scalabilité](/backend/#scalabilite-scalability).

---

## PaaS (*Platform as a Service*)

**Définition simple** : une plateforme qui gère l'infrastructure sous-jacente (serveurs, réseau, conteneurs) pour qu'on n'ait qu'à déployer son application — moins de contrôle qu'un serveur nu, mais beaucoup moins d'exploitation à gérer soi-même.

**Contexte / exemple concret** : Kelenpe utilise Coolify (`coolify_config/`, `coolify/`), un PaaS auto-hébergé open-source — l'équivalent "on-premise" d'un Heroku/Render, pertinent pour un fondateur qui veut garder le contrôle des coûts et des données sans gérer Kubernetes à la main pour chaque petit projet.

**Termes liés** : [Reverse proxy](#reverse-proxy).

---

## Reverse proxy

**Définition simple** : un serveur qui reçoit les requêtes entrantes à la place des applications finales, et les redirige vers le bon service en interne — utile pour le routing par nom de domaine, le HTTPS centralisé, ou l'équilibrage de charge.

**Contexte / exemple concret** : `coolify_config/prodora_backend_traefik.yml` référence Traefik, le reverse proxy utilisé par Coolify pour router le trafic vers les bons conteneurs selon le domaine appelé.

**Termes liés** : [PaaS](#paas-platform-as-a-service), [Load balancing](#load-balancing-repartition-de-charge).

---

## Load balancing (*Répartition de charge*)

**Définition simple** : distribuer les requêtes entrantes entre plusieurs instances d'un même service, pour qu'aucune ne soit surchargée et que le service reste disponible même si une instance tombe.

**Contexte / exemple concret** : dès que Prodora Backend tournerait en plusieurs instances (scaling horizontal), un load balancer (souvent intégré au reverse proxy comme Traefik) répartirait les requêtes entre elles.

**Termes liés** : [Reverse proxy](#reverse-proxy), [Scalabilité](/backend/#scalabilite-scalability).

---

## Observabilité (*Observability*)

**Définition simple** : la capacité à comprendre l'état interne d'un système à partir de ce qu'il expose vers l'extérieur (logs, métriques, traces) — au-delà du simple "monitoring" qui alerte sur des seuils connus, l'observabilité permet de diagnostiquer des problèmes imprévus.

**Contexte / exemple concret** : Reelforge documente un `runbook.md` (procédures de résolution d'incidents) — signe d'une réflexion sur l'observabilité et l'exploitation en production, pas juste sur le code qui marche en dev.

**Termes liés** : [Runbook](#runbook).

---

## Runbook

**Définition simple** : un document opérationnel qui décrit, étape par étape, comment diagnostiquer et résoudre un incident connu en production ("le service X ne répond plus : vérifier Y, puis Z").

**Contexte / exemple concret** : `prodora-v2/reelforge/docs/runbook.md` — la documentation opérationnelle du pipeline de transcodage, pour intervenir rapidement en cas de panne sans devoir tout redécouvrir sous pression.

**Termes liés** : [Observabilité](#observabilite-observability).
