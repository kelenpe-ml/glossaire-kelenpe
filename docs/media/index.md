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

![Calques empiles par z-index sur un canvas transparent](/diagrams/compositing-zindex.svg)

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

**Termes liés** : [Layer / Calque](#layer-calque), [Compositing](#compositing), [Suppression de fond d'image hors ligne](/architectures/suppression-fond-image).

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

---

## ESC/POS

**Définition simple** : Le langage de commandes des imprimantes de tickets, créé par Epson et repris par presque toutes les marques : des suites d'octets qui disent « écris ce texte », « mets en gras », « coupe le papier », « ouvre le tiroir ».

**Contexte / exemple concret** : `main/impression/ticket.ts` de Boutik fabrique les octets ESC/POS du ticket (en-tête de la boutique, lignes, total), testés octet par octet contre des fichiers de référence.

**Termes liés** : [Imprimante thermique](#imprimante-thermique-thermal-printer), [Mode RAW](/devops/#mode-raw), [Fichier de référence](/devops/#fichier-de-reference-golden-file), [Impression de tickets ESC/POS](/architectures/impression-escpos).

---

## Imprimante thermique (*Thermal printer*)

**Définition simple** : Une imprimante sans encre : sa tête chauffe un papier spécial, qui noircit là où il est chauffé. Rapide, silencieuse, sans cartouche : c'est l'imprimante des tickets de caisse.

**Contexte / exemple concret** : L'imprimante de tickets visée par Boutik, en réseau ou en USB, pilotée en ESC/POS.

**Termes liés** : [ESC/POS](#esc-pos), [Rouleau 58 / 80 mm](#rouleau-58-80-mm-paper-roll-width).

---

## Rouleau 58 / 80 mm (*Paper roll width*)

**Définition simple** : Les deux largeurs courantes de papier des imprimantes de tickets. Elles déterminent le nombre de caractères par ligne : environ 32 en 58 mm, 48 en 80 mm.

**Contexte / exemple concret** : Boutik adapte la mise en page du ticket à la largeur choisie dans Réglages → Imprimante.

**Termes liés** : [Imprimante thermique](#imprimante-thermique-thermal-printer), [ESC/POS](#esc-pos).

---

## Table de caractères (*Code page, PC850, PC858*)

**Définition simple** : La correspondance entre des octets et des lettres, que l'imprimante utilise pour écrire. PC850 contient les lettres accentuées d'Europe de l'Ouest ; PC858 est la même avec le symbole €.

**Contexte / exemple concret** : Boutik sélectionne une table de caractères en début de ticket pour que « Épicerie », « crédit » ou « reçu » s'impriment avec leurs accents.

**Termes liés** : [ESC/POS](#esc-pos).

---

## Coupe du papier (*Paper cut*)

**Définition simple** : La commande ESC/POS qui fait couper le ticket par le massicot intégré de l'imprimante, en entier ou en laissant une petite attache.

**Contexte / exemple concret** : Chaque ticket de Boutik se termine par une coupe (elle n'est pas dessinée dans l'émulateur de développement).

**Termes liés** : [ESC/POS](#esc-pos), [Imprimante thermique](#imprimante-thermique-thermal-printer).

---

## Ouverture du tiroir-caisse (*Cash drawer kick*)

**Définition simple** : Le tiroir-caisse se branche sur l'imprimante de tickets ; une commande ESC/POS (`ESC p`) envoie une impulsion qui le fait s'ouvrir.

**Contexte / exemple concret** : Boutik ouvre le tiroir après une vente comptant ou mixte, jamais après une vente à crédit (pas d'argent à ranger), si l'option est cochée.

**Termes liés** : [ESC/POS](#esc-pos), [Imprimante thermique](#imprimante-thermique-thermal-printer).

---

## Impression raster (*Raster printing*)

**Définition simple** : Imprimer une image point par point (une grille de pixels noirs et blancs), plutôt que du texte avec les polices de l'imprimante.

**Contexte / exemple concret** : Nécessaire pour imprimer un logo ou un code QR sur le ticket de Boutik ; le texte, lui, reste en caractères de l'imprimante, plus nets et plus rapides.

**Termes liés** : [ESC/POS](#esc-pos), [Code QR](#code-qr-qr-code).

---

## Code QR (*QR code*)

**Définition simple** : Un carré de petits points qui contient un texte (une adresse web, un numéro), lisible par l'appareil photo d'un téléphone.

**Contexte / exemple concret** : Piste pour les tickets de Boutik : un code QR renvoyant vers un reçu, un moyen de paiement ou un contact.

**Termes liés** : [Impression raster](#impression-raster-raster-printing).

---

## Emoji

**Définition simple** : Un petit pictogramme en couleur (🍚, 📦) qui fait partie du texte, comme une lettre.

**Contexte / exemple concret** : Chaque produit de Boutik a un emoji, affiché quand il n'a pas d'image (et quand son image est retirée de la collection).

**Termes liés** : [Miniature](#miniature-thumbnail).

---

## Data URL

**Définition simple** : Une façon d'écrire un fichier entier (souvent une image) directement dans du texte, sous la forme `data:image/jpeg;base64,…`, au lieu de pointer vers un fichier.

**Contexte / exemple concret** : Les premières images de produits de Boutik étaient des data URL rangées dans les événements. Elles s'affichent toujours, mais toute nouvelle image passe par la collection et n'est plus qu'une référence.

**Termes liés** : [Base64](#base64), [Payload](/backend/#payload-charge-utile), [Adressage par contenu](/backend/#adressage-par-contenu-content-addressing).

---

## Base64

**Définition simple** : Une façon d'écrire n'importe quelles données binaires (une image, une clé) avec seulement 64 caractères ordinaires (lettres, chiffres, + et /), pour les faire passer là où seul du texte est permis. Le résultat est environ un tiers plus long.

**Contexte / exemple concret** : Les anciennes images intégrées de Boutik sont en base64 ; la clé de la base est aussi écrite en base64 dans `boutik.key`.

**Termes liés** : [Data URL](#data-url).

**Calcul** : taille en base64 ≈ taille d'origine × 4 / 3. Une image de 30 Ko devient environ 40 Ko de texte.

---

## JPEG

**Définition simple** : Le format de photo le plus répandu, avec perte : il jette des détails peu visibles pour gagner beaucoup de place. Il ne gère pas la transparence.

**Contexte / exemple concret** : La plupart des photos que reçoit Boutik sont des JPEG de téléphone ; elles sont converties en WebP à l'enregistrement.

**Termes liés** : [Lossy vs Lossless](#lossy-vs-lossless), [WebP](#webp), [PNG](#png).

---

## PNG

**Définition simple** : Un format d'image sans perte, qui gère la transparence : idéal pour les captures d'écran, les logos, les images détourées, mais lourd pour les photos.

**Contexte / exemple concret** : Une capture d'écran collée par Ctrl+V dans Boutik arrive en PNG ; les détourages de l'essai pesaient 194 à 477 Ko en PNG contre 11 à 25 Ko en WebP.

**Termes liés** : [Lossy vs Lossless](#lossy-vs-lossless), [WebP](#webp), [Alpha / Transparence](#alpha-transparence).

---

## HEIC

**Définition simple** : Le format photo par défaut des iPhone : de bonne qualité, mais peu lu en dehors des appareils Apple (Chromium ne le lit pas).

**Contexte / exemple concret** : Boutik refuse le HEIC avec un message qui explique le réglage à changer sur l'iPhone : Réglages › Appareil photo › Formats › « Le plus compatible ».

**Termes liés** : [JPEG](#jpeg), [AVIF](#avif).

---

## AVIF

**Définition simple** : Un format d'image récent, encore plus compact que WebP à qualité égale, mais très lent à encoder.

**Contexte / exemple concret** : Écarté pour Boutik : un tiers plus petit que WebP, mais 28 fois plus lent (1,3 s par photo) et 8,4 Mo de plus dans l'installateur.

**Termes liés** : [WebP](#webp), [Compression d'image](#compression-d-image).

---

## JPEG XL

**Définition simple** : Un format d'image moderne, très efficace, avec ou sans perte, mais retiré de Chromium : les navigateurs ne l'affichent pas.

**Contexte / exemple concret** : Non retenu pour Boutik, puisque l'interface (Chromium) ne pourrait pas l'afficher.

**Termes liés** : [AVIF](#avif), [WebP](#webp).

---

## Masque (*Mask*)

**Définition simple** : Une image en niveaux de gris qui dit, pour chaque pixel, s'il appartient au sujet (blanc), au fond (noir), ou entre les deux (gris). Appliqué à une photo, il sert à en retirer le fond.

**Contexte / exemple concret** : Les modèles de détourage essayés pour Boutik produisent un masque, ensuite collé comme canal alpha sur la photo d'origine.

**Termes liés** : [Cutout / Détourage](#cutout-detourage), [Alpha / Transparence](#alpha-transparence).

---

## Fond en damier (*Checkerboard background*)

**Définition simple** : Le quadrillage gris et blanc qu'affichent les logiciels derrière une image transparente, pour montrer où il n'y a rien.

**Contexte / exemple concret** : Les planches de l'essai de détourage de Boutik montrent chaque produit détouré sur un damier.

**Termes liés** : [Alpha / Transparence](#alpha-transparence), [Cutout / Détourage](#cutout-detourage).

---

## Rogner / recadrer (*Crop*)

**Définition simple** : Couper les bords d'une image pour ne garder qu'une partie (rogner), éventuellement dans une proportion précise (recadrer, par exemple en carré).

**Contexte / exemple concret** : Piste pour la fiche produit de Boutik : recadrer la photo sur le produit avant de l'enregistrer.

**Termes liés** : [Miniature](#miniature-thumbnail).

---

## Miniature (*Thumbnail*)

**Définition simple** : Une petite version d'une image, faite pour les listes et les grilles : bien plus légère que l'image entière, elle s'affiche plus vite.

**Contexte / exemple concret** : Chaque image de Boutik a une miniature de 256 pixels (environ 15 Ko), utilisée par la caisse, le Stock et la collection ; l'image de 1024 pixels n'est ouverte que dans la fiche de l'image.

**Termes liés** : [Chargement progressif](/frontend/#chargement-progressif-lazy-loading), [Compression d'image](#compression-d-image), [WebP](#webp).

---

## Métadonnées EXIF (*EXIF metadata*)

**Définition simple** : Des informations cachées dans une photo : modèle du téléphone, date, sens de la prise de vue, et parfois la position GPS exacte.

**Contexte / exemple concret** : Boutik lit le sens de la photo (orientation) pour la remettre droite, puis n'écrit aucune métadonnée dans le WebP : la position de la boutique ou du domicile ne voyage pas avec les images.

**Termes liés** : [Orientation EXIF](#orientation-exif-exif-orientation), [JPEG](#jpeg).

---

## Orientation EXIF (*EXIF orientation*)

**Définition simple** : Un réglage dans les métadonnées d'une photo qui dit « à afficher tournée de 90° », au lieu de tourner vraiment les pixels. Un programme qui l'ignore montre la photo couchée.

**Contexte / exemple concret** : nativeImage d'Electron ignore ce réglage ; Boutik le lit lui-même (`pixels.ts`) et tourne l'image. Une photo 40×20 marquée « orientation 6 » est enregistrée droite, en 20×40.

**Termes liés** : [Métadonnées EXIF](#metadonnees-exif-exif-metadata).

---

## Alpha prémultiplié (*Premultiplied alpha*)

**Définition simple** : Une façon de stocker les pixels transparents où la couleur est déjà multipliée par l'opacité. Pratique pour dessiner, mais il faut la « démultiplier » avant d'enregistrer dans un format comme WebP, sinon les bords semi-transparents foncent.

**Contexte / exemple concret** : Les pixels rendus par nativeImage (Skia) sont prémultipliés ; Boutik les remet en alpha « droit » (`versRgbaDroit`) avant d'encoder.

**Termes liés** : [Alpha / Transparence](#alpha-transparence), [Skia](#skia).

**Calcul** : couleur prémultipliée = couleur × alpha / 255. Pour revenir : couleur = couleur prémultipliée × 255 / alpha (si alpha > 0).

---

## Skia

**Définition simple** : La bibliothèque de dessin 2D de Google, utilisée par Chromium (et donc Electron) pour afficher les pages, décoder et redimensionner les images.

**Contexte / exemple concret** : Boutik décode et réduit les photos JPEG et PNG avec nativeImage, qui s'appuie sur Skia : 173 ms pour décoder une photo de 12 millions de pixels, 70 ms pour la réduire.

**Termes liés** : [nativeImage](#nativeimage), [Chromium](/frontend/#chromium).

---

## nativeImage

**Définition simple** : L'outil d'Electron pour manipuler des images dans le processus principal : les lire, les redimensionner, en extraire les pixels.

**Contexte / exemple concret** : Premier maillon de la chaîne d'images de Boutik (`preparer.ts`) : il décode JPEG et PNG et les réduit à 1024 pixels, sans module natif à ajouter.

**Termes liés** : [Skia](#skia), [Electron](/devops/#electron), [Redimensionnement](#redimensionnement-resizing-lanczos).

---

## Redimensionnement (*Resizing, Lanczos*)

**Définition simple** : Changer la taille d'une image en recalculant ses pixels. Les méthodes soignées (comme Lanczos) gardent la netteté sans créer de crénelage.

**Contexte / exemple concret** : Boutik réduit toute photo à 1024 pixels au plus. La réduction de nativeImage (« best ») donne le même résultat qu'un Lanczos (SSIM 0,997), 27 fois plus vite que la version WebAssembly essayée.

**Termes liés** : [nativeImage](#nativeimage), [SSIM](#ssim-structural-similarity).

---

## SSIM (*Structural Similarity*)

**Définition simple** : Une note de 0 à 1 qui mesure à quel point deux images se ressemblent pour l'œil humain (1 = identiques). Au-dessus d'environ 0,985, on ne voit pas de différence.

**Contexte / exemple concret** : L'essai de Boutik a cherché, pour chaque format, la plus petite taille qui garde un SSIM d'au moins 0,985 : c'est ainsi qu'a été fixée la qualité WebP à 88.

**Termes liés** : [Compression d'image](#compression-d-image), [WebP](#webp).

---

## Modèle d'IA (*AI model, réseau de neurones*)

**Définition simple** : Un programme qui a « appris » une tâche à partir de milliers d'exemples, au lieu d'être écrit règle par règle. Un réseau de neurones est une forme de modèle faite de couches de calculs très simples, en très grand nombre.

**Contexte / exemple concret** : Les modèles de détourage essayés pour Boutik (U²-Net p, BEN2…) ont appris à reconnaître le produit sur des milliers de photos déjà détourées.

**Termes liés** : [Poids d'un modèle](#poids-d-un-modele-model-weights), [Inférence](#inference-inference), [Cutout / Détourage](#cutout-detourage).

---

## Poids d'un modèle (*Model weights*)

**Définition simple** : Les millions de nombres qu'un modèle a appris pendant son entraînement ; ce sont eux qui contiennent son « savoir ». Ils ont leur propre licence, parfois différente de celle du code.

**Contexte / exemple concret** : Les poids d'U²-Net p pèsent 4,6 Mo (+12 Mo dans l'installateur avec le moteur) ; ceux d'IS-Net ont été écartés, faute de licence claire.

**Termes liés** : [Modèle d'IA](#modele-d-ia-ai-model-reseau-de-neurones), [Licence logicielle](/business/#licence-logicielle-software-license).

---

## Inférence (*Inference*)

**Définition simple** : Utiliser un modèle déjà entraîné pour obtenir une réponse sur une nouvelle donnée (ici : le masque d'une photo). C'est l'étape « d'usage », par opposition à l'entraînement.

**Contexte / exemple concret** : Sur 2 cœurs, l'inférence de U²-Net p prend environ 1,2 s par photo, celle de BEN2 59 s.

**Termes liés** : [Modèle d'IA](#modele-d-ia-ai-model-reseau-de-neurones), [onnxruntime](#onnxruntime).

---

## ONNX (*Open Neural Network Exchange*)

**Définition simple** : Un format de fichier standard pour les modèles d'IA : un modèle entraîné avec un outil peut être exécuté par un autre.

**Contexte / exemple concret** : Les modèles de détourage de l'essai Boutik sont des fichiers `.onnx`, exécutés sans Python.

**Termes liés** : [onnxruntime](#onnxruntime), [Modèle d'IA](#modele-d-ia-ai-model-reseau-de-neurones).

---

## onnxruntime

**Définition simple** : Le moteur de Microsoft qui exécute les modèles ONNX, sur le processeur ou la carte graphique. `onnxruntime-node` le rend utilisable depuis Node.js.

**Contexte / exemple concret** : Moteur de l'essai de détourage de Boutik, limité à 2 fils de calcul ; il ajouterait 7,4 Mo (compressés) à l'installateur Windows.

**Termes liés** : [ONNX](#onnx-open-neural-network-exchange), [Inférence](#inference-inference), [DirectML](#directml).

---

## DirectML

**Définition simple** : La technologie de Windows qui fait calculer les modèles d'IA sur la carte graphique, quelle que soit sa marque.

**Contexte / exemple concret** : Livrée avec onnxruntime pour Windows (15 Mo compressés), mais inutile si Boutik calcule sur le processeur : elle pourrait être exclue.

**Termes liés** : [onnxruntime](#onnxruntime).

---

## Précision fp16 / fp32 (*Floating point precision*)

**Définition simple** : La taille des nombres à virgule d'un modèle : fp32 (32 bits) est la précision habituelle ; fp16 (16 bits) divise la taille par deux, au prix d'une précision un peu moindre.

**Contexte / exemple concret** : Deux versions de BiRefNet lite ont été essayées pour Boutik : fp32 (171 Mo) et fp16 (87 Mo). Toutes deux dépassaient 3 Go de mémoire.

**Termes liés** : [Poids d'un modèle](#poids-d-un-modele-model-weights), [Modèle d'IA](#modele-d-ia-ai-model-reseau-de-neurones).

---

## Résolution d'entrée d'un modèle (*Model input resolution*)

**Définition simple** : La taille fixe (en pixels) des images que le modèle attend : toute photo est d'abord réduite à cette taille. Plus elle est grande, plus le résultat est fin, et plus le calcul est lent et gourmand.

**Contexte / exemple concret** : U²-Net p travaille en 320×320, BEN2 en 1024×1024, d'où ses 59 s et 3,1 Go ; piste notée : réexporter BEN2 en 512 pixels.

**Termes liés** : [Modèle d'IA](#modele-d-ia-ai-model-reseau-de-neurones), [Inférence](#inference-inference).

---

## Jeu de données d'entraînement (*Training dataset, DIS5K, DUTS*)

**Définition simple** : La collection d'exemples (photos et réponses attendues) sur laquelle un modèle apprend. Ses conditions d'utilisation peuvent limiter l'usage du modèle. DIS5K et DUTS sont deux jeux de photos détourées.

**Contexte / exemple concret** : DIS5K n'est autorisé que pour un usage non commercial : c'est pourquoi le modèle IS-Net, entraîné dessus, a été écarté pour Boutik.

**Termes liés** : [Poids d'un modèle](#poids-d-un-modele-model-weights), [Licence non commerciale](/business/#licence-non-commerciale-non-commercial-license).

---

## U²-Net et U²-Net p (*U2-Net*)

**Définition simple** : Des modèles de détourage publiés en 2020 sous licence Apache-2.0. U²-Net p est la version « petite » : 4,6 Mo, rapide, un peu moins précise.

**Contexte / exemple concret** : Recommandé par l'essai de Boutik : +12 Mo à l'installateur, 1,2 s par photo sur 2 cœurs, moins de 0,5 Go de mémoire. Il réussit les produits posés sur fond simple, mais pas les sachets transparents.

**Termes liés** : [Cutout / Détourage](#cutout-detourage), [BEN2](#ben2), [Modèle d'IA](#modele-d-ia-ai-model-reseau-de-neurones).

---

## BEN2

**Définition simple** : Un modèle de détourage récent (licence MIT), très précis, mais lourd.

**Contexte / exemple concret** : Le seul de l'essai de Boutik à garder les sachets transparents de grains en entier, mais au prix de 59 s et 3,1 Go par photo : inutilisable sur un PC de boutique.

**Termes liés** : [U²-Net et U²-Net p](#u2-net-et-u2-net-p-u2-net), [BiRefNet](#birefnet).

---

## BiRefNet

**Définition simple** : Un modèle de détourage de haute qualité (licence MIT), avec une version « lite » plus légère.

**Contexte / exemple concret** : Éliminé dans l'essai de Boutik : plus de 3 Go de mémoire, même en version lite ; sans plafond, il a dépassé 5,6 Go.

**Termes liés** : [BEN2](#ben2), [Mémoire saturée](/devops/#memoire-saturee-out-of-memory-oom).

---

## IS-Net

**Définition simple** : Un modèle de détourage des auteurs d'U²-Net, entraîné sur le jeu DIS5K.

**Contexte / exemple concret** : Mesuré pour comparaison (8 s par photo), mais écarté pour Boutik : ses poids n'ont pas de licence claire et son jeu d'entraînement est non commercial.

**Termes liés** : [Jeu de données d'entraînement](#jeu-de-donnees-d-entrainement-training-dataset-dis5k-duts), [U²-Net et U²-Net p](#u2-net-et-u2-net-p-u2-net).

---

## RMBG (*BRIA*)

**Définition simple** : Des modèles de détourage de la société BRIA (RMBG-1.4 et 2.0), de bonne qualité, mais sous une licence qui interdit l'usage commercial.

**Contexte / exemple concret** : Écartés d'office pour Boutik, qui est un produit commercial.

**Termes liés** : [Licence non commerciale](/business/#licence-non-commerciale-non-commercial-license), [Cutout / Détourage](#cutout-detourage).

---
