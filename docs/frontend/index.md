# Frontend & UI/UX

Vocabulaire du visuel et de l'interface, avec des repères vers les projets Kelenpe (Kelenpe Studio, Kelenpe Ads Studio, Prodora Frontend) là où c'est pertinent.

[[toc]]

## Carousel

**Définition simple** : un composant d'interface qui affiche une série d'éléments (images, cartes, slides) l'un après l'autre dans un espace limité, navigable manuellement (swipe/flèches) ou automatiquement.

**Contexte / exemple concret** : sur Prodora, une fiche produit avec plusieurs photos utilise typiquement un carousel pour les parcourir sans allonger la page ; côté Kelenpe Ads Studio, l'aperçu d'une campagne avec plusieurs créatifs (images/vidéos, voir `AdPreview.tsx`) suit la même logique.

**Termes liés** : [Banner](#banner-banniere), [Fade](#fade).

---

## Banner (*Bannière*)

**Définition simple** : un bloc visuel large et généralement horizontal, mis en avant en haut ou au centre d'une page, souvent utilisé pour une promotion, une annonce ou un message clé.

**Contexte / exemple concret** : la home de Kelenpe Studio (site vitrine) ou une page marketplace Prodora peuvent afficher une bannière pour une opération commerciale — à ne pas confondre avec le "Hero" (voir plus bas), qui est plus spécifiquement la première section visible d'une landing page.

**Termes liés** : [Hero section](#hero-section), [Carousel](#carousel).

---

## Hero section

**Définition simple** : la première section visible d'une page, en haut, généralement avec un titre fort, un visuel marquant et un call-to-action — c'est la "vitrine" qui doit convaincre en quelques secondes.

**Contexte / exemple concret** : `Hero.tsx` dans Kelenpe Studio (site vitrine de l'agence) est exactement ce composant — probablement animé (le projet utilise GSAP, voir `src/lib/gsap.ts`) pour capter l'attention dès le chargement.

**Termes liés** : [Banner](#banner-banniere), [Animation](#animation).

---

## Fade

**Définition simple** : une transition qui fait apparaître ou disparaître un élément en variant progressivement son opacité (de transparent à opaque, ou l'inverse), plutôt qu'un changement instantané.

**Contexte / exemple concret** : cité dans le contexte du lecteur vidéo Ayena — un commentaire de code (`VideoPlayerPool.kt`) mentionne explicitement le "fade poster" (la transition entre l'image d'aperçu figée et la vidéo qui démarre réellement), un point sensible où un mauvais timing crée un flash visuel désagréable.

**Termes liés** : [Animation](#animation), [Freeze](/streaming/#freeze).

---

## Animation

**Définition simple** : faire évoluer une propriété visuelle (position, taille, opacité, couleur) dans le temps pour donner une impression de mouvement ou de réactivité à l'interface — du simple micro-feedback (un bouton qui réagit au clic) à des séquences complexes.

**Contexte / exemple concret** : Kelenpe Studio et Kelenpe Ads Studio utilisent GSAP (`src/lib/gsap.ts`) et Lenis (`use-lenis.ts`, un smooth-scroll) pour des animations soignées ; les deux projets respectent aussi `use-reduced-motion.ts`, un hook qui désactive/réduit les animations si l'utilisateur a activé la préférence système "réduire les animations" — un réflexe d'accessibilité important.

**Termes liés** : [Fade](#fade), [Reduced motion](#reduced-motion-preference-de-mouvement-reduit), [Vector](#vector-vecteur).

---

## Reduced motion (*Préférence de mouvement réduit*)

**Définition simple** : un réglage système que l'utilisateur active s'il est sensible aux animations (risque de nausée, de distraction, ou simple préférence) — un site accessible doit le détecter et réduire ou supprimer ses animations en conséquence.

**Contexte / exemple concret** : implémenté via `use-reduced-motion.ts` dans les projets Kelenpe basés sur GSAP — bonne pratique d'accessibilité (a11y) trop souvent ignorée.

**Termes liés** : [Animation](#animation).

---

## Vector (*Vecteur*)

**Définition simple** : un graphique défini mathématiquement (points, courbes, formes) plutôt que par une grille de pixels (bitmap) — il reste net à n'importe quelle taille d'affichage, contrairement à une image raster agrandie.

**Contexte / exemple concret** : les logos et icônes de l'identité Kelenpe (dossier `logo/`) devraient exister en format vectoriel (SVG) pour rester nets sur toutes les tailles d'écran, du favicon à une affiche imprimée — contrairement à un PNG/WebP qui pixellise en zoomant.

**Termes liés** : [SVG](#svg-scalable-vector-graphics).

---

## SVG (*Scalable Vector Graphics*)

**Définition simple** : le format standard du web pour les graphiques vectoriels — un fichier texte (XML) décrivant des formes, directement manipulable en CSS/JS, contrairement à une image bitmap classique.

**Contexte / exemple concret** : utilisé typiquement pour les icônes d'interface (composants `ui/` dans les projets React de Kelenpe) plutôt que des PNG, pour rester net sur écrans haute densité (Retina) sans alourdir le poids de la page.

**Termes liés** : [Vector](#vector-vecteur).

---

## Responsive design

**Définition simple** : concevoir une interface qui s'adapte automatiquement à la taille de l'écran (mobile, tablette, desktop) plutôt que de cibler une seule résolution fixe.

**Contexte / exemple concret** : chaque projet Kelenpe React (Kelenpe Studio, Prodora Frontend, Ma Boutik Facile) a un hook `use-mobile.tsx` pour détecter le contexte mobile et adapter le rendu — la marketplace Prodora doit rester utilisable aussi bien sur un smartphone d'entrée de gamme (contexte marché malien) que sur desktop.

**Termes liés** : [Breakpoint](#breakpoint).

---

## Breakpoint

**Définition simple** : la largeur d'écran seuil à partir de laquelle la mise en page bascule d'un agencement à un autre (ex. menu hamburger en dessous de 768px, menu horizontal au-dessus).

**Contexte / exemple concret** : défini généralement dans la config Tailwind CSS des projets Kelenpe (`components.json` référence souvent un design system basé sur shadcn/ui + Tailwind).

**Termes liés** : [Responsive design](#responsive-design).

---

## Skeleton loading (*Squelette de chargement*)

**Définition simple** : afficher une version grisée/simplifiée de la mise en page pendant que le vrai contenu charge, plutôt qu'un espace vide ou un simple spinner — donne une impression de rapidité et évite le "layout shift" (contenu qui saute) une fois les données arrivées.

**Contexte / exemple concret** : pertinent pour le feed vidéo Ayena/Deme, où les posters/miniatures se chargent progressivement (voir [Preload](/streaming/#preload)) — un skeleton évite que la liste "saute" visuellement le temps que les vraies images arrivent.

**Termes liés** : [Reduced motion](#reduced-motion-preference-de-mouvement-reduit).

---

## SSR / SSG / Hydration

**Définition simple** : trois stratégies pour générer le HTML d'une page React/Next.js. **SSR** (*Server-Side Rendering*) : le serveur génère le HTML à chaque requête. **SSG** (*Static Site Generation*) : le HTML est généré une fois à la construction (build), puis servi tel quel (rapide, mais figé jusqu'au prochain build). **Hydration** : une fois le HTML (SSR ou SSG) affiché dans le navigateur, React "réactive" les composants pour les rendre interactifs — avant l'hydration, la page est visible mais les boutons ne réagissent pas encore.

**Contexte / exemple concret** : `kelenpe-forms` (formulaire client, Next.js) et `ad-engine-forge/services/dashboard` (Next.js) doivent choisir consciemment entre SSR et SSG selon la page — un formulaire qui dépend de données utilisateur fraîches (session, contenu personnalisé) a besoin de SSR, alors qu'une page marketing statique se contente de SSG et sera bien plus rapide à charger.

**Termes liés** : [Responsive design](#responsive-design).

---

## Design tokens

**Définition simple** : les valeurs de design de base (couleurs, espacements, tailles de police, rayons de bordure) extraites en variables nommées et centralisées, plutôt que codées en dur partout — un changement de couleur de marque se fait à un seul endroit et se propage à toute l'interface.

**Contexte / exemple concret** : les projets Kelenpe basés sur shadcn/ui + Tailwind (`components.json` dans Kelenpe Studio, Kelenpe Ads Studio, Prodora Frontend) utilisent ce principe via les variables CSS/Tailwind de thème — utile day one si Kelenpe veut un jour faire du [white labeling](/backend/#white-labeling-marque-blanche) : changer les tokens de thème suffit à re-marquer visuellement un produit.

**Termes liés** : [Responsive design](#responsive-design), [White labeling](/backend/#white-labeling-marque-blanche).

---

## Accessibilité (*a11y*)

**Définition simple** : concevoir une interface utilisable par tous, y compris les personnes en situation de handicap (déficience visuelle avec lecteur d'écran, motrice avec navigation clavier seule, sensibilité aux animations) — souvent abrégé "a11y" (a + 11 lettres + y).

**Contexte / exemple concret** : déjà entamé dans les projets Kelenpe via `use-reduced-motion.ts` (voir [Reduced motion](#reduced-motion-preference-de-mouvement-reduit)) — d'autres réflexes à intégrer : contraste de couleur suffisant, texte alternatif sur les images produit Prodora (utile aussi pour le SEO), navigation clavier complète sur le tunnel d'achat.

**Termes liés** : [Reduced motion](#reduced-motion-preference-de-mouvement-reduit).

---

## State management (*Gestion d'état*)

**Définition simple** : la stratégie pour stocker et partager les données qui changent dans une interface (panier d'achat, utilisateur connecté, filtres actifs) entre plusieurs composants, sans que chacun doive redemander l'info à son parent (*prop drilling*).

**Contexte / exemple concret** : `ma-boutik-facile` utilise un store dédié (`boutik-store.tsx`) pour partager l'état du stock/panier entre les pages sans tout faire remonter manuellement composant par composant — un choix à faire consciemment dès qu'une app React grandit (Context API natif, ou une librairie dédiée comme Zustand/Redux pour des besoins plus complexes).

**Termes liés** : [Responsive design](#responsive-design).
