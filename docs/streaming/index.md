# Transcoding & streaming vidéo

Extrait principalement de **Reelforge** (pipeline de transcodage vidéo en Go, Kelenpe) et **Ayena** (app de feed vidéo vertical façon reels, lecteur Android/Kotlin avec Media3/ExoPlayer).

[[toc]]

## Transcodage (*Transcoding*)

**Définition simple** : convertir un fichier vidéo (ou audio) d'un format/codec/résolution vers un ou plusieurs autres, généralement pour l'adapter à différents appareils et réseaux.

**Contexte / exemple concret** : dans **Reelforge**, chaque vidéo uploadée déclenche un pipeline : `probe → thumbnail → transcode (CMAF) → VMAF → package (HLS + DASH)`. Le transcodage produit plusieurs **renditions** (voir plus bas) à partir d'une seule source, via FFmpeg sur des workers GPU (NVENC).

**Termes liés** : [Rendition](#rendition), [ABR](#abr-adaptive-bitrate-streaming), [Codec](#codec), [Bitrate](#bitrate).

---

## Rendition

**Définition simple** : une version encodée d'une même vidéo source, à une résolution et un bitrate donnés (ex. 1080p, 720p, 480p, 360p). L'ensemble des renditions forme la "ladder" (échelle) ABR.

**Contexte / exemple concret** : chez Reelforge, la ladder par défaut produit 4 renditions H.264 : 1080p (5000 kbps), 720p (2800 kbps), 480p (1400 kbps), 360p (800 kbps) — voir `docs/ffmpeg-presets.md`. Chaque rendition manquée ou sous le seuil qualité (VMAF < 85) est marquée `failed` et repart en retry.

**Termes liés** : [ABR](#abr-adaptive-bitrate-streaming), [Bitrate](#bitrate), [Résolution](#resolution-resolution), [VMAF](#vmaf).

---

## ABR (*Adaptive Bitrate Streaming*)

**Définition simple** : la technique qui permet au lecteur vidéo de changer de rendition (qualité) en cours de lecture selon la bande passante et les performances de l'appareil, sans interrompre la lecture — c'est ce qui évite le freeze quand le réseau se dégrade.

**Contexte / exemple concret** : Reelforge encode systématiquement en ladder ABR (plusieurs renditions H.264 packagées en HLS + DASH via CMAF) pour que le lecteur choisisse la meilleure qualité disponible en temps réel. Côté lecture, **Ayena** applique une version applicative du même principe : `VideoPlayerPool` force une **rendition basse au démarrage** (`forceLow = true`, 480×854, bitrate max 1,2 Mbps) puis relève la qualité ~900ms après la première frame rendue (`scheduleQualityLift`), pour un démarrage rapide sans flash de qualité.

**Termes liés** : [Rendition](#rendition), [Bitrate](#bitrate), [HLS](#hls-http-live-streaming), [DASH](#dash-dynamic-adaptive-streaming-over-http), [Buffering](#buffering-stall).

---

## HLS (*HTTP Live Streaming*)

**Définition simple** : un protocole de streaming (créé par Apple) qui découpe une vidéo en petits segments (fichiers `.m4s`/`.ts`) décrits par une playlist texte (`.m3u8`), livrée via HTTP standard — donc compatible avec n'importe quel CDN.

**Contexte / exemple concret** : Reelforge génère un `master.m3u8` (playlist maître listant les renditions) et une `playlist.m3u8` par rendition, avec des segments fMP4 de 4 secondes (`-hls_time 4`). Ayena consomme ces flux HLS côté lecteur via ExoPlayer/Media3.

**Termes liés** : [DASH](#dash-dynamic-adaptive-streaming-over-http), [CMAF](#cmaf), [ABR](#abr-adaptive-bitrate-streaming).

---

## DASH (*Dynamic Adaptive Streaming over HTTP*)

**Définition simple** : l'équivalent "standard ouvert" (MPEG) de HLS — même principe de segments + manifeste (ici un fichier `.mpd` au lieu de `.m3u8`), plus utilisé côté web/Android hors écosystème Apple.

**Contexte / exemple concret** : Reelforge package chaque vidéo en HLS **et** DASH à partir des mêmes segments CMAF (`pipeline.Package()`), pour couvrir tous les lecteurs cibles sans dupliquer l'encodage.

**Termes liés** : [HLS](#hls-http-live-streaming), [CMAF](#cmaf).

---

## CMAF

**Définition simple** : *Common Media Application Format* — un format de segmentation vidéo unique (fMP4) qui sert à la fois de base pour HLS et DASH, évitant d'encoder/stocker deux fois la même vidéo pour les deux protocoles.

**Contexte / exemple concret** : principe non négociable de l'architecture Reelforge ("Packaging CMAF — Segments fMP4 réutilisables pour HLS + DASH") : chaque rendition produit un `init.mp4` (segment d'initialisation) et des `seg_XXXX.m4s` (segments de 4s) partagés par les deux manifestes.

**Termes liés** : [HLS](#hls-http-live-streaming), [DASH](#dash-dynamic-adaptive-streaming-over-http), [Rendition](#rendition).

---

## Bitrate

**Définition simple** : la quantité de données vidéo (ou audio) transmise par seconde, généralement en kbps (kilobits/seconde) ou Mbps. Plus le bitrate est élevé, meilleure est potentiellement la qualité, mais plus lourd est le flux à télécharger.

**Contexte / exemple concret** : la ladder Reelforge va de 800 kbps (360p, mobile 3G/4G) à 5000 kbps (1080p, desktop/TV). Ayena limite le bitrate max à 1,2 Mbps en mode "basse qualité" au démarrage (`setMaxVideoBitrate(1_200_000)`).

**Termes liés** : [Résolution](#resolution-resolution), [Rendition](#rendition), [Codec](#codec).

---

## Résolution (*Resolution*)

**Définition simple** : le nombre de pixels qui composent l'image vidéo, exprimé en largeur × hauteur (ex. 1920×1080 = "1080p"). Ne pas confondre avec le bitrate : une haute résolution avec un bitrate trop bas produira des artefacts de compression malgré la netteté nominale.

**Contexte / exemple concret** : chaque rendition Reelforge associe une résolution à un bitrate cohérent (1080p → 5000 kbps, 360p → 800 kbps) — c'est ce couple qui définit une rendition, pas la résolution seule.

**Termes liés** : [Bitrate](#bitrate), [Rendition](#rendition).

---

## Codec

**Définition simple** : l'algorithme qui compresse (encode) et décompresse (decode) un flux vidéo ou audio. H.264 est le codec vidéo standard le plus compatible ; des codecs plus récents (H.265/HEVC, AV1) compressent mieux mais sont moins universellement supportés.

**Contexte / exemple concret** : Reelforge encode en H.264 (`-c:v libx264` en dev/CPU, `-c:v h264_nvenc` en prod/GPU) pour la compatibilité maximale, et AAC pour l'audio (`-c:a aac -b:a 128k`).

**Termes liés** : [Bitrate](#bitrate), [Transcodage](#transcodage-transcoding).

---

## VMAF

**Définition simple** : *Video Multi-Method Assessment Fusion* — une métrique développée par Netflix (0 à 100) qui évalue la qualité perçue d'une vidéo encodée par rapport à sa source, en simulant le jugement humain plutôt qu'une simple mesure mathématique de différence de pixels.

**Contexte / exemple concret** : Reelforge impose un score VMAF minimum de **85** avant de marquer une rendition `ready` — en dessous, la rendition est `failed` et repart en retry via une DLQ (dead-letter queue) SQS. C'est le contrôle qualité automatique du pipeline.

**Termes liés** : [Rendition](#rendition), [Transcodage](#transcodage-transcoding).

---

## Buffering / Stall

**Définition simple** : l'interruption de la lecture pendant que le lecteur attend de recevoir suffisamment de données pour continuer — la fameuse "roue qui tourne". Différent du **freeze** (voir plus bas) qui peut avoir d'autres causes.

**Contexte / exemple concret** : en ABR, un buffering fréquent signale que la rendition choisie est trop lourde pour la bande passante réelle — c'est justement ce que le mécanisme de preload/qualité progressive d'Ayena cherche à éviter en démarrant toujours en basse qualité.

**Termes liés** : [ABR](#abr-adaptive-bitrate-streaming), [Preload](#preload), [Freeze](#freeze).

---

## Freeze

**Définition simple** : une image vidéo qui se fige à l'écran sans forcément que le son s'arrête, ou un plantage visuel de la lecture — cause fréquente : un changement de piste vidéo brutal (ex. relever la qualité) qui crée un flash ou un gel d'une frame le temps que le nouveau flux se synchronise.

**Contexte / exemple concret** : c'est précisément ce que le code de `VideoPlayerPool.kt` dans Ayena cherche à éviter — un commentaire dans le code précise : on ne relève pas la qualité dès `STATE_READY` "ça flash juste au moment du reveal poster→vidéo", donc l'app attend ~900ms après la première frame rendue (`onRenderedFirstFrame`) avant d'augmenter la qualité, avec une marge "anti-stutter codec".

**Termes liés** : [Buffering / Stall](#buffering-stall), [ABR](#abr-adaptive-bitrate-streaming).

---

## Preload

**Définition simple** : précharger tout ou partie d'un contenu (vidéo, image) avant que l'utilisateur en ait besoin, pour que la lecture démarre instantanément quand il l'atteint (au lieu d'attendre un aller-retour réseau).

**Contexte / exemple concret** : `FeedPreloadController.kt` dans Ayena utilise `DefaultPreloadManager` (Media3) avec un **ranking** basé sur la distance à l'index courant du feed : la vidéo suivante (+1) est préchargée 2 secondes, la précédente (-1) 1 seconde, celle à +2 seulement 500ms — et rien au-delà. En mode basse consommation (`lowPower`), seule la vidéo +1 est préchargée, et moins longtemps (800ms).

**Termes liés** : [Pooling](/backend/#pooling), [Buffering / Stall](#buffering-stall), [Prefetch](#prefetch).

---

## Prefetch

**Définition simple** : très proche de preload — télécharger par avance une ressource (souvent au niveau réseau/disque plutôt qu'au niveau lecteur) pour qu'elle soit disponible localement quand on en a besoin.

**Contexte / exemple concret** : dans le module de feed vidéo de Kelenpe (package `progressive_video_cache`, app Flutter), un `ReelPrefetchController` télécharge progressivement les vidéos à venir dans le cache disque (`getPlayablePath(url)`) tandis qu'un **scheduler** limite le nombre de téléchargements/initialisations en parallèle. Le nombre de téléchargements simultanés autorisés (`allowedConcurrent`, typiquement 1 à 3) est piloté par un **moniteur réseau** (`NetworkPressureMonitor`) qui observe le taux de succès/échec et la latence pour classer l'état réseau en `healthy` / `degraded` / `down`.

**Termes liés** : [Preload](#preload), [Pooling](/backend/#pooling), [Caching](/backend/#caching).
