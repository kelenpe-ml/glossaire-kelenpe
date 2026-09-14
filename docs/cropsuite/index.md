# CropSuite (PFE)

Vocabulaire technique de mon système d'aide à la décision agricole pour le Mali (PFE, Master MSI) : cartographie de l'aptitude des cultures (mil, sorgho, arachide) sur Koulikoro et Sikasso, moteur biophysique **CropSuite**, validation contre des données de terrain (EAC, NDVI), exposition via API FastAPI et application mobile Flutter.

[[toc]]

## EAC (*Enquête Agricole de Conjoncture*)

**Définition simple** : enquêtes de terrain géolocalisées menées au Mali par l'INSTAT, qui recensent notamment les cultures pratiquées et les rendements déclarés par région. Dans le PFE, l'EAC sert uniquement à vérifier après coup si les cartes produites par CropSuite reflètent la réalité — elle n'entre jamais dans le calcul du moteur.

**Contexte / exemple concret** : deux campagnes mobilisées pour la validation, l'extrait 2017 (rendement) et 2022–2024 (présence de culture), toutes deux sur Koulikoro et Sikasso. Bamako est absent des deux campagnes — confirmé par l'INSTAT, l'agriculture y étant peu pratiquée — d'où son exclusion du périmètre du PFE.

**Termes liés** : [NDVI](#ndvi), [Minimum de Liebig](#minimum-de-liebig).

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

## pH

**Définition simple** : échelle de 0 à 14 qui mesure si un sol est acide ou basique (alcalin) — 0 très acide, 7 neutre, 14 très basique. Chaque plante a une plage de pH optimale dans laquelle elle absorbe bien les nutriments du sol ; en dehors de cette plage, même un sol par ailleurs riche devient moins exploitable.

**Contexte / exemple concret** : le pH fait partie des variables pédologiques notées par la logique floue de CropSuite — plus le pH d'une zone s'éloigne de la plage idéale d'une culture, plus son score d'aptitude sol baisse progressivement.

**Termes liés** : [Logique floue (Fuzzy)](#logique-floue-fuzzy).

---

## SIG (*Système d'Information Géographique*)

**Définition simple** : un outil qui stocke, affiche et permet d'interroger des données localisées sur une carte (plusieurs couches superposées — sol, relief, parcelles...). Un SIG se limite à la visualisation : il montre l'information, il ne produit aucune recommandation.

**Contexte / exemple concret** : le PFE va au-delà d'un simple SIG — il transforme les couches climat/sol/relief en recommandation directement exploitable par l'agriculteur ("ici, plante du mil"), plutôt que de se contenter de les afficher.

**Termes liés** : [Minimum de Liebig](#minimum-de-liebig).
