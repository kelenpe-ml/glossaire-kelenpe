# Licence logicielle hors ligne

## Objectif

Vendre un droit d'usage (essai, abonnement, nombre de postes) et le faire respecter **sans que l'ordinateur du client ait jamais besoin d'internet**, sans jamais bloquer son travail en cours ni prendre ses données en otage, et **sans jamais compter sur sa bonne foi**.

## La carte

![Cycle de vie : essai, licence active après paiement, rappels sans bloquer, grâce, puis lecture seule où les données restent libres ; renouveler ramène à la licence active. Le poste et l'éditeur échangent par connexion, fichier ou code ; l'éditeur signe une licence vérifiée sans réseau, avec l'empreinte matérielle, les clés embarquées en service et de réserve, et un calendrier monotone qui ne recule jamais](/diagrams/archi-licence-hors-ligne.svg)

## Décisions

- **Ne jamais faire confiance à l'utilisateur.**
  - Aucune protection ne repose sur sa bonne foi : ni une date qu'il peut changer, ni un fichier qu'il peut effacer, ni un message envoyé depuis n'importe quel téléphone.
  - L'interface ne dit jamais comment on se protège : elle décrit la situation, pas le mécanisme.

  C'est le principe qui départage toutes les autres décisions.
- **Licence = fichier signé, vérifié sur le poste.**
  - L'éditeur signe (client, poste, formule, date de fin, fonctionnalités) ; l'application vérifie avec la clé publique qu'elle embarque.
  - La signature couvre aussi ce que le poste connaît déjà (identifiant du client, empreinte), sans que ces valeurs soient transmises : le code en est plus court, et la licence ne sert que sur ce poste.
- **Trois voies d'activation, de la plus simple à la plus pénible :**
  1. partage de connexion du téléphone, en Wi-Fi ou [par câble USB](/devops/#partage-de-connexion-par-usb-usb-tethering) ;
  2. fichier de licence envoyé au téléphone, puis récupéré par câble ;
  3. en dernier recours, code tapé en blocs courts vérifiés un par un, grâce à des [caractères de contrôle](/backend/#caractere-de-controle-check-character).
- **Codes signés, un seul mécanisme :** activation, ajout de poste, transfert, déblocage du compte principal, nouvel essai, correction d'horloge.
- **Identité du poste par une [empreinte matérielle](/backend/#empreinte-materielle-hardware-fingerprint) tolérante :**
  - l'ordinateur reste reconnu si la majorité de ses pièces sont les mêmes ;
  - seul un changement d'ordinateur compte comme transfert ;
  - seul un résumé brouillé de l'empreinte quitte le poste.
- **Essai sans inscription, sans paiement, sans internet :**
  - la protection principale est que l'essai commence à la **création des données**, inscrite dans le journal : un nouvel essai impose de repartir de données vides ;
  - une trace discrète (jamais rien qui ressemble à un logiciel malveillant) et un [code signé de nouvel essai](/business/#code-signe-de-nouvel-essai-signed-trial-reset-code) complètent le dispositif ;
  - hors ligne, la durée est celle de la version ; le serveur peut la prolonger, jamais la raccourcir.
- **[Calendrier monotone](/backend/#calendrier-monotone-monotonic-clock) :**
  - l'application compte le temps sur son propre calendrier, qui ne recule jamais ;
  - une horloge fausse ne bloque jamais le travail : un message simple suffit.
- **Fin de licence en douceur :** rappels jamais bloquants, grâce, puis [lecture seule](/backend/#lecture-seule-read-only-mode).
  - Ce qui est bloqué, c'est le travail nouveau.
  - Tout ce qui protège le client reste possible : consulter, exporter tout, corriger un compte existant, réimprimer, sécurité, sauvegarde.
  - L'export des données doit exister **avant** que la licence puisse bloquer quoi que ce soit.
- **Achat définitif en option,** à côté de l'abonnement mis en avant : licence qui n'expire jamais pour la version achetée, un an de mises à jour compris, puis un [forfait de mises à jour](/business/#forfait-de-mises-a-jour-maintenance-plan) facultatif ; sans forfait, version figée avec les corrections de sécurité pendant une durée annoncée. Dans le format : un type et une date « mises à jour jusqu'au », par une nouvelle [version du format](/backend/#version-d-un-format-format-version).
- **Sans internet, demande et réponse :** un [code de demande](/backend/#code-de-demande-request-code) (identifiant des données, empreinte, type, [nonce](/backend/#nonce-number-used-once)) part vers l'éditeur ; la réponse signée revient par fichier (téléphone par câble, ordinateur) ou code tapé en blocs ; les codes spéciaux sont des [codes à usage unique](/backend/#code-a-usage-unique-single-use-code), liés à une demande gardée hors des sauvegardes.
- **Transferts par le serveur**, dans une limite annuelle. Un ancien poste hors ligne continue jusqu'à la fin de sa période payée.
- **Déblocage du compte principal par l'éditeur :**
  - après rappel du numéro enregistré à l'achat ;
  - code court dans le temps, à usage unique, pour ce poste seulement ;
  - inscrit au journal ;
  - sans aucun accès aux données.
- **Offre :**
  - trimestre plus cher que l'année ;
  - montée de formule au [prorata](/business/#prorata) ;
  - descente au renouvellement ;
  - [parrainage bilatéral](/business/#parrainage-bilateral-two-sided-referral), par une référence de paiement calculée sur le poste, avec caractère de contrôle.
- **Transparence honnête, sans mode d'emploi :**
  - la politique de confidentialité dit quelles informations techniques sont échangées, pas à quoi elles servent contre la fraude ;
  - aucune donnée métier ne part.
- **Clés :** clé de licence et clé des mises à jour, chacune avec sa clé de réserve (voir [Backoffice et gestion des clés de signature](./backoffice-cles)).

## Pièges connus

- **Bloquer avant d'avoir construit l'export :** la lecture seule devient une prise d'otage.
- **Horloge :**
  - reculée volontairement, elle est neutralisée par le calendrier monotone ;
  - avancée par erreur puis corrigée, elle se répare par une resynchronisation en ligne ou un code signé de correction.
- **Empreinte trop stricte** (un disque changé coûte un transfert), ou trop lâche (deux ordinateurs passent pour un seul).
- **Code trop long à recopier :** c'est la raison des trois voies et des blocs vérifiés un par un.
- **Message qui explique la protection :** « vous avez reculé l'horloge » apprend à contourner.
- **Révocation hors ligne impossible :** un poste retiré continue jusqu'à la fin de sa période. C'est une limite à accepter.
- **Émetteur et vérificateur qui divergent :** partager le code, et tester qu'une licence signée par l'un est acceptée par l'autre.
- **Protection d'appoint agressive** (registre, services) : les antivirus la signalent, et l'application perd la confiance des clients.

## Exemple : Boutik

État : **cœur et parcours d'achat sans internet construits** (mis à jour le 30 septembre 2026), avec des clés de **test** seulement ; activation en ligne et serveur pas encore construits. Détail : `docs/licence.md`, sections « Ce qui est construit » et « Parcours d'achat et d'activation sans internet ».

- **Format :** licence en encodage canonique, signée Ed25519 : version 1 (61 octets) et version 2 (66 octets, type abonnement ou achat définitif, « mises à jour jusqu'au ») ; les licences version 1 restent valables (`src/shared/licence/format.ts`, partagé avec le futur backoffice ; `src/main/licence/signature.ts`).
- **Achat sans internet :** écran « Acheter ou renouveler » (Solo à l'année, au trimestre, achat définitif en option ; prix et numéros dans un [fichier de configuration](/devops/#fichier-de-configuration-configuration-file)) ; référence `BTK-` à caractère de contrôle ; code de demande de 21 blocs, qui porte pour un achat l'offre et le montant choisis ([demande non fiable](/backend/#demande-non-fiable-untrusted-claim) : le backoffice accordera ce qui a été reçu, après [réconciliation du paiement](/business/#reconciliation-d-un-paiement-payment-reconciliation)) ; réponse par le téléphone branché (documents WhatsApp), un fichier ou un code tapé (28 blocs pour une licence, dont 26 de signature, sans les dates, déduites de la demande ; 31 pour un code spécial ; bloc faux désigné, somme pondérée modulo 31 plutôt que l'[algorithme de Luhn](/backend/#algorithme-de-luhn-luhn-algorithm)).
- **Codes spéciaux :** nouvel essai, correction d'horloge (le calendrier repart de l'heure d'émission), déblocage du mot de passe du patron depuis la connexion (24 h, une fois, cet ordinateur ; signalé à la connexion suivante). Demandes en attente dans une table hors journal jamais copiée.
- **Clés :** T1 et T2 (test) importées seulement en développement ; aucune clé de production n'existe encore, donc l'exécutable n'accepte aucune licence et seul l'essai y fonctionne. Un test sur l'exécutable le vérifie, ainsi que l'absence des clés de test dans le paquet.
- **Calendrier monotone :** table `licence_calendrier` de la base chiffrée (hors journal), avancée chaque minute, jamais en retard sur le dernier événement.
- **Empreinte :** carte mère, processeur, disque (PowerShell et CIM sous Windows ; `machine-id`, `/proc/cpuinfo`, `lsblk` sous Linux), 2 pièces sur 3 suffisent.
- **États :** essai de 30 jours depuis la création de la boutique, licence active, 7 jours de grâce, lecture seule ; périodes enchaînées sans perte.
- **Lecture seule :** appliquée dans `gerer` (`ipc-protege.ts`), avec une catégorie par canal (`src/main/licence/categories.ts`) et un blocage par défaut vérifié par un test ; restent permis, outre l'export, les remboursements, la réimpression et la sécurité, les réglages du poste (imprimante, suggestions de saisie) et les informations de la boutique, qui n'ont aucun usage commercial.
- **Interface :** Réglages › Licence (import d'un fichier), bandeau « Renouveler », caisse remplacée par une explication en lecture seule.
- **Reste à faire :**
  1. rappels à 14 et 7 jours ;
  2. trace cachée ;
  3. backoffice et activation en ligne ;
  4. mises à jour signées.

## Termes liés

[Licence logicielle](/business/#licence-logicielle-software-license) · [Période d'essai](/business/#periode-d-essai-trial-period) · [Formules de licence](/business/#formules-de-licence-license-tiers) · [Poste facturable](/business/#poste-facturable-billable-seat) · [Révocation de licence](/business/#revocation-de-licence-license-revocation) · [Ne jamais faire confiance à l'utilisateur](/backend/#ne-jamais-faire-confiance-a-l-utilisateur-never-trust-the-user) · [Empreinte matérielle](/backend/#empreinte-materielle-hardware-fingerprint) · [Calendrier monotone](/backend/#calendrier-monotone-monotonic-clock) · [Caractère de contrôle](/backend/#caractere-de-controle-check-character) · [Lecture seule](/backend/#lecture-seule-read-only-mode) · [Référence de paiement](/business/#reference-de-paiement-payment-reference) · [Signature cryptographique](/backend/#signature-cryptographique-digital-signature) · [Clé de réserve](/backend/#cle-de-reserve-backup-key-rotation-de-cle) · [Hors ligne d'abord](/backend/#hors-ligne-d-abord-offline-first) · [Encodage canonique](/backend/#encodage-canonique-canonical-encoding) · [Blocage par défaut](/backend/#blocage-par-defaut-deny-by-default) · [Période de grâce](/business/#periode-de-grace-grace-period) · [Achat définitif ou licence perpétuelle](/business/#achat-definitif-ou-licence-perpetuelle-perpetual-license) · [Forfait de mises à jour](/business/#forfait-de-mises-a-jour-maintenance-plan) · [Code de demande](/backend/#code-de-demande-request-code) · [Code à usage unique](/backend/#code-a-usage-unique-single-use-code) · [Nonce](/backend/#nonce-number-used-once) · [Version d'un format](/backend/#version-d-un-format-format-version)
