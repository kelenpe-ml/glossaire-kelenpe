# DevOps & infra

Le vocabulaire du déploiement et de l'exploitation, avec des repères vers l'infra Kelenpe (Coolify pour le PaaS auto-hébergé, Reelforge pour Kubernetes/Terraform).

[[toc]]

## CI/CD (*Intégration continue / Déploiement continu*)

![Etapes du pipeline CI/CD : push, build, tests, package, deploy](/diagrams/cicd-pipeline.svg)

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

![Reverse proxy routant vers plusieurs instances](/diagrams/reverse-proxy-lb.svg)

**Définition simple** : un serveur qui reçoit les requêtes entrantes à la place des applications finales, et les redirige vers le bon service en interne — utile pour le routing par nom de domaine, le HTTPS centralisé, ou l'équilibrage de charge.

**Contexte / exemple concret** : `coolify_config/prodora_backend_traefik.yml` référence Traefik, le reverse proxy utilisé par Coolify pour router le trafic vers les bons conteneurs selon le domaine appelé.

**Termes liés** : [PaaS](#paas-platform-as-a-service), [Load balancing](#load-balancing-repartition-de-charge).

---

## Load balancing (*Répartition de charge*)

**Définition simple** : distribuer les requêtes entrantes entre plusieurs instances d'un même service, pour qu'aucune ne soit surchargée et que le service reste disponible même si une instance tombe.

**Contexte / exemple concret** : dès que Prodora Backend tournerait en plusieurs instances (scaling horizontal), un load balancer (souvent intégré au reverse proxy comme Traefik) répartirait les requêtes entre elles.

**Termes liés** : [Reverse proxy](#reverse-proxy), [Scalabilité](/backend/#scalabilite-scalability).

---

## KPI (*Key Performance Indicator*, indicateur clé de performance)

**Définition simple** : un indicateur chiffré choisi à l'avance pour suivre si un objectif précis est atteint — pas n'importe quel nombre mesurable, seulement ceux qui comptent vraiment pour l'objectif visé. Le terme vient du monde business, mais entre devs il désigne le plus souvent des métriques **techniques/opérationnelles** : à quel point un service tient ses promesses de fiabilité et de performance.

**Contexte / exemple concret** : côté ingénierie, les KPI classiques sont la disponibilité (*uptime*, ex. 99,9%), la latence (souvent en p95/p99 — le temps de réponse que 95%/99% des requêtes respectent, pas juste la moyenne qui cache les cas lents), le taux d'erreur, le temps moyen de résolution d'incident (**MTTR**, *Mean Time To Recovery*) et la fréquence de déploiement. Sur Reelforge par exemple, un KPI naturel serait le **taux de renditions qui passent le seuil VMAF ≥ 85 du premier coup** (sans retry) — un signal direct de la santé du pipeline de transcodage. Sur `ad-engine-forge`, ce serait la latence p99 du moteur d'enchère (cible < 100ms) : dépasser ce seuil dégraderait directement le revenu publicitaire. Ces KPI techniques sont ce qu'un [healthcheck](#healthcheck) vérifie en continu et ce qu'un [runbook](#runbook) aide à corriger quand ils dérapent.

**Cousin côté business** : la même logique s'applique aux métriques suivies par un investisseur (runway, ROI, CTR...) — voir le [glossaire entrepreneurial](/business/#valorisation-valuation) pour cette version-là. Le mot est le même, seul l'objectif suivi change.

**Termes liés** : [Observabilité](#observabilite-observability), [Healthcheck](#healthcheck), [Runbook](#runbook).

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

---

## CDN (*Content Delivery Network*)

**Définition simple** : un réseau de serveurs répartis géographiquement qui mettent en cache une copie de tes fichiers statiques (images, vidéos, JS/CSS) près de chaque utilisateur, pour réduire la latence et décharger ton serveur d'origine.

**Contexte / exemple concret** : Reelforge livre ses vidéos transcodées via **CloudFront** (le CDN AWS) plutôt que directement depuis S3 — l'utilisateur au Mali ou en Côte d'Ivoire télécharge les segments HLS/DASH depuis un point de présence proche, pas depuis la région AWS d'origine.

**Termes liés** : [Reverse proxy](#reverse-proxy), [Rendition](/streaming/#rendition).

---

## Feature flag (*Drapeau de fonctionnalité*)

**Définition simple** : un interrupteur configuré à distance (sans redéployer le code) qui active ou désactive une fonctionnalité pour tout ou partie des utilisateurs — permet de déployer du code "éteint" en production, puis de l'activer progressivement (rollout progressif, test A/B, ou retour arrière instantané en cas de bug).

**Contexte / exemple concret** : utile pour Prodora ou Kelenpe Ad avant d'activer une nouvelle fonctionnalité (ex. un nouveau mode d'enchère dans `ad-engine-forge`) pour tous les annonceurs d'un coup — on l'active d'abord pour un petit pourcentage de trafic, on observe, puis on généralise.

**Termes liés** : [CI/CD](#ci-cd-integration-continue-deploiement-continu).

---

## WAF (*Web Application Firewall*)

**Définition simple** : un filtre placé devant une application web qui inspecte le trafic HTTP entrant et bloque les requêtes qui ressemblent à des attaques connues (injection SQL, XSS, bots de scraping agressifs) avant qu'elles n'atteignent l'application.

**Contexte / exemple concret** : pertinent pour Prodora Backend — `SecurityHeadersFilter.kt` gère déjà une partie de la sécurité applicative côté code, mais un WAF (souvent fourni par le reverse proxy/CDN) ajoute une couche de filtrage en amont, avant même que la requête n'atteigne le serveur Kotlin.

**Termes liés** : [Reverse proxy](#reverse-proxy), [CDN](#cdn-content-delivery-network).

---

## Healthcheck

**Définition simple** : un endpoint HTTP simple (souvent `/healthz` ou `/health`) qu'un service expose pour dire "je suis vivant et je fonctionne" — utilisé par l'orchestrateur (Kubernetes, Docker Compose) pour savoir s'il doit router du trafic vers cette instance ou la redémarrer.

**Contexte / exemple concret** : `ad-engine-forge` vérifie sa "Phase 0" précisément avec `curl -sf http://localhost:8080/healthz` et `curl -sf http://localhost:8081/healthz` — le jalon de départ d'une stack backend saine n'est pas "ça compile", c'est "chaque service répond correctement à son healthcheck".

**Termes liés** : [Orchestration](#orchestration), [Observabilité](#observabilite-observability).

---

## Rate limiting (*Limitation de débit*)

**Définition simple** : restreindre le nombre de requêtes qu'un client (utilisateur, clé API, IP) peut faire dans une fenêtre de temps donnée, pour protéger le service d'un abus (volontaire ou non) ou d'un pic de charge imprévu.

**Contexte / exemple concret** : un rôle typique de l'API Gateway ou du reverse proxy — pertinent dès que Prodora ou Kelenpe Ad ouvrent une API publique à des intégrateurs tiers : sans rate limiting, un seul client mal configuré pourrait saturer l'infra partagée par tous les autres.

**Termes liés** : [API Gateway](/backend/#api-gateway), [Reverse proxy](#reverse-proxy).

---

## Electron

**Définition simple** : Un outil pour fabriquer des applications de bureau (Windows, Linux, macOS) avec les technologies du web : l'interface est une page web affichée par Chromium, et Node.js donne accès aux fichiers et au matériel.

**Contexte / exemple concret** : Boutik est une application Electron : une seule base de code produit l'installateur Windows et l'AppImage Linux.

**Termes liés** : [Architecture Electron](/backend/#architecture-electron-main-renderer-preload), [Chromium](/frontend/#chromium), [Node.js](#node-js).

---

## Node.js

**Définition simple** : Le moteur qui fait tourner du JavaScript en dehors d'un navigateur, avec accès aux fichiers, au réseau et au système. Electron l'intègre dans son processus principal.

**Contexte / exemple concret** : Le processus principal de Boutik (base de données, impression, images) tourne sur le Node.js d'Electron ; les tests unitaires tournent sur Node.js seul (`node --test`).

**Termes liés** : [Electron](#electron), [npm](#npm), [Test unitaire](#test-unitaire-unit-test).

---

## npm

**Définition simple** : Le gestionnaire de paquets de Node.js : il télécharge et installe les bibliothèques dont un projet a besoin, et lance ses commandes (`npm run dev`, `npm test`).

**Contexte / exemple concret** : `npm install` installe les dépendances de Boutik et recompile ses modules natifs pour Electron ; `npm run package` construit l'installateur.

**Termes liés** : [Dépendance](#dependance-dependency), [Fichier de verrouillage](#fichier-de-verrouillage-lockfile), [npm ci](#npm-ci).

---

## npm ci

**Définition simple** : Une installation « propre et exacte » : elle efface les dépendances déjà présentes et installe exactement les versions notées dans le fichier de verrouillage, sans rien mettre à jour. Faite pour les machines de CI.

**Contexte / exemple concret** : La CI Windows de Boutik installe les dépendances avec `npm ci` : l'installateur est construit avec exactement les mêmes versions qu'en développement.

**Termes liés** : [npm](#npm), [Fichier de verrouillage](#fichier-de-verrouillage-lockfile), [CI/CD](#ci-cd-integration-continue-deploiement-continu).

---

## Fichier de verrouillage (*Lockfile*)

**Définition simple** : Un fichier qui note la version exacte de chaque dépendance installée (et de leurs propres dépendances), pour que tout le monde installe exactement la même chose.

**Contexte / exemple concret** : `package-lock.json` de Boutik ; l'ajout de `@jsquash/webp` y a ajouté 16 lignes (lui et `wasm-feature-detect`).

**Termes liés** : [npm](#npm), [npm ci](#npm-ci), [Dépendance](#dependance-dependency).

---

## npm audit

**Définition simple** : Une commande qui compare les dépendances d'un projet à une base de failles connues, et signale celles qui sont vulnérables.

**Contexte / exemple concret** : C'est ainsi que le paquet npm `xlsx` 0.18.5, vulnérable, a été remplacé dans Boutik par SheetJS 0.20.3, livré dans `vendor/`.

**Termes liés** : [Faille de sécurité](#faille-de-securite-vulnerability-cve), [Dépendance](#dependance-dependency), [Pollution de prototype](#pollution-de-prototype-prototype-pollution), [ReDoS](#redos-regular-expression-denial-of-service).

---

## Faille de sécurité (*Vulnerability, CVE*)

**Définition simple** : Un défaut dans un logiciel qu'un attaquant peut exploiter. Les failles publiques reçoivent un numéro CVE (*Common Vulnerabilities and Exposures*), par exemple CVE-2023-30533, pour qu'on puisse les suivre.

**Contexte / exemple concret** : Le paquet `xlsx` 0.18.5 avait deux failles connues (pollution de prototype et ReDoS) ; Boutik utilise la version corrigée, 0.20.3.

**Termes liés** : [npm audit](#npm-audit), [Pollution de prototype](#pollution-de-prototype-prototype-pollution), [ReDoS](#redos-regular-expression-denial-of-service).

---

## Pollution de prototype (*Prototype pollution*)

**Définition simple** : Une faille propre à JavaScript : un fichier piégé ajoute des propriétés à l'objet de base dont héritent tous les autres objets, ce qui peut changer le comportement du programme partout.

**Contexte / exemple concret** : L'une des failles du vieux `xlsx` 0.18.5 : un tableur piégé importé dans Boutik aurait pu en profiter. D'où le passage à 0.20.3.

**Termes liés** : [Faille de sécurité](#faille-de-securite-vulnerability-cve), [npm audit](#npm-audit).

---

## ReDoS (*Regular expression Denial of Service*)

**Définition simple** : Une attaque qui envoie un texte fabriqué pour qu'une expression de recherche (une regex) mal écrite mette des minutes ou des heures à répondre, bloquant le programme.

**Contexte / exemple concret** : Deuxième faille du vieux `xlsx` : un fichier Excel piégé aurait pu figer l'import de Boutik.

**Termes liés** : [Faille de sécurité](#faille-de-securite-vulnerability-cve), [Boucle d'événements et tâche bloquante](/backend/#boucle-d-evenements-et-tache-bloquante-event-loop-blocking-task).

---

## Dépendance (*Dependency*)

**Définition simple** : Une bibliothèque écrite par d'autres, que le projet utilise au lieu de tout réécrire. Chaque dépendance apporte du code (et d'éventuelles failles) qu'on ne contrôle pas.

**Contexte / exemple concret** : Boutik en a peu en production : SQLCipher (`better-sqlite3-multiple-ciphers`), `argon2`, React Router, lucide-react, SheetJS, et désormais `@jsquash/webp`. La règle : aucune dépendance nouvelle sans l'annoncer.

**Termes liés** : [Dépendance de production / de développement](#dependance-de-production-de-developpement-dependencies-devdependencies), [Fichier de verrouillage](#fichier-de-verrouillage-lockfile), [Surface d'attaque](/backend/#surface-d-attaque-attack-surface).

---

## Dépendance de production / de développement (*dependencies, devDependencies*)

**Définition simple** : Les dépendances de production partent avec l'application chez l'utilisateur ; celles de développement ne servent qu'à fabriquer et tester (compilateur, outils de test) et ne sont pas livrées.

**Contexte / exemple concret** : `@jsquash/webp` est une dépendance de production de Boutik (elle encode les images chez le client) ; TypeScript, Vite et electron-builder sont des dépendances de développement.

**Termes liés** : [Dépendance](#dependance-dependency), [Packaging](#packaging).

---

## Module natif (*Native module*)

**Définition simple** : Une bibliothèque écrite en C ou C++ et compilée pour un système et une version précis, que JavaScript appelle. Rapide, mais à recompiler pour chaque plateforme, et source de soucis à l'installation.

**Contexte / exemple concret** : Boutik en a deux, SQLCipher et argon2, recompilés pour Electron. Pour les images, on a exprès évité d'en ajouter un (sharp) en choisissant nativeImage et WebAssembly.

**Termes liés** : [Node-API](#node-api), [node-gyp](#node-gyp), [Recompilation](#recompilation-rebuild), [WebAssembly](/backend/#webassembly-wasm).

---

## Node-API

**Définition simple** : Une interface stable entre Node.js et les modules natifs : un module écrit avec elle fonctionne sur plusieurs versions de Node sans être réécrit.

**Contexte / exemple concret** : `better-sqlite3-multiple-ciphers` et `argon2`, les deux modules natifs de Boutik, utilisent Node-API ; c'est ce qui permet aux tests unitaires de les charger dans Node seul.

**Termes liés** : [Module natif](#module-natif-native-module).

---

## node-gyp

**Définition simple** : L'outil qui compile les modules natifs de Node.js (C/C++) sur la machine, avec Python et un compilateur.

**Contexte / exemple concret** : Il intervient quand `npm install` de Boutik doit compiler SQLCipher ou argon2 faute de version déjà compilée.

**Termes liés** : [Module natif](#module-natif-native-module), [Recompilation](#recompilation-rebuild).

---

## Recompilation (*Rebuild*)

**Définition simple** : Refaire la compilation d'un module natif pour une autre version du moteur. Un module compilé pour Node.js ne marche pas tel quel dans Electron, qui a sa propre version.

**Contexte / exemple concret** : Le `postinstall` de Boutik lance `electron-builder install-app-deps`, qui recompile SQLCipher et argon2 pour la version d'Electron utilisée.

**Termes liés** : [Module natif](#module-natif-native-module), [electron-builder](#electron-builder).

---

## electron-builder

**Définition simple** : L'outil qui transforme une application Electron en installateur prêt à distribuer (NSIS pour Windows, AppImage pour Linux…).

**Contexte / exemple concret** : Configuré par `electron-builder.yml` dans Boutik : il liste les fichiers à livrer (dont le codec `@jsquash/webp`) et produit `release/Boutik-0.1.0-windows.exe` ou `…-linux.AppImage`.

**Termes liés** : [NSIS](#nsis-nullsoft-scriptable-install-system), [AppImage](#appimage), [Packaging](#packaging), [asar / asarUnpack](#asar-asarunpack).

---

## NSIS (*Nullsoft Scriptable Install System*)

**Définition simple** : Un programme gratuit qui fabrique des installateurs Windows classiques (« Suivant, Suivant, Installer »).

**Contexte / exemple concret** : L'installateur Windows de Boutik est un NSIS, construit par la CI : il laisse choisir le dossier d'installation et crée un raccourci « Boutik ».

**Termes liés** : [electron-builder](#electron-builder), [Installateur](#installateur-installer).

---

## AppImage

**Définition simple** : Un format d'application Linux tout-en-un : un seul fichier qu'on rend exécutable et qu'on lance, sans installation.

**Contexte / exemple concret** : `release/Boutik-0.1.0-linux.AppImage` (136 Mo) : c'est sur lui que tournent les e2e « de production ».

**Termes liés** : [electron-builder](#electron-builder), [Packaging](#packaging), [.deb](#deb).

---

## .deb

**Définition simple** : Le format de paquet d'installation des Linux de la famille Debian et Ubuntu, installé avec le gestionnaire de paquets du système.

**Contexte / exemple concret** : Pas encore produit pour Boutik (seulement l'AppImage), mais electron-builder saurait le faire.

**Termes liés** : [AppImage](#appimage), [Installateur](#installateur-installer).

---

## .exe

**Définition simple** : Le format des programmes Windows. Un installateur Windows est lui-même un `.exe` qu'on lance pour installer l'application.

**Contexte / exemple concret** : `Boutik-0.1.0-windows.exe`, l'installateur NSIS, téléchargeable dans l'artefact de la CI.

**Termes liés** : [NSIS](#nsis-nullsoft-scriptable-install-system), [Installateur](#installateur-installer).

---

## Installateur (*Installer*)

**Définition simple** : Le programme qu'on lance une fois pour mettre l'application sur l'ordinateur : il copie les fichiers, crée les raccourcis, et permet de désinstaller.

**Contexte / exemple concret** : Pour Boutik : NSIS sous Windows ; sous Linux, l'AppImage se lance sans installation.

**Termes liés** : [NSIS](#nsis-nullsoft-scriptable-install-system), [AppImage](#appimage), [Packaging](#packaging).

---

## Packaging

**Définition simple** : L'étape qui rassemble l'application construite et tout ce qu'elle doit emporter (moteur, dépendances, ressources) dans un paquet installable.

**Contexte / exemple concret** : `npm run package` : build de Boutik, puis electron-builder. On vérifie ensuite dans le paquet que le codec WebP est bien présent (`npx asar list`).

**Termes liés** : [Build](#build), [electron-builder](#electron-builder), [asar / asarUnpack](#asar-asarunpack).

---

## asar / asarUnpack

**Définition simple** : asar est une archive (comme un zip, mais lisible directement) où Electron range les fichiers de l'application. Certains fichiers doivent rester en dehors, « dépaquetés » (asarUnpack), surtout les modules natifs que le système doit charger depuis le disque.

**Contexte / exemple concret** : Dans Boutik, SQLCipher et argon2 sont dans `asarUnpack` ; le codec WebP, lui, est lu directement dans l'archive asar.

**Termes liés** : [electron-builder](#electron-builder), [Module natif](#module-natif-native-module).

---

## Build

**Définition simple** : La fabrication de la version prête à exécuter à partir du code source : conversion du TypeScript en JavaScript, assemblage, compaction.

**Contexte / exemple concret** : `npm run build` de Boutik produit le dossier `out/` (main, preload, renderer), que electron-builder emballe ensuite.

**Termes liés** : [Build de développement / de production](#build-de-developpement-de-production-development-production-build), [Vite](/frontend/#vite), [Packaging](#packaging).

---

## Build de développement / de production (*Development / production build*)

**Définition simple** : Le build de développement garde des outils d'aide (rechargement rapide, messages détaillés) ; le build de production est allégé et débarrassé de tout ce qui ne sert qu'aux développeurs.

**Contexte / exemple concret** : Dans Boutik, les outils de dev (`canaux-dev.ts`, dont la création d'un « ancien produit » pour les tests) sont conditionnés par `import.meta.env.DEV` : le build de production les retire entièrement.

**Termes liés** : [Build](#build), [Code mort](/backend/#code-mort-dead-code), [app.isPackaged](#app-ispackaged).

---

## app.isPackaged

**Définition simple** : Une valeur d'Electron qui dit si l'application tourne depuis son paquet installé (vrai) ou depuis le code source en développement (faux).

**Contexte / exemple concret** : Boutik s'en sert pour le bouton « Relancer » après la réparation du coffre : on ne relance l'application que si elle est installée.

**Termes liés** : [Build de développement / de production](#build-de-developpement-de-production-development-production-build), [Electron](#electron).

---

## Fichier .d.ts (*Declaration file*)

**Définition simple** : Un fichier TypeScript qui ne contient que des descriptions de types (pas de code) : il dit à l'éditeur quelles fonctions existent et ce qu'elles prennent.

**Contexte / exemple concret** : `preload/index.d.ts` décrit à la main tout `window.boutik` pour l'interface ; il faut le tenir à jour à chaque nouveau canal (`boutik.images.lister`…).

**Termes liés** : [Type](/frontend/#type), [TypeScript](/frontend/#typescript), [API](/backend/#api-application-programming-interface).

---

## Typecheck

**Définition simple** : La vérification des types par TypeScript sur tout le projet, sans lancer le programme : elle attrape les fautes (champ oublié, mauvais type) avant l'exécution.

**Contexte / exemple concret** : `npm run typecheck` de Boutik vérifie le main, le preload et le renderer ; c'est la première étape de la CI Windows.

**Termes liés** : [TypeScript](/frontend/#typescript), [CI/CD](#ci-cd-integration-continue-deploiement-continu).

---

## README

**Définition simple** : Le fichier d'accueil d'un projet (« lis-moi ») : à quoi il sert, comment l'installer, le lancer, le tester.

**Contexte / exemple concret** : `README.md` de Boutik : prérequis, commandes de test, émulateur d'imprimante, emplacement des données.

**Termes liés** : [CLAUDE.md](#claude-md).

---

## CLAUDE.md

**Définition simple** : Un fichier d'instructions lu automatiquement par Claude à chaque session : règles du projet, commandes, conventions. C'est la « mémoire » du projet pour l'assistant.

**Contexte / exemple concret** : Le `CLAUDE.md` de Boutik fixe les règles non négociables (event sourcing, permissions, secrets), les commandes de test, et désormais la règle du glossaire.

**Termes liés** : [README](#readme).

---

## Git

**Définition simple** : L'outil qui garde l'historique complet des modifications d'un projet : qui a changé quoi, quand, pourquoi. On peut revenir en arrière et travailler à plusieurs.

**Contexte / exemple concret** : Boutik est suivi par Git ; chaque changement cohérent fait l'objet d'un commit en français.

**Termes liés** : [Commit](#commit), [Branche](#branche-branch), [Push](#push).

---

## Commit

**Définition simple** : Un enregistrement dans l'historique Git : un ensemble de modifications, avec un message qui explique pourquoi. Comme une photo datée et commentée du projet.

**Contexte / exemple concret** : « feat(images): collection d'images hors journal… » est un commit de Boutik.

**Termes liés** : [Git](#git), [Commit conventionnel](#commit-conventionnel-conventional-commit).

---

## Commit conventionnel (*Conventional commit*)

**Définition simple** : Une convention pour écrire les messages de commit : un type (`feat` nouvelle fonction, `fix` correction, `docs`, `test`…), une portée entre parenthèses, puis une description.

**Contexte / exemple concret** : Boutik l'applique en français : `feat(stock): images dans la fiche produit…`, `fix(caisse): …`, `docs(essais): …`.

**Termes liés** : [Commit](#commit), [Git](#git).

---

## Branche (*Branch*)

**Définition simple** : Une ligne de travail parallèle dans Git : on développe à part, sans toucher à la version principale, puis on fusionne.

**Contexte / exemple concret** : `main` est la branche principale de Boutik ; les jobs Windows sont testés en poussant sur la branche `test/impression-windows`.

**Termes liés** : [Git](#git), [Fusion](#fusion-merge), [Push](#push).

---

## Push

**Définition simple** : Envoyer ses commits locaux vers le dépôt partagé (sur GitHub par exemple), pour que les autres et la CI les voient.

**Contexte / exemple concret** : Pour Boutik, le push est fait par le développeur lui-même : `git push origin main:test/impression-windows`, puis on relance les jobs Windows.

**Termes liés** : [Git](#git), [Branche](#branche-branch), [CI/CD](#ci-cd-integration-continue-deploiement-continu).

---

## Fusion (*Merge*)

**Définition simple** : Réunir le travail d'une branche dans une autre, en combinant les modifications des deux.

**Contexte / exemple concret** : Une branche d'essai de Boutik (par exemple la montée en version d'Electron) est fusionnée dans `main` une fois validée.

**Termes liés** : [Branche](#branche-branch), [Rebase](#rebase).

---

## Rebase

**Définition simple** : Rejouer ses commits par-dessus la dernière version d'une autre branche, comme si on avait commencé son travail plus tard : l'historique reste en ligne droite, sans commit de fusion.

**Contexte / exemple concret** : Utile pour remettre une branche de Boutik à jour avec `main` avant de la fusionner.

**Termes liés** : [Fusion](#fusion-merge), [Branche](#branche-branch).

---

## Worktree

**Définition simple** : Une deuxième copie de travail du même dépôt Git, dans un autre dossier, sur une autre branche : on peut travailler sur deux choses en même temps sans tout mélanger.

**Contexte / exemple concret** : Pratique pour tester une branche de Boutik (une montée de version) sans quitter celle en cours.

**Termes liés** : [Git](#git), [Branche](#branche-branch).

---

## Hook Git (*Git hook*)

**Définition simple** : Un petit script que Git lance de lui-même à certains moments (avant un commit, avant un push), par exemple pour vérifier le code.

**Contexte / exemple concret** : Piste pour Boutik : lancer le typecheck et les tests avant chaque commit.

**Termes liés** : [Git](#git), [Typecheck](#typecheck).

---

## .gitignore

**Définition simple** : La liste des fichiers que Git doit ignorer (ne jamais enregistrer) : fichiers produits, dépendances téléchargées, secrets.

**Contexte / exemple concret** : Dans Boutik, `outils/images/.gitignore` ignore `node_modules/` et `entrees/` ; les gros modèles de détourage ne sont jamais entrés dans le dépôt.

**Termes liés** : [Git](#git), [.gitattributes](#gitattributes).

---

## .gitattributes

**Définition simple** : Un fichier qui dit à Git comment traiter certains fichiers : fins de ligne, fichiers binaires à ne pas comparer ligne à ligne…

**Contexte / exemple concret** : Utile dans Boutik pour garder les fichiers de référence binaires (`tests/references/*.bin`) intacts, et les scripts PowerShell en fins de ligne Windows.

**Termes liés** : [Fins de ligne CRLF / LF](#fins-de-ligne-crlf-lf-line-endings), [.gitignore](#gitignore).

---

## Fins de ligne CRLF / LF (*Line endings*)

**Définition simple** : Le ou les caractères invisibles qui marquent la fin d'une ligne dans un fichier texte : Windows utilise CRLF (deux caractères), Linux et macOS LF (un seul). Un fichier passé de l'un à l'autre peut casser un script ou fausser une comparaison.

**Contexte / exemple concret** : Point de vigilance de Boutik, développé sous Linux et construit sous Windows : les scripts PowerShell d'impression et les fichiers de référence binaires.

**Termes liés** : [.gitattributes](#gitattributes), [PowerShell](#powershell).

---

## GitHub Actions

**Définition simple** : Le service de CI/CD de GitHub : à chaque push, il lance automatiquement des tâches (tests, construction) sur des machines de GitHub.

**Contexte / exemple concret** : Le workflow « Build Windows » de Boutik y construit et teste l'installateur Windows.

**Termes liés** : [CI/CD](#ci-cd-integration-continue-deploiement-continu), [Workflow](#workflow), [Job](#job), [Runner](#runner).

---

## Workflow

**Définition simple** : Un scénario automatisé de GitHub Actions, décrit dans un fichier YAML : quand le lancer, et quels jobs exécuter.

**Contexte / exemple concret** : `.github/workflows/build-windows.yml` de Boutik : lancé à chaque push sur `main`, ou à la main (*Run workflow*).

**Termes liés** : [GitHub Actions](#github-actions), [Job](#job), [workflow_dispatch](#workflow-dispatch).

---

## Job

**Définition simple** : Une tâche d'un workflow, exécutée sur une machine. Un workflow peut en avoir plusieurs, en parallèle ou à la suite.

**Contexte / exemple concret** : Jobs de Boutik : « Windows NSIS » (installateur), « Impression Windows (RAW) », « Presse-papiers Windows ».

**Termes liés** : [Workflow](#workflow), [Runner](#runner).

---

## Runner

**Définition simple** : La machine (souvent virtuelle, fournie par GitHub) qui exécute un job. `windows-latest` désigne une machine Windows récente.

**Contexte / exemple concret** : Les jobs Windows de Boutik tournent sur `windows-latest` : c'est là qu'est vérifiée l'impression RAW, sans imprimante réelle.

**Termes liés** : [Job](#job), [GitHub Actions](#github-actions).

---

## workflow_dispatch

**Définition simple** : L'option qui permet de lancer un workflow GitHub Actions à la main, avec le bouton *Run workflow*, sans faire de push.

**Contexte / exemple concret** : Pour relancer les jobs Windows de Boutik sur une autre branche que `main`.

**Termes liés** : [Workflow](#workflow), [GitHub Actions](#github-actions).

---

## Artefact (*Artifact*)

**Définition simple** : Un fichier produit par un job de CI et conservé pour qu'on le télécharge : un installateur, un rapport de test…

**Contexte / exemple concret** : L'installateur Windows de Boutik se télécharge dans l'artefact **Boutik-windows** du run.

**Termes liés** : [Job](#job), [CI/CD](#ci-cd-integration-continue-deploiement-continu).

---

## Signature de code (*Code signing, SmartScreen*)

**Définition simple** : Signer un programme avec un certificat acheté auprès d'une autorité, pour prouver qui l'a publié et qu'il n'a pas été modifié. SmartScreen est le filtre de Windows qui avertit devant un programme non signé ou peu connu.

**Contexte / exemple concret** : L'installateur de Boutik n'est pas encore signé : SmartScreen peut afficher « Windows a protégé votre ordinateur » au premier lancement.

**Termes liés** : [Signature cryptographique](/backend/#signature-cryptographique-digital-signature), [Installateur](#installateur-installer).

---

## Docker

**Définition simple** : Un outil qui fait tourner des programmes dans des conteneurs : des boîtes isolées qui contiennent tout ce dont le programme a besoin, identiques sur toutes les machines.

**Contexte / exemple concret** : L'émulateur d'imprimante de Boutik se lance avec Docker : `docker run … gilbertfl/escpos-netprinter:3.2`, sans rien installer d'autre.

**Termes liés** : [Conteneurisation](#conteneurisation-containerization), [Émulateur](#emulateur-emulator).

---

## Émulateur (*Emulator*)

**Définition simple** : Un programme qui imite un appareil (une imprimante, un téléphone), pour tester sans l'appareil réel.

**Contexte / exemple concret** : L'émulateur ESC/POS de Boutik reçoit les tickets sur le port 9100 et les affiche comme des pages web (http://127.0.0.1:8089/recus). Il n'est jamais livré avec l'application.

**Termes liés** : [Docker](#docker), [ESC/POS](/media/#esc-pos), [Faux serveur](#faux-serveur-mock-fake-server).

---

## Test unitaire (*Unit test*)

**Définition simple** : Un petit test automatique qui vérifie une seule fonction, isolée du reste : « pour telle entrée, elle doit rendre tel résultat ». Rapide, lancé des centaines de fois par jour.

**Contexte / exemple concret** : Boutik en a 142 (`npm test`), dont 13 pour les images : format reconnu, orientation des photos, effacement réel des octets…

**Termes liés** : [Test e2e](#test-e2e-end-to-end-test-test-de-bout-en-bout), [Assertion](#assertion), [Test de régression](#test-de-regression-regression-test).

---

## Test e2e (*End-to-end test, test de bout en bout*)

**Définition simple** : Un test qui utilise l'application entière comme un vrai utilisateur : il la lance, clique, tape, et vérifie ce qui s'affiche et ce qui est enregistré.

**Contexte / exemple concret** : `npm run test:e2e:images` lance Boutik sur une base jetable, ajoute des images par l'explorateur, le glisser-déposer, Ctrl+V et la collection, et vérifie 20 critères. Il tourne aussi sur l'AppImage de production.

**Termes liés** : [Test unitaire](#test-unitaire-unit-test), [Chrome DevTools Protocol](#chrome-devtools-protocol-cdp), [Test instable](#test-instable-flaky-test).

---

## Test de régression (*Regression test*)

**Définition simple** : Relancer les tests existants après un changement, pour vérifier qu'on n'a rien cassé de ce qui marchait déjà.

**Contexte / exemple concret** : Après le lot images, les 9 suites e2e existantes de Boutik (caisse, clavier, navigation…) ont été relancées : toutes passent.

**Termes liés** : [Test e2e](#test-e2e-end-to-end-test-test-de-bout-en-bout), [Test unitaire](#test-unitaire-unit-test).

---

## Fichier de référence (*Golden file*)

**Définition simple** : Un fichier qui contient le résultat attendu, validé une fois à la main ; le test compare ensuite le résultat du jour à ce fichier, octet par octet.

**Contexte / exemple concret** : Les tickets de Boutik sont comparés à `tests/references/*.bin` : le moindre octet ESC/POS changé fait échouer le test.

**Termes liés** : [Test unitaire](#test-unitaire-unit-test), [ESC/POS](/media/#esc-pos).

---

## Test instable (*Flaky test*)

**Définition simple** : Un test qui réussit parfois et échoue parfois sans que le code ait changé, souvent à cause d'un problème de délai. Dangereux : on finit par ignorer ses échecs.

**Contexte / exemple concret** : Les e2e de Boutik attendent un état précis au lieu d'attendre un temps fixe (fonction `attendre`), pour ne pas devenir instables.

**Termes liés** : [Test e2e](#test-e2e-end-to-end-test-test-de-bout-en-bout), [Délai d'attente](/backend/#delai-d-attente-timeout).

---

## Faux serveur (*Mock, fake server*)

**Définition simple** : Un faux composant qui imite le vrai pendant un test : il répond comme lui, mais de façon contrôlée.

**Contexte / exemple concret** : La CI Windows de Boutik fait imprimer vers une file dont le port pointe vers un faux serveur TCP local, qui vérifie les octets reçus.

**Termes liés** : [Émulateur](#emulateur-emulator), [Test unitaire](#test-unitaire-unit-test), [Injection de panne](#injection-de-panne-fault-injection).

---

## Injection de panne (*Fault injection*)

**Définition simple** : Provoquer exprès une panne pendant un test (réseau coupé, imprimante éteinte, coffre absent) pour vérifier que l'application réagit bien.

**Contexte / exemple concret** : L'e2e « coffre » de Boutik coupe l'accès au trousseau Linux (D-Bus) ; l'e2e « caisse » éteint l'imprimante et vérifie que la vente est enregistrée quand même.

**Termes liés** : [Faux serveur](#faux-serveur-mock-fake-server), [Test e2e](#test-e2e-end-to-end-test-test-de-bout-en-bout).

---

## Assertion

**Définition simple** : Dans un test, une affirmation vérifiée par le programme : « le stock doit valoir 12 ». Si elle est fausse, le test échoue et dit pourquoi.

**Contexte / exemple concret** : `assert.equal(image.largeur, 1024)` dans les tests de Boutik.

**Termes liés** : [Test unitaire](#test-unitaire-unit-test).

---

## Fuses Electron (*Electron fuses*)

**Définition simple** : Des interrupteurs gravés dans l'exécutable Electron au moment du paquet, qui désactivent des fonctions dangereuses (par exemple lancer l'application comme un simple Node.js, ou accepter `--inspect`).

**Contexte / exemple concret** : Piste de durcissement pour l'exécutable de Boutik, avant la distribution.

**Termes liés** : [--inspect](#inspect), [Surface d'attaque](/backend/#surface-d-attaque-attack-surface).

---

## --inspect

**Définition simple** : Une option qui ouvre une porte de débogage sur le processus Node.js : un outil peut s'y connecter pour lire et exécuter du code dedans.

**Contexte / exemple concret** : Les e2e de Boutik l'utilisent pour agir dans le processus principal (écrire une image dans le presse-papiers) ; c'est une raison de la fermer dans l'exécutable distribué (fuses).

**Termes liés** : [DevTools](#devtools), [Fuses Electron](#fuses-electron-electron-fuses).

---

## DevTools

**Définition simple** : Les outils de développement intégrés à Chromium : inspecter la page, voir les erreurs, mesurer les performances.

**Contexte / exemple concret** : Ouverts pendant le développement de Boutik ; les e2e utilisent leur protocole (CDP) pour piloter l'application.

**Termes liés** : [Chrome DevTools Protocol](#chrome-devtools-protocol-cdp), [Chromium](/frontend/#chromium).

---

## Chrome DevTools Protocol (*CDP*)

**Définition simple** : Le langage que les DevTools utilisent pour piloter Chromium : cliquer, taper, lire la page, faire des captures d'écran. Un programme de test peut le parler aussi.

**Contexte / exemple concret** : Tous les e2e de Boutik passent par lui (WebSocket vers la fenêtre) : `Input.dispatchKeyEvent` pour les touches, `DOM.setFileInputFiles` pour choisir un fichier, `Page.captureScreenshot` pour les captures.

**Termes liés** : [DevTools](#devtools), [Puppeteer](#puppeteer), [Test e2e](#test-e2e-end-to-end-test-test-de-bout-en-bout).

---

## Puppeteer

**Définition simple** : Une bibliothèque qui pilote Chromium par le Chrome DevTools Protocol, avec des fonctions toutes faites (cliquer, taper, attendre).

**Contexte / exemple concret** : Boutik n'en dépend pas : ses e2e parlent directement le protocole CDP, avec quelques fonctions maison (`e2e-outils.mjs`), pour éviter une dépendance.

**Termes liés** : [Chrome DevTools Protocol](#chrome-devtools-protocol-cdp).

---

## sendInputEvent

**Définition simple** : Une fonction d'Electron qui envoie une frappe ou un clic à une fenêtre depuis le processus principal, en passant par tout le circuit normal du clavier.

**Contexte / exemple concret** : Les raccourcis de taille d'affichage de Boutik étant gérés dans le main, les e2e les injectent avec `webContents.sendInputEvent` (les touches envoyées par CDP ne passent pas par là).

**Termes liés** : [Chrome DevTools Protocol](#chrome-devtools-protocol-cdp), [Raccourci clavier](/frontend/#raccourci-clavier-keyboard-shortcut).

---

## Espace de noms réseau (*Network namespace*)

**Définition simple** : Une « bulle » réseau de Linux : un programme lancé dedans a son propre réseau, isolé (par exemple sans aucun accès à Internet).

**Contexte / exemple concret** : Moyen de prouver que Boutik fonctionne sans aucune connexion : le lancer dans un espace de noms réseau vide.

**Termes liés** : [Hors ligne d'abord](/backend/#hors-ligne-d-abord-offline-first).

---

## taskset

**Définition simple** : Une commande Linux qui limite un programme à certains cœurs du processeur.

**Contexte / exemple concret** : Les mesures de Boutik sont faites sur 1 ou 2 cœurs (`taskset -c 0`), pour ressembler au PC modeste d'une boutique.

**Termes liés** : [Fil d'exécution](/backend/#fil-d-execution-thread), [systemd-run](#systemd-run).

---

## systemd-run

**Définition simple** : Une commande Linux qui lance un programme avec des limites (mémoire, processeur), dans une enveloppe surveillée par le système (un cgroup).

**Contexte / exemple concret** : Les essais lourds de Boutik (détourage, e2e) tournent avec `systemd-run --user --scope -p MemoryMax=3G` : un programme trop gourmand est arrêté seul, au lieu de faire fermer l'éditeur.

**Termes liés** : [taskset](#taskset), [Swap](#swap), [Mémoire saturée](#memoire-saturee-out-of-memory-oom).

---

## Mémoire saturée (*Out of memory, OOM*)

**Définition simple** : Quand un programme demande plus de mémoire que l'ordinateur n'en a : le système tue un programme pour survivre, parfois pas celui qui est en cause.

**Contexte / exemple concret** : Pendant l'essai de détourage, le modèle BiRefNet a dépassé 5,6 Go et fait fermer VS Code deux fois ; d'où les plafonds avec systemd-run.

**Termes liés** : [systemd-run](#systemd-run), [Swap](#swap).

---

## Swap

**Définition simple** : Une partie du disque utilisée comme mémoire de secours quand la mémoire vive est pleine : ça évite un plantage, mais c'est des centaines de fois plus lent.

**Contexte / exemple concret** : Les essais de Boutik interdisent le swap (`MemorySwapMax=0`) pour mesurer la vraie mémoire nécessaire, sans ralentir tout le poste.

**Termes liés** : [Mémoire saturée](#memoire-saturee-out-of-memory-oom), [systemd-run](#systemd-run).

---

## Version majeure (*Semantic versioning, semver*)

**Définition simple** : La numérotation `majeure.mineure.correctif` (par exemple 37.2.6). Changer le premier nombre (version majeure) annonce des changements qui peuvent casser ce qui marchait.

**Contexte / exemple concret** : Passer Electron de la version 37 à la 44 est une montée de version majeure : Boutik l'a testée sur une branche à part.

**Termes liés** : [Fin de support](#fin-de-support-end-of-life-eol), [Dépendance](#dependance-dependency).

---

## Fin de support (*End of life, EOL*)

**Définition simple** : La date après laquelle un logiciel ne reçoit plus de corrections, même de sécurité. L'utiliser après devient risqué.

**Contexte / exemple concret** : Chaque version majeure d'Electron n'est suivie que quelques mois : Boutik doit monter de version régulièrement.

**Termes liés** : [Version majeure](#version-majeure-semantic-versioning-semver).

---

## DLL (*Dynamic Link Library*)

**Définition simple** : Une bibliothèque de code partagée sous Windows (fichier `.dll`), chargée par les programmes qui en ont besoin.

**Contexte / exemple concret** : Le moteur de détourage onnxruntime vient avec `onnxruntime.dll`, qui dépend elle-même des DLL du Visual C++ Redistributable.

**Termes liés** : [Visual C++ Redistributable](#visual-c-redistributable), [onnxruntime](/media/#onnxruntime).

---

## Visual C++ Redistributable

**Définition simple** : Un paquet de DLL de Microsoft dont ont besoin beaucoup de programmes écrits en C++. S'il manque, le programme refuse de démarrer.

**Contexte / exemple concret** : À livrer avec Boutik si le détourage (onnxruntime) est intégré un jour : environ 1 Mo, redistribution autorisée par Microsoft.

**Termes liés** : [DLL](#dll-dynamic-link-library), [Redistribution](/business/#redistribution).

---

## Compression LZMA / xz

**Définition simple** : Une méthode de compression très efficace (fichiers `.xz`, `.7z`), plus lente que le zip mais plus compacte. Les installateurs NSIS l'utilisent.

**Contexte / exemple concret** : L'essai de détourage a mesuré le poids ajouté à l'installateur Windows de Boutik avec `xz -6`, comme NSIS : +12 Mo pour U²-Net p.

**Termes liés** : [NSIS](#nsis-nullsoft-scriptable-install-system), [Installateur](#installateur-installer).

---

## PowerShell

**Définition simple** : La ligne de commande et le langage de script de Windows, qui accède à tout le système (imprimantes, presse-papiers…).

**Contexte / exemple concret** : Boutik envoie ses tickets à la file d'impression Windows par un script PowerShell (`envoi-windows.ps1`). Ses barres de progression sortent en CLIXML (un XML de PowerShell), d'où une option pour les couper.

**Termes liés** : [File d'impression](#file-d-impression-print-spooler), [Mode RAW](#mode-raw).

---

## File d'impression (*Print spooler*)

**Définition simple** : Le service du système qui reçoit les documents à imprimer, les met en attente, puis les envoie à l'imprimante l'un après l'autre.

**Contexte / exemple concret** : Sous Windows, Boutik dépose ses tickets dans la file d'impression ; il surveille ensuite quelques secondes : si le ticket y reste (imprimante USB débranchée), il le signale.

**Termes liés** : [Mode RAW](#mode-raw), [Pilote](#pilote-driver), [CUPS](#cups-common-unix-printing-system).

---

## Mode RAW

**Définition simple** : Envoyer les octets tels quels à l'imprimante, sans que le système les transforme. Indispensable pour les commandes ESC/POS (coupe, tiroir), qu'une mise en page détruirait.

**Contexte / exemple concret** : Boutik imprime en RAW sous Windows ; la CI le vérifie avec une imprimante « Generic / Text Only ».

**Termes liés** : [ESC/POS](/media/#esc-pos), [File d'impression](#file-d-impression-print-spooler), [Pilote](#pilote-driver).

---

## CUPS (*Common Unix Printing System*)

**Définition simple** : Le système d'impression de Linux et macOS : il gère les imprimantes et leurs files d'attente.

**Contexte / exemple concret** : Sous Linux, une imprimante de tickets USB de Boutik passerait par CUPS, en mode brut.

**Termes liés** : [File d'impression](#file-d-impression-print-spooler), [Mode RAW](#mode-raw).

---

## Pilote (*Driver*)

**Définition simple** : Le petit logiciel qui permet au système de dialoguer avec un appareil précis (imprimante, carte graphique).

**Contexte / exemple concret** : Pour ses tickets, Boutik n'a pas besoin du pilote de la marque : le pilote « Generic / Text Only » de Windows suffit, puisque Boutik envoie lui-même les commandes ESC/POS en mode RAW.

**Termes liés** : [Mode RAW](#mode-raw), [File d'impression](#file-d-impression-print-spooler).

---

## polkit / pkexec

**Définition simple** : polkit est le système de Linux qui décide qui peut faire une action d'administrateur ; pkexec l'utilise pour lancer une commande avec ces droits, après une fenêtre de mot de passe.

**Contexte / exemple concret** : Quand le trousseau Linux manque, Boutik propose « Corriger » : la commande d'installation passe par pkexec, et l'utilisateur tape son mot de passe dans la fenêtre du système, jamais dans Boutik.

**Termes liés** : [sudo / root](#sudo-root), [Trousseau de clés](/backend/#trousseau-de-cles-keyring-secret-service-libsecret-gnome-keyring-kwallet).

---

## sudo / root

**Définition simple** : root est le compte tout-puissant de Linux (administrateur) ; sudo permet de lancer une seule commande avec ses droits, en tapant son mot de passe.

**Contexte / exemple concret** : Boutik ne s'exécute jamais en root ; une installation système passe par pkexec, qui demande la permission.

**Termes liés** : [polkit / pkexec](#polkit-pkexec).

---

## D-Bus

**Définition simple** : Le « standard téléphonique » de Linux : un canal par lequel les programmes se parlent (le trousseau, les notifications, l'alimentation…).

**Contexte / exemple concret** : Le trousseau Linux est joint par D-Bus. L'e2e « coffre » de Boutik simule un trousseau absent en donnant une adresse D-Bus qui n'existe pas.

**Termes liés** : [Trousseau de clés](/backend/#trousseau-de-cles-keyring-secret-service-libsecret-gnome-keyring-kwallet), [Injection de panne](#injection-de-panne-fault-injection).

---

## Test de performance (*Benchmark*)

**Définition simple** : Une mesure chiffrée et reproductible (temps, mémoire, taille) pour comparer des solutions ou vérifier qu'une application reste rapide.

**Contexte / exemple concret** : Les essais de Boutik (`outils/images`, `outils/detourage`) comparent formats et modèles sur les mêmes photos, sur 1 ou 2 cœurs, et notent les résultats dans `docs/essais/`.

**Termes liés** : [taskset](#taskset), [Médiane](/frontend/#mediane-median).

---

## Fenêtre hors écran (*Offscreen rendering*)

**Définition simple** : Une fenêtre Electron qui dessine son contenu normalement, image après image, mais ne l'affiche nulle part : utile pour mesurer ou capturer sans gêner l'écran.

**Contexte / exemple concret** : La fluidité de la collection de 1 000 images de Boutik est mesurée dans une fenêtre hors écran, pour ne pas ouvrir de fenêtre sur le poste du développeur.

**Termes liés** : [Test e2e](#test-e2e-end-to-end-test-test-de-bout-en-bout), [Images par seconde](/frontend/#images-par-seconde-frames-per-second-fps).

---

## CSV (*Comma-Separated Values*)

**Définition simple** : Un fichier de tableau en texte simple : une ligne par enregistrement, les colonnes séparées par des virgules ou des points-virgules. Lisible par Excel et par tous les programmes.

**Contexte / exemple concret** : L'écran Import de Boutik accepte un CSV de produits (nom, prix, unité, carton, famille, fournisseur) ; les lignes en erreur sont signalées une par une.

**Termes liés** : [Tableur Excel (xlsx / xls)](#tableur-excel-xlsx-xls), [SheetJS](#sheetjs).

---

## Tableur Excel (xlsx / xls)

**Définition simple** : Les fichiers de tableur de Microsoft Excel : `.xlsx` pour le format actuel, `.xls` pour l'ancien (d'avant 2007).

**Contexte / exemple concret** : L'import de Boutik lit les deux, pour que le commerçant puisse reprendre sa liste de produits telle qu'il la tient déjà.

**Termes liés** : [CSV](#csv-comma-separated-values), [SheetJS](#sheetjs).

---

## SheetJS

**Définition simple** : Une bibliothèque qui lit et écrit les fichiers de tableur (xlsx, xls, CSV…) en JavaScript.

**Contexte / exemple concret** : Boutik utilise SheetJS 0.20.3, livré dans `vendor/xlsx-0.20.3.tgz`, car le paquet npm `xlsx` est resté bloqué en 0.18.5, qui a des failles connues.

**Termes liés** : [Tableur Excel (xlsx / xls)](#tableur-excel-xlsx-xls), [npm audit](#npm-audit), [Faille de sécurité](#faille-de-securite-vulnerability-cve).

---

## Rollup

**Définition simple** : L'outil qui assemble les nombreux fichiers d'un projet en quelques fichiers finaux, en retirant le code jamais utilisé. Vite s'en sert pour le build.

**Contexte / exemple concret** : Rollup ne retire pas le code mort placé dans un bloc `try` : c'est pourquoi la règle de Boutik place les outils de dev hors d'un `try`, conditionnés par `import.meta.env.DEV` écrit en toutes lettres.

**Termes liés** : [Vite](/frontend/#vite), [Code mort](/backend/#code-mort-dead-code), [Build de développement / de production](#build-de-developpement-de-production-development-production-build).

---

## Fixture (*Jeu de test*)

**Définition simple** : Des données ou des fichiers préparés à l'avance, toujours les mêmes, sur lesquels les tests s'exécutent.

**Contexte / exemple concret** : `tests/fixtures/images/` de Boutik : une photo 1600×1200, un PNG transparent, un JPEG avec orientation EXIF, un AVIF et un GIF (pour vérifier les refus), générés par `outils/images/generer-fixtures.mjs`.

**Termes liés** : [Test unitaire](#test-unitaire-unit-test), [Test e2e](#test-e2e-end-to-end-test-test-de-bout-en-bout).

---

## Polyfill

**Définition simple** : Un petit bout de code qui ajoute une fonction manquante à un environnement, pour qu'un programme écrit pour un autre environnement y marche quand même.

**Contexte / exemple concret** : Le codec WebP de Boutik attend `ImageData`, qui existe dans les navigateurs mais pas dans Node.js : `webp.ts` en fournit un polyfill minimal.

**Termes liés** : [WebAssembly](/backend/#webassembly-wasm), [Node.js](#node-js).

---

## Emscripten

**Définition simple** : L'outil qui compile du code C ou C++ en WebAssembly, avec le code JavaScript nécessaire pour le charger.

**Contexte / exemple concret** : libwebp de Google a été compilée avec Emscripten pour donner `@jsquash/webp`, que Boutik utilise.

**Termes liés** : [WebAssembly](/backend/#webassembly-wasm).

---

## Déterministe (*Deterministic*)

**Définition simple** : Se dit d'un calcul qui donne toujours exactement le même résultat pour les mêmes entrées, sans aucune part de hasard.

**Contexte / exemple concret** : L'encodage WebP de Boutik est déterministe (vérifié par un test unitaire) : la même image donne les mêmes octets, donc la même empreinte, donc une seule copie.

**Termes liés** : [Fonction pure](/backend/#fonction-pure-pure-function), [Adressage par contenu](/backend/#adressage-par-contenu-content-addressing).

---

## Hook d'empaquetage (*afterPack*)

**Définition simple** : Un petit script qu'electron-builder lance à un moment précis de la fabrication du paquet (ici : juste après avoir rassemblé les fichiers, avant de faire l'installateur), pour les retoucher.

**Contexte / exemple concret** : `scripts/apres-empaquetage.cjs` de Boutik retire les binaires onnxruntime des autres systèmes (macOS, Linux ou Windows selon le paquet), des processeurs ARM, et DirectML : l'AppImage passe de 201 à 158,5 Mo.

**Termes liés** : [electron-builder](#electron-builder), [Packaging](#packaging), [DirectML](/media/#directml).

---

## Installation silencieuse (*Silent install*)

**Définition simple** : Installer un logiciel sans aucune fenêtre ni question, en donnant les choix d'avance sur la ligne de commande. Utile pour les machines de test ou les déploiements en série.

**Contexte / exemple concret** : La CI Windows de Boutik installe l'installateur NSIS avec `/S /D=C:\BoutikCI`, puis lance l'exécutable installé pour détourer une photo de test.

**Termes liés** : [NSIS](#nsis-nullsoft-scriptable-install-system), [Installateur](#installateur-installer), [Job](#job).

---

## Espace de noms utilisateur (*User namespace*)

**Définition simple** : Une « bulle » de Linux où un programme peut avoir une autre identité (par exemple se croire administrateur) sans aucun droit réel sur le système. Combinée à un espace de noms réseau, elle permet de couper le réseau d'un programme sans être administrateur.

**Contexte / exemple concret** : Le test « réseau coupé » du détourage de Boutik lance l'exécutable avec `unshare -rn` (réseau coupé), puis un second espace de noms utilisateur qui lui rend son identité normale : Electron refuse de démarrer en se croyant administrateur.

**Termes liés** : [Espace de noms réseau](#espace-de-noms-reseau-network-namespace), [sudo / root](#sudo-root).

---

## Déploiement local des DLL (*App-local deployment*)

**Définition simple** : Livrer les DLL dont un programme a besoin dans son propre dossier, au lieu de compter sur leur installation dans Windows. Microsoft l'autorise pour les bibliothèques Visual C++.

**Contexte / exemple concret** : La CI Windows de Boutik copie `msvcp140.dll`, `vcruntime140.dll` et `vcruntime140_1.dll` à côté de `onnxruntime.dll` : le détourage marche même sur un Windows où le Visual C++ Redistributable n'est pas installé.

**Termes liés** : [DLL](#dll-dynamic-link-library), [Visual C++ Redistributable](#visual-c-redistributable), [Redistribution](/business/#redistribution).

---

## Jonction (*Junction, directory junction*)

**Définition simple** : Sous Windows, un dossier « raccourci » : il pointe vers un autre dossier, et tout ce qui est écrit dedans va en réalité dans le dossier cible. Le supprimer ne supprime que le raccourci.

**Contexte / exemple concret** : Les e2e de Boutik sous Windows remplacent `%APPDATA%\Boutik` par une jonction vers un dossier jetable : l'application croit écrire dans son dossier habituel, les tests lisent les mêmes fichiers que sous Linux, et rien ne reste après.

**Termes liés** : [Test e2e](#test-e2e-end-to-end-test-test-de-bout-en-bout), [Fixture](#fixture-jeu-de-test).

---

## taskkill

**Définition simple** : La commande Windows qui arrête un programme (et, avec `/T`, tous les programmes qu'il a lancés).

**Contexte / exemple concret** : Les e2e de Boutik sous Windows arrêtent l'application avec `taskkill /PID … /T /F` à la fin de chaque scénario, ou quand un scénario dépasse sa limite de temps.

**Termes liés** : [Test e2e](#test-e2e-end-to-end-test-test-de-bout-en-bout), [Délai d'attente](/backend/#delai-d-attente-timeout).

---

## Branche de vérification (*Verification branch*)

**Définition simple** : Une branche Git sur laquelle on pousse un état du code seulement pour le faire vérifier par la CI, sans toucher à la branche principale partagée.

**Contexte / exemple concret** : Pour Boutik, Drissa pousse sur `ci/verification` (`git push origin main:ci/verification`) : le workflow Build Windows se lance, avec l'installateur et les e2e sous Windows.

**Termes liés** : [Branche](#branche-branch), [Push](#push), [CI/CD](#ci-cd-integration-continue-deploiement-continu), [Workflow](#workflow).

---

## Journal d'erreurs (*Log*)

**Définition simple** : Un fichier ou un flux où un programme note, avec l'heure, ce qu'il fait et ce qui se passe mal, pour comprendre un problème après coup.

**Contexte / exemple concret** : Boutik écrit ses messages sur la sortie de la console (« [Boutik] Base ouverte… »), que lisent les tests e2e. Il n'y a pas encore de fichier de journal sur le poste de la boutique. Règle : jamais de secret dedans.

**Termes liés** : [Niveau de journalisation](#niveau-de-journalisation-log-level), [Rotation des journaux](#rotation-des-journaux-log-rotation), [Caviardage des données sensibles](/backend/#caviardage-des-donnees-sensibles-redaction).

---

## Niveau de journalisation (*Log level*)

**Définition simple** : L'importance d'un message de journal : détail (debug), information, avertissement, erreur. On choisit le niveau minimum à garder, pour ne pas noyer l'essentiel.

**Contexte / exemple concret** : Boutik utilise `console.info` (« Clé SQLCipher générée… »), `console.warn` (« Suggestions de saisie non mémorisées ») et `console.error`.

**Termes liés** : [Journal d'erreurs](#journal-d-erreurs-log).

---

## Rotation des journaux (*Log rotation*)

**Définition simple** : Remplacer régulièrement le fichier de journal par un nouveau et ne garder que les derniers (par taille ou par date), pour qu'il ne remplisse jamais le disque.

**Contexte / exemple concret** : Boutik n'écrit pas encore de fichier de journal. S'il en écrit un, la rotation sera obligatoire : les PC des boutiques ont de petits disques et personne pour les surveiller.

**Termes liés** : [Journal d'erreurs](#journal-d-erreurs-log).

---

## Mise à jour de l'application (*Application update, distribution des versions*)

**Définition simple** : Faire passer les postes à une nouvelle version : la construire, la distribuer (installateur, téléchargement), l'installer, en gardant lisibles les données créées par l'ancienne version.

**Contexte / exemple concret** : L'installateur Windows de Boutik est construit par la CI ; il n'y a pas encore de mise à jour automatique. `test:e2e:mise-a-jour` rouvre avec la nouvelle version une base créée sous Electron 37 (clé, données, images, codes de secours, PIN).

**Termes liés** : [CI/CD](#ci-cd-integration-continue-deploiement-continu), [Version majeure](#version-majeure-semantic-versioning-semver).

---

## git fetch

**Définition simple** : Télécharger les nouveautés du dépôt distant (commits, branches) sans toucher à son propre travail : les branches distantes (`origin/main`) sont mises à jour, les branches locales non.

**Contexte / exemple concret** : Avant de fusionner dans Boutik, `git fetch origin` montre si `origin/main` a bougé depuis la dernière fois.

**Termes liés** : [git pull](#git-pull), [Branche locale / branche distante](#branche-locale-branche-distante-local-branch-remote-branch).

---

## git pull

**Définition simple** : Un `git fetch` suivi de l'intégration des nouveautés dans la branche locale courante. Avec `--ff-only`, Git refuse s'il faudrait créer un commit de fusion.

**Contexte / exemple concret** : Sur Boutik, `git pull --ff-only` sur `main` récupère ce qui a été poussé ailleurs sans jamais créer de fusion par surprise.

**Termes liés** : [git fetch](#git-fetch), [Avance rapide](#avance-rapide-fast-forward-ff-only), [Fusion](#fusion-merge).

---

## Avance rapide (*Fast-forward, --ff-only*)

**Définition simple** : Quand la branche cible n'a rien que la branche intégrée n'ait déjà, Git déplace simplement son pointeur vers le dernier commit : pas de commit de fusion, l'historique reste une ligne droite. `--ff-only` n'accepte que ce cas.

**Contexte / exemple concret** : La branche `test/electron-44` de Boutik est rebasée sur `main` : sa fusion peut se faire en avance rapide (`git merge --ff-only`).

**Termes liés** : [Fusion](#fusion-merge), [Rebase](#rebase), [Refus non-fast-forward](#refus-non-fast-forward-non-fast-forward-rejection).

---

## Branche locale / branche distante (*Local branch / remote branch*)

**Définition simple** : Une branche locale est sur l'ordinateur, là où l'on committe (`main`). Une branche distante est la copie connue de la branche du dépôt partagé (`origin/main`), mise à jour par `git fetch`. Les deux peuvent diverger.

**Contexte / exemple concret** : `test/electron-44` n'existe que sur le poste ; `git push origin test/electron-44:ci/verification` crée ou met à jour la branche distante `ci/verification`, qui déclenche le workflow Windows.

**Termes liés** : [Branche](#branche-branch), [Push](#push), [git fetch](#git-fetch), [Branche de vérification](#branche-de-verification-verification-branch).

---

## Poussée forcée prudente (*--force-with-lease*)

**Définition simple** : Un push qui remplace la branche distante seulement si elle est encore là où on l'a vue la dernière fois. Si quelqu'un a poussé entre-temps, Git refuse au lieu d'écraser son travail, contrairement à `--force`.

**Contexte / exemple concret** : Pour republier sur `ci/verification` un commit plus ancien que celui qui y est déjà (une mesure « avant », par exemple) : `git push --force-with-lease origin <commit>:ci/verification`.

**Termes liés** : [Push](#push), [Refus non-fast-forward](#refus-non-fast-forward-non-fast-forward-rejection).

---

## Refus non-fast-forward (*Non-fast-forward rejection*)

**Définition simple** : Git refuse un push quand la branche distante contient des commits absents de la branche envoyée : les accepter les effacerait. On récupère d'abord ces commits (fetch, puis fusion ou rebase), ou, si l'effacement est voulu, on utilise une poussée forcée prudente.

**Contexte / exemple concret** : Pousser sur `ci/verification` un commit plus ancien que celui qui y est est refusé ainsi (« rejected, non-fast-forward »).

**Termes liés** : [Avance rapide](#avance-rapide-fast-forward-ff-only), [Poussée forcée prudente](#poussee-forcee-prudente-force-with-lease).

---

## EBUSY (*fichier verrouillé*)

**Définition simple** : Un code d'erreur du système : « ressource occupée ou verrouillée ». Sous Windows, il apparaît typiquement quand on supprime ou renomme un fichier qu'un programme tient encore ouvert.

**Contexte / exemple concret** : Job Windows de Boutik, septembre 2026 : un test ouvrait la base avec une mauvaise clé, et la connexion restait ouverte ; la suppression du dossier temporaire échouait avec EBUSY.

**Termes liés** : [Verrouillage de fichier sous Windows](#verrouillage-de-fichier-sous-windows-file-locking), [Ménage de fin de test](#menage-de-fin-de-test-teardown).

---

## Verrouillage de fichier sous Windows (*File locking*)

**Définition simple** : Windows empêche par défaut de supprimer ou de renommer un fichier tant qu'un programme l'a ouvert. Linux laisse faire : le fichier disparaît quand le dernier programme le ferme. Le même code peut donc marcher sous Linux et échouer sous Windows.

**Contexte / exemple concret** : Le défaut de `ouvrirConnexion` (base laissée ouverte après une clé refusée) était invisible sous Linux ; la CI Windows l'a révélé. La fonction referme maintenant la base avant de signaler l'erreur.

**Termes liés** : [EBUSY](#ebusy-fichier-verrouille), [Fichier de verrouillage](#fichier-de-verrouillage-lockfile).

---

## Ménage de fin de test (*Teardown*)

**Définition simple** : Ce qu'un test fait à la fin pour tout remettre en état (fermer les connexions, arrêter les processus, supprimer les fichiers temporaires), dans un bloc exécuté même si le test échoue (`finally`).

**Contexte / exemple concret** : Dans Boutik, `tests/outils/base-temporaire.ts` ferme toutes les bases ouvertes par un test avant de supprimer son dossier ; `lancerApp` arrête l'app et désactive la règle Hyprland même en cas d'échec.

**Termes liés** : [Test unitaire](#test-unitaire-unit-test), [Fixture](#fixture-jeu-de-test), [EBUSY](#ebusy-fichier-verrouille).

---
