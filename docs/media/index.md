# Édition média / traitement d'image

Extrait principalement de **Media Editor Forge** (éditeur de statuts type "Story", Android/Kotlin, compositing de calques sur image/vidéo) et de **Prodora** (pipeline de compression d'images catalogue, navigateur + serveur).

[[toc]]

## Timeline

**Définition simple** : la représentation chronologique d'un montage — l'axe sur lequel on positionne les clips, effets et transitions dans le temps, utilisée dans tout outil d'édition vidéo/audio.

**Contexte / exemple concret** : dans un éditeur type Media Editor Forge, même sans timeline multi-clips complexe (l'app édite des statuts courts, pas des films), le concept reste présent via le **z-index** des calques et le temps de présentation (`presentationTimeUs` dans `LayerOverlay.kt`) qui détermine quel visuel s'affiche à quel instant de la vidéo exportée.

**Termes liés** : [Compositing](#compositing), [Z-index](#z-index).

---

## Compositing

**Définition simple** : la fusion de plusieurs éléments visuels (calques, texte, autocollants, vidéo de fond) en une seule image finale — c'est le cœur de tout éditeur de type "Story"/statut.

**Contexte / exemple concret** : `OverlayFrameCompositor` (Media Editor Forge) fait exactement ça : il prend une liste de `Layer` (texte, sticker, forme...), les trie par `zIndex`, et les dessine un par un sur un `Canvas` transparent (`Bitmap.Config.ARGB_8888`) pour produire un unique bitmap superposable à la vidéo via `LayerOverlay` (qui étend `BitmapOverlay` de Media3).

**Termes liés** : [Z-index](#z-index), [Canvas](#canvas), [Alpha / Transparence](#alpha-transparence).

---

## Z-index

**Définition simple** : l'ordre d'empilement des calques — plus le z-index est élevé, plus l'élément est dessiné "au-dessus" des autres.

**Contexte / exemple concret** : `OverlayFrameCompositor.compose()` fait `layers.sortedBy { it.zIndex }` avant de dessiner — le calque avec le plus petit z-index est peint en premier (donc en dessous), les suivants viennent par-dessus.

**Termes liés** : [Compositing](#compositing), [Layer / Calque](#layer-calque).

---

## Layer / Calque

**Définition simple** : un élément visuel indépendant (texte, image, sticker, forme) qu'on peut déplacer, redimensionner ou masquer sans affecter les autres éléments de la composition.

**Contexte / exemple concret** : `Layer.kt` (Media Editor Forge) modélise chaque élément ajoutable à un statut ; `CutoutStickerExtractor.kt` et `BackgroundReplacement` montrent que même le "découpage" d'un sujet sur une photo (retirer le fond) devient un calque manipulable comme les autres.

**Termes liés** : [Z-index](#z-index), [Compositing](#compositing), [Cutout / Détourage](#cutout-detourage).

---

## Cutout / Détourage

**Définition simple** : extraire un sujet (typiquement une personne) de son arrière-plan dans une image, pour pouvoir le replacer ailleurs ou changer le fond — souvent via segmentation par IA plutôt qu'un simple contour manuel.

**Contexte / exemple concret** : `SelfieSegmenterEngine.kt` et `CutoutStickerExtractor.kt` dans Media Editor Forge utilisent la segmentation de sujet (type ML Kit Selfie Segmentation) pour transformer une photo en sticker détouré ou remplacer l'arrière-plan (`BackgroundReplacementEffect.kt`, `BackgroundStillCompositor.kt`).

**Termes liés** : [Layer / Calque](#layer-calque), [Compositing](#compositing).

---

## Canvas

**Définition simple** : la surface de dessin 2D sur laquelle on peint des formes, du texte ou des bitmaps — le concept de base de tout moteur de rendu graphique (ici, l'API `android.graphics.Canvas`).

**Contexte / exemple concret** : `OverlayFrameCompositor` crée un `Bitmap` puis un `Canvas(frame)` pour y dessiner chaque calque, avant de le passer en overlay sur la vidéo exportée.

**Termes liés** : [Compositing](#compositing), [Alpha / Transparence](#alpha-transparence).

---

## Alpha / Transparence

**Définition simple** : le canal qui détermine l'opacité d'un pixel (0 = totalement transparent, 255 = totalement opaque), indispensable pour superposer des calques sans cacher ce qu'il y a en dessous.

**Contexte / exemple concret** : un commentaire de code dans `OverlayFrameCompositor` révèle un piège classique du rendu graphique : *"Canvas left a Skia-premultiplied buffer; Media3 getMixColor expects straight."* — Android/Skia stocke l'alpha en "premultiplied" (les couleurs RVB sont déjà multipliées par l'alpha) alors que Media3 attend un format "straight alpha" (RVB non multiplié) ; sans conversion (`ensureStraightAlphaForGl`), les couleurs de l'overlay seraient faussées à l'export.

**Termes liés** : [Compositing](#compositing), [Canvas](#canvas).

---

## Compression d'image

**Définition simple** : réduire la taille (en octets) d'une image en supprimant de l'information visuelle jugée peu perceptible (compression *lossy*, avec perte) ou en réorganisant les données sans rien perdre (*lossless*, sans perte).

**Contexte / exemple concret** : Prodora impose une règle unique pour toutes les images catalogue : format **WebP** (lossy), qualité **0.8**, dimension max **1024px** sur le grand côté. Deux implémentations miroir : `optimizeImageUpload.ts` compresse côté navigateur *avant* l'upload (pour économiser la bande passante mobile du vendeur), et `ImageWebPCompressor.kt` recompresse en lot les images déjà stockées sur S3 côté serveur. Si la version WebP n'est pas plus légère que l'originale, le serveur garde l'original — pas de régression.

**Calcul** : taux de compression = 1 − (taille compressée ÷ taille originale), souvent exprimé en %.
*Exemple* : une photo catalogue de 5 Mo compressée à 400 Ko → taux de compression = 1 − (400 / 5000) = 1 − 0,08 = **92 %** de réduction.

**Termes liés** : [WebP](#webp), [Lossy vs Lossless](#lossy-vs-lossless).

---

## WebP

**Définition simple** : un format d'image moderne (créé par Google) offrant un meilleur ratio poids/qualité que JPEG pour la photographie, avec un support navigateur désormais quasi universel.

**Contexte / exemple concret** : format cible unique de tout le pipeline image de Prodora (catalogue produits), aussi bien pour les nouveaux uploads que pour la recompression batch des anciennes photos legacy stockées en JPEG.

**Termes liés** : [Compression d'image](#compression-d-image), [Lossy vs Lossless](#lossy-vs-lossless).

---

## Lossy vs Lossless

**Définition simple** : *lossy* (avec perte) = la compression jette de l'information non récupérable pour gagner en taille (c'est le cas de WebP en mode lossy, comme JPEG) ; *lossless* (sans perte) = la taille diminue mais l'image reconstruite est bit-à-bit identique à l'original (PNG, WebP en mode lossless).

**Contexte / exemple concret** : Prodora utilise WebP en mode **lossy** avec une qualité de 0.8 (sur une échelle 0-1) — un compromis assumé entre poids de fichier et fidélité visuelle, adapté à des photos produit consultées sur mobile plutôt qu'imprimées.

**Termes liés** : [Compression d'image](#compression-d-image), [WebP](#webp).
