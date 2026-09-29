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

État : **conçu, pas construit** (mis à jour le 29 septembre 2026). Toutes les questions sont tranchées ; seule la signature de code Windows reste hors sujet.

Les valeurs propres à Boutik sont dans `docs/licence.md` :

- **Essai :** un mois, qui commence à la création de la boutique.
- **Rappels :** à 14 jours, 7 jours, puis chaque jour ; 7 jours de grâce.
- **Transferts :** 2 automatiques par an.
- **Code tapé :** en blocs de 5 caractères.
- **Déblocage :** code valable 24 h.
- **Formules :** au lancement, Solo seule (60 000 FCFA par an ou 18 000 par trimestre). Duo et Boutique arriveront avec la synchronisation.
- **Parrainage :** 1 mois pour le filleul, 2 mois pour le parrain.
- **Canal de secours :** WhatsApp.

Ordre de construction prévu :

1. l'export des données ;
2. la licence côté Boutik, avec des clés de test ;
3. le backoffice minimal et l'activation en ligne ;
4. les mises à jour signées ;
5. les fonctionnalités à la carte et les découvertes.

Ce qui existe déjà et servira :

- le journal d'événements, pour la date de création de la boutique ;
- la récupération d'un fichier sur le téléphone par câble (`src/main/sauvegarde/telephone.ts`) ;
- les points d'entrée protégés, pour la lecture seule.

## Termes liés

[Licence logicielle](/business/#licence-logicielle-software-license) · [Période d'essai](/business/#periode-d-essai-trial-period) · [Formules de licence](/business/#formules-de-licence-license-tiers) · [Poste facturable](/business/#poste-facturable-billable-seat) · [Révocation de licence](/business/#revocation-de-licence-license-revocation) · [Ne jamais faire confiance à l'utilisateur](/backend/#ne-jamais-faire-confiance-a-l-utilisateur-never-trust-the-user) · [Empreinte matérielle](/backend/#empreinte-materielle-hardware-fingerprint) · [Calendrier monotone](/backend/#calendrier-monotone-monotonic-clock) · [Caractère de contrôle](/backend/#caractere-de-controle-check-character) · [Lecture seule](/backend/#lecture-seule-read-only-mode) · [Référence de paiement](/business/#reference-de-paiement-payment-reference) · [Signature cryptographique](/backend/#signature-cryptographique-digital-signature) · [Clé de réserve](/backend/#cle-de-reserve-backup-key-rotation-de-cle) · [Hors ligne d'abord](/backend/#hors-ligne-d-abord-offline-first)
