# Frontend & UI/UX

Vocabulaire du visuel et de l'interface, avec des repères vers les projets Kelenpe (Kelenpe Studio, Kelenpe Ads Studio, Prodora Frontend) là où c'est pertinent.

[[toc]]

## Carousel

![Wireframe d'un carousel avec fleches et indicateurs](/diagrams/carousel-wireframe.svg)

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

![Comparaison visuelle entre un hero section et un banner](/diagrams/hero-vs-banner.svg)

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

---

## React

**Définition simple** : Une bibliothèque pour construire des interfaces à partir de petits morceaux réutilisables, les composants. On décrit à quoi l'écran doit ressembler selon les données ; React se charge de le mettre à jour quand elles changent.

**Contexte / exemple concret** : Tout l'écran de Boutik est fait en React : la caisse (`VentePage.tsx`), le stock (`StockPage.tsx`), la grille d'images (`GrilleImages.tsx`)…

**Termes liés** : [Composant](#composant-component), [JSX](#jsx), [Hook](#hook), [État (state)](#etat-state).

---

## JSX

**Définition simple** : Une façon d'écrire l'interface directement dans le code JavaScript, avec une syntaxe qui ressemble à du HTML : `<button>Encaisser</button>`.

**Contexte / exemple concret** : Les fichiers `.tsx` de Boutik sont du TypeScript avec du JSX : `<VisuelProduit produit={p} />` affiche l'image ou l'emoji d'un produit.

**Termes liés** : [React](#react), [Composant](#composant-component), [TypeScript](#typescript).

---

## Composant (*Component*)

**Définition simple** : Un morceau d'interface réutilisable, avec sa propre apparence et son propre comportement, qu'on assemble comme des briques : un bouton, un champ, une carte produit.

**Contexte / exemple concret** : `ChampImageProduit` est un composant de Boutik : il gère l'aperçu, les boutons « Depuis l'ordinateur », « Depuis la collection », le glisser-déposer et Ctrl+V, et on le place dans la fiche produit en une ligne.

**Termes liés** : [React](#react), [Props](#props), [Hook](#hook).

---

## Hook

**Définition simple** : Dans React, une fonction spéciale (son nom commence par `use`) qui donne à un composant une capacité : se souvenir d'une valeur, réagir à un changement, écouter le clavier…

**Contexte / exemple concret** : Boutik a son propre hook `useRaccourcis` : un écran l'appelle avec les raccourcis qu'il gère, et le hook branche l'écoute du clavier.

**Termes liés** : [React](#react), [État (state)](#etat-state), [Composant](#composant-component).

---

## État (state)

**Définition simple** : Les valeurs qu'un composant retient entre deux affichages (le texte tapé, une fenêtre ouverte ou non). Quand l'état change, React redessine le composant. Voir aussi « State management » pour l'état partagé par toute l'application.

**Contexte / exemple concret** : Dans la fiche produit de Boutik, le brouillon du produit (nom, prix, image choisie) est un état : chaque frappe le met à jour, et « Annuler » le jette.

**Termes liés** : [State management](#state-management-gestion-d-etat), [Hook](#hook), [Props](#props).

---

## Props

**Définition simple** : Les réglages qu'on passe à un composant de l'extérieur, comme les paramètres d'une fonction : le texte d'un bouton, le produit à afficher.

**Contexte / exemple concret** : `<VisuelProduit produit={p} mediaClassName="h-8 w-8" />` : le produit et la taille sont des props.

**Termes liés** : [Composant](#composant-component), [État (state)](#etat-state).

---

## TypeScript

**Définition simple** : JavaScript avec des types : on précise ce que contient chaque variable (un nombre, un texte, un produit…), et l'éditeur signale les erreurs avant même de lancer le programme.

**Contexte / exemple concret** : Tout Boutik est écrit en TypeScript. Si l'on oublie un champ d'un événement, `npm run typecheck` le signale.

**Termes liés** : [Type](#type), [any](#any), [Typecheck](/devops/#typecheck).

---

## Type

**Définition simple** : La description de la forme d'une donnée : « un prix est un nombre », « un produit a un nom (texte) et un stock (nombre) ».

**Contexte / exemple concret** : `ProduitProjection` (dans `shared/index.ts`) est le type d'un produit dans Boutik ; l'ajout de `imageId: string | null` y a déclaré le nouveau champ d'image.

**Termes liés** : [TypeScript](#typescript), [any](#any), [Fichier .d.ts](/devops/#fichier-d-ts-declaration-file).

---

## any

**Définition simple** : Le type « n'importe quoi » de TypeScript : il désactive les vérifications. Pratique, mais on perd la protection ; on lui préfère `unknown` (« inconnu, à vérifier avant usage »).

**Contexte / exemple concret** : Les canaux IPC de Boutik reçoivent les données du renderer comme `unknown`, puis les vérifient (`nettoyerNomImage`, `estIdImage`) avant de s'en servir.

**Termes liés** : [Type](#type), [TypeScript](#typescript), [Validation côté serveur / côté client](/backend/#validation-cote-serveur-cote-client-server-side-client-side-validation).

---

## Vite

**Définition simple** : Un outil qui prépare le code d'une application web pour le navigateur : pendant le développement, il sert les fichiers instantanément ; pour la version finale, il les assemble et les compacte.

**Contexte / exemple concret** : Boutik utilise Vite à travers electron-vite ; en développement, l'interface est servie sur `http://localhost:5173`.

**Termes liés** : [electron-vite](#electron-vite), [HMR](#hmr-hot-module-replacement), [Build](/devops/#build).

---

## HMR (*Hot Module Replacement*)

**Définition simple** : Pendant le développement, le remplacement « à chaud » d'un morceau de code modifié : l'écran se met à jour en une seconde, sans recharger toute l'application ni perdre ce qu'on avait saisi.

**Contexte / exemple concret** : En `npm run dev`, modifier un composant de Boutik le met à jour dans la fenêtre ouverte.

**Termes liés** : [Vite](#vite), [electron-vite](#electron-vite).

---

## electron-vite

**Définition simple** : Un outil qui applique Vite aux trois parties d'une application Electron (main, preload, renderer) avec une seule commande.

**Contexte / exemple concret** : `npm run dev` et `npm run build` de Boutik passent par electron-vite (`electron.vite.config.ts`), qui produit le dossier `out/`.

**Termes liés** : [Vite](#vite), [Electron](/devops/#electron), [Build](/devops/#build).

---

## Tailwind

**Définition simple** : Une façon d'écrire le style en posant de petites classes toutes faites directement sur les éléments (`rounded-lg`, `text-sm`, `bg-primary`) au lieu d'écrire des fichiers CSS à part.

**Contexte / exemple concret** : Toute l'apparence de Boutik est en Tailwind : `className="min-h-11 rounded-lg border-2"` donne un bouton d'au moins 44 pixels de haut, arrondi, bordé.

**Termes liés** : [CSS](#css-cascading-style-sheets), [rem](#rem), [Design tokens](#design-tokens).

---

## CSS (*Cascading Style Sheets*)

**Définition simple** : Le langage qui décrit l'apparence d'une page : couleurs, tailles, marges, disposition.

**Contexte / exemple concret** : Boutik utilise le CSS à travers Tailwind, plus quelques règles fines, comme `content-visibility` pour ne pas dessiner les vignettes hors écran.

**Termes liés** : [Tailwind](#tailwind), [rem](#rem), [Media query](#media-query).

---

## rem

**Définition simple** : Une unité de taille en CSS : 1 rem vaut la taille de texte de base (souvent 16 pixels). Tout ce qui est en rem grandit si l'utilisateur agrandit le texte.

**Contexte / exemple concret** : Les vignettes de la collection de Boutik font au moins 7,5 rem de large (120 pixels à la taille normale).

**Termes liés** : [CSS](#css-cascading-style-sheets), [Tailwind](#tailwind).

---

## Media query

**Définition simple** : Une règle CSS qui ne s'applique que dans certaines conditions d'affichage, par exemple « si la fenêtre fait moins de 1024 pixels de large ».

**Contexte / exemple concret** : Boutik adapte sa barre de navigation à 800, 1024 et 1440 pixels (e2e « navigation ») ; les entrées qui ne tiennent pas passent dans le menu « Plus ».

**Termes liés** : [Responsive design](#responsive-design), [Breakpoint](#breakpoint), [CSS](#css-cascading-style-sheets).

---

## React Router

**Définition simple** : La bibliothèque qui gère la navigation entre les écrans d'une application React : chaque écran a une adresse, et changer d'adresse change d'écran.

**Contexte / exemple concret** : Boutik l'utilise pour `/vente`, `/stock`, `/creances`… ; `/stock?onglet=images` ouvre directement l'onglet Images.

**Termes liés** : [Route](#route), [HashRouter / BrowserRouter](#hashrouter-browserrouter), [Route protégée](#route-protegee-protected-route).

---

## HashRouter / BrowserRouter

**Définition simple** : Deux façons de noter l'écran courant dans l'adresse. BrowserRouter utilise une adresse classique (`/stock`) ; HashRouter la met après un `#` (`#/stock`), ce qui marche aussi quand l'application est un fichier local sans serveur.

**Contexte / exemple concret** : Boutik, chargé depuis un fichier dans l'exécutable, utilise des adresses en `#/` : `#/vente`, `#/stock`.

**Termes liés** : [React Router](#react-router), [Route](#route).

---

## Route

**Définition simple** : L'association entre une adresse et un écran : « à l'adresse /stock, affiche l'écran Stock ».

**Contexte / exemple concret** : Dans `App.tsx`, `<Route path="/stock" element={<StockPage />} />` déclare l'écran Stock de Boutik.

**Termes liés** : [React Router](#react-router), [Route protégée](#route-protegee-protected-route).

---

## Route protégée (*Protected route*)

**Définition simple** : Une route qui vérifie les droits avant d'afficher l'écran ; sans droit, on est renvoyé ailleurs.

**Contexte / exemple concret** : Dans Boutik, `RouteProtegee` n'ouvre le Stock qu'aux comptes qui ont le module stock ; c'est un confort, la vraie vérification étant faite par le processus principal.

**Termes liés** : [Route](#route), [Permissions et modules](/backend/#permissions-et-modules), [Défense en profondeur](/backend/#defense-en-profondeur-defense-in-depth).

---

## Placeholder (*Texte indicatif*)

**Définition simple** : Le texte gris affiché dans un champ vide pour indiquer quoi y taper ; il disparaît dès qu'on écrit. Il ne remplace pas une vraie étiquette, qui reste visible.

**Contexte / exemple concret** : « Rechercher une image par son nom… » dans l'onglet Images de Boutik ; le champ a aussi une étiquette lue par les lecteurs d'écran.

**Termes liés** : [Accessibilité](#accessibilite-a11y), [aria-label](#aria-label).

---

## Menu déroulant (*Dropdown*)

**Définition simple** : Une liste de choix qui s'ouvre sous un bouton ou un champ, puis se referme une fois le choix fait.

**Contexte / exemple concret** : Le menu du compte de Boutik (en haut à droite) et le choix de l'unité d'un produit (« par pièce », « par kg »…) sont des menus déroulants.

**Termes liés** : [Composant](#composant-component), [Accessibilité](#accessibilite-a11y).

---

## Fenêtre modale (*Modal dialog*)

**Définition simple** : Une fenêtre qui s'ouvre par-dessus l'écran et bloque le reste tant qu'on ne l'a pas fermée : il faut répondre avant de continuer.

**Contexte / exemple concret** : La fiche produit, la fenêtre de choix d'image et les confirmations de Boutik sont des fenêtres modales, marquées `data-fenetre` : Échap les ferme, Entrée valide, et une confirmation d'action destructive donne Annuler par défaut.

**Termes liés** : [Focus](#focus), [Raccourci clavier](#raccourci-clavier-keyboard-shortcut), [Accessibilité](#accessibilite-a11y).

---

## Info-bulle (*Tooltip*)

**Définition simple** : Un petit texte qui apparaît quand on survole un élément, pour expliquer ce qu'il fait.

**Contexte / exemple concret** : Les boutons à icône de Boutik ont une info-bulle (« Réapprovisionner », « Confirmer (Ctrl + Entrée) ») en plus de leur nom accessible.

**Termes liés** : [aria-label](#aria-label), [Accessibilité](#accessibilite-a11y).

---

## Notification flottante (*Toast*)

**Définition simple** : Un petit message qui apparaît quelques secondes (souvent en bas ou en haut de l'écran) pour confirmer une action, puis disparaît de lui-même.

**Contexte / exemple concret** : Boutik préfère des messages qui restent en place, en haut de l'écran (« Produit modifié », « Image renommée »), plus faciles à lire pour quelqu'un qui ne regardait pas à ce moment-là.

**Termes liés** : [UI / UX](#ui-ux-user-interface-user-experience).

---

## datalist

**Définition simple** : Un élément HTML qui propose une liste de suggestions sous un champ texte, tout en laissant écrire autre chose.

**Contexte / exemple concret** : Remplacé dans Boutik par un composant maison, `ChampSuggestions`, qui classe les suggestions et montre un texte fantôme.

**Termes liés** : [Autocomplétion](#autocompletion-autocomplete), [Texte fantôme](#texte-fantome-ghost-text).

---

## Autocomplétion (*Autocomplete*)

**Définition simple** : L'application propose de compléter ce qu'on tape (un nom de produit, une adresse) à partir de ce qui a déjà été saisi.

**Contexte / exemple concret** : Les suggestions de saisie de Boutik : 5 propositions au plus, les plus utilisées en tête, acceptées par Tab.

**Termes liés** : [Texte fantôme](#texte-fantome-ghost-text), [Classement par fréquence et récence](#classement-par-frequence-et-recence-frecency), [datalist](#datalist).

---

## Texte fantôme (*Ghost text*)

**Définition simple** : La suite proposée d'un mot, affichée en gris clair directement dans le champ, après le curseur ; une touche l'accepte.

**Contexte / exemple concret** : Dans Boutik, taper « Riz p » affiche « arfumé » en gris ; Tab (ou →) l'accepte.

**Termes liés** : [Autocomplétion](#autocompletion-autocomplete).

---

## Classement par fréquence et récence (*Frecency*)

**Définition simple** : Trier des suggestions en tenant compte à la fois du nombre d'utilisations et de leur date : ce qu'on emploie souvent et récemment passe devant.

**Contexte / exemple concret** : Les suggestions de saisie de Boutik sont classées par nombre d'usages, puis par date du dernier usage (`classerSuggestions`).

**Termes liés** : [Autocomplétion](#autocompletion-autocomplete).

---

## Lecteur d'écran (*Screen reader*)

**Définition simple** : Un logiciel qui lit à voix haute ce qui est à l'écran, pour les personnes aveugles ou malvoyantes (NVDA sous Windows, Orca sous Linux). Il s'appuie sur les noms et rôles des éléments.

**Contexte / exemple concret** : Chaque bouton à icône de Boutik a un nom lisible (« Retirer l'image », « Fermer sans choisir »), et les messages d'erreur sont annoncés (`role="alert"`).

**Termes liés** : [Accessibilité](#accessibilite-a11y), [aria-label](#aria-label).

---

## aria-label

**Définition simple** : Un attribut qui donne un nom lisible à un élément qui n'a pas de texte visible (un bouton-icône, par exemple), pour les lecteurs d'écran.

**Contexte / exemple concret** : `aria-label="Modifier Riz parfumé"` sur le crayon d'une ligne du Stock de Boutik ; les tests e2e s'en servent aussi pour trouver le bon bouton.

**Termes liés** : [Lecteur d'écran](#lecteur-d-ecran-screen-reader), [Accessibilité](#accessibilite-a11y).

---

## Contraste 4,5:1 (*WCAG contrast*)

**Définition simple** : La règle d'accessibilité WCAG qui demande que le texte normal soit au moins 4,5 fois plus lumineux (ou plus sombre) que son fond, pour rester lisible, même au soleil ou avec une vue faible.

**Contexte / exemple concret** : Revue ui-ux-pro-max de Boutik : le texte gris des suggestions a été vérifié contre ce seuil.

**Termes liés** : [Accessibilité](#accessibilite-a11y).

**Calcul** : contraste = (L₁ + 0,05) / (L₂ + 0,05), où L₁ est la luminance de la couleur la plus claire et L₂ celle de la plus sombre (de 0 pour le noir à 1 pour le blanc). Minimum 4,5 pour le texte normal, 3 pour le grand texte.

---

## Focus

**Définition simple** : L'élément de l'écran qui reçoit le clavier en ce moment (souvent entouré d'un cadre). Tab le fait passer à l'élément suivant.

**Contexte / exemple concret** : Quand une fenêtre de Boutik s'ouvre, le focus va dans son premier champ ; quand elle se ferme, il revient là où il était (`ClavierGlobal`).

**Termes liés** : [Raccourci clavier](#raccourci-clavier-keyboard-shortcut), [Fenêtre modale](#fenetre-modale-modal-dialog), [Accessibilité](#accessibilite-a11y).

---

## Raccourci clavier (*Keyboard shortcut*)

**Définition simple** : Une combinaison de touches qui déclenche une action sans la souris : Ctrl+V pour coller, F1 pour l'aide.

**Contexte / exemple concret** : Tous les raccourcis de Boutik sont déclarés dans `shared/raccourcis.ts` ; le guide F1 est construit à partir de cette liste. À la caisse, F2 cherche un produit et Ctrl+Entrée encaisse.

**Termes liés** : [Focus](#focus), [AZERTY / QWERTY](#azerty-qwerty), [Source unique de vérité](/backend/#source-unique-de-verite-single-source-of-truth).

---

## Zoom de la fenêtre (*setZoomFactor*)

**Définition simple** : Agrandir ou réduire tout le contenu de la fenêtre (textes, boutons, images) d'un même facteur, comme la loupe d'un navigateur.

**Contexte / exemple concret** : Boutik propose 5 tailles d'affichage, jusqu'à 110 % (au-delà, la caisse ne tient plus sur un écran de 800 pixels). Electron applique le facteur avec `setZoomFactor`.

**Termes liés** : [Raccourci clavier](#raccourci-clavier-keyboard-shortcut), [Responsive design](#responsive-design).

---

## Police embarquée (*Embedded font*)

**Définition simple** : Une police de caractères livrée avec l'application elle-même, au lieu d'être téléchargée ou d'espérer qu'elle soit installée sur l'ordinateur.

**Contexte / exemple concret** : Boutik embarque ses polices Outfit et Figtree (paquets `@fontsource-variable`, licence OFL) : même hors ligne, l'affichage est identique partout.

**Termes liés** : [Google Fonts](#google-fonts), [Hors ligne d'abord](/backend/#hors-ligne-d-abord-offline-first), [OFL-1.1](/business/#ofl-1-1-sil-open-font-license).

---

## Google Fonts

**Définition simple** : Une grande bibliothèque gratuite de polices de caractères de Google, en général chargées depuis Internet.

**Contexte / exemple concret** : Outfit et Figtree viennent de Google Fonts, mais Boutik les embarque au lieu de les télécharger : aucune connexion n'est faite, même pour l'affichage.

**Termes liés** : [Police embarquée](#police-embarquee-embedded-font).

---

## Chargement progressif (*Lazy loading*)

**Définition simple** : Ne charger une chose (une image, une page de résultats) qu'au moment où elle va être vue, plutôt que tout d'un coup au départ. L'écran s'affiche plus vite et consomme moins.

**Contexte / exemple concret** : Les vignettes de Boutik portent `loading="lazy"` : sur 1 000 images, seules celles proches de l'écran sont lues. La collection arrive elle-même par pages de 60.

**Termes liés** : [Pagination](/backend/#pagination), [Défilement infini](#defilement-infini-infinite-scroll), [Miniature](/media/#miniature-thumbnail).

---

## Défilement infini (*Infinite scroll*)

**Définition simple** : Une liste qui charge la suite d'elle-même quand on approche du bas, sans bouton « page suivante ».

**Contexte / exemple concret** : La grille de la collection d'images de Boutik : un repère invisible en bas de la grille, surveillé par un IntersectionObserver, demande la page suivante.

**Termes liés** : [Pagination](/backend/#pagination), [Chargement progressif](#chargement-progressif-lazy-loading), [IntersectionObserver](#intersectionobserver).

---

## IntersectionObserver

**Définition simple** : Un outil du navigateur qui prévient quand un élément entre dans la partie visible de l'écran (ou s'en approche), sans avoir à surveiller le défilement en permanence.

**Contexte / exemple concret** : C'est lui qui déclenche le chargement de la page suivante dans la grille d'images de Boutik, 600 pixels avant d'atteindre le bas.

**Termes liés** : [Défilement infini](#defilement-infini-infinite-scroll), [Chargement progressif](#chargement-progressif-lazy-loading).

---

## Mémoïsation (*Memoization, React.memo*)

**Définition simple** : Retenir le résultat d'un calcul ou d'un affichage pour ne pas le refaire quand rien n'a changé. `React.memo` évite de redessiner un composant dont les props sont les mêmes.

**Contexte / exemple concret** : Les vignettes de la collection de Boutik sont mémoïsées : quand 60 nouvelles images arrivent, les 900 déjà affichées ne sont pas redessinées. La pire tâche est passée de 275 à 149 ms.

**Termes liés** : [React](#react), [Tâche longue](#tache-longue-long-task).

---

## Rendu interruptible (*startTransition, concurrent rendering*)

**Définition simple** : Dire à React qu'une mise à jour n'est pas urgente : il la découpe en petits morceaux et laisse passer entre-temps ce qui compte pour l'utilisateur (défiler, taper).

**Contexte / exemple concret** : Dans Boutik, l'ajout d'une page de 60 vignettes passe par `startTransition` : le défilement reste fluide pendant que les nouvelles vignettes arrivent.

**Termes liés** : [Mémoïsation](#memoisation-memoization-react-memo), [Boucle d'événements et tâche bloquante](/backend/#boucle-d-evenements-et-tache-bloquante-event-loop-blocking-task).

---

## Tâche longue (*Long task*)

**Définition simple** : Un travail de plus de 50 millisecondes sur le fil principal du navigateur : pendant ce temps, l'écran ne peut pas réagir, ce qui se sent comme une saccade.

**Contexte / exemple concret** : L'e2e images de Boutik mesure les tâches longues pendant qu'on fait défiler 1 000 images : 106 ms au pire, sur un portable de 2016.

**Termes liés** : [Boucle d'événements et tâche bloquante](/backend/#boucle-d-evenements-et-tache-bloquante-event-loop-blocking-task), [Images par seconde](#images-par-seconde-frames-per-second-fps).

---

## Images par seconde (*Frames per second, fps*)

**Définition simple** : Le nombre de fois par seconde où l'écran est redessiné. À 60 images par seconde, chacune a 16,7 ms ; si une image prend 50 ms, le mouvement saccade.

**Contexte / exemple concret** : Mesure de Boutik (défilement rapide de la collection) : image médiane à 18 ms, soit environ 55 images par seconde.

**Termes liés** : [Tâche longue](#tache-longue-long-task), [Percentile](#percentile-p95).

**Calcul** : durée d'une image (ms) = 1 000 / images par seconde. 60 fps → 16,7 ms ; 30 fps → 33 ms.

---

## Percentile (*p95*)

**Définition simple** : Une façon de résumer des mesures : le 95ᵉ percentile (p95) est la valeur sous laquelle se trouvent 95 % des mesures. Il montre les « mauvais moments » que la moyenne cache.

**Contexte / exemple concret** : Pour la grille d'images de Boutik, 95 % des images sont dessinées en moins de 33 ms une fois tout chargé (p95), la médiane étant à 17 ms.

**Termes liés** : [Images par seconde](#images-par-seconde-frames-per-second-fps), [Médiane](#mediane-median).

**Calcul** : on trie les n mesures ; le p95 est celle qui est au rang 0,95 × n. La médiane est le p50.

---

## Médiane (*Median*)

**Définition simple** : La valeur du milieu d'une liste de mesures triée : la moitié est en dessous, la moitié au-dessus. Moins trompeuse que la moyenne quand quelques valeurs sont extrêmes.

**Contexte / exemple concret** : Les temps de détourage (essai de Boutik) sont donnés en médiane sur 14 photos : 1,2 s pour U²-Net p.

**Termes liés** : [Percentile](#percentile-p95).

---

## content-visibility

**Définition simple** : Une règle CSS (`content-visibility: auto`) qui dit au navigateur de ne pas calculer ni dessiner le contenu d'un élément tant qu'il est loin de l'écran.

**Contexte / exemple concret** : Chaque vignette de la collection de Boutik l'utilise : avec 1 000 images, seules celles proches de l'écran coûtent quelque chose.

**Termes liés** : [CSS](#css-cascading-style-sheets), [Chargement progressif](#chargement-progressif-lazy-loading).

---

## Content Security Policy (*CSP*)

**Définition simple** : Une liste de règles, donnée à la page, qui dit d'où elle a le droit de charger du code, des images ou des styles. Tout le reste est bloqué, ce qui limite les dégâts d'un contenu malveillant.

**Contexte / exemple concret** : La CSP de Boutik (`index.html`) n'autorise les images que de l'application elle-même, des data URL et du protocole `boutik-image:` : `img-src 'self' data: blob: boutik-image:`.

**Termes liés** : [Surface d'attaque](/backend/#surface-d-attaque-attack-surface), [Protocole personnalisé](/backend/#protocole-personnalise-custom-protocol), [Data URL](/media/#data-url).

---

## UI / UX (*User Interface / User Experience*)

**Définition simple** : L'UI est l'interface elle-même (boutons, couleurs, textes) ; l'UX est l'expérience vécue par la personne qui s'en sert (est-ce simple, rapide, rassurant ?). Une belle UI peut donner une mauvaise UX.

**Contexte / exemple concret** : Pour Boutik, une bonne UX, c'est encaisser au clavier seul, lire les erreurs à côté du champ concerné, et avoir des boutons d'au moins 44 pixels. Le skill ui-ux-pro-max sert à vérifier ces règles.

**Termes liés** : [Accessibilité](#accessibilite-a11y), [Friction](/business/#friction).

---

## lucide-react

**Définition simple** : Une collection d'icônes simples et cohérentes (crayon, poubelle, dossier…) prêtes à l'emploi dans React.

**Contexte / exemple concret** : Toutes les icônes de Boutik en viennent : `FolderOpen` pour « Depuis l'ordinateur », `Trash2` pour « Supprimer ».

**Termes liés** : [React](#react), [Composant](#composant-component).

---

## Espace insécable (*Non-breaking space*)

**Définition simple** : Une espace qui empêche le retour à la ligne entre deux mots, et que certains outils ne reconnaissent pas comme une espace ordinaire. En français, on la met avant « : », « ? », « ! » et dans « 1 200 FCFA ».

**Contexte / exemple concret** : `toLocaleString("fr-FR")` écrit « 1 200 » avec une espace insécable fine : les tests de Boutik doivent en tenir compte quand ils comparent des montants.

**Termes liés** : [Test e2e](/devops/#test-e2e-end-to-end-test-test-de-bout-en-bout).

---

## AZERTY / QWERTY

**Définition simple** : Les deux dispositions de clavier les plus courantes, nommées d'après leurs premières lettres : AZERTY en France et au Mali, QWERTY en pays anglophones. Une même touche physique produit un caractère différent.

**Contexte / exemple concret** : Ctrl+1 à Ctrl+8 changent d'écran dans Boutik : sur un clavier AZERTY, la touche « 1 » produit « & », d'où la reconnaissance par la touche physique (`Digit1`) en plus du caractère.

**Termes liés** : [Raccourci clavier](#raccourci-clavier-keyboard-shortcut).

---

## Chromium

**Définition simple** : Le navigateur libre sur lequel reposent Google Chrome, Edge… et Electron : c'est lui qui affiche l'interface des applications Electron.

**Contexte / exemple concret** : L'écran de Boutik est dessiné par le Chromium intégré à Electron ; les tests e2e le pilotent par le Chrome DevTools Protocol.

**Termes liés** : [Electron](/devops/#electron), [Chrome DevTools Protocol](/devops/#chrome-devtools-protocol-cdp).

---

## Wayland

**Définition simple** : Le système moderne d'affichage graphique de Linux : il fait le lien entre les applications, l'écran, le clavier et la souris. Il remplace peu à peu X11.

**Contexte / exemple concret** : Le poste de développement de Boutik tourne sous Wayland (Hyprland) : la copie « sensible » des codes de secours y passe par `wl-copy --sensitive`.

**Termes liés** : [X11](#x11), [Hyprland](#hyprland), [wl-copy](#wl-copy).

---

## X11

**Définition simple** : L'ancien système d'affichage graphique de Linux (1987), encore très répandu, remplacé peu à peu par Wayland.

**Contexte / exemple concret** : Sous X11, Boutik ne peut pas marquer une copie comme sensible : les codes de secours sont copiés normalement, puis retirés du presse-papiers après 2 minutes.

**Termes liés** : [Wayland](#wayland), [Presse-papiers](#presse-papiers-clipboard).

---

## Hyprland

**Définition simple** : Un gestionnaire de fenêtres pour Linux (sous Wayland) qui range les fenêtres en mosaïque et se pilote beaucoup au clavier.

**Contexte / exemple concret** : C'est l'environnement du poste de développement de Boutik. Les tests e2e ouvrent leurs fenêtres dans un espace de travail caché, sans prendre le focus, pour ne pas gêner le développeur.

**Termes liés** : [Wayland](#wayland), [Espace de travail](#espace-de-travail-workspace).

---

## Espace de travail (*Workspace*)

**Définition simple** : Un « bureau » virtuel : on peut en avoir plusieurs et passer de l'un à l'autre, chacun avec ses fenêtres.

**Contexte / exemple concret** : Les tests e2e de Boutik posent une règle Hyprland (`boutik-e2e`) qui envoie leurs fenêtres dans un espace de travail libre, en silence.

**Termes liés** : [Hyprland](#hyprland).

---

## Presse-papiers (*Clipboard*)

**Définition simple** : La mémoire temporaire du système où va ce qu'on copie (Ctrl+C), avant de le coller (Ctrl+V). Elle peut contenir du texte, des images, des fichiers.

**Contexte / exemple concret** : Dans la fiche produit de Boutik, Ctrl+V colle une image copiée (une capture d'écran, par exemple). Les codes de secours copiés sont retirés du presse-papiers après 2 minutes.

**Termes liés** : [Format de presse-papiers](#format-de-presse-papiers-clipboard-format), [Historique du presse-papiers](#historique-du-presse-papiers-clipboard-history-win-v-cliphist), [wl-copy](#wl-copy).

---

## Format de presse-papiers (*Clipboard format*)

**Définition simple** : Le presse-papiers garde souvent la même chose sous plusieurs formes (texte simple, texte mis en forme, image PNG…), chacune avec son nom de format. Des formats spéciaux servent aussi d'étiquettes (« ne pas garder dans l'historique »).

**Contexte / exemple concret** : Sous Windows, Boutik ajoute aux codes de secours les formats `ExcludeClipboardContentFromMonitorProcessing`, `CanIncludeInClipboardHistory` et `CanUploadToCloudClipboard` : ils ne vont ni dans l'historique Win+V, ni dans le nuage.

**Termes liés** : [Presse-papiers](#presse-papiers-clipboard), [Historique du presse-papiers](#historique-du-presse-papiers-clipboard-history-win-v-cliphist).

---

## Historique du presse-papiers (*Clipboard history, Win+V, cliphist*)

**Définition simple** : Une liste des dernières choses copiées, gardée par le système ou un outil (Win+V sous Windows, cliphist ou Klipper sous Linux), pour recoller un élément copié plus tôt. Pratique, mais un secret copié y reste.

**Contexte / exemple concret** : C'est pourquoi Boutik marque ses copies de codes de secours comme sensibles : elles sont exclues de ces historiques.

**Termes liés** : [Presse-papiers](#presse-papiers-clipboard), [Format de presse-papiers](#format-de-presse-papiers-clipboard-format), [wl-copy](#wl-copy).

---

## wl-copy

**Définition simple** : Un petit programme en ligne de commande pour écrire dans le presse-papiers sous Wayland ; l'option `--sensitive` demande aux gestionnaires d'historique de ne pas garder la copie.

**Contexte / exemple concret** : Sous Wayland, Boutik copie les codes de secours avec `wl-copy --sensitive`.

**Termes liés** : [Wayland](#wayland), [Presse-papiers](#presse-papiers-clipboard), [Historique du presse-papiers](#historique-du-presse-papiers-clipboard-history-win-v-cliphist).

---

## Glisser-déposer (*Drag and drop*)

**Définition simple** : Prendre un élément avec la souris (un fichier, une photo) et le lâcher sur une zone de l'application pour l'y ajouter.

**Contexte / exemple concret** : Dans la fiche produit de Boutik, on peut glisser une photo depuis l'explorateur de fichiers sur la zone « Image du produit ». Un fichier lâché ailleurs ne fait plus quitter l'application.

**Termes liés** : [UI / UX](#ui-ux-user-interface-user-experience).

---

## Région live (*aria-live*)

**Définition simple** : Une zone de la page que les lecteurs d'écran surveillent : quand son texte change, ils le lisent à voix haute, sans que la personne ait à y aller. « polite » veut dire « quand l'utilisateur a fini ce qu'il fait ».

**Contexte / exemple concret** : Le champ à suggestions de Boutik a une région live qui annonce « 5 suggestions : flèche bas pour les parcourir, Tab pour accepter » ; un seul message à la fois, mis à jour quand le nombre change.

**Termes liés** : [Lecteur d'écran](#lecteur-d-ecran-screen-reader), [Accessibilité](#accessibilite-a11y), [aria-label](#aria-label).

---
