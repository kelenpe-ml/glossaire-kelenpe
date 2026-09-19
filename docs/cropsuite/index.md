# CropSuite (PFE)

Vocabulaire technique de mon système d'aide à la décision agricole pour le Mali (PFE, Master MSI) : cartographie de l'aptitude des cultures (mil, sorgho, arachide) sur Koulikoro et Sikasso, moteur biophysique **CropSuite**, validation contre des données de terrain (EAC, NDVI), exposition via API FastAPI et application mobile Flutter.

[[toc]]

## Cycle de culture

**Définition simple** : la durée, en jours, entre le semis et la récolte d'une culture — le temps dont la plante a besoin pour boucler tout son cycle de vie. C'est un paramètre fixe par culture, saisi dans la configuration de CropSuite (donné en entrée, pas calculé).

**Contexte / exemple concret** : le mil a un cycle d'environ 100 jours, le sorgho environ 110-120 selon la variété. C'est cette durée que CropSuite compare à la longueur de la [saison favorable](#saison-favorable) d'une zone pour estimer le potentiel de cultures multiples d'un pixel — un cycle court permet plus facilement de tenir deux récoltes dans la même année.

**Termes liés** : [Saison favorable](#saison-favorable), [Période critique](#periode-critique).

---

## EAC (*Enquête Agricole de Conjoncture*)

**Définition simple** : enquêtes de terrain géolocalisées menées au Mali par l'INSTAT, qui recensent notamment les cultures pratiquées et les rendements déclarés par région. Dans le PFE, l'EAC sert uniquement à vérifier après coup si les cartes produites par CropSuite reflètent la réalité — elle n'entre jamais dans le calcul du moteur.

**Contexte / exemple concret** : deux campagnes mobilisées pour la validation, l'extrait 2017 (rendement) et 2022–2024 (présence de culture), toutes deux sur Koulikoro et Sikasso. Bamako est absent des deux campagnes — confirmé par l'INSTAT, l'agriculture y étant peu pratiquée — d'où son exclusion du périmètre du PFE.

**Termes liés** : [NDVI](#ndvi), [Minimum de Liebig](#minimum-de-liebig).

---

## GeoTIFF

**Définition simple** : format de fichier image qui associe, en plus des pixels eux-mêmes, une géoréférence — chaque pixel sait à quelle coordonnée réelle (latitude/longitude) il correspond. Un standard largement utilisé pour diffuser des cartes.

**Contexte / exemple concret** : c'est le format dans lequel CropSuite écrit tous ses résultats (`crop_suitability.tif`, `multiple_cropping.tif`...). L'API du PFE les lit directement avec la bibliothèque `rasterio`, sans base de données intermédiaire.

**Termes liés** : [Raster](#raster), [SIG (Système d'Information Géographique)](#sig-systeme-d-information-geographique).

---

## Logique floue (*Fuzzy*)

**Définition simple** : une façon de noter progressivement une variable (comme un variateur de lumière) plutôt que de trancher brutalement oui/non (comme un interrupteur). Une valeur proche de l'idéal reçoit un score élevé, une valeur éloignée un score faible, sans couperet net entre les deux.

**Contexte / exemple concret** : CropSuite note chaque variable climatique ou pédologique (température, précipitation, pH...) entre 0 et 100 selon sa distance à la plage idéale de la culture, plutôt que de classer "apte" ou "pas apte" de façon binaire.

**Termes liés** : [Minimum de Liebig](#minimum-de-liebig), [pH](#ph).

---

## Minimum de Liebig

**Définition simple** : principe agronomique (Liebig, XIXe siècle) selon lequel une culture n'est jamais limitée par la moyenne de ses conditions, mais par son facteur le plus défavorable. Image classique : un tonneau fait de planches de bois de hauteurs différentes — le niveau d'eau ne peut jamais dépasser la planche la plus courte, même si toutes les autres sont hautes.

**Contexte / exemple concret** : CropSuite calcule un score climat et un score sol séparément (0 à 100 chacun), puis retient le plus petit des deux comme score final — jamais la moyenne. Un climat à 90 et un sol à 30 donnent un score final de 30.

**Termes liés** : [Logique floue (Fuzzy)](#logique-floue-fuzzy).

---

## NDVI

**Définition simple** : indice de végétation calculé à partir d'images satellite, qui mesure indirectement la vigueur d'une végétation (plus une plante est dense et en bonne santé, plus l'indice est élevé). Utilisé dans le PFE comme deuxième source de validation, en complément de l'EAC.

**Contexte / exemple concret** : composite NDVI MODIS (juillet-octobre, plusieurs années) comparé aux cartes d'aptitude CropSuite sur Koulikoro et Sikasso — corrélation positive confirmée pour mil et sorgho une fois un artefact de mesure identifié et isolé.

**Termes liés** : [EAC (Enquête Agricole de Conjoncture)](#eac-enquete-agricole-de-conjoncture).

---

## Opérationnalisation malienne

**Définition simple** : le fait d'adapter et de configurer un outil scientifique générique (ici CropSuite) pour qu'il produise des résultats utilisables dans un contexte réel précis — ici le Mali — plutôt que d'inventer un nouveau modèle depuis zéro.

**Contexte / exemple concret** : c'est la formule que la conclusion du PFE utilise pour cadrer sa propre contribution : « l'apport du PFE est l'opérationnalisation malienne et l'exposition en système d'information [...] et non l'invention de CropSuite ». Concrètement : choix des cultures et des régions pertinentes pour le Sahel, configuration des paramètres CropSuite, validation contre des données de terrain maliennes (EAC), puis exposition via une API et une application mobile.

**Termes liés** : [EAC (Enquête Agricole de Conjoncture)](#eac-enquete-agricole-de-conjoncture).

---

## pH

**Définition simple** : échelle de 0 à 14 qui mesure si un sol est acide ou basique (alcalin) — 0 très acide, 7 neutre, 14 très basique. Chaque plante a une plage de pH optimale dans laquelle elle absorbe bien les nutriments du sol ; en dehors de cette plage, même un sol par ailleurs riche devient moins exploitable.

**Contexte / exemple concret** : le pH fait partie des variables pédologiques notées par la logique floue de CropSuite — plus le pH d'une zone s'éloigne de la plage idéale d'une culture, plus son score d'aptitude sol baisse progressivement.

**Termes liés** : [Logique floue (Fuzzy)](#logique-floue-fuzzy).

---

## Période critique

**Définition simple** : le moment précis du cycle de vie d'une plante où elle est la plus sensible à une condition donnée (température, eau...) — pas tout le cycle, un passage précis. La même contrainte a un impact très différent selon qu'elle survient pendant cette période ou en dehors.

**Contexte / exemple concret** : la floraison est souvent la période critique pour la température chez le mil ou le sorgho — une chaleur excessive tolérable en phase de croissance végétative peut empêcher la formation des grains si elle survient pile pendant la floraison. C'est pour capter ce genre d'effet ponctuel que CropSuite utilise des données climatiques journalières plutôt qu'une simple moyenne annuelle, qui masquerait un manque d'eau ou un pic de chaleur survenu au mauvais moment.

**Termes liés** : [Minimum de Liebig](#minimum-de-liebig).

---

## Raster

**Définition simple** : une image organisée en grille de pixels, où chaque pixel porte une valeur numérique (un score d'aptitude, un code de facteur limitant...) plutôt qu'une couleur. S'oppose aux données « vectorielles » (points, lignes, polygones).

**Contexte / exemple concret** : chaque culture testée par CropSuite produit son propre raster de score d'aptitude (0 à 100) sur toute l'emprise Koulikoro ou Sikasso. L'API échantillonne ce raster au point GPS de l'utilisateur pour répondre en quelques millisecondes, sans recalcul.

**Termes liés** : [GeoTIFF](#geotiff), [SIG (Système d'Information Géographique)](#sig-systeme-d-information-geographique).

---

## RRPCF (*Recurrence Rate of Potential Crop Failure*)

**Définition simple** : le taux de récurrence d'échec potentiel de culture. Pour une date de semis donnée, on rejoue le cycle de la culture sur chacune des 20 dernières années de climat réel, et on compte le pourcentage d'années où un seuil climatique critique aurait été dépassé pendant le cycle (donc une récolte ratée). Un RRPCF de 0 % veut dire qu'aucune des 20 années passées n'aurait posé problème pour cette date précise ; c'est une fréquence historique, pas une garantie pour l'avenir.

**Contexte / exemple concret** : dans le PFE, ce calcul est piloté par le paramètre `consider_variability`. Testé en conditions contrôlées sur Koulikoro et Sikasso (43 200 pixels par zone, ≈ 40 % et ≈ 50 % du territoire de chaque région), il s'avère que la date de semis que CropSuite retient déjà comme optimale — choisie sur température, précipitation et sol, indépendamment de ce module — tombe presque toujours sur un jour à RRPCF nul ou très faible. Résultat : activer ou désactiver ce module change quasiment rien au score final, d'où le choix de le désactiver en production (moins de calcul, aucune perte mesurée).

**Termes liés** : [Logique floue (Fuzzy)](#logique-floue-fuzzy), [Période critique](#periode-critique), [Minimum de Liebig](#minimum-de-liebig).

---

## Saison favorable

**Définition simple** : la période de l'année, en nombre de jours, où le climat d'un pixel (température, précipitations) reste dans la plage tolérée par une culture donnée — donc où cultiver reste climatiquement viable. En dehors de cette fenêtre, la culture ne peut pas raisonnablement pousser.

**Contexte / exemple concret** : CropSuite compare la longueur de cette saison favorable au [cycle de culture](#cycle-de-culture) pour calculer le potentiel de cultures multiples d'un pixel : si la saison dure au moins deux fois la durée d'un cycle, deux récoltes de la même culture deviennent théoriquement possibles sur la même parcelle dans l'année.

**Termes liés** : [Cycle de culture](#cycle-de-culture), [RRPCF (Recurrence Rate of Potential Crop Failure)](#rrpcf-recurrence-rate-of-potential-crop-failure).

---

## SIG (*Système d'Information Géographique*)

**Définition simple** : un outil qui stocke, affiche et permet d'interroger des données localisées sur une carte (plusieurs couches superposées — sol, relief, parcelles...). Un SIG se limite à la visualisation : il montre l'information, il ne produit aucune recommandation.

**Contexte / exemple concret** : le PFE va au-delà d'un simple SIG — il transforme les couches climat/sol/relief en recommandation directement exploitable par l'agriculteur ("ici, plante du mil"), plutôt que de se contenter de les afficher.

**Termes liés** : [Minimum de Liebig](#minimum-de-liebig).
