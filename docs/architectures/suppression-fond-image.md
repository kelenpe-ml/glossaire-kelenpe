# Suppression de fond d'image hors ligne

## Objectif

Détourer une photo (garder l'objet, retirer le fond) **sur l'ordinateur même** :

- sans envoyer l'image à un service en ligne ;
- sans figer l'interface ;
- sans jamais perdre l'original.

## La carte

![La photo, gardée en mémoire, est réduite puis confiée à un processus séparé qui exécute un modèle embarqué et s'arrête ensuite ; le masque est agrandi, l'aperçu montre l'original ou la version détourée, et seule la version choisie est enregistrée ; en cas d'annulation, de délai dépassé ou d'erreur, l'original est gardé](/diagrams/archi-suppression-fond.svg)

## Décisions

- **Modèle embarqué :** un petit modèle de segmentation (quelques mégaoctets), choisi pour la taille et la vitesse plutôt que pour la meilleure qualité possible. Il est livré avec l'application, sous une licence compatible.
- **Moteur d'exécution :** un moteur de réseaux de neurones embarqué (ONNX Runtime, par exemple), sans accélération graphique si elle alourdit l'installation.
- **Processus séparé, un par image, arrêté après :**
  - l'interface reste fluide ;
  - la mémoire est rendue ;
  - « Annuler » ou un délai maximal tuent simplement le processus.
- **Réduire avant, agrandir après :**
  - le modèle travaille sur une petite image ;
  - seul le masque est agrandi, puis appliqué à l'image entière.
- **Aperçu obligatoire :** toute image venue de l'extérieur passe par un aperçu (original ou détouré, rotation, cadre). Seule la version choisie est enregistrée ; le brouillon reste en mémoire.
- **Plusieurs photos :** l'une après l'autre, avec une progression et « Annuler » ; rien n'est enregistré avant la validation, en une seule transaction.
- **En cas d'erreur, l'original est gardé :** le détourage est un plus, jamais une condition.

## Pièges connus

- **Calcul dans le processus principal :** il gèle toute l'application pendant plusieurs secondes.
- **Mémoire jamais rendue** par un processus gardé en vie : elle grossit à chaque image.
- **Windows :**
  - le moteur a besoin des bibliothèques Visual C++, absentes des postes neufs : les livrer à côté de lui ;
  - retirer les binaires inutiles (autres systèmes, accélération graphique).
- **Orientation des photos de téléphone** (EXIF) : l'appliquer avant le calcul, puis retirer les métadonnées.
- **Appel réseau caché :** vérifier le détourage machine coupée du réseau.

## Exemple : Boutik

État : **construit** (mis à jour le 28 septembre 2026).

- **Le modèle :** U²-Net p (`resources/modeles/u2netp.onnx`, Apache-2.0), exécuté par onnxruntime-node dans un `utilityProcess`, un par image, tué après (Annuler, délai de 30 s).
- **Le code :**
  - `src/main/detourage/` : le main réduit l'image à 320 px et agrandit le masque ;
  - `src/main/images/brouillons.ts` : le brouillon en mémoire ;
  - `components/images/FenetreApercu.tsx` : l'aperçu ;
  - `VerificationLot.tsx` et `lib/lot-images.ts` : jusqu'à 30 photos à la fois.
- **L'empaquetage :** `scripts/apres-empaquetage.cjs` ; les DLL Visual C++ sont copiées par la CI.
- **Les vérifications :** `npm run test:e2e:detourage` (dont réseau coupé), `test:e2e:lot-images`, et le détourage par l'exécutable installé sous Windows.

## Termes liés

[Cutout / Détourage](/media/#cutout-detourage) · [ONNX](/media/#onnx-open-neural-network-exchange) · [onnxruntime](/media/#onnxruntime) · [U²-Net](/media/#u2-net-et-u2-net-p-u2-net) · [utilityProcess](/backend/#utilityprocess) · [Boucle d'événements et tâche bloquante](/backend/#boucle-d-evenements-et-tache-bloquante-event-loop-blocking-task) · [DLL](/devops/#dll-dynamic-link-library) · [Visual C++ Redistributable](/devops/#visual-c-redistributable)
